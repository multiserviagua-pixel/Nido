"use client";

// `Paginacion` (diseño 020, fila `Tabla`; REQ-013, REQ-042, REQ-066, REQ-067). Controlada: recibe
// el total y la página y avisa de la página a la que se quiere ir; no navega ni guarda nada. La
// posición se escribe con miles («Del 26 al 50 de 1.234») y se calcula con `calcularPaginacion`:
// una página fuera de rango se corrige y con 0 filas no se pinta nada (no hay «Del 0 al 0»).
// Con una sola página solo hay posición. Con varias: Anterior, números acotados con huecos y
// Siguiente, en botones; los de los extremos usan `aria-disabled` (no `disabled`) para que el foco
// no se pierda al llegar al final. La página actual lleva `aria-current="page"`. Cada cambio se
// anuncia («Página 3 de 50. Del 51 al 75 de 1.234»). Botones de 40 px (REQ-037).
import { formatearNumero } from "../formato/numeros";
import { textoPlano } from "../formato/texto-plano";
import { IconoPaginaAnterior, IconoPaginaSiguiente } from "../iconos";
import { anunciar } from "../texto/anuncios";
import { TEXTOS } from "../textos";
import {
  calcularPaginacion,
  cambioDePagina,
  paginasVisibles,
  textoDeAnuncioDePagina,
  textoDePosicion,
} from "./logica";

export type PropiedadesDePaginacion = {
  readonly total: unknown;
  readonly pagina: unknown;
  readonly tamano?: unknown;
  /** Filas que se ven de verdad; el final de la posición sale de ellas. */
  readonly filasPintadas?: number;
  /** Complemento del nombre de la navegación (el título de la tabla), como dato. */
  readonly etiqueta?: string;
  readonly alCambiarPagina: (pagina: number) => void;
};

const BASE =
  "inline-flex min-h-10 min-w-10 items-center justify-center gap-1 rounded-medio border px-3 text-cuerpo-menor font-medio";
const NORMAL = `${BASE} border-borde-control bg-superficie text-texto`;
const ACTUAL = `${BASE} border-acento bg-acento text-texto-sobre-acento font-seminegrita`;
const DESACTIVADO = `${BASE} border-borde-decorativo bg-superficie text-texto-secundario`;

export function Paginacion({
  total,
  pagina,
  tamano,
  filasPintadas,
  etiqueta,
  alCambiarPagina,
}: PropiedadesDePaginacion) {
  const p = calcularPaginacion(total, pagina, tamano, filasPintadas);
  if (p.vacia) return null;
  const complemento = typeof etiqueta === "string" ? textoPlano(etiqueta).trim() : "";
  const nombre =
    complemento === "" ? TEXTOS.tabla.paginacion : `${TEXTOS.tabla.paginacion} de ${complemento}`;

  const ir = (destino: number): void => {
    const cambio = cambioDePagina(p, destino, null);
    if (cambio === null) return;
    anunciar(textoDeAnuncioDePagina(calcularPaginacion(p.total, destino, p.tamano)));
    if (typeof alCambiarPagina === "function") alCambiarPagina(cambio.pagina);
  };

  const hayAnterior = p.pagina > 1;
  const haySiguiente = p.pagina < p.paginas;
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 py-2">
      <p data-posicion className="text-cuerpo-menor text-texto">
        {textoDePosicion(p)}
      </p>
      {p.paginas > 1 ? (
        <nav aria-label={nombre}>
          <ul className="flex flex-wrap items-center gap-1">
            <li>
              <button
                type="button"
                data-paginacion="anterior"
                className={hayAnterior ? NORMAL : DESACTIVADO}
                aria-disabled={hayAnterior ? undefined : "true"}
                onClick={() => ir(p.pagina - 1)}
              >
                <IconoPaginaAnterior tamano={16} />
                {TEXTOS.tabla.anterior}
              </button>
            </li>
            {paginasVisibles(p.pagina, p.paginas).map((numero, indice) =>
              numero === null ? (
                <li
                  key={`hueco-${indice}`}
                  aria-hidden="true"
                  className="px-1 text-texto-secundario"
                >
                  …
                </li>
              ) : (
                <li key={numero}>
                  <button
                    type="button"
                    data-paginacion="numero"
                    className={numero === p.pagina ? ACTUAL : NORMAL}
                    aria-current={numero === p.pagina ? "page" : undefined}
                    aria-label={`${TEXTOS.tabla.pagina} ${formatearNumero(numero)}`}
                    onClick={() => ir(numero)}
                  >
                    {formatearNumero(numero)}
                  </button>
                </li>
              ),
            )}
            <li>
              <button
                type="button"
                data-paginacion="siguiente"
                className={haySiguiente ? NORMAL : DESACTIVADO}
                aria-disabled={haySiguiente ? undefined : "true"}
                onClick={() => ir(p.pagina + 1)}
              >
                {TEXTOS.tabla.siguiente}
                <IconoPaginaSiguiente tamano={16} />
              </button>
            </li>
          </ul>
        </nav>
      ) : null}
    </div>
  );
}
