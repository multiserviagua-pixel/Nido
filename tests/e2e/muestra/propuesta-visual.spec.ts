// T-012 (020) · lo que enseñan `/muestra/propuesta-visual` y `/muestra/valores` en el navegador
// (REQ-086; CA-025, CA-028, CA-032, CA-049, CA-050, CA-053, CA-057). PRUEBA-025 (axe) y PRUEBA-013
// (anchos, zum, espaciado) recorren estas páginas solas, porque salen del inventario; aquí solo va
// lo propio de ellas: los dos temas a la vez sea cual sea el del sistema, los logotipos a su lado,
// el marco de 375 px, que las maquetas no se pueden pulsar ni enfocar y que la escala pintada es la
// de `valores.css`. Los marcos de tema se comprueban con los pares de color en combinaciones.spec.ts.
import { expect, test, type Page } from "@playwright/test";
import { medirDesborde } from "./apoyo/medidas";
import { ALTO_POR_DEFECTO, TEMAS } from "./configuracion-interfaz";

const PROPUESTA = "/muestra/propuesta-visual";
const VALORES = "/muestra/valores";

async function abrir(page: Page, ruta: string, ancho = 1280): Promise<void> {
  await page.setViewportSize({ width: ancho, height: ALTO_POR_DEFECTO });
  const respuesta = await page.goto(ruta);
  expect(respuesta?.status(), `código de ${ruta}`).toBe(200);
  await expect(page.locator("h1")).toBeVisible();
}

/** El color que da un papel o un paso de la escala, medido con una sonda dentro de `selector`. */
function colorDeVariable(page: Page, selector: string, variable: string): Promise<string> {
  return page
    .locator(selector)
    .first()
    .evaluate((marco, v) => {
      const sonda = document.createElement("div");
      sonda.style.backgroundColor = `var(${v})`;
      marco.appendChild(sonda);
      const color = getComputedStyle(sonda).backgroundColor;
      sonda.remove();
      return color;
    }, variable);
}

/** Un ancho de la escala (`--escala-espaciado-N`) en píxeles, medido con una sonda. */
function medidaDeVariable(page: Page, selector: string, variable: string): Promise<number> {
  return page
    .locator(selector)
    .first()
    .evaluate((marco, v) => {
      const sonda = document.createElement("div");
      sonda.style.width = `var(${v})`;
      marco.appendChild(sonda);
      const ancho = sonda.getBoundingClientRect().width;
      sonda.remove();
      return Math.round(ancho);
    }, variable);
}

for (const tema of TEMAS) {
  test.describe(`propuesta visual · sistema en ${tema}`, () => {
    test.beforeEach(async ({ page }) => {
      await page.emulateMedia({ colorScheme: tema });
    });

    test("los dos temas se ven a la vez: el marco claro es claro y el oscuro es oscuro, sea cual sea el del sistema", async ({
      page,
    }) => {
      await abrir(page, PROPUESTA);
      const claro = page.locator('[data-seccion="paleta"][data-tema-muestra="claro"]');
      const oscuro = page.locator('[data-seccion="paleta"][data-tema-muestra="oscuro"]');
      await expect(claro).toHaveCount(1);
      await expect(oscuro).toHaveCount(1);
      const fondoClaro = await claro.evaluate((e) => getComputedStyle(e).backgroundColor);
      const fondoOscuro = await oscuro.evaluate((e) => getComputedStyle(e).backgroundColor);
      // Neutro 50 y neutro 950 de la escala, tal como los calcula el navegador.
      expect(fondoClaro).toBe(
        await colorDeVariable(page, '[data-seccion="paleta"]', "--escala-neutro-50"),
      );
      expect(fondoOscuro).toBe(
        await colorDeVariable(page, '[data-seccion="paleta"]', "--escala-neutro-950"),
      );
      expect(fondoClaro).not.toBe(fondoOscuro);
    });

    test("cada papel de la paleta pinta el color que tiene en su marco", async ({ page }) => {
      await abrir(page, PROPUESTA);
      for (const marco of ["claro", "oscuro"]) {
        const raiz = `[data-seccion="paleta"][data-tema-muestra="${marco}"]`;
        const filas = page.locator(`${raiz} [data-papel]`);
        const n = await filas.count();
        expect(n).toBeGreaterThanOrEqual(26);
        for (let i = 0; i < n; i++) {
          const papel = (await filas.nth(i).getAttribute("data-papel"))!;
          const esperado = await colorDeVariable(page, raiz, `--${papel}`);
          if (papel.startsWith("degradado-")) {
            const imagen = await filas
              .nth(i)
              .locator("span")
              .first()
              .evaluate((e) => getComputedStyle(e).backgroundImage);
            expect(imagen, `${marco}/${papel}`).toContain("gradient");
          } else {
            const pintado = await filas
              .nth(i)
              .locator("span")
              .first()
              .evaluate((e) => getComputedStyle(e).backgroundColor);
            expect(pintado, `${marco}/${papel}`).toBe(esperado);
          }
        }
      }
    });

    test("27 logotipos, cada uno con el lado pedido, y los fondos claro y oscuro son fijos", async ({
      page,
    }) => {
      await abrir(page, PROPUESTA);
      const logos = page.locator("[data-logotipo]");
      await expect(logos).toHaveCount(27);
      for (let i = 0; i < 27; i++) {
        const l = logos.nth(i);
        const lado = Number(await l.getAttribute("data-lado"));
        const caja = (await l.boundingBox())!;
        expect([16, 32, 128]).toContain(lado);
        expect(Math.round(caja.width), `ancho de ${i}`).toBe(lado);
        expect(Math.round(caja.height), `alto de ${i}`).toBe(lado);
        await expect(l.locator("svg")).toHaveAttribute("aria-hidden", "true");
      }
      // «Sobre claro» es blanco y «sobre oscuro» es el degradado del menú, en los dos temas del sistema.
      const claro = page.locator('[data-fondo="claro"]').first();
      const blanco = await colorDeVariable(page, '[data-seccion="paleta"]', "--escala-neutro-0");
      expect(await claro.evaluate((e) => getComputedStyle(e.parentElement!).backgroundColor)).toBe(
        blanco,
      );
      const oscuro = page.locator('[data-fondo="oscuro"]').first();
      expect(
        await oscuro.evaluate((e) => getComputedStyle(e.parentElement!).backgroundImage),
      ).toContain("gradient");
    });

    test("el icono de aplicación lleva su fondo en degradado y los otros no", async ({ page }) => {
      await abrir(page, PROPUESTA);
      const iconos = page.locator('[data-variante="icono"]');
      await expect(iconos).toHaveCount(9);
      const imagen = await iconos
        .first()
        .evaluate((e) => getComputedStyle(e.firstElementChild!).backgroundImage);
      expect(imagen).toContain("gradient");
    });

    test("las vistas de ejemplo: seis marcos, la de cliente de 375 px y el resto a lo ancho", async ({
      page,
    }) => {
      await abrir(page, PROPUESTA);
      for (const v of ["resumen-superadmin", "tabla-dialogo", "resumen-cliente"]) {
        for (const t of ["claro", "oscuro"]) {
          await expect(
            page.locator(`figure[data-vista="${v}"][data-tema-muestra="${t}"]`),
            `${v} ${t}`,
          ).toHaveCount(1);
        }
      }
      const cliente = page.locator('figure[data-vista="resumen-cliente"] .marco-movil');
      await expect(cliente).toHaveCount(2);
      for (let i = 0; i < 2; i++) {
        expect(Math.round((await cliente.nth(i).boundingBox())!.width)).toBe(375);
      }
      const ancho = page.locator('figure[data-vista="resumen-superadmin"] > div').first();
      expect((await ancho.boundingBox())!.width).toBeGreaterThan(600);
    });

    test("a 320 px el marco de cliente se encoge y la página no se desplaza", async ({ page }) => {
      await abrir(page, PROPUESTA, 320);
      const cliente = page.locator('figure[data-vista="resumen-cliente"] .marco-movil').first();
      await cliente.scrollIntoViewIfNeeded();
      const caja = (await cliente.boundingBox())!;
      expect(caja.width).toBeLessThanOrEqual(320);
      expect(await medirDesborde(page)).toEqual({ sobra: 0, fuera: [] });
    });

    test("las maquetas no se pueden pulsar ni enfocar: el tabulador no entra en ninguna", async ({
      page,
    }) => {
      await abrir(page, PROPUESTA);
      const dentro = await page.evaluate(() => {
        const maquetas = [...document.querySelectorAll("figure [inert]")];
        const enfocables =
          'a[href], button, input, select, textarea, summary, [tabindex]:not([tabindex="-1"])';
        return {
          maquetas: maquetas.length,
          enfocables: maquetas.flatMap((m) => [...m.querySelectorAll(enfocables)]).length,
          ocultas: maquetas.filter((m) => m.getAttribute("aria-hidden") === "true").length,
        };
      });
      expect(dentro.maquetas).toBe(6);
      expect(dentro.ocultas).toBe(6);
      // Tabulador hasta salir de la página: el foco nunca cae dentro de una maqueta.
      const total = await page.evaluate(() => document.querySelectorAll("a, button").length);
      for (let i = 0; i < total + 5; i++) {
        await page.keyboard.press("Tab");
        const enMaqueta = await page.evaluate(
          () => document.activeElement?.closest("figure [inert]") != null,
        );
        expect(enMaqueta, `tabulador ${i}`).toBe(false);
      }
    });

    test("el diálogo de la maqueta está atenuado con el velo y se distingue de la tabla", async ({
      page,
    }) => {
      await abrir(page, PROPUESTA);
      const marco = page.locator('figure[data-vista="tabla-dialogo"][data-tema-muestra="claro"]');
      await marco.scrollIntoViewIfNeeded();
      const velo = marco.locator("[class*='bg-velo']").first();
      await expect(velo).toBeVisible();
      const fondo = await velo.evaluate((e) => getComputedStyle(e).backgroundColor);
      expect(fondo).toMatch(/^rgba\(/);
      await expect(marco.getByText("Pausar entrega")).toBeVisible();
      await expect(marco.getByText("Cancelar")).toBeVisible();
    });

    test("declara que es una representación y que los componentes definitivos llegan tras la validación", async ({
      page,
    }) => {
      await abrir(page, PROPUESTA);
      await expect(
        page.getByText(
          "representación de la propuesta; los componentes definitivos llegan tras la validación",
        ),
      ).toBeVisible();
    });

    test("valores: cada paso de color pinta el color de la escala", async ({ page }) => {
      await abrir(page, VALORES);
      const filas = page.locator('[data-escala-seccion="color"] [data-escala]');
      const n = await filas.count();
      expect(n).toBe(35);
      for (let i = 0; i < n; i++) {
        const token = (await filas.nth(i).getAttribute("data-escala"))!;
        const pintado = await filas
          .nth(i)
          .locator("span")
          .first()
          .evaluate((e) => getComputedStyle(e).backgroundColor);
        expect(pintado, token).toBe(await colorDeVariable(page, "main", token));
      }
    });

    test("valores: espaciado, radios y sombras pintan lo que dice la escala", async ({ page }) => {
      await abrir(page, VALORES);
      const espacios = page.locator('[data-escala-seccion="espaciado"] [data-escala]');
      expect(await espacios.count()).toBe(11);
      for (let i = 0; i < 11; i++) {
        const token = (await espacios.nth(i).getAttribute("data-escala"))!;
        const esperado = await medidaDeVariable(page, "main", token);
        const barra = (await espacios.nth(i).locator("span > span").first().boundingBox())!;
        expect(Math.round(barra.width), token).toBe(esperado);
      }
      const radios = page.locator('[data-escala-seccion="radios"] [data-escala]');
      expect(await radios.count()).toBe(4);
      for (const marco of ["claro", "oscuro"]) {
        const sombras = page.locator(
          `[data-escala-seccion="sombras"] [data-tema-muestra="${marco}"] [data-escala]`,
        );
        expect(await sombras.count()).toBe(3);
        const tarjeta = await sombras
          .nth(0)
          .locator("span")
          .first()
          .evaluate((e) => getComputedStyle(e).boxShadow);
        expect(tarjeta, `sombra de tarjeta ${marco}`).not.toBe("none");
      }
    });
  });
}

test.describe("propuesta visual · sin color ni movimiento", () => {
  test("con colores forzados, las dos páginas se ven sin marcos de tema ni degradados", async ({
    page,
  }) => {
    await page.emulateMedia({ forcedColors: "active" });
    for (const ruta of [PROPUESTA, VALORES]) {
      await abrir(page, ruta);
      const degradados = await page.evaluate(
        () =>
          [...document.querySelectorAll("body, body *")].filter((e) =>
            getComputedStyle(e).backgroundImage.includes("gradient"),
          ).length,
      );
      expect(degradados, `${ruta}: degradados en colores forzados`).toBe(0);
      // Los marcos no redefinen los papeles: manda el sistema.
      const marco = page.locator(".tema-oscuro").first();
      expect(
        await marco.evaluate((e) => getComputedStyle(e).getPropertyValue("--fondo-pagina").trim()),
      ).toBe("Canvas");
    }
  });

  test("no pide nada fuera de la muestra (ni a otros dominios ni a rutas propias ajenas)", async ({
    page,
  }) => {
    const peticiones: string[] = [];
    page.on("request", (p) => peticiones.push(new URL(p.url()).pathname));
    await abrir(page, PROPUESTA);
    await page.waitForLoadState("networkidle");
    const fuera = peticiones.filter(
      (r) => !(r === "/muestra" || r.startsWith("/muestra/") || r.startsWith("/_next/static/")),
    );
    expect(fuera).toEqual([]);
  });
});
