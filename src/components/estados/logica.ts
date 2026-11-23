// Lógica pura de los estados de una vista (diseño 020, «Estados de cada vista»; REQ-022, REQ-023,
// REQ-026, REQ-027, REQ-057, REQ-069, REQ-077). Todo lo que llega a `EstadoVacio`, `EstadoError`,
// `EstadoSinPermiso` y `Esqueleto` pasa por aquí y cierra en fallo (artículo 3): un motivo que no es
// de la lista es «desconocido», una forma que no es de la lista es la tarjeta, un texto que no sale
// de `TEXTOS` no se pinta y una ruta que no es interna no se enlaza. No hay forma de pasar un
// mensaje libre (artículo 1, regla V-6).
import { construirRuta, esRutaInterna } from "../direccion/rutas";
import { esTextoFijo } from "../formulario/logica";
import { TEXTOS, type TextoFijo } from "../textos";

// --- motivos de error --------------------------------------------------------------------------

export type MotivoDeError = keyof typeof TEXTOS.motivosDeError;

/** Lista cerrada de motivos: sale de los textos fijos, así que no puede haber uno sin texto. */
export const MOTIVOS_DE_ERROR = Object.freeze(
  Object.keys(TEXTOS.motivosDeError) as MotivoDeError[],
);

export function leerMotivoDeError(valor: unknown): MotivoDeError {
  return typeof valor === "string" && Object.hasOwn(TEXTOS.motivosDeError, valor)
    ? (valor as MotivoDeError)
    : "desconocido";
}

/** «No se ha podido cargar» antepuesto cuando el texto del motivo no lo dice ya (REQ-028): así
 * aparece una sola vez con cualquier motivo. */
export function encabezadoDeError(motivo: MotivoDeError): TextoFijo | null {
  return TEXTOS.motivosDeError[motivo].includes(TEXTOS.bloque.noSePudoCargar)
    ? null
    : TEXTOS.bloque.noSePudoCargar;
}

// --- esqueleto ---------------------------------------------------------------------------------

export type FormaDeEsqueleto = "tarjeta" | "tabla" | "grafico" | "lista";
export const FORMAS_DE_ESQUELETO: readonly FormaDeEsqueleto[] = Object.freeze([
  "tarjeta",
  "tabla",
  "grafico",
  "lista",
]);

export function leerFormaDeEsqueleto(valor: unknown): FormaDeEsqueleto {
  return FORMAS_DE_ESQUELETO.find((f) => f === valor) ?? "tarjeta";
}

/** Filas que dibuja el esqueleto de una tabla: aproximado, no las 25 de una página llena. */
export const FILAS_DE_ESQUELETO_DE_TABLA = 5;
/** Elementos que dibuja el esqueleto de una lista. */
export const ELEMENTOS_DE_ESQUELETO_DE_LISTA = 3;

// --- textos y acción ---------------------------------------------------------------------------

/** Un texto fijo de `TEXTOS`, o el de respaldo. Nunca se pinta una cadena que no salga de ahí. */
export function leerTextoFijoOr(valor: unknown, respaldo: TextoFijo): TextoFijo {
  return esTextoFijo(valor) ? valor : respaldo;
}

export type AccionDeEstado = {
  readonly texto: TextoFijo;
  readonly alPulsar: () => void;
};

/** La acción del estado vacío: texto fijo y función, y nada más. Sin una de las dos, no hay botón. */
export function leerAccionDeEstado(bruta: unknown): AccionDeEstado | null {
  if (typeof bruta !== "object" || bruta === null || Array.isArray(bruta)) return null;
  const texto = Object.hasOwn(bruta, "texto") ? (bruta as Record<string, unknown>)["texto"] : null;
  const alPulsar = Object.hasOwn(bruta, "alPulsar")
    ? (bruta as Record<string, unknown>)["alPulsar"]
    : null;
  if (!esTextoFijo(texto) || typeof alPulsar !== "function") return null;
  return Object.freeze({ texto, alPulsar: alPulsar as () => void });
}

// --- sin permiso -------------------------------------------------------------------------------

/** Ruta del Resumen que enlaza el estado sin permiso: solo una ruta interna; si no, la del
 * Resumen de superadmin. El Resumen no depende del recurso pedido (V-1). */
export function leerRutaDelResumen(valor: unknown): string {
  return esRutaInterna(valor) ? valor : construirRuta("admin_resumen");
}
