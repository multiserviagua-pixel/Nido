// Mutaciones de 02_matriz_acceso.test.sql contra el arnés PGlite (T-009; D-034).
// Cada control de la matriz tiene que poder fallar: se rompe la base de una de las maneras que la
// matriz debe ver (un permiso de más para cada tipo de perfil, un permiso de menos, una política que
// se afloja, un perfil que gana acceso cruzado, un disparador que deja de proteger una celda «C», una
// vista abierta), se comprueba qué celdas fallan y se deshace. «Mutación» es un cambio de la base, no
// del archivo de pruebas. Un pase falso aquí es un hueco de seguridad (lección de T-008).
//
// LOCAL, sobre PGlite: no es la ejecución de CI (`supabase test db`, T-013; REQ-028, artículo 13).
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import type { Base } from "./arnes";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { crearBaseConPgtap, ejecutarArchivo, ejecutarTexto, expandirIr } from "./pgtap";

vi.setConfig({ testTimeout: 300_000, hookTimeout: 300_000 });

let db: Base;
beforeAll(async () => {
  db = await crearBaseConPgtap();
});
afterAll(async () => {
  await db.close();
});

/** Celdas de 02 que fallan: la descripción entera («UA · clientes · leer · P», «negativo 9 · …»). */
async function fallaCeldas(): Promise<string[]> {
  const r = await ejecutarArchivo(db, "02_matriz_acceso.test.sql");
  return r.fallidas.map((l) => (/^not ok \d+ - (.*)$/m.exec(l)?.[1] ?? l).trim());
}

interface Mutacion {
  nombre: string;
  rompe: string;
  deshace: string;
  /** Celdas que deben fallar (por prefijo de su descripción). */
  fallan: string[];
  /** Celdas que NO deben fallar: la mutación solo toca lo que dice. */
  sobran?: string[];
}

const ES_ADMIN_ORIGINAL = `create or replace function privado.es_admin() returns boolean
  language sql stable security definer set search_path = pg_catalog, pg_temp
  as $f$ select coalesce((select auth.jwt()) ->> 'aal', '') = 'aal2'
            and exists (select 1 from public.administradores a
                         where a.usuario_id = (select auth.uid())) $f$`;

const CLIENTES_DEL_USUARIO_ORIGINAL = `create or replace function privado.clientes_del_usuario() returns setof uuid
  language sql stable security definer set search_path = pg_catalog, pg_temp
  as $f$ select uc.cliente_id from public.usuarios_cliente uc
           join public.clientes c on c.id = uc.cliente_id
          where uc.usuario_id = (select auth.uid()) and c.estado = 'activo' $f$`;

const MUTACIONES: Mutacion[] = [
  // ---- Un permiso de más, para cada tipo de perfil ----
  {
    nombre: "anon con permiso de lectura (permiso de más, perfil SS)",
    rompe: "grant select on public.clientes to anon",
    deshace: "revoke select on public.clientes from anon",
    fallan: ["SS · clientes · leer · X"],
    sobran: ["SS · licencias · leer · X"],
  },
  {
    nombre: "authenticated con permiso de lectura en una tabla interna (permiso de más, UA a AD2)",
    rompe: "grant select on public.tokens to authenticated",
    deshace: "revoke select on public.tokens from authenticated",
    fallan: [
      "UA · tokens · leer · X",
      "UB · tokens · leer · X",
      "UAB · tokens · leer · X",
      "USV · tokens · leer · X",
      "AD1 · tokens · leer · X",
      "AD2 · tokens · leer · X",
    ],
    sobran: ["SS · tokens · leer · X", "CON · tokens · leer · X"],
  },
  {
    nombre: "el conector con permiso de lectura (permiso de más, perfil CON)",
    rompe: "grant select on public.clientes to conector",
    deshace: "revoke select on public.clientes from conector",
    fallan: ["CON · clientes · leer · X"],
    sobran: ["SS · clientes · leer · X"],
  },
  {
    nombre: "service_role con permiso de lectura (permiso de más, perfil SR)",
    rompe: "grant select on public.tokens to service_role",
    deshace: "revoke select on public.tokens from service_role",
    fallan: ["SR · tokens · leer · X"],
  },
  {
    nombre: "service_role con permiso de modificar versiones_prompt (permiso de más, perfil SR)",
    rompe: "grant update (notas) on public.versiones_prompt to service_role",
    deshace: "revoke update (notas) on public.versiones_prompt from service_role",
    fallan: ["SR · versiones_prompt · modificar · X"],
  },
  {
    nombre:
      "authenticated con permiso y política de borrado en clientes (permiso de más de escritura)",
    rompe: `grant delete on public.clientes to authenticated;
            create policy cruce_borrar on public.clientes for delete to authenticated using (true)`,
    deshace: `drop policy cruce_borrar on public.clientes;
              revoke delete on public.clientes from authenticated`,
    fallan: [
      "UA · clientes · borrar · X",
      "UAB · clientes · borrar · X",
      "USV · clientes · borrar · X",
      "AD1 · clientes · borrar · X",
      "AD2 · clientes · borrar · X",
    ],
  },
  {
    nombre: "una vista con permiso de inserción para authenticated (permiso de más en una vista)",
    rompe: "grant insert on public.resumen_cliente to authenticated",
    deshace: "revoke insert on public.resumen_cliente from authenticated",
    fallan: ["UA · resumen_cliente · insertar · X", "AD2 · resumen_cliente · insertar · X"],
    sobran: ["SS · resumen_cliente · insertar · X"],
  },
  {
    nombre: "codigo_hmac legible para authenticated (columna vetada)",
    rompe: "grant select (codigo_hmac) on public.codigos_activacion to authenticated",
    deshace: "revoke select (codigo_hmac) on public.codigos_activacion from authenticated",
    fallan: ["AD2 · codigos_activacion · leer · C"],
  },
  // ---- Permisos por columna y filas de B (dictamen del revisor, R-M-1, R-m-2, R-m-4) ----
  {
    nombre:
      "service_role con permiso de leer solo algunas columnas de licencias (R-M-1, M4: la celda X lo ve)",
    rompe: "grant select (id, estado_manual) on public.licencias to service_role",
    deshace: "revoke select (id, estado_manual) on public.licencias from service_role",
    fallan: ["SR · licencias · leer · X"],
    sobran: ["SR · clientes · leer · X"],
  },
  {
    nombre:
      "el conector con permiso sobre la columna id de licencias y una política abierta (R-M-1, M5)",
    rompe: `grant select (id) on public.licencias to conector;
            create policy cruce_con on public.licencias for select to conector using (true)`,
    deshace: `drop policy cruce_con on public.licencias;
              revoke select (id) on public.licencias from conector`,
    fallan: ["CON · licencias · leer · X"],
    sobran: ["CON · clientes · leer · X"],
  },
  {
    nombre:
      "service_role con permiso de modificar una columna distinta de la que toca la sentencia (R-M-1, M7)",
    rompe: "grant update (anulada_en) on public.ordenes to service_role",
    deshace: "revoke update (anulada_en) on public.ordenes from service_role",
    fallan: ["SR · ordenes · modificar · X"],
    sobran: ["SR · clientes · modificar · X"],
  },
  {
    nombre:
      "authenticated con permiso de modificar codigos_activacion.usado_en y política abierta (R-M-1, M8)",
    rompe: `grant update (usado_en) on public.codigos_activacion to authenticated;
            create policy cruce_ca on public.codigos_activacion for update to authenticated
              using (true) with check (true)`,
    deshace: `drop policy cruce_ca on public.codigos_activacion;
              revoke update (usado_en) on public.codigos_activacion from authenticated`,
    fallan: ["AD2 · codigos_activacion · modificar · X", "UA · codigos_activacion · modificar · X"],
  },
  {
    nombre: "el conector con permiso de leer metricas_version (R-m-4, M12)",
    rompe: "grant select on public.metricas_version to conector",
    deshace: "revoke select on public.metricas_version from conector",
    fallan: ["CON · metricas_version · leer · X"],
  },
  {
    nombre:
      "una política deja al usuario modificar su propio cliente: la sonda sobre una fila de B también falla (R-m-2, M13)",
    rompe: `create policy cruce_mod on public.clientes for update to authenticated
              using (id in (select privado.clientes_del_usuario())) with check (true)`,
    deshace: "drop policy cruce_mod on public.clientes",
    fallan: ["UA · clientes · modificar · 0", "UB · clientes · modificar · 0"],
    sobran: ["USV · clientes · modificar · 0"],
  },
  {
    nombre:
      "una política deja al usuario insertar órdenes de su propio cliente: la sonda sobre B también falla (R-m-2, M16)",
    rompe: `create policy cruce_ins on public.ordenes for insert to authenticated
              with check (cliente_id in (select privado.clientes_del_usuario()))`,
    deshace: "drop policy cruce_ins on public.ordenes",
    fallan: ["UA · ordenes · insertar · X", "UB · ordenes · insertar · X"],
    sobran: ["USV · ordenes · insertar · X"],
  },
  // ---- Un permiso de menos ----
  {
    nombre: "authenticated pierde el permiso de leer clientes (permiso de menos)",
    rompe: "revoke select on public.clientes from authenticated",
    deshace: "grant select on public.clientes to authenticated",
    fallan: ["UA · clientes · leer · P", "AD2 · clientes · leer · T", "USV · clientes · leer · 0"],
  },
  {
    nombre: "authenticated pierde el permiso de modificar ordenes.estado (permiso de menos)",
    rompe: "revoke update (estado) on public.ordenes from authenticated",
    deshace: "grant update (estado) on public.ordenes to authenticated",
    fallan: ["AD2 · ordenes · modificar · C", "UA · ordenes · modificar · 0"],
  },
  {
    nombre:
      "authenticated pierde el permiso de insertar códigos de activación (permiso de menos, C)",
    rompe:
      "revoke insert (licencia_id, codigo_hmac, caduca_en) on public.codigos_activacion from authenticated",
    deshace:
      "grant insert (licencia_id, codigo_hmac, caduca_en) on public.codigos_activacion to authenticated",
    fallan: ["AD2 · codigos_activacion · insertar · C"],
  },
  {
    nombre:
      "service_role pierde el permiso de insertar versiones del prompt (permiso de menos, SR)",
    rompe: "revoke insert on public.versiones_prompt from service_role",
    deshace:
      "grant insert (version, contenido, huella_sha256, commit_sha, notas) on public.versiones_prompt to service_role",
    fallan: ["SR · versiones_prompt · insertar · C"],
  },
  {
    nombre: "authenticated pierde el permiso de borrar usuarios_cliente (permiso de menos, T)",
    rompe: "revoke delete on public.usuarios_cliente from authenticated",
    deshace: "grant delete on public.usuarios_cliente to authenticated",
    fallan: ["AD2 · usuarios_cliente · borrar · T", "UA · usuarios_cliente · borrar · 0"],
  },
  // ---- Una política que se afloja ----
  {
    nombre: "la política de lectura de conexiones deja de comprobar al superadmin (se afloja)",
    rompe: "alter policy conexiones_select_admin on public.conexiones using (true)",
    deshace:
      "alter policy conexiones_select_admin on public.conexiones using ((select privado.es_admin()))",
    fallan: [
      "UA · conexiones · leer · 0",
      "USV · conexiones · leer · 0",
      "AD1 · conexiones · leer · 0",
    ],
    sobran: ["AD2 · conexiones · leer · T"],
  },
  {
    nombre: "la política de modificar licencias deja de comprobar al superadmin (se afloja)",
    rompe: "alter policy licencias_update_admin on public.licencias using (true) with check (true)",
    deshace: `alter policy licencias_update_admin on public.licencias
                using ((select privado.es_admin())) with check ((select privado.es_admin()))`,
    fallan: [
      "UA · licencias · modificar · 0",
      "UAB · licencias · modificar · 0",
      "UB · licencias · modificar · 0",
      "USV · licencias · modificar · 0",
    ],
    // UB falla por la sonda sobre la fila de B (R-m-2); USV, que no ve ninguna fila, solo lo ve la sonda de
    // modificar a ciegas, sin where (R2-M-1): antes esta mutación la dejaba en verde.
  },
  {
    nombre: "la política de inserción de ordenes queda abierta (se afloja)",
    rompe: "alter policy ordenes_insert_admin on public.ordenes with check (true)",
    deshace:
      "alter policy ordenes_insert_admin on public.ordenes with check ((select privado.es_admin()))",
    fallan: [
      "UA · ordenes · insertar · X",
      "USV · ordenes · insertar · X",
      "AD1 · ordenes · insertar · X",
    ],
  },
  // ---- Un perfil que gana acceso cruzado o de superadmin ----
  {
    nombre: "el usuario de A lee los informes de B (acceso cruzado)",
    rompe: `create policy cruce on public.informes for select to authenticated
              using (cliente_id = '00000000-0000-4000-8000-00000000000b')`,
    deshace: "drop policy cruce on public.informes",
    fallan: ["UA · informes · leer · P", "USV · informes · leer · 0"],
  },
  {
    nombre: "clientes_del_usuario devuelve todos los clientes (acceso cruzado en todas las tablas)",
    rompe: `create or replace function privado.clientes_del_usuario() returns setof uuid
              language sql stable security definer set search_path = pg_catalog, pg_temp
              as 'select c.id from public.clientes c'`,
    deshace: CLIENTES_DEL_USUARIO_ORIGINAL,
    fallan: [
      "UA · clientes · leer · P",
      "UB · licencias · leer · P",
      "UAB · ordenes · leer · P",
      "USV · clientes · leer · 0",
      "USV · catalogo_problemas · leer · 0",
    ],
  },
  {
    nombre: "es_admin deja de exigir el doble factor (AD1 gana acceso de superadmin)",
    rompe: `create or replace function privado.es_admin() returns boolean
              language sql stable security definer set search_path = pg_catalog, pg_temp
              as 'select exists (select 1 from public.administradores a where a.usuario_id = (select auth.uid()))'`,
    deshace: ES_ADMIN_ORIGINAL,
    fallan: [
      "AD1 · clientes · leer · 0",
      "AD1 · auditoria · leer · 0",
      "AD1 · clientes · modificar · 0",
    ],
    sobran: ["AD2 · clientes · leer · T"],
  },
  {
    nombre: "el usuario de cliente lee las reglas (REQ-052 y REQ-057)",
    rompe: `create policy reglas_usuario on public.reglas_cliente for select to authenticated
              using (cliente_id in (select privado.clientes_del_usuario()))`,
    deshace: "drop policy reglas_usuario on public.reglas_cliente",
    fallan: ["UA · reglas_cliente · leer · 0", "REQ-057 · CA-035"],
  },
  {
    nombre: "una vista deja de aplicar el RLS de quien consulta (security_invoker = false)",
    rompe: "alter view public.resumen_cliente set (security_invoker = false)",
    deshace: "alter view public.resumen_cliente set (security_invoker = true)",
    fallan: ["UA · resumen_cliente · leer · P", "USV · resumen_cliente · leer · 0"],
  },
  // ---- Las condiciones de las celdas «C» (los 15 negativos) ----
  {
    nombre: "el disparador de valores de ordenes desactivado (negativos 9 y 10)",
    rompe: "alter table public.ordenes disable trigger ordenes_valores",
    deshace: "alter table public.ordenes enable trigger ordenes_valores",
    fallan: ["negativo 9 ·", "negativo 10 ·"],
  },
  {
    nombre: "el disparador de valores de conexiones desactivado (negativos 11 y 12)",
    rompe: "alter table public.conexiones disable trigger conexiones_valores",
    deshace: "alter table public.conexiones enable trigger conexiones_valores",
    fallan: ["negativo 11 ·", "negativo 12 ·"],
  },
  {
    nombre: "el disparador de valores de alertas desactivado (negativo 13)",
    rompe: "alter table public.alertas disable trigger alertas_valores",
    deshace: "alter table public.alertas enable trigger alertas_valores",
    fallan: ["negativo 13 ·"],
  },
  {
    nombre: "el disparador de pertenencia de licencias desactivado (negativo 2 y no el 1)",
    rompe: "alter table public.licencias disable trigger licencias_pertenencia",
    deshace: "alter table public.licencias enable trigger licencias_pertenencia",
    fallan: ["negativo 2 ·"],
    sobran: ["negativo 1 ·"],
  },
  {
    nombre:
      "los disparadores de pertenencia de conexiones y ejecuciones desactivados (negativos 3 a 5)",
    rompe: `alter table public.conexiones disable trigger conexiones_pertenencia;
            alter table public.ejecuciones disable trigger ejecuciones_pertenencia`,
    deshace: `alter table public.conexiones enable trigger conexiones_pertenencia;
              alter table public.ejecuciones enable trigger ejecuciones_pertenencia`,
    fallan: ["negativo 3 ·", "negativo 4 ·", "negativo 5 ·"],
  },
  {
    nombre: "authenticated puede escribir licencias.cliente_id (negativo 1)",
    rompe: "grant update (cliente_id) on public.licencias to authenticated",
    deshace: "revoke update (cliente_id) on public.licencias from authenticated",
    fallan: ["negativo 1 ·"],
  },
  {
    nombre: "authenticated puede escribir usado_en en el alta de códigos (negativo 6)",
    rompe: "grant insert (usado_en) on public.codigos_activacion to authenticated",
    deshace: "revoke insert (usado_en) on public.codigos_activacion from authenticated",
    fallan: ["negativo 6 ·"],
  },
  {
    nombre:
      "authenticated puede escribir catalogo_problemas.codigo, reglas_cliente.cliente_id y actualizado_en (negativos 7, 8 y 14)",
    rompe: `grant update (codigo) on public.catalogo_problemas to authenticated;
            grant update (cliente_id, actualizado_en) on public.reglas_cliente to authenticated`,
    deshace: `revoke update (codigo) on public.catalogo_problemas from authenticated;
              revoke update (cliente_id, actualizado_en) on public.reglas_cliente from authenticated`,
    fallan: ["negativo 7 ·", "negativo 8 ·", "negativo 14 ·"],
  },
  {
    nombre: "authenticated puede escribir clientes.estado en el alta (negativo 15)",
    rompe: "grant insert (estado) on public.clientes to authenticated",
    deshace: "revoke insert (estado) on public.clientes from authenticated",
    fallan: ["negativo 15 ·"],
  },
  // ---- Segundo dictamen del auditor-seguridad (A-M-1 a A-M-5) ----
  {
    nombre:
      "es_admin solo mira el doble factor, sin consultar administradores (A-M-1, A8): un usuario con aal2 que no es administrador gana acceso",
    rompe: `create or replace function privado.es_admin() returns boolean
              language sql stable security definer set search_path = pg_catalog, pg_temp
              as $f$ select coalesce((select auth.jwt()) ->> 'aal', '') = 'aal2' $f$`,
    deshace: ES_ADMIN_ORIGINAL,
    fallan: [
      "USV · clientes · leer · 0",
      "USV · auditoria · leer · 0",
      "USV · clientes · modificar · 0",
    ],
    sobran: ["AD2 · clientes · leer · T"],
  },
  {
    nombre:
      "una política de informes autoriza por user_metadata (A-M-2, A9): los perfiles llevan metadatos hostiles",
    rompe: `alter policy informes_select_usuario on public.informes
              using (cliente_id in (select privado.clientes_del_usuario())
                     or cliente_id::text = ((select auth.jwt()) -> 'user_metadata' ->> 'cliente_id'))`,
    deshace: `alter policy informes_select_usuario on public.informes
                using (cliente_id in (select privado.clientes_del_usuario()))`,
    fallan: ["UA · informes · leer · P", "UB · informes · leer · P", "USV · informes · leer · 0"],
  },
  {
    nombre:
      "el usuario añade miembros a su propio cliente (A-M-3, A5): la sonda de insertar sobre su cliente lo ve",
    rompe: `alter policy usuarios_cliente_insert_admin on public.usuarios_cliente
              with check ((select privado.es_admin())
                          or cliente_id in (select privado.clientes_del_usuario()))`,
    deshace: `alter policy usuarios_cliente_insert_admin on public.usuarios_cliente
                with check ((select privado.es_admin()))`,
    fallan: [
      "UA · usuarios_cliente · insertar · X",
      "UB · usuarios_cliente · insertar · X",
      "UAB · usuarios_cliente · insertar · X",
    ],
    sobran: ["USV · usuarios_cliente · insertar · X"],
  },
  {
    nombre: "el usuario da de alta licencias de su propio cliente (A-M-3, A6)",
    rompe: `alter policy licencias_insert_admin on public.licencias
              with check ((select privado.es_admin())
                          or cliente_id in (select privado.clientes_del_usuario()))`,
    deshace: `alter policy licencias_insert_admin on public.licencias
                with check ((select privado.es_admin()))`,
    fallan: [
      "UA · licencias · insertar · X",
      "UB · licencias · insertar · X",
      "UAB · licencias · insertar · X",
    ],
  },
  {
    nombre: "el usuario crea las reglas de su propio cliente (A-M-3, A7)",
    rompe: `alter policy reglas_cliente_insert_admin on public.reglas_cliente
              with check ((select privado.es_admin())
                          or cliente_id in (select privado.clientes_del_usuario()))`,
    deshace: `alter policy reglas_cliente_insert_admin on public.reglas_cliente
                with check ((select privado.es_admin()))`,
    fallan: [
      "UA · reglas_cliente · insertar · X",
      "UB · reglas_cliente · insertar · X",
      "UAB · reglas_cliente · insertar · X",
    ],
  },
  {
    nombre: "TRUNCATE para el conector sobre informes y clientes (A-M-4, A1)",
    rompe: "grant truncate on public.informes, public.clientes to conector",
    deshace: "revoke truncate on public.informes, public.clientes from conector",
    fallan: ["CON · informes · borrar · X", "CON · clientes · borrar · X"],
    sobran: ["CON · licencias · borrar · X", "SS · informes · borrar · X"],
  },
  {
    nombre: "REFERENCES y TRIGGER para el conector (A-M-4, A2)",
    rompe: "grant references, trigger on public.licencias to conector",
    deshace: "revoke references, trigger on public.licencias from conector",
    fallan: ["CON · licencias · borrar · X"],
  },
  {
    nombre: "MAINTAIN para el conector (A-M-4, A3)",
    rompe: "grant maintain on public.informes to conector",
    deshace: "revoke maintain on public.informes from conector",
    fallan: ["CON · informes · borrar · X"],
  },
  {
    nombre: "TRUNCATE para authenticated y service_role en informes (A-M-4, resto de perfiles)",
    rompe: "grant truncate on public.informes to authenticated, service_role",
    deshace: "revoke truncate on public.informes from authenticated, service_role",
    fallan: [
      "UA · informes · borrar · X",
      "AD2 · informes · borrar · X",
      "SR · informes · borrar · X",
    ],
  },
  {
    nombre:
      "una política deja al usuario leer la auditoría de su cliente (A-M-5, A4): hacen falta filas de A, B y C",
    rompe: `create policy cruce_aud on public.auditoria for select to authenticated
              using (cliente_id in (select privado.clientes_del_usuario()))`,
    deshace: "drop policy cruce_aud on public.auditoria",
    fallan: [
      "UA · auditoria · leer · 0",
      "UB · auditoria · leer · 0",
      "UAB · auditoria · leer · 0",
      "REQ-057 · CA-035",
    ],
    sobran: ["USV · auditoria · leer · 0"],
  },
  // ---- Segunda vuelta del revisor (R2-M-1, R2-m-1) ----
  ...["reglas_cliente", "alertas", "conexiones"].map((tabla, i): Mutacion => ({
    nombre: `la política de modificar ${tabla} queda abierta y los perfiles no leen la tabla (R2-M-1, E${String(9 + i)}): la sonda de modificar sin where ni lectura de columnas lo ve`,
    rompe: `alter policy ${tabla}_update_admin on public.${tabla} using (true) with check (true)`,
    deshace: `alter policy ${tabla}_update_admin on public.${tabla}
                  using ((select privado.es_admin())) with check ((select privado.es_admin()))`,
    fallan: ["UA", "UB", "UAB", "USV", "AD1"].map((p) => `${p} · ${tabla} · modificar · 0`),
  })),
  {
    nombre: "una política deja al usuario modificar las reglas de su propio cliente (R2-M-1, E5)",
    rompe: `create policy rv_upd on public.reglas_cliente for update to authenticated
              using (cliente_id in (select privado.clientes_del_usuario())) with check (true)`,
    deshace: "drop policy rv_upd on public.reglas_cliente",
    fallan: ["UA · reglas_cliente · modificar · 0", "UB · reglas_cliente · modificar · 0"],
    sobran: ["USV · reglas_cliente · modificar · 0"],
  },
  {
    nombre:
      "es_admin acepta app_metadata.es_admin (R2-m-1, E1): los perfiles llevan ese metadato hostil",
    rompe: `create or replace function privado.es_admin() returns boolean
              language sql stable security definer set search_path = pg_catalog, pg_temp
              as $f$ select (coalesce((select auth.jwt()) ->> 'aal', '') = 'aal2'
                             and exists (select 1 from public.administradores a
                                          where a.usuario_id = (select auth.uid())))
                            or coalesce(((select auth.jwt()) -> 'app_metadata' ->> 'es_admin')::boolean, false) $f$`,
    deshace: ES_ADMIN_ORIGINAL,
    fallan: ["USV · clientes · leer · 0", "UA · clientes · modificar · 0"],
    sobran: ["AD2 · clientes · leer · T"],
  },
];

describe("02_matriz_acceso en PGlite (local, no es CI)", () => {
  it("las 844 aserciones se ejecutan y pasan sobre las migraciones y el seed", async () => {
    const r = await ejecutarArchivo(db, "02_matriz_acceso.test.sql");
    expect(r.plan).toBe(844);
    expect(r.lineas).toHaveLength(844);
    expect(r.fallidas, r.fallidas.slice(0, 10).join("\n")).toEqual([]);
    expect(r.finish.join("\n")).not.toMatch(/Looks like/);
  });
});

describe("cada control de 02 puede fallar (mutaciones de la base)", () => {
  for (const m of MUTACIONES) {
    it(`${m.nombre}: falla ${m.fallan.join(", ")}`, async () => {
      await db.exec(m.rompe);
      let vistas: string[];
      try {
        vistas = await fallaCeldas();
      } finally {
        await db.exec(m.deshace);
      }
      for (const esperada of m.fallan) {
        expect(
          vistas.some((v) => v.startsWith(esperada)),
          `debía fallar «${esperada}»; fallan: ${vistas.slice(0, 12).join(" | ")}`,
        ).toBe(true);
      }
      for (const ajena of m.sobran ?? []) {
        expect(
          vistas.some((v) => v.startsWith(ajena)),
          `no debía fallar «${ajena}»`,
        ).toBe(false);
      }
    });
  }

  it("tras deshacer todas las mutaciones, 02 vuelve a pasar sus 844 aserciones", async () => {
    expect(await fallaCeldas()).toEqual([]);
  });
});

// La transcripción es lo que se compara con la base: si una letra de 02 no dice lo que hace la base,
// falla exactamente esa celda (y L 1 la habría rechazado antes frente a D-6).
describe("una letra cambiada en la transcripción de 02 hace fallar su celda", () => {
  const sql = expandirIr(
    resolve(fileURLToPath(new URL(".", import.meta.url)), "..", "02_matriz_acceso.test.sql"),
  );
  const casos: [string, string, string][] = [
    [
      "('clientes', 'XXXX', 'PX0X',",
      "('clientes', 'XXXX', 'PXXX',",
      "UA · clientes · modificar · X",
    ],
    [
      "'TCCX', 'XXXX', 'XXXX'),\n  ('licencias'",
      "'TCCX', 'XXXX', 'TXXX'),\n  ('licencias'",
      "SR · clientes · leer · T",
    ],
    ["('tokens', 'XXXX', 'XXXX',", "('tokens', 'XXXX', '0XXX',", "UA · tokens · leer · 0"],
    ["'TXXX', 'XXXX', 'TCXX')", "'TXXX', 'XXXX', 'TXXX')", "SR · versiones_prompt · insertar · X"],
  ];
  for (const [de, a, celda] of casos) {
    it(`${celda}`, async () => {
      expect(sql).toContain(de);
      const r = await ejecutarTexto(db, sql.replace(de, a));
      const fallan = r.fallidas.map((l) => (/^not ok \d+ - (.*)$/m.exec(l)?.[1] ?? l).trim());
      expect(fallan).toEqual([celda]);
    });
  }
});

// R-m-1 (F1): un resultado que falta no pasa celda a celda. Sin `versiones_prompt` en el bloque de
// sentencias no se sondea nada de ese objeto: antes dejaban pasar dos celdas de leer (nulo = nulo).
describe("un objeto sin sentencias no pasa por falta de resultado (R-m-1, F1)", () => {
  const sql = expandirIr(
    resolve(fileURLToPath(new URL(".", import.meta.url)), "..", "02_matriz_acceso.test.sql"),
  );
  it("quitar versiones_prompt del bloque de sentencias hace fallar sus 36 celdas", async () => {
    const quitado = sql.replace(
      /  \('versiones_prompt', 'tabla'[\s\S]*?\$s\$delete from public\.versiones_prompt\$s\$, null\),\n/,
      "",
    );
    expect(quitado).not.toBe(sql);
    expect(quitado).not.toContain("$s$delete from public.versiones_prompt$s$");
    const r = await ejecutarTexto(db, quitado);
    const fallan = r.fallidas.map((l) => (/^not ok \d+ - (.*)$/m.exec(l)?.[1] ?? l).trim());
    for (const perfil of ["SS", "UA", "UB", "UAB", "USV", "AD1", "AD2", "CON", "SR"]) {
      for (const op of ["leer", "insertar", "modificar", "borrar"]) {
        const celda = `${perfil} · versiones_prompt · ${op} · `;
        expect(
          fallan.some((v) => v.startsWith(celda)),
          `debía fallar «${celda}»`,
        ).toBe(true);
      }
    }
  });
});

// R-m-6: las celdas T y P son vacías por sí solas; solo las protege la precondición de REQ-057.
describe("la precondición de REQ-057 protege las celdas T y P vacías (R-m-6)", () => {
  const sql = expandirIr(
    resolve(fileURLToPath(new URL(".", import.meta.url)), "..", "02_matriz_acceso.test.sql"),
  );
  const casos: [string, string][] = [
    ["V1: ajustes_globales vacío", "delete from public.ajustes_globales;"],
    [
      "V2: sin suscripciones de B",
      "delete from public.suscripciones where cliente_id = '00000000-0000-4000-8000-00000000000b';",
    ],
  ];
  for (const [nombre, cambio] of casos) {
    it(`${nombre}: falla la aserción REQ-057`, async () => {
      expect(sql).toContain("select plan(844);");
      const r = await ejecutarTexto(
        db,
        sql.replace("select plan(844);", `select plan(844);\n${cambio}`),
      );
      const fallan = r.fallidas.map((l) => (/^not ok \d+ - (.*)$/m.exec(l)?.[1] ?? l).trim());
      expect(fallan.some((v) => v.startsWith("REQ-057 · CA-035"))).toBe(true);
    });
  }

  // A-M-5: sin filas de auditoría de B (o de A) en el montaje, un 0 de «auditoria» no prueba nada.
  for (const cliente of ["a", "b"]) {
    it(`V3: el montaje sin filas de auditoría del cliente ${cliente.toUpperCase()}: falla la aserción REQ-057`, async () => {
      const linea = `  ('accion_ficticia', 'clientes', '00000000-0000-4000-8000-00000000000${cliente}'),\n`;
      expect(sql).toContain(linea);
      const r = await ejecutarTexto(db, sql.replace(linea, ""));
      const fallan = r.fallidas.map((l) => (/^not ok \d+ - (.*)$/m.exec(l)?.[1] ?? l).trim());
      expect(fallan.some((v) => v.startsWith("REQ-057 · CA-035"))).toBe(true);
    });
  }
});
