// Números y porcentajes (diseño, «Formatos»). Implementación propia: punto cada tres cifras,
// también en cuatro («1.234»), y coma decimal. No se usa `Intl.NumberFormat`, que en español no
// agrupa los números de cuatro cifras. El signo de un negativo es el signo menos (U+2212).
import { TEXTOS } from "../textos";

export const SIGNO_MENOS = "\u2212";
export const ESPACIO_SIN_PARTIR = "\u00A0";

const DECIMALES_MAXIMOS = 6;
// Por encima de esto el número ya no se puede pintar sin perder cifras: se trata como ausente.
const LIMITE = 1e15;

function acotarDecimales(decimales: unknown): number {
  if (typeof decimales !== "number" || !Number.isFinite(decimales)) return 0;
  return Math.min(DECIMALES_MAXIMOS, Math.max(0, Math.trunc(decimales)));
}

function agruparMiles(entero: string): string {
  let salida = "";
  for (let i = 0; i < entero.length; i++) {
    if (i > 0 && (entero.length - i) % 3 === 0) salida += ".";
    salida += entero.charAt(i);
  }
  return salida;
}

/** `1.234`, `1.234.567`, `0,5` (con 1 decimal). Lo que no es un número finito y manejable es
 * «Sin datos». Un negativo que se redondea a cero no lleva signo. */
export function formatearNumero(valor: number, decimales: number = 0): string {
  if (typeof valor !== "number" || !Number.isFinite(valor) || Math.abs(valor) >= LIMITE) {
    return TEXTOS.formato.sinDatos;
  }
  const d = acotarDecimales(decimales);
  // `toPrecision(15)` quita el ruido binario (1,005 * 100 = 100,49999…) antes de redondear.
  const escalado = Math.round(Number((Math.abs(valor) * 10 ** d).toPrecision(15)));
  const cifras = BigInt(escalado)
    .toString()
    .padStart(d + 1, "0");
  const entero = agruparMiles(cifras.slice(0, cifras.length - d));
  const fraccion = d > 0 ? `,${cifras.slice(cifras.length - d)}` : "";
  const signo = valor < 0 && escalado > 0 ? SIGNO_MENOS : "";
  return `${signo}${entero}${fraccion}`;
}

/** `28,4 %`, con espacio que no se parte entre el número y el signo. */
export function formatearPorcentaje(valor: number, decimales: number = 1): string {
  const numero = formatearNumero(valor, decimales);
  return numero === TEXTOS.formato.sinDatos ? numero : `${numero}${ESPACIO_SIN_PARTIR}%`;
}

export type OpcionesDeCifra = {
  /** Valor mínimo admitido; por debajo, «ausente». Por defecto 0: una cifra de conteo no es negativa. */
  minimo?: number;
};

/** Un número utilizable o `"ausente"`. Ausente, no numérico (una cadena no se convierte), no
 * finito o por debajo del mínimo es «ausente». Cero es cero. */
export function leerCifra(valor: unknown, opciones: OpcionesDeCifra = {}): number | "ausente" {
  const minimo = opciones.minimo ?? 0;
  if (typeof valor !== "number" || !Number.isFinite(valor)) return "ausente";
  return valor >= minimo ? valor : "ausente";
}

export type CifraLeida = {
  ausente: boolean;
  /** Lo que se ve. */
  texto: string;
  /** Lo que lee el lector de pantalla: el mismo texto. */
  textoAccesible: string;
};

/** Lectura y formato juntos, para que lo que se ve y lo que se lee no puedan separarse. */
export function formatearCifra(
  valor: unknown,
  opciones: OpcionesDeCifra & { decimales?: number } = {},
): CifraLeida {
  const leido = leerCifra(valor, opciones);
  const texto =
    leido === "ausente" ? TEXTOS.formato.sinDatos : formatearNumero(leido, opciones.decimales);
  const ausente = texto === TEXTOS.formato.sinDatos;
  return { ausente, texto, textoAccesible: texto };
}
