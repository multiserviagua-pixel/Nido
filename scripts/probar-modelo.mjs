// Ejecuta docs/MODELO-DATOS.sql en PGlite (Postgres en WebAssembly) con un
// preámbulo que simula el entorno de Supabase, y comprueba el aislamiento
// entre clientes con datos ficticios.
//
// Sirve para comprobar en esta máquina, que no tiene Docker, que el SQL es
// válido y que el RLS básico funciona. No sustituye a las pruebas pgTAP
// contra un Supabase real, que corren en CI a partir de la fase 2.
//
// Uso: node scripts/probar-modelo.mjs [ruta al SQL]
//
// Necesita el paquete @electric-sql/pglite. Mientras no exista package.json
// (fase 1), se instala sin dejar rastro en el repositorio:
//   npm install --no-save --no-package-lock @electric-sql/pglite
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

let PGlite;
try {
  ({ PGlite } = await import('@electric-sql/pglite'));
} catch {
  console.error(
    'Falta el paquete @electric-sql/pglite. Instálalo con:\n' +
      '  npm install --no-save --no-package-lock @electric-sql/pglite',
  );
  process.exit(2);
}

const ruta =
  process.argv[2] ??
  join(dirname(fileURLToPath(import.meta.url)), '..', 'docs', 'MODELO-DATOS.sql');
const sql = readFileSync(ruta, 'utf8');
const db = new PGlite();

const preambulo = `
create schema auth;
create table auth.users (id uuid primary key default gen_random_uuid(), email text);
create function auth.jwt() returns jsonb language sql stable as $$
  select coalesce(nullif(current_setting('request.jwt.claims', true), ''), '{}')::jsonb
$$;
create function auth.uid() returns uuid language sql stable as $$
  select nullif(auth.jwt() ->> 'sub', '')::uuid
$$;
create role anon nologin;
create role authenticated nologin;
create role service_role nologin bypassrls;
grant usage on schema public, auth to anon, authenticated, service_role;
`;

const resultados = [];
function anota(nombre, ok, detalle = '') {
  resultados.push({ nombre, ok, detalle });
  console.log(`${ok ? 'SUPERADA' : 'FALLIDA '}  ${nombre}${detalle ? '  -> ' + detalle : ''}`);
}

async function como(rol, claims, fn) {
  await db.exec(`set role ${rol}`);
  await db.query(`select set_config('request.jwt.claims', $1, false)`, [JSON.stringify(claims ?? {})]);
  try {
    return await fn();
  } finally {
    await db.exec('reset role');
    await db.query(`select set_config('request.jwt.claims', '', false)`);
  }
}

async function esperaError(nombre, fn, patron) {
  try {
    await fn();
    anota(nombre, false, 'no dio error');
  } catch (e) {
    const msg = String(e.message ?? e);
    anota(nombre, patron.test(msg), patron.test(msg) ? '' : msg);
  }
}

const uno = async (texto, params = []) => (await db.query(texto, params)).rows[0];
const valor = async (texto, params = []) => Object.values(await uno(texto, params))[0];

// Identificadores ficticios
const U_A = '00000000-0000-4000-8000-00000000000a';
const U_B = '00000000-0000-4000-8000-00000000000b';
const U_ADMIN = '00000000-0000-4000-8000-0000000000ad';
const C_A = '10000000-0000-4000-8000-00000000000a';
const C_B = '10000000-0000-4000-8000-00000000000b';
const L_A = '20000000-0000-4000-8000-00000000000a';
const L_B = '20000000-0000-4000-8000-00000000000b';
const X_A = '30000000-0000-4000-8000-00000000000a';
const X_B = '30000000-0000-4000-8000-00000000000b';
const VER = '40000000-0000-4000-8000-000000000001';
const T_A = 'a'.repeat(64);
const T_B = 'b'.repeat(64);

try {
  await db.exec(preambulo);
  anota('Preámbulo de Supabase simulado', true);
} catch (e) {
  anota('Preámbulo de Supabase simulado', false, e.message);
  process.exit(1);
}

try {
  await db.exec(sql);
  anota('MODELO-DATOS.sql se ejecuta sin errores', true);
} catch (e) {
  anota('MODELO-DATOS.sql se ejecuta sin errores', false, e.message);
  process.exit(1);
}

// ---------- Datos ficticios (como propietario) ----------
await db.exec(`
insert into auth.users (id) values ('${U_A}'), ('${U_B}'), ('${U_ADMIN}');
insert into public.clientes (id, nombre) values ('${C_A}', 'Cliente A ficticio'), ('${C_B}', 'Cliente B ficticio');
insert into public.usuarios_cliente (usuario_id, cliente_id) values ('${U_A}', '${C_A}'), ('${U_B}', '${C_B}');
insert into public.administradores (usuario_id) values ('${U_ADMIN}');
insert into public.licencias (id, cliente_id) values ('${L_A}', '${C_A}'), ('${L_B}', '${C_B}');
insert into public.conexiones (id, licencia_id, asistente) values ('${X_A}', '${L_A}', 'claude'), ('${X_B}', '${L_B}', 'chatgpt');
insert into public.tokens (conexion_id, tipo, token_hmac, recurso, caduca_en) values
  ('${X_A}', 'acceso', '${T_A}', 'https://conector.test/api/mcp', now() + interval '5 minutes'),
  ('${X_B}', 'acceso', '${T_B}', 'https://conector.test/api/mcp', now() + interval '5 minutes');
insert into public.versiones_prompt (id, version, contenido, huella_sha256, commit_sha)
  values ('${VER}', '1.3', 'PROMPT FICTICIO DE PRUEBA', '${'c'.repeat(64)}', 'abcdef1');
insert into public.publicaciones (canal, version_id) values ('estable', '${VER}');
`);

const informeBueno = {
  estado: 'ok', modo: 'desatendido', asistente: 'Claude', almacenamiento: 'Drive',
  version_prompt: '1.3', frecuencia_horas: 24, tratados: 18, sin_tratar: 0,
  borradores: 4, documentos: 6, facturas_pendientes: 0, urgentes: 1,
  comprobaciones: { correo: true, almacenamiento: true, contexto: true, registro: true, extra: 'x' },
  problemas: ['error_borrador', 'codigo_que_no_existe'],
  asunto: 'Texto que no debe guardarse', remitente: 'alguien@ejemplo.test',
};

// ---------- Conector ----------
let ejecA, ejecB;
await como('conector', null, async () => {
  const r = await valor(`select privado.mcp_obtener_instrucciones($1)`, [T_A]);
  ejecA = r.ejecucion_id;
  anota('Conector: licencia activa recibe estado activa y prompt',
    r.autorizado === true && r.estado === 'activa' && r.instrucciones?.prompt === 'PROMPT FICTICIO DE PRUEBA' && r.instrucciones?.reglas?.ventana_dias === 3,
    JSON.stringify({ estado: r.estado, tienePrompt: !!r.instrucciones }));

  const rb = await valor(`select privado.mcp_obtener_instrucciones($1)`, [T_B]);
  ejecB = rb.ejecucion_id;

  const n = await valor(`select privado.mcp_obtener_instrucciones($1)`, ['f'.repeat(64)]);
  anota('Conector: token desconocido no queda autorizado', n.autorizado === false && n.instrucciones === undefined);

  await esperaError('Conector: no puede leer tablas directamente',
    () => db.query(`select count(*) from public.informes`), /permission denied/i);
  await esperaError('Conector: no puede leer tokens',
    () => db.query(`select count(*) from public.tokens`), /permission denied/i);

  const cruz = await valor(`select privado.mcp_enviar_informe($1, $2, $3::jsonb)`, [T_B, ejecA, JSON.stringify(informeBueno)]);
  anota('Conector: el token de B no puede cerrar la ejecución de A',
    cruz.guardado === false && cruz.motivo === 'ejecucion_desconocida', JSON.stringify(cruz));

  const e1 = await valor(`select privado.mcp_enviar_informe($1, $2, $3::jsonb)`, [T_A, ejecA, JSON.stringify(informeBueno)]);
  anota('Conector: informe con campos de más se guarda y los cuenta',
    e1.guardado === true && e1.repetido === false && e1.campos_descartados === 3, JSON.stringify(e1));

  const e2 = await valor(`select privado.mcp_enviar_informe($1, $2, $3::jsonb)`, [T_A, ejecA, JSON.stringify(informeBueno)]);
  anota('Conector: repetir el informe no lo duplica', e2.guardado === true && e2.repetido === true, JSON.stringify(e2));

  const eb = await valor(`select privado.mcp_enviar_informe($1, $2, $3::jsonb)`, [T_B, ejecB, JSON.stringify({ ...informeBueno, tratados: 3 })]);
  anota('Conector: informe de B guardado', eb.guardado === true);

  const r2 = await valor(`select privado.mcp_obtener_instrucciones($1)`, [T_A]);
  const malo = await valor(`select privado.mcp_enviar_informe($1, $2, $3::jsonb)`, [T_A, r2.ejecucion_id, JSON.stringify({ ...informeBueno, tratados: 'muchos correos de Juan' })]);
  anota('Conector: informe con tipo inválido se rechaza sin devolver el valor',
    malo.guardado === false && malo.motivo === 'informe_invalido' && !JSON.stringify(malo).includes('Juan'), JSON.stringify(malo));

  const fuera = await valor(`select privado.mcp_enviar_informe($1, $2, $3::jsonb)`, [T_A, r2.ejecucion_id, JSON.stringify({ ...informeBueno, tratados: 999999 })]);
  anota('Conector: cifra fuera de rango se rechaza', fuera.guardado === false && fuera.motivo === 'informe_invalido', JSON.stringify(fuera));
});

// Lo guardado no contiene texto ajeno
const fila = await uno(`select * from public.informes where ejecucion_id = $1`, [ejecA]);
const textoFila = JSON.stringify(fila);
anota('Informe guardado: sin asunto ni remitente, problemas solo del catálogo, enumerados en minúsculas',
  !textoFila.includes('ejemplo.test') && !textoFila.includes('no debe guardarse')
  && JSON.stringify(fila.problemas) === JSON.stringify(['error_borrador'])
  && fila.asistente === 'claude' && fila.almacenamiento === 'drive' && fila.campos_descartados === 3,
  JSON.stringify({ problemas: fila.problemas, descartados: fila.campos_descartados }));

anota('Latido: la ejecución con informe queda cerrada',
  (await valor(`select cerrada_en is not null from public.ejecuciones where id = $1`, [ejecA])) === true);
anota('Latido: la ejecución sin informe válido queda abierta',
  Number(await valor(`select count(*) from public.ejecuciones where cliente_id = $1 and cerrada_en is null`, [C_A])) === 1);

// ---------- Órdenes ----------
const ordenA = await valor(`insert into public.ordenes (cliente_id, tipo) values ($1, 'pausar') returning id`, [C_A]);
await como('conector', null, async () => {
  const r = await valor(`select privado.mcp_obtener_instrucciones($1)`, [T_A]);
  anota('Orden pausar: estado pausada, orden entregada y sin prompt',
    r.estado === 'pausada' && r.orden?.id === ordenA && r.orden?.tipo === 'pausar' && r.instrucciones === null,
    JSON.stringify({ estado: r.estado, orden: r.orden, instrucciones: r.instrucciones }));

  const cb = await valor(`select privado.mcp_confirmar_orden($1, $2)`, [T_B, ordenA]);
  anota('Orden: el token de B no puede confirmar la orden de A', cb.confirmada === false, JSON.stringify(cb));

  const ca = await valor(`select privado.mcp_confirmar_orden($1, $2)`, [T_A, ordenA]);
  anota('Orden: A confirma su orden', ca.confirmada === true && ca.repetida === false, JSON.stringify(ca));

  const ca2 = await valor(`select privado.mcp_confirmar_orden($1, $2)`, [T_A, ordenA]);
  anota('Orden: confirmar dos veces no falla', ca2.confirmada === true && ca2.repetida === true, JSON.stringify(ca2));
});
anota('Orden: quedó entregada y confirmada',
  (await valor(`select estado::text from public.ordenes where id = $1`, [ordenA])) === 'confirmada'
  && (await valor(`select entregada_en is not null from public.ordenes where id = $1`, [ordenA])) === true);

// ---------- Suspensión ----------
await db.query(`update public.licencias set estado_manual = 'forzar_suspendida' where id = $1`, [L_B]);
await como('conector', null, async () => {
  const r = await valor(`select privado.mcp_obtener_instrucciones($1)`, [T_B]);
  anota('Licencia suspendida: estado suspendida y nada más',
    r.estado === 'suspendida' && r.instrucciones === null, JSON.stringify({ estado: r.estado, instrucciones: r.instrucciones }));
});
await db.query(`update public.licencias set estado_manual = 'automatico' where id = $1`, [L_B]);

// ---------- Dashboards: usuario de A ----------
await como('authenticated', { sub: U_A, aal: 'aal1' }, async () => {
  const ids = (await db.query(`select distinct cliente_id from public.informes`)).rows.map((r) => r.cliente_id);
  anota('Usuario de A: solo ve informes de A', ids.length === 1 && ids[0] === C_A, JSON.stringify(ids));
  anota('Usuario de A: solo ve su cliente', Number(await valor(`select count(*) from public.clientes`)) === 1);
  const vista = (await db.query(`select cliente_id from public.resumen_cliente`)).rows.map((r) => r.cliente_id);
  anota('Usuario de A: la vista de resumen solo muestra A', vista.length === 1 && vista[0] === C_A, JSON.stringify(vista));
  const mv = (await db.query(`select clientes from public.metricas_version`)).rows;
  anota('Usuario de A: la vista de métricas solo agrega lo suyo', mv.length === 1 && Number(mv[0].clientes) === 1, JSON.stringify(mv));
  anota('Usuario de A: no ve el texto de las versiones', Number(await valor(`select count(*) from public.versiones_prompt`)) === 0);
  anota('Usuario de A: no ve conexiones', Number(await valor(`select count(*) from public.conexiones`)) === 0);
  anota('Usuario de A: no ve auditoría', Number(await valor(`select count(*) from public.auditoria`)) === 0);
  await esperaError('Usuario de A: no puede leer tokens', () => db.query(`select count(*) from public.tokens`), /permission denied/i);
  await esperaError('Usuario de A: no puede llamar a las funciones del conector',
    () => db.query(`select privado.mcp_obtener_instrucciones($1)`, [T_B]), /permission denied/i);
  await esperaError('Usuario de A: no puede crear órdenes',
    () => db.query(`insert into public.ordenes (cliente_id, tipo) values ($1, 'reanudar')`, [C_A]), /row-level security|permission denied/i);
  const act = await db.query(`update public.clientes set nombre = 'cambiado' where id = $1`, [C_B]);
  anota('Usuario de A: no puede cambiar el cliente B', (act.affectedRows ?? 0) === 0);
});

// ---------- Dashboards: usuario de B ----------
await como('authenticated', { sub: U_B, aal: 'aal1' }, async () => {
  const ids = (await db.query(`select distinct cliente_id from public.informes`)).rows.map((r) => r.cliente_id);
  anota('Usuario de B: solo ve informes de B', ids.length === 1 && ids[0] === C_B, JSON.stringify(ids));
  anota('Usuario de B: no ve órdenes de A', Number(await valor(`select count(*) from public.ordenes`)) === 0);
});

// ---------- Superadmin ----------
await como('authenticated', { sub: U_ADMIN, aal: 'aal1' }, async () => {
  anota('Superadmin sin doble factor: no ve clientes', Number(await valor(`select count(*) from public.clientes`)) === 0);
  await esperaError('Superadmin sin doble factor: no puede crear órdenes',
    () => db.query(`insert into public.ordenes (cliente_id, tipo) values ($1, 'reanudar')`, [C_A]), /row-level security/i);
});
await como('authenticated', { sub: U_ADMIN, aal: 'aal2' }, async () => {
  anota('Superadmin con doble factor: ve todos los clientes', Number(await valor(`select count(*) from public.clientes`)) === 2);
  anota('Superadmin con doble factor: ve informes de todos',
    Number(await valor(`select count(distinct cliente_id) from public.informes`)) === 2);
  await db.query(`insert into public.ordenes (cliente_id, tipo) values ($1, 'reanudar')`, [C_A]);
  anota('Superadmin con doble factor: crea una orden y queda auditada con su usuario',
    Number(await valor(`select count(*) from public.auditoria where objeto_tipo = 'ordenes' and accion = 'insert' and actor = $1`, [U_ADMIN])) === 1);
  await esperaError('Superadmin: no puede cambiar el texto de una versión',
    () => db.query(`update public.versiones_prompt set contenido = 'otro' where id = $1`, [VER]), /permission denied/i);
  await esperaError('Superadmin: no puede borrar auditoría',
    () => db.query(`delete from public.auditoria`), /permission denied/i);
});

// ---------- Anónimo ----------
await como('anon', null, async () => {
  await esperaError('Anónimo: no puede leer clientes', () => db.query(`select count(*) from public.clientes`), /permission denied/i);
  await esperaError('Anónimo: no puede llamar a las funciones del conector',
    () => db.query(`select privado.mcp_obtener_instrucciones($1)`, [T_A]), /permission denied/i);
});

// ---------- Solo inserción (incluso para el propietario) ----------
await esperaError('Versiones del prompt: inmutables incluso para el propietario',
  () => db.query(`update public.versiones_prompt set notas = 'x' where id = $1`, [VER]), /solo inserci/i);
await esperaError('Auditoría: no se puede borrar ni siendo propietario',
  () => db.query(`delete from public.auditoria`), /solo inserci/i);

const fallidas = resultados.filter((r) => !r.ok);
console.log(`\n${resultados.length - fallidas.length} de ${resultados.length} comprobaciones superadas`);
process.exit(fallidas.length ? 1 : 0);
