// Código de activación del conector (T-108 e, 001): generación y normalización, sin dependencias de la ruta.
import { randomBytes } from "node:crypto";

const LONGITUD_MAXIMA_ENTRADA = 64;
const ALFABETO = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";

// Código de activación: 12 caracteres Crockford base32 (60 bits) del generador criptográfico, en tres
// grupos de cuatro. `byte & 31` es uniforme (256 es múltiplo de 32).
export function nuevoCodigoActivacion(): string {
  const bytes = randomBytes(12);
  const simbolos = Array.from(bytes, (b) => ALFABETO.charAt(b & 31));
  return [simbolos.slice(0, 4), simbolos.slice(4, 8), simbolos.slice(8, 12)]
    .map((g) => g.join(""))
    .join("-");
}

// Normaliza lo tecleado antes del HMAC: mayúsculas, sin guiones ni espacios, I y L valen 1, O vale 0.
// Lo que no sea exactamente 12 símbolos del alfabeto no es un código (null).
export function normalizarCodigo(texto: string): string | null {
  // Lo tecleado nunca pasa de unos 20 caracteres con separadores; más de 64 no es un código y no se procesa.
  if (texto.length > LONGITUD_MAXIMA_ENTRADA) return null;
  const limpio = texto
    .toUpperCase()
    .replaceAll(/[-\s]/g, "")
    .replaceAll("O", "0")
    .replaceAll(/[IL]/g, "1");
  return /^[0-9A-HJKMNP-TV-Z]{12}$/.test(limpio) ? limpio : null;
}
