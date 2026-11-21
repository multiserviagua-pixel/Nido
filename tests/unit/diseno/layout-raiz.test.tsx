// T-010 (a) · `src/app/layout.tsx` (REQ-005, REQ-040, REQ-041, REQ-088; CA-004, CA-031): `lang`,
// `viewport` sin bloquear el zum, `color-scheme` y plantilla del título sin datos. El `main` lo
// pone cada vista (el armazón, o la propia página): el layout no lo repite.
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import DisenoRaiz, { metadata, viewport } from "../../../src/app/layout";
import Inicio from "../../../src/app/page";
import NoEncontrada from "../../../src/app/not-found";
import ErrorPagina from "../../../src/app/error";
import { TEXTOS } from "../../../src/components/textos";

describe("layout raíz · idioma y visor", () => {
  it("el documento es español", () => {
    const html = renderToStaticMarkup(
      <DisenoRaiz>
        <p>x</p>
      </DisenoRaiz>,
    );
    expect(html).toContain('<html lang="es"');
  });

  it("el visor mide el dispositivo y no limita ni bloquea el zum", () => {
    expect(viewport).toMatchObject({ width: "device-width", initialScale: 1 });
    const claves = Object.keys(viewport);
    for (const prohibida of ["maximumScale", "userScalable", "minimumScale"]) {
      expect(claves, prohibida).not.toContain(prohibida);
    }
  });

  it("declara color-scheme claro y oscuro", () => {
    expect(viewport.colorScheme).toBe("light dark");
  });
});

describe("layout raíz · título del documento", () => {
  it("la plantilla es «<título de la vista> · <nombre del producto>» y no lleva datos", () => {
    const titulo = metadata.title as { default: string; template: string };
    expect(titulo.template).toBe(`%s · ${TEXTOS.marca.nombreProducto}`);
    expect(titulo.template.match(/%s/g)).toHaveLength(1);
    expect(titulo.default).toBe(TEXTOS.marca.nombreProducto);
  });

  it("sigue sin indexarse", () => {
    expect(metadata.robots).toEqual({ index: false, follow: false });
  });
});

describe("layout raíz · el main no se repite", () => {
  it("el layout no pinta ningún main", () => {
    const html = renderToStaticMarkup(
      <DisenoRaiz>
        <p>x</p>
      </DisenoRaiz>,
    );
    expect(html).not.toContain("<main");
  });

  it("cada página base pinta su propio main, uno solo", () => {
    const paginas = [
      renderToStaticMarkup(<Inicio />),
      renderToStaticMarkup(<NoEncontrada />),
      renderToStaticMarkup(<ErrorPagina error={new Error("x")} retry={() => undefined} />),
    ];
    for (const html of paginas) expect(html.match(/<main[\s>]/g)).toHaveLength(1);
  });
});
