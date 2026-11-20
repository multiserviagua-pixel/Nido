import { CODIGOS, type Codigo } from "../registro/codigos";
import { registrar } from "../registro/registro";
import { ErrorDeAplicacion } from "./errores";
import { enviarEvento } from "./supervision";

type Funcion = (peticion: Request) => Response | Promise<Response>;

const CABECERAS = { "Cache-Control": "no-store" } as const;

// Cierre en fallo (art. 3): sin configuración válida del conector o con el almacén caído, el servicio
// no está disponible (503); el resto de errores, 500. Mismo cuerpo fijo en los dos casos.
const NO_DISPONIBLES: readonly Codigo[] = [
  "configuracion_conector_invalida",
  "almacen_no_disponible",
];

function respuestaDeError(codigo: Codigo): Response {
  return new Response('{"estado":"error"}', {
    status: NO_DISPONIBLES.includes(codigo) ? 503 : 500,
    headers: { ...CABECERAS, "Content-Type": "application/json" },
  });
}

// El código se comprueba en ejecución: solo vale si está en la lista cerrada.
export function codigoDeError(error: unknown): Codigo {
  return error instanceof ErrorDeAplicacion && CODIGOS.includes(error.codigo)
    ? error.codigo
    : "error_no_controlado";
}

function metodoDe(peticion: Request | undefined): string | undefined {
  try {
    return peticion?.method;
  } catch {
    return undefined;
  }
}

// Envuelve un manejador de ruta: captura todo, registra solo el código y la plantilla de ruta
// (la fija quien escribe la ruta, nunca la pedida) y responde 500 genérico.
export function manejador(ruta: string, funcion: Funcion): Funcion {
  return async (peticion) => {
    try {
      return await funcion(peticion);
    } catch (error) {
      const codigo = codigoDeError(error);
      registrar("error", codigo, ruta);
      // Sin esperar: no retrasa ni cambia la respuesta. Nunca rechaza (supervision.ts).
      void enviarEvento({ ruta, codigo, metodo: metodoDe(peticion) });
      return respuestaDeError(codigo);
    }
  };
}

// Método no admitido: 405 sin leer la petición.
export function noPermitido(ruta: string, permitidos: string): Funcion {
  return manejador(
    ruta,
    () => new Response(null, { status: 405, headers: { ...CABECERAS, Allow: permitidos } }),
  );
}
