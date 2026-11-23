// PRUEBA-015 (diálogo: qué, a qué, cuándo; foco; Escape; Intro; resultados de la acción con reloj
// simulado), PRUEBA-013 (poca altura, anchos, 120 caracteres, espaciado y zum), PRUEBA-017 (texto
// hostil como objetivo), PRUEBA-021 (solo con teclado) y PRUEBA-025 (axe). CA-013, CA-017, CA-027,
// CA-041, CA-053; REQ-017, REQ-018, REQ-056, REQ-065, REQ-073, REQ-074, REQ-078, REQ-082.
// Recorre la entrada `dialogo-confirmacion` del inventario: todas sus páginas se abren con el
// primer diálogo ya abierto. La respuesta del servidor es simulada y se elige con el diálogo
// cerrado (abierto, el resto de la página queda inerte).
import { expect, test, type Locator, type Page } from "@playwright/test";
import { ESTADOS, abrirEstado, type EstadoDePrueba } from "./apoyo/estados";
import { ALTO_POR_DEFECTO, TEMAS, comprobarAccesibilidad } from "./configuracion-interfaz";
import { inyectarEspaciadoDeTexto, medirDesborde, medirSolapes } from "./apoyo/medidas";
import { TEXTOS } from "../../../src/components/textos";

const DIALOGOS = ESTADOS.filter((e) => e.entrada === "dialogo-confirmacion");
const estado = (clave: string): EstadoDePrueba => {
  const e = DIALOGOS.find((x) => x.estado === clave);
  if (e === undefined) throw new Error(`falta el estado ${clave} del inventario`);
  return e;
};

const PAUSAR = TEXTOS.dialogo.acciones.pausar_agente;
const dialogo = (page: Page): Locator => page.getByRole("alertdialog");
const disparador = (page: Page, i = 0): Locator => page.locator(`[data-disparador="${i}"]`);
const contador = (page: Page, nombre: "envios" | "hechas" | "relecturas"): Locator =>
  page.locator(`[data-contador="${nombre}"]`);
const confirmar = (page: Page): Locator =>
  dialogo(page).getByRole("button", { name: PAUSAR.confirmar });
const cancelar = (page: Page): Locator =>
  dialogo(page).getByRole("button", { name: TEXTOS.acciones.cancelar });
/** El último botón del diálogo: el de confirmar mientras no hay resultado. */
const ultimo = (page: Page): Locator => dialogo(page).getByRole("button").last();
const cerrar = (page: Page): Locator =>
  dialogo(page).getByRole("button", { name: TEXTOS.dialogo.cerrar });
const cortes = (page: Page): Locator => page.locator('[data-anunciador="cortes"]');

async function abrir(page: Page, e: EstadoDePrueba): Promise<void> {
  await abrirEstado(page, e);
  // Next hidrata los controles después de pintarlos: se espera a que respondan.
  await page.waitForLoadState("networkidle");
  await expect(dialogo(page)).toBeVisible();
}

/** Con el diálogo abierto al cargar: lo cierra, elige la respuesta simulada y lo vuelve a abrir. */
async function conRespuesta(page: Page, respuesta: string, i = 0): Promise<void> {
  await page.keyboard.press("Escape");
  await expect(dialogo(page)).toHaveCount(0);
  await page.locator("#respuesta-simulada").selectOption(respuesta);
  await disparador(page, i).click();
  await expect(dialogo(page)).toBeVisible();
}

/** Los bloques de texto del diálogo no se pisan entre sí (la página de detrás queda bajo el velo,
 * así que `medirSolapes` de la página entera no vale con el diálogo abierto). */
async function solapesDentro(page: Page): Promise<string[]> {
  return dialogo(page).evaluate((d) => {
    const cajas = [...d.querySelectorAll("h2, p, button")].map((e) => ({
      t: (e.textContent ?? "").slice(0, 20),
      r: e.getBoundingClientRect(),
    }));
    const fallos: string[] = [];
    for (let i = 0; i < cajas.length; i += 1) {
      for (let j = i + 1; j < cajas.length; j += 1) {
        const a = cajas[i]!.r;
        const b = cajas[j]!.r;
        const dx = Math.min(a.right, b.right) - Math.max(a.left, b.left);
        const dy = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
        if (dx > 1 && dy > 1) fallos.push(`${cajas[i]!.t} / ${cajas[j]!.t}`);
      }
    }
    return fallos;
  });
}

const focoDentro = (page: Page): Promise<boolean> =>
  page.evaluate(
    () => document.querySelector('[role="alertdialog"]')?.contains(document.activeElement) ?? false,
  );

function tieneInvisibles(texto: string): boolean {
  return [...texto].some((c) => {
    const n = c.codePointAt(0) ?? 0;
    return (
      (n < 32 && n !== 10 && n !== 13 && n !== 9) ||
      (n >= 0x202a && n <= 0x202e) ||
      (n >= 0x2066 && n <= 0x2069) ||
      n === 0x200b
    );
  });
}

test("hay entradas que recorrer: el diálogo tiene sus tres estados en el inventario", () => {
  expect(DIALOGOS.map((d) => d.estado).sort()).toEqual(
    ["objetivo-120", "pausar", "texto-hostil"].sort(),
  );
});

test.describe("PRUEBA-015 · diálogo: qué, a qué, cuándo (CA-013, REQ-017)", () => {
  test("título con qué va a pasar, descripción con a qué afecta y cuándo, y nombre y descripción accesibles", async ({
    page,
  }) => {
    await abrir(page, estado("pausar"));
    const d = dialogo(page);
    await expect(d).toHaveAccessibleName(PAUSAR.titulo);
    const descripcion = await d.getAttribute("aria-describedby");
    expect(descripcion).not.toBeNull();
    const texto = (await page.locator(`[id="${descripcion}"]`).innerText()).replace(/\s+/g, " ");
    expect(texto).toContain(`${TEXTOS.dialogo.afecta}: Agente ficticio de ejemplo`);
    expect(texto).toContain(`${TEXTOS.dialogo.datosDistintivos.identificador}: AG-0042`);
    expect(texto).toContain(PAUSAR.cuando);
    await expect(d.locator("bdi")).toHaveCount(2);
  });

  test("el botón de confirmar lleva un verbo y su objeto; ningún botón es «Aceptar» ni «Sí»; siempre hay «Cancelar»", async ({
    page,
  }) => {
    await abrir(page, estado("pausar"));
    await expect(confirmar(page)).toBeVisible();
    await expect(cancelar(page)).toBeVisible();
    const nombres = await dialogo(page).getByRole("button").allInnerTexts();
    for (const n of nombres) expect(n).not.toMatch(/^(?:Aceptar|Sí|Enviar|OK|Haz clic aquí)$/i);
    expect(PAUSAR.confirmar.split(" ").length).toBeGreaterThanOrEqual(2);
  });

  test("la variante de peligro lleva relleno y borde de error; la de reanudar es la primaria", async ({
    page,
  }) => {
    await abrir(page, estado("pausar"));
    const pausar = await confirmar(page).evaluate((b) => ({
      fondo: getComputedStyle(b).backgroundColor,
      borde: getComputedStyle(b).borderTopColor,
      color: getComputedStyle(b).color,
    }));
    expect(pausar.fondo).toBe(pausar.borde);
    await page.keyboard.press("Escape");
    await disparador(page, 1).click();
    const reanudar = await dialogo(page)
      .getByRole("button", { name: TEXTOS.dialogo.acciones.reanudar_agente.confirmar })
      .evaluate((b) => getComputedStyle(b).backgroundColor);
    expect(reanudar).not.toBe(pausar.fondo);
  });

  test("el foco inicial está en «Cancelar» y Intro nada más abrir no confirma: cancela", async ({
    page,
  }) => {
    await abrir(page, estado("pausar"));
    await expect(cancelar(page)).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(dialogo(page)).toHaveCount(0);
    await expect(contador(page, "envios")).toHaveText("0");
    await expect(disparador(page, 0)).toBeFocused();
  });

  test("Intro nada más abrir con teclado, desde el disparador, tampoco confirma", async ({
    page,
  }) => {
    await abrir(page, estado("pausar"));
    await page.keyboard.press("Escape");
    await disparador(page, 0).focus();
    await page.keyboard.press("Enter");
    await expect(dialogo(page)).toBeVisible();
    await expect(cancelar(page)).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(dialogo(page)).toHaveCount(0);
    await expect(contador(page, "envios")).toHaveText("0");
  });

  test("50 tabuladores y 50 con Mayúsculas no sacan el foco; el fondo queda inerte", async ({
    page,
  }) => {
    await abrir(page, estado("pausar"));
    for (let i = 0; i < 50; i += 1) {
      await page.keyboard.press("Tab");
      expect(await focoDentro(page), `tabulador ${i + 1}`).toBe(true);
    }
    for (let i = 0; i < 50; i += 1) {
      await page.keyboard.press("Shift+Tab");
      expect(await focoDentro(page), `Mayúsculas+tabulador ${i + 1}`).toBe(true);
    }
    // El fondo sale del árbol de accesibilidad (aria-hidden): ni la página ni su cabecera.
    await expect(page.getByRole("main")).toHaveCount(0);
    await expect(page.getByRole("banner")).toHaveCount(0);
  });

  test("Escape cierra sin hacer nada y el foco vuelve al disparador", async ({ page }) => {
    await abrir(page, estado("pausar"));
    await page.keyboard.press("Escape");
    await expect(dialogo(page)).toHaveCount(0);
    await expect(contador(page, "envios")).toHaveText("0");
    await expect(disparador(page, 0)).toBeFocused();
  });

  test("«Cancelar» con ratón cierra sin hacer nada y el foco vuelve al disparador", async ({
    page,
  }) => {
    await abrir(page, estado("pausar"));
    await cancelar(page).click();
    await expect(dialogo(page)).toHaveCount(0);
    await expect(contador(page, "envios")).toHaveText("0");
    await expect(disparador(page, 0)).toBeFocused();
  });

  test("un clic fuera no cierra ni confirma (diálogo de alerta)", async ({ page }) => {
    await abrir(page, estado("pausar"));
    await page.mouse.click(2, 2);
    await expect(dialogo(page)).toBeVisible();
    await expect(contador(page, "envios")).toHaveText("0");
  });

  test("el foco tiene contorno en cada botón del diálogo, con el papel de foco", async ({
    page,
  }) => {
    await abrir(page, estado("pausar"));
    for (const b of [cancelar(page), confirmar(page)]) {
      await b.focus();
      const contorno = await b.evaluate((x) => ({
        estilo: getComputedStyle(x).outlineStyle,
        ancho: parseFloat(getComputedStyle(x).outlineWidth),
      }));
      expect(contorno.estilo).not.toBe("none");
      expect(contorno.ancho).toBeGreaterThan(0);
    }
  });
});

test.describe("PRUEBA-015 · resultados de la acción en el diálogo (CA-017, REQ-073, REQ-074, REQ-078)", () => {
  test("hecha: se envía una vez, el diálogo se cierra, se anuncia, la vista relee y el foco vuelve", async ({
    page,
  }) => {
    await abrir(page, estado("pausar"));
    await confirmar(page).click();
    await expect(dialogo(page)).toHaveCount(0);
    await expect(contador(page, "envios")).toHaveText("1");
    await expect(contador(page, "hechas")).toHaveText("1");
    await expect(contador(page, "relecturas")).toHaveText("1");
    await expect(cortes(page)).toHaveText(TEXTOS.acciones.resultado.hecha);
    await expect(disparador(page, 0)).toBeFocused();
  });

  test("dos pulsaciones seguidas e Intro repetido envían una sola vez; el botón lo dice y no se cierra en curso", async ({
    page,
  }) => {
    await abrir(page, estado("pausar"));
    await conRespuesta(page, "sin_respuesta");
    const c = confirmar(page);
    await c.dblclick();
    await expect(contador(page, "envios")).toHaveText("1");
    const en = dialogo(page).getByRole("button", { name: PAUSAR.enCurso });
    await expect(en).toHaveAttribute("aria-disabled", "true");
    await en.focus();
    await page.keyboard.press("Enter");
    await page.keyboard.press("Enter");
    await page.keyboard.press("Space");
    await expect(contador(page, "envios")).toHaveText("1");
    // Con el envío en curso no se cierra: ni Escape, ni «Cancelar».
    await page.keyboard.press("Escape");
    await expect(dialogo(page)).toBeVisible();
    await expect(cancelar(page)).toHaveAttribute("aria-disabled", "true");
    await cancelar(page).click({ force: true });
    await expect(dialogo(page)).toBeVisible();
    await expect(cortes(page)).not.toHaveText(TEXTOS.acciones.resultado.hecha);
  });

  test("rechazada: no se cambió nada, se dice con el motivo de la lista y se puede volver a confirmar", async ({
    page,
  }) => {
    await abrir(page, estado("pausar"));
    await conRespuesta(page, "rechazada");
    await confirmar(page).click();
    const esperado = `${TEXTOS.acciones.resultado.rechazada} ${TEXTOS.acciones.motivosDeRechazo.estado_distinto}`;
    await expect(dialogo(page).locator("[data-resultado]")).toHaveText(esperado);
    await expect(dialogo(page).locator("[data-resultado]")).toHaveAttribute(
      "data-resultado",
      "rechazada",
    );
    await expect(dialogo(page)).toBeVisible();
    await expect(cortes(page)).toHaveText(esperado);
    await expect(confirmar(page)).toBeVisible();
    await expect(cancelar(page)).toBeVisible();
    await confirmar(page).click();
    await expect(contador(page, "envios")).toHaveText("2");
    await expect(dialogo(page)).not.toContainText(TEXTOS.acciones.resultado.hecha);
  });

  test("sin permiso (401): no se afirma ningún cambio, no se puede confirmar, «Cerrar» tiene el foco y la vista relee", async ({
    page,
  }) => {
    await abrir(page, estado("pausar"));
    await conRespuesta(page, "no_permitida");
    await confirmar(page).click();
    await expect(dialogo(page).locator("[data-resultado]")).toHaveText(TEXTOS.acciones.noPermitida);
    await expect(confirmar(page)).toHaveCount(0);
    await expect(cerrar(page)).toBeFocused();
    await expect(contador(page, "relecturas")).toHaveText("1");
    await expect(contador(page, "hechas")).toHaveText("0");
    await expect(dialogo(page)).not.toContainText(TEXTOS.acciones.resultado.hecha);
    await page.keyboard.press("Enter");
    await expect(dialogo(page)).toHaveCount(0);
    await expect(disparador(page, 0)).toBeFocused();
  });

  for (const respuesta of ["servidor", "ilegible", "desconocida"]) {
    test(`respuesta «${respuesta}»: 0 mensajes de éxito; el mensaje permanece, sin reintento, con «Comprobar estado»`, async ({
      page,
    }) => {
      await abrir(page, estado("pausar"));
      await conRespuesta(page, respuesta);
      await confirmar(page).click();
      await expect(dialogo(page).locator("[data-resultado]")).toHaveText(
        TEXTOS.acciones.resultado.incierta,
      );
      await expect(dialogo(page)).not.toContainText(TEXTOS.acciones.resultado.hecha);
      await expect(confirmar(page)).toHaveCount(0);
      await expect(cerrar(page)).toBeFocused();
      await page.waitForTimeout(600);
      await expect(contador(page, "envios")).toHaveText("1");
      await expect(contador(page, "relecturas")).toHaveText("0");
      await dialogo(page)
        .getByRole("button", { name: TEXTOS.acciones.resultado.comprobarEstado })
        .click();
      await expect(contador(page, "relecturas")).toHaveText("1");
      await expect(dialogo(page)).toHaveCount(0);
    });
  }

  test("sin respuesta: a los 30 s pasa a incierta y libera el botón; no se reintenta", async ({
    page,
  }) => {
    await page.clock.install();
    await abrir(page, estado("pausar"));
    await conRespuesta(page, "sin_respuesta");
    await confirmar(page).click();
    await expect(dialogo(page).getByRole("button", { name: PAUSAR.enCurso })).toBeVisible();
    await page.clock.fastForward(29_000);
    await expect(dialogo(page).locator("[data-resultado]")).toHaveCount(0);
    await page.clock.fastForward(1_500);
    await expect(dialogo(page).locator("[data-resultado]")).toHaveText(
      TEXTOS.acciones.resultado.incierta,
    );
    await expect(dialogo(page)).not.toContainText(TEXTOS.acciones.resultado.hecha);
    await expect(contador(page, "envios")).toHaveText("1");
    // El botón se libera: «Cerrar» y «Comprobar estado» responden.
    await expect(cerrar(page)).not.toHaveAttribute("aria-disabled", "true");
    await cerrar(page).click();
    await expect(dialogo(page)).toHaveCount(0);
  });

  test("respuesta de éxito tardía (a los 35 s): no se muestra éxito, no se atribuye y la vista relee", async ({
    page,
  }) => {
    await page.clock.install();
    await abrir(page, estado("pausar"));
    await conRespuesta(page, "tardia");
    await confirmar(page).click();
    await page.clock.fastForward(31_000);
    await expect(dialogo(page).locator("[data-resultado]")).toHaveText(
      TEXTOS.acciones.resultado.incierta,
    );
    await expect(contador(page, "relecturas")).toHaveText("0");
    await page.clock.fastForward(5_000);
    await expect(contador(page, "relecturas")).toHaveText("1");
    await expect(dialogo(page).locator("[data-resultado]")).toHaveText(
      TEXTOS.acciones.resultado.incierta,
    );
    await expect(dialogo(page)).not.toContainText(TEXTOS.acciones.resultado.hecha);
    await expect(contador(page, "envios")).toHaveText("1");
  });
});

test.describe("PRUEBA-021 · el diálogo con teclado (CA-027)", () => {
  test("solo con teclado: abrir, ir a confirmar, confirmar y recuperar el foco", async ({
    page,
  }) => {
    await abrir(page, estado("pausar"));
    await page.keyboard.press("Escape");
    await disparador(page, 0).focus();
    await page.keyboard.press("Space");
    await expect(dialogo(page)).toBeVisible();
    await expect(cancelar(page)).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(confirmar(page)).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(dialogo(page)).toHaveCount(0);
    await expect(contador(page, "envios")).toHaveText("1");
    await expect(disparador(page, 0)).toBeFocused();
  });

  test("con el ratón abre y con «Cancelar» el foco también vuelve al disparador", async ({
    page,
  }) => {
    await abrir(page, estado("pausar"));
    await page.keyboard.press("Escape");
    await disparador(page, 1).click();
    await expect(dialogo(page)).toBeVisible();
    await cancelar(page).click();
    await expect(disparador(page, 1)).toBeFocused();
  });
});

test.describe("PRUEBA-020 · el diálogo abierto y el cambio de tema", () => {
  test("al pasar a oscuro con el diálogo abierto: sin recarga, sigue abierto y con el foco dentro", async ({
    page,
  }) => {
    await page.emulateMedia({ colorScheme: "light" });
    await abrir(page, estado("pausar"));
    await page.evaluate(() => {
      (window as unknown as { __marca: string }).__marca = "sin-recarga";
    });
    const fondoClaro = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    await page.emulateMedia({ colorScheme: "dark" });
    await expect
      .poll(() => page.evaluate(() => getComputedStyle(document.body).backgroundColor))
      .not.toBe(fondoClaro);
    expect(await page.evaluate(() => (window as unknown as { __marca?: string }).__marca)).toBe(
      "sin-recarga",
    );
    await expect(dialogo(page)).toBeVisible();
    expect(await focoDentro(page)).toBe(true);
  });
});

test.describe("PRUEBA-017 · texto hostil como objetivo (CA-041, REQ-056)", () => {
  test("cada cadena se pinta como texto: 0 ejecuciones, 0 elementos nuevos, 0 enlaces, 0 invisibles; el título es fijo", async ({
    page,
  }) => {
    const avisos: string[] = [];
    page.on("dialog", (d) => {
      avisos.push(d.message());
      void d.dismiss();
    });
    await abrir(page, estado("texto-hostil"));
    const total = await page.locator("[data-disparador]").count();
    expect(total).toBeGreaterThanOrEqual(12);
    for (let i = 0; i < total; i += 1) {
      if ((await dialogo(page).count()) === 0) await disparador(page, i).click();
      const d = dialogo(page);
      await expect(d).toBeVisible();
      await expect(d).toHaveAccessibleName(PAUSAR.titulo);
      expect(
        await d.locator("script, img, iframe, a, style, b, input").count(),
        `cadena ${i}`,
      ).toBe(0);
      expect(await d.getByRole("button").count(), `cadena ${i}: botones`).toBe(2);
      expect(await d.locator("bdi").count(), `cadena ${i}: bdi`).toBe(2);
      expect(tieneInvisibles(await d.innerText()), `cadena ${i}: invisibles`).toBe(false);
      expect(
        await page.evaluate(() => (window as unknown as { __hostil?: number }).__hostil),
      ).toBeUndefined();
      if (i === 0) expect(await d.innerText()).toContain("<script>window.__hostil = 1</script>");
      await page.keyboard.press("Escape");
      await expect(d).toHaveCount(0);
    }
    expect(avisos).toEqual([]);
  });
});

test.describe("PRUEBA-013 · diálogo: anchos, poca altura, 120 caracteres, espaciado y zum (CA-006, CA-053, REQ-082)", () => {
  test.use({ hasTouch: true });

  for (const e of DIALOGOS) {
    for (const ancho of [320, 375, 768, 1280]) {
      test(`${e.etiqueta} · ${ancho} px: sin desplazamiento horizontal ni recortes de la página`, async ({
        page,
      }) => {
        await page.setViewportSize({ width: ancho, height: ALTO_POR_DEFECTO });
        await abrir(page, e);
        expect(await medirDesborde(page)).toEqual({ sobra: 0, fuera: [] });
        const caja = await dialogo(page).boundingBox();
        expect(caja).not.toBeNull();
        expect(caja!.x).toBeGreaterThanOrEqual(-1);
        expect(caja!.x + caja!.width).toBeLessThanOrEqual(ancho + 1);
      });
    }
  }

  for (const e of DIALOGOS) {
    test(`${e.etiqueta} · 320 px: con el diálogo cerrado con «Cancelar», la página de detrás no se pisa, no desborda y el campo de la muestra tiene contorno de foco`, async ({
      page,
    }) => {
      await page.setViewportSize({ width: 320, height: ALTO_POR_DEFECTO });
      await abrir(page, e);
      await cancelar(page).click();
      await expect(dialogo(page)).toHaveCount(0);
      expect(await medirSolapes(page), "solapes de la página de detrás").toEqual([]);
      expect(await medirDesborde(page)).toEqual({ sobra: 0, fuera: [] });
      const campo = page.locator("#respuesta-simulada");
      await campo.focus({ timeout: 5000 });
      expect(
        await campo.evaluate((c) => {
          const s = getComputedStyle(c);
          return s.outlineStyle !== "none" && parseFloat(s.outlineWidth) > 0;
        }),
        "contorno de foco del campo",
      ).toBe(true);
    });
  }

  test("120 caracteres: el nombre y el dato distintivo se pintan enteros y se parten en líneas", async ({
    page,
  }) => {
    for (const ancho of [320, 1280]) {
      await page.setViewportSize({ width: ancho, height: ALTO_POR_DEFECTO });
      await abrir(page, estado("objetivo-120"));
      const largos = await dialogo(page)
        .locator("bdi")
        .evaluateAll((xs) =>
          xs.map((b) => {
            const c = b.closest("p")!.getBoundingClientRect();
            const r = b.getBoundingClientRect();
            return {
              n: b.textContent?.length ?? 0,
              dentro: r.left >= c.left - 0.5 && r.right <= c.right + 0.5,
            };
          }),
        );
      expect(
        largos.map((l) => l.n),
        `${ancho} px`,
      ).toEqual([120, 120]);
      for (const l of largos) expect(l.dentro, `${ancho} px: dentro de su párrafo`).toBe(true);
      expect(await solapesDentro(page), `${ancho} px: solapes`).toEqual([]);
      expect(await medirDesborde(page), `${ancho} px`).toEqual({ sobra: 0, fuera: [] });
    }
  });

  for (const e of DIALOGOS) {
    for (const [ancho, alto] of [
      [568, 320],
      [320, 256],
      [640, 400],
    ] as const) {
      test(`${e.etiqueta} · ${ancho} por ${alto}: cabe en la ventana, se desplaza por dentro y los botones se alcanzan con teclado y táctil`, async ({
        page,
      }) => {
        await page.setViewportSize({ width: ancho, height: alto });
        await abrir(page, e);
        const d = dialogo(page);
        const m = await d.evaluate((el) => {
          const c = el.getBoundingClientRect();
          return {
            dentro:
              c.left >= -1 &&
              c.top >= -1 &&
              c.right <= innerWidth + 1 &&
              c.bottom <= innerHeight + 1,
            desplazaPorDentro: ["auto", "scroll"].includes(getComputedStyle(el).overflowY),
          };
        });
        expect(m.dentro, "el diálogo cabe en la ventana").toBe(true);
        expect(m.desplazaPorDentro).toBe(true);
        expect(await medirDesborde(page)).toEqual({ sobra: 0, fuera: [] });
        // Con teclado: el foco llega a cada botón y queda a la vista, no tapado.
        for (const b of [cancelar(page), ultimo(page)]) {
          await b.focus();
          const visible = await b.evaluate((x) => {
            const r = x.getBoundingClientRect();
            return (
              r.top >= -1 &&
              r.bottom <= innerHeight + 1 &&
              r.left >= -1 &&
              r.right <= innerWidth + 1
            );
          });
          expect(visible, "el botón enfocado está a la vista").toBe(true);
        }
        // Con táctil: se puede tocar «Cancelar».
        await cancelar(page).tap();
        await expect(d).toHaveCount(0);
      });
    }
  }

  test("todo el texto se lee desplazando dentro del diálogo a 320 por 256", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 256 });
    await abrir(page, estado("objetivo-120"));
    const d = dialogo(page);
    const medidas = await d.evaluate((el) => ({
      total: el.scrollHeight,
      visible: el.clientHeight,
    }));
    expect(medidas.total).toBeGreaterThan(medidas.visible);
    await d.evaluate((el) => el.scrollTo(0, el.scrollHeight));
    await expect(cancelar(page)).toBeInViewport();
    await expect(ultimo(page)).toBeInViewport();
    await d.evaluate((el) => el.scrollTo(0, 0));
    await expect(
      d.getByRole("heading", { name: TEXTOS.dialogo.acciones.revocar_licencia.titulo }),
    ).toBeInViewport();
  });

  test("con el espaciado de texto de la norma, a 320 px", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: ALTO_POR_DEFECTO });
    await abrir(page, estado("objetivo-120"));
    await inyectarEspaciadoDeTexto(page);
    expect(await medirDesborde(page)).toEqual({ sobra: 0, fuera: [] });
    expect(await solapesDentro(page)).toEqual([]);
    // Nada se recorta de lado dentro del diálogo.
    const lado = await dialogo(page).evaluate((d) => ({
      total: d.scrollWidth,
      visible: d.clientWidth,
    }));
    expect(lado.total).toBeLessThanOrEqual(lado.visible + 1);
  });

  test("objetivos de pulsación: cada botón del diálogo mide al menos 24 por 24 px", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 320, height: ALTO_POR_DEFECTO });
    await abrir(page, estado("pausar"));
    for (const b of await dialogo(page).getByRole("button").all()) {
      const caja = await b.boundingBox();
      expect(caja!.width).toBeGreaterThanOrEqual(24);
      expect(caja!.height).toBeGreaterThanOrEqual(24);
    }
  });
});

test.describe("PRUEBA-014 · colores forzados y sin color (REQ-038, CA-034)", () => {
  test("colores forzados: el diálogo y sus botones conservan su borde y el foco su contorno; confirmar se distingue por su texto", async ({
    page,
  }) => {
    await page.emulateMedia({ forcedColors: "active" });
    await abrir(page, estado("pausar"));
    const sinBorde = await page
      .locator('[role="alertdialog"], [role="alertdialog"] button')
      .evaluateAll(
        (xs) => xs.filter((x) => parseFloat(getComputedStyle(x).borderTopWidth) === 0).length,
      );
    expect(sinBorde).toBe(0);
    // Par de colores del botón de peligro con colores forzados: se mide y debe poder leerse.
    const par = await confirmar(page).evaluate((b) => ({
      color: getComputedStyle(b).color,
      fondo: getComputedStyle(b).backgroundColor,
    }));
    expect(par.color).not.toBe(par.fondo);
    await confirmar(page).focus();
    expect(await confirmar(page).evaluate((b) => getComputedStyle(b).outlineStyle)).not.toBe(
      "none",
    );
    await expect(confirmar(page)).toHaveText(PAUSAR.confirmar);
  });

  test("sin color: el resultado se dice con palabras, no solo con el borde", async ({ page }) => {
    await abrir(page, estado("pausar"));
    await conRespuesta(page, "servidor");
    await confirmar(page).click();
    await expect(dialogo(page).locator("[data-resultado]")).toContainText("No se sabe si");
  });
});

test.describe("PRUEBA-025 · axe sobre el diálogo abierto, a 320 y 1280 px, en claro y oscuro", () => {
  for (const e of DIALOGOS) {
    for (const ancho of [320, 1280]) {
      for (const tema of TEMAS) {
        test(`${e.etiqueta} · ${ancho} px · ${tema}`, async ({ page }) => {
          await page.setViewportSize({ width: ancho, height: ALTO_POR_DEFECTO });
          await page.emulateMedia({ colorScheme: tema });
          await abrir(page, e);
          await comprobarAccesibilidad(page);
        });
      }
    }
  }

  for (const ancho of [320, 1280]) {
    for (const tema of TEMAS) {
      test(`con el mensaje de resultado incierto · ${ancho} px · ${tema}`, async ({ page }) => {
        await page.setViewportSize({ width: ancho, height: ALTO_POR_DEFECTO });
        await page.emulateMedia({ colorScheme: tema });
        await abrir(page, estado("pausar"));
        await conRespuesta(page, "servidor");
        await confirmar(page).click();
        await expect(dialogo(page).locator("[data-resultado]")).toBeVisible();
        await comprobarAccesibilidad(page);
      });
    }
  }
});
