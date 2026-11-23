// Páginas de `GraficoLineas` y `GraficoBarras` en la muestra (T-010 (h); CA-011, CA-040, CA-041).
// Un estado por página fija; los datos son ficticios y están en `datos-ficticios.ts`.
import type { ReactNode } from "react";
import { GraficoBarras } from "@/components/graficos/GraficoBarras";
import { GraficoLineas } from "@/components/graficos/GraficoLineas";
import { MarcoDeComponente } from "../cifras/marco";
import {
  configuracionDeBarras,
  configuracionDeLineas,
  type EstadoDeBarras,
  type EstadoDeLineas,
} from "./datos-ficticios";
import { TEXTOS_GRAFICO as T } from "./textos-grafico";

export function VistaDeLineas({
  titulo,
  estado,
}: {
  titulo: string;
  estado: EstadoDeLineas;
}): ReactNode {
  const [encabezado, explicacion] = T.lineas[estado];
  return (
    <MarcoDeComponente titulo={titulo}>
      <section aria-labelledby="grafico-titulo" className="flex min-w-0 flex-col gap-4">
        <h2 id="grafico-titulo">{encabezado}</h2>
        <p className="text-cuerpo-menor text-texto-secundario">{explicacion}</p>
        <GraficoLineas {...configuracionDeLineas(estado)} />
      </section>
    </MarcoDeComponente>
  );
}

export function VistaDeBarras({
  titulo,
  estado,
}: {
  titulo: string;
  estado: EstadoDeBarras;
}): ReactNode {
  const [encabezado, explicacion] = T.barras[estado];
  return (
    <MarcoDeComponente titulo={titulo}>
      <section aria-labelledby="grafico-titulo" className="flex min-w-0 flex-col gap-4">
        <h2 id="grafico-titulo">{encabezado}</h2>
        <p className="text-cuerpo-menor text-texto-secundario">{explicacion}</p>
        <GraficoBarras {...configuracionDeBarras(estado)} />
      </section>
    </MarcoDeComponente>
  );
}
