// Variación entre dos periodos (diseño, «Formatos», REQ-053 y REQ-055). El signo y el texto van
// siempre; la valoración (favorable o no) no se decide aquí, la declara la vista.
import { TEXTOS } from "../textos";
import { ESPACIO_SIN_PARTIR, SIGNO_MENOS, formatearNumero } from "./numeros";

export type TipoDeVariacion =
  "positiva" | "negativa" | "nula" | "anterior_cero" | "sin_comparacion";

export type Variacion = {
  tipo: TipoDeVariacion;
  /** Lo que se ve: `+12,5 %`, `−10,0 %`, `0 %`, `+50` o «Sin datos para comparar». */
  texto: string;
  sentido: "sube" | "baja" | "igual" | null;
  /** Palabra que acompaña al texto cuando el signo no basta: «Sin cambios». */
  palabra: string | null;
};

const SIN_COMPARACION: Variacion = {
  tipo: "sin_comparacion",
  texto: TEXTOS.formato.sinDatosParaComparar,
  sentido: null,
  palabra: null,
};

const esNumero = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);

/** Cierra en «Sin datos para comparar» ante cualquier cosa que no sea una comparación completa:
 * el periodo anterior tiene que estar marcado como completo con `true` exacto. */
export function calcularVariacion(
  actual: unknown,
  anterior: unknown,
  anteriorCompleto: boolean,
  opciones: { decimales?: number } = {},
): Variacion {
  if (anteriorCompleto !== true || !esNumero(actual) || !esNumero(anterior)) {
    return SIN_COMPARACION;
  }
  if (actual === anterior) {
    return {
      tipo: "nula",
      texto: `0${ESPACIO_SIN_PARTIR}%`,
      sentido: "igual",
      palabra: TEXTOS.formato.sinCambios,
    };
  }
  const sube = actual > anterior;
  const signo = sube ? "+" : SIGNO_MENOS;
  const sentido = sube ? "sube" : "baja";
  if (anterior === 0) {
    const diferencia = formatearNumero(Math.abs(actual), opciones.decimales);
    if (diferencia === TEXTOS.formato.sinDatos) return SIN_COMPARACION;
    return { tipo: "anterior_cero", texto: `${signo}${diferencia}`, sentido, palabra: null };
  }
  const porcentaje = formatearNumero((Math.abs(actual - anterior) / Math.abs(anterior)) * 100, 1);
  if (porcentaje === TEXTOS.formato.sinDatos) return SIN_COMPARACION;
  return {
    tipo: sube ? "positiva" : "negativa",
    texto: `${signo}${porcentaje}${ESPACIO_SIN_PARTIR}%`,
    sentido,
    palabra: null,
  };
}
