// PRUEBA-014 (tabla y paginación; diseño 020 §Pruebas) y, para ellas, PRUEBA-013 (anchos, zum,
// espaciado, nombres de 120 caracteres, región desplazable) y PRUEBA-025 (axe). CA-006, CA-010,
// CA-049, CA-050, CA-051, CA-053; REQ-013, REQ-037, REQ-042, REQ-044, REQ-045, REQ-056, REQ-065,
// REQ-066, REQ-067, REQ-071, REQ-075. Recorre la entrada `tabla` del inventario. La carga y el
// error de la tabla son del bloque de datos (T-016).
import { expect, test, type Locator, type Page } from "@playwright/test";
import { ESTADOS, abrirEstado, type EstadoDePrueba } from "./apoyo/estados";
import { ALTO_POR_DEFECTO, TEMAS, comprobarAccesibilidad } from "./configuracion-interfaz";
import {
  inyectarEspaciadoDeTexto,
  medirDesborde,
  medirRecortes,
  medirSolapes,
} from "./apoyo/medidas";

const TABLAS = ESTADOS.filter((e) => e.entrada === "tabla");
const estado = (clave: string): EstadoDePrueba => {
  const e = TABLAS.find((x) => x.estado === clave);
  if (e === undefined) throw new Error(`falta el estado ${clave} del inventario`);
  return e;
};

const filas = (page: Page): Locator => page.locator("table tbody tr");
const posicion = (page: Page): Locator => page.locator("[data-posicion]");
const botonDeOrden = (page: Page, clave: string): Locator =>
  page.locator(`[data-ordenar="${clave}"]`);
const cabecera = (page: Page, clave: string): Locator =>
  page.locator("th[scope=col]").filter({ has: page.locator(`[data-ordenar="${clave}"]`) });
const nombreDeLaPrimera = async (page: Page): Promise<string> =>
  (await filas(page).first().locator("th").innerText()).trim();
/** Las cifras de una columna (por posición) de las filas visibles. */
async function cifrasDe(page: Page, columna: number): Promise<number[]> {
  const textos = await filas(page)
    .locator(`td:nth-of-type(${columna - 1})`)
    .allInnerTexts();
  return textos.map((t) => Number(t.replace(/\./g, "").replace(",", ".")));
}
const activo = (page: Page): Promise<string> =>
  page.evaluate(
    () =>
      document.activeElement?.getAttribute("data-ordenar") ??
      document.activeElement?.getAttribute("aria-label") ??
      document.activeElement?.getAttribute("data-paginacion") ??
      document.activeElement?.tagName ??
      "",
  );
const anuncio = (page: Page): Locator => page.locator('[data-anunciador="cortes"]');

test("hay entradas que recorrer: la tabla tiene sus nueve estados en el inventario", () => {
  expect(TABLAS.map((t) => t.estado).sort()).toEqual(
    [
      "ancha",
      "datos",
      "diez-mil",
      "intermedia",
      "nombres-largos-120",
      "texto-hostil",
      "ultima",
      "una-pagina",
      "vacia",
    ].sort(),
  );
});

test.describe("PRUEBA-014 · tabla: estructura y primera página (CA-010)", () => {
  test("table nativa con título, encabezados de columna y una fila por dato", async ({ page }) => {
    await abrirEstado(page, estado("datos"));
    await expect(page.locator("table")).toHaveCount(1);
    await expect(page.locator("table caption")).toHaveText("Clientes de ejemplo");
    await expect(page.locator("th[scope=col]")).toHaveCount(5);
    await expect(filas(page)).toHaveCount(25);
    await expect(filas(page).first().locator("th[scope=row]")).toHaveText("Cliente de ejemplo 1");
    await expect(page.locator("table [aria-sort]")).toHaveCount(0);
  });

  test("la región tiene nombre, es enfocable y la paginación va fuera de ella", async ({
    page,
  }) => {
    await abrirEstado(page, estado("datos"));
    const region = page.getByRole("region", { name: "Clientes de ejemplo, se puede desplazar" });
    await expect(region).toHaveAttribute("tabindex", "0");
    await expect(region.locator("table")).toHaveCount(1);
    await expect(region.locator("nav")).toHaveCount(0);
    await expect(
      page.getByRole("navigation", { name: "Paginación de Clientes de ejemplo" }),
    ).toBeVisible();
  });

  test("la posición usa miles con punto: «Del 1 al 25 de 1.234»", async ({ page }) => {
    await abrirEstado(page, estado("datos"));
    await expect(posicion(page)).toHaveText("Del 1 al 25 de 1.234");
  });

  test("solo las columnas ordenables llevan botón, con su nombre", async ({ page }) => {
    await abrirEstado(page, estado("datos"));
    await expect(page.locator("thead button")).toHaveCount(4);
    for (const nombre of ["Cliente", "Correos revisados", "Agentes", "Alta"]) {
      await expect(
        page.locator("thead").getByRole("button", { name: nombre, exact: true }),
      ).toBeVisible();
    }
    await expect(
      page.locator("th[scope=col]", { hasText: "Estado" }).locator("button"),
    ).toHaveCount(0);
  });
});

test.describe("PRUEBA-014 · tabla: orden con teclado, ratón y táctil, en los dos sentidos (REQ-013)", () => {
  test("cada columna ordenable: Intro ordena ascendente y luego descendente, y el foco no se pierde", async ({
    page,
  }) => {
    await abrirEstado(page, estado("datos"));
    await page.waitForLoadState("networkidle");
    for (const [clave, columna] of [
      ["correos", 2],
      ["agentes", 3],
    ] as const) {
      const boton = botonDeOrden(page, clave);
      await boton.focus();
      await page.keyboard.press("Enter");
      await expect(cabecera(page, clave)).toHaveAttribute("aria-sort", "ascending");
      const asc = await cifrasDe(page, columna);
      expect(asc, `${clave} ascendente`).toEqual([...asc].sort((a, b) => a - b));
      expect(await activo(page), `${clave}: foco tras ordenar`).toBe(clave);
      await page.keyboard.press("Enter");
      await expect(cabecera(page, clave)).toHaveAttribute("aria-sort", "descending");
      const desc = await cifrasDe(page, columna);
      expect(desc, `${clave} descendente`).toEqual([...desc].sort((a, b) => b - a));
      expect(await activo(page), `${clave}: foco tras reordenar`).toBe(clave);
      // Solo la columna ordenada lleva aria-sort.
      await expect(page.locator("table [aria-sort]")).toHaveCount(1);
    }
  });

  test("la barra espaciadora también ordena; el nombre ordena como texto natural", async ({
    page,
  }) => {
    await abrirEstado(page, estado("datos"));
    await page.waitForLoadState("networkidle");
    await botonDeOrden(page, "nombre").focus();
    await page.keyboard.press("Space");
    await expect(cabecera(page, "nombre")).toHaveAttribute("aria-sort", "ascending");
    expect(await nombreDeLaPrimera(page)).toBe("Cliente de ejemplo 1");
    await page.keyboard.press("Space");
    await expect(cabecera(page, "nombre")).toHaveAttribute("aria-sort", "descending");
    expect(await nombreDeLaPrimera(page)).toBe("Cliente de ejemplo 1234");
  });

  test("la columna de fechas se ordena y cambia el sentido", async ({ page }) => {
    await abrirEstado(page, estado("datos"));
    await page.waitForLoadState("networkidle");
    await botonDeOrden(page, "alta").click();
    await expect(cabecera(page, "alta")).toHaveAttribute("aria-sort", "ascending");
    const primera = await filas(page).first().innerText();
    await botonDeOrden(page, "alta").click();
    await expect(cabecera(page, "alta")).toHaveAttribute("aria-sort", "descending");
    expect(await filas(page).first().innerText()).not.toBe(primera);
  });

  test("al cambiar de columna, la anterior pierde aria-sort y la página vuelve a la primera", async ({
    page,
  }) => {
    await abrirEstado(page, estado("datos"));
    await page.waitForLoadState("networkidle");
    await page.getByRole("button", { name: "Siguiente" }).click();
    await expect(posicion(page)).toHaveText("Del 26 al 50 de 1.234");
    await botonDeOrden(page, "correos").click();
    await expect(posicion(page)).toHaveText("Del 1 al 25 de 1.234");
    await botonDeOrden(page, "agentes").click();
    await expect(cabecera(page, "correos")).not.toHaveAttribute("aria-sort", /.+/);
    await expect(cabecera(page, "agentes")).toHaveAttribute("aria-sort", "ascending");
  });

  test("el cambio de orden se anuncia al lector de pantalla", async ({ page }) => {
    await abrirEstado(page, estado("datos"));
    await page.waitForLoadState("networkidle");
    await botonDeOrden(page, "nombre").click();
    await expect(anuncio(page)).toHaveText("Ordenado por Cliente, ascendente");
    await botonDeOrden(page, "correos").click();
    await expect(anuncio(page)).toHaveText("Ordenado por Correos revisados, ascendente");
  });

  test.describe("táctil", () => {
    test.use({ hasTouch: true });
    test("un toque ordena, y otro invierte", async ({ page }) => {
      await abrirEstado(page, estado("datos"));
      await page.waitForLoadState("networkidle");
      await botonDeOrden(page, "agentes").tap();
      await expect(cabecera(page, "agentes")).toHaveAttribute("aria-sort", "ascending");
      await botonDeOrden(page, "agentes").tap();
      await expect(cabecera(page, "agentes")).toHaveAttribute("aria-sort", "descending");
    });
  });
});

test.describe("PRUEBA-014 · paginación: primera, intermedia, última, una sola, vacía (CA-010)", () => {
  test("primera: «Anterior» desactivado sin quitarle el foco; los números llevan aria-current", async ({
    page,
  }) => {
    await abrirEstado(page, estado("datos"));
    const anterior = page.locator('[data-paginacion="anterior"]');
    await expect(anterior).toHaveAttribute("aria-disabled", "true");
    await expect(anterior).not.toHaveAttribute("disabled", /.*/);
    await anterior.focus();
    await expect(anterior).toBeFocused();
    await expect(page.locator('[aria-current="page"]')).toHaveCount(1);
    await expect(page.locator('[aria-current="page"]')).toHaveAccessibleName("Página 1");
  });

  test("con el teclado: Siguiente avanza, mantiene el foco y se anuncia", async ({ page }) => {
    await abrirEstado(page, estado("datos"));
    await page.waitForLoadState("networkidle");
    const siguiente = page.locator('[data-paginacion="siguiente"]');
    await siguiente.focus();
    await page.keyboard.press("Enter");
    await expect(posicion(page)).toHaveText("Del 26 al 50 de 1.234");
    await expect(page.locator('[aria-current="page"]')).toHaveAccessibleName("Página 2");
    await expect(siguiente).toBeFocused();
    await expect(anuncio(page)).toHaveText("Página 2 de 50. Del 26 al 50 de 1.234");
    await expect(filas(page)).toHaveCount(25);
    await expect(page.locator('[data-paginacion="anterior"]')).not.toHaveAttribute(
      "aria-disabled",
      /.*/,
    );
  });

  test("un número de página lleva a ella, y el último deja «Siguiente» desactivado", async ({
    page,
  }) => {
    await abrirEstado(page, estado("datos"));
    await page.waitForLoadState("networkidle");
    await page.getByRole("button", { name: "Página 50" }).click();
    await expect(posicion(page)).toHaveText("Del 1.226 al 1.234 de 1.234");
    await expect(filas(page)).toHaveCount(9);
    await expect(page.locator('[data-paginacion="siguiente"]')).toHaveAttribute(
      "aria-disabled",
      "true",
    );
    expect(await activo(page)).toBe("Página 50");
    // Pulsar el desactivado no hace nada.
    await page.locator(`[data-paginacion="siguiente"]`).click({ force: true });
    await expect(posicion(page)).toHaveText("Del 1.226 al 1.234 de 1.234");
  });

  test("intermedia: página 17 ordenada de mayor a menor por correos revisados", async ({
    page,
  }) => {
    await abrirEstado(page, estado("intermedia"));
    await expect(posicion(page)).toHaveText("Del 401 al 425 de 1.234");
    await expect(cabecera(page, "correos")).toHaveAttribute("aria-sort", "descending");
    const cifras = await cifrasDe(page, 2);
    expect(cifras).toEqual([...cifras].sort((a, b) => b - a));
    await expect(page.locator('[aria-current="page"]')).toHaveAccessibleName("Página 17");
  });

  test("última: nueve filas y el final es el total", async ({ page }) => {
    await abrirEstado(page, estado("ultima"));
    await expect(filas(page)).toHaveCount(9);
    await expect(posicion(page)).toHaveText("Del 1.226 al 1.234 de 1.234");
  });

  test("una sola página: la posición y ningún botón de paginación", async ({ page }) => {
    await abrirEstado(page, estado("una-pagina"));
    await expect(posicion(page)).toHaveText("Del 1 al 8 de 8");
    await expect(page.locator(`nav[aria-label^="Paginación"]`)).toHaveCount(0);
    await expect(page.locator("[data-paginacion]")).toHaveCount(0);
  });

  test("sin filas: el estado vacío, ni tabla vacía ni «Del 0 al 0»", async ({ page }) => {
    await abrirEstado(page, estado("vacia"));
    await expect(page.locator("table")).toHaveCount(0);
    await expect(page.locator("[data-posicion]")).toHaveCount(0);
    await expect(page.locator("[data-paginacion]")).toHaveCount(0);
    await expect(page.getByText("No hay filas que mostrar")).toBeVisible();
    await expect(page.getByText("Cuando haya datos, aparecerán aquí.")).toBeVisible();
    await expect(page.locator("body")).not.toContainText("Del 0");
  });
});

test.describe("PRUEBA-014 · 10.000 filas: una sola página en pantalla y respuesta en 200 ms (REQ-067)", () => {
  test("25 filas en el documento y 400 páginas con números acotados", async ({ page }) => {
    await abrirEstado(page, estado("diez-mil"));
    await expect(filas(page)).toHaveCount(25);
    await expect(posicion(page)).toHaveText("Del 1 al 25 de 10.000");
    expect(await page.locator("[data-paginacion]").count()).toBeLessThanOrEqual(9);
    await expect(page.getByRole("button", { name: "Página 400" })).toBeVisible();
    expect(await page.locator("table tr").count()).toBe(26);
  });

  test("cambiar de página y de orden responde en 200 ms o menos y deja 25 filas", async ({
    page,
  }) => {
    await abrirEstado(page, estado("diez-mil"));
    await page.waitForLoadState("networkidle");
    const medidas = await page.evaluate(async () => {
      const esperarPintado = (): Promise<void> =>
        new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => r())));
      const pulsar = async (selector: string): Promise<number> => {
        const b = document.querySelector<HTMLElement>(selector)!;
        const t0 = performance.now();
        b.click();
        await esperarPintado();
        return performance.now() - t0;
      };
      const pagina = await pulsar('[data-paginacion="siguiente"]');
      const orden = await pulsar('[data-ordenar="nombre"]');
      const inverso = await pulsar('[data-ordenar="nombre"]');
      return { pagina, orden, inverso, filas: document.querySelectorAll("table tbody tr").length };
    });
    expect(medidas.filas).toBe(25);
    expect(medidas.pagina, "página").toBeLessThanOrEqual(200);
    expect(medidas.orden, "orden").toBeLessThanOrEqual(200);
    expect(medidas.inverso, "orden inverso").toBeLessThanOrEqual(200);
  });
});

test.describe("PRUEBA-013 · más ancha que la pantalla: solo se desplaza la tabla (REQ-045)", () => {
  test("a 320 px la región se desplaza y la página no", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: ALTO_POR_DEFECTO });
    await abrirEstado(page, estado("ancha"));
    const region = page.getByRole("region", { name: /se puede desplazar/ });
    const medidas = await region.evaluate((r) => ({
      ancho: r.scrollWidth,
      visible: r.clientWidth,
      overflowX: getComputedStyle(r).overflowX,
    }));
    expect(medidas.ancho).toBeGreaterThan(medidas.visible);
    expect(medidas.overflowX).toBe("auto");
    expect(await medirDesborde(page)).toEqual({ sobra: 0, fuera: [] });
  });

  test("con el teclado: se llega a la región con Tab, las flechas la desplazan y Tab sale (sin trampa)", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 320, height: ALTO_POR_DEFECTO });
    await abrirEstado(page, estado("ancha"));
    await page.waitForLoadState("networkidle");
    const region = page.getByRole("region", { name: /se puede desplazar/ });
    // Se llega a la región con Tab desde el primer botón de orden, hacia delante o hacia atrás.
    await botonDeOrden(page, "nombre").focus();
    await page.keyboard.press("Shift+Tab");
    await expect(region).toBeFocused();
    // Foco visible.
    const contorno = await region.evaluate((r) => {
      const e = getComputedStyle(r);
      return { estilo: e.outlineStyle, grosor: parseFloat(e.outlineWidth) };
    });
    expect(contorno.estilo).not.toBe("none");
    expect(contorno.grosor).toBeGreaterThan(0);
    // Las flechas la desplazan.
    const antes = await region.evaluate((r) => r.scrollLeft);
    for (let i = 0; i < 5; i++) await page.keyboard.press("ArrowRight");
    await expect.poll(() => region.evaluate((r) => r.scrollLeft)).toBeGreaterThan(antes);
    // Tab sale de la región (no es una trampa), en los dos sentidos.
    await page.keyboard.press("Tab");
    await expect(region).not.toBeFocused();
    await page.keyboard.press("Shift+Tab");
    await expect(region).toBeFocused();
    await page.keyboard.press("Shift+Tab");
    await expect(region).not.toBeFocused();
  });

  test("a 1280 px la página no se desplaza (la región, si hace falta, sí)", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: ALTO_POR_DEFECTO });
    await abrirEstado(page, estado("ancha"));
    expect(await medirDesborde(page)).toEqual({ sobra: 0, fuera: [] });
  });
});

test.describe("PRUEBA-013 · nombres de 120 caracteres: se parten, no se recortan ni se solapan (REQ-065)", () => {
  for (const ancho of [320, 375, 768, 1280]) {
    test(`${ancho} px`, async ({ page }) => {
      await page.setViewportSize({ width: ancho, height: ALTO_POR_DEFECTO });
      await abrirEstado(page, estado("nombres-largos-120"));
      expect(await medirRecortes(page), "recortes").toEqual([]);
      expect(await medirSolapes(page), "solapes").toEqual([]);
      expect(await medirDesborde(page), "desplazamiento").toEqual({ sobra: 0, fuera: [] });
      // Cada nombre entero está en el documento y se parte en más de una línea a 320 px.
      const nombres = await filas(page).locator("th[scope=row]").allInnerTexts();
      expect(nombres).toHaveLength(25);
      for (const n of nombres) expect(n.replace(/\s+/g, "").length).toBeGreaterThanOrEqual(100);
      const celda = filas(page).first().locator("th[scope=row]");
      const m = await celda.evaluate((c) => ({
        dentro: c.scrollWidth <= c.clientWidth + 1,
        lineas: Math.round(
          c.getBoundingClientRect().height / parseFloat(getComputedStyle(c).lineHeight || "20"),
        ),
      }));
      expect(m.dentro).toBe(true);
      if (ancho === 320) expect(m.lineas).toBeGreaterThan(1);
    });
  }

  test("con el espaciado de texto de la norma, a 320 px", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: ALTO_POR_DEFECTO });
    await abrirEstado(page, estado("nombres-largos-120"));
    await page.waitForLoadState("networkidle");
    await inyectarEspaciadoDeTexto(page);
    expect(await medirRecortes(page)).toEqual([]);
    expect(await medirSolapes(page)).toEqual([]);
    expect(await medirDesborde(page)).toEqual({ sobra: 0, fuera: [] });
  });

  test("zum al 200 % y al 400 % (ventanas de 640 por 400 y de 320 por 256)", async ({ page }) => {
    for (const [ancho, alto] of [
      [640, 400],
      [320, 256],
    ] as const) {
      await page.setViewportSize({ width: ancho, height: alto });
      await abrirEstado(page, estado("datos"));
      expect(await medirDesborde(page), `${ancho} px`).toEqual({ sobra: 0, fuera: [] });
      expect(await medirRecortes(page), `${ancho} px: recortes`).toEqual([]);
    }
  });
});

test.describe("PRUEBA-017 · texto hostil en celdas, encabezados y estados (CA-051, REQ-056, REQ-071)", () => {
  test("se pinta como texto: 0 ejecuciones, 0 elementos nuevos, 0 enlaces, 0 invisibles", async ({
    page,
  }) => {
    const dialogos: string[] = [];
    page.on("dialog", (d) => {
      dialogos.push(d.message());
      void d.dismiss();
    });
    await abrirEstado(page, estado("texto-hostil"));
    await page.waitForLoadState("networkidle");
    await expect(filas(page)).toHaveCount(12);
    const tabla = page.locator("table");
    expect(await tabla.locator("script, img, iframe, a, style, b").count()).toBe(0);
    expect(
      await page.evaluate(() => (window as unknown as { __hostil?: number }).__hostil),
    ).toBeUndefined();
    expect(dialogos).toEqual([]);
    const texto = await tabla.innerText();
    expect(texto).toContain("<script>window.__hostil = 1</script>");
    expect(texto).toContain("onerror=");
    expect(texto).not.toMatch(/[\u202A-\u202E\u2066-\u2069\u200B\u0000\u0007]/);
    expect(await page.locator("body").innerText()).not.toContain("TESTIGO");
  });

  test("cada nombre está dentro de un bdi y los estados fuera del catálogo son «Estado desconocido»", async ({
    page,
  }) => {
    await abrirEstado(page, estado("texto-hostil"));
    expect(await filas(page).locator("th[scope=row] bdi").count()).toBe(12);
    await expect(filas(page).locator("[data-estado='desconocido']")).toHaveCount(8);
    await expect(filas(page).locator("[data-estado='agente.activo']")).toHaveCount(1);
  });

  test("valores imposibles en las cifras: «Sin datos», nunca cero ni el valor recibido", async ({
    page,
  }) => {
    await abrirEstado(page, estado("texto-hostil"));
    const textos = await filas(page).locator("td:nth-of-type(1)").allInnerTexts();
    expect(textos[2]).toBe("Sin datos");
    expect(textos[3]).toBe("Sin datos");
    expect(textos[4]).toBe("Sin datos");
    expect(textos[0]).toBe("1.111");
    expect(await page.locator("table").innerText()).not.toContain("no es un número");
  });
});

test.describe("PRUEBA-014 · objetivos de pulsación, colores forzados y sin color (REQ-037, REQ-038)", () => {
  for (const ancho of [320, 1280]) {
    test(`${ancho} px: todo botón de la tabla y de la paginación mide al menos 24 por 24 px`, async ({
      page,
    }) => {
      await page.setViewportSize({ width: ancho, height: ALTO_POR_DEFECTO });
      await abrirEstado(page, estado("datos"));
      const cajas = await page.locator("table button, [data-paginacion]").evaluateAll((bs) =>
        bs.map((b) => {
          const r = b.getBoundingClientRect();
          return { ancho: r.width, alto: r.height };
        }),
      );
      expect(cajas.length).toBeGreaterThanOrEqual(9);
      for (const c of cajas) {
        expect(c.ancho).toBeGreaterThanOrEqual(24);
        expect(c.alto).toBeGreaterThanOrEqual(24);
      }
    });
  }

  test("colores forzados: los botones y la página actual conservan borde, y el orden se ve sin color", async ({
    page,
  }) => {
    await page.emulateMedia({ forcedColors: "active" });
    await abrirEstado(page, estado("intermedia"));
    const sinBorde = await page
      .locator("[data-paginacion]")
      .evaluateAll(
        (bs) => bs.filter((b) => parseFloat(getComputedStyle(b).borderTopWidth) === 0).length,
      );
    expect(sinBorde).toBe(0);
    // El orden no depende del color: icono y aria-sort en la columna ordenada.
    await expect(cabecera(page, "correos")).toHaveAttribute("aria-sort", "descending");
    await expect(botonDeOrden(page, "correos").locator("svg")).toHaveCount(1);
    // La página actual se distingue por su atributo, y el foco se ve.
    await page.locator('[aria-current="page"]').focus();
    const foco = await page
      .locator('[aria-current="page"]')
      .evaluate((b) => getComputedStyle(b).outlineStyle);
    expect(foco).not.toBe("none");
  });

  test("sin JavaScript la tabla se pinta entera (la primera página y la posición)", async ({
    browser,
  }) => {
    const contexto = await browser.newContext({ javaScriptEnabled: false });
    const page = await contexto.newPage();
    try {
      await abrirEstado(page, estado("datos"));
      await expect(filas(page)).toHaveCount(25);
      await expect(posicion(page)).toHaveText("Del 1 al 25 de 1.234");
    } finally {
      await contexto.close();
    }
  });
});

test.describe("PRUEBA-013 · todos los estados de la tabla, en los nueve anchos, sin desplazamiento de página", () => {
  for (const e of TABLAS) {
    test(`${e.etiqueta}`, async ({ page }) => {
      await abrirEstado(page, e);
      for (const ancho of [320, 375, 414, 768, 1024, 1280, 1440, 1920, 2560]) {
        await page.setViewportSize({ width: ancho, height: ALTO_POR_DEFECTO });
        expect(await medirDesborde(page), `${ancho} px`).toEqual({ sobra: 0, fuera: [] });
      }
    });
  }
});

test.describe("PRUEBA-025 · axe sobre la tabla, a 320 y 1280 px, en claro y oscuro", () => {
  for (const e of TABLAS) {
    for (const ancho of [320, 1280]) {
      for (const tema of TEMAS) {
        test(`${e.etiqueta} · ${ancho} px · ${tema}`, async ({ page }) => {
          await page.setViewportSize({ width: ancho, height: ALTO_POR_DEFECTO });
          await page.emulateMedia({ colorScheme: tema });
          await abrirEstado(page, e);
          await page.waitForLoadState("networkidle");
          await comprobarAccesibilidad(page);
        });
      }
    }
  }
});
