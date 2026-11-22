// PRUEBA-022 (diseño 020 §Pruebas): todo par de colores usado en la muestra, en los dos temas,
// está declarado en `combinaciones.ts` (CA-022, CA-057). Recorre todos los estados del inventario,
// toma de cada texto, borde de control y contorno de foco su color calculado y el del fondo opaco
// o degradado más cercano, y falla si algún par no está declarado. Así el informe de contraste
// (PRUEBA-006) cubre el 100 % de lo usado y no solo lo que alguien recordó declarar.
import { expect, test } from "@playwright/test";
import { COMBINACIONES } from "../../../src/components/estilos/combinaciones";
import { ESTADOS, abrirEstado, anotarPendiente } from "./apoyo/estados";
import { recorrerPares } from "./apoyo/pares-de-color";
import { ALTO_POR_DEFECTO } from "./configuracion-interfaz";

const TEMAS_DEL_SISTEMA = [
  { emulado: "light", tema: "claro" },
  { emulado: "dark", tema: "oscuro" },
] as const;

/** Todos los papeles que aparecen en algún par, sin repetir. */
function papelesDe(tema: "claro" | "oscuro"): string[] {
  return [...new Set(COMBINACIONES[tema].flatMap((p) => [p.delante, p.detras]))];
}
function declaradosDe(tema: "claro" | "oscuro"): string[] {
  return COMBINACIONES[tema].map((p) => `${p.delante}|${p.detras}`);
}

test("el inventario tiene al menos un estado y la tabla de combinaciones no está vacía", () => {
  expect(ESTADOS.length).toBeGreaterThan(0);
  expect(COMBINACIONES.claro.length).toBeGreaterThan(0);
  expect(COMBINACIONES.oscuro.length).toBeGreaterThan(0);
});

for (const estado of ESTADOS) {
  for (const { emulado, tema } of TEMAS_DEL_SISTEMA) {
    test(`PRUEBA-022 · ${estado.etiqueta} · tema ${tema}`, async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: ALTO_POR_DEFECTO });
      await page.emulateMedia({ colorScheme: emulado });
      await abrirEstado(page, estado);
      const { medidos, sinDeclarar } = await recorrerPares(
        page,
        papelesDe(tema),
        declaradosDe(tema),
        // Marcos de tema de las páginas de propuesta y de valores (T-012): cada uno, con su tabla.
        { claro: declaradosDe("claro"), oscuro: declaradosDe("oscuro") },
      );
      expect(medidos, "se ha medido al menos un par").toBeGreaterThan(0);
      expect(sinDeclarar, "pares usados y no declarados en combinaciones.ts").toEqual([]);
      test.info().annotations.push({ type: "pares medidos", description: String(medidos) });
      anotarPendiente(
        test.info(),
        "pares de color de fill y stroke de SVG, con opacity y con fondos de hermanos posicionados (límites de apoyo/pares-de-color.ts)",
        "T-032 y T-033 (gráficos), antes de dar PRUEBA-022 por completa para ellos",
      );
    });
  }
}

test.describe("PRUEBA-022 · controles: la medida detecta lo que no está declarado", () => {
  async function sembrar(page: import("@playwright/test").Page, html: string): Promise<void> {
    await page.goto("/muestra");
    await page.waitForLoadState("networkidle");
    await page.evaluate(
      (h) => document.querySelector("main")?.insertAdjacentHTML("beforeend", h),
      html,
    );
  }

  test("un color literal fuera del sistema se detecta", async ({ page }) => {
    await sembrar(page, `<p id="sembrado" style="color:#123456">Color suelto</p>`);
    const { sinDeclarar } = await recorrerPares(page, papelesDe("claro"), declaradosDe("claro"));
    expect(sinDeclarar.some((p) => p.donde.includes("p#sembrado"))).toBe(true);
  });

  test("un par de papeles que existen pero no está declarado se detecta", async ({ page }) => {
    // El color de aviso sobre un fondo suave no figura en combinaciones.ts.
    await sembrar(
      page,
      `<p id="sembrado" style="color:var(--aviso);background-color:var(--acento-suave)">Aviso sobre fondo suave</p>`,
    );
    const { sinDeclarar } = await recorrerPares(page, papelesDe("claro"), declaradosDe("claro"));
    const hallado = sinDeclarar.find((p) => p.donde.includes("p#sembrado"));
    expect(hallado?.motivo).toBe("par no declarado");
  });

  test("un par declarado no se señala (control positivo)", async ({ page }) => {
    await sembrar(
      page,
      `<p id="sembrado" style="color:var(--texto-secundario);background-color:var(--acento-suave)">Ayuda sobre selección</p>`,
    );
    const { sinDeclarar } = await recorrerPares(page, papelesDe("claro"), declaradosDe("claro"));
    expect(sinDeclarar.some((p) => p.donde.includes("p#sembrado"))).toBe(false);
  });

  test("un fondo translúcido no se da por bueno", async ({ page }) => {
    await sembrar(
      page,
      `<p id="sembrado" style="color:var(--texto);background-color:rgba(0,0,0,0.5)">Sobre un fondo a medias</p>`,
    );
    const { sinDeclarar } = await recorrerPares(page, papelesDe("claro"), declaradosDe("claro"));
    expect(sinDeclarar.some((p) => p.donde.includes("p#sembrado"))).toBe(true);
  });

  test("un campo con el borde fuera del sistema se detecta", async ({ page }) => {
    await sembrar(
      page,
      `<input id="sembrado" aria-label="Campo ficticio" style="border:2px solid #abcdef">`,
    );
    const { sinDeclarar } = await recorrerPares(page, papelesDe("claro"), declaradosDe("claro"));
    expect(sinDeclarar.some((p) => p.que === "borde" && p.donde === "input#sembrado")).toBe(true);
  });

  test("un elemento sin contorno de foco se detecta", async ({ page }) => {
    await sembrar(
      page,
      `<button id="sembrado" style="outline:none !important">Sin contorno</button>`,
    );
    const { sinDeclarar } = await recorrerPares(page, papelesDe("claro"), declaradosDe("claro"));
    expect(sinDeclarar.some((p) => p.que === "foco" && p.donde === "button#sembrado")).toBe(true);
  });
});
