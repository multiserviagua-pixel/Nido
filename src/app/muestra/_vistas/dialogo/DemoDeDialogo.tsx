"use client";

// Simulador de `DialogoConfirmacion` (T-010 (j)): la muestra no llama a la red. La respuesta que
// «da el servidor» se elige antes de abrir el diálogo (con el diálogo abierto, el resto de la
// página queda inerte). Los contadores son parte de la propia página.
import { useState } from "react";
import { VARIANTES } from "@/components/acciones/Boton";
import { DialogoConfirmacion } from "@/components/dialogo/DialogoConfirmacion";
import type { ClaveDeAccionDeDialogo, ClaveDeDatoDistintivo } from "@/components/dialogo/logica";
import { TEXTOS_DIALOGO as T } from "./textos-dialogo";

type ClaveDeRespuesta = keyof typeof T.respuestas;
const CLAVES = Object.keys(T.respuestas) as ClaveDeRespuesta[];
const RETARDO_TARDIA_MS = 35_000;

const RESPUESTAS: Readonly<Record<ClaveDeRespuesta, unknown>> = {
  hecha: { cuerpo: { resultado: "hecha" } },
  rechazada: { estado: 409, cuerpo: { resultado: "rechazada", motivo: "estado_distinto" } },
  no_permitida: { estado: 401 },
  servidor: { estado: 500 },
  ilegible: { cuerpo: "<html>" },
  desconocida: { estado: 200, cuerpo: { resultado: "exito" } },
  sin_respuesta: undefined,
  tardia: { cuerpo: { resultado: "hecha" } },
};
const LISTAS = { motivos: ["estado_distinto"], campos: [], codigos: [] } as const;

export type DisparadorDeMuestra = {
  readonly etiqueta: string;
  readonly accion: ClaveDeAccionDeDialogo;
  readonly objetivo: { readonly nombre: string; readonly distintivo: string };
  readonly dato: ClaveDeDatoDistintivo;
  readonly abiertoAlCargar?: boolean;
};

export function DemoDeDialogo({ disparadores }: { disparadores: readonly DisparadorDeMuestra[] }) {
  const [envios, fijarEnvios] = useState(0);
  const [relecturas, fijarRelecturas] = useState(0);
  const [hechas, fijarHechas] = useState(0);
  const [elegida, fijarElegida] = useState<ClaveDeRespuesta>("hecha");

  const ejecutar = (): unknown => {
    fijarEnvios((n) => n + 1);
    const cual = elegida;
    if (cual === "sin_respuesta") return new Promise<unknown>(() => undefined);
    if (cual === "tardia") {
      // El servidor «aplicó» la acción, pero la respuesta llega después del plazo.
      fijarHechas((n) => n + 1);
      return new Promise<unknown>((resolver) => {
        setTimeout(() => resolver(RESPUESTAS.tardia), RETARDO_TARDIA_MS);
      });
    }
    if (cual === "hecha") fijarHechas((n) => n + 1);
    return Promise.resolve(RESPUESTAS[cual]);
  };

  return (
    <div className="flex min-w-0 flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <label htmlFor="respuesta-simulada">{T.etiquetaRespuesta}</label>
        <select
          id="respuesta-simulada"
          value={elegida}
          onChange={(e) => {
            const nueva = CLAVES.find((c) => c === e.target.value);
            if (nueva !== undefined) fijarElegida(nueva);
          }}
          className="min-h-10 max-w-full rounded-medio border border-borde-control bg-superficie px-3 text-texto"
        >
          {CLAVES.map((c) => (
            <option key={c} value={c}>
              {T.respuestas[c]}
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        {disparadores.map((d, i) => (
          <DialogoConfirmacion
            key={i}
            accion={d.accion}
            objetivo={d.objetivo}
            datoDistintivo={d.dato}
            ejecutar={ejecutar}
            alReleer={() => fijarRelecturas((n) => n + 1)}
            lectura={LISTAS}
            abiertoAlCargar={d.abiertoAlCargar}
            disparador={
              <button type="button" className={VARIANTES.secundario} data-disparador={i}>
                {d.etiqueta}
              </button>
            }
          />
        ))}
      </div>
      <dl className="flex flex-wrap gap-x-6 gap-y-1">
        <div>
          <dt className="inline">{T.envios}: </dt>
          <dd className="inline" data-contador="envios">
            {envios}
          </dd>
        </div>
        <div>
          <dt className="inline">{T.hechas}: </dt>
          <dd className="inline" data-contador="hechas">
            {hechas}
          </dd>
        </div>
        <div>
          <dt className="inline">{T.relecturas}: </dt>
          <dd className="inline" data-contador="relecturas">
            {relecturas}
          </dd>
        </div>
      </dl>
    </div>
  );
}
