import { BaseIcono, type PropiedadesIcono } from "./BaseIcono";

/** Icono del tema claro (disco y ocho rayos). Dibujado por el equipo. */
export function IconoSol(propiedades: PropiedadesIcono) {
  return (
    <BaseIcono {...propiedades}>
      <circle cx="12" cy="12" r="4" />
      <line x1="20" y1="12" x2="22.5" y2="12" />
      <line x1="17.66" y1="17.66" x2="19.42" y2="19.42" />
      <line x1="12" y1="20" x2="12" y2="22.5" />
      <line x1="6.34" y1="17.66" x2="4.58" y2="19.42" />
      <line x1="4" y1="12" x2="1.5" y2="12" />
      <line x1="6.34" y1="6.34" x2="4.58" y2="4.58" />
      <line x1="12" y1="4" x2="12" y2="1.5" />
      <line x1="17.66" y1="6.34" x2="19.42" y2="4.58" />
    </BaseIcono>
  );
}
