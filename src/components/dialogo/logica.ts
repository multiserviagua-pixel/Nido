// Lógica del diálogo de confirmación (diseño 020, «Diálogo, cajón y avisos», fila
// `DialogoConfirmacion`, y «Acciones que cambian algo»; REQ-017, REQ-018, REQ-056, REQ-065,
// REQ-073, REQ-074, REQ-078). Sin React ni red: las decisiones del componente son funciones puras,
// que se prueban sin navegador y valen igual en el servidor y en el navegador.
//
// - La acción y el dato distintivo son claves de listas cerradas; todo el texto sale de `textos.ts`.
// - El objetivo `{nombre, distintivo}` es el único texto libre (un dato): se lee clave a clave, sin
//   caracteres de control ni de dirección, y se pinta aparte con `TextoDato`.
// - Qué se ve tras cada resultado de `leerResultadoAccion` (hecha, rechazada, no_permitida,
//   incierta) lo decide `presentarResultado`: nada de lo recibido del servidor llega a la pantalla.
import type { VarianteDeBoton } from "../acciones/Boton";
import type { LecturaDeAccion } from "../acciones/resultado";
import { textoPlano } from "../formato/texto-plano";
import { TEXTOS } from "../textos";

export const ACCIONES_DE_DIALOGO = [
  "pausar_agente",
  "reanudar_agente",
  "revocar_licencia",
  "publicar_version",
  "volver_atras_version",
] as const;
export type ClaveDeAccionDeDialogo = (typeof ACCIONES_DE_DIALOGO)[number];

export const DATOS_DISTINTIVOS = ["identificador", "alta", "plan"] as const;
export type ClaveDeDatoDistintivo = (typeof DATOS_DISTINTIVOS)[number];

function deLaLista<T extends string>(lista: readonly T[], valor: unknown): T | null {
  return typeof valor === "string" ? (lista.find((x) => x === valor) ?? null) : null;
}

export function leerAccionDeDialogo(valor: unknown): ClaveDeAccionDeDialogo | null {
  return deLaLista(ACCIONES_DE_DIALOGO, valor);
}

export function leerDatoDistintivo(valor: unknown): ClaveDeDatoDistintivo | null {
  return deLaLista(DATOS_DISTINTIVOS, valor);
}

/** Variante del botón de confirmar: `peligro` para lo que para o quita algo y `primario` para lo
 * que lo pone en marcha. En los dos casos el foco inicial es «Cancelar», nunca este botón. */
const VARIANTE_DE_ACCION: Readonly<Record<ClaveDeAccionDeDialogo, VarianteDeBoton>> = {
  pausar_agente: "peligro",
  reanudar_agente: "primario",
  revocar_licencia: "peligro",
  publicar_version: "primario",
  volver_atras_version: "peligro",
};

export function variantePorAccion(accion: ClaveDeAccionDeDialogo): VarianteDeBoton {
  return VARIANTE_DE_ACCION[accion];
}

export type ObjetivoLeido = { readonly nombre: string; readonly distintivo: string };

function propio(objeto: object, clave: string): unknown {
  return Object.hasOwn(objeto, clave) ? (objeto as Record<string, unknown>)[clave] : undefined;
}

function limpio(valor: unknown): string {
  if (typeof valor !== "string") return TEXTOS.dialogo.sinNombre;
  const t = textoPlano(valor);
  return t.trim() === "" ? TEXTOS.dialogo.sinNombre : t;
}

/** Lee el objetivo: solo las claves propias `nombre` y `distintivo`, sin controles ni caracteres de
 * dirección y sin recortar. Lo que no se pueda leer cierra en un texto fijo, nunca en vacío. */
export function leerObjetivo(valor: unknown): ObjetivoLeido {
  try {
    if (typeof valor !== "object" || valor === null || Array.isArray(valor)) {
      return { nombre: TEXTOS.dialogo.sinNombre, distintivo: TEXTOS.dialogo.sinNombre };
    }
    return Object.freeze({
      nombre: limpio(propio(valor, "nombre")),
      distintivo: limpio(propio(valor, "distintivo")),
    });
  } catch {
    return { nombre: TEXTOS.dialogo.sinNombre, distintivo: TEXTOS.dialogo.sinNombre };
  }
}

export type VistaDelResultado = {
  /** Texto fijo que se ve y se anuncia, o `null` en reposo. */
  readonly mensaje: string | null;
  /** El diálogo se cierra solo (la acción se aplicó). */
  readonly cierra: boolean;
  readonly mostrarConfirmar: boolean;
  /** Texto del botón que cierra: «Cancelar» antes de saber el resultado y «Cerrar» cuando ya no hay
   * nada que cancelar. */
  readonly cierre: "cancelar" | "cerrar";
  /** Botón que relee el estado real (solo con resultado incierto). */
  readonly ofrecerComprobar: boolean;
};

const EN_REPOSO: VistaDelResultado = Object.freeze({
  mensaje: null,
  cierra: false,
  mostrarConfirmar: true,
  cierre: "cancelar",
  ofrecerComprobar: false,
});

function motivoConTexto(motivo: string): string {
  return Object.hasOwn(TEXTOS.acciones.motivosDeRechazo, motivo)
    ? (TEXTOS.acciones.motivosDeRechazo as Record<string, string>)[motivo]!
    : "";
}

/** Qué se ve tras el resultado de una acción. Cierra en `incierta` ante un resultado que no es de la
 * lista (artículo 3). */
export function presentarResultado(lectura: LecturaDeAccion | null): VistaDelResultado {
  if (lectura === null) return EN_REPOSO;
  switch (lectura.resultado) {
    case "hecha":
      return {
        mensaje: TEXTOS.acciones.resultado.hecha,
        cierra: true,
        mostrarConfirmar: false,
        cierre: "cerrar",
        ofrecerComprobar: false,
      };
    case "rechazada":
      return {
        mensaje: `${TEXTOS.acciones.resultado.rechazada} ${motivoConTexto(lectura.motivo)}`.trim(),
        cierra: false,
        mostrarConfirmar: true,
        cierre: "cancelar",
        ofrecerComprobar: false,
      };
    case "no_permitida":
      return {
        mensaje: TEXTOS.acciones.noPermitida,
        cierra: false,
        mostrarConfirmar: false,
        cierre: "cerrar",
        ofrecerComprobar: false,
      };
    default:
      return {
        mensaje: TEXTOS.acciones.resultado.incierta,
        cierra: false,
        mostrarConfirmar: false,
        cierre: "cerrar",
        ofrecerComprobar: true,
      };
  }
}

/** Con la acción en curso el diálogo no se cierra: ya se envió y cerrarlo ocultaría el resultado,
 * que puede ser «no se sabe si se aplicó». Dura como mucho el plazo de 30 s de `useAccion`. */
export function puedeCerrarse(enCurso: boolean): boolean {
  return !enCurso;
}
