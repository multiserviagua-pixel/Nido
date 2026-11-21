import { BaseIcono, type PropiedadesIcono } from "./BaseIcono";

/** Icono de un estado en pausa (círculo con dos barras). Dibujado por el equipo. */
export function IconoPausa(propiedades: PropiedadesIcono) {
  return (
    <BaseIcono {...propiedades}>
      <circle cx="12" cy="12" r="9" />
      <line x1="10" y1="9" x2="10" y2="15" />
      <line x1="14" y1="9" x2="14" y2="15" />
    </BaseIcono>
  );
}
