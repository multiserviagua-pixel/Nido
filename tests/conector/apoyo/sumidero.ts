// Sumidero de salida (T-102, 001): recoge todo lo que la aplicación escribe (consola, errores,
// respuestas) para buscar en ello un valor sembrado. Los hallazgos dicen dónde y en qué forma, nunca
// el valor (art. 4). Límite: la forma base64 solo se halla alineada con el inicio del valor.
// De cada valor registrado se guarda todo lo que se vería: la cadena, `util.inspect` completo
// (profundidad sin límite, propiedades ocultas, getters, listas y cadenas sin recortar), el JSON y los
// bytes (Buffer, Uint8Array, ArrayBuffer) leídos como texto, también dentro de Map, Set y Headers.
// En la consola se guarda además el texto de `util.formatWithOptions` (cubre `%s` con toString).
//
// Límites declarados (formas que este sumidero NO halla):
// - Un valor partido en dos argumentos o escrituras (la mitad en cada uno).
// - El hex en mayúsculas (solo se busca en minúsculas).
// - El JSON de un Buffer (`{"type":"Buffer","data":[...]}`): son números, no el valor.
// - Texto codificado en UTF-16 (u otra codificación distinta de utf8 y latin1).
// - Un SharedArrayBuffer (no se lee su contenido).
// - Lo que escriba código que guardó antes de capturar una referencia a console.log (o a
//   process.stdout.write), o que escriba por fs.writeSync(1, ...) o con otro descriptor: no pasa por aquí.
// - La captura activa a la vez de varios sumideros solo se admite anidada: `restaurar` falla si no se
//   restaura en orden LIFO (el último capturado, el primero restaurado).
// - El registrador del producto (T-10x) debe recibir su destino inyectado o leer console.* en cada
//   llamada; si guarda console.log al arrancar, esta captura no lo ve.
import { formatWithOptions, inspect, type InspectOptions } from "node:util";

export type Forma = "literal" | "url" | "json" | "base64" | "base64url" | "hex";
export interface Hallazgo {
  origen: string;
  forma: Forma;
}

const NIVELES = ["log", "info", "warn", "error", "debug"];

const OPCIONES_INSPECT: InspectOptions = {
  depth: null,
  showHidden: true,
  getters: true,
  maxArrayLength: null,
  maxStringLength: null,
  breakLength: Infinity,
  compact: false,
};

/** Recorre el valor y devuelve cadenas y bytes (leídos como texto) que contiene. */
function textosInternos(
  valor: unknown,
  vistos = new WeakSet<object>(),
  salida: string[] = [],
): string[] {
  if (typeof valor === "string") {
    salida.push(valor);
    return salida;
  }
  if (typeof valor !== "object" || valor === null || vistos.has(valor)) return salida;
  vistos.add(valor);
  if (ArrayBuffer.isView(valor)) {
    const b = Buffer.from(valor.buffer, valor.byteOffset, valor.byteLength);
    salida.push(b.toString("utf8"), b.toString("latin1"));
    return salida;
  }
  if (valor instanceof ArrayBuffer) {
    salida.push(Buffer.from(valor).toString("utf8"));
    return salida;
  }
  const hijos: unknown[] = [];
  if (valor instanceof Map) for (const [k, v] of valor) hijos.push(k, v);
  else if (valor instanceof Set) hijos.push(...valor);
  else if (valor instanceof Headers) valor.forEach((v, k) => hijos.push(k, v));
  for (const clave of Reflect.ownKeys(valor)) {
    const d = Object.getOwnPropertyDescriptor(valor, clave);
    if (d && "value" in d) hijos.push(d.value);
    else if (d?.get) hijos.push(d.get.call(valor));
  }
  for (const h of hijos) textosInternos(h, vistos, salida);
  return salida;
}

function aTexto(valor: unknown): string {
  if (typeof valor === "string") return valor;
  const partes: string[] = [];
  try {
    partes.push(inspect(valor, OPCIONES_INSPECT));
  } catch {
    partes.push(String(valor));
  }
  if (valor instanceof Error) partes.push(`${valor.name}: ${valor.message}`, valor.stack ?? "");
  try {
    partes.push(
      JSON.stringify(valor, (_c, v: unknown) => (typeof v === "bigint" ? v.toString() : v)) ?? "",
    );
  } catch {
    /* circular u otro: el inspect ya lo cubre */
  }
  try {
    partes.push(...textosInternos(valor));
  } catch {
    /* sin más formas */
  }
  return partes.join("\n");
}

export interface Sumidero {
  registrar(origen: string, valor: unknown): void;
  registrarError(error: unknown): void;
  registrarRespuesta(respuesta: Response): Promise<void>;
  hallar(valor: string): Hallazgo[];
  readonly entradas: number;
}

export function crearSumidero(): Sumidero {
  const registros: { origen: string; texto: string }[] = [];
  return {
    registrar(origen, valor) {
      registros.push({ origen, texto: aTexto(valor) });
    },
    registrarError(error) {
      registros.push({ origen: "error", texto: aTexto(error) });
    },
    async registrarRespuesta(respuesta) {
      const copia = respuesta.clone();
      registros.push({ origen: "respuesta.cuerpo", texto: await copia.text() });
      registros.push({ origen: "respuesta.estado", texto: `${respuesta.status} ${respuesta.url}` });
      respuesta.headers.forEach((v, k) => {
        registros.push({ origen: "respuesta.cabecera", texto: `${k}: ${v}` });
      });
    },
    hallar(valor) {
      if (valor.length === 0) throw new Error("sumidero: valor sembrado vacío");
      const buffer = Buffer.from(valor, "utf8");
      const formas: [Forma, string][] = [
        ["literal", valor],
        ["url", encodeURIComponent(valor)],
        ["json", JSON.stringify(valor).slice(1, -1)],
        ["base64", buffer.toString("base64")],
        ["base64url", buffer.toString("base64url")],
        ["hex", buffer.toString("hex")],
      ];
      const hallazgos: Hallazgo[] = [];
      for (const r of registros) {
        const forma = formas.find(([, f]) => r.texto.includes(f));
        if (forma) hallazgos.push({ origen: r.origen, forma: forma[0] });
      }
      return hallazgos;
    },
    get entradas() {
      return registros.length;
    },
  };
}

/** Texto de lo que mostraría la consola, con el formato de `util.format` (%s con toString incluido). */
function formateado(argumentos: unknown[]): string {
  try {
    return formatWithOptions(OPCIONES_INSPECT, ...argumentos);
  } catch {
    return "";
  }
}

const capturasActivas: object[] = [];

/**
 * Sustituye console.*, process.stdout.write y process.stderr.write por registros en el sumidero:
 * no imprimen, así que el valor no llega al terminal real mientras está activo. Hay que restaurar.
 */
export function capturarConsola(sumidero: Sumidero): { restaurar(): void } {
  const testigo = {};
  capturasActivas.push(testigo);
  const restauraciones: (() => void)[] = [];
  const consola = console as unknown as Record<string, (...a: unknown[]) => void>;
  const registrar = (origen: string, argumentos: unknown[]) => {
    sumidero.registrar(origen, [argumentos, formateado(argumentos)]);
  };
  for (const nivel of [...NIVELES, "dir", "dirxml", "trace", "table", "assert"]) {
    const original = consola[nivel]!;
    consola[nivel] = (...argumentos: unknown[]) => {
      registrar(`consola.${nivel}`, argumentos);
    };
    restauraciones.push(() => {
      consola[nivel] = original;
    });
  }
  for (const nombre of ["stdout", "stderr"] as const) {
    const flujo = process[nombre];
    const propia = Object.prototype.hasOwnProperty.call(flujo, "write");
    const original = flujo.write;
    flujo.write = ((trozo: unknown, ...resto: unknown[]) => {
      registrar(`proceso.${nombre}`, [trozo]);
      const llamada = resto.find((r) => typeof r === "function") as (() => void) | undefined;
      llamada?.();
      return true;
    }) as typeof flujo.write;
    restauraciones.push(() => {
      if (propia) flujo.write = original;
      else delete (flujo as { write?: unknown }).write;
    });
  }
  return {
    restaurar() {
      if (!capturasActivas.includes(testigo)) return;
      if (capturasActivas[capturasActivas.length - 1] !== testigo) {
        throw new Error(
          "sumidero: restauración fuera de orden LIFO; restaura primero la última captura",
        );
      }
      capturasActivas.pop();
      for (const r of restauraciones.reverse()) r();
      restauraciones.length = 0;
    },
  };
}
