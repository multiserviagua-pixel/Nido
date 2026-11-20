import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { manejador } from "../../../src/lib/plataforma/manejador";
import { ErrorDeAplicacion } from "../../../src/lib/plataforma/errores";
import { reiniciarLimite } from "../../../src/lib/plataforma/supervision";
import * as salud from "../../../src/app/api/salud/route";
import { onRequestError } from "../../../src/instrumentation";

// PRUEBA-046 (parte b, 002): la supervision esta conectada al manejador, a /api/salud y al
// gancho de errores de Next, con evento cerrado y sin cambiar ni retrasar la respuesta.
// Canarios compuestos en ejecucion.
const MARCA = ["TEXTO", "CANARIO", "conexion"].join("-");
const CLAVE = "0123456789abcdef0123456789abcdef";

let envios: { url: string; cuerpo: string }[];
let puerta: (() => void) | undefined;

function entorno(region: string | undefined): void {
  vi.stubEnv("ENTORNO", "preproduccion");
  vi.stubEnv("SUPERVISION_DSN", `https://${CLAVE}@o7.ingest.de.sentry.io/42`);
  vi.stubEnv("COMMIT_DESPLEGADO", "abcdef1");
  vi.stubEnv("VERCEL", "1");
  vi.stubEnv("VERCEL_ENV", "preview");
  vi.stubEnv("VERCEL_REGION", region);
  vi.stubEnv("VERCEL_URL", undefined);
}

beforeEach(() => {
  reiniciarLimite();
  envios = [];
  puerta = undefined;
  for (const m of ["log", "info", "warn", "error", "debug"] as const) {
    vi.spyOn(console, m).mockImplementation(() => undefined);
  }
  vi.stubGlobal(
    "fetch",
    vi.fn((url: string | URL | Request, init?: RequestInit) => {
      envios.push({ url: String(url), cuerpo: String(init?.body ?? "") });
      // Respuesta que no llega hasta que el test lo decide.
      return new Promise<Response>((ok) => {
        puerta = () => ok(new Response("{}"));
      });
    }),
  );
});
afterEach(() => {
  puerta?.();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

function evento(i = 0): Record<string, unknown> {
  return JSON.parse(envios[i]!.cuerpo.split("\n")[2]!) as Record<string, unknown>;
}

describe("conexion de la supervision (PRUEBA-046, parte b)", () => {
  it("manejador: un error con valor marcado envia un evento cerrado, sin esperar y sin cambiar la respuesta", async () => {
    entorno("arn1");
    const alto = manejador("/api/operacion", () => {
      throw Object.assign(new Error(MARCA), { cause: MARCA });
    });
    const r = await alto(
      new Request(`http://localhost/api/${MARCA}?q=${MARCA}`, { method: "POST", body: MARCA }),
    );
    // El envio sigue colgado y la respuesta ya ha salido, identica a la de siempre.
    expect(r.status).toBe(500);
    expect(await r.text()).toBe('{"estado":"error"}');
    expect(envios).toHaveLength(1);
    expect(envios[0]!.url).toBe("https://o7.ingest.de.sentry.io/api/42/envelope/");
    expect(envios[0]!.cuerpo.toLowerCase()).not.toContain(MARCA.toLowerCase());
    expect(envios[0]!.cuerpo).not.toContain(CLAVE);
    const e = evento();
    expect(e.transaction).toBe("/api/operacion");
    expect(e.tags).toEqual({
      ruta: "/api/operacion",
      codigo: "error_no_controlado",
      metodo: "POST",
    });
  });

  it("manejador: el codigo de un ErrorDeAplicacion sale como codigo; ruta no plantilla, como desconocida", async () => {
    entorno("arn1");
    const alto = manejador(`/api/${MARCA}`, () => {
      throw new ErrorDeAplicacion("almacen_no_disponible");
    });
    await alto(new Request("http://localhost/x"));
    expect(envios).toHaveLength(1);
    expect((evento().tags as Record<string, string>).codigo).toBe("almacen_no_disponible");
    expect(evento().transaction).toBe("/desconocida");
    expect(envios[0]!.cuerpo.toLowerCase()).not.toContain(MARCA.toLowerCase());
  });

  it("manejador: sin error no se envia nada", async () => {
    entorno("arn1");
    await manejador("/api/operacion", () => new Response("ok"))(new Request("http://localhost/x"));
    expect(envios).toHaveLength(0);
  });

  it("/api/salud: el 503 por region envia su codigo y la respuesta no cambia", async () => {
    entorno("iad1");
    const r = await salud.GET(new Request("http://localhost/api/salud"));
    expect(r.status).toBe(503);
    expect(await r.text()).toBe('{"estado":"error"}');
    expect(envios).toHaveLength(1);
    expect(evento().tags).toEqual({
      ruta: "/api/salud",
      codigo: "region_no_permitida",
      metodo: "GET",
    });
  });

  it("/api/salud: el 200 no envia nada", async () => {
    entorno("arn1");
    const r = await salud.GET(new Request("http://localhost/api/salud"));
    expect(r.status).toBe(200);
    expect(envios).toHaveLength(0);
  });

  it("onRequestError usa routePath y no la ruta pedida ni el mensaje", async () => {
    entorno("arn1");
    vi.stubEnv("ENTORNO", "preproduccion");
    const p = onRequestError(
      Object.assign(new Error(MARCA), { digest: MARCA }),
      {
        path: `/api/${MARCA}?q=${MARCA}`,
        method: "GET",
        headers: { authorization: MARCA },
      },
      {
        routerKind: "App Router",
        routePath: "/api/mcp",
        routeType: "route",
        renderSource: undefined,
        revalidateReason: undefined,
        renderType: undefined,
      } as never,
    );
    puerta?.();
    await p;
    expect(envios).toHaveLength(1);
    expect(envios[0]!.cuerpo.toLowerCase()).not.toContain(MARCA.toLowerCase());
    expect(evento().tags).toEqual({
      ruta: "/api/mcp",
      codigo: "error_no_controlado",
      metodo: "GET",
    });
  });

  it.each([
    ["/page", "/"],
    ["/api/salud/route", "/api/salud"],
    ["/otra/page", "/desconocida"],
    ["/api/mcp/route", "/api/mcp"],
  ])("M4: onRequestError con routePath %s sale como %s", async (entrante, esperado) => {
    entorno("arn1");
    const p = onRequestError(
      new Error(MARCA),
      { method: "GET", path: `/${MARCA}` },
      {
        routePath: entrante,
      },
    );
    puerta?.();
    await p;
    expect(envios).toHaveLength(1);
    expect(evento().tags).toMatchObject({ ruta: esperado });
  });
});
