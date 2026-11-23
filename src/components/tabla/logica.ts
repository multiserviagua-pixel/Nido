// Lógica pura de `Tabla` y `Paginacion` (diseño 020, «Componentes base», fila `Tabla`; REQ-013,
// REQ-048, REQ-059, REQ-066, REQ-067). Sin React ni navegador. Nada del servidor se pinta sin
// pasar por aquí: las celdas se leen con `leerCelda` (texto por `textoPlano`, cifras por los
// formateadores) y las columnas, el orden y la página se leen de listas y rangos cerrados. Lo que
// no encaja cae al valor por defecto o a «Sin datos»; nunca se pinta lo recibido tal cual.
import type { Esquema, EstadoDe } from "../direccion/estado-direccion";
import { formatearFecha } from "../formato/fechas";
import {
  formatearCifra,
  formatearNumero,
  formatearPorcentaje,
  leerCifra,
} from "../formato/numeros";
import { textoPlano } from "../formato/texto-plano";
import { TEXTOS } from "../textos";

/** Tamaño de página por defecto (diseño: 25). */
export const TAMANO_DE_PAGINA = 25;
const TAMANO_MAXIMO = 100;
/** Cota de la página en la dirección: 100.000 páginas. La corrección fina la hace `calcularPaginacion`. */
export const PAGINA_MAXIMA = 100_000;
const TOTAL_MAXIMO = 1e12;

export const SENTIDOS = ["ascendente", "descendente"] as const;
export type Sentido = (typeof SENTIDOS)[number];
export type OrdenDeTabla = { readonly columna: string; readonly sentido: Sentido };

export const TIPOS_DE_COLUMNA = ["texto", "numero", "porcentaje", "fecha", "estado"] as const;
export type TipoDeColumna = (typeof TIPOS_DE_COLUMNA)[number];

export type ColumnaDeTabla = {
  /** Clave de la fila y, si es ordenable, valor de `orden` en la dirección: `[a-z][a-z0-9_]*`. */
  readonly clave: string;
  /** Encabezado. Lo declara la vista; se pinta como dato (sin invisibles ni dirección). */
  readonly etiqueta: string;
  readonly tipo?: TipoDeColumna;
  /** Solo con `true` exacto. */
  readonly ordenable?: boolean;
  /** Para `numero` y `porcentaje`. */
  readonly decimales?: number;
  /** Para `numero`: mínimo admitido (por defecto 0). */
  readonly minimo?: number;
  /** Para `estado`: ámbito del catálogo. */
  readonly ambito?: string;
};

const CLAVE_DE_COLUMNA = /^[a-z][a-z0-9_]*$/;

/** Las columnas utilizables, ya limpias: clave válida y sin repetir, etiqueta sin invisibles (si
 * queda vacía, «Columna»), tipo de la lista, `ordenable` solo con `true`. */
export function columnasValidas(columnas: unknown): ColumnaDeTabla[] {
  if (!Array.isArray(columnas)) return [];
  const vistas = new Set<string>();
  const salida: ColumnaDeTabla[] = [];
  for (const c of columnas as unknown[]) {
    if (typeof c !== "object" || c === null) continue;
    const { clave, etiqueta, tipo, ordenable, decimales, minimo, ambito } = c as Record<
      string,
      unknown
    >;
    if (typeof clave !== "string" || !CLAVE_DE_COLUMNA.test(clave)) continue;
    if (clave in Object.prototype || vistas.has(clave)) continue;
    vistas.add(clave);
    const limpia = textoPlano(etiqueta).trim();
    salida.push({
      clave,
      etiqueta: limpia === "" ? TEXTOS.tabla.columnaSinNombre : limpia,
      tipo: (TIPOS_DE_COLUMNA as readonly unknown[]).includes(tipo)
        ? (tipo as TipoDeColumna)
        : "texto",
      ordenable: ordenable === true,
      ...(typeof decimales === "number" ? { decimales } : {}),
      ...(typeof minimo === "number" ? { minimo } : {}),
      ...(typeof ambito === "string" ? { ambito } : {}),
    });
  }
  return salida;
}

// ------------------------------------------------------------------------------ paginación

function enteroNoNegativo(valor: unknown): number | null {
  return typeof valor === "number" && Number.isSafeInteger(valor) && valor >= 0 ? valor : null;
}

export type Paginado = {
  readonly total: number;
  readonly tamano: number;
  readonly paginas: number;
  /** Página ya corregida al rango. */
  readonly pagina: number;
  readonly desde: number;
  readonly hasta: number;
  /** Sin filas: no hay posición que escribir («Del 0 al 0» no existe). */
  readonly vacia: boolean;
};

/** Posición de una página. Un total que no es un entero entre 0 y un billón se trata como cero
 * (cierra en fallo: no se pinta una posición inventada); una página fuera de rango o que no es un
 * entero se corrige al límite más cercano o a la primera; un tamaño no válido es 25. Si se
 * indican las filas realmente pintadas, el final sale de ellas y nunca pasa del total. */
export function calcularPaginacion(
  total: unknown,
  pagina: unknown,
  tamano: unknown = TAMANO_DE_PAGINA,
  filasPintadas?: number,
): Paginado {
  const t = enteroNoNegativo(total);
  const n = t !== null && t < TOTAL_MAXIMO ? t : 0;
  const tam = enteroNoNegativo(tamano);
  const tp = tam !== null && tam >= 1 && tam <= TAMANO_MAXIMO ? tam : TAMANO_DE_PAGINA;
  if (n === 0) {
    return { total: 0, tamano: tp, paginas: 0, pagina: 1, desde: 0, hasta: 0, vacia: true };
  }
  const paginas = Math.ceil(n / tp);
  const pedida = enteroNoNegativo(pagina) ?? 1;
  const p = Math.min(Math.max(pedida, 1), paginas);
  const desde = (p - 1) * tp + 1;
  const pintadas = enteroNoNegativo(filasPintadas);
  const hasta = Math.min(pintadas === null ? p * tp : desde + Math.max(pintadas, 1) - 1, n);
  return { total: n, tamano: tp, paginas, pagina: p, desde, hasta, vacia: false };
}

/** «Del 26 al 50 de 1.234». */
export function textoDePosicion(p: Paginado): string {
  const T = TEXTOS.tabla;
  return `${T.posicionDel} ${formatearNumero(p.desde)} ${T.posicionAl} ${formatearNumero(p.hasta)} ${T.posicionDe} ${formatearNumero(p.total)}`;
}

/** «Página 3 de 50. Del 51 al 75 de 1.234». */
export function textoDeAnuncioDePagina(p: Paginado): string {
  const T = TEXTOS.tabla;
  return `${T.pagina} ${formatearNumero(p.pagina)} ${T.posicionDe} ${formatearNumero(p.paginas)}. ${textoDePosicion(p)}`;
}

/** Números de página a pintar; `null` es un hueco («…»). Siempre la primera, la última, la actual
 * y sus vecinas; un hueco de una sola página se escribe en vez de resumirlo. */
export function paginasVisibles(pagina: unknown, paginas: unknown): Array<number | null> {
  const total = Math.max(1, enteroNoNegativo(paginas) ?? 1);
  const actual = Math.min(Math.max(enteroNoNegativo(pagina) ?? 1, 1), total);
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const quiero = new Set<number>([1, total, actual - 1, actual, actual + 1]);
  const orden = [...quiero].filter((x) => x >= 1 && x <= total).sort((a, b) => a - b);
  const salida: Array<number | null> = [];
  let previo = 0;
  for (const x of orden) {
    if (previo !== 0 && x - previo === 2) salida.push(previo + 1);
    else if (previo !== 0 && x - previo > 2) salida.push(null);
    salida.push(x);
    previo = x;
  }
  return salida;
}

// ----------------------------------------------------------------------------------- orden

/** El orden si es de una columna ordenable y de un sentido de la lista; si no, `null`. */
export function leerOrden(
  orden: unknown,
  columnas: readonly ColumnaDeTabla[],
): OrdenDeTabla | null {
  if (typeof orden !== "object" || orden === null) return null;
  const { columna, sentido } = orden as Record<string, unknown>;
  if (typeof columna !== "string" || !(SENTIDOS as readonly unknown[]).includes(sentido))
    return null;
  const c = columnas.find((x) => x.clave === columna);
  return c !== undefined && c.ordenable === true
    ? { columna: c.clave, sentido: sentido as Sentido }
    : null;
}

/** Lo que pasa al pulsar el botón de una columna: ascendente la primera vez; la misma columna
 * alterna entre los dos sentidos. */
export function ordenSiguiente(actual: OrdenDeTabla | null, clave: string): OrdenDeTabla {
  if (actual !== null && actual.columna === clave) {
    return {
      columna: clave,
      sentido: actual.sentido === "ascendente" ? "descendente" : "ascendente",
    };
  }
  return { columna: clave, sentido: "ascendente" };
}

export function textoDeAnuncioDeOrden(etiqueta: string, sentido: Sentido): string {
  const T = TEXTOS.tabla;
  return `${T.ordenadoPor} ${textoPlano(etiqueta).trim()}, ${sentido === "ascendente" ? T.ascendente : T.descendente}`;
}

// ------------------------------------------------------------------------------ dirección

/** Esquema de dirección de una tabla (REQ-059): `pagina` entero acotado y, si hay columnas
 * ordenables, `orden` (lista de sus claves) y `sentido` (lista cerrada). Ningún texto libre. */
export function esquemaDeTabla(opciones: {
  columnas: readonly ColumnaDeTabla[];
  ordenPorDefecto?: string;
}): Esquema {
  const ordenables = columnasValidas(opciones.columnas)
    .filter((c) => c.ordenable === true)
    .map((c) => c.clave);
  const base: Esquema = {
    pagina: { tipo: "entero", minimo: 1, maximo: PAGINA_MAXIMA, porDefecto: 1 },
  };
  if (ordenables.length === 0) return base;
  const porDefecto =
    opciones.ordenPorDefecto !== undefined && ordenables.includes(opciones.ordenPorDefecto)
      ? opciones.ordenPorDefecto
      : ordenables[0]!;
  return {
    ...base,
    orden: { tipo: "lista", valores: ordenables, porDefecto },
    sentido: { tipo: "lista", valores: SENTIDOS, porDefecto: "ascendente" },
  };
}

/** El orden que dice un estado ya leído con `esquemaDeTabla`; `null` si no hay. */
export function ordenDeEstado(estado: Partial<EstadoDe<Esquema>>): OrdenDeTabla | null {
  const { orden, sentido } = estado as Record<string, unknown>;
  if (typeof orden !== "string" || !(SENTIDOS as readonly unknown[]).includes(sentido)) return null;
  return { columna: orden, sentido: sentido as Sentido };
}

// ------------------------------------------------------------------------------------ celdas

export type CeldaLeida = {
  /** Qué hay que pintar: un texto ya limpio o una etiqueta de estado. */
  readonly clase: "texto" | "numero" | "estado";
  readonly texto: string;
  /** Verdadero si no había un dato utilizable. */
  readonly ausente: boolean;
};

/** Lee el valor de una celda según el tipo de su columna. Un tipo equivocado o un valor imposible
 * es «Sin datos»; nunca el valor recibido. */
export function leerCelda(columna: ColumnaDeTabla, valor: unknown): CeldaLeida {
  const sin = TEXTOS.formato.sinDatos;
  switch (columna.tipo ?? "texto") {
    case "numero": {
      const c = formatearCifra(valor, { decimales: columna.decimales, minimo: columna.minimo });
      return { clase: "numero", texto: c.texto, ausente: c.ausente };
    }
    case "porcentaje": {
      const n = leerCifra(valor, { minimo: columna.minimo });
      const texto = n === "ausente" ? sin : formatearPorcentaje(n, columna.decimales ?? 1);
      return { clase: "numero", texto, ausente: texto === sin };
    }
    case "fecha": {
      const texto = formatearFecha(valor);
      return { clase: "texto", texto, ausente: texto === sin };
    }
    case "estado":
      return { clase: "estado", texto: "", ausente: false };
    default: {
      const limpio = typeof valor === "string" ? textoPlano(valor).trim() : "";
      return limpio === ""
        ? { clase: "texto", texto: sin, ausente: true }
        : { clase: "texto", texto: limpio, ausente: false };
    }
  }
}

// ------------------------------------------------------------------------------- cambios

export type CambioDeTabla = { readonly pagina: number; readonly orden: OrdenDeTabla | null };

/** Lo que se avisa al pulsar el botón de una columna: la columna tiene que ser ordenable (si no,
 * nada) y la página vuelve a la primera, porque el conjunto de filas de la página cambia. */
export function cambioDeOrden(
  columnas: readonly ColumnaDeTabla[],
  actual: OrdenDeTabla | null,
  clave: string,
): CambioDeTabla | null {
  const c = columnas.find((x) => x.clave === clave);
  if (c === undefined || c.ordenable !== true) return null;
  return { pagina: 1, orden: ordenSiguiente(leerOrden(actual, columnas), clave) };
}

/** Lo que se avisa al pasar de página: solo una página distinta de la actual y dentro del rango. */
export function cambioDePagina(
  paginado: Paginado,
  destino: unknown,
  orden: OrdenDeTabla | null,
): CambioDeTabla | null {
  const d = enteroNoNegativo(destino);
  if (d === null || paginado.vacia || d < 1 || d > paginado.paginas || d === paginado.pagina) {
    return null;
  }
  return { pagina: d, orden };
}
