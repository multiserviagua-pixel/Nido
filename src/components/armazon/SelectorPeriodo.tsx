"use client";

// Selector de periodo (diseño 020, «Armazón»; REQ-006, REQ-059): un `select` nativo con etiqueta
// visible sobre la lista cerrada de periodos que declara la vista, y junto a él el periodo con
// palabras y fechas. El valor va en la dirección (solo una clave de la lista) y el cambio se
// anuncia. Se maneja con teclado porque es el control nativo.
//
// El cambio no recarga la página: escribe la dirección con `history.replaceState`, avisa con un
// evento (`usePeriodo`) y los componentes de la vista que pintan datos de ese periodo vuelven a
// pedirlos (diseño, «Una vista en uso», punto 3). El foco se queda en el selector. No se guarda
// nada en el navegador (REQ-058). No importa el enrutador de Next (no añade ningún paquete de cliente):
// el `replaceState` que Next parchea mantiene su estado, pero una vista de servidor no vuelve a
// pedir datos por esta vía (pregunta abierta al arquitecto, tareas.md punto 13).
import { useId } from "react";
import { anunciar } from "../texto/anuncios";
import { TEXTOS } from "../textos";
import {
  periodoActivo,
  periodosValidos,
  rutaConPeriodo,
  textoDePeriodo,
  type ConfiguracionDePeriodo,
} from "./periodo";
import { EVENTO_DE_PERIODO, usePeriodo } from "./usePeriodo";

export function SelectorPeriodo({ periodo }: { periodo: ConfiguracionDePeriodo }) {
  const id = useId();
  const clave = usePeriodo(periodo);
  const activo = periodoActivo({ ...periodo, valor: clave });
  if (activo === null) return null;
  return (
    <div className="flex w-full flex-wrap items-center gap-x-3 gap-y-1">
      <label htmlFor={id} className="text-cuerpo-menor font-medio text-texto">
        {TEXTOS.periodo.etiqueta}
      </label>
      <select
        id={id}
        value={activo.clave}
        onChange={(evento) => {
          const nueva = periodosValidos(periodo.periodos).find(
            (p) => p.clave === evento.target.value,
          );
          if (nueva === undefined) return;
          // Forma que documenta Next 16: con `null` el replaceState parcheado copia él el estado
          // interno del enrutador y actualiza su dirección canónica (`usePathname`,
          // `useSearchParams`, `router.refresh`). Pasar `history.state` se saltaría ese paso.
          window.history.replaceState(
            null,
            "",
            rutaConPeriodo(window.location.pathname + window.location.search, periodo, nueva.clave),
          );
          window.dispatchEvent(new Event(EVENTO_DE_PERIODO));
          anunciar(`${TEXTOS.periodo.anuncio} ${textoDePeriodo(nueva)}`);
        }}
        className="min-h-10 max-w-full rounded-medio border border-borde-control bg-superficie px-3 text-texto"
      >
        {periodosValidos(periodo.periodos).map((p) => (
          <option key={p.clave} value={p.clave}>
            {p.etiqueta}
          </option>
        ))}
      </select>
      <span className="text-cuerpo-menor text-texto-secundario">{textoDePeriodo(activo)}</span>
    </div>
  );
}
