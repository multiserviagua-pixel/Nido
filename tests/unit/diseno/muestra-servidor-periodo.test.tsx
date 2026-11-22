// T-010 (e2) · `/muestra/servidor/periodo`: la vista de muestra cuyas cifras pinta el servidor a
// partir de `?periodo=` (PRUEBA-012, PRUEBA-016, PRUEBA-034; REQ-006, REQ-061, REQ-084; CA-020,
// CA-043, CA-046). Hace el papel de la vista real: lee la dirección en el servidor, no pide datos
// desde el navegador. Aquí, el marcado del servidor y las reglas de la muestra; el cambio de
// periodo con navegación lo mide `periodo-servidor.spec.ts`.
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import type { ReactElement } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { buscarEstado, INVENTARIO, rutaDeEstado } from "../../../src/app/muestra/inventario";
import { TEXTOS } from "../../../src/components/textos";

vi.setConfig({ testTimeout: 60_000 });

const estado = vi.hoisted(() => ({ host: "localhost:3000" as string | null }));
vi.mock("next/navigation", async (original) => ({
  ...(await original<typeof import("next/navigation")>()),
  // El enrutador de la aplicación no está montado al pintar en el servidor de pruebas.
  useRouter: () => ({ replace: () => {}, push: () => {}, refresh: () => {} }),
}));
vi.mock("next/headers", () => ({
  headers: async () => ({ get: (n: string) => (n.toLowerCase() === "host" ? estado.host : null) }),
}));
afterEach(() => {
  vi.unstubAllEnvs();
  estado.host = "localhost:3000";
});

const RAIZ = resolve(import.meta.dirname, "..", "..", "..");
const RUTA = "/muestra/servidor/periodo";

type Pagina = {
  default: (p?: { searchParams?: Promise<Record<string, string>> }) => Promise<ReactElement>;
  metadata: { title?: string };
};
async function cargar(): Promise<Pagina> {
  vi.resetModules();
  const ruta = "../../../src/app/muestra/servidor/periodo/page.muestra";
  return (await import(/* @vite-ignore */ ruta)) as unknown as Pagina;
}
async function pintar(consulta?: Record<string, string>): Promise<string> {
  vi.stubEnv("ENTORNO", "preproduccion");
  const m = await cargar();
  return renderToStaticMarkup(
    await m.default(consulta === undefined ? {} : { searchParams: Promise.resolve(consulta) }),
  );
}
const cifras = (html: string): string[] =>
  [...html.matchAll(/data-cifra[^>]*>([^<]*)</g)].map((m) => m[1]!);

describe("inventario · la vista de servidor del periodo", () => {
  const entrada = INVENTARIO.find((e) => e.clave === "vista-servidor-periodo");

  it("es una página con ruta fija bajo /muestra/servidor/ y un estado", () => {
    expect(entrada).toBeDefined();
    expect(entrada!.tipo).toBe("pagina");
    expect(rutaDeEstado(entrada!, "unico")).toBe(RUTA);
    expect(buscarEstado("vista-servidor-periodo", "unico")).toBeDefined();
  });
});

describe("/muestra/servidor/periodo · lo que pinta el servidor", () => {
  it("el título del documento es el h1 y es un valor fijo", async () => {
    const m = await cargar();
    const html = await pintar();
    expect(typeof m.metadata.title).toBe("string");
    expect(m.metadata.title).toBe(/>([^<]*)<\/h1>/.exec(html)![1]);
  });

  it("un selector de periodo y tres cifras, con el periodo por defecto sin parámetro", async () => {
    const html = await pintar();
    expect(html.match(/<select\b/g)).toHaveLength(1);
    expect(html).toMatch(/<option[^>]*value="ultimos-30-dias"[^>]*selected/);
    expect(cifras(html)).toHaveLength(3);
  });

  it("las cifras salen del servidor a partir de ?periodo= y cambian todas con él", async () => {
    const treinta = cifras(await pintar());
    const siete = cifras(await pintar({ periodo: "ultimos-7-dias" }));
    const noventa = cifras(await pintar({ periodo: "ultimos-90-dias" }));
    for (let i = 0; i < 3; i++) {
      expect(new Set([treinta[i], siete[i], noventa[i]]).size, `cifra ${i + 1}`).toBe(3);
    }
    expect(await pintar({ periodo: "ultimos-7-dias" })).toMatch(
      /<option[^>]*value="ultimos-7-dias"[^>]*selected/,
    );
  });

  it("un periodo fuera de la lista, otros parámetros y la identidad por la dirección no cambian nada", async () => {
    const base = await pintar();
    const consultas: Record<string, string>[] = [
      { periodo: "<script>" },
      { periodo: "TESTIGO-NOMBRE" },
      { usuario: "otro", cliente: "00000000-0000-4000-8000-000000000000", rol: "superadmin" },
    ];
    for (const q of consultas) {
      const html = await pintar(q);
      expect(cifras(html)).toEqual(cifras(base));
      expect(html).not.toContain("TESTIGO-NOMBRE");
      expect(html).not.toContain("superadmin</");
    }
  });

  it("el menú lleva a los estados del armazón de cliente de la muestra, no a esta misma página", async () => {
    const html = await pintar();
    const enlaces = [
      ...(/<nav[\s\S]*?<\/nav>/.exec(html)?.[0] ?? "").matchAll(/href="([^"]+)"/g),
    ].map((m) => m[1]);
    expect(enlaces.length).toBeGreaterThanOrEqual(4);
    for (const e of enlaces) expect(e).toMatch(/^\/muestra\/componentes\/armazon-cliente\//);
    expect(html).toContain(TEXTOS.cuenta.abrir);
  });

  it("comprueba el acceso a la muestra primero: fuera de la lista de servidores, 404", async () => {
    vi.stubEnv("ENTORNO", "preproduccion");
    estado.host = "otro.example";
    const m = await cargar();
    await expect(m.default({})).rejects.toBeDefined();
  });
});

describe("/muestra/servidor/periodo · reglas de la muestra, leídas en el código", () => {
  const pagina = readFileSync(
    resolve(RAIZ, "src/app/muestra/servidor/periodo/page.muestra.tsx"),
    "utf8",
  );

  it("la primera instrucción de la página es await comprobarAccesoMuestra() y el título es fijo", () => {
    expect(pagina).toMatch(
      /export default async function Pagina\([^)]*\)[^{]*\{\s*await comprobarAccesoMuestra\(\);/,
    );
    expect(pagina).not.toMatch(/generateMetadata/);
    expect(pagina).toMatch(/export const metadata/);
  });

  it("no usa el registro ni la supervisión ni pide datos desde el navegador", () => {
    expect(pagina).not.toMatch(/^import .*(fallo-servidor|registro)/m);
    expect(pagina).not.toMatch(/\bfetch\b|use client/);
    const cifrasFuente = readFileSync(
      resolve(RAIZ, "src/app/muestra/_vistas/CifrasDeMuestra.tsx"),
      "utf8",
    );
    expect(cifrasFuente).not.toMatch(/use client|usePeriodo|\bfetch\b/);
  });
});
