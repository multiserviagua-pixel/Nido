// T-006 (b) · PRUEBA-008 (parte de iconos, REQ-033): cada icono de `src/components/iconos/` es un
// SVG propio de formas, sin guiones, sin referencias externas, sin imágenes ni texto con fuente;
// lleva `viewBox` y su tamaño sale de propiedades; es decorativo (`aria-hidden`) o lleva nombre
// accesible (`role="img"` y título); pinta con `currentColor`; y `LICENCIAS.md` lo lista con su
// origen. La lista de elementos es cerrada: lo que no está en ella, falla.
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createElement, type ComponentType } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ICONOS } from "../../../src/components/iconos";
import { ICONOS_DE_ESTADO, type IconoDeEstado } from "../../../src/components/estado/catalogo";

const RAIZ = resolve(import.meta.dirname, "..", "..", "..");
const CARPETA = resolve(RAIZ, "src", "components", "iconos");

type PropiedadesIcono = { titulo?: string; tamano?: number };
const iconos = Object.entries(ICONOS) as [string, ComponentType<PropiedadesIcono>][];
const pintar = (c: ComponentType<PropiedadesIcono>, p: PropiedadesIcono = {}): string =>
  renderToStaticMarkup(createElement(c, p));

/** Lista cerrada de elementos que puede llevar un icono. */
const ELEMENTOS_PERMITIDOS = new Set([
  "svg",
  "title",
  "g",
  "path",
  "circle",
  "ellipse",
  "rect",
  "line",
  "polyline",
  "polygon",
]);

/** Los que exigen las áreas de diseno.md (armazón, `areas.ts`), las acciones de los componentes base
 * y los iconos de estado del catálogo (`ICONOS_DE_ESTADO`). */
const NECESARIOS = [
  // Menú
  "IconoResumen",
  "IconoClientes",
  "IconoOrdenes",
  "IconoAuditoria",
  "IconoActividad",
  "IconoSuscripcion",
  "IconoAlertas",
  "IconoAjustes",
  // Acciones
  "IconoCerrar",
  "IconoMenu",
  "IconoAbrirCajon",
  "IconoCerrarCajon",
  "IconoBuscar",
  "IconoOrdenar",
  "IconoOrdenAscendente",
  "IconoOrdenDescendente",
  "IconoPaginaAnterior",
  "IconoPaginaSiguiente",
  "IconoCopiar",
  "IconoUsuario",
  "IconoSalir",
  "IconoSol",
  "IconoLuna",
  // Estados (ICONOS_DE_ESTADO) y la falta de conexión (situación, no un tono)
  "IconoNeutro",
  "IconoPausa",
  "IconoAdvertencia",
  "IconoError",
  "IconoCorrecto",
  "IconoInformacion",
  "IconoSinConexion",
];

describe("PRUEBA-008 · iconos: el conjunto", () => {
  it("existen todos los iconos necesarios, cada uno con su componente", () => {
    for (const nombre of NECESARIOS) {
      expect(ICONOS, nombre).toHaveProperty(nombre);
      expect(typeof (ICONOS as Record<string, unknown>)[nombre], nombre).toBe("function");
    }
  });

  it("cada icono de estado del catálogo tiene su componente, con mapa explícito", () => {
    const MAPA: Record<IconoDeEstado, string> = {
      neutro: "IconoNeutro",
      correcto: "IconoCorrecto",
      aviso: "IconoAdvertencia",
      error: "IconoError",
      informacion: "IconoInformacion",
      pausa: "IconoPausa",
    };
    expect(Object.keys(MAPA).sort()).toEqual([...ICONOS_DE_ESTADO].sort());
    for (const valor of ICONOS_DE_ESTADO) {
      expect(ICONOS, valor).toHaveProperty(MAPA[valor]);
    }
  });

  it("las formas de los iconos de estado son distintas entre sí (nada solo por color)", () => {
    const nombres = [
      "IconoNeutro",
      "IconoCorrecto",
      "IconoAdvertencia",
      "IconoError",
      "IconoInformacion",
      "IconoPausa",
    ];
    const formas = nombres.map((n) =>
      pintar((ICONOS as Record<string, ComponentType<PropiedadesIcono>>)[n] ?? (() => null)),
    );
    expect(new Set(formas).size).toBe(formas.length);
  });

  it("los comentarios en español: «del», no «de el»", () => {
    for (const a of readdirSync(CARPETA).filter((f) => f.endsWith(".tsx") || f.endsWith(".ts"))) {
      expect(readFileSync(resolve(CARPETA, a), "utf8"), a).not.toMatch(/\bde el\b/);
    }
  });

  it("IconoSol: los rayos no se pegan al disco a 16 px", () => {
    const html = pintar(ICONOS.IconoSol);
    const r = Number(/<circle[^>]*\sr="([\d.]+)"/.exec(html)?.[1]);
    const rayos = [
      ...html.matchAll(/<line x1="([\d.]+)" y1="([\d.]+)" x2="([\d.]+)" y2="([\d.]+)"/g),
    ];
    expect(rayos.length).toBeGreaterThan(0);
    for (const m of rayos) {
      const interior = Math.min(
        Math.hypot(Number(m[1]) - 12, Number(m[2]) - 12),
        Math.hypot(Number(m[3]) - 12, Number(m[4]) - 12),
      );
      expect(interior - r, html).toBeGreaterThanOrEqual(3.5);
    }
  });

  it("el índice no oculta ni inventa iconos: un archivo por icono y todos exportados", () => {
    const archivos = readdirSync(CARPETA)
      .filter((a) => /^Icono[A-Za-z]+\.tsx$/.test(a))
      .map((a) => a.replace(/\.tsx$/, ""))
      .sort();
    expect(Object.keys(ICONOS).sort()).toEqual(archivos);
  });

  it("no hay otros archivos de iconos (ni imágenes ni SVG sueltos) en la carpeta", () => {
    const extra = readdirSync(CARPETA).filter(
      (a) =>
        !/^Icono[A-Za-z]+\.tsx$/.test(a) &&
        !["index.ts", "BaseIcono.tsx", "LICENCIAS.md"].includes(a),
    );
    expect(extra).toEqual([]);
  });
});

describe.each(iconos)("PRUEBA-008 · %s", (nombre, Icono) => {
  const decorativo = pintar(Icono);
  const conSignificado = pintar(Icono, { titulo: "Nombre de prueba" });

  it("es un SVG de formas: solo elementos de la lista cerrada, sin referencias ni scripts", () => {
    for (const html of [decorativo, conSignificado]) {
      expect(html.startsWith("<svg ")).toBe(true);
      const etiquetas = [...html.matchAll(/<([a-zA-Z][a-zA-Z0-9]*)/g)].map((m) => m[1]!);
      for (const e of etiquetas)
        expect(ELEMENTOS_PERMITIDOS.has(e), `${nombre}: <${e}>`).toBe(true);
      expect(html).not.toMatch(/\son[a-z]+=/i);
      expect(html).not.toMatch(/\s(?:xlink:)?href=/i);
      expect(html).not.toMatch(/url\(/i);
      expect(html).not.toMatch(/\sstyle=/i);
      expect(html).not.toMatch(/\sid=/i);
      expect(html).not.toMatch(/https?:|data:|javascript:/i);
    }
  });

  it("sin texto con fuente: el único texto es el título accesible, y solo si se pide", () => {
    expect(decorativo).not.toMatch(/<text|<tspan|font-/i);
    expect(decorativo.replace(/<[^>]*>/g, "")).toBe("");
    expect(conSignificado.replace(/<[^>]*>/g, "")).toBe("Nombre de prueba");
  });

  it("lleva viewBox y su tamaño sale de propiedades", () => {
    expect(decorativo).toMatch(/viewBox="0 0 24 24"/);
    expect(decorativo).toMatch(/width="24"/);
    expect(decorativo).toMatch(/height="24"/);
    expect(pintar(Icono, { tamano: 16 })).toMatch(
      /width="16"[^>]*height="16"|height="16"[^>]*width="16"/,
    );
  });

  it("decorativo: aria-hidden, sin foco y sin nombre; con significado: role img y título", () => {
    expect(decorativo).toMatch(/aria-hidden="true"/);
    expect(decorativo).toMatch(/focusable="false"/);
    expect(decorativo).not.toMatch(/role=|<title|aria-label/);
    expect(conSignificado).toMatch(/role="img"/);
    expect(conSignificado).toMatch(/<title[^>]*>Nombre de prueba<\/title>/);
    expect(conSignificado).not.toMatch(/aria-hidden/);
  });

  it("un título vacío o de solo espacios no da un icono con significado sin nombre", () => {
    const vacio = pintar(Icono, { titulo: "   " });
    expect(vacio).toMatch(/aria-hidden="true"/);
    expect(vacio).not.toMatch(/role=/);
  });

  it("lleva al menos un elemento de forma", () => {
    const formas = decorativo.match(/<(path|circle|ellipse|rect|line|polyline|polygon)\b/g) ?? [];
    expect(formas.length, nombre).toBeGreaterThan(0);
  });

  it("con título, el svg lleva también aria-label con el mismo nombre", () => {
    expect(conSignificado).toMatch(/<svg[^>]*aria-label="Nombre de prueba"/);
    expect(decorativo).not.toMatch(/aria-label/);
  });

  it("usa currentColor: ningún color fijo", () => {
    expect(decorativo).toMatch(/currentColor/);
    expect(decorativo).not.toMatch(/#[0-9a-fA-F]{3,8}\b|rgb\(|hsl\(|oklch\(/i);
    const colores = [...decorativo.matchAll(/(?:stroke|fill)="([^"]*)"/g)].map((m) => m[1]);
    for (const c of colores) expect(["currentColor", "none"], `${nombre}: ${c}`).toContain(c);
  });
});

describe("PRUEBA-008 · iconos: licencias", () => {
  const ruta = resolve(CARPETA, "LICENCIAS.md");

  it("existe LICENCIAS.md", () => {
    expect(existsSync(ruta)).toBe(true);
  });

  it("lista cada icono con su origen y la fecha", () => {
    const texto = readFileSync(ruta, "utf8");
    const filas = texto.split("\n").filter((l) => l.trimStart().startsWith("|"));
    for (const [nombre] of iconos) {
      const fila = filas.find((l) => l.includes(`\`${nombre}\``));
      expect(fila, `${nombre} no figura en LICENCIAS.md`).toBeDefined();
      expect(fila, nombre).toMatch(/dibujado por el equipo|copiado de/i);
      expect(fila, nombre).toMatch(/\d{2}\/\d{2}\/\d{4}/);
      if (/copiado de/i.test(fila!)) {
        expect(fila, nombre + ": copiado sin licencia").toMatch(/licencia\s+\S+/i);
        expect(fila, nombre + ": copiado sin versión").toMatch(/versi[óo]n\s+\d/i);
      }
    }
  });

  it("LICENCIAS.md no lista iconos que no existen", () => {
    const texto = readFileSync(ruta, "utf8");
    const listados = [...texto.matchAll(/^\|\s*`(Icono[A-Za-z]+)`/gm)].map((m) => m[1]!);
    expect(listados.sort()).toEqual(Object.keys(ICONOS).sort());
  });
});
