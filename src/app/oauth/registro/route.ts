import { puntoRegistro } from "../../../lib/oauth/clientes";
import { manejador } from "../../../lib/plataforma/manejador";

// Registro dinámico de clientes (T-110 a, 001; RFC 7591). Solo POST; los demás métodos pasan por la misma
// tubería, que responde 405 tras comprobar la configuración. Sin configuración válida del conector o con
// el almacén caído, 503 (manejador). Dinámica: nunca prerrenderizada.
export const dynamic = "force-dynamic";

const RUTA = "/oauth/registro";

export const POST = manejador(RUTA, puntoRegistro);
export const GET = manejador(RUTA, puntoRegistro);
export const PUT = manejador(RUTA, puntoRegistro);
export const PATCH = manejador(RUTA, puntoRegistro);
export const DELETE = manejador(RUTA, puntoRegistro);
export const OPTIONS = manejador(RUTA, puntoRegistro);
