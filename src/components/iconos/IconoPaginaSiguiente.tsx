import { BaseIcono, type PropiedadesIcono } from "./BaseIcono";

/** Icono de la página siguiente. Dibujado por el equipo. */
export function IconoPaginaSiguiente(propiedades: PropiedadesIcono) {
  return (
    <BaseIcono {...propiedades}>
      <polyline points="9 5 16 12 9 19" />
    </BaseIcono>
  );
}
