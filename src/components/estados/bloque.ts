// Lógica pura de `BloqueDatos` (diseño 020, «Estados de cada vista» y «Cambio de periodo», punto 4;
// REQ-023, REQ-025, REQ-026, REQ-028, REQ-057, REQ-069). Lista cerrada de estados, los plazos de
// 10 s y 30 s y la regla de la respuesta tardía. Todo cierra en fallo (artículo 3): un estado que
// no es de la lista es un error, nunca datos, y un tiempo que no es un número sano cuenta como
// agotado, nunca como una espera infinita. Sin React ni navegador.
import { leerReferencia } from "../../lib/errores/referencia";
import { TEXTOS } from "../textos";
import { leerMotivoDeError, type MotivoDeError } from "./logica";

// --- estados -----------------------------------------------------------------------------------

export const ESTADOS_DE_BLOQUE = Object.freeze([
  "carga",
  "vacio",
  "error",
  "sin_permiso",
  "datos",
] as const);
export type EstadoDeBloque = (typeof ESTADOS_DE_BLOQUE)[number];

/** El estado que se pide. Lo que no es de la lista es un error: nunca se pinta como datos. */
export function leerEstadoDeBloque(valor: unknown): EstadoDeBloque {
  return ESTADOS_DE_BLOQUE.find((e) => e === valor) ?? "error";
}

// --- plazos ------------------------------------------------------------------------------------

/** A los 10 s cargando se avisa de que tarda más de lo normal. */
export const PLAZO_DE_AVISO_MS = 10_000;
/** A los 30 s cargando se pasa a error (sin cancelar la petición). */
export const PLAZO_DE_ERROR_MS = 30_000;

export type FaseDeCarga = "normal" | "lenta" | "agotada";

export function faseDeCarga(milisegundos: number): FaseDeCarga {
  if (typeof milisegundos !== "number" || !Number.isFinite(milisegundos)) return "agotada";
  if (milisegundos >= PLAZO_DE_ERROR_MS) return "agotada";
  if (milisegundos >= PLAZO_DE_AVISO_MS) return "lenta";
  return "normal";
}

export type BloqueResuelto = {
  /** Lo que se pinta. */
  readonly estado: EstadoDeBloque;
  /** Carga que ya tarda más de lo normal (solo con `estado` igual a `carga`). */
  readonly lenta: boolean;
  /** Motivo propio del bloque (`tarda_demasiado` a los 30 s); `null` si lo da la vista. */
  readonly motivo: MotivoDeError | null;
};

/** Qué se ve según el estado pedido y cuánto lleva cargando. A los 30 s, la carga se pinta como
 * error `tarda_demasiado`; la petición no se cancela y, si la respuesta llega, la vista cambia el
 * estado y el error desaparece. */
export function resolverBloque(estadoPedido: unknown, fase: FaseDeCarga): BloqueResuelto {
  const estado = leerEstadoDeBloque(estadoPedido);
  if (estado !== "carga") return { estado, lenta: false, motivo: null };
  if (fase === "agotada") return { estado: "error", lenta: false, motivo: "tarda_demasiado" };
  return { estado: "carga", lenta: fase === "lenta", motivo: null };
}

// --- anuncio del error -------------------------------------------------------------------------

/** Lo que se anuncia al entrar en error (una sola vez): el texto fijo del motivo y, si hay una
 * referencia con el formato exacto, la referencia. */
export function anuncioDeError(motivo: unknown, referencia: unknown): string {
  const texto = TEXTOS.motivosDeError[leerMotivoDeError(motivo)];
  const valida = leerReferencia(referencia);
  return valida === null ? texto : `${texto} ${TEXTOS.bloque.referencia}: ${valida}`;
}

// --- lectura y respuesta tardía ----------------------------------------------------------------

/** Lo que sabe la vista de una fuente: en qué envío está y qué estado tiene. Cada «Reintentar»
 * abre un envío nuevo; una respuesta lleva el número del envío al que contesta. */
export type LecturaDeBloque = {
  readonly envio: number;
  readonly estado: EstadoDeBloque;
  readonly motivo: MotivoDeError | null;
};

export const LECTURA_INICIAL: LecturaDeBloque = Object.freeze({
  envio: 1,
  estado: "carga",
  motivo: null,
});

export type EventoDeLectura =
  | { readonly tipo: "pedir" }
  | {
      readonly tipo: "llega";
      readonly envio: number;
      readonly estado: Exclude<EstadoDeBloque, "carga">;
      readonly motivo?: unknown;
    };

/** La respuesta tardía solo provoca relectura y nunca pisa un estado ya final: se acepta la
 * respuesta del envío en curso mientras siga en carga (aunque el bloque ya haya pintado el error
 * de los 30 s, que es solo visual); la de un envío anterior, la de un envío que no existe y una
 * segunda del mismo envío se descartan y devuelven la misma lectura. */
export function reducirLectura(actual: LecturaDeBloque, evento: EventoDeLectura): LecturaDeBloque {
  if (typeof evento !== "object" || evento === null) return actual;
  if (evento.tipo === "pedir") {
    return Object.freeze({ envio: actual.envio + 1, estado: "carga", motivo: null });
  }
  if (evento.tipo !== "llega") return actual;
  if (evento.envio !== actual.envio || actual.estado !== "carga") return actual;
  if ((evento.estado as unknown) === "carga") return actual;
  const estado = leerEstadoDeBloque(evento.estado);
  const motivo = estado === "error" ? leerMotivoDeError(evento.motivo) : null;
  return Object.freeze({ envio: actual.envio, estado, motivo });
}
