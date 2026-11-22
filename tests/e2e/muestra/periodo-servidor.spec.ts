// T-010 (e2) · cambio de periodo con `router.replace` sobre una vista que pinta el servidor
// (`/muestra/servidor/periodo`), en Chromium y con la respuesta de la navegación retenida o
// cortada. PRUEBA-012 (el cambio vuelve a pintar las cifras desde el servidor, sin recargar y con
// el foco en el select), PRUEBA-016 (los cuatro casos de «Cambio de periodo», punto 7: sin
// conexión, navegación abortada, en 500 y con el documento también abortado) y PRUEBA-034 (la respuesta de navegación lleva
// `Cache-Control: no-store`). CA-001, CA-016, CA-018, CA-043; REQ-006, REQ-058, REQ-059.
// Los controles sembrados del final hacen fallar a propósito cada medida: una medida que no puede
// fallar no prueba nada. Si PRUEBA-016 fallase, no se esconde (ni `test.fail` ni
// adaptar la espera): la tarea vuelve al arquitecto («Cambio de periodo», punto 7).
import { expect, test, type Locator, type Page, type Route } from "@playwright/test";
import { TEXTOS } from "../../../src/components/textos";

const RUTA = "/muestra/servidor/periodo";
const SIETE = "ultimos-7-dias";
const TREINTA = "ultimos-30-dias";
const NOVENTA = "ultimos-90-dias";

const selector = (page: Page): Locator => page.getByLabel(TEXTOS.periodo.etiqueta, { exact: true });
const zonaCifras = (page: Page): Locator => page.locator('[data-zona="cifras"]');
const cifrasVisibles = (page: Page): Promise<string[]> =>
  page.locator("[data-cifra]:visible").allInnerTexts();
const cifrasDelDocumento = (page: Page): Promise<string[]> =>
  page.locator("[data-cifra]").evaluateAll((e) => e.map((x) => x.textContent ?? ""));

const esNavegacion = (route: Route): boolean => route.request().headers()["rsc"] === "1";
const periodoDe = (url: string): string | null => new URL(url).searchParams.get("periodo");
const dormir = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));

async function abrir(page: Page, consulta = ""): Promise<void> {
  const respuesta = await page.goto(`${RUTA}${consulta}`);
  expect(respuesta?.status()).toBe(200);
  await expect(page.locator("h1")).toBeVisible();
  // Next hidrata los controles después de pintarlos: se espera a que respondan.
  await page.waitForLoadState("networkidle");
}

/** Cifras de referencia de un periodo, leídas de una carga completa aparte. */
async function cifrasDe(page: Page, clave: string): Promise<string[]> {
  const otra = await page.context().newPage();
  try {
    await abrir(otra, clave === TREINTA ? "" : `?periodo=${clave}`);
    return await cifrasDelDocumento(otra);
  } finally {
    await otra.close();
  }
}

/** Guarda cada anuncio de la región cortés: un texto no vacío que llega tras un vacío cuenta como
 * anuncio nuevo aunque sea igual al anterior (así los lectores vuelven a leerlo). Solo se funden
 * los avisos seguidos sin vaciado entre medias. */
async function vigilarAnuncios(page: Page, region: "cortes" | "urgente" = "cortes"): Promise<void> {
  await page.addInitScript((nombre) => {
    const w = window as unknown as Record<string, string[]>;
    const clave = nombre === "cortes" ? "__anuncios" : "__anunciosUrgentes";
    w[clave] = [];
    let vacia = true;
    new MutationObserver(() => {
      const r = document.querySelector(`[data-anunciador="${nombre}"]`);
      const t = (r?.textContent ?? "").trim();
      if (t === "") {
        vacia = true;
        return;
      }
      const lista = w[clave]!;
      if (vacia || lista[lista.length - 1] !== t) lista.push(t);
      vacia = false;
    }).observe(document, { subtree: true, childList: true, characterData: true });
  }, region);
}
const anuncios = (page: Page, region: "cortes" | "urgente" = "cortes"): Promise<string[]> =>
  page.evaluate(
    (nombre) =>
      (window as unknown as Record<string, string[]>)[
        nombre === "cortes" ? "__anuncios" : "__anunciosUrgentes"
      ] ?? [],
    region,
  );

test.describe("PRUEBA-012 · el cambio de periodo vuelve a pintar la vista en el servidor", () => {
  test("una petición de navegación con la clave nueva, sin recargar el documento, sin tocar el historial y con el foco en el select", async ({
    page,
  }) => {
    await vigilarAnuncios(page);
    await abrir(page);
    const antes = await cifrasVisibles(page);
    expect(antes).toHaveLength(3);
    const referencia7 = await cifrasDe(page, SIETE);

    const documentos: string[] = [];
    page.on("request", (r) => {
      if (r.resourceType() === "document") documentos.push(r.url());
    });
    const navegaciones: string[] = [];
    await page.route(
      (u) => u.pathname === RUTA,
      async (route) => {
        if (esNavegacion(route)) {
          navegaciones.push(route.request().url());
          await dormir(2000);
        }
        await route.continue();
      },
    );
    await page.evaluate(() => {
      (window as unknown as { __marca: string }).__marca = "sin-recarga";
    });
    const largoDelHistorial = await page.evaluate(() => window.history.length);
    const respuesta = page.waitForResponse(
      (r) => new URL(r.url()).pathname === RUTA && r.request().headers()["rsc"] === "1",
    );

    await selector(page).focus();
    await page.keyboard.press("ArrowUp");

    // Con la respuesta retenida: zona ocupada, «Cargando», ninguna cifra a la vista y el select ya
    // en el valor elegido.
    await expect(zonaCifras(page)).toHaveAttribute("aria-busy", "true");
    await expect(zonaCifras(page).locator('[data-estado="carga"]')).toContainText(
      TEXTOS.bloque.cargando,
    );
    expect(await cifrasVisibles(page), "cifras a la vista durante la carga").toEqual([]);
    await expect(page.locator('[data-zona="contenido"]')).toHaveAttribute("aria-busy", "true");
    await expect(selector(page)).toHaveValue(SIETE);
    await expect(selector(page)).toBeFocused();

    // Llega la respuesta: cifras del periodo nuevo, zona libre.
    const r = await respuesta;
    expect(r.headers()["cache-control"] ?? "", "PRUEBA-034: respuesta de navegación").toMatch(
      /no-store/,
    );
    await expect(zonaCifras(page)).not.toHaveAttribute("aria-busy", "true");
    await expect.poll(() => cifrasVisibles(page)).toEqual(referencia7);
    antes.forEach((valor, i) => expect(referencia7[i], `cifra ${i + 1}`).not.toBe(valor));

    expect(navegaciones).toHaveLength(1);
    expect(periodoDe(navegaciones[0]!)).toBe(SIETE);
    expect(documentos, "cargas completas del documento").toEqual([]);
    expect(await page.evaluate(() => (window as unknown as { __marca?: string }).__marca)).toBe(
      "sin-recarga",
    );
    expect(await page.evaluate(() => window.history.length)).toBe(largoDelHistorial);
    expect(new URL(page.url()).search).toBe(`?periodo=${SIETE}`);
    await expect(selector(page)).toHaveValue(SIETE);
    await expect(selector(page)).toBeFocused();
    await expect(page.getByText("Últimos 7 días · 6 nov – 12 nov 2026")).toBeVisible();

    // Se anuncia «Cargando» una vez y el periodo nuevo.
    const dichos = await anuncios(page);
    expect(dichos.filter((a) => a === TEXTOS.bloque.cargando)).toHaveLength(1);
    expect(dichos).toContain(`${TEXTOS.periodo.anuncio} Últimos 7 días · 6 nov – 12 nov 2026`);
  });

  test("dos cambios en menos de 300 ms dejan las cifras del último, aunque la respuesta del primero llegue después", async ({
    page,
  }) => {
    await abrir(page);
    const referencia90 = await cifrasDe(page, NOVENTA);
    const referencia7 = await cifrasDe(page, SIETE);
    expect(referencia90).not.toEqual(referencia7);
    // La del primero (7 días) tarda más que la del segundo (90 días).
    await page.route(
      (u) => u.pathname === RUTA,
      async (route) => {
        if (esNavegacion(route)) {
          await dormir(periodoDe(route.request().url()) === SIETE ? 1800 : 300);
        }
        await route.continue();
      },
    );
    await selector(page).selectOption(SIETE);
    await page.waitForTimeout(100);
    await selector(page).selectOption(NOVENTA);
    await expect(selector(page)).toHaveValue(NOVENTA);
    await expect.poll(() => cifrasVisibles(page), { timeout: 10_000 }).toEqual(referencia90);
    // Pasada la respuesta lenta del primero, no se pisa lo que se ve.
    await page.waitForTimeout(2500);
    expect(await cifrasVisibles(page)).toEqual(referencia90);
    await expect(selector(page)).toHaveValue(NOVENTA);
    expect(new URL(page.url()).search).toBe(`?periodo=${NOVENTA}`);
    await expect(zonaCifras(page)).not.toHaveAttribute("aria-busy", "true");
  });

  test("volver al periodo por defecto quita el parámetro y repinta desde el servidor", async ({
    page,
  }) => {
    await abrir(page, `?periodo=${SIETE}`);
    const referencia30 = await cifrasDe(page, TREINTA);
    await selector(page).selectOption(TREINTA);
    await page.waitForURL((u) => u.search === "");
    await expect.poll(() => cifrasVisibles(page)).toEqual(referencia30);
    await expect(selector(page)).toHaveValue(TREINTA);
  });

  test("Atrás tras un cambio vuelve a la página anterior y no deja entradas de periodo", async ({
    page,
  }) => {
    await abrir(page);
    await page.goto("/muestra");
    await page.goto(RUTA);
    await page.waitForLoadState("networkidle");
    await selector(page).selectOption(SIETE);
    await page.waitForURL(/\?periodo=ultimos-7-dias$/);
    await page.goBack();
    await page.waitForLoadState("networkidle");
    expect(new URL(page.url()).pathname).toBe("/muestra");
  });
});

test.describe("PRUEBA-034 · la vista de servidor responde sin caché", () => {
  test("la carga completa y la petición de navegación llevan Cache-Control: no-store", async ({
    page,
  }) => {
    const completa = await page.goto(`${RUTA}?periodo=${SIETE}`);
    expect(completa?.headers()["cache-control"] ?? "").toMatch(/no-store/);
    const rsc = await page.request.get(`${RUTA}?periodo=${NOVENTA}&_rsc=prueba`, {
      headers: { RSC: "1" },
    });
    expect(rsc.status()).toBe(200);
    expect(rsc.headers()["cache-control"] ?? "").toMatch(/no-store/);
  });

  test("una dirección con otro periodo, otros parámetros o la identidad no cambia la vista pedida", async ({
    page,
  }) => {
    const base = await (await page.request.get(RUTA)).text();
    for (const q of [
      "?periodo=TESTIGO-NOMBRE-034",
      "?usuario=otro&cliente=00000000-0000-4000-8000-000000000000&rol=superadmin",
    ]) {
      // Sin los guiones de datos de Next, donde viaja la consulta (hallazgo H-1, red-y-direccion.spec.ts).
      const cuerpo = (await (await page.request.get(`${RUTA}${q}`)).text()).replace(
        /<script[\s\S]*?<\/script>/g,
        "",
      );
      expect(cuerpo).not.toContain("TESTIGO-NOMBRE-034");
      expect(cuerpo).not.toContain("superadmin");
      expect(cuerpo.includes(TEXTOS.cuenta.abrir)).toBe(base.includes(TEXTOS.cuenta.abrir));
    }
  });
});

test.describe("PRUEBA-016 · el cambio de periodo cuando la navegación falla («Cambio de periodo», punto 7)", () => {
  const largoDelHistorial = (page: Page): Promise<number> =>
    page.evaluate(() => window.history.length);
  /** Cuenta las peticiones a la ruta (el control sembrado comprueba que cuenta también una hecha
   * desde la página). */
  function contarPeticiones(page: Page): { valor: () => number } {
    let n = 0;
    page.on("request", (r) => {
      if (new URL(r.url()).pathname === RUTA) n += 1;
    });
    return { valor: () => n };
  }

  test("(1) navegador sin conexión: no se navega, el select sigue y se avisa; al volver la conexión el aviso se retira y el cambio navega", async ({
    page,
    context,
  }) => {
    await vigilarAnuncios(page);
    await abrir(page);
    const anteriores = await cifrasVisibles(page);
    const referencia7 = await cifrasDe(page, SIETE);
    const peticiones = contarPeticiones(page);
    const url = page.url();
    const largo = await largoDelHistorial(page);

    await context.setOffline(true);
    expect(await page.evaluate(() => navigator.onLine), "navigator.onLine sin red").toBe(false);
    await selector(page).focus();
    await page.keyboard.press("ArrowUp");

    const aviso = page.getByText(TEXTOS.periodo.sinConexion, { exact: true });
    await expect(aviso).toBeVisible();
    await page.waitForTimeout(1500);
    expect(peticiones.valor(), "peticiones a la ruta").toBe(0);
    expect(page.url()).toBe(url);
    expect(await largoDelHistorial(page)).toBe(largo);
    await expect(selector(page)).toHaveValue(TREINTA);
    await expect(selector(page)).toBeFocused();
    expect(await cifrasVisibles(page)).toEqual(anteriores);
    await expect(zonaCifras(page)).not.toHaveAttribute("aria-busy", "true");
    await expect(page.locator('[data-zona="contenido"]')).not.toHaveAttribute("aria-busy", "true");
    const dichos = await anuncios(page);
    expect(dichos.filter((a) => a === TEXTOS.periodo.sinConexion)).toHaveLength(1);
    expect(
      dichos.some((a) => a.startsWith(TEXTOS.periodo.anuncio)),
      "no anuncia el periodo",
    ).toBe(false);

    // Vuelve la conexión: el aviso se retira y el cambio navega.
    await context.setOffline(false);
    await expect(aviso).toHaveCount(0);
    await selector(page).selectOption(SIETE);
    await page.waitForURL((u) => periodoDe(u.toString()) === SIETE);
    await expect.poll(() => cifrasVisibles(page)).toEqual(referencia7);
    await expect(selector(page)).toHaveValue(SIETE);
    expect(peticiones.valor(), "ahora sí hay petición").toBeGreaterThan(0);
  });

  for (const [numero, nombre, cortar] of [
    [
      2,
      "petición de navegación abortada por red con el navegador en línea",
      (route: Route): Promise<void> => route.abort("internetdisconnected"),
    ],
    [
      3,
      "petición de navegación respondida con 500",
      (route: Route): Promise<void> =>
        route.fulfill({ status: 500, contentType: "text/plain", body: "" }),
    ],
  ] as const) {
    test(`(${numero}) ${nombre}: una carga completa a la dirección con la clave nueva, con sus cifras y el select del periodo nuevo`, async ({
      page,
    }) => {
      await abrir(page);
      const referencia7 = await cifrasDe(page, SIETE);
      const largo = await largoDelHistorial(page);
      expect(await page.evaluate(() => navigator.onLine)).toBe(true);
      const documentos: string[] = [];
      page.on("request", (r) => {
        if (r.resourceType() === "document") documentos.push(r.url());
      });
      await page.evaluate(() => {
        (window as unknown as { __marca: string }).__marca = "sin-recarga";
      });
      await page.route(
        (u) => u.pathname === RUTA,
        async (route) => {
          if (esNavegacion(route)) await cortar(route);
          else await route.continue();
        },
      );
      await selector(page).selectOption(SIETE);
      await expect.poll(() => documentos.length, { timeout: 15_000 }).toBe(1);
      expect(periodoDe(documentos[0]!)).toBe(SIETE);
      await page.waitForLoadState("networkidle");
      await expect(page.locator("h1")).toBeVisible();
      await expect(selector(page)).toHaveValue(SIETE);
      await expect.poll(() => cifrasVisibles(page)).toEqual(referencia7);
      expect(
        await page.evaluate(() => (window as unknown as { __marca?: string }).__marca),
        "el documento se ha cargado de nuevo",
      ).toBeUndefined();
      expect(await largoDelHistorial(page)).toBe(largo);
      expect(new URL(page.url()).search).toBe(`?periodo=${SIETE}`);
    });
  }

  test("(4) navegación y documento abortados: ninguna cifra en la página y, sin el corte, la recarga da la vista con el periodo nuevo y sus cifras", async ({
    page,
  }) => {
    await abrir(page);
    const referencia7 = await cifrasDe(page, SIETE);
    const manejador = async (route: Route): Promise<void> => {
      await route.abort("internetdisconnected");
    };
    // El mismo objeto al quitar la ruta: `unroute` compara por identidad, no por lo que hace.
    const esLaRuta = (u: URL): boolean => u.pathname === RUTA;
    await page.route(esLaRuta, manejador);
    const fallo = page.waitForEvent("requestfailed", {
      predicate: (r) => r.resourceType() === "document" && periodoDe(r.url()) === SIETE,
      timeout: 15_000,
    });
    await selector(page).selectOption(SIETE);
    await fallo;
    await page.waitForTimeout(1000);
    expect(await cifrasDelDocumento(page), "cifras en la página").toEqual([]);
    expect(await cifrasVisibles(page)).toEqual([]);

    await page.unroute(esLaRuta, manejador);
    await page.reload();
    await page.waitForLoadState("networkidle");
    expect(new URL(page.url()).search).toBe(`?periodo=${SIETE}`);
    await expect(page.locator("h1")).toBeVisible();
    await expect(selector(page)).toHaveValue(SIETE);
    await expect.poll(() => cifrasVisibles(page)).toEqual(referencia7);
  });
});

// REQ-069, CA-048, diseño «Cambio de periodo» punto 4 y «Cuando algo falla»: con la respuesta de
// navegación retenida y el reloj de la página simulado, a los 10 s aviso, a los 30 s error con
// motivo de lista cerrada, referencia `N-` y reintento, y 0 cifras a la vista en todo momento.
test.describe("REQ-069 · a los 30 s pendiente, error con reintento", () => {
  test("10 s: aviso; 29 s: aún sin error; 30 s: error con referencia N- y 0 cifras; el reintento vuelve a pedir y pinta el periodo", async ({
    page,
  }) => {
    await page.clock.install();
    await vigilarAnuncios(page);
    await vigilarAnuncios(page, "urgente");
    await abrir(page);
    const referencia7 = await cifrasDe(page, SIETE);
    const navegaciones: string[] = [];
    let soltarLaPrimera: () => void = () => {};
    await page.route(
      (u) => u.pathname === RUTA,
      async (route) => {
        if (esNavegacion(route)) {
          navegaciones.push(route.request().url());
          // La primera petición se queda retenida hasta el final de la prueba.
          if (navegaciones.length === 1) await new Promise<void>((r) => (soltarLaPrimera = r));
        }
        await route.continue().catch(() => undefined);
      },
    );
    const errores = page.locator('[data-estado="error"]');
    try {
      await selector(page).selectOption(SIETE);
      await expect(zonaCifras(page)).toHaveAttribute("aria-busy", "true");
      expect(await cifrasVisibles(page)).toEqual([]);
      await expect(errores).toHaveCount(0);
      expect(navegaciones).toHaveLength(1);

      // 10 s: aviso de que tarda, todavía sin error.
      await page.clock.runFor(10_000);
      await expect(zonaCifras(page).locator('[data-estado="carga"]')).toContainText(
        TEXTOS.bloque.cargaLenta,
      );
      await expect(errores).toHaveCount(0);
      expect(await cifrasVisibles(page)).toEqual([]);

      // 29 s: control sembrado de la medida (el error no puede aparecer antes de tiempo).
      await page.clock.runFor(19_000);
      await expect(errores).toHaveCount(0);
      expect(await cifrasVisibles(page)).toEqual([]);

      // 30 s: error en las dos zonas de datos, con motivo, referencia y reintento; 0 cifras.
      await page.clock.runFor(1_100);
      await expect(errores).toHaveCount(2);
      for (const zona of ["cifras", "contenido"]) {
        const z = page.locator(`[data-zona="${zona}"]`);
        await expect(z).not.toHaveAttribute("aria-busy", "true");
        await expect(z.locator('[data-estado="carga"]')).toHaveCount(0);
        await expect(z.locator('[data-estado="error"]')).toContainText(
          TEXTOS.motivosDeError.tarda_demasiado,
        );
        await expect(z.getByRole("button", { name: TEXTOS.bloque.reintentar })).toBeVisible();
      }
      const textoDelError = (await errores.first().innerText()).replace(/\s+/g, " ");
      const referencia = /Referencia: (N-[0-9A-HJKMNP-TV-Z]{10})/.exec(textoDelError)?.[1];
      expect(referencia, "referencia N- del error").toBeDefined();
      expect(await cifrasVisibles(page), "cifras a la vista en el error").toEqual([]);
      await page.clock.runFor(1_000);
      const urgentes = await anuncios(page, "urgente");
      expect(urgentes, "el error se anuncia una vez por la región urgente").toEqual([
        `${TEXTOS.motivosDeError.tarda_demasiado} ${TEXTOS.bloque.referencia}: ${referencia}`,
      ]);
      const cortes = await anuncios(page);
      expect(cortes.filter((a) => a === TEXTOS.bloque.cargaLenta)).toHaveLength(1);
      expect(navegaciones, "sin reintento automático").toHaveLength(1);

      // Reintento: vuelve a pedir y, al llegar la respuesta, pinta el periodo elegido.
      await page
        .locator('[data-zona="cifras"]')
        .getByRole("button", { name: TEXTOS.bloque.reintentar })
        .click();
      await expect.poll(() => navegaciones.length).toBe(2);
      expect(periodoDe(navegaciones[1]!)).toBe(SIETE);
      await expect(errores).toHaveCount(0);
      await expect(zonaCifras(page)).not.toHaveAttribute("aria-busy", "true");
      await expect.poll(() => cifrasVisibles(page)).toEqual(referencia7);
      await expect(selector(page)).toHaveValue(SIETE);
      expect(new URL(page.url()).search).toBe(`?periodo=${SIETE}`);
    } finally {
      soltarLaPrimera();
    }
  });
});

test.describe("PRUEBA-012 · control sembrado de los anuncios", () => {
  test("dos anuncios iguales con la región vaciada en medio se cuentan los dos; sin vaciado, uno", async ({
    page,
  }) => {
    await vigilarAnuncios(page);
    await abrir(page);
    const escribir = (texto: string): Promise<void> =>
      page.evaluate(async (t) => {
        const r = document.querySelector('[data-anunciador="cortes"]')!;
        r.textContent = t;
        await new Promise((x) => setTimeout(x, 20));
      }, texto);
    await escribir("X");
    await escribir("");
    await escribir("X");
    expect(await anuncios(page)).toEqual(["X", "X"]);
    await escribir("X");
    expect(await anuncios(page), "sin vaciado entre medias se funden").toEqual(["X", "X"]);
  });
});

test.describe("PRUEBA-012 · controles sembrados del cambio de periodo", () => {
  test("si la zona ocupada dejara a la vista las cifras anteriores, la medida de «cifras a la vista» lo vería", async ({
    page,
  }) => {
    await abrir(page);
    await page.route(
      (u) => u.pathname === RUTA,
      async (route) => {
        if (esNavegacion(route)) await dormir(1500);
        await route.continue();
      },
    );
    await selector(page).selectOption(SIETE);
    await expect(zonaCifras(page)).toHaveAttribute("aria-busy", "true");
    await page.addStyleTag({ content: '[data-zona="cifras"] .hidden{display:block !important}' });
    expect((await cifrasVisibles(page)).length).toBeGreaterThan(0);
  });

  test("las cifras de dos periodos son distintas en todas: una medida que las compara puede fallar", async ({
    page,
  }) => {
    await abrir(page);
    const a = await cifrasDe(page, SIETE);
    const b = await cifrasDe(page, TREINTA);
    a.forEach((valor, i) => expect(b[i]).not.toBe(valor));
  });
});

test.describe("PRUEBA-016 · control sembrado del cambio de periodo sin conexión", () => {
  test("con la red cortada, una petición a la ruta hecha desde la página sí la cuenta el mismo contador", async ({
    page,
    context,
  }) => {
    await abrir(page);
    let n = 0;
    page.on("request", (r) => {
      if (new URL(r.url()).pathname === RUTA) n += 1;
    });
    await context.setOffline(true);
    await page.evaluate(async (ruta) => {
      await fetch(ruta, { headers: { RSC: "1" } }).catch(() => undefined);
    }, RUTA);
    expect(n).toBe(1);
    await context.setOffline(false);
  });
});
