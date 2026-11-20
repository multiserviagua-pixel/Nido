import type { Codigo } from "../registro/codigos";
import { ErrorDeAplicacion } from "./errores";

// Único lector de process.env (diseño §App base «Configuración», RD-066).
// Lista cerrada, sin valores por defecto. Los errores llevan el código y los NOMBRES de las
// variables defectuosas, nunca sus valores (art. 1).

export const NOMBRES_CONFIGURACION = [
  "ENTORNO",
  "SUPERVISION_DSN",
  "COMMIT_DESPLEGADO",
  "VERCEL",
  "VERCEL_ENV",
  "VERCEL_REGION",
  "VERCEL_URL",
  "NODE_ENV",
] as const;

// Grupo «conector» (función 001, diseño §Configuración, C-1): lo validan solo las rutas del
// conector, nunca /api/salud. Sin valores por defecto.
export const NOMBRES_CONECTOR = [
  "URL_PUBLICA",
  "CONECTOR_SECRETO",
  "CONECTOR_BD_URL",
  "AUTORIZACION_BD_URL",
  "OPERACION_HUELLA",
] as const;

// Solo existen en la máquina de pruebas (PRUEBA-008, contra la base real). La aplicación no las
// lee ni las valida; figuran aquí para que `.env.example` y `entornos.md` las cubran.
export const NOMBRES_SOLO_MAQUINA = [
  "PRUEBAS_CONECTOR_BD_URL",
  "PRUEBAS_AUTORIZACION_BD_URL",
] as const;

export type NombreConfiguracion = (typeof NOMBRES_CONFIGURACION)[number];
export type Entorno = "desarrollo" | "preproduccion" | "produccion";
type Fuente = Readonly<Record<string, string | undefined>>;

export interface Configuracion {
  readonly entorno: Entorno;
  readonly supervisionDsn: string | undefined;
  readonly commitDesplegado: string | undefined;
  readonly vercel: string | undefined;
  readonly vercelEnv: string | undefined;
  readonly vercelRegion: string | undefined;
  readonly vercelUrl: string | undefined;
}

export type Resultado =
  | { readonly ok: true; readonly valor: Configuracion }
  | {
      readonly ok: false;
      readonly codigo: Extract<Codigo, "configuracion_invalida">;
      readonly variables: readonly NombreConfiguracion[];
    };

export type NombreConector = (typeof NOMBRES_CONECTOR)[number];

export interface ConfiguracionConector {
  readonly urlPublica: string;
  readonly secreto: string;
  readonly conectorBdUrl: string;
  readonly autorizacionBdUrl: string;
  readonly operacionHuella: string;
}

export type ResultadoConector =
  | { readonly ok: true; readonly valor: ConfiguracionConector }
  | {
      readonly ok: false;
      readonly codigo: Extract<Codigo, "configuracion_conector_invalida">;
      readonly variables: readonly NombreConector[];
    };

const ENTORNOS: readonly string[] = ["desarrollo", "preproduccion", "produccion"];
const ENTORNOS_VERCEL: readonly string[] = ["production", "preview", "development"];
const RE_COMMIT = /^[0-9a-f]{7,40}$/i;
const RE_REGION = /^[a-z]{3}[0-9]$/;
const RE_HOST = /^[a-z0-9.-]{1,253}$/i;
// Forma exacta de un DSN de Sentry en la UE: clave pública de 32 hex, organización y proyecto.
// Grupos: clave, host, proyecto (los usa supervision.ts; una sola copia).
export const RE_DSN = /^https:\/\/([0-9a-f]{32})@(o[0-9]+\.ingest\.de\.sentry\.io)\/([0-9]+)$/;

// Único predicado de «desarrollo» (validación y cierre en fallo): ENTORNO=desarrollo, NODE_ENV
// distinto de production y ninguna variable VERCEL* con valor. Ausente o ilegible: no.
function predicadoDesarrollo(fuente: Fuente): boolean {
  if (fuente.ENTORNO !== "desarrollo") return false;
  if (fuente.NODE_ENV === "production") return false;
  return !Object.keys(fuente).some(
    (n) => n.startsWith("VERCEL") && fuente[n] !== undefined && fuente[n] !== "",
  );
}

// Valida la fuente que se le pasa (no lee process.env; el llamador la construye). Solo mira
// los ocho nombres.
export function validarConfiguracion(fuente: Fuente): Resultado {
  const malas: NombreConfiguracion[] = [];
  const v = (n: NombreConfiguracion): string | undefined => {
    const valor = fuente[n];
    return valor === undefined || valor === "" ? undefined : valor;
  };

  const entornoBruto = v("ENTORNO");
  const entornoValido = entornoBruto !== undefined && ENTORNOS.includes(entornoBruto);
  if (!entornoValido) malas.push("ENTORNO");
  const entorno = (entornoValido ? entornoBruto : "produccion") as Entorno;
  const enDesarrollo = entornoValido && predicadoDesarrollo(fuente);
  const fueraDeDesarrollo = !enDesarrollo;

  // Fuera de desarrollo son obligatorias; en desarrollo, opcionales pero bien formadas.
  const dsn = v("SUPERVISION_DSN");
  if (dsn === undefined ? fueraDeDesarrollo : !RE_DSN.test(dsn)) malas.push("SUPERVISION_DSN");
  const commit = v("COMMIT_DESPLEGADO");
  if (commit === undefined ? fueraDeDesarrollo : !RE_COMMIT.test(commit)) {
    malas.push("COMMIT_DESPLEGADO");
  }

  const vercel = v("VERCEL");
  // Fuera de desarrollo, VERCEL y VERCEL_ENV son obligatorias; VERCEL_URL no.
  if (vercel === undefined ? fueraDeDesarrollo : vercel !== "1") malas.push("VERCEL");
  const vercelEnv = v("VERCEL_ENV");
  if (vercelEnv === undefined ? fueraDeDesarrollo : !ENTORNOS_VERCEL.includes(vercelEnv)) {
    malas.push("VERCEL_ENV");
  }
  const region = v("VERCEL_REGION");
  if (region !== undefined && !RE_REGION.test(region)) malas.push("VERCEL_REGION");
  const url = v("VERCEL_URL");
  if (url !== undefined && (!RE_HOST.test(url) || url.startsWith(".") || url.startsWith("-"))) {
    malas.push("VERCEL_URL");
  }

  // `desarrollo` solo vale si el predicado único lo admite (sin VERCEL*, NODE_ENV != production).
  if (entornoValido && entorno === "desarrollo" && !enDesarrollo && !malas.includes("ENTORNO")) {
    malas.push("ENTORNO");
  }

  if (malas.length > 0) {
    return { ok: false, codigo: "configuracion_invalida", variables: malas };
  }
  return {
    ok: true,
    valor: {
      entorno,
      supervisionDsn: dsn,
      commitDesplegado: commit,
      vercel,
      vercelEnv,
      vercelRegion: region,
      vercelUrl: url,
    },
  };
}

// Lee process.env (solo los ocho nombres) y lanza `configuracion_invalida` si no vale.
export function cargarConfiguracion(): Configuracion {
  const fuente: Record<string, string | undefined> = {};
  for (const nombre of NOMBRES_CONFIGURACION) fuente[nombre] = process.env[nombre];
  const resultado = validarConfiguracion(fuente);
  if (!resultado.ok) throw new ErrorDeAplicacion(resultado.codigo);
  return resultado.valor;
}

// Entorno para el cierre en fallo: ausente o ilegible cuenta como no desarrollo. Mismo predicado
// que validarConfiguracion, sobre todo process.env (cualquier VERCEL* presente invalida desarrollo).
export function esDesarrollo(): boolean {
  return predicadoDesarrollo(process.env);
}

// --- Grupo «conector» ------------------------------------------------------------------------

const RE_ORIGEN_HTTPS = /^https:\/\/([a-z0-9.-]{1,253})$/;
const ORIGEN_LOCAL = "http://localhost";
const RE_PUERTO = /^[1-9][0-9]{0,4}$/;
const RE_HUELLA = /^[0-9a-f]{64}$/;
// Secreto del conector: 43 a 128 caracteres base64url con al menos 16 distintos. Se genera con
// `randomBytes(32).toString("base64url")`; una frase o un valor repetido no vale (MAYOR-1).
const RE_SECRETO = /^[A-Za-z0-9_-]{43,128}$/;
export function secretoAceptable(s: string): boolean {
  return RE_SECRETO.test(s) && new Set(s).size >= 16;
}
const PUERTO_PREPRODUCCION = "6543";

// URL del agrupador: usuario `rol` o `rol.referencia`, contraseña, host, puerto y base. Sin consulta
// ni fragmento (postgres.js enviaría la consulta al arrancar, N-3): `ssl` solo por código.
const RE_BD =
  /^postgres(?:ql)?:\/\/([^\s@/?#:]+):[^\s@/?#:]+@[a-z0-9.-]{1,253}:([0-9]{1,5})\/[A-Za-z0-9_]{1,63}$/;
const RE_REFERENCIA = /^[a-z0-9]{1,64}$/;

// Usuario exactamente `rol` o `rol.referencia`: cada variable solo admite su propio rol.
// En preproducción el puerto es el del agrupador (6543); en local, el que sea.
function urlBdDeRol(url: string, rol: string, puerto?: string): boolean {
  const partes = RE_BD.exec(url);
  const usuario = partes?.[1];
  if (usuario === undefined) return false;
  if (puerto !== undefined && partes?.[2] !== puerto) return false;
  return (
    usuario === rol ||
    (usuario.startsWith(`${rol}.`) && RE_REFERENCIA.test(usuario.slice(rol.length + 1)))
  );
}

function origenLocalValido(url: string): boolean {
  if (url === ORIGEN_LOCAL) return true;
  if (!url.startsWith(`${ORIGEN_LOCAL}:`)) return false;
  const puerto = url.slice(ORIGEN_LOCAL.length + 1);
  return RE_PUERTO.test(puerto) && Number(puerto) <= 65535;
}

function origenHttpsValido(url: string): boolean {
  const host = RE_ORIGEN_HTTPS.exec(url)?.[1];
  return host !== undefined && !/^[.-]|[.-]$/.test(host) && !host.includes("..");
}

// Valida la fuente que se le pasa. Cierre en fallo: sin `ENTORNO` válido, en producción o con el
// predicado de desarrollo incumplido no vale, y la lista de variables queda vacía (no se leen).
// Los errores llevan nombres, nunca valores.
export function validarConfiguracionConector(fuente: Fuente): ResultadoConector {
  const cerrado: ResultadoConector = {
    ok: false,
    codigo: "configuracion_conector_invalida",
    variables: [],
  };
  const entorno = fuente.ENTORNO;
  const enDesarrollo = entorno === "desarrollo" && predicadoDesarrollo(fuente);
  // Preproducción solo vale en la plataforma: VERCEL=1 y VERCEL_ENV production o preview, nunca development (MAYOR-2).
  const enPreproduccion =
    entorno === "preproduccion" &&
    fuente.VERCEL === "1" &&
    (fuente.VERCEL_ENV === "production" || fuente.VERCEL_ENV === "preview");
  if (!enDesarrollo && !enPreproduccion) return cerrado;
  const puertoBd = enPreproduccion ? PUERTO_PREPRODUCCION : undefined;

  const v = (n: NombreConector): string | undefined => {
    const valor = fuente[n];
    return valor === undefined || valor === "" ? undefined : valor;
  };
  const malas: NombreConector[] = [];

  const url = v("URL_PUBLICA");
  if (url === undefined || !(enDesarrollo ? origenLocalValido(url) : origenHttpsValido(url))) {
    malas.push("URL_PUBLICA");
  }
  const secreto = v("CONECTOR_SECRETO");
  if (secreto === undefined || !secretoAceptable(secreto)) {
    malas.push("CONECTOR_SECRETO");
  }
  const bdMcp = v("CONECTOR_BD_URL");
  if (bdMcp === undefined || !urlBdDeRol(bdMcp, "conector_prueba_mcp", puertoBd))
    malas.push("CONECTOR_BD_URL");
  const bdGestion = v("AUTORIZACION_BD_URL");
  if (bdGestion === undefined || !urlBdDeRol(bdGestion, "conector_prueba_gestion", puertoBd)) {
    malas.push("AUTORIZACION_BD_URL");
  }
  const huella = v("OPERACION_HUELLA");
  if (huella === undefined || !RE_HUELLA.test(huella)) malas.push("OPERACION_HUELLA");

  if (
    malas.length > 0 ||
    url === undefined ||
    secreto === undefined ||
    bdMcp === undefined ||
    bdGestion === undefined ||
    huella === undefined
  ) {
    return { ok: false, codigo: "configuracion_conector_invalida", variables: malas };
  }
  return {
    ok: true,
    valor: construirConfiguracionConector(url, secreto, bdMcp, bdGestion, huella),
  };
}

// El secreto y las dos URL con credenciales no son enumerables: ni JSON.stringify, ni el
// registro, ni un volcado del objeto los muestran (MENOR-8). Se leen por su nombre.
function construirConfiguracionConector(
  urlPublica: string,
  secreto: string,
  conectorBdUrl: string,
  autorizacionBdUrl: string,
  operacionHuella: string,
): ConfiguracionConector {
  const config = { urlPublica, operacionHuella } as Record<string, unknown>;
  const oculto = (nombre: string, valor: unknown): void => {
    Object.defineProperty(config, nombre, { value: valor, enumerable: false });
  };
  oculto("secreto", secreto);
  oculto("conectorBdUrl", conectorBdUrl);
  oculto("autorizacionBdUrl", autorizacionBdUrl);
  oculto("toJSON", () => ({ urlPublica, operacionHuella }));
  return config as unknown as ConfiguracionConector;
}

// Lo llaman solo las rutas del conector. Con `ENTORNO` distinto de desarrollo y preproducción no
// lee las variables del grupo. Lanza `configuracion_conector_invalida` si no valen (C-1).
export function cargarConfiguracionConector(): ConfiguracionConector {
  const fuente: Record<string, string | undefined> = {};
  for (const nombre of NOMBRES_CONFIGURACION) fuente[nombre] = process.env[nombre];
  // Mismo criterio que `esDesarrollo`: cualquier VERCEL* presente cuenta (MAYOR-2).
  for (const nombre of Object.keys(process.env)) {
    if (nombre.startsWith("VERCEL")) fuente[nombre] = process.env[nombre];
  }
  if (fuente.ENTORNO === "desarrollo" || fuente.ENTORNO === "preproduccion") {
    for (const nombre of NOMBRES_CONECTOR) fuente[nombre] = process.env[nombre];
  }
  const resultado = validarConfiguracionConector(fuente);
  if (!resultado.ok) throw new ErrorDeAplicacion(resultado.codigo);
  return resultado.valor;
}
