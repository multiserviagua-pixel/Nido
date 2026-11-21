// Metadatos de OAuth del conector (T-108 a, 001; diseño §Servidor de autorización; CAD-002). Todo sale de
// `URL_PUBLICA` (ya validada por `configuracion.ts`), nunca de `Host` ni de ninguna cabecera. Sin CORS,
// siempre `no-store`, rutas dinámicas. Cierre en fallo: sin configuración válida, 503 (manejador) también
// aquí; con método distinto de GET, 405; con otra ruta de recurso, 404. Nada de lo recibido se refleja.
import { cargarConfiguracionConector } from "../plataforma/configuracion";
import { analizarUrl } from "../plataforma/entrada";

export interface MetadatosRecurso {
  readonly resource: string;
  readonly authorization_servers: readonly string[];
  readonly scopes_supported: readonly string[];
  readonly bearer_methods_supported: readonly string[];
}

export function metadatosRecurso(urlPublica: string): MetadatosRecurso {
  return {
    resource: `${urlPublica}/api/mcp`,
    authorization_servers: [urlPublica],
    scopes_supported: ["agente"],
    bearer_methods_supported: ["header"],
  };
}

export interface OpcionesMetadatosServidor {
  /** `true` solo con una URL de documento CIMD comprobada (V-6); mientras no, `false` y se usa DCR. */
  readonly cimd: boolean;
}

export function metadatosServidor(urlPublica: string, opciones: OpcionesMetadatosServidor) {
  return {
    issuer: urlPublica,
    authorization_endpoint: `${urlPublica}/oauth/autorizar`,
    token_endpoint: `${urlPublica}/oauth/token`,
    registration_endpoint: `${urlPublica}/oauth/registro`,
    response_types_supported: ["code"],
    grant_types_supported: ["authorization_code", "refresh_token"],
    code_challenge_methods_supported: ["S256"],
    token_endpoint_auth_methods_supported: ["none"],
    scopes_supported: ["agente", "offline_access"],
    client_id_metadata_document_supported: opciones.cimd,
    authorization_response_iss_parameter_supported: true,
  };
}

const CABECERAS = { "Cache-Control": "no-store" } as const;
const RUTA_RECURSO_SIN = "/.well-known/oauth-protected-resource";
const RUTA_RECURSO_CON = "/.well-known/oauth-protected-resource/api/mcp";

const json = (cuerpo: unknown): Response =>
  new Response(JSON.stringify(cuerpo), {
    status: 200,
    headers: { ...CABECERAS, "Content-Type": "application/json" },
  });

// Configuración primero (503 en todas las rutas del conector, métodos incluidos); después el método.
function previo(peticion: Request): { urlPublica: string } | Response {
  const configuracion = cargarConfiguracionConector();
  if (peticion.method !== "GET" && peticion.method !== "HEAD") {
    return new Response(null, { status: 405, headers: { ...CABECERAS, Allow: "GET, HEAD" } });
  }
  return { urlPublica: configuracion.urlPublica };
}

export function atenderMetadatosRecurso(peticion: Request): Response {
  const p = previo(peticion);
  if (p instanceof Response) return p;
  // Solo la ruta, nunca el servidor: `Host` no entra en ninguna decisión.
  const ruta = analizarUrl(peticion.url).pathname;
  if (ruta !== RUTA_RECURSO_SIN && ruta !== RUTA_RECURSO_CON) {
    return new Response(null, { status: 404, headers: CABECERAS });
  }
  return json(metadatosRecurso(p.urlPublica));
}

export function atenderMetadatosServidor(
  peticion: Request,
  opciones: OpcionesMetadatosServidor,
): Response {
  const p = previo(peticion);
  if (p instanceof Response) return p;
  return json(metadatosServidor(p.urlPublica, opciones));
}
