// Seed, volumen y procedimiento de administradores en PGlite (T-007; D-10 de la 010).
// REQ-003, REQ-025, REQ-032, REQ-058, REQ-060 · CA-002, CA-003, CA-027 (datos), CA-037 (procedimiento).
// Comprueba SQL válido y comportamiento; no sustituye a pgTAP ni a la carga en CI (T-013).
//
// `ejecutarSigueTrasError` imita `psql -f` sin ON_ERROR_STOP: es el peor caso para una guarda,
// porque las sentencias siguen a un error. La transacción única del seed lo cubre.
import { readFileSync } from "node:fs";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { aplicarTodas, crearBase, ejecutarSigueTrasError, valor, type Base } from "./arnes";

vi.setConfig({ testTimeout: 300_000, hookTimeout: 300_000 });

const leer = (ruta: string) => readFileSync(new URL(ruta, import.meta.url), "utf8");
const SEED = () => leer("../../seed.sql");
const VOLUMEN = () => leer("../../datos/volumen.sql");
const PROCEDIMIENTO = () => leer("../../procedimientos/administradores.sql");

const id = (n: string) => `00000000-0000-4000-8000-${n.padStart(12, "0")}`;
const CA = id("a");
const CB = id("b");
const CC = id("c");
const U_A = id("1a");
const U_B = id("1b");
const U_AB = id("1c");
const U_SV = id("1d");
const U_AD1 = id("1e");
const U_AD2 = id("1f");
const U_AD1A = id("20");
const U_AD3 = id("21");

async function fijarEntorno(db: Base, entorno: string | null): Promise<void> {
  if (entorno === null) await db.exec("reset app.entorno");
  else await db.query("select set_config('app.entorno', $1, false)", [entorno]);
}

const cuenta = (db: Base, tabla: string, donde = "true") =>
  valor<number>(db, `select count(*)::int from ${tabla} where ${donde}`);

/** Instala la salida de `psql -v accion=… -v usuario=…`: sustituye las dos interpolaciones. */
function conVariables(sql: string, accion: string, usuario: string): string {
  const lit = (v: string) => `'${v.replace(/'/g, "''")}'`;
  return sql.replace(/:'accion'/g, lit(accion)).replace(/:'usuario'/g, lit(usuario));
}

const TABLAS_CON_CLIENTE: [string, string][] = [
  ["clientes", "id"],
  ["licencias", "cliente_id"],
  ["reglas_cliente", "cliente_id"],
  ["ordenes", "cliente_id"],
  ["suscripciones", "cliente_id"],
  ["ejecuciones", "cliente_id"],
  ["informes", "cliente_id"],
  ["alertas", "cliente_id"],
];

describe("seed: la guarda (D-10, CA-003, N-8)", () => {
  let db: Base;
  beforeAll(async () => {
    db = await crearBase();
    await aplicarTodas(db);
  });
  afterAll(async () => {
    await db.close();
  });

  async function nadaCargado() {
    expect(await cuenta(db, "public.clientes")).toBe(0);
    expect(await cuenta(db, "auth.users")).toBe(0);
    expect(await cuenta(db, "public.administradores")).toBe(0);
    expect(await cuenta(db, "public.versiones_prompt")).toBe(0);
    expect(await cuenta(db, "public.auditoria")).toBe(0);
  }

  it.each([
    ["sin la variable", null],
    ["con produccion", "produccion"],
    ["con la variable vacía", ""],
    ["con un valor desconocido", "pre"],
    ["con mayúsculas (CI)", "CI"],
    ["con un valor parecido (ci )", "ci "],
  ])(
    "%s, el seed falla y no carga nada aunque el cliente siga tras el error",
    async (_t, valorEnv) => {
      await fijarEntorno(db, valorEnv);
      const errores = await ejecutarSigueTrasError(db, SEED());
      expect(errores.some((e) => e.includes("seed_entorno_no_permitido"))).toBe(true);
      await nadaCargado();
    },
  );

  it.each([
    ["sin la variable", null],
    ["con produccion", "produccion"],
  ])("%s, el volumen falla y no carga nada", async (_t, valorEnv) => {
    await fijarEntorno(db, valorEnv);
    const errores = await ejecutarSigueTrasError(db, VOLUMEN());
    expect(errores.some((e) => e.includes("seed_entorno_no_permitido"))).toBe(true);
    await nadaCargado();
  });

  it("con un rol que no es el dueño, falla aunque el entorno sea ci", async () => {
    await fijarEntorno(db, "ci");
    await db.exec("set role authenticated");
    let errores: string[];
    try {
      errores = await ejecutarSigueTrasError(db, SEED());
    } finally {
      await db.exec("reset role");
    }
    expect(errores.some((e) => e.includes("seed_rol_no_permitido"))).toBe(true);
    await nadaCargado();
  });
});

describe("seed: sin la variable, de verdad (NULL real, no cadena vacía)", () => {
  it.each([
    ["el seed", SEED],
    ["el volumen", VOLUMEN],
  ])(
    "en una base nueva, %s falla con seed_entorno_no_permitido y no carga nada",
    async (_t, leerSql) => {
      const db = await crearBase();
      try {
        await aplicarTodas(db);
        // Sin set_config ni reset: la variable no existe en la sesión.
        expect(
          await valor<boolean>(db, "select current_setting('app.entorno', true) is null"),
        ).toBe(true);
        const errores = await ejecutarSigueTrasError(db, leerSql());
        expect(errores.some((e) => e.includes("seed_entorno_no_permitido"))).toBe(true);
        expect(await cuenta(db, "public.clientes")).toBe(0);
        expect(await cuenta(db, "auth.users")).toBe(0);
        expect(await cuenta(db, "public.administradores")).toBe(0);
        expect(await cuenta(db, "public.auditoria")).toBe(0);
      } finally {
        await db.close();
      }
    },
  );
});

describe("seed con `ci`: perfiles, datos y volumen", () => {
  let db: Base;
  beforeAll(async () => {
    db = await crearBase();
    await aplicarTodas(db);
    await fijarEntorno(db, "ci");
  });
  afterAll(async () => {
    await db.close();
  });

  it("carga sin errores (CA-002) con el entorno ci", async () => {
    expect(await ejecutarSigueTrasError(db, SEED())).toEqual([]);
  });

  it("tres clientes ficticios A, B y C, con licencia y conexión (CA-003)", async () => {
    const r = await db.query<{ id: string; nombre: string }>(
      "select id, nombre from public.clientes order by nombre",
    );
    expect(r.rows).toEqual([
      { id: CA, nombre: "Cliente A ficticio" },
      { id: CB, nombre: "Cliente B ficticio" },
      { id: CC, nombre: "Cliente C ficticio" },
    ]);
    expect(await cuenta(db, "public.licencias")).toBe(3);
    expect(await cuenta(db, "public.conexiones")).toBe(3);
  });

  it("un usuario por perfil, todos con correo de example.com y sin más columnas que id y email", async () => {
    const r = await db.query<{ id: string; email: string }>(
      "select id, email from auth.users order by id",
    );
    expect(r.rows.map((f) => f.id)).toEqual(
      [U_A, U_B, U_AB, U_SV, U_AD1, U_AD2, U_AD1A, U_AD3].sort(),
    );
    for (const f of r.rows) expect(f.email).toMatch(/^[a-z0-9-]+@example\.com$/);
    const columnas = await db.query<{ column_name: string }>(
      "select column_name from information_schema.columns where table_schema = 'auth' and table_name = 'users'",
    );
    expect(columnas.rows.map((c) => c.column_name).sort()).toEqual(["email", "id"]);
  });

  it("vínculos: UA a A, UB a B, UAB a A y B (no a C), AD1A a A, USV y AD3 a ninguno", async () => {
    const r = await db.query<{ usuario_id: string; cliente_id: string }>(
      "select usuario_id, cliente_id from public.usuarios_cliente order by 1, 2",
    );
    const esperado = [
      { usuario_id: U_A, cliente_id: CA },
      { usuario_id: U_B, cliente_id: CB },
      { usuario_id: U_AB, cliente_id: CA },
      { usuario_id: U_AB, cliente_id: CB },
      { usuario_id: U_AD1A, cliente_id: CA },
    ].sort((x, y) => (x.usuario_id + x.cliente_id).localeCompare(y.usuario_id + y.cliente_id));
    expect(r.rows).toEqual(esperado);
  });

  it("administradores: AD1, AD2 y AD1A; AD3 existe pero no es administrador (CA-037)", async () => {
    const r = await db.query<{ usuario_id: string }>(
      "select usuario_id from public.administradores order by 1",
    );
    expect(r.rows.map((f) => f.usuario_id)).toEqual([U_AD1, U_AD2, U_AD1A].sort());
  });

  it.each(TABLAS_CON_CLIENTE)("hay filas de A, B y C en %s", async (tabla, columna) => {
    for (const c of [CA, CB, CC]) {
      expect(await cuenta(db, `public.${tabla}`, `${columna} = '${c}'`)).toBeGreaterThanOrEqual(1);
    }
  });

  it("hay filas en las tablas de A, B y C que cuelgan de la licencia, la conexión y la ejecución", async () => {
    expect(await cuenta(db, "public.codigos_activacion")).toBe(3);
    expect(await cuenta(db, "public.tokens")).toBe(6);
    expect(await cuenta(db, "public.codigos_autorizacion")).toBe(3);
    expect(await cuenta(db, "public.clientes_oauth")).toBe(1);
    expect(await cuenta(db, "public.eventos_stripe")).toBe(2);
    expect(await cuenta(db, "public.versiones_prompt")).toBe(1);
    expect(await cuenta(db, "public.publicaciones")).toBe(1);
  });

  it("los HMAC son ficticios (letra repetida) y de 64 hexadecimales", async () => {
    const r = await db.query<{ t: string }>(
      `select token_hmac as t from public.tokens union all
       select codigo_hmac from public.codigos_activacion union all
       select codigo_hmac from public.codigos_autorizacion`,
    );
    expect(r.rows.length).toBe(12);
    for (const { t } of r.rows) expect(t).toMatch(/^[0-9a-f]{64}$/);
    // Los tokens de acceso de cada cliente son a, b y c × 64.
    const acceso = await db.query<{ t: string }>(
      "select token_hmac as t from public.tokens where tipo = 'acceso' order by 1",
    );
    expect(acceso.rows.map((f) => f.t)).toEqual(["a".repeat(64), "b".repeat(64), "c".repeat(64)]);
  });

  it("la huella de la versión del prompt la calcula SQL y coincide con el contenido", async () => {
    const ok = await valor<boolean>(
      db,
      `select huella_sha256 = encode(sha256(convert_to(contenido, 'UTF8')), 'hex')
         from public.versiones_prompt`,
    );
    expect(ok).toBe(true);
  });

  it("no repite lo que trae M10: una fila de ajustes y doce códigos", async () => {
    expect(await cuenta(db, "public.ajustes_globales")).toBe(1);
    expect(await cuenta(db, "public.catalogo_problemas")).toBe(12);
  });

  it("el seed solo deja auditoría de los administradores (3) y de la versión del prompt (1)", async () => {
    const r = await db.query<{ objeto_tipo: string; accion: string; n: number }>(
      `select objeto_tipo, accion, count(*)::int as n from public.auditoria
        group by 1, 2 order by 1, 2`,
    );
    expect(r.rows).toEqual([
      { objeto_tipo: "administradores", accion: "insert", n: 3 },
      { objeto_tipo: "versiones_prompt", accion: "insert", n: 1 },
    ]);
  });

  it("los datos no traen texto de correo: las columnas de texto son las de D-7", async () => {
    const nombres = await db.query<{ nombre: string }>("select nombre from public.clientes");
    for (const { nombre } of nombres.rows) expect(nombre).toMatch(/^Cliente [ABC] ficticio$/);
  });

  it("cargar el seed dos veces falla y no cambia nada", async () => {
    const antes = await cuenta(db, "public.auditoria");
    const errores = await ejecutarSigueTrasError(db, SEED());
    expect(errores.length).toBeGreaterThan(0);
    expect(await cuenta(db, "public.clientes")).toBe(3);
    expect(await cuenta(db, "public.auditoria")).toBe(antes);
  });

  it("el volumen carga sin errores: 10 clientes con licencia, conexión y 365 informes cada uno (CA-027)", async () => {
    expect(await ejecutarSigueTrasError(db, VOLUMEN())).toEqual([]);
    const donde = "nombre like 'Cliente de volumen %'";
    expect(await cuenta(db, "public.clientes", donde)).toBe(10);
    const r = await db.query<{
      n_licencias: number;
      n_conexiones: number;
      n_ejec: number;
      n_inf: number;
    }>(
      `select (select count(*) from public.licencias l where l.cliente_id = c.id)::int as n_licencias,
              (select count(*) from public.conexiones x join public.licencias l on l.id = x.licencia_id
                where l.cliente_id = c.id)::int as n_conexiones,
              (select count(*) from public.ejecuciones e where e.cliente_id = c.id)::int as n_ejec,
              (select count(*) from public.informes i where i.cliente_id = c.id)::int as n_inf
         from public.clientes c where c.${donde}`,
    );
    expect(r.rows.length).toBe(10);
    for (const f of r.rows) {
      expect(f).toEqual({ n_licencias: 1, n_conexiones: 1, n_ejec: 365, n_inf: 365 });
    }
    // Un informe por día y por cliente: 365 días distintos.
    const dias = await valor<number>(
      db,
      `select count(distinct (i.cliente_id, i.recibido_en::date))::int from public.informes i
         join public.clientes c on c.id = i.cliente_id where c.${donde}`,
    );
    expect(dias).toBe(3650);
  });

  it("el volumen no toca las filas del seed y no deja auditoría", async () => {
    expect(await cuenta(db, "public.clientes")).toBe(13);
    expect(await cuenta(db, "public.licencias")).toBe(13);
    expect(await cuenta(db, "public.auditoria")).toBe(4);
    for (const c of [CA, CB, CC]) {
      expect(await cuenta(db, "public.informes", `cliente_id = '${c}'`)).toBe(1);
    }
  });

  it("los informes del volumen cumplen el contrato: solo cifras acotadas y códigos del catálogo", async () => {
    const r = await db.query<{ n: number }>(
      `select count(*)::int as n from public.informes
        where problemas <> '{}' and not problemas <@ (select array_agg(codigo) from public.catalogo_problemas)`,
    );
    expect(r.rows[0]?.n).toBe(0);
  });

  it("segunda carga del volumen: falla y no cambia nada", async () => {
    const errores = await ejecutarSigueTrasError(db, VOLUMEN());
    expect(errores.length).toBeGreaterThan(0);
    expect(await cuenta(db, "public.clientes")).toBe(13);
    expect(await cuenta(db, "public.informes")).toBe(3 + 3650);
  });
});

describe("seed con `desarrollo`", () => {
  it("carga sin errores", async () => {
    const db = await crearBase();
    try {
      await aplicarTodas(db);
      await fijarEntorno(db, "desarrollo");
      expect(await ejecutarSigueTrasError(db, SEED())).toEqual([]);
      expect(await cuenta(db, "public.clientes")).toBe(3);
    } finally {
      await db.close();
    }
  });
});

describe("procedimiento de administradores (REQ-060, CA-037)", () => {
  let db: Base;
  beforeAll(async () => {
    db = await crearBase();
    await aplicarTodas(db);
    await fijarEntorno(db, "ci");
    expect(await ejecutarSigueTrasError(db, SEED())).toEqual([]);
  });
  afterAll(async () => {
    await db.close();
  });

  const ejecutar = (accion: string, usuario: string) =>
    ejecutarSigueTrasError(db, conVariables(PROCEDIMIENTO(), accion, usuario));
  const filasAuditoria = (accion: string, usuario: string) =>
    cuenta(
      db,
      "public.auditoria",
      `objeto_tipo = 'administradores' and accion = '${accion}' and objeto_id = '${usuario}'`,
    );

  it("el archivo solo tiene las dos interpolaciones de psql y todas se sustituyen", () => {
    const sql = conVariables(PROCEDIMIENTO(), "alta", U_AD3);
    expect(sql).not.toMatch(/:'\w+'/);
  });

  it("si la auditoría no se registra, el alta falla con procedimiento_auditoria_no_registrada y no cambia nada", async () => {
    const antes = await cuenta(db, "public.auditoria");
    const admins = await cuenta(db, "public.administradores");
    await db.exec("alter table public.administradores disable trigger administradores_auditar");
    let errores: string[];
    try {
      errores = await ejecutar("alta", U_AD3);
    } finally {
      await db.exec("alter table public.administradores enable trigger administradores_auditar");
    }
    expect(errores.some((e) => e.includes("procedimiento_auditoria_no_registrada"))).toBe(true);
    expect(await cuenta(db, "public.administradores")).toBe(admins);
    expect(await cuenta(db, "public.auditoria")).toBe(antes);
    // El disparador vuelve a estar activo (habilitado de origen, 'O').
    expect(
      await valor<string>(
        db,
        "select tgenabled::text from pg_trigger where tgname = 'administradores_auditar'",
      ),
    ).toBe("O");
  });

  it("da de alta a AD3: una fila de administradores y una fila de auditoría", async () => {
    const antes = await cuenta(db, "public.auditoria");
    expect(await ejecutar("alta", U_AD3)).toEqual([]);
    expect(await cuenta(db, "public.administradores", `usuario_id = '${U_AD3}'`)).toBe(1);
    expect(await cuenta(db, "public.auditoria")).toBe(antes + 1);
    expect(await filasAuditoria("insert", U_AD3)).toBe(1);
  });

  it("repetir el alta falla y no deja otra fila de auditoría", async () => {
    const antes = await cuenta(db, "public.auditoria");
    const errores = await ejecutar("alta", U_AD3);
    expect(errores.length).toBeGreaterThan(0);
    expect(await cuenta(db, "public.administradores")).toBe(4);
    expect(await cuenta(db, "public.auditoria")).toBe(antes);
  });

  it("da de baja a AD3: la fila desaparece y queda una fila de auditoría", async () => {
    const antes = await cuenta(db, "public.auditoria");
    expect(await ejecutar("baja", U_AD3)).toEqual([]);
    expect(await cuenta(db, "public.administradores", `usuario_id = '${U_AD3}'`)).toBe(0);
    expect(await cuenta(db, "public.auditoria")).toBe(antes + 1);
    expect(await filasAuditoria("delete", U_AD3)).toBe(1);
  });

  it("la baja de quien no es administrador falla y no cambia nada", async () => {
    const antes = await cuenta(db, "public.auditoria");
    const errores = await ejecutar("baja", U_AD3);
    expect(errores.some((e) => e.includes("procedimiento_administrador_inexistente"))).toBe(true);
    expect(await cuenta(db, "public.auditoria")).toBe(antes);
  });

  it("el alta de un usuario que no existe en auth.users falla", async () => {
    const errores = await ejecutar("alta", id("dead"));
    expect(errores.length).toBeGreaterThan(0);
    expect(await cuenta(db, "public.administradores")).toBe(3);
  });

  it("una acción desconocida, o un usuario que no es un uuid, falla y no cambia nada", async () => {
    const antes = await cuenta(db, "public.auditoria");
    const e1 = await ejecutar("borrar", U_AD3);
    expect(e1.some((e) => e.includes("procedimiento_accion_desconocida"))).toBe(true);
    const e2 = await ejecutar("alta", "no-es-un-uuid");
    expect(e2.length).toBeGreaterThan(0);
    const e3 = await ejecutar("alta'; delete from public.administradores; --", U_AD3);
    expect(e3.some((e) => e.includes("procedimiento_accion_desconocida"))).toBe(true);
    expect(await cuenta(db, "public.administradores")).toBe(3);
    expect(await cuenta(db, "public.auditoria")).toBe(antes);
  });

  it("con un rol que no es el dueño falla (REQ-063: ningún perfil de la API lo usa)", async () => {
    await db.exec("set role authenticated");
    let errores: string[];
    try {
      errores = await ejecutar("alta", U_AD3);
    } finally {
      await db.exec("reset role");
    }
    expect(errores.some((e) => e.includes("procedimiento_rol_no_permitido"))).toBe(true);
    expect(await cuenta(db, "public.administradores")).toBe(3);
  });

  it("no deja retirar al último administrador (cierre en fallo)", async () => {
    expect(await ejecutar("baja", U_AD1)).toEqual([]);
    expect(await ejecutar("baja", U_AD2)).toEqual([]);
    const errores = await ejecutar("baja", U_AD1A);
    expect(errores.some((e) => e.includes("procedimiento_ultimo_administrador"))).toBe(true);
    expect(await cuenta(db, "public.administradores")).toBe(1);
  });
});
