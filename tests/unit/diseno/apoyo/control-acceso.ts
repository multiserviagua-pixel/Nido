// Casos y clasificación de PRUEBA-024 (controles 1 y 2 de la muestra). Aquí no hay estado de
// Vitest: solo los datos y las funciones puras. Las ejecuta `acceso-muestra.test.ts`.
import { existsSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

// ------------------------------------------------------------------ control 1 (compilación)

/** Los cinco valores de `ENTORNO` de PRUEBA-024 con los que la muestra no debe entrar. */
export const ENTORNOS_QUE_CIERRAN: ReadonlyArray<string | undefined> = [
  "produccion",
  "Produccion",
  "produccion ",
  "prod",
  undefined,
];
/** Valores que tampoco la abren: solo `desarrollo` y `preproduccion`, exactos (artículo 3). */
export const ENTORNOS_EXTRA_QUE_CIERRAN: ReadonlyArray<string> = [
  "",
  "Desarrollo",
  "desarrollo ",
  " preproduccion",
  "PREPRODUCCION",
  "test",
];
export const ENTORNOS_QUE_ABREN: readonly string[] = ["desarrollo", "preproduccion"];

export const EXTENSION_DE_LA_MUESTRA = "muestra.tsx";

export type CargaDeConfiguracion = (
  entorno: string | undefined,
) => Promise<readonly string[] | undefined>;

export const abreLaMuestra = (extensiones: readonly string[] | undefined): boolean =>
  extensiones?.some((e) => e === EXTENSION_DE_LA_MUESTRA || e.includes("muestra")) ?? false;

export async function evaluarControl1(
  cargar: CargaDeConfiguracion,
  conPositivo: boolean,
): Promise<string[]> {
  const fallos: string[] = [];
  for (const e of [...ENTORNOS_QUE_CIERRAN, ...ENTORNOS_EXTRA_QUE_CIERRAN]) {
    if (abreLaMuestra(await cargar(e))) {
      fallos.push(`ENTORNO=${JSON.stringify(e)} abre la muestra en la compilación`);
    }
  }
  if (conPositivo) {
    for (const e of ENTORNOS_QUE_ABREN) {
      if (!abreLaMuestra(await cargar(e))) fallos.push(`ENTORNO=${e} no abre la muestra`);
    }
  }
  return fallos;
}

const ESPECIALES =
  /^(page|layout|route|template|default|loading|error|not-found|global-error)\.(tsx|ts|jsx|js|mjs)$/;

/** Archivos de la muestra que serían ruta en cualquier compilación (sin la extensión `muestra.tsx`). */
export function archivosDeRutaSinExtensionDeLaMuestra(raiz: string): string[] {
  const salida: string[] = [];
  const recorrer = (carpeta: string, relativa: string): void => {
    if (!existsSync(carpeta)) return;
    for (const nombre of readdirSync(carpeta)) {
      const completa = join(carpeta, nombre);
      const rel = `${relativa}/${nombre}`;
      if (statSync(completa).isDirectory()) recorrer(completa, rel);
      else if (ESPECIALES.test(nombre)) salida.push(rel);
    }
  };
  recorrer(join(raiz, "src", "app", "muestra"), "src/app/muestra");
  return salida.sort();
}

// ------------------------------------------------------------------ control 2 (cada petición)

export type CasoDeAcceso = {
  nombre: string;
  host?: string;
  reenviado?: string;
  entorno: string | undefined;
  abierta: boolean;
};

const PRODUCCION = "app.nido-produccion.example";

export const CASOS_DE_ACCESO: readonly CasoDeAcceso[] = [
  // Control positivo: en local y en preproducción la muestra se ve.
  {
    nombre: "localhost con puerto, desarrollo",
    host: "localhost:3000",
    entorno: "desarrollo",
    abierta: true,
  },
  {
    nombre: "127.0.0.1 con puerto, desarrollo",
    host: "127.0.0.1:3000",
    entorno: "desarrollo",
    abierta: true,
  },
  {
    nombre: "localhost sin puerto, preproduccion",
    host: "localhost",
    entorno: "preproduccion",
    abierta: true,
  },
  {
    nombre: "127.0.0.1 sin puerto, preproduccion",
    host: "127.0.0.1",
    entorno: "preproduccion",
    abierta: true,
  },
  {
    nombre: "X-Forwarded-Host no se lee: Host de la lista y reenviado de producción",
    host: "localhost",
    reenviado: PRODUCCION,
    entorno: "desarrollo",
    abierta: true,
  },
  // Nombre de servidor: producción, desconocido, ausente y trucos de comparación.
  { nombre: "nombre de producción", host: PRODUCCION, entorno: "preproduccion", abierta: false },
  {
    nombre: "nombre de producción con ENTORNO=desarrollo",
    host: PRODUCCION,
    entorno: "desarrollo",
    abierta: false,
  },
  {
    nombre: "nombre desconocido",
    host: "desconocido.invalid",
    entorno: "preproduccion",
    abierta: false,
  },
  { nombre: "sin cabecera Host", entorno: "preproduccion", abierta: false },
  { nombre: "Host vacío", host: "", entorno: "preproduccion", abierta: false },
  {
    nombre: "localhost como subdominio de otro",
    host: "localhost.example.com",
    entorno: "desarrollo",
    abierta: false,
  },
  { nombre: "localhost como sufijo", host: "mi-localhost", entorno: "desarrollo", abierta: false },
  {
    nombre: "127.0.0.1 como prefijo",
    host: "127.0.0.1.example.com",
    entorno: "desarrollo",
    abierta: false,
  },
  {
    nombre: "localhost con credenciales delante",
    host: "localhost@desconocido.invalid",
    entorno: "desarrollo",
    abierta: false,
  },
  {
    nombre: "dominio ajeno bajo pre-nido",
    host: "pre-nido.dominio-ajeno.invalid",
    entorno: "preproduccion",
    abierta: false,
  },
  // X-Forwarded-Host falsificado: no se lee.
  {
    nombre: "Host de producción y X-Forwarded-Host localhost",
    host: PRODUCCION,
    reenviado: "localhost",
    entorno: "preproduccion",
    abierta: false,
  },
  {
    nombre: "sin Host y X-Forwarded-Host localhost",
    reenviado: "localhost",
    entorno: "desarrollo",
    abierta: false,
  },
  {
    nombre: "Host desconocido y X-Forwarded-Host 127.0.0.1",
    host: "desconocido.invalid",
    reenviado: "127.0.0.1",
    entorno: "desarrollo",
    abierta: false,
  },
  // ENTORNO desconocido al servir, con el nombre correcto.
  ...[...ENTORNOS_QUE_CIERRAN, ...ENTORNOS_EXTRA_QUE_CIERRAN].map((entorno): CasoDeAcceso => ({
    nombre: `localhost con ENTORNO=${JSON.stringify(entorno)} al servir`,
    host: "localhost:3000",
    entorno,
    abierta: false,
  })),
];

export type Resultado = "abierta" | "cerrada" | `error inesperado: ${string}`;

const DIGEST_404 = "NEXT_HTTP_ERROR_FALLBACK;404";

export function esNoEncontrado(e: unknown): boolean {
  return typeof e === "object" && e !== null && (e as { digest?: unknown }).digest === DIGEST_404;
}

/** Una página o un layout: «cerrada» es responder como recurso inexistente (`notFound()`). */
export async function clasificarPagina(invocar: () => Promise<unknown>): Promise<Resultado> {
  try {
    await invocar();
    return "abierta";
  } catch (e) {
    if (esNoEncontrado(e)) return "cerrada";
    return `error inesperado: ${e instanceof Error ? e.message : String(e)}`;
  }
}

/**
 * Una acción de servidor: «termina sin ejecutar nada y sin devolver datos». Se admite que lance
 * el 404 o que no devuelva nada. La forma exacta de esa respuesta la fija esta prueba; si la
 * tarea T-005 elige otra, se cambia aquí y se anota (el informe de T-003 lo dice).
 */
export async function clasificarAccion(invocar: () => Promise<unknown>): Promise<Resultado> {
  try {
    const valor = await invocar();
    return valor === undefined ? "cerrada" : "abierta";
  } catch (e) {
    if (esNoEncontrado(e)) return "cerrada";
    return `error inesperado: ${e instanceof Error ? e.message : String(e)}`;
  }
}

export function cabecerasDe(caso: CasoDeAcceso): Headers {
  const h = new Headers();
  if (caso.host !== undefined) h.set("host", caso.host);
  if (caso.reenviado !== undefined) h.set("x-forwarded-host", caso.reenviado);
  return h;
}
