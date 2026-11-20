// M02 `clientes_y_acceso` y M03 `internas_autorizacion_y_cobro` en PGlite (T-002; D-1, D-7, §2).
// REQ-004, REQ-008, REQ-020, REQ-023, REQ-024, REQ-026, REQ-049, REQ-056 ·
// CA-004, CA-016, CA-019, CA-021, CA-034.
// Comprueba SQL válido y comportamiento; no sustituye a pgTAP (CI, T-013).
// La concurrencia real de REQ-049 (dos transacciones a la vez) no se puede
// reproducir con una sola conexión PGlite: aquí se prueba la restricción que la
// impone; la prueba concurrente es `concurrencia-licencia.sh` (T-012, T-013).
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

const TABLAS_M02 = [
  "administradores",
  "ajustes_globales",
  "catalogo_problemas",
  "clientes",
  "codigos_activacion",
  "conexiones",
  "licencias",
  "ordenes",
  "reglas_cliente",
  "suscripciones",
  "usuarios_cliente",
];
const TABLAS_M03 = ["clientes_oauth", "codigos_autorizacion", "eventos_stripe", "tokens"];
const TABLAS = [...TABLAS_M02, ...TABLAS_M03].sort();

// Los cuatro destinatarios de la API y el conector (D-5: ninguno tiene nada
// hasta M07), más el destinatario ajeno del preámbulo (P6 de T-001).
const ROLES_SIN_PERMISOS = ["anon", "authenticated", "service_role", "conector", "conector_prueba"];
const PRIVILEGIOS = ["SELECT", "INSERT", "UPDATE", "DELETE", "TRUNCATE", "REFERENCES", "TRIGGER"];

// Tipos de §2 de docs/MODELO-DATOS.sql, transcritos.
const TIPOS: Record<string, string[]> = {
  almacenamiento: ["drive", "onedrive", "dropbox", "otro"],
  asistente: ["claude", "chatgpt", "otro"],
  canal: ["estable", "prueba"],
  estado_cliente: ["activo", "baja"],
  estado_informe: ["ok", "aviso", "error", "pausado"],
  estado_licencia: ["activa", "suspendida", "revocada"],
  estado_manual: ["automatico", "forzar_activa", "forzar_suspendida"],
  estado_orden: ["pendiente", "entregada", "confirmada", "anulada"],
  estado_servido: ["activa", "pausada", "suspendida"],
  estado_suscripcion: [
    "trialing",
    "active",
    "incomplete",
    "incomplete_expired",
    "past_due",
    "unpaid",
    "canceled",
    "paused",
  ],
  modo_ejecucion: ["conversacion", "desatendido"],
  motivo_publicacion: ["publicacion", "vuelta_atras"],
  origen_cliente_oauth: ["cimd", "dcr", "predefinido"],
  severidad: ["info", "aviso", "critica"],
  tipo_alerta: [
    "sin_senal",
    "ejecucion_sin_informe",
    "estado_error",
    "version_antigua",
    "orden_sin_confirmar",
    "conexion_nueva",
    "token_reutilizado",
    "renovacion_fallida",
    "intentos_activacion",
    "impago",
    "gracia_vencida",
  ],
  tipo_orden: ["pausar", "reanudar"],
  tipo_token: ["acceso", "renovacion"],
};

// D-7, filas de las tablas de M02 y M03 (16 de las 26).
const TEXTO_D7 = [
  "catalogo_problemas.codigo",
  "catalogo_problemas.descripcion",
  "clientes.nombre",
  "clientes_oauth.client_id",
  "clientes_oauth.redirect_uris",
  "codigos_activacion.codigo_hmac",
  "codigos_autorizacion.code_challenge",
  "codigos_autorizacion.codigo_hmac",
  "codigos_autorizacion.recurso",
  "codigos_autorizacion.redirect_uri",
  "eventos_stripe.id",
  "eventos_stripe.tipo",
  "suscripciones.stripe_customer_id",
  "suscripciones.stripe_subscription_id",
  "tokens.recurso",
  "tokens.token_hmac",
];

// Identificadores fijos de los datos ficticios.
const CA = "00000000-0000-4000-8000-00000000000a";
const LA = "00000000-0000-4000-8000-0000000000a1";
const XA = "00000000-0000-4000-8000-0000000000a2";
const OA = "00000000-0000-4000-8000-0000000000a3";
const UA = "00000000-0000-4000-8000-0000000000a4";

let db: Base;
beforeEach(async () => {
  db = await crearBase();
});
afterEach(async () => {
  await db.close();
});

async function aplicarHastaM03(base: Base): Promise<void> {
  await aplicar(base, M01());
  await aplicar(base, M02());
  await aplicar(base, M03());
}

/** Filas mínimas de las que cuelgan las demás (como postgres). */
async function datosBase(base: Base): Promise<void> {
  await base.exec(`
    insert into auth.users (id) values ('${UA}');
    insert into public.clientes (id, nombre) values ('${CA}', 'Cliente A ficticio');
    insert into public.licencias (id, cliente_id) values ('${LA}', '${CA}');
    insert into public.conexiones (id, licencia_id) values ('${XA}', '${LA}');
    insert into public.clientes_oauth (id, client_id, origen, redirect_uris)
      values ('${OA}', 'https://ejemplo.invalid/cimd.json', 'cimd', array['https://ejemplo.invalid/vuelta']);
  `);
}

type Fila = Record<string, unknown>;

const CADUCA = "2030-01-01T00:00:00Z";
const H64 = (c: string) => c.repeat(64);

/** Una fila válida de cada tabla con columnas de formato. */
const VALIDAS: Record<string, Fila> = {
  clientes: { nombre: "Cliente ficticio" },
  codigos_activacion: { licencia_id: LA, codigo_hmac: H64("a"), caduca_en: CADUCA },
  catalogo_problemas: { codigo: "sin_permiso", descripcion: "Descripción ficticia" },
  suscripciones: {
    cliente_id: CA,
    stripe_customer_id: "cus_ficticioA",
    stripe_subscription_id: "sub_ficticioA",
  },
  clientes_oauth: {
    client_id: "https://ejemplo.invalid/otro.json",
    origen: "dcr",
    redirect_uris: ["https://ejemplo.invalid/vuelta"],
  },
  codigos_autorizacion: {
    codigo_hmac: H64("b"),
    conexion_id: XA,
    cliente_oauth_id: OA,
    redirect_uri: "https://ejemplo.invalid/vuelta",
    code_challenge: "A".repeat(43),
    recurso: "https://ejemplo.invalid/mcp",
    caduca_en: CADUCA,
  },
  tokens: {
    conexion_id: XA,
    tipo: "acceso",
    token_hmac: H64("c"),
    recurso: "https://ejemplo.invalid/mcp",
    caduca_en: CADUCA,
  },
  eventos_stripe: { id: "evt_ficticio1", tipo: "invoice.paid" },
};

/**
 * Inserta en una transacción que se deshace siempre (para no chocar con las
 * restricciones unique entre casos). Devuelve el mensaje de error o null.
 */
async function probarFila(base: Base, tabla: string, fila: Fila): Promise<string | null> {
  const columnas = Object.keys(fila);
  const marcas = columnas.map((_, i) => `$${i + 1}`).join(", ");
  await base.exec("begin");
  try {
    return await errorDe(() =>
      base.query(
        `insert into public.${tabla} (${columnas.join(", ")}) values (${marcas})`,
        Object.values(fila),
      ),
    );
  } finally {
    await base.exec("rollback");
  }
}

const VISIBLES_MALOS = ["", "a b", "a".repeat(301), "á", "a\n", "a\tb", " a"];
const VISIBLES_BUENOS = ["a", "a".repeat(300), "https://ejemplo.invalid/v?x=1&y=%20#z"];
const HMAC_MALOS = [
  "",
  H64("A"),
  "a".repeat(63),
  "a".repeat(65),
  `g${"a".repeat(63)}`,
  `${H64("a")}\n`,
  ` ${"a".repeat(63)}`,
];
const HMAC_BUENOS = [H64("0"), `${"0123456789abcdef".repeat(4)}`];

/** [tabla, columna, valores rechazados, valores aceptados]. */
const FORMATOS: [string, string, unknown[], unknown[]][] = [
  ["codigos_activacion", "codigo_hmac", HMAC_MALOS, HMAC_BUENOS],
  ["codigos_autorizacion", "codigo_hmac", HMAC_MALOS, HMAC_BUENOS],
  ["tokens", "token_hmac", HMAC_MALOS, HMAC_BUENOS],
  ["clientes_oauth", "client_id", VISIBLES_MALOS, VISIBLES_BUENOS],
  ["codigos_autorizacion", "redirect_uri", VISIBLES_MALOS, VISIBLES_BUENOS],
  ["codigos_autorizacion", "recurso", VISIBLES_MALOS, VISIBLES_BUENOS],
  ["tokens", "recurso", VISIBLES_MALOS, VISIBLES_BUENOS],
  [
    "clientes_oauth",
    "redirect_uris",
    [
      [],
      ["a b"],
      ["https://ejemplo.invalid/a", "a b"],
      ["a\tb"],
      ["a\n"],
      [""],
      ["https://ejemplo.invalid/a", ""],
      ["a".repeat(301)],
      ["a", "a".repeat(301)],
      ["https://ejemplo.invalid/a", null],
      [null],
      Array.from({ length: 6 }, (_, i) => `https://ejemplo.invalid/${i}`),
      [["https://ejemplo.invalid/a"], ["https://ejemplo.invalid/b"]],
      ["á"],
    ],
    [
      ["a"],
      ["a".repeat(300)],
      // Dos de 300: la racha no cruza el espacio que las separa.
      ["a".repeat(300), "b".repeat(300)],
      Array.from({ length: 5 }, (_, i) => `https://ejemplo.invalid/${i}`),
    ],
  ],
  [
    "codigos_autorizacion",
    "code_challenge",
    [
      "A".repeat(42),
      "A".repeat(129),
      `${"A".repeat(42)}+`,
      `${"A".repeat(42)}=`,
      `${"A".repeat(42)}.`,
      `${"A".repeat(42)}/`,
      `${"A".repeat(43)}\n`,
    ],
    ["A".repeat(43), "A".repeat(128), `aZ09_-${"x".repeat(37)}`],
  ],
  [
    "catalogo_problemas",
    "codigo",
    ["ab", "Abc", "a".repeat(41), "abc1", "ab c", "abc\n"],
    ["abc", "a".repeat(40), "sin_permiso"],
  ],
  [
    "catalogo_problemas",
    "descripcion",
    ["", "x".repeat(201)],
    ["x", "x".repeat(200), "á".repeat(200)],
  ],
  ["clientes", "nombre", ["", "x".repeat(121)], ["x", "x".repeat(120)]],
  [
    "suscripciones",
    "stripe_customer_id",
    ["cus_", "cux_abc", "CUS_abc", "cus_ab-c", "cus_ab c", `cus_${"a".repeat(251)}`, "cus_abc\n"],
    ["cus_a", `cus_${"a".repeat(250)}`, "cus_AbC09"],
  ],
  [
    "suscripciones",
    "stripe_subscription_id",
    ["sub_", "sub_ab-c", `sub_${"a".repeat(251)}`, "cus_abc"],
    ["sub_a", `sub_${"a".repeat(250)}`, null],
  ],
  [
    "eventos_stripe",
    "id",
    ["evt_", "evt_ab-c", `evt_${"a".repeat(251)}`, "EVT_abc"],
    ["evt_a", `evt_${"a".repeat(250)}`],
  ],
  [
    "eventos_stripe",
    "tipo",
    ["ab", "Invoice.paid", "a".repeat(81), "invoice paid", "invoice-paid"],
    ["abc", "a".repeat(80), "customer.subscription.updated", "invoice.payment_failed"],
  ],
];

describe("REQ-056, CA-034: tablas y tipos", () => {
  it("tras M01, M02 y M03, public tiene exactamente las 15 tablas de D-1 para estas migraciones", async () => {
    await aplicarHastaM03(db);
    const r = await db.query<{ relname: string }>(
      `select c.relname from pg_class c where c.relnamespace = 'public'::regnamespace
        and c.relkind in ('r', 'p') order by 1`,
    );
    expect(r.rows.map((x) => x.relname)).toEqual(TABLAS);
  });

  it("M02 crea los tipos de §2 con sus valores, en orden", async () => {
    await aplicar(db, M01());
    await aplicar(db, M02());
    const r = await db.query<{ tipo: string; valores: string[] }>(
      `select t.typname as tipo, array_agg(e.enumlabel order by e.enumsortorder) as valores
        from pg_type t join pg_enum e on e.enumtypid = t.oid
        where t.typnamespace = 'public'::regnamespace group by 1 order by 1`,
    );
    expect(Object.fromEntries(r.rows.map((x) => [x.tipo, x.valores]))).toEqual(TIPOS);
    expect(
      await valor(
        db,
        `select count(*)::int from pg_type t where t.typnamespace = 'public'::regnamespace
          and t.typtype <> 'e' and t.typrelid = 0 and t.typcategory <> 'A'`,
      ),
    ).toBe(0);
  });

  it("índice licencias_por_cliente (cliente_id) y la licencia vigente única", async () => {
    await aplicarHastaM03(db);
    const r = await db.query<{ indexname: string; indexdef: string }>(
      `select indexname, indexdef from pg_indexes where schemaname = 'public'
        and tablename = 'licencias' and indexname like 'licencias_%' order by 1`,
    );
    expect(r.rows.map((x) => x.indexname)).toEqual([
      "licencias_pkey",
      "licencias_por_cliente",
      "licencias_una_vigente_por_cliente",
    ]);
    const def = Object.fromEntries(r.rows.map((x) => [x.indexname, x.indexdef]));
    expect(def.licencias_por_cliente).toMatch(/USING btree \(cliente_id\)$/);
    expect(def.licencias_una_vigente_por_cliente).toMatch(
      /^CREATE UNIQUE INDEX .* USING btree \(cliente_id\) WHERE \(estado <> 'revocada'::(public\.)?estado_licencia\)$/,
    );
  });
});

describe("REQ-004, REQ-008, CA-004: RLS y ningún permiso", () => {
  it("cada tabla de public tiene RLS, tras M02 y tras M03, y ninguna política", async () => {
    await aplicar(db, M01());
    for (const m of [M02(), M03()]) {
      await aplicar(db, m);
      expect(
        await valor(
          db,
          `select count(*)::int from pg_class c where c.relnamespace = 'public'::regnamespace
            and c.relkind in ('r', 'p') and not c.relrowsecurity`,
        ),
        m,
      ).toBe(0);
    }
    expect(await valor(db, "select count(*)::int from pg_policies")).toBe(0);
  });

  it("solo el dueño (postgres) figura en la lista de permisos de cada tabla y de cada columna", async () => {
    await aplicarHastaM03(db);
    const r = await db.query(
      `select c.relname, a.grantee::regrole::text as para, a.privilege_type
        from pg_class c cross join lateral aclexplode(c.relacl) a
        where c.relnamespace = 'public'::regnamespace and a.grantee <> c.relowner
       union all
       select c.relname || '.' || t.attname, x.grantee::regrole::text, x.privilege_type
        from pg_attribute t join pg_class c on c.oid = t.attrelid
        cross join lateral aclexplode(t.attacl) x
        where c.relnamespace = 'public'::regnamespace and t.attacl is not null`,
    );
    expect(r.rows).toEqual([]);
    expect(
      await valor(
        db,
        `select count(*)::int from pg_class c where c.relnamespace = 'public'::regnamespace
          and c.relkind in ('r', 'p') and c.relowner <> 'postgres'::regrole`,
      ),
    ).toBe(0);
  });

  it("anon, authenticated, service_role, conector y conector_prueba: 0 privilegios en las 15 tablas", async () => {
    await aplicarHastaM03(db);
    const r = await db.query(
      `select r.rol, t.tabla, p.privilegio
        from unnest($1::text[]) r (rol), unnest($2::text[]) t (tabla), unnest($3::text[]) p (privilegio)
        where has_table_privilege(r.rol, 'public.' || t.tabla, p.privilegio)
           or has_any_column_privilege(r.rol, 'public.' || t.tabla,
                case when p.privilegio in ('SELECT', 'INSERT', 'UPDATE', 'REFERENCES')
                     then p.privilegio else 'SELECT' end)`,
      [ROLES_SIN_PERMISOS, TABLAS, PRIVILEGIOS],
    );
    expect(r.rows).toEqual([]);
  });

  it("leer cada tabla con esos roles (y AD2 con doble factor) da permiso denegado", async () => {
    await aplicarHastaM03(db);
    await datosBase(db);
    const claims = { sub: UA, role: "authenticated", aal: "aal2" };
    for (const rol of ROLES_SIN_PERMISOS) {
      for (const tabla of TABLAS) {
        const mensaje = await como(db, rol, rol === "authenticated" ? claims : null, () =>
          errorDe(() => db.query(`select 1 from public.${tabla} limit 1`)),
        );
        expect(mensaje, `${rol} ${tabla}`).toMatch(/permission denied/);
      }
    }
  });

  it("escribir en las tablas internas como service_role da permiso denegado (REQ-008)", async () => {
    await aplicarHastaM03(db);
    const mensaje = await como(db, "service_role", null, () =>
      errorDe(() =>
        db.query("insert into public.eventos_stripe (id, tipo) values ('evt_x', 'invoice.paid')"),
      ),
    );
    expect(mensaje).toMatch(/permission denied/);
  });
});

describe("REQ-024, CA-019, D-7: formatos de las columnas de texto", () => {
  for (const [tabla, columna, malos, buenos] of FORMATOS) {
    it(`${tabla}.${columna} rechaza cada valor sin formato y acepta los válidos`, async () => {
      await aplicarHastaM03(db);
      await datosBase(db);
      for (const v of malos) {
        const mensaje = await probarFila(db, tabla, {
          ...(VALIDAS[tabla] as Fila),
          [columna]: v,
        });
        expect(mensaje, JSON.stringify(v)).toMatch(/violates check constraint/);
      }
      for (const v of buenos) {
        const mensaje = await probarFila(db, tabla, {
          ...(VALIDAS[tabla] as Fila),
          [columna]: v,
        });
        expect(mensaje, JSON.stringify(v)).toBeNull();
      }
      // El rechazo no deja filas.
      if (tabla !== "clientes") {
        expect(await valor(db, `select count(*)::int from public.${tabla}`)).toBe(
          tabla === "clientes_oauth" ? 1 : 0,
        );
      }
    });
  }

  it("las columnas de texto de M02 y M03 son exactamente las de D-7", async () => {
    await aplicarHastaM03(db);
    const r = await db.query<{ col: string }>(
      `select c.relname || '.' || a.attname as col
        from pg_attribute a join pg_class c on c.oid = a.attrelid
        join pg_type t on t.oid = a.atttypid
        left join pg_type e on e.oid = t.typelem and t.typcategory = 'A'
        where c.relnamespace in ('public'::regnamespace, 'privado'::regnamespace)
          and c.relkind in ('r', 'p', 'v', 'm', 'f') and a.attnum > 0 and not a.attisdropped
          and (t.typcategory = 'S' or t.typname in ('json', 'jsonb')
               or e.typcategory = 'S' or e.typname in ('json', 'jsonb'))
          -- Solo se excluye la columna interna de M01 (nombre de esquema, tipo name).
          and not (c.relnamespace = 'privado'::regnamespace
                   and c.relname = 'permisos_por_defecto_previos' and a.attname = 'esquema')
        order by 1`,
    );
    expect(r.rows.map((x) => x.col)).toEqual(TEXTO_D7);
  });

  it("reglas_cliente no tiene ninguna columna de texto (REQ-020)", async () => {
    await aplicarHastaM03(db);
    const r = await db.query(
      `select a.attname, a.atttypid::regtype::text as tipo from pg_attribute a
        where a.attrelid = 'public.reglas_cliente'::regclass and a.attnum > 0 and not a.attisdropped
        order by a.attnum`,
    );
    expect(r.rows).toEqual([
      { attname: "cliente_id", tipo: "uuid" },
      { attname: "max_correos_por_revision", tipo: "smallint" },
      { attname: "ventana_dias", tipo: "smallint" },
      { attname: "guardar_adjuntos", tipo: "boolean" },
      { attname: "preparar_borradores", tipo: "boolean" },
      { attname: "descargar_facturas_por_enlace", tipo: "boolean" },
      { attname: "actualizado_en", tipo: "timestamp with time zone" },
    ]);
  });

  it("ninguna columna de token o código en claro: solo las tres *_hmac y catalogo_problemas.codigo", async () => {
    await aplicarHastaM03(db);
    const r = await db.query<{ col: string }>(
      `select c.relname || '.' || a.attname as col
        from pg_attribute a join pg_class c on c.oid = a.attrelid
        where c.relnamespace in ('public'::regnamespace, 'privado'::regnamespace)
          and a.attnum > 0 and not a.attisdropped and c.relkind in ('r', 'p', 'v', 'm', 'f')
          and a.attname ~ '(token|codigo|secret|clave|password|contrasena)'
        order by 1`,
    );
    expect(r.rows.map((x) => x.col)).toEqual([
      "catalogo_problemas.codigo",
      "codigos_activacion.codigo_hmac",
      "codigos_autorizacion.codigo_hmac",
      "tokens.token_hmac",
    ]);
  });
});

describe("REQ-026, REQ-049, CA-021: una licencia no revocada y una fila de ajustes", () => {
  it("se rechaza la segunda licencia no revocada del mismo cliente (activa o suspendida)", async () => {
    await aplicarHastaM03(db);
    await datosBase(db);
    for (const estado of ["activa", "suspendida"]) {
      const mensaje = await probarFila(db, "licencias", { cliente_id: CA, estado });
      expect(mensaje, estado).toMatch(/licencias_una_vigente_por_cliente/);
    }
    expect(
      await valor(db, `select count(*)::int from public.licencias where cliente_id = '${CA}'`),
    ).toBe(1);
  });

  it("con la licencia revocada, se admite otra; y varias revocadas conviven", async () => {
    await aplicarHastaM03(db);
    await datosBase(db);
    await db.exec(`update public.licencias set estado = 'revocada' where id = '${LA}'`);
    await db.exec(`insert into public.licencias (cliente_id, estado) values ('${CA}', 'revocada')`);
    expect(await probarFila(db, "licencias", { cliente_id: CA })).toBeNull();
  });

  it("devolver a no revocada una segunda licencia también se rechaza", async () => {
    await aplicarHastaM03(db);
    await datosBase(db);
    await db.exec(`insert into public.licencias (cliente_id, estado) values ('${CA}', 'revocada')`);
    const mensaje = await errorDe(() =>
      db.exec(
        `update public.licencias set estado = 'activa' where cliente_id = '${CA}' and id <> '${LA}'`,
      ),
    );
    expect(mensaje).toMatch(/licencias_una_vigente_por_cliente/);
  });

  it("ajustes_globales: la primera fila entra, la segunda y la de id falso se rechazan", async () => {
    await aplicarHastaM03(db);
    expect(
      await errorDe(() => db.exec("insert into public.ajustes_globales default values")),
    ).toBeNull();
    expect(
      await errorDe(() => db.exec("insert into public.ajustes_globales default values")),
    ).toMatch(/duplicate key/);
    expect(
      await errorDe(() => db.exec("insert into public.ajustes_globales (id) values (false)")),
    ).toMatch(/violates check constraint/);
    expect(await valor(db, "select count(*)::int from public.ajustes_globales")).toBe(1);
  });

  it("rangos con check de clientes y reglas_cliente", async () => {
    await aplicarHastaM03(db);
    await datosBase(db);
    for (const f of [0, 169]) {
      expect(
        await probarFila(db, "clientes", { nombre: "x", frecuencia_esperada_horas: f }),
      ).toMatch(/violates check constraint/);
    }
    for (const [col, v] of [
      ["max_correos_por_revision", 0],
      ["max_correos_por_revision", 101],
      ["ventana_dias", 0],
      ["ventana_dias", 15],
    ] as const) {
      expect(await probarFila(db, "reglas_cliente", { cliente_id: CA, [col]: v }), col).toMatch(
        /violates check constraint/,
      );
    }
    expect(await probarFila(db, "reglas_cliente", { cliente_id: CA })).toBeNull();
  });
});

describe("REQ-029 (local): ciclo, guarda y todo o nada", () => {
  it("ciclo de M02: el catálogo tras revertir es el de antes y el reaplicado, el primero", async () => {
    await aplicar(db, M01());
    const c = await ciclo(db, M02());
    expect(c.trasRevertir).toEqual(c.antes);
    expect(c.trasReaplicar).toEqual(c.trasAplicar);
    expect(c.trasAplicar).not.toEqual(c.antes);
  });

  it("ciclo de M03: el catálogo tras revertir es el de antes y el reaplicado, el primero", async () => {
    await aplicar(db, M01());
    await aplicar(db, M02());
    const c = await ciclo(db, M03());
    expect(c.trasRevertir).toEqual(c.antes);
    expect(c.trasReaplicar).toEqual(c.trasAplicar);
    expect(c.trasAplicar).not.toEqual(c.antes);
  });

  it("revertir M03 y M02 y luego M01 deja la base como recién creada", async () => {
    const vacia = await instantanea(db);
    await aplicarHastaM03(db);
    await revertir(db, M03());
    await revertir(db, M02());
    await revertir(db, M01());
    expect(await instantanea(db)).toEqual(vacia);
  });

  it("revertir M02 con M03 aplicada falla y no cambia nada", async () => {
    await aplicarHastaM03(db);
    const antes = await instantanea(db);
    expect(await errorDe(() => revertir(db, M02()))).not.toBeNull();
    expect(await instantanea(db)).toEqual(antes);
  });

  it("revertir M02 con un objeto que usa uno de sus tipos falla y no cambia nada", async () => {
    await aplicar(db, M01());
    await aplicar(db, M02());
    await db.exec("create table public.dependiente (e public.estado_informe)");
    const antes = await instantanea(db);
    expect(await errorDe(() => ejecutarEnAutocommit(db, leerReversion(M02())))).not.toBeNull();
    expect(await instantanea(db)).toEqual(antes);
  });

  it("M02 sin M01 falla y no deja nada", async () => {
    const antes = await instantanea(db);
    expect(await errorDe(() => aplicar(db, M02()))).toMatch(/role "conector" does not exist/);
    expect(await instantanea(db)).toEqual(antes);
  });

  for (const [nombre, m] of [
    ["M02", M02],
    ["M03", M03],
  ] as const) {
    it(`${nombre} y su reversión son dos sentencias: la guarda y un único bloque do`, () => {
      for (const sql of [leerMigracion(m()), leerReversion(m())]) {
        expect(dividirSentencias(sql)).toHaveLength(2);
      }
    });

    it(`${nombre} con otro rol (también en autocommit) falla con la guarda y no deja nada`, async () => {
      await aplicar(db, M01());
      if (nombre === "M03") await aplicar(db, M02());
      await db.exec("create role impostor_super superuser nologin");
      const antes = await instantanea(db);
      await db.exec("set role impostor_super");
      try {
        expect(await errorDe(() => aplicar(db, m()))).toContain("migracion_rol_no_permitido");
        expect(await errorDe(() => ejecutarEnAutocommit(db, leerMigracion(m())))).toContain(
          "migracion_rol_no_permitido",
        );
      } finally {
        await db.exec("reset role");
      }
      expect(await instantanea(db)).toEqual(antes);
    });

    it(`la reversión de ${nombre} con otro rol falla y no cambia nada`, async () => {
      await aplicarHastaM03(db);
      if (nombre === "M02") await revertir(db, M03());
      await db.exec("create role impostor_super superuser nologin");
      const antes = await instantanea(db);
      await db.exec("set role impostor_super");
      try {
        expect(await errorDe(() => ejecutarEnAutocommit(db, leerReversion(m())))).toContain(
          "migracion_rol_no_permitido",
        );
      } finally {
        await db.exec("reset role");
      }
      expect(await instantanea(db)).toEqual(antes);
    });
  }

  it("aplicar M02 y M03 en autocommit da el mismo catálogo que en bloque", async () => {
    const otra = await crearBase();
    let esperado: unknown;
    try {
      await aplicarHastaM03(otra);
      esperado = await instantanea(otra);
    } finally {
      await otra.close();
    }
    await aplicar(db, M01());
    await ejecutarEnAutocommit(db, leerMigracion(M02()));
    await ejecutarEnAutocommit(db, leerMigracion(M03()));
    expect(await instantanea(db)).toEqual(esperado);
  });
});

describe("P6: concesiones por defecto de postgres a un rol que no es de los cinco", () => {
  it("con todo concedido por defecto a conector_prueba, las tablas nacen sin su permiso", async () => {
    await db.exec(
      "alter default privileges for role postgres grant all on tables to conector_prueba",
    );
    await aplicarHastaM03(db);
    const r = await db.query(
      `select c.relname from pg_class c cross join lateral aclexplode(c.relacl) a
        where c.relnamespace = 'public'::regnamespace and a.grantee <> c.relowner`,
    );
    expect(r.rows).toEqual([]);
  });

  it("con usage por defecto en tipos para conector_prueba, los tipos nacen sin su permiso", async () => {
    await db.exec(
      "alter default privileges for role postgres grant usage on types to conector_prueba",
    );
    await aplicarHastaM03(db);
    const r = await db.query(
      `select t.typname from pg_type t cross join lateral aclexplode(t.typacl) a
        where t.typnamespace = 'public'::regnamespace and t.typname = any ($1::text[])
          and a.grantee <> t.typowner`,
      [Object.keys(TIPOS)],
    );
    expect(r.rows).toEqual([]);
  });
});

describe("M-1 del auditor: los 17 tipos sin USAGE para nadie más que su dueño", () => {
  it("has_type_privilege(USAGE) es falso para los cinco roles en los 17 tipos (y sus listas)", async () => {
    await aplicarHastaM03(db);
    const r = await db.query(
      `select r.rol, t.tipo
        from unnest($1::text[]) r (rol), unnest($2::text[]) t (tipo)
        where has_type_privilege(r.rol, t.tipo, 'USAGE')`,
      [ROLES_SIN_PERMISOS, Object.keys(TIPOS).flatMap((t) => [`public.${t}`, `public.${t}[]`])],
    );
    expect(r.rows).toEqual([]);
  });

  it("la lista de permisos de cada tipo solo tiene a su dueño (postgres)", async () => {
    await aplicarHastaM03(db);
    const r = await db.query<{ typname: string; acl: string | null; ajenos: number }>(
      `select t.typname, t.typacl::text as acl,
          (select count(*)::int from aclexplode(t.typacl) a where a.grantee <> t.typowner) as ajenos
        from pg_type t where t.typnamespace = 'public'::regnamespace and t.typname = any ($1::text[])
        order by 1`,
      [Object.keys(TIPOS)],
    );
    expect(r.rows).toHaveLength(17);
    for (const fila of r.rows) {
      // Nulo sería el valor de serie: USAGE para PUBLIC.
      expect(fila.acl, fila.typname).not.toBeNull();
      expect(fila.ajenos, fila.typname).toBe(0);
    }
  });

  it("como conector, una tabla temporal con public.estado_cliente da permiso denegado", async () => {
    await aplicarHastaM03(db);
    const mensaje = await como(db, "conector", null, () =>
      errorDe(() => db.exec("create temp table t_tipo (e public.estado_cliente)")),
    );
    expect(mensaje).toMatch(/permission denied for type estado_cliente/);
  });
});

describe("M-3: rama migracion_concesiones_ajenas (disparador de eventos ajeno)", () => {
  // Disparador de eventos que, tras cada CREATE TABLE en public, da a un rol
  // ajeno SELECT sobre la primera columna. El rol no figura en ninguna lista
  // por tabla (no es conector_prueba, que tiene SELECT por defecto y cuyo
  // revoke por tabla también quitaría la columna), así que nada lo retira y
  // solo la comprobación final lo detecta.
  async function disparadorPorColumna(base: Base): Promise<void> {
    await base.exec(`
      create role ajeno_columna nologin;
      create function public.conceder_columna() returns event_trigger
      language plpgsql as $f$
      declare o record; v_col name;
      begin
        for o in select * from pg_event_trigger_ddl_commands()
                  where command_tag = 'CREATE TABLE' and schema_name = 'public' loop
          select attname into v_col from pg_attribute where attrelid = o.objid and attnum = 1;
          execute format('grant select (%I) on %s to ajeno_columna', v_col, o.object_identity);
        end loop;
      end $f$;
      create event trigger conceder_columna on ddl_command_end
        when tag in ('CREATE TABLE') execute function public.conceder_columna();
    `);
  }

  it("M02 falla con migracion_concesiones_ajenas y no deja nada", async () => {
    await aplicar(db, M01());
    await disparadorPorColumna(db);
    const antes = await instantanea(db);
    expect(await errorDe(() => aplicar(db, M02()))).toContain("migracion_concesiones_ajenas");
    expect(await instantanea(db)).toEqual(antes);
  });

  it("M03 falla con migracion_concesiones_ajenas y no deja nada", async () => {
    await aplicar(db, M01());
    await aplicar(db, M02());
    await disparadorPorColumna(db);
    const antes = await instantanea(db);
    expect(await errorDe(() => aplicar(db, M03()))).toContain("migracion_concesiones_ajenas");
    expect(await instantanea(db)).toEqual(antes);
  });

  it("M02 falla si tras cada REVOKE alguien vuelve a dar USAGE en un tipo, y no deja nada", async () => {
    await aplicar(db, M01());
    await db.exec(`
      create function public.reconceder_tipo() returns event_trigger
      language plpgsql as $f$
      begin
        if to_regtype('public.estado_cliente') is not null then
          grant usage on type public.estado_cliente to conector_prueba;
        end if;
      end $f$;
      create event trigger reconceder_tipo on ddl_command_end
        when tag in ('REVOKE') execute function public.reconceder_tipo();
    `);
    const antes = await instantanea(db);
    expect(await errorDe(() => aplicar(db, M02()))).toContain("migracion_concesiones_ajenas");
    expect(await instantanea(db)).toEqual(antes);
  });
});

describe("search_path fijado dentro de cada do", () => {
  const RUTA = "public, extensions";

  it("tras M02 y M03 dentro de una transacción, la ruta sigue siendo la de antes", async () => {
    await aplicar(db, M01());
    await db.exec(`begin; set local search_path = ${RUTA}`);
    try {
      await db.exec(leerMigracion(M02()));
      await db.exec(leerMigracion(M03()));
      expect(await valor(db, "select pg_catalog.current_setting('search_path')")).toBe(RUTA);
      await db.exec(leerReversion(M03()));
      await db.exec(leerReversion(M02()));
      expect(await valor(db, "select pg_catalog.current_setting('search_path')")).toBe(RUTA);
    } finally {
      await db.exec("rollback");
    }
  });

  it("con search_path = public, pg_catalog, un ~ y un tipo text ajenos en public no se usan", async () => {
    await aplicar(db, M01());
    // Veneno creado como postgres, con su función fuera de public.
    await db.exec(`
      create schema envenenado;
      create function envenenado.coincide_siempre(text, text) returns boolean
        language sql immutable as 'select true';
      create operator public.~ (leftarg = text, rightarg = text, function = envenenado.coincide_siempre);
      create domain public.text as pg_catalog.text;
      set search_path = public, pg_catalog;
    `);
    try {
      expect(await errorDe(() => aplicar(db, M02()))).toBeNull();
      expect(await errorDe(() => aplicar(db, M03()))).toBeNull();
    } finally {
      await db.exec("reset search_path");
    }
    expect(
      await valor(
        db,
        // Solo dependencias de columnas, restricciones y valores por defecto
        // (las del propio veneno entre sí no cuentan).
        `select count(*)::int from pg_depend d
          where d.classid in ('pg_class'::regclass, 'pg_constraint'::regclass, 'pg_attrdef'::regclass)
            and d.refclassid in ('pg_operator'::regclass, 'pg_type'::regclass, 'pg_proc'::regclass)
            and d.refobjid in (
              select o.oid from pg_operator o where o.oprnamespace = 'public'::regnamespace
              union all select t.oid from pg_type t where t.typname = 'text'
                and t.typnamespace = 'public'::regnamespace
              union all select p.oid from pg_proc p
                where p.pronamespace = 'envenenado'::regnamespace)`,
      ),
    ).toBe(0);
    expect(
      await valor(
        db,
        `select a.atttypid::regtype::text from pg_attribute a
          where a.attrelid = 'public.tokens'::regclass and a.attname = 'token_hmac'`,
      ),
    ).toBe("text");
    await datosBase(db);
    expect(
      await probarFila(db, "tokens", { ...(VALIDAS.tokens as Fila), token_hmac: "no" }),
    ).toMatch(/violates check constraint/);
  });
});

// D-7 (TP), MENOR 2 del auditor en T-002: texto de personas sin controles ni
// marcas bidireccionales, de anchura cero ni etiquetas, en insert y en update.
const TP_RECHAZADOS = [
  0x0001, 0x0009, 0x000a, 0x000d, 0x001f, 0x007f, 0x0085, 0x009f, 0x00a0, 0x00ad, 0x034f, 0x0600,
  0x061c, 0x06dd, 0x115f, 0x1160, 0x17b4, 0x17b5, 0x180b, 0x180c, 0x180d, 0x180e, 0x200b, 0x200e,
  0x200f, 0x2027, 0x2028, 0x202a, 0x202e, 0x202f, 0x205f, 0x2060, 0x2066, 0x2069, 0x206f, 0x2070,
  0x3000, 0x3164, 0xe000, 0xf8ff, 0xfdd0, 0xfdef, 0xfe00, 0xfe0f, 0xfeff, 0xffa0, 0xfff9, 0xfffb,
  0xfffe, 0xffff, 0xe0001, 0xe007f, 0xe0100, 0xe01ef, 0xf0000, 0x10fffe, 0x10ffff, 0x0627, 0x4e2d,
  0x1f600,
];
// Lista blanca (A-12): ASCII imprimible, U+00A1-U+017F salvo U+00AD, y puntuacion habitual.
const TP_ACEPTADOS = [
  "Café Núñez & Cía., S.L.",
  "Ñandú — 2ª «x» “y” ‘z’ … 5 € ¿Qué? ¡Sí!",
  "Łódź Čapek Ő",
];

describe("D-7 (TP): texto de personas en clientes.nombre y catalogo_problemas.descripcion", () => {
  const COLUMNAS: [string, string][] = [
    ["clientes", "nombre"],
    ["catalogo_problemas", "descripcion"],
  ];

  for (const [tabla, columna] of COLUMNAS) {
    it(`${tabla}.${columna}: insert y update rechazan los caracteres de D-7 y aceptan el resto`, async () => {
      await aplicarHastaM03(db);
      const base = VALIDAS[tabla] as Fila;
      for (const c of TP_RECHAZADOS) {
        const hex = `U+${c.toString(16).toUpperCase().padStart(4, "0")}`;
        const car = String.fromCodePoint(c);
        // En medio, sola y al principio.
        for (const t of [`x${car}y`, car, `${car}z`]) {
          expect(await probarFila(db, tabla, { ...base, [columna]: t }), `insert ${hex}`).toMatch(
            /violates check constraint/,
          );
        }
      }
      for (const texto of TP_ACEPTADOS) {
        expect(await probarFila(db, tabla, { ...base, [columna]: texto }), texto).toBeNull();
      }
      // update: sobre una fila existente, en una transacción que se deshace.
      const columnas = Object.keys(base);
      await db.query(
        `insert into public.${tabla} (${columnas.join(", ")}) values (${columnas.map((_, i) => `$${i + 1}`).join(", ")})`,
        Object.values(base),
      );
      const actualizar = async (texto: string): Promise<string | null> => {
        await db.exec("begin");
        try {
          return await errorDe(() =>
            db.query(`update public.${tabla} set ${columna} = $1`, [texto]),
          );
        } finally {
          await db.exec("rollback");
        }
      };
      for (const c of TP_RECHAZADOS) {
        expect(
          await actualizar(`x${String.fromCodePoint(c)}y`),
          `update U+${c.toString(16)}`,
        ).toMatch(/violates check constraint/);
      }
      for (const texto of TP_ACEPTADOS) expect(await actualizar(texto), texto).toBeNull();
    });
  }

  it("M02 falla con migracion_codificacion_no_utf8 si el servidor no usa UTF8, y no deja nada", async () => {
    await aplicar(db, M01());
    const antes = await instantanea(db);
    const otra = leerMigracion(M02()).replace("'UTF8'", "'LATIN1'");
    expect(otra).not.toBe(leerMigracion(M02()));
    expect(await errorDe(() => db.exec(otra))).toContain("migracion_codificacion_no_utf8");
    expect(await instantanea(db)).toEqual(antes);
  });
});
