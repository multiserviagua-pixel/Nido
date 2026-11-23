// `EstadoSinPermiso` (diseño 020, «Estados de cada vista», «Sin permiso», y regla V-1; REQ-027,
// REQ-077; artículos 2 y 3). Es el estado de la vista entera cuando el recurso está denegado, no
// existe o es de un área de otra fase: el MISMO texto y el MISMO marcado en los tres casos, para que
// nada distinga uno de otro. Por eso no tiene propiedad para el nombre, el identificador, el motivo
// ni la dirección pedida: lo único que admite es la ruta del Resumen de su dashboard, que no depende
// del recurso, y solo si es interna. Se pinta dentro del armazón (lo hace el `not-found` único de
// cada dashboard). Sin directiva de cliente: lo usa un componente de servidor.
import { TEXTOS } from "../textos";
import { leerRutaDelResumen } from "./logica";

export type PropiedadesDeEstadoSinPermiso = {
  /** Ruta del Resumen del dashboard (`/admin` por defecto). */
  readonly rutaDelResumen?: string;
};

export function EstadoSinPermiso({ rutaDelResumen }: PropiedadesDeEstadoSinPermiso = {}) {
  // Solo se lee `rutaDelResumen`: cualquier otra propiedad que llegue se ignora.
  return (
    <section
      data-estado="sin-permiso"
      className="flex min-w-0 flex-col items-start gap-2 rounded-medio border border-borde-decorativo bg-superficie p-4 text-texto"
    >
      <h2 className="text-subtitulo font-seminegrita text-texto">{TEXTOS.sinPermiso.titulo}</h2>
      <p className="text-cuerpo-menor text-texto-secundario">{TEXTOS.sinPermiso.explicacion}</p>
      <a
        href={leerRutaDelResumen(rutaDelResumen)}
        className="inline-flex min-h-10 items-center text-cuerpo text-enlace underline"
      >
        {TEXTOS.sinPermiso.volverAlResumen}
      </a>
    </section>
  );
}
