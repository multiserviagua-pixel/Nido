// T-010 (d) · `Boton` y `useAccion` (diseño 020, «Componentes base», fila `Boton`, `useAccion`;
// REQ-024, REQ-037, REQ-074; CA-017). `Boton` no tiene estado: se pinta en el servidor de pruebas
// y se llama como función para ver su manejador. El gancho se lee en el código (no hay jsdom ni
// biblioteca de pruebas de componentes en el proyecto); que dos pulsaciones reales den un solo
// envío lo mide `acciones.spec.ts`.
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { ReactElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { Boton } from "../../../src/components/acciones/Boton";
import { TEXTOS } from "../../../src/components/textos";

const RAIZ = resolve(import.meta.dirname, "..", "..", "..");
const leer = (ruta: string): string => readFileSync(resolve(RAIZ, ruta), "utf8");

const pintar = (p: Parameters<typeof Boton>[0]): string => renderToStaticMarkup(<Boton {...p} />);
const clases = (html: string): string[] => /class="([^"]*)"/.exec(html)![1]!.split(" ");

describe("Boton · texto, tipo y tamaño (REQ-024, REQ-037)", () => {
  it("es un button nativo con el texto fijo y type=button por defecto", () => {
    const html = pintar({ texto: TEXTOS.acciones.confirmar.pausar });
    expect(html).toMatch(/^<button type="button"[^>]*>Pausar<\/button>$/);
  });

  it("admite type=submit y nada más: un tipo desconocido cierra en button", () => {
    expect(pintar({ texto: TEXTOS.acciones.confirmar.pausar, type: "submit" })).toContain(
      'type="submit"',
    );
    const raro = {
      texto: TEXTOS.acciones.confirmar.pausar,
      type: "reset",
    } as unknown as Parameters<typeof Boton>[0];
    expect(pintar(raro)).toContain('type="button"');
  });

  it("alcanza el alto de control del diseño (40 px) y no baja de los 24 px mínimos", () => {
    const c = clases(pintar({ texto: TEXTOS.acciones.confirmar.pausar }));
    expect(c).toContain("min-h-10");
    expect(c).toContain("min-w-10");
    // Ninguna clase puede dejarlo por debajo del objetivo mínimo.
    expect(c.filter((x) => /^(?:h|min-h|w|min-w)-(?:[0-5]|\[[^\]]*\])$/.test(x))).toEqual([]);
  });

  it("no lleva foco propio: el contorno es el de base.css, ni outline-none ni ring", () => {
    const c = clases(pintar({ texto: TEXTOS.acciones.confirmar.pausar }));
    expect(c.filter((x) => /outline|ring|focus/.test(x))).toEqual([]);
  });
});

describe("Boton · variantes con papeles de color ya declarados", () => {
  it("primario: acento con texto sobre acento; secundario: superficie con borde de control", () => {
    const primario = clases(
      pintar({ texto: TEXTOS.acciones.confirmar.pausar, variante: "primario" }),
    );
    expect(primario).toContain("bg-acento");
    expect(primario).toContain("text-texto-sobre-acento");
    const secundario = clases(pintar({ texto: TEXTOS.acciones.cancelar, variante: "secundario" }));
    expect(secundario).toContain("bg-superficie");
    expect(secundario).toContain("border-borde-control");
    expect(secundario).toContain("text-texto");
  });

  it("sin variante es secundario, y una variante desconocida también (cierra en lo discreto)", () => {
    const base = clases(pintar({ texto: TEXTOS.acciones.cancelar }));
    expect(base).toContain("bg-superficie");
    const rara = { texto: TEXTOS.acciones.cancelar, variante: "peligro" } as unknown as Parameters<
      typeof Boton
    >[0];
    expect(clases(pintar(rara))).toEqual(base);
  });

  it("solo usa papeles: ninguna clase con un valor ni un color de la rampa", () => {
    for (const variante of ["primario", "secundario"] as const) {
      const c = clases(pintar({ texto: TEXTOS.acciones.cancelar, variante }));
      expect(
        c.filter((x) => /#|\[|\b(?:slate|gray|zinc|neutral|purple|violet|red|green)-\d/.test(x)),
      ).toEqual([]);
    }
  });
});

describe("Boton · acción en curso (REQ-024, REQ-074)", () => {
  const enCurso = {
    texto: TEXTOS.acciones.confirmar.pausar,
    textoEnCurso: TEXTOS.acciones.enCurso.pausar,
    enCurso: true,
  } as const;

  it("lo dice con palabra, se marca aria-disabled y sigue en el orden de tabulación", () => {
    const html = pintar(enCurso);
    expect(html).toContain(">Pausando…<");
    expect(html).not.toContain(">Pausar<");
    expect(html).toContain('aria-disabled="true"');
    expect(html).not.toMatch(/\sdisabled(?:=|\s|>)/);
    expect(html).not.toContain("tabindex");
  });

  it("sin textoEnCurso usa «Cargando», nunca deja el mismo texto", () => {
    const html = pintar({ texto: TEXTOS.acciones.confirmar.pausar, enCurso: true });
    expect(html).toContain(`>${TEXTOS.bloque.cargando}<`);
    expect(html).toContain('aria-disabled="true"');
  });

  it("fuera de curso no lleva aria-disabled ni muestra el texto en curso", () => {
    const html = pintar({ ...enCurso, enCurso: false });
    expect(html).not.toContain("aria-disabled");
    expect(html).toContain(">Pausar<");
  });

  it("los colores no cambian al ocuparse: el texto sigue con su contraste", () => {
    for (const variante of ["primario", "secundario"] as const) {
      expect(clases(pintar({ ...enCurso, variante }))).toEqual(
        clases(pintar({ ...enCurso, variante, enCurso: false })),
      );
    }
  });

  it("el manejador ignora la pulsación (clic, Intro repetido o envío implícito de un formulario)", () => {
    const alPulsar = vi.fn();
    const evento = { preventDefault: vi.fn() };
    const ocupado = Boton({ ...enCurso, onClick: alPulsar }) as ReactElement<{
      onClick: (e: unknown) => void;
    }>;
    ocupado.props.onClick(evento);
    expect(alPulsar).not.toHaveBeenCalled();
    expect(evento.preventDefault).toHaveBeenCalledTimes(1);

    const libre = Boton({ ...enCurso, enCurso: false, onClick: alPulsar }) as ReactElement<{
      onClick: (e: unknown) => void;
    }>;
    libre.props.onClick(evento);
    expect(alPulsar).toHaveBeenCalledTimes(1);
    expect(alPulsar).toHaveBeenCalledWith(evento);
  });
});

describe("Boton · sin texto libre del servidor", () => {
  const fuente = leer("src/components/acciones/Boton.tsx");

  it("no admite children ni HTML en bruto: el texto solo entra por `texto` y sale de TEXTOS", () => {
    expect(fuente).not.toMatch(/children/);
    expect(fuente).not.toMatch(/dangerouslySetInnerHTML/);
    expect(fuente).toMatch(/TextoFijo/);
  });

  it("es de cliente (tiene un manejador) y solo importa react y los textos fijos", () => {
    expect(fuente.trimStart().startsWith('"use client"')).toBe(true);
    const importados = [...fuente.matchAll(/from "([^"]+)"/g)].map((m) => m[1]);
    expect(importados.sort()).toEqual(["../textos", "react"]);
  });
});

describe("useAccion · lo que se lee en el código", () => {
  const gancho = leer("src/components/acciones/useAccion.ts");

  it("es de cliente, solo importa react y el controlador, y no toca red ni almacenamiento", () => {
    expect(gancho.trimStart().startsWith('"use client"')).toBe(true);
    const importados = [...gancho.matchAll(/from "([^"]+)"/g)].map((m) => m[1]).sort();
    expect(importados).toEqual(["./controlador", "./resultado", "react"].sort());
    expect(gancho).not.toMatch(
      /\bfetch\b|XMLHttpRequest|WebSocket|sendBeacon|localStorage|sessionStorage|indexedDB|document\.cookie/,
    );
  });

  it("usa useSyncExternalStore con instantánea de servidor y desactiva el controlador al desmontar", () => {
    expect(gancho).toMatch(/useSyncExternalStore\(/);
    expect(gancho).toMatch(/desactivar\(\)/);
    expect(gancho).toMatch(/activar\(\)/);
  });

  it("el controlador y el lector no importan nada de React ni de src/lib", () => {
    for (const archivo of ["controlador.ts", "resultado.ts"]) {
      const f = leer(`src/components/acciones/${archivo}`);
      expect(f, archivo).not.toMatch(/from "react/);
      expect(f, archivo).not.toMatch(/src\/lib|\.\.\/\.\.\/lib|\bfetch\b/);
    }
  });
});
