import { manejador } from "../../../lib/plataforma/manejador";
import { puntoMcp } from "../../../mcp/entrada";

// Punto MCP del conector (T-105 h, 001): toda la tubería vive en `src/mcp/entrada.ts` (pasos 1 a 7 y 10)
// y `src/mcp/servidor.ts` (8 y 9). Todos los métodos pasan por la misma tubería: la configuración del
// conector (503 si no vale) y el 405 se deciden allí y en ese orden. Ruta dinámica, nunca prerrenderizada.
export const dynamic = "force-dynamic";

const RUTA = "/api/mcp";

export const GET = manejador(RUTA, puntoMcp);
export const POST = manejador(RUTA, puntoMcp);
export const PUT = manejador(RUTA, puntoMcp);
export const PATCH = manejador(RUTA, puntoMcp);
export const DELETE = manejador(RUTA, puntoMcp);
export const OPTIONS = manejador(RUTA, puntoMcp);
export const HEAD = manejador(RUTA, puntoMcp);
