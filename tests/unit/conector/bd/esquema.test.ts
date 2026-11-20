// T-103 (a) (001): esquema base `conector_prueba` en PGlite. PRUEBA-022 (parte B: aplicar -> revertir ->
// aplicar; roles sin tablas; roles de Supabase sin nada) y PRUEBA-019 (parte: ninguna columna de token,
// código, dirección ni texto libre). No sustituye a Postgres real de Supabase ni a pgTAP (CI).
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { PGlite } from "@electric-sql/pglite";
import { afterAll, describe, expect, it, vi } from "vitest";

// Arrancar PGlite en cada prueba cuesta CPU; en paralelo con otros ficheros supera los 5 s por defecto.
vi.setConfig({ testTimeout: 60_000, hookTimeout: 60_000 });
import { crearBd, ROLES_SUPABASE, type BdApoyo } from "../../../conector/apoyo/index";

const ESTADO = "001_estado.sql";
const REVERSION = "001_estado.reversion.sql";
const SEMILLA = "semilla.sql";
const ESQUEMA = "conector_prueba";
const ROL_MCP = "conector_prueba_mcp";
const ROL_GESTION = "conector_prueba_gestion";

const TABLAS = [
  "clientes_oauth",
  "codigos_activacion",
  "codigos_autorizacion",
  "conexiones",
  "ejecuciones",
  "informes",
  "licencias",
  "limites_origen",
  "ordenes",
  "solicitudes_autorizacion",
  "sucesos",
  "tokens",
];

const abiertas: BdApoyo[] = [];
async function abrir(archivos?: string[]) {
  const bd = await crearBd(archivos ? { archivos } : {});
  abiertas.push(bd);
  return bd;
}
afterAll(async () => {
  while (abiertas.length > 0) await abiertas.pop()?.cerrar();
});

const hex = (c: string) => c.repeat(64);

/** Huella estructural del esquema y de los roles: lo que debe repetirse tras aplicar-revertir-aplicar. */
async function huella(bd: BdApoyo): Promise<string> {
  const q = async (sql: string) => (await bd.db.query<{ v: string }>(sql)).rows.map((f) => f.v);
  const partes = {
    esquema: await q(
      `select nspname || ':' || coalesce(nspacl::text, '') as v from pg_namespace where nspname = '${ESQUEMA}'`,
    ),
    tablas: await q(
      `select c.relname || ':' || c.relkind::text || ':' || c.relrowsecurity || ':' || coalesce(c.relacl::text, '') as v
         from pg_class c join pg_namespace n on n.oid = c.relnamespace
        where n.nspname = '${ESQUEMA}' and c.relkind in ('r','S','v') order by 1`,
    ),
    columnas: await q(
      `select table_name || '.' || column_name || ':' || data_type || ':' || is_nullable || ':' || coalesce(column_default, '') as v
         from information_schema.columns where table_schema = '${ESQUEMA}' order by 1`,
    ),
    restricciones: await q(
      `select conrelid::regclass || ':' || conname || ':' || pg_get_constraintdef(oid) as v
         from pg_constraint where connamespace = '${ESQUEMA}'::regnamespace order by 1`,
    ),
    indices: await q(
      `select indexdef as v from pg_indexes where schemaname = '${ESQUEMA}' order by 1`,
    ),
    funciones: await q(
      `select p.proname || ':' || p.prosecdef || ':' || coalesce(p.proconfig::text, '') || ':' || coalesce(p.proacl::text, '') as v
         from pg_proc p where p.pronamespace = '${ESQUEMA}'::regnamespace order by 1`,
    ),
    tipos: await q(
      `select t.typname || ':' || coalesce((select string_agg(e.enumlabel, ',' order by e.enumsortorder)
              from pg_enum e where e.enumtypid = t.oid), '') as v
         from pg_type t where t.typnamespace = '${ESQUEMA}'::regnamespace and t.typtype = 'e' order by 1`,
    ),
    roles: await q(
      `select rolname || ':' || rolsuper || ':' || rolinherit || ':' || rolcanlogin || ':' || rolbypassrls || ':' ||
              rolconnlimit || ':' || coalesce(rolconfig::text, '') as v
         from pg_roles where rolname like 'conector_prueba%' order by 1`,
    ),
  };
  return JSON.stringify(partes);
}

describe("T-103 (a): esquema base, roles y revocaciones (PRUEBA-022, parte)", () => {
  it("carga 001_estado.sql y semilla.sql (la reversión no se carga sola)", async () => {
    const bd = await abrir();
    expect(bd.archivosCargados).toEqual([ESTADO, SEMILLA]);
  });

  it("crea el esquema con las 12 tablas, todas con RLS activado y sin una sola política", async () => {
    const bd = await abrir();
    const tablas = (
      await bd.db.query<{ nombre: string; rls: boolean }>(
        `select c.relname as nombre, c.relrowsecurity as rls from pg_class c
           join pg_namespace n on n.oid = c.relnamespace
          where n.nspname = '${ESQUEMA}' and c.relkind in ('r','p','v','m','f') order by 1`,
      )
    ).rows;
    expect(tablas.map((t) => t.nombre)).toEqual(TABLAS);
    expect(tablas.filter((t) => !t.rls)).toEqual([]);
    const politicas = (
      await bd.db.query<{ n: number }>(
        `select count(*)::int as n from pg_policy p join pg_class c on c.oid = p.polrelid
          where c.relnamespace = '${ESQUEMA}'::regnamespace`,
      )
    ).rows[0]!.n;
    expect(politicas).toBe(0);
  });

  it("los dos roles: sin herencia, sin bypassrls, sin superusuario, 10 conexiones, 5 s y sin contraseña", async () => {
    const bd = await abrir();
    const filas = (
      await bd.db.query<{
        rolname: string;
        rolsuper: boolean;
        rolinherit: boolean;
        rolbypassrls: boolean;
        rolcreaterole: boolean;
        rolcreatedb: boolean;
        rolreplication: boolean;
        rolcanlogin: boolean;
        rolconnlimit: number;
        rolconfig: string[] | null;
        rolpassword: string | null;
      }>(
        `select r.rolname, r.rolsuper, r.rolinherit, r.rolbypassrls, r.rolcreaterole, r.rolcreatedb,
                r.rolreplication, r.rolcanlogin, r.rolconnlimit, r.rolconfig, a.rolpassword
           from pg_roles r join pg_authid a on a.oid = r.oid
          where r.rolname like 'conector_prueba%' order by 1`,
      )
    ).rows;
    expect(filas.map((f) => f.rolname)).toEqual([ROL_GESTION, ROL_MCP]);
    for (const f of filas) {
      expect(f.rolsuper, f.rolname).toBe(false);
      expect(f.rolinherit, f.rolname).toBe(false);
      expect(f.rolbypassrls, f.rolname).toBe(false);
      expect(f.rolcreaterole, f.rolname).toBe(false);
      expect(f.rolcreatedb, f.rolname).toBe(false);
      expect(f.rolconnlimit, f.rolname).toBe(10);
      expect(f.rolconfig, f.rolname).toContain("statement_timeout=5s");
      // Hallazgo 9 del auditor: una transacción abandonada o un bloqueo largo no retienen la conexión.
      expect(f.rolconfig, f.rolname).toContain("idle_in_transaction_session_timeout=10s");
      expect(f.rolconfig, f.rolname).toContain("lock_timeout=2s");
      expect(f.rolreplication, f.rolname).toBe(false);
      expect(f.rolcanlogin, f.rolname).toBe(true);
      // Art. 4: ninguna contraseña en el SQL; la pone una persona.
      expect(f.rolpassword, f.rolname).toBeNull();
    }
    // Ningún rol es miembro de otro: NOINHERIT no basta si hubiera pertenencia.
    const miembros = (
      await bd.db.query<{ n: number }>(
        `select count(*)::int as n from pg_auth_members m join pg_roles r on r.oid = m.member
          where r.rolname like 'conector_prueba%'`,
      )
    ).rows[0]!.n;
    expect(miembros).toBe(0);
  });

  it("los roles del conector no tienen ningún permiso sobre tablas y no pueden leer ni escribir", async () => {
    const bd = await abrir();
    for (const rol of [ROL_MCP, ROL_GESTION]) {
      const privilegios = await bd.privilegios(rol, ESQUEMA);
      expect(
        privilegios.filter((p) => p.startsWith("tabla:")),
        rol,
      ).toEqual([]);
      expect(privilegios, rol).not.toContain("esquema:create");
      await expect(
        bd.como(rol, () => bd.db.query(`select * from ${ESQUEMA}.licencias`)),
      ).rejects.toThrow(/permission denied for table licencias/);
      await expect(
        bd.como(rol, () => bd.db.query(`insert into ${ESQUEMA}.sucesos (ruta) values ('x')`)),
      ).rejects.toThrow(/permission denied for table sucesos/);
      await expect(
        bd.como(rol, () => bd.db.query(`create table ${ESQUEMA}.intruso (id int)`)),
      ).rejects.toThrow(/permission denied for schema/);
    }
  });

  it("los roles de Supabase y PUBLIC no tienen nada sobre el esquema, tampoco funciones", async () => {
    const bd = await abrir();
    for (const rol of ROLES_SUPABASE) {
      expect(await bd.privilegios(rol, ESQUEMA), rol).toEqual([]);
      await expect(
        bd.como(rol, () => bd.db.query(`select * from ${ESQUEMA}.licencias`)),
      ).rejects.toThrow(/permission denied for schema/);
    }
    // Ninguna función del esquema conserva el permiso por defecto de PUBLIC (acl explícita, sin PUBLIC).
    const conPublic = (
      await bd.db.query<{ proname: string }>(
        `select p.proname from pg_proc p
          where p.pronamespace = '${ESQUEMA}'::regnamespace
            and (p.proacl is null or exists (select 1 from aclexplode(p.proacl) a where a.grantee = 0))`,
      )
    ).rows;
    expect(conPublic).toEqual([]);
    // PUBLIC sin uso del esquema.
    const aclEsquema = (
      await bd.db.query<{ n: number }>(
        `select count(*)::int as n from pg_namespace s, aclexplode(s.nspacl) a
          where s.nspname = '${ESQUEMA}' and a.grantee = 0`,
      )
    ).rows[0]!.n;
    expect(aclEsquema).toBe(0);
  });

  it("una función creada después, con el revoke explícito de la plantilla, no llega a nadie más", async () => {
    // Limitación de Postgres: alter default privileges en un esquema no quita el permiso por defecto de
    // PUBLIC sobre funciones (por eso cada función nueva lleva su revoke explícito y su grant).
    const bd = await abrir();
    await bd.db.exec(
      `create function ${ESQUEMA}.nueva_prueba() returns int language sql as $$ select 1 $$;
       revoke all on function ${ESQUEMA}.nueva_prueba() from public, anon, authenticated, service_role;`,
    );
    for (const rol of ROLES_SUPABASE) {
      expect(await bd.privilegios(rol, ESQUEMA), rol).toEqual([]);
    }
  });

  it("la semilla trae las licencias A y B de dos clientes distintos, sin ningún secreto", async () => {
    const bd = await abrir();
    const filas = (
      await bd.db.query<{ tipo: string; cliente_id: string; estado: string }>(
        `select tipo::text, cliente_id::text, estado::text from ${ESQUEMA}.licencias order by tipo`,
      )
    ).rows;
    expect(filas.map((f) => f.tipo)).toEqual(["A", "B"]);
    expect(new Set(filas.map((f) => f.cliente_id)).size).toBe(2);
    expect(filas.every((f) => f.estado === "activa")).toBe(true);
    for (const t of TABLAS.filter((t) => t !== "licencias")) {
      const n = (await bd.db.query<{ n: number }>(`select count(*)::int as n from ${ESQUEMA}.${t}`))
        .rows[0]!.n;
      expect(n, `la semilla solo siembra licencias; ${t}`).toBe(0);
    }
  });
});

describe("T-103 (a): ninguna columna de token, código, dirección ni texto libre (PRUEBA-019, parte)", () => {
  it("toda columna de texto lleva un check de lista cerrada o de forma acotada", async () => {
    const bd = await abrir();
    const columnas = (
      await bd.db.query<{ tabla: string; columna: string; tipo: string }>(
        `select table_name as tabla, column_name as columna, data_type as tipo
           from information_schema.columns
          where table_schema = '${ESQUEMA}'
            and data_type in ('text', 'character varying', 'character', 'ARRAY', 'json', 'jsonb', 'bytea')
          order by 1, 2`,
      )
    ).rows;
    expect(columnas.length).toBeGreaterThan(5);
    const restricciones = (
      await bd.db.query<{ tabla: string; def: string }>(
        `select c.conrelid::regclass::text as tabla, pg_get_constraintdef(c.oid) as def
           from pg_constraint c where c.contype = 'c' and c.connamespace = '${ESQUEMA}'::regnamespace`,
      )
    ).rows;
    for (const { tabla, columna, tipo } of columnas) {
      expect(["json", "jsonb", "bytea"], `${tabla}.${columna}: ${tipo} no admitido`).not.toContain(
        tipo,
      );
      const propias = restricciones.filter(
        (r) => r.tabla.endsWith(`.${tabla}`) && new RegExp(`\\b${columna}\\b`).test(r.def),
      );
      // Lista cerrada (= ANY, <@), expresión regular con cuantificador acotado, o expresión regular con
      // la longitud acotada a la vez (version_prompt): nunca solo la longitud.
      const cerrada = propias.some(
        (r) =>
          /= ANY|<@|~ '[^']*\{\d+(,\d+)?\}/.test(r.def) ||
          (/~ '/.test(r.def) && /char_length\([a-z_]+\) <= \d+/.test(r.def)),
      );
      expect(cerrada, `${tabla}.${columna} sin check de lista cerrada o forma acotada`).toBe(true);
    }
  });

  it("ningún nombre de columna sugiere token, código, dirección ni texto, salvo HMAC y `sucesos.codigo`", async () => {
    const bd = await abrir();
    const nombres = (
      await bd.db.query<{ tabla: string; columna: string }>(
        `select table_name as tabla, column_name as columna from information_schema.columns
          where table_schema = '${ESQUEMA}' order by 1, 2`,
      )
    ).rows;
    // Por palabras del nombre (separadas por guion bajo): `comp_contexto` no es `texto`.
    const palabras = new Set(
      "token codigo code secret secreto clave direccion correo email asunto remitente mensaje texto nombre contrasena password ip url adjunto comentario".split(
        " ",
      ),
    );
    const prohibido = { test: (n: string) => n.split("_").some((p) => palabras.has(p)) };
    const sospechosas = nombres
      .filter((c) => prohibido.test(c.columna))
      .filter((c) => !c.columna.endsWith("_hmac"))
      // `sucesos.codigo`: patrón acotado (minúsculas, cifras y guion bajo, hasta 40), no una lista cerrada;
      // la lista cerrada llega con la de C-2 (T-104). Su check lo exige el test anterior.
      .filter((c) => !(c.tabla === "sucesos" && c.columna === "codigo"))
      // `comp_correo`: booleano del contrato (si pudo entrar al correo), no una dirección.
      .filter((c) => !(c.tabla === "informes" && c.columna === "comp_correo"));
    expect(sospechosas).toEqual([]);
    // Todo lo secreto, solo como HMAC hexadecimal de 64 caracteres.
    const hmacs = nombres.filter((c) => c.columna.endsWith("_hmac"));
    expect(hmacs.length).toBeGreaterThanOrEqual(6);
  });

  it("los HMAC rechazan cualquier valor que no sea hexadecimal de 64 caracteres", async () => {
    const bd = await abrir();
    const lic = (
      await bd.db.query<{ id: string }>(
        `select id::text from ${ESQUEMA}.licencias where tipo = 'A'`,
      )
    ).rows[0]!.id;
    await bd.db.query(
      `insert into ${ESQUEMA}.codigos_activacion (licencia_id, codigo_hmac, caduca_en)
       values ($1, $2, now() + interval '10 minutes')`,
      [lic, hex("a")],
    );
    for (const malo of [
      "abc",
      hex("A"),
      hex("g"),
      hex("a") + "0",
      "hia_" + "a_" + "x".repeat(43),
    ]) {
      await expect(
        bd.db.query(
          `insert into ${ESQUEMA}.codigos_activacion (licencia_id, codigo_hmac, caduca_en)
           values ($1, $2, now() + interval '10 minutes')`,
          [lic, malo],
        ),
        malo.length > 20 ? "valor largo" : malo,
      ).rejects.toThrow(/violates check constraint/);
    }
  });
});

describe("T-103 (a): lo que no debe poder hacerse, no se puede (checks y enumerados)", () => {
  async function conBase() {
    const bd = await abrir();
    const lic = (
      await bd.db.query<{ id: string }>(
        `select id::text from ${ESQUEMA}.licencias where tipo = 'A'`,
      )
    ).rows[0]!.id;
    const conexion = (
      await bd.db.query<{ id: string }>(
        `insert into ${ESQUEMA}.conexiones (licencia_id, asistente) values ($1, 'claude') returning id::text`,
        [lic],
      )
    ).rows[0]!.id;
    const ejecucion = (
      await bd.db.query<{ id: string }>(
        `insert into ${ESQUEMA}.ejecuciones (conexion_id, licencia_id, estado_servido)
         values ($1, $2, 'activa') returning id::text`,
        [conexion, lic],
      )
    ).rows[0]!.id;
    return { bd, lic, conexion, ejecucion };
  }
  const informeValido = {
    estado: "ok",
    modo: "conversacion",
    asistente: "claude",
    almacenamiento: "drive",
    version_prompt: "0.1",
    frecuencia_horas: 1,
    tratados: 1,
    sin_tratar: 0,
    borradores: 1,
    documentos: 0,
    facturas_pendientes: 0,
    urgentes: 0,
  };
  async function insertarInforme(
    bd: BdApoyo,
    lic: string,
    ejecucion: string,
    cambios: Record<string, unknown> = {},
    problemas: string[] = [],
  ) {
    const v = { ...informeValido, ...cambios } as Record<string, unknown>;
    return bd.db.query(
      `insert into ${ESQUEMA}.informes (ejecucion_id, licencia_id, estado, modo, asistente, almacenamiento,
         version_prompt, frecuencia_horas, tratados, sin_tratar, borradores, documentos,
         facturas_pendientes, urgentes, comp_correo, comp_almacenamiento, comp_contexto, comp_registro,
         problemas)
       values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, true, true, true, true, $15)`,
      [
        ejecucion,
        lic,
        v.estado,
        v.modo,
        v.asistente,
        v.almacenamiento,
        v.version_prompt,
        v.frecuencia_horas,
        v.tratados,
        v.sin_tratar,
        v.borradores,
        v.documentos,
        v.facturas_pendientes,
        v.urgentes,
        problemas,
      ],
    );
  }

  it("informes: acepta un informe del contrato", async () => {
    const { bd, lic, ejecucion } = await conBase();
    await insertarInforme(bd, lic, ejecucion);
    const n = (
      await bd.db.query<{ n: number }>(`select count(*)::int as n from ${ESQUEMA}.informes`)
    ).rows[0]!.n;
    expect(n).toBe(1);
  });

  it("informes: cada rechazo lo es por el check de la columna, no por la clave única de la ejecución", async () => {
    const { bd, lic, conexion } = await conBase();
    const casos: [string, unknown, RegExp][] = [
      ["frecuencia_horas", 169, /informes_frecuencia_horas_check/],
      ["tratados", 1001, /informes_tratados_check/],
      ["sin_tratar", 100001, /informes_sin_tratar_check/],
      ["urgentes", -1, /informes_urgentes_check/],
      ["version_prompt", "x.y", /informes_version_prompt_check/],
      ["version_prompt", "1234567890.12", /informes_version_prompt_check/],
    ];
    for (const [campo, valor, motivo] of casos) {
      const ejecucion = (
        await bd.db.query<{ id: string }>(
          `insert into ${ESQUEMA}.ejecuciones (conexion_id, licencia_id, estado_servido)
           values ($1, $2, 'activa') returning id::text`,
          [conexion, lic],
        )
      ).rows[0]!.id;
      await expect(insertarInforme(bd, lic, ejecucion, { [campo]: valor }), campo).rejects.toThrow(
        motivo,
      );
    }
  });

  it("informes: enumerados cerrados, problemas del catálogo y como mucho 5, una vez por ejecución", async () => {
    const { bd, lic, conexion, ejecucion } = await conBase();
    const nueva = async () =>
      (
        await bd.db.query<{ id: string }>(
          `insert into ${ESQUEMA}.ejecuciones (conexion_id, licencia_id, estado_servido)
           values ($1, $2, 'activa') returning id::text`,
          [conexion, lic],
        )
      ).rows[0]!.id;
    await expect(insertarInforme(bd, lic, await nueva(), { estado: "roto" })).rejects.toThrow(
      /invalid input value for enum/,
    );
    await expect(
      insertarInforme(bd, lic, await nueva(), { asistente: "otro_mas" }),
    ).rejects.toThrow(/invalid input value for enum/);
    await expect(
      insertarInforme(bd, lic, await nueva(), {}, ["frase libre de un correo"]),
    ).rejects.toThrow(/violates check constraint "informes_problemas_check"/);
    await expect(
      insertarInforme(bd, lic, await nueva(), {}, [
        "sin_contexto",
        "otro",
        "error_borrador",
        "error_etiquetado",
        "sin_acceso_correo",
        "sin_contexto",
      ]),
    ).rejects.toThrow(/violates check constraint "informes_problemas_check"/);
    await insertarInforme(bd, lic, ejecucion, {}, ["sin_contexto"]);
    await expect(insertarInforme(bd, lic, ejecucion)).rejects.toThrow(/duplicate key value/);
  });

  it("clientes_oauth: solo los dos callbacks de la lista y como mucho 2", async () => {
    const { bd } = await conBase();
    const claude = "https://claude.ai/api/mcp/auth_callback";
    const chatgpt = "https://chatgpt.com/connector_platform_oauth_redirect";
    const insertar = (client: string, uris: string[]) =>
      bd.db.query(
        `insert into ${ESQUEMA}.clientes_oauth (client_id, origen, redirect_uris) values ($1, 'dcr', $2)`,
        [client, uris],
      );
    await insertar("dcr_" + "a".repeat(22), [claude]);
    await insertar("dcr_" + "b".repeat(22), [claude, chatgpt]);
    await expect(insertar("dcr_" + "c".repeat(22), ["https://otro.test/cb"])).rejects.toThrow(
      /violates check constraint "clientes_oauth_redirect_uris_check"/,
    );
    await expect(
      insertar("dcr_" + "d".repeat(22), [claude, "http://localhost:3000/cb"]),
    ).rejects.toThrow(/violates check constraint "clientes_oauth_redirect_uris_check"/);
    await expect(insertar("dcr_" + "e".repeat(22), [])).rejects.toThrow(
      /violates check constraint "clientes_oauth_redirect_uris_check"/,
    );
    await expect(insertar("valor libre", [claude])).rejects.toThrow(
      /violates check constraint "clientes_oauth_client_id_check"/,
    );
  });

  it("conexiones: la revocación y su motivo van juntos y el motivo es de la lista cerrada", async () => {
    const { bd, lic } = await conBase();
    await expect(
      bd.db.query(
        `insert into ${ESQUEMA}.conexiones (licencia_id, asistente, revocada_en) values ($1, 'otro', now())`,
        [lic],
      ),
    ).rejects.toThrow(/violates check constraint "conexiones_revocacion_coherente"/);
    await expect(
      bd.db.query(
        `insert into ${ESQUEMA}.conexiones (licencia_id, asistente, revocada_en, motivo_revocacion)
         values ($1, 'otro', now(), 'porque si')`,
        [lic],
      ),
    ).rejects.toThrow(/invalid input value for enum/);
    for (const motivo of ["operador", "reutilizacion", "cierre"]) {
      await bd.db.query(
        `insert into ${ESQUEMA}.conexiones (licencia_id, asistente, revocada_en, motivo_revocacion)
         values ($1, 'otro', now(), $2)`,
        [lic, motivo],
      );
    }
  });

  it("tokens: tipo cerrado, la caducidad es posterior a la emisión y la sal tiene forma fija", async () => {
    const { bd, conexion } = await conBase();
    const recurso = "https://conector.ejemplo.test/api/mcp";
    const insertar = (tipo: string, hmac: string, caduca: string, sal: string | null = null) =>
      bd.db.query(
        `insert into ${ESQUEMA}.tokens (conexion_id, tipo, token_hmac, recurso, caduca_en, sal)
         values ($1, $2, $3, $4, now() + ($5)::interval, $6)`,
        [conexion, tipo, hmac, recurso, caduca, sal],
      );
    await insertar("acceso", hex("1"), "5 minutes");
    await expect(insertar("acceso", hex("2"), "-1 minutes")).rejects.toThrow(
      /violates check constraint "tokens_caducidad_posterior"/,
    );
    await expect(insertar("admin", hex("3"), "5 minutes")).rejects.toThrow(
      /invalid input value for enum/,
    );
    await expect(insertar("renovacion", hex("4"), "5 minutes", "corta")).rejects.toThrow(
      /violates check constraint "tokens_sal_check"/,
    );
    await insertar("renovacion", hex("5"), "14 days", "A".repeat(22));
    await expect(insertar("acceso", hex("1"), "5 minutes")).rejects.toThrow(/duplicate key value/);
  });

  it("ordenes: tipo y estado cerrados y marcas de tiempo coherentes con el estado", async () => {
    const { bd, lic } = await conBase();
    await bd.db.query(`insert into ${ESQUEMA}.ordenes (licencia_id, tipo) values ($1, 'pausar')`, [
      lic,
    ]);
    await expect(
      bd.db.query(`insert into ${ESQUEMA}.ordenes (licencia_id, tipo) values ($1, 'borrar')`, [
        lic,
      ]),
    ).rejects.toThrow(/invalid input value for enum/);
    await expect(
      bd.db.query(
        `insert into ${ESQUEMA}.ordenes (licencia_id, tipo, estado) values ($1, 'pausar', 'confirmada')`,
        [lic],
      ),
    ).rejects.toThrow(/violates check constraint "ordenes_estado_coherente"/);
    await bd.db.query(
      `insert into ${ESQUEMA}.ordenes (licencia_id, tipo, estado, entregada_en, confirmada_en)
       values ($1, 'reanudar', 'confirmada', now(), now())`,
      [lic],
    );
  });

  it("sucesos y límites: forma cerrada y duración acotada", async () => {
    const { bd } = await conBase();
    const suceso = (cambios: Record<string, unknown>) => {
      const v = {
        ruta: "mcp",
        herramienta: "obtener_instrucciones",
        resultado: "correcto",
        codigo: "ok",
        duracion_ms: 10,
        protocolo: "otra",
        ...cambios,
      };
      return bd.db.query(
        `insert into ${ESQUEMA}.sucesos (ruta, herramienta, resultado, codigo, duracion_ms, protocolo)
         values ($1, $2, $3, $4, $5, $6)`,
        [v.ruta, v.herramienta, v.resultado, v.codigo, v.duracion_ms, v.protocolo],
      );
    };
    await suceso({});
    await expect(suceso({ ruta: "/ruta pedida con espacios y texto" })).rejects.toThrow(
      /violates check constraint "sucesos_ruta_check"/,
    );
    await expect(suceso({ codigo: "Mensaje libre con un asunto" })).rejects.toThrow(
      /violates check constraint "sucesos_codigo_check"/,
    );
    await expect(suceso({ duracion_ms: -1 })).rejects.toThrow(
      /violates check constraint "sucesos_duracion_ms_check"/,
    );
    await expect(suceso({ duracion_ms: 600001 })).rejects.toThrow(
      /violates check constraint "sucesos_duracion_ms_check"/,
    );
    // Hallazgo 6 del auditor: la herramienta es de la lista cerrada del contrato, o nula.
    for (const h of ["obtener_instrucciones", "enviar_informe", "confirmar_orden", null]) {
      await suceso({ herramienta: h });
    }
    for (const mala of ["canario_texto", "eco", "Obtener_instrucciones", ""]) {
      await expect(suceso({ herramienta: mala }), mala).rejects.toThrow(
        /violates check constraint "sucesos_herramienta_check"/,
      );
    }
    await expect(suceso({ resultado: "quizas" })).rejects.toThrow(/invalid input value for enum/);
    await expect(suceso({ protocolo: "2024-01-01" })).rejects.toThrow(
      /violates check constraint "sucesos_protocolo_check"/,
    );
    await expect(
      bd.db.query(
        `insert into ${ESQUEMA}.limites_origen (ambito, origen_hmac, ventana_desde) values ('activacion', $1, now())`,
        ["192.0.2.1"],
      ),
    ).rejects.toThrow(/violates check constraint "limites_origen_origen_hmac_check"/);
  });
});

describe("T-103 (a): reversión probada (artículo 11; PRUEBA-022, parte B)", () => {
  it("la reversión borra el esquema y los dos roles y no deja nada del conector", async () => {
    const bd = await abrir([ESTADO, REVERSION]);
    const esquemas = (
      await bd.db.query<{ n: number }>(
        `select count(*)::int as n from pg_namespace where nspname = '${ESQUEMA}'`,
      )
    ).rows[0]!.n;
    const roles = (
      await bd.db.query<{ n: number }>(
        `select count(*)::int as n from pg_roles where rolname like 'conector_prueba%'`,
      )
    ).rows[0]!.n;
    expect(esquemas).toBe(0);
    expect(roles).toBe(0);
  });

  it("aplicar -> revertir -> aplicar deja exactamente el mismo esquema, funciones, permisos y roles", async () => {
    const unaVez = await abrir([ESTADO, SEMILLA]);
    const trasCiclo = await abrir([ESTADO, SEMILLA, REVERSION, ESTADO, SEMILLA]);
    const huellaUna = await huella(unaVez);
    expect(huellaUna).toContain("conector_prueba_mcp");
    // La huella cubre también las funciones de las tres herramientas (T-103 d, e, f).
    for (const f of [
      "validar_acceso",
      "registrar_suceso",
      "mcp_obtener_instrucciones",
      "mcp_enviar_informe",
      "mcp_confirmar_orden",
      "informe_es_valido",
    ]) {
      const linea = (JSON.parse(huellaUna) as { funciones: string[] }).funciones.find((x) =>
        x.startsWith(`${f}:true:`),
      );
      expect(linea, f).toContain("search_path=pg_catalog, pg_temp");
    }
    expect(await huella(trasCiclo)).toBe(huellaUna);
    // Tras el ciclo, la semilla vuelve a dar A y B (la reversión borró los datos).
    const n = (
      await trasCiclo.db.query<{ n: number }>(`select count(*)::int as n from ${ESQUEMA}.licencias`)
    ).rows[0]!.n;
    expect(n).toBe(2);
  });

  it("aplicar dos veces seguidas no falla y no cambia nada (reejecutable)", async () => {
    const una = await abrir([ESTADO, SEMILLA]);
    const dos = await abrir([ESTADO, SEMILLA, ESTADO, SEMILLA]);
    expect(await huella(dos)).toBe(await huella(una));
    const n = (
      await dos.db.query<{ n: number }>(`select count(*)::int as n from ${ESQUEMA}.licencias`)
    ).rows[0]!.n;
    expect(n).toBe(2);
  });

  it("revertir sin haber aplicado tampoco falla", async () => {
    const bd = await abrir([REVERSION]);
    expect(bd.archivosCargados).toEqual([REVERSION]);
  });
});

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..", "..", "..");
const leerSql = (n: string) => readFileSync(join(RAIZ, "supabase", "conector-prueba", n), "utf8");

const planas: PGlite[] = [];
afterAll(async () => {
  while (planas.length > 0) await planas.pop()?.close();
});
/** PGlite sin el apoyo de la batería: el usuario inicial es superusuario, como en una instalación nueva. */
async function pglitePlano(): Promise<PGlite> {
  const db = await PGlite.create();
  planas.push(db);
  await db.exec(`create role anon nologin; create role authenticated nologin;
    create role service_role nologin bypassrls;`);
  return db;
}
const una = async <T>(db: PGlite, sql: string) => (await db.query<T>(sql)).rows[0]!;
const rolesDelConector = async (db: PGlite) =>
  (
    await una<{ n: number }>(
      db,
      "select count(*)::int as n from pg_roles where rolname like 'conector_prueba%'",
    )
  ).n;
/** Aplica el SQL, que debe fallar; deja la sesión limpia (la transacción abortada se deshace). */
async function fallaAlAplicar(db: PGlite, archivo: string): Promise<string> {
  try {
    await db.exec(leerSql(archivo));
  } catch (e) {
    await db.exec("rollback");
    return (e as Error).message;
  }
  throw new Error("se esperaba un error al aplicar " + archivo);
}
const existeTabla = async (db: PGlite) =>
  (await una<{ r: string | null }>(db, `select to_regclass('${ESQUEMA}.licencias')::text as r`))
    .r !== null;

describe("T-103 (a): aplicar y revertir con un rol que no es superusuario (hallazgo 2; art. 11 y 13)", () => {
  // Como el `postgres` de Supabase: CREATEROLE, CREATEDB y BYPASSRLS, sin ser superusuario. Un
  // `alter role ... nosuperuser` o `nobypassrls` falla con 42501 en Nido: los atributos van en el CREATE ROLE.
  async function conPostgresDeSupabase(): Promise<PGlite> {
    const db = await pglitePlano();
    await db.exec(`create role supa_postgres login nosuperuser createrole createdb bypassrls;
      grant create on database postgres to supa_postgres`);
    await db.exec("set role supa_postgres");
    const yo = await una<{ u: string; es_super: boolean }>(
      db,
      "select current_user as u, (select rolsuper from pg_roles where rolname = current_user) as es_super",
    );
    expect(yo).toEqual({ u: "supa_postgres", es_super: false });
    return db;
  }

  it("aplica estado y semilla, y los dos roles nacen con todos los atributos negativos", async () => {
    const db = await conPostgresDeSupabase();
    await db.exec(leerSql(ESTADO));
    await db.exec(leerSql(SEMILLA));
    const filas = (
      await db.query<Record<string, unknown>>(
        `select rolname, rolsuper, rolinherit, rolcanlogin, rolcreaterole, rolcreatedb, rolbypassrls,
                rolreplication, rolconnlimit, rolconfig
           from pg_roles where rolname like 'conector_prueba%' order by 1`,
      )
    ).rows;
    expect(filas.map((f) => f.rolname)).toEqual([ROL_GESTION, ROL_MCP]);
    for (const f of filas) {
      expect(f, String(f.rolname)).toMatchObject({
        rolsuper: false,
        rolinherit: false,
        rolcanlogin: true,
        rolcreaterole: false,
        rolcreatedb: false,
        rolbypassrls: false,
        rolreplication: false,
        rolconnlimit: 10,
      });
      expect(f.rolconfig).toEqual(
        expect.arrayContaining([
          "statement_timeout=5s",
          "idle_in_transaction_session_timeout=10s",
          "lock_timeout=2s",
        ]),
      );
    }
    expect(await existeTabla(db)).toBe(true);
  });

  it("revierte y reaplica con ese mismo rol; la reversión no deja esquema ni roles", async () => {
    const db = await conPostgresDeSupabase();
    await db.exec(leerSql(ESTADO));
    await db.exec(leerSql(SEMILLA));
    await db.exec(leerSql(REVERSION));
    expect(await existeTabla(db)).toBe(false);
    expect(await rolesDelConector(db)).toBe(0);
    expect(
      (
        await una<{ n: number }>(
          db,
          `select count(*)::int as n from pg_namespace where nspname = '${ESQUEMA}'`,
        )
      ).n,
    ).toBe(0);
    await db.exec(leerSql(ESTADO));
    await db.exec(leerSql(SEMILLA));
    expect(await existeTabla(db)).toBe(true);
    // Reejecutable también sin superusuario.
    await db.exec(leerSql(ESTADO));
  });
});

describe("T-103 (a): guardas de lo que ya existe (hallazgos 2 y 7; art. 3 y 13)", () => {
  const peligrosos: [string, string][] = [
    ["superusuario", "superuser"],
    ["bypassrls", "bypassrls"],
    ["replicación", "replication"],
    ["createrole", "createrole"],
    ["createdb", "createdb"],
  ];
  for (const rol of [ROL_MCP, ROL_GESTION]) {
    for (const [nombre, atributo] of peligrosos) {
      it(`un ${rol} preexistente con ${nombre} detiene la aplicación y no se toca`, async () => {
        const db = await pglitePlano();
        await db.exec(`create role ${rol} login ${atributo}`);
        const mensaje = await fallaAlAplicar(db, ESTADO);
        expect(mensaje).toContain(`${ESQUEMA}: el rol ${rol} ya existe con atributos peligrosos`);
        expect(await existeTabla(db)).toBe(false);
        // La guarda no lo arregla en silencio: el atributo sigue ahí.
        const columna = {
          superuser: "rolsuper",
          bypassrls: "rolbypassrls",
          replication: "rolreplication",
          createrole: "rolcreaterole",
          createdb: "rolcreatedb",
        }[atributo]!;
        const f = await una<{ v: boolean }>(
          db,
          `select ${columna} as v from pg_roles where rolname = '${rol}'`,
        );
        expect(f.v).toBe(true);
      });
    }
  }

  it("un rol preexistente miembro de otro rol detiene la aplicación (NOINHERIT no basta)", async () => {
    const db = await pglitePlano();
    await db.exec(`create role otro_rol nologin; create role ${ROL_GESTION} login;
      grant otro_rol to ${ROL_GESTION}`);
    const mensaje = await fallaAlAplicar(db, ESTADO);
    expect(mensaje).toContain(
      `${ESQUEMA}: el rol ${ROL_GESTION} ya existe y es miembro de otro rol`,
    );
    expect(await existeTabla(db)).toBe(false);
  });

  it("un esquema preexistente con otro dueño detiene la aplicación (no se adopta ni se pisa)", async () => {
    const db = await pglitePlano();
    await db.exec(
      `create role duenio_ajeno nologin; create schema ${ESQUEMA} authorization duenio_ajeno`,
    );
    const mensaje = await fallaAlAplicar(db, ESTADO);
    expect(mensaje).toContain(`${ESQUEMA}: el esquema ${ESQUEMA} ya existe con otro dueño`);
    expect(await existeTabla(db)).toBe(false);
    expect(await rolesDelConector(db)).toBe(0);
  });

  it("un rol preexistente inofensivo se normaliza (login, noinherit, límite, tiempos) sin tocar su contraseña", async () => {
    const db = await pglitePlano();
    await db.exec(
      `create role ${ROL_MCP} nologin inherit connection limit 99 password 'solo-de-prueba-1234'`,
    );
    const antes = await una<{ p: string }>(
      db,
      `select rolpassword as p from pg_authid where rolname = '${ROL_MCP}'`,
    );
    await db.exec(leerSql(ESTADO));
    const f = await una<{
      rolcanlogin: boolean;
      rolinherit: boolean;
      rolconnlimit: number;
      rolconfig: string[];
      p: string;
    }>(
      db,
      `select r.rolcanlogin, r.rolinherit, r.rolconnlimit, r.rolconfig, a.rolpassword as p
         from pg_roles r join pg_authid a on a.oid = r.oid where r.rolname = '${ROL_MCP}'`,
    );
    expect(f).toMatchObject({ rolcanlogin: true, rolinherit: false, rolconnlimit: 10, p: antes.p });
    expect(f.rolconfig).toEqual(
      expect.arrayContaining(["statement_timeout=5s", "lock_timeout=2s"]),
    );
  });
});
