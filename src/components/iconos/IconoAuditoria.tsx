import { BaseIcono, type PropiedadesIcono } from "./BaseIcono";

/** Icono de la auditoría. Dibujado por el equipo. */
export function IconoAuditoria(propiedades: PropiedadesIcono) {
  return (
    <BaseIcono {...propiedades}>
      <path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z" />
      <polyline points="9 12 11 14 15 10" />
    </BaseIcono>
  );
}
