// Marcadores y tramas de las series (diseño 020, «Gráficos»; REQ-014, REQ-038). Formas SVG sin
// `style` ni colores propios: todo color sale de las clases de los papeles `--serie-N`. Las usan
// la leyenda (servidor) y el dibujo (navegador), así que lo que se explica es lo que se pinta.
import type { ReactNode } from "react";
import {
  CLASE_DE_RELLENO,
  CLASE_DE_TRAZO,
  ESTILO_DE_LINEA,
  marcadorDe,
  tramaDe,
  trazoDe,
  type TipoDeMarcador,
} from "./estilos-de-serie";

export type PropiedadesDeMarcador = {
  readonly tipo: TipoDeMarcador;
  readonly indice: number;
  readonly x: number;
  readonly y: number;
  readonly radio?: number;
  readonly datos?: Readonly<Record<string, string>>;
};

/** Un marcador de serie: círculo, cuadrado, triángulo o rombo, con un borde del papel de la
 * superficie para que no se confunda con la línea que lo cruza. */
export function Marcador({ tipo, indice, x, y, radio = 5, datos }: PropiedadesDeMarcador) {
  const clase = `${CLASE_DE_RELLENO[indice] ?? "fill-serie-1"} stroke-superficie`;
  const comunes = { className: clase, strokeWidth: 1, "data-marcador": tipo, ...datos };
  if (tipo === "cuadrado") {
    return <rect x={x - radio} y={y - radio} width={radio * 2} height={radio * 2} {...comunes} />;
  }
  if (tipo === "triangulo") {
    const puntos = `${x},${y - radio * 1.2} ${x + radio * 1.15},${y + radio * 0.9} ${x - radio * 1.15},${y + radio * 0.9}`;
    return <polygon points={puntos} {...comunes} />;
  }
  if (tipo === "rombo") {
    const r = radio * 1.3;
    return (
      <polygon points={`${x},${y - r} ${x + r},${y} ${x},${y + r} ${x - r},${y}`} {...comunes} />
    );
  }
  return <circle cx={x} cy={y} r={radio} {...comunes} />;
}

/** El relleno de las barras de la serie `indice`: liso para la principal y una trama (id del
 * patrón de `PatronesDeTrama`) para las demás. Las clases de trazo son las de la serie. */
export function rellenoDeBarra(base: string, indice: number): string {
  return indice === 0 ? "var(--serie-1)" : `url(#${base}-t${indice})`;
}

/** Patrones de las tramas de las barras. Un solo `svg` de tamaño cero, con los patrones que usan
 * la leyenda y el dibujo (`url(#base-tN)`). */
export function PatronesDeTrama({ base }: { base: string }): ReactNode {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      width="0"
      height="0"
      className="pointer-events-none absolute size-0 overflow-hidden"
    >
      <defs>
        <pattern
          id={`${base}-t1`}
          width="6"
          height="6"
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(45)"
        >
          <rect width="6" height="6" className="fill-superficie" />
          <line x1="0" y1="0" x2="0" y2="6" strokeWidth="3" className={CLASE_DE_TRAZO[1]} />
        </pattern>
        <pattern id={`${base}-t2`} width="6" height="6" patternUnits="userSpaceOnUse">
          <rect width="6" height="6" className="fill-superficie" />
          <circle cx="3" cy="3" r="1.6" className={CLASE_DE_RELLENO[2]} />
        </pattern>
        <pattern id={`${base}-t3`} width="6" height="6" patternUnits="userSpaceOnUse">
          <rect width="6" height="6" className="fill-superficie" />
          <path d="M0 3H6M3 0V6" strokeWidth="2" className={CLASE_DE_TRAZO[3]} />
        </pattern>
      </defs>
    </svg>
  );
}

/** Muestra de una serie en la leyenda: un trozo de línea con su marcador, o un cuadro con su trama. */
export function MuestraDeSerie({
  tipo,
  indice,
  base,
  conMarcadores,
}: {
  tipo: "lineas" | "barras";
  indice: number;
  base: string;
  conMarcadores: boolean;
}) {
  if (tipo === "barras") {
    const trama = tramaDe(indice);
    return (
      <svg aria-hidden="true" focusable="false" width="24" height="16" viewBox="0 0 24 16">
        <rect
          x="1"
          y="1"
          width="22"
          height="14"
          strokeWidth="1.5"
          data-trama={trama}
          className={`${CLASE_DE_TRAZO[indice] ?? ""} ${indice === 0 ? (CLASE_DE_RELLENO[0] ?? "") : ""}`}
          {...(indice === 0 ? {} : { fill: `url(#${base}-t${indice})` })}
        />
      </svg>
    );
  }
  const trazo = trazoDe(indice);
  const estilo = ESTILO_DE_LINEA[trazo];
  return (
    <svg aria-hidden="true" focusable="false" width="40" height="16" viewBox="0 0 40 16">
      <line
        x1="2"
        y1="8"
        x2="38"
        y2="8"
        strokeWidth={estilo.grosor}
        strokeLinecap="round"
        {...(estilo.guiones === undefined ? {} : { strokeDasharray: estilo.guiones })}
        data-trazo={trazo}
        className={CLASE_DE_TRAZO[indice]}
      />
      {conMarcadores ? <Marcador tipo={marcadorDe(indice)} indice={indice} x={20} y={8} /> : null}
    </svg>
  );
}
