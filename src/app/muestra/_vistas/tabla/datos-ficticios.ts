// Datos ficticios de las páginas de la muestra de `Tabla` (T-010 (g)). Hacen de servidor: dada una
// página y un orden devuelven SOLO las filas de esa página (la tabla nunca recibe el conjunto).
// Todo es inventado y reproducible; nada sale de ningún sitio. Los casos hostiles están aquí para
// que la prueba compruebe que la tabla los pinta como texto.
import type { ColumnaDeTabla, OrdenDeTabla } from "@/components/tabla/logica";
import { TAMANO_DE_PAGINA } from "@/components/tabla/logica";

export type ConjuntoDeMuestra = "clientes" | "ancho" | "largos" | "hostil";
export type Fila = Record<string, unknown>;

export type ConfiguracionDeTabla = {
  readonly conjunto: ConjuntoDeMuestra;
  readonly total: number;
  readonly paginaInicial: number;
  readonly ordenInicial: OrdenDeTabla | null;
};

const ESTADOS = ["activo", "en_pausa", "con_avisos", "sin_senal"] as const;
const DIA = 86_400_000;
const BASE = Date.UTC(2026, 0, 5, 8, 0, 0);

export const COLUMNAS_CLIENTES: readonly ColumnaDeTabla[] = [
  { clave: "nombre", etiqueta: "Cliente", ordenable: true },
  { clave: "correos", etiqueta: "Correos revisados", tipo: "numero", ordenable: true },
  { clave: "agentes", etiqueta: "Agentes", tipo: "numero", ordenable: true },
  { clave: "estado", etiqueta: "Estado", tipo: "estado", ambito: "agente" },
  { clave: "alta", etiqueta: "Alta", tipo: "fecha", ordenable: true },
];

const MEDIDAS_ANCHAS = ["avisos", "respuestas", "borradores", "revisiones", "reglas", "informes"];
export const COLUMNAS_ANCHAS: readonly ColumnaDeTabla[] = [
  { clave: "nombre", etiqueta: "Cliente de ejemplo", ordenable: true },
  ...MEDIDAS_ANCHAS.map((clave): ColumnaDeTabla => ({
    clave,
    etiqueta: `Total de ${clave} del periodo`,
    tipo: "numero",
    ordenable: true,
  })),
  { clave: "estado", etiqueta: "Estado", tipo: "estado", ambito: "agente" },
  { clave: "alta", etiqueta: "Alta", tipo: "fecha" },
];

export const COLUMNAS_LARGOS: readonly ColumnaDeTabla[] = [
  { clave: "nombre", etiqueta: "Nombre", ordenable: true },
  { clave: "correos", etiqueta: "Correos", tipo: "numero", ordenable: true },
  { clave: "estado", etiqueta: "Estado", tipo: "estado", ambito: "agente" },
];

export const COLUMNAS_HOSTILES: readonly ColumnaDeTabla[] = [
  { clave: "nombre", etiqueta: "Nombre", ordenable: true },
  { clave: "correos", etiqueta: "Correos", tipo: "numero", ordenable: true },
  { clave: "estado", etiqueta: "Estado", tipo: "estado", ambito: "agente" },
];

export function columnasDe(conjunto: ConjuntoDeMuestra): readonly ColumnaDeTabla[] {
  if (conjunto === "ancho") return COLUMNAS_ANCHAS;
  if (conjunto === "largos") return COLUMNAS_LARGOS;
  if (conjunto === "hostil") return COLUMNAS_HOSTILES;
  return COLUMNAS_CLIENTES;
}

/** Nombre de 120 caracteres exactos; los pares llevan espacios y los impares, ninguno. */
export function nombreDe120(i: number): string {
  const base =
    i % 2 === 0
      ? "Asociación ficticia de ejemplo para comprobar que un nombre muy largo se parte en varias líneas sin recortarse "
      : "Nombre-ficticio-de-ejemplo-sin-ningun-espacio-para-comprobar-que-se-parte-en-lineas-y-no-desborda-la-tabla-";
  return `${base}${i + 1}`.padEnd(120, "x").slice(0, 120);
}

// Caracteres de dirección e invisibles construidos a propósito (no escritos en el código fuente).
const RLO = String.fromCharCode(0x202e);
const LRI = String.fromCharCode(0x2066);
const ZWSP = String.fromCharCode(0x200b);

/** Textos hostiles, todos ficticios. Con el tamaño de la lista fijo en `HOSTILES.length`. */
export const HOSTILES: readonly string[] = [
  "<script>window.__hostil = 1</script>",
  '"><img src=x onerror="window.__hostil = 2">',
  `${"java"}${"script:"}window.__hostil = 3`,
  "[pulsa aquí](https://malo.example/phishing)",
  `Ana${RLO} Pérez${ZWSP}${LRI} (RLO e invisibles)`,
  "\u0007\u0000 control y nulo",
  "{{constructor.constructor('1')()}} ${1+1}",
  "<a href=https://malo.example>enlace</a>",
  "&lt;b&gt;entidades&lt;/b&gt; &amp; &#x3c;",
  "\u200B\u200C\u2060",
  "عميل 123 - cliente árabe mezclado con latín",
  "a".repeat(120),
];
export const ESTADOS_HOSTILES: readonly unknown[] = [
  "activo",
  "<script>",
  "constructor",
  "__proto__",
  "ACTIVO",
  "",
  null,
  { estado: "activo" },
  "agente.activo",
  "en_pausa",
  "con_avisos",
  "sin_senal",
];

function numero(i: number, k: number): number {
  return (i * 37 + k * 101) % 9973;
}

export function filaDe(conjunto: ConjuntoDeMuestra, i: number): Fila {
  if (conjunto === "hostil") {
    return {
      nombre: HOSTILES[i],
      correos: i === 2 ? "no es un número" : i === 3 ? -4 : i === 4 ? Number.NaN : (i + 1) * 1111,
      estado: ESTADOS_HOSTILES[i],
      // Campos de más: no deben aparecer en ningún sitio.
      campoDeMas1: "TESTIGO-CAMPO-DE-MAS-1",
      campoDeMas2: "TESTIGO-CAMPO-DE-MAS-2",
    };
  }
  if (conjunto === "largos") {
    return { nombre: nombreDe120(i), correos: numero(i, 1), estado: ESTADOS[i % 4] };
  }
  const base: Fila = {
    nombre: `Cliente de ejemplo ${i + 1}`,
    correos: numero(i, 1),
    agentes: numero(i, 2) % 12,
    estado: ESTADOS[(i * 3) % 4],
    alta: new Date(BASE + ((i * 5) % 400) * DIA).toISOString(),
  };
  if (conjunto === "ancho") {
    MEDIDAS_ANCHAS.forEach((clave, k) => {
      base[clave] = numero(i, k + 3);
    });
  }
  return base;
}

const COLATOR = new Intl.Collator("es", { numeric: true });

function comparar(a: Fila, b: Fila, clave: string): number {
  const x = a[clave];
  const y = b[clave];
  if (typeof x === "number" && typeof y === "number") return x - y;
  return COLATOR.compare(String(x), String(y));
}

/** Lo que haría el servidor: ordena y devuelve solo la página pedida. */
export function pedirPagina(
  configuracion: Pick<ConfiguracionDeTabla, "conjunto" | "total">,
  pagina: number,
  orden: OrdenDeTabla | null,
): Fila[] {
  const { conjunto, total } = configuracion;
  const indices = Array.from({ length: total }, (_, i) => i);
  if (orden !== null) {
    const filas = indices.map((i) => filaDe(conjunto, i));
    const signo = orden.sentido === "ascendente" ? 1 : -1;
    indices.sort((a, b) => signo * comparar(filas[a]!, filas[b]!, orden.columna) || a - b);
  }
  const desde = (pagina - 1) * TAMANO_DE_PAGINA;
  return indices.slice(desde, desde + TAMANO_DE_PAGINA).map((i) => filaDe(conjunto, i));
}
