import { manejador, noPermitido } from "../../../lib/plataforma/manejador";

const RUTA = "/api/salud";
const PERMITIDOS = "GET, HEAD";
const CABECERAS = { "Cache-Control": "no-store", "Content-Type": "application/json" };

// No lee la petición: el cuerpo es fijo y de un solo campo.
export const GET = manejador(
  RUTA,
  () => new Response('{"estado":"ok"}', { status: 200, headers: CABECERAS }),
);
export const HEAD = manejador(RUTA, () => new Response(null, { status: 200, headers: CABECERAS }));
export const POST = noPermitido(RUTA, PERMITIDOS);
export const PUT = noPermitido(RUTA, PERMITIDOS);
export const PATCH = noPermitido(RUTA, PERMITIDOS);
export const DELETE = noPermitido(RUTA, PERMITIDOS);
export const OPTIONS = noPermitido(RUTA, PERMITIDOS);
