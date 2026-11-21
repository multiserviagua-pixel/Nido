// Apoyo común de las pruebas de BD de las tres herramientas (T-103 d, e, f; 001). Valores sembrados
// compuestos en ejecución (arts. 1 y 4). No es una prueba: no termina en .test.ts.
import { createHmac, randomBytes } from "node:crypto";
import { afterAll, expect, vi } from "vitest";
import {
  crearAlmacenPglite,
  crearBd,
  crearFabrica,
  type BdApoyo,
} from "../../../conector/apoyo/index";

// Arrancar PGlite en cada prueba cuesta CPU; en paralelo con otros ficheros supera los 5 s por defecto.
vi.setConfig({ testTimeout: 60_000, hookTimeout: 60_000 });

export const ESQUEMA = "conector_prueba";
export const ROL_MCP = "conector_prueba_mcp";
export const ROL_GESTION = "conector_prueba_gestion";
export const RECURSO = "https://conector.ejemplo.test/api/mcp";
export const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

const clave = randomBytes(32);
export const fabrica = crearFabrica({
  hmac: (m) => createHmac("sha256", clave).update(m).digest("hex"),
});
export const hmacDe = (m: string) => createHmac("sha256", clave).update(m).digest("hex");

const abiertas: BdApoyo[] = [];
export async function abrir(): Promise<BdApoyo> {
  const bd = await crearBd();
  abiertas.push(bd);
  return bd;
}
export function cerrarAlFinal(): void {
  afterAll(async () => {
    while (abiertas.length > 0) await abiertas.pop()?.cerrar();
  });
}

export const una = async <T>(bd: BdApoyo, sql: string, p: unknown[] = []) =>
  (await bd.db.query<T>(sql, p)).rows[0]!;

/** Un cliente OAuth CIMD ficticio y estable: todo token tiene cliente (`tokens.cliente_oauth_id` es not null). */
export async function clienteSemilla(bd: BdApoyo): Promise<string> {
  await bd.db.query(
    `insert into ${ESQUEMA}.clientes_oauth (client_id, origen, redirect_uris, comprobado_en)
     values ('https://semilla.test/oauth', 'cimd', array['https://claude.ai/api/mcp/auth_callback'], now())
     on conflict (client_id) do nothing`,
  );
  return (
    await una<{ id: string }>(
      bd,
      `select id::text from ${ESQUEMA}.clientes_oauth where client_id = 'https://semilla.test/oauth'`,
    )
  ).id;
}

export interface Sembrado {
  licenciaId: string;
  conexionId: string;
  acceso: ReturnType<typeof fabrica.token>;
}

/** Una conexión con un token de acceso vigente (5 minutos desde el reloj de la prueba). */
export async function sembrar(
  bd: BdApoyo,
  tipo: "A" | "B",
  asistente: "claude" | "chatgpt" | "otro" = "claude",
  /** Fábrica con otra clave de HMAC (pruebas del punto MCP, que usa la clave del conector). */
  fab: typeof fabrica = fabrica,
  recurso: string = RECURSO,
): Promise<Sembrado> {
  const { id: licenciaId } = await una<{ id: string }>(
    bd,
    `select id::text from ${ESQUEMA}.licencias where tipo = $1`,
    [tipo],
  );
  const { id: conexionId } = await una<{ id: string }>(
    bd,
    `insert into ${ESQUEMA}.conexiones (licencia_id, asistente) values ($1, $2) returning id::text`,
    [licenciaId, asistente],
  );
  const acceso = fab.token("acceso");
  await bd.db.query(
    `insert into ${ESQUEMA}.tokens (conexion_id, tipo, token_hmac, recurso, caduca_en, cliente_oauth_id)
     values ($1, 'acceso', $2, $3, now() + interval '300 seconds', $4)`,
    [conexionId, acceso.hmac, recurso, await clienteSemilla(bd)],
  );
  return { licenciaId, conexionId, acceso };
}

/** Otra conexión de la misma licencia, con su propio token de acceso vigente. */
export async function otraConexion(
  bd: BdApoyo,
  licenciaId: string,
): Promise<{ conexionId: string; acceso: ReturnType<typeof fabrica.token> }> {
  const { id: conexionId } = await una<{ id: string }>(
    bd,
    `insert into ${ESQUEMA}.conexiones (licencia_id) values ($1) returning id::text`,
    [licenciaId],
  );
  const acceso = fabrica.token("acceso");
  await bd.db.query(
    `insert into ${ESQUEMA}.tokens (conexion_id, tipo, token_hmac, recurso, caduca_en, cliente_oauth_id)
     values ($1, 'acceso', $2, $3, now() + interval '300 seconds', $4)`,
    [conexionId, acceso.hmac, RECURSO, await clienteSemilla(bd)],
  );
  return { conexionId, acceso };
}

export type EstadoOrden = "pendiente" | "entregada" | "confirmada" | "anulada";
/** Siembra una orden de la licencia en el estado pedido (con las marcas que exige el check). */
export async function sembrarOrden(
  bd: BdApoyo,
  licenciaId: string,
  tipo: "pausar" | "reanudar",
  estadoOrden: EstadoOrden,
  creadaHace = "0 seconds",
): Promise<string> {
  const marcas: Record<EstadoOrden, string> = {
    pendiente: "null, null, null",
    entregada: "now() - interval '1 second', null, null",
    confirmada: "now() - interval '2 second', now() - interval '1 second', null",
    anulada: "null, null, now() - interval '1 second'",
  };
  return (
    await una<{ id: string }>(
      bd,
      `insert into ${ESQUEMA}.ordenes (licencia_id, tipo, estado, creada_en, entregada_en, confirmada_en, anulada_en)
       values ($1, $2, $3, now() - $4::interval, ${marcas[estadoOrden]}) returning id::text`,
      [licenciaId, tipo, estadoOrden, creadaHace],
    )
  ).id;
}

export const TABLAS = [
  "cierre",
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
/** Huella del contenido de todas las tablas: lo que no debe cambiar ante un rechazo. */
export async function estado(bd: BdApoyo): Promise<Record<string, string>> {
  const salida: Record<string, string> = {};
  for (const t of TABLAS) {
    salida[t] = (
      await una<{ h: string }>(
        bd,
        `select coalesce(md5(string_agg(x::text, '|' order by x::text)), 'vacia') as h from ${ESQUEMA}.${t} x`,
      )
    ).h;
  }
  return salida;
}

/** Huella de lo que pertenece a una licencia (órdenes, ejecuciones, informes y conexiones). */
export async function huellaDeLicencia(bd: BdApoyo, licenciaId: string): Promise<string> {
  return (
    await una<{ h: string }>(
      bd,
      `select coalesce(md5(string_agg(t, '|' order by t)), 'vacia') as h from (
         select o::text as t from ${ESQUEMA}.ordenes o where o.licencia_id = $1
         union all select e::text from ${ESQUEMA}.ejecuciones e where e.licencia_id = $1
         union all select i::text from ${ESQUEMA}.informes i where i.licencia_id = $1
         union all select c::text from ${ESQUEMA}.conexiones c where c.licencia_id = $1) x`,
      [licenciaId],
    )
  ).h;
}

export interface DefinicionFuncion {
  secdef: boolean;
  config: string[] | null;
  args: string[] | null;
  cuerpo: string;
}
export const definicion = (bd: BdApoyo, firma: string) =>
  una<DefinicionFuncion>(
    bd,
    `select prosecdef as secdef, proconfig as config, proargnames as args, prosrc as cuerpo
       from pg_proc where oid = '${ESQUEMA}.${firma}'::regprocedure`,
  );

/** Comprobaciones comunes de forma: security definer, search_path, hora, permisos, sin identificadores. */
export async function comprobarForma(
  bd: BdApoyo,
  nombre: string,
  firma: string,
  args: string[],
  llamada: string,
  parametros: unknown[],
  roles: { permitido: string; prohibidos: string[] },
  /** Funciones que no leen la hora (operar_*): no se exige `now()`. */
  sinHora = false,
): Promise<void> {
  const f = await definicion(bd, `${nombre}(${firma})`);
  expect(f.secdef).toBe(true);
  expect(f.config).toEqual(["search_path=pg_catalog, pg_temp"]);
  expect(f.args).toEqual(args);
  expect(f.cuerpo).not.toMatch(/pg_catalog\s*\.\s*(now|clock_timestamp|transaction_timestamp)/i);
  expect(f.cuerpo).not.toMatch(/clock_timestamp|statement_timestamp|age\s*\(/i);
  if (!sinHora) expect(f.cuerpo).toMatch(/\bnow\(\)/);
  await bd.db.exec(`grant usage on schema ${ESQUEMA} to anon, authenticated, service_role`);
  for (const rol of roles.prohibidos) {
    await expect(
      bd.como(rol, () => bd.db.query(`select ${ESQUEMA}.${nombre}(${llamada})`, parametros)),
      rol,
    ).rejects.toThrow(new RegExp(`permission denied for function ${nombre}`));
  }
  // El rol permitido sí la ejecuta.
  await bd.como(roles.permitido, () =>
    bd.db.query(`select ${ESQUEMA}.${nombre}(${llamada})`, parametros),
  );
  const publico = await una<{ n: number }>(
    bd,
    `select count(*)::int as n from pg_proc p, aclexplode(p.proacl) a
      where p.oid = '${ESQUEMA}.${nombre}(${firma})'::regprocedure and a.grantee = 0`,
  );
  expect(publico.n).toBe(0);
}

/** HMAC (ficticio) del origen de una petición: el origen solo existe como HMAC. */
export const origen = (n: string) => hmacDe(`origen:${n}`);

/** Identificador DCR con la forma del diseño: dcr_ + 22 caracteres. */
export const idDcr = () => `dcr_${randomBytes(16).toString("base64url")}`;

export const CB_CLAUDE = "https://claude.ai/api/mcp/auth_callback";
export const CB_CHATGPT = "https://chatgpt.com/connector_platform_oauth_redirect";

export type Resultado = { resultado: string } & Record<string, unknown>;
/** Llama a una función del conector con el rol de gestión (autorización y operación). */
export async function gestion(
  bd: BdApoyo,
  funcion: string,
  argumentos: unknown[],
): Promise<Resultado> {
  const almacen = await crearAlmacenPglite(bd, ROL_GESTION);
  return (await almacen.llamar(funcion, argumentos)) as Resultado;
}

export type Token = ReturnType<typeof fabrica.token>;
export interface Autorizado {
  licencia: string;
  conexion: string;
  /** HMAC del código de autorización guardado (lo que la app pasaría a `canjear_codigo`). */
  codigoAut: string;
  desafio: string;
}
export interface Emitido extends Autorizado {
  acceso: Token;
  renovacion: Token;
}

/** Registra un cliente DCR con los dos callbacks y devuelve su identificador. */
export async function registrarCliente(bd: BdApoyo, desde = "registro"): Promise<string> {
  const id = idDcr();
  const r = await gestion(bd, "registrar_cliente_dcr", [
    origen(desde),
    id,
    [CB_CLAUDE, CB_CHATGPT],
  ]);
  expect(r.resultado).toBe("registrado");
  return id;
}

/** Recorre solicitud y activación y deja un código de autorización sin canjear. */
export async function autorizar(
  bd: BdApoyo,
  cliente: string,
  tipo: "A" | "B" = "A",
  callback = CB_CLAUDE,
): Promise<Autorizado> {
  const n = randomBytes(8).toString("hex");
  const { id: licencia } = await una<{ id: string }>(
    bd,
    `select id::text from ${ESQUEMA}.licencias where tipo = $1`,
    [tipo],
  );
  await bd.db.query(
    `insert into ${ESQUEMA}.codigos_activacion (licencia_id, codigo_hmac, caduca_en)
     values ($1, $2, now() + interval '10 minutes')`,
    [licencia, hmacDe(`codigo:${n}`)],
  );
  const desafio = randomBytes(32).toString("base64url");
  const abierta = await gestion(bd, "abrir_solicitud", [
    cliente,
    callback,
    desafio,
    RECURSO,
    hmacDe(`state:${n}`),
    hmacDe(`cookie:${n}`),
  ]);
  expect(abierta.resultado).toBe("abierta");
  const codigoAut = hmacDe(`aut:${n}`);
  const r = await gestion(bd, "activar", [
    abierta.solicitud,
    hmacDe(`cookie:${n}`),
    hmacDe(`state:${n}`),
    origen(`navegador-${n}`),
    hmacDe(`codigo:${n}`),
    codigoAut,
  ]);
  expect(r.resultado).toBe("activada");
  const { conexion_id: conexion } = await una<{ conexion_id: string }>(
    bd,
    `select conexion_id::text from ${ESQUEMA}.codigos_autorizacion where codigo_hmac = $1`,
    [codigoAut],
  );
  return { licencia, conexion, codigoAut, desafio };
}

export const canjear = (
  bd: BdApoyo,
  a: Autorizado,
  cliente: string,
  acceso: Token,
  renovacion: Token,
  callback = CB_CLAUDE,
) =>
  gestion(bd, "canjear_codigo", [
    a.codigoAut,
    cliente,
    callback,
    a.desafio,
    RECURSO,
    acceso.hmac,
    renovacion.hmac,
  ]);

/** Autoriza y canjea: una conexión con su par de tokens emitido. */
export async function conectar(
  bd: BdApoyo,
  cliente: string,
  tipo: "A" | "B" = "A",
  callback = CB_CLAUDE,
): Promise<Emitido> {
  const a = await autorizar(bd, cliente, tipo, callback);
  const acceso = fabrica.token("acceso");
  const renovacion = fabrica.token("renovacion");
  const r = await canjear(bd, a, cliente, acceso, renovacion, callback);
  expect(r).toEqual({ resultado: "emitido", expires_in: 300 });
  return { ...a, acceso, renovacion };
}

/** ¿Vale ese token de acceso para el punto MCP? (lo que haría `validar_acceso` con el rol mcp). */
export async function vale(bd: BdApoyo, t: Token): Promise<boolean> {
  const almacen = await crearAlmacenPglite(bd, ROL_MCP);
  return (await almacen.llamar("validar_acceso", [t.hmac, RECURSO])) === true;
}
