// T-108 (e) (001): `src/app/api/operacion/route.ts` por la capa HTTP (`manejador.ts`): producción 404,
// configuración inválida y almacén caído 503, nunca 500 (art. 3). Sin red ni base: el rol de gestión
// se sustituye por un doble que cuenta las llamadas.
import { createHash, randomBytes } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Forma exacta de `operar_resumen` (autorizacion.ts valida claves y valores).
const RESUMEN = vi.hoisted(() => ({
  resultado: "resumen",
  cerrada: false,
  licencias: [{ tipo: "A", estado: "activa" }],
  conexiones: { total: 0, activas: 0, revocadas: 0 },
  ordenes: { pendiente: 0, entregada: 0, confirmada: 0, anulada: 0 },
  ejecuciones: { total: 0, cerradas: 0 },
  informes: 0,
  sucesos: { total: 0, correcto: 0, rechazado: 0, error: 0 },
  protocolos: { "2025-11-25": 0, "2026-07-28": 0, otra: 0 },
  p95_ms: { obtener_instrucciones: null, enviar_informe: null, confirmar_orden: null },
}));
const estado = vi.hoisted(() => ({ llamadas: 0, caido: true }));
vi.mock("../../../src/lib/supabase/autorizacion", async (original) => {
  const real = await original<typeof import("../../../src/lib/supabase/autorizacion")>();
  return {
    ...real,
    autorizacionDelConector: () =>
      real.crearAutorizacion({
        llamar: () => {
          estado.llamadas++;
          return estado.caido ? Promise.reject(new Error("caído")) : Promise.resolve(RESUMEN);
        },
      }),
  };
});

const URL_PUBLICA = "http://localhost:3000";
const CREDENCIAL = "hia_op_" + randomBytes(32).toString("base64url");
const urlBd = (rol: string): string =>
  ["postgres", "://", `${rol}.ref1`, ":", randomBytes(12).toString("hex"), "@"]
    .concat(["agrupador.ejemplo.invalid", ":6543", "/postgres"])
    .join("");

function entorno(valor: string, valido = true): void {
  vi.stubEnv("ENTORNO", valor);
  vi.stubEnv("NODE_ENV", "development");
  for (const n of ["VERCEL", "VERCEL_ENV", "VERCEL_REGION", "VERCEL_URL", "SUPERVISION_DSN"]) {
    vi.stubEnv(n, undefined);
  }
  vi.stubEnv("URL_PUBLICA", URL_PUBLICA);
  vi.stubEnv("CONECTOR_SECRETO", valido ? randomBytes(32).toString("base64url") : "corto");
  vi.stubEnv("CONECTOR_BD_URL", urlBd("conector_prueba_mcp"));
  vi.stubEnv("AUTORIZACION_BD_URL", urlBd("conector_prueba_gestion"));
  vi.stubEnv("OPERACION_HUELLA", createHash("sha256").update(CREDENCIAL, "utf8").digest("hex"));
}
beforeEach(() => {
  estado.llamadas = 0;
  estado.caido = true;
});
afterEach(() => vi.unstubAllEnvs());

const post = () =>
  new Request(`${URL_PUBLICA}/api/operacion`, {
    method: "POST",
    headers: { authorization: `Bearer ${CREDENCIAL}`, "content-type": "application/json" },
    body: JSON.stringify({ operacion: "resumen" }),
  });

describe("/api/operacion por manejador.ts", () => {
  it("es dinámica y exporta todos los métodos por la misma tubería", async () => {
    entorno("desarrollo");
    const ruta = await import("../../../src/app/api/operacion/route");
    expect(ruta.dynamic).toBe("force-dynamic");
    for (const m of ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD"] as const) {
      expect(typeof ruta[m]).toBe("function");
    }
  });

  it("con ENTORNO=produccion: 404, y no se lee la configuración (que además no vale) ni se llama a la base", async () => {
    entorno("produccion", false);
    const ruta = await import("../../../src/app/api/operacion/route");
    for (const m of [ruta.POST, ruta.GET, ruta.DELETE]) {
      const r = await m(post());
      expect(r.status).toBe(404);
    }
    expect(estado.llamadas).toBe(0);
  });

  // Mismo predicado de entorno que la configuración del conector (docs/operacion/entornos.md:53):
  // la preproducción real vive con VERCEL=1 y VERCEL_ENV production o preview; lo que la distingue
  // de la producción es ENTORNO=preproduccion. `leerEntorno()` devolvía undefined con
  // VERCEL_ENV=production y dejaba la ruta cerrada también en preproducción (MAYOR-1 del revisor).
  it.each(["production", "preview"])(
    "preproducción real (ENTORNO=preproduccion, VERCEL=1, VERCEL_ENV=%s): la ruta opera",
    async (vercelEnv) => {
      entorno("preproduccion");
      vi.stubEnv("VERCEL", "1");
      vi.stubEnv("VERCEL_ENV", vercelEnv);
      vi.stubEnv("VERCEL_REGION", "arn1");
      vi.stubEnv("URL_PUBLICA", "https://c.ejemplo.test");
      vi.stubEnv("CONECTOR_BD_URL", urlBd("conector_prueba_mcp"));
      vi.stubEnv("AUTORIZACION_BD_URL", urlBd("conector_prueba_gestion"));
      estado.caido = false;
      const ruta = await import("../../../src/app/api/operacion/route");
      const r = await ruta.POST(
        new Request("https://c.ejemplo.test/api/operacion", {
          method: "POST",
          headers: {
            authorization: `Bearer ${CREDENCIAL}`,
            "content-type": "application/json",
            "x-vercel-forwarded-for": "203.0.113.7",
          },
          body: JSON.stringify({ operacion: "resumen" }),
        }),
      );
      expect(r.status).not.toBe(404);
    },
  );

  it.each([
    ["ENTORNO=produccion con VERCEL_ENV=production", "produccion", "production"],
    ["ENTORNO=preproduccion con VERCEL_ENV=development", "preproduccion", "development"],
    ["ENTORNO=preproduccion sin VERCEL_ENV", "preproduccion", undefined],
    ["ENTORNO desconocido con VERCEL_ENV=preview", "otra", "preview"],
  ])("sigue en 404: %s", async (_n, ent, vercelEnv) => {
    entorno(ent);
    vi.stubEnv("VERCEL", "1");
    vi.stubEnv("VERCEL_ENV", vercelEnv);
    const ruta = await import("../../../src/app/api/operacion/route");
    expect((await ruta.POST(post())).status).toBe(404);
    expect(estado.llamadas).toBe(0);
  });

  it("configuración inválida: 503 con cuerpo fijo", async () => {
    entorno("desarrollo", false);
    const ruta = await import("../../../src/app/api/operacion/route");
    const r = await ruta.POST(post());
    expect(r.status).toBe(503);
    expect(await r.text()).toBe('{"estado":"error"}');
    expect(estado.llamadas).toBe(0);
  });

  it("almacén caído: 503; con el almacén sano la operación responde 200", async () => {
    entorno("desarrollo");
    const ruta = await import("../../../src/app/api/operacion/route");
    expect((await ruta.POST(post())).status).toBe(503);
    estado.caido = false;
    const r = await ruta.POST(post());
    expect(r.status).toBe(200);
    expect(await r.json()).toEqual({ operacion: "resumen", ...RESUMEN });
  });

  it("otro método: 405 con Allow: POST", async () => {
    entorno("desarrollo");
    const ruta = await import("../../../src/app/api/operacion/route");
    const r = await ruta.GET(new Request(`${URL_PUBLICA}/api/operacion`));
    expect(r.status).toBe(405);
    expect(r.headers.get("allow")).toBe("POST");
  });
});
