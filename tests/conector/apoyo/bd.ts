// Base de datos de apoyo (T-102, 001): PGlite con los roles de Supabase imitados como
// scripts/probar-modelo.mjs, el reloj de la prueba en now() y la carga de supabase/conector-prueba/*.sql.
//
// Límites declarados:
// - Reloj: PGlite no permite cambiar la hora del sistema. Se crea reloj_pruebas.now() y se antepone
//   a pg_catalog en el search_path de la sesión. Todo SQL (el cargado y cada consulta suelta de
//   `db.query`/`db.exec`) pasa por el mismo análisis: se quitan comentarios, se desenmascaran los
//   identificadores entre comillas que son palabras de hora ("now"()) y se reescriben now(),
//   current_timestamp, clock_timestamp(), transaction_timestamp() y statement_timestamp() por
//   reloj_pruebas.now() (también dentro de cuerpos entre dólares, porque las funciones con
//   search_path = '' no leen el de la sesión). Fallan a la vista, con "reloj: hora no controlada":
//   current_date/current_time, localtime/localtimestamp, current_timestamp(n), timeofday(),
//   pg_catalog.<hora>, age() con un solo argumento; U&'...' y U&"..."; cualquier backslash dentro de
//   E'...'; etiquetas de dólares con caracteres no ASCII ($é$, $_ñ$); y todo literal entre comillas
//   simples (también E'...', concatenado con || sin paréntesis o en cadenas contiguas por salto de
//   línea, \n o \r) que contenga una palabra de hora (now, today, tomorrow, yesterday, sin letra
//   pegada a ambos lados, así que 'today00:00' falla; y clock_timestamp, transaction_timestamp,
//   statement_timestamp, timeofday, current_date/time/timestamp, localtime, localtimestamp),
//   "pg_catalog." o U&" / U&': así falla un cuerpo de función o un `do '...'` escrito entre comillas
//   simples, que no se reescribe, y también 'today 00:00'. Un literal entre dólares que EMPIECE por
//   una palabra de hora y los parámetros de texto que la contengan como palabra también fallan. En
//   consultas sueltas, además, todo lo que toque search_path o standard_conforming_strings o haga
//   reset all/discard. Se prueba, por tanto, el SQL reescrito, no byte a byte el de producción.
// - Reglas para migraciones futuras en supabase/conector-prueba: cuerpos de función entre $$ (no
//   entre comillas simples), sin pg_catalog.now() ni otras horas con pg_catalog., y sin age() de un
//   solo argumento.
// - Falsos positivos conocidos (fallan a la vista; es la política): cualquier texto entre comillas
//   simples con esas palabras aunque no sea hora ('hoy es today', 'pg_catalog.pg_class'::regclass), un
//   cuerpo entre dólares que empiece por una palabra de hora, un parámetro con la palabra (por
//   ejemplo un texto libre con "now"), todo backslash en E'...' (aunque sea una barra y una n) y toda
//   etiqueta de dólares no ASCII. Un age() con un solo argumento dentro de un cuerpo entre comillas
//   simples no se detecta (límite que no se cierra).
// - Límites que NO se cierran: la concatenación con paréntesis (('no')||'w'), que no se une; los
//   parámetros que no son texto ([["today"]] como timestamptz[], {t:"now"} como jsonb), que no se
//   miran; un literal entre dólares con la palabra de hora que no esté al inicio ($$12:00 tomorrow$$,
//   $$00:00 today$$); la hora construida en ejecución (chr(), concat(), format(), execute de
//   SQL dinámico, decode...), funciones de usuario que la lean y otras fuentes de tiempo (p. ej.
//   pg_postmaster_start_time()). El analizador es un lector de SQL propio, no el de Postgres.
// - now() y las demás horas reescritas son estables dentro de la transacción (se apoyan en
//   transaction_timestamp): clock_timestamp() queda también estable.
// - Una sola conexión: `como` serializa las llamadas para que un `set role` no se mezcle con otro.
//   `db` (solo query y exec) fuera de `como` corre con el rol vigente (postgres); no se expone la base
//   en bruto. Mover el reloj dentro de `como`, con una transacción abierta o con un rol distinto de
//   postgres falla con error claro (no se hace `reset role` en silencio).
// - PRUEBA-007 parte B NO demuestra carreras: hay una sola conexión y clock_timestamp está reescrito
//   a un now() estable. Las carreras reales (dos peticiones a la vez) quedan para la 008 (L).
import { AsyncLocalStorage } from "node:async_hooks";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { PGlite, type Results } from "@electric-sql/pglite";
import { RelojPrueba } from "./reloj";

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const DIRECTORIO_SQL_POR_DEFECTO = join("supabase", "conector-prueba");
// La reversión no se carga sola: dejaría la base vacía. Se pide con `archivos`.
const EXCLUIDOS_POR_DEFECTO = /revers|revert/i;

const PREAMBULO = `
create schema auth;
create table auth.users (id uuid primary key default gen_random_uuid(), email text);
create function auth.jwt() returns jsonb language sql stable as $$
  select coalesce(nullif(current_setting('request.jwt.claims', true), ''), '{}')::jsonb
$$;
create function auth.uid() returns uuid language sql stable as $$
  select nullif(auth.jwt() ->> 'sub', '')::uuid
$$;
create role anon nologin;
create role authenticated nologin;
create role service_role nologin bypassrls;
grant usage on schema public, auth to anon, authenticated, service_role;

create schema reloj_pruebas;
create table reloj_pruebas.estado (fijo_ms bigint, desfase_ms bigint not null);
insert into reloj_pruebas.estado values (null, 0);
create function reloj_pruebas.now() returns timestamptz
  language sql stable security definer set search_path = '' as $$
    select to_timestamp(
      (coalesce(e.fijo_ms, (extract(epoch from pg_catalog.transaction_timestamp()) * 1000)::bigint)
        + e.desfase_ms) / 1000.0)
    from reloj_pruebas.estado e
  $$;
grant usage on schema reloj_pruebas to public;
grant execute on function reloj_pruebas.now() to public;
`;

const SESION = "set search_path = public, reloj_pruebas, pg_catalog";

export const ROLES_SUPABASE = ["anon", "authenticated", "service_role"] as const;

// Formas de leer la hora que el reloj no controla: fallan a la vista en vez de dar la hora real.
// Se aplican al código ya limpio (sin comentarios, con las cadenas enmascaradas).
const HORAS_NO_CONTROLADAS: [RegExp, string][] = [
  [/\bcurrent_(?:date|time)\b/i, "current_date/current_time"],
  [/\blocal(?:time|timestamp)\b/i, "localtime/localtimestamp"],
  [/\bcurrent_timestamp\s*\(/i, "current_timestamp(n)"],
  [/\btimeofday\s*\(/i, "timeofday()"],
  [
    /\bpg_catalog\s*\.\s*(?:now|clock_timestamp|transaction_timestamp|statement_timestamp|timeofday)\b/i,
    "pg_catalog.<hora>",
  ],
];
// Solo en consultas sueltas: cambiar la resolución de nombres devolvería la hora real.
const SOLO_EN_CONSULTAS: [RegExp, string][] = [
  [/\bsearch_path\b/i, "search_path"],
  [/\breset\s+(?:all|session)\b/i, "reset all"],
  [/\bstandard_conforming_strings\b/i, "standard_conforming_strings"],
  [/\bdiscard\b/i, "discard"],
];
// Palabras especiales de fecha/hora que Postgres interpreta dentro de un literal ('today 00:00').
const PALABRA_HORA = /(?<![a-z])(?:now|today|tomorrow|yesterday)(?![a-z])/i;
// Cuerpos de función o bloques entre comillas simples: no se reescriben, así que no pueden leer la
// hora de ninguna forma ni ir por pg_catalog.
const HORA_EN_COMILLAS =
  /(?<![a-z])(?:now|today|tomorrow|yesterday)(?![a-z])|\b(?:clock_timestamp|transaction_timestamp|statement_timestamp|timeofday|current_date|current_time|current_timestamp|localtime|localtimestamp)\b|pg_catalog\.|u&["']/i;
// Literal entre dólares que EMPIEZA por una palabra de hora ($$today 00:00$$::timestamptz). Un cuerpo
// entre dólares ('select now()') se reescribe y se revisa entero, así que no se mira de esta forma.
const HORA_AL_INICIO = /^\s*(?:now|today|tomorrow|yesterday)(?![a-z])/i;
const IDENTIFICADORES_HORA =
  /^(?:now|clock_timestamp|transaction_timestamp|statement_timestamp|timeofday|current_date|current_time|current_timestamp|localtime|localtimestamp|pg_catalog|age)$/i;

const INI = "";
const FIN = "";
const MARCA = new RegExp(`${INI}(\\d+)${FIN}`, "g");
const UNION = new RegExp(
  `${INI}(\\d+)${FIN}(?:\\s*\\|\\|\\s*|\\s*[\\r\\n]\\s*)${INI}(\\d+)${FIN}`,
  "g",
);

type Modo = "carga" | "consulta";
interface Literal {
  emitido: string;
  contenido: string | null;
  /** Entre comillas simples (o unido a uno que lo está): puede ser un cuerpo de función sin reescribir. */
  comillas: boolean;
}

const fallo = (que: string) =>
  new Error(`reloj: hora no controlada en el SQL de prueba (${que}); usa now()`);

/** Quita comentarios, enmascara cadenas e identificadores, comprueba y reescribe la hora. */
function procesar(sql: string, modo: Modo): string {
  if (sql.includes(INI) || sql.includes(FIN)) throw fallo("caracteres reservados");
  const literales: Literal[] = [];
  const marcar = (emitido: string, contenido: string | null, comillas = false) => {
    literales.push({ emitido, contenido, comillas });
    return `${INI}${literales.length - 1}${FIN}`;
  };
  let codigo = "";
  // Los últimos caracteres del código, aparte: mirar `codigo` entero en cada literal sería cuadrático.
  let cola = "";
  const anadir = (texto: string) => {
    codigo += texto;
    cola = (cola + texto).slice(-3);
  };
  let i = 0;
  const n = sql.length;
  while (i < n) {
    const c = sql[i]!;
    if (c === "-" && sql[i + 1] === "-") {
      const f = sql.indexOf("\n", i);
      i = f < 0 ? n : f;
      anadir(" ");
    } else if (c === "/" && sql[i + 1] === "*") {
      let profundidad = 1;
      i += 2;
      while (i < n && profundidad > 0) {
        if (sql.startsWith("/*", i)) {
          profundidad++;
          i += 2;
        } else if (sql.startsWith("*/", i)) {
          profundidad--;
          i += 2;
        } else {
          i++;
        }
      }
      if (profundidad > 0) throw fallo("comentario sin cerrar");
      anadir(" ");
    } else if (c === "'") {
      if (/(?:^|[^\w$\u0080-￿])u&$/i.test(cola)) throw fallo("cadena U&'...'");
      const escapes = /(?:^|[^\w$\u0080-￿])e$/i.test(cola.slice(-2));
      let j = i + 1;
      let contenido = "";
      for (;;) {
        if (j >= n) throw fallo("cadena sin cerrar");
        const d = sql[j]!;
        if (escapes && d === "\\") {
          // Ningún escape en E'...': ni \x, \u, octales ni \n: un límite más simple que analizarlos.
          throw fallo("backslash en E'...'");
        } else if (d === "'" && sql[j + 1] === "'") {
          contenido += "''";
          j += 2;
        } else if (d === "'") {
          break;
        } else {
          contenido += d;
          j++;
        }
      }
      anadir(marcar(sql.slice(i, j + 1), contenido.replace(/''/g, "'"), true));
      i = j + 1;
    } else if (c === '"') {
      if (/(?:^|[^\w$\u0080-￿])u&$/i.test(cola)) throw fallo('identificador U&"..."');
      let j = i + 1;
      let contenido = "";
      for (;;) {
        if (j >= n) throw fallo("identificador sin cerrar");
        if (sql[j] === '"' && sql[j + 1] === '"') {
          contenido += '"';
          j += 2;
        } else if (sql[j] === '"') {
          break;
        } else {
          contenido += sql[j++];
        }
      }
      // Un identificador entre comillas que es una palabra de hora se trata como si no lo estuviera.
      anadir(
        IDENTIFICADORES_HORA.test(contenido)
          ? contenido.toLowerCase()
          : marcar(sql.slice(i, j + 1), null),
      );
      i = j + 1;
    } else if (c === "$" && !/[\w$\u0080-￿]$/.test(cola.slice(-1))) {
      // Gramática de Postgres: letra, guion bajo o carácter no ASCII, y luego también dígitos.
      const apertura = /^\$(?:[A-Za-z_\u0080-￿][A-Za-z0-9_\u0080-￿]*)?\$/.exec(
        sql.slice(i, i + 80),
      );
      if (!apertura) {
        anadir(c);
        i++;
        continue;
      }
      if (/[^\u0000-\u007f]/.test(apertura[0])) throw fallo("etiqueta de dólares no ASCII");
      const delimitador = apertura[0];
      const cierre = sql.indexOf(delimitador, i + delimitador.length);
      if (cierre < 0) throw fallo("cadena entre dólares sin cerrar");
      const cuerpo = sql.slice(i + delimitador.length, cierre);
      // El cuerpo es a la vez literal posible y código posible (funciones): se mira de las dos formas.
      anadir(marcar(`${delimitador}${procesar(cuerpo, modo)}${delimitador}`, cuerpo));
      i = cierre + delimitador.length;
    } else {
      anadir(c);
      i++;
    }
  }

  // Literales unidos con || o contiguos por salto de línea: se comprueba el texto resultante. Cada
  // pasada une pares, así que una cadena larga necesita pocas pasadas.
  let vista = codigo;
  for (let cambio = true; cambio;) {
    cambio = false;
    vista = vista.replace(UNION, (_t, x: string, y: string) => {
      cambio = true;
      const a = literales[Number(x)]!;
      const b = literales[Number(y)]!;
      literales.push({
        emitido: "",
        contenido: a.contenido === null || b.contenido === null ? null : a.contenido + b.contenido,
        comillas: a.comillas || b.comillas,
      });
      return `${INI}${literales.length - 1}${FIN}`;
    });
  }
  for (const { contenido, comillas } of literales) {
    if (contenido === null) continue;
    if (comillas ? HORA_EN_COMILLAS.test(contenido) : HORA_AL_INICIO.test(contenido)) {
      throw fallo("palabra de hora en un literal o cuerpo entre comillas");
    }
    if (modo === "consulta" && /search_path|standard_conforming_strings/i.test(contenido)) {
      throw fallo("search_path o standard_conforming_strings");
    }
  }

  for (const [patron, nombre] of HORAS_NO_CONTROLADAS) {
    if (patron.test(codigo)) throw fallo(nombre);
  }
  if (modo === "consulta") {
    for (const [patron, nombre] of SOLO_EN_CONSULTAS) {
      if (patron.test(codigo)) throw fallo(nombre);
    }
  }
  for (const m of codigo.matchAll(/(?<![\w$])age\s*\(/gi)) {
    let profundidad = 1;
    let coma = false;
    for (let k = m.index + m[0].length; profundidad > 0; k++) {
      const d = codigo[k];
      if (d === undefined) throw fallo("age() sin cerrar");
      if (d === "(") profundidad++;
      else if (d === ")") profundidad--;
      else if (d === "," && profundidad === 1) coma = true;
    }
    if (!coma) throw fallo("age() con un solo argumento");
  }

  return codigo
    .replace(
      /(?<![\w$.])(?<!\.\s+)(?:now|clock_timestamp|transaction_timestamp|statement_timestamp)\s*\(\s*\)/gi,
      "reloj_pruebas.now()",
    )
    .replace(/(?<![\w$.])(?<!\.\s+)current_timestamp\b(?!\s*\()/gi, "reloj_pruebas.now()")
    .replace(MARCA, (_t, k: string) => literales[Number(k)]!.emitido);
}

export function reescribirReloj(sql: string): string {
  return procesar(sql, "carga");
}

/** Lo que se acepta de la consulta suelta: el texto y los parámetros con palabras de hora. */
function prepararConsulta(sql: unknown, parametros?: unknown[]): string {
  if (typeof sql !== "string") throw new Error("bd: el SQL debe ser texto");
  for (const p of parametros ?? []) {
    if (typeof p === "string" && PALABRA_HORA.test(p)) {
      throw fallo("parámetro con 'now', 'today', 'tomorrow' o 'yesterday'");
    }
  }
  return procesar(sql, "consulta");
}

export interface OpcionesBd {
  /** Carpeta con el SQL; por defecto supabase/conector-prueba (relativa a la raíz del repositorio). */
  directorioSql?: string;
  /** Nombres de archivo a cargar, en ese orden; sustituye al listado de la carpeta. */
  archivos?: string[];
  /** SQL propio de la prueba, aplicado después del de la carpeta. */
  sqlExtra?: string[];
  reloj?: RelojPrueba;
}

/** Única vía de ejecución que se entrega: cada consulta pasa por el análisis de la hora. */
export interface EjecutorBd {
  query<T = Record<string, unknown>>(sql: string, parametros?: unknown[]): Promise<Results<T>>;
  exec(sql: string): Promise<Results[]>;
}

export interface BdApoyo {
  db: EjecutorBd;
  reloj: RelojPrueba;
  archivosCargados: string[];
  /** Ejecuta `fn` con `set role`, serializado; vuelve siempre a `postgres`. */
  como<T>(rol: string, fn: () => Promise<T>): Promise<T>;
  /** now() de la base de datos tal como lo ve una consulta de sesión. */
  ahoraBd(): Promise<Date>;
  /** Privilegios efectivos (también heredados de PUBLIC) del rol en el esquema: vacío = ninguno. */
  privilegios(rol: string, esquema: string): Promise<string[]>;
  cerrar(): Promise<void>;
}

function archivosDeCarpeta(carpeta: string, explicitos?: string[]): string[] {
  if (explicitos) return explicitos;
  if (!existsSync(carpeta)) return [];
  return readdirSync(carpeta)
    .filter((n) => n.endsWith(".sql") && !EXCLUIDOS_POR_DEFECTO.test(n))
    .sort();
}

export async function crearBd(opciones: OpcionesBd = {}): Promise<BdApoyo> {
  const reloj = opciones.reloj ?? new RelojPrueba();
  const carpeta = resolve(RAIZ, opciones.directorioSql ?? DIRECTORIO_SQL_POR_DEFECTO);
  const archivos = archivosDeCarpeta(carpeta, opciones.archivos);
  // Se reescribe todo antes de abrir la base: un SQL con hora no controlada falla sin dejarla abierta.
  const sqlCarpeta = archivos.map((n) => reescribirReloj(readFileSync(join(carpeta, n), "utf8")));
  const sqlExtra = (opciones.sqlExtra ?? []).map(reescribirReloj);
  const db = new PGlite();
  await db.exec(PREAMBULO);
  await db.exec(SESION);

  let cola: Promise<unknown> = Promise.resolve();
  const dentroDeComo = new AsyncLocalStorage<true>();
  const enCola = <T>(fn: () => Promise<T>): Promise<T> => {
    const turno = cola.then(fn);
    cola = turno.catch(() => undefined);
    return turno;
  };

  // La propagación va por la cola y como postgres, como cualquier otra operación sobre la conexión.
  const propagar = async ({ fijoMs, desfaseMs }: { fijoMs: number | null; desfaseMs: number }) => {
    if (dentroDeComo.getStore()) {
      throw new Error("reloj: no se puede mover el reloj dentro de `como`; hazlo antes o después");
    }
    await enCola(async () => {
      // Sin `reset role` en silencio: si la conexión no corre como postgres, algo la dejó a medias.
      const actual = (await db.query<{ u: string }>("select current_user as u")).rows[0]?.u;
      if (actual !== "postgres") {
        throw new Error("reloj: no se puede mover el reloj con un rol distinto de postgres");
      }
      if (db.isInTransaction()) {
        throw new Error("reloj: no se puede mover el reloj con una transacción abierta");
      }
      await db.query("update reloj_pruebas.estado set fijo_ms = $1, desfase_ms = $2", [
        fijoMs,
        desfaseMs,
      ]);
    });
  };
  await reloj.enlazar(propagar);

  for (const sql of [...sqlCarpeta, ...sqlExtra]) await db.exec(sql);

  const como = <T>(rol: string, fn: () => Promise<T>): Promise<T> =>
    enCola(async () => {
      await db.query("select set_config('role', $1, false)", [rol]);
      try {
        return await dentroDeComo.run(true, fn);
      } finally {
        await db.exec("reset role");
      }
    });

  const ejecutor: EjecutorBd = {
    query: <T = Record<string, unknown>>(sql: string, parametros?: unknown[]) =>
      Promise.resolve().then(() => db.query<T>(prepararConsulta(sql, parametros), parametros)),
    exec: (sql: string) => Promise.resolve().then(() => db.exec(prepararConsulta(sql))),
  };

  return {
    db: ejecutor,
    reloj,
    archivosCargados: archivos,
    como,
    async ahoraBd() {
      const f = (await db.query<{ ahora: Date }>("select reloj_pruebas.now() as ahora")).rows[0];
      if (!f) throw new Error("now() no devolvió fila");
      return f.ahora;
    },
    async privilegios(rol, esquema) {
      const encontrados: string[] = [];
      const sino = async (texto: string, params: unknown[]) =>
        (await db.query<{ v: boolean }>(texto, params)).rows[0]?.v === true;
      for (const p of ["USAGE", "CREATE"]) {
        if (await sino("select has_schema_privilege($1, $2, $3) as v", [rol, esquema, p])) {
          encontrados.push(`esquema:${p.toLowerCase()}`);
        }
      }
      const tablas = await db.query<{ nombre: string }>(
        `select c.relname as nombre from pg_class c join pg_namespace n on n.oid = c.relnamespace
         where n.nspname = $1 and c.relkind in ('r','p','v','m','f') order by 1`,
        [esquema],
      );
      for (const { nombre } of tablas.rows) {
        for (const p of [
          "SELECT",
          "INSERT",
          "UPDATE",
          "DELETE",
          "TRUNCATE",
          "REFERENCES",
          "TRIGGER",
        ]) {
          const ok = await sino(
            "select has_table_privilege($1, format('%I.%I', $2::text, $3::text), $4) as v",
            [rol, esquema, nombre, p],
          );
          if (ok) encontrados.push(`tabla:${nombre}:${p.toLowerCase()}`);
        }
      }
      const funciones = await db.query<{ oid: number; nombre: string }>(
        `select p.oid::int as oid, p.proname as nombre from pg_proc p
         join pg_namespace n on n.oid = p.pronamespace where n.nspname = $1 order by 2`,
        [esquema],
      );
      for (const f of funciones.rows) {
        if (
          await sino("select has_function_privilege($1, $2::oid, 'EXECUTE') as v", [rol, f.oid])
        ) {
          encontrados.push(`funcion:${f.nombre}:execute`);
        }
      }
      return encontrados;
    },
    async cerrar() {
      reloj.desenlazar();
      await db.close();
    },
  };
}
