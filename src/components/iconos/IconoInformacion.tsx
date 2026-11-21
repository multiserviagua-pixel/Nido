import { BaseIcono, type PropiedadesIcono } from "./BaseIcono";

/** Icono de una información (círculo con i). Dibujado por el equipo. */
export function IconoInformacion(propiedades: PropiedadesIcono) {
  return (
    <BaseIcono {...propiedades}>
      <circle cx="12" cy="12" r="9" />
      <line x1="12" y1="11" x2="12" y2="16" />
      <line x1="12" y1="8" x2="12" y2="8.01" />
    </BaseIcono>
  );
}
