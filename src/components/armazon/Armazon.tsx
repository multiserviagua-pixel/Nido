import type { ReactNode } from "react";
import { ICONOS } from "../iconos";
import { TEXTOS } from "../textos";
import { Anunciador } from "../texto/Anunciador";
import type { Area } from "./areas";
import { EnlaceSaltar } from "./EnlaceSaltar";

/** Identificador del contenido principal: destino del enlace de salto. */
export const ID_CONTENIDO = "contenido-principal";

export type PropiedadesArmazon = {
  /** Lista cerrada de áreas del menú (`areas.ts`). */
  areas: readonly Area[];
  /** Clave del área actual. Si no es de la lista, ninguna se marca (cierra en fallo). */
  areaActual: string;
  /** Título de la vista: el único `h1`. Texto fijo de la vista, sin datos (A-10). */
  titulo: string;
  /** Punto de montaje de `MenuLateral` y `CajonMenu` (T-010 (b)). Sin él, el menú es la lista de
   * enlaces mínima de abajo. */
  menu?: ReactNode;
  /** Punto de montaje de la cuenta y el selector de periodo, dentro de la cabecera (T-010 (c)).
   * `Cabecera` recogerá aquí el `h1`. */
  cabecera?: ReactNode;
  children: ReactNode;
};

/** Estructura común de todas las vistas (REQ-001): enlace de salto, menú, cabecera, `main` y
 * regiones de anuncios. Solo presentación: no lee la sesión ni la dirección (V-1).
 *
 * Hasta T-010 (b) y (c), el menú es una lista de enlaces sin cajón y la cabecera solo lleva el
 * `h1`: es lo mínimo para que la estructura, las áreas y el orden se puedan comprobar. No es
 * `MenuLateral` ni `Cabecera`; esos los sustituyen por los puntos de montaje `menu` y `cabecera`. */
export function Armazon({
  areas,
  areaActual,
  titulo,
  menu,
  cabecera,
  children,
}: PropiedadesArmazon) {
  return (
    <>
      <EnlaceSaltar destino={ID_CONTENIDO} />
      <div className="flex min-h-dvh flex-col lg:flex-row">
        <nav
          aria-label={TEXTOS.armazon.navegacionPrincipal}
          className="bg-menu-fondo bg-degradado-menu py-4 text-menu-texto lg:w-menu-ancho lg:shrink-0"
        >
          {menu ?? <ListaDeAreas areas={areas} areaActual={areaActual} />}
        </nav>
        <div className="mx-auto flex w-full min-w-0 max-w-contenido-maximo flex-1 flex-col">
          <header
            aria-label={TEXTOS.armazon.cabecera}
            className="border-b border-borde-decorativo bg-superficie px-4 py-4 md:px-6"
          >
            <h1 className="text-titulo font-seminegrita text-texto">{titulo}</h1>
            {cabecera}
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

function ListaDeAreas({ areas, areaActual }: { areas: readonly Area[]; areaActual: string }) {
  return (
    <ul className="flex flex-col gap-1">
      {areas.map((area) => {
        const Icono = ICONOS[area.icono];
        const actual = area.clave === areaActual;
        return (
          <li key={area.clave}>
            <a
              href={area.ruta}
              aria-current={actual ? "page" : undefined}
              className={
                actual
                  ? "flex min-h-10 items-center gap-3 border-l-4 border-menu-indicador bg-menu-actual px-4 font-seminegrita text-menu-texto"
                  : "flex min-h-10 items-center gap-3 border-l-4 border-transparent px-4 font-normal text-menu-texto"
              }
            >
              <Icono tamano={20} />
              <span>{area.etiqueta}</span>
            </a>
          </li>
        );
      })}
    </ul>
  );
}
