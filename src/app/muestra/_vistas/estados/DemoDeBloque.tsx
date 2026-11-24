"use client";

// Bloques de datos de la muestra (T-016 (d); CA-016, CA-020, CA-042, CA-048). Los datos son ficticios
// y la muestra no llama a la red: lo que haría la vista (pedir, recibir una respuesta) se simula
// con `reducirLectura`, la misma lógica que descarta la respuesta de un envío anterior. Cada
// «Responder…» es un botón de la muestra, no del componente.
import { useEffect, useReducer, useState, type ReactNode } from "react";
import { leerAlertas } from "@/components/alertas/logica";
import { ListaAlertas } from "@/components/alertas/ListaAlertas";
import { VARIANTES } from "@/components/acciones/Boton";
import { TarjetaCifra } from "@/components/cifras/TarjetaCifra";
import { BloqueDatos } from "@/components/estados/BloqueDatos";
import { LECTURA_INICIAL, reducirLectura } from "@/components/estados/bloque";
import type { FormaDeEsqueleto } from "@/components/estados/logica";
import { GraficoLineas } from "@/components/graficos/GraficoLineas";
import { TEXTOS } from "@/components/textos";
import { TablaInteractiva } from "../tabla/TablaInteractiva";
import { configuracionDeLineas } from "../graficos/datos-ficticios";
import { TEXTOS_ESTADOS as T } from "./textos-estados";

export type CasoDeBloque =
  "carga" | "vacio" | "error" | "sin-permiso" | "datos" | "respuesta-tardia";
export type CasoDeCargaADatos =
  "carga-a-tarjeta" | "carga-a-tabla" | "carga-a-tabla-llena" | "carga-a-grafico" | "carga-a-lista";

const E = TEXTOS.cifras.ejemplo;
const BOTON = VARIANTES.secundario;
const REFERENCIA = "S-7K3M9QX2AB";

function ContenidoDeTarjeta(): ReactNode {
  return (
    <TarjetaCifra
      etiqueta={E.correosRevisados}
      valor={1234}
      comparacion={{
        anterior: 1100,
        anteriorCompleto: true,
        periodo: TEXTOS.cifras.comparacion.ultimos7Dias,
        valoracion: "favorable",
      }}
    />
  );
}

function ContenidoDeAlertas(): ReactNode {
  return (
    <ListaAlertas
      alAccionar={() => undefined}
      alertas={leerAlertas([
        { gravedad: "critica", tipo: "agente_sin_senal", momento: "2026-11-12T07:04:00Z" },
        { gravedad: "aviso", tipo: "licencia_por_caducar", momento: "2026-11-11T21:30:00+01:00" },
        { gravedad: "informacion", tipo: "revision_completada", momento: "2026-11-10T09:05:00Z" },
      ])}
    />
  );
}

/** Hijo de cliente con estado propio: si el bloque lo desmonta al cambiar de estado, pierde la cuenta. */
function ContadorDeCliente(): ReactNode {
  const [n, fijarN] = useState(0);
  return (
    <button
      type="button"
      className={BOTON}
      data-control="contador-hijo"
      onClick={() => fijarN(n + 1)}
    >
      {T.bloque.contadorHijo}: <span data-contador="hijo">{n}</span>
    </button>
  );
}

/** Un bloque con `conservarHijos` que cambia de estado a mano: los hijos no deben desmontarse. */
export function DemoDeHijosConservados() {
  const [estado, fijarEstado] = useState<"datos" | "carga" | "error">("datos");
  return (
    <div className="flex min-w-0 flex-col gap-4">
      <BloqueDatos
        estado={estado}
        forma="tarjeta"
        motivo="fallo_servidor"
        referencia={REFERENCIA}
        plazos="externos"
        anuncia={false}
        conservarHijos
      >
        <ContadorDeCliente />
      </BloqueDatos>
      <div className="flex flex-wrap gap-3">
        {(["datos", "carga", "error"] as const).map((e) => (
          <button
            key={e}
            type="button"
            className={BOTON}
            data-control={`poner-${e}`}
            onClick={() => fijarEstado(e)}
          >
            {T.bloque.poner[e]}
          </button>
        ))}
      </div>
    </div>
  );
}

/** Un bloque con un envío en curso y, si `controles`, los botones que simulan las respuestas. */
export function DemoDeBloque({ caso }: { caso: CasoDeBloque }) {
  const [lectura, despachar] = useReducer(
    reducirLectura,
    caso === "vacio"
      ? { ...LECTURA_INICIAL, estado: "vacio" as const }
      : caso === "error"
        ? { ...LECTURA_INICIAL, estado: "error" as const, motivo: "fallo_servidor" as const }
        : caso === "sin-permiso"
          ? { ...LECTURA_INICIAL, estado: "sin_permiso" as const }
          : caso === "datos"
            ? { ...LECTURA_INICIAL, estado: "datos" as const }
            : LECTURA_INICIAL,
  );
  const [reintentos, fijarReintentos] = useState(0);
  const [reintentando, fijarReintentando] = useState(false);
  const [acciones, fijarAcciones] = useState(0);
  const V = TEXTOS.estadoVacio.ejemplo.conAccion;

  return (
    <div className="flex min-w-0 flex-col gap-4">
      <BloqueDatos
        estado={lectura.estado}
        forma="tarjeta"
        motivo={lectura.motivo ?? "fallo_servidor"}
        {...(caso === "error" ? { referencia: REFERENCIA } : {})}
        reintentando={caso === "error" && reintentando}
        rutaDelResumen="/muestra"
        vacio={{
          titulo: V.titulo,
          explicacion: V.explicacion,
          accion: { texto: V.accion, alPulsar: () => fijarAcciones((n) => n + 1) },
        }}
        alReintentar={() => {
          fijarReintentos((n) => n + 1);
          if (caso === "error") fijarReintentando(true);
          else despachar({ tipo: "pedir" });
        }}
      >
        <ContenidoDeTarjeta />
      </BloqueDatos>
      {caso === "respuesta-tardia" ? (
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            className={BOTON}
            data-control="responder-datos"
            onClick={() => despachar({ tipo: "llega", envio: lectura.envio, estado: "datos" })}
          >
            {T.bloque.responderDatos}
          </button>
          <button
            type="button"
            className={BOTON}
            data-control="responder-error"
            onClick={() =>
              despachar({
                tipo: "llega",
                envio: lectura.envio,
                estado: "error",
                motivo: "fallo_servidor",
              })
            }
          >
            {T.bloque.responderError}
          </button>
          <button
            type="button"
            className={BOTON}
            data-control="responder-anterior"
            onClick={() => despachar({ tipo: "llega", envio: 1, estado: "datos" })}
          >
            {T.bloque.responderAnterior}
          </button>
        </div>
      ) : null}
      <dl className="flex flex-wrap gap-x-6 gap-y-1">
        <div>
          <dt className="inline">{T.bloque.envioActual}: </dt>
          <dd className="inline" data-contador="envio">
            {lectura.envio}
          </dd>
        </div>
        <div>
          <dt className="inline">{T.bloque.reintentosPedidos}: </dt>
          <dd className="inline" data-contador="reintentos">
            {reintentos}
          </dd>
        </div>
        {caso === "vacio" ? (
          <div>
            <dt className="inline">{T.bloque.accionesPedidas}: </dt>
            <dd className="inline" data-contador="pedidas">
              {acciones}
            </dd>
          </div>
        ) : null}
      </dl>
    </div>
  );
}

/** Tres fuentes y la segunda falla (REQ-028): cada una es su propio bloque. */
export function DemoDeBloquesParciales() {
  const [reintentos, fijarReintentos] = useState(0);
  const [lecturaDos, despachar] = useReducer(reducirLectura, {
    ...LECTURA_INICIAL,
    estado: "error" as const,
    motivo: "fallo_servidor" as const,
  });
  return (
    <div className="flex min-w-0 flex-col gap-4">
      <div className="grid min-w-0 grid-cols-1 gap-4 lg:grid-cols-3">
        <section aria-label={`${T.bloque.fuente} 1`} className="min-w-0">
          <BloqueDatos estado="datos" forma="tarjeta">
            <ContenidoDeTarjeta />
          </BloqueDatos>
        </section>
        <section aria-label={`${T.bloque.fuente} 2`} className="min-w-0">
          <BloqueDatos
            estado={lecturaDos.estado}
            forma="lista"
            motivo={lecturaDos.motivo ?? "fallo_servidor"}
            referencia={REFERENCIA}
            alReintentar={() => {
              fijarReintentos((n) => n + 1);
              despachar({ tipo: "pedir" });
            }}
          >
            <ContenidoDeAlertas />
          </BloqueDatos>
        </section>
        <section aria-label={`${T.bloque.fuente} 3`} className="min-w-0">
          <BloqueDatos estado="datos" forma="lista">
            <ContenidoDeAlertas />
          </BloqueDatos>
        </section>
      </div>
      <p>
        {T.bloque.reintentosPedidos}: <span data-contador="reintentos">{reintentos}</span>
      </p>
    </div>
  );
}

const RETARDO_DE_LA_RESPUESTA_MS = 1500;
const FORMAS: Readonly<Record<CasoDeCargaADatos, FormaDeEsqueleto>> = {
  "carga-a-tarjeta": "tarjeta",
  "carga-a-tabla": "tabla",
  "carga-a-tabla-llena": "tabla",
  "carga-a-grafico": "grafico",
  "carga-a-lista": "lista",
};

/** Un bloque que pasa de la carga a los datos a los 1,5 s, con un marcador debajo: lo que se mueve
 * al llegar los datos es lo que mide la prueba (REQ-064, desplazamiento de diseño ≤ 0,1). */
export function DemoDeCargaADatos({ caso }: { caso: CasoDeCargaADatos }) {
  const [llego, fijarLlego] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => fijarLlego(true), RETARDO_DE_LA_RESPUESTA_MS);
    return () => clearTimeout(t);
  }, []);
  return (
    <div className="flex min-w-0 flex-col gap-4">
      <div data-bloque-medido="">
        <BloqueDatos estado={llego ? "datos" : "carga"} forma={FORMAS[caso]}>
          {caso === "carga-a-tarjeta" ? (
            <ContenidoDeTarjeta />
          ) : caso === "carga-a-tabla" ? (
            <TablaInteractiva
              titulo={E.correosRevisados}
              configuracion={{
                conjunto: "clientes",
                total: 5,
                paginaInicial: 1,
                ordenInicial: null,
              }}
            />
          ) : caso === "carga-a-tabla-llena" ? (
            <TablaInteractiva
              titulo={E.correosRevisados}
              configuracion={{
                conjunto: "clientes",
                total: 25,
                paginaInicial: 1,
                ordenInicial: null,
              }}
            />
          ) : caso === "carga-a-grafico" ? (
            <GraficoLineas {...configuracionDeLineas("una-serie")} />
          ) : (
            <ContenidoDeAlertas />
          )}
        </BloqueDatos>
      </div>
      <p data-pie-del-bloque="">{T.bloque.marcador}</p>
    </div>
  );
}
