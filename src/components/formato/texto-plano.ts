// Texto que llega como dato (diseño, «Texto literal»; REQ-056, REQ-071). Un dato es un dato: se
// pinta como texto y nunca se interpreta. Este archivo es, junto con `TextoDato`, el control
// principal contra la ejecución de código si no hay una política de contenido estricta.

const EXCEPTO_UNIR = new Set([0x200c, 0x200d]); // U+200C y U+200D unen letras y emojis.
const SEPARADOR_DE_LINEA = 0x2028;
const SEPARADOR_DE_PARRAFO = 0x2029;

const CONTROL = /^\p{Cc}$/u;
const FORMATO = /^\p{Cf}$/u;

function sobra(caracter: string): boolean {
  const punto = caracter.codePointAt(0);
  if (punto === undefined) return false;
  if (punto === SEPARADOR_DE_LINEA || punto === SEPARADOR_DE_PARRAFO) return true;
  if (CONTROL.test(caracter)) return true;
  // Toda la categoría Cf, por categoría y no por lista, para no dejar huecos: dirección,
  // invisibles y etiquetas. Consecuencia aceptada: las banderas hechas con etiquetas se pierden.
  return FORMATO.test(caracter) && !EXCEPTO_UNIR.has(punto);
}

/** Quita, y solo de lo que se pinta, los caracteres de control (Cc), la categoría Cf salvo
 * U+200C y U+200D, y los separadores de línea y de párrafo. No escapa nada: el escapado lo hace
 * React al pintar un nodo de texto. Lo que no es una cadena da una cadena vacía. */
export function textoPlano(cadena: unknown): string {
  if (typeof cadena !== "string") return "";
  let salida = "";
  for (const caracter of cadena) {
    if (!sobra(caracter)) salida += caracter;
  }
  return salida;
}
