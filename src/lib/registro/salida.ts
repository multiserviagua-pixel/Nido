import type { Nivel } from "./registro";

// Punto 4 del diseño: fuera de `desarrollo`, console.* se sustituye por una línea
// {nivel, codigo: "salida_no_estructurada"} sin argumentos. Cada sustituto lleva el original
// bajo ORIGINAL para que registro.ts siga escribiendo su línea estructurada.
export const ORIGINAL = Symbol.for("nido.console.original");

// Todos los métodos de console que emiten sus argumentos (o etiquetas de usuario).
type Metodo =
  | "log"
  | "info"
  | "debug"
  | "warn"
  | "error"
  | "dir"
  | "dirxml"
  | "trace"
  | "table"
  | "group"
  | "groupCollapsed"
  | "count"
  | "countReset"
  | "time"
  | "timeLog"
  | "timeEnd";
const NIVELES: Record<Metodo, Nivel> = {
  log: "info",
  info: "info",
  debug: "info",
  warn: "aviso",
  error: "error",
  dir: "info",
  dirxml: "info",
  trace: "aviso",
  table: "info",
  group: "info",
  groupCollapsed: "info",
  count: "info",
  countReset: "info",
  time: "info",
  timeLog: "info",
  timeEnd: "info",
};

// console.assert se sustituye por una función que no emite nada (ni etiquetas ni argumentos).
function sustituirAssert(): void {
  const actual = console.assert as unknown as Record<symbol, unknown>;
  if (actual[ORIGINAL] !== undefined) return;
  const original = console.assert.bind(console);
  const sustituto = (): void => undefined;
  Object.defineProperty(sustituto, ORIGINAL, { value: original, enumerable: false });
  (console as unknown as Record<string, unknown>).assert = sustituto;
}

export function sustituirConsola(): void {
  sustituirAssert();
  for (const metodo of Object.keys(NIVELES) as Metodo[]) {
    const actual = console[metodo] as unknown as Record<symbol, unknown>;
    if (actual[ORIGINAL] !== undefined) continue;
    const original = (console[metodo] as (...a: unknown[]) => void).bind(console);
    const nivel = NIVELES[metodo];
    const sustituto = (): void => {
      original(JSON.stringify({ nivel, codigo: "salida_no_estructurada" }));
    };
    Object.defineProperty(sustituto, ORIGINAL, { value: original, enumerable: false });
    (console as unknown as Record<string, unknown>)[metodo] = sustituto;
  }
}

export function consolaOriginal(metodo: "log" | "error"): (linea: string) => void {
  const actual = console[metodo] as unknown as Record<symbol, unknown>;
  const original = actual[ORIGINAL];
  return typeof original === "function"
    ? (original as (linea: string) => void)
    : (linea) => console[metodo](linea);
}
