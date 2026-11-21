import { BaseIcono, type PropiedadesIcono } from "./BaseIcono";

/** Icono de salir (puerta abierta y flecha). Dibujado por el equipo. */
export function IconoSalir(propiedades: PropiedadesIcono) {
  return (
    <BaseIcono {...propiedades}>
      <path d="M13 4H6v16h7" />
      <line x1="10" y1="12" x2="20" y2="12" />
      <polyline points="16 8 20 12 16 16" />
    </BaseIcono>
  );
}
