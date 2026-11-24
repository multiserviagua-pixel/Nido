// T-016 (d) · `BloqueDatos` en navegador. PRUEBA-016 (los cinco estados, datos parciales, carga
// lenta a los 10 s y error a los 30 s sin cancelar, reintento de un solo bloque, respuesta tardía,
// error anunciado una sola vez, sin permiso idéntico al estado suelto), PRUEBA-013 y REQ-064 (el
// desplazamiento de diseño real al pasar del esqueleto a los datos), PRUEBA-017 (nada del recurso en
// sin permiso), PRUEBA-021 (solo con teclado), PRUEBA-014 (colores forzados) y PRUEBA-025 (axe,
// también tras actuar). REQ-022, REQ-023, REQ-025 a REQ-028, REQ-057, REQ-064, REQ-069, REQ-077;
// CA-016, CA-018, CA-020, CA-042, CA-048. El reloj de la página es simulado en los plazos
// (`page.clock`): el bloque cuenta con temporizadores del navegador, no con la hora del servidor.
import { expect, test, type Locator, type Page } from "@playwright/test";
import { ESTADOS, abrirEstado, type EstadoDePrueba } from "./apoyo/estados";
import { ALTO_POR_DEFECTO, TEMAS, comprobarAccesibilidad } from "./configuracion-interfaz";
import { medirDesborde } from "./apoyo/medidas";
import { TEXTOS } from "../../../src/components/textos";

const DEL_BLOQUE = ESTADOS.filter((e) => e.entrada === "bloque-datos");
const estado = (clave: string): EstadoDePrueba => {
  const e = DEL_BLOQUE.find((x) => x.estado === clave);
  if (e === undefined) throw new Error(`falta bloque-datos/${clave} en el inventario`);
  return e;
};
const sinPermisoSuelto = (): EstadoDePrueba => {
  const e = ESTADOS.find((x) => x.entrada === "estado-sin-permiso");
  if (e === undefined) throw new Error("falta estado-sin-permiso en el inventario");
  return e;
};

const B = TEXTOS.bloque;
const M = TEXTOS.motivosDeError;
const REFERENCIA = /^[SN]-[0-9A-HJKMNP-TV-Z]{10}$/;
const MARCA_DE_ANUNCIO = {
  cortes: "__anunciosCortes",
  urgente: "__anunciosUrgentes",
} as const;

const bloqueError = (page: Page): Locator => page.locator('[data-estado="error"]');
const esqueleto = (page: Page): Locator => page.locator("[data-esqueleto]");
const reintentar = (page: Page): Locator => page.getByRole("button", { name: B.reintentar });
const contador = (page: Page, nombre: string): Locator =>
  page.locator(`[data-contador="${nombre}"]`);
const control = (page: Page, nombre: string): Locator => page.locator(`[data-control="${nombre}"]`);
const tarjeta = (page: Page): Locator => page.locator("[data-tarjeta-cifra]");
const veces = (texto: string, parte: string): number => texto.split(parte).length - 1;

/** Abre un estado y espera a que el navegador lo haya hidratado (los botones ya responden). */
async function abrir(page: Page, e: EstadoDePrueba): Promise<void> {
  await abrirEstado(page, e);
  await page.waitForLoadState("networkidle");
}

/** Guarda cada anuncio de una región: un texto no vacío tras un vacío cuenta como anuncio nuevo. */
async function vigilarAnuncios(page: Page, region: "cortes" | "urgente"): Promise<void> {
  await page.addInitScript(
    ([nombre, clave]) => {
      const w = window as unknown as Record<string, string[]>;
      w[clave!] = [];
      let vacia = true;
      new MutationObserver(() => {
        const r = document.querySelector(`[data-anunciador="${nombre}"]`);
        const t = (r?.textContent ?? "").trim();
        if (t === "") {
          vacia = true;
          return;
        }
        const lista = w[clave!]!;
        if (vacia || lista[lista.length - 1] !== t) lista.push(t);
        vacia = false;
      }).observe(document, { subtree: true, childList: true, characterData: true });
    },
    [region, MARCA_DE_ANUNCIO[region]] as const,
  );
}
const anuncios = (page: Page, region: "cortes" | "urgente"): Promise<string[]> =>
  page.evaluate(
    (clave) => (window as unknown as Record<string, string[]>)[clave] ?? [],
    MARCA_DE_ANUNCIO[region],
  );

test("hay entradas que recorrer: los doce estados del bloque", () => {
  expect(DEL_BLOQUE.map((e) => e.estado).sort()).toEqual(
    [
      "carga",
      "carga-a-grafico",
      "carga-a-lista",
      "carga-a-tabla",
      "carga-a-tabla-llena",
      "carga-a-tarjeta",
      "conserva-hijos",
      "datos",
      "datos-parciales",
      "error",
      "respuesta-tardia",
      "sin-permiso",
      "vacio",
    ].sort(),
  );
});

test.describe("conservarHijos: los hijos de cliente no se desmontan (diseño, «Cambio de periodo», punto 4)", () => {
  for (const por of ["carga", "error"] as const) {
    test(`datos → ${por} → datos conserva el estado del hijo`, async ({ page }) => {
      await abrir(page, estado("conserva-hijos"));
      await control(page, "contador-hijo").click();
      await control(page, "contador-hijo").click();
      await expect(contador(page, "hijo")).toHaveText("2");
      await control(page, `poner-${por}`).click();
      // Fuera de datos el hijo sigue en el documento pero oculto: nada se lee ni se enfoca.
      await expect(control(page, "contador-hijo")).toBeHidden();
      await expect(contador(page, "hijo")).toHaveText("2");
      await control(page, "poner-datos").click();
      await expect(control(page, "contador-hijo")).toBeVisible();
      await expect(contador(page, "hijo")).toHaveText("2");
    });
  }
});

test.describe("PRUEBA-016 · los cinco estados (REQ-025)", () => {
  test("carga: esqueleto ocupado y «Cargando» anunciado una sola vez", async ({ page }) => {
    await vigilarAnuncios(page, "cortes");
    await abrir(page, estado("carga"));
    await expect(esqueleto(page)).toHaveAttribute("aria-busy", "true");
    await expect(esqueleto(page)).toHaveAttribute("data-esqueleto", "tarjeta");
    await page.waitForTimeout(1500);
    expect(await anuncios(page, "cortes")).toEqual([B.cargando]);
    expect(veces(await esqueleto(page).evaluate((e) => e.textContent ?? ""), B.cargando)).toBe(1);
    await expect(page.locator("[data-carga-lenta]")).toHaveCount(0);
    await expect(tarjeta(page)).toHaveCount(0);
  });

  test("vacío: dice qué pasa y qué hacer, y su botón se pulsa una vez por pulsación", async ({
    page,
  }) => {
    await abrir(page, estado("vacio"));
    const vacio = page.locator('[data-estado="vacio"]');
    await expect(vacio).toContainText(TEXTOS.estadoVacio.ejemplo.conAccion.titulo);
    await expect(vacio).toContainText(TEXTOS.estadoVacio.ejemplo.conAccion.explicacion);
    await vacio.getByRole("button").click();
    await expect(contador(page, "pedidas")).toHaveText("1");
    await expect(tarjeta(page)).toHaveCount(0);
  });

  test("error: texto fijo, «No se ha podido cargar» una vez, referencia y «Reintentar» que pide solo este bloque", async ({
    page,
  }) => {
    await abrir(page, estado("error"));
    await expect(bloqueError(page)).toContainText(M.fallo_servidor);
    const texto = await bloqueError(page).innerText();
    expect(veces(texto, B.noSePudoCargar)).toBe(1);
    expect(texto).toContain("S-7K3M9QX2AB");
    await expect(reintentar(page)).toHaveCount(1);
    await reintentar(page).click();
    await expect(contador(page, "reintentos")).toHaveText("1");
    const enCurso = bloqueError(page).getByRole("button");
    await expect(enCurso).toHaveText(B.cargando);
    await expect(enCurso).toHaveAttribute("aria-disabled", "true");
    await expect(tarjeta(page)).toHaveCount(0);
  });

  test("con datos: la tarjeta y ningún estado de error ni de carga", async ({ page }) => {
    await abrir(page, estado("datos"));
    await expect(tarjeta(page)).toBeVisible();
    await expect(page.locator('[data-bloque] > [data-estado="datos"]')).toHaveCount(1);
    await expect(bloqueError(page)).toHaveCount(0);
    await expect(esqueleto(page)).toHaveCount(0);
  });
});

test.describe("PRUEBA-016 · sin permiso, el mismo estado que la dirección inexistente (REQ-027, REQ-077)", () => {
  test("el marcado es el del estado suelto, byte a byte", async ({ page }) => {
    await abrir(page, sinPermisoSuelto());
    const suelto = await page.locator('[data-estado="sin-permiso"]').evaluate((e) => e.outerHTML);
    await abrir(page, estado("sin-permiso"));
    const enBloque = await page.locator('[data-estado="sin-permiso"]').evaluate((e) => e.outerHTML);
    expect(enBloque).toBe(suelto);
    await expect(page.locator('[data-estado="sin-permiso"]')).toContainText(
      TEXTOS.sinPermiso.titulo,
    );
    // Nada del contenido ni del recurso: ni tarjeta, ni contadores de envío.
    await expect(tarjeta(page)).toHaveCount(0);
  });

  test("sin JavaScript se ve igual y el enlace al Resumen está", async ({ browser }) => {
    const contexto = await browser.newContext({ javaScriptEnabled: false });
    const page = await contexto.newPage();
    await page.goto(estado("sin-permiso").ruta);
    await expect(page.locator('[data-estado="sin-permiso"]')).toContainText(
      TEXTOS.sinPermiso.explicacion,
    );
    await expect(
      page.locator('[data-estado="sin-permiso"]').getByRole("link", {
        name: TEXTOS.sinPermiso.volverAlResumen,
      }),
    ).toHaveAttribute("href", "/muestra");
    await contexto.close();
  });
});

test.describe("PRUEBA-016 · datos parciales (REQ-028)", () => {
  test("una fuente falla: su bloque lo dice con su reintento y las otras dos pintan sus datos", async ({
    page,
  }) => {
    await abrir(page, estado("datos-parciales"));
    const fuente = (n: number): Locator => page.getByRole("region", { name: `Fuente ${n}` });
    await expect(bloqueError(page)).toHaveCount(1);
    await expect(fuente(2).locator('[data-estado="error"]')).toContainText(M.fallo_servidor);
    await expect(fuente(2).locator('[data-estado="error"]')).toContainText("S-7K3M9QX2AB");
    expect(veces(await bloqueError(page).innerText(), B.noSePudoCargar)).toBe(1);
    await expect(fuente(1).locator('[data-estado="datos"]')).toBeVisible();
    await expect(fuente(3).locator('[data-estado="datos"]')).toBeVisible();
    await expect(fuente(1).locator("[data-tarjeta-cifra]")).toBeVisible();
    await expect(fuente(3).locator("[data-alerta], li").first()).toBeVisible();
    // La fuente que falló no deja nada de su contenido.
    await expect(fuente(2).locator("li")).toHaveCount(0);
    await expect(reintentar(page)).toHaveCount(1);
  });

  test("«Reintentar» vuelve a pedir solo la fuente que falló", async ({ page }) => {
    await abrir(page, estado("datos-parciales"));
    const fuente = (n: number): Locator => page.getByRole("region", { name: `Fuente ${n}` });
    const antes1 = await fuente(1).innerHTML();
    const antes3 = await fuente(3).innerHTML();
    await reintentar(page).click();
    await expect(contador(page, "reintentos")).toHaveText("1");
    await expect(fuente(2).locator('[data-estado="carga"]')).toBeVisible();
    await expect(bloqueError(page)).toHaveCount(0);
    expect(await fuente(1).innerHTML()).toBe(antes1);
    expect(await fuente(3).innerHTML()).toBe(antes3);
  });

  test("el error de una fuente se anuncia una sola vez, por la región urgente", async ({
    page,
  }) => {
    await vigilarAnuncios(page, "urgente");
    await abrir(page, estado("datos-parciales"));
    await page.waitForTimeout(1500);
    expect(await anuncios(page, "urgente")).toEqual([
      `${M.fallo_servidor} ${B.referencia}: S-7K3M9QX2AB`,
    ]);
  });
});

test.describe("PRUEBA-016 · el error se anuncia una sola vez (menor 26 c)", () => {
  test("al cargar un bloque ya en error: un anuncio urgente con el texto y la referencia; pulsar «Reintentar» no lo repite", async ({
    page,
  }) => {
    await vigilarAnuncios(page, "urgente");
    await abrir(page, estado("error"));
    await page.waitForTimeout(1500);
    const esperado = `${M.fallo_servidor} ${B.referencia}: S-7K3M9QX2AB`;
    expect(await anuncios(page, "urgente")).toEqual([esperado]);
    await reintentar(page).click();
    await expect(contador(page, "reintentos")).toHaveText("1");
    await page.waitForTimeout(1500);
    expect(await anuncios(page, "urgente")).toEqual([esperado]);
  });
});

test.describe("PRUEBA-016 · carga lenta a los 10 s y error a los 30 s, sin cancelar (REQ-023, REQ-069, CA-048)", () => {
  test("10 s: aviso visible y anunciado una vez; 29 s: aún sin error; 30 s: error tarda_demasiado con N- y un solo anuncio urgente", async ({
    page,
  }) => {
    await page.clock.install();
    await vigilarAnuncios(page, "cortes");
    await vigilarAnuncios(page, "urgente");
    await abrir(page, estado("carga"));
    await expect(esqueleto(page)).toBeVisible();
    await expect(page.locator("[data-carga-lenta]")).toHaveCount(0);
    await expect(bloqueError(page)).toHaveCount(0);

    await page.clock.runFor(10_000);
    await expect(page.locator("[data-carga-lenta]")).toHaveText(B.cargaLenta);
    await page.clock.runFor(1_000);
    expect(await anuncios(page, "cortes")).toEqual([B.cargando, B.cargaLenta]);
    await expect(bloqueError(page)).toHaveCount(0);

    // Control sembrado de la medida: el error no puede aparecer antes de tiempo.
    await page.clock.runFor(17_000);
    await expect(bloqueError(page)).toHaveCount(0);
    expect(await anuncios(page, "urgente")).toEqual([]);

    await page.clock.runFor(2_500);
    await expect(bloqueError(page)).toHaveCount(1);
    await expect(esqueleto(page)).toHaveCount(0);
    await expect(bloqueError(page)).toContainText(M.tarda_demasiado);
    expect(veces(await bloqueError(page).innerText(), B.noSePudoCargar)).toBe(1);
    const referencia = (await bloqueError(page).locator("[data-referencia]").innerText())
      .replace(`${B.referencia}: `, "")
      .trim();
    expect(referencia).toMatch(REFERENCIA);
    expect(referencia.startsWith("N-")).toBe(true);
    await expect(reintentar(page)).toHaveCount(1);
    await page.clock.runFor(2_000);
    expect(await anuncios(page, "urgente")).toEqual([
      `${M.tarda_demasiado} ${B.referencia}: ${referencia}`,
    ]);
    // Tras mucho más tiempo no se vuelve a anunciar ni cambia nada.
    await page.clock.runFor(60_000);
    expect(await anuncios(page, "urgente")).toHaveLength(1);
    expect(await anuncios(page, "cortes")).toEqual([B.cargando, B.cargaLenta]);
  });

  test("«Reintentar» tras los 30 s: vuelve a «Cargando», reinicia los plazos y deja el foco en el bloque", async ({
    page,
  }) => {
    await page.clock.install();
    await vigilarAnuncios(page, "cortes");
    await vigilarAnuncios(page, "urgente");
    await abrir(page, estado("carga"));
    await page.clock.runFor(32_000);
    await expect(bloqueError(page)).toHaveCount(1);
    await reintentar(page).focus();
    await page.keyboard.press("Enter");
    await expect(contador(page, "reintentos")).toHaveText("1");
    await expect(contador(page, "envio")).toHaveText("2");
    await expect(bloqueError(page)).toHaveCount(0);
    await expect(esqueleto(page)).toBeVisible();
    await expect(page.locator("[data-carga-lenta]")).toHaveCount(0);
    // El botón que tenía el foco ha desaparecido: el foco pasa al bloque y no se pierde.
    await expect(page.locator("[data-bloque]")).toBeFocused();
    await page.clock.runFor(1_000);
    expect((await anuncios(page, "cortes")).filter((a) => a === B.cargando)).toHaveLength(2);
    // Los plazos empiezan de cero: aviso a los 10 s y otro error a los 30 s.
    await page.clock.runFor(10_000);
    await expect(page.locator("[data-carga-lenta]")).toBeVisible();
    await expect(bloqueError(page)).toHaveCount(0);
    await page.clock.runFor(22_000);
    await expect(bloqueError(page)).toHaveCount(1);
    await page.clock.runFor(1_000);
    expect(await anuncios(page, "urgente")).toHaveLength(2);
  });

  test("la respuesta llega después del error de 30 s: se retira el error y se pinta lo recibido, nunca error y tarjeta a la vez", async ({
    page,
  }) => {
    await page.clock.install();
    await vigilarAnuncios(page, "urgente");
    await abrir(page, estado("respuesta-tardia"));
    await page.evaluate(() => {
      const w = window as unknown as { __mezclas: number };
      w.__mezclas = 0;
      new MutationObserver(() => {
        const hayError = document.querySelector('[data-estado="error"]') !== null;
        const hayTarjeta = [...document.querySelectorAll("[data-tarjeta-cifra]")].some(
          (e) => (e as HTMLElement).offsetParent !== null,
        );
        if (hayError && hayTarjeta) w.__mezclas += 1;
      }).observe(document, { subtree: true, childList: true, attributes: true });
    });
    await page.clock.runFor(32_000);
    await expect(bloqueError(page)).toHaveCount(1);
    await expect(tarjeta(page)).toHaveCount(0);
    await control(page, "responder-datos").click();
    await expect(bloqueError(page)).toHaveCount(0);
    await expect(tarjeta(page)).toBeVisible();
    await expect(contador(page, "reintentos")).toHaveText("0");
    await expect(contador(page, "envio")).toHaveText("1");
    expect(await page.evaluate(() => (window as unknown as { __mezclas: number }).__mezclas)).toBe(
      0,
    );
    await page.clock.runFor(2_000);
    expect(await anuncios(page, "urgente")).toHaveLength(1);
  });

  test("la respuesta de un envío anterior no pisa el envío en curso ni un estado ya final", async ({
    page,
  }) => {
    await page.clock.install();
    await abrir(page, estado("respuesta-tardia"));
    await page.clock.runFor(32_000);
    await expect(bloqueError(page)).toHaveCount(1);
    await reintentar(page).click();
    await expect(contador(page, "envio")).toHaveText("2");
    // Llega la respuesta del primer envío mientras el segundo sigue en curso: no cambia nada.
    await control(page, "responder-anterior").click();
    await expect(esqueleto(page)).toBeVisible();
    await expect(tarjeta(page)).toHaveCount(0);
    // El segundo envío termina en error; una respuesta con datos del primero no lo pisa.
    await control(page, "responder-error").click();
    await expect(bloqueError(page)).toHaveCount(1);
    await expect(bloqueError(page)).toContainText(M.fallo_servidor);
    await control(page, "responder-anterior").click();
    await expect(bloqueError(page)).toHaveCount(1);
    await expect(tarjeta(page)).toHaveCount(0);
    // Y con datos ya finales del envío en curso, otra respuesta del anterior tampoco los pisa.
    await reintentar(page).click();
    await expect(contador(page, "envio")).toHaveText("3");
    await control(page, "responder-datos").click();
    await expect(tarjeta(page)).toBeVisible();
    await control(page, "responder-anterior").click();
    await expect(tarjeta(page)).toBeVisible();
    await expect(bloqueError(page)).toHaveCount(0);
  });
});

test.describe("REQ-064 · desplazamiento de diseño al pasar del esqueleto a los datos (≤ 0,1)", () => {
  const CASOS = [
    ["carga-a-tarjeta", "[data-tarjeta-cifra]"],
    ["carga-a-tabla", "table"],
    ["carga-a-tabla-llena", "table"],
    ["carga-a-grafico", 'figure[data-grafico="lineas"][data-estado="datos"]'],
    ["carga-a-lista", "ul, ol"],
  ] as const;
  for (const ancho of [1280, 375]) {
    for (const [clave, datos] of CASOS) {
      test(`${clave} · ${ancho} px`, async ({ page }, info) => {
        await page.setViewportSize({ width: ancho, height: ALTO_POR_DEFECTO });
        await page.addInitScript(() => {
          const w = window as unknown as { __cls: number; __desplazamientos: number[] };
          w.__cls = 0;
          w.__desplazamientos = [];
          new PerformanceObserver((lista) => {
            for (const e of lista.getEntries()) {
              const x = e as PerformanceEntry & { value: number; hadRecentInput: boolean };
              if (!x.hadRecentInput) {
                w.__cls += x.value;
                w.__desplazamientos.push(x.value);
              }
            }
          }).observe({ type: "layout-shift", buffered: true });
        });
        await abrir(page, estado(clave));
        await expect(esqueleto(page)).toBeVisible();
        const marcador = page.locator("[data-pie-del-bloque]");
        const antes = (await marcador.boundingBox())!.y;
        await expect(page.locator(`[data-bloque-medido] ${datos}`).first()).toBeVisible();
        await expect(esqueleto(page)).toHaveCount(0);
        await page.waitForLoadState("networkidle");
        await page.waitForTimeout(500);
        const despues = (await marcador.boundingBox())!.y;
        const cls = await page.evaluate(() => (window as unknown as { __cls: number }).__cls);
        info.annotations.push({
          type: "medida",
          description: `${clave} a ${ancho} px: desplazamiento de diseño ${cls.toFixed(4)}; el contenido de debajo baja ${(despues - antes).toFixed(1)} px`,
        });
        expect(cls, `desplazamiento de diseño de ${clave} a ${ancho} px`).toBeLessThanOrEqual(0.1);
        // La tarjeta y el gráfico tienen el alto del contenido real (±2 px); la tabla y la lista
        // dependen de cuántas filas y de qué tamaño lleguen, y solo cuenta el 0,1 de arriba.
        if (clave === "carga-a-tarjeta" || clave === "carga-a-grafico") {
          expect(
            Math.abs(despues - antes),
            `lo de debajo de ${clave} a ${ancho} px`,
          ).toBeLessThanOrEqual(clave === "carga-a-grafico" && ancho < 400 ? 24 : 2);
        }
      });
    }
  }

  test("control sembrado: una página cuyo contenido salta sí da más de 0,1", async ({ page }) => {
    await page.addInitScript(() => {
      const w = window as unknown as { __cls: number };
      w.__cls = 0;
      new PerformanceObserver((lista) => {
        for (const e of lista.getEntries()) {
          const x = e as PerformanceEntry & { value: number; hadRecentInput: boolean };
          if (!x.hadRecentInput) w.__cls += x.value;
        }
      }).observe({ type: "layout-shift", buffered: true });
    });
    await page.setViewportSize({ width: 1280, height: ALTO_POR_DEFECTO });
    await abrir(page, estado("datos"));
    await page.evaluate(() => {
      const caja = document.createElement("div");
      caja.style.height = "20px";
      const marcador = document.querySelector("main p, main h2")!;
      marcador.before(caja);
      requestAnimationFrame(() => {
        caja.style.height = "400px";
      });
    });
    await page.waitForTimeout(500);
    expect(
      await page.evaluate(() => (window as unknown as { __cls: number }).__cls),
    ).toBeGreaterThan(0.1);
  });
});

test.describe("PRUEBA-021 · solo con teclado (REQ-036, CA-027)", () => {
  test("error: Tab llega a «Reintentar», Intro lo pide una vez y el foco no se pierde", async ({
    page,
  }) => {
    await abrir(page, estado("error"));
    await page.keyboard.press("Tab");
    for (
      let i = 0;
      i < 40 && !(await reintentar(page).evaluate((b) => b === document.activeElement));
      i++
    ) {
      await page.keyboard.press("Tab");
    }
    await expect(reintentar(page)).toBeFocused();
    expect(await reintentar(page).evaluate((b) => getComputedStyle(b).outlineStyle)).not.toBe(
      "none",
    );
    await page.keyboard.press("Enter");
    await expect(contador(page, "reintentos")).toHaveText("1");
    // Sigue en el mismo sitio, ahora diciendo «Cargando».
    await expect(bloqueError(page).getByRole("button")).toBeFocused();
  });

  test("vacío con acción: Tab llega al botón y Espacio lo activa", async ({ page }) => {
    await abrir(page, estado("vacio"));
    const boton = page.locator('[data-estado="vacio"]').getByRole("button");
    for (let i = 0; i < 40 && !(await boton.evaluate((b) => b === document.activeElement)); i++) {
      await page.keyboard.press("Tab");
    }
    await expect(boton).toBeFocused();
    await page.keyboard.press("Space");
    await expect(contador(page, "pedidas")).toHaveText("1");
  });
});

test.describe("PRUEBA-014 · colores forzados (REQ-043, REQ-085)", () => {
  test("el error de los 30 s y el esqueleto conservan su borde y «Reintentar» su foco visible", async ({
    page,
  }) => {
    await page.emulateMedia({ forcedColors: "active" });
    await page.clock.install();
    await abrir(page, estado("carga"));
    const sinBorde = (sel: string): Promise<number> =>
      page.locator(sel).evaluateAll(
        (xs) =>
          xs.filter((x) => {
            const c = getComputedStyle(x);
            return parseFloat(c.borderTopWidth) === 0 || c.borderTopStyle === "none";
          }).length,
      );
    expect(await sinBorde("[data-esqueleto-bloque]")).toBe(0);
    await page.clock.runFor(32_000);
    await expect(bloqueError(page)).toHaveCount(1);
    expect(await sinBorde('[data-estado="error"]')).toBe(0);
    await expect(bloqueError(page)).toContainText(M.tarda_demasiado);
    await reintentar(page).focus();
    expect(await reintentar(page).evaluate((b) => getComputedStyle(b).outlineStyle)).not.toBe(
      "none",
    );
  });
});

test.describe("PRUEBA-025 · axe tras actuar, a 320 y 1280 px, en claro y oscuro", () => {
  for (const ancho of [320, 1280]) {
    for (const tema of TEMAS) {
      test(`error de los 30 s · ${ancho} px · ${tema}`, async ({ page }) => {
        await page.setViewportSize({ width: ancho, height: ALTO_POR_DEFECTO });
        await page.emulateMedia({ colorScheme: tema });
        await page.clock.install();
        await abrir(page, estado("carga"));
        await page.clock.runFor(32_000);
        await expect(bloqueError(page)).toHaveCount(1);
        await comprobarAccesibilidad(page);
      });

      test(`carga lenta (10 s) · ${ancho} px · ${tema}`, async ({ page }) => {
        await page.setViewportSize({ width: ancho, height: ALTO_POR_DEFECTO });
        await page.emulateMedia({ colorScheme: tema });
        await page.clock.install();
        await abrir(page, estado("carga"));
        await page.clock.runFor(11_000);
        await expect(page.locator("[data-carga-lenta]")).toBeVisible();
        await comprobarAccesibilidad(page);
      });

      test(`datos parciales tras reintentar · ${ancho} px · ${tema}`, async ({ page }) => {
        await page.setViewportSize({ width: ancho, height: ALTO_POR_DEFECTO });
        await page.emulateMedia({ colorScheme: tema });
        await abrir(page, estado("datos-parciales"));
        await reintentar(page).click();
        await expect(contador(page, "reintentos")).toHaveText("1");
        await comprobarAccesibilidad(page);
      });
    }
  }
});

test.describe("PRUEBA-013 · desborde en los estados con texto (REQ-044, REQ-065)", () => {
  for (const clave of ["error", "datos-parciales", "sin-permiso", "respuesta-tardia"]) {
    test(`${clave}: a 320 px con el zum al 400 % no se desplaza la página`, async ({ page }) => {
      await page.setViewportSize({ width: 320, height: ALTO_POR_DEFECTO });
      await abrir(page, estado(clave));
      const d = await medirDesborde(page);
      expect(d.sobra, "sobra").toBe(0);
      expect(d.fuera, "fuera").toEqual([]);
    });
  }
});
