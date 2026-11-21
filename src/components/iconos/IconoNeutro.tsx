import { BaseIcono, type PropiedadesIcono } from "./BaseIcono";

/** Icono de un estado neutro (círculo con guion). Dibujado por el equipo. */
export function IconoNeutro(propiedades: PropiedadesIcono) {
  return (
    <BaseIcono {...propiedades}>
      <circle cx="12" cy="12" r="9" />
      <line x1="8" y1="12" x2="16" y2="12" />
    </BaseIcono>
  );
}
