import { createHash, createHmac, hkdfSync, randomBytes, timingSafeEqual } from "node:crypto";
import { secretoAceptable } from "../plataforma/configuracion";
import { ErrorDeAplicacion } from "../plataforma/errores";

// Secretos del conector (diseño §Tokens). Nada de lo que se calcula aquí se guarda en claro ni se
// registra: la base de datos solo ve huellas (HMAC en hexadecimal) y la sal, que no es secreta.
// Este módulo no lee process.env: recibe el secreto ya validado por `configuracion.ts`.

const ETIQUETAS = {
  guardado: "hia:conector:guardado:v1",
  derivacion: "hia:conector:derivacion:v1",
  origen: "hia:conector:origen:v1",
  ligadura: "hia:conector:ligadura:v1",
} as const;

export interface Claves {
  readonly guardado: Buffer;
  readonly derivacion: Buffer;
  readonly origen: Buffer;
  readonly ligadura: Buffer;
}

export type TipoToken = "acceso" | "renovacion";
// Tipos con los que se guarda un valor: tokens y los dos códigos (el tipo va dentro del HMAC).
export type TipoGuardado = TipoToken | "codigo_autorizacion" | "codigo_activacion";

const PREFIJOS: Record<TipoToken, string> = { acceso: "hia_a_", renovacion: "hia_r_" };
const RE_CUERPO_TOKEN = /^[A-Za-z0-9_-]{43}$/;
const RE_SAL = /^[A-Za-z0-9_-]{22}$/;
const RE_HEX_64 = /^[0-9a-f]{64}$/;
const RE_CREDENCIAL_OPERACION = /^hia_op_[A-Za-z0-9_-]{43}$/;
const SEPARADOR = Buffer.from([0]);

// HKDF-SHA-256 del secreto con una etiqueta por uso: ninguna clave sirve para otro fin.
// Un secreto débil o mal formado no deriva nada (cierre en fallo; el código no lleva el valor).
export function derivarClaves(secreto: string): Claves {
  if (!secretoAceptable(secreto)) {
    throw new ErrorDeAplicacion("configuracion_conector_invalida");
  }
  const material = Buffer.from(secreto, "utf8");
  const derivar = (etiqueta: string): Buffer =>
    Buffer.from(hkdfSync("sha256", material, Buffer.alloc(0), etiqueta, 32));
  return {
    guardado: derivar(ETIQUETAS.guardado),
    derivacion: derivar(ETIQUETAS.derivacion),
    origen: derivar(ETIQUETAS.origen),
    ligadura: derivar(ETIQUETAS.ligadura),
  };
}

const hmacHex = (clave: Buffer, ...partes: (string | Buffer)[]): string => {
  const h = createHmac("sha256", clave);
  for (const p of partes) h.update(p);
  return h.digest("hex");
};

// Token opaco de acceso o renovación: prefijo + 256 bits del generador criptográfico en base64url.
export function nuevoToken(tipo: TipoToken): string {
  return PREFIJOS[tipo] + randomBytes(32).toString("base64url");
}

// Sal de la rotación: 128 bits del generador criptográfico, 22 caracteres base64url.
export function generarSal(): string {
  return randomBytes(16).toString("base64url");
}

// Lo que se guarda y se busca en la base de datos: HMAC-SHA-256(guardado, "tipo:valor").
export function huellaToken(claves: Claves, tipo: TipoGuardado, valor: string): string {
  return hmacHex(claves.guardado, `${tipo}:${valor}`);
}

// HMAC del origen de la petición (límites de intentos): el origen nunca se guarda en claro.
export function huellaOrigen(claves: Claves, origen: string): string {
  return hmacHex(claves.origen, origen);
}

// HMAC de un valor de ligadura (`state`, cookie de activación); el ámbito evita reutilizarlo.
export type AmbitoLigadura = "state" | "activacion";
const AMBITOS: readonly string[] = ["state", "activacion"];

export function huellaLigadura(claves: Claves, ambito: AmbitoLigadura, valor: string): string {
  // El tipo no basta en ejecución: un ámbito fuera de la lista cierra en fallo (MENOR-2).
  if (!AMBITOS.includes(ambito)) throw new ErrorDeAplicacion("entrada_invalida");
  return hmacHex(claves.ligadura, ambito, SEPARADOR, valor);
}

function tokenBase64(hmacHexValor: string, tipo: TipoToken): string {
  return PREFIJOS[tipo] + Buffer.from(hmacHexValor, "hex").toString("base64url");
}

// Par derivado de (token de renovación presentado, sal): la repetición dentro de la gracia da el
// mismo par sin guardarlo. acceso = HMAC(kd, "acceso" ‖ 0x00 ‖ t ‖ sal), renovación igual con su
// tipo. Una forma incorrecta se rechaza sin eco.
export function derivarPar(
  claves: Claves,
  tokenPresentado: string,
  sal: string,
): { readonly acceso: string; readonly renovacion: string } {
  const p = PREFIJOS.renovacion;
  if (
    !tokenPresentado.startsWith(p) ||
    !RE_CUERPO_TOKEN.test(tokenPresentado.slice(p.length)) ||
    !RE_SAL.test(sal)
  ) {
    throw new ErrorDeAplicacion("entrada_invalida");
  }
  const calcular = (tipo: TipoToken): string =>
    tokenBase64(hmacHex(claves.derivacion, tipo, SEPARADOR, tokenPresentado, sal), tipo);
  return { acceso: calcular("acceso"), renovacion: calcular("renovacion") };
}

// Comparación en tiempo constante de dos cadenas de cualquier longitud (se comparan sus SHA-256).
export function iguales(a: string, b: string): boolean {
  const da = createHash("sha256").update(a, "utf8").digest();
  const db = createHash("sha256").update(b, "utf8").digest();
  return timingSafeEqual(da, db);
}

// Credencial de operación frente a `OPERACION_HUELLA` (SHA-256 en hexadecimal minúscula), en
// tiempo constante. Con forma incorrecta de cualquiera de las dos, no coincide y no se evalúa.
export function coincideHuellaOperacion(credencial: string, huellaEsperada: string): boolean {
  if (!RE_CREDENCIAL_OPERACION.test(credencial) || !RE_HEX_64.test(huellaEsperada)) return false;
  const calculada = createHash("sha256").update(credencial, "utf8").digest();
  return timingSafeEqual(calculada, Buffer.from(huellaEsperada, "hex"));
}
