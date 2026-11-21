import type { ReactNode } from "react";
import { TEXTOS } from "../textos";
import { Anunciador } from "../texto/Anunciador";
import type { Area } from "./areas";
import { CajonMenu } from "./CajonMenu";
import { EnlaceSaltar } from "./EnlaceSaltar";
import { MenuLateral } from "./MenuLateral";

/** Identificador del contenido principal: destino del enlace de salto. */
export const ID_CONTENIDO = "contenido-principal";

export type PropiedadesArmazon = {
  /** Lista cerrada de áreas del menú (`areas.ts`). */
  areas: readonly Area[];
  /** Clave del área actual. Si no es de la lista, ninguna se marca (cierra en fallo). */
  areaActual: string;
  /** Título de la vista: el único `h1`. Texto fijo de la vista, sin datos (A-10). */
  titulo: string;
  /** Hasta T-010 (c) la cabecera solo lleva el título y el botón del cajón. `Cabecera` tipará aquí
   * la cuenta y el periodo (`cuenta`, `periodo`); mientras tanto no admite nada, ni un nodo libre.
   * El menú no se pasa: lo pone Armazon a partir de `areas`. */
  cabecera?: undefined;
  children: ReactNode;
};

/** Estructura común de todas las vistas (REQ-001): enlace de salto, menú, cabecera, `main` y
 * regiones de anuncios. Solo presentación: no lee la sesión ni la dirección (V-1).
 *
 * El menú es `MenuLateral` (desde 1024 px) y `CajonMenu` (por debajo), hechos de `areas`: no hay
 * forma de sustituir la lista cerrada. Hasta T-010 (c), la cabecera es solo el botón del cajón y
 * el `h1`; `Cabecera`, `CuentaUsuario` y `SelectorPeriodo` la sustituirán. */
export function Armazon({ areas, areaActual, titulo, children }: PropiedadesArmazon) {
  return (
    <>
      <EnlaceSaltar destino={ID_CONTENIDO} />
      <div className="flex min-h-dvh flex-col lg:flex-row">
        <MenuLateral areas={areas} areaActual={areaActual} />
        <div className="mx-auto flex w-full min-w-0 max-w-contenido-maximo flex-1 flex-col">
          <header
            aria-label={TEXTOS.armazon.cabecera}
            className="border-b border-borde-decorativo bg-superficie px-4 py-4 md:px-6"
          >
            <div className="flex items-center gap-3">
              <CajonMenu areas={areas} areaActual={areaActual} />
              <h1 className="min-w-0 text-titulo font-seminegrita text-texto">{titulo}</h1>
            </div>
          </header>
          <main
            id={ID_CONTENIDO}
            tabIndex={-1}
            aria-label={TEXTOS.armazon.contenidoPrincipal}
            className="min-w-0 flex-1 p-4 md:p-6"
          >
            {children}
          </main>
        </div>
        <Anunciador />
      </div>
    </>
  );
}
