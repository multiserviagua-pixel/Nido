// T-010 (a) · `Armazon`, `EnlaceSaltar` y `RejillaCuerpo` (REQ-001, REQ-007 a REQ-010, REQ-042;
// CA-001, CA-002, CA-005, CA-007, CA-033). Estructura en el servidor: regiones con nombre, un solo
// h1, enlace de salto primero, áreas del juego que se pase y orden de las tres zonas del cuerpo.
// Lo que se ve y se maneja en navegador (salto, ancho, orden visual) lo prueba `armazon.spec.ts`.
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { AREAS_CLIENTE_MUESTRA, AREAS_SUPERADMIN } from "../../../src/components/armazon/areas";
import { Armazon, ID_CONTENIDO } from "../../../src/components/armazon/Armazon";
import { RejillaCuerpo } from "../../../src/components/armazon/RejillaCuerpo";
import { TEXTOS } from "../../../src/components/textos";

function pintar(areaActual = "resumen", areas = AREAS_SUPERADMIN, titulo = "Vista de prueba") {
  return renderToStaticMarkup(
    <Armazon
      areas={areas}
      areaActual={areaActual}
      titulo={titulo}
      cuenta={{ nombre: "Usuario Ficticio" }}
    >
      <p>cuerpo</p>
    </Armazon>,
  );
}
const cuenta = (html: string, patron: RegExp): number => (html.match(patron) ?? []).length;

describe("PRUEBA-012 · estructura del armazón", () => {
  const html = pintar();

  it("una región de cada: navegación, cabecera y contenido principal, las tres con nombre", () => {
    expect(cuenta(html, /<nav[\s>]/g)).toBe(1);
    expect(cuenta(html, /<header[\s>]/g)).toBe(1);
    expect(cuenta(html, /<main[\s>]/g)).toBe(1);
    expect(html).toContain(`<nav aria-label="${TEXTOS.armazon.navegacionPrincipal}"`);
    expect(html).toContain(`<header aria-label="${TEXTOS.armazon.cabecera}"`);
    expect(html).toContain(`aria-label="${TEXTOS.armazon.contenidoPrincipal}"`);
  });

  it("el contenido principal puede recibir el foco del enlace de salto", () => {
    expect(html).toMatch(new RegExp(`<main[^>]*id="${ID_CONTENIDO}"[^>]*tabindex="-1"`));
  });

  it("un solo h1, con el título, en la cabecera", () => {
    expect(cuenta(html, /<h1[\s>]/g)).toBe(1);
    expect(html).toMatch(/<header[^>]*>.*<h1[^>]*>Vista de prueba<\/h1>/s);
  });

  it("orden del documento: salto, navegación, cabecera, contenido y anuncios", () => {
    const posiciones = [
      html.indexOf(TEXTOS.armazon.saltarAlContenido),
      html.indexOf("<nav"),
      html.indexOf("<header"),
      html.indexOf("<main"),
      html.indexOf('role="status"'),
    ];
    expect(posiciones.every((p) => p >= 0)).toBe(true);
    expect([...posiciones].sort((a, b) => a - b)).toEqual(posiciones);
  });

  it("las dos regiones de anuncios están presentes", () => {
    expect(html).toContain('role="status"');
    expect(html).toContain('role="alert"');
  });

  it("el título se escapa: un texto con marcas no crea elementos", () => {
    const malo = pintar("resumen", AREAS_SUPERADMIN, "<img src=x onerror=1>");
    expect(malo).not.toContain("<img");
    expect(malo).toContain("&lt;img");
  });
});

describe("PRUEBA-012 · enlace de salto", () => {
  const html = pintar();

  it("es el primer enlace del documento, antes que el menú, y apunta al contenido", () => {
    const primero = /<a\b[^>]*>/.exec(html)![0];
    expect(primero).toContain(`href="#${ID_CONTENIDO}"`);
    expect(html.indexOf(TEXTOS.armazon.saltarAlContenido)).toBeLessThan(html.indexOf("<nav"));
    expect(html).toContain(`>${TEXTOS.armazon.saltarAlContenido}</a>`);
  });

  it("se oculta sin usar sr-only (que recorta) y aparece con el foco", () => {
    const primero = /<a\b[^>]*>/.exec(html)![0];
    expect(primero).not.toContain("sr-only");
    expect(primero).toContain("focus:translate-y-0");
  });
});

describe("PRUEBA-012 · áreas en el menú", () => {
  it("superadmin: cinco entradas en su orden, ninguna desactivada", () => {
    const html = pintar();
    const nav = /<nav[\s\S]*?<\/nav>/.exec(html)![0];
    const etiquetas = [...nav.matchAll(/<a\b[^>]*>[\s\S]*?<\/a>/g)].map((m) =>
      m[0].replace(/<svg[\s\S]*?<\/svg>/g, "").replace(/<[^>]+>/g, ""),
    );
    expect(etiquetas).toEqual(["Resumen", "Clientes", "Órdenes", "Auditoría", "Ajustes"]);
    expect(nav).not.toMatch(/aria-disabled|disabled|tabindex="-1"/);
    expect(nav).toContain('href="/admin/ordenes"');
  });

  it("cliente: solo cambian las entradas; el resto de la estructura es la misma", () => {
    const superadmin = pintar("resumen", AREAS_SUPERADMIN);
    const cliente = pintar("resumen", AREAS_CLIENTE_MUESTRA);
    const esqueleto = (html: string): string =>
      html.replace(/<nav[\s\S]*?<\/nav>/, "<nav/>").replace(/<ul[\s\S]*?<\/ul>/, "");
    expect(esqueleto(cliente)).toBe(esqueleto(superadmin));
    expect(cliente).toContain("Suscripción");
    expect(cliente).not.toContain("Auditoría");
  });

  it("el área actual lleva aria-current=page y un indicador con forma; solo una", () => {
    const html = pintar("ordenes");
    expect(cuenta(html, /aria-current="page"/g)).toBe(1);
    const actual = /<a\b[^>]*aria-current="page"[^>]*>/.exec(html)![0];
    expect(actual).toContain('href="/admin/ordenes"');
    expect(actual).toContain("border-menu-indicador");
    expect(actual).toContain("font-seminegrita");
  });

  it("un área actual que no existe no marca ninguna (cierra en fallo)", () => {
    expect(cuenta(pintar("no-existe"), /aria-current/g)).toBe(0);
    expect(cuenta(pintar("__proto__"), /aria-current/g)).toBe(0);
  });

  it("los iconos del menú y el logotipo son decorativos: el nombre lo da el texto", () => {
    const nav = /<nav[\s\S]*?<\/nav>/.exec(pintar())![0];
    // Cinco iconos de áreas y, desde T-015 (b), el logotipo de la marca.
    expect(cuenta(nav, /<svg\b/g)).toBe(6);
    expect(cuenta(nav, /<svg[^>]*aria-hidden="true"/g)).toBe(6);
  });

  it("el menú lo pone Armazon a partir de las áreas: no admite un ReactNode que lo sustituya", () => {
    const html = renderToStaticMarkup(
      <Armazon
        areas={AREAS_SUPERADMIN}
        areaActual="resumen"
        titulo="x"
        cuenta={{ nombre: "Usuario Ficticio" }}
        // @ts-expect-error la lista cerrada de áreas no se puede sustituir por un nodo libre
        menu={<p id="menu-de-otro">menú ajeno</p>}
      >
        <p>c</p>
      </Armazon>,
    );
    expect(html).not.toContain("menu-de-otro");
    expect(html).not.toContain("menú ajeno");
    expect(cuenta(html, /<nav[\s>]/g)).toBe(1);
    expect(html).toContain('href="/admin/ordenes"');
  });

  it("MenuLateral y CajonMenu: el menú fijo y el botón del cajón, con las mismas áreas", () => {
    const html = pintar("clientes");
    expect(html).toContain("data-menu-lateral");
    expect(html).toContain(`aria-label="${TEXTOS.armazon.abrirMenu}"`);
    // El cajón cerrado no pinta enlaces: los cinco del documento son los del menú lateral.
    expect(cuenta(/<nav[\s\S]*?<\/nav>/.exec(html)![0], /<a\b/g)).toBe(5);
    expect(cuenta(html, /<nav[\s>]/g)).toBe(1);
  });

  it("el botón del cajón va dentro de la cabecera, antes del h1", () => {
    const cabecera = /<header[\s\S]*?<\/header>/.exec(pintar())![0];
    expect(cabecera.indexOf(TEXTOS.armazon.abrirMenu)).toBeGreaterThan(-1);
    expect(cabecera.indexOf(TEXTOS.armazon.abrirMenu)).toBeLessThan(cabecera.indexOf("<h1"));
  });
});

describe("PRUEBA-012 · RejillaCuerpo: orden fijo de las tres zonas", () => {
  it("cifras, contenido y alertas, en ese orden en el documento", () => {
    const html = renderToStaticMarkup(
      <RejillaCuerpo alertas={<p>a</p>} contenido={<p>c</p>} cifras={<p>k</p>} />,
    );
    const zonas = [...html.matchAll(/data-zona="([a-z]+)"/g)].map((m) => m[1]);
    expect(zonas).toEqual(["cifras", "contenido", "alertas"]);
  });

  it("una zona que no se pasa no se pinta, y el contenido ocupa su sitio", () => {
    const sin = renderToStaticMarkup(<RejillaCuerpo contenido={<p>c</p>} />);
    expect([...sin.matchAll(/data-zona="([a-z]+)"/g)].map((m) => m[1])).toEqual(["contenido"]);
    expect(sin).toContain("lg:col-span-3");
    const con = renderToStaticMarkup(<RejillaCuerpo contenido={<p>c</p>} alertas={<p>a</p>} />);
    expect(con).toContain("lg:col-span-2");
  });

  it("las zonas pueden encogerse: no fuerzan desplazamiento horizontal", () => {
    const html = renderToStaticMarkup(
      <RejillaCuerpo cifras={<p>k</p>} contenido={<p>c</p>} alertas={<p>a</p>} />,
    );
    expect(cuenta(html, /data-zona="[a-z]+" class="min-w-0/g)).toBe(3);
  });
});
