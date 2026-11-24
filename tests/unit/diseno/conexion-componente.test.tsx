// T-016 (e) · marcado de `AvisoConexion` y de la hora de carga de `BloqueDatos` (diseño 020,
// `AvisoConexion`; REQ-060, REQ-075; CA-045). Sin navegador: lo que sale en el HTML y lo que el
// código no puede hacer. Los eventos, los anuncios y el corte real de la red están en
// `tests/e2e/muestra/aviso-conexion.spec.ts`. Escrita antes que el componente (en rojo).
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { AvisoConexion, PresentacionDeAviso } from "../../../src/components/estados/AvisoConexion";
import { BloqueDatos } from "../../../src/components/estados/BloqueDatos";
import { TEXTOS } from "../../../src/components/textos";

const RAIZ = resolve(import.meta.dirname, "..", "..", "..");
const leer = (ruta: string): string => readFileSync(resolve(RAIZ, ruta), "utf8");

describe("PresentacionDeAviso", () => {
  it("conectado: no pinta nada", () => {
    expect(renderToStaticMarkup(<PresentacionDeAviso estado="conectado" />)).toBe("");
  });

  it("sin conexión: la palabra, con su explicación y el icono decorativo", () => {
    const html = renderToStaticMarkup(<PresentacionDeAviso estado="sin_conexion" />);
    expect(html).toContain('data-aviso-conexion="sin_conexion"');
    expect(html).toContain(TEXTOS.conexion.sinConexion);
    expect(html).toContain(TEXTOS.conexion.explicacion);
    expect(html).toContain('aria-hidden="true"');
  });

  it("recuperada: dice «Conexión recuperada» y no «Sin conexión»", () => {
    const html = renderToStaticMarkup(<PresentacionDeAviso estado="recuperada" />);
    expect(html).toContain('data-aviso-conexion="recuperada"');
    expect(html).toContain(TEXTOS.conexion.recuperada);
    expect(html).not.toContain(TEXTOS.conexion.sinConexion);
  });

  it("un estado desconocido cierra en fallo: se pinta sin conexión", () => {
    const html = renderToStaticMarkup(<PresentacionDeAviso estado={"raro" as never} />);
    expect(html).toContain('data-aviso-conexion="sin_conexion"');
  });

  it("no es región viva (se anuncia por `Anunciador`, una vez) y no admite texto libre", () => {
    for (const e of ["sin_conexion", "recuperada"] as const) {
      const html = renderToStaticMarkup(<PresentacionDeAviso estado={e} />);
      expect(html).not.toMatch(/aria-live|role="(status|alert)"/);
    }
    const f = leer("src/components/estados/AvisoConexion.tsx");
    expect(f).not.toMatch(/children|dangerouslySetInnerHTML|mensaje/);
    expect(f).not.toMatch(/localStorage|sessionStorage|indexedDB|document\.cookie|\bfetch\b/);
    expect(f).toMatch(/anunciar\(/);
  });
});

describe("AvisoConexion en el servidor y en línea", () => {
  it("el servidor y un navegador en línea no pintan nada", () => {
    expect(renderToStaticMarkup(<AvisoConexion />)).toBe("");
  });

  it("está en el armazón antes del contenido y `navigator.onLine` se lee en un solo módulo", () => {
    const a = leer("src/components/armazon/Armazon.tsx");
    expect(a).toMatch(/<AvisoConexion\s*\/>/);
    expect(a.indexOf("<AvisoConexion")).toBeLessThan(a.indexOf("<main"));
    for (const f of [
      "src/components/estados/BloqueDatos.tsx",
      "src/components/estados/AvisoConexion.tsx",
      "src/components/armazon/SelectorPeriodo.tsx",
    ]) {
      expect(leer(f)).not.toMatch(/navigator\./);
    }
    expect(leer("src/components/armazon/SelectorPeriodo.tsx")).toMatch(/estaSinConexion\(\)/);
  });
});

describe("BloqueDatos: hora de carga", () => {
  it("en línea y en el servidor no hay hora de carga (los datos son actuales)", () => {
    const html = renderToStaticMarkup(
      <BloqueDatos estado="datos" forma="tarjeta">
        <p>CONTENIDO</p>
      </BloqueDatos>,
    );
    expect(html).toContain("CONTENIDO");
    expect(html).not.toContain(TEXTOS.bloque.datosCargadosEl);
    expect(html).not.toContain("data-hora-de-carga");
  });

  it("solo la pinta sin conexión y con un momento guardado; nunca pide ni recarga nada", () => {
    const f = leer("src/components/estados/BloqueDatos.tsx");
    expect(f).toMatch(/textoDeHoraDeCarga\(/);
    expect(f).toMatch(/data-hora-de-carga/);
    expect(f).toMatch(/useSinConexion\(\)/);
    expect(f).not.toMatch(/\bfetch\b|router|location\.reload|XMLHttpRequest/);
    // Va detrás del contenido: no cambia el tipo ni la posición de los hijos conservados.
    expect(f.indexOf("data-hora-de-carga")).toBeGreaterThan(f.indexOf("conservarHijos ? null"));
  });
});
