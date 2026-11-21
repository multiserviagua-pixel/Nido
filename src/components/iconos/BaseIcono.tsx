import type { ReactNode } from "react";

export type PropiedadesIcono = {
  /** Nombre accesible. Sin él, el icono es decorativo y queda oculto para el lector de pantalla.
   * Lo pone quien usa el icono (de `textos.ts`): el icono no trae textos propios. */
  titulo?: string;
  /** Lado en píxeles. Por defecto, 24. */
  tamano?: number;
};

/** Contenedor común de los iconos: cuadrícula de 24, trazo con `currentColor` y accesibilidad. */
export function BaseIcono({
  titulo,
  tamano = 24,
  children,
}: PropiedadesIcono & { children: ReactNode }) {
  const nombre = titulo?.trim();
  return (
    <svg
      viewBox="0 0 24 24"
      width={tamano}
      height={tamano}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      focusable="false"
      {...(nombre ? { role: "img", "aria-label": nombre } : { "aria-hidden": true })}
    >
      {nombre ? <title>{nombre}</title> : null}
      {children}
    </svg>
  );
}
