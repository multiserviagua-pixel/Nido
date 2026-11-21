import { atenderMetadatosRecurso } from "../../../../lib/oauth/metadatos";
import { manejador } from "../../../../lib/plataforma/manejador";

// Metadatos del recurso protegido (T-108 a, 001; RFC 9728), con y sin la ruta del recurso. Ruta
// dinámica, nunca prerrenderizada: sin configuración válida del conector, 503.
export const dynamic = "force-dynamic";

const RUTA = "/.well-known/oauth-protected-resource";

export const GET = manejador(RUTA, atenderMetadatosRecurso);
export const POST = manejador(RUTA, atenderMetadatosRecurso);
export const PUT = manejador(RUTA, atenderMetadatosRecurso);
export const PATCH = manejador(RUTA, atenderMetadatosRecurso);
export const DELETE = manejador(RUTA, atenderMetadatosRecurso);
export const OPTIONS = manejador(RUTA, atenderMetadatosRecurso);
