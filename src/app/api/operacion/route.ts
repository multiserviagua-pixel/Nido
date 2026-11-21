import { puntoOperacion } from "../../../lib/licencias/operaciones";
import { manejador } from "../../../lib/plataforma/manejador";

// Operaciones de HumanaIA (T-108 e, 001; REQ-017). Con `ENTORNO=produccion` responde 404 antes de leer
// nada; sin configuración válida del conector o con el almacén caído, 503 (manejador). Todos los métodos
// pasan por la misma tubería (404, configuración y 405 se deciden allí). Ruta dinámica.
export const dynamic = "force-dynamic";

const RUTA = "/api/operacion";

export const GET = manejador(RUTA, puntoOperacion);
export const POST = manejador(RUTA, puntoOperacion);
export const PUT = manejador(RUTA, puntoOperacion);
export const PATCH = manejador(RUTA, puntoOperacion);
export const DELETE = manejador(RUTA, puntoOperacion);
export const OPTIONS = manejador(RUTA, puntoOperacion);
export const HEAD = manejador(RUTA, puntoOperacion);
