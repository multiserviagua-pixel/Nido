// T-112 (e) (001): ciclo completo con el cliente oficial (`@modelcontextprotocol/client` 2.4.0; RD-079), en
// proceso: el cliente llama a los manejadores reales por un `fetch` inyectado, con PGlite detrás y sin red.
// PRUEBA-004 (B), PRUEBA-002 (2 de 2 sesiones: 2025-11-25 y 2026-07-28) y PRUEBA-001 (CAD-002: metadatos y
// reto). El paso que hace la persona (activar con el código) lo hace la prueba por `/api/operacion` y el
// formulario, como lo haría ella en el navegador. Datos ficticios, compuestos en ejecución.
//
// Mutaciones que estas pruebas detectan:
//  - M14: metadatos sin `authorization_response_iss_parameter_supported` o con otro `issuer` -> el cliente
//    oficial o la comprobación de CAD-002 fallan.
//  - M15: la renovación no rota (devuelve el mismo token de renovación) o no admite repetición con el
//    mismo par en 60 s -> la aserción de rotación y de par idéntico falla.
//  - M16 (no aplicada a mano en T-112; pendiente): una de las dos épocas del protocolo no lista las tres herramientas.
import { randomBytes } from "node:crypto";
import {
  Client,
  StreamableHTTPClientTransport,
  UnauthorizedError,
  type OAuthClientProvider,
  type StoredOAuthClientInformation,
  type StoredOAuthTokens,
} from "@modelcontextprotocol/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cerrarAlFinal, ESQUEMA, una } from "../unit/conector/bd/comun";
import {
  CB_CLAUDE,
  generarCodigo,
  informeValido,
  montarServidor,
  peticionToken,
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

let s: Servidor;
beforeEach(async () => {
  s = await montarServidor();
});
afterEach(async () => {
  await s.cerrar();
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

const MARCA = "MARCA-PROMPT-FICTICIO-0001";
const NOMBRES = ["confirmar_orden", "enviar_informe", "obtener_instrucciones"];

/** Proveedor de OAuth en memoria del cliente oficial: guarda lo que el cliente decide guardar. */
class Proveedor implements OAuthClientProvider {
  info: StoredOAuthClientInformation | undefined;
  tokensGuardados: StoredOAuthTokens | undefined;
  urlAutorizacion: URL | undefined;
  private verificador = "";
  guardados = 0;
  get redirectUrl(): string {
    return CB_CLAUDE;
  }
  get clientMetadata() {
    return {
      client_name: "Cliente ficticio de prueba",
      redirect_uris: [CB_CLAUDE],
      grant_types: ["authorization_code", "refresh_token"],
      response_types: ["code"],
      token_endpoint_auth_method: "none",
      scope: "agente offline_access",
    };
  }
  // Claude y ChatGPT envían `state`; el servidor lo exige (diseño §Pantalla: HMAC de `state`).
  state() {
    return "estado-" + randomBytes(8).toString("hex");
  }
  clientInformation() {
    return this.info;
  }
  saveClientInformation(i: StoredOAuthClientInformation) {
    this.info = i;
  }
  tokens() {
    return this.tokensGuardados;
  }
  saveTokens(t: StoredOAuthTokens) {
    this.tokensGuardados = t;
    this.guardados++;
  }
  redirectToAuthorization(u: URL) {
    this.urlAutorizacion = u;
  }
  saveCodeVerifier(v: string) {
    this.verificador = v;
  }
  codeVerifier() {
    return this.verificador;
  }
}

function fetchEnProceso(servidor: Servidor, visitadas: string[]) {
  return (entrada: string | URL | Request, init?: RequestInit): Promise<Response> => {
    const peticion = entrada instanceof Request ? entrada : new Request(String(entrada), init);
    visitadas.push(`${peticion.method} ${new URL(peticion.url).pathname}`);
    return servidor.enviar(peticion);
  };
}

type Modo = { nombre: string; version: string; opciones: ConstructorParameters<typeof Client>[1] };
const MODOS: Modo[] = [
  { nombre: "2025-11-25", version: "2025-11-25", opciones: undefined },
  {
    nombre: "2026-07-28",
    version: "2026-07-28",
    opciones: { versionNegotiation: { mode: { pin: "2026-07-28" } } },
  },
];

/** La persona: abre el enlace de autorización, teclea el código y toma el enlace de vuelta. */
async function activarComoPersona(
  servidor: Servidor,
  url: URL,
): Promise<{ code: string; state: string; iss: string }> {
  const get = await servidor.fetch(url.toString());
  const html = await get.text();
  if (get.status !== 200)
    throw new Error(
      `GET ${url.search} -> ${get.status} ${html.replace(/<[^>]+>/g, " ").slice(0, 300)}`,
    );
  const solicitud = /name="solicitud" value="([^"]+)"/.exec(html)![1]!;
  const cookie = /^__Host-activacion=([^;]+);/.exec(get.headers.get("set-cookie")!)![1]!;
  const state = url.searchParams.get("state")!;
  const codigo = await generarCodigo(servidor, "A");
  const post = await servidor.fetch(`${URL_PUBLICA}/oauth/autorizar`, {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded",
      origin: URL_PUBLICA,
      cookie: `__Host-activacion=${cookie}`,
    },
    body: new URLSearchParams({ solicitud, asistente: "claude", state, codigo }).toString(),
  });
  expect(post.status).toBe(200);
  const pagina = await post.text();
  expect(pagina).toContain("Código aceptado.");
  const href = /href="([^"]*auth_callback[^"]*)"/.exec(pagina)![1]!.replaceAll("&amp;", "&");
  const vuelta = new URL(href);
  return {
    code: vuelta.searchParams.get("code")!,
    state: vuelta.searchParams.get("state")!,
    iss: vuelta.searchParams.get("iss")!,
  };
}

describe("PRUEBA-001 · CAD-002: metadatos y reto", () => {
  it("los dos documentos contienen todos los campos obligatorios y la respuesta sin token remite a ellos", async () => {
    const recurso = await s.fetch(`${URL_PUBLICA}/.well-known/oauth-protected-resource/api/mcp`);
    expect(recurso.status).toBe(200);
    expect(recurso.headers.get("cache-control")).toContain("no-store");
    expect(recurso.headers.get("access-control-allow-origin")).toBeNull();
    const rj = (await recurso.json()) as Record<string, unknown>;
    expect(rj).toMatchObject({
      resource: RECURSO,
      authorization_servers: [URL_PUBLICA],
      scopes_supported: ["agente"],
      bearer_methods_supported: ["header"],
    });

    const as = await s.fetch(`${URL_PUBLICA}/.well-known/oauth-authorization-server`);
    expect(as.status).toBe(200);
    expect(as.headers.get("cache-control")).toContain("no-store");
    expect(as.headers.get("access-control-allow-origin")).toBeNull();
    const aj = (await as.json()) as Record<string, unknown>;
    expect(aj.issuer).toBe(URL_PUBLICA);
    expect(String(aj.issuer).endsWith("/")).toBe(false);
    expect(aj).toMatchObject({
      authorization_endpoint: `${URL_PUBLICA}/oauth/autorizar`,
      token_endpoint: `${URL_PUBLICA}/oauth/token`,
      registration_endpoint: `${URL_PUBLICA}/oauth/registro`,
      response_types_supported: ["code"],
      code_challenge_methods_supported: ["S256"],
      token_endpoint_auth_methods_supported: ["none"],
      authorization_response_iss_parameter_supported: true,
    });
    expect(aj.grant_types_supported).toEqual(
      expect.arrayContaining(["authorization_code", "refresh_token"]),
    );
    expect(aj.scopes_supported).toEqual(expect.arrayContaining(["agente", "offline_access"]));
    // Sin URL comprobada de CIMD, el metadato va en false o ausente: se usa el registro DCR.
    expect(aj.client_id_metadata_document_supported ?? false).toBe(false);

    const sin = await s.mcp(null, { jsonrpc: "2.0", id: 1, method: "tools/list" });
    expect(sin.status).toBe(401);
    expect(sin.headers.get("www-authenticate")).toBe(
      `Bearer resource_metadata="${URL_PUBLICA}/.well-known/oauth-protected-resource/api/mcp", scope="agente"`,
    );
  });

  it("una cabecera Host o X-Forwarded-Host falsa no cambia emisor, recurso ni reto", async () => {
    const falsas = {
      host: "evil.invalid",
      "x-forwarded-host": "evil.invalid",
      "x-forwarded-proto": "http",
    };
    const a = await s.fetch(`${URL_PUBLICA}/.well-known/oauth-authorization-server`, {
      headers: falsas,
    });
    expect(((await a.json()) as { issuer: string }).issuer).toBe(URL_PUBLICA);
    const r = await s.fetch(`${URL_PUBLICA}/.well-known/oauth-protected-resource`, {
      headers: falsas,
    });
    expect(((await r.json()) as { resource: string }).resource).toBe(RECURSO);
    const sin = await s.mcp(null, {}, falsas);
    expect(sin.headers.get("www-authenticate")).not.toContain("evil.invalid");
  });
});

describe.each(MODOS)(
  "PRUEBA-004 (B) y PRUEBA-002: ciclo completo con el cliente oficial, sesión $nombre",
  (modo) => {
    it("descubrimiento, registro, autorización con código, tres herramientas y renovación con rotación", async () => {
      const visitadas: string[] = [];
      const proveedor = new Proveedor();
      const fetchProxy = fetchEnProceso(s, visitadas);
      const transporte = () =>
        new StreamableHTTPClientTransport(new URL(RECURSO), {
          authProvider: proveedor,
          fetch: fetchProxy as unknown as typeof fetch,
        });
      const nuevoCliente = () =>
        new Client({ name: "cliente-ficticio", version: "0.0.0" }, modo.opciones);

      // 1. Primera conexión: 401, descubrimiento, registro (DCR) y enlace de autorización.
      const t1 = transporte();
      await expect(nuevoCliente().connect(t1)).rejects.toBeInstanceOf(UnauthorizedError);
      expect(visitadas.some((v) => v.startsWith("GET /.well-known/oauth-protected-resource"))).toBe(
        true,
      );
      expect(visitadas.some((v) => v === "GET /.well-known/oauth-authorization-server")).toBe(true);
      expect(visitadas).toContain("POST /oauth/registro");
      const url = proveedor.urlAutorizacion!;
      expect(url.origin + url.pathname).toBe(`${URL_PUBLICA}/oauth/autorizar`);
      expect(url.searchParams.get("code_challenge_method")).toBe("S256");
      expect(url.searchParams.get("resource")).toBe(RECURSO);
      expect(url.searchParams.get("redirect_uri")).toBe(CB_CLAUDE);
      expect(proveedor.info?.client_id).toMatch(/^dcr_[A-Za-z0-9_-]{22}$/);
      expect(
        await una<{ n: number }>(s.bd, `select count(*)::int as n from ${ESQUEMA}.clientes_oauth`),
      ).toEqual({ n: 1 });

      // 2. La persona activa con el código; vuelve con `code`, `state` e `iss`.
      const vuelta = await activarComoPersona(s, url);
      expect(vuelta.iss).toBe(URL_PUBLICA);
      expect(vuelta.state).toBe(url.searchParams.get("state"));

      // 3. Canje por el cliente oficial (PKCE y `iss` los comprueba él).
      await t1.finishAuth(vuelta.code, vuelta.iss);
      const t = proveedor.tokensGuardados!;
      expect(t.access_token).toMatch(/^hia_a_[A-Za-z0-9_-]{43}$/);
      expect(t.refresh_token).toMatch(/^hia_r_[A-Za-z0-9_-]{43}$/);
      expect(t.expires_in).toBe(300);

      // 4. Sesión autenticada: listado, tres herramientas.
      const cliente = nuevoCliente();
      await cliente.connect(transporte());
      expect(cliente.getNegotiatedProtocolVersion()).toBe(modo.version);
      const lista = await cliente.listTools();
      expect(lista.tools.map((x) => x.name).sort()).toEqual(NOMBRES);
      for (const x of lista.tools) {
        expect(x.annotations).toMatchObject({ destructiveHint: false, openWorldHint: false });
      }

      const o = await cliente.callTool({ name: "obtener_instrucciones", arguments: {} });
      expect(o.isError).toBeFalsy();
      const so = o.structuredContent as {
        estado: string;
        ejecucion_id: string;
        instrucciones: { prompt: string } | null;
      };
      expect(so.estado).toBe("activa");
      expect(so.instrucciones?.prompt).toContain(MARCA);
      const e = await cliente.callTool({
        name: "enviar_informe",
        arguments: { ejecucion_id: so.ejecucion_id, informe: informeValido() },
      });
      expect(e.structuredContent).toEqual({ guardado: true, campos_descartados: 0 });
      // Orden de la persona -> la siguiente revisión la entrega -> se confirma.
      expect((await s.operar("crear_orden", { tipo: "A", orden: "pausar" })).status).toBe(200);
      const pausada = await cliente.callTool({ name: "obtener_instrucciones", arguments: {} });
      const sp = pausada.structuredContent as { estado: string; orden: { id: string } | null };
      expect(sp.estado).toBe("pausada");
      expect(sp.orden?.id).toMatch(/^[0-9a-f-]{36}$/);
      const c = await cliente.callTool({
        name: "confirmar_orden",
        arguments: { orden_id: sp.orden!.id },
      });
      expect(c.structuredContent).toEqual({ confirmada: true });

      // 5. Renovación con rotación: el acceso caduca (reloj de la base +301 s), el cliente renueva solo.
      await s.bd.reloj.fijar(new Date());
      await s.bd.reloj.avanzar(301_000);
      const antes = { ...t };
      const tras = await cliente.listTools();
      expect(tras.tools).toHaveLength(3);
      const n = proveedor.tokensGuardados!;
      expect(n.access_token).not.toBe(antes.access_token);
      expect(n.refresh_token).not.toBe(antes.refresh_token);
      expect(n.refresh_token).toMatch(/^hia_r_[A-Za-z0-9_-]{43}$/);
      expect(visitadas.filter((v) => v === "POST /oauth/token").length).toBeGreaterThanOrEqual(2);

      // 6. Repetir la renovación vieja 30 s después (dentro de 60 s) da exactamente el mismo par (respuesta perdida).
      await s.bd.reloj.avanzar(30_000);
      const cl = proveedor.info!.client_id;
      const repetida = await s.enviar(
        peticionToken({
          grant_type: "refresh_token",
          refresh_token: antes.refresh_token!,
          client_id: cl,
        }),
      );
      expect(repetida.status).toBe(200);
      const rj = (await repetida.json()) as { access_token: string; refresh_token: string };
      expect(rj.access_token).toBe(n.access_token);
      expect(rj.refresh_token).toBe(n.refresh_token);

      // 7. Pasados los 60 s, el token de renovación viejo se rechaza y revoca la conexión entera.
      await s.bd.reloj.avanzar(31_000); // 61 s desde la rotación
      const vieja = await s.enviar(
        peticionToken({
          grant_type: "refresh_token",
          refresh_token: antes.refresh_token!,
          client_id: cl,
        }),
      );
      expect(vieja.status).toBe(400);
      expect(((await vieja.json()) as { error: string }).error).toBe("invalid_grant");
      expect((await s.herramienta(n.access_token, "obtener_instrucciones", {})).status).toBe(401);
      const conexion = await una<{ motivo_revocacion: string | null }>(
        s.bd,
        `select motivo_revocacion::text from ${ESQUEMA}.conexiones`,
      );
      expect(conexion.motivo_revocacion).toBe("reutilizacion");
      await cliente.close();
    });
  },
);
