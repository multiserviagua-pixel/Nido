import { BaseIcono, type PropiedadesIcono } from "./BaseIcono";

/** Icono de los informes y las órdenes. Dibujado por el equipo. */
export function IconoOrdenes(propiedades: PropiedadesIcono) {
  return (
    <BaseIcono {...propiedades}>
      <path d="M6 3h8l5 5v13H6z" />
      <polyline points="14 3 14 8 19 8" />
      <line x1="9" y1="13" x2="16" y2="13" />
      <line x1="9" y1="17" x2="16" y2="17" />
    </BaseIcono>
  );
}
