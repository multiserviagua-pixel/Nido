// Páginas de los estados de una vista en la muestra (T-016 (c); CA-016, CA-020, CA-042, CA-048). Un
// estado por página fija. Los datos son ficticios; la referencia inválida del caso de error se arma
// en el cliente. El estado sin permiso se pinta dentro del armazón, igual que lo hará el
// `not-found` de cada dashboard.
import type { ReactNode } from "react";
import { EstadoSinPermiso } from "@/components/estados/EstadoSinPermiso";
import { Esqueleto } from "@/components/estados/Esqueleto";
import { MarcoDeComponente } from "../cifras/marco";
import { DemoDeEstadoError, type CasoDeError } from "./DemoDeEstadoError";
import { DemoDeEstadoVacio } from "./DemoDeEstadoVacio";
import { TEXTOS_ESTADOS as T } from "./textos-estados";

export type EstadoDeVacio = keyof typeof T.vacio.explicaciones;
export type EstadoDeEsqueleto = keyof typeof T.esqueleto.explicaciones;

function Seccion({
  titulo,
  explicacion,
  children,
}: {
  titulo: string;
  explicacion: string;
  children: ReactNode;
}): ReactNode {
  return (
    <div className="flex min-w-0 flex-col gap-4">
      <h2>{titulo}</h2>
      <p className="text-cuerpo-menor text-texto-secundario">{explicacion}</p>
      {children}
    </div>
  );
}

export function VistaDeEstadoVacio({
  titulo,
  estado,
}: {
  titulo: string;
  estado: EstadoDeVacio;
}): ReactNode {
  return (
    <MarcoDeComponente titulo={titulo}>
      <Seccion titulo={T.vacio.titulo} explicacion={T.vacio.explicaciones[estado]}>
        <DemoDeEstadoVacio conAccion={estado === "con-accion"} />
      </Seccion>
    </MarcoDeComponente>
  );
}

export function VistaDeEstadoError({
  titulo,
  estado,
}: {
  titulo: string;
  estado: CasoDeError;
}): ReactNode {
  return (
    <MarcoDeComponente titulo={titulo}>
      <Seccion titulo={T.error.titulo} explicacion={T.error.explicaciones[estado]}>
        <DemoDeEstadoError caso={estado} />
      </Seccion>
    </MarcoDeComponente>
  );
}

export function VistaDeSinPermiso({ titulo }: { titulo: string }): ReactNode {
  return (
    <MarcoDeComponente titulo={titulo}>
      <EstadoSinPermiso rutaDelResumen="/muestra" />
    </MarcoDeComponente>
  );
}

const FORMAS = {
  tarjeta: "tarjeta",
  tabla: "tabla",
  grafico: "grafico",
  lista: "lista",
  "carga-lenta": "tarjeta",
} as const;

export function VistaDeEsqueleto({
  titulo,
  estado,
}: {
  titulo: string;
  estado: EstadoDeEsqueleto;
}): ReactNode {
  return (
    <MarcoDeComponente titulo={titulo}>
      <Seccion titulo={T.esqueleto.titulo} explicacion={T.esqueleto.explicaciones[estado]}>
        <Esqueleto forma={FORMAS[estado]} lenta={estado === "carga-lenta"} />
      </Seccion>
    </MarcoDeComponente>
  );
}
