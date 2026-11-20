// Arnés PGlite de la función 010 (T-001).
//
// Crea una base PGlite con el preámbulo que simula Supabase, aplica en orden
// las migraciones de supabase/migrations/, las revierte con las de
// supabase/reversiones/ (mismo nombre) y saca una instantánea del catálogo
// para comprobar que aplicar → revertir → reaplicar es reversible (REQ-029).
//
// Comprueba que el SQL es válido y que los permisos se comportan; no sustituye
// a pgTAP contra un Supabase real, que corre en CI (T-013).
import { readdirSync, readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";

const RAIZ = new URL("../../", import.meta.url);
const DIR_MIGRACIONES = new URL("migrations/", RAIZ);
const DIR_REVERSIONES = new URL("reversiones/", RAIZ);
const RUTA_PREAMBULO = new URL("tests/pglite/preambulo.sql", RAIZ);

export type Base = PGlite;

export async function crearBase(): Promise<Base> {
  const db = new PGlite();
  await db.exec(readFileSync(RUTA_PREAMBULO, "utf8"));
  return db;
}

/**
 * Quita del preámbulo las filas globales de postgres en pg_default_acl, de modo
 * que los tres tipos vuelvan al valor de serie (`acldefault`). Para ejercer la
 * rama «sin fila global» de M01.
 */
export async function sinFilasGlobales(db: Base): Promise<void> {
  await db.exec(`
    alter default privileges for role postgres
      revoke all on tables from public, anon, authenticated, service_role;
    alter default privileges for role postgres
      revoke all on sequences from public, anon, authenticated, service_role;
    alter default privileges for role postgres
      revoke all on functions from public, anon, authenticated, service_role;
    alter default privileges for role postgres grant execute on functions to public;
  `);
}

/** Divide un script en sentencias sueltas (comentarios fuera; respeta '…' y $etiqueta$…$etiqueta$). */
export function dividirSentencias(sql: string): string[] {
  const salida: string[] = [];
  let actual = "";
  let i = 0;
  while (i < sql.length) {
    const c = sql[i];
    if (c === "-" && sql[i + 1] === "-") {
      while (i < sql.length && sql[i] !== "\n") i++;
    } else if (c === "/" && sql[i + 1] === "*") {
      const fin = sql.indexOf("*/", i + 2);
      i = fin === -1 ? sql.length : fin + 2;
    } else if (c === "'") {
      let j = i + 1;
      while (j < sql.length && !(sql[j] === "'" && sql[j + 1] !== "'")) j += sql[j] === "'" ? 2 : 1;
      actual += sql.slice(i, j + 1);
      i = j + 1;
    } else if (c === "$") {
      const m = /^\$([A-Za-z_][A-Za-z0-9_]*)?\$/.exec(sql.slice(i));
      if (m === null) {
        actual += c;
        i++;
      } else {
        const fin = sql.indexOf(m[0], i + m[0].length);
        const hasta = fin === -1 ? sql.length : fin + m[0].length;
        actual += sql.slice(i, hasta);
        i = hasta;
      }
    } else if (c === ";") {
      if (actual.trim() !== "") salida.push(`${actual.trim()};`);
      actual = "";
      i++;
    } else {
      actual += c;
      i++;
    }
  }
  if (actual.trim() !== "") salida.push(actual.trim());
  return salida;
}

/**
 * Ejecuta cada sentencia como un mensaje aparte: autocommit, sin transacción
 * común. Es el peor caso para un cliente que no envuelve el archivo.
 */
export async function ejecutarEnAutocommit(db: Base, sql: string): Promise<void> {
  for (const sentencia of dividirSentencias(sql)) await db.exec(sentencia);
}

/**
 * Como `ejecutarEnAutocommit`, pero SIGUE tras cada error: es lo que hace
 * `psql -f` sin ON_ERROR_STOP. Devuelve los mensajes de los errores, en orden.
 */
export async function ejecutarSigueTrasError(db: Base, sql: string): Promise<string[]> {
  const errores: string[] = [];
  for (const sentencia of dividirSentencias(sql)) {
    try {
      await db.exec(sentencia);
    } catch (e) {
      errores.push(e instanceof Error ? e.message : String(e));
    }
  }
  return errores;
}

/** Nombres de archivo de las migraciones, en el orden en que se aplican. */
export function listarMigraciones(): string[] {
  return readdirSync(DIR_MIGRACIONES)
    .filter((n) => n.endsWith(".sql"))
    .sort();
}

export function leerMigracion(nombre: string): string {
  return readFileSync(new URL(nombre, DIR_MIGRACIONES), "utf8");
}

export function leerReversion(nombre: string): string {
  return readFileSync(new URL(nombre, DIR_REVERSIONES), "utf8");
}

/** Nombre de la migración cuyo archivo termina en `_<sufijo>.sql`. */
export function nombreDe(sufijo: string): string {
  const hallada = listarMigraciones().find((n) => n.endsWith(`_${sufijo}.sql`));
  if (hallada === undefined) throw new Error(`No hay migración ${sufijo}`);
  return hallada;
}

// Cada archivo se envía como un solo mensaje de varias sentencias: el servidor
// lo ejecuta en una transacción implícita, como la CLI (comprobaciones-cli.md, 2).
export async function aplicar(db: Base, nombre: string): Promise<void> {
  await db.exec(leerMigracion(nombre));
}

export async function revertir(db: Base, nombre: string): Promise<void> {
  await db.exec(leerReversion(nombre));
}

export async function aplicarTodas(db: Base): Promise<void> {
  for (const nombre of listarMigraciones()) await aplicar(db, nombre);
}

/** Ejecuta `fn` con el rol y las claims indicados y lo restablece siempre. */
export async function como<T>(
  db: Base,
  rol: string,
  claims: Record<string, unknown> | null,
  fn: () => Promise<T>,
): Promise<T> {
  await db.exec(`set role ${rol}`);
  await db.query("select set_config('request.jwt.claims', $1, false)", [
    JSON.stringify(claims ?? {}),
  ]);
  try {
    return await fn();
  } finally {
    await db.exec("reset role");
    await db.query("select set_config('request.jwt.claims', '', false)");
  }
}

/** Mensaje del error que lanza `fn`, o null si no lanza. */
export async function errorDe(fn: () => Promise<unknown>): Promise<string | null> {
  try {
    await fn();
    return null;
  } catch (e) {
    return e instanceof Error ? e.message : String(e);
  }
}

export async function valor<T = unknown>(db: Base, texto: string, params: unknown[] = []) {
  const r = await db.query<Record<string, T>>(texto, params);
  const fila = r.rows[0];
  if (fila === undefined) throw new Error("La consulta no devolvió filas");
  return Object.values(fila)[0] as T;
}

const SIN_SISTEMA = `n.nspname not in ('pg_catalog', 'information_schema')
  and n.nspname not like 'pg\\_toast%' and n.nspname not like 'pg\\_temp%'`;

const CONSULTAS: Record<string, string> = {
  roles: `select rolname, rolsuper, rolinherit, rolcreaterole, rolcreatedb, rolcanlogin,
      rolreplication, rolbypassrls, rolconnlimit, rolconfig::text as rolconfig
    from pg_roles where rolname !~ '^pg_' order by rolname`,
  membresias: `select r.rolname as rol, m.rolname as miembro
    from pg_auth_members a join pg_roles r on r.oid = a.roleid join pg_roles m on m.oid = a.member
    order by 1, 2`,
  ajustes_de_rol: `select coalesce(r.rolname, '*') as rol, s.setconfig::text as ajustes
    from pg_db_role_setting s left join pg_roles r on r.oid = s.setrole order by 1, 2`,
  esquemas: `select n.nspname, n.nspowner::regrole::text as dueno, n.nspacl::text as acl
    from pg_namespace n where ${SIN_SISTEMA} order by 1`,
  relaciones: `select n.nspname, c.relname, c.relkind::text as tipo, c.relowner::regrole::text as dueno,
      c.relrowsecurity, c.relforcerowsecurity, c.relacl::text as acl, c.reloptions::text as opciones
    from pg_class c join pg_namespace n on n.oid = c.relnamespace
    where ${SIN_SISTEMA} order by 1, 2`,
  columnas: `select n.nspname, c.relname, a.attname, a.atttypid::regtype::text as tipo,
      a.attnotnull, a.attacl::text as acl
    from pg_attribute a join pg_class c on c.oid = a.attrelid
    join pg_namespace n on n.oid = c.relnamespace
    where a.attnum > 0 and not a.attisdropped and ${SIN_SISTEMA} order by 1, 2, 3`,
  funciones: `select n.nspname, p.oid::regprocedure::text as firma, p.proowner::regrole::text as dueno,
      p.prosecdef, p.proconfig::text as config, p.proacl::text as acl, md5(p.prosrc) as huella
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where ${SIN_SISTEMA} order by 1, 2`,
  tipos: `select n.nspname, t.typname, t.typtype::text as clase, t.typacl::text as acl
    from pg_type t join pg_namespace n on n.oid = t.typnamespace
    where ${SIN_SISTEMA} order by 1, 2`,
  restricciones: `select conrelid::regclass::text as tabla, conname, pg_get_constraintdef(oid) as definicion
    from pg_constraint where connamespace not in
      (select oid from pg_namespace where nspname in ('pg_catalog', 'information_schema'))
    order by 1, 2`,
  indices: `select schemaname, tablename, indexname, indexdef from pg_indexes
    where schemaname not in ('pg_catalog', 'information_schema') order by 1, 3`,
  politicas: `select schemaname, tablename, policyname, cmd, roles::text as roles, qual, with_check
    from pg_policies order by 1, 2, 3`,
  disparadores: `select tgrelid::regclass::text as tabla, tgname, tgenabled::text as estado,
      pg_get_triggerdef(oid) as definicion
    from pg_trigger where not tgisinternal order by 1, 2`,
  permisos_por_defecto: `select d.defaclrole::regrole::text as rol,
      coalesce(n.nspname, '*') as esquema, d.defaclobjtype::text as tipo, d.defaclacl::text as acl
    from pg_default_acl d left join pg_namespace n on n.oid = d.defaclnamespace order by 1, 2, 3`,
};

export type Instantanea = Record<string, unknown[]>;

/** Foto ordenada del catálogo (sin sistema ni temporales), comparable con toEqual. */
export async function instantanea(db: Base): Promise<Instantanea> {
  const salida: Instantanea = {};
  for (const [clave, consulta] of Object.entries(CONSULTAS)) {
    salida[clave] = (await db.query(consulta)).rows;
  }
  return salida;
}

export interface Ciclo {
  antes: Instantanea;
  trasAplicar: Instantanea;
  trasRevertir: Instantanea;
  trasReaplicar: Instantanea;
}

/** Aplica, revierte y reaplica una migración, con una instantánea en cada paso. */
export async function ciclo(db: Base, nombre: string): Promise<Ciclo> {
  const antes = await instantanea(db);
  await aplicar(db, nombre);
  const trasAplicar = await instantanea(db);
  await revertir(db, nombre);
  const trasRevertir = await instantanea(db);
  await aplicar(db, nombre);
  const trasReaplicar = await instantanea(db);
  return { antes, trasAplicar, trasRevertir, trasReaplicar };
}
