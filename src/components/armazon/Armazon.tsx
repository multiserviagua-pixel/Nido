import type { ReactNode } from "react";
import { TEXTOS } from "../textos";
import { Anunciador } from "../texto/Anunciador";
import type { Area } from "./areas";
import { Cabecera } from "./Cabecera";
import type { DatosDeCuenta } from "./CuentaUsuario";
import { EnlaceSaltar } from "./EnlaceSaltar";
import { MenuLateral } from "./MenuLateral";
import type { ConfiguracionDePeriodo } from "./periodo";

/** Identificador del contenido principal: destino del enlace de salto. */
export const ID_CONTENIDO = "contenido-principal";

export type PropiedadesArmazon = {
  /** Lista cerrada de áreas del menú (`areas.ts`). */
  areas: readonly Area[];
  /** Clave del área actual. Si no es de la lista, ninguna se marca (cierra en fallo). */
  areaActual: string;
  /** Título de la vista: el único `h1`. Texto fijo de la vista, sin datos (A-10). */
  titulo: string;
  /** Cuenta con sesión iniciada: sale de la sesión (la 021), nunca de la dirección (REQ-083). */
  cuenta: DatosDeCuenta;
  /** Solo las vistas que declaran un selector de periodo lo pasan (REQ-006). */
  periodo?: ConfiguracionDePeriodo;
  children: ReactNode;
};

/** Estructura común de todas las vistas (REQ-001): enlace de salto, menú, cabecera, `main` y
 * regiones de anuncios. Solo presentación: no lee la sesión ni la dirección (V-1).
 *
 * El menú es `MenuLateral` (desde 1024 px) y `CajonMenu` (por debajo), hechos de `areas`: no hay
 * forma de sustituir la lista cerrada. La cabecera es `Cabecera` (título, cuenta y periodo): no
 * admite un nodo libre. */
export function Armazon({
  areas,
  areaActual,
  titulo,
  cuenta,
  periodo,
  children,
}: PropiedadesArmazon) {
  return (
    <>
      <EnlaceSaltar destino={ID_CONTENIDO} />
      <div className="flex min-h-dvh flex-col lg:flex-row">
        <MenuLateral areas={areas} areaActual={areaActual} />
        <div className="mx-auto flex w-full min-w-0 max-w-contenido-maximo flex-1 flex-col">
          <Cabecera
            areas={areas}
            areaActual={areaActual}
            titulo={titulo}
            cuenta={cuenta}
            periodo={periodo}
          />
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
