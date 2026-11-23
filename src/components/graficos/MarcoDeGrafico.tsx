import { useId } from "react";
import { TextoDato } from "../texto/TextoDato";
import { TEXTOS } from "../textos";
import { DibujoDeGrafico } from "./DibujoDeGrafico";
import { MAXIMO_DE_PUNTOS_CON_MARCADOR } from "./estilos-de-serie";
import { descripcionDeGrafico, type ModeloDeGrafico, type TipoDeGrafico } from "./logica";
import { MuestraDeSerie, PatronesDeTrama } from "./marcas";
import { TablaEquivalente } from "./TablaEquivalente";

// Lo común de `GraficoLineas` y `GraficoBarras` (diseño 020, «Gráficos»; REQ-014, REQ-015, REQ-038,
// REQ-052, REQ-054). Una figura con su título; los nombres de los ejes con su unidad; la leyenda
// (si hay más de una serie) con la muestra de trazo y marcador o de trama de cada una; el dibujo,
// una imagen con nombre y descripción que remite a la tabla; y justo después, en un bloque
// desplegable nativo, la tabla equivalente. Todo sale del mismo modelo. Sin datos o con menos de
// los necesarios no hay dibujo ni tabla, sino su estado. Solo el dibujo es de cliente.

const CAJA =
  "flex min-w-0 flex-col gap-3 rounded-medio border border-borde-decorativo bg-superficie p-4";

export function MarcoDeGrafico({
  modelo,
  tipo,
  tablaAbierta = false,
}: {
  modelo: ModeloDeGrafico;
  tipo: TipoDeGrafico;
  tablaAbierta?: boolean;
}) {
  const identificador = useId();
  const base = `g${identificador.replace(/[^a-zA-Z0-9]/g, "")}`;
  const idTitulo = `${base}-titulo`;
  const idDescripcion = `${base}-descripcion`;

  if (modelo.estado !== "datos") {
    const textos =
      modelo.estado === "vacio" ? TEXTOS.graficos.sinDatos : TEXTOS.graficos.sinDatosSuficientes;
    return (
      <figure
        data-grafico={tipo}
        data-estado={modelo.estado}
        aria-labelledby={idTitulo}
        className={CAJA}
      >
        <figcaption
          id={idTitulo}
          dir="auto"
          className="break-words text-cuerpo font-medio text-texto"
        >
          {modelo.titulo}
        </figcaption>
        <div data-grafico-vacio>
          <p className="break-words text-cuerpo font-medio text-texto">{textos.titulo}</p>
          <p className="text-cuerpo-menor text-texto-secundario">{textos.explicacion}</p>
        </div>
      </figure>
    );
  }

  const conMarcadores = modelo.categorias.length <= MAXIMO_DE_PUNTOS_CON_MARCADOR;
  return (
    <figure data-grafico={tipo} data-estado="datos" aria-labelledby={idTitulo} className={CAJA}>
      <figcaption
        id={idTitulo}
        dir="auto"
        className="break-words text-cuerpo font-medio text-texto"
      >
        {modelo.titulo}
      </figcaption>
      <p className="flex flex-wrap gap-x-4 break-words text-cuerpo-menor text-texto-secundario">
        <span>
          {TEXTOS.graficos.ejeHorizontal}: <TextoDato texto={modelo.ejeX.nombre} />
        </span>
        <span>
          {TEXTOS.graficos.ejeVertical}:{" "}
          <TextoDato texto={`${modelo.ejeY.nombre} (${modelo.ejeY.unidad})`} />
        </span>
      </p>
      {tipo === "barras" ? <PatronesDeTrama base={base} /> : null}
      {modelo.series.length > 1 ? (
        <ul
          data-leyenda
          aria-label={TEXTOS.graficos.leyenda}
          className="flex flex-wrap gap-x-4 gap-y-1 text-cuerpo-menor text-texto"
        >
          {modelo.series.map((s) => (
            <li
              key={s.indice}
              data-leyenda-serie={s.indice}
              className="flex min-w-0 items-center gap-2"
            >
              <MuestraDeSerie
                tipo={tipo}
                indice={s.indice}
                base={base}
                conMarcadores={conMarcadores}
              />
              <span className="min-w-0 break-words">
                <TextoDato texto={s.nombre} />
              </span>
            </li>
          ))}
        </ul>
      ) : null}
      <div
        role="img"
        aria-label={modelo.titulo}
        aria-describedby={idDescripcion}
        data-puntos={modelo.puntos}
        data-series={modelo.series.length}
        className="aspect-4/3 w-full min-w-0 sm:aspect-2/1 lg:aspect-3/1"
      >
        <DibujoDeGrafico modelo={modelo} tipo={tipo} base={base} />
      </div>
      <p id={idDescripcion} hidden>
        {descripcionDeGrafico(modelo, tipo)}
      </p>
      <details open={tablaAbierta}>
        <summary className="inline-flex min-h-10 cursor-pointer items-center text-cuerpo-menor font-medio text-enlace underline">
          {TEXTOS.graficos.verTabla}
        </summary>
        <div className="pt-2">
          <TablaEquivalente modelo={modelo} />
        </div>
      </details>
    </figure>
  );
}
