// `EstadoVacio` (diseño 020, «Estados de cada vista», fila `vacio`; REQ-022, REQ-056, V-6). Dice qué
// pasa, qué hacer y, si el usuario puede hacerlo, trae un botón con esa acción. Los dos textos y el
// del botón son textos fijos de `TEXTOS` (tipo `TextoFijo`): no hay hijos ni forma de pasar un
// texto del servidor, y uno que no sea de `TEXTOS` cae en el genérico. La acción la decide la vista
// (si el usuario no puede realizarla, no la pasa); ocultar el botón no es un control de acceso. Lo
// usan `Tabla` y, cuando las migren, las demás piezas con su propio vacío. Sin directiva de cliente:
// vale igual en el servidor (sin acción) y en el navegador.
import { Boton } from "../acciones/Boton";
import { TEXTOS, type TextoFijo } from "../textos";
import { leerAccionDeEstado, leerTextoFijoOr, type AccionDeEstado } from "./logica";

export type PropiedadesDeEstadoVacio = {
  /** Qué pasa («No hay clientes»). */
  readonly titulo: TextoFijo;
  /** Qué hacer o qué esperar a continuación. */
  readonly explicacion: TextoFijo;
  /** El botón, si el usuario puede hacer lo que propone. */
  readonly accion?: AccionDeEstado;
};

/** Caja común de los estados de un bloque (vacío y error). */
export const CAJA_DE_ESTADO =
  "flex min-w-0 flex-col items-start gap-2 rounded-medio border border-borde-decorativo bg-superficie p-4 text-texto";

export function EstadoVacio({ titulo, explicacion, accion }: PropiedadesDeEstadoVacio) {
  const accionLeida = leerAccionDeEstado(accion);
  return (
    <div data-estado="vacio" className={CAJA_DE_ESTADO}>
      <p className="break-words text-cuerpo font-medio text-texto">
        {leerTextoFijoOr(titulo, TEXTOS.estadoVacio.generico.titulo)}
      </p>
      <p className="break-words text-cuerpo-menor text-texto-secundario">
        {leerTextoFijoOr(explicacion, TEXTOS.estadoVacio.generico.explicacion)}
      </p>
      {accionLeida === null ? null : (
        <Boton texto={accionLeida.texto} onClick={() => accionLeida.alPulsar()} />
      )}
    </div>
  );
}
