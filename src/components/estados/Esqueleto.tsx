"use client";

// `Esqueleto` (diseño 020, «Estados de cada vista», fila `carga`, y «Cuando algo falla»; REQ-023,
// REQ-039, REQ-069; CA-016, CA-048). El aspecto del contenido que va a llegar, con su forma y, en
// lo posible, su alto (tarjeta, tabla, gráfico, lista): usa las mismas cajas, rellenos y alturas de
// línea que el componente real para no mover la página al llegar los datos. Los bloques son
// decorativos (`aria-hidden`) y se animan con `--duracion-esqueleto` (0 con movimiento reducido).
// «Cargando» lo anuncia una sola vez, por la región cortés, al montarse (la guarda por referencia
// resiste el doble efecto del modo de desarrollo) y está también como texto solo para lector; el
// contenedor es `aria-busy`, sin ser región viva, para no leerlo dos veces. La variante lenta
// (`lenta`, que decide `BloqueDatos` a los 10 s) añade, visible y anunciado una sola vez,
// «Está tardando más de lo normal». Los plazos de 10 s y 30 s no son de este componente. Si quien
// lo usa ya anuncia la carga (el cambio de periodo), pasa `anunciarCarga={false}` y anuncia él también la carga lenta. Sin texto libre.
import { useEffect, useRef } from "react";
import { anunciar } from "../texto/anuncios";
import { SoloLector } from "../texto/SoloLector";
import { TEXTOS } from "../textos";
import {
  ELEMENTOS_DE_ESQUELETO_DE_LISTA,
  FILAS_DE_ESQUELETO_DE_TABLA,
  leerFormaDeEsqueleto,
  type FormaDeEsqueleto,
} from "./logica";

export type PropiedadesDeEsqueleto = {
  readonly forma: FormaDeEsqueleto;
  /** Lleva más de 10 s cargando (lo decide el bloque de datos). */
  readonly lenta?: boolean;
  /** `false` si quien lo pinta ya anuncia la carga. Por defecto se anuncia. */
  readonly anunciarCarga?: boolean;
};

const BLOQUE =
  "esqueleto-pulso block rounded-pequeno border border-borde-decorativo bg-borde-decorativo";

/** Altura de línea de cada texto que sustituye: cada una es la del texto real. */
const ALTO_DE_LINEA = {
  /** 20 px: `text-cuerpo-menor`. */
  menor: "h-5",
  /** 24 px: `text-cuerpo`. */
  cuerpo: "h-6",
  /** 16 px: `text-pequeno`. */
  pequeno: "h-4",
} as const;
const ALTO_DE_BARRA = { menor: "h-3", cuerpo: "h-3", pequeno: "h-2" } as const;
const ANCHOS = {
  completo: "w-full",
  tres_cuartos: "w-3/4",
  mitad: "w-1/2",
  tercio: "w-1/3",
  cuarto: "w-1/4",
} as const;

/** Una línea de texto dibujada: la caja tiene la altura de línea real y la barra va centrada. */
function Linea({
  alto,
  ancho = "mitad",
}: {
  alto: keyof typeof ALTO_DE_LINEA;
  ancho?: keyof typeof ANCHOS;
}) {
  return (
    <span className={`flex items-center ${ALTO_DE_LINEA[alto]}`}>
      <span
        aria-hidden="true"
        data-esqueleto-bloque=""
        className={`${BLOQUE} ${ALTO_DE_BARRA[alto]} ${ANCHOS[ancho]}`}
      />
    </span>
  );
}

/** Como `TarjetaCifra` con comparación: borde, relleno y separación iguales; etiqueta de 20 px,
 * cifra de 36 px (32 de barra y 4 de aire), variación de 20 px y periodo de 16 px. */
function FormaTarjeta() {
  return (
    <div
      data-esqueleto-tarjeta=""
      className="flex min-w-0 flex-col gap-2 rounded-grande border border-borde-decorativo bg-superficie p-4 shadow-tarjeta"
    >
      <Linea alto="menor" ancho="tercio" />
      <span className="flex pb-1">
        <span
          aria-hidden="true"
          data-esqueleto-bloque=""
          className={`${BLOQUE} h-8 ${ANCHOS.mitad}`}
        />
      </span>
      <Linea alto="menor" ancho="tres_cuartos" />
      <Linea alto="pequeno" ancho="cuarto" />
    </div>
  );
}

/** Como `Tabla`: título de 40 px, cabecera de 49 px y filas de 37 px (relleno de 8 más línea de
 * 20 y la raya inferior). Dibuja pocas filas: una página llena tiene hasta 25. */
function FormaTabla() {
  const filas = Array.from({ length: FILAS_DE_ESQUELETO_DE_TABLA }, (_, i) => i);
  return (
    <div data-esqueleto-tabla="" className="flex min-w-0 flex-col bg-superficie">
      <div className="flex items-center px-3 py-2">
        <span
          aria-hidden="true"
          data-esqueleto-bloque=""
          className={`${BLOQUE} h-6 ${ANCHOS.tercio}`}
        />
      </div>
      <div className="flex items-end gap-4 border-b border-borde-decorativo px-3 py-1">
        {[0, 1].map((i) => (
          <span key={i} className={`flex h-10 items-center ${ANCHOS.cuarto}`}>
            <span aria-hidden="true" data-esqueleto-bloque="" className={`${BLOQUE} h-3 w-full`} />
          </span>
        ))}
      </div>
      {filas.map((i) => (
        <div
          key={i}
          data-esqueleto-fila=""
          className="flex items-center gap-4 border-b border-borde-decorativo px-3 py-2"
        >
          <Linea alto="menor" ancho="completo" />
        </div>
      ))}
    </div>
  );
}

/** Como el marco de un gráfico: caja, título (24 px), ejes (20 px), dibujo con su proporción y el
 * resumen de «Ver los datos en tabla» (40 px). */
function FormaGrafico() {
  return (
    <div
      data-esqueleto-grafico=""
      className="flex min-w-0 flex-col gap-3 rounded-medio border border-borde-decorativo bg-superficie p-4"
    >
      <Linea alto="cuerpo" ancho="tercio" />
      <Linea alto="menor" ancho="tres_cuartos" />
      <span
        aria-hidden="true"
        data-esqueleto-bloque=""
        className={`${BLOQUE} aspect-4/3 w-full min-w-0 sm:aspect-2/1 lg:aspect-3/1`}
      />
      <span className="flex min-h-10 items-center">
        <span
          aria-hidden="true"
          data-esqueleto-bloque=""
          className={`${BLOQUE} h-3 ${ANCHOS.cuarto}`}
        />
      </span>
    </div>
  );
}

/** Como `ListaAlertas`: una caja por elemento con la gravedad, el texto y la fecha. */
function FormaLista() {
  const elementos = Array.from({ length: ELEMENTOS_DE_ESQUELETO_DE_LISTA }, (_, i) => i);
  return (
    <div data-esqueleto-lista="" className="flex min-w-0 flex-col gap-3">
      {elementos.map((i) => (
        <div
          key={i}
          data-esqueleto-elemento=""
          className="flex min-w-0 flex-col items-start gap-2 rounded-medio border border-borde-decorativo bg-superficie p-3"
        >
          <Linea alto="menor" ancho="cuarto" />
          <Linea alto="cuerpo" ancho="tres_cuartos" />
          <Linea alto="pequeno" ancho="tercio" />
        </div>
      ))}
    </div>
  );
}

export function Esqueleto({ forma, lenta = false, anunciarCarga = true }: PropiedadesDeEsqueleto) {
  const leida = leerFormaDeEsqueleto(forma);
  const esLenta = lenta === true;
  const dichoCarga = useRef(false);
  const dichoLenta = useRef(false);

  useEffect(() => {
    if (anunciarCarga !== false && !dichoCarga.current) {
      dichoCarga.current = true;
      anunciar(TEXTOS.bloque.cargando);
    }
  }, [anunciarCarga]);

  useEffect(() => {
    // Quien ya anuncia la carga (`anunciarCarga={false}`) anuncia también que tarda.
    if (esLenta && anunciarCarga !== false && !dichoLenta.current) {
      dichoLenta.current = true;
      anunciar(TEXTOS.bloque.cargaLenta);
    }
  }, [esLenta, anunciarCarga]);

  return (
    <div
      data-estado="carga"
      data-esqueleto={leida}
      {...(esLenta ? { "data-lenta": "true" } : {})}
      aria-busy="true"
      className="flex min-w-0 flex-col gap-3"
    >
      <SoloLector>{TEXTOS.bloque.cargando}</SoloLector>
      {leida === "tabla" ? (
        <FormaTabla />
      ) : leida === "grafico" ? (
        <FormaGrafico />
      ) : leida === "lista" ? (
        <FormaLista />
      ) : (
        <FormaTarjeta />
      )}
      {esLenta ? (
        <p data-carga-lenta className="text-cuerpo-menor text-texto-secundario">
          {TEXTOS.bloque.cargaLenta}
        </p>
      ) : null}
    </div>
  );
}
