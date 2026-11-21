// T-010 (b), menor (3) de T-010 (a): cada página de la muestra declara su propio título (el índice
// también) y los títulos son únicos sobre TODO el inventario, no solo entre los armazones. El título
// es un valor fijo (la muestra no admite generateMetadata) y no lleva datos. El nombre del producto
// lo añade la plantilla del layout raíz, no la página.
import { existsSync } from "node:fs";
import { join, resolve } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import type { ReactElement } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { INVENTARIO, rutaDeEstado } from "../../../src/app/muestra/inventario";
import { TEXTOS } from "../../../src/components/textos";

vi.setConfig({ testTimeout: 60_000 });

const estado = vi.hoisted(() => ({ host: "localhost:3000" as string | null }));
vi.mock("next/headers", () => ({
  headers: async () => ({ get: (n: string) => (n.toLowerCase() === "host" ? estado.host : null) }),
}));
afterEach(() => {
  vi.unstubAllEnvs();
  estado.host = "localhost:3000";
});

const RAIZ = resolve(import.meta.dirname, "..", "..", "..");
const APP = join(RAIZ, "src", "app");

type Pagina = { default: () => Promise<ReactElement>; metadata?: { title?: unknown } };

/** Carpeta de la página de un estado, sin ruta dinámica (PRUEBA-008, R7). */
function carpetaDe(ruta: string): string {
  return join(APP, ...ruta.split("/").filter(Boolean));
}

const CASOS = INVENTARIO.flatMap((e) =>
  e.estados.map((s) => ({ etiqueta: `${e.clave}/${s.clave}`, ruta: rutaDeEstado(e, s.clave) })),
);

async function cargar(ruta: string): Promise<Pagina> {
  vi.resetModules();
  const modulo = `../../../src/app${ruta}/page.muestra`;
  return (await import(/* @vite-ignore */ modulo)) as unknown as Pagina;
}

describe("títulos de la muestra · todo el inventario", () => {
  it("hay casos que recorrer y cada estado tiene su carpeta de página fija", () => {
    expect(CASOS.length).toBeGreaterThanOrEqual(11);
    for (const c of CASOS) {
      expect(existsSync(join(carpetaDe(c.ruta), "page.muestra.tsx")), c.etiqueta).toBe(true);
    }
  });

  it("cada página declara un título fijo que es su h1, y no lleva el nombre del producto", async () => {
    vi.stubEnv("ENTORNO", "preproduccion");
    for (const c of CASOS) {
      const m = await cargar(c.ruta);
      const titulo = m.metadata?.title;
      expect(typeof titulo, `${c.etiqueta}: título declarado`).toBe("string");
      const html = renderToStaticMarkup(await m.default());
      const h1 = />([^<]*)<\/h1>/.exec(html)?.[1];
      expect(titulo, c.etiqueta).toBe(h1);
      expect(String(titulo), c.etiqueta).not.toContain(TEXTOS.marca.nombreProducto);
    }
  });

  it("los títulos son distintos en todo el inventario, el índice incluido", async () => {
    vi.stubEnv("ENTORNO", "preproduccion");
    const titulos: string[] = [];
    for (const c of CASOS) titulos.push(String((await cargar(c.ruta)).metadata?.title));
    const repetidos = titulos.filter((t, i) => titulos.indexOf(t) !== i);
    expect(repetidos, "títulos repetidos").toEqual([]);
    expect(titulos).toContain("Muestra de componentes");
  });
});
