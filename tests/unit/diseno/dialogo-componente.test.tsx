// T-010 (j) · `DialogoConfirmacion`, lo que se puede comprobar sin navegador (diseño 020, «Diálogo,
// cajón y avisos»; REQ-017, REQ-018, REQ-056; CA-013). El foco, el teclado, los anchos, los
// resultados con reloj simulado y `axe` están en `tests/e2e/muestra/dialogo-confirmacion.spec.ts`.
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { DialogoConfirmacion } from "../../../src/components/dialogo/DialogoConfirmacion";
import { TEXTOS } from "../../../src/components/textos";

const RAIZ = resolve(import.meta.dirname, "..", "..", "..");
const FUENTE = readFileSync(
  resolve(RAIZ, "src/components/dialogo/DialogoConfirmacion.tsx"),
  "utf8",
);
const objetivo = { nombre: "TESTIGO-NOMBRE", distintivo: "TESTIGO-DISTINTIVO" };
const boton = <button type="button">Abrir</button>;

describe("DialogoConfirmacion · cerrado", () => {
  it("cerrado solo pinta el disparador: el objetivo no está en el documento", () => {
    const html = renderToStaticMarkup(
      <DialogoConfirmacion
        disparador={boton}
        accion="pausar_agente"
        objetivo={objetivo}
        datoDistintivo="identificador"
        ejecutar={() => undefined}
      />,
    );
    expect(html).toContain(">Abrir<");
    expect(html).toContain('aria-haspopup="dialog"');
    expect(html).toContain('data-state="closed"');
    expect(html).not.toContain("TESTIGO");
    expect(html).not.toContain(TEXTOS.dialogo.acciones.pausar_agente.titulo);
  });

  it("una acción o un dato distintivo fuera de las listas no abren nada: solo el disparador", () => {
    for (const [accion, dato] of [
      ["borrar_todo", "identificador"],
      ["pausar_agente", "correo"],
    ] as const) {
      const html = renderToStaticMarkup(
        <DialogoConfirmacion
          disparador={boton}
          accion={accion as never}
          objetivo={objetivo}
          datoDistintivo={dato as never}
          ejecutar={() => undefined}
          abiertoAlCargar
        />,
      );
      expect(html, accion).toBe(renderToStaticMarkup(boton));
    }
  });
});

describe("DialogoConfirmacion · reglas de los componentes (diseño, «Reglas comunes»)", () => {
  it("no llama a la red, no usa HTML sin escapar ni colores ni estilos sueltos ni `next/`", () => {
    expect(FUENTE).not.toMatch(/fetch\(|dangerouslySetInnerHTML|innerHTML|XMLHttpRequest/);
    expect(FUENTE).not.toMatch(/#[0-9a-fA-F]{3,8}\b|rgb\(|hsl\(|style=\{/);
    expect(FUENTE).not.toMatch(/from "next\/|recharts/);
  });

  it("usa la primitiva de alerta de T-001, `useAccion`, `Boton` y los textos fijos", () => {
    expect(FUENTE).toMatch(/from "@radix-ui\/react-alert-dialog"/);
    expect(FUENTE).toMatch(/useAccion\(/);
    expect(FUENTE).toMatch(/<Boton/);
    expect(FUENTE).toMatch(/AlertDialog\.Cancel/);
    expect(FUENTE).toMatch(/TEXTOS\.dialogo/);
    expect(FUENTE).toMatch(/TextoDato/);
  });

  it("el foco inicial lo decide Radix con «Cancelar»: no hay `autoFocus` ni `onOpenAutoFocus` que lo cambie", () => {
    expect(FUENTE).not.toMatch(/autoFocus|onOpenAutoFocus|tabIndex=\{[1-9]/);
  });

  it("no cierra con un clic fuera y no tiene propiedad para un texto libre", () => {
    expect(FUENTE).not.toMatch(/onPointerDownOutside|onInteractOutside/);
    const propiedades = /export type PropiedadesDeDialogoConfirmacion = \{([\s\S]*?)\n\};/.exec(
      FUENTE,
    );
    expect(propiedades).not.toBeNull();
    const nombres = [...propiedades![1]!.matchAll(/readonly (\w+)\??:/g)].map((m) => m[1]);
    expect(nombres.sort()).toEqual(
      [
        "abiertoAlCargar",
        "accion",
        "alReleer",
        "datoDistintivo",
        "disparador",
        "distintivo",
        "ejecutar",
        "lectura",
        "nombre",
        "objetivo",
      ].sort(),
    );
  });
});
