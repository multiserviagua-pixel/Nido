// Ajuste del tamaño del valor de `TarjetaCifra` (diseño 020, «Componentes base», fila
// `TarjetaCifra`; REQ-081, CA-050). El valor no se abrevia ni se corta: baja por pasos de la
// escala de texto hasta que cabe. El tamaño no puede ir en un `style` (PRUEBA-005) ni en una clase
// de valor arbitrario, así que cada paso es una clase de la escala y aquí solo se decide qué paso.
// Sin React: se prueba sola. La parte que mide el navegador está en `ValorAjustado.tsx`.

/** De mayor a menor, los pasos de la escala de `docs/DISENO.md` («Texto») que usa el valor. */
export const PASOS_DE_CIFRA = [
  "cifra",
  "titulo",
  "subtitulo",
  "cuerpo",
  "cuerpo-menor",
  "pequeno",
] as const;
export type PasoDeCifra = (typeof PASOS_DE_CIFRA)[number];

/** Una clase por paso, escrita entera para que Tailwind la encuentre. */
export const CLASE_DE_PASO: Readonly<Record<PasoDeCifra, string>> = {
  cifra: "text-cifra",
  titulo: "text-titulo",
  subtitulo: "text-subtitulo",
  cuerpo: "text-cuerpo",
  "cuerpo-menor": "text-cuerpo-menor",
  pequeno: "text-pequeno",
};

/**
 * Paso de partida según los caracteres, para lo que se pinta antes de que el navegador mida (y sin
 * JavaScript). Pensado para el caso más estrecho (una tarjeta de unos 224 px de ancho útil a 320 px
 * de ventana) con cifras tabulares de ~0,62 em por carácter. Cada valor es el mayor número de
 * caracteres que cabe en ese paso. «999.999.999» (11) cabe en el mayor.
 */
const CARACTERES_MAXIMOS: Readonly<Record<PasoDeCifra, number>> = {
  cifra: 12,
  titulo: 15,
  subtitulo: 20,
  cuerpo: 22,
  "cuerpo-menor": 25,
  pequeno: 30,
};

/** Índice del paso de partida. Con más caracteres de los que caben en el último, el último (el
 * texto se parte, no se corta). */
export function pasoInicial(texto: string): number {
  const n = typeof texto === "string" ? texto.length : 0;
  const indice = PASOS_DE_CIFRA.findIndex((paso) => n <= CARACTERES_MAXIMOS[paso]);
  return indice === -1 ? PASOS_DE_CIFRA.length - 1 : indice;
}

/** Lee los píxeles de cada paso a partir de las variables de la escala (`--escala-texto-<paso>`,
 * de `valores.css`), para no repetir aquí sus valores. `null` si falta alguna o no es un píxel. */
export function leerTamanos(leerVariable: (nombre: string) => string): number[] | null {
  const tamanos: number[] = [];
  for (const paso of PASOS_DE_CIFRA) {
    const crudo = leerVariable(`--escala-texto-${paso}`).trim();
    const px = Number(crudo.slice(0, -2));
    if (!crudo.endsWith("px") || !Number.isFinite(px) || px <= 0) return null;
    tamanos.push(px);
  }
  return tamanos;
}

export type EntradaDeAjuste = {
  /** Píxeles de cada paso, de mayor a menor. */
  tamanos: readonly number[];
  /** Índice del paso con el que se ha medido. */
  actual: number;
  /** Ancho del valor sin partir, en el paso actual. */
  natural: number;
  /** Ancho disponible en la tarjeta. */
  disponible: number;
  /** Solo se sube de paso cuando ha cambiado el ancho: así un redondeo no hace oscilar el tamaño. */
  puedeSubir: boolean;
};

/** El mayor paso que cabe, suponiendo que el ancho crece en proporción al tamaño de letra y con un
 * píxel de margen. Si ni el último cabe, el último. Con medidas imposibles no cambia nada. */
export function elegirPaso({
  tamanos,
  actual,
  natural,
  disponible,
  puedeSubir,
}: EntradaDeAjuste): number {
  const valida = (n: number): boolean => Number.isFinite(n) && n > 0;
  const tamanoActual = tamanos[actual];
  if (!valida(natural) || !valida(disponible) || tamanoActual === undefined) return actual;
  const objetivo = (tamanoActual * (disponible - 1)) / natural;
  const indice = tamanos.findIndex((t) => t <= objetivo);
  const nuevo = indice === -1 ? tamanos.length - 1 : indice;
  return puedeSubir ? nuevo : Math.max(nuevo, actual);
}
