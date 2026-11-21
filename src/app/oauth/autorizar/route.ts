import { puntoActivar } from "../../../lib/oauth/activacion";
import { puntoAutorizar } from "../../../lib/oauth/peticion";
import { manejador } from "../../../lib/plataforma/manejador";

// Solicitud de autorización (T-110 b y c, 001): `GET` valida la solicitud y muestra la pantalla de
// activación; `POST` activa con el código (Origin propio, cookie y `state` ligados). El resto de métodos pasa
// por la tubería del GET, que comprueba la configuración y responde 405. Sin configuración válida del
// conector o con el almacén caído, 503 (manejador). Dinámica: nunca prerrenderizada.
export const dynamic = "force-dynamic";

const RUTA = "/oauth/autorizar";

export const GET = manejador(RUTA, puntoAutorizar);
export const POST = manejador(RUTA, puntoActivar);
export const PUT = manejador(RUTA, puntoAutorizar);
export const PATCH = manejador(RUTA, puntoAutorizar);
export const DELETE = manejador(RUTA, puntoAutorizar);
export const OPTIONS = manejador(RUTA, puntoAutorizar);
