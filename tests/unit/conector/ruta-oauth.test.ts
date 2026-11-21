// T-110 (a y b) (001): `src/app/oauth/registro/route.ts` y `src/app/oauth/autorizar/route.ts` por la capa
// HTTP (`manejador.ts`): configuración inválida y almacén caído dan 503 con cuerpo fijo, nunca 500 (art. 3).
// Sin red ni base: el rol de gestión se sustituye por un doble que cuenta las llamadas.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { capturarConsola, entornoConector, URL_PUBLICA } from "./apoyo-oauth";

const estado = vi.hoisted(() => ({ llamadas: 0, caido: true, respuesta: undefined as unknown }));
const eventos = vi.hoisted(() => ({ enviados: [] as unknown[] }));
vi.mock("../../../src/lib/plataforma/supervision", () => ({
  enviarEvento: (evento: unknown) => {
    eventos.enviados.push(evento);
    return Promise.resolve();
  },
}));
vi.mock("../../../src/lib/supabase/autorizacion", async (original) => {
  const real = await original<typeof import("../../../src/lib/supabase/autorizacion")>();
  return {
    ...real,
    autorizacionDelConector: () =>
      real.crearAutorizacion({
        llamar: () => {
          estado.llamadas++;
          return estado.caido
            ? Promise.reject(new Error("caído"))
            : Promise.resolve(estado.respuesta);
        },
      }),
  };
});

const CB = "https://claude.ai/api/mcp/auth_callback";
const CLIENTE = "dcr_" + "A".repeat(22);
let consola: string[];
beforeEach(() => {
  estado.llamadas = 0;
  estado.caido = true;
  estado.respuesta = undefined;
  eventos.enviados = [];
  consola = capturarConsola();
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

const registro = (metodo = "POST") =>
  new Request(`${URL_PUBLICA}/oauth/registro`, {
    method: metodo,
    headers: { "content-type": "application/json" },
    body: metodo === "GET" ? undefined : JSON.stringify({ redirect_uris: [CB] }),
  });
const autorizar = (metodo = "GET") =>
  new Request(
    `${URL_PUBLICA}/oauth/autorizar?` +
      new URLSearchParams({
        client_id: CLIENTE,
        redirect_uri: CB,
        response_type: "code",
        code_challenge: "A".repeat(43),
        code_challenge_method: "S256",
        resource: `${URL_PUBLICA}/api/mcp`,
        state: "s",
      }).toString(),
    { method: metodo },
  );

describe("/oauth/registro por manejador.ts", () => {
  it("es dinámica y exporta POST y el resto de métodos por la misma tubería", async () => {
    entornoConector();
    const ruta = await import("../../../src/app/oauth/registro/route");
    expect(ruta.dynamic).toBe("force-dynamic");
    for (const m of ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"] as const) {
      expect(typeof ruta[m]).toBe("function");
    }
  });

  it("configuración inválida: 503 con cuerpo fijo, también con otro método, y sin llamar a la base", async () => {
    entornoConector(false);
    const ruta = await import("../../../src/app/oauth/registro/route");
    for (const r of [await ruta.POST(registro()), await ruta.GET(registro("GET"))]) {
      expect(r.status).toBe(503);
      expect(await r.text()).toBe('{"estado":"error"}');
    }
    expect(estado.llamadas).toBe(0);
    expect(consola.join("\n")).toContain("configuracion_conector_invalida");
  });

  it("almacén caído: 503 con cuerpo fijo (no 500) y no 201", async () => {
    entornoConector();
    const ruta = await import("../../../src/app/oauth/registro/route");
    const r = await ruta.POST(registro());
    expect(r.status).toBe(503);
    expect(await r.text()).toBe('{"estado":"error"}');
    expect(estado.llamadas).toBe(1);
    expect(consola.join("\n")).toContain("almacen_no_disponible");
  });

  it("cerrada y resultado desconocido: nunca 201", async () => {
    entornoConector();
    const ruta = await import("../../../src/app/oauth/registro/route");
    estado.caido = false;
    estado.respuesta = { resultado: "cerrada" };
    expect((await ruta.POST(registro())).status).toBe(503);
    estado.respuesta = { resultado: "registrado", extra: true };
    expect((await ruta.POST(registro())).status).toBe(503);
  });

  it("registrado: 201 con un client_id nuevo", async () => {
    entornoConector();
    const ruta = await import("../../../src/app/oauth/registro/route");
    estado.caido = false;
    estado.respuesta = { resultado: "registrado" };
    const r = await ruta.POST(registro());
    expect(r.status).toBe(201);
    expect(((await r.json()) as { client_id: string }).client_id).toMatch(
      /^dcr_[A-Za-z0-9_-]{22}$/,
    );
  });
});

describe("/oauth/autorizar por manejador.ts", () => {
  it("es dinámica y exporta GET y POST; PUT es 405 con Allow: GET, POST", async () => {
    entornoConector();
    const ruta = await import("../../../src/app/oauth/autorizar/route");
    expect(ruta.dynamic).toBe("force-dynamic");
    expect(typeof ruta.GET).toBe("function");
    expect(typeof ruta.POST).toBe("function");
    const r = await ruta.PUT(autorizar("PUT"));
    expect(r.status).toBe(405);
    expect(r.headers.get("allow")).toBe("GET, POST");
  });

  it("configuración inválida: 503 con cuerpo fijo y sin llamar a la base", async () => {
    entornoConector(false);
    const ruta = await import("../../../src/app/oauth/autorizar/route");
    const r = await ruta.GET(autorizar());
    expect(r.status).toBe(503);
    expect(await r.text()).toBe('{"estado":"error"}');
    expect(estado.llamadas).toBe(0);
  });

  it("almacén caído: pantalla «no disponible» 503 con su CSP (no 500 ni JSON), sin cookie", async () => {
    entornoConector();
    const ruta = await import("../../../src/app/oauth/autorizar/route");
    const r = await ruta.GET(autorizar());
    expect(r.status).toBe(503);
    expect(r.headers.get("content-type")).toContain("text/html");
    expect(r.headers.get("content-security-policy")).toContain("frame-ancestors 'none'");
    expect(await r.text()).toContain("No se ha podido completar");
    expect(r.headers.get("set-cookie")).toBeNull();
    expect(estado.llamadas).toBe(1);
    expect(consola.join("\n")).toContain("almacen_no_disponible");
    // Supervisión (art. 10): una vez, con ruta, código y método; registro de nivel error.
    expect(eventos.enviados).toEqual([
      { ruta: "/oauth/autorizar", codigo: "almacen_no_disponible", metodo: "GET" },
    ]);
    expect(consola.join("\n")).toContain('"nivel":"error","codigo":"almacen_no_disponible"');
  });

  it("solicitud errónea sin base: pantalla 400 con su CSP (la CSP la pone la ruta, no la configuración)", async () => {
    entornoConector();
    const ruta = await import("../../../src/app/oauth/autorizar/route");
    const r = await ruta.GET(new Request(`${URL_PUBLICA}/oauth/autorizar`));
    expect(r.status).toBe(400);
    expect(r.headers.get("content-security-policy")).toContain("frame-ancestors 'none'");
    expect(r.headers.get("content-security-policy")).toContain("form-action 'self'");
    expect(r.headers.get("location")).toBeNull();
    expect(estado.llamadas).toBe(0);
  });

  it("leer_cliente conocido y abrir_solicitud con forma de otra función: 503 y sin cookie", async () => {
    entornoConector();
    const ruta = await import("../../../src/app/oauth/autorizar/route");
    estado.caido = false;
    estado.respuesta = {
      resultado: "conocido",
      origen: "dcr",
      redirect_uris: [CB],
      vigente: true,
    };
    // Primera llamada: leer_cliente; segunda: abrir_solicitud con el mismo doble -> forma inválida -> 503.
    const r = await ruta.GET(autorizar());
    expect(r.status).toBe(503);
    expect(r.headers.get("set-cookie")).toBeNull();
  });
});

const formulario = (campos: Record<string, string>, extra: Record<string, string> = {}) =>
  new Request(`${URL_PUBLICA}/oauth/autorizar`, {
    method: "POST",
    headers: {
      origin: URL_PUBLICA,
      cookie: "__Host-activacion=" + "A".repeat(43),
      "content-type": "application/x-www-form-urlencoded",
      ...extra,
    },
    body: new URLSearchParams(campos).toString(),
  });
const CAMPOS = {
  solicitud: "00000000-0000-4000-8000-000000000000",
  asistente: "claude",
  state: "s",
  codigo: "x",
};

describe("POST /oauth/autorizar por manejador.ts (T-110 c)", () => {
  it("configuración inválida: 503 con cuerpo fijo y sin llamar a la base", async () => {
    entornoConector(false);
    const ruta = await import("../../../src/app/oauth/autorizar/route");
    const r = await ruta.POST(formulario(CAMPOS));
    expect(r.status).toBe(503);
    expect(await r.text()).toBe('{"estado":"error"}');
    expect(estado.llamadas).toBe(0);
  });

  it("almacén caído: pantalla «no disponible» 503 con su CSP (no 500 ni JSON) y sin código de autorización", async () => {
    entornoConector();
    const ruta = await import("../../../src/app/oauth/autorizar/route");
    const r = await ruta.POST(formulario(CAMPOS));
    expect(r.status).toBe(503);
    expect(r.headers.get("content-type")).toContain("text/html");
    expect(r.headers.get("content-security-policy")).toContain("frame-ancestors 'none'");
    expect(await r.text()).toContain("No se ha podido completar");
    expect(r.headers.get("set-cookie")).toBeNull();
    expect(estado.llamadas).toBe(1);
    expect(consola.join("\n")).toContain("almacen_no_disponible");
    expect(eventos.enviados).toEqual([
      { ruta: "/oauth/autorizar", codigo: "almacen_no_disponible", metodo: "POST" },
    ]);
    expect(consola.join("\n")).toContain('"nivel":"error","codigo":"almacen_no_disponible"');
  });

  it("Origin ajeno: pantalla 400 con su CSP y sin llamar a la base", async () => {
    entornoConector();
    const ruta = await import("../../../src/app/oauth/autorizar/route");
    const r = await ruta.POST(formulario(CAMPOS, { origin: "https://evil.example" }));
    expect(r.status).toBe(400);
    expect(r.headers.get("content-security-policy")).toContain("form-action 'self'");
    expect(estado.llamadas).toBe(0);
  });

  it("resultado desconocido o `cerrada`: nunca 200", async () => {
    entornoConector();
    const ruta = await import("../../../src/app/oauth/autorizar/route");
    estado.caido = false;
    for (const respuesta of [{ resultado: "cerrada" }, { resultado: "inventado" }]) {
      estado.respuesta = respuesta;
      const r = await ruta.POST(formulario(CAMPOS));
      expect(r.status).toBe(503);
    }
  });
});

describe("/oauth/token por manejador.ts (T-110 d)", () => {
  const token = (metodo = "POST") =>
    new Request(`${URL_PUBLICA}/oauth/token`, {
      method: metodo,
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body:
        metodo === "GET"
          ? undefined
          : new URLSearchParams({
              grant_type: "refresh_token",
              client_id: CLIENTE,
              refresh_token: "hia_r_" + "A".repeat(43),
            }).toString(),
    });

  it("es dinámica y exporta todos los métodos por la misma tubería", async () => {
    entornoConector();
    const ruta = await import("../../../src/app/oauth/token/route");
    expect(ruta.dynamic).toBe("force-dynamic");
    for (const m of ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"] as const) {
      expect(typeof ruta[m]).toBe("function");
    }
    const r = await ruta.GET(token("GET"));
    expect(r.status).toBe(405);
    expect(r.headers.get("allow")).toBe("POST");
  });

  it("configuración inválida: 503 con cuerpo fijo y sin llamar a la base", async () => {
    entornoConector(false);
    const ruta = await import("../../../src/app/oauth/token/route");
    const r = await ruta.POST(token());
    expect(r.status).toBe(503);
    expect(await r.text()).toBe('{"estado":"error"}');
    expect(estado.llamadas).toBe(0);
  });

  it("almacén caído: 503 con cuerpo fijo (no 500 ni invalid_grant) y sin tokens", async () => {
    entornoConector();
    const ruta = await import("../../../src/app/oauth/token/route");
    const r = await ruta.POST(token());
    expect(r.status).toBe(503);
    expect(await r.text()).toBe('{"estado":"error"}');
    expect(r.headers.get("cache-control")).toBe("no-store");
    expect(estado.llamadas).toBe(1);
    expect(consola.join("\n")).toContain("almacen_no_disponible");
  });

  it("resultado desconocido o `cerrada`: 503, nunca un par", async () => {
    entornoConector();
    const ruta = await import("../../../src/app/oauth/token/route");
    estado.caido = false;
    for (const respuesta of [{ resultado: "cerrada" }, { resultado: "inventado" }]) {
      estado.respuesta = respuesta;
      const r = await ruta.POST(token());
      expect(r.status).toBe(503);
      expect(await r.text()).not.toContain("access_token");
    }
  });
});
