// Lógica pura de `Formulario` y sus campos (diseño 020, «Componentes base», fila `Formulario y
// campos`, y reglas V-3 y V-6; REQ-019, REQ-020, REQ-057, REQ-073, REQ-078, REQ-080). Sin React ni
// navegador: vale igual en el servidor y en el navegador y se prueba sin DOM.
//
// - Los campos los declara la vista en su código (clave, tipo, textos fijos de `TEXTOS`, longitud
//   máxima). `leerCampos` los vuelve a leer y cierra en fallo: un tipo, una clave o una opción que
//   no encaja no se pinta, y un texto que no es de `TEXTOS` no llega a la pantalla.
// - La validación es de la aplicación (`noValidate`): obligatorio, longitud y opción de la lista.
//   Los códigos son de lista cerrada (`TEXTOS.formulario.errores`).
// - El error de campo que devuelve el servidor llega como par `{campo, codigo}` ya filtrado por
//   `leerResultadoAccion` contra las listas del formulario; aquí se vuelve a comprobar contra los
//   campos pintados y contra los textos: lo que no encaja es un error general, nunca un texto
//   recibido (regla V-6).
import type { ErrorDeCampo, LecturaDeAccion } from "../acciones/resultado";
import { formatearNumero } from "../formato/numeros";
import { TEXTOS, type TextoFijo } from "../textos";

export const TIPOS_DE_CAMPO = [
  "texto",
  "texto_largo",
  "seleccion",
  "casilla",
  "grupo",
  "busqueda",
] as const;
export type TipoDeCampo = (typeof TIPOS_DE_CAMPO)[number];

/** Valores de `autocomplete` admitidos. Por defecto `off`: la 020 no recoge datos personales del
 * usuario y un campo que no es sobre él no debe sugerirle los suyos. */
export const AUTOCOMPLETADOS = ["off", "name", "organization", "email", "username"] as const;
export type Autocompletado = (typeof AUTOCOMPLETADOS)[number];

export const LONGITUD_POR_DEFECTO = 200;
export const LONGITUD_TOPE = 5000;

export type CodigoDeError = keyof typeof TEXTOS.formulario.errores;
export type MotivoDeRechazo = keyof typeof TEXTOS.acciones.motivosDeRechazo;

export type OpcionDeCampo = { readonly valor: string; readonly etiqueta: TextoFijo };

type Comun = {
  readonly clave: string;
  readonly etiqueta: TextoFijo;
  readonly ayuda?: TextoFijo;
  readonly obligatorio?: boolean;
};
export type DefinicionDeCampo =
  | (Comun & {
      readonly tipo: "texto" | "busqueda";
      readonly longitudMaxima: number;
      readonly autocompletar?: Autocompletado;
    })
  | (Comun & { readonly tipo: "texto_largo"; readonly longitudMaxima: number })
  | (Comun & { readonly tipo: "seleccion" | "grupo"; readonly opciones: readonly OpcionDeCampo[] })
  | (Comun & { readonly tipo: "casilla" });

/** Un campo ya leído: obligatorio siempre booleano, etiqueta siempre un texto fijo. */
export type CampoLeido =
  | {
      readonly tipo: "texto" | "busqueda";
      readonly clave: string;
      readonly etiqueta: TextoFijo;
      readonly ayuda?: TextoFijo;
      readonly obligatorio: boolean;
      readonly longitudMaxima: number;
      readonly autocompletar: Autocompletado;
    }
  | {
      readonly tipo: "texto_largo";
      readonly clave: string;
      readonly etiqueta: TextoFijo;
      readonly ayuda?: TextoFijo;
      readonly obligatorio: boolean;
      readonly longitudMaxima: number;
      readonly autocompletar: "off";
    }
  | {
      readonly tipo: "seleccion" | "grupo";
      readonly clave: string;
      readonly etiqueta: TextoFijo;
      readonly ayuda?: TextoFijo;
      readonly obligatorio: boolean;
      readonly opciones: readonly OpcionDeCampo[];
    }
  | {
      readonly tipo: "casilla";
      readonly clave: string;
      readonly etiqueta: TextoFijo;
      readonly ayuda?: TextoFijo;
      readonly obligatorio: boolean;
    };

export type ValorDeCampo = string | boolean;
export type ValoresDeFormulario = Readonly<Record<string, ValorDeCampo>>;
export type ErrorLocal = { readonly campo: string; readonly codigo: CodigoDeError };

// --- textos fijos -----------------------------------------------------------------------------

function hojas(valor: unknown, salida: Set<string>): void {
  if (typeof valor === "string") salida.add(valor);
  else if (typeof valor === "object" && valor !== null) {
    for (const v of Object.values(valor)) hojas(v, salida);
  }
}
const TEXTOS_FIJOS: ReadonlySet<string> = (() => {
  const s = new Set<string>();
  hojas(TEXTOS, s);
  return s;
})();

/** `true` si la cadena es exactamente uno de los textos fijos de `TEXTOS`. */
export function esTextoFijo(valor: unknown): valor is TextoFijo {
  return typeof valor === "string" && TEXTOS_FIJOS.has(valor);
}

// --- lectura de los campos --------------------------------------------------------------------

const CLAVE_DE_CAMPO = /^[a-z][a-z0-9_]{0,31}$/;

function propio(objeto: object, clave: string): unknown {
  return Object.hasOwn(objeto, clave) ? (objeto as Record<string, unknown>)[clave] : undefined;
}

function deLaLista<T extends string>(lista: readonly T[], valor: unknown): T | null {
  return typeof valor === "string" ? (lista.find((x) => x === valor) ?? null) : null;
}

function leerLongitud(valor: unknown): number {
  if (typeof valor !== "number" || !Number.isInteger(valor) || valor < 1) {
    return LONGITUD_POR_DEFECTO;
  }
  return Math.min(valor, LONGITUD_TOPE);
}

function leerOpciones(bruto: unknown): readonly OpcionDeCampo[] {
  if (!Array.isArray(bruto)) return [];
  const vistas = new Set<string>();
  const salida: OpcionDeCampo[] = [];
  for (const o of bruto as unknown[]) {
    if (typeof o !== "object" || o === null || Array.isArray(o)) continue;
    const valor = propio(o, "valor");
    if (typeof valor !== "string" || valor === "" || vistas.has(valor)) continue;
    if (!CLAVE_DE_CAMPO.test(valor)) continue;
    vistas.add(valor);
    const etiqueta = propio(o, "etiqueta");
    salida.push(
      Object.freeze({
        valor,
        etiqueta: esTextoFijo(etiqueta) ? etiqueta : TEXTOS.formulario.opcionSinNombre,
      }),
    );
  }
  return Object.freeze(salida);
}

/** Lee la definición de los campos. Lo que no encaja no se pinta (artículo 3). */
export function leerCampos(bruto: unknown): readonly CampoLeido[] {
  if (!Array.isArray(bruto)) return [];
  const claves = new Set<string>();
  const salida: CampoLeido[] = [];
  for (const c of bruto as unknown[]) {
    if (typeof c !== "object" || c === null || Array.isArray(c)) continue;
    const clave = propio(c, "clave");
    const tipo = deLaLista(TIPOS_DE_CAMPO, propio(c, "tipo"));
    if (typeof clave !== "string" || !CLAVE_DE_CAMPO.test(clave) || tipo === null) continue;
    if (claves.has(clave)) continue;
    const etiquetaBruta = propio(c, "etiqueta");
    const ayudaBruta = propio(c, "ayuda");
    const comun = {
      clave,
      etiqueta: esTextoFijo(etiquetaBruta) ? etiquetaBruta : TEXTOS.formulario.campoSinNombre,
      ...(esTextoFijo(ayudaBruta) ? { ayuda: ayudaBruta } : {}),
      obligatorio: propio(c, "obligatorio") === true,
    };
    let leido: CampoLeido;
    if (tipo === "texto" || tipo === "busqueda") {
      leido = {
        ...comun,
        tipo,
        longitudMaxima: leerLongitud(propio(c, "longitudMaxima")),
        autocompletar: deLaLista(AUTOCOMPLETADOS, propio(c, "autocompletar")) ?? "off",
      };
    } else if (tipo === "texto_largo") {
      leido = {
        ...comun,
        tipo,
        longitudMaxima: leerLongitud(propio(c, "longitudMaxima")),
        autocompletar: "off",
      };
    } else if (tipo === "seleccion" || tipo === "grupo") {
      const opciones = leerOpciones(propio(c, "opciones"));
      if (opciones.length === 0) continue;
      leido = { ...comun, tipo, opciones };
    } else {
      leido = { ...comun, tipo };
    }
    claves.add(clave);
    salida.push(Object.freeze(leido));
  }
  return Object.freeze(salida);
}

// --- valores ----------------------------------------------------------------------------------

export function valoresIniciales(campos: readonly CampoLeido[]): ValoresDeFormulario {
  return Object.freeze(
    Object.fromEntries(
      campos.map((c): [string, ValorDeCampo] => [c.clave, c.tipo === "casilla" ? false : ""]),
    ),
  );
}

/** Lee lo que llega de un control: un valor de otro tipo o fuera de las opciones queda vacío. */
export function leerValor(campo: CampoLeido, bruto: unknown): ValorDeCampo {
  if (campo.tipo === "casilla") return bruto === true;
  if (typeof bruto !== "string") return "";
  if (campo.tipo === "seleccion" || campo.tipo === "grupo") {
    return campo.opciones.some((o) => o.valor === bruto) ? bruto : "";
  }
  return bruto;
}

// --- validación -------------------------------------------------------------------------------

function valorDe(valores: ValoresDeFormulario, campo: CampoLeido): ValorDeCampo {
  const v = propio(valores, campo.clave);
  return campo.tipo === "casilla" ? v === true : typeof v === "string" ? v : "";
}

/** Errores de validación, uno como mucho por campo, en el orden de los campos. */
export function validarCampos(
  campos: readonly CampoLeido[],
  valores: ValoresDeFormulario,
): readonly ErrorLocal[] {
  const errores: ErrorLocal[] = [];
  for (const campo of campos) {
    const valor = valorDe(valores, campo);
    if (campo.tipo === "casilla") {
      if (campo.obligatorio && valor !== true)
        errores.push({ campo: campo.clave, codigo: "sin_marcar" });
      continue;
    }
    const texto = typeof valor === "string" ? valor : "";
    if (campo.tipo === "seleccion" || campo.tipo === "grupo") {
      if (texto === "") {
        if (campo.obligatorio) errores.push({ campo: campo.clave, codigo: "obligatorio" });
      } else if (!campo.opciones.some((o) => o.valor === texto)) {
        errores.push({ campo: campo.clave, codigo: "opcion_no_valida" });
      }
      continue;
    }
    if (campo.obligatorio && texto.trim() === "") {
      errores.push({ campo: campo.clave, codigo: "obligatorio" });
    } else if ("longitudMaxima" in campo && texto.length > campo.longitudMaxima) {
      errores.push({ campo: campo.clave, codigo: "demasiado_largo" });
    }
  }
  return errores;
}

// --- errores del servidor ---------------------------------------------------------------------

export type ErroresRepartidos = {
  /** Códigos por clave de campo (objeto sin prototipo). */
  readonly porCampo: Readonly<Record<string, readonly CodigoDeError[]>>;
  /** Cuántos errores no se pueden atribuir a un campo del formulario. */
  readonly generales: number;
};

function esCodigoConTexto(codigo: string): codigo is CodigoDeError {
  return Object.hasOwn(TEXTOS.formulario.errores, codigo);
}

/** Reparte los errores de `leerResultadoAccion` entre los campos pintados. Un campo que no está en
 * el formulario o un código sin texto fijo es un error general (regla V-6). */
export function repartirErrores(
  errores: readonly ErrorDeCampo[],
  campos: readonly CampoLeido[],
): ErroresRepartidos {
  const porCampo: Record<string, CodigoDeError[]> = Object.create(null) as Record<
    string,
    CodigoDeError[]
  >;
  let generales = 0;
  for (const e of errores) {
    const campo = e.campo !== null ? campos.find((c) => c.clave === e.campo) : undefined;
    if (campo === undefined || e.codigo === null || !esCodigoConTexto(e.codigo)) {
      generales += 1;
      continue;
    }
    const lista = (porCampo[campo.clave] ??= []);
    if (!lista.includes(e.codigo)) lista.push(e.codigo);
  }
  return { porCampo, generales };
}

// --- textos compuestos ------------------------------------------------------------------------

export function resumenDeErrores(cuantos: number): string {
  if (!Number.isInteger(cuantos) || cuantos < 1) return "";
  if (cuantos === 1) return TEXTOS.formulario.resumenUno;
  return `${TEXTOS.formulario.resumenAntes} ${formatearNumero(cuantos)} ${TEXTOS.formulario.resumenDespues}`;
}

export function textoDeLimite(longitud: number): string {
  return `${TEXTOS.formulario.limiteAntes} ${formatearNumero(longitud)} ${TEXTOS.formulario.limiteDespues}`;
}

/** Valor de `aria-describedby`: ayuda, límite y error, en ese orden, solo los que hay. */
export function descripcionDe(
  id: string,
  hay: { readonly ayuda: boolean; readonly limite: boolean; readonly errores: boolean },
): string | undefined {
  const ids = [
    hay.ayuda ? `${id}-ayuda` : null,
    hay.limite ? `${id}-limite` : null,
    hay.errores ? `${id}-error` : null,
  ].filter((x): x is string => x !== null);
  return ids.length === 0 ? undefined : ids.join(" ");
}

function motivoConTexto(motivo: string): string {
  return Object.hasOwn(TEXTOS.acciones.motivosDeRechazo, motivo)
    ? (TEXTOS.acciones.motivosDeRechazo as Record<string, string>)[motivo]!
    : "";
}

export type VistaDelResultadoDeFormulario = {
  /** Texto fijo que se ve y se anuncia, o `null` si no hay resultado que decir. */
  readonly mensaje: string | null;
  /** Solo con resultado incierto: botón que relee el estado real. */
  readonly ofrecerComprobar: boolean;
};

/** Qué se dice tras el resultado de un envío. `generales` es el número de errores que no se
 * pudieron atribuir a un campo. Nada de lo recibido llega aquí como texto. */
export function presentarResultadoDeFormulario(
  lectura: LecturaDeAccion | null,
  generales: number,
): VistaDelResultadoDeFormulario {
  if (lectura === null) return { mensaje: null, ofrecerComprobar: false };
  switch (lectura.resultado) {
    case "hecha":
      return { mensaje: TEXTOS.acciones.resultado.hecha, ofrecerComprobar: false };
    case "rechazada": {
      const partes = [TEXTOS.acciones.resultado.rechazada, motivoConTexto(lectura.motivo)];
      if (generales > 0) partes.push(TEXTOS.formulario.errorGeneral);
      return { mensaje: partes.filter((p) => p !== "").join(" "), ofrecerComprobar: false };
    }
    case "no_permitida":
      return { mensaje: TEXTOS.acciones.noPermitida, ofrecerComprobar: false };
    default:
      return { mensaje: TEXTOS.acciones.resultado.incierta, ofrecerComprobar: true };
  }
}
