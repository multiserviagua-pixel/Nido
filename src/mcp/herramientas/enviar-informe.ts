// Herramienta `enviar_informe` (T-105 e, 001; diseño §Herramientas; REQ-013; arts. 1, 2, 3 y 7).
// Toma `ejecucion_id` e `informe`; el cliente y la conexión salen del token dentro de la base de datos
// (art. 2). Lo recibido es dato no confiable: del informe y de `comprobaciones` pasan solo las claves
// propias del contrato y las demás se CUENTAN sin leer su valor ni guardar su nombre. Los campos
// ajenos de la raíz de los argumentos (fuera de `ejecucion_id` e `informe`) se ignoran sin leerlos y
// NO se cuentan: el diseño (§Herramientas) cuenta solo los del informe y de `comprobaciones`.
//
// - Un `ejecucion_id` que no es un uuid es `ejecucion_desconocida` sin consultar el almacén.
// - Lo limpio se valida con Ajv; si no valida, el almacén recibe `null` y el recuento, y decide
//   (desconocida antes que inválido; ejecución abierta si es inválido).
// - Ningún error de validación ni valor recibido sale de aquí: solo el recuento y un motivo cerrado.
// - Almacén caído o con forma inesperada -> `error_temporal`. La salida se valida con el contrato.
import { ErrorDeAplicacion } from "../../lib/plataforma/errores";
import type { Almacen } from "../../lib/supabase/almacen";
import { validarInforme, validarSalida } from "../esquemas/contratos";
import { sanearInforme } from "../esquemas/sanear-informe";
import type { ContextoHerramienta, ResultadoHerramienta } from "./resultado";

export interface DependenciasEnviarInforme {
  readonly almacen: Almacen;
}

const RE_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function comoObjeto(argumentos: unknown): Record<string, unknown> | null {
  try {
    if (argumentos === null || typeof argumentos !== "object" || Array.isArray(argumentos)) {
      return null;
    }
    const prototipo = Object.getPrototypeOf(argumentos);
    if (prototipo !== Object.prototype && prototipo !== null) return null;
    return argumentos as Record<string, unknown>;
  } catch {
    return null;
  }
}

export function crearEnviarInforme(
  dependencias: DependenciasEnviarInforme,
): (contexto: ContextoHerramienta, argumentos: unknown) => Promise<ResultadoHerramienta> {
  const validar = validarSalida("enviar_informe");
  const responder = (salida: Record<string, unknown>): ResultadoHerramienta =>
    validar(salida) ? { ok: true, salida } : { ok: false, codigo: "error_interno" };
  const desconocida = (): ResultadoHerramienta =>
    responder({ guardado: false, motivo: "ejecucion_desconocida" });

  return async (contexto, argumentos) => {
    const objeto = comoObjeto(argumentos);
    if (objeto === null) return desconocida();

    let ejecucionId: unknown;
    let informeRecibido: unknown;
    try {
      for (const clave of Object.keys(objeto)) {
        if (clave === "ejecucion_id") ejecucionId = objeto[clave];
        else if (clave === "informe") informeRecibido = objeto[clave];
      }
    } catch {
      return desconocida();
    }
    if (typeof ejecucionId !== "string" || !RE_UUID.test(ejecucionId)) return desconocida();

    const saneado = sanearInforme(informeRecibido);
    const descartados = saneado.descartados;
    const limpio =
      saneado.informe !== null && validarInforme(saneado.informe) ? saneado.informe : null;

    let respuesta;
    try {
      respuesta = await dependencias.almacen.enviarInforme(
        contexto.tokenHmac,
        contexto.recurso,
        ejecucionId.toLowerCase(),
        limpio,
        descartados,
      );
    } catch (error) {
      const codigo = error instanceof ErrorDeAplicacion ? error.codigo : "error_no_controlado";
      if (codigo === "almacen_no_disponible") return { ok: false, codigo: "error_temporal" };
      throw new ErrorDeAplicacion(codigo);
    }

    switch (respuesta.resultado) {
      case "no_autorizado":
        return { ok: false, codigo: "no_autorizado" };
      case "ejecucion_desconocida":
        return desconocida();
      case "informe_invalido":
        return responder({
          guardado: false,
          motivo: "informe_invalido",
          campos_descartados: descartados,
        });
      case "guardado":
        return responder({ guardado: true, campos_descartados: descartados });
      case "repetido":
        return responder({ guardado: true, repetido: true, campos_descartados: descartados });
    }
  };
}
