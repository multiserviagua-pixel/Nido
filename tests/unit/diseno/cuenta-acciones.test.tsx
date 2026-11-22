// T-010 (c) · acciones del panel de la cuenta (REQ-005, REQ-065, REQ-083; art. 3, cierre en fallo).
// El panel real (Radix) solo está en el documento abierto y eso lo mide `cabecera.spec.ts` en
// Chromium; aquí el envoltorio se sustituye por uno que pinta el disparador y el contenido, para
// ver qué enlaces llegan al panel.
import { renderToStaticMarkup } from "react-dom/server";
import type { ReactElement, ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { CuentaUsuario } from "../../../src/components/armazon/CuentaUsuario";

vi.mock("../../../src/components/dialogo/PanelModal", () => ({
  PanelModal: ({ disparador, children }: { disparador: ReactElement; children: ReactNode }) => (
    <div>
      {disparador}
      <section>{children}</section>
    </div>
  ),
}));

const pintar = (acciones: Parameters<typeof CuentaUsuario>[0]["cuenta"]["acciones"]): string =>
  renderToStaticMarkup(<CuentaUsuario cuenta={{ nombre: "Usuario Ficticio", acciones }} />);

describe("PRUEBA-012 · CuentaUsuario: acciones del panel", () => {
  it("pinta cada acción como un enlace con su ruta y su texto", () => {
    const h = pintar([
      { clave: "salir", etiqueta: "Cerrar sesión", ruta: "/salir" },
      { clave: "perfil", etiqueta: "Mi perfil", ruta: "/cuenta/perfil" },
    ]);
    expect(h).toMatch(/<a [^>]*href="\/salir"[^>]*>Cerrar sesión<\/a>/);
    expect(h).toMatch(/<a [^>]*href="\/cuenta\/perfil"[^>]*>Mi perfil<\/a>/);
  });

  it("descarta toda ruta que no empiece por «/» o que empiece por «//»", () => {
    const h = pintar([
      { clave: "a", etiqueta: "Fuera", ruta: "//ejemplo.test/x" },
      { clave: "b", etiqueta: "Esquema", ruta: "https://ejemplo.test/x" },
      { clave: "c", etiqueta: "Script", ruta: "javascript:alert(1)" },
      { clave: "d", etiqueta: "Relativa", ruta: "salir" },
      { clave: "e", etiqueta: "Vacía", ruta: "" },
      { clave: "g", etiqueta: "Barra", ruta: "/\\evil.test/x" },
      { clave: "h", etiqueta: "Tabulador", ruta: "/\t/evil.test/x" },
      { clave: "i", etiqueta: "Salto", ruta: "/\n/evil.test" },
      { clave: "f", etiqueta: "Buena", ruta: "/salir" },
    ]);
    expect(h).toContain(">Buena</a>");
    for (const mala of [
      "Fuera",
      "Esquema",
      "Script",
      "Relativa",
      "Vacía",
      "Barra",
      "Tabulador",
      "Salto",
    ]) {
      expect(h, mala).not.toContain(mala);
    }
    expect(h.match(/<a\b/g)).toHaveLength(1);
  });

  it("si no queda ninguna acción válida, no pinta la lista", () => {
    expect(pintar([{ clave: "a", etiqueta: "Fuera", ruta: "//x.test" }])).not.toContain("<ul");
  });

  it("la etiqueta es texto: el tipo no admite un nodo y una cadena con marcas no crea elementos", () => {
    const h = renderToStaticMarkup(
      <CuentaUsuario
        cuenta={{
          nombre: "Usuario Ficticio",
          // @ts-expect-error la etiqueta es una cadena, no un nodo
          acciones: [{ clave: "x", etiqueta: <b />, ruta: "/x" }],
        }}
      />,
    );
    expect(h).toContain('href="/x"');
    const marcada = pintar([{ clave: "x", etiqueta: "<b>x</b>", ruta: "/x" }]);
    expect(marcada).not.toContain("<b>");
    expect(marcada).toContain("&lt;b&gt;");
  });
});
