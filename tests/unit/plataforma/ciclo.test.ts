// T-111 (b) (001): `npm run conector:ciclo` (diseño, paso 11; C-3). PRUEBA-004 (parte: el ciclo completo con
// los manejadores reales sobre PGlite; salida sin tokens ni código) y PRUEBA-019 (parte: nada secreto en la
// salida, tokens solo en memoria). Sin red real: la función de red despacha a los manejadores en proceso.
import { randomBytes } from "node:crypto";
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { crearRegistro } from "../../../src/lib/oauth/clientes";
import {
  atenderMetadatosRecurso,
  atenderMetadatosServidor,
} from "../../../src/lib/oauth/metadatos";
import { cargarConfiguracionConector } from "../../../src/lib/plataforma/configuracion";
import { crearAlmacen } from "../../../src/lib/supabase/almacen";
import { crearAutorizacion } from "../../../src/lib/supabase/autorizacion";
import { crearPuntoMcp } from "../../../src/mcp/entrada";
import { obtenerPromptFicticio } from "../../../src/mcp/prompt-ficticio";
import { crearAlmacenPglite } from "../../conector/apoyo/index";
import { capturarConsola, entornoConector, URL_PUBLICA } from "../conector/apoyo-oauth";
import { cerrarCiclos, montarCiclo, sembrarCodigo } from "../conector/apoyo-oauth-ciclo";
import { ESQUEMA, ROL_GESTION, ROL_MCP, sembrar, una } from "../conector/bd/comun";

vi.setConfig({ testTimeout: 60_000, hookTimeout: 60_000 });
const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const SCRIPT = join(RAIZ, "scripts", "conector", "ciclo-local.mjs");

interface Opciones {
  argv: string[];
  lector: { pedir: (etiqueta: string, o?: { oculto?: boolean }) => Promise<string> };
  fetch: typeof fetch;
  salida: (t: string) => void;
  errores: (t: string) => void;
  permitirLocal?: boolean;
  entorno?: Record<string, string | undefined>;
}
interface Modulo {
  ejecutarCiclo(o: Opciones): Promise<number>;
}
const cargar = async () => (await import(/* @vite-ignore */ pathToFileURL(SCRIPT).href)) as Modulo;

beforeEach(() => {
  entornoConector();
  capturarConsola();
});
afterEach(async () => {
  await cerrarCiclos();
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});
afterAll(cerrarCiclos);

/** Servidor en proceso: los manejadores reales con una sola base. Anota lo que sale por /oauth/token. */
interface Alteracion {
  ruta: string;
  cuerpo: string;
  respuesta: Response;
  valores: string[];
}
type Alterar = (a: Alteracion) => Response | Promise<Response>;
async function servidor(alterar?: Alterar) {
  const ciclo = await montarCiclo({ local: true });
  const gestion = await crearAlmacenPglite(ciclo.bd, ROL_GESTION);
  const mcp = await crearAlmacenPglite(ciclo.bd, ROL_MCP);
  const tareas: (() => Promise<void>)[] = [];
  const registro = crearRegistro({
    configuracion: cargarConfiguracionConector,
    autorizacion: () => crearAutorizacion(gestion),
    local: () => true,
  });
  const punto = crearPuntoMcp({
    configuracion: cargarConfiguracionConector,
    almacen: () => crearAlmacen(mcp),
    prompt: obtenerPromptFicticio,
    despues: (t) => void tareas.push(t),
  });
  const valoresSecretos: string[] = [];
  const llamadas: string[] = [];
  const red = (async (entrada: string, init?: RequestInit) => {
    const peticion = new Request(entrada, init);
    const ruta = new URL(peticion.url).pathname;
    const cuerpoPeticion = await peticion.clone().text();
    llamadas.push(`${peticion.method} ${ruta}`);
    let r: Response;
    if (ruta.startsWith("/.well-known/oauth-protected-resource"))
      r = atenderMetadatosRecurso(peticion);
    else if (ruta === "/.well-known/oauth-authorization-server") {
      r = atenderMetadatosServidor(peticion, { cimd: false });
    } else if (ruta === "/oauth/registro") r = await registro(peticion);
    else if (ruta === "/oauth/autorizar") {
      r = peticion.method === "GET" ? await ciclo.get(peticion.url) : await ciclo.post(peticion);
    } else if (ruta === "/oauth/token") {
      r = await ciclo.token(peticion);
      const copia = await r.clone().text();
      try {
        const j = JSON.parse(copia) as Record<string, unknown>;
        for (const k of ["access_token", "refresh_token"]) {
          if (typeof j[k] === "string") valoresSecretos.push(j[k] as string);
        }
      } catch {
        // no es JSON: nada que anotar
      }
    } else if (ruta === "/api/mcp") r = await punto(peticion);
    else r = new Response(null, { status: 404 });
    if (alterar) {
      r = await alterar({ ruta, cuerpo: cuerpoPeticion, respuesta: r, valores: valoresSecretos });
    }
    while (tareas.length > 0) await tareas.shift()?.();
    return r;
  }) as typeof fetch;
  return { ciclo, red, valoresSecretos, llamadas };
}

async function correr(
  s: Awaited<ReturnType<typeof servidor>>,
  entradas: string[],
  argv = ["preproduccion"],
  alEsperar?: () => Promise<void>,
  extra: { confirmacion?: string; entorno?: Record<string, string | undefined> } = {},
) {
  const { ejecutarCiclo } = await cargar();
  const salidas: string[] = [];
  const pedidos: { etiqueta: string; oculto: boolean }[] = [];
  const cola = [...entradas];
  const codigo = await ejecutarCiclo({
    argv,
    lector: {
      pedir: async (etiqueta, o) => {
        pedidos.push({ etiqueta, oculto: o?.oculto !== false });
        if (/escribe SI/.test(etiqueta)) return extra.confirmacion ?? "SI";
        if (/revoca/i.test(etiqueta)) {
          await alEsperar?.();
          return "";
        }
        const v = cola.shift();
        if (v === undefined) throw new Error("sin_entrada");
        return v;
      },
    },
    fetch: s.red,
    salida: (t) => salidas.push(t),
    errores: (t) => salidas.push(t),
    permitirLocal: true,
    entorno: extra.entorno ?? {},
  });
  return { codigo, texto: salidas.join("\n"), pedidos };
}

const sinMcp = (s: Awaited<ReturnType<typeof servidor>>) =>
  s.llamadas.filter((l) => l === "POST /api/mcp").length;

describe("PRUEBA-004 (parte): el ciclo completo, sin imprimir nada secreto", () => {
  it("descubre, registra, activa, canjea, usa las herramientas y renueva; la salida no lleva tokens, código ni dirección", async () => {
    const s = await servidor();
    const codigoActivacion = await sembrarCodigo(s.ciclo.bd, "A");
    const { codigo, texto, pedidos } = await correr(s, [URL_PUBLICA, codigoActivacion]);
    expect(codigo).toBe(0);
    // Pasos recorridos, en orden.
    const ruta = s.llamadas.filter((l) => !l.startsWith("GET /.well-known"));
    expect(ruta.map((l) => l.replace(/ .*/, "") + " " + l.replace(/^[A-Z]+ /, ""))).toEqual([
      "POST /oauth/registro",
      "GET /oauth/autorizar",
      "POST /oauth/autorizar",
      "POST /oauth/token",
      "POST /oauth/token",
      "POST /api/mcp",
      "POST /api/mcp",
    ]);
    // Dos pares: el canje y la renovación.
    expect(s.valoresSecretos).toHaveLength(4);
    for (const v of s.valoresSecretos) expect(texto).not.toContain(v);
    expect(texto).not.toMatch(/hia_[ar]_/);
    expect(texto).not.toContain(codigoActivacion);
    expect(texto).not.toContain(codigoActivacion.replace(/-/g, ""));
    expect(texto).not.toContain("localhost");
    expect(texto).not.toMatch(/dcr_[A-Za-z0-9_-]{22}/);
    expect(texto).not.toMatch(/code_verifier|code=|state=/);
    // La persona escribe la dirección y el código sin eco, confirma el destino con SI y pulsa Intro en la espera (a la vista).
    expect(pedidos).toHaveLength(4);
    expect(pedidos.slice(0, 2).every((p) => p.oculto)).toBe(true);
    expect(pedidos[2]!.oculto).toBe(false);
    expect(pedidos[2]!.etiqueta).toMatch(/escribe SI/);
    expect(pedidos[3]!.oculto).toBe(false);
    expect(pedidos[3]!.etiqueta).toMatch(/revoca ahora la conexi.n de claude/i);
    // La pausa dice qué conexión es cuál y el plazo del acceso.
    expect(pedidos[3]!.etiqueta).toMatch(/chatgpt/i);
    expect(pedidos[3]!.etiqueta).toMatch(/300 s/);
    expect(texto).not.toContain(new URL(URL_PUBLICA).host);
    // Informa de cada paso en español y de las tres herramientas.
    expect(texto).toMatch(/herramientas.*3/i);
    expect(texto).toMatch(/renovaci/i);
    // Queda una conexión de A (la segunda conexión del paso 11 se revoca después con `operar`).
    const { n } = await una<{ n: number }>(
      s.ciclo.bd,
      `select count(*)::int as n from ${ESQUEMA}.conexiones where revocada_en is null`,
    );
    expect(n).toBe(1);
  });

  it("un código de activación equivocado: falla sin tokens y sin repetir lo escrito", async () => {
    const s = await servidor();
    const malo = ["ZZZZ", "ZZZZ", "ZZZZ"].join("-");
    const { codigo, texto } = await correr(s, [URL_PUBLICA, malo]);
    expect(codigo).not.toBe(0);
    expect(s.valoresSecretos).toHaveLength(0);
    expect(texto).not.toContain(malo);
    expect(texto).not.toMatch(/hia_[ar]_/);
  });

  it("el resultado de las herramientas no se imprime (solo cuántas y si respondió)", async () => {
    const s = await servidor();
    const c = await sembrarCodigo(s.ciclo.bd, "A");
    const { texto } = await correr(s, [URL_PUBLICA, c]);
    expect(texto).not.toMatch(/instrucciones|ejecucion_id|structuredContent/i);
  });
});

describe("CA-008 (parte): la otra conexión sigue funcionando cuando se revoca la de Claude", () => {
  it("espera a la persona tras el canje y, con la conexión de Claude revocada durante la espera, la propia lista, llama y renueva", async () => {
    const s = await servidor();
    const claude = await sembrar(s.ciclo.bd, "A", "claude");
    const codigoActivacion = await sembrarCodigo(s.ciclo.bd, "A");
    let mcpAntes = -1;
    let canjesAntes = -1;
    const { codigo, pedidos, texto } = await correr(
      s,
      [URL_PUBLICA, codigoActivacion],
      ["preproduccion"],
      async () => {
        mcpAntes = sinMcp(s);
        canjesAntes = s.valoresSecretos.length;
        await s.ciclo.bd.db.query(
          `update ${ESQUEMA}.conexiones set revocada_en = now(), motivo_revocacion = 'operador' where id = $1`,
          [claude.conexionId],
        );
      },
    );
    // La espera llega después del canje (un par) y antes de usar las herramientas.
    expect(canjesAntes).toBe(2);
    expect(mcpAntes).toBe(0);
    expect(pedidos.map((p) => p.oculto)).toEqual([true, true, false, false]);
    expect(codigo).toBe(0);
    expect(sinMcp(s)).toBe(2);
    expect(s.valoresSecretos).toHaveLength(4);
    expect(texto).not.toMatch(/hia_[ar]_/);
    // Claude queda revocada; la del ciclo, activa.
    const vivas = (
      await s.ciclo.bd.db.query<{ id: string }>(
        `select id::text from ${ESQUEMA}.conexiones where revocada_en is null`,
      )
    ).rows;
    expect(vivas).toHaveLength(1);
    expect(vivas[0]!.id).not.toBe(claude.conexionId);
  });

  it("si no se puede leer la espera, el ciclo se interrumpe sin usar las herramientas", async () => {
    const s = await servidor();
    const c = await sembrarCodigo(s.ciclo.bd, "A");
    const { ejecutarCiclo } = await cargar();
    const cola = [URL_PUBLICA, c];
    const salidas: string[] = [];
    const codigo = await ejecutarCiclo({
      argv: ["preproduccion"],
      lector: {
        pedir: async (etiqueta: string) => {
          if (/escribe SI/.test(etiqueta)) return "SI";
          const v = cola.shift();
          if (v === undefined) throw new Error("sin_entrada");
          return v;
        },
      },
      fetch: s.red,
      salida: (t) => salidas.push(t),
      errores: (t) => salidas.push(t),
      permitirLocal: true,
    });
    expect(codigo).not.toBe(0);
    expect(sinMcp(s)).toBe(0);
  });
});

describe("respuestas que no coinciden con la solicitud o la renovación: se rechazan", () => {
  it("un state distinto en el enlace de la pantalla: rechazo, sin canjear", async () => {
    const s = await servidor(async ({ ruta, cuerpo, respuesta }) =>
      ruta === "/oauth/autorizar" && cuerpo.includes("solicitud=")
        ? new Response((await respuesta.text()).replace("&amp;state=", "&amp;state=x"), {
            status: respuesta.status,
            headers: respuesta.headers,
          })
        : respuesta,
    );
    const c = await sembrarCodigo(s.ciclo.bd, "A");
    const r = await correr(s, [URL_PUBLICA, c, ""]);
    expect(r.codigo).not.toBe(0);
    expect(r.texto).toMatch(/state o iss/);
    expect(s.llamadas).not.toContain("POST /oauth/token");
  });

  it("un iss distinto en el enlace de la pantalla: rechazo, sin canjear", async () => {
    const s = await servidor(async ({ ruta, cuerpo, respuesta }) =>
      ruta === "/oauth/autorizar" && cuerpo.includes("solicitud=")
        ? new Response((await respuesta.text()).replace("&amp;iss=", "&amp;iss=x"), {
            status: respuesta.status,
            headers: respuesta.headers,
          })
        : respuesta,
    );
    const c = await sembrarCodigo(s.ciclo.bd, "A");
    const r = await correr(s, [URL_PUBLICA, c, ""]);
    expect(r.codigo).not.toBe(0);
    expect(r.texto).toMatch(/state o iss/);
    expect(s.llamadas).not.toContain("POST /oauth/token");
  });

  it("una renovación que devuelve el mismo par (no rota): rechazo", async () => {
    const s = await servidor(({ ruta, cuerpo, respuesta, valores }) =>
      ruta === "/oauth/token" && cuerpo.includes("grant_type=refresh_token")
        ? new Response(
            JSON.stringify({
              access_token: valores[0],
              refresh_token: valores[1],
              token_type: "Bearer",
              expires_in: 300,
            }),
            { status: 200, headers: respuesta.headers },
          )
        : respuesta,
    );
    const c = await sembrarCodigo(s.ciclo.bd, "A");
    const r = await correr(s, [URL_PUBLICA, c, ""]);
    expect(r.codigo).not.toBe(0);
    expect(r.texto).toMatch(/no rotó/);
  });
});

describe("la entrada tiene que ser una terminal (cierre en fallo)", () => {
  it("un lector que no es terminal: rechazo con texto fijo, sin pedir nada ni llamar a la red", async () => {
    const s = await servidor();
    const { ejecutarCiclo } = await cargar();
    const pedido = vi.fn(async () => "x");
    const salidas: string[] = [];
    const codigo = await ejecutarCiclo({
      argv: ["preproduccion"],
      lector: { pedir: pedido, esTerminal: false } as unknown as Opciones["lector"],
      fetch: s.red,
      salida: (t) => salidas.push(t),
      errores: (t) => salidas.push(t),
      permitirLocal: true,
    });
    expect(codigo).not.toBe(0);
    expect(pedido).not.toHaveBeenCalled();
    expect(s.llamadas).toHaveLength(0);
    expect(salidas.join("\n")).toMatch(/PowerShell|Windows Terminal/);
  });
});

describe("PRUEBA-020 (parte): solo preproduccion, antes de pedir nada", () => {
  it.each([["produccion"], ["desarrollo"], [""], ["Preproduccion"], []])(
    "argumentos %j: rechazo sin pedir nada ni llamar a la red",
    async (...argv) => {
      const s = await servidor();
      const { codigo, pedidos } = await correr(s, [URL_PUBLICA, "x"], argv.flat());
      expect(codigo).not.toBe(0);
      expect(pedidos).toHaveLength(0);
      expect(s.llamadas).toHaveLength(0);
    },
  );

  it("sobran argumentos (por ejemplo un secreto): rechazo sin repetirlo", async () => {
    const s = await servidor();
    const secreto = "hia_op_" + randomBytes(32).toString("base64url");
    const { codigo, texto, pedidos } = await correr(
      s,
      [URL_PUBLICA, "x"],
      ["preproduccion", secreto],
    );
    expect(codigo).not.toBe(0);
    expect(pedidos).toHaveLength(0);
    expect(texto).not.toContain(secreto);
  });

  it("sin permitirLocal (la orden real), una dirección que no es https se rechaza antes de llamar", async () => {
    const s = await servidor();
    const { ejecutarCiclo } = await cargar();
    const cola = [URL_PUBLICA, "x"];
    const codigo = await ejecutarCiclo({
      argv: ["preproduccion"],
      lector: { pedir: async () => cola.shift()! },
      fetch: s.red,
      salida: () => undefined,
      errores: () => undefined,
    });
    expect(codigo).not.toBe(0);
    expect(s.llamadas).toHaveLength(0);
  });
});

describe("dictamen del auditor (T-111): el código no va a un host mal tecleado ni a una conexión sin comprobar", () => {
  it("MAYOR-1: si el emisor de los metadatos no es el origen tecleado, no se envía el código ni se registra nada", async () => {
    const s = await servidor(async ({ ruta, respuesta }) =>
      ruta === "/.well-known/oauth-authorization-server"
        ? new Response(
            JSON.stringify({
              ...((await respuesta.json()) as object),
              issuer: "https://pre-nido.otro-dominio.com",
            }),
            { status: 200, headers: respuesta.headers },
          )
        : respuesta,
    );
    const c = await sembrarCodigo(s.ciclo.bd, "A");
    const r = await correr(s, [URL_PUBLICA, c]);
    expect(r.codigo).not.toBe(0);
    expect(s.llamadas.filter((l) => !l.startsWith("GET /.well-known"))).toEqual([]);
    expect(r.texto).not.toContain(c);
    expect(r.texto).not.toContain("otro-dominio");
  });

  it.each(["", "no", "NO", "s"])(
    "MAYOR-1: sin escribir SI (%j) en la confirmación del destino no se envía nada más que la identificación",
    async (confirmacion) => {
      const s = await servidor();
      const c = await sembrarCodigo(s.ciclo.bd, "A");
      const r = await correr(s, [URL_PUBLICA, c], ["preproduccion"], undefined, { confirmacion });
      expect(r.codigo).not.toBe(0);
      expect(s.llamadas.filter((l) => !l.startsWith("GET /.well-known"))).toEqual([]);
    },
  );

  it("MAYOR-1: la dirección solo va en la etiqueta de la terminal; la identificación no lleva código", async () => {
    const s = await servidor();
    const c = await sembrarCodigo(s.ciclo.bd, "A");
    const r = await correr(s, [URL_PUBLICA, c]);
    expect(r.pedidos[2]!.etiqueta).toContain(new URL(URL_PUBLICA).host);
    expect(r.texto).not.toContain(new URL(URL_PUBLICA).host);
  });

  it("MENOR-1: con NODE_TLS_REJECT_UNAUTHORIZED=0 se rechaza antes de pedir nada", async () => {
    const s = await servidor();
    const c = await sembrarCodigo(s.ciclo.bd, "A");
    const r = await correr(s, [URL_PUBLICA, c], ["preproduccion"], undefined, {
      entorno: { NODE_TLS_REJECT_UNAUTHORIZED: "0" },
    });
    expect(r.codigo).not.toBe(0);
    expect(r.pedidos).toHaveLength(0);
    expect(s.llamadas).toHaveLength(0);
    expect(r.texto).toMatch(/NODE_TLS_REJECT_UNAUTHORIZED=0/);
  });

  it("MENOR-5: una credencial de operación tecleada como código no genera ninguna petición", async () => {
    const s = await servidor();
    const credencial = "hia_op_" + randomBytes(32).toString("base64url");
    const r = await correr(s, [URL_PUBLICA, credencial]);
    expect(r.codigo).not.toBe(0);
    expect(s.llamadas).toHaveLength(0);
    expect(r.pedidos).toHaveLength(2);
    expect(r.texto).not.toContain(credencial);
  });

  it("MENOR-6: la renovación va justo después de la pausa y las herramientas usan el acceso renovado", async () => {
    const s = await servidor();
    const c = await sembrarCodigo(s.ciclo.bd, "A");
    let tokensEnLaPausa = -1;
    const r = await correr(s, [URL_PUBLICA, c], ["preproduccion"], async () => {
      tokensEnLaPausa = s.llamadas.filter((l) => l === "POST /oauth/token").length;
    });
    expect(r.codigo).toBe(0);
    expect(tokensEnLaPausa).toBe(1);
    const orden = s.llamadas.filter((l) => l === "POST /oauth/token" || l === "POST /api/mcp");
    expect(orden).toEqual([
      "POST /oauth/token",
      "POST /oauth/token",
      "POST /api/mcp",
      "POST /api/mcp",
    ]);
  });

  it("MENOR-6: la conexión del ciclo queda registrada con un asistente distinto de claude", async () => {
    const s = await servidor();
    const c = await sembrarCodigo(s.ciclo.bd, "A");
    const r = await correr(s, [URL_PUBLICA, c]);
    expect(r.codigo).toBe(0);
    const filas = (
      await s.ciclo.bd.db.query<{ asistente: string }>(
        `select asistente::text as asistente from ${ESQUEMA}.conexiones where revocada_en is null`,
      )
    ).rows;
    expect(filas).toEqual([{ asistente: "chatgpt" }]);
  });
});

describe("tokens solo en memoria", () => {
  it("el script no escribe en disco, no usa variables de entorno ni guarda nada", () => {
    const fuente = readFileSync(SCRIPT, "utf8");
    expect(fuente).not.toMatch(/writeFile|appendFile|createWriteStream|writeSync|openSync/);
    expect(fuente).not.toMatch(/process\.env|localStorage|console\.log\(/);
    expect(fuente).not.toMatch(/(?<![.\w])exec(Sync)?\(|\bspawn(Sync)?\(/);
  });
});
