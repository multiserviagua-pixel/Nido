import { BaseIcono, type PropiedadesIcono } from "./BaseIcono";

/** Icono de la suscripción (tarjeta). Dibujado por el equipo. */
export function IconoSuscripcion(propiedades: PropiedadesIcono) {
  return (
    <BaseIcono {...propiedades}>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <line x1="3" y1="10" x2="21" y2="10" />
      <line x1="7" y1="15" x2="10" y2="15" />
    </BaseIcono>
  );
}
