// Controlador de una acción que cambia algo (diseño 020, «Estados de cada vista», «Acciones que
// cambian algo»; REQ-073, REQ-074). Sin React, para probar con reloj simulado: `useAccion` solo lo
// conecta al componente.
//
// - Cerrojo: `lanzar()` se pone antes de cualquier espera, así que dos pulsaciones en el mismo
//   instante envían una sola vez. Se suelta siempre: al llegar un resultado o al vencer el plazo.
// - Plazo de 30 s: pasa a `incierta` y libera el cerrojo. La petición no se da por cancelada.
// - Cada envío está numerado y solo se acepta la respuesta del envío en curso. Una respuesta que
//   llega después (vencido el plazo, o con otro envío en curso o terminado) no cambia lo que se
//   muestra ni se atribuye a otro envío: solo provoca `alReleer`, nunca un éxito.
// - Todo se lee con `leerResultadoAccion`: éxito solo con confirmación expresa, el resto cierra en
//   `incierta`. Nada se reintenta solo.
import {
  INCIERTA,
  leerResultadoAccion,
  type LecturaDeAccion,
  type ListasDeLectura,
} from "./resultado";

/** Plazo máximo de una acción (diseño, «Valores de diseño»): después, `incierta`. */
export const PLAZO_DE_ACCION_MS = 30_000;

export type EstadoDeAccion =
  | { readonly fase: "reposo" }
  | { readonly fase: "en_curso"; readonly envio: number }
  | { readonly fase: "terminada"; readonly envio: number; readonly lectura: LecturaDeAccion };

export type ConfiguracionDeAccion = {
  /** Hace el envío y devuelve la respuesta (`{estado?, cuerpo?}`) o una promesa de ella. */
  readonly ejecutar: () => unknown;
  /** Hace que la vista relea el estado real. */
  readonly alReleer?: () => void;
  readonly lectura?: ListasDeLectura;
};

export type ControladorDeAccion = {
  /** Intenta enviar. Devuelve `false` si el cerrojo estaba puesto (no envía). */
  lanzar(): boolean;
  obtener(): EstadoDeAccion;
  suscribir(oyente: () => void): () => void;
  /** Vuelve a reposo desde un resultado. Con un envío en curso no hace nada. */
  restablecer(): void;
  /** Cambia lo que se ejecuta y lo que relee (la última versión de la vista). No toca el estado. */
  actualizar(nueva: Pick<ConfiguracionDeAccion, "ejecutar" | "alReleer">): void;
  activar(): void;
  /** Desmontaje: ignora plazos y respuestas, sin relectura ni cambios. */
  desactivar(): void;
};

const REPOSO: EstadoDeAccion = Object.freeze({ fase: "reposo" });

export function crearControladorDeAccion(
  configuracion: ConfiguracionDeAccion,
): ControladorDeAccion {
  let estado: EstadoDeAccion = REPOSO;
  let activo = true;
  let envio = 0;
  let plazo: ReturnType<typeof setTimeout> | null = null;
  const oyentes = new Set<() => void>();

  const fijar = (nuevo: EstadoDeAccion): void => {
    estado = nuevo;
    for (const o of [...oyentes]) o();
  };
  const releer = (): void => {
    try {
      configuracion.alReleer?.();
    } catch {
      /* la relectura es de la vista: su fallo no rompe el controlador */
    }
  };
  const quitarPlazo = (): void => {
    if (plazo !== null) clearTimeout(plazo);
    plazo = null;
  };
  const enCurso = (n: number): boolean =>
    estado.fase === "en_curso" && (estado as { envio: number }).envio === n;

  /** Llega la respuesta (o el fallo) del envío `n`. */
  const recibir = (n: number, bruto: unknown): void => {
    if (!activo) return;
    const lectura = leerResultadoAccion(bruto, configuracion.lectura);
    if (!enCurso(n)) {
      // Tardía: vencido el plazo o con otro envío. No se muestra ni se atribuye: solo relectura.
      releer();
      return;
    }
    quitarPlazo();
    fijar(Object.freeze({ fase: "terminada", envio: n, lectura }));
    if (lectura.resultado === "hecha" || lectura.resultado === "no_permitida") releer();
  };

  return {
    lanzar() {
      if (!activo || estado.fase === "en_curso") return false;
      envio += 1;
      const n = envio;
      fijar(Object.freeze({ fase: "en_curso", envio: n }));
      plazo = setTimeout(() => {
        plazo = null;
        if (!activo || !enCurso(n)) return;
        fijar(Object.freeze({ fase: "terminada", envio: n, lectura: INCIERTA }));
      }, PLAZO_DE_ACCION_MS);
      let respuesta: unknown;
      try {
        respuesta = configuracion.ejecutar();
      } catch {
        recibir(n, undefined);
        return true;
      }
      Promise.resolve(respuesta).then(
        (valor) => recibir(n, valor),
        () => recibir(n, undefined),
      );
      return true;
    },
    obtener: () => estado,
    suscribir(oyente) {
      oyentes.add(oyente);
      return () => {
        oyentes.delete(oyente);
      };
    },
    restablecer() {
      if (estado.fase === "terminada") fijar(REPOSO);
    },
    actualizar(nueva) {
      configuracion = { ...configuracion, ...nueva };
    },
    activar() {
      activo = true;
    },
    desactivar() {
      activo = false;
      quitarPlazo();
    },
  };
}
