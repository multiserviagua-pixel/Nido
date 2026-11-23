// Lectura cerrada de los datos de un gráfico (diseño 020, «Gráficos»; REQ-014, REQ-015, REQ-052,
// REQ-054, REQ-071; art. 1 y 7 de la constitución). Funciones puras, sin React ni Recharts.
//
// Lo que llega de la vista es un dato, no una orden: se lee campo a campo (solo claves propias,
// solo lo que el modelo admite), los números por `leerCifra` y `formatearNumero`, las fechas por
// `formatearFecha` y cualquier texto por `textoPlano`. De aquí sale un único `ModeloDeGrafico`,
// y de él salen a la vez el dibujo y la tabla equivalente: los valores coinciden por construcción.
// Un valor imposible es un hueco, nunca un cero; una categoría imposible se descarta con sus
// valores; lo que supera los máximos (series, puntos) cierra en fallo o se recorta como dice cada
// constante. Ningún campo de más llega al modelo.
import { formatearFecha } from "../formato/fechas";
import { formatearNumero, leerCifra } from "../formato/numeros";
import { textoPlano } from "../formato/texto-plano";
import { TEXTOS } from "../textos";

/** Series por gráfico (REQ-014): las que sobran se descartan. */
export const MAXIMO_DE_SERIES = 4;
/** Puntos por gráfico: con más, el gráfico entero se trata como «Sin datos» (cierre en fallo). */
export const MAXIMO_DE_PUNTOS = 1000;
const LARGO_MAXIMO_DE_TEXTO = 200;
const DECIMALES_MAXIMOS = 6;
const LIMITE_DE_VALOR = 1e15;

export type TipoDeGrafico = "lineas" | "barras";
export type TipoDeEjeX = "fecha" | "texto";
export type EstadoDeGrafico = "datos" | "vacio" | "insuficiente";

export type SerieLeida = {
  /** Posición entre las series leídas (0 a 3): de ella salen el papel de color, el trazo y la trama. */
  readonly indice: number;
  readonly nombre: string;
  /** Un valor por categoría; `null` es un hueco. */
  readonly valores: readonly (number | null)[];
  /** Lo que se escribe en la tabla, por categoría: el valor con miles o «Sin datos». */
  readonly textos: readonly string[];
};

export type ModeloDeGrafico = {
  readonly estado: EstadoDeGrafico;
  readonly titulo: string;
  readonly ejeX: { readonly nombre: string; readonly tipo: TipoDeEjeX };
  readonly ejeY: { readonly nombre: string; readonly unidad: string; readonly decimales: number };
  readonly categorias: readonly { readonly texto: string }[];
  readonly series: readonly SerieLeida[];
  /** Categorías con al menos un valor: lo que se compara con `minimoPuntos`. */
  readonly puntos: number;
  readonly minimo: number | null;
  readonly maximo: number | null;
};

const esObjeto = (x: unknown): x is Record<string, unknown> =>
  typeof x === "object" && x !== null && !Array.isArray(x);

/** El valor de una clave propia; lo heredado (`__proto__`, `constructor`…) no cuenta. */
function propia(objeto: unknown, clave: string): unknown {
  return esObjeto(objeto) && Object.hasOwn(objeto, clave) ? objeto[clave] : undefined;
}

function recortarPorCaracteres(texto: string, maximo: number): string {
  const caracteres = [...texto];
  return caracteres.length <= maximo ? texto : caracteres.slice(0, maximo).join("");
}

/** Texto de la vista limpio de invisibles y de dirección; vacío si no es una cadena. */
function limpiar(valor: unknown): string {
  return typeof valor === "string"
    ? recortarPorCaracteres(textoPlano(valor).trim(), LARGO_MAXIMO_DE_TEXTO)
    : "";
}

function leerDecimales(valor: unknown): number {
  if (typeof valor !== "number" || !Number.isFinite(valor)) return 0;
  return Math.min(DECIMALES_MAXIMOS, Math.max(0, Math.trunc(valor)));
}

function leerMinimoDeValor(valor: unknown): number {
  return typeof valor === "number" && Number.isFinite(valor) && Math.abs(valor) < LIMITE_DE_VALOR
    ? valor
    : 0;
}

function leerMinimoDePuntos(valor: unknown): number {
  return typeof valor === "number" && Number.isInteger(valor) && valor >= 1
    ? Math.min(valor, MAXIMO_DE_PUNTOS)
    : 1;
}

function leerTipoDeEje(valor: unknown): TipoDeEjeX {
  return valor === "fecha" ? "fecha" : "texto";
}

/** Un valor utilizable o `null` (hueco). Lo que `formatearNumero` no sabe pintar tampoco es un valor. */
function leerValor(valor: unknown, minimo: number): number | null {
  const leido = leerCifra(valor, { minimo });
  if (leido === "ausente") return null;
  return formatearNumero(leido, 0) === TEXTOS.formato.sinDatos ? null : leido;
}

function leerCategoria(valor: unknown, tipo: TipoDeEjeX): string | null {
  if (tipo === "fecha") {
    const texto = formatearFecha(valor);
    return texto === TEXTOS.formato.sinDatos ? null : texto;
  }
  const texto = limpiar(valor);
  return texto === "" ? null : texto;
}

function vacio(titulo: string, ejes: Pick<ModeloDeGrafico, "ejeX" | "ejeY">, puntos = 0) {
  return {
    estado: puntos === 0 ? ("vacio" as const) : ("insuficiente" as const),
    titulo,
    ...ejes,
    categorias: [],
    series: [],
    puntos,
    minimo: null,
    maximo: null,
  };
}

/**
 * Lee las propiedades de un gráfico. No lanza con ninguna entrada. El estado es `datos` si hay al
 * menos `minimoPuntos` categorías con valor; `insuficiente` si hay alguna pero menos (REQ-054);
 * `vacio` si no hay ninguna (REQ-052). Con las barras el eje empieza en cero: un negativo es un
 * hueco aunque la vista declare un mínimo menor.
 */
export function leerGrafico(entrada: unknown, tipo: TipoDeGrafico): ModeloDeGrafico {
  const titulo = limpiar(propia(entrada, "titulo")) || TEXTOS.graficos.sinTitulo;
  const ejeXEntrada = propia(entrada, "ejeX");
  const ejeYEntrada = propia(entrada, "ejeY");
  const tipoDeEjeX = leerTipoDeEje(propia(ejeXEntrada, "tipo"));
  const decimales = leerDecimales(propia(ejeYEntrada, "decimales"));
  const ejes = {
    ejeX: {
      nombre: limpiar(propia(ejeXEntrada, "nombre")) || TEXTOS.graficos.ejeHorizontalSinNombre,
      tipo: tipoDeEjeX,
    },
    ejeY: {
      nombre: limpiar(propia(ejeYEntrada, "nombre")) || TEXTOS.graficos.ejeVerticalSinNombre,
      unidad: limpiar(propia(ejeYEntrada, "unidad")) || TEXTOS.graficos.unidadSinNombre,
      decimales,
    },
  };

  const categoriasBrutas = propia(entrada, "categorias");
  const seriesBrutas = propia(entrada, "series");
  if (
    !Array.isArray(categoriasBrutas) ||
    !Array.isArray(seriesBrutas) ||
    categoriasBrutas.length > MAXIMO_DE_PUNTOS
  ) {
    return vacio(titulo, ejes);
  }

  const minimo = tipo === "barras" ? 0 : leerMinimoDeValor(propia(ejeYEntrada, "minimo"));
  const minimoDePuntos = leerMinimoDePuntos(propia(entrada, "minimoPuntos"));

  // Posiciones de las categorías válidas, y su texto.
  const posiciones: number[] = [];
  const categorias: { texto: string }[] = [];
  categoriasBrutas.forEach((c: unknown, i: number) => {
    const texto = leerCategoria(c, tipoDeEjeX);
    if (texto !== null) {
      posiciones.push(i);
      categorias.push({ texto });
    }
  });

  const series: SerieLeida[] = [];
  for (const bruta of seriesBrutas as unknown[]) {
    if (series.length >= MAXIMO_DE_SERIES) break;
    if (!esObjeto(bruta)) continue;
    const indice = series.length;
    const valoresBrutos = propia(bruta, "valores");
    const lista: readonly unknown[] = Array.isArray(valoresBrutos) ? valoresBrutos : [];
    const valores = posiciones.map((p) => leerValor(lista[p], minimo));
    series.push({
      indice,
      nombre: limpiar(propia(bruta, "nombre")) || `${TEXTOS.graficos.serie} ${indice + 1}`,
      valores,
      textos: valores.map((v) =>
        v === null ? TEXTOS.formato.sinDatos : formatearNumero(v, decimales),
      ),
    });
  }

  let puntos = 0;
  let menor: number | null = null;
  let mayor: number | null = null;
  categorias.forEach((_, i) => {
    let hay = false;
    for (const s of series) {
      const v = s.valores[i];
      if (v === null || v === undefined) continue;
      hay = true;
      if (menor === null || v < menor) menor = v;
      if (mayor === null || v > mayor) mayor = v;
    }
    if (hay) puntos += 1;
  });

  if (puntos === 0) return vacio(titulo, ejes);
  if (puntos < minimoDePuntos) return vacio(titulo, ejes, puntos);
  return {
    estado: "datos",
    titulo,
    ...ejes,
    categorias,
    series,
    puntos,
    minimo: menor,
    maximo: mayor,
  };
}

const plural = (n: number, uno: string, varios: string): string =>
  `${formatearNumero(n, 0)} ${n === 1 ? uno : varios}`;

/** Lo que dice el lector de pantalla del dibujo: tipo, tamaño, rango y dónde están los valores. */
export function descripcionDeGrafico(modelo: ModeloDeGrafico, tipo: TipoDeGrafico): string {
  const d = TEXTOS.graficos.descripcion;
  const nombreDelTipo = tipo === "lineas" ? TEXTOS.graficos.tipoLineas : TEXTOS.graficos.tipoBarras;
  const partes = [
    `${nombreDelTipo} ${d.con} ${plural(modelo.series.length, d.serie, d.series)} ${d.y} ${plural(
      modelo.puntos,
      d.punto,
      d.puntos,
    )}`,
  ];
  const primera = modelo.categorias[0]?.texto;
  const ultima = modelo.categorias[modelo.categorias.length - 1]?.texto;
  if (modelo.categorias.length > 1 && primera !== undefined && ultima !== undefined) {
    partes[0] += `, ${d.de} ${primera} ${d.a} ${ultima}`;
  }
  let texto = `${partes[0]}.`;
  if (modelo.minimo !== null && modelo.maximo !== null) {
    const dec = modelo.ejeY.decimales;
    texto += ` ${d.minimo} ${formatearNumero(modelo.minimo, dec)} ${d.y} ${d.maximo} ${formatearNumero(
      modelo.maximo,
      dec,
    )} (${modelo.ejeY.unidad}).`;
  }
  return `${texto} ${d.remite}`;
}

const PUNTOS_SUSPENSIVOS = "…";

/** Texto corto para la marca de un eje: el completo está siempre en la tabla equivalente. Cuenta
 * caracteres, no unidades de código, para no partir un par sustituto. */
export function abreviarParaEje(texto: string, maximo: number): string {
  const caracteres = [...texto];
  if (caracteres.length <= maximo) return texto;
  return `${caracteres.slice(0, Math.max(1, maximo - 1)).join("")}${PUNTOS_SUSPENSIVOS}`;
}
