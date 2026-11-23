"use client";

import type { ReactNode } from "react";
import { leerReferencia } from "../../lib/errores/referencia";
import { TEXTOS } from "../textos";
import { useTransicionDePeriodo } from "./TransicionDePeriodo";

/** Zona de datos del cuerpo (cifras o contenido) que sigue la transición del cambio de periodo
 * (diseño 020, «Cambio de periodo», punto 4). A los 30 s pendiente pasa a `error` (motivo de lista
 * cerrada, referencia `N-` validada y «Reintentar»; sin `aria-busy`). Pendiente: `aria-busy="true"` y estado `carga`; los
 * hijos de servidor se quedan montados pero ocultos, así que ninguna cifra del periodo anterior se
 * ve ni se lee como actual. El envoltorio de los hijos es siempre el mismo (`contents` o
 * `hidden`): React no los desmonta ni cambia el diseño de la rejilla. */
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
  const ref = leerReferencia(referencia);
  return (
    <div
      data-zona={zona}
      className={className}
      aria-busy={pendiente && !fallida ? "true" : undefined}
    >
      {fallida ? (
        <div data-estado="error" className="flex flex-col items-start gap-2 text-texto">
          {/* El motivo ya empieza por «No se ha podido cargar»: no se repite. */}
          <p className="font-seminegrita">{TEXTOS.motivosDeError.tarda_demasiado}</p>
          {ref === null ? null : (
            <p className="text-cuerpo-menor text-texto-secundario">
              {TEXTOS.bloque.referencia}: {ref}
            </p>
          )}
          <button
            type="button"
            onClick={reintentar}
            className="inline-flex min-h-10 items-center justify-center rounded-medio border border-borde-control bg-superficie px-3 text-texto"
          >
            {TEXTOS.bloque.reintentar}
          </button>
        </div>
      ) : pendiente ? (
        <div data-estado="carga" className="text-texto-secundario">
          <p>{TEXTOS.bloque.cargando}</p>
          {lenta ? <p>{TEXTOS.bloque.cargaLenta}</p> : null}
        </div>
      ) : null}
      <div className={pendiente || fallida ? "hidden" : "contents"}>{children}</div>
    </div>
  );
}
