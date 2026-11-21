import { BaseIcono, type PropiedadesIcono } from "./BaseIcono";

/** Icono del tema oscuro (media luna). Dibujado por el equipo. */
export function IconoLuna(propiedades: PropiedadesIcono) {
  return (
    <BaseIcono {...propiedades}>
      <path d="M16.25 4.64A8.5 8.5 0 1 0 17.43 18.51A7.5 7.5 0 0 1 16.25 4.64z" />
    </BaseIcono>
  );
}
