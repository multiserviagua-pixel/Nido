// L 10 de la función 010 (diseño D-1, N-7): las reversiones de M06 en adelante y
// las futuras no pueden tocar la auditoría, las versiones del prompt ni las
// publicaciones, ni los disparadores y funciones que las protegen. Comprobación
// textual, sin base de datos; no sustituye al ciclo de CI (CA-031).
import { readdirSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { escapesProhibidos, normalizar } from "./apoyo/texto";

const DIR_REVERSIONES = new URL("../../../supabase/reversiones/", import.meta.url);

// M01 a M05: la reversión de M04 y M05 borra por diseño las tablas protegidas
// (solo en CI, con la marca), y las otras tres no las tocan; L 10 rige desde M06.
const EXENTAS = [
  "_privado_rol_y_permisos.sql",
  "_clientes_y_acceso.sql",
  "_internas_autorizacion_y_cobro.sql",
  "_auditoria.sql",
  "_versiones_prompt.sql",
];

const PROTEGIDAS = "(?:auditoria|versiones_prompt|publicaciones)";
const FUNCIONES = "(?:impedir_cambios|auditar|registrar_auditoria)";

/**
 * Normaliza para L 10 (N-7): sin comentarios, en minúsculas, con espacios
 * colapsados, sin comillas dobles (`"public"."auditoria"` pasa a
 * `public.auditoria`) y sin espacios alrededor de los puntos.
 */
export function textoDeReversion(sql: string): string {
  return normalizar(sql)
    .replace(/"/g, "")
    .replace(/\s*\.\s*/g, ".");
}

/** Cada sentencia que incumple L 10 (vacío si cumple). */
export function reversionProhibida(sql: string): string[] {
  const malas: string[] = escapesProhibidos(sql);
  // Se trocea por `;` (también dentro de bloques do): el mismo patrón no debe
  // poder repartirse entre dos instrucciones para esquivarlo.
  for (const parte of textoDeReversion(sql).split(";")) {
    const p = parte.trim();
    if (p === "") continue;
    const prohibida =
      new RegExp(`\\b(?:drop|delete|truncate|update|alter)\\b[^;]*\\b${PROTEGIDAS}\\b`).test(p) ||
      /\bexecute\b/.test(p) ||
      /\b(?:drop|reassign) owned\b/.test(p) ||
      new RegExp(
        `\\b(?:create or replace|alter) (?:function|procedure)\\b[^;]*\\b${FUNCIONES}\\b`,
      ).test(p) ||
      /\b(?:disable|enable replica|enable always) trigger\b/.test(p) ||
      /\bdrop trigger\b(?: if exists)? [a-z0-9_]*_auditar\b/.test(p) ||
      new RegExp(`\\bgrant\\b[^;]*\\bon\\b[^;]*\\b${PROTEGIDAS}\\b`).test(p) ||
      /\bgrant\b[^;]*\bon all (?:tables|functions|sequences) in schema\b/.test(p) ||
      new RegExp(
        `\\bcreate(?: or replace)? (?:policy|(?:(?:global |local )?(?:temp|temporary|unlogged) |recursive )*(?:materialized )?view)\\b[^;]*\\b${PROTEGIDAS}\\b`,
      ).test(p) ||
      /\balter trigger\b/.test(p) ||
      /\b(?:create(?: or replace)?|alter) rule\b/.test(p) ||
      /\balter default privileges\b[^;]*\bgrant\b/.test(p) ||
      /\bgrant\b[^;]*\bon (?:function|procedure|routine)\b[^;]*\bprivado\./.test(p) ||
      /\bgrant\b[^;]*\bon schema\b[^;]*\bprivado\b/.test(p) ||
      /\bsession_replication_role\b/.test(p) ||
      (/\bcascade\b/.test(p) && new RegExp(`\\bprivado\\b|\\b${FUNCIONES}\\b`).test(p));
    if (prohibida) malas.push(p.slice(0, 80));
  }
  return malas;
}

const reversiones = readdirSync(DIR_REVERSIONES)
  .filter((n) => n.endsWith(".sql"))
  .sort();

describe("L 10: detector (sin archivos)", () => {
  const MALAS = [
    "drop table public.auditoria",
    "DROP TABLE PUBLIC.AUDITORIA",
    'drop table "public"."auditoria"',
    'delete from "auditoria"',
    "delete from public . auditoria",
    "delete from public./* c */auditoria",
    "update public.versiones_prompt set notas = null",
    "truncate public.publicaciones",
    'alter table public."versiones_prompt" disable trigger all',
    'alter table public.auditoria enable replica trigger "auditoria_solo_insercion"',
    "drop trigger auditoria_solo_insercion on public.auditoria",
    'drop trigger versiones_prompt_inmutable on "public"."versiones_prompt"',
    "drop trigger publicaciones_inmutable on public.publicaciones",
    "alter table public.alertas disable trigger all",
    "set session_replication_role = replica",
    "set local session_replication_role to 'replica'",
    'set "session_replication_role" = replica',
    "drop owned by conector",
    "DROP OWNED BY conector",
    "reassign owned by conector to postgres",
    "drop schema privado cascade",
    'drop schema "privado" cascade',
    "drop function privado.auditar() cascade",
    'drop function "privado"."registrar_auditoria"(text, text, text, uuid) cascade',
    "drop function privado.impedir_cambios() cascade",
    "create or replace function privado.auditar() returns trigger language sql as 'select 1'",
    "CREATE OR REPLACE FUNCTION privado.impedir_cambios() returns trigger language sql as 'select 1'",
    'create or replace function "privado"."registrar_auditoria"(text) returns void language sql as $f$ select 1 $f$',
    "alter function privado.auditar() security invoker",
    "alter function privado.registrar_auditoria(text, text, text, uuid) owner to conector",
    "alter procedure privado.impedir_cambios() set search_path = public",
    // MENOR del auditor (vuelta 2): disparador de auditoría, replica y permisos.
    "drop trigger alertas_auditar on public.alertas",
    "drop trigger if exists informes_auditar on public.informes",
    'drop trigger "clientes_auditar" on public.clientes',
    "alter table public.alertas enable replica trigger alertas_auditar",
    "alter table public.alertas enable replica trigger all",
    "grant select on public.auditoria to authenticated",
    "grant insert, update on table public.versiones_prompt to anon",
    'grant all on "public"."publicaciones" to conector',
    "grant select on all tables in schema public to anon",
    // Vuelta 3 (MENOR del auditor): renombrar disparadores, reglas, permisos por defecto y
    // concesiones sobre privado.
    "alter trigger auditoria_solo_insercion on public.auditoria rename to x",
    "alter trigger alertas_auditar on public.alertas rename to otro",
    "ALTER TRIGGER a ON public.b RENAME TO c",
    'alter trigger "a" on "public"."b" rename to c',
    "create rule r as on insert to public.auditoria do instead nothing",
    "CREATE OR REPLACE RULE r AS ON INSERT TO public.alertas DO INSTEAD NOTHING",
    "create rule r as on insert to public.alertas do also select 1",
    "alter rule r on public.alertas rename to s",
    "alter default privileges in schema public grant select on tables to anon",
    "alter default privileges for role postgres grant all on tables to anon",
    "alter default privileges for role postgres in schema privado grant execute on functions to authenticated",
    "ALTER DEFAULT PRIVILEGES GRANT ALL ON TABLES TO PUBLIC",
    "grant execute on function privado.auditar() to authenticated",
    "grant execute on function privado.f(text) to anon",
    'grant execute on function "privado"."f"() to conector',
    "grant execute on all functions in schema privado to anon",
    "grant usage on schema privado to authenticated",
    'grant usage on schema "privado" to anon',
    "grant all on schema privado to public",
    "grant create, usage on schema privado to conector",
    "grant execute on procedure privado.p() to anon",
    // Vuelta 4 (MENOR del auditor): políticas y vistas sobre las tablas protegidas.
    "create policy p on public.auditoria for select using (true)",
    'create policy "p" on "public"."versiones_prompt" for all to anon using (true)',
    "create policy p on public.publicaciones using (true)",
    "create view public.v as select * from public.auditoria",
    "create or replace view public.v as select * from public.versiones_prompt",
    "create materialized view public.v as select * from public.publicaciones",
    "create temp view v as select 1 from public.auditoria",
    "create recursive view public.v(a) as select 1 from public.publicaciones",
    // Vuelta 4 (MENOR del revisor): sin la palabra execute, solo la pauta de funciones de privado.
    "grant all on function privado.auditar() to anon",
    "grant all privileges on routine privado.f(text) to authenticated",
    "execute 'drop table public.auditoria'",
    // Vuelta 6 (MENOR del auditor): identificadores y literales con escapes Unicode, y E'…'.
    'drop table public.U&"audit\\006Fria"',
    'drop table public.u&"audit\\006fria"',
    "perform u&'\\0041'",
    "perform e'\\''",
    "perform E'x'",
    "execute pg_catalog.format('drop table %s', 'x')",
  ];
  for (const sentencia of MALAS) {
    it(`detecta: ${sentencia}`, () => {
      expect(reversionProhibida(`do $$ begin ${sentencia}; end $$;`)).toHaveLength(1);
    });
  }

  it("detecta también cuando las instrucciones van en un do con comentarios y en varias líneas", () => {
    expect(
      reversionProhibida(
        'do $$ begin\n-- limpio\ndrop trigger x on public.alertas;\ndrop table\n  public."auditoria";\nend $$;',
      ),
    ).toHaveLength(1);
  });

  it("acepta lo permitido: borrar objetos propios de M06 y sus disparadores", () => {
    const BUENA = `do $$ begin
      drop trigger informes_validar on public.informes;
      drop table public.informes;
      drop table public.ejecuciones;
      drop function privado.validar_informe();
      drop index public.alertas_por_cliente;
    end $$;`;
    expect(reversionProhibida(BUENA)).toEqual([]);
    // Nombres parecidos no son los protegidos.
    expect(reversionProhibida("drop table public.auditoria_extra")).toEqual([]);
    expect(reversionProhibida("drop trigger a on public.mi_auditoria")).toEqual([]);
    expect(reversionProhibida("drop function privado.registrar_auditoria_x()")).toEqual([]);
    expect(reversionProhibida("drop table public.alertas cascade")).toEqual([]);
    expect(reversionProhibida("grant select on public.alertas_auditoria_x to conector")).toEqual(
      [],
    );
    expect(reversionProhibida("drop trigger a_auditar_x on public.alertas")).toEqual([]);
    expect(
      reversionProhibida("create or replace function privado.validar_informe() returns trigger"),
    ).toEqual([]);
    expect(reversionProhibida("alter function privado.auditar_x() owner to postgres")).toEqual([]);
  });
});

describe("L 10: reversiones de M06 en adelante", () => {
  const sujetas = reversiones.filter((n) => !EXENTAS.some((e) => n.endsWith(e)));

  it("las exentas son solo M01 a M05", () => {
    for (const n of reversiones) {
      if (EXENTAS.some((e) => n.endsWith(e))) {
        expect(n).toMatch(/^20261120000[1-5]00_/);
      }
    }
  });

  it("ninguna reversión sujeta contiene los patrones prohibidos", () => {
    for (const n of sujetas) {
      const sql = readFileSync(new URL(n, DIR_REVERSIONES), "utf8");
      expect(reversionProhibida(sql), n).toEqual([]);
    }
  });
});

describe("L 10: ninguna reversión ajena a M04 y M05 nombra las tablas protegidas (vuelta 5)", () => {
  // Los únicos que las nombran por diseño: las reversiones de M04 (auditoría) y M05
  // (versiones y publicaciones). Las migraciones M07 y M09 (T-005, T-006) nombrarán
  // legítimamente esas tablas y no se miran aquí. Lista explícita: añadir aquí es una
  // decisión que revisan el revisor y el auditor-seguridad.
  const PERMITIDAS = ["20261120000400_auditoria.sql", "20261120000500_versiones_prompt.sql"];
  // El nombre como identificador entero, con o sin calificar; no como parte de otro
  // (auditoria_extra, mi_auditoria).
  const NOMBRA = new RegExp(`(?<![a-z0-9_])${PROTEGIDAS}(?![a-z0-9_])`);

  it("ninguna reversión fuera de M04 y M05 menciona auditoria, versiones_prompt ni publicaciones", () => {
    for (const n of reversiones) {
      if (PERMITIDAS.includes(n)) continue;
      const sql = readFileSync(new URL(n, DIR_REVERSIONES), "utf8");
      expect(NOMBRA.test(textoDeReversion(sql)), n).toBe(false);
    }
  });

  it("el detector de la mención reconoce las formas citadas, calificadas o no", () => {
    for (const t of [
      "public.auditoria",
      'public."versiones_prompt"',
      '"public"."publicaciones"',
      "auditoria",
      '"versiones_prompt"',
      "publicaciones",
    ]) {
      expect(NOMBRA.test(textoDeReversion(`select 1 from ${t}`)), t).toBe(true);
    }
    expect(
      NOMBRA.test(
        textoDeReversion(
          "do $$ begin perform pg_catalog.set_config('search_path', 'public', true); create policy p on auditoria using (true); end $$;",
        ),
      ),
    ).toBe(true);
    for (const t of [
      "auditoria_extra",
      "mi_auditoria",
      "public.publicaciones_x",
      "x_versiones_prompt",
    ]) {
      expect(NOMBRA.test(textoDeReversion(`select 1 from ${t}`)), t).toBe(false);
    }
  });

  it("el nombre sin calificar tras cambiar el search_path también lo detecta reversionProhibida", () => {
    expect(
      reversionProhibida(
        "do $$ begin perform pg_catalog.set_config('search_path', 'public', true); create policy p on auditoria using (true); end $$;",
      ),
    ).toHaveLength(1);
  });
});
