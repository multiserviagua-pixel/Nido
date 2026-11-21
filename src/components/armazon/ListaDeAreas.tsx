import { ICONOS } from "../iconos";
import type { Area } from "./areas";

/**
 * Lista cerrada de áreas del menú (REQ-002, REQ-003, REQ-038). La comparten el menú lateral
 * (servidor) y el cajón (cliente): una sola forma de pintar el área actual. Sin directiva de
 * cliente: es de quien la importe. El área actual lleva `aria-current="page"` y un indicador con
 * forma (barra lateral y peso de letra), no solo color. Los iconos son decorativos: el nombre del
 * enlace es su texto. Un área actual que no está en la lista no marca ninguna.
 */
export function ListaDeAreas({
  areas,
  areaActual,
  alElegir,
}: {
  areas: readonly Area[];
  areaActual: string;
  /** Solo el cajón lo pasa: elegir un área lo cierra. */
  alElegir?: () => void;
}) {
  return (
    <ul className="flex flex-col gap-1">
      {areas.map((area) => {
        const Icono = ICONOS[area.icono];
        const actual = area.clave === areaActual;
        return (
          <li key={area.clave}>
            <a
              href={area.ruta}
              aria-current={actual ? "page" : undefined}
              onClick={alElegir}
              className={
                actual
                  ? "flex min-h-10 items-center gap-3 border-l-4 border-menu-indicador bg-menu-actual px-4 font-seminegrita text-menu-texto"
                  : "flex min-h-10 items-center gap-3 border-l-4 border-transparent px-4 font-normal text-menu-texto"
              }
            >
              <Icono tamano={20} />
              <span>{area.etiqueta}</span>
            </a>
          </li>
        );
      })}
    </ul>
  );
}
