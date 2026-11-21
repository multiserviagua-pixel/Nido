// T-007 (g) · `base.css`: foco único con el papel --foco, objetivos de 24 por 24 px, movimiento
// reducido y texto (REQ-036, REQ-037, REQ-039, REQ-088; CA-027, CA-028, CA-030). Es la parte
// estática; la medición en navegador es de PRUEBA-013, PRUEBA-021 y PRUEBA-022 (T-009 y T-014).
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const RAIZ = resolve(import.meta.dirname, "..", "..", "..");
const base = readFileSync(resolve(RAIZ, "src/components/estilos/base.css"), "utf8").replace(
  /\/\*[\s\S]*?\*\//g,
  "",
);
const layout = readFileSync(resolve(RAIZ, "src/app/layout.tsx"), "utf8");

const documento = readFileSync(resolve(RAIZ, "docs/DISENO.md"), "utf8");
const baseConComentarios = readFileSync(resolve(RAIZ, "src/components/estilos/base.css"), "utf8");

/** Cuerpo del primer bloque cuya cabecera cumple el patrón, dentro de `texto`. */
function bloque(cabecera: RegExp, texto: string = base): string {
  const m = cabecera.exec(texto);
  if (!m) return "";
  let nivel = 0;
  let desde = -1;
  for (let i = m.index + m[0].length - 1; i < texto.length; i++) {
    if (texto[i] === "{") {
      if (nivel === 0) desde = i + 1;
      nivel++;
    } else if (texto[i] === "}") {
      nivel--;
      if (nivel === 0) return texto.slice(desde, i);
    }
  }
  return "";
}

const capaBase = bloque(/@layer\s+base\s*\{/);
const fueraDeCapa = base.replace(capaBase, "");

describe("base.css · se carga y solo usa papeles", () => {
  it("el diseño raíz importa valores.css y base.css, en ese orden", () => {
    const v = layout.indexOf("estilos/valores.css");
    const b = layout.indexOf("estilos/base.css");
    expect(v).toBeGreaterThan(-1);
    expect(b).toBeGreaterThan(v);
  });
  it("no lee valores de la escala: solo papeles", () => {
    expect(base).not.toMatch(/--escala-/);
  });
  it("todas las variables que lee existen como papeles de valores.css", () => {
    const css = readFileSync(resolve(RAIZ, "src/components/estilos/valores.css"), "utf8");
    for (const m of base.matchAll(/var\((--[a-z0-9-]+)/g)) {
      expect(css, m[1]).toContain(`${m[1]}:`);
    }
  });
});

describe("base.css · capas: las utilidades de Tailwind pueden superar a base.css", () => {
  it("el cuerpo, los objetivos de 24 px, las cifras y los nombres largos van dentro de `@layer base`", () => {
    expect(capaBase).not.toBe("");
    expect(capaBase).toMatch(/(^|[\s}])body\s*\{/);
    expect(capaBase).toMatch(/min-block-size:\s*var\(--objetivo-minimo\)/);
    expect(capaBase).toMatch(/min-inline-size:\s*var\(--objetivo-minimo\)/);
    expect(capaBase).toMatch(/font-variant-numeric:\s*tabular-nums/);
    expect(capaBase).toMatch(/overflow-wrap:\s*anywhere/);
  });
  it("fuera de la capa solo quedan el foco, color-scheme y el movimiento reducido", () => {
    expect(fueraDeCapa).not.toMatch(/(^|[\s}])body\s*\{/);
    expect(fueraDeCapa).not.toMatch(/min-(block|inline)-size/);
    expect(fueraDeCapa).not.toMatch(/font-variant-numeric/);
    expect(fueraDeCapa).toMatch(/\*:focus-visible/);
    expect(fueraDeCapa).toMatch(/prefers-reduced-motion/);
  });
  it("el foco no va en capa, a propósito, y el archivo lo explica", () => {
    expect(capaBase).not.toMatch(/focus-visible/);
    expect(baseConComentarios).toMatch(/sin capa a propósito/);
  });
  it("no hay una segunda capa ni una capa distinta de `base`", () => {
    expect([...base.matchAll(/@layer\b/g)]).toHaveLength(1);
  });
});

describe("base.css · foco único (REQ-036)", () => {
  const foco = bloque(/:focus-visible\s*\{/);
  it("hay un contorno de foco con el papel --foco, su grosor y su separación", () => {
    expect(foco).toMatch(/outline:\s*var\(--foco-grosor\)\s+solid\s+var\(--foco\)/);
    expect(foco).toMatch(/outline-offset:\s*var\(--foco-separacion\)/);
  });
  it("se aplica a todos los elementos", () => {
    expect(base).toMatch(/(^|[\s,}])\*:focus-visible|:where\(\*\):focus-visible/);
  });
  it("nadie quita el contorno: ni outline none ni outline 0 en todo el archivo", () => {
    expect(base).not.toMatch(/outline(-style)?\s*:\s*(none|0)\b/);
  });
  it("hay un solo estilo de foco", () => {
    expect([...base.matchAll(/:focus-visible\s*\{/g)]).toHaveLength(1);
    expect(base).not.toMatch(/:focus(?!-visible)\s*[{,]/);
  });
});

describe("base.css · objetivos de pulsación (REQ-037)", () => {
  it("botones, campos y controles con rol miden al menos el papel --objetivo-minimo", () => {
    const objetivos = bloque(/button,[\s\S]*?\{/, capaBase);
    expect(objetivos).toMatch(/min-block-size:\s*var\(--objetivo-minimo\)/);
    expect(objetivos).toMatch(/min-inline-size:\s*var\(--objetivo-minimo\)/);
    const cabecera = /([^{}]*button[^{}]*)\{/.exec(capaBase)![1]!;
    for (const s of [
      "button",
      "select",
      "textarea",
      "summary",
      '[role="button"]',
      '[type="checkbox"]',
      '[type="radio"]',
    ]) {
      expect(cabecera, s).toContain(s);
    }
  });
});

describe("base.css · movimiento reducido (REQ-039)", () => {
  const reducido = bloque(/@media\s*\(prefers-reduced-motion:\s*reduce\)\s*\{/);
  it("apaga animaciones, transiciones y desplazamiento suave", () => {
    expect(reducido).toMatch(/animation-duration:\s*0\.01ms\s*!important/);
    expect(reducido).toMatch(/animation-iteration-count:\s*1\s*!important/);
    expect(reducido).toMatch(/transition-duration:\s*0\.01ms\s*!important/);
    expect(reducido).toMatch(/scroll-behavior:\s*auto\s*!important/);
  });
  it("no hay otra animación fuera de la consulta que no use las duraciones del papel", () => {
    const fuera = base.replace(reducido, "");
    for (const m of fuera.matchAll(/(animation|transition)(-duration)?:\s*([^;]+);/g)) {
      expect(m[3], m[0]).toMatch(/var\(--duracion-|^none$/);
    }
  });
});

describe("base.css · texto y tema", () => {
  it("declara color-scheme claro y oscuro, para controles nativos y barras", () => {
    expect(base).toMatch(/color-scheme:\s*light dark/);
  });
  it("el cuerpo usa los papeles de fondo y de texto y el tamaño de cuerpo", () => {
    const cuerpo = bloque(/(^|[\s}])body\s*\{/, capaBase);
    expect(cuerpo).toMatch(/background-color:\s*var\(--fondo-pagina\)/);
    expect(cuerpo).toMatch(/color:\s*var\(--texto\)/);
    // 1rem y 1,5 son el paso «cuerpo» de la escala (16 px y 24 px); los tamaños no son papeles.
    expect(cuerpo).toMatch(/font-size:\s*1rem/);
    expect(cuerpo).toMatch(/line-height:\s*1\.5/);
  });
  it("las cifras de las tablas usan números tabulares", () => {
    expect(base).toMatch(/font-variant-numeric:\s*tabular-nums/);
  });
  it("los nombres (TextoDato, que pinta un `bdi`) se parten en lugar de desbordar (REQ-065); el cuerpo no", () => {
    // Diseño, «Nombres largos»: un nombre no se recorta, se parte con `overflow-wrap: anywhere`.
    const cuerpo = bloque(/(^|[\s}])body\s*\{/, capaBase);
    expect(cuerpo).not.toMatch(/overflow-wrap/);
    const nombres = bloque(/(^|[\s}])bdi\s*\{/, capaBase);
    expect(nombres).toMatch(/overflow-wrap:\s*anywhere/);
    expect(baseConComentarios).toMatch(/REQ-065/);
    expect(baseConComentarios).not.toMatch(/REQ-040/);
  });
});

describe("docs/DISENO.md · enlaces sueltos y objetivos de 24 px (REQ-037)", () => {
  it("dice que los enlaces sueltos garantizan sus 24 px en el componente y dónde se miden", () => {
    const seccion = /Enlaces sueltos[^\n]*/.exec(documento)?.[0] ?? "";
    expect(seccion).toMatch(/menú/);
    expect(seccion).toMatch(/saltar al contenido/);
    expect(seccion).toMatch(/paginación/);
    expect(seccion).toMatch(/PRUEBA-013/);
    expect(seccion).toMatch(/PRUEBA-021/);
  });
});
