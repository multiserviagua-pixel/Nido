import { BaseIcono, type PropiedadesIcono } from "./BaseIcono";

/** Icono de la actividad (pulso). Dibujado por el equipo. */
export function IconoActividad(propiedades: PropiedadesIcono) {
  return (
    <BaseIcono {...propiedades}>
      <polyline points="3 12 7 12 10 5 14 19 17 12 21 12" />
    </BaseIcono>
  );
}
