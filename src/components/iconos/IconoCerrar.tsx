import { BaseIcono, type PropiedadesIcono } from "./BaseIcono";

/** Icono de cerrar. Dibujado por el equipo. */
export function IconoCerrar(propiedades: PropiedadesIcono) {
  return (
    <BaseIcono {...propiedades}>
      <line x1="6" y1="6" x2="18" y2="18" />
      <line x1="18" y1="6" x2="6" y2="18" />
    </BaseIcono>
  );
}
