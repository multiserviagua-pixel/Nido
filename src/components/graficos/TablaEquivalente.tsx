import { TextoDato } from "../texto/TextoDato";
import { RegionDesplazable } from "../tabla/RegionDesplazable";
import { TEXTOS } from "../textos";
import type { ModeloDeGrafico } from "./logica";

// `TablaEquivalente` (diseño 020, «Gráficos»; REQ-015, REQ-038, REQ-071). La misma información que
// el dibujo, en una `table` nativa: una fila por punto (todos, no una página: el diseño exige el
// 100 % de los valores) y una columna por serie, con la unidad en el encabezado. Sale del mismo
// `ModeloDeGrafico` que el dibujo, así que los valores coinciden por construcción. Un hueco dice
// «Sin datos»: nunca 0. Sin datos suficientes no hay dibujo y tampoco tabla. Si es más ancha que
// la pantalla, solo se desplaza su región.

export function TablaEquivalente({ modelo }: { modelo: ModeloDeGrafico }) {
  if (modelo.estado !== "datos") return null;
  return (
    <RegionDesplazable nombre={`${modelo.titulo}, ${TEXTOS.graficos.tablaDeDatos}`}>
      <table
        data-tabla-equivalente
        className="w-full border border-borde-decorativo border-collapse text-left text-cuerpo-menor text-texto"
      >
        <caption className="caption-top px-3 py-2 text-left text-cuerpo font-medio text-texto">
          {modelo.titulo}
        </caption>
        <thead>
          <tr>
            <th
              scope="col"
              className="border-b border-borde-decorativo px-3 py-2 text-left align-bottom font-medio"
            >
              <TextoDato texto={modelo.ejeX.nombre} />
            </th>
            {modelo.series.map((s) => (
              <th
                key={s.indice}
                scope="col"
                className="border-b border-borde-decorativo px-3 py-2 text-right align-bottom font-medio"
              >
                <TextoDato texto={`${s.nombre} (${modelo.ejeY.unidad})`} />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {modelo.categorias.map((c, i) => (
            <tr key={i}>
              <th
                scope="row"
                className="border-b border-borde-decorativo px-3 py-2 text-left align-top font-normal"
              >
                <TextoDato texto={c.texto} />
              </th>
              {modelo.series.map((s) => (
                <td
                  key={s.indice}
                  data-cifra=""
                  className="border-b border-borde-decorativo px-3 py-2 text-right align-top"
                >
                  {s.textos[i]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </RegionDesplazable>
  );
}
