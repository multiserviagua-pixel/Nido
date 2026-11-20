import { CODIGOS, type Codigo } from "../registro/codigos";
import { registrar } from "../registro/registro";
import { ErrorDeAplicacion } from "./errores";

type Funcion = (peticion: Request) => Response | Promise<Response>;

const CABECERAS = { "Cache-Control": "no-store" } as const;

function respuestaDeError(): Response {
  return new Response('{"estado":"error"}', {
    status: 500,
    headers: { ...CABECERAS, "Content-Type": "application/json" },
  });
}

// Envuelve un manejador de ruta: captura todo, registra solo el código y la plantilla de ruta
// (la fija quien escribe la ruta, nunca la pedida) y responde 500 genérico.
export function manejador(ruta: string, funcion: Funcion): Funcion {
  return async (peticion) => {
    try {
      return await funcion(peticion);
    } catch (error) {
      // El código se comprueba en ejecución: solo se registra si está en la lista cerrada.
      const codigo: Codigo =
        error instanceof ErrorDeAplicacion && CODIGOS.includes(error.codigo)
          ? error.codigo
          : "error_no_controlado";
      registrar("error", codigo, ruta);
      return respuestaDeError();
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
