// T-010 (c) · `Cabecera`, `CuentaUsuario` y `SelectorPeriodo` (REQ-005, REQ-006, REQ-036, REQ-065,
// REQ-083; CA-004, CA-044, CA-049). Aquí, lo que se comprueba sin navegador: el marcado del servidor
// y las garantías que se leen en el código. El panel abierto, el cambio de periodo y el foco los
// mide `cabecera.spec.ts` en Chromium.
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { AREAS_SUPERADMIN } from "../../../src/components/armazon/areas";
import { Armazon } from "../../../src/components/armazon/Armazon";
import { Cabecera } from "../../../src/components/armazon/Cabecera";
import { CuentaUsuario } from "../../../src/components/armazon/CuentaUsuario";
import type { ConfiguracionDePeriodo } from "../../../src/components/armazon/periodo";
import { SelectorPeriodo } from "../../../src/components/armazon/SelectorPeriodo";
import { TEXTOS } from "../../../src/components/textos";

const RAIZ = resolve(import.meta.dirname, "..", "..", "..");
const leer = (ruta: string): string => readFileSync(resolve(RAIZ, ruta), "utf8");

const PERIODO: ConfiguracionDePeriodo = {
  periodos: [
    {
      clave: "ultimos-7-dias",
      etiqueta: "Últimos 7 días",
      desde: "2026-11-06T00:00:00+01:00",
      hasta: "2026-11-12T23:59:59+01:00",
    },
    {
      clave: "ultimos-30-dias",
      etiqueta: "Últimos 30 días",
      desde: "2026-10-14T00:00:00+02:00",
      hasta: "2026-11-12T23:59:59+01:00",
    },
  ],
  porDefecto: "ultimos-30-dias",
  valor: "ultimos-7-dias",
};
const CUENTA = { nombre: "Usuario Ficticio" };

function cabecera(extra: Partial<Parameters<typeof Cabecera>[0]> = {}) {
  return renderToStaticMarkup(
    <Cabecera
      areas={AREAS_SUPERADMIN}
      areaActual="resumen"
      titulo="Órdenes"
      cuenta={CUENTA}
      {...extra}
    />,
  );
}
const cuenta = (html: string, patron: RegExp): number => (html.match(patron) ?? []).length;

describe("PRUEBA-012 · Cabecera: título, cuenta y, solo si se declara, periodo", () => {
  it("es el banner con nombre y lleva el único h1 con el título", () => {
    const html = cabecera();
    expect(html).toMatch(new RegExp(`^<header aria-label="${TEXTOS.armazon.cabecera}"`));
    expect(cuenta(html, /<h1[\s>]/g)).toBe(1);
    expect(html).toMatch(/<h1[^>]*>Órdenes<\/h1>/);
  });

  it("queda fija arriba solo con alto de ventana suficiente y lleva la marca con la que se reserva su alto", () => {
    const html = cabecera();
    expect(html).toContain("data-cabecera");
    const clases = /<header[^>]*class="([^"]*)"/.exec(html)![1]!.split(" ");
    expect(clases).toContain("alto-suficiente:sticky");
    expect(clases).toContain("alto-suficiente:top-0");
    // Sin la condición de alto, nunca es fija (MAYOR 2 de la revisión).
    expect(clases).not.toContain("sticky");
  });

  it("sin periodo, no hay selector; con periodo, lo hay", () => {
    expect(cabecera()).not.toContain("<select");
    expect(cuenta(cabecera({ periodo: PERIODO }), /<select\b/g)).toBe(1);
  });

  it("orden del documento: botón del cajón, h1, cuenta y selector", () => {
    const html = cabecera({ periodo: PERIODO });
    const posiciones = [
      html.indexOf(TEXTOS.armazon.abrirMenu),
      html.indexOf("<h1"),
      html.indexOf(TEXTOS.cuenta.abrir),
      html.indexOf("<select"),
    ];
    expect(posiciones.every((p) => p >= 0)).toBe(true);
    expect([...posiciones].sort((a, b) => a - b)).toEqual(posiciones);
  });

  it("el título es texto: no crea elementos y no admite nodos", () => {
    const html = cabecera({ titulo: "<img src=x onerror=1>" });
    expect(html).not.toContain("<img");
    expect(html).toContain("&lt;img");
  });

  it("Armazon la usa: cuenta obligatoria en el tipo y sin la propiedad provisional `cabecera`", () => {
    const fuente = leer("src/components/armazon/Armazon.tsx");
    expect(fuente).not.toMatch(/cabecera\?:\s*undefined/);
    expect(fuente).toMatch(/<Cabecera\b/);
    const html = renderToStaticMarkup(
      <Armazon
        areas={AREAS_SUPERADMIN}
        areaActual="resumen"
        titulo="x"
        cuenta={CUENTA}
        periodo={PERIODO}
      >
        <p>c</p>
      </Armazon>,
    );
    expect(cuenta(html, /<header[\s>]/g)).toBe(1);
    expect(cuenta(html, /<select\b/g)).toBe(1);
  });

  it("no admite un nodo libre en la cabecera (menor 3 de T-010 (a))", () => {
    const html = renderToStaticMarkup(
      <Armazon
        areas={AREAS_SUPERADMIN}
        areaActual="resumen"
        titulo="x"
        cuenta={CUENTA}
        // @ts-expect-error la cabecera la pintan Cabecera, CuentaUsuario y SelectorPeriodo
        cabecera={<div id="cabecera-ajena" />}
      >
        <p>c</p>
      </Armazon>,
    );
    expect(html).not.toContain("cabecera-ajena");
  });
});

describe("PRUEBA-012 · CuentaUsuario: botón siempre visible que abre un panel", () => {
  const html = renderToStaticMarkup(<CuentaUsuario cuenta={CUENTA} />);
  const boton = /<button\b[^>]*>/.exec(html)![0];

  it("solo se pinta el botón (el panel no está en el documento hasta abrirlo) y anuncia un diálogo", () => {
    expect(cuenta(html, /<button\b/g)).toBe(1);
    expect(html).not.toMatch(/role="dialog"|<a\b/);
    expect(boton).toContain('aria-haspopup="dialog"');
    expect(boton).toContain('aria-expanded="false"');
    expect(boton).toContain('type="button"');
  });

  it("nunca se oculta por ancho: ninguna clase hidden ni lg:hidden en el botón", () => {
    expect(boton).not.toMatch(/\b(?:[a-z]+:)?hidden\b/);
    expect(boton).toContain("min-h-10");
  });

  it("su nombre accesible lleva «Cuenta» y el nombre completo, como texto", () => {
    expect(boton).toContain(`aria-label="${TEXTOS.cuenta.abrir}: Usuario Ficticio"`);
    expect(html).toContain(TEXTOS.cuenta.abrir);
    expect(html).toContain("Usuario Ficticio");
    expect(html).toMatch(/<svg[^>]*aria-hidden="true"/);
  });

  it("un nombre de 120 caracteres sin espacios se pinta entero en el documento (se acorta solo con CSS)", () => {
    const largo = "Ficticio".repeat(15);
    const h = renderToStaticMarkup(<CuentaUsuario cuenta={{ nombre: largo }} />);
    expect(h).toContain(largo);
    expect(h).toContain("truncate");
    expect(h).toContain(`aria-label="${TEXTOS.cuenta.abrir}: ${largo}"`);
    expect(h).not.toContain("sr-only");
  });

  it("un nombre con marcas, con caracteres de control o vacío no crea elementos ni queda en blanco", () => {
    const inversor = String.fromCharCode(0x202e);
    const malo = renderToStaticMarkup(<CuentaUsuario cuenta={{ nombre: `<b>x</b>${inversor}` }} />);
    expect(malo).not.toContain("<b>");
    expect(malo).not.toContain(inversor);
    const vacio = renderToStaticMarkup(<CuentaUsuario cuenta={{ nombre: " \u0007 " }} />);
    expect(vacio).toContain(TEXTOS.cuenta.sinNombre);
  });

  it("es un módulo de cliente con la primitiva de T-001 (solo Dialog), sin leer la dirección ni guardar nada", () => {
    const f = leer("src/components/armazon/CuentaUsuario.tsx");
    expect(f.trimStart().startsWith('"use client"')).toBe(true);
    expect(f).toMatch(/from "..\/dialogo\/PanelModal"/);
    expect(f).not.toMatch(/@radix-ui/);
    const panel = leer("src/components/dialogo/PanelModal.tsx");
    expect(panel.trimStart().startsWith('"use client"')).toBe(true);
    expect(panel).toMatch(/from "@radix-ui\/react-dialog"/);
    expect(panel).not.toMatch(/react-alert-dialog|react-popover|\.focus\(/);
    expect(f).not.toMatch(
      /react-alert-dialog|react-popover|next\/|location|searchParams|URLSearchParams/,
    );
    expect(f).not.toMatch(/localStorage|sessionStorage|indexedDB|document\.cookie/);
  });

  it("las acciones llegan por propiedades y son enlaces con texto fijo; el tipo no admite nodos", () => {
    const f = leer("src/components/armazon/CuentaUsuario.tsx");
    expect(f).toMatch(/acciones/);
    expect(f).not.toMatch(/dangerouslySetInnerHTML/);
  });
});

describe("PRUEBA-012 · SelectorPeriodo: control nativo, etiqueta visible, lista cerrada", () => {
  const html = renderToStaticMarkup(<SelectorPeriodo periodo={PERIODO} />);

  it("un select nativo con etiqueta visible asociada y una opción por periodo", () => {
    const id = /<select[^>]*id="([^"]+)"/.exec(html)![1]!;
    expect(html).toMatch(
      new RegExp(`<label[^>]*for="${id}"[^>]*>${TEXTOS.periodo.etiqueta}</label>`),
    );
    expect(cuenta(html, /<option\b/g)).toBe(2);
    expect(html).toContain(">Últimos 7 días</option>");
    expect(html).toContain(">Últimos 30 días</option>");
  });

  it("el valor activo sale de la propiedad y, junto al selector, va el periodo con palabras y fechas", () => {
    expect(html).toMatch(/<option[^>]*value="ultimos-7-dias"[^>]*selected/);
    expect(html).toContain("Últimos 7 días · 6 nov – 12 nov 2026");
  });

  it("un valor que no está en la lista cae al de por defecto; sin lista, no pinta nada", () => {
    const h = renderToStaticMarkup(<SelectorPeriodo periodo={{ ...PERIODO, valor: "<script>" }} />);
    expect(h).toMatch(/<option[^>]*value="ultimos-30-dias"[^>]*selected/);
    expect(renderToStaticMarkup(<SelectorPeriodo periodo={{ ...PERIODO, periodos: [] }} />)).toBe(
      "",
    );
  });

  it("anuncia el cambio, escribe el valor solo en la dirección y no guarda nada en el navegador", () => {
    const f = leer("src/components/armazon/SelectorPeriodo.tsx");
    expect(f.trimStart().startsWith('"use client"')).toBe(true);
    expect(f).toMatch(/anunciar\(/);
    expect(f).toMatch(/rutaConPeriodo\(/);
    // Forma documentada por Next 16: `null`, para que su `replaceState` parcheado copie el estado
    // interno del enrutador (MAYOR 1 de la revisión).
    expect(f).toMatch(/history\.replaceState\(\s*null,/);
    expect(f).not.toMatch(/replaceState\(\s*window\.history\.state/);
    expect(f).not.toMatch(/location\.(assign|replace|reload|href\s*=)/);
    const gancho = leer("src/components/armazon/usePeriodo.ts");
    expect(gancho).toMatch(/useSyncExternalStore/);
    expect(gancho).not.toMatch(/localStorage|sessionStorage|indexedDB|document\.cookie|next\//);
    expect(f).not.toMatch(/next\/|localStorage|sessionStorage|indexedDB|document\.cookie/);
  });
});
