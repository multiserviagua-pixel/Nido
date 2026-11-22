// Periodo de una vista (diseño 020, «Armazón», `SelectorPeriodo`; REQ-006, REQ-059). Lógica pura,
// sin React ni navegador: la usan la vista (en el servidor, para leer el valor de la dirección) y
// `SelectorPeriodo` (en el cliente). El periodo es un valor de una lista cerrada que declara la
// vista: la dirección no admite nada que no esté en ella (art. 1) y lo que no encaja vuelve al
// valor por defecto. Las fechas las pone la vista (ella sabe qué día es), no este archivo.
import {
  escribirEstadoDireccion,
  leerEstadoDireccion,
  type Esquema,
  type OrigenDeParametros,
} from "../direccion/estado-direccion";
import { esquemaSinIdentificadores, esRutaInterna } from "../direccion/rutas";
import { formatearPeriodo } from "../formato/fechas";
import { TEXTOS } from "../textos";

export type PeriodoDeLista = {
  /** Valor que viaja en la dirección: minúscula, cifras, guion y guion bajo. */
  readonly clave: string;
  /** Palabras del periodo («Últimos 30 días»); salen de `textos.ts` o de la vista, sin datos. */
  readonly etiqueta: string;
  /** Instantes con zona (`2026-10-14T00:00:00+02:00`). */
  readonly desde: string;
  readonly hasta: string;
};

export type ConfiguracionDePeriodo = {
  /** Lista cerrada de periodos que admite la vista. */
  readonly periodos: readonly PeriodoDeLista[];
  /** Clave del periodo cuando la dirección no trae uno válido. */
  readonly porDefecto: string;
  /** Clave activa, ya leída de la dirección por la vista (`valorDePeriodo`). */
  readonly valor: string;
  /** Esquema de dirección de la propia vista (`orden`, `pagina`…): datos puros que pasan del
   * servidor al cliente. Al cambiar el periodo, `rutaParaCambiarPeriodo` conserva sus listas e
   * identificadores válidos, devuelve los enteros a su valor por defecto y pierde lo demás. */
  readonly esquemaDeLaVista?: Esquema;
};

/** Nombre del parámetro de la dirección. */
export const CAMPO_PERIODO = "periodo";

const CLAVE_VALIDA = /^[a-z0-9_-]+$/;

/** Los periodos utilizables: clave admitida por la dirección, sin repetir, con etiqueta y con un
 * intervalo que se pueda escribir con palabras. Lo demás se descarta (cierra en fallo). */
export function periodosValidos(periodos: readonly PeriodoDeLista[]): readonly PeriodoDeLista[] {
  if (!Array.isArray(periodos)) return [];
  const vistos = new Set<string>();
  const validos: PeriodoDeLista[] = [];
  for (const p of periodos) {
    if (typeof p !== "object" || p === null) continue;
    if (typeof p.clave !== "string" || !CLAVE_VALIDA.test(p.clave) || vistos.has(p.clave)) continue;
    if (typeof p.etiqueta !== "string" || p.etiqueta.trim() === "") continue;
    if (formatearPeriodo(p.desde, p.hasta) === TEXTOS.formato.sinDatos) continue;
    vistos.add(p.clave);
    validos.push(p);
  }
  return validos;
}

/** Esquema de dirección del periodo: un campo de lista con las claves utilizables. Vacío si no
 * hay ninguna. */
export function esquemaDePeriodo(periodos: readonly PeriodoDeLista[], porDefecto: string): Esquema {
  const claves = periodosValidos(periodos).map((p) => p.clave);
  if (claves.length === 0) return {};
  return {
    [CAMPO_PERIODO]: {
      tipo: "lista",
      valores: claves,
      porDefecto: claves.includes(porDefecto) ? porDefecto : claves[0]!,
    },
  };
}

/** La clave de periodo que trae la dirección, o la de por defecto. Lo que no esté en la lista
 * no se lee (un texto escrito en la dirección no llega a ninguna parte). */
export function valorDePeriodo(
  periodos: readonly PeriodoDeLista[],
  porDefecto: string,
  origen: OrigenDeParametros,
): string {
  const esquema = esquemaDePeriodo(periodos, porDefecto);
  if (!(CAMPO_PERIODO in esquema)) return porDefecto;
  return String(leerEstadoDireccion(esquema, origen)[CAMPO_PERIODO]);
}

/** El periodo activo: el valor si está en la lista; si no, el de por defecto; si tampoco, ninguno
 * (y entonces no se pinta el selector). */
export function periodoActivo(configuracion: ConfiguracionDePeriodo): PeriodoDeLista | null {
  const lista = periodosValidos(configuracion.periodos);
  return (
    lista.find((p) => p.clave === configuracion.valor) ??
    lista.find((p) => p.clave === configuracion.porDefecto) ??
    lista[0] ??
    null
  );
}

/** «Últimos 30 días · 14 oct – 12 nov 2026». */
export function textoDePeriodo(periodo: PeriodoDeLista): string {
  return `${periodo.etiqueta} · ${formatearPeriodo(periodo.desde, periodo.hasta)}`;
}

/** Dirección tras elegir un periodo: la misma ruta, sin fragmento y con SOLO `periodo` (si no es
 * el de por defecto). Cualquier otro parámetro se descarta: lo que el esquema no declara no se lee
 * ni se conserva (diseno.md, art. 1). El parámetro lo escribe `escribirEstadoDireccion`. */
export function rutaConPeriodo(
  ruta: string,
  configuracion: ConfiguracionDePeriodo,
  clave: string,
): string {
  const esquema = esquemaDePeriodo(configuracion.periodos, configuracion.porDefecto);
  const base = ruta.split(/[?#]/)[0] ?? "";
  const consulta = new URLSearchParams(
    escribirEstadoDireccion(esquema, { [CAMPO_PERIODO]: clave }),
  ).toString();
  return consulta === "" ? base : `${base}?${consulta}`;
}

/** El esquema de la vista sin `periodo` (manda el elegido) y sin enteros (vuelven a su valor por
 * defecto: con otro periodo, la página del anterior no significa nada). Solo quedan listas e
 * identificadores. Un esquema que no sea un objeto no aporta nada. */
function esquemaConservable(esquema: unknown): Esquema {
  if (typeof esquema !== "object" || esquema === null) return {};
  const campos = Object.entries(esquema as Esquema).filter(
    ([nombre, campo]) =>
      nombre !== CAMPO_PERIODO &&
      typeof campo === "object" &&
      campo !== null &&
      (campo.tipo === "lista" || campo.tipo === "identificador"),
  );
  return Object.fromEntries(campos);
}

/** La ruta que recibe `router.replace` al cambiar de periodo, o `null` si no se debe navegar.
 * Parte del `pathname` de la página, que debe ser una ruta interna: `location.pathname` puede
 * empezar por `//` (`http://host//otro.example/x`) y eso resolvería a otro servidor. La consulta
 * se lee de `search` SOLO a través del esquema de la vista (diseño, «Cambio de periodo», punto 2):
 * listas e identificadores válidos se conservan, los enteros vuelven a su valor por defecto y lo
 * que el esquema no declara se pierde; el fragmento no pasa. Sin `esquemaDeLaVista`, solo
 * `periodo`. Cierra en fallo (art. 3): sin ruta válida no se navega. El valor de `periodo` sale
 * siempre de la lista. */
export function rutaParaCambiarPeriodo(
  pathname: unknown,
  search: unknown,
  configuracion: ConfiguracionDePeriodo,
  clave: string,
): string | null {
  if (!esRutaInterna(pathname)) return null;
  const base = pathname.split(/[?#]/)[0] ?? "";
  const esquema: Esquema = {
    ...esquemaDePeriodo(configuracion.periodos, configuracion.porDefecto),
    // En el panel el cliente sale de la sesión: ningún identificador viaja en la dirección
    // (art. 2; misma regla que `construirRuta`).
    ...(base.startsWith("/panel")
      ? esquemaSinIdentificadores(esquemaConservable(configuracion.esquemaDeLaVista))
      : esquemaConservable(configuracion.esquemaDeLaVista)),
  };
  const actual = leerEstadoDireccion(esquema, typeof search === "string" ? search : "");
  const consulta = escribirEstadoDireccion(esquema, { ...actual, [CAMPO_PERIODO]: clave });
  const ruta = `${base}${consulta}`;
  return esRutaInterna(ruta) ? ruta : null;
}
