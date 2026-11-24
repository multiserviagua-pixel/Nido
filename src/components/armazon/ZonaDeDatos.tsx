"use client";

import type { ReactNode } from "react";
import { BloqueDatos } from "../estados/BloqueDatos";
import { useTransicionDePeriodo } from "./TransicionDePeriodo";

/** Zona de datos del cuerpo (cifras o contenido) que sigue la transición del cambio de periodo
 * (diseño 020, «Cambio de periodo», punto 4). Pinta un `BloqueDatos` con los plazos de la
 * transición (`plazos="externos"`: los anuncios y el foco los lleva el proveedor): pendiente,
 * esqueleto con `aria-busy="true"`; a los 30 s, `error` con el motivo `tarda_demasiado`, la
 * referencia `N-` del proveedor y «Reintentar», sin `aria-busy`. Los hijos de servidor se quedan
 * montados (`conservarHijos`: mismo elemento, sin desmontar, solo oculto con `hidden`), así que
 * ninguna cifra del periodo anterior se ve ni se lee como actual y el estado de cliente de los
 * hijos (orden y página de una tabla) sobrevive al cambio de periodo. */
export function ZonaDeDatos({
  zona,
  className,
  children,
}: {
  zona: "cifras" | "contenido";
  className: string;
  children: ReactNode;
}) {
  const { pendiente, lenta, fallida, referencia, reintentar } = useTransicionDePeriodo();
  return (
    <div
      data-zona={zona}
      className={className}
      aria-busy={pendiente && !fallida ? "true" : undefined}
    >
      <BloqueDatos
        estado={fallida ? "error" : pendiente ? "carga" : "datos"}
        forma={zona === "cifras" ? "tarjeta" : "tabla"}
        plazos="externos"
        anuncia={false}
        lenta={lenta}
        motivo="tarda_demasiado"
        referencia={referencia}
        alReintentar={reintentar}
        conservarHijos
      >
        {children}
      </BloqueDatos>
    </div>
  );
}
