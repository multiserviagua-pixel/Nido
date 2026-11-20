// Referencia opaca de un error (020, diseño «Errores sin datos internos y referencia opaca»;
// REQ-057). Una letra de origen (`S` servidor, `N` navegador), un guion y 10 caracteres al azar
// de un alfabeto de 32 símbolos sin letras dudosas (sin I, L, O ni U).
//
// - Se crea con el generador criptográfico (Web Crypto, disponible en Node y en el navegador).
//   No deriva de la hora, del usuario, del recurso ni del error. Sin generador, no se crea nada.
// - `leerReferencia` devuelve el valor solo si cumple el formato exacto; si no, lo descarta.
//   Así el campo no puede llevar un mensaje interno a la pantalla ni un valor recibido al registro.
//
// Este archivo lo puede importar cualquier módulo (excepción de PRUEBA-008), también del
// navegador: no usa `node:` ni paquetes, y de `src/lib/` solo trae el error de la aplicación.
import { ErrorDeAplicacion } from "../plataforma/errores";

/** Formato exacto de la referencia. */
export const FORMATO_DE_REFERENCIA = /^[SN]-[0-9A-HJKMNP-TV-Z]{10}$/;

const ALFABETO = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
const LONGITUD = 10;
const LETRA_DE_ORIGEN = { servidor: "S", navegador: "N" } as const;

export type OrigenDeReferencia = keyof typeof LETRA_DE_ORIGEN;

/** Una cadena que ha pasado por `crearReferencia` o por `leerReferencia`. */
export type Referencia = string & { readonly __referencia: true };

export function crearReferencia(origen: OrigenDeReferencia): Referencia {
  if (origen !== "servidor" && origen !== "navegador") {
    throw new ErrorDeAplicacion("entrada_invalida");
  }
  const azar = new Uint8Array(LONGITUD);
  globalThis.crypto.getRandomValues(azar);
  let cuerpo = "";
  // 256 es múltiplo de 32: tomar 5 bits de cada byte no sesga el reparto.
  for (const byte of azar) cuerpo += ALFABETO[byte & 31];
  const referencia = `${LETRA_DE_ORIGEN[origen]}-${cuerpo}`;
  // Cierre en fallo: lo que no cumple el formato no sale de aquí.
  if (!FORMATO_DE_REFERENCIA.test(referencia)) throw new ErrorDeAplicacion("error_no_controlado");
  return referencia as Referencia;
}

/** Devuelve la referencia si `valor` es una cadena con el formato exacto; si no, `null`. */
export function leerReferencia(valor: unknown): Referencia | null {
  if (typeof valor !== "string" || valor.length !== LONGITUD + 2) return null;
  return FORMATO_DE_REFERENCIA.test(valor) ? (valor as Referencia) : null;
}
