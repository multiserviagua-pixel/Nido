import { cargarConfiguracion } from "../../../lib/plataforma/configuracion";
import { ErrorDeAplicacion } from "../../../lib/plataforma/errores";
import { manejador, noPermitido } from "../../../lib/plataforma/manejador";
import { comprobarRegion } from "../../../lib/plataforma/region";
import { registrar } from "../../../lib/registro/registro";

const RUTA = "/api/salud";
const PERMITIDOS = "GET, HEAD";
const CABECERAS = { "Cache-Control": "no-store", "Content-Type": "application/json" };

// No lee la petición: valida la configuración y la región; el cuerpo es fijo y de un solo campo.
// Cierre en fallo: cualquier problema de configuración o región da 503 y deja solo el código.
function respuesta(conCuerpo: boolean): Response {
  try {
    comprobarRegion(cargarConfiguracion());
  } catch (error) {
    const codigo =
      error instanceof ErrorDeAplicacion && error.codigo === "region_no_permitida"
        ? "region_no_permitida"
        : "configuracion_invalida";
    registrar("error", codigo, RUTA);
    return new Response(conCuerpo ? '{"estado":"error"}' : null, {
      status: 503,
      headers: CABECERAS,
    });
  }
  return new Response(conCuerpo ? '{"estado":"ok"}' : null, { status: 200, headers: CABECERAS });
}

export const GET = manejador(RUTA, () => respuesta(true));
export const HEAD = manejador(RUTA, () => respuesta(false));
export const POST = noPermitido(RUTA, PERMITIDOS);
export const PUT = noPermitido(RUTA, PERMITIDOS);
export const PATCH = noPermitido(RUTA, PERMITIDOS);
export const DELETE = noPermitido(RUTA, PERMITIDOS);
export const OPTIONS = noPermitido(RUTA, PERMITIDOS);
