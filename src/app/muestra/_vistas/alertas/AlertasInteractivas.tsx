"use client";

// Lista de alertas de la muestra con una acción ficticia (T-010 (i)): cuenta las pulsaciones y
// dice cuál fue la última. La muestra no llama a la red; la acción real, el cerrojo y el resultado
// son de la vista (`useAccion`).
import { useState } from "react";
import { ListaAlertas } from "@/components/alertas/ListaAlertas";
import type { AlertaLeida } from "@/components/alertas/logica";
import { TEXTOS_ALERTAS as T } from "./textos-alertas";

export function AlertasInteractivas({ alertas }: { alertas: readonly AlertaLeida[] }) {
  const [pedidas, fijarPedidas] = useState(0);
  const [ultima, fijarUltima] = useState<string | null>(null);
  return (
    <div className="flex min-w-0 flex-col gap-4">
      <ListaAlertas
        alertas={alertas}
        alAccionar={(posicion, accion) => {
          fijarPedidas((n) => n + 1);
          fijarUltima(`${T.alertaNumero} ${posicion + 1}, ${T.accion} ${accion}`);
        }}
      />
      <dl className="flex flex-wrap gap-x-6 gap-y-1">
        <div>
          <dt className="inline">{T.accionesPedidas}: </dt>
          <dd className="inline" data-contador="pedidas">
            {pedidas}
          </dd>
        </div>
        <div>
          <dt className="inline">{T.ultimaAccion}: </dt>
          <dd className="inline" data-contador="ultima">
            {ultima ?? T.ninguna}
          </dd>
        </div>
      </dl>
    </div>
  );
}
