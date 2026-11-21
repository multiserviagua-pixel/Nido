import { BaseIcono, type PropiedadesIcono } from "./BaseIcono";

/** Icono de un resultado correcto (círculo con marca). Dibujado por el equipo. */
export function IconoCorrecto(propiedades: PropiedadesIcono) {
  return (
    <BaseIcono {...propiedades}>
      <circle cx="12" cy="12" r="9" />
      <polyline points="8 12 11 15 16 9" />
    </BaseIcono>
  );
}
