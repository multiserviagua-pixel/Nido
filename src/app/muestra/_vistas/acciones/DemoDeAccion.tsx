"use client";

// Simulador de `useAccion` (T-010 (d)): la muestra no llama a la red. «Pausar» envía; el envío
// queda pendiente hasta que la persona (o la prueba) elige qué responde el servidor y a qué envío.
// Así se ven, con teclado, la respuesta a tiempo, la tardía, el doble envío y el plazo de 30 s. Los
// contadores son parte de la propia página (envíos, sin respuesta y relecturas de la vista).
import { useEffect, useRef, useState } from "react";
import { Boton } from "@/components/acciones/Boton";
import { useAccion } from "@/components/acciones/useAccion";
import { anunciar } from "@/components/texto/anuncios";
import { TEXTOS } from "@/components/textos";
import { TEXTOS_ACCIONES as T } from "./textos-acciones";

type ClaveDeRespuesta = keyof typeof T.respuestas;
const CLAVES = Object.keys(T.respuestas) as ClaveDeRespuesta[];

const RESPUESTAS: Readonly<Record<ClaveDeRespuesta, unknown>> = {
  hecha: { cuerpo: { resultado: "hecha" } },
  rechazada: { estado: 409, cuerpo: { resultado: "rechazada", motivo: "estado_distinto" } },
  no_permitida: { estado: 401 },
  servidor: { estado: 500 },
  ilegible: { cuerpo: "<html>" },
  desconocida: { estado: 200, cuerpo: { resultado: "exito" } },
};
const LISTAS = { motivos: ["estado_distinto"], campos: [], codigos: [] } as const;
const CLASE_SIMULADOR =
  "inline-flex min-h-10 items-center justify-center rounded-medio border border-borde-control bg-superficie px-3 text-texto";

export function DemoDeAccion() {
  const pendientes = useRef<Array<(respuesta: unknown) => void>>([]);
  const [envios, fijarEnvios] = useState(0);
  const [sinRespuesta, fijarSinRespuesta] = useState(0);
  const [relecturas, fijarRelecturas] = useState(0);
  const [elegida, fijarElegida] = useState<ClaveDeRespuesta>("hecha");
  const accion = useAccion(
    () => {
      fijarEnvios((n) => n + 1);
      return new Promise<unknown>((resolver) => {
        pendientes.current.push(resolver);
        fijarSinRespuesta(pendientes.current.length);
      });
    },
    { alReleer: () => fijarRelecturas((n) => n + 1), lectura: LISTAS },
  );

  const responder = (cual: "antiguo" | "reciente"): void => {
    const resolver = cual === "antiguo" ? pendientes.current.shift() : pendientes.current.pop();
    fijarSinRespuesta(pendientes.current.length);
    resolver?.(RESPUESTAS[elegida]);
  };

  const lectura = accion.lectura;
  let mensaje: string | null = null;
  if (lectura !== null) {
    if (lectura.resultado === "hecha") mensaje = TEXTOS.acciones.resultado.hecha;
    else if (lectura.resultado === "no_permitida") mensaje = TEXTOS.acciones.noPermitida;
    else if (lectura.resultado === "incierta") mensaje = TEXTOS.acciones.resultado.incierta;
    else {
      const motivo = Object.hasOwn(TEXTOS.acciones.motivosDeRechazo, lectura.motivo)
        ? TEXTOS.acciones.motivosDeRechazo[
            lectura.motivo as keyof typeof TEXTOS.acciones.motivosDeRechazo
          ]
        : "";
      mensaje = `${TEXTOS.acciones.resultado.rechazada} ${motivo}`.trim();
    }
  }
  useEffect(() => {
    if (mensaje !== null) anunciar(mensaje);
  }, [mensaje]);

  return (
    <section aria-labelledby="simulador-titulo" className="flex flex-col gap-4">
      <h2 id="simulador-titulo">{T.tituloSimulador}</h2>
      <p>{T.explicacion}</p>
      <div className="flex flex-wrap items-center gap-3">
        <Boton
          texto={TEXTOS.acciones.confirmar.pausar}
          textoEnCurso={TEXTOS.acciones.enCurso.pausar}
          variante="primario"
          enCurso={accion.enCurso}
          onClick={accion.lanzar}
        />
      </div>
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
        <button type="button" className={CLASE_SIMULADOR} onClick={() => responder("antiguo")}>
          {T.responderAntiguo}
        </button>
        <button type="button" className={CLASE_SIMULADOR} onClick={() => responder("reciente")}>
          {T.responderReciente}
        </button>
      </div>
      <dl className="flex flex-wrap gap-x-6 gap-y-1">
        <div>
          <dt className="inline">{T.envios}: </dt>
          <dd className="inline" data-contador="envios">
            {envios}
          </dd>
        </div>
        <div>
          <dt className="inline">{T.pendientes}: </dt>
          <dd className="inline" data-contador="pendientes">
            {sinRespuesta}
          </dd>
        </div>
        <div>
          <dt className="inline">{T.relecturas}: </dt>
          <dd className="inline" data-contador="relecturas">
            {relecturas}
          </dd>
        </div>
      </dl>
      <div data-mensaje-de-accion={accion.resultado ?? "ninguno"} className="flex flex-col gap-2">
        <h3>{T.mensajes}</h3>
        <p>{mensaje ?? T.sinMensaje}</p>
        {accion.resultado === "incierta" ? (
          <div>
            <button
              type="button"
              className={CLASE_SIMULADOR}
              onClick={() => {
                fijarRelecturas((n) => n + 1);
                accion.restablecer();
              }}
            >
              {TEXTOS.acciones.resultado.comprobarEstado}
            </button>
          </div>
        ) : null}
      </div>
    </section>
  );
}
