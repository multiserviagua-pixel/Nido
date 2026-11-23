// Lectura de las alertas (diseño 020, «Componentes base», fila `ListaAlertas`; REQ-016, REQ-047,
// REQ-056, REQ-075). Lo que llega de una alerta es un dato no confiable (artículos 1 y 7): la
// gravedad, el tipo y la acción son de listas cerradas y el texto que se ve sale de `textos.ts`; el
// momento sale del formato común y el cliente es el único texto libre, que se pinta aparte con
// `TextoDato`. Lo que no se reconoce cierra en «desconocida» o «desconocido» (nunca en algo menos
// grave) y lo recibido de más no se lee: solo se miran las claves propias de las seis que se
// esperan. Sin React ni red: vale igual en el servidor y en el navegador.
import type { IconoDeEstado, TonoDeEstado } from "../estado/catalogo";
import { formatearFechaHora } from "../formato/fechas";
import { textoPlano } from "../formato/texto-plano";
import { TEXTOS } from "../textos";

export const GRAVEDADES_DE_ALERTA = ["critica", "aviso", "informacion"] as const;
export type GravedadConocida = (typeof GRAVEDADES_DE_ALERTA)[number];
export type GravedadDeAlerta = GravedadConocida | "desconocida";

export const TIPOS_DE_ALERTA = [
  "agente_sin_senal",
  "agente_con_avisos",
  "licencia_por_caducar",
  "revision_completada",
] as const;
export type TipoConocido = (typeof TIPOS_DE_ALERTA)[number];
export type TipoDeAlerta = TipoConocido | "desconocido";

export const ACCIONES_DE_ALERTA = ["reanudar_agente", "revisar_licencia"] as const;
export type AccionDeAlerta = (typeof ACCIONES_DE_ALERTA)[number];

/** Tono e icono de cada gravedad: los de `EtiquetaEstado`, para que el color nunca vaya solo. */
export const ASPECTO_DE_GRAVEDAD: Readonly<
  Record<GravedadDeAlerta, { tono: TonoDeEstado; icono: IconoDeEstado }>
> = Object.freeze({
  critica: { tono: "error", icono: "error" },
  aviso: { tono: "aviso", icono: "aviso" },
  informacion: { tono: "informativo", icono: "informacion" },
  desconocida: { tono: "neutro", icono: "neutro" },
});

/** Marca solo de tipos (no existe en tiempo de ejecución): una fila cruda no la tiene, así que no
 * se puede pasar a `ListaAlertas` sin pasar por `leerAlerta` o `leerAlertas` (regla V-2). */
declare const LEIDA: unique symbol;

export type AlertaLeida = {
  readonly [LEIDA]: true;
  readonly gravedad: GravedadDeAlerta;
  readonly tipo: TipoDeAlerta;
  /** Ya con el formato común, o «Sin datos». */
  readonly momento: string;
  /** El único texto libre; ya sin caracteres de control ni de dirección. */
  readonly cliente: string | null;
  readonly accion: AccionDeAlerta | null;
  readonly enCurso: boolean;
};

function deLaLista<T extends string>(lista: readonly T[], valor: unknown): T | null {
  return typeof valor === "string" ? (lista.find((x) => x === valor) ?? null) : null;
}

export function leerGravedadDeAlerta(valor: unknown): GravedadDeAlerta {
  return deLaLista(GRAVEDADES_DE_ALERTA, valor) ?? "desconocida";
}

export function leerTipoDeAlerta(valor: unknown): TipoDeAlerta {
  return deLaLista(TIPOS_DE_ALERTA, valor) ?? "desconocido";
}

export function leerAccionDeAlerta(valor: unknown): AccionDeAlerta | null {
  return deLaLista(ACCIONES_DE_ALERTA, valor);
}

/** Tope de alertas que se leen y se pintan (el mismo criterio que la página de `Tabla`). El
 * diseño no dice nada sobre un tope ni sobre una nota de «y N más»: la vista debe limitar lo que
 * pide al servidor; este tope es la red de seguridad del componente. */
export const MAXIMO_DE_ALERTAS = 25;

const sinMarca = (a: Omit<AlertaLeida, typeof LEIDA>): AlertaLeida =>
  Object.freeze(a) as AlertaLeida;

const DESCONOCIDA: AlertaLeida = sinMarca({
  gravedad: "desconocida",
  tipo: "desconocido",
  momento: TEXTOS.formato.sinDatos,
  cliente: null,
  accion: null,
  enCurso: false,
});

function propio(objeto: object, clave: string): unknown {
  return Object.hasOwn(objeto, clave) ? (objeto as Record<string, unknown>)[clave] : undefined;
}

/** Lee una alerta. Nunca lanza: una entrada que no se puede leer es una alerta desconocida, que
 * se ve (una alerta que desaparece sería lo menos seguro) pero sin texto ni botón recibidos. */
export function leerAlerta(bruta: unknown): AlertaLeida {
  try {
    if (typeof bruta !== "object" || bruta === null || Array.isArray(bruta)) return DESCONOCIDA;
    const cliente = propio(bruta, "cliente");
    const limpio = typeof cliente === "string" ? textoPlano(cliente) : "";
    return sinMarca({
      gravedad: leerGravedadDeAlerta(propio(bruta, "gravedad")),
      tipo: leerTipoDeAlerta(propio(bruta, "tipo")),
      momento: formatearFechaHora(propio(bruta, "momento")),
      cliente: limpio.trim() === "" ? null : limpio,
      accion: leerAccionDeAlerta(propio(bruta, "accion")),
      enCurso: propio(bruta, "enCurso") === true,
    });
  } catch {
    return DESCONOCIDA;
  }
}

/** Lee la lista de alertas que llega del servidor: una a una, con `leerAlerta`, hasta el tope. Es
 * lo que corre en el servidor (regla V-2): al navegador solo viaja lo ya leído, con los seis
 * campos permitidos y nada más. Lo que no es una lista cierra en lista vacía. */
export function leerAlertas(brutas: unknown): readonly AlertaLeida[] {
  try {
    if (!Array.isArray(brutas)) return Object.freeze([]);
    const salida: AlertaLeida[] = [];
    for (let i = 0; i < Math.min(brutas.length, MAXIMO_DE_ALERTAS); i += 1) {
      salida.push(leerAlerta((brutas as readonly unknown[])[i]));
    }
    return Object.freeze(salida);
  } catch {
    return Object.freeze([]);
  }
}
