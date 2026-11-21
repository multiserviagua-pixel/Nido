import { BaseIcono, type PropiedadesIcono } from "./BaseIcono";

/** Icono de orden descendente. Dibujado por el equipo. */
export function IconoOrdenDescendente(propiedades: PropiedadesIcono) {
  return (
    <BaseIcono {...propiedades}>
      <line x1="12" y1="5" x2="12" y2="19" />
      <polyline points="6 13 12 19 18 13" />
    </BaseIcono>
  );
}
