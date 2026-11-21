// Herramienta `obtener_instrucciones` (T-105 c, 001; diseño §Herramientas; REQ-011, REQ-012).
// Sin argumentos: la licencia y la conexión salen del token dentro de la base de datos (art. 2).
// Siempre devuelve un estado explícito; solo con `activa` añade el prompt, que vive en el repositorio
// (art. 9), con su versión y su huella, y las reglas constantes de la prueba.
//
// Cierre en fallo (art. 3):
// - El prompt se lee (y se comprueba su huella) ANTES de llamar al almacén: si no está o no coincide,
//   se lanza `prompt_no_valido` (503 en la capa HTTP) sin abrir ejecución ni marcar la
//   orden como entregada.
// - Almacén caído o con forma inesperada -> `error_temporal`. Token no válido -> `no_autorizado`.
// - La salida se valida con el contrato; si no valida -> `error_interno`.
import { ErrorDeAplicacion } from "../../lib/plataforma/errores";
import type { Almacen } from "../../lib/supabase/almacen";
import { validarSalida } from "../esquemas/contratos";
import { REGLAS_FICTICIAS, type PromptFicticio } from "../prompt-ficticio";
import type { ContextoHerramienta, ResultadoHerramienta } from "./resultado";

export interface DependenciasObtenerInstrucciones {
  readonly almacen: Almacen;
  /** Lectura única con huella (`obtenerPromptFicticio`); lanza `prompt_no_valido`. */
  readonly prompt: () => PromptFicticio;
}

export function crearObtenerInstrucciones(
  dependencias: DependenciasObtenerInstrucciones,
): (contexto: ContextoHerramienta) => Promise<ResultadoHerramienta> {
  const validar = validarSalida("obtener_instrucciones");
  return async (contexto) => {
    const prompt = dependencias.prompt();
    let respuesta;
    try {
      respuesta = await dependencias.almacen.obtenerInstrucciones(
        contexto.tokenHmac,
        contexto.recurso,
      );
    } catch (error) {
      const codigo = error instanceof ErrorDeAplicacion ? error.codigo : "error_no_controlado";
      if (codigo === "almacen_no_disponible") return { ok: false, codigo: "error_temporal" };
      // Cualquier otro fallo sube con su código cerrado, sin causa ni mensaje.
      throw new ErrorDeAplicacion(codigo);
    }
    if (respuesta.resultado === "no_autorizado") return { ok: false, codigo: "no_autorizado" };

    const salida = {
      estado: respuesta.estado,
      ejecucion_id: respuesta.ejecucion_id,
      orden: respuesta.orden,
      instrucciones:
        respuesta.estado === "activa"
          ? {
              version: prompt.version,
              huella_sha256: prompt.huella,
              prompt: prompt.texto,
              reglas: { ...REGLAS_FICTICIAS },
            }
          : null,
    };
    if (!validar(salida)) return { ok: false, codigo: "error_interno" };
    return { ok: true, salida };
  };
}
