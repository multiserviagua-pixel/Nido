// T-106 (a), 001 C-4 y PRUEBA-016 parte V-3: los archivos que el conector lee en tiempo de ejecución
// (prompt, contratos y raíz TLS de Supabase) deben ir en la traza de la ruta /api/mcp.
// Dos niveles: configuración (siempre) y traza real de `next build` (.next/.../route.js.nft.json).
// Si la traza no existe o es anterior a `next.config.ts`, la prueba lanza `next build`; si el build
// falla, la prueba falla (cierre en fallo, nunca se da por buena una traza ausente).
import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { describe, expect, it } from "vitest";

const RAIZ = resolve(__dirname, "../../..");
const TRAZA = join(RAIZ, ".next", "server", "app", "api", "mcp", "route.js.nft.json");
const REQUERIDOS = [
  "prompts/agente-prueba/0.1.md",
  "prompts/agente-prueba/arranque.md",
  "contratos/informe.schema.json",
  "contratos/enviar-informe.schema.json",
  "contratos/confirmar-orden.schema.json",
  "contratos/obtener-instrucciones.schema.json",
  "supabase/conector-prueba/raiz-supabase.crt",
];

// Lista blanca: fuera de node_modules/ y .next/ la traza solo puede contener REQUERIDOS (ni más ni menos).
function ajenosALaListaBlanca(rutas: Iterable<string>): string[] {
  return [...rutas].filter((r) => !/^(node_modules|\.next)\//.test(r) && !REQUERIDOS.includes(r));
}

function recorrer(dir: string, salida: string[] = []): string[] {
  if (!existsSync(dir)) return salida;
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) recorrer(p, salida);
    else salida.push(p);
  }
  return salida;
}

async function incluye(): Promise<Record<string, string[]>> {
  const m = (await import("../../../next.config")) as {
    default: { outputFileTracingIncludes?: Record<string, string[]> };
  };
  return m.default.outputFileTracingIncludes ?? {};
}

describe("trazado de archivos del conector (C-4, V-3)", () => {
  it("next.config.ts declara outputFileTracingIncludes para /api/mcp con los tres orígenes", async () => {
    const inc = await incluye();
    expect(Object.keys(inc)).toEqual(["/api/mcp"]);
    const globs = inc["/api/mcp"];
    expect(globs).toBeDefined();
    expect(globs).toEqual(
      expect.arrayContaining([
        "./prompts/agente-prueba/**",
        "./contratos/**",
        "./supabase/conector-prueba/raiz-supabase.crt",
      ]),
    );
  });

  it("no traza el resto del repositorio en esa ruta (solo lo necesario)", async () => {
    const globs = (await incluye())["/api/mcp"] ?? [];
    expect(globs.length).toBe(3);
  });

  it("la lista blanca detecta lo que sobra fuera de node_modules y .next", () => {
    expect(ajenosALaListaBlanca([...REQUERIDOS, "node_modules/x/i.js", ".next/x.js"])).toEqual([]);
    for (const extra of [
      "package.json",
      "supabase/migrations/x.sql",
      ".env.local",
      "src/x.ts",
      "docs/a.md",
    ])
      expect(ajenosALaListaBlanca([...REQUERIDOS, extra]), extra).toEqual([extra]);
  });

  it("cada archivo requerido existe en disco", () => {
    for (const r of REQUERIDOS) expect(existsSync(join(RAIZ, r)), r).toBe(true);
  });

  it("la traza de next build de /api/mcp incluye prompt, contratos y certificado", () => {
    // La traza solo vale si es más reciente que todo lo que puede cambiarla; si no, se compila.
    // Se elige la comprobación de antigüedad y no compilar siempre porque `distDir` no se puede
    // cambiar desde fuera sin tocar `next.config.ts` (configuración de producción) y un build
    // completo en cada ejecución encarece la batería; la antigüedad cubre lo que decide la traza.
    const entradas = [
      ...["next.config.ts", "package.json", "package-lock.json", "tsconfig.json"].map((r) =>
        join(RAIZ, r),
      ),
      ...REQUERIDOS.map((r) => join(RAIZ, r)),
      ...recorrer(join(RAIZ, "src")),
    ].filter((p) => existsSync(p));
    const masReciente = Math.max(...entradas.map((p) => statSync(p).mtimeMs));
    const vieja = !existsSync(TRAZA) || statSync(TRAZA).mtimeMs < masReciente;
    if (vieja) {
      execFileSync("npx", ["next", "build"], {
        cwd: RAIZ,
        stdio: "pipe",
        shell: true,
        timeout: 240_000,
        env: { ...process.env, NEXT_TELEMETRY_DISABLED: "1" },
      });
    }
    expect(existsSync(TRAZA)).toBe(true);
    const traza = JSON.parse(readFileSync(TRAZA, "utf8")) as { files: string[] };
    const rutas = new Set(
      traza.files.map((f) => relative(RAIZ, resolve(dirname(TRAZA), f)).replaceAll("\\", "/")),
    );
    for (const r of REQUERIDOS) expect(rutas, r).toContain(r);
    // 5: lista blanca; la traza no arrastra nada más (secretos, specs, docs, migraciones, ajustes...).
    expect(ajenosALaListaBlanca(rutas)).toEqual([]);
  }, 300_000);
});
