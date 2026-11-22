"use client";

// Transición del cambio de periodo (diseño 020, «Una vista en uso», «Cambio de periodo», puntos 3 y
// 4; REQ-006, REQ-042). `SelectorPeriodo` llama a `router.replace` dentro de `iniciar`; mientras la
// vista de servidor se vuelve a pintar con el periodo nuevo, la transición está pendiente y las
// zonas de datos de `RejillaCuerpo` (`ZonaDeDatos`) se marcan ocupadas y pintan `carga`: nada del
// periodo anterior pasa por actual. Se anuncia «Cargando» una vez al empezar, a los 10 s que
// tarda más de lo normal y a los 30 s el error («Cuando algo falla»): las zonas pasan a `error` con
// el motivo `tarda_demasiado`, una referencia `N-` creada en el navegador y «Reintentar», que repite
// la misma navegación. Una transición de React no se puede cancelar: si la respuesta llega después
// de los 30 s, la transición termina, el error se retira y se pinta la vista con el periodo
// elegido (cierra en fallo: nunca se ven a la vez el error y cifras). Este archivo no importa el enrutador de Next (solo lo hace
// `SelectorPeriodo`) y no guarda nada en el navegador (REQ-058).
//
// Fuera del proveedor (una vista sin selector, una prueba) el valor por defecto es «sin transición»:
// las zonas se pintan como siempre.
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  useTransition,
  type ReactNode,
} from "react";
import { crearReferencia } from "../../lib/errores/referencia";
import { anunciar } from "../texto/anuncios";
import { TEXTOS } from "../textos";

export type EstadoDeTransicion = {
  /** Hay un cambio de periodo en curso: la vista aún no ha vuelto del servidor. */
  readonly pendiente: boolean;
  /** Lleva más de 10 s pendiente. */
  readonly lenta: boolean;
  /** Lleva 30 s o más pendiente: las zonas pintan el error con reintento. */
  readonly fallida: boolean;
  /** Referencia `N-` del error de los 30 s; `null` si no hay error o no se pudo crear. */
  readonly referencia: string | null;
  /** Ejecuta `accion` dentro de la transición (la que llama a `router.replace`). */
  readonly iniciar: (accion: () => void) => void;
  /** Repite la última acción iniciada (el reintento del error). */
  readonly reintentar: () => void;
};

/** Tiempo pendiente tras el que se avisa de que tarda más de lo normal («Cuando algo falla»). */
const LENTA_MS = 10_000;
/** Tiempo pendiente tras el que se pasa a error con reintento. */
const ERROR_MS = 30_000;

export const ContextoDeTransicion = createContext<EstadoDeTransicion>({
  pendiente: false,
  lenta: false,
  fallida: false,
  referencia: null,
  iniciar: (accion) => accion(),
  reintentar: () => {},
});

export function useTransicionDePeriodo(): EstadoDeTransicion {
  return useContext(ContextoDeTransicion);
}

export function ProveedorDeTransicion({ children }: { children: ReactNode }) {
  const [pendiente, iniciarTransicion] = useTransition();
  const [lenta, fijarLenta] = useState(false);
  const [fallida, fijarFallida] = useState(false);
  const [referencia, fijarReferencia] = useState<string | null>(null);
  // Cada inicio o reintento reinicia los plazos aunque la transición anterior siga pendiente.
  const [intento, fijarIntento] = useState(0);
  const ultima = useRef<(() => void) | null>(null);

  const iniciar = useCallback(
    (accion: () => void): void => {
      ultima.current = accion;
      fijarIntento((n) => n + 1);
      iniciarTransicion(accion);
    },
    [iniciarTransicion],
  );

  const reintentar = useCallback((): void => {
    const accion = ultima.current;
    if (accion === null) return;
    anunciar(TEXTOS.bloque.cargando);
    iniciar(accion);
  }, [iniciar]);

  useEffect(() => {
    if (pendiente) anunciar(TEXTOS.bloque.cargando);
  }, [pendiente]);

  useEffect(() => {
    if (!pendiente) return undefined;
    const aviso = setTimeout(() => {
      fijarLenta(true);
      anunciar(TEXTOS.bloque.cargaLenta);
    }, LENTA_MS);
    const error = setTimeout(() => {
      let nueva: string | null = null;
      try {
        nueva = crearReferencia("navegador");
      } catch {
        // Sin generador no se crea referencia: el error se pinta sin ella.
      }
      fijarReferencia(nueva);
      fijarFallida(true);
      anunciar(
        nueva === null
          ? TEXTOS.motivosDeError.tarda_demasiado
          : `${TEXTOS.motivosDeError.tarda_demasiado} ${TEXTOS.bloque.referencia}: ${nueva}`,
        "urgente",
      );
    }, ERROR_MS);
    return () => {
      clearTimeout(aviso);
      clearTimeout(error);
      fijarLenta(false);
      fijarFallida(false);
      fijarReferencia(null);
    };
  }, [pendiente, intento]);

  return (
    <ContextoDeTransicion.Provider
      value={{ pendiente, lenta, fallida, referencia, iniciar, reintentar }}
    >
      {children}
    </ContextoDeTransicion.Provider>
  );
}
