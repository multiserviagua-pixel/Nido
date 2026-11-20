import { renderToStaticMarkup } from "react-dom/server";
import type { ReactElement } from "react";
import { describe, expect, it, vi } from "vitest";
import DisenoRaiz from "../../../src/app/layout";
import Inicio from "../../../src/app/page";
import NoEncontrada from "../../../src/app/not-found";
import ErrorPagina from "../../../src/app/error";
import ErrorGlobal from "../../../src/app/global-error";

const MARCA = "VALOR-MARCADO-7f3a";
const DIGEST = "digest-secreto-91";
const error = Object.assign(new Error(MARCA), { digest: DIGEST });
const reintentar = vi.fn();
const propsError = { error, reset: vi.fn(), retry: reintentar };

// Recorre el árbol devuelto y localiza el primer elemento de ese tipo.
const buscar = (nodo: unknown, tipo: string): ReactElement<Record<string, unknown>> | null => {
  if (!nodo || typeof nodo !== "object") return null;
  if (Array.isArray(nodo)) {
    for (const hijo of nodo) {
      const r = buscar(hijo, tipo);
      if (r) return r;
    }
    return null;
  }
  const el = nodo as ReactElement<Record<string, unknown>>;
  if (el.type === tipo) return el;
  return buscar(el.props?.children, tipo);
};

const paginas: Record<string, () => string> = {
  inicio: () => renderToStaticMarkup(<Inicio />),
  "no encontrada": () => renderToStaticMarkup(<NoEncontrada />),
  error: () => renderToStaticMarkup(<ErrorPagina {...propsError} />),
  "error global": () => renderToStaticMarkup(<ErrorGlobal {...propsError} />),
};

const cuenta = (html: string, patron: RegExp) => (html.match(patron) ?? []).length;

describe("páginas base", () => {
  for (const [nombre, render] of Object.entries(paginas)) {
    it(`${nombre}: un solo h1`, () => {
      expect(cuenta(render(), /<h1[\s>]/g)).toBe(1);
    });
  }

  it("inicio y 404 llevan su texto", () => {
    expect(paginas["inicio"]!()).toContain("Servicio en funcionamiento");
    expect(paginas["no encontrada"]!()).toContain("Página no encontrada");
  });

  it("el layout declara lang es", () => {
    const html = renderToStaticMarkup(
      <DisenoRaiz>
        <p>x</p>
      </DisenoRaiz>,
    );
    expect(html).toContain('<html lang="es"');
  });

  for (const nombre of ["error", "error global"]) {
    it(`${nombre}: alerta, texto fijo y botón nativo sin datos del error`, () => {
      const html = paginas[nombre]!();
      expect(html).toContain('role="alert"');
      expect(html).toContain("Se ha producido un error. Inténtalo de nuevo más tarde.");
      expect(html).toMatch(/<button[^>]*type="button"[^>]*>Reintentar<\/button>/);
      expect(html).not.toContain(MARCA);
      expect(html).not.toContain(DIGEST);
    });
  }

  it("error global incluye su propio html con lang es", () => {
    expect(paginas["error global"]!()).toContain('<html lang="es"');
  });

  it("error global lleva title fijo y main", () => {
    const html = paginas["error global"]!();
    expect(html).toContain("<title>Error</title>");
    expect(html).toContain("<main");
  });

  for (const [nombre, componente] of [
    ["error", ErrorPagina],
    ["error global", ErrorGlobal],
  ] as const) {
    it(`${nombre}: el botón Reintentar llama a retry`, () => {
      reintentar.mockClear();
      const arbol = componente(propsError);
      const boton = buscar(arbol, "button");
      expect(boton).not.toBeNull();
      (boton!.props.onClick as () => void)();
      expect(reintentar).toHaveBeenCalledTimes(1);
    });
  }
});
