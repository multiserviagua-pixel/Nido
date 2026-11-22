// T-112 (a) (001): inventario de rutas y cabeceras de la función 001 (`tests/plataforma/inventario-rutas-001.json`).
// PRUEBA-009 (parte: `Referrer-Policy: same-origin` solo en `/oauth/autorizar`).
//  - Parte estática (siempre): el inventario y los archivos de ruta de `src/app` coinciden en los dos sentidos, y
//    la configuración de Next (`headers()`) da a cada ruta exactamente las cabeceras del inventario.
//  - Parte contra `next start` (EJECUCIÓN PENDIENTE: necesita build y servidor): solo corre si
//    INVENTARIO_BASE_URL apunta a un servidor levantado (p. ej. http://localhost:3000 tras `npm run build` y
//    `npm run start`); si no, Vitest la marca como omitida, nunca como superada.
// Mutaciones que detecta: poner `same-origin` en otra ruta o en la regla global; quitar la exclusión de
// `/oauth/autorizar` en el `source` global; añadir una ruta de la 001 sin inventariarla; una cabecera general
// ausente en una ruta.
import { readdirSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";

const pathToRegexp = createRequire(import.meta.url)("next/dist/compiled/path-to-regexp") as {
  pathToRegexp: (ruta: string) => RegExp;
};
type Cabecera = { key: string; value: string };
type Regla = { source: string; headers: Cabecera[] };
interface Inventario {
  cabecerasGenerales: Record<string, string>;
  excepciones: Record<string, { cabeceras: Record<string, string>; sin: string[] }>;
  rutas: { ruta: string; archivo: string; metodos: string[] }[];
}
const inventario = JSON.parse(
  readFileSync(join(process.cwd(), "tests", "plataforma", "inventario-rutas-001.json"), "utf8"),
) as Inventario;

async function reglas(): Promise<Regla[]> {
  const m = (await import("../../../next.config")) as {
    default: { headers?: () => Promise<Regla[]> };
  };
  if (typeof m.default.headers !== "function")
    throw new Error("next.config.ts no define headers()");
  return m.default.headers();
}
function efectivas(regla: Regla[], ruta: string): Map<string, string> {
  const salida = new Map<string, string>();
  for (const r of regla) {
    if (!pathToRegexp.pathToRegexp(r.source).test(ruta)) continue;
    for (const c of r.headers) salida.set(c.key, c.value);
  }
  return salida;
}
/** Cabeceras que el inventario exige para una ruta (generales, con la excepción aplicada). */
function esperadas(ruta: string): { con: Record<string, string>; sin: string[] } {
  const exc = inventario.excepciones[ruta];
  const con = { ...inventario.cabecerasGenerales, ...(exc?.cabeceras ?? {}) };
  for (const k of exc?.sin ?? []) delete con[k];
  return { con, sin: exc?.sin ?? [] };
}

describe("inventario de la 001: archivos de ruta", () => {
  const archivos = readdirSync(join(process.cwd(), "src", "app"), {
    withFileTypes: true,
    recursive: true,
  })
    .filter((e) => e.isFile() && e.name === "route.ts")
    .map((e) => relative(process.cwd(), join(e.parentPath, e.name)).replaceAll("\\", "/"))
    .filter((a) => /^src\/app\/(api\/(mcp|operacion)|oauth|\.well-known)\//.test(a));

  it("todo archivo de ruta del conector figura en el inventario", () => {
    const inventariados = new Set(inventario.rutas.map((r) => r.archivo));
    expect(archivos.filter((a) => !inventariados.has(a))).toEqual([]);
  });
  it("todo archivo inventariado existe y exporta los métodos declarados", () => {
    for (const r of inventario.rutas) {
      const codigo = readFileSync(join(process.cwd(), r.archivo), "utf8");
      for (const metodo of r.metodos) {
        expect(codigo, `${r.ruta} ${metodo}`).toMatch(
          new RegExp(String.raw`export const ${metodo}\s*=`),
        );
      }
    }
  });
  it("una sola excepción de cabeceras: /oauth/autorizar", () => {
    expect(Object.keys(inventario.excepciones)).toEqual(["/oauth/autorizar"]);
  });
});

describe("inventario de la 001: cabeceras de la configuración de Next", () => {
  it.each(inventario.rutas.map((r) => r.ruta))(
    "%s lleva exactamente lo inventariado",
    async (ruta) => {
      const reales = efectivas(await reglas(), ruta);
      const { con, sin } = esperadas(ruta);
      for (const [k, v] of Object.entries(con)) expect(reales.get(k), `${ruta} ${k}`).toBe(v);
      for (const k of sin) expect(reales.has(k), `${ruta} no debe llevar ${k}`).toBe(false);
    },
  );

  it("`same-origin` solo aparece en /oauth/autorizar (con y sin barra final)", async () => {
    const regla = await reglas();
    for (const r of inventario.rutas) {
      const valor = efectivas(regla, r.ruta).get("Referrer-Policy");
      expect(valor === "same-origin", r.ruta).toBe(r.ruta === "/oauth/autorizar");
    }
    expect(efectivas(regla, "/oauth/autorizar/").get("Referrer-Policy")).toBe("same-origin");
    expect(efectivas(regla, "/oauth/autorizar-otra").get("Referrer-Policy")).toBe("no-referrer");
  });
});

const BASE = process.env.INVENTARIO_BASE_URL;
describe.skipIf(BASE === undefined)(
  "inventario de la 001 contra `next start` (ejecución pendiente sin servidor)",
  () => {
    it.each(inventario.rutas.flatMap((r) => r.metodos.map((m) => [r.ruta, m] as const)))(
      "%s %s lleva las cabeceras del inventario",
      async (ruta, metodo) => {
        const r = await fetch(`${BASE}${ruta}`, {
          method: metodo,
          redirect: "manual",
          body: metodo === "POST" ? "{}" : undefined,
        });
        const { con, sin } = esperadas(ruta);
        for (const [k, v] of Object.entries(con)) expect(r.headers.get(k), `${ruta} ${k}`).toBe(v);
        for (const k of sin) {
          // La pantalla de /oauth/autorizar lleva su propia CSP, distinta de la general.
          expect(r.headers.get(k), `${ruta} ${k}`).not.toBe(inventario.cabecerasGenerales[k]);
        }
        expect(r.headers.get("x-powered-by")).toBeNull();
      },
    );
  },
);
