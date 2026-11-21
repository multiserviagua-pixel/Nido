import { BaseIcono, type PropiedadesIcono } from "./BaseIcono";

/** Icono de los clientes. Dibujado por el equipo. */
export function IconoClientes(propiedades: PropiedadesIcono) {
  return (
    <BaseIcono {...propiedades}>
      <circle cx="9" cy="8" r="3" />
      <path d="M3 20v-1a5 5 0 0 1 5-5h2a5 5 0 0 1 5 5v1" />
      <path d="M16 5a3 3 0 0 1 0 6" />
      <path d="M18 14.5a5 5 0 0 1 3 4.5v1" />
    </BaseIcono>
  );
}
