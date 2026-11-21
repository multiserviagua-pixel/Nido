import { BaseIcono, type PropiedadesIcono } from "./BaseIcono";

/** Icono de buscar. Dibujado por el equipo. */
export function IconoBuscar(propiedades: PropiedadesIcono) {
  return (
    <BaseIcono {...propiedades}>
      <circle cx="11" cy="11" r="6" />
      <line x1="16" y1="16" x2="21" y2="21" />
    </BaseIcono>
  );
}
