import { esDesarrollo } from "./lib/plataforma/configuracion";
import { sustituirConsola } from "./lib/registro/salida";

// Gancho de arranque de Next. Fuera de `desarrollo` (o con el entorno ausente: cierre en
// fallo), console.* deja de emitir argumentos libres.
export async function register(): Promise<void> {
  if (!esDesarrollo()) sustituirConsola();
}
