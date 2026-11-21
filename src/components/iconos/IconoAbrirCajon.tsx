import { BaseIcono, type PropiedadesIcono } from "./BaseIcono";

/** Icono de abrir el cajón del menú. Dibujado por el equipo. */
export function IconoAbrirCajon(propiedades: PropiedadesIcono) {
  return (
    <BaseIcono {...propiedades}>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <line x1="9" y1="4" x2="9" y2="20" />
      <polyline points="13 9 16 12 13 15" />
    </BaseIcono>
  );
}
