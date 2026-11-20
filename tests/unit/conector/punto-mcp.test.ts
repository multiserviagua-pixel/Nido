// T-105 (h) (001): punto MCP, tubería de entrada (diseño §Punto MCP, pasos 1 a 7 y 10). PRUEBA-011
// (tokens no válidos con reloj, a nivel HTTP), PRUEBA-001 (parte: reto 401), PRUEBA-002 (405),
// PRUEBA-017 (parte: lotes y no objeto, sin eco) y PRUEBA-018 (parte: 413 y 503). Hito: las tres
// herramientas responden por el punto con tokens sembrados. Sobre PGlite con el SQL real; la clave de
// los HMAC es la del conector (derivada del secreto de la configuración de la prueba).
import { createHmac, randomBytes, randomUUID } from "node:crypto";
import { describe, expect, it, vi } from "vitest";
import {
  validarConfiguracionConector,
  type ConfiguracionConector,
} from "../../../src/lib/plataforma/configuracion";
import { ErrorDeAplicacion } from "../../../src/lib/plataforma/errores";
import { derivarClaves } from "../../../src/lib/oauth/secretos";
import { crearAlmacen } from "../../../src/lib/supabase/almacen";
import { crearPuntoMcp } from "../../../src/mcp/entrada";
import { obtenerPromptFicticio } from "../../../src/mcp/prompt-ficticio";
import {
  capturarConsola,
  crearAlmacenPglite,
  crearFabrica,
  crearSumidero,
  type BdApoyo,
} from "../../conector/apoyo/index";
import { abrir, cerrarAlFinal, ESQUEMA, estado, ROL_MCP, sembrar, una } from "./bd/comun";

cerrarAlFinal();

const CANARIO = `TEXTO-CANARIO-${randomUUID()}`;
const URL_PUBLICA = "https://pre.ejemplo.invalid";
const RECURSO = `${URL_PUBLICA}/api/mcp`;
const URL_MCP = RECURSO;
type Obj = Record<string, unknown>;

const urlBd = (rol: string): string =>
  ["postgres", "://", `${rol}.ref1`, ":", randomBytes(12).toString("hex"), "@"]
    .concat(["agrupador.ejemplo.invalid", ":6543", "/postgres"])
    .join("");
function configuracion(): ConfiguracionConector {
  const r = validarConfiguracionConector({
    ENTORNO: "preproduccion",
    VERCEL: "1",
    VERCEL_ENV: "preview",
    VERCEL_REGION: "arn1",
    URL_PUBLICA,
    CONECTOR_SECRETO: randomBytes(32).toString("base64url"),
    CONECTOR_BD_URL: urlBd("conector_prueba_mcp"),
    AUTORIZACION_BD_URL: urlBd("conector_prueba_gestion"),
    OPERACION_HUELLA: randomBytes(32).toString("hex"),
  });
  if (!r.ok) throw new Error("configuración de prueba");
  return r.valor;
}

const bueno = (): Obj => ({
  estado: "ok",
  modo: "conversacion",
  asistente: "claude",
  almacenamiento: "drive",
  version_prompt: "0.1",
  frecuencia_horas: 24,
  tratados: 3,
  sin_tratar: 0,
  borradores: 1,
  documentos: 0,
  facturas_pendientes: 0,
  urgentes: 0,
  comprobaciones: { correo: true, almacenamiento: true, contexto: true, registro: true },
  problemas: [],
});

async function montar() {
  const cfg = configuracion();
  const claves = derivarClaves(cfg.secreto);
  const fabrica = crearFabrica({
    hmac: (m) => createHmac("sha256", claves.guardado).update(m).digest("hex"),
  });
  const bd = await abrir();
  const pglite = await crearAlmacenPglite(bd, ROL_MCP);
  const almacen = crearAlmacen(pglite);
  const tareas: (() => Promise<void>)[] = [];
  const punto = crearPuntoMcp({
    configuracion: () => cfg,
    almacen: () => almacen,
    prompt: obtenerPromptFicticio,
    despues: (t) => void tareas.push(t),
  });
  const sembrarToken = (tipo: "A" | "B" = "A", recurso = RECURSO) =>
    sembrar(bd, tipo, "claude", fabrica, recurso);
  return {
    bd,
    claves,
    pglite,
    punto,
    sembrarToken,
    suceso: async () => {
      while (tareas.length > 0) await tareas.shift()?.();
    },
  };
}
// El token que presentaría el cliente (la fábrica lo compone con el prefijo `hia_a_`).
const valorToken = (s: { acceso: { valor: string } }) => s.acceso.valor;

interface Opciones {
  metodo?: string;
  token?: string | null;
  cabeceras?: Record<string, string>;
  cuerpo?: unknown;
  texto?: string | null;
  url?: string;
}
function pet(o: Opciones = {}): Request {
  const cabeceras: Record<string, string> = {
    "content-type": "application/json",
    accept: "application/json, text/event-stream",
    ...o.cabeceras,
  };
  if (o.token) cabeceras.authorization = `Bearer ${o.token}`;
  const metodo = o.metodo ?? "POST";
  const texto =
    o.texto !== undefined ? o.texto : o.cuerpo !== undefined ? JSON.stringify(o.cuerpo) : null;
  return new Request(o.url ?? URL_MCP, {
    method: metodo,
    headers: cabeceras,
    body: metodo === "GET" || metodo === "HEAD" ? null : texto,
  });
}
const llamada = (nombre: string, argumentos: unknown, id = 1) => ({
  jsonrpc: "2.0",
  id,
  method: "tools/call",
  params: { name: nombre, arguments: argumentos },
});
async function cuerpoDe(r: Response): Promise<Obj> {
  const crudo = await r.text();
  const linea = crudo.split("\n").find((l) => l.startsWith("data: "));
  return JSON.parse(linea ? linea.slice(6) : crudo) as Obj;
}
const resultadoDe = async (r: Response) => (await cuerpoDe(r)).result as Obj;
const sucesos = async (bd: BdApoyo) =>
  (await bd.db.query(`select s::text as t from ${ESQUEMA}.sucesos s`)).rows as { t: string }[];
const flujoDe = (texto: string) =>
  new Request(URL_MCP, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: new ReadableStream<Uint8Array>({
      start(c) {
        c.enqueue(new TextEncoder().encode(texto));
        c.close();
      },
    }),
    duplex: "half",
  } as RequestInit);

describe("hito: las tres herramientas responden por el punto MCP con tokens sembrados", () => {
  it("obtener_instrucciones, enviar_informe y confirmar_orden de principio a fin", async () => {
    const { bd, punto, sembrarToken, suceso } = await montar();
    const s = await sembrarToken("A");
    const t = valorToken(s);
    await bd.db.query(`insert into ${ESQUEMA}.ordenes (licencia_id, tipo) values ($1, 'pausar')`, [
      s.licenciaId,
    ]);
    const o = await punto(pet({ token: t, cuerpo: llamada("obtener_instrucciones", {}) }));
    expect(o.status).toBe(200);
    expect(o.headers.get("cache-control")).toBe("no-store");
    const so = (await resultadoDe(o)).structuredContent as Obj;
    expect(so.estado).toBe("pausada");
    const orden = (so.orden as Obj).id as string;

    const e = await punto(
      pet({
        token: t,
        cuerpo: llamada("enviar_informe", { ejecucion_id: so.ejecucion_id, informe: bueno() }),
      }),
    );
    expect((await resultadoDe(e)).structuredContent).toEqual({
      guardado: true,
      campos_descartados: 0,
    });
    const c = await punto(
      pet({ token: t, cuerpo: llamada("confirmar_orden", { orden_id: orden }) }),
    );
    expect((await resultadoDe(c)).structuredContent).toEqual({ confirmada: true });

    await suceso();
    const filas = await una<{ n: number }>(
      bd,
      `select count(*)::int as n from ${ESQUEMA}.sucesos where ruta = 'api/mcp' and resultado = 'correcto'`,
    );
    expect(filas.n).toBe(3);
  });

  it("tools/list pasa por el mismo punto", async () => {
    const { punto, sembrarToken } = await montar();
    const t = valorToken(await sembrarToken("A"));
    const lista = await punto(
      pet({ token: t, cuerpo: { jsonrpc: "2.0", id: 1, method: "tools/list", params: {} } }),
    );
    expect(((await resultadoDe(lista)).tools as Obj[]).map((x) => x.name)).toEqual([
      "obtener_instrucciones",
      "enviar_informe",
      "confirmar_orden",
    ]);
  });
});

describe("paso 1: configuración del conector (PRUEBA-018, parte)", () => {
  it("sin configuración válida: configuracion_conector_invalida antes de mirar nada (todos los métodos)", async () => {
    const punto = crearPuntoMcp({
      configuracion: () => {
        throw new ErrorDeAplicacion("configuracion_conector_invalida");
      },
      almacen: () => {
        throw new ErrorDeAplicacion("error_no_controlado");
      },
      prompt: obtenerPromptFicticio,
    });
    for (const metodo of ["POST", "GET", "PUT", "DELETE", "OPTIONS"]) {
      await expect(punto(pet({ metodo, token: CANARIO }))).rejects.toMatchObject({
        codigo: "configuracion_conector_invalida",
      });
    }
  });
});

describe("paso 2: solo POST (PRUEBA-002, 405)", () => {
  for (const metodo of ["GET", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD"]) {
    it(`${metodo}: 405 con Allow: POST, sin leer nada y sin eco`, async () => {
      const { punto, sembrarToken, suceso, bd } = await montar();
      const t = valorToken(await sembrarToken());
      const r = await punto(
        pet({ metodo, token: t, cabeceras: { origin: CANARIO }, texto: CANARIO }),
      );
      expect(r.status).toBe(405);
      expect(r.headers.get("allow")).toBe("POST");
      expect(r.headers.get("cache-control")).toBe("no-store");
      expect(await r.text()).not.toContain(CANARIO);
      await suceso();
      expect((await sucesos(bd)).map((f) => f.t).join("")).not.toContain(CANARIO);
    });
  }
});

describe("paso 3: Origin", () => {
  const validos = [undefined, URL_PUBLICA, "https://claude.ai", "https://chatgpt.com"];
  for (const origen of validos) {
    it(`Origin ${origen ?? "ausente"}: pasa al siguiente paso`, async () => {
      const { punto } = await montar();
      // Sin token: llega al paso 5 (401), prueba de que el paso 3 lo dejó pasar.
      const r = await punto(pet({ cabeceras: origen ? { origin: origen } : {}, cuerpo: {} }));
      expect(r.status).toBe(401);
    });
  }
  for (const origen of [
    "null",
    "https://otro.ejemplo.invalid",
    CANARIO,
    "https://claude.ai.evil.invalid",
    "http://claude.ai",
    "https://claude.ai/",
    "https://claude.ai:443",
    "HTTPS://CLAUDE.AI",
    `${URL_PUBLICA}/`,
    "",
  ]) {
    it(`Origin ${origen === CANARIO ? "marcado" : JSON.stringify(origen)}: 403 antes de mirar el token`, async () => {
      const { punto, sembrarToken, bd } = await montar();
      const t = valorToken(await sembrarToken());
      const antes = await estado(bd);
      const r = await punto(
        pet({
          token: t,
          cabeceras: { origin: origen },
          cuerpo: llamada("obtener_instrucciones", {}),
        }),
      );
      expect(r.status).toBe(403);
      expect(await r.text()).not.toContain(CANARIO);
      expect(await estado(bd)).toEqual(antes);
    });
  }
});

describe("paso 3: el origen se decide antes de tocar el almacén (orden)", () => {
  it("origen ajeno con token inválido y con almacén caído: 403 y validarAcceso no se llama", async () => {
    const m = await montar();
    let validaciones = 0;
    const real = crearAlmacen(m.pglite);
    const punto = crearPuntoMcp({
      configuracion,
      almacen: () => ({
        ...real,
        validarAcceso: (...a) => {
          validaciones += 1;
          return real.validarAcceso(...a);
        },
      }),
      prompt: obtenerPromptFicticio,
    });
    const falso = `hia_a_${randomBytes(32).toString("base64url")}`;
    for (const caido of [false, true]) {
      m.pglite.caer(caido);
      const r = await punto(
        pet({
          token: falso,
          cabeceras: { origin: "https://otro.ejemplo.invalid" },
          cuerpo: llamada("obtener_instrucciones", {}),
        }),
      );
      expect(r.status).toBe(403);
    }
    expect(validaciones).toBe(0);
  });
});

describe("paso 4: cuerpo de hasta 32 768 bytes, leído con tope (PRUEBA-018, parte: 413)", () => {
  it("32 768 bytes pasa; 32 769 da 413 (con Content-Length y sin él)", async () => {
    const { punto } = await montar();
    expect((await punto(pet({ texto: "x".repeat(32768) }))).status).toBe(401);
    expect((await punto(pet({ texto: "x".repeat(32769) }))).status).toBe(413);
    expect((await punto(flujoDe("x".repeat(32769)))).status).toBe(413);
    expect((await punto(flujoDe("x".repeat(32768)))).status).toBe(401);
  });

  it("el cuerpo se cuenta en bytes, no en caracteres", async () => {
    const { punto } = await montar();
    // 16 385 caracteres de dos bytes = 32 770 bytes.
    expect((await punto(pet({ texto: "ñ".repeat(16385) }))).status).toBe(413);
    expect((await punto(pet({ texto: "ñ".repeat(16384) }))).status).toBe(401);
  });

  it("un flujo sin fin se corta al pasar el tope: no se lee todo", async () => {
    const { punto } = await montar();
    let leidos = 0;
    const bloque = new Uint8Array(4096).fill(120);
    const flujo = new ReadableStream<Uint8Array>({
      pull(c) {
        leidos += bloque.length;
        if (leidos > 10_000_000) c.close();
        else c.enqueue(bloque);
      },
    });
    const r = await punto(
      new Request(URL_MCP, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: flujo,
        duplex: "half",
      } as RequestInit),
    );
    expect(r.status).toBe(413);
    expect(leidos).toBeLessThan(200_000);
  });

  it("413 va antes del 401 y sin eco", async () => {
    const { punto } = await montar();
    const r = await punto(pet({ texto: `${CANARIO}${"x".repeat(40000)}` }));
    expect(r.status).toBe(413);
    expect(await r.text()).not.toContain(CANARIO);
  });
});

describe("paso 5: reto 401 (PRUEBA-001, parte)", () => {
  const reto = `Bearer resource_metadata="${URL_PUBLICA}/.well-known/oauth-protected-resource/api/mcp", scope="agente"`;
  const tokenFalso = (prefijo: string, n: number) =>
    `${prefijo}${randomBytes(33).toString("base64url").slice(0, n)}`;

  it("sin Authorization: 401 con el reto exacto, derivado de URL_PUBLICA y no de Host", async () => {
    const { punto } = await montar();
    const r = await punto(pet({ cabeceras: { host: "otro.ejemplo.invalid" }, cuerpo: {} }));
    expect(r.status).toBe(401);
    expect(r.headers.get("www-authenticate")).toBe(reto);
    expect(r.headers.get("cache-control")).toBe("no-store");
  });

  it("formas que no valen: sin token, mal esquema, prefijo, longitud, token en URL, cookie, cuerpo", async () => {
    const { punto, sembrarToken, bd } = await montar();
    const valido = valorToken(await sembrarToken());
    const antes = await estado(bd);
    const casos: Opciones[] = [
      { cuerpo: {} },
      { cabeceras: { authorization: CANARIO }, cuerpo: {} },
      { cabeceras: { authorization: `Basic ${valido}` }, cuerpo: {} },
      { cabeceras: { authorization: `bearer ${valido}` }, cuerpo: {} },
      { cabeceras: { authorization: `Bearer  ${valido}` }, cuerpo: {} },
      { cabeceras: { authorization: `Bearer ${tokenFalso("hia_r_", 43)}` }, cuerpo: {} },
      { cabeceras: { authorization: `Bearer ${tokenFalso("hia_a_", 42)}` }, cuerpo: {} },
      { cabeceras: { authorization: `Bearer ${tokenFalso("hia_a_", 43)}x` }, cuerpo: {} },
      { cabeceras: { authorization: `Bearer ${valido.replace("hia_a_", "hia_b_")}` }, cuerpo: {} },
      { url: `${URL_MCP}?access_token=${valido}`, cuerpo: {} },
      { url: `${URL_MCP}?token=${valido}`, cuerpo: llamada("obtener_instrucciones", {}) },
      { cabeceras: { cookie: `sesion=${valido}` }, cuerpo: {} },
      { texto: JSON.stringify({ token: valido, authorization: `Bearer ${valido}` }) },
    ];
    for (const caso of casos) {
      const r = await punto(pet(caso));
      expect(r.status).toBe(401);
      expect(r.headers.get("www-authenticate")).toBe(reto);
      const texto = await r.text();
      expect(texto).not.toContain(valido);
      expect(texto).not.toContain(CANARIO);
    }
    expect(await estado(bd)).toEqual(antes);
  });
});

describe("paso 6: tokens no válidos con reloj (PRUEBA-011)", () => {
  const invalid = 'Bearer error="invalid_token", resource_metadata="';
  async function rechaza(punto: (p: Request) => Promise<Response>, token: string) {
    const r = await punto(pet({ token, cuerpo: llamada("obtener_instrucciones", {}) }));
    expect(r.status).toBe(401);
    expect(r.headers.get("www-authenticate")).toContain(invalid);
    expect(r.headers.get("www-authenticate")).toContain('scope="agente"');
    expect(await r.text()).not.toContain(token);
  }

  it("desconocido con forma válida, de otro recurso, revocado, de conexión revocada y caducado", async () => {
    const m = await montar();
    const desconocido = `hia_a_${randomBytes(32).toString("base64url")}`;
    const otroRecurso = await m.sembrarToken("A", "https://otro.ejemplo.invalid/api/mcp");
    const revocado = await m.sembrarToken("A");
    const deConexionRevocada = await m.sembrarToken("B");
    await m.bd.db.query(`update ${ESQUEMA}.tokens set revocado_en = now() where token_hmac = $1`, [
      revocado.acceso.hmac,
    ]);
    await m.bd.db.query(
      `update ${ESQUEMA}.conexiones set revocada_en = now(), motivo_revocacion = 'operador' where id = $1`,
      [deConexionRevocada.conexionId],
    );
    const caducable = await m.sembrarToken("A");
    const vigente = await m.sembrarToken("A");

    // Vigente: pasa.
    const buena = await m.punto(
      pet({ token: valorToken(vigente), cuerpo: llamada("obtener_instrucciones", {}) }),
    );
    expect(buena.status).toBe(200);
    const despuesDeLaBuena = await estado(m.bd);

    for (const t of [
      desconocido,
      valorToken(otroRecurso),
      valorToken(revocado),
      valorToken(deConexionRevocada),
    ]) {
      await rechaza(m.punto, t);
    }
    expect(await estado(m.bd)).toEqual(despuesDeLaBuena);

    // Con reloj: a los 5 min menos 1 s aún vale; a 5 min 1 s no.
    await m.bd.reloj.avanzar(299_000);
    const aun = await m.punto(
      pet({ token: valorToken(caducable), cuerpo: llamada("confirmar_orden", { orden_id: "x" }) }),
    );
    expect(aun.status).toBe(200);
    await m.bd.reloj.avanzar(2_000);
    await rechaza(m.punto, valorToken(caducable));
  });

  it("el token no aparece en la respuesta, en la consola ni en los sucesos", async () => {
    const m = await montar();
    const sumidero = crearSumidero();
    const captura = capturarConsola(sumidero);
    try {
      const falso = `hia_a_${randomBytes(32).toString("base64url")}`;
      const s = await m.sembrarToken("A");
      for (const t of [falso, valorToken(s)]) {
        const r = await m.punto(pet({ token: t, cuerpo: llamada("obtener_instrucciones", {}) }));
        await sumidero.registrarRespuesta(r);
      }
      await m.suceso();
      for (const fila of await sucesos(m.bd)) sumidero.registrar("suceso", fila.t);
      for (const t of [falso, valorToken(s)]) expect(sumidero.hallar(t)).toEqual([]);
    } finally {
      captura.restaurar();
    }
  });

  it("almacén caído al validar: almacen_no_disponible (503 en HTTP), no 401 ni nada concedido", async () => {
    const m = await montar();
    const s = await m.sembrarToken("A");
    m.pglite.caer(true);
    await expect(
      m.punto(pet({ token: valorToken(s), cuerpo: llamada("obtener_instrucciones", {}) })),
    ).rejects.toMatchObject({ codigo: "almacen_no_disponible" });
  });
});

describe("paso 7: JSON-RPC (PRUEBA-017, parte: lotes y no objeto, sin eco)", () => {
  const sinEco = async (r: Response) => {
    const texto = await r.text();
    expect(texto).not.toContain(CANARIO);
    return JSON.parse(texto) as Obj;
  };

  it("JSON mal formado: -32700 con texto fijo", async () => {
    const m = await montar();
    const t = valorToken(await m.sembrarToken());
    for (const texto of [`{${CANARIO}`, "", `{"a":"${CANARIO}`, "\u0000", `[${CANARIO}`]) {
      const r = await m.punto(pet({ token: t, texto }));
      expect(r.status).toBe(400);
      expect(await sinEco(r)).toEqual({
        jsonrpc: "2.0",
        id: null,
        error: { code: -32700, message: "Error de sintaxis" },
      });
    }
  });

  it("UTF-8 mal formado: -32700", async () => {
    const m = await montar();
    const t = valorToken(await m.sembrarToken());
    const r = await m.punto(
      new Request(URL_MCP, {
        method: "POST",
        headers: { "content-type": "application/json", authorization: `Bearer ${t}` },
        body: new Uint8Array([0x7b, 0xff, 0xfe, 0x7d]),
      }),
    );
    expect(r.status).toBe(400);
    expect((await sinEco(r)).error).toEqual({ code: -32700, message: "Error de sintaxis" });
  });

  it("lote o cuerpo que no es un objeto: -32600 con id null, sin eco", async () => {
    const m = await montar();
    const t = valorToken(await m.sembrarToken());
    const cuerpos = [
      [llamada("obtener_instrucciones", {}), llamada("confirmar_orden", { orden_id: CANARIO })],
      [],
      [CANARIO],
      JSON.stringify(CANARIO),
      "5",
      "null",
      "true",
    ];
    for (const c of cuerpos) {
      const r = await m.punto(
        pet({ token: t, texto: typeof c === "string" ? c : JSON.stringify(c) }),
      );
      expect(r.status).toBe(400);
      expect(await sinEco(r)).toEqual({
        jsonrpc: "2.0",
        id: null,
        error: { code: -32600, message: "Petición no válida" },
      });
    }
  });

  it("un lote no ejecuta nada: ni ejecuciones ni órdenes entregadas", async () => {
    const m = await montar();
    const s = await m.sembrarToken();
    const antes = await estado(m.bd);
    await m.punto(pet({ token: valorToken(s), cuerpo: [llamada("obtener_instrucciones", {})] }));
    expect(await estado(m.bd)).toEqual(antes);
  });

  it("tools/call con nombre ajeno o sin nombre: -32602 sin eco y sin tocar el almacén", async () => {
    const m = await montar();
    const s = await m.sembrarToken();
    const antes = await estado(m.bd);
    for (const params of [
      { name: `x_${CANARIO}`, arguments: {} },
      { name: { a: CANARIO }, arguments: {} },
      { name: 5 },
      { arguments: { a: CANARIO } },
      { name: "OBTENER_INSTRUCCIONES" },
      null,
      CANARIO,
    ]) {
      const r = await m.punto(
        pet({
          token: valorToken(s),
          cuerpo: { jsonrpc: "2.0", id: 9, method: "tools/call", params },
        }),
      );
      expect(r.status).toBe(200);
      expect(await sinEco(r)).toEqual({
        jsonrpc: "2.0",
        id: 9,
        error: { code: -32602, message: "Parámetros no válidos" },
      });
    }
    expect(await estado(m.bd)).toEqual(antes);
  });

  it("el id solo se repite si es un entero o un texto corto; si no, null", async () => {
    const m = await montar();
    const t = valorToken(await m.sembrarToken());
    for (const [id, esperado] of [
      [7, 7],
      ["abc", "abc"],
      [{ x: CANARIO }, null],
      [CANARIO.repeat(10), null],
      [1.5, null],
    ] as const) {
      const r = await m.punto(
        pet({
          token: t,
          cuerpo: { jsonrpc: "2.0", id, method: "tools/call", params: { name: CANARIO } },
        }),
      );
      expect((await sinEco(r)).id).toBe(esperado);
    }
  });
});

describe("paso 7: lista cerrada de métodos (revisión de seguridad 2)", () => {
  const sobre = {
    "io.modelcontextprotocol/protocolVersion": "2026-07-28",
    "io.modelcontextprotocol/clientCapabilities": {},
    "io.modelcontextprotocol/clientInfo": { name: "prueba", version: "0.0.0" },
  };

  it("subscriptions/listen moderno con toolsListChanged: -32601 en menos de 1 s, sin text/event-stream, con suceso", async () => {
    const m = await montar();
    const t = valorToken(await m.sembrarToken());
    const inicio = Date.now();
    const r = await m.punto(
      pet({
        token: t,
        cabeceras: { "mcp-protocol-version": "2026-07-28", "mcp-method": "subscriptions/listen" },
        cuerpo: {
          jsonrpc: "2.0",
          id: 4,
          method: "subscriptions/listen",
          params: { notifications: { toolsListChanged: true }, _meta: sobre },
        },
      }),
    );
    const texto = await r.text();
    expect(Date.now() - inicio).toBeLessThan(1000);
    expect(r.headers.get("content-type") ?? "").not.toContain("text/event-stream");
    expect(JSON.parse(texto)).toEqual({
      jsonrpc: "2.0",
      id: 4,
      error: { code: -32601, message: "Método no encontrado" },
    });
    await m.suceso();
    const filas = (
      await m.bd.db.query<Obj>(`select resultado::text, codigo from ${ESQUEMA}.sucesos`)
    ).rows;
    expect(filas).toEqual([{ resultado: "rechazado", codigo: "metodo_no_permitido" }]);
  });

  it("otros métodos fuera de la lista (resources, prompts, completion, logging) dan -32601 sin eco", async () => {
    const m = await montar();
    const t = valorToken(await m.sembrarToken());
    for (const metodo of [
      "resources/list",
      "resources/subscribe",
      "prompts/list",
      "completion/complete",
      "logging/setLevel",
      `x/${CANARIO}`,
    ]) {
      const r = await m.punto(
        pet({ token: t, cuerpo: { jsonrpc: "2.0", id: 2, method: metodo, params: {} } }),
      );
      const texto = await r.text();
      expect(texto).not.toContain(CANARIO);
      expect((JSON.parse(texto) as Obj).error).toEqual({
        code: -32601,
        message: "Método no encontrado",
      });
    }
    // Un método que no es texto tampoco pasa.
    const raro = await m.punto(pet({ token: t, cuerpo: { jsonrpc: "2.0", id: 2, method: 5 } }));
    expect(((await cuerpoDe(raro)).error as Obj).code).toBe(-32601);
  });

  it("los métodos permitidos siguen funcionando: initialize, notifications/initialized, ping y server/discover", async () => {
    const m = await montar();
    const t = valorToken(await m.sembrarToken());
    const init = await m.punto(
      pet({
        token: t,
        cuerpo: {
          jsonrpc: "2.0",
          id: 1,
          method: "initialize",
          params: {
            protocolVersion: "2025-11-25",
            capabilities: {},
            clientInfo: { name: "p", version: "0" },
          },
        },
      }),
    );
    expect((await resultadoDe(init)).protocolVersion).toBe("2025-11-25");
    const noti = await m.punto(
      pet({ token: t, cuerpo: { jsonrpc: "2.0", method: "notifications/initialized" } }),
    );
    expect(noti.status).toBe(202);
    const ping = await m.punto(
      pet({ token: t, cuerpo: { jsonrpc: "2.0", id: 3, method: "ping" } }),
    );
    expect(ping.status).toBe(200);
    expect(await resultadoDe(ping)).toEqual({});
    const descubrir = await m.punto(
      pet({
        token: t,
        cabeceras: { "mcp-protocol-version": "2026-07-28", "mcp-method": "server/discover" },
        cuerpo: { jsonrpc: "2.0", id: 4, method: "server/discover", params: { _meta: sobre } },
      }),
    );
    expect((await resultadoDe(descubrir)).supportedVersions).toContain("2026-07-28");
  });
});

describe("id JSON-RPC por el camino del SDK: una sola política (revisión 2)", () => {
  it("un id marcado de 500 o de 50 caracteres sale null en error -32601 y en resultado de confirmar_orden", async () => {
    const m = await montar();
    const t = valorToken(await m.sembrarToken());
    for (const id of [`${CANARIO}${"x".repeat(450)}`, CANARIO]) {
      const e = await m.punto(
        pet({ token: t, cuerpo: { jsonrpc: "2.0", id, method: "metodo/desconocido" } }),
      );
      const ce = await cuerpoDe(e);
      expect((ce.error as Obj).code).toBe(-32601);
      expect(ce.id).toBeNull();
      const c = await m.punto(
        pet({ token: t, cuerpo: llamada("confirmar_orden", { orden_id: "x" }, id as never) }),
      );
      const cc = await cuerpoDe(c);
      expect(cc.result).toBeDefined();
      expect(cc.id).toBeNull();
    }
    const ok = await m.punto(
      pet({ token: t, cuerpo: llamada("confirmar_orden", { orden_id: "x" }, 12) }),
    );
    expect((await cuerpoDe(ok)).id).toBe(12);
  });
});

describe("paso 10: suceso tras responder (PRUEBA-019, parte)", () => {
  it("tras autenticar, cada paso deja un suceso cerrado (ruta, herramienta, resultado, código) y sin valores", async () => {
    const m = await montar();
    const s = await m.sembrarToken();
    await m.punto(pet({ token: valorToken(s), cuerpo: llamada("obtener_instrucciones", {}) }));
    await m.punto(pet({ token: valorToken(s), texto: "{" }));
    await m.suceso();
    const filas = (
      await m.bd.db.query<Obj>(
        `select herramienta::text, resultado::text, codigo from ${ESQUEMA}.sucesos order by momento, id`,
      )
    ).rows;
    expect(filas.map((f) => [f.herramienta, f.resultado, f.codigo])).toEqual([
      ["obtener_instrucciones", "correcto", "ok"],
      [null, "rechazado", "json_no_valido"],
    ]);
    expect(JSON.stringify(await sucesos(m.bd))).not.toContain(CANARIO);
  });

  it("un token bien formado pero inexistente es anónimo: 0 filas en sucesos, registrarSuceso sin llamar, solo una línea de consola token_no_valido (25 veces)", async () => {
    const m = await montar();
    let escritos = 0;
    const tareas: (() => Promise<void>)[] = [];
    const real = crearAlmacen(m.pglite);
    const punto = crearPuntoMcp({
      configuracion,
      almacen: () => ({
        ...real,
        registrarSuceso: (x) => {
          escritos += 1;
          return real.registrarSuceso(x);
        },
      }),
      prompt: obtenerPromptFicticio,
      despues: (t) => void tareas.push(t),
    });
    const registro = vi.spyOn(console, "log").mockImplementation(() => undefined);
    const aviso = vi.spyOn(console, "error").mockImplementation(() => undefined);
    try {
      for (let i = 0; i < 25; i += 1) {
        const falso = `hia_a_${randomBytes(32).toString("base64url")}`;
        const r = await punto(pet({ token: falso, cuerpo: llamada("obtener_instrucciones", {}) }));
        expect(r.status).toBe(401);
        expect(r.headers.get("www-authenticate")).toContain('error="invalid_token"');
        expect(await r.text()).not.toContain(falso);
      }
      while (tareas.length > 0) await tareas.shift()?.();
      const lineas = [...registro.mock.calls, ...aviso.mock.calls].map((c) => String(c[0]));
      expect(lineas).toHaveLength(25);
      expect(new Set(lineas.map((l) => (JSON.parse(l) as Obj).codigo))).toEqual(
        new Set(["token_no_valido"]),
      );
    } finally {
      registro.mockRestore();
      aviso.mockRestore();
    }
    expect(escritos).toBe(0);
    expect(await sucesos(m.bd)).toHaveLength(0);
  });

  it("los rechazos anteriores a autenticar (método, origen, tamaño, sin token) no escriben sucesos ni abren el almacén: solo consola con código cerrado", async () => {
    const m = await montar();
    let aperturas = 0;
    let escritos = 0;
    const tareas: (() => Promise<void>)[] = [];
    const almacen = crearAlmacen(m.pglite);
    const punto = crearPuntoMcp({
      configuracion,
      almacen: () => {
        aperturas += 1;
        return {
          ...almacen,
          registrarSuceso: (x) => {
            escritos += 1;
            return almacen.registrarSuceso(x);
          },
        };
      },
      prompt: obtenerPromptFicticio,
      despues: (t) => void tareas.push(t),
    });
    const registro = vi.spyOn(console, "log").mockImplementation(() => undefined);
    const aviso = vi.spyOn(console, "error").mockImplementation(() => undefined);
    try {
      for (let i = 0; i < 5; i += 1) {
        await punto(pet({ metodo: "GET" }));
        await punto(pet({ cabeceras: { origin: CANARIO }, cuerpo: {} }));
        await punto(pet({ texto: "x".repeat(40000) }));
        await punto(pet({ cuerpo: {} }));
        await punto(pet({ cabeceras: { authorization: CANARIO }, cuerpo: {} }));
      }
      while (tareas.length > 0) await tareas.shift()?.();
      const lineas = [...registro.mock.calls, ...aviso.mock.calls].map((c) => String(c[0]));
      expect(lineas).toHaveLength(25);
      const codigos = new Set(lineas.map((l) => (JSON.parse(l) as Obj).codigo));
      expect([...codigos].sort()).toEqual(
        [
          "cuerpo_demasiado_grande",
          "metodo_no_permitido",
          "origen_no_permitido",
          "sin_token",
          "token_no_valido",
        ].sort(),
      );
      expect(lineas.join("")).not.toContain(CANARIO);
    } finally {
      registro.mockRestore();
      aviso.mockRestore();
    }
    expect(aperturas).toBe(0);
    expect(escritos).toBe(0);
    expect(await sucesos(m.bd)).toHaveLength(0);
  });

  it("el protocolo sale de una lista cerrada: lo desconocido, `otra`, y el valor recibido no se guarda", async () => {
    const m = await montar();
    const t = valorToken(await m.sembrarToken());
    await m.punto(
      pet({
        token: t,
        cuerpo: {
          jsonrpc: "2.0",
          id: 1,
          method: "initialize",
          params: {
            protocolVersion: "2025-11-25",
            capabilities: {},
            clientInfo: { name: "p", version: "0" },
          },
        },
      }),
    );
    await m.punto(
      pet({
        token: t,
        cabeceras: { "mcp-protocol-version": CANARIO },
        cuerpo: llamada("obtener_instrucciones", {}),
      }),
    );
    await m.suceso();
    const filas = (
      await m.bd.db.query<{ protocolo: string }>(
        `select protocolo::text from ${ESQUEMA}.sucesos order by momento, id`,
      )
    ).rows;
    expect(filas.map((f) => f.protocolo)).toEqual(["2025-11-25", "otra"]);
    expect(JSON.stringify(await sucesos(m.bd))).not.toContain(CANARIO);
  });

  it("si registrar el suceso falla, la respuesta no cambia", async () => {
    const m = await montar();
    const s = await m.sembrarToken();
    const r = await m.punto(
      pet({ token: valorToken(s), cuerpo: llamada("obtener_instrucciones", {}) }),
    );
    expect(r.status).toBe(200);
    m.pglite.caer(true);
    await expect(m.suceso()).resolves.toBeUndefined();
  });
});
