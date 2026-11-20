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

const ENTORNOS: readonly string[] = ["desarrollo", "preproduccion", "produccion"];
const ENTORNOS_VERCEL: readonly string[] = ["production", "preview", "development"];
const RE_COMMIT = /^[0-9a-f]{7,40}$/i;
const RE_REGION = /^[a-z]{3}[0-9]$/;
const RE_HOST = /^[a-z0-9.-]{1,253}$/i;
// Forma exacta de un DSN de Sentry en la UE: clave pública de 32 hex, organización y proyecto.
const RE_DSN = /^https:\/\/[0-9a-f]{32}@o[0-9]+\.ingest\.de\.sentry\.io\/[0-9]+$/;

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
