// PRUEBA-012 (menú y cajón) y PRUEBA-021 (teclado, foco, objetivos de pulsación del menú y del
// cajón) de T-010 (b), sobre las entradas `armazon-*` del inventario, en Chromium y con teclas
// reales. CA-003, CA-013 (foco), CA-027, CA-028; REQ-004, REQ-035, REQ-037, REQ-058.
// Cajón en 320, 375 y 768 px; menú fijo en 1024, 1280 y 1920 px; Escape y foco; 50 tabuladores y
// 50 con Mayúsculas sin sacar el foco; nada tapado; objetivos de 24 por 24 px; al ensanchar con el
// cajón abierto, se cierra. Los controles sembrados de abajo hacen fallar cada medida a propósito.
// Cuenta, periodo y cabecera fija (T-010 (c)): `cabecera.spec.ts`.
import { expect, test, type Locator, type Page } from "@playwright/test";
import { AREAS_CLIENTE_MUESTRA, AREAS_SUPERADMIN } from "../../../src/components/armazon/areas";
import { TEXTOS } from "../../../src/components/textos";
import { COMBINACIONES } from "../../../src/components/estilos/combinaciones";
import { abrirEstado, estadosDe, type EstadoDePrueba } from "./apoyo/estados";
import {
  focoEnElMenuLateral,
  leerContornoDelFoco,
  leerFocoEnLaVentana,
  objetivosPequenos,
  pulsacionesQueSacanElFoco,
} from "./apoyo/cajon";
import { recorrerPares } from "./apoyo/pares-de-color";
import { ALTO_POR_DEFECTO, comprobarAccesibilidad } from "./configuracion-interfaz";

const ARMAZONES = estadosDe(/^armazon/);
const ANCHOS_CAJON = [320, 375, 768, 1023] as const;
const ANCHOS_MENU = [1024, 1280, 1920] as const;
const TECLAS_EN_LA_PRUEBA = 50;

const areasDe = (e: EstadoDePrueba) =>
  e.entrada === "armazon-superadmin" ? AREAS_SUPERADMIN : AREAS_CLIENTE_MUESTRA;

// Por atributo y no por rol: con el cajón abierto el fondo sale del árbol de accesibilidad
// (aria-hidden), y el botón debe seguir localizable para comprobar `aria-expanded` y el foco.
const botonAbrir = (page: Page): Locator =>
  page.locator(`button[aria-label="${TEXTOS.armazon.abrirMenu}"]`);
// Con el menú plegado, el botón también debe estar en el árbol de accesibilidad con su nombre.
const botonAbrirPorRol = (page: Page): Locator =>
  page.getByRole("button", { name: TEXTOS.armazon.abrirMenu });
const cajon = (page: Page): Locator => page.getByRole("dialog", { name: TEXTOS.armazon.menu });
const SELECTOR_CAJON = '[role="dialog"]';

async function abrirEnAncho(page: Page, estado: EstadoDePrueba, ancho: number, alto = 667) {
  await page.setViewportSize({ width: ancho, height: alto });
  await abrirEstado(page, estado);
  // Next hidrata el botón después de pintarlo: se espera a que responda al ratón y al teclado.
  await page.waitForLoadState("networkidle");
}

/** Pulsa el tabulador hasta que el foco llega al localizador (como mucho `max` veces). */
async function tabularHasta(page: Page, destino: Locator, max = 12): Promise<number> {
  for (let i = 1; i <= max; i++) {
    await page.keyboard.press("Tab");
    if (await destino.evaluate((e) => e === document.activeElement)) return i;
  }
  throw new Error(`el foco no llegó al elemento en ${max} pulsaciones`);
}

const foco = (page: Page, destino: Locator) =>
  expect.poll(() => destino.evaluate((e) => e === document.activeElement), {
    message: "el foco está en el elemento",
  });

/**
 * Radix empieza a escuchar el clic fuera del diálogo un instante después de abrirlo (un turno del
 * navegador). Una persona no pulsa en ese margen; el robot sí, y la prueba fallaba según la
 * velocidad de la máquina. Se espera un margen humano antes de pulsar fuera.
 */
async function esperarAQueRadixEscuche(page: Page): Promise<void> {
  await page.waitForTimeout(100);
}

/**
 * El foco entra en el cajón (Radix lo mueve en un efecto, un instante después de pintarlo). Antes
 * de pulsar el tabulador se espera a que haya entrado: es la comprobación de «el foco entra», con
 * su plazo, y evita medir el tabulador mientras el foco aún está en la página de fondo.
 */
async function esperarFocoEnElCajon(page: Page): Promise<void> {
  await expect
    .poll(() => cajon(page).evaluate((d) => d.contains(document.activeElement)), {
      message: "el foco entra en el cajón",
    })
    .toBe(true);
}

/** Evita la navegación real de un enlace sin impedir que React reciba el clic. */
async function sinNavegar(page: Page): Promise<void> {
  await page.evaluate(() =>
    document.addEventListener(
      "click",
      (e) => {
        if ((e.target as Element).closest("a")) e.preventDefault();
      },
      true,
    ),
  );
}

test("centinela: hay armazones que recorrer, con las dos listas de áreas", () => {
  expect(ARMAZONES.length).toBeGreaterThanOrEqual(10);
  expect(new Set(ARMAZONES.map((e) => e.entrada)).size).toBe(2);
});

for (const estado of ARMAZONES) {
  test.describe(`PRUEBA-012 · cajón y menú · ${estado.etiqueta}`, () => {
    for (const ancho of ANCHOS_CAJON) {
      test(`a ${ancho} px el menú está plegado: sin enlaces visibles ni con foco, y el botón «Abrir menú» lo abre`, async ({
        page,
      }) => {
        await abrirEnAncho(page, estado, ancho);
        await expect(page.locator("nav[data-menu-lateral]")).toBeHidden();
        await expect(page.getByRole("navigation")).toHaveCount(0);
        await expect(page.getByRole("link", { name: areasDe(estado)[1]!.etiqueta })).toHaveCount(0);
        const boton = botonAbrirPorRol(page);
        await expect(boton).toBeVisible();
        await expect(boton).toHaveAttribute("aria-expanded", "false");
        await expect(cajon(page)).toHaveCount(0);
        expect(await focoEnElMenuLateral(page, 14), "veces que el foco cayó en el menú").toBe(0);
      });
    }

    for (const ancho of ANCHOS_MENU) {
      test(`a ${ancho} px el menú está visible sin hacer nada y no hay botón ni cajón`, async ({
        page,
      }) => {
        await abrirEnAncho(page, estado, ancho, ALTO_POR_DEFECTO);
        const enlaces = page.getByRole("navigation").getByRole("link");
        await expect(enlaces).toHaveText(areasDe(estado).map((a) => a.etiqueta));
        for (let i = 0; i < areasDe(estado).length; i++) await expect(enlaces.nth(i)).toBeVisible();
        await expect(botonAbrir(page)).toBeHidden();
        await expect(page.getByRole("button", { name: TEXTOS.armazon.abrirMenu })).toHaveCount(0);
        await expect(cajon(page)).toHaveCount(0);
      });
    }

    test("solo con teclado: Tab hasta «Abrir menú», Intro lo abre, el foco entra, Escape lo cierra y el foco vuelve", async ({
      page,
    }) => {
      await abrirEnAncho(page, estado, 375);
      const boton = botonAbrir(page);
      // El primero es el enlace de salto; el segundo, el botón del cajón.
      expect(await tabularHasta(page, boton)).toBe(2);
      await page.keyboard.press("Enter");
      await expect(cajon(page)).toBeVisible();
      await expect(boton).toHaveAttribute("aria-expanded", "true");
      await esperarFocoEnElCajon(page);
      await page.keyboard.press("Escape");
      await expect(cajon(page)).toHaveCount(0);
      await foco(page, boton).toBe(true);
      await expect(boton).toHaveAttribute("aria-expanded", "false");
      // Con la barra espaciadora también se abre.
      await page.keyboard.press("Space");
      await expect(cajon(page)).toBeVisible();
    });

    test("el cajón dice qué es: diálogo con nombre, la navegación con nombre, las áreas en su orden y el área actual", async ({
      page,
    }) => {
      await abrirEnAncho(page, estado, 375);
      await botonAbrir(page).click();
      const dialogo = cajon(page);
      await expect(dialogo).toBeVisible();
      const nav = dialogo.getByRole("navigation", { name: TEXTOS.armazon.navegacionPrincipal });
      await expect(nav).toHaveCount(1);
      await expect(nav.getByRole("link")).toHaveText(areasDe(estado).map((a) => a.etiqueta));
      await expect(nav.locator('[aria-current="page"]')).toHaveCount(1);
      await expect(dialogo.getByRole("button", { name: TEXTOS.armazon.cerrarMenu })).toBeVisible();
      // El fondo queda inerte: el contenido de la página sale del árbol de accesibilidad.
      await expect(page.getByRole("main")).toHaveCount(0);
      await expect(page.getByRole("banner")).toHaveCount(0);
    });

    test("con el ratón: se abre, se cierra con «Cerrar menú» y fuera del cajón, y el foco vuelve al botón", async ({
      page,
    }) => {
      await abrirEnAncho(page, estado, 375);
      const boton = botonAbrir(page);
      await boton.click();
      await expect(cajon(page)).toBeVisible();
      await cajon(page).getByRole("button", { name: TEXTOS.armazon.cerrarMenu }).click();
      await expect(cajon(page)).toHaveCount(0);
      await foco(page, boton).toBe(true);
      await boton.click();
      await expect(cajon(page)).toBeVisible();
      await esperarAQueRadixEscuche(page);
      // A 375 px el cajón (256) deja libre el borde derecho.
      await page.mouse.click(360, 400);
      await expect(cajon(page)).toHaveCount(0);
      await foco(page, boton).toBe(true);
    });

    test("elegir un área cierra el cajón y devuelve el foco al botón", async ({ page }) => {
      await abrirEnAncho(page, estado, 375);
      await sinNavegar(page);
      const boton = botonAbrir(page);
      await boton.click();
      const enlace = cajon(page).getByRole("link").nth(1);
      await enlace.click();
      await expect(cajon(page)).toHaveCount(0);
      await foco(page, boton).toBe(true);
    });

    test(`${TECLAS_EN_LA_PRUEBA} tabuladores y ${TECLAS_EN_LA_PRUEBA} con Mayúsculas no sacan el foco del cajón, y nunca queda tapado`, async ({
      page,
    }) => {
      await abrirEnAncho(page, estado, 375);
      await botonAbrir(page).click();
      await expect(cajon(page)).toBeVisible();
      await esperarFocoEnElCajon(page);
      expect(
        await pulsacionesQueSacanElFoco(page, SELECTOR_CAJON, "Tab", TECLAS_EN_LA_PRUEBA),
        "pulsaciones con el foco fuera (adelante)",
      ).toEqual([]);
      expect(
        await pulsacionesQueSacanElFoco(page, SELECTOR_CAJON, "Shift+Tab", TECLAS_EN_LA_PRUEBA),
        "pulsaciones con el foco fuera (atrás)",
      ).toEqual([]);
      const f = await leerFocoEnLaVentana(page);
      expect(f.enLaVentana, `${f.quien} en la ventana`).toBe(true);
      expect(f.tapado, `${f.quien} tapado`).toBe(false);
    });

    test("con poca altura (320 por 256 px) el foco de cada elemento del cajón se ve entero y nada lo tapa", async ({
      page,
    }) => {
      await abrirEnAncho(page, estado, 320, 256);
      await botonAbrir(page).click();
      await expect(cajon(page)).toBeVisible();
      await esperarFocoEnElCajon(page);
      const vistos = new Set<string>();
      for (let i = 0; i < areasDe(estado).length + 3; i++) {
        await page.keyboard.press("Tab");
        const f = await leerFocoEnLaVentana(page);
        vistos.add(f.quien);
        expect(f.enLaVentana, `${f.quien} en la ventana (pulsación ${i + 1})`).toBe(true);
        expect(f.tapado, `${f.quien} tapado (pulsación ${i + 1})`).toBe(false);
      }
      // Y hacia atrás, que es donde el foco salta al último elemento sin desplazar el cajón.
      for (let i = 0; i < areasDe(estado).length + 3; i++) {
        await page.keyboard.press("Shift+Tab");
        const f = await leerFocoEnLaVentana(page);
        expect(f.enLaVentana, `${f.quien} en la ventana (atrás ${i + 1})`).toBe(true);
        expect(f.tapado, `${f.quien} tapado (atrás ${i + 1})`).toBe(false);
      }
      // Pasó por todas las áreas y por el botón de cerrar.
      const enfocables = await cajon(page).evaluate(
        (d) => d.querySelectorAll("a[href], button").length,
      );
      expect(enfocables).toBe(areasDe(estado).length + 1);
    });

    test("PRUEBA-021 · el foco se ve en «Abrir menú», en «Cerrar menú», en cada enlace del cajón y del menú fijo", async ({
      page,
    }) => {
      await abrirEnAncho(page, estado, 375);
      await tabularHasta(page, botonAbrir(page));
      expect(await leerContornoDelFoco(page)).toMatchObject({ quien: "button" });
      const c = await leerContornoDelFoco(page);
      expect(c.estilo, "contorno del botón").not.toBe("none");
      expect(c.grosor, "grosor del contorno del botón").toBeGreaterThan(0);
      await page.keyboard.press("Enter");
      await expect(cajon(page)).toBeVisible();
      await esperarFocoEnElCajon(page);
      const elementos = areasDe(estado).length + 1;
      for (let i = 0; i < elementos; i++) {
        await page.keyboard.press("Tab");
        const k = await leerContornoDelFoco(page);
        expect(k.estilo, `contorno de ${k.quien} (${i + 1})`).not.toBe("none");
        expect(k.grosor, `grosor de ${k.quien} (${i + 1})`).toBeGreaterThan(0);
      }
      // El menú fijo, en una carga nueva a 1280 px (con el botón oculto tras ensanchar, el punto de
      // partida del tabulador del navegador no es fiable y no es lo que se mide aquí).
      await page.setViewportSize({ width: 1280, height: ALTO_POR_DEFECTO });
      await abrirEstado(page, estado);
      await page.keyboard.press("Tab");
      await page.keyboard.press("Tab");
      const m = await leerContornoDelFoco(page);
      expect(m.quien).toBe("a");
      expect(m.estilo).not.toBe("none");
      expect(m.grosor).toBeGreaterThan(0);
    });

    test("PRUEBA-021 · objetivos de pulsación: botones y enlaces del cajón y del menú fijo miden 24 por 24 px o más", async ({
      page,
    }) => {
      await abrirEnAncho(page, estado, 320);
      expect(await objetivosPequenos(page, "button")).toEqual([]);
      await botonAbrir(page).click();
      expect(
        await objetivosPequenos(page, `${SELECTOR_CAJON} a, ${SELECTOR_CAJON} button`),
      ).toEqual([]);
      await page.keyboard.press("Escape");
      await page.setViewportSize({ width: 1280, height: ALTO_POR_DEFECTO });
      expect(await objetivosPequenos(page, "nav[data-menu-lateral] a")).toEqual([]);
    });

    test("al pasar a 1024 px o más con el cajón abierto, se cierra y el foco no queda en un elemento oculto", async ({
      page,
    }) => {
      await abrirEnAncho(page, estado, 768);
      await botonAbrir(page).click();
      await expect(cajon(page)).toBeVisible();
      await page.setViewportSize({ width: 1024, height: ALTO_POR_DEFECTO });
      await expect(cajon(page)).toHaveCount(0);
      await expect(page.locator("nav[data-menu-lateral]")).toBeVisible();
      await expect
        .poll(async () => (await leerFocoEnLaVentana(page)).quien, {
          message: "el foco está en el menú lateral",
        })
        .toBe("a");
      const f = await leerFocoEnLaVentana(page);
      expect(f.enLaVentana).toBe(true);
      expect(f.tapado).toBe(false);
      expect(
        await page.evaluate(
          () => document.activeElement?.closest("nav[data-menu-lateral]") != null,
        ),
      ).toBe(true);
      // Y la página sigue sin quedar bloqueada para quien vuelve a estrecharla.
      await page.setViewportSize({ width: 768, height: 667 });
      await expect(cajon(page)).toHaveCount(0);
      await botonAbrir(page).click();
      await expect(cajon(page)).toBeVisible();
    });

    for (const { emulado, tema } of [
      { emulado: "light", tema: "claro" },
      { emulado: "dark", tema: "oscuro" },
    ] as const) {
      test(`PRUEBA-025 y PRUEBA-022 · cajón abierto a 320 px en tema ${tema}: 0 infracciones de axe y 0 pares de color sin declarar`, async ({
        page,
      }) => {
        await page.emulateMedia({ colorScheme: emulado });
        await abrirEnAncho(page, estado, 320);
        await botonAbrir(page).click();
        await expect(cajon(page)).toBeVisible();
        const porRevisar = await comprobarAccesibilidad(page);
        if (porRevisar.length > 0) {
          test.info().annotations.push({
            type: "por revisar a mano",
            description: porRevisar.map((r) => `${r.regla} (${r.nodos})`).join(", "),
          });
        }
        const papeles = [...new Set(COMBINACIONES[tema].flatMap((p) => [p.delante, p.detras]))];
        const declarados = COMBINACIONES[tema].map((p) => `${p.delante}|${p.detras}`);
        const { medidos, sinDeclarar } = await recorrerPares(page, papeles, declarados);
        expect(medidos, "pares medidos").toBeGreaterThan(0);
        // La medida de foco de `recorrerPares` da el foco a cada elemento de la página y, con un
        // diálogo modal abierto, el foco no puede salir de él: sus «sin contorno» son los de los
        // elementos inertes del fondo. El contorno del foco dentro del cajón lo mide la prueba
        // «el foco se ve en…»; aquí se miden los pares de texto y de borde.
        // Menor 1 de T-010 (b): solo se descartan los «sin contorno de foco» (los elementos inertes
        // del fondo); un par de foco no declarado o mal traducido sigue contando.
        expect(
          sinDeclarar.filter((p) => p.que !== "foco" || p.motivo !== "sin contorno de foco"),
          "pares sin declarar con el cajón abierto",
        ).toEqual([]);
        // Y dentro del cajón, cada elemento que recibe el foco lo muestra con el papel --foco.
        const contornos = await page.evaluate((selector) => {
          const sonda = document.createElement("div");
          sonda.style.color = "var(--foco)";
          document.body.appendChild(sonda);
          const esperado = getComputedStyle(sonda).color;
          sonda.remove();
          return [
            ...document.querySelectorAll<HTMLElement>(`${selector} a[href], ${selector} button`),
          ].map((e) => {
            e.focus({ focusVisible: true } as FocusOptions);
            const s = getComputedStyle(e);
            return {
              esperado,
              color: s.outlineColor,
              estilo: s.outlineStyle,
              grosor: s.outlineWidth,
            };
          });
        }, SELECTOR_CAJON);
        expect(contornos.length, "elementos enfocables del cajón").toBeGreaterThan(0);
        for (const c of contornos) {
          expect(c.estilo).not.toBe("none");
          expect(c.color, "contorno de foco del cajón = --foco").toBe(c.esperado);
        }
        // Sin desplazamiento horizontal de la página (REQ-044).
        expect(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= document.documentElement.clientWidth,
          ),
        ).toBe(true);
      });
    }
  });
}

test.describe("PRUEBA-012 · pliegue en el punto exacto y orden del documento", () => {
  test("a 1023 px está plegado y a 1024 px visible, en la misma página y sin recargar", async ({
    page,
  }) => {
    const estado = ARMAZONES[0]!;
    await abrirEnAncho(page, estado, 1023);
    await expect(page.locator("nav[data-menu-lateral]")).toBeHidden();
    await expect(botonAbrir(page)).toBeVisible();
    await page.setViewportSize({ width: 1024, height: ALTO_POR_DEFECTO });
    await expect(page.locator("nav[data-menu-lateral]")).toBeVisible();
    await expect(botonAbrir(page)).toBeHidden();
  });

  test("a 375 px el primer tabulador es el enlace de salto y el segundo, el botón del cajón", async ({
    page,
  }) => {
    await abrirEnAncho(page, ARMAZONES[0]!, 375);
    await page.keyboard.press("Tab");
    expect(await page.evaluate(() => document.activeElement?.textContent?.trim())).toBe(
      TEXTOS.armazon.saltarAlContenido,
    );
    await page.keyboard.press("Tab");
    expect(await page.evaluate(() => document.activeElement?.getAttribute("aria-label"))).toBe(
      TEXTOS.armazon.abrirMenu,
    );
  });

  test("el cajón no recuerda su estado (REQ-058): recargar lo deja cerrado y no escribe nada en el navegador", async ({
    page,
    context,
  }) => {
    await abrirEnAncho(page, ARMAZONES[0]!, 375);
    await botonAbrir(page).click();
    await expect(cajon(page)).toBeVisible();
    expect(
      await page.evaluate(() => ({
        local: localStorage.length,
        sesion: sessionStorage.length,
        galletas: document.cookie,
      })),
    ).toEqual({ local: 0, sesion: 0, galletas: "" });
    expect(await context.cookies()).toEqual([]);
    await page.reload();
    await page.waitForLoadState("networkidle");
    await expect(cajon(page)).toHaveCount(0);
    await expect(botonAbrir(page)).toHaveAttribute("aria-expanded", "false");
  });
});

test.describe("PRUEBA-021 · cajón y táctil", () => {
  test.use({ hasTouch: true });

  test("con un toque se abre, y un toque fuera o en «Cerrar menú» lo cierra y devuelve el foco", async ({
    page,
  }) => {
    await abrirEnAncho(page, ARMAZONES[0]!, 375);
    const boton = botonAbrir(page);
    await boton.tap();
    await expect(cajon(page)).toBeVisible();
    await cajon(page).getByRole("button", { name: TEXTOS.armazon.cerrarMenu }).tap();
    await expect(cajon(page)).toHaveCount(0);
    await foco(page, boton).toBe(true);
    await boton.tap();
    await expect(cajon(page)).toBeVisible();
    await esperarAQueRadixEscuche(page);
    await page.touchscreen.tap(360, 400);
    await expect(cajon(page)).toHaveCount(0);
  });
});

test.describe("PRUEBA-021 · controles sembrados: las medidas pueden fallar", () => {
  const documento = (cuerpo: string) =>
    `<!doctype html><html lang="es"><head><title>Control</title>
     <style>nav{width:200px}.escondido{display:none}</style></head><body>${cuerpo}</body></html>`;

  const CAJON_SIN_ATRAPAR = `
    <button id="fuera-1">Antes</button>
    <div role="dialog" aria-label="Falso cajón"><a href="#a">Uno</a><button id="d">Dos</button></div>
    <button id="fuera-2">Después</button>`;

  test("un cajón que no atrapa el foco lo deja salir: la medida lo ve", async ({ page }) => {
    await page.setContent(documento(CAJON_SIN_ATRAPAR));
    await page.locator("a").focus();
    const fuera = await pulsacionesQueSacanElFoco(page, SELECTOR_CAJON, "Tab", 6);
    expect(fuera.length).toBeGreaterThan(0);
    await page.locator("a").focus();
    const atras = await pulsacionesQueSacanElFoco(page, SELECTOR_CAJON, "Shift+Tab", 6);
    expect(atras.length).toBeGreaterThan(0);
  });

  test("un cajón que atrapa el foco no se señala (control positivo)", async ({ page }) => {
    await page.setContent(documento(CAJON_SIN_ATRAPAR));
    await page.evaluate(() => {
      const d = document.querySelector('[role="dialog"]')!;
      const f = [...d.querySelectorAll<HTMLElement>("a, button")];
      d.addEventListener("keydown", (e) => {
        const k = e as KeyboardEvent;
        if (k.key !== "Tab") return;
        const i = f.indexOf(document.activeElement as HTMLElement);
        const siguiente = f[(i + (k.shiftKey ? -1 : 1) + f.length) % f.length]!;
        k.preventDefault();
        siguiente.focus();
      });
    });
    await page.locator("a").focus();
    expect(await pulsacionesQueSacanElFoco(page, SELECTOR_CAJON, "Tab", 20)).toEqual([]);
    expect(await pulsacionesQueSacanElFoco(page, SELECTOR_CAJON, "Shift+Tab", 20)).toEqual([]);
  });

  test("un objetivo de 10 por 10 px se detecta, y uno de 40 por 40 no", async ({ page }) => {
    await page.setContent(
      documento(
        `<button id="p" style="width:10px;height:10px;padding:0">x</button><a id="g" href="#a" style="display:inline-block;width:40px;height:40px">Y</a>`,
      ),
    );
    const pequenos = await objetivosPequenos(page, "button, a");
    expect(pequenos).toHaveLength(1);
    expect(pequenos[0]).toContain("button");
  });

  test("un elemento tapado y uno fuera de la ventana se detectan", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 256 });
    await page.setContent(
      documento(
        `<button id="a" style="position:absolute;left:10px;top:10px;width:60px;height:40px">A</button>
         <div style="position:fixed;left:0;top:0;width:200px;height:200px;background:#ccc"></div>
         <button id="b" style="position:fixed;left:400px;top:10px;width:60px;height:40px">B</button>`,
      ),
    );
    await page.locator("#a").focus();
    expect(await leerFocoEnLaVentana(page)).toMatchObject({ tapado: true });
    await page.locator("#b").focus();
    expect((await leerFocoEnLaVentana(page)).enLaVentana).toBe(false);
  });

  test("un foco sin contorno se detecta", async ({ page }) => {
    await page.setContent(
      documento(
        `<button id="s" style="outline:none">Sin contorno</button><button id="c">Con</button>`,
      ),
    );
    await page.locator("#s").focus();
    expect((await leerContornoDelFoco(page)).estilo).toBe("none");
    await page.locator("#c").focus();
    // Sin hoja de estilos del sistema, el contorno de serie de Chromium se ve: control positivo.
    await page.keyboard.press("Shift+Tab");
    await page.keyboard.press("Tab");
    expect((await leerContornoDelFoco(page)).estilo).not.toBe("none");
  });

  test("un menú que no se pliega (enlaces visibles a 320 px) deja el foco caer en él: la medida lo ve", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 320, height: 667 });
    await page.setContent(
      documento(
        `<a href="#x">Salto</a><nav data-menu-lateral><a href="#1">Uno</a><a href="#2">Dos</a></nav>`,
      ),
    );
    expect(await focoEnElMenuLateral(page, 6)).toBeGreaterThan(0);
  });

  test("un menú plegado con display:none no recibe el foco (control positivo)", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 320, height: 667 });
    await page.setContent(
      documento(
        `<a href="#x">Salto</a><nav data-menu-lateral class="escondido"><a href="#1">Uno</a></nav>`,
      ),
    );
    expect(await focoEnElMenuLateral(page, 6)).toBe(0);
  });
});
