import { BaseIcono, type PropiedadesIcono } from "./BaseIcono";

/** Icono de cerrar el cajón del menú. Dibujado por el equipo. */
export function IconoCerrarCajon(propiedades: PropiedadesIcono) {
  return (
    <BaseIcono {...propiedades}>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <line x1="9" y1="4" x2="9" y2="20" />
      <polyline points="16 9 13 12 16 15" />
    </BaseIcono>
  );
}
