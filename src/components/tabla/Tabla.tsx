"use client";

// `Tabla` (diseño 020, fila `Tabla`, `Paginacion`, `RegionDesplazable`; REQ-013, REQ-042, REQ-045,
// REQ-056, REQ-066, REQ-067, REQ-071, REQ-075). Una `table` nativa, controlada: recibe las filas
// de UNA página, el total y el orden, y avisa con `alCambiar({pagina, orden})`; no guarda nada ni
// navega (la vista pone página y orden en la dirección con `esquemaDeTabla`). Nunca pinta más de
// una página: lo que sobre del tamaño se descarta, así que 10.000 filas recibidas son 25 en el
// documento. Cada columna ordenable lleva un botón en su cabecera y la ordenada, `aria-sort`; el
// cambio de orden se anuncia. Todo dato pasa por el lector: el texto por `leerCelda` y `TextoDato`
// (sin invisibles ni dirección, dentro de `bdi`, que parte los nombres largos en vez de recortar),
// las cifras por los formateadores y el estado por `EtiquetaEstado` (catálogo cerrado). De cada
// fila solo se leen las claves de las columnas declaradas y solo si son propias: ni un
// identificador ni un campo de más llegan al documento. Sin filas o sin columnas, el estado vacío,
// no una tabla vacía. Si no cabe, se desplaza dentro de su `RegionDesplazable`.
import type { ReactNode } from "react";
import { EtiquetaEstado } from "../estado/EtiquetaEstado";
import { textoPlano } from "../formato/texto-plano";
import { IconoOrdenAscendente, IconoOrdenar, IconoOrdenDescendente } from "../iconos";
import { anunciar } from "../texto/anuncios";
import { TextoDato } from "../texto/TextoDato";
import { TEXTOS } from "../textos";
import { Paginacion } from "./Paginacion";
import {
  calcularPaginacion,
  cambioDeOrden,
  cambioDePagina,
  columnasValidas,
  leerCelda,
  leerOrden,
  textoDeAnuncioDeOrden,
  type CambioDeTabla,
  type ColumnaDeTabla,
  type OrdenDeTabla,
} from "./logica";
import { RegionDesplazable } from "./RegionDesplazable";

export type PropiedadesDeTabla = {
  /** Título de la tabla: su `caption` y el nombre de su región. Dato de la vista. */
  readonly titulo: string;
  readonly columnas: readonly ColumnaDeTabla[];
  /** Las filas de la página actual. Solo se leen las claves de las columnas. */
  readonly filas: readonly Readonly<Record<string, unknown>>[];
  /** Total de filas del conjunto, no de la página. */
  readonly total: number;
  readonly pagina: number;
  readonly tamano?: number;
  readonly orden?: OrdenDeTabla | null;
  readonly alCambiar: (cambio: CambioDeTabla) => void;
};

const CELDA = "border-b border-borde-decorativo px-3 py-2 align-top";
const BOTON_DE_COLUMNA =
  "inline-flex min-h-10 items-center gap-1 rounded-pequeno border border-transparent px-1 text-left font-medio text-texto";

function dato(fila: unknown, clave: string): unknown {
  return typeof fila === "object" && fila !== null && Object.hasOwn(fila, clave)
    ? (fila as Record<string, unknown>)[clave]
    : undefined;
}

function Celda({ columna, valor }: { columna: ColumnaDeTabla; valor: unknown }): ReactNode {
  const leida = leerCelda(columna, valor);
  if (leida.clase === "estado") {
    return <EtiquetaEstado ambito={columna.ambito ?? ""} valor={valor} />;
  }
  if (leida.clase === "numero") return leida.texto;
  return <TextoDato texto={leida.texto} />;
}

const esNumerica = (c: ColumnaDeTabla): boolean => c.tipo === "numero" || c.tipo === "porcentaje";

export function Tabla({
  titulo,
  columnas,
  filas,
  total,
  pagina,
  tamano,
  orden,
  alCambiar,
}: PropiedadesDeTabla) {
  const cols = columnasValidas(columnas);
  const nombreLimpio = typeof titulo === "string" ? textoPlano(titulo).trim() : "";
  const nombre = nombreLimpio === "" ? TEXTOS.tabla.sinTitulo : nombreLimpio;
  const previo = calcularPaginacion(total, pagina, tamano);
  const lista = Array.isArray(filas) ? (filas as readonly unknown[]) : [];

  if (cols.length === 0 || previo.vacia || lista.length === 0) {
    return (
      <section
        aria-label={nombre}
        data-tabla-vacia
        className="rounded-medio border border-borde-decorativo bg-superficie p-4"
      >
        <p className="text-cuerpo font-medio text-texto">{TEXTOS.tabla.vacio.titulo}</p>
        <p className="text-cuerpo-menor text-texto-secundario">{TEXTOS.tabla.vacio.explicacion}</p>
      </section>
    );
  }

  const visibles = lista.slice(0, previo.tamano);
  const paginado = calcularPaginacion(total, pagina, tamano, visibles.length);
  const ordenLeido = leerOrden(orden, cols);
  const avisar = (cambio: CambioDeTabla): void => {
    if (typeof alCambiar === "function") alCambiar(cambio);
  };

  return (
    <div data-tabla className="flex flex-col">
      <div className="bg-superficie">
        <RegionDesplazable nombre={`${nombre}, ${TEXTOS.tabla.regionDesplazable}`}>
          <table className="w-full border border-borde-decorativo border-collapse text-left text-cuerpo-menor text-texto">
            <caption className="caption-top px-3 py-2 text-left text-cuerpo font-medio text-texto">
              {nombre}
            </caption>
            <thead>
              <tr>
                {cols.map((c) => {
                  const activa = ordenLeido !== null && ordenLeido.columna === c.clave;
                  const derecha = esNumerica(c);
                  const Icono = !activa
                    ? IconoOrdenar
                    : ordenLeido.sentido === "ascendente"
                      ? IconoOrdenAscendente
                      : IconoOrdenDescendente;
                  return (
                    <th
                      key={c.clave}
                      scope="col"
                      aria-sort={
                        activa
                          ? ordenLeido.sentido === "ascendente"
                            ? "ascending"
                            : "descending"
                          : undefined
                      }
                      className={`border-b border-borde-decorativo px-3 py-1 align-bottom font-medio text-texto ${derecha ? "text-right" : "text-left"}`}
                    >
                      {c.ordenable === true ? (
                        <button
                          type="button"
                          data-ordenar={c.clave}
                          className={`${BOTON_DE_COLUMNA} ${derecha ? "justify-end" : ""}`}
                          onClick={() => {
                            const cambio = cambioDeOrden(cols, ordenLeido, c.clave);
                            if (cambio === null || cambio.orden === null) return;
                            anunciar(textoDeAnuncioDeOrden(c.etiqueta, cambio.orden.sentido));
                            avisar(cambio);
                          }}
                        >
                          <TextoDato texto={c.etiqueta} />
                          <Icono tamano={16} />
                        </button>
                      ) : (
                        <TextoDato texto={c.etiqueta} />
                      )}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {visibles.map((fila, i) => (
                <tr key={i}>
                  {cols.map((c, j) => {
                    const derecha = esNumerica(c);
                    const contenido = <Celda columna={c} valor={dato(fila, c.clave)} />;
                    return j === 0 ? (
                      <th
                        key={c.clave}
                        scope="row"
                        className={`${CELDA} font-normal ${derecha ? "text-right" : "text-left"}`}
                      >
                        {contenido}
                      </th>
                    ) : (
                      <td
                        key={c.clave}
                        {...(derecha ? { "data-cifra": "" } : {})}
                        className={`${CELDA} ${derecha ? "text-right" : "text-left"}`}
                      >
                        {contenido}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </RegionDesplazable>
      </div>
      <Paginacion
        total={paginado.total}
        pagina={paginado.pagina}
        tamano={paginado.tamano}
        filasPintadas={visibles.length}
        etiqueta={nombre}
        alCambiarPagina={(destino) => {
          const cambio = cambioDePagina(paginado, destino, ordenLeido);
          if (cambio !== null) avisar(cambio);
        }}
      />
    </div>
  );
}
