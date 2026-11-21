import { manejador } from "../../../lib/plataforma/manejador";
import { puntoToken } from "../../../lib/oauth/tokens";

// Punto de tokens (T-110 d, 001): código de autorización con PKCE S256 y renovación con par de gracia.
// Solo POST; los demás métodos pasan por la misma tubería, que comprueba la configuración y responde 405.
// Sin configuración válida del conector o con el almacén caído, 503 (manejador). Sin CORS. Dinámica.
export const dynamic = "force-dynamic";

const RUTA = "/oauth/token";

export const POST = manejador(RUTA, puntoToken);
export const GET = manejador(RUTA, puntoToken);
export const PUT = manejador(RUTA, puntoToken);
export const PATCH = manejador(RUTA, puntoToken);
export const DELETE = manejador(RUTA, puntoToken);
export const OPTIONS = manejador(RUTA, puntoToken);
