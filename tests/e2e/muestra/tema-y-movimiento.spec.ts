// PRUEBA-020 (diseño 020 §Pruebas): cambio de tema con una vista abierta (sin recarga y con el
// estado intacto); colores forzados (0 degradados y bordes presentes); movimiento reducido (0
// animaciones en curso); ninguna animación repite más de 3 veces por segundo; fuente bloqueada
// (texto visible en el primer pintado); 1.111 y 8.888 con el mismo ancho. Genera capturas en
// grises y en colores forzados para la revisión manual. CA-023, CA-030, CA-034, CA-054, CA-057.
import { expect, test } from "@playwright/test";
import { ESTADOS, abrirEstado, anotarPendiente } from "./apoyo/estados";
import {
  fotoDelEstado,
  leerVarianteDeCifras,
  medirAnchoDeCifras,
  medirAnimaciones,
  medirControlesSinBorde,
  medirDegradados,
  medirFuentesQueOcultan,
  medirPapelesDeDegradado,
} from "./apoyo/medidas";
import { ALTO_POR_DEFECTO } from "./configuracion-interfaz";

test("el inventario tiene al menos un estado que recorrer", () => {
  expect(ESTADOS.length).toBeGreaterThan(0);
});

for (const estado of ESTADOS) {
  test.describe(`PRUEBA-020 · ${estado.etiqueta}`, () => {
    test("cambio de tema con la vista abierta: sin recarga y con el estado intacto", async ({
      page,
    }) => {
      await page.setViewportSize({ width: 1280, height: ALTO_POR_DEFECTO });
      await page.emulateMedia({ colorScheme: "light" });
      await abrirEstado(page, estado);
      // Un diálogo de alerta abierto al cargar (T-010 (j)) deja inerte el resto de la página: se
      // cierra para ejercitar lo demás. El cambio de tema con el diálogo abierto lo prueba
      // `dialogo-confirmacion.spec.ts`.
      // `abrirEstado` ya ha esperado a que el diálogo esté pintado si el estado lo trae.
      if ((await page.getByRole("alertdialog").count()) > 0) {
        await page.keyboard.press("Escape");
        await expect(page.getByRole("alertdialog")).toHaveCount(0);
      }
      // Lo que el usuario ha escrito o abierto: si hay campos, se rellenan antes del cambio.
      const campos = page.locator(
        'input:not([type="hidden"]):not([type="checkbox"]):not([type="radio"]), textarea',
      );
      for (let i = 0; i < (await campos.count()); i++) {
        await campos.nth(i).fill("texto ficticio de prueba");
      }
      // «Tabla ordenada» y «cajón abierto» (PRUEBA-020): se ejercitan si el estado los trae; si no,
      // quedan anotados como no ejecutados. El cajón existe desde T-010 (b) en todo armazón.
      const columna = page.locator("th[aria-sort] button, [role='columnheader'][aria-sort] button");
      if ((await columna.count()) > 0) {
        await columna.first().click();
      } else {
        anotarPendiente(
          test.info(),
          `cambio de tema con la tabla ordenada en ${estado.etiqueta}: el estado no tiene tabla con orden`,
          "T-010 (tabla)",
        );
      }
      // El botón del cajón: `aria-controls` solo aparece con el cajón abierto, así que se le
      // reconoce por anunciar un diálogo y llevar `aria-expanded` (un selector con `aria-controls`
      // no lo encontraba y dejaba la prueba sin ejercitar el cajón).
      const cajon = page.locator('[aria-haspopup="dialog"][aria-expanded]');
      const conCajon = (await cajon.count()) > 0;
      if (conCajon) {
        // El botón del cajón solo se ve por debajo de 1024 px: se estrecha la ventana y se abre.
        await page.setViewportSize({ width: 375, height: 667 });
        // Menor 2 de T-010 (b): el cajón se hidrata tras pintarse; se espera antes de pulsarlo.
        await page.waitForLoadState("networkidle");
        await cajon.first().click();
        await expect(page.getByRole("dialog")).toBeVisible();
      } else {
        anotarPendiente(
          test.info(),
          `cambio de tema con el cajón abierto en ${estado.etiqueta}: el estado no tiene cajón`,
          "T-010 (armazón, cajón)",
        );
      }
      await page.evaluate(() => {
        (window as unknown as { __marca: string }).__marca = "sin-recarga";
      });
      const antes = await fotoDelEstado(page);
      const fondoClaro = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
      const entradasAntes = await page.evaluate(
        () => performance.getEntriesByType("navigation").length,
      );

      await page.emulateMedia({ colorScheme: "dark" });
      await expect
        .poll(() => page.evaluate(() => getComputedStyle(document.body).backgroundColor))
        .not.toBe(fondoClaro);

      expect(
        await page.evaluate(() => (window as unknown as { __marca?: string }).__marca),
        "la página no se ha recargado",
      ).toBe("sin-recarga");
      expect(await page.evaluate(() => performance.getEntriesByType("navigation").length)).toBe(
        entradasAntes,
      );
      expect(await fotoDelEstado(page), "el estado sigue igual").toEqual(antes);
      if (conCajon) {
        // Abierto antes, abierto después, con el foco todavía dentro (sin recarga ni cierre).
        await expect(page.getByRole("dialog")).toBeVisible();
        expect(
          await page.evaluate(
            () =>
              document.querySelector("[role=dialog]")?.contains(document.activeElement) ?? false,
          ),
          "el foco sigue dentro del cajón",
        ).toBe(true);
      }
    });

    test("colores forzados: 0 degradados y bordes presentes", async ({ page }) => {
      await page.emulateMedia({ forcedColors: "active" });
      await abrirEstado(page, estado);
      // Chromium ya quita los degradados calculados en colores forzados, así que lo que se comprueba
      // es que el sistema de diseño restablece cada papel: `--degradado-*` vale `none` en :root.
      const papeles = await medirPapelesDeDegradado(page);
      expect(papeles.papeles.length, "hay papeles de degradado declarados").toBeGreaterThan(0);
      expect(papeles.sinRestablecer, "papeles de degradado que no valen none").toEqual([]);
      expect(await medirDegradados(page), "degradados calculados").toEqual([]);
      expect(await medirControlesSinBorde(page), "controles sin borde").toEqual([]);
    });

    test("movimiento reducido: 0 animaciones en curso", async ({ page }) => {
      await page.emulateMedia({ reducedMotion: "reduce" });
      await abrirEstado(page, estado);
      // Con 0,01 ms de duración una animación de entrada (el diálogo, que se pinta tras hidratar)
      // puede constar «en curso» un instante: se espera a que termine. Una infinita no termina y
      // la prueba falla igual al agotar el plazo.
      await expect
        .poll(async () => (await medirAnimaciones(page)).filter((a) => a.enCurso).length, {
          message: "animaciones en curso con movimiento reducido",
          timeout: 3000,
        })
        .toBe(0);
    });

    test("ninguna animación repite más de 3 veces por segundo", async ({ page }) => {
      await page.emulateMedia({ reducedMotion: "no-preference" });
      await abrirEstado(page, estado);
      const animaciones = await medirAnimaciones(page);
      expect(animaciones.filter((a) => a.repeticionesPorSegundo > 3)).toEqual([]);
    });

    test("fuente bloqueada: el texto es visible en el primer pintado", async ({ page }) => {
      await page.route("**/*", (ruta) =>
        ruta.request().resourceType() === "font" ? ruta.abort() : ruta.continue(),
      );
      const respuesta = await page.goto(estado.ruta, { waitUntil: "domcontentloaded" });
      expect(respuesta?.status()).toBe(200);
      const titulo = page.locator("h1").first();
      await expect(titulo).toBeVisible();
      expect(
        await titulo.evaluate((e) => {
          const s = getComputedStyle(e);
          return s.visibility === "visible" && s.opacity !== "0" && s.color !== "rgba(0, 0, 0, 0)";
        }),
      ).toBe(true);
      // Ningún tipo de letra propio oculta el texto mientras carga.
      expect(await medirFuentesQueOcultan(page)).toEqual([]);
      anotarPendiente(
        test.info(),
        "desplazamiento del texto de 0,1 o menos al llegar la fuente real (CA-023): no se mide; hoy la pila es de sistema y no hay tipo de letra propio",
        "T-011 (b), cuando se elija la fuente real",
      );
    });

    test("1.111 y 8.888 con el mismo ancho", async ({ page }) => {
      await abrirEstado(page, estado);
      // La igualdad de anchos sola puede cumplirse por casualidad de la fuente: se pide además que
      // las cifras se pidan tabulares.
      expect(await leerVarianteDeCifras(page), "cifras tabulares").toContain("tabular-nums");
      const [uno, ocho] = await medirAnchoDeCifras(page, "1.111", "8.888");
      expect(uno).toBeGreaterThan(0);
      expect(uno).toBeCloseTo(ocho, 1);
    });

    test("capturas en grises y en colores forzados para la revisión manual", async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: ALTO_POR_DEFECTO });
      await abrirEstado(page, estado);
      for (const tema of ["light", "dark"] as const) {
        await page.emulateMedia({ colorScheme: tema });
        await page.addStyleTag({ content: "html { filter: grayscale(1) !important; }" });
        const grises = test
          .info()
          .outputPath(`${estado.entrada}-${estado.estado}-grises-${tema}.png`);
        await page.screenshot({ path: grises, fullPage: true });
        await test.info().attach(`grises-${tema}`, { path: grises, contentType: "image/png" });
      }
      await page.emulateMedia({ forcedColors: "active" });
      const forzados = test
        .info()
        .outputPath(`${estado.entrada}-${estado.estado}-colores-forzados.png`);
      await page.screenshot({ path: forzados, fullPage: true });
      await test.info().attach("colores-forzados", { path: forzados, contentType: "image/png" });
    });
  });
}

// El mismo cambio de tema sobre la página sembrada: la medida detecta que el fondo cambia y que
// una recarga se vería. Prueba de la prueba, sobre la propia muestra.
test.describe("PRUEBA-020 · controles sobre la muestra real", () => {
  test("un degradado puesto con el papel del sistema aparece en claro y desaparece en colores forzados", async ({
    page,
  }) => {
    await page.goto("/muestra");
    await page.evaluate(() => {
      const e = document.createElement("div");
      e.id = "sembrado";
      e.textContent = "sembrado";
      e.style.backgroundImage = "var(--degradado-acento)";
      document.body.appendChild(e);
    });
    expect(await medirDegradados(page), "en tema normal se ve el degradado").toContain(
      "div#sembrado",
    );
    await page.emulateMedia({ forcedColors: "active" });
    expect(await medirDegradados(page), "en colores forzados no hay degradado").toEqual([]);
  });

  test("una hoja que no restablece un papel de degradado en colores forzados hace fallar la comprobación", async ({
    page,
  }) => {
    await page.emulateMedia({ forcedColors: "active" });
    await page.goto("/muestra");
    const real = await medirPapelesDeDegradado(page);
    expect(real.papeles.length).toBeGreaterThan(0);
    expect(real.sinRestablecer).toEqual([]);
    // La hoja sembrada declara un papel y no lo restablece en colores forzados.
    await page.addStyleTag({
      content: ":root { --degradado-sembrado: linear-gradient(red, blue); }",
    });
    const sembrado = await medirPapelesDeDegradado(page);
    expect(sembrado.sinRestablecer).toEqual(["--degradado-sembrado"]);
  });

  test("las cifras proporcionales dan anchos distintos: la medida de 1.111 y 8.888 puede fallar", async ({
    page,
  }) => {
    await page.goto("/muestra");
    expect(await leerVarianteDeCifras(page)).toContain("tabular-nums");
    await page.addStyleTag({
      content: "[data-cifra] { font-variant-numeric: proportional-nums !important; }",
    });
    expect(await leerVarianteDeCifras(page)).toContain("proportional-nums");
    expect(await leerVarianteDeCifras(page)).not.toContain("tabular-nums");
    const [uno, ocho] = await medirAnchoDeCifras(page, "1.111", "8.888");
    expect(Math.abs(uno - ocho), "con cifras proporcionales los anchos difieren").toBeGreaterThan(
      0.1,
    );
  });

  test("una animación sembrada se detiene con el movimiento reducido y se detecta sin él", async ({
    page,
  }) => {
    await page.goto("/muestra");
    await page.evaluate(() => {
      const hoja = document.createElement("style");
      hoja.textContent =
        "@keyframes giro-sembrado{to{transform:rotate(1turn)}} #giro{animation:giro-sembrado 100ms linear infinite}";
      document.head.appendChild(hoja);
      const e = document.createElement("div");
      e.id = "giro";
      e.textContent = "giro";
      document.body.appendChild(e);
    });
    await page.emulateMedia({ reducedMotion: "no-preference" });
    const sin = await medirAnimaciones(page);
    expect(sin.some((a) => a.enCurso && a.repeticionesPorSegundo > 3)).toBe(true);
    await page.emulateMedia({ reducedMotion: "reduce" });
    await expect
      .poll(async () => (await medirAnimaciones(page)).filter((a) => a.enCurso).length)
      .toBe(0);
  });
});
