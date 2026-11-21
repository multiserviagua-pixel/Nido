import { BaseIcono, type PropiedadesIcono } from "./BaseIcono";

/** Icono de los ajustes. Dibujado por el equipo. */
export function IconoAjustes(propiedades: PropiedadesIcono) {
  return (
    <BaseIcono {...propiedades}>
      <polygon points="18.69 9.93 21.36 10.39 21.36 13.61 18.69 14.07 18.19 15.27 19.76 17.48 17.48 19.76 15.27 18.19 14.07 18.69 13.61 21.36 10.39 21.36 9.93 18.69 8.73 18.19 6.52 19.76 4.24 17.48 5.81 15.27 5.31 14.07 2.64 13.61 2.64 10.39 5.31 9.93 5.81 8.73 4.24 6.52 6.52 4.24 8.73 5.81 9.93 5.31 10.39 2.64 13.61 2.64 14.07 5.31 15.27 5.81 17.48 4.24 19.76 6.52 18.19 8.73" />
      <circle cx="12" cy="12" r="3" />
    </BaseIcono>
  );
}
