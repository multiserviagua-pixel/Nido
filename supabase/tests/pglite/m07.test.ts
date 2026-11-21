// M07 `reglas_de_acceso` en PGlite (T-005; D-2 4, 9 a 12 y 17; D-3; D-5; D-6).
// REQ-005, REQ-006, REQ-007, REQ-010, REQ-019, REQ-034, REQ-035 a REQ-041, REQ-047,
// REQ-052, REQ-057 a REQ-060, REQ-062 a REQ-064 · CA-005, CA-006, CA-015, CA-029,
// CA-030, CA-035 a CA-037, CA-039.
// Comprueba SQL válido y comportamiento; no sustituye a pgTAP (CI, T-013).
//
// Perfiles de la especificación: SS (anon), UA, UB, UAB, USV (sin vínculo), AD1
// (administrador sin doble factor), AD2 (con doble factor), CON (conector) y SR
// (service_role). El «doble factor» llega en la claim `aal` de la sesión.
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

vi.setConfig({ testTimeout: 120_000, hookTimeout: 120_000 });

const M01 = () => nombreDe("privado_rol_y_permisos");
const M02 = () => nombreDe("clientes_y_acceso");
const M03 = () => nombreDe("internas_autorizacion_y_cobro");
const M04 = () => nombreDe("auditoria");
const M05 = () => nombreDe("versiones_prompt");
const M06 = () => nombreDe("ejecuciones_informes_alertas");
const M07 = () => nombreDe("reglas_de_acceso");

const id = (n: string) => `00000000-0000-4000-8000-${n.padStart(12, "0")}`;
const CA = id("a");
const CB = id("b");
const CC = id("c");
const LA = id("a1");
const LB = id("b1");
const LC = id("c1");
const XA = id("a2");
const XA2 = id("a21");
const XA3 = id("a22");
const XB = id("b2");
const XC = id("c2");
const KA = id("a3");
const KB = id("b3");
const KC = id("c3");
const OA = id("a4");
const OB = id("b4");
const OC = id("c4");
const EA = id("a5");
const EB = id("b5");
const EC = id("c5");
const AA = id("a6");
const AB = id("b6");
const AC = id("c6");
const VP = id("f1");
const U_A = id("1a");
const U_B = id("1b");
const U_AB = id("1c");
const U_SV = id("1d");
const U_AD1 = id("1e");
const U_AD2 = id("1f");

const CLIENTES = [
  { c: CA, l: LA, x: XA },
  { c: CB, l: LB, x: XB },
  { c: CC, l: LC, x: XC },
];

// Las 17 tablas con permisos para la API (D-5) y las 4 internas (REQ-008).
const TABLAS = [
  "administradores",
  "ajustes_globales",
  "alertas",
  "auditoria",
  "catalogo_problemas",
  "clientes",
  "codigos_activacion",
  "conexiones",
  "ejecuciones",
  "informes",
  "licencias",
  "ordenes",
  "publicaciones",
  "reglas_cliente",
  "suscripciones",
  "usuarios_cliente",
  "versiones_prompt",
];
const INTERNAS = ["clientes_oauth", "codigos_autorizacion", "eventos_stripe", "tokens"];

let db: Base;
beforeEach(async () => {
  db = await crearBase();
});
afterEach(async () => {
  await db.close();
});

async function hastaM06(base: Base): Promise<void> {
  for (const m of [M01, M02, M03, M04, M05, M06]) await aplicar(base, m());
}
async function hastaM07(base: Base): Promise<void> {
  await hastaM06(base);
  await aplicar(base, M07());
}

/** Tres clientes con todo, administradores, vínculos y una versión publicada. */
const SEMILLA = `
  insert into auth.users (id, email) values
    ('${U_A}', 'ua@example.com'), ('${U_B}', 'ub@example.com'), ('${U_AB}', 'uab@example.com'),
    ('${U_SV}', 'usv@example.com'), ('${U_AD1}', 'ad1@example.com'), ('${U_AD2}', 'ad2@example.com');
  insert into public.clientes (id, nombre) values
    ('${CA}', 'Cliente A ficticio'), ('${CB}', 'Cliente B ficticio'), ('${CC}', 'Cliente C ficticio');
  insert into public.usuarios_cliente (usuario_id, cliente_id) values
    ('${U_A}', '${CA}'), ('${U_B}', '${CB}'), ('${U_AB}', '${CA}'), ('${U_AB}', '${CB}');
  insert into public.administradores (usuario_id) values ('${U_AD1}'), ('${U_AD2}');
  insert into public.licencias (id, cliente_id) values
    ('${LA}', '${CA}'), ('${LB}', '${CB}'), ('${LC}', '${CC}');
  insert into public.codigos_activacion (id, licencia_id, codigo_hmac, caduca_en) values
    ('${KA}', '${LA}', repeat('a', 64), now() + interval '1 day'),
    ('${KB}', '${LB}', repeat('b', 64), now() + interval '1 day'),
    ('${KC}', '${LC}', repeat('c', 64), now() + interval '1 day');
  insert into public.conexiones (id, licencia_id) values
    ('${XA}', '${LA}'), ('${XA2}', '${LA}'), ('${XB}', '${LB}'), ('${XC}', '${LC}');
  insert into public.conexiones (id, licencia_id, revocada_en) values
    ('${XA3}', '${LA}', now() - interval '1 day');
  insert into public.reglas_cliente (cliente_id) values ('${CA}'), ('${CB}'), ('${CC}');
  insert into public.ordenes (id, cliente_id, tipo) values
    ('${OA}', '${CA}', 'pausar'), ('${OB}', '${CB}', 'pausar'), ('${OC}', '${CC}', 'pausar');
  insert into public.ejecuciones (id, conexion_id, cliente_id, estado_servido) values
    ('${EA}', '${XA}', '${CA}', 'activa'), ('${EB}', '${XB}', '${CB}', 'activa'),
    ('${EC}', '${XC}', '${CC}', 'activa');
  insert into public.informes (ejecucion_id, cliente_id, estado, modo, asistente, almacenamiento,
      version_prompt, frecuencia_horas, tratados, sin_tratar, borradores, documentos,
      facturas_pendientes, urgentes, comp_correo, comp_almacenamiento, comp_contexto, comp_registro)
    select e.id, e.cliente_id, 'ok', 'desatendido', 'claude', 'drive', '1.0.0', 24, 1, 1, 1, 1, 0, 0,
           true, true, true, true
      from public.ejecuciones e;
  insert into public.alertas (id, cliente_id, tipo) values
    ('${AA}', '${CA}', 'sin_senal'), ('${AB}', '${CB}', 'sin_senal'), ('${AC}', '${CC}', 'sin_senal');
  insert into public.suscripciones (cliente_id, stripe_customer_id) values
    ('${CA}', 'cus_ficticioA'), ('${CB}', 'cus_ficticioB'), ('${CC}', 'cus_ficticioC');
  insert into public.ajustes_globales default values;
  insert into public.catalogo_problemas (codigo, descripcion) values
    ('sin_acceso_correo', 'Descripción ficticia'), ('sin_contexto', 'Descripción ficticia');
  insert into public.versiones_prompt (id, version, contenido, huella_sha256, commit_sha)
    values ('${VP}', '1.0.0', 'Texto ficticio',
            encode(sha256(convert_to('Texto ficticio', 'UTF8')), 'hex'), 'abcdef1');
  insert into public.publicaciones (canal, version_id) values ('estable', '${VP}');
`;

async function conSemilla(): Promise<void> {
  await hastaM07(db);
  await db.exec(SEMILLA);
}

// ---------------------------------------------------------------------------
// Perfiles y ayudas
// ---------------------------------------------------------------------------
type Claims = Record<string, unknown> | null;
interface Perfil {
  rol: string;
  claims: Claims;
}
const ses = (sub: string, extra: Record<string, unknown> = {}): Claims => ({
  sub,
  role: "authenticated",
  aal: "aal1",
  ...extra,
});
const UA: Perfil = { rol: "authenticated", claims: ses(U_A) };
const UB: Perfil = { rol: "authenticated", claims: ses(U_B) };
const UAB: Perfil = { rol: "authenticated", claims: ses(U_AB) };
const USV: Perfil = { rol: "authenticated", claims: ses(U_SV) };
const AD1: Perfil = { rol: "authenticated", claims: ses(U_AD1) };
const AD2: Perfil = { rol: "authenticated", claims: ses(U_AD2, { aal: "aal2" }) };
const SS: Perfil = { rol: "anon", claims: { role: "anon" } };
const SR: Perfil = { rol: "service_role", claims: { role: "service_role" } };
const CON: Perfil = { rol: "conector", claims: null };

// REQ-040: ningún dato ausente o inesperado amplía el acceso.
const AAL_MALOS: [string, Claims][] = [
  ["aal ausente", { sub: U_AD2, role: "authenticated" }],
  ["aal numérico 2", { sub: U_AD2, role: "authenticated", aal: 2 }],
  ["aal numérico 1", { sub: U_AD2, role: "authenticated", aal: 1 }],
  ["aal en mayúsculas", { sub: U_AD2, role: "authenticated", aal: "AAL2" }],
  ["aal con espacio", { sub: U_AD2, role: "authenticated", aal: "aal2 " }],
  ["aal1", { sub: U_AD2, role: "authenticated", aal: "aal1" }],
  ["aal nulo", { sub: U_AD2, role: "authenticated", aal: null }],
  ["aal lista", { sub: U_AD2, role: "authenticated", aal: ["aal2"] }],
  ["aal objeto", { sub: U_AD2, role: "authenticated", aal: { aal: "aal2" } }],
  ["aal booleano", { sub: U_AD2, role: "authenticated", aal: true }],
  ["aal vacío", { sub: U_AD2, role: "authenticated", aal: "" }],
  ["sin sub", { role: "authenticated", aal: "aal2" }],
  ["sub de otro usuario sin fila de administrador", ses(U_SV, { aal: "aal2" })],
];

type Resultado = { filas: number } | { codigo: string };
async function intentar(p: Perfil, sql: string): Promise<Resultado> {
  return como(db, p.rol, p.claims, async () => {
    try {
      const r = await db.query(sql);
      return {
        filas: /^\s*select\b/i.test(sql) ? r.rows.length : (r.affectedRows ?? r.rows.length),
      };
    } catch (e) {
      return { codigo: (e as { code?: string }).code ?? "sin_codigo" };
    }
  });
}
/** Filas que ve el perfil en la tabla (con filtro opcional) o el código del error. */
async function leer(p: Perfil, tabla: string, filtro = ""): Promise<number | string> {
  const r = await intentar(p, `select 1 from public.${tabla} ${filtro}`);
  return "codigo" in r ? r.codigo : r.filas;
}
async function dueno(sql: string): Promise<void> {
  await db.exec(sql);
}
async function contar(tabla: string): Promise<number> {
  return valor<number>(db, `select count(*)::int from public.${tabla}`);
}
/** Cuenta de filas y huella de todas las tablas, como dueño. */
async function firma(): Promise<Record<string, string>> {
  const salida: Record<string, string> = {};
  for (const t of [...TABLAS, ...INTERNAS]) {
    const r = await db.query<{ n: number; h: string }>(
      `select count(*)::int as n,
              coalesce(md5(string_agg(x::text, ',' order by x::text)), '') as h
         from public.${t} x`,
    );
    salida[t] = `${r.rows[0]!.n}:${r.rows[0]!.h}`;
  }
  return salida;
}

// Filas que debe ver cada usuario de cliente con la semilla (REQ-057, CA-035).
const LEE_CLIENTE = new Set([
  "clientes",
  "licencias",
  "ordenes",
  "ejecuciones",
  "informes",
  "suscripciones",
  "catalogo_problemas",
]);
// Columna del cliente en cada tabla, para filtrar expresamente por un cliente.
const FILTRO: Record<string, (c: { c: string; l: string }) => string> = {
  clientes: (k) => `where id = '${k.c}'`,
  usuarios_cliente: (k) => `where cliente_id = '${k.c}'`,
  licencias: (k) => `where cliente_id = '${k.c}'`,
  ordenes: (k) => `where cliente_id = '${k.c}'`,
  ejecuciones: (k) => `where cliente_id = '${k.c}'`,
  informes: (k) => `where cliente_id = '${k.c}'`,
  suscripciones: (k) => `where cliente_id = '${k.c}'`,
  alertas: (k) => `where cliente_id = '${k.c}'`,
  reglas_cliente: (k) => `where cliente_id = '${k.c}'`,
  conexiones: (k) => `where licencia_id = '${k.l}'`,
  codigos_activacion: (k) => `where licencia_id = '${k.l}'`,
};

// ---------------------------------------------------------------------------
// Lectura: matriz de D-6 (CA-005, CA-006, CA-035)
// ---------------------------------------------------------------------------
describe("lectura por perfil (D-6, CA-005, CA-006, CA-035; REQ-005, REQ-035, REQ-038, REQ-039, REQ-052, REQ-057, REQ-058)", () => {
  it("UA lee A y 0 de B, también filtrando por B; UB lo mismo a la inversa", async () => {
    await conSemilla();
    for (const [p, propio, ajeno] of [
      [UA, CLIENTES[0]!, CLIENTES[1]!],
      [UB, CLIENTES[1]!, CLIENTES[0]!],
    ] as const) {
      for (const t of Object.keys(FILTRO)) {
        const enPropio = await leer(p, t, FILTRO[t]!(propio));
        const enAjeno = await leer(p, t, FILTRO[t]!(ajeno));
        const enC = await leer(p, t, FILTRO[t]!(CLIENTES[2]!));
        expect(enAjeno, `${t} filtrando por el otro cliente`).toBe(0);
        expect(enC, `${t} filtrando por C`).toBe(0);
        // CA-035: lee algo solo en la lista cerrada de REQ-057.
        expect(enPropio, `${t} del propio cliente`).toBe(LEE_CLIENTE.has(t) ? 1 : 0);
      }
    }
  });

  it("UA lee exactamente la lista de REQ-057 y 0 en el resto (CA-035, REQ-052)", async () => {
    await conSemilla();
    const leidas: string[] = [];
    for (const t of TABLAS) {
      const n = await leer(UA, t);
      expect(typeof n, `${t}: sin error`).toBe("number");
      if ((n as number) > 0) leidas.push(t);
    }
    expect(leidas).toEqual([...LEE_CLIENTE].sort());
    expect(await leer(UA, "clientes")).toBe(1);
    expect(await leer(UA, "catalogo_problemas")).toBe(2);
  });

  it("UAB lee A y B y 0 de C (REQ-058)", async () => {
    await conSemilla();
    for (const t of [
      "clientes",
      "licencias",
      "ordenes",
      "ejecuciones",
      "informes",
      "suscripciones",
    ]) {
      expect(await leer(UAB, t), t).toBe(2);
      expect(await leer(UAB, t, FILTRO[t]!(CLIENTES[2]!)), `${t} C`).toBe(0);
      expect(await leer(UAB, t, FILTRO[t]!(CLIENTES[0]!)), `${t} A`).toBe(1);
      expect(await leer(UAB, t, FILTRO[t]!(CLIENTES[1]!)), `${t} B`).toBe(1);
    }
  });

  it("USV y AD1 leen 0 en las 17 tablas; las 4 internas dan 42501 (REQ-038, REQ-039)", async () => {
    await conSemilla();
    for (const p of [USV, AD1]) {
      for (const t of TABLAS) expect(await leer(p, t), t).toBe(0);
      for (const t of INTERNAS) expect(await leer(p, t), t).toBe("42501");
    }
  });

  it("AD2 lee todo en las 17 tablas y nada en las internas (T de D-6; REQ-007, REQ-041)", async () => {
    await conSemilla();
    for (const t of TABLAS) expect(await leer(AD2, t), t).toBe(await contar(t));
    expect(await contar("auditoria")).toBeGreaterThan(0);
    for (const t of INTERNAS) expect(await leer(AD2, t), t).toBe("42501");
  });

  it("SS, CON y SR: 42501 en las 21 tablas, salvo SR en versiones_prompt (D-6)", async () => {
    await conSemilla();
    for (const t of [...TABLAS, ...INTERNAS]) {
      expect(await leer(SS, t), `anon ${t}`).toBe("42501");
      expect(await leer(CON, t), `conector ${t}`).toBe("42501");
      expect(await leer(SR, t), `service_role ${t}`).toBe(t === "versiones_prompt" ? 1 : "42501");
    }
  });

  it("AD1 vinculado a A (REQ-039): solo ve lo de A y como usuario de cliente", async () => {
    await conSemilla();
    await dueno(
      `insert into public.usuarios_cliente (usuario_id, cliente_id) values ('${U_AD1}', '${CA}')`,
    );
    expect(await leer(AD1, "clientes")).toBe(1);
    expect(await leer(AD1, "clientes", `where id = '${CB}'`)).toBe(0);
    expect(await leer(AD1, "conexiones")).toBe(0);
    expect(await leer(AD1, "administradores")).toBe(0);
    expect(await leer(AD1, "auditoria")).toBe(0);
  });

  it("el administrador con doble factor, no vinculado, lee A y B (todas las filas)", async () => {
    await conSemilla();
    expect(await leer(AD2, "clientes")).toBe(3);
    expect(await leer(AD2, "conexiones", `where licencia_id = '${LA}'`)).toBe(3);
  });

  it("codigos_activacion: la columna codigo_hmac no se lee con ningún perfil de la API (D-5)", async () => {
    await conSemilla();
    for (const p of [UA, AD2]) {
      expect(await intentar(p, "select codigo_hmac from public.codigos_activacion")).toEqual({
        codigo: "42501",
      });
      expect(await intentar(p, "select * from public.codigos_activacion")).toEqual({
        codigo: "42501",
      });
    }
    const r = await intentar(
      AD2,
      "select id, licencia_id, caduca_en, usado_en, creado_por, creado_en from public.codigos_activacion",
    );
    expect(r).toEqual({ filas: 3 });
  });
});

describe("sesiones anómalas (REQ-006, REQ-040, CA-030)", () => {
  it("con el dato del segundo factor ausente, malformado o de otro tipo se leen 0 filas", async () => {
    await conSemilla();
    for (const [nombre, claims] of AAL_MALOS) {
      const p: Perfil = { rol: "authenticated", claims };
      for (const t of TABLAS) expect(await leer(p, t), `${nombre}: ${t}`).toBe(0);
      expect(await valor(db, "select 1")).toBe(1);
      // Y no escriben nada.
      const antes = await firma();
      for (const sql of [
        "update public.clientes set nombre = 'Cambiado'",
        "update public.ajustes_globales set pausa_global = true",
        "update public.catalogo_problemas set activo = false",
        "update public.alertas set resuelta_en = now()",
        "update public.ordenes set estado = 'anulada'",
        "update public.conexiones set revocada_en = now()",
        "update public.reglas_cliente set ventana_dias = 7",
      ]) {
        expect(await intentar(p, sql), `${nombre}: ${sql}`).toEqual({ filas: 0 });
      }
      for (const sql of [
        "insert into public.clientes (nombre) values ('Intruso')",
        `insert into public.ordenes (cliente_id, tipo) values ('${CA}', 'pausar')`,
        `insert into public.usuarios_cliente (usuario_id, cliente_id) values ('${U_AD2}', '${CA}')`,
      ]) {
        expect(await intentar(p, sql), `${nombre}: ${sql}`).toEqual({ codigo: "42501" });
      }
      expect(await firma(), nombre).toEqual(antes);
    }
  });

  it("con las claims vacías, sin sesión o con un sub que no es un uuid no se lee nada", async () => {
    await conSemilla();
    for (const claims of [null, {}, { role: "authenticated" }, { sub: "", aal: "aal2" }]) {
      const p: Perfil = { rol: "authenticated", claims };
      for (const t of TABLAS) expect(await leer(p, t), `${JSON.stringify(claims)} ${t}`).toBe(0);
    }
    // Un sub que no es un uuid: error o 0 filas, nunca filas.
    const p: Perfil = { rol: "authenticated", claims: { sub: "no-es-uuid", aal: "aal2" } };
    for (const t of TABLAS) {
      const n = await leer(p, t);
      expect(n === 0 || typeof n === "string", `sub no uuid ${t}`).toBe(true);
    }
  });

  it("una sesión de un usuario que ya no existe lee 0 y escribe 0", async () => {
    await conSemilla();
    await dueno(`delete from auth.users where id = '${U_AD2}'`);
    expect(await contar("administradores")).toBe(1);
    for (const t of TABLAS) expect(await leer(AD2, t), t).toBe(0);
    expect(await intentar(AD2, "update public.clientes set nombre = 'X'")).toEqual({ filas: 0 });
    await dueno(`delete from auth.users where id = '${U_A}'`);
    for (const t of TABLAS) expect(await leer(UA, t), t).toBe(0);
  });
});

describe("retirar el vínculo o al administrador (REQ-034, CA-029)", () => {
  it("con la misma sesión, la siguiente consulta lee 0 de lo que antes veía", async () => {
    await conSemilla();
    expect(await leer(UA, "clientes")).toBe(1);
    expect(await leer(AD2, "clientes")).toBe(3);
    await dueno(`delete from public.usuarios_cliente where usuario_id = '${U_A}'`);
    await dueno(`delete from public.administradores where usuario_id = '${U_AD2}'`);
    for (const t of TABLAS) {
      expect(await leer(UA, t), `UA ${t}`).toBe(0);
      expect(await leer(AD2, t), `AD2 ${t}`).toBe(0);
    }
  });

  it("retirar un solo vínculo de UAB deja el otro", async () => {
    await conSemilla();
    await dueno(
      `delete from public.usuarios_cliente where usuario_id = '${U_AB}' and cliente_id = '${CA}'`,
    );
    expect(await leer(UAB, "clientes")).toBe(1);
    expect(await leer(UAB, "clientes", `where id = '${CB}'`)).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// Escritura: lo que no debe poder hacerse no se puede (REQ-005, REQ-036, REQ-041, REQ-062, REQ-063)
// ---------------------------------------------------------------------------
type Esperado = "X" | "0";
/** Intentos de escritura sobre un cliente. X: error 42501; 0: sin error y 0 filas. */
function intentos(k: { c: string; l: string }): [string, Esperado][] {
  return [
    [`update public.clientes set nombre = 'Intruso' where id = '${k.c}'`, "0"],
    ["insert into public.clientes (nombre) values ('Intruso')", "X"],
    [`delete from public.clientes where id = '${k.c}'`, "X"],
    [
      `insert into public.usuarios_cliente (usuario_id, cliente_id) values ('${U_A}', '${k.c}')`,
      "X",
    ],
    [
      `insert into public.usuarios_cliente (usuario_id, cliente_id) values ('${U_SV}', '${k.c}')`,
      "X",
    ],
    [`delete from public.usuarios_cliente where cliente_id = '${k.c}'`, "0"],
    [`insert into public.administradores (usuario_id) values ('${U_A}')`, "X"],
    ["update public.administradores set creado_en = now()", "X"],
    ["delete from public.administradores", "X"],
    [`insert into public.licencias (cliente_id) values ('${k.c}')`, "X"],
    [`update public.licencias set estado = 'revocada' where cliente_id = '${k.c}'`, "0"],
    [`delete from public.licencias where cliente_id = '${k.c}'`, "X"],
    [
      `insert into public.codigos_activacion (licencia_id, codigo_hmac, caduca_en)
         values ('${k.l}', repeat('d', 64), now() + interval '1 day')`,
      "X",
    ],
    [`update public.conexiones set revocada_en = now() where licencia_id = '${k.l}'`, "0"],
    [`delete from public.conexiones where licencia_id = '${k.l}'`, "X"],
    [`insert into public.ordenes (cliente_id, tipo) values ('${k.c}', 'pausar')`, "X"],
    [`update public.ordenes set estado = 'anulada' where cliente_id = '${k.c}'`, "0"],
    [`delete from public.ordenes where cliente_id = '${k.c}'`, "X"],
    [`update public.reglas_cliente set ventana_dias = 5 where cliente_id = '${k.c}'`, "0"],
    [`insert into public.reglas_cliente (cliente_id) values ('${k.c}')`, "X"],
    [`delete from public.reglas_cliente where cliente_id = '${k.c}'`, "X"],
    [`update public.alertas set resuelta_en = now() where cliente_id = '${k.c}'`, "0"],
    [`delete from public.alertas where cliente_id = '${k.c}'`, "X"],
    [`delete from public.ejecuciones where cliente_id = '${k.c}'`, "X"],
    [`update public.ejecuciones set cerrada_en = now() where cliente_id = '${k.c}'`, "X"],
    [`delete from public.informes where cliente_id = '${k.c}'`, "X"],
    [`update public.informes set tratados = 1 where cliente_id = '${k.c}'`, "X"],
    [`delete from public.suscripciones where cliente_id = '${k.c}'`, "X"],
    [`update public.suscripciones set estado = 'active' where cliente_id = '${k.c}'`, "X"],
    ["update public.ajustes_globales set pausa_global = true", "0"],
    ["delete from public.ajustes_globales", "X"],
    [
      "insert into public.catalogo_problemas (codigo, descripcion) values ('codigo_intruso', 'Intruso')",
      "X",
    ],
    ["update public.catalogo_problemas set activo = false", "0"],
    ["delete from public.catalogo_problemas", "X"],
    [`insert into public.publicaciones (canal, version_id) values ('estable', '${VP}')`, "X"],
    ["delete from public.publicaciones", "X"],
    ["update public.publicaciones set canal = 'prueba'", "X"],
    [
      `insert into public.versiones_prompt (version, contenido, huella_sha256, commit_sha)
         values ('9.9.9', 'x', encode(sha256(convert_to('x', 'UTF8')), 'hex'), 'abcdef1')`,
      "X",
    ],
    ["update public.versiones_prompt set notas = 'x'", "X"],
    ["delete from public.versiones_prompt", "X"],
    ["insert into public.auditoria (accion, objeto_tipo) values ('abc', 'def')", "X"],
    ["update public.auditoria set accion = 'xyz'", "X"],
    ["delete from public.auditoria", "X"],
    ["insert into public.tokens default values", "X"],
    ["delete from public.eventos_stripe", "X"],
  ];
}

async function noCambiaNada(p: Perfil, nombre: string): Promise<void> {
  const antes = await firma();
  for (const k of CLIENTES) {
    for (const [sql, esperado] of intentos(k)) {
      const r = await intentar(p, sql);
      const quedo = esperado === "X" ? { codigo: "42501" } : { filas: 0 };
      expect(r, `${nombre}: ${sql}`).toEqual(quedo);
    }
  }
  // Ninguna fila cambia y no queda auditoría de un cambio que no ocurrió.
  expect(await firma(), nombre).toEqual(antes);
}

describe("escritura rechazada o sin efecto (REQ-005, REQ-036, REQ-041, REQ-062, REQ-063, CA-006, CA-037)", () => {
  it("UA, UB, UAB, USV y AD1 no cambian nada, en A, B ni C, y no dejan auditoría", async () => {
    await conSemilla();
    for (const [n, p] of [
      ["UA", UA],
      ["UB", UB],
      ["UAB", UAB],
      ["USV", USV],
      ["AD1", AD1],
    ] as const) {
      await noCambiaNada(p, n);
    }
  });

  it("un superadmin con el segundo factor ausente o malformado tampoco cambia nada", async () => {
    await conSemilla();
    for (const [nombre, claims] of AAL_MALOS) {
      await noCambiaNada({ rol: "authenticated", claims }, nombre);
    }
  });

  it("SS, CON y SR (salvo versiones_prompt) reciben 42501 en toda escritura", async () => {
    await conSemilla();
    const antes = await firma();
    for (const p of [SS, CON, SR]) {
      for (const k of CLIENTES) {
        for (const [sql] of intentos(k)) {
          if (p === SR && /versiones_prompt/.test(sql) && /^insert/.test(sql)) continue;
          expect(await intentar(p, sql), `${p.rol}: ${sql}`).toEqual({ codigo: "42501" });
        }
      }
    }
    expect(await firma()).toEqual(antes);
  });

  it("AD2 (T/C de D-6): borrados de REQ-062 y administradores, versiones, informes, ejecuciones y auditoría: 42501", async () => {
    await conSemilla();
    const antes = await firma();
    for (const sql of [
      `delete from public.clientes where id = '${CA}'`,
      `delete from public.licencias where cliente_id = '${CA}'`,
      `delete from public.conexiones where licencia_id = '${LA}'`,
      `delete from public.ejecuciones where cliente_id = '${CA}'`,
      `delete from public.informes where cliente_id = '${CA}'`,
      `delete from public.alertas where cliente_id = '${CA}'`,
      "delete from public.clientes",
      "delete from public.licencias",
      "delete from public.conexiones",
      "delete from public.ejecuciones",
      "delete from public.informes",
      "delete from public.alertas",
      // CA-037: administradores, con todos los verbos y también sobre sí mismo.
      `insert into public.administradores (usuario_id) values ('${U_A}')`,
      `insert into public.administradores (usuario_id) values ('${U_AD2}')`,
      `update public.administradores set creado_en = now() where usuario_id = '${U_AD2}'`,
      `delete from public.administradores where usuario_id = '${U_AD2}'`,
      "delete from public.administradores",
      // REQ-041: versiones, informes, ejecuciones y auditoría.
      "update public.versiones_prompt set notas = 'x'",
      "delete from public.versiones_prompt",
      `insert into public.versiones_prompt (version, contenido, huella_sha256, commit_sha)
         values ('9.9.9', 'x', encode(sha256(convert_to('x', 'UTF8')), 'hex'), 'abcdef1')`,
      "update public.informes set tratados = 1",
      "update public.ejecuciones set cerrada_en = now()",
      "insert into public.auditoria (accion, objeto_tipo) values ('abc', 'def')",
      "update public.auditoria set accion = 'xyz'",
      "delete from public.auditoria",
      // Tablas internas.
      "insert into public.clientes_oauth default values",
      "delete from public.tokens",
      "update public.eventos_stripe set tipo = 'x'",
      // Matriz D-6 para AD2: sin delete salvo usuarios_cliente; sin insert en conexiones y alertas.
      "delete from public.ordenes",
      "delete from public.reglas_cliente",
      "delete from public.catalogo_problemas",
      "delete from public.publicaciones",
      "delete from public.ajustes_globales",
      "delete from public.codigos_activacion",
      "update public.codigos_activacion set usado_en = now()",
      "update public.publicaciones set canal = 'prueba'",
      "insert into public.ajustes_globales default values",
      `insert into public.conexiones (licencia_id) values ('${LA}')`,
      `insert into public.alertas (cliente_id, tipo) values ('${CA}', 'sin_senal')`,
      `insert into public.ejecuciones (conexion_id, cliente_id, estado_servido) values ('${XA}', '${CA}', 'activa')`,
    ]) {
      const r = await intentar(AD2, sql);
      expect(r, sql).toEqual({ codigo: "42501" });
    }
    expect(await firma()).toEqual(antes);
  });

  it("AD2 sí hace lo que D-5 le permite: crea, modifica y borra vínculos", async () => {
    await conSemilla();
    expect(
      await intentar(
        AD2,
        `update public.clientes set nombre = 'Cliente A renombrado' where id = '${CA}'`,
      ),
    ).toEqual({ filas: 1 });
    expect(
      await intentar(AD2, "insert into public.clientes (nombre) values ('Cliente D ficticio')"),
    ).toEqual({
      filas: 1,
    });
    expect(
      await intentar(
        AD2,
        `insert into public.usuarios_cliente (usuario_id, cliente_id) values ('${U_SV}', '${CC}')`,
      ),
    ).toEqual({ filas: 1 });
    expect(
      await intentar(AD2, `delete from public.usuarios_cliente where usuario_id = '${U_SV}'`),
    ).toEqual({ filas: 1 });
    expect(
      await intentar(
        AD2,
        `update public.licencias set estado_manual = 'forzar_activa' where id = '${LA}'`,
      ),
    ).toEqual({ filas: 1 });
    expect(await intentar(AD2, "update public.ajustes_globales set pausa_global = true")).toEqual({
      filas: 1,
    });
    expect(
      await intentar(
        AD2,
        "insert into public.catalogo_problemas (codigo, descripcion) values ('codigo_nuevo', 'Descripción ficticia')",
      ),
    ).toEqual({ filas: 1 });
    expect(
      await intentar(
        AD2,
        "update public.reglas_cliente set ventana_dias = 5 where cliente_id = '" + CA + "'",
      ),
    ).toEqual({ filas: 1 });
    // Las columnas que D-5 no concede, no se escriben (REQ-019, REQ-007).
    for (const sql of [
      `update public.clientes set creado_en = now() where id = '${CA}'`,
      `update public.licencias set cliente_id = '${CB}' where id = '${LA}'`,
      `update public.conexiones set licencia_id = '${LB}' where id = '${XA}'`,
      `update public.conexiones set ultimo_uso_en = now() where id = '${XA}'`,
      `update public.alertas set tipo = 'impago' where id = '${AA}'`,
      `update public.ordenes set anulada_en = now() where id = '${OA}'`,
      `update public.catalogo_problemas set codigo = 'otro_codigo' where codigo = 'sin_contexto'`,
      `update public.ajustes_globales set actualizado_en = now()`,
      `update public.reglas_cliente set cliente_id = '${CB}' where cliente_id = '${CA}'`,
    ]) {
      expect(await intentar(AD2, sql), sql).toEqual({ codigo: "42501" });
    }
  });

  it("administradores: 0 filas de auditoría de un cambio que no ocurrió (REQ-063)", async () => {
    await conSemilla();
    const antes = await contar("auditoria");
    for (const p of [UA, AD1, AD2]) {
      await intentar(p, `insert into public.administradores (usuario_id) values ('${U_A}')`);
      await intentar(p, "delete from public.administradores");
    }
    expect(await contar("auditoria")).toBe(antes);
    expect(await contar("administradores")).toBe(2);
  });

  it("service_role: inserta versiones con las columnas de D-5 y nada más (P1-d)", async () => {
    await conSemilla();
    const ok = await intentar(
      SR,
      `insert into public.versiones_prompt (version, contenido, huella_sha256, commit_sha, notas)
         values ('2.0.0', 'Otro texto', encode(sha256(convert_to('Otro texto', 'UTF8')), 'hex'), 'abcdef2', 'ficticia')`,
    );
    expect(ok).toEqual({ filas: 1 });
    expect(await leer(SR, "versiones_prompt")).toBe(2);
    expect(
      await intentar(
        SR,
        `insert into public.versiones_prompt (id, version, contenido, huella_sha256, commit_sha)
           values ('${id("f2")}', '2.1.0', 'x', encode(sha256(convert_to('x', 'UTF8')), 'hex'), 'abcdef3')`,
      ),
    ).toEqual({ codigo: "42501" });
    expect(
      await intentar(
        SR,
        `insert into public.versiones_prompt (version, contenido, huella_sha256, commit_sha, registrada_en)
           values ('2.1.0', 'x', encode(sha256(convert_to('x', 'UTF8')), 'hex'), 'abcdef3', now())`,
      ),
    ).toEqual({ codigo: "42501" });
    // La auditoría de versiones_prompt es de clase «siempre» (REQ-061): queda la fila.
    expect(
      await valor(
        db,
        "select count(*)::int from public.auditoria where objeto_tipo = 'versiones_prompt'",
      ),
    ).toBe(2);
    // Solo inserción: ni siquiera con permisos de tabla puede modificarlas.
    expect(await intentar(SR, "update public.versiones_prompt set notas = 'x'")).toEqual({
      codigo: "42501",
    });
    expect(await intentar(SR, "delete from public.versiones_prompt")).toEqual({ codigo: "42501" });
  });
});

// ---------------------------------------------------------------------------
// Autoría (REQ-019, REQ-047, CA-015) y valores fijados (D-2, 17)
// ---------------------------------------------------------------------------
describe("autoría derivada de la sesión (D-2 4; REQ-019, REQ-047, CA-015)", () => {
  it("AD2 crea un código, una orden y una publicación y resuelve una alerta: el autor es AD2", async () => {
    await conSemilla();
    expect(
      await intentar(
        AD2,
        `insert into public.codigos_activacion (licencia_id, codigo_hmac, caduca_en)
           values ('${LA}', repeat('e', 64), now() + interval '1 day')`,
      ),
    ).toEqual({ filas: 1 });
    expect(
      await intentar(
        AD2,
        `insert into public.ordenes (cliente_id, tipo) values ('${CA}', 'reanudar')`,
      ),
    ).toEqual({ filas: 1 });
    // La orden creada por el superadmin con doble factor deja su fila de auditoría: el
    // actor es la sesión, la tabla ordenes y el cliente el de la orden (REQ-017, REQ-019).
    expect(
      (
        await db.query(
          `select actor::text as actor, accion, objeto_tipo, cliente_id::text as cliente
             from public.auditoria
            where objeto_tipo = 'ordenes' and accion = 'insert' and actor = '${U_AD2}'`,
        )
      ).rows,
    ).toEqual([{ actor: U_AD2, accion: "insert", objeto_tipo: "ordenes", cliente: CA }]);
    expect(
      await intentar(
        AD2,
        `insert into public.publicaciones (canal, version_id) values ('prueba', '${VP}')`,
      ),
    ).toEqual({ filas: 1 });
    expect(
      await intentar(AD2, `update public.alertas set resuelta_en = now() where id = '${AA}'`),
    ).toEqual({ filas: 1 });
    const r = await db.query<{ n: string; a: string | null }>(
      `select 'codigo' as n, creado_por::text as a from public.codigos_activacion where codigo_hmac = repeat('e', 64)
       union all select 'orden', creada_por::text from public.ordenes where tipo = 'reanudar' and cliente_id = '${CA}'
       union all select 'publicacion', publicada_por::text from public.publicaciones where canal = 'prueba'
       union all select 'alerta', resuelta_por::text from public.alertas where id = '${AA}' order by 1`,
    );
    expect(r.rows).toEqual([
      { n: "alerta", a: U_AD2 },
      { n: "codigo", a: U_AD2 },
      { n: "orden", a: U_AD2 },
      { n: "publicacion", a: U_AD2 },
    ]);
    // Cero filas con un autor distinto de la sesión.
    expect(
      await valor(
        db,
        `select (select count(*) from public.codigos_activacion where creado_por is distinct from '${U_AD2}' and codigo_hmac = repeat('e', 64))
              + (select count(*) from public.ordenes where creada_por is distinct from '${U_AD2}' and tipo = 'reanudar' and cliente_id = '${CA}')
              + (select count(*) from public.publicaciones where publicada_por is distinct from '${U_AD2}' and canal = 'prueba')
              + (select count(*) from public.alertas where resuelta_por is distinct from '${U_AD2}' and id = '${AA}')`,
      ),
    ).toBe(0);
  });

  it("indicar como autor a otro usuario se rechaza (la columna no se concede) y no queda ninguna fila", async () => {
    await conSemilla();
    const antes = await firma();
    for (const sql of [
      `insert into public.codigos_activacion (licencia_id, codigo_hmac, caduca_en, creado_por)
         values ('${LA}', repeat('e', 64), now() + interval '1 day', '${U_B}')`,
      `insert into public.ordenes (cliente_id, tipo, creada_por) values ('${CA}', 'pausar', '${U_B}')`,
      `insert into public.publicaciones (canal, version_id, publicada_por) values ('prueba', '${VP}', '${U_B}')`,
      `update public.alertas set resuelta_en = now(), resuelta_por = '${U_B}' where id = '${AA}'`,
      `update public.alertas set resuelta_por = '${U_B}' where id = '${AA}'`,
    ]) {
      expect(await intentar(AD2, sql), sql).toEqual({ codigo: "42501" });
    }
    expect(await firma()).toEqual(antes);
  });

  it("aun con el dueño: el disparador fija el autor a la sesión y nadie lo cambia después", async () => {
    await conSemilla();
    // Dueño con sesión de AD2 que intenta firmar como UB.
    await como(db, "postgres", ses(U_AD2, { aal: "aal2" }), async () => {
      await db.exec(
        `insert into public.ordenes (id, cliente_id, tipo, creada_por)
           values ('${id("d3")}', '${CA}', 'pausar', '${U_B}')`,
      );
      await db.exec(
        `insert into public.codigos_activacion (id, licencia_id, codigo_hmac, caduca_en, creado_por)
           values ('${id("d4")}', '${LA}', repeat('f', 64), now() + interval '1 day', '${U_B}')`,
      );
      await db.exec(
        `insert into public.publicaciones (canal, version_id, publicada_por) values ('prueba', '${VP}', '${U_B}')`,
      );
    });
    expect(
      await valor(db, `select creada_por::text from public.ordenes where id = '${id("d3")}'`),
    ).toBe(U_AD2);
    expect(
      await valor(
        db,
        `select creado_por::text from public.codigos_activacion where id = '${id("d4")}'`,
      ),
    ).toBe(U_AD2);
    expect(
      await valor(
        db,
        "select publicada_por::text from public.publicaciones where canal = 'prueba'",
      ),
    ).toBe(U_AD2);
    // Sin sesión (dueño a secas, como el seed): el autor queda en nulo, nunca el que se escribe.
    await db.exec(
      `insert into public.ordenes (id, cliente_id, tipo, creada_por) values ('${id("d5")}', '${CA}', 'pausar', '${U_B}')`,
    );
    expect(
      await valor(db, `select creada_por from public.ordenes where id = '${id("d5")}'`),
    ).toBeNull();
    // Cambiarlo después tampoco se puede, con ningún rol.
    await db.exec(`update public.ordenes set creada_por = '${U_B}' where id = '${id("d3")}'`);
    await db.exec(
      `update public.codigos_activacion set creado_por = '${U_B}' where id = '${id("d4")}'`,
    );
    expect(
      await valor(db, `select creada_por::text from public.ordenes where id = '${id("d3")}'`),
    ).toBe(U_AD2);
    expect(
      await valor(
        db,
        `select creado_por::text from public.codigos_activacion where id = '${id("d4")}'`,
      ),
    ).toBe(U_AD2);
  });

  it("resuelta_por solo cambia de nulo a la sesión y resuelta_en a now()", async () => {
    await conSemilla();
    await db.exec(`update public.alertas set resuelta_por = '${U_B}' where id = '${AA}'`);
    expect(
      await valor(db, `select resuelta_por from public.alertas where id = '${AA}'`),
    ).toBeNull();
    expect(
      await intentar(
        AD2,
        `update public.alertas set resuelta_en = '2000-01-01' where id = '${AA}'`,
      ),
    ).toEqual({
      filas: 1,
    });
    const r = await db.query<{ reciente: boolean; por: string }>(
      `select resuelta_en > now() - interval '5 minutes' as reciente, resuelta_por::text as por
         from public.alertas where id = '${AA}'`,
    );
    expect(r.rows).toEqual([{ reciente: true, por: U_AD2 }]);
    // Una vez resuelta, no se deshace ni se reescribe, con ningún rol.
    for (const sql of [
      `update public.alertas set resuelta_en = null where id = '${AA}'`,
      `update public.alertas set resuelta_en = now() + interval '1 day' where id = '${AA}'`,
      `update public.alertas set resuelta_por = null where id = '${AA}'`,
      `update public.alertas set resuelta_por = '${U_B}' where id = '${AA}'`,
    ]) {
      expect(await errorDe(() => db.exec(sql)), sql).not.toBeNull();
    }
    expect(
      await intentar(AD2, `update public.alertas set resuelta_en = null where id = '${AA}'`),
    ).toMatchObject({
      codigo: expect.any(String),
    });
    expect(
      await valor(db, `select resuelta_por::text from public.alertas where id = '${AA}'`),
    ).toBe(U_AD2);
  });
});

describe("valores fijados por disparador (D-2 17)", () => {
  it("actualizado_en de reglas_cliente y ajustes_globales lo fija la base", async () => {
    await conSemilla();
    for (const [tabla, filtro, cambio] of [
      ["reglas_cliente", `where cliente_id = '${CA}'`, "ventana_dias = 4"],
      ["ajustes_globales", "", "pausa_global = true"],
    ] as const) {
      const antes = await valor<Date>(db, `select actualizado_en from public.${tabla} ${filtro}`);
      expect(await intentar(AD2, `update public.${tabla} set ${cambio} ${filtro}`)).toEqual({
        filas: 1,
      });
      const despues = await valor<Date>(db, `select actualizado_en from public.${tabla} ${filtro}`);
      expect(despues.getTime(), tabla).toBeGreaterThan(antes.getTime());
      // Ni con el dueño se puede escribir otro valor.
      await db.exec(
        `update public.${tabla} set actualizado_en = '2000-01-01', ${cambio} ${filtro}`,
      );
      const fijado = await valor<Date>(db, `select actualizado_en from public.${tabla} ${filtro}`);
      expect(fijado.getFullYear(), tabla).toBeGreaterThan(2020);
    }
    await db.exec(
      `insert into public.clientes (id, nombre) values ('${id("c9")}', 'Cliente ficticio')`,
    );
    await db.exec(
      `insert into public.reglas_cliente (cliente_id, actualizado_en) values ('${id("c9")}', '2000-01-01')`,
    );
    expect(
      (
        await valor<Date>(
          db,
          `select actualizado_en from public.reglas_cliente where cliente_id = '${id("c9")}'`,
        )
      ).getFullYear(),
    ).toBeGreaterThan(2020);
  });

  it("ordenes: authenticated solo pasa de pendiente o entregada a anulada y anulada_en lo fija la base", async () => {
    await conSemilla();
    await dueno(`update public.ordenes set estado = 'entregada' where id = '${OB}'`);
    await dueno(`update public.ordenes set estado = 'confirmada' where id = '${OC}'`);
    expect(await valor(db, `select anulada_en from public.ordenes where id = '${OA}'`)).toBeNull();
    // pendiente -> confirmada y confirmada -> anulada se rechazan.
    expect(
      await intentar(AD2, `update public.ordenes set estado = 'confirmada' where id = '${OA}'`),
    ).toHaveProperty("codigo");
    expect(
      await intentar(AD2, `update public.ordenes set estado = 'entregada' where id = '${OA}'`),
    ).toHaveProperty("codigo");
    expect(
      await intentar(AD2, `update public.ordenes set estado = 'anulada' where id = '${OC}'`),
    ).toHaveProperty("codigo");
    expect(await valor(db, `select estado::text from public.ordenes where id = '${OC}'`)).toBe(
      "confirmada",
    );
    expect(await valor(db, `select estado::text from public.ordenes where id = '${OA}'`)).toBe(
      "pendiente",
    );
    // pendiente y entregada -> anulada, sí.
    expect(
      await intentar(AD2, `update public.ordenes set estado = 'anulada' where id = '${OA}'`),
    ).toEqual({ filas: 1 });
    expect(
      await intentar(AD2, `update public.ordenes set estado = 'anulada' where id = '${OB}'`),
    ).toEqual({ filas: 1 });
    const r = await db.query<{ reciente: boolean }>(
      `select anulada_en > now() - interval '5 minutes' as reciente from public.ordenes where id in ('${OA}', '${OB}')`,
    );
    expect(r.rows).toEqual([{ reciente: true }, { reciente: true }]);
    // Una anulada no vuelve a otro estado por la API.
    expect(
      await intentar(AD2, `update public.ordenes set estado = 'pendiente' where id = '${OA}'`),
    ).toHaveProperty("codigo");
    // Con el dueño (las funciones del conector, el seed) las demás transiciones siguen siendo posibles.
    await dueno(`update public.ordenes set estado = 'entregada' where id = '${OC}'`);
    expect(await valor(db, `select estado::text from public.ordenes where id = '${OC}'`)).toBe(
      "entregada",
    );
    // anulada_en solo lo escribe la transición.
    await dueno(`update public.ordenes set anulada_en = null where id = '${OA}'`);
    expect(
      await valor(db, `select anulada_en is not null from public.ordenes where id = '${OA}'`),
    ).toBe(true);
    await dueno(`update public.ordenes set anulada_en = now() where id = '${OC}'`);
    expect(await valor(db, `select anulada_en from public.ordenes where id = '${OC}'`)).toBeNull();
  });

  it("conexiones.revocada_en: de nulo a now() y nunca hacia atrás, con ningún rol", async () => {
    await conSemilla();
    expect(
      await intentar(
        AD2,
        `update public.conexiones set revocada_en = '2000-01-01' where id = '${XA}'`,
      ),
    ).toEqual({ filas: 1 });
    expect(
      await valor<boolean>(
        db,
        `select revocada_en > now() - interval '5 minutes' from public.conexiones where id = '${XA}'`,
      ),
    ).toBe(true);
    const fijada = await valor<Date>(
      db,
      `select revocada_en from public.conexiones where id = '${XA}'`,
    );
    for (const p of [AD2, null]) {
      for (const valorNuevo of ["null", "'2000-01-01'", "now() + interval '1 day'"]) {
        const sql = `update public.conexiones set revocada_en = ${valorNuevo} where id = '${XA}'`;
        if (p === null) expect(await errorDe(() => db.exec(sql)), sql).not.toBeNull();
        else expect(await intentar(p, sql), sql).toHaveProperty("codigo");
      }
    }
    expect(
      await valor<Date>(db, `select revocada_en from public.conexiones where id = '${XA}'`),
    ).toEqual(fijada);
    // Una conexión ya revocada (XA3) conserva su fecha si se vuelve a escribir la misma:
    // se admite (1 fila) y la fecha queda igual (no se mueve a now()).
    const fechaXA3 = await valor<Date>(
      db,
      `select revocada_en from public.conexiones where id = '${XA3}'`,
    );
    expect(
      await intentar(
        AD2,
        `update public.conexiones set revocada_en = revocada_en where id = '${XA3}'`,
      ),
    ).toEqual({ filas: 1 });
    expect(
      await valor<Date>(db, `select revocada_en from public.conexiones where id = '${XA3}'`),
    ).toEqual(fechaXA3);
    await dueno(`update public.conexiones set ultimo_uso_en = now() where id = '${XA3}'`);
    expect(
      await valor<Date>(db, `select revocada_en from public.conexiones where id = '${XA3}'`),
    ).toEqual(fechaXA3);
  });
});

// ---------------------------------------------------------------------------
// Baja de un cliente (REQ-059, REQ-064, CA-036, CA-039, P1-c)
// ---------------------------------------------------------------------------
describe("baja de un cliente (D-3; REQ-059, REQ-062, REQ-064; CA-036, CA-039)", () => {
  async function filasPorTabla(): Promise<Record<string, number>> {
    const salida: Record<string, number> = {};
    for (const t of TABLAS.filter((x) => x !== "auditoria")) salida[t] = await contar(t);
    return salida;
  }

  it("la baja revoca las conexiones, deja el mismo número de filas y 1 auditoría por conexión", async () => {
    await conSemilla();
    const antes = await filasPorTabla();
    const auditoriaAntes = await contar("auditoria");
    const maxAntes = await valor<number>(
      db,
      "select coalesce(max(id), 0)::int from public.auditoria",
    );
    const fechaPrevia = await valor<Date>(
      db,
      `select revocada_en from public.conexiones where id = '${XA3}'`,
    );
    expect(
      await intentar(AD2, `update public.clientes set estado = 'baja' where id = '${CA}'`),
    ).toEqual({
      filas: 1,
    });
    expect(await valor(db, `select estado::text from public.clientes where id = '${CA}'`)).toBe(
      "baja",
    );
    // El 100 % de las conexiones de A queda revocado; la ya revocada conserva su fecha.
    expect(
      await valor(
        db,
        `select count(*)::int from public.conexiones where licencia_id = '${LA}' and revocada_en is null`,
      ),
    ).toBe(0);
    expect(
      await valor<Date>(db, `select revocada_en from public.conexiones where id = '${XA3}'`),
    ).toEqual(fechaPrevia);
    // Las de B no se tocan.
    expect(
      await valor(
        db,
        `select count(*)::int from public.conexiones where licencia_id = '${LB}' and revocada_en is null`,
      ),
    ).toBe(1);
    expect(await filasPorTabla()).toEqual(antes);
    // Auditoría: una fila por conexión revocada (XA y XA2) y la del cliente.
    const r = await db.query<{
      accion: string;
      objeto_tipo: string;
      objeto_id: string;
      cliente_id: string;
      actor: string;
    }>(
      `select accion, objeto_tipo, objeto_id, cliente_id::text, actor::text
         from public.auditoria where id > ${maxAntes}
        order by accion, objeto_id`,
    );
    expect(
      r.rows
        .map((x) => `${x.accion}|${x.objeto_tipo}|${x.objeto_id}|${x.cliente_id}|${x.actor}`)
        .sort(),
    ).toEqual(
      [
        `revocar_por_baja|conexiones|${XA}|${CA}|${U_AD2}`,
        `revocar_por_baja|conexiones|${XA2}|${CA}|${U_AD2}`,
        `update|clientes|${CA}|${CA}|${U_AD2}`,
      ].sort(),
    );
    expect(await contar("auditoria")).toBe(auditoriaAntes + 3);
  });

  it("si la revocación falla, el cliente sigue activo y no queda auditoría (CA-036)", async () => {
    await conSemilla();
    await db.exec(`
      create function public.falla_prueba() returns trigger language plpgsql
        as $$ begin raise exception 'falla_prueba'; end $$;
      create trigger zz_falla_prueba before update on public.conexiones
        for each row execute function public.falla_prueba();
    `);
    const antes = await firma();
    const r = await intentar(AD2, `update public.clientes set estado = 'baja' where id = '${CA}'`);
    expect(r).toHaveProperty("codigo");
    expect(await valor(db, `select estado::text from public.clientes where id = '${CA}'`)).toBe(
      "activo",
    );
    expect(await firma()).toEqual(antes);
    // También con el dueño: el cliente no queda de baja.
    expect(
      await errorDe(() => db.exec(`update public.clientes set estado = 'baja' where id = '${CA}'`)),
    ).toContain("falla_prueba");
    expect(await valor(db, `select estado::text from public.clientes where id = '${CA}'`)).toBe(
      "activo",
    );
  });

  it("de baja a activo se rechaza con cualquier rol y el cliente sigue de baja (P1-c)", async () => {
    await conSemilla();
    await dueno(`update public.clientes set estado = 'baja' where id = '${CA}'`);
    expect(
      await intentar(AD2, `update public.clientes set estado = 'activo' where id = '${CA}'`),
    ).toHaveProperty("codigo");
    expect(
      await errorDe(() =>
        db.exec(`update public.clientes set estado = 'activo' where id = '${CA}'`),
      ),
    ).not.toBeNull();
    expect(await valor(db, `select estado::text from public.clientes where id = '${CA}'`)).toBe(
      "baja",
    );
    // Escribir el mismo estado u otra columna de un cliente de baja sí se admite.
    expect(
      await intentar(AD2, `update public.clientes set nombre = 'A renombrado' where id = '${CA}'`),
    ).toEqual({
      filas: 1,
    });
    expect(
      await intentar(AD2, `update public.clientes set estado = 'baja' where id = '${CA}'`),
    ).toEqual({
      filas: 1,
    });
  });

  it("CA-039: tras la baja, UA lee 0 en todo, UAB lee lo de B y AD2 lo mismo que antes", async () => {
    await conSemilla();
    const antesAD2: Record<string, number | string> = {};
    for (const t of TABLAS) antesAD2[t] = await leer(AD2, t);
    const antesUAB: Record<string, number | string> = {};
    for (const t of TABLAS) {
      if (t !== "auditoria")
        antesUAB[t] = await leer(UAB, t, FILTRO[t] ? FILTRO[t]!(CLIENTES[1]!) : "");
    }
    // Una conexión de A que la prueba deja sin revocar tras la baja.
    await dueno(`update public.clientes set estado = 'baja' where id = '${CA}'`);
    await db.exec("alter table public.conexiones disable trigger user");
    try {
      await db.exec(`update public.conexiones set revocada_en = null where id = '${XA}'`);
    } finally {
      await db.exec("alter table public.conexiones enable trigger user");
    }
    for (const t of TABLAS) {
      expect(await leer(UA, t), `UA ${t}`).toBe(0);
    }
    for (const t of Object.keys(FILTRO)) {
      expect(await leer(UAB, t, FILTRO[t]!(CLIENTES[0]!)), `UAB ${t} (A)`).toBe(0);
      expect(await leer(UAB, t, FILTRO[t]!(CLIENTES[1]!)), `UAB ${t} (B)`).toBe(antesUAB[t]);
    }
    // El catálogo lo sigue leyendo UAB (le queda B activo) y no UA.
    expect(await leer(UAB, "catalogo_problemas")).toBe(2);
    expect(await leer(UA, "catalogo_problemas")).toBe(0);
    for (const t of TABLAS.filter((x) => x !== "auditoria")) {
      expect(await leer(AD2, t), `AD2 ${t}`).toBe(antesAD2[t]! as number | string);
    }
    // La auditoría: lo de antes, más las 2 filas de conexiones de la baja hecha por el dueño (la del cliente la omite auditar() al ser del dueño).
    expect(await leer(AD2, "auditoria")).toBe((antesAD2.auditoria as number) + 2);
    // La auditoría del cliente de baja sigue siendo legible por AD2.
    expect(await leer(AD2, "auditoria", `where cliente_id = '${CA}'`)).toBeGreaterThan(0);
    // UA no escribe nada.
    expect(await intentar(UA, "update public.clientes set nombre = 'X'")).toEqual({ filas: 0 });
  });

  it("clientes_del_usuario() solo devuelve clientes activos y solo del propio usuario (REQ-010, REQ-064)", async () => {
    await conSemilla();
    const lista = async (p: Perfil) =>
      como(db, p.rol, p.claims, async () =>
        (
          await db.query<{ c: string }>(
            "select privado.clientes_del_usuario()::text as c order by 1",
          )
        ).rows.map((x) => x.c),
      );
    expect(await lista(UAB)).toEqual([CA, CB].sort());
    expect(await lista(UA)).toEqual([CA]);
    expect(await lista(USV)).toEqual([]);
    expect(await lista(AD2)).toEqual([]);
    await dueno(`update public.clientes set estado = 'baja' where id = '${CA}'`);
    expect(await lista(UAB)).toEqual([CB]);
    expect(await lista(UA)).toEqual([]);
  });

  it("no hay borrado físico: ni de clientes ni de lo que depende de ellos, con ningún perfil de la API", async () => {
    await conSemilla();
    const antes = await filasPorTabla();
    for (const p of [UA, UAB, AD1, AD2, SS, SR, CON]) {
      for (const t of [
        "clientes",
        "licencias",
        "conexiones",
        "ejecuciones",
        "informes",
        "alertas",
      ]) {
        expect(await intentar(p, `delete from public.${t}`), `${p.rol} ${t}`).toEqual({
          codigo: "42501",
        });
      }
    }
    expect(await filasPorTabla()).toEqual(antes);
  });
});

// ---------------------------------------------------------------------------
// Políticas, permisos y funciones (D-5, REQ-010, REQ-057, REQ-063)
// ---------------------------------------------------------------------------
describe("políticas (D-2 9 y 12, D-5)", () => {
  it("una política por operación y rol, ninguna for all, todas para authenticated", async () => {
    await hastaM07(db);
    const r = await db.query<{ tabla: string; cmd: string; roles: string }>(
      "select tablename as tabla, cmd, roles::text as roles from pg_policies where schemaname = 'public'",
    );
    expect(r.rows.length).toBeGreaterThan(0);
    for (const x of r.rows) {
      expect(x.cmd, x.tabla).not.toBe("ALL");
      expect(x.roles, x.tabla).toBe("{authenticated}");
    }
    const porTabla: Record<string, string[]> = {};
    for (const x of r.rows) (porTabla[x.tabla] ??= []).push(x.cmd);
    for (const t of Object.keys(porTabla)) porTabla[t]!.sort();
    expect(porTabla).toEqual({
      administradores: ["SELECT"],
      ajustes_globales: ["SELECT", "UPDATE"],
      alertas: ["SELECT", "UPDATE"],
      auditoria: ["SELECT"],
      catalogo_problemas: ["INSERT", "SELECT", "SELECT", "UPDATE"],
      clientes: ["INSERT", "SELECT", "SELECT", "UPDATE"],
      codigos_activacion: ["INSERT", "SELECT"],
      conexiones: ["SELECT", "UPDATE"],
      ejecuciones: ["SELECT", "SELECT"],
      informes: ["SELECT", "SELECT"],
      licencias: ["INSERT", "SELECT", "SELECT", "UPDATE"],
      ordenes: ["INSERT", "SELECT", "SELECT", "UPDATE"],
      publicaciones: ["INSERT", "SELECT"],
      reglas_cliente: ["INSERT", "SELECT", "UPDATE"],
      suscripciones: ["SELECT", "SELECT"],
      usuarios_cliente: ["DELETE", "INSERT", "SELECT"],
      versiones_prompt: ["SELECT"],
    });
  });

  it("sin políticas _propio en administradores ni usuarios_cliente, y ninguna en las internas (REQ-057, CA-035)", async () => {
    await hastaM07(db);
    const r = await db.query<{ tabla: string; nombre: string }>(
      "select tablename as tabla, policyname as nombre from pg_policies where schemaname = 'public'",
    );
    for (const x of r.rows) {
      if (x.tabla === "administradores" || x.tabla === "usuarios_cliente") {
        expect(x.nombre, x.tabla).not.toMatch(/propio/);
        expect(x.nombre, x.tabla).toMatch(/admin/);
      }
      expect(INTERNAS).not.toContain(x.tabla);
    }
    // Las 21 tablas conservan RLS (nunca se desactiva).
    expect(
      await valor(
        db,
        `select count(*)::int from pg_class where relnamespace = 'public'::regnamespace
            and relkind = 'r' and not relrowsecurity`,
      ),
    ).toBe(0);
  });

  it("el superadmin va con es_admin() y el usuario con clientes_del_usuario(); las de escritura llevan with check", async () => {
    await hastaM07(db);
    const r = await db.query<{
      tabla: string;
      nombre: string;
      cmd: string;
      qual: string | null;
      chk: string | null;
    }>(
      `select tablename as tabla, policyname as nombre, cmd, qual, with_check as chk
         from pg_policies where schemaname = 'public'`,
    );
    for (const x of r.rows) {
      const admin = /admin/.test(x.nombre);
      const texto = `${x.qual ?? ""} ${x.chk ?? ""}`;
      if (admin) expect(texto, `${x.tabla}.${x.nombre}`).toMatch(/privado\.es_admin\(\)/);
      else expect(texto, `${x.tabla}.${x.nombre}`).toMatch(/clientes_del_usuario\(\)/);
      expect(x.cmd).toBe(x.cmd.toUpperCase());
      if (x.cmd === "INSERT") expect(x.chk, x.nombre).not.toBeNull();
      if (x.cmd === "UPDATE") {
        expect(x.qual, x.nombre).not.toBeNull();
        expect(x.chk, x.nombre).not.toBeNull();
      }
      // El usuario de cliente solo lee (REQ-005).
      if (!admin) expect(x.cmd, x.nombre).toBe("SELECT");
    }
  });

  it("las columnas de las políticas tienen índice (REQ-032, D-2 14)", async () => {
    await hastaM07(db);
    const r = await db.query<{ indexname: string }>(
      `select indexname from pg_indexes where schemaname = 'public'
        and indexname in ('licencias_por_cliente', 'alertas_por_cliente', 'ejecuciones_por_conexion',
                          'ejecuciones_por_cliente', 'informes_por_cliente', 'ordenes_por_cliente',
                          'usuarios_cliente_por_cliente', 'usuarios_cliente_pkey', 'suscripciones_pkey')`,
    );
    expect(r.rows.map((x) => x.indexname).sort()).toEqual([
      "alertas_por_cliente",
      "ejecuciones_por_cliente",
      "ejecuciones_por_conexion",
      "informes_por_cliente",
      "licencias_por_cliente",
      "ordenes_por_cliente",
      "suscripciones_pkey",
      "usuarios_cliente_pkey",
      "usuarios_cliente_por_cliente",
    ]);
  });
});

// D-5: lo que concede la migración, tabla a tabla (objeto|columna|privilegio).
const SELECT_CODIGOS = ["caduca_en", "creado_en", "creado_por", "id", "licencia_id", "usado_en"];
function esperadoAuthenticated(): string[] {
  const t = (tabla: string, priv: string) => `${tabla}|*|${priv}`;
  const c = (tabla: string, cols: string[], priv: string) =>
    cols.map((x) => `${tabla}|${x}|${priv}`);
  return [
    t("clientes", "SELECT"),
    ...c("clientes", ["nombre", "canal", "frecuencia_esperada_horas"], "INSERT"),
    ...c("clientes", ["nombre", "canal", "frecuencia_esperada_horas", "estado"], "UPDATE"),
    t("administradores", "SELECT"),
    t("usuarios_cliente", "SELECT"),
    ...c("usuarios_cliente", ["usuario_id", "cliente_id"], "INSERT"),
    t("usuarios_cliente", "DELETE"),
    t("licencias", "SELECT"),
    ...c("licencias", ["cliente_id", "estado_manual", "caduca_en"], "INSERT"),
    ...c("licencias", ["estado", "estado_manual", "caduca_en"], "UPDATE"),
    ...c("codigos_activacion", SELECT_CODIGOS, "SELECT"),
    ...c("codigos_activacion", ["licencia_id", "codigo_hmac", "caduca_en"], "INSERT"),
    t("conexiones", "SELECT"),
    ...c("conexiones", ["revocada_en"], "UPDATE"),
    t("versiones_prompt", "SELECT"),
    t("publicaciones", "SELECT"),
    ...c("publicaciones", ["canal", "version_id", "motivo"], "INSERT"),
    t("reglas_cliente", "SELECT"),
    ...c(
      "reglas_cliente",
      [
        "cliente_id",
        "max_correos_por_revision",
        "ventana_dias",
        "guardar_adjuntos",
        "preparar_borradores",
        "descargar_facturas_por_enlace",
      ],
      "INSERT",
    ),
    ...c(
      "reglas_cliente",
      [
        "max_correos_por_revision",
        "ventana_dias",
        "guardar_adjuntos",
        "preparar_borradores",
        "descargar_facturas_por_enlace",
      ],
      "UPDATE",
    ),
    t("ordenes", "SELECT"),
    ...c("ordenes", ["cliente_id", "tipo"], "INSERT"),
    ...c("ordenes", ["estado"], "UPDATE"),
    t("ajustes_globales", "SELECT"),
    ...c("ajustes_globales", ["pausa_global", "stripe_en_observacion"], "UPDATE"),
    t("catalogo_problemas", "SELECT"),
    ...c("catalogo_problemas", ["codigo", "descripcion", "activo"], "INSERT"),
    ...c("catalogo_problemas", ["descripcion", "activo"], "UPDATE"),
    t("alertas", "SELECT"),
    ...c("alertas", ["resuelta_en"], "UPDATE"),
    t("ejecuciones", "SELECT"),
    t("informes", "SELECT"),
    t("suscripciones", "SELECT"),
    t("auditoria", "SELECT"),
  ].sort();
}
function esperadoServiceRole(): string[] {
  return [
    "versiones_prompt|*|SELECT",
    ...["version", "contenido", "huella_sha256", "commit_sha", "notas"].map(
      (x) => `versiones_prompt|${x}|INSERT`,
    ),
  ].sort();
}
async function permisosDe(rol: string): Promise<string[]> {
  const r = await db.query<{ p: string }>(
    `select c.relname || '|*|' || a.privilege_type as p
       from pg_class c cross join lateral aclexplode(c.relacl) a
      where c.relnamespace = 'public'::regnamespace and a.grantee = $1::regrole::oid
     union all
     select c.relname || '|' || t.attname || '|' || a.privilege_type
       from pg_attribute t join pg_class c on c.oid = t.attrelid
       cross join lateral aclexplode(t.attacl) a
      where c.relnamespace = 'public'::regnamespace and a.grantee = $1::regrole::oid`,
    [rol],
  );
  return r.rows.map((x) => x.p).sort();
}

describe("permisos (D-5, REQ-007, REQ-010, REQ-011, CA-008)", () => {
  it("los permisos de authenticated vistos con aclexplode son exactamente los de D-5", async () => {
    await hastaM07(db);
    expect(await permisosDe("authenticated")).toEqual(esperadoAuthenticated());
  });

  it("los de service_role son solo los de versiones_prompt (P1-d)", async () => {
    await hastaM07(db);
    expect(await permisosDe("service_role")).toEqual(esperadoServiceRole());
  });

  it("anon, conector y PUBLIC no tienen nada en las tablas, columnas ni secuencias de public", async () => {
    await db.exec(
      "alter default privileges for role postgres grant all on tables to conector_prueba",
    );
    await hastaM07(db);
    for (const rol of ["anon", "conector", "conector_prueba"]) {
      expect(await permisosDe(rol), rol).toEqual([]);
    }
    const publicos = await valor(
      db,
      `select (select count(*) from pg_class c cross join lateral aclexplode(c.relacl) a
                where c.relnamespace in ('public'::regnamespace, 'privado'::regnamespace) and a.grantee = 0)
            + (select count(*) from pg_attribute t join pg_class c on c.oid = t.attrelid
                cross join lateral aclexplode(t.attacl) a
                where c.relnamespace = 'public'::regnamespace and a.grantee = 0)`,
    );
    expect(Number(publicos)).toBe(0);
    // Nadie, salvo el dueño y los dos roles de arriba, tiene permisos en las tablas.
    expect(
      await valor(
        db,
        `select count(*)::int from pg_class c cross join lateral aclexplode(c.relacl) a
          where c.relnamespace = 'public'::regnamespace and a.grantee <> c.relowner
            and a.grantee not in ('authenticated'::regrole::oid, 'service_role'::regrole::oid)`,
      ),
    ).toBe(0);
  });

  it("ninguno tiene TRUNCATE, REFERENCES, TRIGGER ni MAINTAIN en ninguna tabla", async () => {
    await hastaM07(db);
    for (const rol of ["authenticated", "service_role"]) {
      const permisos = await permisosDe(rol);
      expect(
        permisos.filter((x) => /\|(TRUNCATE|REFERENCES|TRIGGER|MAINTAIN)$/.test(x)),
        rol,
      ).toEqual([]);
    }
  });

  it("las tablas internas siguen sin permisos ni políticas (REQ-008)", async () => {
    await hastaM07(db);
    const permisos = [
      ...(await permisosDe("authenticated")),
      ...(await permisosDe("service_role")),
    ];
    for (const t of INTERNAS)
      expect(
        permisos.filter((x) => x.startsWith(`${t}|`)),
        t,
      ).toEqual([]);
  });

  it("solo es_admin() y clientes_del_usuario() son ejecutables por authenticated; usage en privado solo para él (REQ-010)", async () => {
    await hastaM07(db);
    const r = await db.query<{ firma: string; rol: string }>(
      `select p.oid::regprocedure::text as firma, r.rolname as rol
         from pg_proc p cross join (values ('anon'), ('authenticated'), ('service_role'), ('conector')) r (rolname)
        where p.pronamespace in ('public'::regnamespace, 'privado'::regnamespace)
          and has_function_privilege(r.rolname, p.oid, 'execute')
        order by 1, 2`,
    );
    expect(r.rows).toEqual([
      { firma: "privado.clientes_del_usuario()", rol: "authenticated" },
      { firma: "privado.es_admin()", rol: "authenticated" },
    ]);
    for (const [rol, usage] of [
      ["authenticated", true],
      ["anon", false],
      ["service_role", false],
      ["conector", false],
    ] as const) {
      expect(
        await valor(db, `select has_schema_privilege('${rol}', 'privado', 'usage')`),
        rol,
      ).toBe(usage);
      expect(
        await valor(db, `select has_schema_privilege('${rol}', 'privado', 'create')`),
        rol,
      ).toBe(false);
    }
    // La ACL del esquema, entera: dueño con usage y create, y authenticated solo con usage;
    // ni PUBLIC (grantee 0) ni conector_prueba (menor 5 del revisor).
    expect(
      (
        await db.query(
          `select a.grantee::pg_catalog.regrole::text as rol, a.privilege_type as tipo, a.is_grantable as opcion
             from pg_namespace s cross join lateral aclexplode(s.nspacl) a
            where s.nspname = 'privado' and a.grantee <> 0 order by 1, 2`,
        )
      ).rows,
    ).toEqual([
      { rol: "authenticated", tipo: "USAGE", opcion: false },
      { rol: "postgres", tipo: "CREATE", opcion: false },
      { rol: "postgres", tipo: "USAGE", opcion: false },
    ]);
    expect(
      await valor(
        db,
        `select count(*)::int from pg_namespace s cross join lateral aclexplode(s.nspacl) a
          where s.nspname = 'privado' and a.grantee = 0`,
      ),
    ).toBe(0);
    expect(
      await valor(db, "select has_schema_privilege('conector_prueba', 'privado', 'usage')"),
    ).toBe(false);
    // anon no puede ejecutar ni las funciones de apoyo (REQ-037).
    expect(await intentar(SS, "select privado.es_admin()")).toEqual({ codigo: "42501" });
    expect(await intentar(SS, "select privado.clientes_del_usuario()")).toEqual({
      codigo: "42501",
    });
    for (const f of [
      "privado.auditar()",
      "privado.registrar_auditoria('abc', 'def', 'x', null)",
      "privado.al_dar_de_baja()",
    ]) {
      expect(await intentar(AD2, `select ${f}`), f).toEqual({ codigo: "42501" });
    }
  });

  it("las funciones nuevas: dueño postgres, search_path pg_catalog, pg_temp, definer solo las que lo necesitan", async () => {
    await hastaM06(db);
    const antes = new Set(
      (
        await db.query<{ firma: string }>(
          "select p.oid::regprocedure::text as firma from pg_proc p where p.pronamespace = 'privado'::regnamespace",
        )
      ).rows.map((x) => x.firma),
    );
    await aplicar(db, M07());
    const r = await db.query<{
      firma: string;
      dueno: string;
      definer: boolean;
      config: string;
      tipo: string;
    }>(
      `select p.oid::regprocedure::text as firma, p.proowner::regrole::text as dueno,
              p.prosecdef as definer, p.proconfig::text as config, p.prorettype::regtype::text as tipo
         from pg_proc p where p.pronamespace = 'privado'::regnamespace order by 1`,
    );
    const nuevas = r.rows.filter((x) => !antes.has(x.firma));
    expect(nuevas.map((x) => x.firma).sort()).toEqual(
      [
        "privado.al_dar_de_baja()",
        "privado.clientes_del_usuario()",
        "privado.es_admin()",
        "privado.fijar_autoria()",
        "privado.fijar_valores()",
        "privado.impedir_reactivar_cliente()",
      ].sort(),
    );
    for (const f of nuevas) {
      expect(f.dueno, f.firma).toBe("postgres");
      expect(f.config, f.firma).toBe('{"search_path=pg_catalog, pg_temp"}');
    }
    const definer = nuevas
      .filter((x) => x.definer)
      .map((x) => x.firma)
      .sort();
    expect(definer).toEqual(
      ["privado.al_dar_de_baja()", "privado.clientes_del_usuario()", "privado.es_admin()"].sort(),
    );
    // Las dos de apoyo a las políticas: estables.
    const estables = await db.query<{ firma: string; vol: string }>(
      `select p.oid::regprocedure::text as firma, p.provolatile::text as vol from pg_proc p
        where p.oid in ('privado.es_admin'::regproc, 'privado.clientes_del_usuario'::regproc)`,
    );
    expect(estables.rows.every((x) => x.vol === "s")).toBe(true);
  });

  it("al_dar_de_baja() escribe con registrar_auditoria() y sin SQL dinámico (N-2, N-3)", async () => {
    await hastaM07(db);
    const src = await valor<string>(
      db,
      "select prosrc from pg_proc where oid = 'privado.al_dar_de_baja'::regproc",
    );
    expect(src).toMatch(/privado\.registrar_auditoria\(/);
    expect(src).toMatch(/revocar_por_baja/);
    expect(src).not.toMatch(/\bexecute\b/i);
    expect(src).not.toMatch(/insert\s+into\s+public\.auditoria/i);
    const def = await valor<string>(
      db,
      `select pg_get_triggerdef(oid) from pg_trigger where tgname = 'clientes_al_dar_de_baja'`,
    );
    expect(def).toMatch(/AFTER UPDATE OF estado ON public\.clientes/);
    expect(def).toMatch(/old\.estado = 'activo'/i);
    expect(def).toMatch(/new\.estado = 'baja'/i);
  });

  it("es_admin() exige doble factor y fila de administrador, y no usa user_metadata", async () => {
    await hastaM07(db);
    const src = await valor<string>(
      db,
      "select prosrc from pg_proc where oid = 'privado.es_admin'::regproc",
    );
    expect(src).toMatch(/aal2/);
    expect(src).toMatch(/administradores/);
    expect(src).not.toMatch(/metadata/i);
    await db.exec(SEMILLA);
    const es = async (p: Perfil) =>
      como(db, p.rol, p.claims, async () => valor<boolean>(db, "select privado.es_admin()"));
    expect(await es(AD2)).toBe(true);
    expect(await es(AD1)).toBe(false);
    expect(await es(UA)).toBe(false);
    for (const [nombre, claims] of AAL_MALOS) {
      expect(await es({ rol: "authenticated", claims }), nombre).toBe(false);
    }
  });

  it("los tipos: authenticated escribe los enumerados que D-5 le deja escribir (USAGE de tipos)", async () => {
    await conSemilla();
    // Una escritura por cada tipo enumerado que alcanza una columna concedida.
    for (const sql of [
      `update public.clientes set canal = 'prueba' where id = '${CA}'`,
      `update public.clientes set estado = 'activo' where id = '${CA}'`,
      `update public.licencias set estado = 'suspendida', estado_manual = 'forzar_suspendida' where id = '${LA}'`,
      `insert into public.ordenes (cliente_id, tipo) values ('${CA}', 'reanudar')`,
      `update public.ordenes set estado = 'anulada' where id = '${OA}'`,
      `insert into public.publicaciones (canal, version_id, motivo) values ('prueba', '${VP}', 'vuelta_atras')`,
    ]) {
      expect(await intentar(AD2, sql), sql).toEqual({ filas: 1 });
    }
  });
});

// ---------------------------------------------------------------------------
// Auditoría de las escrituras de la API (D-3)
// ---------------------------------------------------------------------------
describe("auditoría de las escrituras de authenticated (D-3, REQ-017)", () => {
  it("una escritura de AD2 deja 1 fila con el actor, la tabla y el cliente, sin valores", async () => {
    await conSemilla();
    const antes = await contar("auditoria");
    await intentar(
      AD2,
      `update public.reglas_cliente set ventana_dias = 6 where cliente_id = '${CB}'`,
    );
    const r = await db.query(
      "select actor::text as actor, accion, objeto_tipo, objeto_id, cliente_id::text as cliente from public.auditoria order by id desc limit 1",
    );
    expect(r.rows).toEqual([
      { actor: U_AD2, accion: "update", objeto_tipo: "reglas_cliente", objeto_id: CB, cliente: CB },
    ]);
    expect(await contar("auditoria")).toBe(antes + 1);
  });
});

// ---------------------------------------------------------------------------
// Reversibilidad y forma (REQ-029, N-7, L 10, L 11, L 13, L 14)
// ---------------------------------------------------------------------------
describe("ciclo, guarda y todo o nada de M07 (REQ-029, N-7)", () => {
  it("ciclo: el catálogo tras revertir es el de antes y el reaplicado, el primero", async () => {
    await hastaM06(db);
    const c = await ciclo(db, M07());
    expect(c.trasRevertir).toEqual(c.antes);
    expect(c.trasReaplicar).toEqual(c.trasAplicar);
    expect(c.trasAplicar).not.toEqual(c.antes);
  });

  it("tras revertir: 0 políticas, authenticated y service_role sin permisos y sin usage en privado", async () => {
    await hastaM07(db);
    await revertir(db, M07());
    expect(await valor(db, "select count(*)::int from pg_policies")).toBe(0);
    expect(await permisosDe("authenticated")).toEqual([]);
    expect(await permisosDe("service_role")).toEqual([]);
    expect(
      await valor(db, "select has_schema_privilege('authenticated', 'privado', 'usage')"),
    ).toBe(false);
    expect(
      await valor(
        db,
        `select count(*)::int from pg_proc where pronamespace = 'privado'::regnamespace
            and proname in ('es_admin', 'clientes_del_usuario', 'al_dar_de_baja')`,
      ),
    ).toBe(0);
    // Las tablas conservan RLS.
    expect(
      await valor(
        db,
        `select count(*)::int from pg_class where relnamespace = 'public'::regnamespace
            and relkind = 'r' and not relrowsecurity`,
      ),
    ).toBe(0);
  });

  it("revertir con datos no borra ninguna fila (ni de la auditoría) y se puede reaplicar", async () => {
    await conSemilla();
    const antes = await firma();
    await revertir(db, M07());
    expect(await firma()).toEqual(antes);
    await aplicar(db, M07());
    expect(await firma()).toEqual(antes);
    expect(await leer(AD2, "clientes")).toBe(3);
  });

  it("M07 y su reversión son dos sentencias: la guarda y un único bloque do", () => {
    for (const sql of [leerMigracion(M07()), leerReversion(M07())]) {
      expect(dividirSentencias(sql)).toHaveLength(2);
    }
  });

  it("M07 sin M06 falla y no deja nada", async () => {
    for (const m of [M01, M02, M03, M04, M05]) await aplicar(db, m());
    const antes = await instantanea(db);
    expect(await errorDe(() => aplicar(db, M07()))).not.toBeNull();
    expect(await instantanea(db)).toEqual(antes);
  });

  it("M07 con otro rol (también en autocommit) falla con la guarda y no deja nada", async () => {
    await hastaM06(db);
    await db.exec("create role impostor_super superuser nologin");
    const antes = await instantanea(db);
    await db.exec("set role impostor_super");
    try {
      expect(await errorDe(() => aplicar(db, M07()))).toContain("migracion_rol_no_permitido");
      expect(await errorDe(() => ejecutarEnAutocommit(db, leerMigracion(M07())))).toContain(
        "migracion_rol_no_permitido",
      );
    } finally {
      await db.exec("reset role");
    }
    expect(await instantanea(db)).toEqual(antes);
  });

  it("la reversión de M07 con otro rol falla y no cambia nada", async () => {
    await hastaM07(db);
    await db.exec("create role impostor_super superuser nologin");
    const antes = await instantanea(db);
    await db.exec("set role impostor_super");
    try {
      expect(await errorDe(() => ejecutarEnAutocommit(db, leerReversion(M07())))).toContain(
        "migracion_rol_no_permitido",
      );
    } finally {
      await db.exec("reset role");
    }
    expect(await instantanea(db)).toEqual(antes);
  });

  it("con otro destinatario por defecto en tablas, M07 no le deja permisos", async () => {
    await db.exec(
      "alter default privileges for role postgres grant all on tables to conector_prueba",
    );
    await hastaM07(db);
    expect(await permisosDe("conector_prueba")).toEqual([]);
    expect(
      await valor(
        db,
        `select count(*)::int from pg_proc p where p.pronamespace in ('public'::regnamespace, 'privado'::regnamespace)
            and has_function_privilege('conector_prueba', p.oid, 'execute')
            and p.oid in ('privado.es_admin'::regproc, 'privado.clientes_del_usuario'::regproc)`,
      ),
    ).toBe(0);
  });

  it("un destinatario ajeno añadido tras M06 en una tabla de M07 lo retira M07", async () => {
    await hastaM06(db);
    await db.exec("grant select on public.clientes, public.informes to conector_prueba");
    await aplicar(db, M07());
    expect(await permisosDe("conector_prueba")).toEqual([]);
  });

  it("si queda una concesión ajena de tabla con otro concedente, M07 falla en el bucle y no cambia nada", async () => {
    await hastaM06(db);
    // Una concesión con otro concedente no la retira el revoke del dueño. Aquí M07 muere
    // antes de la comprobación final, en el revoke del bucle (el concedente tiene
    // dependientes). La comprobación final no se ejerce con este caso: la ejercen las
    // pruebas de más abajo (M-1 del revisor).
    await db.exec(`
      create role concedente_ajeno nologin;
      grant select on public.clientes to concedente_ajeno with grant option;
      set role concedente_ajeno;
      grant select on public.clientes to anon;
      reset role;
    `);
    const antes = await instantanea(db);
    expect(await errorDe(() => aplicar(db, M07()))).toContain("dependent privileges exist");
    expect(await instantanea(db)).toEqual(antes);
  });

  // La comprobación final de M07 (migracion_concesiones_ajenas): cada caso llega hasta ella,
  // sin morir antes en el bucle, y exige ese mensaje exacto. Si se quita la rama
  // correspondiente de la comprobación, la prueba falla (verificado con mutación local,
  // anotado en verde.md).
  async function fallaPorConcesionesAjenas(preparar: string): Promise<void> {
    await hastaM06(db);
    await db.exec(preparar);
    const antes = await instantanea(db);
    expect(await errorDe(() => aplicar(db, M07()))).toContain("migracion_concesiones_ajenas");
    expect(await instantanea(db)).toEqual(antes);
  }

  it("rama de columnas: un permiso por columna de un rol ajeno hace fallar M07 con migracion_concesiones_ajenas", async () => {
    // Un rol que no figura en la ACL de tabla: el bucle no lo ve y el revoke no lo toca.
    await fallaPorConcesionesAjenas(
      "create role col_ajeno nologin; grant select (nombre) on public.clientes to col_ajeno",
    );
  });

  it("rama de columnas: un permiso por columna de conector_prueba hace fallar M07 con migracion_concesiones_ajenas", async () => {
    // El revoke de tabla del bucle no retira los permisos por columna de este rol.
    await fallaPorConcesionesAjenas("grant select (nombre) on public.clientes to conector_prueba");
  });

  it("rama de columnas: un permiso por columna con otro concedente hace fallar M07 con migracion_concesiones_ajenas", async () => {
    await fallaPorConcesionesAjenas(`
      create role col_concedente nologin;
      grant select (nombre) on public.clientes to col_concedente with grant option;
      set role col_concedente;
      grant select (nombre) on public.clientes to authenticated;
      reset role;`);
  });

  it("rama de funciones: un permiso por defecto de postgres en privado para conector_prueba hace fallar M07 con migracion_concesiones_ajenas", async () => {
    await fallaPorConcesionesAjenas(
      "alter default privileges for role postgres in schema privado grant execute on functions to conector_prueba",
    );
  });

  it("rama de esquema: usage en privado para conector_prueba o para PUBLIC hace fallar M07 con migracion_concesiones_ajenas", async () => {
    await fallaPorConcesionesAjenas("grant usage on schema privado to conector_prueba");
    await db.close();
    db = await crearBase();
    await fallaPorConcesionesAjenas("grant usage on schema privado to public");
  });

  it("rama de esquema: usage con opción de concesión para authenticated antes de M07 también falla", async () => {
    await fallaPorConcesionesAjenas(
      "grant usage on schema privado to authenticated with grant option",
    );
  });

  // Ramas sin caso alcanzable (anotadas, M-1 c): el término «el concedente no es el dueño» de la
  // ACL de tabla y de columna, y el de función, solo se cumplen con un concedente que
  // a su vez figura como destinatario ajeno; esa fila ya la marca el término del
  // destinatario (o el bucle muere antes por permisos dependientes). Se dejan como
  // defensa en profundidad, sin prueba que las distinga.
});

// ---------------------------------------------------------------------------
// Reversión: solo desaparecen los dependientes esperados (M-2 del revisor)
// ---------------------------------------------------------------------------
describe("la reversión de M07 no se lleva dependientes ajenos (M-2)", () => {
  const PREPARACIONES: Record<string, string> = {
    "una vista que usa es_admin()":
      "create view public.vista_ajena as select privado.es_admin() as x",
    "una política de otra tabla que usa es_admin()": `
      create table public.tabla_ajena (id int);
      alter table public.tabla_ajena enable row level security;
      create policy politica_ajena on public.tabla_ajena for select using ((select privado.es_admin()))`,
    "un disparador de otra tabla que usa fijar_autoria()": `
      create table public.tabla_ajena (id int);
      create trigger disparador_ajeno before insert on public.tabla_ajena
        for each row execute function privado.fijar_autoria()`,
    "una restricción que usa es_admin()": `
      create table public.tabla_ajena (id int);
      alter table public.tabla_ajena add constraint restriccion_ajena check (privado.es_admin() or id > 0)`,
  };
  for (const [nombre, sql] of Object.entries(PREPARACIONES)) {
    it(`con ${nombre}, la reversión falla y no cambia nada`, async () => {
      await hastaM07(db);
      await db.exec(sql);
      const antes = await instantanea(db);
      expect(await errorDe(() => revertir(db, M07()))).toContain("reversion_dependientes_ajenos");
      expect(await instantanea(db)).toEqual(antes);
    });
  }

  it("sin dependientes ajenos, la reversión quita exactamente lo de M07 (políticas y disparadores) y nada más", async () => {
    await hastaM06(db);
    const antesM07 = await instantanea(db);
    await aplicar(db, M07());
    await db.exec("create table public.tabla_ajena (id int)");
    const conTabla = await instantanea(db);
    await revertir(db, M07());
    const trasRevertir = await instantanea(db);
    // Solo cambia lo que M07 puso: la tabla ajena y todo lo suyo siguen.
    expect(trasRevertir.tablas).toEqual(conTabla.tablas);
    expect(trasRevertir.politicas).toEqual(antesM07.politicas);
    expect(trasRevertir.disparadores).toEqual(antesM07.disparadores);
  });
});
