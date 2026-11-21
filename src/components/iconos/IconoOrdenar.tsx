import { BaseIcono, type PropiedadesIcono } from "./BaseIcono";

/** Icono de una columna ordenable sin orden aplicado. Dibujado por el equipo. */
export function IconoOrdenar(propiedades: PropiedadesIcono) {
  return (
    <BaseIcono {...propiedades}>
      <path d="M8 9l4-4 4 4" />
      <path d="M8 15l4 4 4-4" />
    </BaseIcono>
  );
}
