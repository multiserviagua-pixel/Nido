import { esDesarrollo } from "./lib/plataforma/configuracion";
import { codigoDeError } from "./lib/plataforma/manejador";
import { enviarEvento } from "./lib/plataforma/supervision";
import { sustituirConsola } from "./lib/registro/salida";

// Gancho de arranque de Next. Fuera de `desarrollo` (o con el entorno ausente: cierre en
// fallo), console.* deja de emitir argumentos libres.
export async function register(): Promise<void> {
  if (!esDesarrollo()) sustituirConsola();
}

// Tabla cerrada de equivalencias entre la plantilla que da Next (`routePath`) y las de
// RUTAS_SUPERVISADAS; se aplica antes de comparar y nunca a partir de `request.path`.
function plantillaDeRuta(ruta: string): string {
  if (ruta === "/page") return "/";
  return ruta.endsWith("/route") ? ruta.slice(0, -"/route".length) : ruta;
}

// Errores que Next captura fuera de los manejadores. Solo sale el código y la plantilla de ruta
// (`routePath`, nunca `request.path`); el mensaje, el resumen y las cabeceras se descartan. Se
// espera como mucho 2 s (enviarEvento no rechaza): no hay respuesta que retrasar.
export async function onRequestError(
  error: unknown,
  request: { readonly method?: string; readonly path?: string; readonly headers?: unknown },
  context: { readonly routePath?: string },
): Promise<void> {
  try {
    await enviarEvento({
      ruta: typeof context?.routePath === "string" ? plantillaDeRuta(context.routePath) : "",
      codigo: codigoDeError(error),
      metodo: request?.method,
    });
  } catch {
    /* cierre en fallo: nunca propaga */
  }
}
