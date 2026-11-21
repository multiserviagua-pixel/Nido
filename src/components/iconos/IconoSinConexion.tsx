import { BaseIcono, type PropiedadesIcono } from "./BaseIcono";

/** Icono de la falta de conexión. Dibujado por el equipo. */
export function IconoSinConexion(propiedades: PropiedadesIcono) {
  return (
    <BaseIcono {...propiedades}>
      <path d="M5 12.5a10 10 0 0 1 14 0" />
      <path d="M8.5 16a5 5 0 0 1 7 0" />
      <line x1="12" y1="19.5" x2="12" y2="19.51" />
      <line x1="3" y1="3" x2="21" y2="21" />
    </BaseIcono>
  );
}
