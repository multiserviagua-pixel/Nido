import { URLS_CIMD } from "../../../lib/oauth/cimd";
import { atenderMetadatosServidor } from "../../../lib/oauth/metadatos";
import { manejador } from "../../../lib/plataforma/manejador";

// Metadatos del servidor de autorización (T-108 a, 001; RFC 8414 y 9207). Dinámica: sin configuración
// válida del conector, 503. CIMD en `false` mientras la lista de URLs comprobadas (V-6) esté vacía.
export const dynamic = "force-dynamic";

const RUTA = "/.well-known/oauth-authorization-server";
const atender = (peticion: Request): Response =>
  atenderMetadatosServidor(peticion, { cimd: URLS_CIMD.length > 0 });

export const GET = manejador(RUTA, atender);
export const POST = manejador(RUTA, atender);
export const PUT = manejador(RUTA, atender);
export const PATCH = manejador(RUTA, atender);
export const DELETE = manejador(RUTA, atender);
export const OPTIONS = manejador(RUTA, atender);
