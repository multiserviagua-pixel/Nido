import { BaseIcono, type PropiedadesIcono } from "./BaseIcono";

/** Icono de un aviso (triángulo). Dibujado por el equipo. */
export function IconoAdvertencia(propiedades: PropiedadesIcono) {
  return (
    <BaseIcono {...propiedades}>
      <polygon points="12 3 22 20 2 20" />
      <line x1="12" y1="9" x2="12" y2="14" />
      <line x1="12" y1="17" x2="12" y2="17.01" />
    </BaseIcono>
  );
}
