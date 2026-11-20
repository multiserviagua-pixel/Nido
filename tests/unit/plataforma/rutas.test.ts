import { readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";

const METODOS = "GET|HEAD|POST|PUT|PATCH|DELETE|OPTIONS";
const AJUSTES = "dynamic|revalidate|maxDuration";

function rutas(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true, recursive: true })
    .filter((e) => e.isFile() && /^route\.(?:[cm]?[jt]sx?)$/.test(e.name))
    .map((e) => join(e.parentPath, e.name));
}

const normalizar = (ruta: string) => relative(process.cwd(), ruta).replaceAll("\\", "/");

// Diagnóstico no capturado (diseño §App base, punto 1): única ruta permitida sin manejador,
// anclada a su ruta exacta.
const EXCEPCION = "src/app/api/diagnostico/error-no-capturado/route.ts";
const sinManejador = (ruta: string) => normalizar(ruta) === EXCEPCION;

// Devuelve los problemas de un route.*: sin importar manejador, o con alguna exportación
// que no sea un método envuelto en manejador/noPermitido ni un ajuste de segmento admitido.
export function problemasDeRuta(codigo: string): string[] {
  const problemas: string[] = [];
  if (!/from\s+["'][./]*(?:@\/)?[\w./]*lib\/plataforma\/manejador["']/.test(codigo)) {
    problemas.push("no importa manejador");
  }
  const exportaciones = [...codigo.matchAll(/\bexport\b/g)];
  if (exportaciones.length === 0) problemas.push("no exporta nada");
  for (const m of exportaciones) {
    const resto = codigo.slice((m.index ?? 0) + 6);
    const envuelto = new RegExp(
      String.raw`^\s+const\s+(?:${METODOS})\s*=\s*(?:manejador|noPermitido)\(`,
    );
    const ajuste = new RegExp(String.raw`^\s+const\s+(?:${AJUSTES})\s*(?::[^=;]+)?=`);
    if (!envuelto.test(resto) && !ajuste.test(resto)) {
      problemas.push(`exportación no admitida: ${resto.trimStart().slice(0, 30)}`);
    }
  }
  return problemas;
}

describe("problemasDeRuta: ejemplos sintéticos", () => {
  const IMPORTA = 'import { manejador, noPermitido } from "../../lib/plataforma/manejador";\n';
  const buenos: Array<[string, string]> = [
    ["GET envuelto", 'export const GET = manejador("/a", () => new Response());\n'],
    ["noPermitido", 'export const POST = noPermitido("/a", "GET");\n'],
    ["OPTIONS", 'export const OPTIONS = noPermitido("/a", "GET");\n'],
    ["dynamic", 'export const dynamic = "force-dynamic";\n'],
    ["revalidate", "export const revalidate = 0;\n"],
    ["maxDuration", "export const maxDuration = 10;\n"],
    ["ajuste con tipo", 'export const dynamic: string = "force-dynamic";\n'],
    ["envuelto en dos líneas", 'export const GET =\n  manejador("/a", () => new Response());\n'],
  ];
  for (const [nombre, codigo] of buenos) {
    it(`admite ${nombre}`, () => expect(problemasDeRuta(IMPORTA + codigo)).toEqual([]));
  }

  const malos: Array<[string, string]> = [
    ["función exportada", "export function GET() { return new Response(); }\n"],
    ["función asíncrona", "export async function GET() { return new Response(); }\n"],
    ["alias con export { f as GET }", "const f = () => new Response();\nexport { f as GET };\n"],
    ["export let", "export let GET = () => new Response();\n"],
    ["export var", "export var GET = () => new Response();\n"],
    ["const sin envolver", "export const GET = () => new Response();\n"],
    ["export default", "export default function () {}\n"],
    ["reexportación", 'export * from "./otra";\n'],
    ["ajuste no admitido", 'export const runtime = "edge";\n'],
    ["nombre que no es método", 'export const ayuda = manejador("/a", () => new Response());\n'],
  ];
  for (const [nombre, codigo] of malos) {
    it(`detecta ${nombre}`, () => expect(problemasDeRuta(IMPORTA + codigo)).not.toEqual([]));
  }

  it("detecta que no importa manejador", () => {
    expect(problemasDeRuta('export const dynamic = "force-dynamic";\n')).toContain(
      "no importa manejador",
    );
  });
});

describe("la excepción está anclada a su ruta exacta", () => {
  it("solo la ruta exacta queda exenta", () => {
    expect(sinManejador(join(process.cwd(), EXCEPCION))).toBe(true);
    expect(sinManejador(EXCEPCION)).toBe(true);
    expect(sinManejador("src/app/api/otra/api/diagnostico/error-no-capturado/route.ts")).toBe(
      false,
    );
    expect(sinManejador("src/app/api/diagnostico/error-no-capturado/route.tsx")).toBe(false);
    expect(sinManejador("src/app/api/x/error-no-capturado/route.ts")).toBe(false);
  });
});

describe("todo route.* usa manejador.ts", () => {
  const archivos = rutas("src/app");
  it("hay al menos una ruta", () => expect(archivos.length).toBeGreaterThan(0));
  for (const archivo of archivos.filter((a) => !sinManejador(a))) {
    it(archivo, () => expect(problemasDeRuta(readFileSync(archivo, "utf8"))).toEqual([]));
  }
});
