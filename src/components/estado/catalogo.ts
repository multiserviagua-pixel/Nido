// Catálogo cerrado de estados (diseño, «Componentes base»; REQ-012, REQ-030, REQ-038, REQ-075).
// Clave `ámbito.estado`, una palabra o expresión (de `textos.ts`), un tono de la lista y un
// icono. Un valor fuera del catálogo es «Estado desconocido» en tono neutro: nunca un estado
// favorable. Cada función de la fase añade sus estados aquí y en `textos.ts`, en su propio diseño.
import { TEXTOS } from "../textos";

export const TONOS_DE_ESTADO = ["neutro", "correcto", "aviso", "error", "informativo"] as const;
export type TonoDeEstado = (typeof TONOS_DE_ESTADO)[number];

/** Nombres de icono que `c/iconos/` (T-006 b) tiene que ofrecer para los estados. */
export const ICONOS_DE_ESTADO = [
  "neutro",
  "correcto",
  "aviso",
  "error",
  "informacion",
  "pausa",
] as const;
export type IconoDeEstado = (typeof ICONOS_DE_ESTADO)[number];

export type ClaveDeEstado = keyof typeof TEXTOS.estados;

type Definicion = { tono: TonoDeEstado; icono: IconoDeEstado };

// `satisfies` obliga a que haya una definición por cada texto de estado, y solo una.
const DEFINICIONES = {
  "agente.activo": { tono: "correcto", icono: "correcto" },
  "agente.en_pausa": { tono: "aviso", icono: "pausa" },
  "agente.con_avisos": { tono: "aviso", icono: "aviso" },
  "agente.sin_senal": { tono: "error", icono: "error" },
  desconocido: { tono: "neutro", icono: "neutro" },
} as const satisfies Record<ClaveDeEstado, Definicion>;

export const CLAVES_DE_ESTADO = Object.keys(DEFINICIONES) as readonly ClaveDeEstado[];

export type EstadoDescrito = {
  clave: ClaveDeEstado;
  palabra: string;
  tono: TonoDeEstado;
  icono: IconoDeEstado;
};

const SOLO_NOMBRE = /^[a-z_]+$/;

/** La clave del catálogo para un valor que llega como dato, o `desconocido`. Ámbito y valor se
 * validan por separado para que no se puedan mezclar en otra clave. */
export function leerEstado(ambito: unknown, valor: unknown): ClaveDeEstado {
  if (typeof ambito !== "string" || typeof valor !== "string") return "desconocido";
  if (!SOLO_NOMBRE.test(ambito) || !SOLO_NOMBRE.test(valor)) return "desconocido";
  const clave = `${ambito}.${valor}`;
  return Object.hasOwn(DEFINICIONES, clave) ? (clave as ClaveDeEstado) : "desconocido";
}

/** Palabra, tono e icono de una clave. Una clave que no existe se describe como desconocida. */
export function describirEstado(clave: ClaveDeEstado): EstadoDescrito {
  const valida: ClaveDeEstado =
    typeof clave === "string" && Object.hasOwn(DEFINICIONES, clave) ? clave : "desconocido";
  const { tono, icono } = DEFINICIONES[valida];
  return { clave: valida, palabra: TEXTOS.estados[valida], tono, icono };
}
