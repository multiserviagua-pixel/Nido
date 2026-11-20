// Estado de la vista en la dirección de la página (diseño, «Dirección de la página»; REQ-059).
// Un esquema por vista. Solo admite enteros acotados, valores de listas cerradas e
// identificadores con el formato exacto. No hay un tipo de texto libre: una búsqueda no puede
// viajar en la dirección. Lo que no encaja se ignora y vuelve el valor por defecto; un parámetro
// que el esquema no declara no se lee ni se conserva.
import { esIdentificador } from "./rutas";

export type CampoEntero = { tipo: "entero"; minimo: number; maximo: number; porDefecto: number };
export type CampoLista<V extends string = string> = {
  tipo: "lista";
  valores: readonly V[];
  porDefecto: V;
};
/** Un UUID en minúsculas; por defecto, `null` (ninguno). */
export type CampoIdentificador = { tipo: "identificador" };
export type Campo = CampoEntero | CampoLista | CampoIdentificador;
export type Esquema = Readonly<Record<string, Campo>>;

type ValorDe<C> = C extends CampoEntero
  ? number
  : C extends CampoLista<infer V>
    ? V
    : C extends CampoIdentificador
      ? string | null
      : null;

export type EstadoDe<E extends Esquema> = { -readonly [K in keyof E]: ValorDe<E[K]> };

export type OrigenDeParametros =
  string | URLSearchParams | Readonly<Record<string, string | readonly string[] | undefined>>;

const NOMBRE_DE_CAMPO = /^[a-z][a-z0-9_]*$/;
// Un valor de lista que no tenga esta forma no se lee ni se escribe, aunque el esquema lo declare.
const VALOR_DE_LISTA = /^[a-z0-9_-]+$/;
const ENTERO = /^(?:0|[1-9][0-9]{0,8})$/;

// Un nombre que coincide con una propiedad de `Object.prototype` (`constructor`, `toString`…)
// no es un campo: se descarta para que nunca se confunda con una propiedad heredada.
const nombreValido = (nombre: string): boolean =>
  NOMBRE_DE_CAMPO.test(nombre) && !(nombre in Object.prototype);

function lectorDe(origen: OrigenDeParametros): (nombre: string) => readonly string[] {
  if (typeof origen === "string") {
    const sinFragmento = origen.split("#")[0] ?? "";
    const parametros = new URLSearchParams(
      sinFragmento.startsWith("?") ? sinFragmento.slice(1) : sinFragmento,
    );
    return (nombre) => parametros.getAll(nombre);
  }
  if (origen instanceof URLSearchParams) return (nombre) => origen.getAll(nombre);
  return (nombre) => {
    if (!Object.hasOwn(origen, nombre)) return [];
    const valor = origen[nombre];
    if (typeof valor === "string") return [valor];
    return Array.isArray(valor) ? (valor as readonly string[]) : [];
  };
}

function valorPorDefecto(campo: Campo): number | string | null {
  if (campo.tipo === "entero" || campo.tipo === "lista") return campo.porDefecto;
  return null;
}

/** El valor, si encaja con el campo; `undefined` si no. */
function validar(campo: Campo, valor: unknown): number | string | undefined {
  switch (campo.tipo) {
    case "entero":
      return typeof valor === "number" &&
        Number.isInteger(valor) &&
        valor >= campo.minimo &&
        valor <= campo.maximo
        ? valor
        : undefined;
    case "lista":
      return typeof valor === "string" &&
        VALOR_DE_LISTA.test(valor) &&
        campo.valores.includes(valor)
        ? valor
        : undefined;
    case "identificador":
      return esIdentificador(valor) ? valor : undefined;
    default:
      // Un tipo de campo que no es de los tres (por ejemplo, texto libre) no se lee nunca.
      return undefined;
  }
}

function interpretar(campo: Campo, crudo: readonly string[]): number | string | null {
  const defecto = valorPorDefecto(campo);
  // Un parámetro repetido es ambiguo: se ignora.
  const texto = crudo.length === 1 ? crudo[0] : undefined;
  if (texto === undefined) return defecto;
  if (campo.tipo === "entero") {
    if (!ENTERO.test(texto)) return defecto;
    return validar(campo, Number(texto)) ?? defecto;
  }
  return validar(campo, texto) ?? defecto;
}

/** Lee el estado de la vista. Devuelve siempre todos los campos del esquema, con su valor por
 * defecto donde la dirección no trae uno válido. */
export function leerEstadoDireccion<E extends Esquema>(
  esquema: E,
  origen: OrigenDeParametros,
): EstadoDe<E> {
  const leer = lectorDe(origen);
  const campos = Object.entries(esquema)
    .filter(([nombre]) => nombreValido(nombre))
    .map(([nombre, campo]) => [nombre, interpretar(campo, leer(nombre))] as const);
  return Object.fromEntries(campos) as EstadoDe<E>;
}

/** Escribe el estado como consulta (`?pagina=2&orden=nombre`) o cadena vacía. Solo escribe lo
 * que cumple el esquema y difiere del valor por defecto, en el orden del esquema. */
export function escribirEstadoDireccion<E extends Esquema>(
  esquema: E,
  estado: Partial<EstadoDe<E>>,
): string {
  const pares: Array<[string, string]> = [];
  if (typeof esquema !== "object" || esquema === null) return "";
  if (typeof estado !== "object" || estado === null) return "";
  for (const [nombre, campo] of Object.entries(esquema)) {
    if (!nombreValido(nombre) || !Object.hasOwn(estado, nombre)) continue;
    const valor = validar(campo, (estado as Record<string, unknown>)[nombre]);
    if (valor === undefined || valor === valorPorDefecto(campo)) continue;
    pares.push([nombre, String(valor)]);
  }
  return pares.length === 0 ? "" : `?${new URLSearchParams(pares).toString()}`;
}
