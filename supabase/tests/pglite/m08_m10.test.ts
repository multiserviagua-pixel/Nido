// M08 `funciones_conector`, M09 `vistas` y M10 `datos_de_referencia` en PGlite
// (T-006; §5, §9 y §10 de docs/MODELO-DATOS.sql; D-2 1 y 10; D-3; D-9).
// REQ-002, REQ-009, REQ-012, REQ-013, REQ-014, REQ-043, REQ-044, REQ-045, REQ-061,
// REQ-064 · CA-007, CA-009, CA-010, CA-011, CA-038, CA-039.
// Comprueba SQL válido y comportamiento; no sustituye a pgTAP (CI, T-013).
//
// Perfiles: SS (anon), UA, UB, UAB, USV (sin vínculo), AD1 (sin doble factor), AD2
// (con doble factor), CON (conector) y SR (service_role).
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
const M08 = () => nombreDe("funciones_conector");
const M09 = () => nombreDe("vistas");
const M10 = () => nombreDe("datos_de_referencia");

const id = (n: string) => `00000000-0000-4000-8000-${n.padStart(12, "0")}`;
const CA = id("a");
const CB = id("b");
const CC = id("c");
const LA = id("a1");
const LB = id("b1");
const LC = id("c1");
const XA = id("a2");
const XA2 = id("a21");
const XB = id("b2");
const XC = id("c2");
const OA = id("a4");
const OB = id("b4");
const OC = id("c4");
const EA = id("a5");
const EB = id("b5");
const EC = id("c5");
const VP = id("f1");
const U_A = id("1a");
const U_B = id("1b");
const U_AB = id("1c");
const U_SV = id("1d");
const U_AD1 = id("1e");
const U_AD2 = id("1f");
const INEXISTENTE = id("dead");

// Tokens ficticios: solo HMAC en hexadecimal, 64 caracteres.
const TA = "a".repeat(64);
const TA2 = "a1".repeat(32);
const TB = "b".repeat(64);
const TC = "c".repeat(64);
const T_DESCONOCIDO = "d".repeat(64);

const TABLAS = [
  "administradores",
  "ajustes_globales",
  "alertas",
  "auditoria",
  "catalogo_problemas",
  "clientes",
  "clientes_oauth",
  "codigos_activacion",
  "codigos_autorizacion",
  "conexiones",
  "ejecuciones",
  "eventos_stripe",
  "informes",
  "licencias",
  "ordenes",
  "publicaciones",
  "reglas_cliente",
  "suscripciones",
  "tokens",
  "usuarios_cliente",
  "versiones_prompt",
];
const VISTAS = ["resumen_cliente", "metricas_version"];
const MCP = ["mcp_confirmar_orden", "mcp_enviar_informe", "mcp_obtener_instrucciones"] as const;
const CODIGOS_CATALOGO = [
  "conector_humanaia_inestable",
  "error_borrador",
  "error_etiquetado",
  "error_guardar_documento",
  "factura_requiere_acceso",
  "limite_correos_alcanzado",
  "otro",
  "otro_agente_detectado",
  "registro_no_guardado",
  "sin_acceso_almacenamiento",
  "sin_acceso_correo",
  "sin_contexto",
];

let db: Base;
beforeEach(async () => {
  db = await crearBase();
});
afterEach(async () => {
  await db.close();
});

async function hastaM07(base: Base): Promise<void> {
  for (const m of [M01, M02, M03, M04, M05, M06, M07]) await aplicar(base, m());
}
async function hastaM10(base: Base): Promise<void> {
  await hastaM07(base);
  for (const m of [M08, M09, M10]) await aplicar(base, m());
}

/**
 * Tres clientes con licencia, conexión, token, orden pendiente y una ejecución
 * abierta cada uno, una versión publicada y los usuarios. El catálogo y los
 * ajustes los pone M10.
 */
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
  insert into public.conexiones (id, licencia_id) values
    ('${XA}', '${LA}'), ('${XA2}', '${LA}'), ('${XB}', '${LB}'), ('${XC}', '${LC}');
  insert into public.tokens (conexion_id, tipo, token_hmac, recurso, caduca_en) values
    ('${XA}', 'acceso', '${TA}', 'https://ejemplo.invalid/mcp', now() + interval '1 hour'),
    ('${XA2}', 'acceso', '${TA2}', 'https://ejemplo.invalid/mcp', now() + interval '1 hour'),
    ('${XB}', 'acceso', '${TB}', 'https://ejemplo.invalid/mcp', now() + interval '1 hour'),
    ('${XC}', 'acceso', '${TC}', 'https://ejemplo.invalid/mcp', now() + interval '1 hour');
  insert into public.reglas_cliente (cliente_id) values ('${CA}'), ('${CB}');
  insert into public.ordenes (id, cliente_id, tipo) values
    ('${OA}', '${CA}', 'reanudar'), ('${OB}', '${CB}', 'pausar'), ('${OC}', '${CC}', 'reanudar');
  insert into public.ejecuciones (id, conexion_id, cliente_id, estado_servido) values
    ('${EA}', '${XA}', '${CA}', 'activa'), ('${EB}', '${XB}', '${CB}', 'activa'),
    ('${EC}', '${XC}', '${CC}', 'activa');
  insert into public.informes (ejecucion_id, cliente_id, estado, modo, asistente, almacenamiento,
      version_prompt, frecuencia_horas, tratados, sin_tratar, borradores, documentos,
      facturas_pendientes, urgentes, comp_correo, comp_almacenamiento, comp_contexto, comp_registro)
    select e.id, e.cliente_id, 'ok', 'desatendido', 'claude', 'drive', '1.0.0', 24, 2, 1, 3, 4, 0, 0,
           true, true, true, true
      from public.ejecuciones e;
  insert into public.suscripciones (cliente_id, stripe_customer_id) values
    ('${CA}', 'cus_ficticioA'), ('${CB}', 'cus_ficticioB'), ('${CC}', 'cus_ficticioC');
  insert into public.versiones_prompt (id, version, contenido, huella_sha256, commit_sha)
    values ('${VP}', '1.0.0', 'Texto ficticio',
            encode(sha256(convert_to('Texto ficticio', 'UTF8')), 'hex'), 'abcdef1');
  insert into public.publicaciones (canal, version_id) values ('estable', '${VP}');
`;

async function conSemilla(): Promise<void> {
  await hastaM10(db);
  await db.exec(SEMILLA);
}

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

type Resultado = { filas: number; datos: Record<string, unknown>[] } | { codigo: string };
async function intentar(p: Perfil, sql: string, params: unknown[] = []): Promise<Resultado> {
  return como(db, p.rol, p.claims, async () => {
    try {
      const r = await db.query<Record<string, unknown>>(sql, params);
      return { filas: r.rows.length, datos: r.rows };
    } catch (e) {
      return { codigo: (e as { code?: string }).code ?? "sin_codigo" };
    }
  });
}
async function leer(p: Perfil, objeto: string, filtro = ""): Promise<number | string> {
  const r = await intentar(p, `select 1 from public.${objeto} ${filtro}`);
  return "codigo" in r ? r.codigo : r.filas;
}

type Json = Record<string, unknown>;
/** Llama a una función del conector como `conector` y devuelve su respuesta. */
async function llamar(sql: string, params: unknown[]): Promise<Json> {
  const r = await intentar(CON, sql, params);
  if ("codigo" in r) throw new Error(`error ${r.codigo} al llamar a ${sql}`);
  return r.datos[0]!.r as Json;
}
const obtener = (t: string) => llamar("select privado.mcp_obtener_instrucciones($1) as r", [t]);
const enviar = (t: string, e: string, informe: unknown) =>
  llamar("select privado.mcp_enviar_informe($1, $2, $3::jsonb) as r", [
    t,
    e,
    JSON.stringify(informe),
  ]);
const confirmar = (t: string, o: string) =>
  llamar("select privado.mcp_confirmar_orden($1, $2) as r", [t, o]);

const INFORME = {
  estado: "ok",
  modo: "desatendido",
  asistente: "claude",
  almacenamiento: "drive",
  version_prompt: "1.0.0",
  frecuencia_horas: 24,
  tratados: 5,
  sin_tratar: 1,
  borradores: 2,
  documentos: 3,
  facturas_pendientes: 0,
  urgentes: 0,
  comprobaciones: { correo: true, almacenamiento: true, contexto: true, registro: true },
  problemas: [],
};

const contar = (tabla: string) => valor<number>(db, `select count(*)::int from public.${tabla}`);
/** Cuenta y huella de todas las tablas, como dueño. */
async function firma(): Promise<Record<string, string>> {
  const salida: Record<string, string> = {};
  for (const t of TABLAS) {
    const r = await db.query<{ n: number; h: string }>(
      `select count(*)::int as n,
              coalesce(md5(string_agg(x::text, ',' order by x::text)), '') as h
         from public.${t} x`,
    );
    salida[t] = `${r.rows[0]!.n}:${r.rows[0]!.h}`;
  }
  return salida;
}
/** Filas de un cliente en las tablas que las funciones del conector tocan. */
async function firmaDeCliente(c: string): Promise<string> {
  return valor<string>(
    db,
    `select md5(concat(
       (select coalesce(string_agg(x::text, ',' order by x::text), '') from public.ejecuciones x where cliente_id = '${c}'),
       (select coalesce(string_agg(x::text, ',' order by x::text), '') from public.informes x where cliente_id = '${c}'),
       (select coalesce(string_agg(x::text, ',' order by x::text), '') from public.ordenes x where cliente_id = '${c}'),
       (select coalesce(string_agg(x::text, ',' order by x::text), '') from public.conexiones x
          join public.licencias l on l.id = x.licencia_id where l.cliente_id = '${c}')))`,
  );
}

// ---------------------------------------------------------------------------
// M08: permisos del conector (D-9, CA-009, REQ-012, REQ-013)
// ---------------------------------------------------------------------------
describe("el conector no tiene permisos sobre tablas ni vistas (CA-009, REQ-012, REQ-013)", () => {
  it("con set role conector, leer cada tabla y cada vista da 42501 y las tres funciones responden", async () => {
    await conSemilla();
    for (const o of [...TABLAS, ...VISTAS]) expect(await leer(CON, o), o).toBe("42501");
    expect((await obtener(TA)).autorizado).toBe(true);
    expect((await confirmar(TA, OA)).autorizado).toBe(true);
    expect((await enviar(TA, EA, INFORME)).autorizado).toBe(true);
  });

  it("el conector no inserta, borra ni vacía ninguna tabla", async () => {
    await conSemilla();
    for (const o of TABLAS) {
      for (const sql of [
        `insert into public.${o} default values`,
        `delete from public.${o}`,
        `truncate public.${o}`,
      ]) {
        const r = await intentar(CON, sql);
        expect(r, `${o}: ${sql}`).toEqual({ codigo: "42501" });
      }
    }
  });

  it("los privilegios de tabla, vista y columna del conector son 0 (aclexplode y has_*_privilege)", async () => {
    await hastaM10(db);
    expect(
      await valor(
        db,
        `select count(*)::int
           from pg_class c cross join lateral aclexplode(c.relacl) a
          where c.relnamespace in ('public'::regnamespace, 'privado'::regnamespace)
            and a.grantee = 'conector'::regrole`,
      ),
    ).toBe(0);
    expect(
      await valor(
        db,
        `select count(*)::int
           from pg_attribute t cross join lateral aclexplode(t.attacl) a
          where a.grantee = 'conector'::regrole`,
      ),
    ).toBe(0);
    for (const o of [...TABLAS, ...VISTAS]) {
      expect(
        await valor(
          db,
          `select has_table_privilege('conector', 'public.${o}', 'select, insert, update, delete, truncate, references, trigger')`,
        ),
        o,
      ).toBe(false);
    }
  });

  it("lo que ejecuta el conector en public y privado son exactamente las tres mcp_* (D-9); usage solo en privado", async () => {
    await hastaM10(db);
    const r = await db.query<{ n: string }>(
      `select n.nspname || '.' || p.proname as n
         from pg_proc p join pg_namespace n on n.oid = p.pronamespace
        where n.nspname in ('public', 'privado')
          and has_function_privilege('conector', p.oid, 'execute')
        order by 1`,
    );
    expect(r.rows.map((x) => x.n)).toEqual(MCP.map((f) => `privado.${f}`));
    expect(await valor(db, "select has_schema_privilege('conector', 'privado', 'usage')")).toBe(
      true,
    );
    expect(await valor(db, "select has_schema_privilege('conector', 'privado', 'create')")).toBe(
      false,
    );
    expect(await valor(db, "select has_schema_privilege('conector', 'public', 'create')")).toBe(
      false,
    );
  });

  it("licencia_vigente(), resolver_token() y registrar_auditoria() no los ejecuta nadie de la API ni el conector", async () => {
    await conSemilla();
    for (const rol of ["conector", "anon", "authenticated", "service_role"]) {
      for (const f of [
        "privado.licencia_vigente(uuid)",
        "privado.resolver_token(text)",
        "privado.registrar_auditoria(text, text, text, uuid)",
      ]) {
        expect(
          await valor(db, `select has_function_privilege('${rol}', '${f}', 'execute')`),
          `${rol} ${f}`,
        ).toBe(false);
      }
    }
    const r = await intentar(CON, "select * from privado.resolver_token($1)", [TA]);
    expect(r).toEqual({ codigo: "42501" });
  });

  it("anon, authenticated y service_role no pueden ejecutar las tres funciones (CA-009)", async () => {
    await conSemilla();
    const LLAMADAS: [string, unknown[]][] = [
      ["select privado.mcp_obtener_instrucciones($1)", [TA]],
      ["select privado.mcp_confirmar_orden($1, $2)", [TA, OA]],
      ["select privado.mcp_enviar_informe($1, $2, $3::jsonb)", [TA, EA, "{}"]],
    ];
    for (const p of [SS, UA, AD2, SR]) {
      for (const [sql, args] of LLAMADAS) {
        expect(await intentar(p, sql, args), `${p.rol} ${sql}`).toEqual({ codigo: "42501" });
      }
    }
    // PUBLIC no tiene execute: ni siquiera un rol sin nada más.
    for (const f of MCP) {
      expect(
        await valor(
          db,
          `select count(*)::int from pg_proc p cross join lateral aclexplode(p.proacl) a
            where p.proname = '${f}' and a.grantee = 0`,
        ),
        f,
      ).toBe(0);
    }
  });

  it("las funciones de M08: dueño postgres, security definer, ruta fija y ACL = dueño y, solo las mcp_*, conector", async () => {
    await hastaM10(db);
    const r = await db.query<{
      proname: string;
      dueno: string;
      prosecdef: boolean;
      config: string;
      destinos: string;
    }>(
      `select p.proname, p.proowner::regrole::text as dueno, p.prosecdef, p.proconfig::text as config,
              coalesce((select string_agg(coalesce(g.rolname, 'PUBLIC') || ':' || a.privilege_type, ',' order by a.privilege_type)
                          from aclexplode(p.proacl) a left join pg_roles g on g.oid = a.grantee
                         where a.grantee <> p.proowner), '') as destinos
         from pg_proc p
        where p.pronamespace = 'privado'::regnamespace
          and p.proname in ('licencia_vigente', 'resolver_token', 'mcp_obtener_instrucciones',
                            'mcp_enviar_informe', 'mcp_confirmar_orden')
        order by 1`,
    );
    expect(r.rows.map((x) => x.proname)).toEqual([
      "licencia_vigente",
      "mcp_confirmar_orden",
      "mcp_enviar_informe",
      "mcp_obtener_instrucciones",
      "resolver_token",
    ]);
    for (const f of r.rows) {
      expect(f.dueno, f.proname).toBe("postgres");
      expect(f.prosecdef, f.proname).toBe(true);
      expect(String(f.config).replace(/[" ]/g, ""), f.proname).toBe(
        "{search_path=pg_catalog,pg_temp}",
      );
      expect(f.destinos, f.proname).toBe(f.proname.startsWith("mcp_") ? "conector:EXECUTE" : "");
    }
  });

  it("las tres funciones no tienen parámetros de cliente ni de licencia y no leen auth.* (REQ-013, CA-009)", async () => {
    await hastaM10(db);
    const r = await db.query<{ proname: string; args: string; src: string }>(
      `select proname, coalesce(array_to_string(proargnames, ','), '') as args, prosrc as src
         from pg_proc
        where pronamespace = 'privado'::regnamespace and proname like 'mcp\\_%' order by 1`,
    );
    expect(r.rows.map((x) => [x.proname, x.args])).toEqual([
      ["mcp_confirmar_orden", "p_token_hmac,p_orden_id"],
      ["mcp_enviar_informe", "p_token_hmac,p_ejecucion_id,p_informe"],
      ["mcp_obtener_instrucciones", "p_token_hmac"],
    ]);
    for (const f of r.rows) {
      expect(f.args).not.toMatch(/cliente|licencia/);
      expect(f.src, f.proname).not.toMatch(/\bauth\s*\./i);
      expect(f.src, f.proname).not.toMatch(/\bcurrent_setting\b|request\.jwt/i);
    }
    // Su cuerpo no usa nombres sin calificar de public ni de privado (N-3).
    const todos = await db.query<{ proname: string; src: string }>(
      `select proname, prosrc as src from pg_proc
        where pronamespace = 'privado'::regnamespace
          and proname in ('licencia_vigente', 'resolver_token', 'mcp_obtener_instrucciones',
                          'mcp_enviar_informe', 'mcp_confirmar_orden')`,
    );
    const TABLAS_Y_TIPOS =
      "tokens|conexiones|licencias|clientes|ordenes|ejecuciones|informes|publicaciones|versiones_prompt|reglas_cliente|ajustes_globales|catalogo_problemas|estado_cliente|canal|tipo_orden|estado_orden|estado_servido|estado_informe|modo_ejecucion|asistente|almacenamiento|licencia_vigente|resolver_token";
    for (const f of todos.rows) {
      const sinCalificar = new RegExp(
        `(?<![\\w.])(?:from|join|update|into|table)\\s+(?:${TABLAS_Y_TIPOS})\\b|::(?:${TABLAS_Y_TIPOS})\\b`,
        "i",
      );
      expect(f.src, f.proname).not.toMatch(sinCalificar);
    }
  });
});

// ---------------------------------------------------------------------------
// M08: aislamiento por token (CA-007, CA-010; REQ-009, REQ-043)
// ---------------------------------------------------------------------------
describe("el cliente sale del token, nunca de la entrada (CA-007, CA-010; REQ-009, REQ-043, REQ-044)", () => {
  it("obtener_instrucciones con token de A: estado activa, ejecución nueva de A, versión y reglas; B no cambia", async () => {
    await conSemilla();
    const antesB = await firmaDeCliente(CB);
    const antesC = await firmaDeCliente(CC);
    const nEjec = await contar("ejecuciones");
    const r = await obtener(TA);
    expect(r.autorizado).toBe(true);
    expect(r.estado).toBe("activa");
    expect(await contar("ejecuciones")).toBe(nEjec + 1);
    expect(
      await valor(
        db,
        `select cliente_id::text || ':' || conexion_id::text || ':' || estado_servido::text
           from public.ejecuciones where id = $1`,
        [r.ejecucion_id],
      ),
    ).toBe(`${CA}:${XA}:activa`);
    expect(r.instrucciones).toMatchObject({
      version: "1.0.0",
      prompt: "Texto ficticio",
      reglas: {
        max_correos_por_revision: 30,
        ventana_dias: 3,
        guardar_adjuntos: true,
        preparar_borradores: true,
        descargar_facturas_por_enlace: true,
      },
    });
    expect((r.instrucciones as Json).huella_sha256).toMatch(/^[0-9a-f]{64}$/);
    expect(r.orden).toEqual({ id: OA, tipo: "reanudar" });
    expect(await firmaDeCliente(CB)).toBe(antesB);
    expect(await firmaDeCliente(CC)).toBe(antesC);
  });

  it("confirmar_orden con token de A y la orden de B es igual que con una inexistente y no cambia ninguna fila de B", async () => {
    await conSemilla();
    const antes = await firma();
    const deB = await confirmar(TA, OB);
    const inexistente = await confirmar(TA, INEXISTENTE);
    expect(deB).toEqual(inexistente);
    expect(deB).toEqual({ autorizado: true, confirmada: false, repetida: false });
    expect(await firma()).toEqual(antes);
  });

  it("enviar_informe con token de A y la ejecución de B es igual que con una inexistente y no cambia ninguna fila de B", async () => {
    await conSemilla();
    const antes = await firma();
    const deB = await enviar(TA, EB, INFORME);
    const inexistente = await enviar(TA, INEXISTENTE, INFORME);
    expect(deB).toEqual(inexistente);
    expect(deB).toEqual({ autorizado: true, guardado: false, motivo: "ejecucion_desconocida" });
    expect(await firma()).toEqual(antes);
  });

  it("la ejecución de otra conexión del mismo cliente tampoco vale (misma conexión, REQ-009)", async () => {
    await conSemilla();
    // EA es de la conexión XA; el token TA2 es de XA2, otra conexión de A.
    expect(await enviar(TA2, EA, INFORME)).toEqual({
      autorizado: true,
      guardado: false,
      motivo: "ejecucion_desconocida",
    });
  });

  it("confirmar la propia orden la confirma, y repetirlo no falla y avisa de la repetición", async () => {
    await conSemilla();
    expect(await confirmar(TA, OA)).toEqual({
      autorizado: true,
      confirmada: true,
      repetida: false,
    });
    expect(await confirmar(TA, OA)).toEqual({ autorizado: true, confirmada: true, repetida: true });
    expect(await valor(db, `select estado::text from public.ordenes where id = '${OA}'`)).toBe(
      "confirmada",
    );
    expect(await valor(db, `select estado::text from public.ordenes where id = '${OB}'`)).toBe(
      "pendiente",
    );
  });

  it("un token de A no resuelve a ningún identificador de B (resolver_token como dueño)", async () => {
    await conSemilla();
    const r = await db.query<{ conexion_id: string; licencia_id: string; cliente_id: string }>(
      "select * from privado.resolver_token($1)",
      [TA],
    );
    expect(r.rows).toEqual([{ conexion_id: XA, licencia_id: LA, cliente_id: CA }]);
  });

  it("tokens no válidos dan {autorizado: false} sin abrir ejecución: desconocido, caducado, revocado, de renovación, sustituido, conexión revocada, licencia revocada", async () => {
    await conSemilla();
    const casos: [string, string, string][] = [
      ["desconocido", T_DESCONOCIDO, ""],
      [
        "caducado",
        TA,
        `update public.tokens set caduca_en = now() - interval '1 second' where token_hmac = '${TA}'`,
      ],
      ["revocado", TA, `update public.tokens set revocado_en = now() where token_hmac = '${TA}'`],
      [
        "de renovación",
        TA,
        `update public.tokens set tipo = 'renovacion' where token_hmac = '${TA}'`,
      ],
      [
        "sustituido",
        TA,
        `update public.tokens set sustituido_por = (select id from public.tokens where token_hmac = '${TB}'),
                sustituido_en = now() where token_hmac = '${TA}'`,
      ],
      [
        "conexión revocada",
        TA,
        `update public.conexiones set revocada_en = now() where id = '${XA}'`,
      ],
      [
        "licencia revocada",
        TA,
        `update public.licencias set estado = 'revocada' where id = '${LA}'`,
      ],
    ];
    for (const [nombre, token, prep] of casos) {
      await db.close();
      db = await crearBase();
      await conSemilla();
      if (prep !== "") await db.exec(prep);
      const antes = await firma();
      const fallo = { autorizado: false };
      expect(await obtener(token), nombre).toEqual(fallo);
      expect(await confirmar(token, OA), nombre).toEqual(fallo);
      expect(await enviar(token, EA, INFORME), nombre).toEqual(fallo);
      expect(await firma(), nombre).toEqual(antes);
    }
  });

  it("una licencia suspendida se resuelve: estado suspendida, ejecución abierta, sin instrucciones y la orden no se entrega", async () => {
    await conSemilla();
    await db.exec(`update public.licencias set estado = 'suspendida' where id = '${LA}'`);
    const r = await obtener(TA);
    expect(r.autorizado).toBe(true);
    expect(r.estado).toBe("suspendida");
    expect(r.instrucciones).toBeNull();
    expect(r.orden).toBeNull();
    expect(await valor(db, `select estado::text from public.ordenes where id = '${OA}'`)).toBe(
      "pendiente",
    );
  });

  it("licencia caducada o forzada: manual manda sobre el automático (licencia_vigente)", async () => {
    await conSemilla();
    await db.exec(
      `update public.licencias set caduca_en = now() - interval '1 day' where id = '${LA}'`,
    );
    expect((await obtener(TA)).estado).toBe("suspendida");
    await db.exec(`update public.licencias set estado_manual = 'forzar_activa' where id = '${LA}'`);
    expect((await obtener(TA)).estado).toBe("activa");
    await db.exec(
      `update public.licencias set caduca_en = null, estado_manual = 'forzar_suspendida' where id = '${LA}'`,
    );
    expect((await obtener(TA)).estado).toBe("suspendida");
    // licencia_vigente de una licencia que no existe: falso (cierra en fallo).
    expect(await valor(db, `select privado.licencia_vigente('${INEXISTENTE}')`)).toBe(false);
  });

  it("la orden de pausa pone el estado pausada y se entrega una vez; la pausa global también", async () => {
    await conSemilla();
    const r = await obtener(TB);
    expect(r.estado).toBe("pausada");
    expect(r.instrucciones).toBeNull();
    expect(r.orden).toEqual({ id: OB, tipo: "pausar" });
    expect(await valor(db, `select estado::text from public.ordenes where id = '${OB}'`)).toBe(
      "entregada",
    );
    expect((await obtener(TB)).orden).toEqual({ id: OB, tipo: "pausar" });
    expect((await obtener(TA)).estado).toBe("activa");
    expect(await valor(db, `select estado::text from public.ordenes where id = '${OA}'`)).toBe(
      "entregada",
    );
    await db.exec("update public.ajustes_globales set pausa_global = true");
    expect((await obtener(TA)).estado).toBe("pausada");
  });

  it("el canal de prueba sirve la versión estable si no tiene nada publicado", async () => {
    await conSemilla();
    await db.exec(`update public.clientes set canal = 'prueba' where id = '${CC}'`);
    const r = await obtener(TC);
    expect(r.estado).toBe("activa");
    expect((r.instrucciones as Json).version).toBe("1.0.0");
  });

  it("sin versión publicada: pausada y sin instrucciones (cierra en fallo)", async () => {
    await hastaM10(db);
    await db.exec(SEMILLA.replace(/insert into public\.publicaciones[^;]*;/, ""));
    const r = await obtener(TA);
    expect(r.estado).toBe("pausada");
    expect(r.instrucciones).toBeNull();
  });

  it("cada una de las tres deja 0 filas de auditoría, también al escribir (REQ-061, CA-038)", async () => {
    await conSemilla();
    const antes = await contar("auditoria");
    const r = await obtener(TA);
    await confirmar(TA, OA);
    await enviar(TA, r.ejecucion_id as string, INFORME);
    await enviar(TB, EA, INFORME);
    await obtener(T_DESCONOCIDO);
    expect(await contar("auditoria")).toBe(antes);
    // Y escribieron de verdad.
    expect(
      await valor(db, `select count(*)::int from public.informes where cliente_id = '${CA}'`),
    ).toBe(2);
  });
});

// ---------------------------------------------------------------------------
// M08: cliente de baja (REQ-064; condición heredada de T-005)
// ---------------------------------------------------------------------------
describe("cliente de baja: las tres responden {autorizado: false} (REQ-064)", () => {
  async function darDeBajaSinRevocar(cliente: string): Promise<void> {
    // Peor caso (CA-039): la baja llega sin que se haya revocado la conexión.
    await db.exec(`
      alter table public.clientes disable trigger clientes_al_dar_de_baja;
      update public.clientes set estado = 'baja' where id = '${cliente}';
      alter table public.clientes enable trigger clientes_al_dar_de_baja;`);
  }

  it("con la conexión sin revocar, no se abre ejecución ni se cambia nada, y resolver_token() no devuelve filas", async () => {
    await conSemilla();
    await darDeBajaSinRevocar(CA);
    expect(
      await valor(
        db,
        `select count(*)::int from public.conexiones where id = '${XA}' and revocada_en is null`,
      ),
    ).toBe(1);
    const antes = await firma();
    const fallo = { autorizado: false };
    expect(await obtener(TA)).toEqual(fallo);
    expect(await confirmar(TA, OA)).toEqual(fallo);
    expect(await enviar(TA, EA, INFORME)).toEqual(fallo);
    expect(await firma()).toEqual(antes);
    expect(await valor(db, "select count(*)::int from privado.resolver_token($1)", [TA])).toBe(0);
    // El token de otro cliente activo sigue sirviendo.
    expect((await obtener(TC)).estado).toBe("activa");
  });

  it("con la baja hecha por la API (revoca las conexiones) también", async () => {
    await conSemilla();
    await db.exec(`update public.clientes set estado = 'baja' where id = '${CA}'`);
    expect(await obtener(TA)).toEqual({ autorizado: false });
    expect(await obtener(TA2)).toEqual({ autorizado: false });
  });

  it("la baja tras emitir el token surte efecto en la siguiente llamada (se comprueba en cada llamada)", async () => {
    await conSemilla();
    expect((await obtener(TA)).autorizado).toBe(true);
    await darDeBajaSinRevocar(CA);
    expect((await obtener(TA)).autorizado).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// M08: enviar_informe, errores y N-6, y sombras en pg_temp (N-3)
// ---------------------------------------------------------------------------
describe("enviar_informe (REQ-014, REQ-020, REQ-021; N-6)", () => {
  it("guarda el informe de la ejecución de su conexión, cierra la ejecución y descarta campos ajenos sin guardarlos", async () => {
    await conSemilla();
    const e = (await obtener(TA)).ejecucion_id as string;
    const r = await enviar(TA, e, {
      ...INFORME,
      asunto: "Asunto ficticio ajeno",
      comprobaciones: { correo: true, contexto: false, extra: true },
      problemas: ["sin_acceso_correo", "inventado", "sin_acceso_correo", "otro"],
    });
    expect(r).toEqual({ autorizado: true, guardado: true, repetido: false, campos_descartados: 2 });
    const f = await db.query<Record<string, unknown>>(
      "select * from public.informes where ejecucion_id = $1",
      [e],
    );
    expect(f.rows).toHaveLength(1);
    expect(f.rows[0]).toMatchObject({
      cliente_id: CA,
      problemas: ["otro", "sin_acceso_correo"],
      campos_descartados: 2,
      comp_correo: true,
      comp_almacenamiento: false,
      comp_contexto: false,
    });
    expect(JSON.stringify(f.rows[0])).not.toContain("ficticio ajeno");
    expect(
      await valor(db, "select cerrada_en is not null from public.ejecuciones where id = $1", [e]),
    ).toBe(true);
  });

  it("repetir con la misma ejecución no duplica nada y avisa de la repetición", async () => {
    await conSemilla();
    const e = (await obtener(TA)).ejecucion_id as string;
    expect((await enviar(TA, e, INFORME)).repetido).toBe(false);
    const n = await contar("informes");
    expect(await enviar(TA, e, { ...INFORME, tratados: 9 })).toMatchObject({
      guardado: true,
      repetido: true,
    });
    expect(await contar("informes")).toBe(n);
    expect(
      await valor(db, "select tratados::int from public.informes where ejecucion_id = $1", [e]),
    ).toBe(5);
  });

  it("un informe que no es un objeto da informe_invalido y no guarda", async () => {
    await conSemilla();
    const e = (await obtener(TA)).ejecucion_id as string;
    const n = await contar("informes");
    for (const malo of [[1, 2], "texto", 5, null]) {
      expect(await enviar(TA, e, malo)).toEqual({
        autorizado: true,
        guardado: false,
        motivo: "informe_invalido",
      });
    }
    expect(await contar("informes")).toBe(n);
  });

  it("una violación de restricción o de tipo dentro de la función devuelve solo el código, nunca el valor ni el DETAIL (N-6)", async () => {
    await conSemilla();
    const e = (await obtener(TA)).ejecucion_id as string;
    const n = await contar("informes");
    const MALOS: Json[] = [
      { ...INFORME, tratados: 987654 }, // check de rango
      { ...INFORME, estado: "valor-secreto-ficticio" }, // enumerado
      { ...INFORME, frecuencia_horas: "valor-secreto-ficticio" }, // tipo
      { ...INFORME, version_prompt: "valor-secreto-ficticio" }, // formato
      { ...INFORME, tratados: null }, // not null
      { ...INFORME, version_prompt: undefined },
    ];
    for (const malo of MALOS) {
      const crudo = await intentar(
        CON,
        "select privado.mcp_enviar_informe($1, $2, $3::jsonb) as r",
        [TA, e, JSON.stringify(malo)],
      );
      expect("codigo" in crudo, JSON.stringify(malo)).toBe(false);
      const texto = JSON.stringify((crudo as { datos: unknown[] }).datos);
      expect((crudo as unknown as { datos: { r: unknown }[] }).datos).toEqual([
        { r: { autorizado: true, guardado: false, motivo: "informe_invalido" } },
      ]);
      expect(texto).not.toMatch(/secreto|987654|Failing row|DETAIL/);
    }
    expect(await contar("informes")).toBe(n);
  });

  it("un error inesperado (no del informe) devuelve solo el código error_interno, sin DETAIL, y no guarda nada", async () => {
    await conSemilla();
    const e = (await obtener(TA)).ejecucion_id as string;
    await db.exec(`
      create function public.rompe_ficticio() returns trigger language plpgsql as $f$
      begin
        raise exception 'rotura ficticia' using detail = 'valor-secreto-ficticio', errcode = '22012';
      end $f$;
      create trigger rompe_ficticio before update on public.ejecuciones
        for each row execute function public.rompe_ficticio();`);
    const n = await contar("informes");
    const r = await intentar(CON, "select privado.mcp_enviar_informe($1, $2, $3::jsonb) as r", [
      TA,
      e,
      JSON.stringify(INFORME),
    ]);
    expect("codigo" in r).toBe(false);
    const texto = JSON.stringify((r as { datos: unknown[] }).datos);
    expect((r as unknown as { datos: { r: unknown }[] }).datos).toEqual([
      { r: { autorizado: true, guardado: false, motivo: "error_interno" } },
    ]);
    expect(texto).not.toMatch(/secreto|ficticia/);
    expect(await contar("informes")).toBe(n);
  });

  it("un error inesperado en obtener_instrucciones y confirmar_orden también devuelve solo el código y deja todo como estaba", async () => {
    await conSemilla();
    await db.exec(`
      create function public.rompe_ficticio() returns trigger language plpgsql as $f$
      begin
        raise exception 'rotura ficticia' using detail = 'valor-secreto-ficticio', errcode = '23514';
      end $f$;
      create trigger rompe_ficticio_e before insert on public.ejecuciones
        for each row execute function public.rompe_ficticio();
      create trigger rompe_ficticio_o before update on public.ordenes
        for each row execute function public.rompe_ficticio();`);
    const antes = await firma();
    for (const [sql, args] of [
      ["select privado.mcp_obtener_instrucciones($1) as r", [TA]],
      ["select privado.mcp_confirmar_orden($1, $2) as r", [TA, OA]],
    ] as const) {
      const r = await intentar(CON, sql, [...args]);
      expect("codigo" in r, sql).toBe(false);
      const texto = JSON.stringify((r as { datos: unknown[] }).datos);
      expect(texto, sql).toMatch(/"error_interno"/);
      expect(texto, sql).not.toMatch(/secreto|ficticia/);
    }
    expect(await firma()).toEqual(antes);
  });

  it("N-3: con tablas homónimas en pg_temp de la sesión, las tres funciones responden igual y no las tocan", async () => {
    await conSemilla();
    await db.exec(`
      create temp table tokens (like public.tokens);
      create temp table conexiones (like public.conexiones);
      create temp table licencias (like public.licencias);
      create temp table clientes (like public.clientes);
      create temp table ordenes (like public.ordenes);
      create temp table ejecuciones (like public.ejecuciones);
      create temp table informes (like public.informes);
      create temp table publicaciones (like public.publicaciones);
      create temp table versiones_prompt (like public.versiones_prompt);
      create temp table reglas_cliente (like public.reglas_cliente);
      create temp table ajustes_globales (like public.ajustes_globales);
      create temp table catalogo_problemas (like public.catalogo_problemas);`);
    const r = await obtener(TA);
    expect(r.estado).toBe("activa");
    expect(await confirmar(TA, OA)).toMatchObject({ confirmada: true });
    await enviar(TA, r.ejecucion_id as string, INFORME);
    for (const t of [
      "tokens",
      "conexiones",
      "licencias",
      "clientes",
      "ordenes",
      "ejecuciones",
      "informes",
      "publicaciones",
      "versiones_prompt",
      "reglas_cliente",
      "ajustes_globales",
      "catalogo_problemas",
    ]) {
      expect(await valor(db, `select count(*)::int from pg_temp.${t}`), t).toBe(0);
    }
    expect(
      await valor(db, `select count(*)::int from public.informes where cliente_id = '${CA}'`),
    ).toBe(2);
  });
});

// ---------------------------------------------------------------------------
// M09: vistas (D-2 1, REQ-005; CA-005, CA-006)
// ---------------------------------------------------------------------------
const RESUMEN = `select cliente_id, nombre, estado_cliente::text, licencia_vigente, en_pausa,
  ultimo_estado::text, ultima_version, revisiones_30d::int, tratados_30d::int, borradores_30d::int,
  documentos_30d::int, estado_suscripcion::text from public.resumen_cliente`;
const METRICAS = `select version_prompt, revisiones::int, correctas::int, tratados::int, clientes::int
  from public.metricas_version`;
describe("vistas con security_invoker y permisos cerrados (D-2, 1)", () => {
  it("las dos vistas tienen security_invoker = true y son de postgres", async () => {
    await hastaM10(db);
    const r = await db.query<{ relname: string; opciones: string; dueno: string; tipo: string }>(
      `select relname, reloptions::text as opciones, relowner::regrole::text as dueno, relkind::text as tipo
         from pg_class where relnamespace = 'public'::regnamespace and relkind = 'v' order by 1`,
    );
    expect(r.rows).toEqual([
      {
        relname: "metricas_version",
        opciones: "{security_invoker=true}",
        dueno: "postgres",
        tipo: "v",
      },
      {
        relname: "resumen_cliente",
        opciones: "{security_invoker=true}",
        dueno: "postgres",
        tipo: "v",
      },
    ]);
  });

  it("solo authenticated tiene select (sin columnas sueltas): anon, service_role y conector, 42501", async () => {
    await conSemilla();
    const r = await db.query<{ relname: string; destino: string; privilegio: string }>(
      `select c.relname, coalesce(g.rolname, 'PUBLIC') as destino, a.privilege_type as privilegio
         from pg_class c cross join lateral aclexplode(c.relacl) a
         left join pg_roles g on g.oid = a.grantee
        where c.relnamespace = 'public'::regnamespace and c.relkind = 'v' and a.grantee <> c.relowner
        order by 1, 2, 3`,
    );
    expect(r.rows).toEqual([
      { relname: "metricas_version", destino: "authenticated", privilegio: "SELECT" },
      { relname: "resumen_cliente", destino: "authenticated", privilegio: "SELECT" },
    ]);
    expect(
      await valor(
        db,
        `select count(*)::int from pg_attribute t join pg_class c on c.oid = t.attrelid
          where c.relnamespace = 'public'::regnamespace and c.relkind = 'v' and t.attacl is not null`,
      ),
    ).toBe(0);
    for (const p of [SS, SR, CON]) {
      for (const v of VISTAS) expect(await leer(p, v), `${p.rol} ${v}`).toBe("42501");
    }
  });

  it("nadie escribe en las vistas: authenticated solo tiene select", async () => {
    await hastaM10(db);
    for (const v of VISTAS) {
      for (const rol of ["authenticated", "anon", "service_role", "conector"]) {
        expect(
          await valor(
            db,
            `select has_table_privilege('${rol}', 'public.${v}', 'insert, update, delete, truncate, references, trigger')`,
          ),
          `${rol} ${v}`,
        ).toBe(false);
      }
      expect(
        await valor(db, `select has_table_privilege('authenticated', 'public.${v}', 'select')`),
      ).toBe(true);
    }
  });

  it("las vistas no exponen ordenes.creada_por ni licencias.estado_manual (condición de T-005)", async () => {
    await hastaM10(db);
    const r = await db.query<{ attname: string }>(
      `select a.attname from pg_attribute a join pg_class c on c.oid = a.attrelid
        where c.relnamespace = 'public'::regnamespace and c.relkind = 'v'
          and a.attnum > 0 and not a.attisdropped order by 1`,
    );
    const columnas = r.rows.map((x) => x.attname);
    expect(columnas).not.toContain("creada_por");
    expect(columnas).not.toContain("estado_manual");
    expect(columnas).not.toContain("resuelta_por");
    expect(columnas).not.toContain("codigo_hmac");
    expect(columnas).not.toContain("token_hmac");
  });

  it("resumen_cliente da a UA lo mismo que sus tablas (solo A) y 0 de B, también filtrando por B", async () => {
    await conSemilla();
    const ua = (await intentar(UA, RESUMEN)) as {
      datos: Json[];
    };
    expect(ua.datos).toHaveLength(1);
    expect(ua.datos[0]).toMatchObject({
      cliente_id: CA,
      nombre: "Cliente A ficticio",
      estado_cliente: "activo",
      licencia_vigente: true,
      en_pausa: false,
      ultimo_estado: "ok",
      ultima_version: "1.0.0",
      revisiones_30d: 1,
      tratados_30d: 2,
      borradores_30d: 3,
      documentos_30d: 4,
      estado_suscripcion: null,
    });
    expect(await leer(UA, "resumen_cliente", `where cliente_id = '${CB}'`)).toBe(0);
    expect(await leer(UA, "resumen_cliente", `where cliente_id = '${CC}'`)).toBe(0);
    // Coincide con lo que ve en sus tablas.
    expect(await leer(UA, "clientes")).toBe(1);
    expect(await leer(UA, "informes")).toBe(1);
  });

  it("UB ve solo B; UAB, A y B y 0 de C; USV y AD1, 0; AD2, los tres", async () => {
    await conSemilla();
    expect(await leer(UB, "resumen_cliente")).toBe(1);
    expect(await leer(UB, "resumen_cliente", `where cliente_id = '${CB}'`)).toBe(1);
    expect(await leer(UB, "resumen_cliente", `where cliente_id = '${CA}'`)).toBe(0);
    expect(await leer(UAB, "resumen_cliente")).toBe(2);
    expect(await leer(UAB, "resumen_cliente", `where cliente_id = '${CC}'`)).toBe(0);
    for (const p of [USV, AD1]) {
      expect(await leer(p, "resumen_cliente"), p.rol).toBe(0);
      expect(await leer(p, "metricas_version"), p.rol).toBe(0);
    }
    expect(await leer(AD2, "resumen_cliente")).toBe(3);
  });

  it("metricas_version agrega solo los informes de los clientes que ve quien consulta", async () => {
    await conSemilla();
    const m = async (p: Perfil) => (await intentar(p, METRICAS)) as { datos: Json[] };
    const ua = (await m(UA)).datos;
    expect(ua).toHaveLength(1);
    expect(ua[0]).toMatchObject({
      version_prompt: "1.0.0",
      revisiones: 1,
      correctas: 1,
      tratados: 2,
      clientes: 1,
    });
    expect((await m(UAB)).datos[0]).toMatchObject({ revisiones: 2, tratados: 4, clientes: 2 });
    expect((await m(AD2)).datos[0]).toMatchObject({ revisiones: 3, tratados: 6, clientes: 3 });
    expect((await m(USV)).datos).toHaveLength(0);
  });

  it("un cliente de baja desaparece de las vistas para su usuario y sigue para AD2", async () => {
    await conSemilla();
    await db.exec(`update public.clientes set estado = 'baja' where id = '${CA}'`);
    expect(await leer(UA, "resumen_cliente")).toBe(0);
    expect(await leer(UA, "metricas_version")).toBe(0);
    expect(await leer(AD2, "resumen_cliente", `where cliente_id = '${CA}'`)).toBe(1);
  });

  it("con otro destinatario por defecto en tablas, M09 no le deja permisos sobre las vistas", async () => {
    await db.exec(
      "alter default privileges for role postgres grant all on tables to conector_prueba",
    );
    await hastaM10(db);
    expect(
      await valor(
        db,
        `select count(*)::int from pg_class c cross join lateral aclexplode(c.relacl) a
          where c.relnamespace = 'public'::regnamespace and c.relkind = 'v'
            and a.grantee = 'conector_prueba'::regrole`,
      ),
    ).toBe(0);
  });

  it("M09 sin M06 falla y no deja nada", async () => {
    const m09 = M09();
    for (const m of [M01, M02, M03, M04, M05]) await aplicar(db, m());
    const antes = await instantanea(db);
    expect(await errorDe(() => aplicar(db, m09))).toContain("informes");
    expect(await instantanea(db)).toEqual(antes);
  });
});

// ---------------------------------------------------------------------------
// M10: datos de referencia (§10)
// ---------------------------------------------------------------------------
describe("datos de referencia (M10)", () => {
  it("una fila de ajustes (sin pausa, en observación) y el catálogo exacto del contrato", async () => {
    await hastaM10(db);
    const aj = await db.query<Json>(
      "select id, pausa_global, stripe_en_observacion from public.ajustes_globales",
    );
    expect(aj.rows).toEqual([{ id: true, pausa_global: false, stripe_en_observacion: true }]);
    const cat = await db.query<{ codigo: string; activo: boolean; descripcion: string }>(
      "select codigo, activo, descripcion from public.catalogo_problemas order by 1",
    );
    expect(cat.rows.map((x) => x.codigo)).toEqual(CODIGOS_CATALOGO);
    for (const f of cat.rows) {
      expect(f.activo, f.codigo).toBe(true);
      expect(f.descripcion.length, f.codigo).toBeGreaterThan(0);
    }
  });

  it("M10 no deja auditoría (como dueño, sin auditar) y el resto de M08 a M10 tampoco", async () => {
    await hastaM10(db);
    expect(await contar("auditoria")).toBe(0);
  });

  it("los códigos del catálogo son los del contrato del informe", async () => {
    const { readFileSync } = await import("node:fs");
    const contrato = JSON.parse(
      readFileSync(new URL("../../../contratos/informe.schema.json", import.meta.url), "utf8"),
    ) as { properties: { problemas: { items: { enum: string[] } } } };
    expect([...contrato.properties.problemas.items.enum].sort()).toEqual(CODIGOS_CATALOGO);
  });

  it("un informe con un código del catálogo se acepta y con uno fuera se descarta", async () => {
    await conSemilla();
    const e = (await obtener(TA)).ejecucion_id as string;
    await enviar(TA, e, { ...INFORME, problemas: ["sin_contexto", "no_existe_ficticio"] });
    expect(
      await valor(db, "select problemas::text from public.informes where ejecucion_id = $1", [e]),
    ).toBe("{sin_contexto}");
  });

  it("M10 con otro rol falla con la guarda y no inserta nada", async () => {
    await hastaM07(db);
    await aplicar(db, M08());
    await aplicar(db, M09());
    await db.exec("create role impostor_super superuser nologin");
    await db.exec("set role impostor_super");
    try {
      expect(await errorDe(() => aplicar(db, M10()))).toContain("migracion_rol_no_permitido");
    } finally {
      await db.exec("reset role");
    }
    expect(await contar("catalogo_problemas")).toBe(0);
    expect(await contar("ajustes_globales")).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// Reversibilidad y forma (REQ-029, N-7, L 10, L 11, L 13, L 14)
// ---------------------------------------------------------------------------
describe("ciclo, guarda y todo o nada de M08, M09 y M10 (REQ-029, N-7)", () => {
  const NOMBRES = [
    ["M08", M08],
    ["M09", M09],
    ["M10", M10],
  ] as const;

  it("ciclo de M08: tras revertir, el catálogo es el de antes y el reaplicado, el primero", async () => {
    await hastaM07(db);
    const c = await ciclo(db, M08());
    expect(c.trasRevertir).toEqual(c.antes);
    expect(c.trasReaplicar).toEqual(c.trasAplicar);
    expect(c.trasAplicar).not.toEqual(c.antes);
  });

  it("ciclo de M09", async () => {
    await hastaM07(db);
    await aplicar(db, M08());
    const c = await ciclo(db, M09());
    expect(c.trasRevertir).toEqual(c.antes);
    expect(c.trasReaplicar).toEqual(c.trasAplicar);
    expect(c.trasAplicar).not.toEqual(c.antes);
  });

  it("ciclo de M10: sin filas tras revertir y las mismas tras reaplicar", async () => {
    await hastaM07(db);
    await aplicar(db, M08());
    await aplicar(db, M09());
    const c = await ciclo(db, M10());
    expect(c.trasRevertir).toEqual(c.antes);
    expect(await contar("ajustes_globales")).toBe(1);
    await revertir(db, M10());
    expect(await contar("ajustes_globales")).toBe(0);
    expect(await contar("catalogo_problemas")).toBe(0);
    expect(await contar("auditoria")).toBe(0);
    await aplicar(db, M10());
    expect(await contar("catalogo_problemas")).toBe(12);
  });

  it("revertir M10, M09 y M08 deja el estado de M07 sin apoyarse en el cascade de M07, y luego M07 se revierte", async () => {
    await hastaM07(db);
    const enM07 = await instantanea(db);
    for (const m of [M08, M09, M10]) await aplicar(db, m());
    for (const m of [M10, M09, M08]) await revertir(db, m());
    expect(await instantanea(db)).toEqual(enM07);
    expect(await valor(db, "select has_schema_privilege('conector', 'privado', 'usage')")).toBe(
      false,
    );
    // Las reversiones no dependen del cascade de M07 y M07 sigue revirtiéndose.
    await revertir(db, M07());
  });

  it("las reversiones de M08 y M09 no llevan cascade ni execute (L 10) y no nombran las tablas protegidas", () => {
    for (const m of [M08, M09, M10]) {
      const sql = leerReversion(m()).replace(/--.*$/gm, "").toLowerCase();
      expect(sql).not.toMatch(/\bcascade\b/);
      expect(sql).not.toMatch(/\bexecute\b/);
      expect(sql).not.toMatch(/\b(auditoria|versiones_prompt|publicaciones)\b/);
    }
  });

  it("si algo ajeno depende de una función de M08, su reversión falla sin cambiar nada (sin cascade)", async () => {
    await hastaM10(db);
    await db.exec(
      "create view public.vista_ajena as select privado.licencia_vigente(null::uuid) as x",
    );
    const antes = await instantanea(db);
    expect(await errorDe(() => revertir(db, M08()))).not.toBeNull();
    expect(await instantanea(db)).toEqual(antes);
  });

  it("revertir M08 y M09 con datos no borra ninguna fila y se puede reaplicar", async () => {
    await conSemilla();
    const antes = await firma();
    await revertir(db, M10());
    await revertir(db, M09());
    await revertir(db, M08());
    expect(await firma()).toEqual({ ...antes, ajustes_globales: "0:", catalogo_problemas: "0:" });
    for (const m of [M08, M09, M10]) await aplicar(db, m());
    // ajustes_globales lleva la hora de su inserción: se compara sin ella.
    const sinHora = (f: Record<string, string>) =>
      Object.fromEntries(Object.entries(f).filter(([k]) => k !== "ajustes_globales"));
    const resto = sinHora(await firma());
    const restoAntes = sinHora(antes);
    expect(resto).toEqual(restoAntes);
    expect(await contar("ajustes_globales")).toBe(1);
    expect((await obtener(TA)).estado).toBe("activa");
  });

  it("cada migración y cada reversión son dos sentencias: la guarda y un único bloque do", () => {
    for (const [, m] of NOMBRES) {
      for (const sql of [leerMigracion(m()), leerReversion(m())]) {
        expect(dividirSentencias(sql)).toHaveLength(2);
      }
    }
  });

  it("con otro rol (también en autocommit) las migraciones y las reversiones fallan con la guarda y no cambian nada", async () => {
    await hastaM10(db);
    await db.exec("create role impostor_super superuser nologin");
    const antes = await instantanea(db);
    await db.exec("set role impostor_super");
    try {
      for (const [, m] of NOMBRES) {
        expect(await errorDe(() => aplicar(db, m()))).toContain("migracion_rol_no_permitido");
        expect(await errorDe(() => ejecutarEnAutocommit(db, leerMigracion(m())))).toContain(
          "migracion_rol_no_permitido",
        );
        expect(await errorDe(() => ejecutarEnAutocommit(db, leerReversion(m())))).toContain(
          "migracion_rol_no_permitido",
        );
      }
    } finally {
      await db.exec("reset role");
    }
    expect(await instantanea(db)).toEqual(antes);
    expect(await contar("catalogo_problemas")).toBe(12);
  });

  it("M08 con otro destinatario por defecto de funciones en privado, o con usage ajeno, o con permiso de tabla del conector, falla con migracion_concesiones_ajenas", async () => {
    const casos = [
      "alter default privileges for role postgres in schema privado grant execute on functions to conector_prueba",
      "grant usage on schema privado to conector_prueba",
      "grant usage on schema privado to public",
      "grant select on public.clientes to conector",
      "grant select (nombre) on public.clientes to conector",
      "grant execute on function privado.es_admin() to conector",
    ];
    for (const prep of casos) {
      await db.close();
      db = await crearBase();
      await hastaM07(db);
      await db.exec(prep);
      const antes = await instantanea(db);
      expect(await errorDe(() => aplicar(db, M08())), prep).toContain(
        "migracion_concesiones_ajenas",
      );
      expect(await instantanea(db), prep).toEqual(antes);
    }
  });

  it("un permiso ajeno sobre una función de M07 queda tal cual tras M08 (M08 solo mira lo suyo) y M08 no concede nada a ese rol", async () => {
    await hastaM07(db);
    await db.exec("grant execute on function privado.es_admin() to conector_prueba");
    const cuenta = (f: string) =>
      valor<number>(
        db,
        `select count(*)::int from pg_proc p cross join lateral aclexplode(p.proacl) a
          where p.pronamespace = 'privado'::regnamespace and p.proname = '${f}'
            and a.grantee = 'conector_prueba'::regrole`,
      );
    expect(await cuenta("es_admin")).toBe(1);
    await aplicar(db, M08());
    expect(await cuenta("es_admin")).toBe(1);
    for (const f of [...MCP, "licencia_vigente", "resolver_token"])
      expect(await cuenta(f), f).toBe(0);
  });

  it("si el conector es miembro de algún rol, M08 falla con migracion_concesiones_ajenas y no cambia nada", async () => {
    await hastaM07(db);
    await db.exec("create role rol_ajeno_prueba nologin; grant rol_ajeno_prueba to conector");
    const antes = await instantanea(db);
    expect(await errorDe(() => aplicar(db, M08()))).toContain("migracion_concesiones_ajenas");
    expect(await instantanea(db)).toEqual(antes);
  });

  it("sin fila de ajustes_globales M08 pausa (cierre en fallo, art. 3)", async () => {
    await conSemilla();
    await db.exec("delete from public.ajustes_globales");
    const r = await obtener(TA);
    expect(r.estado).toBe("pausada");
    expect(r.instrucciones ?? null).toBeNull();
  });

  it("empate en creada_en entre dos órdenes: M08 y M09 eligen la de menor id", async () => {
    await conSemilla();
    // OA (reanudar) ya existe; la nueva, de id menor y misma hora, es de pausa.
    await db.exec(
      `insert into public.ordenes (id, cliente_id, tipo, creada_en)
       select '${id("a3")}', '${CA}', 'pausar', creada_en from public.ordenes where id = '${OA}'`,
    );
    const r = await db.query<{ en_pausa: boolean }>(
      `select en_pausa from public.resumen_cliente where cliente_id = '${CA}'`,
    );
    expect(r.rows[0]!.en_pausa).toBe(true);
    expect((await obtener(TA)).orden).toMatchObject({ id: id("a3"), tipo: "pausar" });
  });

  describe("reversión de M10 con datos vivos", () => {
    const casos: [string, string][] = [
      ["pausa_global activa", "update public.ajustes_globales set pausa_global = true"],
      [
        "stripe fuera de observación",
        "update public.ajustes_globales set stripe_en_observacion = false",
      ],
      [
        "código desactivado",
        "update public.catalogo_problemas set activo = false where codigo = 'otro'",
      ],
      [
        "descripción cambiada",
        "update public.catalogo_problemas set descripcion = 'Otra descripcion' where codigo = 'sin_contexto'",
      ],
    ];
    for (const [nombre, sql] of casos) {
      it(`falla sin cambiar nada: ${nombre}`, async () => {
        await hastaM10(db);
        await db.exec(sql);
        const antes = await instantanea(db);
        const filas = await firma();
        expect(await errorDe(() => revertir(db, M10()))).toContain("reversion_datos_modificados");
        expect(await instantanea(db)).toEqual(antes);
        expect(await firma()).toEqual(filas);
      });
    }

    it("con un código añadido por un superadmin, borra solo los doce de M10", async () => {
      await hastaM10(db);
      await db.exec(
        "insert into public.catalogo_problemas (codigo, descripcion) values ('propio', 'Propio')",
      );
      await revertir(db, M10());
      expect(await contar("ajustes_globales")).toBe(0);
      expect(
        await valor<string>(db, "select string_agg(codigo, ',') from public.catalogo_problemas"),
      ).toBe("propio");
    });
  });
});

// ---------------------------------------------------------------------------
// Condiciones del auditor-seguridad sobre T-006 (MAYOR 1, MENORES 2 y 5)
// ---------------------------------------------------------------------------
describe("dictamen del auditor: carreras simuladas y concesiones de PUBLIC (T-006)", () => {
  it("MAYOR 1: si la orden pendiente se anula tras leerla, no se entrega ni cambia de estado", async () => {
    await conSemilla();
    // Simula, sin concurrencia, que el superadmin anula la orden entre la lectura y la
    // marca de entregada: el disparador corre al insertar la ejecución, que va entre ambas.
    await db.exec(`
      create function public.anula_orden_prueba() returns trigger language plpgsql as $$
      begin
        update public.ordenes set estado = 'anulada'
         where cliente_id = new.cliente_id and estado = 'pendiente';
        return null;
      end $$;
      create trigger anula_orden_prueba after insert on public.ejecuciones
        for each row execute function public.anula_orden_prueba();
    `);
    const r = await obtener(TA);
    expect(r.autorizado).toBe(true);
    expect(r.orden ?? null).toBeNull();
    expect(
      await valor<string>(db, `select estado::text from public.ordenes where id = '${OA}'`),
    ).toBe("anulada");
    expect(
      await valor<string | null>(
        db,
        `select entregada_en::text from public.ordenes where id = '${OA}'`,
      ),
    ).toBeNull();
  });

  it("MENOR 2: las tres funciones bloquean con for share la fila del cliente activo antes de escribir; el caso normal no cambia", async () => {
    await conSemilla();
    // Un bloqueo de fila compartido deja un RowShareLock sobre la tabla en pg_locks.
    // Se anota desde un disparador BEFORE al insertar la ejecución: corre antes de la
    // comprobación de la clave ajena, que también toma RowShareLock, así que solo el for share
    // de la función puede haberlo dejado.
    // No se puede simular aquí una baja concurrente sin falsear: queda para pgTAP/CI.
    await db.exec(`
      create table public.traza_prueba (modo text);
      create function public.traza_bloqueo_prueba() returns trigger language plpgsql as $$
      begin
        insert into public.traza_prueba
          select l.mode from pg_catalog.pg_locks l
           where l.pid = pg_catalog.pg_backend_pid()
             and l.relation = 'public.clientes'::regclass
             and l.mode = 'RowShareLock';
        return new;
      end $$;
      create trigger traza_bloqueo_prueba before insert on public.ejecuciones
        for each row execute function public.traza_bloqueo_prueba();
    `);
    const r = await obtener(TA);
    expect(r.estado).toBe("activa");
    expect(await contar("traza_prueba")).toBeGreaterThan(0);
    // Las otras dos: el caso normal sigue igual.
    expect((await confirmar(TA, OA)).confirmada).toBe(true);
    expect((await enviar(TA, EA, INFORME)).guardado).toBe(true);
  });

  for (const prep of [
    "grant select on public.clientes to public",
    "grant update (nombre) on public.clientes to public",
  ]) {
    it(`MENOR 5: «${prep}» antes de M08 lo hace fallar con migracion_concesiones_ajenas`, async () => {
      await hastaM07(db);
      await db.exec(prep);
      const antes = await instantanea(db);
      expect(await errorDe(() => aplicar(db, M08()))).toContain("migracion_concesiones_ajenas");
      expect(await instantanea(db)).toEqual(antes);
    });
  }

  it("MENOR 5: un rol que es miembro del conector (el conector es su roleid) hace fallar M08", async () => {
    await hastaM07(db);
    await db.exec("create role miembro_prueba nologin; grant conector to miembro_prueba");
    expect(await errorDe(() => aplicar(db, M08()))).toContain("migracion_concesiones_ajenas");
  });
});
