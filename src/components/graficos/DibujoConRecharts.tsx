"use client";

// ÚNICO módulo que importa Recharts (PRUEBA-008, regla «Recharts solo en graficos/»). Pinta el
// modelo ya leído (`logica.ts`), nunca los datos de la vista. Sin animación, sin información al
// pasar el puntero (no hay `Tooltip`) y sin la capa de teclado de Recharts (`accessibilityLayer`
// apagada: recibía el foco y no anunciaba nada, V-110). El dibujo no tiene controles ni foco.
// Colores solo por papeles (`var(--serie-N)`, `--texto-secundario`, `--borde-control`).
import { Bar, BarChart, CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";
import { formatearNumero } from "../formato/numeros";
import {
  COLOR_DE_SERIE,
  ESTILO_DE_LINEA,
  MAXIMO_DE_PUNTOS_CON_MARCADOR,
  marcadorDe,
  trazoDe,
} from "./estilos-de-serie";
import { abreviarParaEje, type ModeloDeGrafico, type TipoDeGrafico } from "./logica";
import { Marcador, rellenoDeBarra } from "./marcas";

const LARGO_DE_MARCA = 12;
const MARGEN = { top: 8, right: 16, bottom: 8, left: 4 } as const;
const TEXTO_DE_EJE = { fill: "var(--texto-secundario)", fontSize: 12 } as const;
const COLOR_DE_EJE = "var(--borde-control)";
const COLOR_DE_REJILLA = "var(--borde-decorativo)";

type Fila = Record<string, number | string | null>;

/** Filas para Recharts: una por categoría, con la clave de posición y una columna por serie. */
function filasDe(modelo: ModeloDeGrafico): Fila[] {
  return modelo.categorias.map((_, i) => {
    const fila: Fila = { clave: String(i) };
    for (const s of modelo.series) fila[`s${s.indice}`] = s.valores[i] ?? null;
    return fila;
  });
}

type Propiedades = {
  modelo: ModeloDeGrafico;
  tipo: TipoDeGrafico;
  base: string;
  ancho: number;
  alto: number;
};

function Ejes({ modelo, paraLineas }: { modelo: ModeloDeGrafico; paraLineas: boolean }) {
  const decimales = modelo.ejeY.decimales;
  // El eje parte de cero; solo baja de cero si hay negativos (líneas). Con todo a cero, de 0 a 1.
  const dominio: [number | "auto", number | "auto"] =
    (modelo.minimo ?? 0) < 0 ? ["auto", "auto"] : [0, (modelo.maximo ?? 0) <= 0 ? 1 : "auto"];
  return (
    <>
      <CartesianGrid vertical={false} stroke={COLOR_DE_REJILLA} />
      <XAxis
        dataKey="clave"
        interval="preserveStartEnd"
        minTickGap={12}
        tickMargin={8}
        padding={paraLineas ? { left: 16, right: 16 } : undefined}
        tick={TEXTO_DE_EJE}
        stroke={COLOR_DE_EJE}
        tickFormatter={(k: unknown) =>
          abreviarParaEje(modelo.categorias[Number(k)]?.texto ?? "", LARGO_DE_MARCA)
        }
      />
      <YAxis
        width="auto"
        tickMargin={4}
        allowDecimals={decimales > 0}
        tick={TEXTO_DE_EJE}
        stroke={COLOR_DE_EJE}
        tickFormatter={(v: unknown) => formatearNumero(Number(v), decimales)}
        domain={dominio}
      />
    </>
  );
}

type PuntoRecibido = { cx?: number; cy?: number; index?: number };

/** Marcador de un punto. Con muchos puntos solo se marcan los aislados (sin vecino con dato),
 * que de otro modo no se verían: una línea no dibuja un punto suelto. */
function Punto({
  cx,
  cy,
  index,
  serie,
  modelo,
  conMarcadores,
}: PuntoRecibido & { serie: number; modelo: ModeloDeGrafico; conMarcadores: boolean }) {
  if (typeof cx !== "number" || typeof cy !== "number" || typeof index !== "number") return <g />;
  const valores = modelo.series[serie]?.valores ?? [];
  const valor = valores[index];
  if (valor === null || valor === undefined) return <g />;
  const aislado = (valores[index - 1] ?? null) === null && (valores[index + 1] ?? null) === null;
  if (!conMarcadores && !aislado) return <g />;
  return (
    <Marcador
      tipo={marcadorDe(serie)}
      indice={serie}
      x={cx}
      y={cy}
      datos={{
        "data-punto": "",
        "data-serie": String(serie),
        "data-indice": String(index),
        "data-valor": modelo.series[serie]?.textos[index] ?? "",
      }}
    />
  );
}

type BarraRecibida = { x?: number; y?: number; width?: number; height?: number; index?: number };

/** Una barra con su trama. Una barra de valor 0 no tiene alto: se marca con una raya fina sobre
 * el eje para que no se confunda con un hueco. Un hueco no pinta nada. */
function Barra({
  x,
  y,
  width,
  height,
  index,
  serie,
  base,
  modelo,
}: BarraRecibida & { serie: number; base: string; modelo: ModeloDeGrafico }) {
  if (
    typeof x !== "number" ||
    typeof y !== "number" ||
    typeof width !== "number" ||
    typeof height !== "number" ||
    typeof index !== "number"
  ) {
    return <g />;
  }
  const valor = modelo.series[serie]?.valores[index];
  if (valor === null || valor === undefined) return <g />;
  const etiqueta = {
    "data-barra": "",
    "data-serie": String(serie),
    "data-indice": String(index),
    "data-valor": modelo.series[serie]?.textos[index] ?? "",
  };
  if (valor === 0 || height < 1) {
    return (
      <rect x={x} y={y - 2} width={width} height={2} fill={COLOR_DE_SERIE[serie]} {...etiqueta} />
    );
  }
  return (
    <rect
      x={x}
      y={y}
      width={width}
      height={height}
      fill={rellenoDeBarra(base, serie)}
      stroke={COLOR_DE_SERIE[serie]}
      strokeWidth={1.5}
      {...etiqueta}
    />
  );
}

export default function DibujoConRecharts({ modelo, tipo, base, ancho, alto }: Propiedades) {
  const filas = filasDe(modelo);
  if (tipo === "barras") {
    return (
      <BarChart
        width={ancho}
        height={alto}
        data={filas}
        margin={MARGEN}
        accessibilityLayer={false}
        role="presentation"
      >
        <Ejes modelo={modelo} paraLineas={false} />
        {modelo.series.map((s) => (
          <Bar
            key={s.indice}
            dataKey={`s${s.indice}`}
            fill={rellenoDeBarra(base, s.indice)}
            isAnimationActive={false}
            shape={(p: BarraRecibida) => (
              <Barra {...p} serie={s.indice} base={base} modelo={modelo} />
            )}
          />
        ))}
      </BarChart>
    );
  }
  const conMarcadores = modelo.categorias.length <= MAXIMO_DE_PUNTOS_CON_MARCADOR;
  return (
    <LineChart
      width={ancho}
      height={alto}
      data={filas}
      margin={MARGEN}
      accessibilityLayer={false}
      role="presentation"
    >
      <Ejes modelo={modelo} paraLineas />
      {modelo.series.map((s) => {
        const estilo = ESTILO_DE_LINEA[trazoDe(s.indice)];
        return (
          <Line
            key={s.indice}
            className={`grafico-serie-${s.indice}`}
            dataKey={`s${s.indice}`}
            type="linear"
            stroke={COLOR_DE_SERIE[s.indice]}
            strokeWidth={estilo.grosor}
            strokeLinecap="round"
            {...(estilo.guiones === undefined ? {} : { strokeDasharray: estilo.guiones })}
            connectNulls={false}
            isAnimationActive={false}
            activeDot={false}
            dot={(p: PuntoRecibido) => (
              <Punto
                key={p.index}
                {...p}
                serie={s.indice}
                modelo={modelo}
                conMarcadores={conMarcadores}
              />
            )}
          />
        );
      })}
    </LineChart>
  );
}
