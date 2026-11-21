// T-105 (h) (001): `src/app/api/mcp/route.ts` (hito). Las tres herramientas responden por /api/mcp en
// local con tokens sembrados; la ruta usa `manejador.ts` (configuración inválida y almacén caído dan 503,
// nunca 500) y los métodos que no son POST dan 405. El almacén de producto (postgres, rol mcp) se
// sustituye por el de PGlite: no hay red ni base real. La configuración sale de variables de entorno
// de prueba, compuestas en ejecución.
import { createHmac, randomBytes } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { derivarClaves } from "../../../src/lib/oauth/secretos";
import { crearAlmacen, type Almacen } from "../../../src/lib/supabase/almacen";
import { crearAlmacenPglite, crearFabrica } from "../../conector/apoyo/index";
import { abrir, cerrarAlFinal, ESQUEMA, ROL_MCP, sembrar } from "./bd/comun";

cerrarAlFinal();

const estado = vi.hoisted(() => ({ almacen: null as unknown }));
vi.mock("../../../src/lib/supabase/conector", () => ({
  almacenDelConector: () => {
    if (estado.almacen === null) throw new Error("sin almacén de prueba");
    return estado.almacen;
  },
}));

// Prompt ficticio ilegible o con huella distinta (C-2): el lector falla con `prompt_no_valido`.
const prompt = vi.hoisted(() => ({ fallar: false }));
vi.mock("../../../src/mcp/prompt-ficticio", async (original) => {
  const real = await original<typeof import("../../../src/mcp/prompt-ficticio")>();
  const { ErrorDeAplicacion } = await import("../../../src/lib/plataforma/errores");
  return {
    ...real,
    obtenerPromptFicticio: () => {
      if (prompt.fallar) throw new ErrorDeAplicacion("prompt_no_valido");
      return real.obtenerPromptFicticio();
    },
  };
});

const URL_PUBLICA = "http://localhost:3000";
const SECRETO = randomBytes(32).toString("base64url");
const urlBd = (rol: string): string =>
  ["postgres", "://", `${rol}.ref1`, ":", randomBytes(12).toString("hex"), "@"]
    .concat(["agrupador.ejemplo.invalid", ":6543", "/postgres"])
    .join("");

function entorno(valido: boolean): void {
  vi.stubEnv("ENTORNO", "desarrollo");
  vi.stubEnv("NODE_ENV", "development");
  for (const n of ["VERCEL", "VERCEL_ENV", "VERCEL_REGION", "VERCEL_URL", "SUPERVISION_DSN"]) {
    vi.stubEnv(n, undefined);
  }
  vi.stubEnv("URL_PUBLICA", URL_PUBLICA);
  vi.stubEnv("CONECTOR_SECRETO", valido ? SECRETO : "corto");
  vi.stubEnv("CONECTOR_BD_URL", urlBd("conector_prueba_mcp"));
  vi.stubEnv("AUTORIZACION_BD_URL", urlBd("conector_prueba_gestion"));
  vi.stubEnv("OPERACION_HUELLA", randomBytes(32).toString("hex"));
}

beforeEach(() => {
  estado.almacen = null;
  prompt.fallar = false;
  entorno(true);
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

const llamada = (nombre: string, argumentos: unknown) =>
  JSON.stringify({
    jsonrpc: "2.0",
    id: 1,
    method: "tools/call",
    params: { name: nombre, arguments: argumentos },
  });
const peticion = (token: string | null, texto: string) =>
  new Request(`${URL_PUBLICA}/api/mcp`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      accept: "application/json, text/event-stream",
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    body: texto,
  });
const resultado = async (r: Response) => {
  const crudo = await r.text();
  const linea = crudo.split("\n").find((l) => l.startsWith("data: "));
  return (JSON.parse(linea ? linea.slice(6) : crudo) as { result: Record<string, unknown> }).result;
};

describe("/api/mcp (hito de T-105)", () => {
  it("las tres herramientas responden por la ruta con tokens sembrados", async () => {
    const ruta = await import("../../../src/app/api/mcp/route");
    const claves = derivarClaves(SECRETO);
    const fabrica = crearFabrica({
      hmac: (m) => createHmac("sha256", claves.guardado).update(m).digest("hex"),
    });
    const bd = await abrir();
    estado.almacen = crearAlmacen(await crearAlmacenPglite(bd, ROL_MCP));
    const s = await sembrar(bd, "A", "claude", fabrica, `${URL_PUBLICA}/api/mcp`);
    await bd.db.query(`insert into ${ESQUEMA}.ordenes (licencia_id, tipo) values ($1, 'pausar')`, [
      s.licenciaId,
    ]);
    const t = s.acceso.valor;

    const o = await ruta.POST(peticion(t, llamada("obtener_instrucciones", {})));
    expect(o.status).toBe(200);
    const so = (await resultado(o)).structuredContent as {
      ejecucion_id: string;
      orden: { id: string };
    };
    const informe = {
      estado: "ok",
      modo: "conversacion",
      asistente: "claude",
      almacenamiento: "drive",
      version_prompt: "0.1",
      frecuencia_horas: 24,
      tratados: 1,
      sin_tratar: 0,
      borradores: 0,
      documentos: 0,
      facturas_pendientes: 0,
      urgentes: 0,
      comprobaciones: { correo: true, almacenamiento: true, contexto: true, registro: true },
      problemas: [],
    };
    const e = await ruta.POST(
      peticion(t, llamada("enviar_informe", { ejecucion_id: so.ejecucion_id, informe })),
    );
    expect((await resultado(e)).structuredContent).toEqual({
      guardado: true,
      campos_descartados: 0,
    });
    const c = await ruta.POST(peticion(t, llamada("confirmar_orden", { orden_id: so.orden.id })));
    expect((await resultado(c)).structuredContent).toEqual({ confirmada: true });
  });

  it("sin token: 401 con el reto, y la ruta no consulta el almacén de producto", async () => {
    const ruta = await import("../../../src/app/api/mcp/route");
    const r = await ruta.POST(peticion(null, "{}"));
    expect(r.status).toBe(401);
    expect(r.headers.get("www-authenticate")).toBe(
      `Bearer resource_metadata="${URL_PUBLICA}/.well-known/oauth-protected-resource/api/mcp", scope="agente"`,
    );
  });

  it.each(["GET", "PUT", "PATCH", "DELETE", "OPTIONS"] as const)(
    "%s: 405 con Allow: POST",
    async (metodo) => {
      const ruta = await import("../../../src/app/api/mcp/route");
      const r = await ruta[metodo](
        new Request(`${URL_PUBLICA}/api/mcp`, {
          method: metodo,
          body: metodo === "GET" ? null : "x",
        }),
      );
      expect(r.status).toBe(405);
      expect(r.headers.get("allow")).toBe("POST");
    },
  );

  it("configuración del conector inválida: 503 en todos los métodos (no 500)", async () => {
    entorno(false);
    const ruta = await import("../../../src/app/api/mcp/route");
    for (const metodo of ["POST", "GET", "PUT", "DELETE"] as const) {
      const r = await ruta[metodo](
        new Request(`${URL_PUBLICA}/api/mcp`, {
          method: metodo,
          body: metodo === "POST" ? "{}" : metodo === "GET" ? null : "x",
        }),
      );
      expect(r.status).toBe(503);
      expect(await r.text()).toBe('{"estado":"error"}');
    }
  });

  it("almacén caído al validar el token: 503", async () => {
    const ruta = await import("../../../src/app/api/mcp/route");
    const caido: Almacen = crearAlmacen({ llamar: () => Promise.reject(new Error("caído")) });
    estado.almacen = caido;
    const falso = `hia_a_${randomBytes(32).toString("base64url")}`;
    const r = await ruta.POST(peticion(falso, llamada("obtener_instrucciones", {})));
    expect(r.status).toBe(503);
  });

  it("el almacén de producto no se puede crear (error inesperado): 500 genérico, no 503", async () => {
    const ruta = await import("../../../src/app/api/mcp/route");
    const falso = `hia_a_${randomBytes(32).toString("base64url")}`;
    const r = await ruta.POST(peticion(falso, "{}"));
    expect(r.status).toBe(500);
  });

  it("prompt ficticio no válido: 503, {estado:error}, no-store, código propio y ninguna ejecución", async () => {
    const ruta = await import("../../../src/app/api/mcp/route");
    const claves = derivarClaves(SECRETO);
    const fabrica = crearFabrica({
      hmac: (m) => createHmac("sha256", claves.guardado).update(m).digest("hex"),
    });
    const bd = await abrir();
    estado.almacen = crearAlmacen(await crearAlmacenPglite(bd, ROL_MCP));
    const s = await sembrar(bd, "A", "claude", fabrica, `${URL_PUBLICA}/api/mcp`);
    prompt.fallar = true;
    const salida: string[] = [];
    for (const metodo of ["log", "error", "warn", "info", "debug"] as const) {
      vi.spyOn(console, metodo).mockImplementation((...a: unknown[]) => {
        salida.push(a.map((x) => (typeof x === "string" ? x : JSON.stringify(x))).join(" "));
      });
    }
    const r = await ruta.POST(peticion(s.acceso.valor, llamada("obtener_instrucciones", {})));
    expect(r.status).toBe(503);
    expect(r.headers.get("cache-control")).toBe("no-store");
    expect(await r.text()).toBe('{"estado":"error"}');
    const registro = salida.join(" | ");
    expect(registro).toContain("prompt_no_valido");
    expect(registro).not.toContain("configuracion_conector_invalida");
    const e = await bd.db.query<{ n: number }>(
      `select count(*)::int as n from ${ESQUEMA}.ejecuciones`,
    );
    expect(e.rows[0]?.n).toBe(0);
  });

  it("prompt con huella distinta y texto canario: 503, sin el canario en cuerpo, consola ni sucesos", async () => {
    const { crearPuntoMcp } = await import("../../../src/mcp/entrada");
    const { crearLectorPrompt } = await vi.importActual<
      typeof import("../../../src/mcp/prompt-ficticio")
    >("../../../src/mcp/prompt-ficticio");
    const { manejador } = await import("../../../src/lib/plataforma/manejador");
    const { cargarConfiguracionConector } =
      await import("../../../src/lib/plataforma/configuracion");
    const claves = derivarClaves(SECRETO);
    const fabrica = crearFabrica({
      hmac: (m) => createHmac("sha256", claves.guardado).update(m).digest("hex"),
    });
    const bd = await abrir();
    estado.almacen = crearAlmacen(await crearAlmacenPglite(bd, ROL_MCP));
    const s = await sembrar(bd, "A", "claude", fabrica, `${URL_PUBLICA}/api/mcp`);
    const salida: string[] = [];
    for (const metodo of ["log", "error", "warn", "info", "debug"] as const) {
      vi.spyOn(console, metodo).mockImplementation((...a: unknown[]) => {
        salida.push(a.map((x) => (typeof x === "string" ? x : JSON.stringify(x))).join(" "));
      });
    }
    const tareas: Promise<void>[] = [];
    const punto = crearPuntoMcp({
      configuracion: cargarConfiguracionConector,
      almacen: () => estado.almacen as Almacen,
      prompt: crearLectorPrompt({ leer: () => new TextEncoder().encode("TEXTO-CANARIO-123") }),
      despues: (tarea) => {
        tareas.push(tarea().catch(() => undefined));
      },
    });
    const r = await manejador(
      "/api/mcp",
      punto,
    )(peticion(s.acceso.valor, llamada("obtener_instrucciones", {})));
    await Promise.all(tareas);
    expect(r.status).toBe(503);
    const cuerpo = await r.text();
    expect(cuerpo).toBe('{"estado":"error"}');
    expect(cuerpo).not.toContain("TEXTO-CANARIO-123");
    expect(salida.join(" | ")).not.toContain("TEXTO-CANARIO-123");
    const sucesos = await bd.db.query<{ t: string }>(
      `select s::text as t from ${ESQUEMA}.sucesos s`,
    );
    expect(sucesos.rows.map((f) => f.t).join(" | ")).not.toContain("TEXTO-CANARIO-123");
    const e = await bd.db.query<{ n: number }>(
      `select count(*)::int as n from ${ESQUEMA}.ejecuciones`,
    );
    expect(e.rows[0]?.n).toBe(0);
  });
});
