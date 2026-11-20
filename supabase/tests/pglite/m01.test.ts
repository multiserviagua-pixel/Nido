// M01 `privado_rol_y_permisos` en PGlite (T-001; D-1, D-4, D-9).
// REQ-002, REQ-011, REQ-012, REQ-029, REQ-030, REQ-033 · CA-008 (pasos 1 y 2), CA-024 (local).
// Comprueba SQL válido y comportamiento; no sustituye a pgTAP (CI, T-013).
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  aplicar,
  aplicarTodas,
  ciclo,
  como,
  crearBase,
  dividirSentencias,
  ejecutarEnAutocommit,
  ejecutarSigueTrasError,
  errorDe,
  instantanea,
  leerMigracion,
  leerReversion,
  nombreDe,
  revertir,
  sinFilasGlobales,
  valor,
  type Base,
} from "./arnes";

// Cada prueba levanta una o dos bases PGlite: con todo el conjunto en paralelo
// (npm test) los 5 s por defecto no bastan.
vi.setConfig({ testTimeout: 60_000, hookTimeout: 60_000 });

const CINCO = ["public", "anon", "authenticated", "service_role", "conector"];
const M01 = () => nombreDe("privado_rol_y_permisos");

let db: Base;
beforeEach(async () => {
  db = await crearBase();
});
afterEach(async () => {
  await db.close();
});

/** Entradas de permisos por defecto de `postgres` que conceden algo a los cinco destinatarios. */
async function concesionesPorDefecto(): Promise<{ esquema: string; tipo: string; para: string }[]> {
  const r = await db.query<{ esquema: string; tipo: string; para: string }>(
    `select coalesce(n.nspname, '*') as esquema, d.defaclobjtype::text as tipo,
        case when a.grantee = 0 then 'public' else a.grantee::regrole::text end as para
      from pg_default_acl d
      left join pg_namespace n on n.oid = d.defaclnamespace
      cross join lateral aclexplode(d.defaclacl) a
      where d.defaclrole = 'postgres'::regrole and d.defaclobjtype in ('r', 'S', 'f')
        and (a.grantee = 0 or a.grantee::regrole::text = any($1))
        and (a.grantee <> d.defaclrole)
      order by 1, 2, 3`,
    [CINCO],
  );
  return r.rows;
}

describe("REQ-002: base vacía y orden", () => {
  it("aplicar todas las migraciones en orden sobre una base vacía no da errores", async () => {
    await aplicarTodas(db);
    expect(
      await valor(db, "select count(*)::int from pg_namespace where nspname = 'privado'"),
    ).toBe(1);
  });
});

describe("guarda de rol (L 11 en ejecución)", () => {
  it("aplicar con otro rol falla con migracion_rol_no_permitido y no deja nada", async () => {
    const mensaje = await como(db, "anon", null, () => errorDe(() => aplicar(db, M01())));
    expect(mensaje).toContain("migracion_rol_no_permitido");
    expect(
      await valor(db, "select count(*)::int from pg_namespace where nspname = 'privado'"),
    ).toBe(0);
    expect(await valor(db, "select count(*)::int from pg_roles where rolname = 'conector'")).toBe(
      0,
    );
  });

  it("revertir con otro rol falla con migracion_rol_no_permitido y no toca nada", async () => {
    await aplicar(db, M01());
    const antes = await instantanea(db);
    const mensaje = await como(db, "authenticated", null, () => errorDe(() => revertir(db, M01())));
    expect(mensaje).toContain("migracion_rol_no_permitido");
    expect(await instantanea(db)).toEqual(antes);
  });
});

describe("REQ-012, D-9: rol conector", () => {
  it("tiene los atributos de D-9, connection limit 10 y statement_timeout 5s", async () => {
    await aplicar(db, M01());
    const r = await db.query<Record<string, unknown>>(
      `select rolsuper, rolinherit, rolcreaterole, rolcreatedb, rolcanlogin, rolreplication,
          rolbypassrls, rolconnlimit, rolconfig::text as config
        from pg_roles where rolname = 'conector'`,
    );
    expect(r.rows).toEqual([
      {
        rolsuper: false,
        rolinherit: false,
        rolcreaterole: false,
        rolcreatedb: false,
        rolcanlogin: false,
        rolreplication: false,
        rolbypassrls: false,
        rolconnlimit: 10,
        config: "{statement_timeout=5s}",
      },
    ]);
  });

  it("si conector ya existe, M01 falla y no deja nada a medias", async () => {
    await db.exec("create role conector nologin");
    const antes = await instantanea(db);
    const mensaje = await errorDe(() => aplicar(db, M01()));
    expect(mensaje).not.toBeNull();
    expect(mensaje).toMatch(/conector/);
    expect(await instantanea(db)).toEqual(antes);
  });

  it("tras reaplicar, conector sigue sin inicio de sesión (fallo seguro)", async () => {
    await aplicar(db, M01());
    await revertir(db, M01());
    await aplicar(db, M01());
    expect(await valor(db, "select rolcanlogin from pg_roles where rolname = 'conector'")).toBe(
      false,
    );
  });

  it("conector no tiene ningún permiso en privado ni sobre su tabla", async () => {
    await aplicar(db, M01());
    for (const rol of ["conector", "anon", "authenticated", "service_role"]) {
      const mensaje = await como(db, rol, null, () =>
        errorDe(() => db.query("select * from privado.permisos_por_defecto_previos")),
      );
      expect(mensaje, rol).toMatch(/permission denied/i);
    }
  });
});

describe("REQ-011, D-4: cierre de permisos por defecto", () => {
  it("antes de M01 hay concesiones a los cinco (comprobación del preámbulo)", async () => {
    const antes = await concesionesPorDefecto();
    expect(antes.some((c) => c.esquema === "*")).toBe(true);
    expect(antes.some((c) => c.esquema === "public")).toBe(true);
    expect(antes.some((c) => c.esquema === "extensions")).toBe(true);
  });

  it("deja 0 concesiones de postgres a los cinco, globales y por esquema", async () => {
    await aplicar(db, M01());
    expect(await concesionesPorDefecto()).toEqual([]);
  });

  it("no toca los permisos por defecto de otro rol ni de otro destinatario", async () => {
    const filas = async () =>
      (
        await db.query(
          `select d.defaclrole::regrole::text as rol, coalesce(n.nspname, '*') as esquema,
              d.defaclobjtype::text as tipo, d.defaclacl::text as acl
            from pg_default_acl d left join pg_namespace n on n.oid = d.defaclnamespace
            where d.defaclrole <> 'postgres'::regrole order by 1, 2, 3`,
        )
      ).rows;
    const antes = await filas();
    expect(antes.length).toBeGreaterThan(0);
    await aplicar(db, M01());
    expect(await filas()).toEqual(antes);
    // conector_prueba conserva su select por defecto de postgres en public
    const r = await db.query(
      `select 1 from pg_default_acl d cross join lateral aclexplode(d.defaclacl) a
        where d.defaclrole = 'postgres'::regrole and d.defaclnamespace = 'public'::regnamespace
          and d.defaclobjtype = 'r' and a.grantee = 'conector_prueba'::regrole
          and a.privilege_type = 'SELECT'`,
    );
    expect(r.rows).toHaveLength(1);
  });

  it("CA-008 (pasos 1 y 2): objetos nuevos no dan permisos a los cinco", async () => {
    await aplicar(db, M01());
    await db.exec(`
      create function privado.f_nueva() returns int language sql as 'select 1';
      create table public.t_nueva (id int);
      create view public.v_nueva as select 1 as x;
      create function public.f_publica() returns int language sql as 'select 1';
      create schema esquema_nuevo;
      create table esquema_nuevo.t (id int);
      create function esquema_nuevo.f() returns int language sql as 'select 1';
      create sequence public.s_nueva;
    `);
    const r = await db.query<{ objeto: string; para: string }>(
      `select o.objeto, case when a.grantee = 0 then 'public' else a.grantee::regrole::text end as para
        from (
          select 'tabla ' || c.oid::regclass::text as objeto,
              coalesce(c.relacl, acldefault(case c.relkind when 'S' then 's' else 'r' end::"char", c.relowner)) as acl
            from pg_class c where c.oid in ('public.t_nueva'::regclass, 'public.v_nueva'::regclass,
              'esquema_nuevo.t'::regclass, 'public.s_nueva'::regclass)
          union all
          select 'funcion ' || p.oid::regprocedure::text,
              coalesce(p.proacl, acldefault('f', p.proowner))
            from pg_proc p where p.oid in ('privado.f_nueva()'::regprocedure,
              'public.f_publica()'::regprocedure, 'esquema_nuevo.f()'::regprocedure)
        ) o cross join lateral aclexplode(o.acl) a
        where a.grantee = 0 or a.grantee::regrole::text = any($1)`,
      [CINCO],
    );
    expect(r.rows).toEqual([]);
    // Y con las funciones de privilegios efectivos, para anon, authenticated, service_role y conector.
    for (const rol of ["anon", "authenticated", "service_role", "conector"]) {
      expect(
        await valor(db, "select has_table_privilege($1, 'public.t_nueva', 'select')", [rol]),
        rol,
      ).toBe(false);
      expect(
        await valor(db, "select has_table_privilege($1, 'public.v_nueva', 'select')", [rol]),
        rol,
      ).toBe(false);
      expect(
        await valor(db, "select has_function_privilege($1, 'public.f_publica()', 'execute')", [
          rol,
        ]),
        rol,
      ).toBe(false);
      expect(
        await valor(db, "select has_function_privilege($1, 'privado.f_nueva()', 'execute')", [rol]),
        rol,
      ).toBe(false);
      expect(
        await valor(db, "select has_table_privilege($1, 'esquema_nuevo.t', 'select')", [rol]),
        rol,
      ).toBe(false);
      expect(
        await valor(db, "select has_function_privilege($1, 'esquema_nuevo.f()', 'execute')", [rol]),
        rol,
      ).toBe(false);
    }
  });
});

describe("REQ-033: esquema privado", () => {
  it("privado no da usage a PUBLIC, anon, authenticated, service_role ni conector", async () => {
    await aplicar(db, M01());
    const r = await db.query(
      `select 1 from pg_namespace n cross join lateral aclexplode(n.nspacl) a
        where n.nspname = 'privado' and a.grantee <> n.nspowner`,
    );
    expect(r.rows).toEqual([]);
    for (const rol of ["anon", "authenticated", "service_role", "conector"]) {
      expect(
        await valor(db, "select has_schema_privilege($1, 'privado', 'usage')", [rol]),
        rol,
      ).toBe(false);
    }
  });

  it("privado.permisos_por_defecto_previos: RLS, ninguna política, sin permisos y con las filas previas", async () => {
    const previas = await valor<number>(
      db,
      "select count(*)::int from pg_default_acl where defaclrole = 'postgres'::regrole and defaclobjtype in ('r', 'S', 'f')",
    );
    expect(previas).toBeGreaterThan(0);
    await aplicar(db, M01());
    expect(
      await valor(
        db,
        "select relrowsecurity from pg_class where oid = 'privado.permisos_por_defecto_previos'::regclass",
      ),
    ).toBe(true);
    expect(
      await valor(db, "select count(*)::int from pg_policies where schemaname = 'privado'"),
    ).toBe(0);
    const permisos = await db.query(
      `select 1 from pg_class c cross join lateral aclexplode(c.relacl) a
        where c.oid = 'privado.permisos_por_defecto_previos'::regclass and a.grantee <> c.relowner`,
    );
    expect(permisos.rows).toEqual([]);
    expect(
      await valor(
        db,
        "select count(distinct (esquema, tipo))::int from privado.permisos_por_defecto_previos",
      ),
    ).toBe(previas);
  });

  it("no queda ninguna tabla temporal tras aplicar (la copia es on commit drop)", async () => {
    await aplicar(db, M01());
    expect(
      await valor(
        db,
        "select count(*)::int from pg_class c join pg_namespace n on n.oid = c.relnamespace where n.nspname like 'pg\\_temp%' and c.relkind = 'r'",
      ),
    ).toBe(0);
  });
});

describe("REQ-030: todo o nada", () => {
  it("revertir con un objeto en privado falla y deja todo igual", async () => {
    await aplicar(db, M01());
    await db.exec("create function privado.ajena() returns int language sql as 'select 1'");
    const antes = await instantanea(db);
    const mensaje = await errorDe(() => revertir(db, M01()));
    expect(mensaje).toContain("reversion_con_objetos");
    expect(await instantanea(db)).toEqual(antes);
  });

  it("revertir con una tabla o un tipo en public falla", async () => {
    await aplicar(db, M01());
    await db.exec("create table public.ajena (id int)");
    expect(await errorDe(() => revertir(db, M01()))).toContain("reversion_con_objetos");
    await db.exec("drop table public.ajena; create type public.tipo_ajeno as enum ('a')");
    expect(await errorDe(() => revertir(db, M01()))).toContain("reversion_con_objetos");
  });

  it("sin objetos ajenos, revertir funciona y borra rol y esquema", async () => {
    await aplicar(db, M01());
    expect(await errorDe(() => revertir(db, M01()))).toBeNull();
    expect(await valor(db, "select count(*)::int from pg_roles where rolname = 'conector'")).toBe(
      0,
    );
    expect(
      await valor(db, "select count(*)::int from pg_namespace where nspname = 'privado'"),
    ).toBe(0);
  });
});

describe("REQ-029, CA-024 (local): ciclo aplicar → revertir → reaplicar", () => {
  it("el catálogo tras revertir es idéntico al de antes y el reaplicado al primero", async () => {
    const c = await ciclo(db, M01());
    expect(c.trasAplicar).not.toEqual(c.antes);
    expect(c.trasRevertir).toEqual(c.antes);
    expect(c.trasReaplicar).toEqual(c.trasAplicar);
  });

  it("revertir restaura los permisos por defecto de los cinco tal como estaban", async () => {
    const antes = await concesionesPorDefecto();
    await aplicar(db, M01());
    await revertir(db, M01());
    expect(await concesionesPorDefecto()).toEqual(antes);
  });
});

describe("A: atomicidad con cualquier cliente (autocommit, sentencia a sentencia)", () => {
  it("M01 y su reversión son dos sentencias: la guarda y un único bloque do", () => {
    for (const sql of [leerMigracion(M01()), leerReversion(M01())]) {
      const s = dividirSentencias(sql);
      expect(s).toHaveLength(2);
      expect(s[0]).toMatch(/^do \$\$ begin if current_user operator\(pg_catalog\.<>\) 'postgres'/);
      expect(s[1]).toMatch(/^do \$\$/);
    }
  });

  it("aplicar y revertir en autocommit dan el mismo resultado que en bloque", async () => {
    const antes = await instantanea(db);
    await ejecutarEnAutocommit(db, leerMigracion(M01()));
    const trasAplicar = await instantanea(db);
    await ejecutarEnAutocommit(db, leerReversion(M01()));
    expect(trasAplicar).not.toEqual(antes);
    expect(await instantanea(db)).toEqual(antes);
  });

  it("M01 falla con conector ya existente (nologin o con login): no cambia nada", async () => {
    for (const atributo of ["nologin", "login"]) {
      const base = await crearBase();
      try {
        await base.exec(`create role conector ${atributo}`);
        const antes = await instantanea(base);
        const mensaje = await errorDe(() => ejecutarEnAutocommit(base, leerMigracion(M01())));
        expect(mensaje, atributo).toMatch(/conector/);
        expect(await instantanea(base), atributo).toEqual(antes);
      } finally {
        await base.close();
      }
    }
  });

  it("M01 con otro rol, en autocommit, no deja nada", async () => {
    const antes = await instantanea(db);
    const mensaje = await como(db, "anon", null, () =>
      errorDe(() => ejecutarEnAutocommit(db, leerMigracion(M01()))),
    );
    expect(mensaje).toContain("migracion_rol_no_permitido");
    expect(await instantanea(db)).toEqual(antes);
  });

  // Fallos tardíos de la reversión: cada caso deja la base como estaba, con M01
  // aplicado, sin reabrir los permisos por defecto y sin tocar el rol.
  const FUERA =
    "create schema otro; create table otro.t (id int); grant select on otro.t to conector";
  const casosTardios: [string, string, string, boolean][] = [
    ["conector con un permiso fuera de public y privado", FUERA, "conector", false],
    [
      "conector con login y un permiso fuera de public y privado",
      `alter role conector login; ${FUERA}`,
      "conector",
      true,
    ],
    [
      "objetos de M02 aún aplicados (tabla y tipo en public)",
      "create type public.estado_x as enum ('a'); create table public.clientes (id int)",
      "reversion_con_objetos",
      false,
    ],
    [
      "objeto ajeno en privado y conector con login",
      "alter role conector login; create function privado.ajena() returns int language sql as 'select 1'",
      "reversion_con_objetos",
      true,
    ],
  ];
  for (const [nombre, preparacion, esperado, conLogin] of casosTardios) {
    it(`reversión en autocommit con ${nombre}: falla y no cambia nada`, async () => {
      await aplicar(db, M01());
      await db.exec(preparacion);
      const antes = await instantanea(db);
      const mensaje = await errorDe(() => ejecutarEnAutocommit(db, leerReversion(M01())));
      expect(mensaje).toContain(esperado);
      expect(await instantanea(db)).toEqual(antes);
      expect(await concesionesPorDefecto()).toEqual([]);
      expect(await valor(db, "select rolcanlogin from pg_roles where rolname = 'conector'")).toBe(
        conLogin,
      );
      // La tabla de copias sigue ahí: se puede reintentar la reversión.
      expect(
        await valor(db, "select count(*)::int from privado.permisos_por_defecto_previos"),
      ).toBeGreaterThan(0);
    });
  }

  it("tras un fallo tardío y retirar la causa, la reversión en autocommit termina bien", async () => {
    await aplicar(db, M01());
    await db.exec(FUERA);
    expect(await errorDe(() => ejecutarEnAutocommit(db, leerReversion(M01())))).not.toBeNull();
    await db.exec("drop table otro.t; drop schema otro");
    expect(await errorDe(() => ejecutarEnAutocommit(db, leerReversion(M01())))).toBeNull();
  });
});

describe("B: privado cerrado a los cinco aunque el esquema nazca con concesiones por defecto", () => {
  it("el preámbulo concede usage a los esquemas nuevos y M01 lo quita en privado", async () => {
    await db.exec("create schema sonda");
    expect(await valor(db, "select has_schema_privilege('anon', 'sonda', 'usage')")).toBe(true);
    await aplicar(db, M01());
    for (const rol of ["anon", "authenticated", "service_role", "conector"]) {
      expect(
        await valor(db, "select has_schema_privilege($1, 'privado', 'usage')", [rol]),
        rol,
      ).toBe(false);
      expect(
        await valor(db, "select has_schema_privilege($1, 'privado', 'create')", [rol]),
        rol,
      ).toBe(false);
    }
    expect(await valor(db, "select nspacl::text from pg_namespace where nspname = 'privado'")).toBe(
      "{postgres=UC/postgres}",
    );
  });
});

describe("C: conector no es miembro de nada ni tiene miembros", () => {
  it("pg_auth_members: conector no es miembro; como rol, solo postgres con admin option", async () => {
    await aplicar(db, M01());
    const comoMiembro = await db.query(
      "select 1 from pg_auth_members where member = 'conector'::regrole",
    );
    expect(comoMiembro.rows).toEqual([]);
    const conMiembros = await db.query<{ miembro: string; admin_option: boolean }>(
      `select m.rolname as miembro, a.admin_option
         from pg_auth_members a join pg_roles m on m.oid = a.member
        where a.roleid = 'conector'::regrole`,
    );
    // PG16+: quien crea un rol con CREATEROLE recibe admin option sobre él (solo postgres).
    for (const fila of conMiembros.rows) {
      expect(fila.miembro).toBe("postgres");
      expect(fila.admin_option).toBe(true);
    }
    expect(await valor(db, "select pg_has_role('authenticated', 'conector', 'member')")).toBe(
      false,
    );
    expect(await valor(db, "select pg_has_role('conector', 'authenticated', 'member')")).toBe(
      false,
    );
  });
});

describe("D: sin filas globales de postgres, la rama acldefault restaura el valor de serie", () => {
  it("la copia guarda el valor de serie y la reversión lo devuelve", async () => {
    await sinFilasGlobales(db);
    expect(
      await valor(
        db,
        "select count(*)::int from pg_default_acl where defaclrole = 'postgres'::regrole and defaclnamespace = 0 and defaclobjtype in ('r', 'S', 'f')",
      ),
      "precondición: sin filas globales",
    ).toBe(0);
    const antes = await instantanea(db);
    await aplicar(db, M01());
    const copia = await db.query<{ acl: string }>(
      "select acl::text from privado.permisos_por_defecto_previos where esquema is null and tipo = 'f'",
    );
    expect(copia.rows).toEqual([{ acl: "{=X/postgres,postgres=X/postgres}" }]);
    await revertir(db, M01());
    expect(await instantanea(db)).toEqual(antes);
  });

  it("una función nueva tras revertir vuelve a ser ejecutable por PUBLIC, como de serie", async () => {
    await sinFilasGlobales(db);
    await aplicar(db, M01());
    await revertir(db, M01());
    await db.exec("create function public.f_serie() returns int language sql as 'select 1'");
    expect(
      await valor(db, "select has_function_privilege('anon', 'public.f_serie()', 'execute')"),
    ).toBe(true);
  });
});

describe("E: tipos de privado.permisos_por_defecto_previos y texto fuera de la lista", () => {
  it('esquema es name y tipo es "char"', async () => {
    await aplicar(db, M01());
    const r = await db.query(
      `select a.attname, a.atttypid::regtype::text as tipo from pg_attribute a
        where a.attrelid = 'privado.permisos_por_defecto_previos'::regclass and a.attnum > 0
          and not a.attisdropped and a.attname in ('esquema', 'tipo') order by 1`,
    );
    expect(r.rows).toEqual([
      { attname: "esquema", tipo: "name" },
      { attname: "tipo", tipo: '"char"' },
    ]);
  });

  it("ninguna columna de texto en privado (la lista D-7 no incluye ninguna de M01)", async () => {
    await aplicar(db, M01());
    const r = await db.query(
      `select c.relname, a.attname, a.atttypid::regtype::text as tipo
        from pg_attribute a join pg_class c on c.oid = a.attrelid
        join pg_namespace n on n.oid = c.relnamespace
        where n.nspname = 'privado' and c.relkind in ('r', 'p', 'v', 'm') and a.attnum > 0
          and not a.attisdropped
          and (a.atttypid in ('text'::regtype, 'varchar'::regtype, 'bpchar'::regtype,
                              'json'::regtype, 'jsonb'::regtype)
               or a.atttypid::regtype::text in ('citext', 'text[]', 'character varying[]', 'jsonb[]'))`,
    );
    expect(r.rows).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// Tercera vuelta (auditor-seguridad, segunda vuelta: APTO CON CONDICIONES).
// ---------------------------------------------------------------------------

const MENSAJE_GUARDA = "migracion_rol_no_permitido";

/** Dos roles que no son `postgres`: otro superusuario y un createrole miembro de postgres. */
const IMPOSTORES: Record<string, { rol: string; sql: string }> = {
  "otro superusuario": {
    rol: "impostor_super",
    sql: "create role impostor_super superuser nologin",
  },
  "createrole miembro de postgres": {
    rol: "impostor_gestor",
    sql: "create role impostor_gestor createrole nologin; grant postgres to impostor_gestor",
  },
};

describe("F: la guarda también está dentro de cada do (psql -f sin ON_ERROR_STOP)", () => {
  for (const [nombre, impostor] of Object.entries(IMPOSTORES)) {
    it(`M01 como ${nombre}, siguiendo tras cada error: todo falla con la guarda y no cambia nada`, async () => {
      await db.exec(impostor.sql);
      const antes = await instantanea(db);
      const errores = await como(db, impostor.rol, null, () =>
        ejecutarSigueTrasError(db, leerMigracion(M01())),
      );
      expect(errores.length, "fallan la guarda y el do").toBe(2);
      for (const e of errores) expect(e).toContain(MENSAJE_GUARDA);
      expect(await instantanea(db)).toEqual(antes);
      expect(
        await valor(db, "select count(*)::int from pg_namespace where nspname = 'privado'"),
      ).toBe(0);
      expect(await valor(db, "select count(*)::int from pg_roles where rolname = 'conector'")).toBe(
        0,
      );
    });

    it(`la reversión como ${nombre}, siguiendo tras cada error, no cambia nada aunque la copia esté envenenada`, async () => {
      await db.exec(impostor.sql);
      await aplicar(db, M01());
      // Copia envenenada: concede SELECT a anon en el valor global de tablas.
      await db.exec(`
        update privado.permisos_por_defecto_previos
           set acl = acl || array[makeaclitem('anon'::regrole::oid, 'postgres'::regrole::oid, 'SELECT', false)]
         where esquema is null and tipo = 'r'`);
      const antes = await instantanea(db);
      const errores = await como(db, impostor.rol, null, () =>
        ejecutarSigueTrasError(db, leerReversion(M01())),
      );
      expect(errores.length, "fallan la guarda y el do").toBe(2);
      for (const e of errores) expect(e).toContain(MENSAJE_GUARDA);
      expect(await instantanea(db)).toEqual(antes);
      expect(await concesionesPorDefecto()).toEqual([]);
      expect(
        await valor(db, "select count(*)::int from pg_namespace where nspname = 'privado'"),
      ).toBe(1);
    });
  }

  it("cada do de M01 y de su reversión empieza por la guarda y fija el search_path", () => {
    for (const sql of [leerMigracion(M01()), leerReversion(M01())]) {
      const s = dividirSentencias(sql).map((x) => x.replace(/\s+/g, " "));
      expect(s).toHaveLength(2);
      const cuerpo = (s[1] as string).replace(/^do \$\$ (declare .*? )?begin /, "");
      expect(cuerpo).toMatch(
        /^if current_user operator\(pg_catalog\.<>\) 'postgres' then raise exception 'migracion_rol_no_permitido'; end if; v_ruta_previa := pg_catalog\.current_setting\('search_path'\); perform pg_catalog\.set_config\('search_path', 'pg_catalog, pg_temp', true\);/,
      );
      expect(cuerpo).toMatch(
        /perform pg_catalog\.set_config\('search_path', v_ruta_previa, true\); end \$\$;$/,
      );
    }
  });
});

/**
 * Operador `=` para "char" que siempre da falso, en public, con su función en
 * otro esquema (para que la comprobación de objetos ajenos de la reversión no
 * lo vea como un objeto de public). Con `search_path = public, pg_catalog`
 * gana al operador de pg_catalog si el SQL no fija su propia ruta.
 */
async function envenenarOperador(base: Base): Promise<void> {
  await base.exec(`
    create schema envenenado;
    create function envenenado.igual_falso("char", "char") returns boolean
      language sql immutable as 'select false';
    create operator public.= (leftarg = "char", rightarg = "char", function = envenenado.igual_falso);
  `);
}

/** Ejecuta `fn` con `search_path = public, pg_catalog` y lo restablece siempre. */
async function conRutaDePublic<T>(fn: () => Promise<T>): Promise<T> {
  await db.exec("set search_path = public, pg_catalog");
  try {
    return await fn();
  } finally {
    await db.exec("reset search_path");
  }
}

const COPIA = `select esquema, tipo::text as tipo, acl::text as acl
  from privado.permisos_por_defecto_previos order by 1, 2`;

describe("G: search_path fijado dentro de cada do (operador ajeno en public)", () => {
  it("M01 con search_path = public, pg_catalog y un = ajeno: no lo usa", async () => {
    // Referencia: la misma M01 sin veneno.
    const limpia = await crearBase();
    let esperado: unknown[];
    try {
      await aplicar(limpia, M01());
      esperado = (await limpia.query(COPIA)).rows;
    } finally {
      await limpia.close();
    }
    await envenenarOperador(db);
    expect(await conRutaDePublic(() => errorDe(() => aplicar(db, M01())))).toBeNull();
    expect((await db.query(COPIA)).rows).toEqual(esperado);
    // La restricción check quedó ligada a pg_catalog: ninguna dependencia de operadores de public.
    expect(
      await valor(
        db,
        `select count(*)::int from pg_depend d join pg_operator o on o.oid = d.refobjid
          where d.refclassid = 'pg_operator'::regclass and o.oprnamespace = 'public'::regnamespace`,
      ),
    ).toBe(0);
  });

  it("la reversión con un = ajeno en public sigue viendo un objeto ajeno y falla sin tocar nada", async () => {
    await aplicar(db, M01());
    await db.exec("create table public.ajena (id int)");
    await envenenarOperador(db);
    const antes = await instantanea(db);
    const mensaje = await conRutaDePublic(() => errorDe(() => revertir(db, M01())));
    expect(mensaje).toContain("reversion_con_objetos");
    expect(await instantanea(db)).toEqual(antes);
  });

  it("la reversión con un = ajeno en public, sin objetos ajenos, restaura lo mismo que sin veneno", async () => {
    const limpia = await crearBase();
    let esperado: unknown[];
    try {
      await aplicar(limpia, M01());
      await revertir(limpia, M01());
      esperado = await concesionesPorDefectoDe(limpia);
    } finally {
      await limpia.close();
    }
    await aplicar(db, M01());
    await envenenarOperador(db);
    expect(await conRutaDePublic(() => errorDe(() => revertir(db, M01())))).toBeNull();
    expect(await concesionesPorDefecto()).toEqual(esperado);
  });
});

async function concesionesPorDefectoDe(base: Base): Promise<unknown[]> {
  const r = await base.query(
    `select coalesce(n.nspname, '*') as esquema, d.defaclobjtype::text as tipo,
        case when a.grantee = 0 then 'public' else a.grantee::regrole::text end as para
      from pg_default_acl d
      left join pg_namespace n on n.oid = d.defaclnamespace
      cross join lateral aclexplode(d.defaclacl) a
      where d.defaclrole = 'postgres'::regrole and d.defaclobjtype in ('r', 'S', 'f')
        and (a.grantee = 0 or a.grantee::regrole::text = any($1))
        and (a.grantee <> d.defaclrole)
      order by 1, 2, 3`,
    [CINCO],
  );
  return r.rows;
}

describe("P6: concesiones por defecto de postgres a un rol que no es de los cinco", () => {
  const AJENO = `
    alter default privileges for role postgres grant all on tables to conector_prueba;
    alter default privileges for role postgres grant usage on schemas to conector_prueba;`;

  it("privado y su tabla de copia solo tienen a postgres en sus listas de permisos", async () => {
    await db.exec(AJENO);
    await aplicar(db, M01());
    const esquema = await db.query(
      `select a.grantee::regrole::text as para from pg_namespace n
         cross join lateral aclexplode(n.nspacl) a
        where n.nspname = 'privado' and a.grantee <> n.nspowner`,
    );
    expect(esquema.rows).toEqual([]);
    const tabla = await db.query(
      `select a.grantee::regrole::text as para from pg_class c
         cross join lateral aclexplode(c.relacl) a
        where c.oid = 'privado.permisos_por_defecto_previos'::regclass and a.grantee <> c.relowner`,
    );
    expect(tabla.rows).toEqual([]);
    expect(
      await valor(db, "select has_schema_privilege('conector_prueba', 'privado', 'usage')"),
    ).toBe(false);
  });

  it("conector_prueba no puede vaciar la copia con TRUNCATE ni leerla", async () => {
    await db.exec(AJENO);
    await aplicar(db, M01());
    for (const sentencia of [
      "truncate privado.permisos_por_defecto_previos",
      "select * from privado.permisos_por_defecto_previos",
    ]) {
      const mensaje = await como(db, "conector_prueba", null, () =>
        errorDe(() => db.exec(sentencia)),
      );
      expect(mensaje, sentencia).toMatch(/permission denied/i);
    }
    expect(
      await valor(db, "select count(*)::int from privado.permisos_por_defecto_previos"),
    ).toBeGreaterThan(0);
  });

  it("el ciclo con esas concesiones deja el catálogo como estaba", async () => {
    await db.exec(AJENO);
    const c = await ciclo(db, M01());
    expect(c.trasRevertir).toEqual(c.antes);
    expect(c.trasReaplicar).toEqual(c.trasAplicar);
  });
});

describe("P7: copia vaciada o incompleta antes de revertir", () => {
  const casos: [string, string][] = [
    ["vaciada con TRUNCATE", "truncate privado.permisos_por_defecto_previos"],
    [
      "sin la fila global de funciones",
      "delete from privado.permisos_por_defecto_previos where esquema is null and tipo = 'f'",
    ],
    [
      "sin la fila global de tablas",
      "delete from privado.permisos_por_defecto_previos where esquema is null and tipo = 'r'",
    ],
    [
      "solo con filas por esquema",
      "delete from privado.permisos_por_defecto_previos where esquema is null",
    ],
  ];
  for (const [nombre, sentencia] of casos) {
    it(`reversión con la copia ${nombre}: falla con reversion_copia_incompleta y no cambia nada`, async () => {
      await aplicar(db, M01());
      await db.exec(sentencia);
      const antes = await instantanea(db);
      for (const ejecutar of [
        () => revertir(db, M01()),
        () => ejecutarEnAutocommit(db, leerReversion(M01())),
      ]) {
        expect(await errorDe(ejecutar)).toContain("reversion_copia_incompleta");
        expect(await instantanea(db)).toEqual(antes);
      }
      expect(await concesionesPorDefecto()).toEqual([]);
      expect(await valor(db, "select count(*)::int from pg_roles where rolname = 'conector'")).toBe(
        1,
      );
    });
  }

  it("con las tres filas globales (y sin filas por esquema) la reversión sigue funcionando", async () => {
    await aplicar(db, M01());
    await db.exec("delete from privado.permisos_por_defecto_previos where esquema is not null");
    expect(await errorDe(() => revertir(db, M01()))).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Cuarta vuelta (auditor-seguridad, tercera vuelta: hallazgos 1, 2 y 4).
// ---------------------------------------------------------------------------

describe("H (hallazgo 1): cada do restaura el search_path que tenía la transacción", () => {
  const RUTA = "public, extensions";

  it("tras M01 dentro de una transacción, la ruta sigue siendo la de antes", async () => {
    await db.exec(`begin; set local search_path = ${RUTA}`);
    try {
      await db.exec(leerMigracion(M01()));
      expect(await valor(db, "select pg_catalog.current_setting('search_path')")).toBe(RUTA);
    } finally {
      await db.exec("rollback");
    }
  });

  it("tras la reversión dentro de una transacción, la ruta sigue siendo la de antes", async () => {
    await aplicar(db, M01());
    await db.exec(`begin; set local search_path = ${RUTA}`);
    try {
      await db.exec(leerReversion(M01()));
      expect(await valor(db, "select pg_catalog.current_setting('search_path')")).toBe(RUTA);
    } finally {
      await db.exec("rollback");
    }
  });
});

/**
 * Operador `<>` para name que siempre da falso, en public, con su función en
 * otro esquema. Con `search_path = public, pg_catalog` gana al de pg_catalog
 * en `current_user <> 'postgres'` si la guarda no califica el operador.
 */
async function envenenarDistinto(base: Base): Promise<void> {
  await base.exec(`
    create schema envenenado_guarda;
    create function envenenado_guarda.distinto_falso(name, name) returns boolean
      language sql immutable as 'select false';
    create operator public.<> (leftarg = name, rightarg = name, function = envenenado_guarda.distinto_falso);
  `);
}

describe("I (hallazgo 2): la guarda no depende del search_path de la sesión", () => {
  it("precondición: con la ruta de public, el <> ajeno gana a pg_catalog", async () => {
    await envenenarDistinto(db);
    expect(await conRutaDePublic(() => valor(db, "select current_user <> 'otro_nombre'"))).toBe(
      false,
    );
  });

  for (const [nombre, impostor] of Object.entries(IMPOSTORES)) {
    it(`M01 como ${nombre}, con un <> ajeno delante de pg_catalog: la guarda falla y no cambia nada`, async () => {
      await db.exec(impostor.sql);
      await envenenarDistinto(db);
      const antes = await instantanea(db);
      const errores = await conRutaDePublic(() =>
        como(db, impostor.rol, null, () => ejecutarSigueTrasError(db, leerMigracion(M01()))),
      );
      expect(errores.length, "fallan la guarda y el do").toBe(2);
      for (const e of errores) expect(e).toContain(MENSAJE_GUARDA);
      expect(await instantanea(db)).toEqual(antes);
    });

    it(`la reversión como ${nombre}, con un <> ajeno delante de pg_catalog: la guarda falla y no cambia nada`, async () => {
      await db.exec(impostor.sql);
      await aplicar(db, M01());
      await envenenarDistinto(db);
      const antes = await instantanea(db);
      const errores = await conRutaDePublic(() =>
        como(db, impostor.rol, null, () => ejecutarSigueTrasError(db, leerReversion(M01()))),
      );
      expect(errores.length, "fallan la guarda y el do").toBe(2);
      for (const e of errores) expect(e).toContain(MENSAJE_GUARDA);
      expect(await instantanea(db)).toEqual(antes);
    });
  }

  it("como postgres, con el <> ajeno delante de pg_catalog, M01 se aplica igual", async () => {
    await envenenarDistinto(db);
    expect(await conRutaDePublic(() => errorDe(() => aplicar(db, M01())))).toBeNull();
  });
});

describe("J (hallazgo 4): tras los revoke, M01 comprueba que privado y la copia no tienen concesiones ajenas", () => {
  /** M01 sin los dos bucles que retiran concesiones ajenas: simula un revoke que no retira nada. */
  function m01SinBucles(): string {
    const original = leerMigracion(M01());
    const mutada = original.replace(/ {2}for v_destino in[\s\S]*?end loop;\n/g, "");
    expect(original.match(/for v_destino in/g)).toHaveLength(2);
    expect(mutada).not.toMatch(/for v_destino in/);
    return mutada;
  }

  // Cada concesión ajena por separado (menor 2 de la quinta vuelta): la
  // comprobación debe parar M01 tanto por el esquema como por la tabla.
  const CASOS: [string, string][] = [
    [
      "solo usage sobre el esquema",
      "alter default privileges for role postgres grant usage on schemas to conector_prueba",
    ],
    [
      "solo permisos sobre la tabla",
      "alter default privileges for role postgres grant all on tables to conector_prueba",
    ],
  ];
  for (const [nombre, ajeno] of CASOS) {
    it(`si sobrevive una concesión ajena (${nombre}), M01 falla con migracion_concesiones_ajenas y no deja nada`, async () => {
      await db.exec(ajeno);
      const antes = await instantanea(db);
      const mensaje = await errorDe(() => db.exec(m01SinBucles()));
      expect(mensaje).toContain("migracion_concesiones_ajenas");
      expect(await instantanea(db)).toEqual(antes);
    });
  }

  it("sin concesiones ajenas, la comprobación no estorba (M01 sin los bucles se aplica)", async () => {
    expect(await errorDe(() => db.exec(m01SinBucles()))).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Quinta vuelta (auditor-seguridad, cuarta vuelta: mayor 1).
// ---------------------------------------------------------------------------

/**
 * Un rol sin privilegios, dueño de su esquema, crea dominios `text`, `name` y
 * `record` con un CHECK que deja rastro. El rastro es una secuencia: `nextval`
 * no se deshace con la transacción, así que queda aunque el bloque falle. Los
 * tipos de `declare` se resuelven al compilar el bloque y el CHECK de un
 * dominio corre al iniciar la variable (con NULL), antes de la guarda y antes
 * de fijar la ruta: si la sesión tiene el esquema delante de pg_catalog y los
 * tipos no van calificados, el CHECK se ejecuta como postgres.
 */
const ATACANTE = "atacante_dominios";
async function sembrarDominios(base: Base): Promise<void> {
  await base.exec(`
    create role ${ATACANTE} nologin noinherit;
    create schema ${ATACANTE} authorization ${ATACANTE};`);
  await como(base, ATACANTE, null, () =>
    base.exec(`
      create sequence ${ATACANTE}.rastro;
      create function ${ATACANTE}.deja_rastro() returns boolean
        language sql volatile as 'select pg_catalog.nextval(''${ATACANTE}.rastro'') > 0';
      create domain ${ATACANTE}.text as pg_catalog.text check (${ATACANTE}.deja_rastro());
      create domain ${ATACANTE}.name as pg_catalog.name check (${ATACANTE}.deja_rastro());
      create type ${ATACANTE}.fila as (a pg_catalog.text, b pg_catalog.text, c pg_catalog.text);
      create domain ${ATACANTE}.record as ${ATACANTE}.fila check (${ATACANTE}.deja_rastro());`),
  );
}

async function hayRastro(base: Base): Promise<boolean> {
  return valor<boolean>(base, `select is_called from ${ATACANTE}.rastro`);
}

async function conRutaDelAtacante<T>(fn: () => Promise<T>): Promise<T> {
  await db.exec(`set search_path = ${ATACANTE}, pg_catalog`);
  try {
    return await fn();
  } finally {
    await db.exec("reset search_path");
  }
}

describe("K (mayor 1): los tipos de declare no se resuelven con la ruta de la sesión", () => {
  it("precondición: un declare sin calificar con esa ruta ejecuta el CHECK del atacante", async () => {
    await sembrarDominios(db);
    expect(await hayRastro(db)).toBe(false);
    await conRutaDelAtacante(() => db.exec("do $$ declare v text; begin null; end $$"));
    expect(await hayRastro(db)).toBe(true);
  });

  it("aplicar M01 como postgres con el esquema del atacante delante no deja rastro", async () => {
    await sembrarDominios(db);
    await conRutaDelAtacante(() => errorDe(() => aplicar(db, M01())));
    expect(await hayRastro(db)).toBe(false);
    expect(
      await valor(db, "select count(*)::int from pg_namespace where nspname = 'privado'"),
    ).toBe(1);
  });

  it("aplicar M01 en autocommit con esa ruta no deja rastro", async () => {
    await sembrarDominios(db);
    await conRutaDelAtacante(() => errorDe(() => ejecutarEnAutocommit(db, leerMigracion(M01()))));
    expect(await hayRastro(db)).toBe(false);
  });

  it("revertir M01 como postgres con el esquema del atacante delante no deja rastro y revierte", async () => {
    await aplicar(db, M01());
    await sembrarDominios(db);
    const mensaje = await conRutaDelAtacante(() => errorDe(() => revertir(db, M01())));
    expect(await hayRastro(db)).toBe(false);
    expect(mensaje).toBeNull();
    expect(
      await valor(db, "select count(*)::int from pg_namespace where nspname = 'privado'"),
    ).toBe(0);
  });
});
