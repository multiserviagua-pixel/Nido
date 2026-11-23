"use client";

// Estado vacío de la muestra con una acción ficticia (T-016 (c)): cuenta las pulsaciones. La muestra
// no llama a la red; la acción real es de la vista.
import { useState } from "react";
import { EstadoVacio } from "@/components/estados/EstadoVacio";
import { TEXTOS } from "@/components/textos";
import { TEXTOS_ESTADOS as T } from "./textos-estados";

export function DemoDeEstadoVacio({ conAccion }: { conAccion: boolean }) {
  const [pedidas, fijarPedidas] = useState(0);
  const E = TEXTOS.estadoVacio.ejemplo;
  return (
    <div className="flex min-w-0 flex-col gap-4">
      {conAccion ? (
        <EstadoVacio
          titulo={E.conAccion.titulo}
          explicacion={E.conAccion.explicacion}
          accion={{ texto: E.conAccion.accion, alPulsar: () => fijarPedidas((n) => n + 1) }}
        />
      ) : (
        <EstadoVacio titulo={E.sinAccion.titulo} explicacion={E.sinAccion.explicacion} />
      )}
      {conAccion ? (
        <p>
          {T.vacio.accionesPedidas}: <span data-contador="pedidas">{pedidas}</span>
        </p>
      ) : null}
    </div>
  );
}
