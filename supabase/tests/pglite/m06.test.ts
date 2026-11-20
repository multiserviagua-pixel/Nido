// M06 `ejecuciones_informes_alertas` en PGlite (T-004; D-1, D-2 5, 6 y 14, D-3, D-7).
// REQ-020, REQ-021, REQ-022, REQ-026, REQ-032, REQ-046 · CA-017, CA-018, CA-021, CA-027 (índices).
// Comprueba SQL válido y comportamiento; no sustituye a pgTAP (CI, T-013).
// Los permisos de escritura de service_role y authenticated llegan con M07: aquí
// las escrituras van como dueño (la integridad es de la estructura, no del rol)
// y, para ver que el rol de la clave secreta no escribe nada, como service_role.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  aplicar,
  ciclo,
  como,
  crearBase,
  dividirSentencias,
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
const M06 = () => nombreDe("ejecuciones_informes_alertas");

const ROLES = ["anon", "authenticated", "service_role", "conector", "conector_prueba"];
const PRIVILEGIOS = ["SELECT", "INSERT", "UPDATE", "DELETE", "TRUNCATE", "REFERENCES", "TRIGGER"];
const TABLAS = ["alertas", "ejecuciones", "informes"];

const CA = "00000000-0000-4000-8000-00000000000a";
const CB = "00000000-0000-4000-8000-00000000000b";
const LA = "00000000-0000-4000-8000-0000000000a1";
const LB = "00000000-0000-4000-8000-0000000000b1";
const XA = "00000000-0000-4000-8000-0000000000a2";
const XB = "00000000-0000-4000-8000-0000000000b2";
const EA = "00000000-0000-4000-8000-0000000000a3";
const EA2 = "00000000-0000-4000-8000-0000000000a4";
const UA = "00000000-0000-4000-8000-0000000000a5";
const AL = "00000000-0000-4000-8000-0000000000a6";
const EB = "00000000-0000-4000-8000-0000000000b3";

const CODIGOS = [
  "sin_acceso_correo",
  "sin_acceso_almacenamiento",
  "sin_contexto",
  "registro_no_guardado",
  "error_borrador",
  "error_etiquetado",
];

let db: Base;
beforeEach(async () => {
  db = await crearBase();
});
afterEach(async () => {
  await db.close();
});

async function hastaM05(base: Base): Promise<void> {
  for (const m of [M01, M02, M03, M04, M05]) await aplicar(base, m());
}
async function hastaM06(base: Base): Promise<void> {
  await hastaM05(base);
  await aplicar(base, M06());
}

/** Dos clientes con su licencia y su conexión, el catálogo y una ejecución de A. */
const DATOS = `
  insert into public.clientes (id, nombre) values
    ('${CA}', 'Cliente A ficticio'), ('${CB}', 'Cliente B ficticio');
  insert into public.licencias (id, cliente_id) values ('${LA}', '${CA}'), ('${LB}', '${CB}');
  insert into public.conexiones (id, licencia_id) values ('${XA}', '${LA}'), ('${XB}', '${LB}');
  insert into public.catalogo_problemas (codigo, descripcion) values
    ${CODIGOS.map((c) => `('${c}', 'Descripción ficticia')`).join(", ")};
  insert into public.ejecuciones (id, conexion_id, cliente_id, estado_servido)
    values ('${EA}', '${XA}', '${CA}', 'activa'), ('${EA2}', '${XA}', '${CA}', 'activa');
`;

type Fila = Record<string, unknown>;
const INFORME = (extra: Fila = {}): Fila => ({
  ejecucion_id: EA,
  cliente_id: CA,
  estado: "ok",
  modo: "desatendido",
  asistente: "claude",
  almacenamiento: "drive",
  version_prompt: "1.2.0",
  frecuencia_horas: 24,
  tratados: 5,
  sin_tratar: 10,
  borradores: 2,
  documentos: 1,
  facturas_pendientes: 0,
  urgentes: 0,
  comp_correo: true,
  comp_almacenamiento: true,
  comp_contexto: true,
  comp_registro: true,
  problemas: [],
  ...extra,
});
async function insertarInforme(base: Base, fila: Fila): Promise<void> {
  const cols = Object.keys(fila);
  await base.query(
    `insert into public.informes (${cols.join(", ")}) values (${cols.map((_, i) => `$${i + 1}`).join(", ")})`,
    Object.values(fila),
  );
}
async function contar(tabla: string): Promise<number> {
  return valor<number>(db, `select count(*)::int from public.${tabla}`);
}
/** Error de un intento (código y mensaje y detalle), o null; todo en una transacción que se deshace. */
async function intentar(
  sql: string,
  params: unknown[] = [],
): Promise<{ code?: string; message: string; detail?: string } | null> {
  await db.exec("begin");
  try {
    await db.query(sql, params);
    return null;
  } catch (e) {
    const x = e as { code?: string; message: string; detail?: string };
    return { code: x.code, message: x.message, detail: x.detail };
  } finally {
    await db.exec("rollback");
  }
}
async function intentarInforme(fila: Fila) {
  const cols = Object.keys(fila);
  return intentar(
    `insert into public.informes (${cols.join(", ")}) values (${cols.map((_, i) => `$${i + 1}`).join(", ")})`,
    Object.values(fila),
  );
}

describe("estructura, RLS y permisos (REQ-020, REQ-023, CA-016, CA-027)", () => {
  it("las tres tablas tienen RLS, ninguna política y solo permisos del dueño", async () => {
    await hastaM06(db);
    const r = await db.query<{ relname: string; rls: boolean }>(
      `select relname, relrowsecurity as rls from pg_class
        where relnamespace = 'public'::regnamespace and relname = any($1) order by 1`,
      [TABLAS],
    );
    expect(r.rows).toEqual(TABLAS.map((relname) => ({ relname, rls: true })));
    expect(await valor(db, "select count(*)::int from pg_policies")).toBe(0);
    for (const rol of ROLES) {
      for (const t of TABLAS) {
        for (const p of PRIVILEGIOS) {
          expect(
            await valor(db, `select has_table_privilege('${rol}', 'public.${t}', '${p}')`),
            `${rol} ${t} ${p}`,
          ).toBe(false);
        }
      }
    }
    const ajenos = await valor(
      db,
      `select (select count(*) from pg_class c cross join lateral aclexplode(c.relacl) a
                where c.relnamespace = 'public'::regnamespace and c.relname = any($1)
                  and a.grantee <> c.relowner)
            + (select count(*) from pg_attribute t join pg_class c on c.oid = t.attrelid
                where c.relnamespace = 'public'::regnamespace and c.relname = any($1)
                  and t.attacl is not null)`,
      [TABLAS],
    );
    expect(Number(ajenos)).toBe(0);
  });

  it("las columnas de texto son las de D-7: informes.problemas e informes.version_prompt", async () => {
    await hastaM06(db);
    const r = await db.query<{ col: string }>(
      `select c.relname || '.' || a.attname as col
         from pg_attribute a join pg_class c on c.oid = a.attrelid
         join pg_type t on t.oid = a.atttypid
        where c.relnamespace = 'public'::regnamespace and c.relkind = 'r'
          and c.relname = any($1) and a.attnum > 0 and not a.attisdropped
          and (t.typcategory in ('S', 'A') or t.typname in ('json', 'jsonb'))
        order by 1`,
      [TABLAS],
    );
    expect(r.rows.map((x) => x.col)).toEqual(["informes.problemas", "informes.version_prompt"]);
  });

  it("índices de D-2, 14 (CA-027): alertas_por_cliente y ejecuciones_por_conexion", async () => {
    await hastaM06(db);
    const r = await db.query<{ indexname: string; indexdef: string }>(
      `select indexname, indexdef from pg_indexes where schemaname = 'public'
        and indexname in ('alertas_por_cliente', 'ejecuciones_por_conexion') order by 1`,
    );
    expect(r.rows.map((x) => x.indexname)).toEqual([
      "alertas_por_cliente",
      "ejecuciones_por_conexion",
    ]);
    expect(r.rows[0]?.indexdef).toMatch(/\(cliente_id, abierta_en DESC\)/);
    expect(r.rows[1]?.indexdef).toMatch(/\(conexion_id\)/);
  });

  it("ejecuciones tiene unique (id, cliente_id) e informes la clave ajena compuesta y un informe por ejecución", async () => {
    await hastaM06(db);
    const r = await db.query<{ definicion: string }>(
      `select pg_get_constraintdef(oid) as definicion from pg_constraint
        where conrelid in ('public.ejecuciones'::regclass, 'public.informes'::regclass)
          and contype in ('u', 'f')`,
    );
    const defs = r.rows.map((x) => x.definicion);
    expect(defs).toContain("UNIQUE (id, cliente_id)");
    expect(defs).toContain("UNIQUE (ejecucion_id)");
    expect(
      defs.some((d) =>
        /FOREIGN KEY \(ejecucion_id, cliente_id\) REFERENCES ejecuciones\(id, cliente_id\)/.test(d),
      ),
    ).toBe(true);
  });

  it("las funciones de M06: dueño postgres, search_path pg_catalog, pg_temp y sin execute para nadie más", async () => {
    await hastaM06(db);
    const r = await db.query<{ firma: string; dueno: string; definer: boolean; config: string }>(
      `select p.oid::regprocedure::text as firma, p.proowner::regrole::text as dueno,
              p.prosecdef as definer, p.proconfig::text as config
         from pg_proc p where p.pronamespace = 'privado'::regnamespace
          and p.proname in ('validar_informe', 'validar_ejecucion', 'impedir_cambio_de_pertenencia')
        order by 1`,
    );
    const config = '{"search_path=pg_catalog, pg_temp"}';
    expect(r.rows).toEqual([
      {
        firma: "privado.impedir_cambio_de_pertenencia()",
        dueno: "postgres",
        definer: false,
        config,
      },
      { firma: "privado.validar_ejecucion()", dueno: "postgres", definer: true, config },
      { firma: "privado.validar_informe()", dueno: "postgres", definer: true, config },
    ]);
    const ajenos = await valor(
      db,
      `select count(*)::int from pg_proc p cross join lateral aclexplode(p.proacl) a
        where p.pronamespace = 'privado'::regnamespace
          and p.proname in ('validar_informe', 'validar_ejecucion', 'impedir_cambio_de_pertenencia')
          and a.grantee <> p.proowner`,
    );
    expect(ajenos).toBe(0);
    for (const rol of ["anon", "authenticated", "service_role", "conector"]) {
      for (const f of [
        "privado.validar_informe()",
        "privado.validar_ejecucion()",
        "privado.impedir_cambio_de_pertenencia()",
      ]) {
        expect(await valor(db, `select has_function_privilege('${rol}', '${f}', 'execute')`)).toBe(
          false,
        );
      }
    }
  });

  it("los disparadores de integridad están en su sitio", async () => {
    await hastaM06(db);
    const r = await db.query<{ tabla: string; tgname: string }>(
      `select tgrelid::regclass::text as tabla, tgname from pg_trigger
        where not tgisinternal and tgfoid in (
          'privado.validar_informe'::regproc, 'privado.validar_ejecucion'::regproc,
          'privado.impedir_cambio_de_pertenencia'::regproc) order by 1, 2`,
    );
    expect(r.rows.map((x) => `${x.tabla}.${x.tgname}`)).toEqual([
      "alertas.alertas_pertenencia",
      "conexiones.conexiones_pertenencia",
      "ejecuciones.ejecuciones_pertenencia",
      "ejecuciones.ejecuciones_validar",
      "informes.informes_pertenencia",
      "informes.informes_validar",
      "licencias.licencias_pertenencia",
    ]);
  });
});

describe("CA-018, REQ-022, REQ-046: lo que no debe poder escribirse se rechaza con 0 filas", () => {
  async function conDatos(): Promise<void> {
    await hastaM06(db);
    await db.exec(DATOS);
  }

  it("un informe válido, con problemas del catálogo, se acepta", async () => {
    await conDatos();
    await insertarInforme(db, INFORME({ problemas: ["sin_contexto", "error_borrador"] }));
    expect(await contar("informes")).toBe(1);
  });

  const CASOS: [string, () => Fila][] = [
    ["código fuera del catálogo", () => INFORME({ problemas: ["no_existe"] })],
    ["código repetido", () => INFORME({ problemas: ["sin_contexto", "sin_contexto"] })],
    ["más de cinco códigos", () => INFORME({ problemas: CODIGOS })],
    ["texto donde va una cifra", () => INFORME({ tratados: "doce" })],
    ["cifra fuera de rango", () => INFORME({ tratados: 1001 })],
    ["cliente distinto del de su ejecución", () => INFORME({ cliente_id: CB })],
  ];
  for (const [nombre, fila] of CASOS) {
    it(`CA-018: ${nombre} se rechaza como dueño y deja 0 filas`, async () => {
      await conDatos();
      const e = await intentarInforme(fila());
      expect(e, nombre).not.toBeNull();
      expect(await contar("informes")).toBe(0);
    });
    it(`CA-018: ${nombre} se rechaza como service_role (sin permisos) y deja 0 filas`, async () => {
      await conDatos();
      await como(db, "service_role", {}, async () => {
        expect(await errorDe(() => insertarInforme(db, fila()))).not.toBeNull();
      });
      expect(await contar("informes")).toBe(0);
    });
  }

  it("CA-018: una ejecución cuyo cliente no es el de su conexión se rechaza con 0 filas", async () => {
    await conDatos();
    const antes = await contar("ejecuciones");
    const e = await intentar(
      "insert into public.ejecuciones (conexion_id, cliente_id, estado_servido) values ($1, $2, 'activa')",
      [XA, CB],
    );
    expect(e?.message).toBe("ejecucion_cliente_incoherente");
    expect(await contar("ejecuciones")).toBe(antes);
    await como(db, "service_role", {}, async () => {
      expect(
        await errorDe(() =>
          db.query(
            "insert into public.ejecuciones (conexion_id, cliente_id, estado_servido) values ($1, $2, 'activa')",
            [XA, CB],
          ),
        ),
      ).not.toBeNull();
    });
    expect(await contar("ejecuciones")).toBe(antes);
  });

  it("los códigos del catálogo y los repetidos se rechazan con un mensaje de solo código y sin detalle", async () => {
    await conDatos();
    for (const [problemas, codigo] of [
      [["no_existe"], "informe_problema_desconocido"],
      [["sin_contexto", "sin_contexto"], "informe_problema_repetido"],
    ] as const) {
      const e = await intentarInforme(INFORME({ problemas: [...problemas] }));
      expect(e?.message).toBe(codigo);
      expect(e?.code).toBe("23514");
      expect(e?.detail ?? "").toBe("");
      expect(`${e?.message}${e?.detail ?? ""}`).not.toContain("no_existe");
    }
    const e = await intentar(
      "insert into public.ejecuciones (conexion_id, cliente_id, estado_servido) values ($1, $2, 'activa')",
      [XA, CB],
    );
    expect(e?.code).toBe("23514");
    expect(e?.detail ?? "").toBe("");
    expect(e?.message).not.toContain(CB);
    expect(e?.message).not.toContain(XA);
  });

  it("el segundo informe de una ejecución se rechaza y queda uno", async () => {
    await conDatos();
    await insertarInforme(db, INFORME());
    const e = await intentarInforme(INFORME({ tratados: 7 }));
    expect(e?.code).toBe("23505");
    expect(await contar("informes")).toBe(1);
    // Otra ejecución del mismo cliente sí admite el suyo.
    await insertarInforme(db, INFORME({ ejecucion_id: EA2 }));
    expect(await contar("informes")).toBe(2);
  });

  it("el formato y las listas del contrato: versión, frecuencia, enumerados y problemas con nulos", async () => {
    await conDatos();
    const malos: Fila[] = [
      INFORME({ version_prompt: "1.2.3.4" }),
      INFORME({ version_prompt: "123456789.123" }),
      INFORME({ version_prompt: "uno" }),
      INFORME({ frecuencia_horas: 0 }),
      INFORME({ frecuencia_horas: 169 }),
      INFORME({ sin_tratar: 100001 }),
      INFORME({ tratados: -1 }),
      INFORME({ borradores: 1001 }),
      INFORME({ documentos: 1001 }),
      INFORME({ facturas_pendientes: 1001 }),
      INFORME({ urgentes: 1001 }),
      INFORME({ estado: "otro" }),
      INFORME({ modo: "otro" }),
      INFORME({ asistente: "gemini" }),
      INFORME({ almacenamiento: "box" }),
      INFORME({ campos_descartados: 1001 }),
    ];
    for (const m of malos) {
      expect(await intentarInforme(m), JSON.stringify(m)).not.toBeNull();
    }
    const e = await intentar(
      "insert into public.informes (ejecucion_id, cliente_id, estado, modo, asistente, almacenamiento, version_prompt, frecuencia_horas, tratados, sin_tratar, borradores, documentos, facturas_pendientes, urgentes, comp_correo, comp_almacenamiento, comp_contexto, comp_registro, problemas) values ($1, $2, 'ok', 'desatendido', 'claude', 'drive', '1.0', 24, 1, 1, 1, 1, 1, 1, true, true, true, true, array['sin_contexto', null])",
      [EA, CA],
    );
    expect(e).not.toBeNull();
    // Límites aceptados.
    await insertarInforme(
      db,
      INFORME({
        version_prompt: "12345678.123",
        frecuencia_horas: 168,
        tratados: 1000,
        sin_tratar: 100000,
        problemas: CODIGOS.slice(0, 5),
      }),
    );
    expect(await contar("informes")).toBe(1);
  });

  it("la forma de problemas la fija el check, aun sin disparadores (modo réplica)", async () => {
    await conDatos();
    const malos: [string, string][] = [
      ["elemento vacío", '{""}'],
      ["elemento con coma", '{"sin_contexto,abc"}'],
      ["matriz de dos dimensiones", "{{sin_contexto,error_borrador}}"],
      ["límite inferior distinto de 1", "[3:4]={sin_contexto,error_borrador}"],
      ["nulo", "{sin_contexto,NULL}"],
    ];
    for (const [nombre, literal] of malos) {
      for (const replica of [false, true]) {
        await db.exec("begin");
        try {
          if (replica) await db.exec("set local session_replication_role = replica");
          const e = await errorDe(() =>
            db.query(
              "insert into public.informes (ejecucion_id, cliente_id, estado, modo, asistente, almacenamiento, version_prompt, frecuencia_horas, tratados, sin_tratar, borradores, documentos, facturas_pendientes, urgentes, comp_correo, comp_almacenamiento, comp_contexto, comp_registro, problemas) values ($1, $2, 'ok', 'desatendido', 'claude', 'drive', '1.0', 24, 1, 1, 1, 1, 1, 1, true, true, true, true, $3::text[])",
              [EA, CA, literal],
            ),
          );
          expect(e, `${nombre} (réplica: ${String(replica)})`).not.toBeNull();
          // En modo réplica los disparadores no corren: solo queda el check.
          if (replica) expect(e).toContain("informes_problemas_check");
        } finally {
          await db.exec("rollback");
        }
      }
    }
    expect(await contar("informes")).toBe(0);
  });

  it("al actualizar un informe, también se vigilan los códigos y el cliente", async () => {
    await conDatos();
    await insertarInforme(db, INFORME());
    expect(
      (await intentar("update public.informes set problemas = array['no_existe']"))?.message,
    ).toBe("informe_problema_desconocido");
    expect(
      (await intentar("update public.informes set cliente_id = $1", [CB]))?.code,
    ).toBeDefined();
    expect(await valor(db, "select cliente_id::text from public.informes")).toBe(CA);
  });
});

describe("REQ-026, D-2 6: la pertenencia no cambia, con ningún rol", () => {
  it("licencias.cliente_id, conexiones.licencia_id, ejecuciones.conexion_id y ejecuciones.cliente_id no se cambian", async () => {
    await hastaM06(db);
    await db.exec(DATOS);
    await db.exec(`
      insert into public.ejecuciones (id, conexion_id, cliente_id, estado_servido)
        values ('${EB}', '${XB}', '${CB}', 'activa');
      insert into public.alertas (id, cliente_id, tipo) values ('${AL}', '${CA}', 'sin_senal');
    `);
    await insertarInforme(db, INFORME());
    const cambios: [string, unknown[]][] = [
      [`update public.informes set ejecucion_id = '${EB}', cliente_id = '${CB}'`, []],
      [`update public.informes set ejecucion_id = '${EA2}'`, []],
      [`update public.alertas set cliente_id = '${CB}' where id = '${AL}'`, []],
      [`update public.alertas set cliente_id = null where id = '${AL}'`, []],
      [`update public.licencias set cliente_id = '${CB}' where id = '${LA}'`, []],
      [`update public.conexiones set licencia_id = '${LB}' where id = '${XA}'`, []],
      [`update public.ejecuciones set conexion_id = '${XB}' where id = '${EA}'`, []],
      [`update public.ejecuciones set cliente_id = '${CB}' where id = '${EA}'`, []],
    ];
    for (const [sql] of cambios) {
      const e = await intentar(sql);
      expect(e?.message, sql).toBe("cambio_de_pertenencia_no_permitido");
      expect(e?.detail ?? "").toBe("");
    }
    expect(
      await valor(db, `select cliente_id::text from public.licencias where id = '${LA}'`),
    ).toBe(CA);
    expect(
      await valor(db, `select licencia_id::text from public.conexiones where id = '${XA}'`),
    ).toBe(LA);
    expect(
      await valor(db, `select conexion_id::text from public.ejecuciones where id = '${EA}'`),
    ).toBe(XA);
    expect(await valor(db, "select cliente_id::text from public.informes")).toBe(CA);
    expect(await valor(db, "select ejecucion_id::text from public.informes")).toBe(EA);
    expect(await valor(db, "select cliente_id::text from public.alertas")).toBe(CA);
  });

  it("escribir el mismo valor y cambiar otra columna sí se admite", async () => {
    await hastaM06(db);
    await db.exec(DATOS);
    await db.exec(`
      update public.licencias set cliente_id = cliente_id, estado_manual = 'forzar_activa' where id = '${LA}';
      update public.conexiones set licencia_id = licencia_id, ultimo_uso_en = now() where id = '${XA}';
      update public.ejecuciones set cerrada_en = now() where id = '${EA}';
    `);
    await insertarInforme(db, INFORME());
    await db.exec(`
      insert into public.alertas (id, cliente_id, tipo) values ('${AL}', '${CA}', 'sin_senal');
      update public.informes set ejecucion_id = ejecucion_id, cliente_id = cliente_id, tratados = 6;
      update public.alertas set cliente_id = cliente_id, resuelta_en = now() where id = '${AL}';
    `);
    expect(
      await valor(db, `select estado_manual::text from public.licencias where id = '${LA}'`),
    ).toBe("forzar_activa");
  });
});

describe("D-3: auditoría de alertas (U)", () => {
  async function abrir(): Promise<void> {
    await db.exec(`
      grant select, update on public.alertas to authenticated;
      create policy prueba_al on public.alertas for all to authenticated using (true) with check (true);
    `);
  }

  it("un update como authenticated deja 1 fila con el actor; como dueño, ninguna", async () => {
    await hastaM06(db);
    await db.exec(DATOS);
    await db.exec(
      `insert into public.alertas (id, cliente_id, tipo) values ('${AL}', '${CA}', 'sin_senal')`,
    );
    await abrir();
    await db.exec(`update public.alertas set resuelta_en = now() where id = '${AL}'`);
    expect(await contar("auditoria")).toBe(0);
    await como(db, "authenticated", { sub: UA, role: "authenticated" }, async () => {
      await db.exec(`update public.alertas set resuelta_en = now() where id = '${AL}'`);
    });
    const r = await db.query(
      "select actor, accion, objeto_tipo, objeto_id, cliente_id from public.auditoria",
    );
    expect(r.rows).toEqual([
      { actor: UA, accion: "update", objeto_tipo: "alertas", objeto_id: AL, cliente_id: CA },
    ]);
  });

  it("el disparador de alertas es AFTER UPDATE, no cubre inserción y excluye al dueño", async () => {
    await hastaM06(db);
    const def = await valor<string>(
      db,
      "select pg_get_triggerdef(oid) from pg_trigger where tgname = 'alertas_auditar'",
    );
    expect(def).toMatch(/AFTER UPDATE ON public\.alertas/);
    expect(def).toMatch(/CURRENT_USER <> 'postgres'/i);
    expect(def).toMatch(/privado\.auditar\(\)/);
  });
});

describe("REQ-029 (local): ciclo, guarda y todo o nada", () => {
  it("ciclo de M06: el catálogo tras revertir es el de antes y el reaplicado, el primero", async () => {
    await hastaM05(db);
    const c = await ciclo(db, M06());
    expect(c.trasRevertir).toEqual(c.antes);
    expect(c.trasReaplicar).toEqual(c.trasAplicar);
    expect(c.trasAplicar).not.toEqual(c.antes);
  });

  it("revertir M06 con datos los borra y no toca los de M02 a M05", async () => {
    await hastaM06(db);
    await db.exec(DATOS);
    await insertarInforme(db, INFORME());
    await revertir(db, M06());
    expect(await contar("clientes")).toBe(2);
    expect(await contar("catalogo_problemas")).toBe(CODIGOS.length);
  });

  it("M06 y su reversión son dos sentencias: la guarda y un único bloque do", () => {
    for (const sql of [leerMigracion(M06()), leerReversion(M06())]) {
      expect(dividirSentencias(sql)).toHaveLength(2);
    }
  });

  it("M06 sin M05 falla y no deja nada", async () => {
    await aplicar(db, M01());
    await aplicar(db, M02());
    const antes = await instantanea(db);
    expect(await errorDe(() => aplicar(db, M06()))).not.toBeNull();
    expect(await instantanea(db)).toEqual(antes);
  });

  it("M06 con otro rol (también en autocommit) falla con la guarda y no deja nada", async () => {
    await hastaM05(db);
    await db.exec("create role impostor_super superuser nologin");
    const antes = await instantanea(db);
    await db.exec("set role impostor_super");
    try {
      expect(await errorDe(() => aplicar(db, M06()))).toContain("migracion_rol_no_permitido");
      expect(await errorDe(() => ejecutarEnAutocommit(db, leerMigracion(M06())))).toContain(
        "migracion_rol_no_permitido",
      );
    } finally {
      await db.exec("reset role");
    }
    expect(await instantanea(db)).toEqual(antes);
  });

  it("la reversión de M06 con otro rol falla y no cambia nada", async () => {
    await hastaM06(db);
    await db.exec("create role impostor_super superuser nologin");
    const antes = await instantanea(db);
    await db.exec("set role impostor_super");
    try {
      expect(await errorDe(() => ejecutarEnAutocommit(db, leerReversion(M06())))).toContain(
        "migracion_rol_no_permitido",
      );
    } finally {
      await db.exec("reset role");
    }
    expect(await instantanea(db)).toEqual(antes);
  });

  it("con otro destinatario por defecto en tablas, M06 las crea sin su permiso", async () => {
    await db.exec(
      "alter default privileges for role postgres grant all on tables to conector_prueba",
    );
    await hastaM06(db);
    for (const t of TABLAS) {
      expect(
        await valor(db, `select has_table_privilege('conector_prueba', 'public.${t}', 'select')`),
      ).toBe(false);
    }
  });
});
