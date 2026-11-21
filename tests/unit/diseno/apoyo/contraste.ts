// Contraste de WCAG 2.2 para PRUEBA-006 (020 T-007 (g)): luminancia relativa, razón de contraste y
// peor punto de un degradado (33 puntos repartidos entre sus colores, interpolados en sRGB).
import { coloresDeDegradado, hexARgb, rgbAHex } from "./valores";

export const PUNTOS_DE_DEGRADADO = 33;
export const UMBRAL_TEXTO = 4.5;
export const UMBRAL_NO_TEXTO = 3;

const canal = (c: number): number => {
  const s = c / 255;
  return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
};

export function luminancia(hex: string): number {
  const [r, g, b] = hexARgb(hex);
  return 0.2126 * canal(r) + 0.7152 * canal(g) + 0.0722 * canal(b);
}

export function contraste(a: string, b: string): number {
  const la = luminancia(a);
  const lb = luminancia(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

/** `n` colores repartidos de forma uniforme entre los extremos, interpolados canal a canal en sRGB. */
export function puntosDeDegradado(extremos: readonly string[], n = PUNTOS_DE_DEGRADADO): string[] {
  if (extremos.length < 2) return [...extremos];
  const tramos = extremos.length - 1;
  const salida: string[] = [];
  for (let i = 0; i < n; i++) {
    const t = (i / (n - 1)) * tramos;
    const k = Math.min(Math.floor(t), tramos - 1);
    const f = t - k;
    const a = hexARgb(extremos[k]!);
    const b = hexARgb(extremos[k + 1]!);
    salida.push(
      rgbAHex([0, 1, 2].map((j) => a[j]! + (b[j]! - a[j]!) * f) as [number, number, number]),
    );
  }
  return salida;
}

export type Medida = { razon: number; peorFondo: string };

/** Contraste de `delante` sobre `detras`, que es un color o un degradado (se da el peor punto). */
export function medir(delante: string, detras: string): Medida {
  const fondos = detras.startsWith("linear-gradient")
    ? puntosDeDegradado(coloresDeDegradado(detras))
    : [detras];
  let peor: Medida = { razon: Infinity, peorFondo: fondos[0]! };
  for (const f of fondos) {
    const razon = contraste(delante, f);
    if (razon < peor.razon) peor = { razon, peorFondo: f };
  }
  return peor;
}

export const formatoEs = (n: number): string => n.toFixed(2).replace(".", ",");

/** Tono (0 a 360) de un color, para comprobar que el acento es uno solo. */
export function tono(hex: string): number {
  const [r, g, b] = hexARgb(hex).map((x) => x / 255) as [number, number, number];
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  if (d === 0) return 0;
  const h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return (h * 60 + 360) % 360;
}
