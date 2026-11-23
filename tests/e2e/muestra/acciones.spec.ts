// T-010 (d) · `Boton` y `useAccion` en el navegador (PRUEBA-015, parte de acciones; PRUEBA-016,
// acción incierta; CA-017, CA-045; REQ-024, REQ-073, REQ-074). La lógica entera (cerrojo, plazo,
// resultado por envío, correspondencia) está en pruebas unitarias; aquí se mide lo que solo se ve
// con el navegador: dos pulsaciones reales, Intro repetido, el reloj de 30 s de la página y los
// mensajes de cada respuesta. La muestra simula al servidor en la propia página (no hay red).
// Cuando T-009 (g) escriba el espec de «diálogo, formulario, avisos y acciones» (PRUEBA-015
// completa), estos casos pasan a él.
import { expect, test, type Locator, type Page } from "@playwright/test";
import { TEXTOS } from "../../../src/components/textos";
import { TEXTOS_ACCIONES as T } from "../../../src/app/muestra/_vistas/acciones/textos-acciones";

const RUTA = "/muestra/componentes/boton-accion/acciones";
const RUTA_VARIANTES = "/muestra/componentes/boton-accion/variantes";

const boton = (page: Page): Locator => page.getByRole("button", { name: /^(?:Pausar|Pausando…)$/ });
const contador = (page: Page, nombre: "envios" | "pendientes" | "relecturas"): Locator =>
  page.locator(`[data-contador="${nombre}"]`);
const mensaje = (page: Page): Locator => page.locator("[data-mensaje-de-accion]");
const elegir = (page: Page, clave: keyof typeof T.respuestas): Promise<unknown> =>
  page.getByLabel(T.etiquetaRespuesta).selectOption({ label: T.respuestas[clave] });
const responder = (page: Page, cual: "antiguo" | "reciente"): Promise<void> =>
  page
    .getByRole("button", { name: cual === "antiguo" ? T.responderAntiguo : T.responderReciente })
    .click();

async function abrir(page: Page, conReloj = false): Promise<void> {
  if (conReloj) await page.clock.install();
  const respuesta = await page.goto(RUTA);
  expect(respuesta?.status()).toBe(200);
  await expect(page.locator("h1")).toBeVisible();
  // Next hidrata los controles después de pintarlos: se espera a que respondan.
  await page.waitForLoadState("networkidle");
}

const SIN_EXITO = TEXTOS.acciones.resultado.hecha;

test.describe("PRUEBA-015 · doble envío (REQ-074, CA-017)", () => {
  test("dos pulsaciones seguidas dan un solo envío y el botón dice «Pausando…» con aria-disabled", async ({
    page,
  }) => {
    await abrir(page);
    const b = boton(page);
    await b.dblclick({ delay: 20 });
    await expect(contador(page, "envios")).toHaveText("1");
    await expect(b).toHaveText(TEXTOS.acciones.enCurso.pausar);
    await expect(b).toHaveAttribute("aria-disabled", "true");
    // Sigue en el orden de tabulación y con el foco.
    await expect(b).not.toHaveAttribute("disabled", /.*/);
  });

  test("Intro repetido sobre el botón con el foco da un solo envío", async ({ page }) => {
    await abrir(page);
    const b = boton(page);
    await b.focus();
    await page.keyboard.press("Enter");
    await page.keyboard.press("Enter");
    await page.keyboard.press("Enter");
    await page.keyboard.down("Enter");
    await page.keyboard.down("Enter");
    await page.keyboard.up("Enter");
    await expect(contador(page, "envios")).toHaveText("1");
    await expect(b).toBeFocused();
  });

  test("tres pulsaciones en menos de 300 ms con el ratón: un envío; tras la respuesta se puede volver a enviar", async ({
    page,
  }) => {
    await abrir(page);
    const b = boton(page);
    await b.click();
    await b.click({ force: true });
    await b.click({ force: true });
    await expect(contador(page, "envios")).toHaveText("1");
    await responder(page, "antiguo");
    await expect(boton(page)).toHaveText(TEXTOS.acciones.confirmar.pausar);
    await expect(boton(page)).not.toHaveAttribute("aria-disabled", /.*/);
    await boton(page).click();
    await expect(contador(page, "envios")).toHaveText("2");
  });
});

test.describe("PRUEBA-015 · cada respuesta del servidor da su resultado", () => {
  const CASOS = [
    { clave: "hecha", resultado: "hecha", texto: TEXTOS.acciones.resultado.hecha, relecturas: "1" },
    {
      clave: "rechazada",
      resultado: "rechazada",
      texto: TEXTOS.acciones.resultado.rechazada,
      relecturas: "0",
    },
    {
      clave: "no_permitida",
      resultado: "no_permitida",
      texto: TEXTOS.acciones.noPermitida,
      relecturas: "1",
    },
    {
      clave: "servidor",
      resultado: "incierta",
      texto: TEXTOS.acciones.resultado.incierta,
      relecturas: "0",
    },
    {
      clave: "ilegible",
      resultado: "incierta",
      texto: TEXTOS.acciones.resultado.incierta,
      relecturas: "0",
    },
    {
      clave: "desconocida",
      resultado: "incierta",
      texto: TEXTOS.acciones.resultado.incierta,
      relecturas: "0",
    },
  ] as const;

  for (const caso of CASOS) {
    test(`${caso.clave}: resultado ${caso.resultado}, botón liberado y ${caso.relecturas} relecturas`, async ({
      page,
    }) => {
      await abrir(page);
      await elegir(page, caso.clave);
      await boton(page).click();
      await responder(page, "antiguo");
      await expect(mensaje(page)).toHaveAttribute("data-mensaje-de-accion", caso.resultado);
      await expect(mensaje(page)).toContainText(caso.texto);
      await expect(contador(page, "relecturas")).toHaveText(caso.relecturas);
      await expect(boton(page)).toHaveText(TEXTOS.acciones.confirmar.pausar);
      if (caso.resultado !== "hecha") {
        await expect(page.locator("main")).not.toContainText(SIN_EXITO);
      }
      // Los textos recibidos no llegan nunca a la página.
      await expect(page.locator("main")).not.toContainText("<html>");
    });
  }

  test("incierta: el mensaje permanece, hay un botón para comprobar el estado y no se reintenta sola", async ({
    page,
  }) => {
    await abrir(page);
    await elegir(page, "servidor");
    await boton(page).click();
    await responder(page, "antiguo");
    const comprobar = page.getByRole("button", { name: TEXTOS.acciones.resultado.comprobarEstado });
    await expect(comprobar).toBeVisible();
    await expect(contador(page, "envios")).toHaveText("1");
    await comprobar.click();
    await expect(contador(page, "relecturas")).toHaveText("1");
    await expect(contador(page, "envios")).toHaveText("1");
  });
});

test.describe("PRUEBA-015, PRUEBA-016 · plazo de 30 s y respuesta tardía (REQ-073, CA-045)", () => {
  test("a los 29 s sigue en curso; a los 30 s es incierta y el botón se libera", async ({
    page,
  }) => {
    await abrir(page, true);
    await boton(page).click();
    await page.clock.runFor(29_000);
    await expect(boton(page)).toHaveText(TEXTOS.acciones.enCurso.pausar);
    await expect(mensaje(page)).toHaveAttribute("data-mensaje-de-accion", "ninguno");
    await page.clock.runFor(1_100);
    await expect(mensaje(page)).toHaveAttribute("data-mensaje-de-accion", "incierta");
    await expect(mensaje(page)).toContainText(TEXTOS.acciones.resultado.incierta);
    await expect(boton(page)).toHaveText(TEXTOS.acciones.confirmar.pausar);
    await expect(boton(page)).not.toHaveAttribute("aria-disabled", /.*/);
    await expect(contador(page, "envios")).toHaveText("1");
  });

  test("éxito tardío sin segundo envío: 0 mensajes de éxito, sigue incierta y la vista relee", async ({
    page,
  }) => {
    await abrir(page, true);
    await boton(page).click();
    await page.clock.runFor(30_100);
    await expect(mensaje(page)).toHaveAttribute("data-mensaje-de-accion", "incierta");
    await elegir(page, "hecha");
    await responder(page, "antiguo");
    await expect(contador(page, "relecturas")).toHaveText("1");
    await expect(mensaje(page)).toHaveAttribute("data-mensaje-de-accion", "incierta");
    await expect(page.locator("main")).not.toContainText(SIN_EXITO);
  });

  test("éxito tardío con un segundo envío en curso: no se atribuye al segundo y la vista relee", async ({
    page,
  }) => {
    await abrir(page, true);
    await boton(page).click();
    await page.clock.runFor(30_100);
    await expect(boton(page)).toHaveText(TEXTOS.acciones.confirmar.pausar);
    await boton(page).click();
    await expect(contador(page, "envios")).toHaveText("2");
    await expect(contador(page, "pendientes")).toHaveText("2");
    await elegir(page, "hecha");
    await responder(page, "antiguo");
    // El envío 2 sigue en curso, sin éxito, y el cerrojo sigue puesto.
    await expect(contador(page, "relecturas")).toHaveText("1");
    await expect(boton(page)).toHaveText(TEXTOS.acciones.enCurso.pausar);
    await expect(boton(page)).toHaveAttribute("aria-disabled", "true");
    await expect(page.locator("main")).not.toContainText(SIN_EXITO);
    await boton(page).click({ force: true });
    await expect(contador(page, "envios")).toHaveText("2");
    // El envío 2 acaba con su propia respuesta.
    await elegir(page, "servidor");
    await responder(page, "reciente");
    await expect(mensaje(page)).toHaveAttribute("data-mensaje-de-accion", "incierta");
    await expect(page.locator("main")).not.toContainText(SIN_EXITO);
  });
});

test.describe("PRUEBA-015 · Boton: variantes y tamaño (REQ-024, REQ-037)", () => {
  test("todos los botones de la página de variantes miden al menos 40 por 24 px y los ocupados llevan aria-disabled", async ({
    page,
  }) => {
    const respuesta = await page.goto(RUTA_VARIANTES);
    expect(respuesta?.status()).toBe(200);
    await expect(page.locator("h1")).toBeVisible();
    const botones = page.locator("main button");
    expect(await botones.count()).toBeGreaterThanOrEqual(8);
    for (const b of await botones.all()) {
      const caja = await b.boundingBox();
      expect(caja?.height ?? 0, await b.innerText()).toBeGreaterThanOrEqual(40);
      expect(caja?.width ?? 0, await b.innerText()).toBeGreaterThanOrEqual(24);
    }
    const ocupados = page.locator('main button[aria-disabled="true"]');
    await expect(ocupados).toHaveCount(3);
    const textos = await ocupados.allInnerTexts();
    expect(textos.sort()).toEqual(
      [
        TEXTOS.acciones.enCurso.pausar,
        TEXTOS.acciones.enCurso.pausar,
        TEXTOS.acciones.enCurso.revocar,
      ].sort(),
    );
  });

  test("el foco es el contorno común de base.css, visible con teclado", async ({ page }) => {
    await page.goto(RUTA_VARIANTES);
    await page.waitForLoadState("networkidle");
    const primero = page.locator("main button").first();
    await primero.focus();
    await page.keyboard.press("Shift+Tab");
    await page.keyboard.press("Tab");
    await expect(primero).toBeFocused();
    const contorno = await primero.evaluate((e) => getComputedStyle(e).outlineStyle);
    expect(contorno).not.toBe("none");
  });
});
