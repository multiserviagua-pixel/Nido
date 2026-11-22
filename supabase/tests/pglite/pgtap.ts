// Ejecuta los archivos pgTAP de supabase/tests/ contra el arnés PGlite, con pglite-pgtap
// (@electric-sql/pglite-pgtap 0.0.18, D-034). T-008.
//
// Es una comprobación LOCAL sobre un Postgres simulado (PGlite, sin el servicio de identidad
// ni la plataforma de Supabase): no sustituye a `supabase test db` en CI (T-013) y no se anota
// como superada en CI (artículo 13, REQ-028). Sirve para que cada aserción del archivo tenga
// una ejecución real contra las migraciones, no solo una lectura.
//
// Qué hace:
//   1. Base PGlite con pgtap (esquema `extensions`), el preámbulo, las diez migraciones y el seed
//      (con app.entorno = 'ci'), como la pipeline de CI.
//   2. Expande `\ir ruta` (lo único de psql que usan los archivos) leyendo el archivo relativo.
//   3. Ejecuta el archivo entero (begin … rollback) y devuelve las líneas TAP.
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { PGlite } from "@electric-sql/pglite";
import { pgtap } from "@electric-sql/pglite-pgtap";
import { aplicarTodas, type Base } from "./arnes";

const DIR_TESTS = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const RUTA_PREAMBULO = resolve(DIR_TESTS, "pglite", "preambulo.sql");
const RUTA_SEED = resolve(DIR_TESTS, "..", "seed.sql");

/** Base como la de CI: preámbulo, migraciones, seed y pgtap (en `extensions`). */
export async function crearBaseConPgtap(): Promise<Base> {
  const db = new PGlite({ extensions: { pgtap } });
  await db.exec(readFileSync(RUTA_PREAMBULO, "utf8"));
  await aplicarTodas(db);
  await db.exec("set app.entorno = 'ci'");
  await db.exec(readFileSync(RUTA_SEED, "utf8"));
  await db.exec("reset app.entorno");
  await db.exec("create extension if not exists pgtap with schema extensions");
  // Como en Supabase: la ruta de búsqueda de la sesión incluye extensions (donde vive pgTAP).
  await db.exec('set search_path to "$user", public, extensions');
  return db;
}

/** Expande las líneas `\ir ruta` (relativas al archivo que las contiene). Cualquier otra orden de psql falla. */
export function expandirIr(ruta: string, profundidad = 0): string {
  if (profundidad > 3) throw new Error("ir demasiado anidado");
  const dir = dirname(ruta);
  return readFileSync(ruta, "utf8")
    .split(/\r?\n/)
    .map((linea) => {
      const ir = /^\\ir\s+(\S+)\s*$/.exec(linea);
      if (ir !== null) return expandirIr(resolve(dir, ir[1] ?? ""), profundidad + 1);
      if (/^\s*\\/.test(linea)) throw new Error(`Orden de psql no admitida: ${linea}`);
      return linea;
    })
    .join("\n");
}

export interface ResultadoTap {
  plan: number;
  /** Líneas `ok N - …` y `not ok N - …` (con sus diagnósticos, si los hay). */
  lineas: string[];
  fallidas: string[];
  finish: string[];
}

/** Ejecuta un archivo pgTAP de supabase/tests/ (por su nombre, p. ej. `01_estructura.test.sql`). */
export async function ejecutarArchivo(db: Base, nombre: string): Promise<ResultadoTap> {
  return ejecutarTexto(db, expandirIr(resolve(DIR_TESTS, nombre)));
}

/** Ejecuta el texto de un archivo pgTAP ya expandido (para probar el archivo cambiado a propósito). */
export async function ejecutarTexto(db: Base, sql: string): Promise<ResultadoTap> {
  let respuestas;
  try {
    respuestas = await db.exec(sql);
  } catch (e) {
    // Un error a mitad de archivo deja la transacción abierta: se deshace antes de seguir.
    await db.exec("rollback");
    throw e;
  }
  const textos: string[] = [];
  for (const r of respuestas) {
    for (const fila of r.rows) {
      for (const v of Object.values(fila as Record<string, unknown>)) {
        if (typeof v === "string") textos.push(v);
      }
    }
  }
  const plan = textos.map((t) => /^1\.\.(\d+)$/.exec(t)).find((m) => m !== null && m !== undefined);
  const lineas = textos.filter((t) => /^(not )?ok \d+/.test(t));
  return {
    plan: plan === null || plan === undefined ? -1 : Number(plan[1]),
    lineas,
    fallidas: lineas.filter((t) => t.startsWith("not ok")),
    finish: textos.filter((t) => t.startsWith("#")),
  };
}
