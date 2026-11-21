// T-007 (función 010): comprobaciones estáticas de `supabase/config.toml` (L 3), del seed
// y del volumen (L 9; D-10), del procedimiento de administradores (REQ-060) y de su guía.
// REQ-003, REQ-025, REQ-033, REQ-060 · CA-002, CA-003, CA-028, CA-037.
// Texto, sin base de datos: el comportamiento está en supabase/tests/pglite/seed.test.ts.
import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { escapesProhibidos, normalizar, sinComentarios } from "./apoyo/texto";

const RAIZ = new URL("../../../", import.meta.url);
const leer = (ruta: string) => readFileSync(new URL(ruta, RAIZ), "utf8");

const RUTA_CONFIG = "supabase/config.toml";
const RUTA_SEED = "supabase/seed.sql";
const RUTA_VOLUMEN = "supabase/datos/volumen.sql";
const RUTA_PROCEDIMIENTO = "supabase/procedimientos/administradores.sql";
const RUTA_GUIA = "docs/operacion/administradores.md";

/** Lector mínimo de TOML: {sección: {clave: valor sin comentarios}}. */
export function leerToml(texto: string): Record<string, Record<string, string>> {
  const salida: Record<string, Record<string, string>> = { "": {} };
  let seccion = "";
  for (const bruta of texto.split(/\r?\n/)) {
    const linea = bruta.replace(/\s+#.*$/, "").trim();
    if (linea === "" || linea.startsWith("#")) continue;
    const cabecera = /^\[([^\]]+)\]$/.exec(linea);
    if (cabecera !== null) {
      seccion = cabecera[1] ?? "";
      salida[seccion] ??= {};
      continue;
    }
    const par = /^([A-Za-z0-9_.-]+)\s*=\s*(.+)$/.exec(linea);
    if (par !== null) (salida[seccion] ??= {})[par[1] ?? ""] = (par[2] ?? "").trim();
  }
  return salida;
}

describe("L 3 · config.toml (CA-028, REQ-033)", () => {
  it("existe", () => {
    expect(existsSync(new URL(RUTA_CONFIG, RAIZ))).toBe(true);
  });

  it("la API solo expone `public`, nunca `privado`", () => {
    const api = leerToml(leer(RUTA_CONFIG))["api"];
    expect(api?.["schemas"]).toBe('["public"]');
    const sinComentariosToml = leer(RUTA_CONFIG).replace(/^\s*#.*$/gm, "");
    expect(sinComentariosToml).not.toMatch(/privado/);
  });

  it("extra_search_path es public y extensions", () => {
    const api = leerToml(leer(RUTA_CONFIG))["api"];
    expect(api?.["extra_search_path"]).toBe('["public", "extensions"]');
  });

  it("la carga automática del seed está desactivada (D-10, CA-003)", () => {
    const semilla = leerToml(leer(RUTA_CONFIG))["db.seed"];
    expect(semilla?.["enabled"]).toBe("false");
  });

  it("no lleva secretos ni claves", () => {
    expect(leer(RUTA_CONFIG)).not.toMatch(/(?:secret|password|jwt|key|token)\s*=/i);
  });

  it("el lector detecta un esquema de más", () => {
    const malo = leerToml('[api]\nschemas = ["public", "privado"]\n')["api"];
    expect(malo?.["schemas"]).not.toBe('["public"]');
  });
});

function guardaYOrden(ruta: string) {
  const crudo = leer(ruta);
  const texto = normalizar(crudo);
  const iGuarda = texto.indexOf("seed_entorno_no_permitido");
  const primeraEscritura = texto.search(/\b(?:insert into|update|delete from)\b/);
  return { crudo, texto, iGuarda, primeraEscritura };
}

describe.each([RUTA_SEED, RUTA_VOLUMEN])("L 9 · %s (D-10)", (ruta) => {
  it("existe y es una sola transacción: begin al principio, commit al final", () => {
    const { texto } = guardaYOrden(ruta);
    expect(texto.startsWith("begin;")).toBe(true);
    expect(texto.endsWith("commit;")).toBe(true);
  });

  it("la guarda es de lista de permitidos (ci o desarrollo), sin la variable falla y va antes de toda escritura", () => {
    const { texto, iGuarda, primeraEscritura } = guardaYOrden(ruta);
    expect(iGuarda).toBeGreaterThan(-1);
    // Sin la variable (NULL) cae en '' y no está en la lista: falla. Literal completo.
    expect(texto).toContain("coalesce(pg_catalog.current_setting('app.entorno', true), '')");
    expect(texto).toMatch(/<>\) all \(array\['ci', 'desarrollo'\]\)/);
    // Ninguna lista de prohibidos: la palabra «produccion» no figura en el código.
    expect(texto).not.toMatch(/produccion/);
    expect(primeraEscritura).toBeGreaterThan(iGuarda);
  });

  it("exige el rol dueño (postgres): con otro, los disparadores de auditoría cambiarían el resultado", () => {
    const { texto } = guardaYOrden(ruta);
    expect(texto).toContain("current_user operator(pg_catalog.<>) 'postgres'");
    expect(texto).toContain("seed_rol_no_permitido");
  });

  it("N-8: declara que protege de accidentes y no de quien actúa con postgres", () => {
    const { crudo } = guardaYOrden(ruta);
    const cabecera = crudo.slice(0, crudo.search(/^begin;/m));
    expect(cabecera).toMatch(/accidentes/);
    expect(cabecera).toMatch(/no de quien actúa a propósito con `?postgres`?/);
  });

  it("fija search_path = pg_catalog, pg_temp con set local", () => {
    const { texto } = guardaYOrden(ruta);
    expect(texto).toContain("set local search_path to pg_catalog, pg_temp;");
  });

  it("sin contraseñas ni identidades; solo correos @example.com", () => {
    const { texto, crudo } = guardaYOrden(ruta);
    expect(texto).not.toMatch(/encrypted_password|auth\.identities|crypt\(|gen_salt|\bpassword\b/);
    const correos = [...sinComentarios(crudo).matchAll(/[A-Za-z0-9._+-]+@[A-Za-z0-9.-]+/g)].map(
      (m) => m[0],
    );
    for (const c of correos) expect(c).toMatch(/@example\.com$/);
  });

  it("sin literales de HMAC de 64 hexadecimales ni secretos: se construyen con repeat()", () => {
    const { crudo } = guardaYOrden(ruta);
    expect(sinComentarios(crudo)).not.toMatch(/'[0-9a-f]{64}'/);
    expect(crudo).not.toMatch(/(?:sk|pk|whsec|rk)_(?:live|test)_|eyJ[A-Za-z0-9_-]{10,}/);
  });

  it("no lleva E'…' ni U&'…', ni on conflict, ni toca el esquema privado, ni cambia la base", () => {
    const { texto, crudo } = guardaYOrden(ruta);
    expect(escapesProhibidos(crudo)).toEqual([]);
    expect(texto).not.toMatch(/on conflict/);
    expect(texto).not.toMatch(/\bprivado\./);
    expect(texto).not.toMatch(
      /\balter (?:database|role|system)\b|\bcreate (?:role|function|extension)\b/,
    );
    expect(texto).not.toMatch(/\bdisable trigger\b|\bsession_replication_role\b/);
  });

  it("no carga el catálogo ni los ajustes: los trae M10 (decisión 9 de T-006)", () => {
    const { texto } = guardaYOrden(ruta);
    expect(texto).not.toMatch(/insert into public\.(?:ajustes_globales|catalogo_problemas)\b/);
  });
});

describe("seed.sql · perfiles de D-10", () => {
  const { texto } = guardaYOrden(RUTA_SEED);

  it("crea los ocho usuarios con correo de example.com y los tres clientes ficticios", () => {
    for (const correo of [
      "usuario-a",
      "usuario-b",
      "usuario-ab",
      "usuario-sin-vinculo",
      "superadmin-1",
      "superadmin-2",
      "superadmin-1a",
      "superadmin-3",
    ]) {
      expect(texto).toContain(`'${correo}@example.com'`);
    }
    for (const n of ["a", "b", "c"]) expect(texto).toContain(`'cliente ${n} ficticio'`);
  });

  it("solo inserta en auth.users las columnas id y email", () => {
    expect(texto).toMatch(/insert into auth\.users \(id, email\)/);
  });
});

describe("volumen.sql · D-10", () => {
  it("usa generate_series para 10 clientes y 365 días", () => {
    const { texto } = guardaYOrden(RUTA_VOLUMEN);
    expect(texto).toContain("generate_series(1, 10)");
    expect(texto).toContain("generate_series(0, 364)");
  });
});

describe("procedimiento de administradores (REQ-060, CA-037)", () => {
  it("existe, sin órdenes de psql (solo dos interpolaciones) y sin valores secretos", () => {
    const crudo = leer(RUTA_PROCEDIMIENTO);
    expect(crudo.split(/\r?\n/).filter((l) => l.startsWith("\\"))).toEqual([]);
    const sin = sinComentarios(crudo);
    expect([...sin.matchAll(/:'(\w+)'/g)].map((m) => m[1]).sort()).toEqual(["accion", "usuario"]);
    expect(normalizar(crudo)).not.toMatch(/\bpassword\b|encrypted_password/);
    expect(escapesProhibidos(crudo)).toEqual([]);
  });

  it("es una transacción con guarda de rol y de acción, y comprueba la fila de auditoría", () => {
    const texto = normalizar(leer(RUTA_PROCEDIMIENTO));
    expect(texto.startsWith("begin;")).toBe(true);
    expect(texto.endsWith("commit;")).toBe(true);
    expect(texto).toContain("current_user operator(pg_catalog.<>) 'postgres'");
    expect(texto).toContain("procedimiento_rol_no_permitido");
    expect(texto).toContain("procedimiento_accion_desconocida");
    expect(texto).toContain("procedimiento_auditoria_no_registrada");
    expect(texto).toContain("procedimiento_ultimo_administrador");
  });

  it("la baja bloquea la tabla antes de comprobar existencia y número (último administrador, bajas simultáneas)", () => {
    const texto = normalizar(leer(RUTA_PROCEDIMIENTO));
    const bloqueo = texto.indexOf("lock table public.administradores in share row exclusive mode;");
    expect(bloqueo).toBeGreaterThan(-1);
    expect(bloqueo).toBeLessThan(texto.indexOf("procedimiento_administrador_inexistente"));
    expect(bloqueo).toBeLessThan(texto.indexOf("procedimiento_ultimo_administrador"));
  });

  it("la guía existe, cita el procedimiento y el criterio, y no trae valores secretos", () => {
    expect(existsSync(new URL(RUTA_GUIA, RAIZ))).toBe(true);
    const guia = leer(RUTA_GUIA);
    expect(guia).toContain("supabase/procedimientos/administradores.sql");
    expect(guia).toMatch(/REQ-060/);
    expect(guia).toMatch(/CA-037/);
    expect(guia).toMatch(/fuera de la API/i);
    expect(guia).not.toMatch(
      /eyJ[A-Za-z0-9_-]{10,}|postgres:\/\/\S+:\S+@|(?:sk|rk|whsec)_(?:live|test)_/,
    );
  });
});
