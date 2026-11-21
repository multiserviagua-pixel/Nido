// Apoyo de PRUEBA-005 y PRUEBA-006 (020 T-007 (f) y (g)): lee `valores.css` y las tablas de
// `docs/DISENO.md` sin dependencias, y comprueba las reglas de «sin valores sueltos» sobre un
// conjunto de archivos que se le pasa (así las pruebas pueden sembrar fallos y ver que se detectan).
import { formatoEs, medir } from "./contraste";
import type { Hallazgo } from "./fronteras";

// ---------------------------------------------------------------- CSS

export type BloqueCss = {
  cabecera: string;
  declaraciones: Map<string, string>;
  hijos: BloqueCss[];
};

const normalizar = (s: string): string => s.replace(/\s+/g, " ").trim();

/** Analizador mínimo: bloques anidados y declaraciones `--nombre: valor;`. Basta para `valores.css`,
 * que no lleva cadenas con `;` ni `{`. Las declaraciones que no son variables se ignoran. */
export function analizarCss(texto: string): BloqueCss {
  const sinComentarios = texto
    .replace(/\/\*[\s\S]*?\*\//g, "")
    // Prettier escribe los hexadecimales en minúsculas; el documento y la prueba usan mayúsculas.
    .replace(/#[0-9a-fA-F]{6}\b/g, (h) => h.toUpperCase());
  const raiz: BloqueCss = { cabecera: "", declaraciones: new Map(), hijos: [] };
  const pila: BloqueCss[] = [raiz];
  let acumulado = "";
  const cerrarSentencia = (): void => {
    const s = normalizar(acumulado).replace(/\(\s+/g, "(").replace(/\s+\)/g, ")");
    acumulado = "";
    if (!s.startsWith("--")) return;
    const i = s.indexOf(":");
    if (i < 0) return;
    pila[pila.length - 1]!.declaraciones.set(s.slice(0, i).trim(), s.slice(i + 1).trim());
  };
  for (const c of sinComentarios) {
    if (c === "{") {
      const bloque: BloqueCss = {
        cabecera: normalizar(acumulado),
        declaraciones: new Map(),
        hijos: [],
      };
      acumulado = "";
      pila[pila.length - 1]!.hijos.push(bloque);
      pila.push(bloque);
    } else if (c === "}") {
      cerrarSentencia();
      if (pila.length > 1) pila.pop();
    } else if (c === ";") {
      cerrarSentencia();
    } else {
      acumulado += c;
    }
  }
  return raiz;
}

export type Valores = {
  escala: Map<string, string>;
  claro: Map<string, string>;
  oscuro: Map<string, string>;
  forzados: Map<string, string>;
  movimientoReducido: Map<string, string>;
  /** Bloques `@theme` (se unen todos). */
  tema: Map<string, string>;
  /** Cabeceras de los bloques `@theme`, para comprobar `inline`. */
  cabecerasDeTema: string[];
  /** Consultas `@media` de primer nivel, en el orden del archivo (sin el `@media (` ni el `)`). */
  ordenDeMedias: string[];
  /** Nombres de las `@utility`. */
  utilidades: string[];
  importaciones: string[];
};

function variablesDeRaiz(bloque: BloqueCss | undefined): Map<string, string> {
  const salida = new Map<string, string>();
  if (!bloque) return salida;
  for (const h of bloque.hijos) {
    if (h.cabecera === ":root") for (const [k, v] of h.declaraciones) salida.set(k, v);
  }
  return salida;
}

export function leerValores(css: string): Valores {
  const raiz = analizarCss(css);
  const media = (consulta: string): BloqueCss | undefined =>
    raiz.hijos.find((h) => h.cabecera === `@media (${consulta})`);
  const todas = variablesDeRaiz(raiz);
  const escala = new Map([...todas].filter(([k]) => k.startsWith("--escala-")));
  const claro = new Map([...todas].filter(([k]) => !k.startsWith("--escala-")));
  const tema = new Map<string, string>();
  for (const h of raiz.hijos) {
    if (h.cabecera.startsWith("@theme")) for (const [k, v] of h.declaraciones) tema.set(k, v);
  }
  return {
    escala,
    claro,
    oscuro: variablesDeRaiz(media("prefers-color-scheme: dark")),
    forzados: variablesDeRaiz(media("forced-colors: active")),
    movimientoReducido: variablesDeRaiz(media("prefers-reduced-motion: reduce")),
    tema,
    ordenDeMedias: raiz.hijos
      .filter((h) => h.cabecera.startsWith("@media ("))
      .map((h) => h.cabecera.slice("@media (".length, -1)),
    cabecerasDeTema: raiz.hijos
      .filter((h) => h.cabecera.startsWith("@theme"))
      .map((h) => h.cabecera),
    utilidades: raiz.hijos
      .filter((h) => h.cabecera.startsWith("@utility "))
      .map((h) => h.cabecera.slice("@utility ".length)),
    importaciones: [...css.matchAll(/@import\s+[^;]+;/g)].map((m) => m[0]),
  };
}

/** Sustituye cada `var(--escala-x)` por el valor de la escala, hasta que no queden. */
export function resolver(valor: string, escala: Map<string, string>): string {
  let actual = valor;
  for (let i = 0; i < 8 && /var\(--escala-/.test(actual); i++) {
    actual = actual.replace(/var\((--escala-[a-z0-9-]+)\)/g, (_m, nombre: string) => {
      const v = escala.get(nombre);
      return v === undefined ? `<<${nombre} no existe>>` : v;
    });
  }
  return actual;
}

export type Tema = "claro" | "oscuro";

/** Papeles de un tema ya resueltos a su valor de la escala. El oscuro parte del claro. */
export function papelesDeTema(v: Valores, tema: Tema): Map<string, string> {
  const base = tema === "claro" ? v.claro : new Map([...v.claro, ...v.oscuro]);
  return new Map([...base].map(([k, x]) => [k, resolver(x, v.escala)]));
}

export function papelesForzados(v: Valores): Map<string, string> {
  return new Map([...v.claro, ...v.forzados].map(([k, x]) => [k, x]));
}

// ---------------------------------------------------------------- color

export const HEX = /^#[0-9A-F]{6}$/;
export const PALABRAS_DEL_SISTEMA = new Set([
  "Canvas",
  "CanvasText",
  "ButtonText",
  "ButtonFace",
  "Highlight",
  "HighlightText",
  "LinkText",
  "GrayText",
]);

export function hexARgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function rgbAHex([r, g, b]: [number, number, number]): string {
  return `#${[r, g, b].map((x) => Math.round(x).toString(16).padStart(2, "0")).join("")}`.toUpperCase();
}

/** Los colores hexadecimales de un degradado `linear-gradient(...)` ya resuelto, en orden. */
export function coloresDeDegradado(valor: string): string[] {
  if (!/^linear-gradient\(/.test(valor)) return [];
  return [...valor.matchAll(/#[0-9A-Fa-f]{6}\b/g)].map((m) => m[0].toUpperCase());
}

// ---------------------------------------------------------------- docs/DISENO.md

export type Fila = string[];

/** Filas de datos de todas las tablas de la sección `### <titulo>`, hasta la siguiente `##`. */
export function tablasDeSeccion(md: string, titulo: string): Fila[][] {
  const lineas = md.split("\n");
  const inicio = lineas.findIndex((l) => l.trim() === `### ${titulo}`);
  if (inicio < 0) return [];
  const tablas: Fila[][] = [];
  let actual: Fila[] | null = null;
  for (let i = inicio + 1; i < lineas.length; i++) {
    const l = lineas[i]!.trim();
    if (/^#{2,3} /.test(l)) break;
    if (l.startsWith("|")) {
      const celdas = l
        .slice(1, l.endsWith("|") ? -1 : undefined)
        .split("|")
        .map((c) => c.trim());
      if (celdas.every((c) => /^-+$/.test(c))) continue;
      if (actual === null) {
        actual = [];
        tablas.push(actual);
        continue; // la primera fila es el encabezado
      }
      actual.push(celdas);
    } else {
      actual = null;
    }
  }
  return tablas;
}

export const sinCodigo = (s: string): string => s.replace(/`/g, "").trim();
const medida = (s: string): string => {
  const t = sinCodigo(s).replace(/\s+/g, "");
  return t === "0" ? "0px" : t;
};

export type DiferenciaDoc = { tabla: string; detalle: string };

function comparar(
  tabla: string,
  doc: Map<string, string>,
  css: Map<string, string>,
  salida: DiferenciaDoc[],
): void {
  for (const [k, v] of doc) {
    if (!css.has(k)) salida.push({ tabla, detalle: `${k} está en la tabla y no en valores.css` });
    else if (css.get(k) !== v) {
      salida.push({ tabla, detalle: `${k}: tabla «${v}», valores.css «${css.get(k)}»` });
    }
  }
  for (const k of css.keys()) {
    if (!doc.has(k)) salida.push({ tabla, detalle: `${k} está en valores.css y no en la tabla` });
  }
}

const delPrefijo = (m: Map<string, string>, prefijo: string): Map<string, string> =>
  new Map([...m].filter(([k]) => k.startsWith(prefijo)));

const PAPELES_NO_COLOR =
  /^--(degradado-|sombra-|duracion-|foco-grosor$|foco-separacion$|objetivo-minimo$)/;

/** Compara `valores.css` con las tablas de `docs/DISENO.md`, en los dos sentidos. */
export function compararConDocumento(v: Valores, md: string): DiferenciaDoc[] {
  const dif: DiferenciaDoc[] = [];
  const escala = v.escala;
  const claro = papelesDeTema(v, "claro");
  const oscuro = papelesDeTema(v, "oscuro");
  const forzados = papelesForzados(v);

  // Escala de color
  const docColores = new Map<string, string>();
  for (const f of tablasDeSeccion(md, "Escala de color")[0] ?? []) {
    docColores.set(`--escala-${sinCodigo(f[0]!)}-${sinCodigo(f[1]!)}`, sinCodigo(f[2]!));
  }
  const cssColores = new Map([...escala].filter(([, x]) => HEX.test(x)));
  comparar("Escala de color", docColores, cssColores, dif);

  // Papeles de color
  const filasPapeles = tablasDeSeccion(md, "Papeles de color")[0] ?? [];
  const docClaro = new Map<string, string>();
  const docOscuro = new Map<string, string>();
  const docForzado = new Map<string, string>();
  for (const f of filasPapeles) {
    const n = sinCodigo(f[0]!);
    docClaro.set(n, sinCodigo(f[3]!));
    docOscuro.set(n, sinCodigo(f[4]!));
    docForzado.set(n, sinCodigo(f[5]!));
  }
  const soloColor = (m: Map<string, string>): Map<string, string> =>
    new Map([...m].filter(([k]) => !PAPELES_NO_COLOR.test(k)));
  comparar("Papeles (claro)", docClaro, soloColor(claro), dif);
  comparar("Papeles (oscuro)", docOscuro, soloColor(oscuro), dif);
  comparar("Papeles (colores forzados)", docForzado, soloColor(forzados), dif);

  // Degradados
  const filasDegradados = tablasDeSeccion(md, "Degradados")[0] ?? [];
  const lista = (s: string): string =>
    sinCodigo(s) === "none" ? "none" : sinCodigo(s).replace(/\s*→\s*/g, ",");
  const docDegClaro = new Map<string, string>();
  const docDegOscuro = new Map<string, string>();
  const docDegForzado = new Map<string, string>();
  for (const f of filasDegradados) {
    const n = sinCodigo(f[0]!);
    docDegClaro.set(n, lista(f[2]!));
    docDegOscuro.set(n, lista(f[3]!));
    docDegForzado.set(n, lista(f[4]!));
  }
  const deg = (m: Map<string, string>): Map<string, string> =>
    new Map(
      [...m]
        .filter(([k]) => k.startsWith("--degradado-"))
        .map(([k, x]) => [k, x === "none" ? "none" : coloresDeDegradado(x).join(",")]),
    );
  comparar("Degradados (claro)", docDegClaro, deg(claro), dif);
  comparar("Degradados (oscuro)", docDegOscuro, deg(oscuro), dif);
  comparar("Degradados (colores forzados)", docDegForzado, deg(forzados), dif);

  // Sombras
  const docSombras = new Map<string, string>();
  for (const f of tablasDeSeccion(md, "Sombras")[0] ?? []) {
    docSombras.set(`--escala-sombra-${sinCodigo(f[0]!)}-claro`, sinCodigo(f[1]!));
    docSombras.set(`--escala-sombra-${sinCodigo(f[0]!)}-oscuro`, sinCodigo(f[2]!));
  }
  comparar("Sombras", docSombras, delPrefijo(escala, "--escala-sombra-"), dif);

  // Espaciado, radios, tamaños, duraciones
  const simple = (titulo: string, prefijo: string, columna: number): void => {
    const doc = new Map<string, string>();
    for (const f of tablasDeSeccion(md, titulo)[0] ?? []) {
      doc.set(`${prefijo}${sinCodigo(f[0]!)}`, medida(f[columna]!));
    }
    comparar(titulo, doc, delPrefijo(escala, prefijo), dif);
  };
  simple("Espaciado", "--escala-espaciado-", 1);
  simple("Radios", "--escala-radio-", 1);
  simple("Tamaños", "--escala-tamano-", 1);
  simple("Duraciones", "--escala-duracion-", 1);

  // Texto: tamaños y alturas, y pesos
  const docTexto = new Map<string, string>();
  for (const f of tablasDeSeccion(md, "Texto")[0] ?? []) {
    docTexto.set(`--escala-texto-${sinCodigo(f[0]!)}`, medida(f[1]!));
    docTexto.set(`--escala-texto-${sinCodigo(f[0]!)}-altura`, medida(f[2]!));
  }
  comparar("Texto", docTexto, delPrefijo(escala, "--escala-texto-"), dif);
  const docPesos = new Map<string, string>();
  const lineaPesos = md.split("\n").find((l) => l.startsWith("Pesos:")) ?? "";
  for (const m of lineaPesos.matchAll(/`([a-z]+)`\s+(\d+)/g))
    docPesos.set(`--escala-peso-${m[1]}`, m[2]!);
  comparar("Pesos", docPesos, delPrefijo(escala, "--escala-peso-"), dif);

  // Puntos de ruptura
  const docRuptura = new Map<string, string>();
  for (const f of tablasDeSeccion(md, "Puntos de ruptura")[0] ?? []) {
    docRuptura.set(`--breakpoint-${sinCodigo(f[0]!)}`, medida(f[1]!));
  }
  const cssRuptura = new Map([...v.tema].filter(([k]) => k.startsWith("--breakpoint-")));
  comparar("Puntos de ruptura", docRuptura, cssRuptura, dif);

  // Pila de fuente
  const lineaFuente = md.split("\n").find((l) => l.startsWith("Pila de fuente:")) ?? "";
  const pila = /`([^`]+)`/.exec(lineaFuente)?.[1];
  comparar(
    "Fuente",
    new Map(pila === undefined ? [] : [["--font-sans", pila]]),
    new Map([...v.tema].filter(([k]) => k === "--font-sans")),
    dif,
  );

  return dif;
}

/** Cifras (claro y oscuro) de la tabla de combinaciones prohibidas de `docs/DISENO.md`, comparadas
 * con el cálculo sobre `valores.css`. Cada fila lleva delante, detrás (por defecto `--superficie`,
 * para «cualquier fondo») y las dos cifras al principio de sus celdas. */
export function cifrasDeProhibidasDelDocumento(md: string, v: Valores): DiferenciaDoc[] {
  const dif: DiferenciaDoc[] = [];
  const papel = (celda: string): string | undefined => /`(--[a-z0-9-]+)`/.exec(celda)?.[1];
  const filas = tablasDeSeccion(md, "Contraste calculado")[1] ?? [];
  for (const f of filas) {
    const delante = papel(f[0]!);
    const detras = papel(f[1]!) ?? "--superficie";
    const nombre = `${delante} sobre ${detras}`;
    (["claro", "oscuro"] as const).forEach((tema, i) => {
      const papeles = papelesDeTema(v, tema);
      const a = delante === undefined ? undefined : papeles.get(delante);
      const b = papeles.get(detras);
      const cifra = /^\d+,\d{2}/.exec(f[2 + i]!)?.[0];
      if (a === undefined || b === undefined) {
        dif.push({ tabla: "Prohibidas", detalle: `${nombre} (${tema}): papel que no existe` });
        return;
      }
      const calculado = formatoEs(medir(a, b).razon);
      if (cifra !== calculado) {
        dif.push({
          tabla: "Prohibidas",
          detalle: `${nombre} (${tema}): tabla «${f[2 + i]}», calculado ${calculado}`,
        });
      }
    });
  }
  return dif;
}

// ---------------------------------------------------------------- reglas de la escala

/** Reglas sobre `valores.css` mismo: formato de la escala, papeles que solo usan la escala,
 * capas y tema de Tailwind. */
export function comprobarValores(v: Valores): Hallazgo[] {
  const salida: Hallazgo[] = [];
  const anotar = (regla: string, detalle: string): void => {
    salida.push({ regla, archivo: "src/components/estilos/valores.css", detalle });
  };

  // Escala: color en #RRGGBB mayúsculas; sombras con un rgb que sea de la escala.
  const coloresDeEscala = new Set([...v.escala.values()].filter((x) => HEX.test(x)));
  for (const [k, x] of v.escala) {
    if (/^--escala-(neutro|noche|acento|correcto|aviso|error)-/.test(k) && !HEX.test(x)) {
      anotar("escala-color", `${k} no es #RRGGBB opaco en mayúsculas: ${x}`);
    }
    if (k.startsWith("--escala-sombra-")) {
      const m = /rgb\((\d+) (\d+) (\d+) \/ ([\d.]+)\)/.exec(x);
      if (!m || !coloresDeEscala.has(rgbAHex([Number(m[1]), Number(m[2]), Number(m[3])]))) {
        anotar("escala-sombra", `${k}: el color de la sombra no es un valor de la escala: ${x}`);
      }
    }
    if (k.startsWith("--escala-degradado-")) {
      if (!/^linear-gradient\(to bottom(, var\(--escala-[a-z0-9-]+\)){2}\)$/.test(x)) {
        anotar("escala-degradado", `${k}: se esperan dos colores de la escala: ${x}`);
      }
    }
  }

  // Papeles: solo valores de la escala, palabras del sistema o `none`; `0ms` solo con movimiento reducido.
  const grupos: Array<[string, Map<string, string>]> = [
    ["claro", v.claro],
    ["oscuro", v.oscuro],
    ["colores forzados", v.forzados],
    ["movimiento reducido", v.movimientoReducido],
  ];
  for (const [nombre, papeles] of grupos) {
    for (const [k, x] of papeles) {
      if (k.startsWith("--escala-")) continue;
      const referencia = /^var\((--escala-[a-z0-9-]+)\)$/.exec(x);
      if (referencia) {
        if (!v.escala.has(referencia[1]!))
          anotar("papel", `${nombre}: ${k} usa ${referencia[1]}, que no existe`);
      } else if (!(
        PALABRAS_DEL_SISTEMA.has(x) ||
        x === "none" ||
        (x === "0ms" && nombre === "movimiento reducido")
      )) {
        anotar("papel", `${nombre}: ${k} no usa un valor de la escala: ${x}`);
      }
    }
  }
  for (const k of v.forzados.keys()) {
    if (!v.claro.has(k)) anotar("papel", `colores forzados: ${k} no existe en el tema claro`);
  }
  for (const k of v.oscuro.keys()) {
    if (!v.claro.has(k)) anotar("papel", `oscuro: ${k} no existe en el tema claro`);
  }
  for (const [k, x] of v.forzados) {
    if (k.startsWith("--degradado-") || k.startsWith("--sombra-")) {
      if (x !== "none") anotar("forzados", `${k} debe valer none con colores forzados: ${x}`);
    } else if (!PALABRAS_DEL_SISTEMA.has(x)) {
      anotar("forzados", `${k} debe ser una palabra del sistema: ${x}`);
    }
  }
  // Cada papel de color del tema claro también está en colores forzados.
  for (const k of v.claro.keys()) {
    if (!PAPELES_NO_COLOR.test(k) || k.startsWith("--degradado-") || k.startsWith("--sombra-")) {
      if (!v.forzados.has(k)) anotar("forzados", `${k} no tiene valor en colores forzados`);
    }
  }

  // Orden: los colores forzados van después del tema oscuro, para que ganen cuando coinciden.
  const iOscuro = v.ordenDeMedias.indexOf("prefers-color-scheme: dark");
  const iForzado = v.ordenDeMedias.indexOf("forced-colors: active");
  if (iOscuro < 0 || iForzado < 0 || iForzado < iOscuro) {
    anotar("orden", "el bloque de colores forzados debe ir después del del tema oscuro");
  }

  // Capa 3: tema de Tailwind sin el de serie, una utilidad por papel de color.
  if (v.tema.get("--*") !== "initial")
    anotar("tema", "falta `--*: initial` en @theme (tema por defecto de Tailwind)");
  if (!v.importaciones.some((i) => /@import\s+"tailwindcss"/.test(i)))
    anotar("tema", 'falta @import "tailwindcss"');
  if (v.tema.get("--default-font-family") !== "var(--font-sans)")
    anotar(
      "tema",
      "falta `--default-font-family: var(--font-sans)` en @theme (el preflight la lee)",
    );
  const colores = [...v.claro.keys()].filter((k) => !PAPELES_NO_COLOR.test(k));
  for (const papel of colores) {
    const utilidad = `--color-${papel.slice(2)}`;
    if (v.tema.get(utilidad) !== `var(${papel})`)
      anotar("utilidades", `${utilidad} debe valer var(${papel})`);
  }
  for (const [k, x] of v.tema) {
    if (k.startsWith("--color-") && !colores.includes(`--${k.slice("--color-".length)}`)) {
      anotar("utilidades", `${k} no corresponde a ningún papel de color`);
    }
    if (k.startsWith("--color-") && !/^var\(--[a-z0-9-]+\)$/.test(x)) {
      anotar("utilidades", `${k} debe ser una referencia a un papel: ${x}`);
    }
  }
  for (const papel of [...v.claro.keys()].filter((k) => k.startsWith("--degradado-"))) {
    if (!v.utilidades.includes(`bg-${papel.slice(2)}`))
      anotar("utilidades", `falta @utility bg-${papel.slice(2)}`);
  }
  for (const cabecera of v.cabecerasDeTema) {
    if (cabecera !== "@theme inline" && cabecera !== "@theme")
      anotar("tema", `bloque desconocido: ${cabecera}`);
  }
  return salida;
}

// ---------------------------------------------------------------- fuentes de src/

export type Fuentes = Record<string, string>;

const EXENTOS_DE_COLOR = new Set(["src/components/estilos/valores.css", "src/app/icon.svg"]);

const FUNCIONES_DE_COLOR = /\b(rgba?|hsla?|hwb|lab|lch|oklab|oklch|color|color-mix)\(/;
const HEXADECIMAL =
  /(?<![\w&])#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{4}|[0-9a-fA-F]{3})\b(?![\w-])/;
const NOMBRES_DE_COLOR =
  "aliceblue|antiquewhite|aqua|aquamarine|azure|beige|bisque|black|blanchedalmond|blue|blueviolet|brown|burlywood|cadetblue|chartreuse|chocolate|coral|cornflowerblue|cornsilk|crimson|cyan|darkblue|darkcyan|darkgoldenrod|darkgray|darkgreen|darkgrey|darkkhaki|darkmagenta|darkolivegreen|darkorange|darkorchid|darkred|darksalmon|darkseagreen|darkslateblue|darkslategray|darkslategrey|darkturquoise|darkviolet|deeppink|deepskyblue|dimgray|dimgrey|dodgerblue|firebrick|floralwhite|forestgreen|fuchsia|gainsboro|ghostwhite|gold|goldenrod|gray|green|greenyellow|grey|honeydew|hotpink|indianred|indigo|ivory|khaki|lavender|lavenderblush|lawngreen|lemonchiffon|lightblue|lightcoral|lightcyan|lightgoldenrodyellow|lightgray|lightgreen|lightgrey|lightpink|lightsalmon|lightseagreen|lightskyblue|lightslategray|lightslategrey|lightsteelblue|lightyellow|lime|limegreen|linen|magenta|maroon|mediumaquamarine|mediumblue|mediumorchid|mediumpurple|mediumseagreen|mediumslateblue|mediumspringgreen|mediumturquoise|mediumvioletred|midnightblue|mintcream|mistyrose|moccasin|navajowhite|navy|oldlace|olive|olivedrab|orange|orangered|orchid|palegoldenrod|palegreen|paleturquoise|palevioletred|papayawhip|peachpuff|peru|pink|plum|powderblue|purple|rebeccapurple|red|rosybrown|royalblue|saddlebrown|salmon|sandybrown|seagreen|seashell|sienna|silver|skyblue|slateblue|slategray|slategrey|snow|springgreen|steelblue|tan|teal|thistle|tomato|turquoise|violet|wheat|white|whitesmoke|yellow|yellowgreen";
// Nombre de color como valor de una propiedad de color (CSS, objeto de estilo o atributo SVG).
const PROPIEDAD_CON_NOMBRE = new RegExp(
  `\\b(?:color|background(?:-color)?|border(?:-[a-z]+)?-color|border|outline(?:-color)?|fill|stroke|stop-color|flood-color|caret-color|accent-color|text-decoration-color|backgroundColor|borderColor|stopColor|outlineColor)["']?\\s*[:=]\\s*\\{?["']?(?:${NOMBRES_DE_COLOR})\\b`,
  "i",
);
// Clases de color de Tailwind con nombre de la paleta por defecto: no existen con el tema vacío.
const CLASE_DE_COLOR = new RegExp(
  `(?<![\\w-])(?:bg|text|border|ring|fill|stroke|from|to|via|outline|divide|shadow|accent|caret|decoration)-(?:${NOMBRES_DE_COLOR}|slate|zinc|stone|neutral|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose|white|black)(?:-\\d{2,3})?(?![\\w-])`,
);
// Valor arbitrario entre corchetes: `w-[10px]`, `bg-[#fff]`, `[&>p]:mt-2`, `[--x:1]`.
const VALOR_ARBITRARIO = /(?<![\w\]])(?:[a-z]+(?:-[a-z0-9.]+)*-\[[^\]\s]+\]|\[[^\]\s]+\]:[a-z!-])/;
// Pasos de `--spacing-*` de valores.css. `auto` y `full` no son pasos y la expresión no los captura;
// `px` no existe en la escala y la expresión sí lo captura, para que falle.
const PASOS_DE_ESPACIADO = new Set(["0", "1", "2", "3", "4", "5", "6", "8", "10", "12", "16"]);
const UTILIDAD_DE_ESPACIADO =
  /(?<![\w-])-?(?:p|px|py|pt|pr|pb|pl|ps|pe|m|mx|my|mt|mr|mb|ml|ms|me|gap|gap-x|gap-y|space-x|space-y)-(\d+(?:\.\d+)?|px)(?![\w.-])/g;

function lineaDe(texto: string, indice: number): number {
  return texto.slice(0, indice).split("\n").length;
}

/** Analiza el texto en busca de lo que prohíbe PRUEBA-005. `escalaHex` son los colores de la
 * escala; `excepcionesDeStyle` las rutas que pueden llevar `style`; `excepcionesDeValores` las que
 * llevan su propio estilo, sin Tailwind (ambas listas, de `excepciones.ts`). */
export function comprobarFuentes(
  fuentes: Fuentes,
  escalaHex: ReadonlySet<string>,
  excepcionesDeStyle: readonly string[] = [],
  excepcionesDeValores: readonly string[] = [],
): Hallazgo[] {
  const salida: Hallazgo[] = [];
  for (const [ruta, texto] of Object.entries(fuentes)) {
    const anotar = (regla: string, detalle: string): void => {
      salida.push({ regla, archivo: ruta, detalle });
    };
    const propio = excepcionesDeValores.includes(ruta);
    if (!EXENTOS_DE_COLOR.has(ruta)) {
      for (const m of texto.matchAll(new RegExp(HEXADECIMAL.source, "g"))) {
        const hex = m[0].toUpperCase();
        if (propio && escalaHex.has(hex)) continue;
        anotar(
          "color-literal",
          `línea ${lineaDe(texto, m.index!)}: ${m[0]}${propio ? " (no es de la escala)" : ""}`,
        );
      }
      const funcion = FUNCIONES_DE_COLOR.exec(texto);
      if (funcion) anotar("color-literal", `línea ${lineaDe(texto, funcion.index)}: ${funcion[0]}`);
      const nombre = PROPIEDAD_CON_NOMBRE.exec(texto);
      if (nombre) anotar("color-literal", `línea ${lineaDe(texto, nombre.index)}: ${nombre[0]}`);
    }
    if (propio) continue; // sin clases de Tailwind ni JSX
    const clase = CLASE_DE_COLOR.exec(texto);
    if (clase) anotar("clase-de-color", `línea ${lineaDe(texto, clase.index)}: ${clase[0]}`);
    const arbitrario = VALOR_ARBITRARIO.exec(texto);
    if (arbitrario)
      anotar("valor-arbitrario", `línea ${lineaDe(texto, arbitrario.index)}: ${arbitrario[0]}`);
    for (const m of texto.matchAll(UTILIDAD_DE_ESPACIADO)) {
      if (!PASOS_DE_ESPACIADO.has(m[1]!)) {
        anotar("espaciado", `línea ${lineaDe(texto, m.index!)}: ${m[0]} no es un paso de la lista`);
      }
    }
    if (/\.tsx$/.test(ruta)) {
      if (/<[A-Za-z][\w.]*\b[^>]*\sstyle\s*=/.test(texto) && !excepcionesDeStyle.includes(ruta)) {
        anotar("style", "propiedad style en un componente");
      }
      for (const m of texto.matchAll(/\s(fill|stroke|stopColor)\s*=\s*"([^"]*)"/g)) {
        if (!["none", "currentColor", "inherit"].includes(m[2]!)) {
          anotar("svg-literal", `línea ${lineaDe(texto, m.index!)}: ${m[1]}="${m[2]}"`);
        }
      }
    }
  }
  return salida;
}
