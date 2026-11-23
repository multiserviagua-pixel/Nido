// T-011 (c) · PRUEBA-008 (SVG limpios) y PRUEBA-006 (tres variantes) para las propuestas de
// logotipo de `specs/020-…/propuesta-visual/logotipos/`. CA-056, CA-057 (REQ-087). Cada propuesta
// trae `menu-oscuro.svg`, `fondo-claro.svg` e `icono.svg`: solo formas, degradados y un título; sin
// guiones, sin referencias externas, sin imágenes, sin estilos en línea ni texto con fuente; y cada
// color de la marca llega a 3:1 sobre el fondo para el que se dibujó.
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { contraste, formatoEs, medir } from "./apoyo/contraste";

const RAIZ = resolve(import.meta.dirname, "..", "..", "..");
const CARPETA = resolve(RAIZ, "specs/020-sistema-diseno-armazon/propuesta-visual/logotipos");
const VARIANTES = ["menu-oscuro", "fondo-claro", "icono"] as const;
const ELEMENTOS = new Set([
  "svg",
  "title",
  "defs",
  "lineargradient",
  "stop",
  "g",
  "path",
  "circle",
  "ellipse",
  "rect",
  "polygon",
  "line",
]);
// Fondos contra los que se mide cada variante (los del sistema: el menú es oscuro en los dos temas).
const FONDO_MENU = "linear-gradient(to bottom, #0B1230, #151C45)";
const FONDO_CLARO = "#FFFFFF";
const FONDO_ICONO = "linear-gradient(to bottom, #7344F0, #5B2BD6)";

const propuestas = existsSync(CARPETA)
  ? readdirSync(CARPETA).filter((n) => /^propuesta-[a-z]$/.test(n))
  : [];
const leer = (p: string, v: string): string =>
  readFileSync(resolve(CARPETA, p, `${v}.svg`), "utf8");

/** Fallos de limpieza de un SVG; la lista vacía es un SVG limpio. */
export function hallazgosDeSvg(svg: string): string[] {
  const f: string[] = [];
  for (const m of svg.matchAll(/<\/?([A-Za-z][\w:-]*)/g)) {
    if (!ELEMENTOS.has(m[1]!.toLowerCase())) f.push(`elemento no permitido: ${m[1]}`);
  }
  if (/<script|<foreignObject|<image|<use|<style|<a[\s>]|<text/i.test(svg))
    f.push("elemento activo");
  if (/\son[a-z]+\s*=/i.test(svg)) f.push("manejador de evento");
  if (/\sstyle\s*=/i.test(svg)) f.push("estilo en línea");
  if (/href\s*=|xlink|data:|javascript:/i.test(svg)) f.push("enlace o dato incrustado");
  for (const m of svg.matchAll(/url\(([^)]*)\)/g)) {
    if (!/^#[\w-]+$/.test(m[1]!)) f.push(`url externa: ${m[0]}`);
  }
  for (const m of svg.matchAll(/https?:\/\/[^"'\s)]+/g)) {
    if (m[0] !== "http://www.w3.org/2000/svg") f.push(`dirección externa: ${m[0]}`);
  }
  if (!/<title>[^<]+<\/title>/.test(svg)) f.push("sin título");
  return f;
}

describe("PRUEBA-008 y PRUEBA-006 · propuestas de logotipo (T-011 (c))", () => {
  it("hay al menos tres propuestas, cada una con sus tres variantes", () => {
    expect(propuestas.length).toBeGreaterThanOrEqual(3);
    for (const p of propuestas) {
      expect(readdirSync(resolve(CARPETA, p)).sort(), p).toEqual(
        VARIANTES.map((v) => `${v}.svg`).sort(),
      );
    }
  });

  it.each(propuestas.flatMap((p) => VARIANTES.map((v) => [p, v] as const)))(
    "%s/%s es un SVG limpio",
    (p, v) => {
      expect(hallazgosDeSvg(leer(p, v))).toEqual([]);
    },
  );

  it("las propuestas son distintas de forma, no solo de color", () => {
    const formas = propuestas.map((p) =>
      [...leer(p, "fondo-claro").matchAll(/<([a-z]+) /g)]
        .map((m) => m[1])
        .sort()
        .join(","),
    );
    expect(new Set(formas).size).toBe(propuestas.length);
    const geometrias = propuestas.map((p) =>
      [...leer(p, "fondo-claro").matchAll(/ (?:d|points|cx|x|width)="[^"]*"/g)].join(""),
    );
    expect(new Set(geometrias).size).toBe(propuestas.length);
  });

  describe.each([
    ["menu-oscuro", FONDO_MENU],
    ["fondo-claro", FONDO_CLARO],
  ] as const)("%s: cada color de la marca llega a 3:1 sobre su fondo", (variante, fondo) => {
    it.each(propuestas)("%s", (p) => {
      const colores = new Set(
        [...leer(p, variante).matchAll(/(?:fill|stroke)="(#[0-9A-Fa-f]{6})"/g)].map((m) =>
          m[1]!.toUpperCase(),
        ),
      );
      expect(colores.size).toBeGreaterThan(0);
      for (const c of colores) {
        expect(
          medir(c, fondo).razon,
          `${p} ${c}: ${formatoEs(medir(c, fondo).razon)}`,
        ).toBeGreaterThanOrEqual(3);
      }
    });
  });

  it.each(propuestas)(
    "icono de %s: la marca (en blanco y claro) llega a 3:1 sobre el fondo del icono, y el icono sobre claro y oscuro",
    (p) => {
      const svg = leer(p, "icono");
      const marca = new Set(
        [...svg.matchAll(/(?:fill|stroke)="(#[0-9A-Fa-f]{6})"/g)].map((m) => m[1]!.toUpperCase()),
      );
      for (const c of marca) {
        expect(medir(c, FONDO_ICONO).razon, `${p} ${c}`).toBeGreaterThanOrEqual(3);
      }
      // Sobre la página clara, los 33 puntos del degradado del icono llegan a 3:1. Sobre la oscura
      // solo se afirma el extremo claro (`#7344F0`): el oscuro (`#5B2BD6`) da 2,48:1, y el icono,
      // un logotipo con su propio fondo, queda fuera de la exigencia de 1.4.11 y se reconoce por su
      // forma (T-011, menor 1, saldado en T-015).
      expect(medir("#FFFFFF", FONDO_ICONO).razon).toBeGreaterThanOrEqual(3);
      expect(contraste("#7344F0", "#0F172A")).toBeGreaterThanOrEqual(3);
      expect(contraste("#5B2BD6", "#0F172A")).toBeLessThan(3);
    },
  );

  it("control: un SVG con script, enlace o estilo en línea se detecta", () => {
    const sucio = (x: string): string[] =>
      hallazgosDeSvg(`<svg xmlns="http://www.w3.org/2000/svg"><title>t</title>${x}</svg>`);
    expect(sucio("<script>alert(1)</script>").length).toBeGreaterThan(0);
    expect(sucio('<a href="https://x.test"><path d="M0 0"/></a>').length).toBeGreaterThan(0);
    expect(sucio('<path style="fill:red" d="M0 0"/>').length).toBeGreaterThan(0);
    expect(sucio('<rect fill="url(https://x.test/a.svg#g)"/>').length).toBeGreaterThan(0);
    expect(sucio('<circle onload="x()" r="1"/>').length).toBeGreaterThan(0);
    expect(sucio("<text>Hola</text>").length).toBeGreaterThan(0);
  });
});
