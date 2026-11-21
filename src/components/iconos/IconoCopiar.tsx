import { BaseIcono, type PropiedadesIcono } from "./BaseIcono";

/** Icono de copiar. Dibujado por el equipo. */
export function IconoCopiar(propiedades: PropiedadesIcono) {
  return (
    <BaseIcono {...propiedades}>
      <rect x="9" y="9" width="12" height="12" rx="2" />
      <path d="M15 9V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h4" />
    </BaseIcono>
  );
}
