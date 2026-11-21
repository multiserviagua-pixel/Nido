// T-010 (b) · `CajonMenu` con la primitiva de T-001 (Radix, `@radix-ui/react-dialog`) (REQ-004,
// REQ-035, REQ-037, REQ-058; CA-003, CA-027, CA-028). Aquí, lo que se comprueba sin navegador:
// el pliegue (consulta de ancho igual al punto de ruptura), el botón que se pinta en el servidor,
// que el menú no está en el documento hasta abrirlo y las garantías que se leen en el código
// (nombre, descripción, sin foco propio, sin almacenamiento). El foco, el teclado y los objetivos
// de pulsación los mide `cajon-menu.spec.ts` en Chromium, que es donde Radix hace su trabajo.
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { AREAS_SUPERADMIN } from "../../../src/components/armazon/areas";
import {
  CONSULTA_MENU_FIJO,
  alEnsancharLaVentana,
} from "../../../src/components/armazon/ancho-menu";
import { CajonMenu } from "../../../src/components/armazon/CajonMenu";
import { TEXTOS } from "../../../src/components/textos";

const RAIZ = resolve(import.meta.dirname, "..", "..", "..");
const leer = (ruta: string): string => readFileSync(resolve(RAIZ, ruta), "utf8");
const fuente = leer("src/components/armazon/CajonMenu.tsx");

const html = renderToStaticMarkup(<CajonMenu areas={AREAS_SUPERADMIN} areaActual="clientes" />);

describe("PRUEBA-012 · CajonMenu: cerrado, el menú no está en el documento", () => {
  it("solo se pinta el botón: ni nav, ni enlaces, ni diálogo", () => {
    expect(html).not.toMatch(/<nav[\s>]|<a\b|role="dialog"/);
    for (const area of AREAS_SUPERADMIN) expect(html).not.toContain(area.etiqueta);
    expect(html.match(/<button\b/g)).toHaveLength(1);
  });

  it("el botón tiene nombre accesible «Abrir menú», anuncia que abre un diálogo y está cerrado", () => {
    const boton = /<button\b[^>]*>/.exec(html)![0];
    expect(boton).toContain(`aria-label="${TEXTOS.armazon.abrirMenu}"`);
    expect(boton).toContain('aria-haspopup="dialog"');
    expect(boton).toContain('aria-expanded="false"');
    expect(boton).toContain('type="button"');
  });

  it("el icono del botón es decorativo: el nombre lo da el botón", () => {
    expect(html.match(/<svg\b/g)).toHaveLength(1);
    expect(html).toMatch(/<svg[^>]*aria-hidden="true"/);
    expect(html).not.toMatch(/<title>|role="img"/);
  });

  it("el botón solo se ve por debajo de 1024 px (lg) y mide al menos 40 por 40 px", () => {
    const boton = /<button\b[^>]*>/.exec(html)![0];
    expect(boton).toMatch(/class="[^"]*\blg:hidden\b/);
    expect(boton).toContain("min-h-10");
    expect(boton).toContain("min-w-10");
  });
});

describe("PRUEBA-012 · CajonMenu: lo que garantiza el código", () => {
  it("es un módulo de cliente y la primitiva es la de T-001, solo Dialog", () => {
    expect(fuente.trimStart().startsWith('"use client"')).toBe(true);
    expect(fuente).toMatch(/from "@radix-ui\/react-dialog"/);
    expect(fuente).not.toMatch(/react-alert-dialog|react-toast|react-aria|@base-ui/);
  });

  it("el diálogo tiene título (nombre accesible) y el botón «Cerrar menú»", () => {
    expect(fuente).toContain("Dialog.Title");
    expect(fuente).toContain("TEXTOS.armazon.cerrarMenu");
    expect(fuente).toContain("Dialog.Close");
    // Sin descripción: se declara, para que Radix no avise de lo que no hace falta.
    expect(fuente).toContain("aria-describedby={undefined}");
  });

  it("no mueve el foco por su cuenta: sin autoFocus ni tabIndex positivo; la salida la decide Radix", () => {
    expect(fuente).not.toMatch(/autoFocus/);
    expect(fuente).not.toMatch(/tabIndex=\{?["']?[1-9]/);
    expect(fuente).not.toMatch(/\.addEventListener\("(focusin|keydown|focus)"/);
  });

  it("al cerrar por ensanchar la ventana, el foco va al menú lateral y no a un botón oculto", () => {
    expect(fuente).toContain("onCloseAutoFocus");
    expect(fuente).toContain("data-menu-lateral");
  });

  it("no recuerda su estado: ni localStorage, ni sessionStorage, ni cookies, ni IndexedDB (REQ-058)", () => {
    expect(fuente).not.toMatch(/localStorage|sessionStorage|document\.cookie|indexedDB/);
  });

  it("elegir un área cierra el cajón", () => {
    expect(fuente).toMatch(/alElegir/);
  });

  it("solo usa los papeles y utilidades del sistema de diseño: sin colores ni medidas sueltas", () => {
    expect(fuente).not.toMatch(/#[0-9a-fA-F]{3,8}\b|rgb\(|hsl\(|style=\{/);
    expect(fuente).not.toMatch(/\b(bg|text|border)-\[|\b(w|h|p|m)-\[/);
  });
});

describe("PRUEBA-012 · el pliegue: consulta de ancho y cierre al ensanchar", () => {
  it("la consulta es la del punto de ruptura lg de valores.css (64 rem = 1024 px)", () => {
    expect(CONSULTA_MENU_FIJO).toBe("(min-width: 64rem)");
    const css = leer("src/components/estilos/valores.css");
    expect(css).toMatch(/--breakpoint-lg:\s*64rem;/);
  });

  function listaFalsa() {
    const oyentes = new Set<(e: { matches: boolean }) => void>();
    return {
      oyentes,
      addEventListener: (_: "change", f: (e: { matches: boolean }) => void) => oyentes.add(f),
      removeEventListener: (_: "change", f: (e: { matches: boolean }) => void) => oyentes.delete(f),
      emitir: (matches: boolean) => oyentes.forEach((f) => f({ matches })),
    };
  }

  it("al pasar a 1024 px o más, avisa; al pasar a menos, no", () => {
    const lista = listaFalsa();
    const alEnsanchar = vi.fn();
    alEnsancharLaVentana(lista, alEnsanchar);
    lista.emitir(false);
    expect(alEnsanchar).not.toHaveBeenCalled();
    lista.emitir(true);
    expect(alEnsanchar).toHaveBeenCalledTimes(1);
  });

  it("la función devuelta deja de escuchar", () => {
    const lista = listaFalsa();
    const alEnsanchar = vi.fn();
    const dejar = alEnsancharLaVentana(lista, alEnsanchar);
    expect(lista.oyentes.size).toBe(1);
    dejar();
    expect(lista.oyentes.size).toBe(0);
    lista.emitir(true);
    expect(alEnsanchar).not.toHaveBeenCalled();
  });
});
