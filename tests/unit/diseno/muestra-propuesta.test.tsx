// T-012 (020) · páginas `/muestra/propuesta-visual` y `/muestra/valores` (REQ-061, REQ-086; CA-006,
// CA-025, CA-028, CA-032, CA-049, CA-050, CA-053, CA-057). Cuatro grupos:
//  1. Inventario y páginas, uno a uno (lo que no está en el inventario no existe; título = h1).
//  2. Lo que enseña la propuesta: paleta y degradados en los dos temas, tres propuestas de
//     logotipo a 16, 32 y 128 px, tres vistas en los dos temas (la de cliente a 375 px) y la
//     declaración honesta de que son una maqueta.
//  3. Lo que enseña la página de valores: toda la escala de `valores.css`.
//  4. Los datos de la muestra no se separan de su origen: la escala, los temas de la hoja y los
//     logotipos se comparan con `valores.css` y con los SVG de la propuesta.
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import type { ReactElement } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { INVENTARIO, rutaDeEstado } from "../../../src/app/muestra/inventario";
import { ESCALA, SOMBRAS } from "../../../src/app/muestra/_vistas/propuesta/escala";
import { LOGOTIPOS } from "../../../src/app/muestra/_vistas/propuesta/logotipos";
import { TEXTOS_PROPUESTA } from "../../../src/app/muestra/_vistas/propuesta/textos-propuesta";
import { analizarCss, leerValores } from "./apoyo/valores";

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
const MUESTRA = join(RAIZ, "src", "app", "muestra");
const VISTAS = join(MUESTRA, "_vistas", "propuesta");
const valoresCss = readFileSync(join(RAIZ, "src/components/estilos/valores.css"), "utf8");
const valores = leerValores(valoresCss);

type Pagina = { default: () => Promise<ReactElement>; metadata: { title?: string } };
async function cargar(carpeta: string): Promise<Pagina> {
  vi.resetModules();
  const ruta = `../../../src/app/muestra/${carpeta}/page.muestra`;
  return (await import(/* @vite-ignore */ ruta)) as unknown as Pagina;
}
async function pintar(carpeta: string): Promise<string> {
  vi.stubEnv("ENTORNO", "preproduccion");
  const m = await cargar(carpeta);
  return renderToStaticMarkup(await m.default());
}

const PROPUESTA = INVENTARIO.find((e) => e.clave === "vista-propuesta-visual");
const VALORES = INVENTARIO.find((e) => e.clave === "vista-valores");

describe("inventario · las dos páginas nuevas", () => {
  it("son páginas propias con ruta fija y un único estado", () => {
    expect(PROPUESTA).toMatchObject({ tipo: "pagina", ruta: "/muestra/propuesta-visual" });
    expect(VALORES).toMatchObject({ tipo: "pagina", ruta: "/muestra/valores" });
    expect(PROPUESTA?.estados.map((s) => s.clave)).toEqual(["unico"]);
    expect(VALORES?.estados.map((s) => s.clave)).toEqual(["unico"]);
    expect(rutaDeEstado(PROPUESTA!, "unico")).toBe("/muestra/propuesta-visual");
  });

  it("cada una tiene su carpeta fija y no hay carpetas de páginas fuera del inventario", () => {
    for (const e of [PROPUESTA, VALORES]) {
      const carpeta = e!.tipo === "pagina" ? e!.ruta.replace("/muestra/", "") : "";
      expect(existsSync(join(MUESTRA, carpeta, "page.muestra.tsx")), carpeta).toBe(true);
    }
    // Páginas propias de la muestra: toda carpeta con `page.muestra.tsx` que no sea `componentes/`
    // ni `_*` está en el inventario como página.
    // Recorre también las carpetas anidadas (T-010 (e2): `servidor/periodo`).
    const carpetasDePagina = (dir: string, prefijo: string): string[] =>
      readdirSync(dir, { withFileTypes: true }).flatMap((d) => {
        if (!d.isDirectory() || d.name === "componentes" || d.name.startsWith("_")) return [];
        const ruta = `${prefijo}/${d.name}`;
        const propia = existsSync(join(dir, d.name, "page.muestra.tsx")) ? [ruta] : [];
        return [...propia, ...carpetasDePagina(join(dir, d.name), ruta)];
      });
    const enDisco = carpetasDePagina(MUESTRA, "/muestra").sort();
    const enInventario = INVENTARIO.filter((e) => e.tipo === "pagina" && e.ruta !== "/muestra")
      .map((e) => (e.tipo === "pagina" ? e.ruta : ""))
      .sort();
    expect(enDisco).toEqual(enInventario);
  });
});

describe.each([
  ["propuesta-visual", "Propuesta visual"],
  ["valores", "Valores de diseño"],
] as const)("página %s", (carpeta, titulo) => {
  it("un h1, un main, título igual al h1 y distinto del índice; sin formularios ni campos", async () => {
    const html = await pintar(carpeta);
    expect(html.match(/<h1[\s>]/g)).toHaveLength(1);
    expect(html.match(/<main[\s>]/g)).toHaveLength(1);
    expect(/>([^<]*)<\/h1>/.exec(html)![1]).toBe(titulo);
    expect((await cargar(carpeta)).metadata.title).toBe(titulo);
    expect(html).not.toMatch(/<(form|input|textarea|select)\b/);
    expect(html).not.toMatch(/dangerouslySetInnerHTML|<script|style="/);
  });

  it("control 2 primero: sin acceso, 404 y no pinta nada", async () => {
    vi.stubEnv("ENTORNO", "preproduccion");
    estado.host = "desconocido.invalid";
    const m = await cargar(carpeta);
    await expect(m.default()).rejects.toMatchObject({ digest: "NEXT_HTTP_ERROR_FALLBACK;404" });
  });

  it("con ENTORNO de producción, 404", async () => {
    vi.stubEnv("ENTORNO", "produccion");
    const m = await cargar(carpeta);
    await expect(m.default()).rejects.toMatchObject({ digest: "NEXT_HTTP_ERROR_FALLBACK;404" });
  });

  it("los enlaces no llevan consulta ni fragmento fuera del salto al contenido", async () => {
    const html = await pintar(carpeta);
    for (const m of html.matchAll(/<a\b[^>]*\shref="([^"]*)"/g)) {
      expect(m[1], "enlace").not.toMatch(/[?]|#(?!contenido-principal$)/);
    }
  });
});

describe("propuesta visual · declaración honesta", () => {
  it("dice que las tres vistas son una representación y que los componentes definitivos llegan tras la validación", async () => {
    const html = await pintar("propuesta-visual");
    expect(TEXTOS_PROPUESTA.declaracion).toContain(
      "representación de la propuesta; los componentes definitivos llegan tras la validación",
    );
    expect(html).toContain(TEXTOS_PROPUESTA.declaracion);
  });

  it("el diálogo abierto es una representación estática: ni dialog ni role=dialog ni controles", async () => {
    const html = await pintar("propuesta-visual");
    const marco = /<figure[^>]*data-vista="tabla-dialogo"[\s\S]*?<\/figure>/.exec(html)![0];
    expect(marco).not.toMatch(/<dialog|role="dialog"|aria-modal/);
    expect(marco).not.toMatch(/<(button|a|input|select)\b/);
    expect(marco).toContain("inert");
  });
});

describe("propuesta visual · paleta y degradados en los dos temas", () => {
  it("hay un marco claro y otro oscuro de paleta, con todos los papeles de color y los 3 degradados", async () => {
    const html = await pintar("propuesta-visual");
    const marcos = html.split('data-seccion="paleta"').slice(1);
    expect(marcos).toHaveLength(2);
    const conUtilidad = [...valores.claro.keys()].filter((k) =>
      valores.tema.has(`--color-${k.slice(2)}`),
    );
    expect(conUtilidad.length).toBeGreaterThanOrEqual(23);
    ["claro", "oscuro"].forEach((tema, i) => {
      expect(marcos[i]).toContain(`data-tema-muestra="${tema}"`);
      expect(marcos[i]).toContain(`tema-${tema}`);
      expect(marcos[i]!.match(/data-papel="/g)).toHaveLength(conUtilidad.length + 3);
    });
  });

  it("los papeles de color pintados son los de valores.css (los que tienen utilidad de color)", async () => {
    const html = await pintar("propuesta-visual");
    const pintados = new Set([...html.matchAll(/data-papel="([a-z0-9-]+)"/g)].map((m) => m[1]));
    const delCss = [...valores.claro.keys()]
      .filter((k) => !k.startsWith("--escala") && valores.tema.has(`--color-${k.slice(2)}`))
      .map((k) => k.slice(2));
    for (const p of delCss) expect(pintados, p).toContain(p);
    for (const d of ["degradado-menu", "degradado-acento", "degradado-grafico"]) {
      expect(pintados).toContain(d);
    }
  });
});

describe("propuesta visual · logotipos", () => {
  it("tres propuestas, cada una a 16, 32 y 128 px sobre claro y sobre oscuro, más el icono", async () => {
    const html = await pintar("propuesta-visual");
    for (const p of ["a", "b", "c"]) {
      for (const [variante, fondo] of [
        ["fondo-claro", "claro"],
        ["menu-oscuro", "oscuro"],
        ["icono", "propio"],
      ] as const) {
        for (const lado of [16, 32, 128]) {
          const m = new RegExp(
            `data-logotipo="${p}"[^>]*data-variante="${variante}"[^>]*data-fondo="${fondo}"[^>]*data-lado="${lado}"`,
          ).exec(html);
          expect(m, `${p} ${variante} ${lado}`).not.toBeNull();
        }
      }
    }
    expect(html.match(/data-logotipo="/g)).toHaveLength(27);
  });

  it("los SVG son decorativos (el nombre va en el encabezado), con el lado pedido y sin ids", async () => {
    const html = await pintar("propuesta-visual");
    const svgs = html.match(/<svg[^>]*data-lado-svg="\d+"[^>]*>/g)!;
    expect(svgs).toHaveLength(27);
    for (const s of svgs) {
      expect(s).toContain('aria-hidden="true"');
      expect(s).toContain('viewBox="0 0 64 64"');
      const lado = /data-lado-svg="(\d+)"/.exec(s)![1];
      expect(s).toContain(`width="${lado}"`);
      expect(s).toContain(`height="${lado}"`);
    }
    expect(html).not.toMatch(/linearGradient|<defs|\sid="fondo"/);
    for (const p of ["a", "b", "c"] as const) expect(html).toContain(LOGOTIPOS[p].nombre);
  });
});

describe("propuesta visual · las tres vistas, en los dos temas", () => {
  const VISTAS_DE_LA_PROPUESTA = [
    "resumen-superadmin",
    "tabla-dialogo",
    "resumen-cliente",
  ] as const;

  it("cada vista sale en un marco claro y en otro oscuro, inerte y con descripción", async () => {
    const html = await pintar("propuesta-visual");
    for (const v of VISTAS_DE_LA_PROPUESTA) {
      for (const tema of ["claro", "oscuro"]) {
        const m = new RegExp(
          `<figure[^>]*data-vista="${v}"[^>]*data-tema-muestra="${tema}"[^>]*>[\\s\\S]*?</figure>`,
        ).exec(html);
        expect(m, `${v} ${tema}`).not.toBeNull();
        expect(m![0]).toContain(`tema-${tema}`);
        expect(m![0]).toContain("<figcaption");
        expect(m![0]).toContain("inert");
      }
    }
  });

  it("la vista de cliente va en un marco de 375 px; las otras no", async () => {
    const html = await pintar("propuesta-visual");
    for (const tema of ["claro", "oscuro"]) {
      const cliente = new RegExp(
        `<figure[^>]*data-vista="resumen-cliente"[^>]*data-tema-muestra="${tema}"[\\s\\S]*?</figure>`,
      ).exec(html)![0];
      expect(cliente).toContain("marco-movil");
    }
    const resto = html.replace(/<figure[^>]*data-vista="resumen-cliente"[\s\S]*?<\/figure>/g, "");
    expect(resto).not.toContain("marco-movil");
  });

  it("el hueco de gráfico es claramente ficticio y trae su descripción textual", async () => {
    const html = await pintar("propuesta-visual");
    const marco = /<figure[^>]*data-vista="resumen-superadmin"[\s\S]*?<\/figure>/.exec(html)![0];
    expect(marco).toContain(TEXTOS_PROPUESTA.graficoFicticio);
    expect(marco).toContain("<svg");
    expect(marco).not.toMatch(/(?:fill|stroke)="#/);
  });

  it("los datos son ficticios: nada de correos, direcciones ni nombres reales", async () => {
    const html = await pintar("propuesta-visual");
    expect(html).not.toMatch(/@[a-z0-9-]+\.[a-z]{2,}/i);
    expect(html).not.toMatch(/https?:\/\//);
  });
});

describe("valores · escala pintada", () => {
  it("cada paso de la escala aparece con su nombre y su valor, y su clase de muestra", async () => {
    const html = await pintar("valores");
    for (const [nombre, valor] of valores.escala) {
      expect(html, nombre).toContain(nombre);
      if (/^#/.test(valor)) expect(html, valor).toContain(valor.toUpperCase());
    }
  });

  it("hay una sección por familia: color, degradados, espaciado, radios, sombras y tamaños", async () => {
    const html = await pintar("valores");
    for (const s of ["color", "degradados", "espaciado", "radios", "sombras", "texto", "tamanos"]) {
      expect(html, s).toContain(`data-escala-seccion="${s}"`);
    }
  });

  it("las sombras se enseñan en claro y en oscuro, cada una en su marco", async () => {
    const html = await pintar("valores");
    expect(html).toMatch(/data-tema-muestra="claro"/);
    expect(html).toMatch(/data-tema-muestra="oscuro"/);
  });
});

describe("datos de la muestra · no se separan de su origen", () => {
  it("ESCALA y SOMBRAS son exactamente la capa 1 de valores.css (mismos pasos, mismos valores)", () => {
    const esperada = new Map([...valores.escala].map(([k, v]) => [k, v.replace(/,\s*\)/g, ")")]));
    const sombras = new Map([...esperada].filter(([k]) => k.startsWith("--escala-sombra-")));
    // Los colores van sin `#` (ver escala.ts).
    const resto = new Map(
      [...esperada]
        .filter(([k]) => !sombras.has(k))
        .map(([k, v]) => [k, /^#[0-9A-F]{6}$/.test(v) ? v.slice(1) : v]),
    );
    expect(new Map(Object.entries(ESCALA))).toEqual(resto);
    expect(sombras.size).toBe(6);
    // `0 1px 2px 0 rgb(15 23 42 / 0.06)` se escribe «0 1px 2px 0 · color 15 23 42 · alfa 0.06».
    const enTexto = (v: string): string => {
      const m = /^(.*?)\s*rgb\((\d+ \d+ \d+) \/ ([\d.]+)\)$/.exec(v)!;
      return [m[1], `color ${m[2]}`, `alfa ${m[3]}`].filter((x) => x !== "").join(" · ");
    };
    expect(new Map(Object.entries(SOMBRAS))).toEqual(
      new Map([...sombras].map(([k, v]) => [k, enTexto(v)])),
    );
  });

  it("hay una clase de muestra por cada paso pintable y ninguna que sobre", () => {
    const css = readFileSync(join(VISTAS, "propuesta.css"), "utf8");
    const clases = new Set([...css.matchAll(/^\.m-([a-z0-9-]+)\s*\{/gm)].map((m) => m[1]));
    const esperadas = [...valores.escala.keys()]
      .map((k) => k.replace("--escala-", ""))
      .filter((n) => !n.endsWith("-altura") && !/^(duracion|tamano)-/.test(n));
    expect([...clases].sort()).toEqual([...esperadas].sort());
    for (const n of esperadas) {
      const bloque = new RegExp(`^\\.m-${n}\\s*\\{[^}]*var\\(--escala-${n}\\)`, "m");
      expect(bloque.test(css), `.m-${n} lee --escala-${n}`).toBe(true);
    }
  });

  it("los temas de la hoja repiten los papeles de valores.css: .tema-oscuro es el oscuro; .tema-claro, el claro de esos mismos", () => {
    const hoja = analizarCss(readFileSync(join(VISTAS, "propuesta.css"), "utf8"));
    const media = hoja.hijos.find((h) => h.cabecera === "@media (forced-colors: none)")!;
    const claroHoja = media.hijos.find((h) => h.cabecera === ".tema-claro")!.declaraciones;
    const oscuroHoja = media.hijos.find((h) => h.cabecera === ".tema-oscuro")!.declaraciones;
    expect(oscuroHoja.size).toBeGreaterThan(20);
    expect(new Map(oscuroHoja)).toEqual(new Map(valores.oscuro));
    expect([...claroHoja.keys()].sort()).toEqual([...valores.oscuro.keys()].sort());
    for (const [k, v] of claroHoja) expect(v, k).toBe(valores.claro.get(k));
  });

  it("la hoja no aplica los temas con colores forzados (manda el sistema)", () => {
    const hoja = analizarCss(readFileSync(join(VISTAS, "propuesta.css"), "utf8"));
    expect(hoja.hijos.some((h) => h.cabecera.startsWith(".tema-"))).toBe(false);
  });

  describe("logotipos · cada forma coincide con su SVG", () => {
    const CARPETA = join(RAIZ, "specs/020-sistema-diseno-armazon/propuesta-visual/logotipos");
    const hexAPaso = new Map(
      [...valores.escala]
        .filter(([, v]) => /^#/.test(v))
        .map(([k, v]) => [v.toUpperCase(), k.replace("--escala-", "")]),
    );
    for (const p of ["a", "b", "c"] as const) {
      for (const v of ["menu-oscuro", "fondo-claro", "icono"] as const) {
        it(`propuesta ${p} · ${v}`, () => {
          const svg = readFileSync(join(CARPETA, `propuesta-${p}`, `${v}.svg`), "utf8");
          const del = [...svg.matchAll(/<(path|circle|ellipse|rect|polygon)\b([^>]*?)\/>/g)]
            .map((m) => ({ el: m[1]!, attrs: [...m[2]!.matchAll(/([a-z-]+)="([^"]*)"/g)] }))
            .filter((f) => !f.attrs.some((a) => a[1] === "fill" && a[2]!.startsWith("url(")));
          const datos = LOGOTIPOS[p].variantes[v];
          expect(datos.formas).toHaveLength(del.length);
          del.forEach((f, i) => {
            const d = datos.formas[i]!;
            expect(d.el).toBe(f.el);
            const geometria = Object.fromEntries(
              f.attrs.filter((a) => a[1] !== "fill" && a[1] !== "stroke").map((a) => [a[1], a[2]]),
            );
            expect(d.geometria).toEqual(geometria);
            const relleno = f.attrs.find((a) => a[1] === "fill")?.[2];
            const trazo = f.attrs.find((a) => a[1] === "stroke")?.[2];
            expect(d.relleno).toBe(
              relleno && relleno !== "none" ? hexAPaso.get(relleno.toUpperCase()) : null,
            );
            expect(d.trazo).toBe(trazo ? hexAPaso.get(trazo.toUpperCase()) : null);
          });
          if (v === "icono") {
            const paradas = [...svg.matchAll(/stop-color="(#[0-9A-Fa-f]{6})"/g)].map((m) =>
              hexAPaso.get(m[1]!.toUpperCase()),
            );
            expect([datos.fondo?.desde, datos.fondo?.hasta]).toEqual(paradas);
          }
        });
      }
    }

    it("cada paso de color que usa un logotipo tiene su clase de relleno o de trazo en la hoja", () => {
      const css = readFileSync(join(VISTAS, "propuesta.css"), "utf8");
      for (const l of Object.values(LOGOTIPOS)) {
        for (const dv of Object.values(l.variantes)) {
          for (const f of dv.formas) {
            if (f.relleno) expect(css).toMatch(new RegExp(`\\.lg-relleno-${f.relleno}\\s*\\{`));
            if (f.trazo) expect(css).toMatch(new RegExp(`\\.lg-trazo-${f.trazo}\\s*\\{`));
          }
          if (dv.fondo) {
            expect(css).toMatch(
              new RegExp(`\\.lg-fondo-${dv.fondo.desde}-${dv.fondo.hasta}\\s*\\{`),
            );
          }
        }
      }
    });
  });
});
