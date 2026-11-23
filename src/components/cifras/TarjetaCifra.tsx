import { useId } from "react";
import { calcularVariacion } from "../formato/variacion";
import { formatearCifra, leerCifra } from "../formato/numeros";
import { TEXTOS, type TextoFijo } from "../textos";
import { ValorAjustado } from "./ValorAjustado";

// `TarjetaCifra` (diseño 020, «Componentes base», fila `TarjetaCifra`; REQ-011, REQ-050, REQ-053,
// REQ-055, REQ-076, REQ-081). Un grupo cuyo nombre accesible une etiqueta, valor, variación y
// periodo (`aria-labelledby` a las cuatro partes, en ese orden). El valor entra por `leerCifra`
// (a través de `formatearCifra`): cero es «0»; lo ausente, negativo donde no cabe o no numérico es
// «Sin datos». La variación sale de `calcularVariacion`. La valoración (favorable, desfavorable,
// neutra) la declara la vista; el signo y la palabra van siempre, el color solo acompaña. Etiqueta y
// periodo son textos fijos de `TEXTOS` (`TextoFijo`): no hay forma de pintar un texto libre.
// Sin estado propio salvo el ajuste del tamaño del valor (`ValorAjustado`), que lo hace aparte.

export type Valoracion = "favorable" | "desfavorable" | "neutra";

export type ComparacionDeCifra = {
  /** Valor del periodo anterior; cualquier cosa que no sea un número da «Sin datos para comparar». */
  readonly anterior: unknown;
  /** Solo con `true` exacto se compara: un periodo anterior incompleto no se compara. */
  readonly anteriorCompleto: boolean;
  /** Periodo con el que se compara, como texto fijo («frente a los 7 días anteriores»). */
  readonly periodo: TextoFijo;
  /** Qué sentido es bueno para esta medida. Sin declarar, o desconocida, es neutra. */
  readonly valoracion?: Valoracion;
};

export type PropiedadesDeTarjetaCifra = {
  readonly etiqueta: TextoFijo;
  /** Dato sin leer: pasa por `leerCifra`. */
  readonly valor: unknown;
  /** Mínimo admitido; por debajo, «Sin datos». Por defecto 0. */
  readonly minimo?: number;
  readonly decimales?: number;
  /** Solo se muestra variación si la vista lo pide. */
  readonly comparacion?: ComparacionDeCifra;
};

const COLOR_DE_VALORACION: Readonly<Record<Valoracion, string>> = {
  favorable: "text-correcto",
  desfavorable: "text-error",
  neutra: "text-texto-secundario",
};

function leerValoracion(valoracion: unknown): Valoracion {
  return typeof valoracion === "string" &&
    Object.hasOwn(COLOR_DE_VALORACION, valoracion) &&
    valoracion !== "__proto__"
    ? (valoracion as Valoracion)
    : "neutra";
}

export function TarjetaCifra({
  etiqueta,
  valor,
  minimo,
  decimales,
  comparacion,
}: PropiedadesDeTarjetaCifra) {
  const id = useId();
  const cifra = formatearCifra(valor, { minimo, decimales });
  const idEtiqueta = `${id}-etiqueta`;
  const idValor = `${id}-valor`;
  const idVariacion = `${id}-variacion`;
  const idPeriodo = `${id}-periodo`;

  const variacion =
    comparacion === undefined
      ? null
      : calcularVariacion(
          leerCifra(valor, { minimo }),
          comparacion.anterior,
          comparacion.anteriorCompleto,
          { decimales },
        );
  // Con subida o bajada, la palabra de la valoración que declara la vista; con «sin cambios» y sin
  // comparación, el color neutro y ninguna valoración.
  const conValoracion =
    variacion !== null && variacion.sentido !== null && variacion.tipo !== "nula";
  const valoracion = conValoracion ? leerValoracion(comparacion?.valoracion) : "neutra";
  const partes = [idEtiqueta, idValor, ...(variacion === null ? [] : [idVariacion, idPeriodo])];

  return (
    <div
      role="group"
      aria-labelledby={partes.join(" ")}
      data-tarjeta-cifra=""
      className="flex min-w-0 flex-col gap-2 rounded-grande border border-borde-decorativo bg-superficie p-4 shadow-tarjeta"
    >
      <p id={idEtiqueta} className="text-cuerpo-menor font-medio text-texto-secundario">
        {etiqueta}
      </p>
      <ValorAjustado key={cifra.texto} id={idValor} texto={cifra.texto} />
      {variacion !== null && comparacion !== undefined ? (
        <>
          <p id={idVariacion} className="text-cuerpo-menor">
            <span data-variacion={variacion.tipo} className={COLOR_DE_VALORACION[valoracion]}>
              {variacion.texto}
            </span>
            {variacion.palabra !== null ? <span> ({variacion.palabra})</span> : null}
            {conValoracion ? (
              <span className={COLOR_DE_VALORACION[valoracion]} data-valoracion={valoracion}>
                {" "}
                ({TEXTOS.cifras.valoracion[valoracion]})
              </span>
            ) : null}
          </p>
          <p id={idPeriodo} className="text-pequeno text-texto-secundario">
            {comparacion.periodo}
          </p>
        </>
      ) : null}
    </div>
  );
}
