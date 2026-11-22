// T-112 (c) (001): fallos y huella por HTTP en proceso. PRUEBA-018 (cada paso, variable y punto de fallo;
// cierre en fallo, art. 3) y PRUEBA-016 (huella del prompt invariable antes y después de operaciones y de
// entradas hostiles; huella distinta, ilegible o vacío -> 503). Datos ficticios, compuestos en ejecución.
//
// Mutaciones que estas pruebas detectan:
//  - M5: una variable del grupo «conector» sin validar (o sin 503 en alguna ruta) -> el caso de esa variable
//    y esa ruta devuelve algo distinto de 503.
//  - M6 (no aplicada a mano en T-112; pendiente): una herramienta que, con el almacén caído, entrega prompt o `guardado`/`confirmada` -> las
//    aserciones de `error_temporal` sin la marca del prompt fallan.
//  - M7 (no aplicada a mano en T-112; pendiente): `activar` que consume el código sin crear conexión, o que deja tokens al perderse la respuesta.
//  - M8: el prompt servido distinto del que fija la huella, o huella que cambia tras operar -> PRUEBA-016.
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NOMBRES_CONECTOR } from "../../src/lib/plataforma/configuracion";
import { manejador } from "../../src/lib/plataforma/manejador";
import { crearPuntoMcp } from "../../src/mcp/entrada";
import {
  crearLectorPrompt,
  HUELLA_PROMPT_FICTICIO,
  REGLAS_FICTICIAS,
} from "../../src/mcp/prompt-ficticio";
import { cargarConfiguracionConector } from "../../src/lib/plataforma/configuracion";
import { cerrarAlFinal, ESQUEMA, sembrarOrden, una } from "../unit/conector/bd/comun";
import {
  abrirSolicitud,
  activar,
  canjear,
  ciclo,
  generarCodigo,
  informeValido,
  montarServidor,
  pasarela,
  pendientes,
  registrarCliente,
  renovar,
  RECURSO,
  URL_PUBLICA,
  type Servidor,
} from "./apoyo-http";

vi.mock("../../src/lib/supabase/conector", async (o) =>
  (await import("./apoyo-http")).sustitutoConector(await o()),
);
vi.mock("../../src/lib/supabase/autorizacion", async (o) =>
  (await import("./apoyo-http")).sustitutoAutorizacion(await o()),
);
vi.mock("next/server", async (o) => (await import("./apoyo-http")).sustitutoNextServer(await o()));

cerrarAlFinal();

const MARCA = "MARCA-PROMPT-FICTICIO-0001";
let s: Servidor;
beforeEach(async () => {
  s = await montarServidor();
});
afterEach(async () => {
  await s.cerrar();
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

const llamadaMcp = (nombre: string, argumentos: unknown = {}) => ({
  jsonrpc: "2.0",
  id: 1,
  method: "tools/call",
  params: { name: nombre, arguments: argumentos },
});
const contar = async (tabla: string): Promise<number> =>
  (await una<{ n: number }>(s.bd, `select count(*)::int as n from ${ESQUEMA}.${tabla}`)).n;

// ---- Variables ---------------------------------------------------------------------------------------------
const MALAS: Record<(typeof NOMBRES_CONECTOR)[number], string[]> = {
  URL_PUBLICA: ["ftp://ejemplo.invalid", "no es una url", "http://localhost:3000/ruta"],
  CONECTOR_SECRETO: ["corto", "a".repeat(60), "con espacios " + "x".repeat(50)],
  CONECTOR_BD_URL: [
    "no-es-una-url",
    [
      "postgres",
      "://",
      "conector_prueba_mcp.ref1",
      ":",
      "x".repeat(12),
      "@agrupador.ejemplo.invalid:6543/postgres?sslmode=disable",
    ].join(""),
    [
      "postgres",
      "://",
      "conector_prueba_mcp.ref1",
      ":",
      "x".repeat(12),
      "@agrupador.ejemplo.invalid:6543/postgres?options=-c%20search_path%3Dpublic",
    ].join(""),
  ],
  AUTORIZACION_BD_URL: [
    "no-es-una-url",
    [
      "postgres",
      "://",
      "conector_prueba_gestion.ref1",
      ":",
      "x".repeat(12),
      "@agrupador.ejemplo.invalid:6543/postgres?sslmode=disable",
    ].join(""),
    [
      "postgres",
      "://",
      "conector_prueba_gestion.ref1",
      ":",
      "x".repeat(12),
      "@agrupador.ejemplo.invalid:6543/postgres?options=-c%20search_path%3Dpublic",
    ].join(""),
  ],
  OPERACION_HUELLA: ["xyz", "0".repeat(63), "G".repeat(64)],
};

describe("PRUEBA-018 · variables: cada una ausente o mal formada -> 503 en todas las rutas, sin tocar la base", () => {
  const rutas: Array<[string, string, string]> = [
    ["POST", "/api/mcp", "{}"],
    ["POST", "/oauth/registro", "{}"],
    ["GET", "/oauth/autorizar", ""],
    ["POST", "/oauth/autorizar", ""],
    ["POST", "/oauth/token", ""],
    ["POST", "/api/operacion", "{}"],
    ["GET", "/.well-known/oauth-protected-resource", ""],
    ["GET", "/.well-known/oauth-protected-resource/api/mcp", ""],
    ["GET", "/.well-known/oauth-authorization-server", ""],
  ];
  const casos: Array<[string, string, string | undefined]> = [];
  for (const nombre of NOMBRES_CONECTOR) {
    casos.push([nombre, "ausente", undefined]);
    MALAS[nombre].forEach((v, i) => casos.push([nombre, `mal formada n.º ${i + 1}`, v]));
  }

  it.each(casos)("%s %s", async (nombre, _caso, valor) => {
    vi.stubEnv(nombre, valor);
    s.llamadas.length = 0;
    for (const [metodo, ruta, cuerpo] of rutas) {
      const r = await s.fetch(`${URL_PUBLICA}${ruta}`, {
        method: metodo,
        headers: { "content-type": "application/json", origin: URL_PUBLICA },
        body: metodo === "GET" ? undefined : cuerpo,
      });
      expect(r.status, `${metodo} ${ruta}`).toBe(503);
      expect(r.headers.get("cache-control"), `${metodo} ${ruta}`).toContain("no-store");
      const t = await r.text();
      if (valor !== undefined && valor.length > 8) expect(t).not.toContain(valor);
    }
    expect(s.llamadas).toEqual([]);
    expect(s.consola.join("\n")).not.toContain(valor ?? "\u0000sin-valor");
  });
});

// ---- Puntos: almacén (rol mcp) -----------------------------------------------------------------------------
describe("PRUEBA-018 · almacén del conector caído, función a función", () => {
  it("validar_acceso: 503 en la ruta MCP y ninguna otra función llamada", async () => {
    const a = await s.sembrar("A");
    s.fallos.almacen = new Set(["validar_acceso"]);
    s.llamadas.length = 0;
    const r = await s.mcp(a.acceso.valor, llamadaMcp("obtener_instrucciones"));
    expect(r.status).toBe(503);
    expect(await r.text()).toBe('{"estado":"error"}');
    expect(s.llamadas).toEqual(["validar_acceso"]);
    expect(await contar("ejecuciones")).toBe(0);
  });

  it("obtener_instrucciones: error_temporal sin prompt ni estado, y sin ejecución", async () => {
    const a = await s.sembrar("A");
    s.fallos.almacen = new Set(["mcp_obtener_instrucciones"]);
    const r = await s.herramienta(a.acceso.valor, "obtener_instrucciones", {});
    expect(r.status).toBe(200);
    expect(r.json?.result?.isError).toBe(true);
    expect(r.texto).toContain("error_temporal");
    expect(r.texto).not.toContain(MARCA);
    expect(r.texto).not.toContain("ejecucion_id");
    expect(await contar("ejecuciones")).toBe(0);
  });

  it("obtener_instrucciones con la respuesta perdida: la ejecución existe pero el cliente no recibe prompt", async () => {
    const a = await s.sembrar("A");
    s.fallos.despues.add("mcp_obtener_instrucciones");
    const r = await s.herramienta(a.acceso.valor, "obtener_instrucciones", {});
    expect(r.json?.result?.isError).toBe(true);
    expect(r.texto).not.toContain(MARCA);
    expect(r.texto).not.toContain("instrucciones");
    expect(await contar("ejecuciones")).toBe(1);
  });

  it("enviar_informe: error_temporal, nada guardado; con el almacén de vuelta, la ejecución sigue abierta", async () => {
    const a = await s.sembrar("A");
    const o = await s.herramienta(a.acceso.valor, "obtener_instrucciones", {});
    const ejecucion = o.contenido!.ejecucion_id as string;
    s.fallos.almacen = new Set(["mcp_enviar_informe"]);
    const r = await s.herramienta(a.acceso.valor, "enviar_informe", {
      ejecucion_id: ejecucion,
      informe: informeValido(),
    });
    expect(r.json?.result?.isError).toBe(true);
    expect(r.texto).toContain("error_temporal");
    expect(r.texto).not.toContain('"guardado":true');
    expect(await contar("informes")).toBe(0);
    s.fallos.almacen = null;
    const ok = await s.herramienta(a.acceso.valor, "enviar_informe", {
      ejecucion_id: ejecucion,
      informe: informeValido(),
    });
    expect(ok.contenido).toMatchObject({ guardado: true });
  });

  it("confirmar_orden: error_temporal, la orden sigue entregada", async () => {
    const a = await s.sembrar("A");
    const orden = await sembrarOrden(s.bd, a.licenciaId, "pausar", "entregada");
    s.fallos.almacen = new Set(["mcp_confirmar_orden"]);
    const r = await s.herramienta(a.acceso.valor, "confirmar_orden", { orden_id: orden });
    expect(r.json?.result?.isError).toBe(true);
    expect(r.texto).toContain("error_temporal");
    expect(r.texto).not.toContain('"confirmada":true');
    const fila = await una<{ estado: string }>(
      s.bd,
      `select estado::text from ${ESQUEMA}.ordenes where id = $1`,
      [orden],
    );
    expect(fila.estado).toBe("entregada");
  });

  it("registrar_suceso caído: la respuesta no cambia (200 con el resultado) y no se escribe el suceso", async () => {
    const a = await s.sembrar("A");
    s.fallos.almacen = new Set(["registrar_suceso"]);
    const r = await s.herramienta(a.acceso.valor, "obtener_instrucciones", {});
    expect(r.status).toBe(200);
    expect(r.contenido).toMatchObject({ estado: "activa" });
    expect(await contar("sucesos")).toBe(0);
  });

  it("todo el almacén caído: 503 genérico, sin el token ni texto de la causa en cuerpo ni consola", async () => {
    const a = await s.sembrar("A");
    s.fallos.almacen = "todas";
    const r = await s.mcp(a.acceso.valor, llamadaMcp("obtener_instrucciones"));
    expect(r.status).toBe(503);
    const t = await r.text();
    expect(t).toBe('{"estado":"error"}');
    const registro = s.consola.join("\n");
    expect(registro).not.toContain(a.acceso.valor);
    expect(registro).not.toContain("fallo inyectado");
  });
});

// ---- Puntos: gestión (rol de autorización) -----------------------------------------------------------------
describe("PRUEBA-018 · autorización caída, paso a paso", () => {
  it("metadatos: no dependen de la base y responden 200 con ella caída", async () => {
    s.fallos.autorizacion = "todas";
    s.fallos.almacen = "todas";
    for (const ruta of [
      "/.well-known/oauth-protected-resource",
      "/.well-known/oauth-protected-resource/api/mcp",
      "/.well-known/oauth-authorization-server",
    ]) {
      expect((await s.fetch(`${URL_PUBLICA}${ruta}`)).status, ruta).toBe(200);
    }
    expect(s.llamadas).toEqual([]);
  });

  it("registro DCR: 503 sin cliente creado", async () => {
    s.fallos.autorizacion = new Set(["registrar_cliente_dcr"]);
    const r = await s.fetch(`${URL_PUBLICA}/oauth/registro`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ redirect_uris: ["https://claude.ai/api/mcp/auth_callback"] }),
    });
    expect(r.status).toBe(503);
    expect(await contar("clientes_oauth")).toBe(0);
  });

  it("GET autorizar con la base caída: pantalla HTML «no disponible» (503), sin solicitud ni cookie", async () => {
    const cliente = await registrarCliente(s);
    s.fallos.autorizacion = "todas";
    const q = new URLSearchParams({
      client_id: cliente,
      redirect_uri: "https://claude.ai/api/mcp/auth_callback",
      response_type: "code",
      code_challenge: "A".repeat(43),
      code_challenge_method: "S256",
      resource: RECURSO,
      state: "s",
    });
    const r = await s.fetch(`${URL_PUBLICA}/oauth/autorizar?${q.toString()}`);
    expect(r.status).toBe(503);
    expect(r.headers.get("content-type") ?? "").toContain("text/html");
    expect(r.headers.get("set-cookie")).toBeNull();
    expect(await r.text()).toContain(
      "No se ha podido completar. Inténtalo de nuevo en unos minutos.",
    );
    expect(await contar("solicitudes_autorizacion")).toBe(0);
  });

  it("POST activar con la base caída: «no disponible» y el código sigue sirviendo después", async () => {
    const cliente = await registrarCliente(s);
    const sol = await abrirSolicitud(s, cliente);
    const codigo = await generarCodigo(s, "A");
    s.fallos.autorizacion = new Set(["activar"]);
    const r = await activar(s, sol, codigo);
    expect(r.status).toBe(503);
    expect(r.html).toContain("No se ha podido completar");
    expect(r.codigoAut).toBeNull();
    expect(await contar("conexiones")).toBe(0);
    s.fallos.autorizacion = null;
    const bien = await activar(s, sol, codigo);
    expect(bien.status).toBe(200);
    expect(bien.codigoAut).not.toBeNull();
  });

  it("respuesta perdida tras activar: conexión sin tokens; el código gastado ya tiene conexión; otro código funciona", async () => {
    const cliente = await registrarCliente(s);
    const sol = await abrirSolicitud(s, cliente);
    const codigo = await generarCodigo(s, "A");
    s.fallos.despues.add("activar");
    const r = await activar(s, sol, codigo);
    expect(r.status).toBe(503);
    expect(r.codigoAut).toBeNull();
    expect(r.html).not.toContain("code=");
    // El código no se gastó sin conexión: una conexión y ningún token.
    expect(await contar("conexiones")).toBe(1);
    expect(await contar("tokens")).toBe(0);
    s.fallos.despues.clear();
    // Otro código y otra solicitud: completa y obtiene tokens de su propia conexión.
    const sol2 = await abrirSolicitud(s, cliente);
    const ok = await activar(s, sol2, await generarCodigo(s, "A"));
    expect(ok.codigoAut).not.toBeNull();
    const canje = await canjear(s, cliente, sol2, ok.codigoAut!);
    expect(canje.status).toBe(200);
    expect(await contar("conexiones")).toBe(2);
  });

  it("emitir (canje) con la base caída: 503 sin par, y sin tokens guardados", async () => {
    const cliente = await registrarCliente(s);
    const sol = await abrirSolicitud(s, cliente);
    const a = await activar(s, sol, await generarCodigo(s, "A"));
    s.fallos.autorizacion = new Set(["canjear_codigo"]);
    const r = await canjear(s, cliente, sol, a.codigoAut!);
    expect(r.status).toBe(503);
    const t = await r.text();
    expect(t).not.toContain("access_token");
    expect(t).not.toContain("refresh_token");
    expect(await contar("tokens")).toBe(0);
  });

  it("respuesta perdida al emitir: 503 sin par; repetir el código revoca la conexión (reutilización)", async () => {
    const cliente = await registrarCliente(s);
    const sol = await abrirSolicitud(s, cliente);
    const a = await activar(s, sol, await generarCodigo(s, "A"));
    s.fallos.despues.add("canjear_codigo");
    const perdida = await canjear(s, cliente, sol, a.codigoAut!);
    expect(perdida.status).toBe(503);
    expect(await perdida.text()).not.toContain("access_token");
    s.fallos.despues.clear();
    const otra = await canjear(s, cliente, sol, a.codigoAut!);
    expect(otra.status).toBe(400);
    expect(((await otra.json()) as { error: string }).error).toBe("invalid_grant");
    const c = await una<{ motivo_revocacion: string | null }>(
      s.bd,
      `select motivo_revocacion::text from ${ESQUEMA}.conexiones`,
    );
    expect(c.motivo_revocacion).toBe("reutilizacion");
  });

  it("renovar con la base caída: 503 y el token de renovación sigue valiendo", async () => {
    const { cliente, par } = await ciclo(s);
    s.fallos.autorizacion = new Set(["renovar"]);
    const r = await renovar(s, cliente, par.refresh_token);
    expect(r.status).toBe(503);
    expect(await r.text()).not.toContain("access_token");
    s.fallos.autorizacion = null;
    const ok = await renovar(s, cliente, par.refresh_token);
    expect(ok.status).toBe(200);
  });

  it("respuesta perdida al renovar: repetir en 60 s da el mismo par, byte a byte", async () => {
    const { cliente, par } = await ciclo(s);
    s.fallos.despues.add("renovar");
    const perdida = await renovar(s, cliente, par.refresh_token);
    expect(perdida.status).toBe(503);
    s.fallos.despues.clear();
    const r1 = await renovar(s, cliente, par.refresh_token);
    const r2 = await renovar(s, cliente, par.refresh_token);
    expect(r1.status).toBe(200);
    expect(r2.status).toBe(200);
    const p1 = (await r1.json()) as Record<string, unknown>;
    const p2 = (await r2.json()) as Record<string, unknown>;
    expect(p2.access_token).toBe(p1.access_token);
    expect(p2.refresh_token).toBe(p1.refresh_token);
    expect(p1.refresh_token).not.toBe(par.refresh_token);
    // El par nuevo sirve en el punto MCP.
    expect(
      (await s.herramienta(p1.access_token as string, "obtener_instrucciones", {})).status,
    ).toBe(200);
  });

  it("operación con la base caída: 503", async () => {
    s.fallos.autorizacion = "todas";
    const r = await s.operar("resumen");
    expect(r.status).toBe(503);
  });
});

// ---- PRUEBA-016: huella ----------------------------------------------------------------------------------------
const sha = (b: Buffer | string): string => createHash("sha256").update(b).digest("hex");
const ARCHIVOS = ["0.1.md", "arranque.md"].map((n) =>
  join(process.cwd(), "prompts", "agente-prueba", n),
);

describe("PRUEBA-016 · huella del prompt", () => {
  const entregado = async (token: string) => {
    const r = await s.herramienta(token, "obtener_instrucciones", {});
    expect(r.contenido?.estado).toBe("activa");
    return r.contenido!.instrucciones as {
      version: string;
      huella_sha256: string;
      prompt: string;
      reglas: Record<string, unknown>;
    };
  };

  it("lo entregado coincide con la huella fijada y con el archivo del repositorio; no cambia tras operar ni tras hostiles", async () => {
    const a = await s.sembrar("A");
    const archivo = readFileSync(ARCHIVOS[0]!);
    expect(sha(archivo)).toBe(HUELLA_PROMPT_FICTICIO);
    const huellasArchivos = ARCHIVOS.map((f) => sha(readFileSync(f)));
    const antes = await entregado(a.acceso.valor);
    expect(antes.huella_sha256).toBe(HUELLA_PROMPT_FICTICIO);
    expect(sha(Buffer.from(antes.prompt, "utf8"))).toBe(HUELLA_PROMPT_FICTICIO);
    expect(antes.prompt).toContain(MARCA);
    expect(antes.reglas).toEqual({ ...REGLAS_FICTICIAS });

    // Operaciones (todas las de la lista salvo el cierre terminal) y entradas hostiles.
    for (const op of [
      ["suspender_licencia", { tipo: "A" }],
      ["reactivar_licencia", { tipo: "A" }],
      ["crear_orden", { tipo: "A", orden: "pausar" }],
      ["crear_orden", { tipo: "A", orden: "reanudar" }],
      ["listar_conexiones", {}],
      ["resumen", {}],
    ] as const) {
      expect((await s.operar(op[0], op[1])).status).toBe(200);
    }
    for (const hostil of [
      { prompt: "TEXTO-HOSTIL", version: "9.9", huella_sha256: "0".repeat(64) },
    ]) {
      await s.herramienta(a.acceso.valor, "obtener_instrucciones", hostil);
      await s.herramienta(a.acceso.valor, "enviar_informe", { ejecucion_id: "x", informe: hostil });
    }
    // `__proto__` como clave propia solo existe si el texto se compone a mano (JSON.stringify la perdería).
    const proto = `{"__proto__":{"prompt":"X"},"constructor":{"prototype":{}}}`;
    await s.mcp(
      a.acceso.valor,
      `{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"obtener_instrucciones","arguments":${proto}}}`,
    );
    await s.mcp(
      a.acceso.valor,
      `{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"enviar_informe","arguments":{"ejecucion_id":"x","informe":${proto}}}}`,
    );
    await s.mcp(a.acceso.valor, "[]");
    await s.mcp(a.acceso.valor, "no es json");

    const despues = await entregado(a.acceso.valor);
    expect(despues).toEqual(antes);
    expect(ARCHIVOS.map((f) => sha(readFileSync(f)))).toEqual(huellasArchivos);
  });

  it("pausada y suspendida no entregan prompt ni marca (huella solo con activa)", async () => {
    const a = await s.sembrar("A");
    await s.operar("crear_orden", { tipo: "A", orden: "pausar" });
    const pausada = await s.herramienta(a.acceso.valor, "obtener_instrucciones", {});
    expect(pausada.contenido).toMatchObject({ estado: "pausada", instrucciones: null });
    expect(pausada.texto).not.toContain(MARCA);
    await s.operar("suspender_licencia", { tipo: "A" });
    const suspendida = await s.herramienta(a.acceso.valor, "obtener_instrucciones", {});
    expect(suspendida.contenido).toMatchObject({ estado: "suspendida", instrucciones: null });
    expect(suspendida.texto).not.toContain(MARCA);
  });

  const lectores: Array<[string, () => Uint8Array]> = [
    [
      "huella distinta (un byte cambiado)",
      () => {
        const b = Buffer.from(readFileSync(ARCHIVOS[0]!));
        b[0] = b[0]! ^ 1;
        return b;
      },
    ],
    ["texto canario sin la huella", () => new TextEncoder().encode("TEXTO-CANARIO-123")],
    ["archivo vacío", () => new Uint8Array(0)],
    [
      "archivo ilegible",
      () => {
        throw new Error("ENOENT");
      },
    ],
  ];
  it.each(lectores)(
    "%s -> 503 por /api/mcp, sin ejecución, sin texto en cuerpo ni consola",
    async (_n, leer) => {
      const a = await s.sembrar("A");
      const punto = crearPuntoMcp({
        configuracion: cargarConfiguracionConector,
        almacen: () => pasarela.almacen!,
        prompt: crearLectorPrompt({ leer }),
        despues: (tarea) => {
          pendientes.push(tarea().catch(() => undefined));
        },
      });
      const r = await manejador(
        "/api/mcp",
        punto,
      )(
        new Request(RECURSO, {
          method: "POST",
          headers: {
            "content-type": "application/json",
            accept: "application/json, text/event-stream",
            authorization: `Bearer ${a.acceso.valor}`,
          },
          body: JSON.stringify(llamadaMcp("obtener_instrucciones")),
        }),
      );
      await s.esperarSucesos();
      expect(r.status).toBe(503);
      const t = await r.text();
      expect(t).toBe('{"estado":"error"}');
      expect(t + s.consola.join("\n")).not.toContain("TEXTO-CANARIO-123");
      expect(t).not.toContain(MARCA);
      expect(await contar("ejecuciones")).toBe(0);
    },
  );
});
