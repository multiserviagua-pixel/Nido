// T-106 (b), 002 diseño §Batería «Región» (parte de archivo de PRUEBA-012): vercel.json y .vercelignore.
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";

const RAIZ = resolve(__dirname, "../../..");
const leer = (r: string): string => readFileSync(join(RAIZ, r), "utf8");
const vercel = (): Record<string, unknown> =>
  JSON.parse(leer("vercel.json")) as Record<string, unknown>;

function recorrer(dir: string, salida: string[] = []): string[] {
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) recorrer(p, salida);
    else salida.push(p);
  }
  return salida;
}

// PENDIENTE (T-117 / arquitecto, hallazgo 6 del auditor): fijar `buildCommand` y `framework` en
// vercel.json para que la compilación no dependa de la detección automática. Exige cambiar el diseño
// 002 (hoy vercel.json solo admite $schema, regions e installCommand, ver la prueba de claves
// exactas), por lo que no se hace en T-106.
describe("región (vercel.json)", () => {
  it("existe vercel.json", () => expect(existsSync(join(RAIZ, "vercel.json"))).toBe(true));
  it('regions es exactamente ["arn1"]', () => expect(vercel().regions).toEqual(["arn1"]));
  it("vercel.json tiene exactamente $schema, regions e installCommand", () =>
    expect(Object.keys(vercel()).sort()).toEqual(["$schema", "installCommand", "regions"]));
  it("sin conmutación de región por fallo", () =>
    expect("functionFailoverRegions" in vercel()).toBe(false));
  it("sin regiones en functions", () => {
    const f = (vercel().functions ?? {}) as Record<string, Record<string, unknown>>;
    for (const v of Object.values(f)) expect("regions" in v).toBe(false);
  });
  it("installCommand es npm ci --ignore-scripts", () =>
    expect(vercel().installCommand).toBe("npm ci --ignore-scripts"));
  it("no hay vercel.ts, proxy.* ni middleware.*", () => {
    expect(existsSync(join(RAIZ, "vercel.ts"))).toBe(false);
    for (const base of ["", "src"]) {
      const d = join(RAIZ, base);
      for (const e of readdirSync(d))
        expect(/^(proxy|middleware)\.[a-z]+$/.test(e), `${base}/${e}`).toBe(false);
    }
  });
  it("src/ no declara edge ni preferredRegion", () => {
    for (const f of recorrer(join(RAIZ, "src")).filter((p) => /\.(tsx?|jsx?|mjs)$/.test(p))) {
      const t = readFileSync(f, "utf8");
      expect(/runtime\s*=\s*["']edge["']|preferredRegion/.test(t), f).toBe(false);
    }
  });
  it("engines.node es 26.x", () => {
    const p = JSON.parse(leer("package.json")) as { engines: { node: string } };
    expect(p.engines.node).toBe("26.x");
  });
  it("ningún script pasa --regions", () => {
    for (const f of existsSync(join(RAIZ, "scripts")) ? recorrer(join(RAIZ, "scripts")) : [])
      if (/\.(m?js|ts)$/.test(f)) expect(/--regions/.test(readFileSync(f, "utf8")), f).toBe(false);
  });
});

// Evaluador mínimo de `.vercelignore` con semántica gitignore, sin dependencias. No se usa
// `path.matchesGlob` porque trata `dir/` y los patrones sin barra de otro modo que gitignore.
// Soporta: comentarios, `*`, `?`, `**`, `/` inicial (ancla), `/` final (solo directorios), patrón
// sin barra intermedia (en cualquier profundidad) y exclusión de lo que cuelga de un directorio
// excluido. No soporta `!` (negación) ni clases `[...]`: ambos se rechazan.
function aRegex(cuerpo: string): string {
  let r = "";
  for (let i = 0; i < cuerpo.length; i++) {
    const c = cuerpo[i] as string;
    if (c === "*" && cuerpo[i + 1] === "*") {
      if (cuerpo[i + 2] === "/") {
        r += "(?:.*/)?";
        i += 2;
      } else {
        r += ".*";
        i += 1;
      }
    } else if (c === "*") r += "[^/]*";
    else if (c === "?") r += "[^/]";
    else r += c.replace(/[.+^${}()|[\]\\]/g, "\\$&");
  }
  return r;
}

function compilar(linea: string): { re: RegExp; soloDirectorio: boolean } {
  if (linea !== linea.trim())
    throw new Error(`espacios o CR en la línea: ${JSON.stringify(linea)}`);
  if (linea.startsWith("!")) throw new Error(`negación prohibida: ${linea}`);
  if (/\[/.test(linea)) throw new Error(`clase de caracteres no soportada: ${linea}`);
  let cuerpo = linea;
  const soloDirectorio = cuerpo.endsWith("/");
  if (soloDirectorio) cuerpo = cuerpo.slice(0, -1);
  const anclado = cuerpo.includes("/");
  if (cuerpo.startsWith("/")) cuerpo = cuerpo.slice(1);
  const re = new RegExp(`^${anclado ? "" : "(?:.*/)?"}${aRegex(cuerpo)}$`);
  return { re, soloDirectorio };
}

function excluida(patrones: string[], ruta: string): boolean {
  const partes = ruta.split("/");
  const compilados = patrones.map(compilar);
  for (let n = 1; n <= partes.length; n++) {
    const prefijo = partes.slice(0, n).join("/");
    const esDirectorio = n < partes.length;
    for (const { re, soloDirectorio } of compilados)
      if ((esDirectorio || !soloDirectorio) && re.test(prefijo)) return true;
  }
  return false;
}

const DENTRO = [
  "prompts/agente-prueba/0.1.md",
  "prompts/agente-prueba/arranque.md",
  "contratos/informe.schema.json",
  "contratos/enviar-informe.schema.json",
  "contratos/confirmar-orden.schema.json",
  "contratos/obtener-instrucciones.schema.json",
  "supabase/conector-prueba/raiz-supabase.crt",
  "package.json",
  "package-lock.json",
  ".npmrc",
  "tsconfig.json",
  "postcss.config.mjs",
  "next.config.ts",
  "vercel.json",
  "src/app/api/mcp/route.ts",
  // Carpetas con nombre de las excluidas en la raíz, pero dentro de src/ (anclaje a la raíz).
  "src/app/docs/page.tsx",
  "src/lib/scripts/x.ts",
  "src/lib/specs/x.ts",
  "src/lib/tests/x.ts",
  "src/lib/out/x.ts",
  "src/lib/coverage/x.ts",
  "src/lib/herramientas/despliegue/x.ts",
];
const FUERA = [
  ".env",
  ".env.local",
  "src/x/.env.local",
  ".claude/settings.local.json",
  "specs/001-conector-prueba-real/diseno.md",
  "marketing/x",
  "tests/unit/x.test.ts",
  "docs/ARQUITECTURA.md",
  "scripts/comprobar-specs.mjs",
  "supabase/tests/x.sql",
  "supabase/migrations/x.sql",
  "node_modules/x/index.js",
  ".next/server/x.js",
  "tsconfig.tsbuildinfo",
  "next-env.d.ts",
  ".vercel/project.json",
  "coverage/x.html",
  "out/x.html",
  ".env.production",
  ".env.development",
  ".env.example",
  ".github/x.yml",
  ".git/x",
  "supabase/reversiones/x.sql",
  "playwright.config.ts",
  "vitest.config.ts",
  "supabase/.temp/x",
  "supabase/.branches/x",
  "dist/x.js",
  "npm-debug.log",
  "src/x/y.log",
  "herramientas/despliegue/x.sh",
];

describe(".vercelignore", () => {
  const lineas = (): string[] =>
    leer(".vercelignore")
      .split("\n")
      .filter((l) => l !== "" && !l.startsWith("#"));

  // Todo lo que cuelga de src/, public/, prompts/ y contratos/ debe subirse, más lo fijo de DENTRO.
  const existentes = (): string[] =>
    ["src", "public", "prompts", "contratos"]
      .filter((d) => existsSync(join(RAIZ, d)))
      .flatMap((d) => recorrer(join(RAIZ, d)))
      .map((p) => p.slice(RAIZ.length + 1).replaceAll("\\", "/"))
      .filter((p) => !/\.(test|spec)\.tsx?$/.test(p));

  function violaciones(patrones: string[]): string[] {
    const v: string[] = [];
    try {
      for (const r of [...new Set([...DENTRO, ...existentes()])])
        if (excluida(patrones, r)) v.push(`debería subirse: ${r}`);
      for (const r of FUERA) if (!excluida(patrones, r)) v.push(`debería excluirse: ${r}`);
    } catch (e) {
      v.push((e as Error).message);
    }
    return v;
  }

  it("las rutas necesarias están dentro y las sensibles fuera", () => {
    expect(violaciones(lineas())).toEqual([]);
  });
  it("las rutas de DENTRO existen en disco", () => {
    for (const r of DENTRO.filter(
      (x) => !/^src\/(app\/docs|lib\/(scripts|specs|tests|out|coverage|herramientas))\//.test(x),
    ))
      expect(existsSync(join(RAIZ, r)), r).toBe(true);
  });
  it("no hay negaciones", () => {
    expect(lineas().filter((l) => l.startsWith("!"))).toEqual([]);
  });
  it.each([
    "prompts/**",
    "/contratos/*",
    "supabase/conector-prueba/",
    "*.json",
    "tsconfig.json",
    "src/lib/",
    "!.env.production",
    "  .env*",
  ])("mutación que debe detectarse: %s", (mutante) => {
    expect(violaciones([...lineas(), mutante]).length).toBeGreaterThan(0);
  });
  it("sustituir .env* por «  .env*» (con espacios) produce violaciones", () => {
    const cambiado = lineas().map((l) => (l === ".env*" ? "  .env*" : l));
    expect(cambiado).toContain("  .env*");
    expect(violaciones(cambiado).length).toBeGreaterThan(0);
  });
  it("el evaluador rechaza espacios y CR en cualquier línea (Vercel no los recorta)", () => {
    for (const l of ["  .env*", ".env* ", "\t.env*", ".env*\r", "   "])
      expect(() => excluida([l], ".env"), JSON.stringify(l)).toThrow(/espacios/);
  });
  it("el archivo real no tiene líneas con espacios ni CR", () => {
    const malas = leer(".vercelignore")
      .split("\n")
      .filter((l) => l !== l.trim());
    expect(malas).toEqual([]);
  });
  it("el evaluador distingue ancla, directorio y profundidad", () => {
    expect(excluida(["/tests/"], "tests/a.ts")).toBe(true);
    expect(excluida(["/tests/"], "src/tests/a.ts")).toBe(false);
    expect(excluida(["tests/"], "src/tests/a.ts")).toBe(true);
    expect(excluida(["docs/"], "docs")).toBe(false);
    expect(excluida([".env*"], "src/x/.env.local")).toBe(true);
    expect(excluida(["*.json"], "a/b/c.json")).toBe(true);
    expect(excluida(["/*.json"], "a/c.json")).toBe(false);
    expect(excluida(["a/**/b"], "a/b")).toBe(true);
    expect(excluida(["a/**/b"], "a/x/y/b")).toBe(true);
    expect(excluida(["a/**"], "a/x/y")).toBe(true);
  });
});
