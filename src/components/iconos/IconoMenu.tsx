import { BaseIcono, type PropiedadesIcono } from "./BaseIcono";

/** Icono del menú. Dibujado por el equipo. */
export function IconoMenu(propiedades: PropiedadesIcono) {
  return (
    <BaseIcono {...propiedades}>
      <line x1="4" y1="6" x2="20" y2="6" />
      <line x1="4" y1="12" x2="20" y2="12" />
      <line x1="4" y1="18" x2="20" y2="18" />
    </BaseIcono>
  );
}
