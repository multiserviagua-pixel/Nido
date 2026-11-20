import type { Configuracion } from "./configuracion";
import { ErrorDeAplicacion } from "./errores";

export const REGION_PERMITIDA = "arn1";

// Fuera de `desarrollo`, la función debe correr en arn1 (Estocolmo); sin región, se deniega.
export function comprobarRegion(configuracion: Configuracion): void {
  if (configuracion.entorno === "desarrollo") return;
  if (configuracion.vercelRegion !== REGION_PERMITIDA) {
    throw new ErrorDeAplicacion("region_no_permitida");
  }
}
