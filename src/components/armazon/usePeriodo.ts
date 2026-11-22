"use client";

// Periodo activo de una vista, para los componentes de cliente (diseño 020, «Armazón» y «Una vista
// en uso», punto 3; REQ-006, REQ-059). El selector cambia el periodo en la dirección sin recargar
// la página y avisa con un evento; quien pinta cifras, gráficos o tablas de ese periodo lee aquí
// la clave activa y vuelve a pedir sus datos cuando cambia. No guarda nada: cada lectura sale de la
// dirección, y solo se admite una clave de la lista cerrada (`valorDePeriodo`). En el servidor y en
// la hidratación vale el valor que leyó la vista de la dirección, así no hay diferencias.
import { useCallback, useSyncExternalStore } from "react";
import { valorDePeriodo, type ConfiguracionDePeriodo } from "./periodo";

/** Evento de la ventana que dice «la dirección tiene otro periodo». */
export const EVENTO_DE_PERIODO = "nido:periodo";

function suscribir(avisar: () => void): () => void {
  window.addEventListener(EVENTO_DE_PERIODO, avisar);
  window.addEventListener("popstate", avisar);
  return () => {
    window.removeEventListener(EVENTO_DE_PERIODO, avisar);
    window.removeEventListener("popstate", avisar);
  };
}

/** La clave de periodo activa: la de la dirección si está en la lista; si no, la de por defecto. */
export function usePeriodo(configuracion: ConfiguracionDePeriodo): string {
  const { periodos, porDefecto, valor } = configuracion;
  const leer = useCallback(
    () => valorDePeriodo(periodos, porDefecto, window.location.search),
    [periodos, porDefecto],
  );
  return useSyncExternalStore(suscribir, leer, () => valor);
}
