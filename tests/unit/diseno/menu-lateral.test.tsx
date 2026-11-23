// T-010 (b) · `MenuLateral` (REQ-002, REQ-003, REQ-010, REQ-038; CA-001, CA-002, CA-029):
// `nav` con nombre accesible hecho de la lista cerrada de áreas, con el área actual marcada con
// `aria-current="page"` y con forma (barra y peso), solo visible desde 1024 px (por debajo lo
// sustituye el cajón) y sin entradas desactivadas. Estructura en el servidor; lo que se ve y se
// maneja en navegador lo prueba `cajon-menu.spec.ts`.
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  AREAS_CLIENTE_MUESTRA,
  AREAS_SUPERADMIN,
  type Area,
} from "../../../src/components/armazon/areas";
import { MenuLateral } from "../../../src/components/armazon/MenuLateral";
import { TEXTOS } from "../../../src/components/textos";

function pintar(areaActual = "resumen", areas: readonly Area[] = AREAS_SUPERADMIN): string {
  return renderToStaticMarkup(<MenuLateral areas={areas} areaActual={areaActual} />);
}
const cuenta = (html: string, patron: RegExp): number => (html.match(patron) ?? []).length;
const etiquetas = (html: string): string[] =>
  [...html.matchAll(/<a\b[^>]*>[\s\S]*?<\/a>/g)].map((m) =>
    m[0].replace(/<svg[\s\S]*?<\/svg>/g, "").replace(/<[^>]+>/g, ""),
  );

describe("PRUEBA-012 · MenuLateral: región y nombre", () => {
  const html = pintar();

  it("es un nav con nombre accesible, y solo uno", () => {
    expect(cuenta(html, /<nav[\s>]/g)).toBe(1);
    expect(html).toContain(`<nav aria-label="${TEXTOS.armazon.navegacionPrincipal}"`);
  });

  it("fondo oscuro con el degradado del menú, solo papeles de valores.css", () => {
    const nav = /<nav\b[^>]*>/.exec(html)![0];
    expect(nav).toContain("bg-menu-fondo");
    expect(nav).toContain("bg-degradado-menu");
    expect(nav).toContain("text-menu-texto");
  });

  it("solo se ve desde 1024 px (lg): por debajo no se pinta ni recibe el foco; lo sustituye el cajón", () => {
    const nav = /<nav\b[^>]*>/.exec(html)![0];
    expect(nav).toMatch(/class="[^"]*\bhidden\b[^"]*\blg:block\b/);
    expect(nav).toContain("lg:w-menu-ancho");
  });

  it("lleva una marca para que el cajón sepa dónde devolver el foco al ensancharse la ventana", () => {
    expect(/<nav\b[^>]*>/.exec(html)![0]).toContain("data-menu-lateral");
  });
});

describe("PRUEBA-012 · MenuLateral: lista cerrada de áreas", () => {
  it("superadmin: Resumen, Clientes, Órdenes, Auditoría y Ajustes, en ese orden", () => {
    expect(etiquetas(pintar())).toEqual(["Resumen", "Clientes", "Órdenes", "Auditoría", "Ajustes"]);
  });

  it("cliente: el juego que se pase y nada más", () => {
    expect(etiquetas(pintar("resumen", AREAS_CLIENTE_MUESTRA))).toEqual([
      "Resumen",
      "Actividad",
      "Suscripción",
      "Cuenta",
    ]);
  });

  it("cada entrada es un enlace a la ruta de su área", () => {
    const html = pintar();
    for (const area of AREAS_SUPERADMIN) expect(html).toContain(`href="${area.ruta}"`);
    expect(cuenta(html, /<a\b/g)).toBe(AREAS_SUPERADMIN.length);
  });

  it("ninguna entrada desactivada, ni «próximamente», ni con tabindex negativo", () => {
    const html = pintar();
    expect(html).not.toMatch(/aria-disabled|\bdisabled\b|tabindex="-1"|pr[óo]ximamente/i);
  });

  it("el tipo de área no admite una entrada desactivada", () => {
    // Si `Area` admitiera `desactivada`, este `@ts-expect-error` sobraría y `npm run tipos` fallaría.
    const intento: Area = {
      clave: "x",
      etiqueta: "x",
      ruta: "/x",
      icono: "IconoResumen",
      // @ts-expect-error el tipo cerrado no tiene este campo
      desactivada: true,
    };
    expect(intento.clave).toBe("x");
  });
});

describe("PRUEBA-012 · MenuLateral: área actual", () => {
  it("solo una lleva aria-current=page", () => {
    expect(cuenta(pintar("ordenes"), /aria-current="page"/g)).toBe(1);
  });

  it("la marcada es la del área actual", () => {
    const actual = /<a\b[^>]*aria-current="page"[^>]*>/.exec(pintar("auditoria"))![0];
    expect(actual).toContain('href="/admin/auditoria"');
  });

  it("el indicador tiene forma además de color: barra lateral y peso de letra", () => {
    const html = pintar("ordenes");
    const actual = /<a\b[^>]*aria-current="page"[^>]*>/.exec(html)![0];
    expect(actual).toContain("border-l-4");
    expect(actual).toContain("border-menu-indicador");
    expect(actual).toContain("font-seminegrita");
    const otros = [...html.matchAll(/<a\b(?![^>]*aria-current)[^>]*>/g)].map((m) => m[0]);
    expect(otros).toHaveLength(AREAS_SUPERADMIN.length - 1);
    for (const o of otros) {
      expect(o).not.toContain("border-menu-indicador");
      expect(o).not.toContain("font-seminegrita");
      expect(o).not.toContain("bg-menu-actual");
    }
  });

  it("un área actual que no existe no marca ninguna (cierra en fallo)", () => {
    expect(cuenta(pintar("no-existe"), /aria-current/g)).toBe(0);
    expect(cuenta(pintar("__proto__"), /aria-current/g)).toBe(0);
    expect(cuenta(pintar(""), /aria-current/g)).toBe(0);
  });
});

describe("PRUEBA-012 · MenuLateral: iconos y objetivos", () => {
  it("los iconos son decorativos (aria-hidden): el nombre de cada enlace es su texto", () => {
    const html = pintar();
    // Un icono por área y, desde T-015 (b), el logotipo de la marca arriba.
    expect(cuenta(html, /<svg\b/g)).toBe(AREAS_SUPERADMIN.length + 1);
    expect(cuenta(html, /<svg[^>]*aria-hidden="true"/g)).toBe(AREAS_SUPERADMIN.length + 1);
    expect(html).not.toMatch(/<title>|role="img"/);
  });

  it("cada enlace mide al menos 40 px de alto: más de los 24 de REQ-037", () => {
    for (const m of pintar().matchAll(/<a\b[^>]*>/g)) expect(m[0]).toContain("min-h-10");
  });

  it("un texto de etiqueta con marcas se escapa", () => {
    const html = pintar("x", [
      { clave: "x", etiqueta: "<img src=x onerror=1>", ruta: "/x", icono: "IconoResumen" },
    ]);
    expect(html).not.toContain("<img");
    expect(html).toContain("&lt;img");
  });
});
