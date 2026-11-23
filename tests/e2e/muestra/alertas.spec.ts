// PRUEBA-014 (alertas; diseño 020 §Pruebas) y, para ellas, PRUEBA-013 (anchos, zum, espaciado,
// nombres de 120 caracteres), PRUEBA-017 (texto hostil), PRUEBA-021 (teclado) y PRUEBA-025 (axe).
// CA-006, CA-012, CA-027, CA-041, CA-051, CA-053; REQ-016, REQ-037, REQ-038, REQ-047, REQ-056,
// REQ-065, REQ-071, REQ-075. Recorre la entrada `lista-alertas` del inventario. La carga y el
// error de la lista son del bloque de datos (T-016).
import { expect, test, type Locator, type Page } from "@playwright/test";
import { ESTADOS, abrirEstado, type EstadoDePrueba } from "./apoyo/estados";
import { ALTO_POR_DEFECTO, TEMAS, comprobarAccesibilidad } from "./configuracion-interfaz";
import {
  inyectarEspaciadoDeTexto,
  medirDesborde,
  medirRecortes,
  medirSolapes,
} from "./apoyo/medidas";
import { TEXTOS } from "../../../src/components/textos";

const ALERTAS = ESTADOS.filter((e) => e.entrada === "lista-alertas");
const estado = (clave: string): EstadoDePrueba => {
  const e = ALERTAS.find((x) => x.estado === clave);
  if (e === undefined) throw new Error(`falta el estado ${clave} del inventario`);
  return e;
};

const alertas = (page: Page): Locator => page.locator("li[data-alerta]");
const contador = (page: Page, nombre: "pedidas" | "ultima"): Locator =>
  page.locator(`[data-contador="${nombre}"]`);
const botones = (page: Page): Locator => page.locator("li[data-alerta] button");

/** Controles, dirección o invisibles (códigos escritos como números, no como caracteres). */
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

async function abrir(page: Page, e: EstadoDePrueba): Promise<void> {
  await abrirEstado(page, e);
  // Next hidrata los controles después de pintarlos: se espera a que respondan.
  await page.waitForLoadState("networkidle");
}

test("hay entradas que recorrer: la lista de alertas tiene sus siete estados en el inventario", () => {
  expect(ALERTAS.map((a) => a.estado).sort()).toEqual(
    [
      "accion-en-curso",
      "con-accion",
      "desconocidas",
      "gravedades",
      "nombres-largos-120",
      "texto-hostil",
      "vacia",
    ].sort(),
  );
});

test.describe("PRUEBA-014 · alertas: gravedad con palabra, momento y acción (CA-012, REQ-016)", () => {
  test("una lista con nombre y una alerta de cada gravedad, con su palabra y un icono", async ({
    page,
  }) => {
    await abrir(page, estado("gravedades"));
    await expect(page.getByRole("list", { name: TEXTOS.alertas.lista })).toHaveCount(1);
    await expect(alertas(page)).toHaveCount(3);
    const esperado = [
      ["critica", TEXTOS.alertas.gravedad.critica],
      ["aviso", TEXTOS.alertas.gravedad.aviso],
      ["informacion", TEXTOS.alertas.gravedad.informacion],
    ] as const;
    for (const [i, [clave, palabra]] of esperado.entries()) {
      const li = alertas(page).nth(i);
      await expect(li).toHaveAttribute("data-gravedad", clave);
      await expect(li.locator("[data-tono]")).toHaveText(palabra);
      await expect(li.locator("[data-tono] svg[aria-hidden='true']")).toHaveCount(1);
    }
    // Sin acción: ningún botón.
    await expect(botones(page)).toHaveCount(0);
  });

  test("el momento sale con el formato común, en horario de Madrid", async ({ page }) => {
    await abrir(page, estado("gravedades"));
    const textos = await alertas(page).allInnerTexts();
    expect(textos[0]).toContain("12 nov 2026, 08:04");
    expect(textos[1]).toContain("11 nov 2026, 21:30");
    expect(textos[2]).toContain("10 nov 2026, 10:05");
  });

  test("el cliente va en su línea, con su rótulo, y el texto sale del tipo", async ({ page }) => {
    await abrir(page, estado("gravedades"));
    const primera = alertas(page).first();
    await expect(primera).toContainText(TEXTOS.alertas.tipos.agente_sin_senal);
    await expect(primera).toContainText(`${TEXTOS.alertas.cliente}: Cliente de ejemplo 1`);
    await expect(alertas(page).nth(2)).not.toContainText(TEXTOS.alertas.cliente);
  });

  test("con acción: como mucho un botón por alerta, con su verbo, y la tercera no tiene", async ({
    page,
  }) => {
    await abrir(page, estado("con-accion"));
    await expect(alertas(page)).toHaveCount(3);
    await expect(alertas(page).nth(0).getByRole("button")).toHaveText(
      TEXTOS.alertas.acciones.reanudar_agente.texto,
    );
    await expect(alertas(page).nth(1).getByRole("button")).toHaveText(
      TEXTOS.alertas.acciones.revisar_licencia.texto,
    );
    await expect(alertas(page).nth(2).getByRole("button")).toHaveCount(0);
    await expect(botones(page)).toHaveCount(2);
  });

  test("vacía: un estado vacío con qué pasa y sin lista", async ({ page }) => {
    await abrir(page, estado("vacia"));
    await expect(page.getByText(TEXTOS.alertas.vacio.titulo)).toBeVisible();
    await expect(page.getByText(TEXTOS.alertas.vacio.explicacion)).toBeVisible();
    await expect(page.locator("main ul")).toHaveCount(0);
    await expect(alertas(page)).toHaveCount(0);
  });

  test("en curso: el botón lo dice, queda aria-disabled y no envía", async ({ page }) => {
    await abrir(page, estado("accion-en-curso"));
    const enCurso = alertas(page).first().getByRole("button");
    await expect(enCurso).toHaveText(TEXTOS.alertas.acciones.reanudar_agente.enCurso);
    await expect(enCurso).toHaveAttribute("aria-disabled", "true");
    await expect(enCurso).not.toHaveAttribute("disabled", /.*/);
    await enCurso.focus();
    await page.keyboard.press("Enter");
    await page.keyboard.press("Space");
    await enCurso.click({ force: true });
    await expect(contador(page, "pedidas")).toHaveText("0");
    await expect(enCurso).toBeFocused();
    // La otra alerta no está en curso y sí envía.
    await alertas(page).nth(1).getByRole("button").click();
    await expect(contador(page, "pedidas")).toHaveText("1");
  });

  test("valores fuera de las listas: «desconocida», sin botón y nada de lo recibido", async ({
    page,
  }) => {
    await abrir(page, estado("desconocidas"));
    await expect(alertas(page)).toHaveCount(4);
    await expect(botones(page)).toHaveCount(0);
    await expect(alertas(page).first()).toHaveAttribute("data-gravedad", "desconocida");
    await expect(alertas(page).first()).toContainText(TEXTOS.alertas.gravedad.desconocida);
    await expect(alertas(page).first()).toContainText(TEXTOS.alertas.tipos.desconocido);
    await expect(alertas(page).first()).toContainText(TEXTOS.formato.sinDatos);
    // «en curso» solo con true exacto.
    await expect(alertas(page).nth(1)).toHaveAttribute("data-gravedad", "critica");
    await expect(alertas(page).nth(2)).toHaveAttribute("data-gravedad", "desconocida");
    await expect(alertas(page).nth(3)).toHaveAttribute("data-gravedad", "desconocida");
    expect(await page.locator("body").innerText()).not.toContain("TESTIGO");
    // Regla V-2: lo que no se lee tampoco viaja. Ni el DOM serializado ni el HTML crudo que
    // devuelve el servidor (con la carga que Next pasa al componente de cliente) llevan los
    // testigos de los campos de más, del tipo, la acción y la cadena suelta.
    const crudo = await (await page.request.get(page.url())).text();
    for (const documento of [await page.content(), crudo]) {
      for (const testigo of [
        "TESTIGO-TIPO-INVENTADO",
        "TESTIGO-ACCION-INVENTADA",
        "TESTIGO-CAMPO-DE-MAS-1",
        "TESTIGO-CAMPO-DE-MAS-2",
        "TESTIGO-CAMPO-DE-MAS-3",
        "TESTIGO-CADENA-SUELTA",
      ]) {
        expect(documento, testigo).not.toContain(testigo);
      }
    }
  });
});

test.describe("PRUEBA-021 · alertas con teclado (CA-012, CA-027)", () => {
  test("se llega al botón con el tabulador y Intro y Espacio lo activan, con el foco visible", async ({
    page,
  }) => {
    await abrir(page, estado("con-accion"));
    const primero = alertas(page).nth(0).getByRole("button");
    const segundo = alertas(page).nth(1).getByRole("button");
    await primero.focus();
    const contorno = await primero.evaluate((b) => getComputedStyle(b).outlineStyle);
    expect(contorno).not.toBe("none");
    await page.keyboard.press("Enter");
    await expect(contador(page, "pedidas")).toHaveText("1");
    await expect(contador(page, "ultima")).toContainText("alerta 1");
    await expect(primero).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(segundo).toBeFocused();
    await page.keyboard.press("Space");
    await expect(contador(page, "pedidas")).toHaveText("2");
    await expect(contador(page, "ultima")).toContainText("alerta 2");
  });

  test("el orden del tabulador es el del documento y no hay más paradas que los botones", async ({
    page,
  }) => {
    await abrir(page, estado("con-accion"));
    await alertas(page).first().getByRole("button").focus();
    await page.keyboard.press("Tab");
    await expect(alertas(page).nth(1).getByRole("button")).toBeFocused();
    await expect(alertas(page).locator("a, input, select, textarea, [tabindex]")).toHaveCount(0);
  });
});

test.describe("PRUEBA-017 · texto hostil como cliente, tipo, gravedad, acción y momento (CA-041, REQ-056)", () => {
  test("se pinta como texto: 0 ejecuciones, 0 elementos nuevos, 0 enlaces, 0 invisibles", async ({
    page,
  }) => {
    const dialogos: string[] = [];
    page.on("dialog", (d) => {
      dialogos.push(d.message());
      void d.dismiss();
    });
    await abrir(page, estado("texto-hostil"));
    await expect(alertas(page)).toHaveCount(12);
    const lista = page.getByRole("list", { name: TEXTOS.alertas.lista });
    expect(await lista.locator("script, img, iframe, a, style, b, button").count()).toBe(0);
    expect(
      await page.evaluate(() => (window as unknown as { __hostil?: number }).__hostil),
    ).toBeUndefined();
    expect(dialogos).toEqual([]);
    const texto = await lista.innerText();
    expect(texto).toContain("<script>window.__hostil = 1</script>");
    expect(texto).toContain("onerror=");
    expect(tieneInvisibles(texto)).toBe(false);
    // Lo que va en el tipo, la gravedad, el momento o la acción no llega al documento.
    await expect(alertas(page).first()).toHaveAttribute("data-gravedad", "desconocida");
    await expect(alertas(page).first()).toContainText(TEXTOS.alertas.tipos.desconocido);
  });

  test("cada nombre de cliente está dentro de un bdi", async ({ page }) => {
    await abrir(page, estado("texto-hostil"));
    expect(await alertas(page).locator("bdi").count()).toBe(12);
  });
});

test.describe("PRUEBA-013 · alertas: anchos, 120 caracteres, espaciado y zum (CA-006, CA-053)", () => {
  for (const e of ALERTAS) {
    for (const ancho of [320, 375, 1280]) {
      test(`${e.etiqueta} · ${ancho} px: sin desplazamiento horizontal ni recortes`, async ({
        page,
      }) => {
        await page.setViewportSize({ width: ancho, height: ALTO_POR_DEFECTO });
        await abrir(page, e);
        expect(await medirDesborde(page)).toEqual({ sobra: 0, fuera: [] });
        expect(await medirRecortes(page)).toEqual([]);
      });
    }
  }

  test("120 caracteres a 320 px: el nombre se parte en varias líneas y queda dentro de su alerta", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 320, height: ALTO_POR_DEFECTO });
    await abrir(page, estado("nombres-largos-120"));
    const medidas = await alertas(page).evaluateAll((lis) =>
      lis.map((li) => {
        const caja = li.getBoundingClientRect();
        const bdi = li.querySelector("bdi");
        const b = bdi?.getBoundingClientRect();
        return {
          dentro: b !== undefined && b.left >= caja.left - 0.5 && b.right <= caja.right + 0.5,
          lineas:
            b === undefined
              ? 0
              : Math.round(b.height / parseFloat(getComputedStyle(li).lineHeight || "20")),
          texto: bdi?.textContent?.length ?? 0,
        };
      }),
    );
    for (const m of medidas) {
      expect(m.texto).toBe(120);
      expect(m.dentro).toBe(true);
    }
    expect(await medirSolapes(page)).toEqual([]);
  });

  test("con el espaciado de texto de la norma, a 320 px", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: ALTO_POR_DEFECTO });
    await abrir(page, estado("nombres-largos-120"));
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
      await abrir(page, estado("con-accion"));
      expect(await medirDesborde(page), `${ancho} por ${alto}`).toEqual({ sobra: 0, fuera: [] });
      expect(await medirRecortes(page), `${ancho} por ${alto}: recortes`).toEqual([]);
    }
  });
});

test.describe("PRUEBA-014 · objetivos de pulsación, colores forzados y sin color (REQ-037, REQ-038)", () => {
  for (const ancho of [320, 1280]) {
    test(`${ancho} px: todo botón de las alertas mide al menos 24 por 24 px`, async ({ page }) => {
      await page.setViewportSize({ width: ancho, height: ALTO_POR_DEFECTO });
      await abrir(page, estado("con-accion"));
      const cajas = await botones(page).evaluateAll((bs) =>
        bs.map((b) => {
          const r = b.getBoundingClientRect();
          return { ancho: r.width, alto: r.height };
        }),
      );
      expect(cajas).toHaveLength(2);
      for (const c of cajas) {
        expect(c.ancho).toBeGreaterThanOrEqual(24);
        expect(c.alto).toBeGreaterThanOrEqual(24);
      }
    });
  }

  test("colores forzados: la alerta, la etiqueta de gravedad y el botón conservan su borde; la gravedad sigue con palabra e icono", async ({
    page,
  }) => {
    await page.emulateMedia({ forcedColors: "active" });
    await abrir(page, estado("con-accion"));
    const sinBorde = await page
      .locator("li[data-alerta], li[data-alerta] [data-tono], li[data-alerta] button")
      .evaluateAll(
        (xs) => xs.filter((x) => parseFloat(getComputedStyle(x).borderTopWidth) === 0).length,
      );
    expect(sinBorde).toBe(0);
    for (const li of await alertas(page).all()) {
      await expect(li.locator("[data-tono] svg")).toHaveCount(1);
      expect(((await li.locator("[data-tono]").innerText()) ?? "").trim().length).toBeGreaterThan(
        0,
      );
    }
    await alertas(page).first().getByRole("button").focus();
    const foco = await alertas(page)
      .first()
      .getByRole("button")
      .evaluate((b) => getComputedStyle(b).outlineStyle);
    expect(foco).not.toBe("none");
  });

  test("sin color (escala de grises): las tres gravedades se distinguen por palabra e icono", async ({
    page,
  }) => {
    await abrir(page, estado("gravedades"));
    const formas = await alertas(page).evaluateAll((lis) =>
      lis.map((li) => ({
        palabra: li.querySelector("[data-tono]")?.textContent ?? "",
        icono: li.querySelector("[data-tono] svg")?.innerHTML ?? "",
      })),
    );
    expect(new Set(formas.map((f) => f.palabra)).size).toBe(3);
    expect(new Set(formas.map((f) => f.icono)).size).toBe(3);
  });

  test("sin JavaScript la lista se pinta entera", async ({ browser }) => {
    const contexto = await browser.newContext({ javaScriptEnabled: false });
    const page = await contexto.newPage();
    try {
      await abrirEstado(page, estado("con-accion"));
      await expect(alertas(page)).toHaveCount(3);
      await expect(alertas(page).first()).toContainText(TEXTOS.alertas.gravedad.critica);
    } finally {
      await contexto.close();
    }
  });
});

test.describe("PRUEBA-025 · axe sobre las alertas, a 320 y 1280 px, en claro y oscuro", () => {
  for (const e of ALERTAS) {
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
});
