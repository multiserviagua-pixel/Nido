// Herramienta `confirmar_orden` (T-105 f, 001; diseño §Herramientas; REQ-013; arts. 1, 2, 3 y 7).
// Toma solo `orden_id`: la licencia sale del token dentro de la base de datos (art. 2); cualquier
// otro campo se ignora sin leerse. Una orden inexistente, mal formada, ajena, no entregada o anulada
// da `confirmada: false`, igual en todos los casos y sin eco (RD-049). Un `orden_id` que no es uuid
// ni siquiera llega al almacén.
//
// Almacén caído o con forma inesperada -> `error_temporal`. La salida se valida con el contrato.
import { ErrorDeAplicacion } from "../../lib/plataforma/errores";
import type { Almacen } from "../../lib/supabase/almacen";
import { validarSalida } from "../esquemas/contratos";
import type { ContextoHerramienta, ResultadoHerramienta } from "./resultado";

export interface DependenciasConfirmarOrden {
  readonly almacen: Almacen;
}

const RE_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function ordenDe(argumentos: unknown): string | null {
  try {
    if (argumentos === null || typeof argumentos !== "object" || Array.isArray(argumentos)) {
      return null;
    }
    const prototipo = Object.getPrototypeOf(argumentos);
    if (prototipo !== Object.prototype && prototipo !== null) return null;
    const id = (argumentos as Record<string, unknown>).orden_id;
    return typeof id === "string" && RE_UUID.test(id) ? id.toLowerCase() : null;
  } catch {
    return null;
  }
}

export function crearConfirmarOrden(
  dependencias: DependenciasConfirmarOrden,
): (contexto: ContextoHerramienta, argumentos: unknown) => Promise<ResultadoHerramienta> {
  const validar = validarSalida("confirmar_orden");
  const responder = (salida: Record<string, unknown>): ResultadoHerramienta =>
    validar(salida) ? { ok: true, salida } : { ok: false, codigo: "error_interno" };

  return async (contexto, argumentos) => {
    const ordenId = ordenDe(argumentos);
    if (ordenId === null) return responder({ confirmada: false });

    let respuesta;
    try {
      respuesta = await dependencias.almacen.confirmarOrden(
        contexto.tokenHmac,
        contexto.recurso,
        ordenId,
      );
    } catch (error) {
      const codigo = error instanceof ErrorDeAplicacion ? error.codigo : "error_no_controlado";
      if (codigo === "almacen_no_disponible") return { ok: false, codigo: "error_temporal" };
      throw new ErrorDeAplicacion(codigo);
    }

    switch (respuesta.resultado) {
      case "no_autorizado":
        return { ok: false, codigo: "no_autorizado" };
      case "no_confirmada":
        return responder({ confirmada: false });
      case "confirmada":
        return responder({ confirmada: true });
      case "repetida":
        return responder({ confirmada: true, repetida: true });
    }
  };
}
