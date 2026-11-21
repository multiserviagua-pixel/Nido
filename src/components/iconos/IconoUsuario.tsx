import { BaseIcono, type PropiedadesIcono } from "./BaseIcono";

/** Icono de la cuenta de usuario. Dibujado por el equipo. */
export function IconoUsuario(propiedades: PropiedadesIcono) {
  return (
    <BaseIcono {...propiedades}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1" />
    </BaseIcono>
  );
}
