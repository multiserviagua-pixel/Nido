// Cómo se distingue cada serie sin depender del color (diseño 020, «Gráficos»; REQ-014, REQ-038).
// La serie 1 es la principal y va en el acento; las demás se distinguen además por el trazo y el
// marcador (líneas) o por la trama (barras). Los colores son los papeles `--serie-1` a `--serie-4`
// de `docs/DISENO.md`, nunca un valor. La leyenda, el dibujo y la tabla leen de aquí.

export const TRAZOS = ["continuo", "grueso", "rayas", "puntos"] as const;
export type Trazo = (typeof TRAZOS)[number];

export const MARCADORES = ["circulo", "cuadrado", "triangulo", "rombo"] as const;
export type TipoDeMarcador = (typeof MARCADORES)[number];

export const TRAMAS = ["lisa", "diagonal", "puntos", "cuadricula"] as const;
export type Trama = (typeof TRAMAS)[number];

/** Papel de color de la serie, en la forma que admiten los atributos de Recharts. */
export const COLOR_DE_SERIE = [
  "var(--serie-1)",
  "var(--serie-2)",
  "var(--serie-3)",
  "var(--serie-4)",
] as const;

// Las clases se escriben enteras para que Tailwind las encuentre.
export const CLASE_DE_RELLENO = [
  "fill-serie-1",
  "fill-serie-2",
  "fill-serie-3",
  "fill-serie-4",
] as const;
export const CLASE_DE_TRAZO = [
  "stroke-serie-1",
  "stroke-serie-2",
  "stroke-serie-3",
  "stroke-serie-4",
] as const;

export type EstiloDeLinea = {
  readonly grosor: number;
  readonly guiones: string | undefined;
};

export const ESTILO_DE_LINEA: Readonly<Record<Trazo, EstiloDeLinea>> = {
  continuo: { grosor: 2.5, guiones: undefined },
  grueso: { grosor: 4, guiones: undefined },
  rayas: { grosor: 2.5, guiones: "9 5" },
  puntos: { grosor: 3, guiones: "1 6" },
};

/** Marcas hasta este número de puntos; con más, la línea va sin marcadores para no taparse. */
export const MAXIMO_DE_PUNTOS_CON_MARCADOR = 40;

export const trazoDe = (indice: number): Trazo => TRAZOS[indice % TRAZOS.length] ?? "continuo";
export const marcadorDe = (indice: number): TipoDeMarcador =>
  MARCADORES[indice % MARCADORES.length] ?? "circulo";
export const tramaDe = (indice: number): Trama => TRAMAS[indice % TRAMAS.length] ?? "lisa";
