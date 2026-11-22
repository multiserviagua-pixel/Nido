import type { ReactNode } from "react";
import { ZonaDeDatos } from "./ZonaDeDatos";

function hay(zona: ReactNode): boolean {
  return zona !== undefined && zona !== null && zona !== false;
}

/** Cuerpo de una vista en tres zonas con orden fijo en el documento: cifras, contenido (gráficos
 * y tablas) y alertas (REQ-007). En anchos grandes las alertas se colocan a la derecha del
 * contenido sin cambiar el orden del documento, así que el orden de lectura y de foco coincide
 * con el visual. Las zonas de cifras y de contenido siguen la transición del cambio de periodo
 * (`ZonaDeDatos`): ocupadas y en `carga` mientras la vista vuelve del servidor. Una zona que no se pasa no se pinta. Cada zona puede encogerse (`min-w-0`) para
 * no forzar desplazamiento horizontal (REQ-008). */
export function RejillaCuerpo({
  cifras,
  contenido,
  alertas,
}: {
  cifras?: ReactNode;
  contenido?: ReactNode;
  alertas?: ReactNode;
}) {
  const conAlertas = hay(alertas);
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      {hay(cifras) ? (
        <ZonaDeDatos zona="cifras" className="min-w-0 lg:col-span-3">
          {cifras}
        </ZonaDeDatos>
      ) : null}
      {hay(contenido) ? (
        <ZonaDeDatos
          zona="contenido"
          className={conAlertas ? "min-w-0 lg:col-span-2" : "min-w-0 lg:col-span-3"}
        >
          {contenido}
        </ZonaDeDatos>
      ) : null}
      {conAlertas ? (
        <div data-zona="alertas" className="min-w-0 lg:col-span-1">
          {alertas}
        </div>
      ) : null}
    </div>
  );
}
