// Estado de la conexión (diseño 020, `AvisoConexion` y «Cambio de periodo», punto 7; REQ-060,
// REQ-075). Única fuente: `navigator.onLine` y los eventos `online` y `offline` del navegador. Aquí
// están la lectura, la suscripción (para `useSyncExternalStore`), los estados del aviso, el momento
// de carga de lo que se ve y su texto en la hora de Madrid. No guarda nada: ni en el navegador ni
// fuera de la memoria de la página (REQ-058). Todo cierra en fallo (artículo 3): un estado o un
// evento desconocidos cuentan como «sin conexión», nunca como «conectado».
import { useEffect, useState, useSyncExternalStore } from "react";
import { formatearFechaHora } from "../formato/fechas";
import { TEXTOS } from "../textos";
import type { EstadoDeBloque } from "./bloque";

// --- lectura ------------------------------------------------------------------------------------

/** Verdadero solo si el navegador dice que no hay red. Falso es fiable (no hay red); verdadero para
 * «hay red» no lo es, y por eso aquí solo se actúa con el falso. Sin navegador, no hay nada que
 * marcar. */
export function estaSinConexion(): boolean {
  if (typeof navigator === "undefined" || navigator === null) return false;
  return navigator.onLine === false;
}

/** Suscripción a los eventos de conexión del navegador. */
export function suscribirConexion(aviso: () => void): () => void {
  if (typeof window === "undefined") return () => undefined;
  window.addEventListener("online", aviso);
  window.addEventListener("offline", aviso);
  return () => {
    window.removeEventListener("online", aviso);
    window.removeEventListener("offline", aviso);
  };
}

/** `true` mientras el navegador no tenga conexión. En el servidor, `false`. */
export function useSinConexion(): boolean {
  return useSyncExternalStore(suscribirConexion, estaSinConexion, () => false);
}

// --- estados del aviso --------------------------------------------------------------------------

export const ESTADOS_DE_CONEXION = Object.freeze([
  "conectado",
  "sin_conexion",
  "recuperada",
] as const);
export type EstadoDeConexion = (typeof ESTADOS_DE_CONEXION)[number];
export type EventoDeConexion = "offline" | "online" | "plazo";

/** Cuánto se ve «Conexión recuperada». Igual que un aviso temporal. */
export const PLAZO_DE_RECUPERADA_MS = 8000;

/** Lo que no es de la lista es «sin conexión»: se avisa de más antes que de menos. */
export function leerEstadoDeConexion(valor: unknown): EstadoDeConexion {
  return ESTADOS_DE_CONEXION.find((e) => e === valor) ?? "sin_conexion";
}

export function siguienteEstadoDeConexion(
  actual: EstadoDeConexion,
  evento: EventoDeConexion,
): EstadoDeConexion {
  const estado = leerEstadoDeConexion(actual);
  if (estado !== actual) return "sin_conexion";
  if (evento === "offline") return "sin_conexion";
  if (evento === "online") return estado === "sin_conexion" ? "recuperada" : estado;
  if (evento === "plazo") return estado === "recuperada" ? "conectado" : estado;
  return "sin_conexion";
}

// --- hora de carga ------------------------------------------------------------------------------

/** El momento en que llegaron los datos que se ven: se fija una vez y se borra al dejar de verlos. */
export function momentoDeCarga(
  actual: number | null,
  estado: EstadoDeBloque,
  ahora: number,
): number | null {
  if (estado !== "datos") return null;
  if (actual !== null) return actual;
  return typeof ahora === "number" && Number.isFinite(ahora) ? ahora : null;
}

/** `Datos cargados el 12 nov 2026, 08:04`, en la hora de Madrid. */
export function textoDeHoraDeCarga(instante: unknown): string {
  return `${TEXTOS.bloque.datosCargadosEl} ${formatearFechaHora(instante)}`;
}

/** Almacén mínimo (uno por bloque) del momento de carga: se escribe desde un efecto y se lee con
 * `useSyncExternalStore`, sin guardar estado desde el efecto ni leer una referencia al pintar. */
export type RegistroDeCarga = {
  readonly leer: () => number | null;
  readonly fijar: (estado: EstadoDeBloque, ahora: number) => void;
  readonly suscribir: (aviso: () => void) => () => void;
};

export function crearRegistroDeCarga(): RegistroDeCarga {
  let valor: number | null = null;
  const avisos = new Set<() => void>();
  return {
    leer: () => valor,
    fijar: (estado, ahora) => {
      const nuevo = momentoDeCarga(valor, estado, ahora);
      if (nuevo === valor) return;
      valor = nuevo;
      for (const aviso of [...avisos]) aviso();
    },
    suscribir: (aviso) => {
      avisos.add(aviso);
      return () => {
        avisos.delete(aviso);
      };
    },
  };
}

/** El momento en que llegaron los datos que ve este bloque; `null` si no se ven datos. */
export function useMomentoDeCarga(estado: EstadoDeBloque): number | null {
  const [registro] = useState(crearRegistroDeCarga);
  useEffect(() => {
    registro.fijar(estado, Date.now());
  }, [registro, estado]);
  return useSyncExternalStore(registro.suscribir, registro.leer, () => null);
}
