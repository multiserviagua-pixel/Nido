import { BaseIcono, type PropiedadesIcono } from "./BaseIcono";

/** Icono de un error (círculo con aspa). Dibujado por el equipo. */
export function IconoError(propiedades: PropiedadesIcono) {
  return (
    <BaseIcono {...propiedades}>
      <circle cx="12" cy="12" r="9" />
      <line x1="9" y1="9" x2="15" y2="15" />
      <line x1="15" y1="9" x2="9" y2="15" />
    </BaseIcono>
  );
}
