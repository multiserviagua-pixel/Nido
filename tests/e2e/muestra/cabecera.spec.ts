// PRUEBA-012 (título, cuenta, periodo) y PRUEBA-018 (periodo y cuenta en la dirección) de
// T-010 (c), sobre las entradas `armazon-*` del inventario, en Chromium y con teclas reales.
// CA-004, CA-044, CA-049, CA-027 (foco no oculto por la cabecera); REQ-005, REQ-006, REQ-036,
// REQ-058, REQ-059, REQ-065, REQ-083. Los controles sembrados del final hacen fallar cada medida
// a propósito: una medida que no puede fallar no prueba nada.
import { expect, test, type Locator, type Page } from "@playwright/test";
import { TEXTOS } from "../../../src/components/textos";
import { abrirEstado, estadosDe, type EstadoDePrueba } from "./apoyo/estados";
import { ALTO_POR_DEFECTO } from "./configuracion-interfaz";

const ARMAZONES = estadosDe(/^armazon/);
const CON_PERIODO = ARMAZONES.filter((e) => e.estado === "con-periodo");
const SIN_PERIODO = ARMAZONES.filter((e) => e.estado !== "con-periodo");
const NOMBRE_NORMAL = "Usuario Ficticio";

const botonCuenta = (page: Page): Locator =>
  page.locator(`header button[aria-haspopup='dialog'][aria-label^='${TEXTOS.cuenta.abrir}:']`);
const panelCuenta = (page: Page): Locator =>
  page.getByRole("dialog", { name: TEXTOS.cuenta.titulo });
const selector = (page: Page): Locator => page.getByLabel(TEXTOS.periodo.etiqueta, { exact: true });

/** Nombre de la cuenta que debe verse en un estado (los ficticios de `_vistas/armazon.tsx`). */
function nombreEsperado(e: EstadoDePrueba): { largo: boolean; conEspacios: boolean } {
  return {
    largo: e.estado === "nombre-largo-120" || e.estado === "cuenta-120-con-espacios",
    conEspacios: e.estado === "cuenta-120-con-espacios",
  };
}

async function abrirEnAncho(page: Page, e: EstadoDePrueba, ancho: number, alto = 667, ruta = "") {
  await page.setViewportSize({ width: ancho, height: alto });
  if (ruta === "") await abrirEstado(page, e);
  else {
    const respuesta = await page.goto(`${e.ruta}${ruta}`);
    expect(respuesta?.status()).toBe(200);
  }
  // Next hidrata los botones después de pintarlos: se espera a que respondan.
  await page.waitForLoadState("networkidle");
}

const sinDesplazamientoHorizontal = (page: Page) =>
  page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth);

/** Anuncios de la región cortés, con todo lo que se escribió en ella desde la carga. */
async function vigilarAnuncios(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const w = window as unknown as { __anuncios: string[] };
    w.__anuncios = [];
    new MutationObserver(() => {
      const r = document.querySelector('[data-anunciador="cortes"]');
      const t = (r?.textContent ?? "").trim();
      if (t !== "" && w.__anuncios[w.__anuncios.length - 1] !== t) w.__anuncios.push(t);
    }).observe(document, { subtree: true, childList: true, characterData: true });
  });
}
const anuncios = (page: Page) =>
  page.evaluate(() => (window as unknown as { __anuncios: string[] }).__anuncios ?? []);

for (const estado of ARMAZONES) {
  test.describe(`PRUEBA-012 · cabecera · ${estado.etiqueta}`, () => {
    test("el título visible es el h1, único y dentro de la cabecera; la cuenta está en la cabecera", async ({
      page,
    }) => {
      await abrirEstado(page, estado);
      await expect(page.locator("h1")).toHaveCount(1);
      await expect(page.locator("header h1")).toHaveCount(1);
      await expect(botonCuenta(page)).toHaveCount(1);
      const titulo = (await page.locator("h1").innerText()).trim();
      expect(await page.title()).toBe(`${titulo} · ${TEXTOS.marca.nombreProducto}`);
      // El título no lleva datos: ni el nombre de la cuenta ni el del cliente.
      expect(titulo).not.toContain(NOMBRE_NORMAL);
      expect(titulo).not.toContain("Ficticios");
      expect(titulo).not.toContain("Ficticio".repeat(2));
    });

    test("la cuenta se alcanza en un paso a 320 px, abre un panel con el nombre completo y Escape devuelve el foco", async ({
      page,
    }) => {
      await abrirEnAncho(page, estado, 320);
      const boton = botonCuenta(page);
      await expect(boton).toBeVisible();
      const caja = await boton.boundingBox();
      expect(caja!.x, "el botón empieza dentro de la ventana").toBeGreaterThanOrEqual(0);
      expect(caja!.x + caja!.width, "y acaba dentro de ella").toBeLessThanOrEqual(320);
      await expect(boton).toHaveAccessibleName(new RegExp(`^${TEXTOS.cuenta.abrir}:`));
      await expect(boton).toHaveAttribute("aria-expanded", "false");
      await boton.click();
      await expect(panelCuenta(page)).toBeVisible();
      await expect(boton).toHaveAttribute("aria-expanded", "true");
      const { largo, conEspacios } = nombreEsperado(estado);
      const nombre = (await panelCuenta(page).locator("bdi").innerText()).trim();
      if (largo) {
        expect(nombre, "nombre completo de 120 caracteres").toHaveLength(120);
        expect(/\s/.test(nombre)).toBe(conEspacios);
      } else {
        expect(nombre).toBe(NOMBRE_NORMAL);
      }
      expect(await sinDesplazamientoHorizontal(page), "sin desplazamiento horizontal").toBe(true);
      await page.keyboard.press("Escape");
      await expect(panelCuenta(page)).toHaveCount(0);
      await expect(boton).toBeFocused();
    });

    test("1280 px: el botón de la cuenta puede acortar el nombre, pero el documento y el panel lo llevan entero", async ({
      page,
    }) => {
      await abrirEnAncho(page, estado, 1280, ALTO_POR_DEFECTO);
      const boton = botonCuenta(page);
      const { largo } = nombreEsperado(estado);
      const medidas = await page.evaluate(() => {
        const h = document.querySelector("header")!.getBoundingClientRect();
        const b = document.querySelector("header button[aria-label^='Cuenta:']")!;
        return {
          cabecera: h.width,
          boton: b.getBoundingClientRect().width,
          texto: b.getAttribute("aria-label"),
        };
      });
      expect(medidas.boton, "el botón no se come la cabecera").toBeLessThanOrEqual(
        medidas.cabecera / 2,
      );
      if (largo) {
        expect(medidas.texto!.length, "nombre entero en el nombre accesible").toBeGreaterThan(120);
      }
      await boton.click();
      const panel = panelCuenta(page);
      await expect(panel).toBeVisible();
      expect(await sinDesplazamientoHorizontal(page)).toBe(true);
      // Nada se sale del panel: el texto del nombre cabe en su ancho.
      const cabe = await panel.evaluate((p) => p.scrollWidth <= p.clientWidth);
      expect(cabe, "el nombre se parte en líneas, no se desborda").toBe(true);
    });

    test("el panel de la cuenta atrapa el foco, lleva sus acciones como enlaces y se cierra con su botón", async ({
      page,
    }) => {
      await abrirEnAncho(page, estado, 375);
      await botonCuenta(page).click();
      const panel = panelCuenta(page);
      await expect(panel).toBeVisible();
      for (let i = 0; i < 6; i++) {
        await page.keyboard.press("Tab");
        const dentro = await page.evaluate(
          () =>
            document.querySelector('[role="dialog"]')?.contains(document.activeElement) ?? false,
        );
        expect(dentro, `foco dentro del panel tras ${i + 1} tabuladores`).toBe(true);
      }
      await expect(panel.getByRole("link", { name: TEXTOS.cuenta.cerrarSesion })).toBeVisible();
      await panel.getByRole("button", { name: TEXTOS.cuenta.cerrar }).click();
      await expect(panelCuenta(page)).toHaveCount(0);
      await expect(botonCuenta(page)).toBeFocused();
    });

    test("la cabecera queda fija arriba al desplazar y reserva su alto", async ({ page }) => {
      await abrirEnAncho(page, estado, 375);
      await page.evaluate(() => {
        const m = document.querySelector("main")!;
        const relleno = document.createElement("div");
        relleno.style.height = "3000px";
        m.appendChild(relleno);
      });
      await page.evaluate(() => window.scrollTo(0, 1200));
      const r = await page.evaluate(() => {
        const h = document.querySelector("header")!.getBoundingClientRect();
        return {
          arriba: h.top,
          alto: h.height,
          sp: getComputedStyle(document.documentElement).scrollPaddingTop,
        };
      });
      expect(r.arriba, "la cabecera sigue arriba").toBe(0);
      expect(
        parseFloat(r.sp),
        "scroll-padding-top reserva el alto de la cabecera",
      ).toBeGreaterThanOrEqual(r.alto);
    });
  });
}

test.describe("PRUEBA-012 · lo que añade T-010 (c)", () => {
  test("el selector de periodo aparece solo en los estados que lo declaran", async ({ page }) => {
    expect(CON_PERIODO.length, "estados con selector").toBeGreaterThanOrEqual(2);
    for (const e of SIN_PERIODO) {
      await abrirEstado(page, e);
      await expect(page.locator("select"), e.etiqueta).toHaveCount(0);
    }
    for (const e of CON_PERIODO) {
      await abrirEstado(page, e);
      await expect(selector(page), e.etiqueta).toBeVisible();
      await expect(page.locator("select"), e.etiqueta).toHaveCount(1);
    }
  });
});

for (const estado of CON_PERIODO) {
  test.describe(`PRUEBA-012 · selector de periodo · ${estado.etiqueta}`, () => {
    test("control nativo con etiqueta visible, lista cerrada y el periodo con palabras y fechas al lado", async ({
      page,
    }) => {
      await abrirEnAncho(page, estado, 1280, ALTO_POR_DEFECTO);
      const s = selector(page);
      await expect(page.getByText(TEXTOS.periodo.etiqueta, { exact: true })).toBeVisible();
      await expect(s.locator("option")).toHaveText([
        TEXTOS.periodo.ultimos7Dias,
        TEXTOS.periodo.ultimos30Dias,
        TEXTOS.periodo.ultimos90Dias,
      ]);
      await expect(s).toHaveValue("ultimos-30-dias");
      await expect(page.getByText("Últimos 30 días · 14 oct – 12 nov 2026")).toBeVisible();
      expect((await s.boundingBox())!.height).toBeGreaterThanOrEqual(24);
    });

    test("cambiarlo con el teclado actualiza todas las cifras, lo escribe en la dirección, lo anuncia y deja el foco en el selector", async ({
      page,
    }) => {
      await vigilarAnuncios(page);
      await abrirEnAncho(page, estado, 1280, ALTO_POR_DEFECTO);
      const cifras = () => page.locator("[data-cifra]").allInnerTexts();
      const antes = await cifras();
      expect(antes.length, "cifras de la vista").toBe(3);
      await page.evaluate(() => {
        (window as unknown as { __marca: string }).__marca = "sin-recarga";
      });
      await selector(page).focus();
      await page.keyboard.press("ArrowUp");
      await page.waitForURL(/\?periodo=ultimos-7-dias$/);
      await expect(selector(page)).toHaveValue("ultimos-7-dias");
      const despues = await cifras();
      antes.forEach((valor, i) => expect(despues[i], `cifra ${i + 1}`).not.toBe(valor));
      await expect(selector(page)).toBeFocused();
      expect(
        await page.evaluate(() => (window as unknown as { __marca?: string }).__marca),
        "el cambio no recarga la página",
      ).toBe("sin-recarga");
      await expect(page.getByText("Últimos 7 días · 6 nov – 12 nov 2026")).toBeVisible();
      await expect
        .poll(async () => (await anuncios(page)).join("|"))
        .toContain(`${TEXTOS.periodo.anuncio} Últimos 7 días · 6 nov – 12 nov 2026`);
      // Dirección: solo el periodo, nada más.
      const url = new URL(page.url());
      expect([...url.searchParams.keys()]).toEqual(["periodo"]);
      expect(url.hash).toBe("");
      // Volver al valor por defecto deja la dirección sin parámetro.
      await selector(page).selectOption("ultimos-30-dias");
      await page.waitForURL((u) => u.search === "");
      await expect(selector(page)).toHaveValue("ultimos-30-dias");
    });

    test("recargar o llegar por una dirección con periodo lo respeta, sin anunciar nada, y Atrás vuelve a la página anterior como estaba", async ({
      page,
    }) => {
      await vigilarAnuncios(page);
      await abrirEnAncho(page, estado, 1280, ALTO_POR_DEFECTO);
      await abrirEnAncho(page, estado, 1280, ALTO_POR_DEFECTO, "?periodo=ultimos-90-dias");
      await expect(selector(page)).toHaveValue("ultimos-90-dias");
      await page.reload();
      await page.waitForLoadState("networkidle");
      await expect(selector(page)).toHaveValue("ultimos-90-dias");
      await page.waitForTimeout(800);
      expect(await anuncios(page)).toEqual([]);
      await expect(selector(page)).not.toBeFocused();
      // Atrás: el cambio de periodo no deja entradas en el historial, así que vuelve a la anterior.
      await page.goBack();
      await page.waitForLoadState("networkidle");
      expect(new URL(page.url()).search).toBe("");
      await expect(selector(page)).toHaveValue("ultimos-30-dias");
    });

    test("el cambio mantiene el estado del enrutador de Next: history.state conserva su árbol y una actualización del enrutador no borra ?periodo=", async ({
      page,
    }) => {
      await abrirEnAncho(page, estado, 1280, ALTO_POR_DEFECTO);
      await selector(page).selectOption("ultimos-90-dias");
      await page.waitForURL(/\?periodo=ultimos-90-dias$/);
      const estadoDeHistorial = await page.evaluate(() => {
        const e = window.history.state as Record<string, unknown> | null;
        return {
          na: e?.__NA === true,
          arbol: e?.__PRIVATE_NEXTJS_INTERNALS_TREE !== undefined,
        };
      });
      expect(estadoDeHistorial, "history.state conserva el estado interno del enrutador").toEqual({
        na: true,
        arbol: true,
      });
      // Una actualización del enrutador (la que hace una acción de servidor o router.refresh())
      // reescribe la dirección con la que él tiene como canónica: debe seguir llevando el periodo.
      const respuestas: string[] = [];
      page.on("response", (r) => respuestas.push(r.url()));
      await page.evaluate(() =>
        (window as unknown as { next: { router: { refresh(): void } } }).next.router.refresh(),
      );
      await expect.poll(() => respuestas.length, { timeout: 5000 }).toBeGreaterThan(0);
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(500);
      expect(new URL(page.url()).search).toBe("?periodo=ultimos-90-dias");
      await expect(selector(page)).toHaveValue("ultimos-90-dias");
    });

    test("a 320 px el selector se ve entero, se maneja y no hay desplazamiento horizontal", async ({
      page,
    }) => {
      await abrirEnAncho(page, estado, 320);
      const s = selector(page);
      await expect(s).toBeVisible();
      const caja = (await s.boundingBox())!;
      expect(caja.x + caja.width).toBeLessThanOrEqual(320);
      expect(await sinDesplazamientoHorizontal(page)).toBe(true);
    });
  });

  test.describe(`PRUEBA-018 · periodo y cuenta en la dirección · ${estado.etiqueta}`, () => {
    test("un valor fuera de la lista, un texto o un parámetro repetido vuelven al valor por defecto y no se pintan", async ({
      page,
    }) => {
      for (const consulta of [
        "?periodo=TESTIGO-NOMBRE-018",
        "?periodo=%3Cimg%20src%3Dx%20onerror%3D1%3E",
        "?periodo=ultimos-7-dias&periodo=ultimos-90-dias",
        "?periodo=",
        "?q=Ana+Perez",
      ]) {
        await abrirEnAncho(page, estado, 1280, ALTO_POR_DEFECTO, consulta);
        await expect(selector(page), consulta).toHaveValue("ultimos-30-dias");
        // Sin los guiones de datos de Next, donde viaja la consulta (hallazgo H-1, red-y-direccion.spec.ts).
        const cuerpo = await page.evaluate(() => {
          const copia = document.body.cloneNode(true) as HTMLElement;
          copia.querySelectorAll("script").forEach((e) => e.remove());
          return copia.outerHTML;
        });
        expect(cuerpo, consulta).not.toContain("TESTIGO-NOMBRE-018");
        expect(cuerpo, consulta).not.toContain("Ana Perez");
        expect(await page.locator("img[src='x']").count(), consulta).toBe(0);
      }
    });

    test("al cambiar el periodo se descartan los demás parámetros de la dirección", async ({
      page,
    }) => {
      await abrirEnAncho(
        page,
        estado,
        1280,
        ALTO_POR_DEFECTO,
        "?q=Ana+Perez&periodo=ultimos-7-dias",
      );
      await selector(page).selectOption("ultimos-90-dias");
      await page.waitForURL(/periodo=ultimos-90-dias/);
      expect([...new URL(page.url()).searchParams.keys()]).toEqual(["periodo"]);
      await selector(page).selectOption("ultimos-30-dias");
      await page.waitForURL((u) => u.search === "");
      expect([...new URL(page.url()).searchParams.keys()]).toEqual([]);
    });

    test("parámetros de usuario o de cliente añadidos no cambian la cuenta ni el contexto", async ({
      page,
    }) => {
      await abrirEnAncho(page, estado, 1280, ALTO_POR_DEFECTO);
      const base = {
        titulo: await page.locator("h1").innerText(),
        cuenta: await botonCuenta(page).getAttribute("aria-label"),
        cifras: await page.locator("[data-cifra]").allInnerTexts(),
      };
      await abrirEnAncho(
        page,
        estado,
        1280,
        ALTO_POR_DEFECTO,
        "?usuario=otro&cuenta=Otra+Persona&cliente=00000000-0000-4000-8000-000000000000&rol=superadmin",
      );
      expect(await page.locator("h1").innerText()).toBe(base.titulo);
      expect(await botonCuenta(page).getAttribute("aria-label")).toBe(base.cuenta);
      expect(await page.locator("[data-cifra]").allInnerTexts()).toEqual(base.cifras);
      await botonCuenta(page).click();
      await expect(panelCuenta(page).locator("bdi")).toHaveText(NOMBRE_NORMAL);
      expect(await page.locator("body").innerText()).not.toContain("Otra Persona");
    });

    test("el cambio de periodo y la cuenta no guardan nada en el navegador", async ({ page }) => {
      await abrirEnAncho(page, estado, 1280, ALTO_POR_DEFECTO);
      await botonCuenta(page).click();
      await page.keyboard.press("Escape");
      await selector(page).selectOption("ultimos-90-dias");
      await page.waitForURL(/\?periodo=ultimos-90-dias$/);
      await page.waitForLoadState("networkidle");
      const almacen = await page.evaluate(async () => ({
        local: localStorage.length,
        sesion: sessionStorage.length,
        galletas: document.cookie,
        bases: ((await indexedDB.databases?.()) ?? []).length,
      }));
      expect(almacen).toEqual({ local: 0, sesion: 0, galletas: "", bases: 0 });
    });
  });
}

test.describe("PRUEBA-012 · foco que no queda debajo de la cabecera fija (REQ-036, CA-027)", () => {
  /** Reparte botones por el cuerpo, sube con Mayúsculas+Tab y devuelve los que quedan tapados. */
  async function botonesTapadosAlSubir(page: Page): Promise<string[]> {
    await page.evaluate(() => {
      const m = document.querySelector("main")!;
      for (let i = 0; i < 30; i++) {
        const b = document.createElement("button");
        b.type = "button";
        b.textContent = `Relleno ${i}`;
        b.style.display = "block";
        b.style.marginBottom = "80px";
        m.appendChild(b);
      }
      window.scrollTo(0, document.documentElement.scrollHeight);
      (m.lastElementChild as HTMLElement).focus();
    });
    const tapados: string[] = [];
    for (let i = 0; i < 25; i++) {
      await page.keyboard.press("Shift+Tab");
      const r = await page.evaluate(() => {
        const a = document.activeElement as HTMLElement;
        const caja = a.getBoundingClientRect();
        const cab = document.querySelector("header")!.getBoundingClientRect();
        return { texto: a.textContent ?? "", arriba: caja.top, baja: cab.bottom };
      });
      if (r.texto.startsWith("Relleno") && r.arriba < r.baja) tapados.push(r.texto);
    }
    return tapados;
  }

  for (const ancho of [320, 1280]) {
    test(`a ${ancho} px, subiendo con el teclado el foco nunca queda debajo de la cabecera`, async ({
      page,
    }) => {
      await abrirEnAncho(page, ARMAZONES[0]!, ancho, 640);
      expect(await botonesTapadosAlSubir(page)).toEqual([]);
    });
  }

  /** Posición y alto de la cabecera, para saber si es fija y cuánta ventana ocupa. */
  const medirCabecera = (page: Page) =>
    page.evaluate(() => {
      const h = document.querySelector("header")!;
      return {
        fija: getComputedStyle(h).position === "sticky",
        alto: h.getBoundingClientRect().height,
        reserva: getComputedStyle(document.documentElement).scrollPaddingTop,
      };
    });

  // MAYOR 2 de la revisión: con 173 px de cabecera fija, en 320×200 quedaban ~27 px de contenido.
  // Solo es fija con 38 rem (608 px) de alto o más, y entonces no pasa del 40 % de la ventana.
  // El umbral lo debe validar `disenador-ui`.
  const CASOS_BAJOS = [CON_PERIODO[0]!, ARMAZONES.find((e) => e.estado === "nombre-largo-120")!];
  for (const e of CASOS_BAJOS) {
    for (const alto of [200, 256, 512, 608]) {
      test(`320×${alto} · ${e.etiqueta}: el foco no queda tapado y la cabecera fija no pasa del 40 % de la ventana`, async ({
        page,
      }) => {
        await abrirEnAncho(page, e, 320, alto);
        const c = await medirCabecera(page);
        expect(c.fija, "fija solo con 608 px de alto o más").toBe(alto >= 608);
        if (c.fija) {
          expect(c.alto / alto, "parte de la ventana que ocupa").toBeLessThanOrEqual(0.4);
          expect(parseFloat(c.reserva)).toBeGreaterThanOrEqual(c.alto);
        } else {
          expect(c.reserva, "sin cabecera fija no se reserva nada").toBe("auto");
        }
        expect(await botonesTapadosAlSubir(page)).toEqual([]);
      });
    }
  }

  test("control sembrado: una cabecera fija en una ventana de 200 px de alto pasa del 40 % y la medida lo ve", async ({
    page,
  }) => {
    await abrirEnAncho(page, CON_PERIODO[0]!, 320, 200);
    await page.addStyleTag({ content: "header{position:sticky !important;top:0 !important}" });
    const c = await medirCabecera(page);
    expect(c.fija).toBe(true);
    expect(c.alto / 200).toBeGreaterThan(0.4);
  });

  test("control sembrado: sin el scroll-padding-top que reserva la cabecera, la medida ve botones tapados", async ({
    page,
  }) => {
    await abrirEnAncho(page, ARMAZONES[0]!, 320, 640);
    await page.evaluate(() => document.documentElement.style.removeProperty("scroll-padding-top"));
    await page.addStyleTag({ content: "html{scroll-padding-top:0 !important}" });
    expect((await botonesTapadosAlSubir(page)).length).toBeGreaterThan(0);
  });
});

test.describe("PRUEBA-012 · controles sembrados de la cuenta y el periodo", () => {
  test("un nombre de cuenta que se desborda del panel haría fallar la medida de «cabe»", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: ALTO_POR_DEFECTO });
    await page.setContent(
      `<div id="p" style="width:100px;overflow:auto"><span style="white-space:nowrap">${"A".repeat(120)}</span></div>`,
    );
    expect(await page.locator("#p").evaluate((p) => p.scrollWidth <= p.clientWidth)).toBe(false);
  });
});
