// Páginas de `Tabla` en la muestra (T-010 (g); CA-010, CA-006, CA-050, CA-051). Un estado por
// página fija. La configuración de cada una es datos puros (pasa al componente de cliente).
import type { ReactNode } from "react";
import { MarcoDeComponente } from "../cifras/marco";
import type { ConfiguracionDeTabla } from "./datos-ficticios";
import { HOSTILES } from "./datos-ficticios";
import { TablaInteractiva } from "./TablaInteractiva";
import { TEXTOS_TABLA as T } from "./textos-tabla";

export type EstadoDeTabla = keyof typeof T.explicaciones;

const CONFIGURACIONES: Readonly<Record<EstadoDeTabla, ConfiguracionDeTabla>> = {
  datos: { conjunto: "clientes", total: 1234, paginaInicial: 1, ordenInicial: null },
  intermedia: {
    conjunto: "clientes",
    total: 1234,
    paginaInicial: 17,
    ordenInicial: { columna: "correos", sentido: "descendente" },
  },
  ultima: { conjunto: "clientes", total: 1234, paginaInicial: 50, ordenInicial: null },
  "una-pagina": { conjunto: "clientes", total: 8, paginaInicial: 1, ordenInicial: null },
  vacia: { conjunto: "clientes", total: 0, paginaInicial: 1, ordenInicial: null },
  "diez-mil": { conjunto: "clientes", total: 10000, paginaInicial: 1, ordenInicial: null },
  ancha: { conjunto: "ancho", total: 120, paginaInicial: 1, ordenInicial: null },
  "nombres-largos-120": { conjunto: "largos", total: 30, paginaInicial: 1, ordenInicial: null },
  "texto-hostil": {
    conjunto: "hostil",
    total: HOSTILES.length,
    paginaInicial: 1,
    ordenInicial: null,
  },
};

function tituloDeLaTabla(estado: EstadoDeTabla): string {
  if (estado === "nombres-largos-120") return T.nombresLargos;
  if (estado === "texto-hostil") return T.hostil;
  if (estado === "ancha") return T.ancha;
  return T.tituloDeLaTabla;
}

export function VistaDeTabla({
  titulo,
  estado,
}: {
  titulo: string;
  estado: EstadoDeTabla;
}): ReactNode {
  return (
    <MarcoDeComponente titulo={titulo}>
      <section aria-labelledby="tabla-titulo" className="flex min-w-0 flex-col gap-4">
        <h2 id="tabla-titulo">{T.titulosDeSeccion[estado]}</h2>
        <p className="text-cuerpo-menor text-texto-secundario">{T.explicaciones[estado]}</p>
        <TablaInteractiva
          titulo={tituloDeLaTabla(estado)}
          configuracion={CONFIGURACIONES[estado]}
        />
      </section>
    </MarcoDeComponente>
  );
}
