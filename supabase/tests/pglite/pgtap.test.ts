// Ejecución LOCAL de los archivos pgTAP de la 010 contra el arnés PGlite (T-008; D-034).
// Comprueba que cada aserción de 01, 02 y 07 se ejecuta y pasa sobre las migraciones y el seed, y
// que cada control puede fallar (mutaciones). NO es la ejecución de CI (`supabase test db`,
// T-013): PGlite no es Supabase (REQ-028, artículo 13).
import { readFileSync } from "node:fs";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { errorDe, valor, type Base } from "./arnes";
import { crearBaseConPgtap, ejecutarArchivo } from "./pgtap";

vi.setConfig({ testTimeout: 300_000, hookTimeout: 300_000 });

let db: Base;
beforeAll(async () => {
  db = await crearBaseConPgtap();
});
afterAll(async () => {
  await db.close();
});

const ARCHIVOS: [string, number][] = [
  ["01_estructura.test.sql", 38],
  ["07_informes.test.sql", 30],
  ["02_matriz_acceso.test.sql", 844],
];

/** Descripciones («N», «N-2 (a)») de las aserciones que fallan. */
async function falla(archivo: string): Promise<string[]> {
  const r = await ejecutarArchivo(db, archivo);
  return r.fallidas.map((l) => (/^not ok \d+ - (.*?) ·/.exec(l)?.[1] ?? l).trim());
}

const TABLAS_MONTADAS = ["clientes", "auditoria", "ordenes", "conexiones", "alertas"] as const;
const ANTES: Record<string, number> = {};
const contar = (tabla: string): Promise<number> =>
  valor<number>(db, `select count(*)::int from public.${tabla}`);
beforeAll(async () => {
  for (const tabla of TABLAS_MONTADAS) ANTES[tabla] = await contar(tabla);
});

describe("pgTAP en PGlite (local, no es CI)", () => {
  for (const [archivo, total] of ARCHIVOS) {
    it(`${archivo}: ${String(total)} aserciones declaradas, todas ejecutadas y ninguna fallida`, async () => {
      const r = await ejecutarArchivo(db, archivo);
      expect(r.plan).toBe(total);
      expect(r.lineas).toHaveLength(total);
      expect(r.fallidas, r.fallidas.join("\n")).toEqual([]);
      expect(r.finish.join("\n")).not.toMatch(/Looks like/);
    });
  }

  it("el archivo no deja nada en la base: la transacción se deshace", async () => {
    expect(await valor<number>(db, "select count(*)::int from public.informes")).toBe(3);
    expect(await valor<number>(db, "select count(*)::int from public.ejecuciones")).toBe(3);
    // 02 monta además un cliente, una orden, una conexión, una alerta y tres filas de auditoría (R2-m-5):
    // ninguna tabla que toque queda distinta de como estaba antes de los archivos.
    for (const tabla of TABLAS_MONTADAS) {
      expect(await contar(tabla), `queda algo en ${tabla}`).toBe(ANTES[tabla]);
    }
  });
});

// Cada control tiene que poder fallar: se rompe la base a propósito, se comprueba qué aserción
// lo ve y se deshace. «Mutación» aquí es un cambio de la base, no del archivo de pruebas.
const MUTACIONES: {
  nombre: string;
  archivo: string;
  rompe: string;
  deshace: string;
  fallan: string[];
}[] = [
  {
    nombre: "una tabla sin RLS",
    archivo: "01_estructura.test.sql",
    rompe: "alter table public.tokens disable row level security",
    deshace: "alter table public.tokens enable row level security",
    fallan: ["1"],
  },
  {
    nombre: "una columna de texto nueva en informes",
    archivo: "01_estructura.test.sql",
    rompe: "alter table public.informes add column nota text",
    deshace: "alter table public.informes drop column nota",
    fallan: ["3", "4", "5"],
  },
  {
    nombre: "un permiso de más para authenticated",
    archivo: "01_estructura.test.sql",
    rompe: "grant select on public.tokens to authenticated",
    deshace: "revoke select on public.tokens from authenticated",
    fallan: ["19"],
  },
  {
    nombre: "un permiso de escritura de service_role sin disparador de auditoría",
    archivo: "01_estructura.test.sql",
    rompe: "grant insert (estado) on public.informes to service_role",
    deshace: "revoke insert (estado) on public.informes from service_role",
    fallan: ["20", "23"],
  },
  {
    nombre: "anon con permiso de lectura (N-4)",
    archivo: "01_estructura.test.sql",
    rompe: "grant select on public.clientes to anon",
    deshace: "revoke select on public.clientes from anon",
    fallan: ["N-4 (a)"],
  },
  {
    nombre: "execute de PUBLIC en una función (N-4)",
    archivo: "01_estructura.test.sql",
    rompe: "grant execute on function privado.auditar() to public",
    deshace: "revoke execute on function privado.auditar() from public",
    fallan: ["N-4 (c)"],
  },
  {
    nombre: "un permiso por defecto de postgres para anon",
    archivo: "01_estructura.test.sql",
    rompe:
      "alter default privileges for role postgres in schema public grant select on tables to anon",
    deshace:
      "alter default privileges for role postgres in schema public revoke select on tables from anon",
    fallan: ["21"],
  },
  {
    nombre: "una función security definer fuera de la lista y sin ruta fijada (N-1, N-2)",
    archivo: "01_estructura.test.sql",
    rompe:
      "create function privado.intrusa() returns int language sql security definer as 'select 1'",
    deshace: "drop function privado.intrusa()",
    fallan: ["N-1", "N-2 (a)", "N-2 (b)"],
  },
  {
    nombre:
      "una versión nueva (otra firma) de una función de la lista, sin quitar la antigua (N-2 por firma)",
    archivo: "01_estructura.test.sql",
    rompe: `create function privado.es_admin(p_sesion uuid) returns boolean language sql security definer
              set search_path = pg_catalog, pg_temp as 'select false'`,
    deshace: "drop function privado.es_admin(uuid)",
    fallan: ["N-2 (a)", "N-2 (b)"],
  },
  {
    nombre:
      "una security definer con ruta fijada que escribe en una tabla auditada sin auditar (N-2)",
    archivo: "01_estructura.test.sql",
    rompe: `create function privado.escribe() returns void language plpgsql security definer
              set search_path = pg_catalog, pg_temp
              as $f$ begin update public.clientes set canal = canal; end $f$`,
    deshace: "drop function privado.escribe()",
    fallan: ["N-2 (a)", "N-2 (b)", "N-2 (c)"],
  },
  {
    nombre:
      "execute de PUBLIC por defecto para funciones (la fila global de pg_default_acl desaparece al volver al valor de serie)",
    archivo: "01_estructura.test.sql",
    rompe: "alter default privileges for role postgres grant execute on functions to public",
    deshace: "alter default privileges for role postgres revoke execute on functions from public",
    fallan: ["21"],
  },
  {
    nombre: "authenticated con grant option sobre un permiso ya admitido (is_grantable)",
    archivo: "01_estructura.test.sql",
    rompe: "grant select on public.clientes to authenticated with grant option",
    deshace: "revoke grant option for select on public.clientes from authenticated",
    fallan: ["N-4 (g)"],
  },
  {
    nombre: "usage en privado para anon",
    archivo: "01_estructura.test.sql",
    rompe: "grant usage on schema privado to anon",
    deshace: "revoke usage on schema privado from anon",
    fallan: ["18", "N-4 (e)", "N-4 (f)"],
  },
  {
    nombre: "un disparador de inmutabilidad que deja de ser always",
    archivo: "01_estructura.test.sql",
    rompe: "alter table public.auditoria enable trigger auditoria_solo_insercion",
    deshace: "alter table public.auditoria enable always trigger auditoria_solo_insercion",
    fallan: ["17"],
  },
  {
    nombre: "usage en un tipo para PUBLIC (N-4 d)",
    archivo: "01_estructura.test.sql",
    rompe: "grant usage on type public.canal to public",
    deshace: "revoke usage on type public.canal from public",
    fallan: ["N-4 (d)"],
  },
  {
    nombre:
      "service_role con permiso y política, pero con los disparadores: el error ya no es 42501 (exacto)",
    archivo: "07_informes.test.sql",
    rompe: `create policy permisiva on public.informes for all to service_role using (true) with check (true);
            grant insert on public.informes to service_role`,
    deshace: `revoke insert on public.informes from service_role;
              drop policy permisiva on public.informes`,
    fallan: ["8", "9", "10", "12", "13"],
  },
  {
    nombre: "un rango del informe cambiado (contrato)",
    archivo: "07_informes.test.sql",
    rompe: `do $f$ declare n text; begin
              select conname into n from pg_constraint
               where conrelid = 'public.informes'::regclass and pg_get_constraintdef(oid) like '%tratados >= 0%';
              execute format('alter table public.informes drop constraint %I', n);
              alter table public.informes add constraint tratados_cambiado check (tratados between 0 and 2000);
            end $f$`,
    deshace: `alter table public.informes drop constraint tratados_cambiado;
              alter table public.informes add constraint informes_tratados_check check (tratados between 0 and 1000)`,
    fallan: ["23"],
  },
  {
    nombre: "service_role con permiso y sin validación: el intento deja de rechazarse",
    archivo: "07_informes.test.sql",
    rompe: `create policy permisiva on public.informes for all to service_role using (true) with check (true);
            grant insert on public.informes to service_role;
            alter table public.informes disable trigger informes_validar`,
    deshace: `alter table public.informes enable trigger informes_validar;
              revoke insert on public.informes from service_role;
              drop policy permisiva on public.informes`,
    fallan: ["8", "9"],
  },
  {
    nombre:
      "execute para authenticated en una función interna más un envoltorio de invocador en public (A-11, M-1 a)",
    archivo: "01_estructura.test.sql",
    rompe: `grant execute on function privado.registrar_auditoria(text,text,text,uuid) to authenticated;
            create function public.anotar(p_a text) returns void language sql
              as 'select privado.registrar_auditoria(p_a, p_a, p_a, null)';
            grant execute on function public.anotar(text) to authenticated`,
    deshace: `drop function public.anotar(text);
              revoke execute on function privado.registrar_auditoria(text,text,text,uuid) from authenticated`,
    fallan: ["N-4 (h)"],
  },
  {
    nombre: "execute de licencia_vigente para authenticated (M-1 b)",
    archivo: "01_estructura.test.sql",
    rompe: "grant execute on function privado.licencia_vigente(uuid) to authenticated",
    deshace: "revoke execute on function privado.licencia_vigente(uuid) from authenticated",
    fallan: ["N-4 (h)"],
  },
  {
    nombre: "execute de mcp_enviar_informe para service_role (M-1 c)",
    archivo: "01_estructura.test.sql",
    rompe: "grant execute on function privado.mcp_enviar_informe(text,uuid,jsonb) to service_role",
    deshace:
      "revoke execute on function privado.mcp_enviar_informe(text,uuid,jsonb) from service_role",
    fallan: ["N-4 (h)"],
  },
  {
    nombre: "una columna bytea en informes (A-14, M-2)",
    archivo: "01_estructura.test.sql",
    rompe: "alter table public.informes add column remitente bytea",
    deshace: "alter table public.informes drop column remitente",
    fallan: ["3", "5"],
  },
  {
    nombre: "un dominio sobre text como columna de informes (A-14, M-2)",
    archivo: "01_estructura.test.sql",
    rompe: `create domain public.texto_libre as text;
            alter table public.informes add column asunto public.texto_libre`,
    deshace: `alter table public.informes drop column asunto;
              drop domain public.texto_libre`,
    fallan: ["3", "5"],
  },
  {
    nombre: "una columna xml en reglas_cliente (A-14, M-2)",
    archivo: "01_estructura.test.sql",
    rompe: "alter table public.reglas_cliente add column nota xml",
    deshace: "alter table public.reglas_cliente drop column nota",
    fallan: ["3", "5"],
  },
  {
    nombre: "un disparador de auditoría desactivado (tgenabled = D, A-11, M-3)",
    archivo: "01_estructura.test.sql",
    rompe: "alter table public.clientes disable trigger clientes_auditar",
    deshace: "alter table public.clientes enable trigger clientes_auditar",
    fallan: ["23"],
  },
  {
    nombre: "un disparador de auditoría solo en réplica (tgenabled = R, A-11, M-3)",
    archivo: "01_estructura.test.sql",
    rompe: "alter table public.clientes enable replica trigger clientes_auditar",
    deshace: "alter table public.clientes enable trigger clientes_auditar",
    fallan: ["23"],
  },
  {
    nombre:
      "el check de version_prompt sustituido por uno que no es una expresión regular anclada (m-3)",
    archivo: "01_estructura.test.sql",
    rompe: `alter table public.informes drop constraint informes_version_prompt_check;
            alter table public.informes add constraint informes_version_prompt_check check (version_prompt <> '')`,
    deshace: `alter table public.informes drop constraint informes_version_prompt_check;
              alter table public.informes add constraint informes_version_prompt_check
                check (version_prompt ~ '^[0-9]+\\.[0-9]+(\\.[0-9]+)?$' and char_length(version_prompt) <= 12)`,
    fallan: ["4"],
  },
  {
    nombre: "un rol de la plataforma miembro de otro (authenticated dentro de anon, m-2)",
    archivo: "01_estructura.test.sql",
    rompe: "grant authenticated to anon",
    deshace: "revoke authenticated from anon",
    fallan: ["N-4 (i)"],
  },
  {
    nombre:
      "el check de rango de tratados con otro nombre: el caso 5 ya no se rechaza por él (m-4)",
    archivo: "07_informes.test.sql",
    rompe:
      "alter table public.informes rename constraint informes_tratados_check to informes_tratados_otro",
    deshace:
      "alter table public.informes rename constraint informes_tratados_otro to informes_tratados_check",
    fallan: ["5"],
  },
  {
    nombre: "el check de cardinalidad con otro nombre: el caso 3 ya no se rechaza por él (m-4)",
    archivo: "07_informes.test.sql",
    rompe:
      "alter table public.informes rename constraint informes_problemas_check to informes_problemas_otro",
    deshace:
      "alter table public.informes rename constraint informes_problemas_otro to informes_problemas_check",
    fallan: ["3"],
  },
  {
    nombre: "una restricción que rechaza también la sentencia base: el caso positivo falla (m-4)",
    archivo: "07_informes.test.sql",
    rompe: "alter table public.informes add constraint rechaza_base check (tratados <> 5)",
    deshace: "alter table public.informes drop constraint rechaza_base",
    fallan: ["15"],
  },
  {
    nombre: "TRUNCATE para el conector (N-4 (j), A-M-4, A1)",
    archivo: "01_estructura.test.sql",
    rompe: "grant truncate on public.informes to conector",
    deshace: "revoke truncate on public.informes from conector",
    fallan: ["N-4 (j)"],
  },
  {
    nombre: "REFERENCES y TRIGGER para el conector (N-4 (j), A-M-4, A2)",
    archivo: "01_estructura.test.sql",
    rompe: "grant references, trigger on public.licencias to conector",
    deshace: "revoke references, trigger on public.licencias from conector",
    fallan: ["N-4 (j)"],
  },
  {
    nombre: "MAINTAIN para el conector (N-4 (j), A-M-4, A3)",
    archivo: "01_estructura.test.sql",
    rompe: "grant maintain on public.informes to conector",
    deshace: "revoke maintain on public.informes from conector",
    fallan: ["N-4 (j)"],
  },
  {
    nombre: "una secuencia nueva en public con permisos para el conector (N-4 (j), A-m-1, A10)",
    archivo: "01_estructura.test.sql",
    rompe: `create sequence public.secuencia_fuga;
            revoke all on sequence public.secuencia_fuga from anon, authenticated, service_role;
            grant usage, select on sequence public.secuencia_fuga to conector`,
    deshace: "drop sequence public.secuencia_fuga",
    fallan: ["N-4 (j)"],
  },
  {
    nombre: "un permiso de columna para el conector (N-4 (j))",
    archivo: "01_estructura.test.sql",
    rompe: "grant select (id) on public.informes to conector",
    deshace: "revoke select (id) on public.informes from conector",
    fallan: ["N-4 (j)"],
  },
  {
    nombre: "un esquema nuevo con una tabla legible por anon (N-4 (k), A-m-1, A11)",
    archivo: "01_estructura.test.sql",
    rompe: `create schema fuga;
            create table fuga.t (id int);
            grant usage on schema fuga to anon;
            grant select on fuga.t to anon`,
    deshace: "drop schema fuga cascade",
    fallan: ["N-4 (k)"],
  },
  {
    nombre: "un esquema nuevo con usage para PUBLIC y sin tablas (N-4 (k))",
    archivo: "01_estructura.test.sql",
    rompe: "create schema fuga2; grant usage on schema fuga2 to public",
    deshace: "drop schema fuga2",
    fallan: ["N-4 (k)"],
  },
];

describe("cada control de 01, 02 y 07 puede fallar (mutaciones de la base)", () => {
  for (const m of MUTACIONES) {
    it(`${m.nombre}: falla ${m.fallan.join(", ")} en ${m.archivo}`, async () => {
      await db.exec(m.rompe);
      let vistas: string[];
      try {
        vistas = await falla(m.archivo);
      } finally {
        await db.exec(m.deshace);
      }
      for (const esperada of m.fallan) {
        expect(vistas, `debía fallar ${esperada}`).toContain(esperada);
      }
    });
  }

  it("tras deshacer todas las mutaciones, 01, 02 y 07 vuelven a pasar", async () => {
    for (const [archivo] of ARCHIVOS) expect(await falla(archivo)).toEqual([]);
  });
});

describe("sombras de N-3 (ayudas/sombras.psql) y ayudas de perfiles", () => {
  const AYUDAS = ["../ayudas/perfiles.psql", "../ayudas/sombras.psql"].map((r) =>
    readFileSync(new URL(r, import.meta.url), "utf8"),
  );

  async function enTransaccion(cuerpo: string): Promise<string | null> {
    await db.exec(`begin;\n${AYUDAS.join("\n")}`);
    try {
      return await errorDe(() => db.exec(cuerpo));
    } finally {
      await db.exec("rollback");
    }
  }

  it("una tabla, una vista y un tipo sin calificar fallan con sombra_usada; calificados, no", async () => {
    expect(await enTransaccion("select * from clientes")).toContain("sombra_usada");
    expect(await enTransaccion("select * from resumen_cliente")).toContain("sombra_usada");
    expect(await enTransaccion("select 'activo'::estado_cliente")).toContain("sombra_usada");
    expect(await enTransaccion("select * from public.clientes")).toBeNull();
    expect(await enTransaccion("select 'activo'::public.estado_cliente")).toBeNull();
  });

  it("una función que usa un nombre sin calificar cae en la sombra", async () => {
    const e = await enTransaccion(`
      create function privado.sin_calificar() returns bigint language sql as 'select count(*) from clientes';
      select privado.sin_calificar()`);
    expect(e).toContain("sombra_usada");
  });

  it("pg_temp.como da la sesión de cada perfil, y pg_temp.huella cambia si cambia la tabla", async () => {
    await db.exec(`begin;\n${AYUDAS.join("\n")}`);
    try {
      const perfiles: Record<string, [string, string | null]> = {
        UA: ["authenticated", "00000000-0000-4000-8000-00000000001a"],
        AD2: ["authenticated", "00000000-0000-4000-8000-00000000001f"],
        SR: ["service_role", null],
        SS: ["anon", null],
        CON: ["conector", null],
      };
      for (const [perfil, [rol, sub]] of Object.entries(perfiles)) {
        const uid = perfil === "CON" ? "null::text" : "(auth.uid())::text";
        const r = await db.exec(
          `select pg_temp.como('${perfil}'); select current_user::text as actual, ${uid} as uid; select pg_temp.como('DUENO');`,
        );
        const fila = r[1]?.rows[0] as { actual: string; uid: string | null } | undefined;
        expect(fila?.actual, perfil).toBe(rol);
        expect(fila?.uid ?? null, perfil).toBe(sub);
      }
      const antes = await valor<string>(db, "select pg_temp.huella('public.catalogo_problemas')");
      expect(await valor<string>(db, "select pg_temp.huella('public.catalogo_problemas')")).toBe(
        antes,
      );
      await db.exec(
        "update public.catalogo_problemas set activo = not activo where codigo = 'otro'",
      );
      expect(
        await valor<string>(db, "select pg_temp.huella('public.catalogo_problemas')"),
      ).not.toBe(antes);
      expect(await errorDe(() => db.exec("select pg_temp.como('INVENTADO')"))).toContain(
        "perfil_desconocido",
      );
    } finally {
      await db.exec("rollback");
    }
  });

  it("pg_temp.id falla cerrado con un nombre desconocido (nunca devuelve nulo) y conoce el cliente OAuth", async () => {
    expect(await enTransaccion("select pg_temp.id('INVENTADO')")).toContain("perfil_desconocido");
    await db.exec(`begin;\n${AYUDAS.join("\n")}`);
    try {
      expect(await valor<string>(db, "select pg_temp.id('OA')::text")).toBe(
        "00000000-0000-4000-8000-0000000000f2",
      );
    } finally {
      await db.exec("rollback");
    }
  });
});
