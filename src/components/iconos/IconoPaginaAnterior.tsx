import { BaseIcono, type PropiedadesIcono } from "./BaseIcono";

/** Icono de la página anterior. Dibujado por el equipo. */
export function IconoPaginaAnterior(propiedades: PropiedadesIcono) {
  return (
    <BaseIcono {...propiedades}>
      <polyline points="15 5 8 12 15 19" />
    </BaseIcono>
  );
}
