// T-016 (b) · marcado de `AvisosTemporales` (REQ-021, REQ-042, REQ-072; CA-015). Sin navegador: lo
// que se puede ver en el HTML (región con nombre, `ol`, textos fijos, nada de región viva) y en el
// código (nada que mueva el foco al aparecer). El comportamiento con reloj, foco y teclado está en
// `tests/e2e/muestra/avisos.spec.ts`.
import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { AvisosTemporales } from "../../../src/components/avisos/AvisosTemporales";
import { CLAVES_DE_AVISO } from "../../../src/components/avisos/logica";
import { TEXTOS } from "../../../src/components/textos";

const nada = (): void => undefined;
const avisos = CLAVES_DE_AVISO.slice(0, 3).map((clave, id) => ({ id, clave }));

describe("AvisosTemporales · marcado", () => {
  it("sin avisos no pinta nada", () => {
    expect(renderToStaticMarkup(<AvisosTemporales avisos={[]} alCerrar={nada} />)).toBe("");
  });

  it("región «Avisos» con una lista; cada aviso con su texto fijo y «Cerrar aviso»", () => {
    const html = renderToStaticMarkup(<AvisosTemporales avisos={avisos} alCerrar={nada} />);
    expect(html).toContain(`aria-label="${TEXTOS.avisos.region}"`);
    expect(html.match(/<ol/g)).toHaveLength(1);
    expect(html.match(/<li[ >]/g)).toHaveLength(3);
    expect(html.match(/data-aviso-texto/g)).toHaveLength(3);
    expect(html.match(new RegExp(`aria-label="${TEXTOS.avisos.cerrar}"`, "g"))).toHaveLength(3);
    for (const a of avisos) {
      expect(html).toContain(TEXTOS.avisos.mensajes[a.clave]);
    }
  });

  it("no es región viva ni alerta, y no pide el foco", () => {
    const html = renderToStaticMarkup(<AvisosTemporales avisos={avisos} alCerrar={nada} />);
    expect(html).not.toMatch(/aria-live|role="(?:status|alert|log)"|autofocus|tabindex/i);
  });
});

describe("AvisosTemporales · código que no puede existir", () => {
  const dir = resolve(import.meta.dirname, "..", "..", "..", "src", "components", "avisos");
  const fuentes = readdirSync(dir)
    .filter((f) => /\.tsx?$/.test(f))
    .map((f) => [f, readFileSync(resolve(dir, f), "utf8").replace(/\/\/.*$/gm, "")] as const);

  it("nada de addEventListener, autoFocus ni tabIndex en el componente", () => {
    expect(fuentes.length).toBeGreaterThan(2);
    for (const [f, texto] of fuentes) {
      expect(texto, f).not.toMatch(/addEventListener|autoFocus|tabIndex/);
    }
  });

  it("`focus()` solo se llama en el cierre (dentro del efecto de después del cambio)", () => {
    const componente = fuentes.find(([f]) => f === "AvisosTemporales.tsx")?.[1] ?? "";
    const llamadas = componente.match(/\.focus\(/g) ?? [];
    expect(llamadas).toHaveLength(3);
    const efecto =
      /useLayoutEffect\(\(\) => \{[\s\S]*?\}, \[avisos\]\);/.exec(componente)?.[0] ?? "";
    expect(efecto.match(/\.focus\(/g) ?? []).toHaveLength(3);
  });

  it("no usa `dangerouslySetInnerHTML` ni texto que no sea de TEXTOS", () => {
    for (const [f, texto] of fuentes) expect(texto, f).not.toMatch(/dangerouslySetInnerHTML/);
  });
});
