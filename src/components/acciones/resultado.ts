// `leerResultadoAccion` (diseño 020, «Estados de cada vista», «Correspondencia entre lo que responde
// el servidor y el resultado»; REQ-073, REQ-078). Una sola función convierte lo que llega tras
// enviar una acción en un resultado de lista cerrada. La entrada no es de confianza (artículos 1 y
// 7): se lee solo lo que se espera, con listas cerradas, y nada de lo recibido se devuelve como
// texto (el motivo y los códigos que salen son los de las listas que declara la función que
// envía, no los recibidos). El éxito exige confirmación expresa; ante cualquier duda, `incierta`
// (artículo 3). Sin React ni red: vale igual en el servidor y en el navegador.

export const RESULTADOS_DE_ACCION = ["hecha", "rechazada", "no_permitida", "incierta"] as const;
export type ResultadoDeAccion = (typeof RESULTADOS_DE_ACCION)[number];

/** Error de un campo del formulario. `null` en los dos: error general (campo o código que la
 * función que envía no declara; nunca se pinta lo recibido). */
export type ErrorDeCampo = { readonly campo: string | null; readonly codigo: string | null };

export type LecturaDeAccion =
  | { readonly resultado: "hecha" }
  | {
      readonly resultado: "rechazada";
      readonly motivo: string;
      readonly errores: readonly ErrorDeCampo[];
    }
  | { readonly resultado: "no_permitida" }
  | { readonly resultado: "incierta" };

/** Listas cerradas que declara cada función que envía una acción. Sin ellas, ningún motivo vale. */
export type ListasDeLectura = {
  readonly motivos: readonly string[];
  readonly campos: readonly string[];
  readonly codigos: readonly string[];
};

/** Lo que se pasa a `leerResultadoAccion`: el código HTTP, si lo hay, y el cuerpo ya leído. Se
 * tipa como `unknown` al leer: cualquier otra forma cierra en `incierta`. */
export type RespuestaDeAccion = { readonly estado?: number; readonly cuerpo?: unknown };

const SIN_LISTAS: ListasDeLectura = Object.freeze({ motivos: [], campos: [], codigos: [] });
/** Tope de errores de campo por respuesta: más es una forma distinta de la esperada. */
const MAXIMO_DE_ERRORES = 20;

export const INCIERTA: LecturaDeAccion = Object.freeze({ resultado: "incierta" });
const HECHA: LecturaDeAccion = Object.freeze({ resultado: "hecha" });
const NO_PERMITIDA: LecturaDeAccion = Object.freeze({ resultado: "no_permitida" });

function esObjetoPlano(valor: unknown): valor is Record<string, unknown> {
  if (typeof valor !== "object" || valor === null || Array.isArray(valor)) return false;
  const prototipo: unknown = Object.getPrototypeOf(valor);
  return prototipo === Object.prototype || prototipo === null;
}

/** Las claves propias del objeto están todas en la lista (una de más es una forma distinta). */
function soloClaves(objeto: Record<string, unknown>, permitidas: readonly string[]): boolean {
  return Object.keys(objeto).every((k) => permitidas.includes(k));
}

const esDosXX = (estado: number | undefined): boolean =>
  estado === undefined || (estado >= 200 && estado <= 299);
const esCuatroXX = (estado: number): boolean => estado >= 400 && estado <= 499;

function leerErrores(bruto: unknown, listas: ListasDeLectura): readonly ErrorDeCampo[] | null {
  if (bruto === undefined) return [];
  if (!Array.isArray(bruto) || bruto.length > MAXIMO_DE_ERRORES) return null;
  const salida: ErrorDeCampo[] = [];
  for (const e of bruto as unknown[]) {
    if (!esObjetoPlano(e) || !soloClaves(e, ["campo", "codigo"])) return null;
    const { campo, codigo } = e;
    if (typeof campo !== "string" || typeof codigo !== "string") return null;
    // Se devuelve el valor de la lista, no el recibido; fuera de la lista, error general.
    const campoConocido = listas.campos.find((c) => c === campo);
    const codigoConocido = listas.codigos.find((c) => c === codigo);
    const error: ErrorDeCampo =
      campoConocido !== undefined && codigoConocido !== undefined
        ? { campo: campoConocido, codigo: codigoConocido }
        : { campo: null, codigo: null };
    if (!salida.some((x) => x.campo === error.campo && x.codigo === error.codigo)) {
      salida.push(Object.freeze(error));
    }
  }
  return Object.freeze(salida);
}

function leer(respuesta: unknown, listas: ListasDeLectura): LecturaDeAccion {
  if (!esObjetoPlano(respuesta) || !soloClaves(respuesta, ["estado", "cuerpo"])) return INCIERTA;
  const estado = Object.hasOwn(respuesta, "estado") ? respuesta["estado"] : undefined;
  if (
    Object.hasOwn(respuesta, "estado") &&
    (typeof estado !== "number" || !Number.isInteger(estado) || estado < 100 || estado > 599)
  ) {
    return INCIERTA;
  }
  const codigo = estado as number | undefined;
  // Sesión que no vale o sin permiso: no se aplicó nada, sea cual sea el cuerpo.
  if (codigo === 401 || codigo === 403) return NO_PERMITIDA;
  // Fuera de 2xx y 4xx (redirecciones, errores del servidor): no se sabe qué pasó.
  if (codigo !== undefined && !esDosXX(codigo) && !esCuatroXX(codigo)) return INCIERTA;

  const cuerpo = Object.hasOwn(respuesta, "cuerpo") ? respuesta["cuerpo"] : undefined;
  if (!esObjetoPlano(cuerpo) || !Object.hasOwn(cuerpo, "resultado")) return INCIERTA;
  const dicho = cuerpo["resultado"];

  if (dicho === "hecha") {
    // Solo un código 2xx (o ninguno) y sin nada más en el cuerpo: éxito con confirmación expresa.
    return esDosXX(codigo) && soloClaves(cuerpo, ["resultado"]) ? HECHA : INCIERTA;
  }
  if (dicho === "no_permitida") return soloClaves(cuerpo, ["resultado"]) ? NO_PERMITIDA : INCIERTA;
  if (dicho === "rechazada") {
    if (!soloClaves(cuerpo, ["resultado", "motivo", "errores"])) return INCIERTA;
    const motivo = listas.motivos.find((m) => m === cuerpo["motivo"]);
    if (motivo === undefined) return INCIERTA;
    const errores = leerErrores(cuerpo["errores"], listas);
    if (errores === null) return INCIERTA;
    return Object.freeze({ resultado: "rechazada", motivo, errores });
  }
  return INCIERTA;
}

/**
 * Lee la respuesta a una acción y devuelve su resultado. Nunca lanza: cualquier excepción al leer
 * una entrada hostil cierra en `incierta`.
 */
export function leerResultadoAccion(
  respuesta: unknown,
  listas: ListasDeLectura = SIN_LISTAS,
): LecturaDeAccion {
  try {
    return leer(respuesta, listas);
  } catch {
    return INCIERTA;
  }
}
