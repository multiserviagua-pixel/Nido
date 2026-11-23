// Lógica pura de `AvisosTemporales` (diseño 020, «Diálogo, cajón y avisos» y «Avisos: componente
// propio (enmienda 1)»; REQ-021, REQ-072). Sin React ni navegador: el plazo de 8 s con sus dos
// pausas (puntero y foco), la pila de avisos y su orden, y la lista cerrada de claves.
//
// Un aviso es una clave de `TEXTOS.avisos.mensajes` y un número. No tiene gravedad, tono ni texto
// propio: no hay avisos de error ni forma de pasar una cadena (art. 1; lo prueba el compilador en
// `tests/unit/diseno/avisos-logica.test.ts`).
import { TEXTOS } from "../textos";

/** Duración de un aviso sin puntero ni foco encima. El mínimo de REQ-021 es 5 s. */
export const DURACION_DE_AVISO_MS = 8000;

/** Avisos a la vez como mucho. Pasado el tope se retira el más antiguo (ya se anunció). */
export const TOPE_DE_AVISOS = 20;

/** Destino del foco cuando el elemento anterior ya no existe: el contenido principal, al que lleva
 * el enlace de salto del armazón (`ID_CONTENIDO`, que una prueba compara con este valor). */
export const ID_DE_RESPALDO_DEL_FOCO = "contenido-principal";

export type ClaveDeAviso = keyof typeof TEXTOS.avisos.mensajes;

export const CLAVES_DE_AVISO: readonly ClaveDeAviso[] = Object.freeze(
  Object.keys(TEXTOS.avisos.mensajes) as ClaveDeAviso[],
);

/** Lee una clave de la lista cerrada; todo lo demás es `null` (cierra en fallo). */
export function leerClaveDeAviso(valor: unknown): ClaveDeAviso | null {
  if (typeof valor !== "string") return null;
  return CLAVES_DE_AVISO.find((c) => c === valor) ?? null;
}

export function textoDeAviso(clave: ClaveDeAviso): string {
  return TEXTOS.avisos.mensajes[clave];
}

export type AvisoTemporal = { readonly id: number; readonly clave: ClaveDeAviso };

export type PilaDeAvisos = {
  readonly siguiente: number;
  readonly avisos: readonly AvisoTemporal[];
};

export const PILA_VACIA: PilaDeAvisos = Object.freeze({ siguiente: 0, avisos: [] });

export type AccionDePila =
  | { readonly tipo: "anadir"; readonly clave: ClaveDeAviso }
  | { readonly tipo: "cerrar"; readonly id: number };

/** Añade al final (el más antiguo, primero) o cierra uno. Cerrar lo que no existe no cambia nada. */
export function reducirPila(pila: PilaDeAvisos, accion: AccionDePila): PilaDeAvisos {
  if (accion.tipo === "anadir") {
    const clave = leerClaveDeAviso(accion.clave);
    if (clave === null) return pila;
    const avisos = [...pila.avisos, { id: pila.siguiente, clave }];
    return {
      siguiente: pila.siguiente + 1,
      avisos:
        avisos.length > TOPE_DE_AVISOS ? avisos.slice(avisos.length - TOPE_DE_AVISOS) : avisos,
    };
  }
  if (!pila.avisos.some((a) => a.id === accion.id)) return pila;
  return { siguiente: pila.siguiente, avisos: pila.avisos.filter((a) => a.id !== accion.id) };
}

// ---------------------------------------------------------------------------------------------
// Plazo. Instantes en milisegundos (`Date.now()`); el reloj es un parámetro para probarlo.

export type Plazo = {
  /** Instante en que vence si nada lo pausa. */
  readonly vence: number;
  readonly puntero: boolean;
  readonly foco: boolean;
};

export function iniciarPlazo(ahora: number): Plazo {
  return { vence: ahora + DURACION_DE_AVISO_MS, puntero: false, foco: false };
}

export function estaPausado(plazo: Plazo): boolean {
  return plazo.puntero || plazo.foco;
}

/** Al salir el último de los dos (puntero y foco) el plazo vuelve a empezar entero. */
function reanudar(antes: Plazo, despues: Plazo, ahora: number): Plazo {
  if (estaPausado(antes) && !estaPausado(despues)) {
    return { ...despues, vence: ahora + DURACION_DE_AVISO_MS };
  }
  return despues;
}

export function conPuntero(plazo: Plazo, encima: boolean, ahora: number): Plazo {
  if (plazo.puntero === encima) return plazo;
  return reanudar(plazo, { ...plazo, puntero: encima }, ahora);
}

export function conFoco(plazo: Plazo, dentro: boolean, ahora: number): Plazo {
  if (plazo.foco === dentro) return plazo;
  return reanudar(plazo, { ...plazo, foco: dentro }, ahora);
}

/** Lo que falta para vencer, entre 0 y la duración. Un reloj ilegible da 0. */
export function milisegundosHastaVencer(plazo: Plazo, ahora: number): number {
  if (!Number.isFinite(ahora)) return 0;
  return Math.min(DURACION_DE_AVISO_MS, Math.max(0, plazo.vence - ahora));
}

export type Comprobacion = { readonly focoDentro: boolean; readonly punteroEncima: boolean };

/** Qué hacer cuando salta el temporizador. Antes de retirar se mira de verdad dónde están el foco
 * y el puntero: así la pausa no depende de que un manejador se haya enganchado a tiempo. */
export function decidirAlVencer(
  plazo: Plazo,
  ahora: number,
  comprobacion: Comprobacion,
): "esperar" | "pausar" | "retirar" {
  if (milisegundosHastaVencer(plazo, ahora) > 0) return "esperar";
  if (estaPausado(plazo) || comprobacion.focoDentro || comprobacion.punteroEncima) return "pausar";
  return "retirar";
}
