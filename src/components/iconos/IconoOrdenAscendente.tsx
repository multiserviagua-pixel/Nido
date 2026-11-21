import { BaseIcono, type PropiedadesIcono } from "./BaseIcono";

/** Icono de orden ascendente. Dibujado por el equipo. */
export function IconoOrdenAscendente(propiedades: PropiedadesIcono) {
  return (
    <BaseIcono {...propiedades}>
      <line x1="12" y1="19" x2="12" y2="5" />
      <polyline points="6 11 12 5 18 11" />
    </BaseIcono>
  );
}
