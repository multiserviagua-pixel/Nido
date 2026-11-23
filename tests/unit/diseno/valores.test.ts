// T-007 (f) · PRUEBA-005 (U): 0 valores sueltos fuera de la escala y tabla de `docs/DISENO.md` igual
// a `valores.css`. CA-022, CA-055 (REQ-029, REQ-030, REQ-086). Tres partes:
//  1. `valores.css` cumple su forma: tres capas, tres juegos, sin tema de Tailwind, papeles solo
//     con valores de la escala.
//  2. `docs/DISENO.md` y `valores.css` dicen lo mismo, en los dos sentidos.
//  3. `src/` no tiene valores sueltos; cada regla se prueba sembrando un fallo.
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, resolve, sep } from "node:path";
import { describe, expect, it } from "vitest";
import { excepcionesDeStyle, excepcionesDeValores } from "./excepciones";
import {
  compararConDocumento,
  comprobarFuentes,
  comprobarValores,
  HEX,
  leerValores,
  papelesDeTema,
  papelesForzados,
  type Fuentes,
} from "./apoyo/valores";

const RAIZ = resolve(import.meta.dirname, "..", "..", "..");
const RUTA_VALORES = "src/components/estilos/valores.css";
const css = readFileSync(resolve(RAIZ, RUTA_VALORES), "utf8");
const documento = readFileSync(resolve(RAIZ, "docs/DISENO.md"), "utf8");
const valores = leerValores(css);
const escalaHex = new Set([...valores.escala.values()].filter((x) => HEX.test(x)));

function listar(carpeta: string, salida: string[]): void {
  if (!existsSync(carpeta)) return;
  for (const nombre of readdirSync(carpeta)) {
    if (nombre === "node_modules" || nombre === ".next") continue;
    const completa = join(carpeta, nombre);
    if (statSync(completa).isDirectory()) listar(completa, salida);
    else if (/\.(ts|tsx|css|svg|mdx)$/.test(nombre)) salida.push(completa);
  }
}
function leerSrc(): Fuentes {
  const rutas: string[] = [];
  listar(resolve(RAIZ, "src"), rutas);
  return Object.fromEntries(
    rutas.map((r) => [relative(RAIZ, r).split(sep).join("/"), readFileSync(r, "utf8")]),
  );
}

describe("PRUEBA-005 · valores.css tiene tres capas y tres juegos de papeles", () => {
  it("tiene escala, papeles claros, oscuros y forzados, y movimiento reducido", () => {
    expect(valores.escala.size).toBeGreaterThan(40);
    expect(valores.claro.size).toBeGreaterThan(20);
    expect(valores.oscuro.size).toBeGreaterThan(10);
    expect(valores.forzados.size).toBeGreaterThan(20);
    expect(valores.movimientoReducido.size).toBeGreaterThan(0);
  });

  it("no hay ningún hallazgo en valores.css (formato, papeles solo con la escala, tema, utilidades)", () => {
    expect(comprobarValores(valores)).toEqual([]);
  });

  it("el oscuro redefine los papeles de color que cambian y deja el menú igual (REQ-002)", () => {
    const claro = papelesDeTema(valores, "claro");
    const oscuro = papelesDeTema(valores, "oscuro");
    for (const papel of ["--fondo-pagina", "--superficie", "--texto", "--acento", "--foco"]) {
      expect(oscuro.get(papel), papel).not.toBe(claro.get(papel));
    }
    for (const papel of ["--menu-fondo", "--menu-texto", "--menu-actual", "--degradado-menu"]) {
      expect(oscuro.get(papel), papel).toBe(claro.get(papel));
    }
  });

  it("con colores forzados, cada degradado y cada sombra valen none y el resto son palabras del sistema", () => {
    const f = papelesForzados(valores);
    expect(f.get("--degradado-menu")).toBe("none");
    expect(f.get("--degradado-acento")).toBe("none");
    expect(f.has("--degradado-grafico")).toBe(false);
    expect(f.get("--sombra-tarjeta")).toBe("none");
    expect(f.get("--enlace")).toBe("LinkText");
    expect(f.get("--serie-1")).toBe("Highlight");
    expect(f.get("--borde-control")).toBe("CanvasText");
  });

  it("con movimiento reducido, las duraciones valen 0", () => {
    for (const k of ["--duracion-rapida", "--duracion-media", "--duracion-esqueleto"]) {
      expect(valores.movimientoReducido.get(k), k).toBe("0ms");
    }
  });
});

describe("PRUEBA-005 · cada regla de valores.css se puede incumplir (control positivo)", () => {
  const con = (cambio: (c: string) => string): string[] =>
    comprobarValores(leerValores(cambio(css))).map((h) => h.regla);

  it("un papel con un color literal falla", () => {
    expect(
      con((c) => c.replace("--texto: var(--escala-neutro-900)", "--texto: #123456")),
    ).toContain("papel");
  });
  it("un papel que apunta a un paso que no existe falla", () => {
    expect(
      con((c) =>
        c.replace("--texto: var(--escala-neutro-900)", "--texto: var(--escala-neutro-901)"),
      ),
    ).toContain("papel");
  });
  it("sin `--*: initial` falla", () => {
    expect(con((c) => c.replace("--*: initial;", ""))).toContain("tema");
  });
  it("un papel de color sin utilidad falla", () => {
    expect(con((c) => c.replace(/\s*--color-serie-4:[^;]+;/, ""))).toContain("utilidades");
  });
  it("un color de la escala fuera de #RRGGBB falla", () => {
    expect(
      con((c) => c.replace("--escala-neutro-0: #ffffff", "--escala-neutro-0: white")),
    ).toContain("escala-color");
  });
  it("una sombra con un color que no es de la escala falla", () => {
    expect(con((c) => c.replace("rgb(15 23 42 / 0.06)", "rgb(1 2 3 / 0.06)"))).toContain(
      "escala-sombra",
    );
  });
  it("un degradado forzado distinto de none falla", () => {
    expect(
      con((c) =>
        c.replace(
          /(@media \(forced-colors: active\) \{[\s\S]*?--degradado-menu: )none/,
          "$1var(--escala-degradado-menu)",
        ),
      ),
    ).toContain("forzados");
  });
  it("una sombra forzada distinta de none falla", () => {
    expect(
      con((c) =>
        c.replace(
          /(@media \(forced-colors: active\) \{[\s\S]*?--sombra-tarjeta: )none/,
          "$1var(--escala-sombra-tarjeta-claro)",
        ),
      ),
    ).toContain("forzados");
  });
  it("un papel oscuro que no existe en el claro falla", () => {
    const reglas = comprobarValores(
      leerValores(
        css.replace(
          "--serie-4: var(--escala-acento-200);",
          "--serie-4: var(--escala-acento-200);\n    --papel-nuevo: var(--escala-neutro-0);",
        ),
      ),
    );
    expect(reglas.map((h) => h.regla)).toContain("papel");
    expect(reglas.map((h) => h.detalle).join("\n")).toMatch(/--papel-nuevo.*tema claro/);
  });
  it("0ms no vale como valor forzado", () => {
    expect(
      con((c) =>
        c.replace(
          /(@media \(forced-colors: active\) \{\s*:root \{)/,
          "$1\n    --duracion-rapida: 0ms;",
        ),
      ),
    ).toContain("forzados");
  });
  it("0ms solo vale con movimiento reducido: en el tema claro falla", () => {
    expect(
      con((c) =>
        c.replace("--duracion-rapida: var(--escala-duracion-rapida)", "--duracion-rapida: 0ms"),
      ),
    ).toContain("papel");
  });
  it("el bloque de colores forzados va después del oscuro; al revés falla", () => {
    expect(valores.ordenDeMedias.indexOf("prefers-color-scheme: dark")).toBeGreaterThan(-1);
    expect(valores.ordenDeMedias.indexOf("forced-colors: active")).toBeGreaterThan(
      valores.ordenDeMedias.indexOf("prefers-color-scheme: dark"),
    );
    expect(
      con((c) =>
        c
          .replace("@media (prefers-color-scheme: dark)", "@media (xx)")
          .replace("@media (forced-colors: active)", "@media (prefers-color-scheme: dark)")
          .replace("@media (xx)", "@media (forced-colors: active)"),
      ),
    ).toContain("orden");
  });
  it("sin `--default-font-family` que apunte a `--font-sans`, falla", () => {
    expect(valores.tema.get("--default-font-family")).toBe("var(--font-sans)");
    expect(con((c) => c.replace("--default-font-family: var(--font-sans);", ""))).toContain("tema");
  });
  it("un papel forzado con un color literal falla", () => {
    expect(
      con((c) =>
        c.replace(/(@media \(forced-colors: active\) \{[\s\S]*?--texto: )CanvasText/, "$1#000000"),
      ),
    ).toEqual(expect.arrayContaining(["papel", "forzados"]));
  });
});

describe("PRUEBA-005 · la tabla de docs/DISENO.md coincide con valores.css", () => {
  it("escala, papeles (claro, oscuro, forzados), degradados, sombras, espaciado, radios, texto, tamaños y duraciones, en los dos sentidos", () => {
    expect(compararConDocumento(valores, documento)).toEqual([]);
  });

  it("detecta un valor cambiado solo en el documento", () => {
    const cambiado = documento.replace("| neutro | 0 | `#FFFFFF` |", "| neutro | 0 | `#FFFFFE` |");
    expect(cambiado).not.toBe(documento);
    expect(compararConDocumento(valores, cambiado).map((d) => d.tabla)).toContain(
      "Escala de color",
    );
  });

  it("detecta un papel que está en el css y no en el documento", () => {
    const cambiado = documento.replace(/^\| `--serie-4` .*$/m, "");
    expect(compararConDocumento(valores, cambiado).length).toBeGreaterThan(0);
  });

  it("detecta un punto de ruptura cambiado en el documento y en el css", () => {
    expect(valores.tema.get("--breakpoint-md")).toBe("48rem");
    const cambiado = documento.replace(/^\| `md` \| `?48rem`? \|/m, "| `md` | `50rem` |");
    expect(cambiado).not.toBe(documento);
    expect(compararConDocumento(valores, cambiado).map((d) => d.tabla)).toContain(
      "Puntos de ruptura",
    );
    const otro = leerValores(css.replace("--breakpoint-lg: 64rem", "--breakpoint-lg: 60rem"));
    expect(compararConDocumento(otro, documento).map((d) => d.tabla)).toContain(
      "Puntos de ruptura",
    );
  });

  it("detecta una pila de fuente distinta", () => {
    const otro = leerValores(css.replace("Roboto, sans-serif", "Arial, sans-serif"));
    expect(compararConDocumento(otro, documento).map((d) => d.tabla)).toContain("Fuente");
    const cambiado = documento.replace("Roboto, sans-serif", "Verdana, sans-serif");
    expect(cambiado).not.toBe(documento);
    expect(compararConDocumento(valores, cambiado).map((d) => d.tabla)).toContain("Fuente");
  });

  it("detecta un degradado cambiado en el css", () => {
    const otro = leerValores(css.replace("var(--escala-acento-550)", "var(--escala-acento-500)"));
    expect(compararConDocumento(otro, documento).map((d) => d.tabla)).toContain(
      "Degradados (claro)",
    );
  });
});

describe("PRUEBA-005 · src/ no tiene valores sueltos", () => {
  const fuentes = leerSrc();

  it("0 hallazgos en src/ (el escaneo ve archivos reales)", () => {
    expect(Object.keys(fuentes).length).toBeGreaterThan(20);
    expect(Object.keys(fuentes)).toContain(RUTA_VALORES);
    expect(comprobarFuentes(fuentes, escalaHex, excepcionesDeStyle, excepcionesDeValores)).toEqual(
      [],
    );
  });

  it("la excepción de pantalla.ts es la única, vive en excepciones.ts y todos sus colores son de la escala", () => {
    // La lista del diseño (diseno.md, «Protección de lo que decide el resultado»; plan.md, A-12):
    // la pantalla de activación lleva su propio estilo por la CSP por huella (001 T-109).
    expect(excepcionesDeValores).toEqual(["src/lib/oauth/pantalla.ts"]);
    const ruta = "src/lib/oauth/pantalla.ts";
    const sin = comprobarFuentes(
      { [ruta]: ":root{--x:#123456}" },
      escalaHex,
      [],
      excepcionesDeValores,
    );
    expect(sin.map((h) => h.regla)).toEqual(["color-literal"]);
    const con = comprobarFuentes(
      { [ruta]: ":root{--x:#6c3ce9}" },
      escalaHex,
      [],
      excepcionesDeValores,
    );
    expect(con).toEqual([]);
  });

  it("la excepción es un parámetro: sin la lista, un color de la escala en pantalla.ts también falla", () => {
    const ruta = "src/lib/oauth/pantalla.ts";
    expect(
      comprobarFuentes({ [ruta]: ":root{--x:#6c3ce9}" }, escalaHex).map((h) => h.regla),
    ).toEqual(["color-literal"]);
  });

  it("la excepción no alcanza a otro archivo, ni siquiera con un color de la escala", () => {
    const hallazgos = comprobarFuentes(
      { "src/lib/otra/pantalla.ts": ":root{--x:#6c3ce9}", "src/app/x.css": "a{color:#6C3CE9}" },
      escalaHex,
      [],
      excepcionesDeValores,
    );
    expect(hallazgos.map((h) => h.archivo).sort()).toEqual([
      "src/app/x.css",
      "src/lib/otra/pantalla.ts",
    ]);
  });

  it("la excepción no exime de clases de Tailwind: sí se salta las comprobaciones de JSX", () => {
    const ruta = "src/lib/oauth/pantalla.ts";
    // Un archivo con estilo propio no usa Tailwind; por eso no se le piden clases ni JSX.
    expect(
      comprobarFuentes({ [ruta]: 'const a = "bg-red-500";' }, escalaHex, [], excepcionesDeValores),
    ).toEqual([]);
  });

  const siembra = (ruta: string, texto: string): string[] =>
    comprobarFuentes(
      { ...fuentes, [ruta]: texto },
      escalaHex,
      excepcionesDeStyle,
      excepcionesDeValores,
    )
      .filter((h) => h.archivo === ruta)
      .map((h) => h.regla);

  it.each([
    [
      "hexadecimal en un componente",
      "src/components/x/A.tsx",
      'export const a = "#6C3CE9";',
      "color-literal",
    ],
    ["hexadecimal corto", "src/components/x/A.tsx", 'export const a = "#fff";', "color-literal"],
    ["rgb en un css", "src/app/otro.css", "a { color: rgb(1 2 3); }", "color-literal"],
    [
      "hsl en un componente",
      "src/components/x/A.tsx",
      'export const a = "hsl(10 10% 10%)";',
      "color-literal",
    ],
    ["oklch en un css", "src/app/otro.css", "a { color: oklch(0.5 0.1 200); }", "color-literal"],
    ["nombre de color en un css", "src/app/otro.css", "a { color: red; }", "color-literal"],
    [
      "nombre de color en un atributo SVG",
      "src/components/x/A.tsx",
      'export const A = () => <rect fill="red" />;',
      "color-literal",
    ],
    [
      "clase de color de Tailwind",
      "src/components/x/A.tsx",
      'export const a = "bg-red-500";',
      "clase-de-color",
    ],
    [
      "clase text-white",
      "src/components/x/A.tsx",
      'export const a = "p-4 text-white";',
      "clase-de-color",
    ],
    [
      "valor arbitrario",
      "src/components/x/A.tsx",
      'export const a = "w-[10px]";',
      "valor-arbitrario",
    ],
    [
      "variante arbitraria",
      "src/components/x/A.tsx",
      'export const a = "[&>p]:mt-2";',
      "valor-arbitrario",
    ],
    [
      "paso de relleno fuera de la lista",
      "src/components/x/A.tsx",
      'export const a = "p-7";',
      "espaciado",
    ],
    ["paso con fracción", "src/components/x/A.tsx", 'export const a = "gap-1.5";', "espaciado"],
    [
      "paso «px», que la escala no tiene",
      "src/components/x/A.tsx",
      'export const a = "p-px";',
      "espaciado",
    ],
    [
      "margen negativo fuera de la lista",
      "src/components/x/A.tsx",
      'export const a = "-mt-9";',
      "espaciado",
    ],
    [
      "style en un componente",
      "src/components/x/A.tsx",
      "export const A = () => <div style={{ width: 3 }} />;",
      "style",
    ],
    [
      "fill literal en un SVG",
      "src/components/x/A.tsx",
      'export const A = () => <path fill="blue" />;',
      "svg-literal",
    ],
    [
      "stroke literal en un SVG",
      "src/components/x/A.tsx",
      'export const A = () => <path stroke="url(#a)" />;',
      "svg-literal",
    ],
  ])("falla con %s", (_nombre, ruta, texto, regla) => {
    expect(siembra(ruta, texto)).toContain(regla);
  });

  it.each([
    ["pasos de la lista", 'export const a = "p-4 px-6 mt-10 gap-x-2 -mx-4 space-y-3 m-auto";'],
    [
      "currentColor y none en SVG",
      'export const A = () => <path fill="none" stroke="currentColor" />;',
    ],
    [
      "papeles como utilidades",
      'export const a = "bg-superficie text-texto border-borde-control";',
    ],
    ["ancla de página que no es un color", 'export const a = "#contenido-principal";'],
    ["índice de una lista", "export const a = lista[0] + otra[i];"],
  ])("no da falsos positivos con %s", (_nombre, texto) => {
    expect(siembra("src/components/x/A.tsx", texto)).toEqual([]);
  });

  it("icon.svg y valores.css quedan exentos de colores literales", () => {
    expect(
      comprobarFuentes(
        { "src/app/icon.svg": '<svg><rect fill="#6C3CE9"/></svg>', [RUTA_VALORES]: css },
        escalaHex,
      ).filter((h) => h.regla === "color-literal"),
    ).toEqual([]);
  });
});
