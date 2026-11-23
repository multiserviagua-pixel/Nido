"use client";

// `useAccion` (diseño 020, «Estados de cada vista», «Acciones que cambian algo»; REQ-073, REQ-074).
// Conecta un controlador (`controlador.ts`: cerrojo, plazo de 30 s, resultado por envío) con un
// componente. `ejecutar` hace el envío y devuelve `{estado?, cuerpo?}`; el gancho no llama a la red
// por sí mismo. `alReleer` hace que la vista relea su estado real. Las listas cerradas de motivos,
// campos y códigos las declara quien envía.
import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { crearControladorDeAccion, type EstadoDeAccion } from "./controlador";
import type { LecturaDeAccion, ListasDeLectura, ResultadoDeAccion } from "./resultado";

export type OpcionesDeAccion = {
  readonly alReleer?: () => void;
  readonly lectura?: ListasDeLectura;
};

export type AccionEnUso = {
  readonly estado: EstadoDeAccion;
  /** Hay un envío en curso (el cerrojo está puesto). */
  readonly enCurso: boolean;
  /** Resultado del último envío, o `null` en reposo o en curso. */
  readonly resultado: ResultadoDeAccion | null;
  readonly lectura: LecturaDeAccion | null;
  /** Envía una vez; con el cerrojo puesto no hace nada. */
  readonly lanzar: () => void;
  /** Quita el resultado mostrado (por ejemplo, al cerrar el mensaje). */
  readonly restablecer: () => void;
};

const ESTADO_DE_SERVIDOR: EstadoDeAccion = Object.freeze({ fase: "reposo" });

export function useAccion(ejecutar: () => unknown, opciones: OpcionesDeAccion = {}): AccionEnUso {
  // Las listas cerradas se leen una vez: las declara quien envía y no cambian. Lo que se ejecuta y
  // lo que relee se actualiza tras cada pintado, sin recrear el controlador (el cerrojo vive en él).
  const [controlador] = useState(() =>
    crearControladorDeAccion({ ejecutar, alReleer: opciones.alReleer, lectura: opciones.lectura }),
  );
  useEffect(() => {
    controlador.actualizar({ ejecutar, alReleer: opciones.alReleer });
  });
  useEffect(() => {
    controlador.activar();
    return () => controlador.desactivar();
  }, [controlador]);
  const estado = useSyncExternalStore(
    controlador.suscribir,
    controlador.obtener,
    () => ESTADO_DE_SERVIDOR,
  );
  const lanzar = useCallback((): void => {
    controlador.lanzar();
  }, [controlador]);
  const lectura = estado.fase === "terminada" ? estado.lectura : null;
  return {
    estado,
    enCurso: estado.fase === "en_curso",
    resultado: lectura === null ? null : lectura.resultado,
    lectura,
    lanzar,
    restablecer: controlador.restablecer,
  };
}
