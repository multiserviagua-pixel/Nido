import { BaseIcono, type PropiedadesIcono } from "./BaseIcono";

/** Icono de las alertas. Dibujado por el equipo. */
export function IconoAlertas(propiedades: PropiedadesIcono) {
  return (
    <BaseIcono {...propiedades}>
      <path d="M6 16v-5a6 6 0 0 1 12 0v5l2 2H4z" />
      <path d="M10 21h4" />
    </BaseIcono>
  );
}
