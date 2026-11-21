// PRUEBA-025 (`axe` sobre el 100 % de los estados del inventario, a 320 y 1280 px, en claro y en
// oscuro) y PRUEBA-026, parte sembrada (una infracción sembrada hace fallar la comprobación).
// No importa `axe`: usa la única llamada, la de `configuracion-interfaz.ts` (PRUEBA-036).
import { expect, test } from "@playwright/test";
import { ESTADOS, abrirEstado } from "./apoyo/estados";
import {
  ALTO_POR_DEFECTO,
  ANCHOS_DE_AXE,
  TEMAS,
  comprobarAccesibilidad,
} from "./configuracion-interfaz";

test.describe("PRUEBA-025 · accesibilidad de cada estado del inventario", () => {
  test("el inventario tiene al menos un estado y se recorre entero", () => {
    // Una prueba generada sobre una lista vacía no probaría nada: aquí falla.
    expect(ESTADOS.length).toBeGreaterThan(0);
    test.info().annotations.push({
      type: "recorrido",
      description: `${ESTADOS.length} estados x ${ANCHOS_DE_AXE.length} anchos x ${TEMAS.length} temas = ${ESTADOS.length * ANCHOS_DE_AXE.length * TEMAS.length} recorridos de axe`,
    });
  });

  for (const estado of ESTADOS) {
    for (const ancho of ANCHOS_DE_AXE) {
      for (const tema of TEMAS) {
        test(`${estado.etiqueta} · ${ancho} px · ${tema}`, async ({ page }) => {
          await page.setViewportSize({ width: ancho, height: ALTO_POR_DEFECTO });
          await page.emulateMedia({ colorScheme: tema });
          await abrirEstado(page, estado);
          const porRevisar = await comprobarAccesibilidad(page);
          // Lo «por revisar» no cuenta como superado: se lista para la revisión manual (PRUEBA-028).
          if (porRevisar.length > 0) {
            test.info().annotations.push({
              type: "por revisar a mano",
              description: porRevisar.map((r) => `${r.regla} (${r.nodos})`).join(", "),
            });
          }
        });
      }
    }
  }
});

test.describe("PRUEBA-026 · una infracción sembrada hace fallar la comprobación", () => {
  const SIN_NOMBRE = `<img src="data:image/gif;base64,R0lGODlhAQABAAAAACw=" width="40" height="40">`;
  const documento = (cuerpo: string) =>
    `<!doctype html><html lang="es"><head><title>Página de prueba</title></head><body><main><h1>Prueba</h1>${cuerpo}</main></body></html>`;

  test("control positivo: una página sin infracciones pasa", async ({ page }) => {
    await page.setContent(documento(`<p>Texto de prueba.</p>`));
    await comprobarAccesibilidad(page);
  });

  test("imagen sin texto alternativo sembrada en una página suelta", async ({ page }) => {
    await page.setContent(documento(SIN_NOMBRE));
    await expect(comprobarAccesibilidad(page)).rejects.toThrow(/image-alt/);
  });

  test("contraste insuficiente sembrado en una página suelta", async ({ page }) => {
    await page.setContent(
      documento(`<p style="color:#bbbbbb;background:#ffffff">Texto casi invisible</p>`),
    );
    await expect(comprobarAccesibilidad(page)).rejects.toThrow(/color-contrast/);
  });

  test("infracción sembrada dentro de la propia muestra, a 320 px y en oscuro", async ({
    page,
  }) => {
    // La página real de la muestra, con una imagen sin nombre añadida tras hidratar (si se
    // añadiera en el HTML, React la retiraría al hidratar): el camino completo.
    await page.setViewportSize({ width: 320, height: ALTO_POR_DEFECTO });
    await page.emulateMedia({ colorScheme: "dark" });
    await page.goto("/muestra");
    await page.waitForLoadState("networkidle");
    await expect(page.locator("h1")).toBeVisible();
    await page.evaluate(
      (html) => document.querySelector("main")?.insertAdjacentHTML("afterbegin", html),
      SIN_NOMBRE,
    );
    await expect(page.locator("main img")).toHaveCount(1);
    await expect(comprobarAccesibilidad(page)).rejects.toThrow(/image-alt/);
  });
});
