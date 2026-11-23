import type { ReactNode } from "react";

/**
 * Logotipo definitivo «Nido en anillo» (diseño 020, REQ-087; elegido por el responsable el
 * 22/11/2026, «Logo C, aprobada»). Es solo dibujo: formas en un cuadro de 64 por 64, sin texto con
 * fuente (el nombre va en HTML, ver `MarcaDelProducto`) y sin colores literales: pinta con los
 * papeles de `valores.css`, así que cambia con el tema y con los colores forzados.
 *
 * Es decorativo (`aria-hidden`): siempre va junto al nombre del producto escrito, que es lo que
 * se anuncia una sola vez. Un uso suelto, sin el nombre al lado, tendría que añadir su propio
 * nombre accesible fuera de este componente.
 *
 * Variantes:
 * - `menu-oscuro`: para el menú, que es oscuro en los dos temas.
 * - `fondo-claro`: para la página (claro u oscuro según el tema).
 * - `icono`: sobre su propio fondo en degradado del acento, con esquinas redondeadas. Como el
 *   anillo interior se funde por debajo de 24 px, a ese tamaño se dibuja con el trazo algo más
 *   grueso y sin separar tonos (misma forma, mismo tono).
 */
export type VarianteLogotipo = "menu-oscuro" | "fondo-claro" | "icono";

type Clases = { anillo: string; nodos: string; interior: string; huevo: string };

const CLASES: Record<VarianteLogotipo, Clases> = {
  "menu-oscuro": {
    anillo: "stroke-menu-indicador",
    nodos: "fill-menu-texto",
    interior: "stroke-menu-indicador",
    huevo: "fill-menu-texto",
  },
  // `--serie-4` es el paso del acento que el diseño aprobado usa para el anillo interior: más
  // oscuro que el anillo en claro y más claro en oscuro.
  "fondo-claro": {
    anillo: "stroke-acento",
    nodos: "fill-texto",
    interior: "stroke-serie-4",
    huevo: "fill-texto",
  },
  icono: {
    anillo: "stroke-texto-sobre-acento",
    nodos: "fill-texto-sobre-acento",
    interior: "stroke-texto-sobre-acento",
    huevo: "fill-texto-sobre-acento",
  },
};

function Dibujo({
  clases,
  trazoAnillo,
  trazoInterior,
  pequeno,
}: {
  clases: Clases;
  trazoAnillo: number;
  trazoInterior: number;
  pequeno: boolean;
}): ReactNode {
  return (
    <>
      <path
        d="M32 8 A24 24 0 1 1 8 32"
        fill="none"
        strokeWidth={trazoAnillo}
        strokeLinecap="round"
        className={clases.anillo}
      />
      <circle cx={32} cy={8} r={5} className={clases.nodos} />
      <circle cx={8} cy={32} r={5} className={clases.nodos} />
      {pequeno ? null : (
        <circle
          cx={32}
          cy={32}
          r={13}
          fill="none"
          strokeWidth={trazoInterior}
          className={clases.interior}
        />
      )}
      <ellipse
        cx={32}
        cy={32}
        rx={pequeno ? 8 : 5}
        ry={pequeno ? 10 : 6.5}
        className={clases.huevo}
      />
    </>
  );
}

export function LogotipoNido({
  variante,
  lado = 32,
}: {
  variante: VarianteLogotipo;
  /** Lado en píxeles; por defecto, 32. */
  lado?: number;
}) {
  const clases = CLASES[variante];
  const enIcono = variante === "icono";
  // Con menos de 24 px el anillo interior se funde con el huevo: se omite y el huevo crece.
  const pequeno = lado < 24;
  const dibujo = (
    <svg
      viewBox="0 0 64 64"
      width={lado}
      height={lado}
      aria-hidden="true"
      focusable="false"
      className="block shrink-0"
    >
      {enIcono ? (
        <g transform="translate(7 7) scale(0.78)">
          <Dibujo clases={clases} trazoAnillo={7} trazoInterior={5.6} pequeno={pequeno} />
        </g>
      ) : (
        <Dibujo clases={clases} trazoAnillo={6} trazoInterior={4.8} pequeno={pequeno} />
      )}
    </svg>
  );
  if (!enIcono) return dibujo;
  // Radios del sistema (sin estilo en línea): 8 px hasta 40 px de lado y 12 px por encima.
  const radio = lado <= 40 ? "rounded-medio" : "rounded-grande";
  return (
    <span data-logotipo-fondo className={`inline-block shrink-0 bg-degradado-acento ${radio}`}>
      {dibujo}
    </span>
  );
}
