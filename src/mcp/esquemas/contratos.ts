import Ajv2020 from "ajv/dist/2020.js";
import { ErrorDeAplicacion } from "../../lib/plataforma/errores";
import confirmarOrden from "../../../contratos/confirmar-orden.schema.json";
import enviarInforme from "../../../contratos/enviar-informe.schema.json";
import informe from "../../../contratos/informe.schema.json";
import obtenerInstrucciones from "../../../contratos/obtener-instrucciones.schema.json";

// Contratos de `contratos/` como única fuente (skill herramienta-mcp): la validación del servidor y
// lo que se publica en el listado salen de aquí. Ajv 2020-12 estricto: una palabra clave desconocida
// no compila. Los errores de validación no salen de este módulo (podrían llevar valores): solo un
// booleano.

export const HERRAMIENTAS = ["obtener_instrucciones", "enviar_informe", "confirmar_orden"] as const;
export type Herramienta = (typeof HERRAMIENTAS)[number];

type Json = Record<string, unknown>;
export type Validador = (datos: unknown) => boolean;

const CONTRATOS: Record<Herramienta, Json> = {
  obtener_instrucciones: obtenerInstrucciones,
  enviar_informe: enviarInforme,
  confirmar_orden: confirmarOrden,
};
const CONTRATO_INFORME: Json = informe;

// Anotaciones propias de los contratos vigentes; no se interpretan aquí, se publican tal cual.
const PALABRAS_X = ["x-anotaciones", "x-cuestion-abierta", "x-version-esquema"];
// Claves que no se publican: el cliente no necesita el dialecto, el identificador ni la versión.
const NO_PUBLICADAS = ["$schema", "$id", "x-version-esquema"];
const RE_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Ajv propio de la función: estricto, sin ajv-formats (el único formato es `uuid`), sin coerción,
// sin valores por defecto y sin eliminar campos (el descarte es previo y lo cuenta el servidor).
export function crearAjv(): Ajv2020 {
  const ajv = new Ajv2020({
    strict: true,
    allErrors: false,
    coerceTypes: false,
    useDefaults: false,
    removeAdditional: false,
  });
  ajv.addFormat("uuid", { type: "string", validate: (valor: string) => RE_UUID.test(valor) });
  for (const palabra of PALABRAS_X) ajv.addKeyword(palabra);
  return ajv;
}

// Ninguna herramienta es de solo lectura (AR-01, ADR-0007 punto 11): si un contrato lo declara, el
// módulo no carga y el conector no arranca (cierre en fallo, MAYOR-3).
for (const h of HERRAMIENTAS) {
  const anotaciones = CONTRATOS[h]["x-anotaciones"] as Json | undefined;
  if (anotaciones?.readOnlyHint !== false) throw new ErrorDeAplicacion("error_no_controlado");
}

const ajv = crearAjv();
ajv.addSchema(CONTRATO_INFORME);
for (const h of HERRAMIENTAS) ajv.addSchema(CONTRATOS[h]);

// Un único punto de compilación: `getSchema` sobre el contrato ya registrado (resuelve su $ref).
function compilar(contrato: Json, ruta: string): Validador {
  const validar = ajv.getSchema(`${String(contrato.$id)}${ruta}`);
  if (validar === undefined) throw new ErrorDeAplicacion("error_no_controlado");
  return (datos) => validar(datos) === true;
}

const entradas = new Map<Herramienta, Validador>();
const salidas = new Map<Herramienta, Validador>();
for (const h of HERRAMIENTAS) {
  entradas.set(h, compilar(CONTRATOS[h], "#/properties/entrada"));
  salidas.set(h, compilar(CONTRATOS[h], "#/properties/salida"));
}

export function validarEntrada(herramienta: Herramienta): Validador {
  const v = entradas.get(herramienta);
  if (v === undefined) throw new ErrorDeAplicacion("error_no_controlado");
  return v;
}

// Coherencia que el esquema no expresa (MENOR-3): sin estado «activa» no hay instrucciones, y con
// «suspendida» tampoco orden.
function coherente(datos: unknown): boolean {
  if (datos === null || typeof datos !== "object") return false;
  const d = datos as Json;
  if (d.estado === "activa" && d.instrucciones === null) return false;
  if (d.estado !== "activa" && d.instrucciones !== null) return false;
  if (d.estado === "suspendida" && d.orden !== null) return false;
  return true;
}

export function validarSalida(herramienta: Herramienta): Validador {
  const v = salidas.get(herramienta);
  if (v === undefined) throw new ErrorDeAplicacion("error_no_controlado");
  if (herramienta !== "obtener_instrucciones") return v;
  return (datos) => v(datos) && coherente(datos);
}

export const validarInforme: Validador = compilar(CONTRATO_INFORME, "");

// Copia profunda sin las claves no publicadas y con la referencia al informe resuelta.
function publicar(valor: unknown): unknown {
  if (Array.isArray(valor)) return valor.map(publicar);
  if (valor === null || typeof valor !== "object") return valor;
  const objeto = valor as Json;
  if (typeof objeto.$ref === "string") {
    if (objeto.$ref !== CONTRATO_INFORME.$id) throw new ErrorDeAplicacion("error_no_controlado");
    return publicar(CONTRATO_INFORME);
  }
  return Object.fromEntries(
    Object.entries(objeto)
      .filter(([clave]) => !NO_PUBLICADAS.includes(clave))
      .map(([clave, v]) => [clave, publicar(v)]),
  );
}

export interface HerramientaPublicada {
  readonly name: string;
  readonly description: string;
  readonly inputSchema: Json;
  readonly outputSchema: Json;
  readonly annotations: Json;
}

// Lo que se publica en `tools/list`: título, descripción, anotaciones y los dos esquemas, tal como
// están en el contrato y sin $schema, $id ni x-version-esquema. Una copia nueva en cada llamada.
export function contratoPublicado(herramienta: Herramienta): HerramientaPublicada {
  const contrato = CONTRATOS[herramienta];
  const propiedades = contrato.properties as Json;
  return {
    name: String(contrato.title),
    description: String(contrato.description),
    inputSchema: publicar(propiedades.entrada) as Json,
    outputSchema: publicar(propiedades.salida) as Json,
    annotations: publicar(contrato["x-anotaciones"]) as Json,
  };
}
