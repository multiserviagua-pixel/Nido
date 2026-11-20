// M04 `auditoria` y M05 `versiones_prompt`, PROTEGIDAS, en PGlite (T-003; D-1, D-3, D-7, D-8).
// REQ-015 a REQ-019, REQ-023, REQ-042, REQ-053, REQ-054, REQ-055, REQ-060, REQ-061 ·
// CA-012, CA-013, CA-014, CA-016, CA-031, CA-032, CA-033, CA-038.
// Comprueba SQL válido y comportamiento; no sustituye a pgTAP (CI, T-013). La
// reversión solo en CI y la huella de las protegidas tras el ciclo (CA-031) las
// ejerce `ciclo-migraciones.mjs` (T-012, T-013); aquí se prueba la guarda.
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  aplicar,
  ciclo,
  como,
  crearBase,
  ejecutarEnAutocommit,
  errorDe,
  instantanea,
  leerMigracion,
  leerReversion,
  nombreDe,
  revertir,
  valor,
  type Base,
} from "./arnes";

vi.setConfig({ testTimeout: 60_000, hookTimeout: 60_000 });

const M01 = () => nombreDe("privado_rol_y_permisos");
const M02 = () => nombreDe("clientes_y_acceso");
const M03 = () => nombreDe("internas_autorizacion_y_cobro");
const M04 = () => nombreDe("auditoria");
const M05 = () => nombreDe("versiones_prompt");

const ROLES = ["anon", "authenticated", "service_role", "conector", "conector_prueba"];
const FUNCIONES = [
  "privado.impedir_cambios()",
  "privado.registrar_auditoria(text, text, text, uuid)",
  "privado.auditar()",
];

const CA = "00000000-0000-4000-8000-00000000000a";
const LA = "00000000-0000-4000-8000-0000000000a1";
const XA = "00000000-0000-4000-8000-0000000000a2";
const OA = "00000000-0000-4000-8000-0000000000a3";
const UA = "00000000-0000-4000-8000-0000000000a4";
const KA = "00000000-0000-4000-8000-0000000000a5";

const sha = (t: string) => createHash("sha256").update(t, "utf8").digest("hex");
const CONTENIDO = "Texto ficticio del prompt: Ñandú — 2ª línea\n";

let db: Base;
beforeEach(async () => {
  db = await crearBase();
});
afterEach(async () => {
  await db.close();
});

async function hastaM03(base: Base): Promise<void> {
  await aplicar(base, M01());
  await aplicar(base, M02());
  await aplicar(base, M03());
}
async function hastaM05(base: Base): Promise<void> {
  await hastaM03(base);
  await aplicar(base, M04());
  await aplicar(base, M05());
}
/** La marca que solo fija `ciclo-migraciones.mjs` en CI (sesión completa). */
async function marcaCi(base: Base, valorMarca: string | null = "ci"): Promise<void> {
  if (valorMarca === null) await base.exec("reset app.reversion_protegida");
  else await base.query("select set_config('app.reversion_protegida', $1, false)", [valorMarca]);
}

type Fila = Record<string, unknown>;
async function insertar(base: Base, tabla: string, fila: Fila): Promise<void> {
  const cols = Object.keys(fila);
  await base.query(
    `insert into public.${tabla} (${cols.join(", ")}) values (${cols.map((_, i) => `$${i + 1}`).join(", ")})`,
    Object.values(fila),
  );
}
const VERSION = (extra: Fila = {}): Fila => ({
  version: "1.0.0",
  contenido: CONTENIDO,
  huella_sha256: sha(CONTENIDO),
  commit_sha: "abcdef0",
  ...extra,
});
/** Una fila en cada tabla protegida (como dueño). */
async function filasProtegidas(base: Base): Promise<void> {
  await base.exec("select privado.registrar_auditoria('insert', 'clientes', 'x', null::uuid)");
  await insertar(base, "versiones_prompt", VERSION());
  await base.exec(
    "insert into public.publicaciones (canal, version_id) select 'estable', id from public.versiones_prompt",
  );
}
/** Mensaje de un intento en una transacción que se deshace siempre. */
async function intentar(base: Base, sql: string, params: unknown[] = []): Promise<string | null> {
  await base.exec("begin");
  try {
    return await errorDe(() => base.query(sql, params));
  } finally {
    await base.exec("rollback");
  }
}

describe("M04 y M05: estructura, RLS y permisos (REQ-042, REQ-023, CA-016)", () => {
  it("las tablas existen con RLS, sin políticas y solo con permisos del dueño", async () => {
    await hastaM05(db);
    const r = await db.query<{ relname: string; rls: boolean }>(
      `select relname, relrowsecurity as rls from pg_class
        where relnamespace = 'public'::regnamespace and relname in
          ('auditoria', 'versiones_prompt', 'publicaciones') order by 1`,
    );
    expect(r.rows).toEqual([
      { relname: "auditoria", rls: true },
      { relname: "publicaciones", rls: true },
      { relname: "versiones_prompt", rls: true },
    ]);
    expect(await valor(db, "select count(*)::int from pg_policies")).toBe(0);
    const ajenos = await valor(
      db,
      `select count(*)::int from pg_class c cross join lateral aclexplode(c.relacl) a
        where c.relnamespace = 'public'::regnamespace
          and c.relname in ('auditoria', 'versiones_prompt', 'publicaciones')
          and a.grantee <> c.relowner`,
    );
    expect(ajenos).toBe(0);
    for (const rol of ROLES) {
      for (const t of ["auditoria", "versiones_prompt", "publicaciones"]) {
        for (const p of [
          "SELECT",
          "INSERT",
          "UPDATE",
          "DELETE",
          "TRUNCATE",
          "REFERENCES",
          "TRIGGER",
        ]) {
          expect(
            await valor(db, `select has_table_privilege('${rol}', 'public.${t}', '${p}')`),
            `${rol} ${t} ${p}`,
          ).toBe(false);
        }
      }
    }
  });

  it("las columnas de texto de las dos migraciones son las de D-7", async () => {
    await hastaM05(db);
    const r = await db.query<{ col: string }>(
      `select c.relname || '.' || a.attname as col
        from pg_attribute a join pg_class c on c.oid = a.attrelid
        join pg_type t on t.oid = a.atttypid
        where c.relnamespace = 'public'::regnamespace and c.relkind = 'r'
          and c.relname in ('auditoria', 'versiones_prompt', 'publicaciones')
          and a.attnum > 0 and not a.attisdropped
          and (t.typcategory = 'S' or t.typname in ('json', 'jsonb'))
        order by 1`,
    );
    expect(r.rows.map((x) => x.col)).toEqual([
      "auditoria.accion",
      "auditoria.objeto_id",
      "auditoria.objeto_tipo",
      "versiones_prompt.commit_sha",
      "versiones_prompt.contenido",
      "versiones_prompt.huella_sha256",
      "versiones_prompt.notas",
      "versiones_prompt.version",
    ]);
  });

  it("las tres funciones: dueño postgres, search_path pg_catalog, pg_temp y sin execute para nadie más", async () => {
    await hastaM05(db);
    const r = await db.query<{ firma: string; dueno: string; definer: boolean; config: string }>(
      `select p.oid::regprocedure::text as firma, p.proowner::regrole::text as dueno,
              p.prosecdef as definer, p.proconfig::text as config
         from pg_proc p where p.pronamespace = 'privado'::regnamespace order by 1`,
    );
    expect(r.rows).toEqual([
      {
        firma: "privado.auditar()",
        dueno: "postgres",
        definer: true,
        config: '{"search_path=pg_catalog, pg_temp"}',
      },
      {
        firma: "privado.impedir_cambios()",
        dueno: "postgres",
        definer: false,
        config: '{"search_path=pg_catalog, pg_temp"}',
      },
      {
        firma: "privado.registrar_auditoria(text,text,text,uuid)",
        dueno: "postgres",
        definer: true,
        config: '{"search_path=pg_catalog, pg_temp"}',
      },
    ]);
    for (const rol of ROLES) {
      for (const f of FUNCIONES) {
        expect(
          await valor(db, `select has_function_privilege('${rol}', '${f}', 'EXECUTE')`),
          `${rol} ${f}`,
        ).toBe(false);
      }
    }
    expect(
      await valor(
        db,
        `select count(*)::int from pg_proc p cross join lateral aclexplode(p.proacl) a
          where p.pronamespace = 'privado'::regnamespace and a.grantee <> p.proowner`,
      ),
    ).toBe(0);
  });

  it("los seis disparadores de inmutabilidad existen con enable always (tgenabled = 'A')", async () => {
    await hastaM05(db);
    const r = await db.query<{ tabla: string; tgname: string; estado: string }>(
      `select tgrelid::regclass::text as tabla, tgname, tgenabled::text as estado
         from pg_trigger
        where not tgisinternal and tgfoid = 'privado.impedir_cambios'::regproc order by 1, 2`,
    );
    expect(r.rows).toEqual([
      { tabla: "auditoria", tgname: "auditoria_sin_vaciado", estado: "A" },
      { tabla: "auditoria", tgname: "auditoria_solo_insercion", estado: "A" },
      { tabla: "publicaciones", tgname: "publicaciones_inmutable", estado: "A" },
      { tabla: "publicaciones", tgname: "publicaciones_sin_vaciado", estado: "A" },
      { tabla: "versiones_prompt", tgname: "versiones_prompt_inmutable", estado: "A" },
      { tabla: "versiones_prompt", tgname: "versiones_prompt_sin_vaciado", estado: "A" },
    ]);
  });

  it("los disparadores de auditoría son los de D-3, y solo los de administradores y versiones_prompt no llevan condición", async () => {
    await hastaM05(db);
    const r = await db.query<{ tgname: string; condicion: boolean }>(
      `select tgname, (tgqual is not null) as condicion from pg_trigger
        where not tgisinternal and tgfoid = 'privado.auditar'::regproc order by 1`,
    );
    expect(r.rows).toEqual([
      { tgname: "administradores_auditar", condicion: false },
      { tgname: "ajustes_globales_auditar", condicion: true },
      { tgname: "catalogo_problemas_auditar", condicion: true },
      { tgname: "clientes_auditar", condicion: true },
      { tgname: "codigos_activacion_auditar", condicion: true },
      { tgname: "conexiones_auditar", condicion: true },
      { tgname: "licencias_auditar", condicion: true },
      { tgname: "ordenes_auditar", condicion: true },
      { tgname: "publicaciones_auditar", condicion: true },
      { tgname: "reglas_cliente_auditar", condicion: true },
      { tgname: "usuarios_cliente_auditar", condicion: true },
      { tgname: "versiones_prompt_auditar", condicion: false },
    ]);
  });

  it("auditoria rechaza una acción, un tipo o un identificador sin su formato", async () => {
    await hastaM05(db);
    const f = (a: string, t: string, id: string | null) =>
      intentar(db, "select privado.registrar_auditoria($1, $2, $3, null::uuid)", [a, t, id]);
    expect(await f("insert", "clientes", "abc-DEF_09")).toBeNull();
    expect(await f("insert", "clientes", null)).toBeNull();
    expect(await f("INSERT", "clientes", "a")).toMatch(/violates check constraint/);
    expect(await f("ab", "clientes", "a")).toMatch(/violates check constraint/);
    expect(await f("insert", "Clientes", "a")).toMatch(/violates check constraint/);
    expect(await f("insert", "clientes", "")).toMatch(/violates check constraint/);
    expect(await f("insert", "clientes", "a".repeat(65))).toMatch(/violates check constraint/);
    expect(await f("insert", "clientes", "a b")).toMatch(/violates check constraint/);
    expect(await f("insert", "clientes", "a\n")).toMatch(/violates check constraint/);
    expect(await f("insert", "clientes", "a".repeat(64))).toBeNull();
  });
});

describe("REQ-042, CA-012: solo inserción y sin vaciado, también como dueño y en modo réplica", () => {
  const TABLAS = ["auditoria", "versiones_prompt", "publicaciones"];
  const OPERACIONES: Record<string, string> = {
    auditoria: "update public.auditoria set accion = 'otra_accion'",
    versiones_prompt: "update public.versiones_prompt set notas = 'x'",
    publicaciones: "update public.publicaciones set canal = 'prueba'",
  };

  for (const modo of ["origin", "replica"]) {
    it(`update, delete y truncate de las tres tablas se rechazan como dueño (modo ${modo})`, async () => {
      await hastaM05(db);
      await filasProtegidas(db);
      await db.exec(`set session_replication_role = ${modo}`);
      try {
        for (const t of TABLAS) {
          expect(await intentar(db, OPERACIONES[t] as string), `update ${t}`).toContain(
            "tabla_solo_insercion",
          );
          expect(await intentar(db, `delete from public.${t}`), `delete ${t}`).toContain(
            "tabla_solo_insercion",
          );
        }
        // Cada truncate, solo o con cascade (la clave ajena obliga a incluir publicaciones).
        expect(await intentar(db, "truncate public.auditoria"), "truncate auditoria").toContain(
          "tabla_solo_insercion",
        );
        expect(
          await intentar(db, "truncate public.publicaciones"),
          "truncate publicaciones",
        ).toContain("tabla_solo_insercion");
        expect(
          await intentar(db, "truncate public.versiones_prompt, public.publicaciones"),
          "truncate versiones_prompt",
        ).toContain("tabla_solo_insercion");
        expect(
          await intentar(db, "truncate public.versiones_prompt cascade"),
          "truncate cascade",
        ).toContain("tabla_solo_insercion");
        expect(await intentar(db, "truncate public.versiones_prompt")).not.toBeNull();
      } finally {
        await db.exec("reset session_replication_role");
      }
      // Nada cambió.
      expect(await valor(db, "select count(*)::int from public.auditoria")).toBe(2);
      expect(await valor(db, "select count(*)::int from public.versiones_prompt")).toBe(1);
      expect(await valor(db, "select count(*)::int from public.publicaciones")).toBe(1);
    });
  }

  it("las filas de las protegidas no cambian ni siquiera con un update que no cambia nada", async () => {
    await hastaM05(db);
    await filasProtegidas(db);
    expect(await intentar(db, "update public.auditoria set accion = accion")).toContain(
      "tabla_solo_insercion",
    );
    expect(await intentar(db, "update public.versiones_prompt set version = version")).toContain(
      "tabla_solo_insercion",
    );
  });

  it("la inserción sí se admite (como dueño)", async () => {
    await hastaM05(db);
    await filasProtegidas(db);
    expect(await valor(db, "select count(*)::int from public.versiones_prompt")).toBe(1);
  });
});

describe("REQ-055, CA-033, D-8: la huella es la del texto", () => {
  it("la correcta se acepta (con acentos y fin de línea) y la ajena, alterada o ausente se rechaza", async () => {
    await hastaM05(db);
    const probar = (extra: Fila) => {
      const fila = VERSION(extra);
      const cols = Object.keys(fila);
      return intentar(
        db,
        `insert into public.versiones_prompt (${cols.join(", ")}) values (${cols.map((_, i) => `$${i + 1}`).join(", ")})`,
        Object.values(fila),
      );
    };
    expect(await probar({})).toBeNull();
    // Ajena: la huella de otro texto.
    expect(await probar({ huella_sha256: sha("otro texto") })).toMatch(/violates check constraint/);
    // Alterada: un dígito distinto, en mayúsculas, de otra longitud o vacía.
    const buena = sha(CONTENIDO);
    const otro = buena.endsWith("0") ? "1" : "0";
    expect(await probar({ huella_sha256: buena.slice(0, 63) + otro })).toMatch(
      /violates check constraint/,
    );
    expect(await probar({ huella_sha256: buena.toUpperCase() })).toMatch(
      /violates check constraint/,
    );
    expect(await probar({ huella_sha256: buena.slice(1) })).toMatch(/violates check constraint/);
    expect(await probar({ huella_sha256: "" })).toMatch(/violates check constraint/);
    // Ausente.
    expect(await probar({ huella_sha256: null })).toMatch(/not-null constraint/);
    // Un final de línea distinto es otra huella: se rechaza, no se corrige.
    expect(await probar({ contenido: CONTENIDO.replace("\n", "\r\n") })).toMatch(
      /violates check constraint/,
    );
    // Texto distinto con la huella del anterior.
    expect(await probar({ contenido: `${CONTENIDO}.` })).toMatch(/violates check constraint/);
  });

  it("la huella se comprueba también con otro contenido con caracteres de varios bytes", async () => {
    await hastaM05(db);
    const c = "Ñandú — ñ Ž ŝ € «»";
    await insertar(db, "versiones_prompt", VERSION({ contenido: c, huella_sha256: sha(c) }));
    expect(await valor(db, "select count(*)::int from public.versiones_prompt")).toBe(1);
  });

  it("versión, contenido, commit y notas: formatos y límites de D-7", async () => {
    await hastaM05(db);
    const ok = async (extra: Fila) => {
      const fila = VERSION(extra);
      return intentar(
        db,
        `insert into public.versiones_prompt (${Object.keys(fila).join(", ")}) values ($1, $2, $3, $4${Object.keys(fila).length > 4 ? ", $5" : ""})`,
        Object.values(fila),
      );
    };
    for (const v of ["1.0", "10.20.30", "1.2.34567890"])
      expect(await ok({ version: v }), v).toBeNull();
    for (const v of [
      "1",
      "1.",
      "a.b",
      "1.2.3.4",
      "1.2.345678901",
      "1.2.3456789012",
      "v1.0",
      "1.0\n",
      "",
    ]) {
      expect(await ok({ version: v }), JSON.stringify(v)).toMatch(/violates check constraint/);
    }
    for (const c of ["abcdef0", "a".repeat(40)]) expect(await ok({ commit_sha: c }), c).toBeNull();
    for (const c of ["abcdef", "a".repeat(41), "ABCDEF0", "abcdefg"]) {
      expect(await ok({ commit_sha: c }), c).toMatch(/violates check constraint/);
    }
    expect(await ok({ notas: "x".repeat(500) })).toBeNull();
    expect(await ok({ notas: "x".repeat(501) })).toMatch(/violates check constraint/);
    const largo = "a".repeat(100000);
    expect(await ok({ contenido: largo, huella_sha256: sha(largo) })).toBeNull();
    const demasiado = "a".repeat(100001);
    expect(await ok({ contenido: demasiado, huella_sha256: sha(demasiado) })).toMatch(
      /violates check constraint/,
    );
    expect(await ok({ contenido: "", huella_sha256: sha("") })).toMatch(
      /violates check constraint/,
    );
  });

  it("contenido y notas rechazan caracteres invisibles (A-12, art. 9) y admiten \\n y \\t", async () => {
    await hastaM05(db);
    let n = 0;
    const probar = async (columna: "contenido" | "notas", texto: string) => {
      n += 1;
      const fila = VERSION({
        version: `3.${n}`,
        ...(columna === "contenido"
          ? { contenido: texto, huella_sha256: sha(texto) }
          : { notas: texto }),
      });
      return intentar(
        db,
        `insert into public.versiones_prompt (${Object.keys(fila).join(", ")}) values (${Object.keys(
          fila,
        )
          .map((_, i) => `$${i + 1}`)
          .join(", ")})`,
        Object.values(fila),
      );
    };
    const rechazados = [
      0x0001, 0x000b, 0x000d, 0x001f, 0x007f, 0x0085, 0x009f, 0x00a0, 0x00ad, 0x034f, 0x0600,
      0x061c, 0x06dd, 0x115f, 0x1160, 0x17b4, 0x17b5, 0x180b, 0x180c, 0x180d, 0x180e, 0x200b,
      0x200e, 0x2027, 0x202a, 0x202e, 0x202f, 0x205f, 0x2060, 0x2066, 0x206f, 0x2070, 0x3000,
      0x3164, 0xe000, 0xf8ff, 0xfdd0, 0xfdef, 0xfe00, 0xfe0f, 0xfeff, 0xffa0, 0xfff9, 0xfffb,
      0xfffe, 0xffff, 0xe0001, 0xe0041, 0xe007f, 0xe0080, 0xe0100, 0xe01ef, 0xf0000, 0x10ffff,
      0x0627, 0x4e2d, 0x1f600,
    ];
    for (const columna of ["contenido", "notas"] as const) {
      for (const c of rechazados) {
        expect(
          await probar(columna, `Hola${String.fromCodePoint(c)}mundo`),
          `${columna} U+${c.toString(16)}`,
        ).toMatch(/violates check constraint/);
      }
      expect(
        await probar(columna, "Línea 1\n\tLínea 2 Ñandú — 2ª «x» … 5 € •"),
        columna,
      ).toBeNull();
    }
    // El prompt 1.2 de referencia se acepta tal cual.
    const prompt = readFileSync(
      new URL("../../../docs/referencia/agente-ia-1.2.md", import.meta.url),
      "utf8",
    );
    expect(await probar("contenido", prompt)).toBeNull();
    // update: la restriccion se ejerce tambien al actualizar (con la inmutabilidad
    // quitada dentro de una transaccion que se deshace).
    await insertar(db, "versiones_prompt", VERSION({ version: "9.9" }));
    for (const columna of ["contenido", "notas"] as const) {
      for (const c of rechazados) {
        const texto = `Hola${String.fromCodePoint(c)}mundo`;
        await db.exec("begin");
        try {
          await db.exec("drop trigger versiones_prompt_inmutable on public.versiones_prompt");
          const r = await errorDe(() =>
            columna === "contenido"
              ? db.query(
                  "update public.versiones_prompt set contenido = $1, huella_sha256 = $2 where version = '9.9'",
                  [texto, sha(texto)],
                )
              : db.query("update public.versiones_prompt set notas = $1 where version = '9.9'", [
                  texto,
                ]),
          );
          expect(r, `update ${columna} U+${c.toString(16)}`).toMatch(/violates check constraint/);
        } finally {
          await db.exec("rollback");
        }
      }
    }
  });

  it("M05 falla con migracion_codificacion_no_utf8 si el servidor no usa UTF8, y no deja nada", async () => {
    await aplicar(db, M01());
    await aplicar(db, M02());
    await aplicar(db, M03());
    await aplicar(db, M04());
    const antes = await instantanea(db);
    const otra = leerMigracion(M05()).replace(
      "server_encoding') operator(pg_catalog.<>) 'UTF8'",
      "server_encoding') operator(pg_catalog.<>) 'LATIN1'",
    );
    expect(otra).not.toBe(leerMigracion(M05()));
    expect(await errorDe(() => db.exec(otra))).toContain("migracion_codificacion_no_utf8");
    expect(await instantanea(db)).toEqual(antes);
  });

  it("la versión es única", async () => {
    await hastaM05(db);
    await insertar(db, "versiones_prompt", VERSION());
    expect(
      await intentar(
        db,
        "insert into public.versiones_prompt (version, contenido, huella_sha256, commit_sha) values ($1, $2, $3, $4)",
        ["1.0.0", "otro", sha("otro"), "abcdef1"],
      ),
    ).toMatch(/duplicate key/);
  });
});

describe("REQ-015 a REQ-019, REQ-061, CA-013, CA-014, CA-038: auditoría según las clases de D-3", () => {
  const DATOS_DUENO = `
    insert into auth.users (id) values ('${UA}');
    insert into public.clientes (id, nombre) values ('${CA}', 'Cliente A ficticio');
    insert into public.licencias (id, cliente_id) values ('${LA}', '${CA}');
    insert into public.conexiones (id, licencia_id) values ('${XA}', '${LA}');
    insert into public.ajustes_globales (id) values (true);
  `;

  /** El actor puede escribir en las tablas de M02 (solo para la prueba). */
  async function abrirAAuthenticated(): Promise<void> {
    await db.exec(`
      grant select, insert, update, delete on
        public.clientes, public.licencias, public.codigos_activacion, public.conexiones,
        public.reglas_cliente, public.ordenes, public.ajustes_globales,
        public.catalogo_problemas, public.usuarios_cliente, public.administradores,
        public.versiones_prompt, public.publicaciones to authenticated;
      grant insert on public.versiones_prompt to service_role;
    `);
    for (const t of [
      "clientes",
      "licencias",
      "codigos_activacion",
      "conexiones",
      "reglas_cliente",
      "ordenes",
      "ajustes_globales",
      "catalogo_problemas",
      "usuarios_cliente",
      "administradores",
      "versiones_prompt",
      "publicaciones",
    ]) {
      await db.exec(
        `create policy prueba_${t} on public.${t} for all to authenticated using (true) with check (true)`,
      );
    }
    await db.exec(
      "create policy prueba_sr on public.versiones_prompt for insert to service_role with check (true)",
    );
  }

  async function auditoria(): Promise<Fila[]> {
    return (
      await db.query(
        `select actor, accion, objeto_tipo, objeto_id, cliente_id from public.auditoria order by id`,
      )
    ).rows as Fila[];
  }

  it("una escritura como authenticated en cada tabla de M02 deja 1 fila con el actor, la acción, la tabla, el objeto y el cliente", async () => {
    await hastaM05(db);
    await db.exec(DATOS_DUENO);
    await abrirAAuthenticated();
    expect(await auditoria()).toEqual([]); // el dueño no deja filas
    await como(db, "authenticated", { sub: UA, role: "authenticated" }, async () => {
      await db.exec(`
        insert into public.clientes (id, nombre) values ('${OA}', 'Cliente B ficticio');
        update public.clientes set nombre = 'Cliente B ficticio 2' where id = '${OA}';
        insert into public.licencias (id, cliente_id) values ('${KA}', '${OA}');
        update public.licencias set estado_manual = 'forzar_activa' where id = '${KA}';
        insert into public.codigos_activacion (licencia_id, codigo_hmac, caduca_en)
          values ('${LA}', '${"a".repeat(64)}', '2030-01-01T00:00:00Z');
        update public.conexiones set ultimo_uso_en = now() where id = '${XA}';
        update public.conexiones set revocada_en = now() where id = '${XA}';
        insert into public.reglas_cliente (cliente_id) values ('${CA}');
        update public.reglas_cliente set ventana_dias = 5 where cliente_id = '${CA}';
        insert into public.ordenes (cliente_id, tipo) values ('${CA}', 'pausar');
        update public.ajustes_globales set pausa_global = true;
        insert into public.catalogo_problemas (codigo, descripcion) values ('sin_permiso', 'Descripción ficticia');
        update public.catalogo_problemas set activo = false where codigo = 'sin_permiso';
        insert into public.usuarios_cliente (usuario_id, cliente_id) values ('${UA}', '${CA}');
        delete from public.usuarios_cliente where usuario_id = '${UA}';
      `);
    });
    const filas = await auditoria();
    const ordenId = await valor<string>(db, "select id::text from public.ordenes");
    const codigoId = await valor<string>(db, "select id::text from public.codigos_activacion");
    const e = (accion: string, tipo: string, id: string, cliente: string | null): Fila => ({
      actor: UA,
      accion,
      objeto_tipo: tipo,
      objeto_id: id,
      cliente_id: cliente,
    });
    expect(filas).toEqual([
      e("insert", "clientes", OA, OA),
      e("update", "clientes", OA, OA),
      e("insert", "licencias", KA, OA),
      e("update", "licencias", KA, OA),
      e("insert", "codigos_activacion", codigoId, CA),
      // Toda escritura en conexiones se audita (D-3, REQ-017): también ultimo_uso_en.
      e("update", "conexiones", XA, CA),
      e("update", "conexiones", XA, CA),
      e("insert", "reglas_cliente", CA, CA),
      e("update", "reglas_cliente", CA, CA),
      e("insert", "ordenes", ordenId, CA),
      e("update", "ajustes_globales", "global", null),
      e("insert", "catalogo_problemas", "sin_permiso", null),
      e("update", "catalogo_problemas", "sin_permiso", null),
      e("insert", "usuarios_cliente", UA, CA),
      e("delete", "usuarios_cliente", UA, CA),
    ]);
  });

  it("como postgres (el dueño), las mismas escrituras dejan 0 filas", async () => {
    await hastaM05(db);
    await db.exec(DATOS_DUENO);
    await db.exec(`
      update public.clientes set nombre = 'Otro nombre ficticio' where id = '${CA}';
      insert into public.reglas_cliente (cliente_id) values ('${CA}');
      update public.conexiones set revocada_en = now() where id = '${XA}';
      update public.ajustes_globales set pausa_global = true;
    `);
    expect(await auditoria()).toEqual([]);
  });

  it("un rol creado después, sin ser el dueño, también deja su fila (cualquier escritor futuro)", async () => {
    await hastaM05(db);
    await db.exec(DATOS_DUENO);
    await db.exec(`
      create role escritor_futuro nologin;
      grant usage on schema public to escritor_futuro;
      grant update on public.clientes to escritor_futuro;
      grant select on public.clientes to escritor_futuro;
      create policy prueba_ef on public.clientes for all to escritor_futuro using (true) with check (true);
    `);
    await como(db, "escritor_futuro", { sub: UA }, async () => {
      await db.exec(
        `update public.clientes set nombre = 'Cliente A ficticio 2' where id = '${CA}'`,
      );
    });
    expect(await auditoria()).toEqual([
      { actor: UA, accion: "update", objeto_tipo: "clientes", objeto_id: CA, cliente_id: CA },
    ]);
  });

  it("administradores y versiones_prompt se auditan siempre, también como dueño y como service_role", async () => {
    await hastaM05(db);
    await db.exec(DATOS_DUENO);
    await abrirAAuthenticated();
    await db.exec(`insert into public.administradores (usuario_id) values ('${UA}')`);
    await insertar(db, "versiones_prompt", VERSION());
    await como(db, "service_role", {}, async () => {
      await insertar(db, "versiones_prompt", VERSION({ version: "1.1.0" }));
    });
    await db.exec(`delete from public.administradores where usuario_id = '${UA}'`);
    const v1 = await valor<string>(
      db,
      "select id::text from public.versiones_prompt where version = '1.0.0'",
    );
    const v2 = await valor<string>(
      db,
      "select id::text from public.versiones_prompt where version = '1.1.0'",
    );
    const e = (accion: string, tipo: string, id: string): Fila => ({
      actor: null,
      accion,
      objeto_tipo: tipo,
      objeto_id: id,
      cliente_id: null,
    });
    expect(await auditoria()).toEqual([
      e("insert", "administradores", UA),
      e("insert", "versiones_prompt", v1),
      e("insert", "versiones_prompt", v2),
      e("delete", "administradores", UA),
    ]);
  });

  it("publicaciones: una inserción como authenticated deja su fila; como dueño, ninguna", async () => {
    await hastaM05(db);
    await abrirAAuthenticated();
    await insertar(db, "versiones_prompt", VERSION());
    const antes = (await auditoria()).length;
    await db.exec(
      "insert into public.publicaciones (canal, version_id) select 'estable', id from public.versiones_prompt",
    );
    expect((await auditoria()).length).toBe(antes);
    await como(db, "authenticated", { sub: UA }, async () => {
      await db.exec(
        "insert into public.publicaciones (canal, version_id, motivo) select 'prueba', id, 'vuelta_atras' from public.versiones_prompt",
      );
    });
    const filas = await auditoria();
    expect(filas.length).toBe(antes + 1);
    expect(filas[filas.length - 1]).toMatchObject({
      actor: UA,
      accion: "insert",
      objeto_tipo: "publicaciones",
      cliente_id: null,
    });
  });

  it("la auditoría no guarda ningún valor de la fila (REQ-018): el marcador no aparece", async () => {
    await hastaM05(db);
    await db.exec(DATOS_DUENO);
    await abrirAAuthenticated();
    const MARCADOR = "MARCADOR_UNICO_QWXZ";
    await como(db, "authenticated", { sub: UA }, async () => {
      await db.query("insert into public.clientes (id, nombre) values ($1, $2)", [OA, MARCADOR]);
      await db.query("update public.clientes set nombre = $1 where id = $2", [`${MARCADOR}2`, OA]);
      await db.query(
        "insert into public.catalogo_problemas (codigo, descripcion) values ($1, $2)",
        ["sin_permiso", MARCADOR],
      );
    });
    expect(await valor(db, "select count(*)::int from public.auditoria")).toBe(3);
    expect(
      await valor(
        db,
        `select count(*)::int from public.auditoria a where a::text like '%MARCADOR%'`,
      ),
    ).toBe(0);
    expect(
      await valor(
        db,
        `select count(*)::int from public.auditoria a where a::text like '%ficticio%'`,
      ),
    ).toBe(0);
  });

  it("registrar_auditoria no la puede ejecutar nadie más que el dueño (ni authenticated, ni service_role, ni conector, ni anon)", async () => {
    await hastaM05(db);
    for (const rol of ["authenticated", "service_role", "conector", "anon"]) {
      await db.exec(`grant usage on schema privado to ${rol}`);
      const e = await como(db, rol, { sub: UA }, () =>
        errorDe(() =>
          db.exec("select privado.registrar_auditoria('insert', 'clientes', 'x', null::uuid)"),
        ),
      );
      expect(e, rol).toMatch(/permission denied/);
      const e2 = await como(db, rol, { sub: UA }, () =>
        errorDe(() =>
          db.exec(
            "insert into public.auditoria (accion, objeto_tipo) values ('insert', 'clientes')",
          ),
        ),
      );
      expect(e2, rol).toMatch(/permission denied/);
    }
    expect(await valor(db, "select count(*)::int from public.auditoria")).toBe(0);
  });

  it("sin sesión (sin sub), el actor queda nulo y el cliente es el de la fila", async () => {
    await hastaM05(db);
    await db.exec(DATOS_DUENO);
    await abrirAAuthenticated();
    await como(db, "authenticated", {}, async () => {
      await db.exec(`update public.clientes set nombre = 'Sin sesión ficticio' where id = '${CA}'`);
    });
    expect(await auditoria()).toEqual([
      { actor: null, accion: "update", objeto_tipo: "clientes", objeto_id: CA, cliente_id: CA },
    ]);
  });

  it("una tabla que auditar() no conoce falla con auditoria_tabla_no_prevista (cierra en fallo)", async () => {
    await hastaM05(db);
    await db.exec(`
      create table public.desconocida (id int);
      create trigger desconocida_auditar after insert on public.desconocida
        for each row execute function privado.auditar();
    `);
    expect(await intentar(db, "insert into public.desconocida values (1)")).toContain(
      "auditoria_tabla_no_prevista",
    );
  });
});

describe("auditar() solo conoce las tablas de public", () => {
  it("una tabla homónima de otro esquema falla con auditoria_tabla_no_prevista", async () => {
    await hastaM05(db);
    await db.exec(`
      create schema ajeno;
      create table ajeno.clientes (id uuid default gen_random_uuid());
      create trigger clientes_auditar after insert on ajeno.clientes
        for each row execute function privado.auditar();
    `);
    expect(await intentar(db, "insert into ajeno.clientes default values")).toContain(
      "auditoria_tabla_no_prevista",
    );
  });
});

describe("REQ-053, REQ-054, CA-031, CA-032: M04 y M05 solo se revierten con la marca de CI", () => {
  it("sin la marca, o con otro valor, la reversión de cada una falla y no cambia nada", async () => {
    await hastaM05(db);
    const antes = await instantanea(db);
    for (const marca of [null, "", "desarrollo", "CI", "ci "]) {
      await marcaCi(db, marca);
      for (const nombre of [M05(), M04()]) {
        expect(await errorDe(() => revertir(db, nombre)), `${nombre} con ${marca}`).toContain(
          "reversion_protegida_fuera_de_ci",
        );
        expect(
          await errorDe(() => ejecutarEnAutocommit(db, leerReversion(nombre))),
          `${nombre} autocommit con ${marca}`,
        ).toContain("reversion_protegida_fuera_de_ci");
      }
    }
    await marcaCi(db, null);
    expect(await instantanea(db)).toEqual(antes);
  });

  it("con la marca, el ciclo de M04 y el de M05 dejan el catálogo como estaba y como quedó", async () => {
    await hastaM03(db);
    await marcaCi(db);
    const c4 = await ciclo(db, M04());
    expect(c4.trasRevertir).toEqual(c4.antes);
    expect(c4.trasReaplicar).toEqual(c4.trasAplicar);
    expect(c4.trasAplicar).not.toEqual(c4.antes);
    const c5 = await ciclo(db, M05());
    expect(c5.trasRevertir).toEqual(c5.antes);
    expect(c5.trasReaplicar).toEqual(c5.trasAplicar);
    expect(c5.trasAplicar).not.toEqual(c5.antes);
  });

  it("revertir M04 con M05 aplicada falla y no cambia nada, aun con la marca", async () => {
    await hastaM05(db);
    await marcaCi(db);
    const antes = await instantanea(db);
    expect(await errorDe(() => revertir(db, M04()))).not.toBeNull();
    expect(await instantanea(db)).toEqual(antes);
  });

  it("revertir M05, M04, M03, M02 y M01 deja la base como recién creada", async () => {
    const vacia = await instantanea(db);
    await hastaM05(db);
    await marcaCi(db);
    for (const nombre of [M05(), M04(), M03(), M02(), M01()]) await revertir(db, nombre);
    expect(await instantanea(db)).toEqual(vacia);
  });

  for (const [nombre, m] of [
    ["M04", M04],
    ["M05", M05],
  ] as const) {
    it(`${nombre}: la migración y la reversión con otro rol (también en autocommit) fallan con la guarda y no cambian nada`, async () => {
      await hastaM03(db);
      if (nombre === "M05") await aplicar(db, M04());
      await marcaCi(db);
      await db.exec("create role impostor_super superuser nologin");
      const antes = await instantanea(db);
      await db.exec("set role impostor_super");
      try {
        expect(await errorDe(() => aplicar(db, m()))).toContain("migracion_rol_no_permitido");
        expect(await errorDe(() => ejecutarEnAutocommit(db, leerMigracion(m())))).toContain(
          "migracion_rol_no_permitido",
        );
        expect(await errorDe(() => ejecutarEnAutocommit(db, leerReversion(m())))).toContain(
          "migracion_rol_no_permitido",
        );
      } finally {
        await db.exec("reset role");
      }
      expect(await instantanea(db)).toEqual(antes);
    });

    it(`${nombre} aplicada en autocommit da el mismo catálogo que en bloque`, async () => {
      const otra = await crearBase();
      let esperado: unknown;
      try {
        await hastaM03(otra);
        await aplicar(otra, M04());
        if (nombre === "M05") await aplicar(otra, M05());
        esperado = await instantanea(otra);
      } finally {
        await otra.close();
      }
      await hastaM03(db);
      await ejecutarEnAutocommit(db, leerMigracion(M04()));
      if (nombre === "M05") await ejecutarEnAutocommit(db, leerMigracion(M05()));
      expect(await instantanea(db)).toEqual(esperado);
    });
  }
});

describe("P6: concesiones por defecto de postgres a un rol que no es de los cinco", () => {
  it("con todo concedido por defecto a conector_prueba, las tablas de M04 y M05 nacen sin su permiso", async () => {
    await db.exec(
      "alter default privileges for role postgres in schema public grant all on tables to conector_prueba",
    );
    await hastaM03(db);
    // Las funciones de privado no tienen concesión por defecto a conector_prueba.
    await aplicar(db, M04());
    await aplicar(db, M05());
    for (const t of ["auditoria", "versiones_prompt", "publicaciones"]) {
      expect(
        await valor(db, `select has_table_privilege('conector_prueba', 'public.${t}', 'SELECT')`),
      ).toBe(false);
    }
    expect(
      await valor(
        db,
        `select count(*)::int from pg_class c cross join lateral aclexplode(c.relacl) a
          where c.relnamespace = 'public'::regnamespace
            and c.relname in ('auditoria', 'versiones_prompt', 'publicaciones')
            and a.grantee <> c.relowner`,
      ),
    ).toBe(0);
  });

  it("con todo concedido por defecto en secuencias a conector_prueba, las secuencias de auditoria y publicaciones nacen sin su permiso", async () => {
    await db.exec(
      "alter default privileges for role postgres in schema public grant all on sequences to conector_prueba",
    );
    await hastaM03(db);
    await aplicar(db, M04());
    await aplicar(db, M05());
    const SECUENCIAS = `
      select count(*)::int from pg_class s
        join pg_depend d on d.objid = s.oid and d.classid = 'pg_class'::regclass
          and d.refclassid = 'pg_class'::regclass and d.deptype in ('a', 'i')
        join pg_class t on t.oid = d.refobjid
        cross join lateral aclexplode(coalesce(s.relacl, acldefault('s', s.relowner))) a
       where s.relkind = 'S' and t.relnamespace = 'public'::regnamespace
         and t.relname in ('auditoria', 'versiones_prompt', 'publicaciones')
         and a.grantee <> s.relowner`;
    expect(await valor(db, SECUENCIAS)).toBe(0);
    for (const q of ["auditoria_id_seq", "publicaciones_id_seq", "versiones_prompt_id_seq"]) {
      const existe = await valor<boolean>(db, `select to_regclass('public.${q}') is not null`);
      if (existe) {
        for (const permiso of ["USAGE", "SELECT", "UPDATE"]) {
          expect(
            await valor(
              db,
              `select has_sequence_privilege('conector_prueba', 'public.${q}', '${permiso}')`,
            ),
            q,
          ).toBe(false);
        }
      }
    }
  });

  it("con execute por defecto en privado para conector_prueba, M04 falla con migracion_concesiones_ajenas y no deja nada", async () => {
    await hastaM03(db);
    await db.exec(
      "alter default privileges for role postgres in schema privado grant execute on functions to conector_prueba",
    );
    const antes = await instantanea(db);
    expect(await errorDe(() => aplicar(db, M04()))).toContain("migracion_concesiones_ajenas");
    expect(await instantanea(db)).toEqual(antes);
  });
});

describe("search_path fijado dentro de cada do", () => {
  it("tras M04 y M05 dentro de una transacción, la ruta sigue siendo la de antes", async () => {
    await hastaM03(db);
    await db.exec("begin");
    try {
      const antes = await valor<string>(db, "select current_setting('search_path')");
      await db.exec(leerMigracion(M04()));
      await db.exec(leerMigracion(M05()));
      expect(await valor<string>(db, "select current_setting('search_path')")).toBe(antes);
    } finally {
      await db.exec("rollback");
    }
  });

  it("con dominios uuid y text temporales homónimos, registrar_auditoria sigue escribiendo la fila", async () => {
    await hastaM03(db);
    await aplicar(db, M04());
    await aplicar(db, M05());
    // Los dominios temporales homónimos no cambian la escritura de la auditoría.
    await db.exec(`
      create domain pg_temp.uuid as text check (false);
      create domain pg_temp.text as text check (false);
    `);
    await db.exec(
      "select privado.registrar_auditoria('insert', 'clientes', 'x', null::pg_catalog.uuid)",
    );
    expect(await valor(db, "select count(*)::int from public.auditoria")).toBe(1);
  });
});
