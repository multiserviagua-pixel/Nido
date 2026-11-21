// T-108 (a) (001): callbacks.ts, metadatos.ts y rutas .well-known. PRUEBA-001 (V-2; CAD-002; no-store;
// 503 sin configuración; `Host` falso sin efecto). Valores compuestos en ejecución; sin red.
import { randomBytes } from "node:crypto";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  CALLBACKS,
  asistenteDeCallback,
  esCallbackPermitido,
} from "../../../src/lib/oauth/callbacks";
import { metadatosRecurso, metadatosServidor } from "../../../src/lib/oauth/metadatos";

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
beforeEach(() => entorno(true));
afterEach(() => vi.unstubAllEnvs());

const RUTA_RECURSO = "../../../src/app/.well-known/oauth-protected-resource/[[...ruta]]/route";
const RUTA_SERVIDOR = "../../../src/app/.well-known/oauth-authorization-server/route";

describe("callbacks.ts: dos constantes, comparación exacta", () => {
  it("las constantes son las del diseño", () => {
    expect(CALLBACKS).toEqual({
      claude: "https://claude.ai/api/mcp/auth_callback",
      chatgpt: "https://chatgpt.com/connector_platform_oauth_redirect",
    });
  });
  it("solo las dos exactas son permitidas y dan su asistente", () => {
    expect(esCallbackPermitido(CALLBACKS.claude)).toBe(true);
    expect(asistenteDeCallback(CALLBACKS.chatgpt)).toBe("chatgpt");
    expect(asistenteDeCallback(CALLBACKS.claude)).toBe("claude");
  });
  it.each([
    "http://claude.ai/api/mcp/auth_callback",
    "https://claude.ai/api/mcp/auth_callback/",
    "https://claude.ai/api/mcp/auth_callback?x=1",
    "https://claude.ai/api/mcp/auth_callback#f",
    "https://claude.ai/api/mcp/auth_callback/x",
    "https://CLAUDE.ai/api/mcp/auth_callback",
    "https://claude.ai:443/api/mcp/auth_callback",
    "https://evil.test/api/mcp/auth_callback",
    "http://localhost:3000/callback",
    "http://127.0.0.1:8080/callback",
    "",
    " https://claude.ai/api/mcp/auth_callback",
  ])("variante rechazada: %s", (u) => {
    expect(esCallbackPermitido(u)).toBe(false);
    expect(asistenteDeCallback(u)).toBeNull();
  });
  it.each([null, undefined, 3, {}, ["https://claude.ai/api/mcp/auth_callback"]])(
    "un valor que no es texto se rechaza (%#)",
    (v) => {
      expect(esCallbackPermitido(v)).toBe(false);
    },
  );
});

describe("metadatos.ts: campos de CAD-002 desde URL_PUBLICA", () => {
  it("recurso protegido (RFC 9728)", () => {
    expect(metadatosRecurso("https://c.ejemplo.test")).toEqual({
      resource: "https://c.ejemplo.test/api/mcp",
      authorization_servers: ["https://c.ejemplo.test"],
      scopes_supported: ["agente"],
      bearer_methods_supported: ["header"],
    });
  });
  it("servidor de autorización (RFC 8414 y 9207), CIMD en false sin URL comprobada", () => {
    const m = metadatosServidor("https://c.ejemplo.test", { cimd: false });
    expect(m).toEqual({
      issuer: "https://c.ejemplo.test",
      authorization_endpoint: "https://c.ejemplo.test/oauth/autorizar",
      token_endpoint: "https://c.ejemplo.test/oauth/token",
      registration_endpoint: "https://c.ejemplo.test/oauth/registro",
      response_types_supported: ["code"],
      grant_types_supported: ["authorization_code", "refresh_token"],
      code_challenge_methods_supported: ["S256"],
      token_endpoint_auth_methods_supported: ["none"],
      scopes_supported: ["agente", "offline_access"],
      client_id_metadata_document_supported: false,
      authorization_response_iss_parameter_supported: true,
    });
    expect(
      metadatosServidor("https://c.ejemplo.test", { cimd: true })
        .client_id_metadata_document_supported,
    ).toBe(true);
  });
  it("el emisor no lleva barra final", () => {
    expect(metadatosServidor("http://localhost:3000", { cimd: false }).issuer).toBe(
      "http://localhost:3000",
    );
  });
});

const peticion = (ruta: string, extra: Record<string, string> = {}, metodo = "GET") =>
  new Request(`${URL_PUBLICA}${ruta}`, { method: metodo, headers: extra });

describe("rutas .well-known (V-2: son rutas del App Router)", () => {
  it("los archivos de ruta existen donde Next los busca", () => {
    for (const r of [
      "src/app/.well-known/oauth-protected-resource/[[...ruta]]/route.ts",
      "src/app/.well-known/oauth-authorization-server/route.ts",
    ]) {
      expect(existsSync(resolve(r)), r).toBe(true);
    }
  });

  it("recurso protegido: con y sin la ruta del recurso, JSON, no-store, sin CORS", async () => {
    const { GET } = await import(/* @vite-ignore */ RUTA_RECURSO);
    for (const ruta of [
      "/.well-known/oauth-protected-resource",
      "/.well-known/oauth-protected-resource/api/mcp",
    ]) {
      const r = (await GET(peticion(ruta))) as Response;
      expect(r.status, ruta).toBe(200);
      expect(r.headers.get("cache-control")).toBe("no-store");
      expect(r.headers.get("content-type")).toMatch(/^application\/json/);
      expect(r.headers.get("access-control-allow-origin")).toBeNull();
      expect(await r.json()).toEqual(metadatosRecurso(URL_PUBLICA));
    }
  });

  it("recurso protegido: otra ruta del recurso es 404", async () => {
    const { GET } = await import(/* @vite-ignore */ RUTA_RECURSO);
    for (const ruta of [
      "/.well-known/oauth-protected-resource/api/otro",
      "/.well-known/oauth-protected-resource/api/mcp/x",
      "/.well-known/oauth-protected-resource/x",
    ]) {
      const r = (await GET(peticion(ruta))) as Response;
      expect(r.status, ruta).toBe(404);
      expect(r.headers.get("cache-control")).toBe("no-store");
    }
  });

  it("servidor de autorización: campos de CAD-002 y CIMD en false (sin URL comprobada)", async () => {
    const { GET } = await import(/* @vite-ignore */ RUTA_SERVIDOR);
    const r = (await GET(peticion("/.well-known/oauth-authorization-server"))) as Response;
    expect(r.status).toBe(200);
    expect(r.headers.get("cache-control")).toBe("no-store");
    expect(r.headers.get("access-control-allow-origin")).toBeNull();
    const m = (await r.json()) as Record<string, unknown>;
    for (const campo of [
      "issuer",
      "authorization_endpoint",
      "token_endpoint",
      "response_types_supported",
    ]) {
      expect(m[campo], campo).toBeDefined();
    }
    expect(m.client_id_metadata_document_supported).toBe(false);
    expect(m.authorization_response_iss_parameter_supported).toBe(true);
  });

  it("un origen y un Host falsos no cambian nada: todo sale de URL_PUBLICA", async () => {
    const { GET: ga } = await import(/* @vite-ignore */ RUTA_SERVIDOR);
    const { GET: gr } = await import(/* @vite-ignore */ RUTA_RECURSO);
    // La URL de la petición también es falsa: un origen tomado de `new URL(peticion.url)` lo delataría.
    const falsa = (ruta: string) =>
      new Request(`http://evil.invalid${ruta}`, {
        headers: { host: "evil.invalid", "x-forwarded-host": "evil.invalid" },
      });
    const a = (await ga(falsa("/.well-known/oauth-authorization-server"))) as Response;
    const r = (await gr(falsa("/.well-known/oauth-protected-resource/api/mcp"))) as Response;
    expect(a.status).toBe(200);
    expect(r.status).toBe(200);
    const texto = (await a.text()) + (await r.text());
    expect(texto).not.toContain("evil");
    expect(texto).toContain(URL_PUBLICA);
  });

  it("otro método: 405 con Allow y sin leer el cuerpo", async () => {
    const m = await import(/* @vite-ignore */ RUTA_SERVIDOR);
    for (const f of [m.POST, m.PUT, m.PATCH, m.DELETE, m.OPTIONS]) {
      const r = (await f(
        peticion("/.well-known/oauth-authorization-server", {}, "POST"),
      )) as Response;
      expect(r.status).toBe(405);
      expect(r.headers.get("allow")).toBe("GET, HEAD");
      expect(r.headers.get("cache-control")).toBe("no-store");
    }
  });

  it("sin configuración válida del conector: 503 en las dos rutas, también con 405 pendiente", async () => {
    entorno(false);
    const s = await import(/* @vite-ignore */ RUTA_SERVIDOR);
    const { GET: gr } = await import(/* @vite-ignore */ RUTA_RECURSO);
    for (const r of [
      (await s.GET(peticion("/.well-known/oauth-authorization-server"))) as Response,
      (await gr(peticion("/.well-known/oauth-protected-resource"))) as Response,
      (await s.POST(peticion("/.well-known/oauth-authorization-server", {}, "POST"))) as Response,
    ]) {
      expect(r.status).toBe(503);
      expect(r.headers.get("cache-control")).toBe("no-store");
      expect(await r.text()).toBe('{"estado":"error"}');
    }
  });

  it("con ENTORNO=produccion el conector está cerrado: 503", async () => {
    vi.stubEnv("ENTORNO", "produccion");
    const { GET } = await import(/* @vite-ignore */ RUTA_SERVIDOR);
    const r = (await GET(peticion("/.well-known/oauth-authorization-server"))) as Response;
    expect(r.status).toBe(503);
  });

  it("son dinámicas (nunca prerrenderizadas)", async () => {
    const a = await import(/* @vite-ignore */ RUTA_SERVIDOR);
    const b = await import(/* @vite-ignore */ RUTA_RECURSO);
    expect(a.dynamic).toBe("force-dynamic");
    expect(b.dynamic).toBe("force-dynamic");
  });
});
