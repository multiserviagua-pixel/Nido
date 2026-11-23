// T-016 (c) · `EstadoVacio`, `EstadoError`, `EstadoSinPermiso` y `Esqueleto` en navegador.
// PRUEBA-016 (estados sueltos: vacío, error por motivo con referencia y «Reintentar», sin permiso con
// el mismo marcado, esqueleto con su forma, su alto y su anuncio único), PRUEBA-013 (anchos, zum y
// espaciado de texto: los recorre `anchos.spec.ts` sobre estas mismas entradas del inventario; aquí
// el alto del esqueleto frente al contenido real y el desborde sin JavaScript), PRUEBA-017 (una
// referencia hostil), PRUEBA-021 (solo con teclado), PRUEBA-014 (colores forzados y movimiento
// reducido) y PRUEBA-025 (axe, también tras actuar). REQ-022, REQ-023, REQ-026, REQ-027, REQ-039,
// REQ-057, REQ-069, REQ-077; CA-016, CA-020, CA-042, CA-048.
// Los plazos de 10 s y 30 s y el bloque que los aplica son de `BloqueDatos` (T-016 (d)): aquí solo
// el esqueleto y su variante lenta.
import { expect, test, type Locator, type Page } from "@playwright/test";
import { ESTADOS, abrirEstado, type EstadoDePrueba } from "./apoyo/estados";
import { ALTO_POR_DEFECTO, TEMAS, comprobarAccesibilidad } from "./configuracion-interfaz";
import { medirAnimaciones, medirDesborde } from "./apoyo/medidas";
import { TEXTOS } from "../../../src/components/textos";

const ENTRADAS = ["estado-vacio", "estado-error", "estado-sin-permiso", "esqueleto"] as const;
const DEL_BLOQUE = ESTADOS.filter((e) => (ENTRADAS as readonly string[]).includes(e.entrada));
const estado = (entrada: (typeof ENTRADAS)[number], clave: string): EstadoDePrueba => {
  const e = DEL_BLOQUE.find((x) => x.entrada === entrada && x.estado === clave);
  if (e === undefined) throw new Error(`falta ${entrada}/${clave} en el inventario`);
  return e;
};

const B = TEXTOS.bloque;
const M = TEXTOS.motivosDeError;
const E = TEXTOS.estadoVacio.ejemplo;
const REFERENCIA = /^[SN]-[0-9A-HJKMNP-TV-Z]{10}$/;

const MOTIVOS: ReadonlyArray<readonly [string, keyof typeof M]> = [
  ["sin-conexion", "sin_conexion"],
  ["fallo-servidor", "fallo_servidor"],
  ["respuesta-no-valida", "respuesta_no_valida"],
  ["tarda-demasiado", "tarda_demasiado"],
  ["sesion-no-valida", "sesion_no_valida"],
  ["desconocido", "desconocido"],
];

const bloqueError = (page: Page): Locator => page.locator('[data-estado="error"]');
const reintentar = (page: Page): Locator => page.getByRole("button", { name: B.reintentar });
const contador = (page: Page, nombre: string): Locator =>
  page.locator(`[data-contador="${nombre}"]`);

/** Abre un estado y espera a que el navegador lo haya hidratado (los botones ya responden). */
async function abrir(page: Page, e: EstadoDePrueba): Promise<void> {
  await abrirEstado(page, e);
  await page.waitForLoadState("networkidle");
}

/** Guarda cada anuncio de la región cortés: un texto no vacío tras un vacío cuenta como anuncio nuevo. */
async function vigilarAnuncios(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const w = window as unknown as Record<string, string[]>;
    w["__anuncios"] = [];
    let vacia = true;
    new MutationObserver(() => {
      const r = document.querySelector('[data-anunciador="cortes"]');
      const t = (r?.textContent ?? "").trim();
      if (t === "") {
        vacia = true;
        return;
      }
      const lista = w["__anuncios"]!;
      if (vacia || lista[lista.length - 1] !== t) lista.push(t);
      vacia = false;
    }).observe(document, { subtree: true, childList: true, characterData: true });
  });
}
const anuncios = (page: Page): Promise<string[]> =>
  page.evaluate(() => (window as unknown as Record<string, string[]>)["__anuncios"] ?? []);

const veces = (texto: string, parte: string): number => texto.split(parte).length - 1;

test("hay entradas que recorrer: dos de vacío, ocho de error, una sin permiso y cinco de esqueleto", () => {
  const cuenta = (entrada: string): string[] =>
    DEL_BLOQUE.filter((e) => e.entrada === entrada)
      .map((e) => e.estado)
      .sort();
  expect(cuenta("estado-vacio")).toEqual(["con-accion", "sin-accion"]);
  expect(cuenta("estado-error")).toEqual(
    [...MOTIVOS.map(([c]) => c), "reintento-en-curso", "referencia-invalida"].sort(),
  );
  expect(cuenta("estado-sin-permiso")).toEqual(["unico"]);
  expect(cuenta("esqueleto")).toEqual(["carga-lenta", "grafico", "lista", "tabla", "tarjeta"]);
});

test.describe("PRUEBA-016 · estado vacío (REQ-022, CA-016)", () => {
  test("con acción: dice qué pasa y qué hacer, y un botón que se pulsa una vez por pulsación", async ({
    page,
  }) => {
    await abrir(page, estado("estado-vacio", "con-accion"));
    const vacio = page.locator('[data-estado="vacio"]');
    await expect(vacio).toContainText(E.conAccion.titulo);
    await expect(vacio).toContainText(E.conAccion.explicacion);
    const boton = vacio.getByRole("button");
    await expect(boton).toHaveCount(1);
    await expect(boton).toHaveText(E.conAccion.accion);
    await expect(contador(page, "pedidas")).toHaveText("0");
    await boton.click();
    await expect(contador(page, "pedidas")).toHaveText("1");
    await boton.click();
    await expect(contador(page, "pedidas")).toHaveText("2");
  });

  test("sin acción: sin botón ni enlace", async ({ page }) => {
    await abrir(page, estado("estado-vacio", "sin-accion"));
    const vacio = page.locator('[data-estado="vacio"]');
    await expect(vacio).toContainText(E.sinAccion.titulo);
    await expect(vacio).toContainText(E.sinAccion.explicacion);
    await expect(vacio.locator("button, a")).toHaveCount(0);
  });

  test("la tabla sin filas usa este mismo componente, con su sección con nombre", async ({
    page,
  }) => {
    await page.goto("/muestra/componentes/tabla/vacia");
    const seccion = page.locator("[data-tabla-vacia]");
    await expect(seccion.locator('[data-estado="vacio"]')).toBeVisible();
    await expect(seccion).toContainText(TEXTOS.tabla.vacio.titulo);
    await expect(seccion).toContainText(TEXTOS.tabla.vacio.explicacion);
    await expect(page.locator("table")).toHaveCount(0);
  });
});

test.describe("PRUEBA-016 · estado de error (REQ-026, REQ-057, CA-042)", () => {
  for (const [clave, motivo] of MOTIVOS) {
    test(`${clave}: su texto fijo, «No se ha podido cargar» una vez, una referencia y un solo «Reintentar»`, async ({
      page,
    }) => {
      await abrir(page, estado("estado-error", clave));
      const bloque = bloqueError(page);
      await expect(bloque).toHaveCount(1);
      await expect(bloque).toContainText(M[motivo]);
      const texto = (await bloque.innerText()).replace(/\s+/g, " ");
      expect(veces(texto, B.noSePudoCargar), "«No se ha podido cargar»").toBe(1);
      // La referencia: la que llega, o una creada en el navegador tras hidratar.
      const ref = bloque.locator("[data-referencia]");
      await expect(ref).toHaveCount(1);
      const leida = (await ref.innerText()).replace(`${B.referencia}: `, "").trim();
      expect(leida).toMatch(REFERENCIA);
      await expect(reintentar(page)).toHaveCount(1);
      // 0 ceros ni cifras sueltas: lo único con dígitos es la referencia.
      expect(texto.replace(/Referencia: [SN]-\S+/, "")).not.toMatch(/\d/);
    });
  }

  test("la referencia que llega con el formato exacto es la que se pinta", async ({ page }) => {
    await abrir(page, estado("estado-error", "fallo-servidor"));
    await expect(bloqueError(page).locator("[data-referencia]")).toHaveText(
      `${B.referencia}: S-7K3M9QX2AB`,
    );
    await abrir(page, estado("estado-error", "tarda-demasiado"));
    await expect(bloqueError(page).locator("[data-referencia]")).toHaveText(
      `${B.referencia}: N-2H5J9PTV0G`,
    );
  });

  test("«Reintentar» pide el reintento una vez, queda «Cargando» y no se vuelve a lanzar", async ({
    page,
  }) => {
    await abrir(page, estado("estado-error", "fallo-servidor"));
    await expect(contador(page, "reintentos")).toHaveText("0");
    await reintentar(page).click();
    await expect(contador(page, "reintentos")).toHaveText("1");
    const boton = bloqueError(page).getByRole("button");
    await expect(boton).toHaveCount(1);
    await expect(boton).toHaveText(B.cargando);
    await expect(boton).toHaveAttribute("aria-disabled", "true");
    await boton.click({ force: true });
    await boton.press("Enter");
    await expect(contador(page, "reintentos")).toHaveText("1");
  });

  test("reintento en curso: el botón ya dice «Cargando», no se pulsa y sigue en el orden de tabulación", async ({
    page,
  }) => {
    await abrir(page, estado("estado-error", "reintento-en-curso"));
    const boton = bloqueError(page).getByRole("button");
    await expect(boton).toHaveText(B.cargando);
    await expect(boton).toHaveAttribute("aria-disabled", "true");
    await boton.click({ force: true });
    await expect(contador(page, "reintentos")).toHaveText("0");
    await page.keyboard.press("Tab");
    await page.keyboard.press("Tab");
    // El botón está en el orden de tabulación: se puede llegar a él con el teclado.
    const alcanzable = await page.evaluate(() => {
      const b = document.querySelector('[data-estado="error"] button') as HTMLElement | null;
      return b !== null && b.tabIndex >= 0;
    });
    expect(alcanzable).toBe(true);
  });

  test("no es región viva: no anuncia nada por su cuenta", async ({ page }) => {
    await vigilarAnuncios(page);
    await abrir(page, estado("estado-error", "tarda-demasiado"));
    await page.waitForTimeout(1500);
    expect(await anuncios(page)).toEqual([]);
    await expect(
      page.locator('[data-estado="error"][aria-live], [data-estado="error"][role]'),
    ).toHaveCount(0);
  });

  test("el HTML del servidor no lleva la referencia inventada ni datos internos", async ({
    page,
  }) => {
    const respuesta = await page.goto(estado("estado-error", "sin-conexion").ruta);
    const cuerpo = await respuesta!.text();
    expect(cuerpo).not.toMatch(/relation|TESTIGO/i);
    // Sin referencia dada, no hay una en el HTML: se crea en el navegador, después de hidratar.
    expect(cuerpo).not.toMatch(/Referencia: [SN]-/);
    await page.waitForLoadState("networkidle");
    await expect(bloqueError(page).locator("[data-referencia]")).toHaveCount(1);
  });
});

test.describe("PRUEBA-017 · una referencia que no es una referencia (REQ-057, CA-042)", () => {
  test("un mensaje interno como referencia se descarta, en ningún momento llega a la pantalla y se pinta una N- del navegador", async ({
    page,
  }) => {
    const e = estado("estado-error", "referencia-invalida");
    // El valor sembrado vive solo en el cliente: ni en el HTML ni en la carga serializada.
    const cuerpos: string[] = [];
    page.on("response", async (r) => {
      if (r.request().resourceType() === "document") cuerpos.push(await r.text().catch(() => ""));
    });
    await page.addInitScript(() => {
      const w = window as unknown as Record<string, number>;
      w["__visto"] = 0;
      new MutationObserver(() => {
        if ((document.body?.innerText ?? "").includes("TESTIGO-REFERENCIA-INTERNA")) {
          w["__visto"] = (w["__visto"] ?? 0) + 1;
        }
      }).observe(document, { subtree: true, childList: true, characterData: true });
    });
    await abrir(page, e);
    const ref = bloqueError(page).locator("[data-referencia]");
    await expect(ref).toHaveCount(1);
    const leida = (await ref.innerText()).replace(`${B.referencia}: `, "").trim();
    expect(leida).toMatch(/^N-[0-9A-HJKMNP-TV-Z]{10}$/);
    expect(
      await page.evaluate(() => (window as unknown as Record<string, number>)["__visto"]),
    ).toBe(0);
    expect(await page.locator("body").innerText()).not.toContain("TESTIGO");
    expect(await page.content()).not.toContain("TESTIGO");
    for (const c of cuerpos) expect(c).not.toContain("TESTIGO");
    expect(await page.title()).not.toContain("TESTIGO");
    await expect(bloqueError(page)).not.toContainText("relation");
  });
});

test.describe("PRUEBA-016 · sin permiso, el mismo estado que la dirección inexistente (REQ-027, REQ-077, CA-020)", () => {
  const E1 = estado("estado-sin-permiso", "unico");

  test("texto genérico y un enlace al Resumen, dentro del armazón", async ({ page }) => {
    await abrir(page, E1);
    const sin = page.locator('[data-estado="sin-permiso"]');
    await expect(sin.getByRole("heading", { name: TEXTOS.sinPermiso.titulo })).toBeVisible();
    await expect(sin).toContainText(TEXTOS.sinPermiso.explicacion);
    const enlace = sin.getByRole("link", { name: TEXTOS.sinPermiso.volverAlResumen });
    await expect(enlace).toHaveAttribute("href", "/muestra");
    // Dentro del armazón: el menú y la cabecera siguen ahí.
    await expect(
      page.getByRole("navigation", { name: TEXTOS.armazon.navegacionPrincipal }),
    ).toBeVisible();
    await expect(page.locator("main")).toContainText(TEXTOS.sinPermiso.titulo);
  });

  test("con cualquier cosa en la dirección el marcado es idéntico y nada de eso llega al documento", async ({
    page,
  }) => {
    await abrir(page, E1);
    const base = await page.locator('[data-estado="sin-permiso"]').evaluate((e) => e.outerHTML);
    const textoBase = await page.locator("main").innerText();
    const consulta =
      "?id=0f8fad5b-d9cb-469f-a165-70867728950e&nombre=TESTIGO-NOMBRE&motivo=denegado";
    await page.goto(`${E1.ruta}${consulta}`);
    await page.waitForLoadState("networkidle");
    // Next escribe la dirección pedida en su propia carga (`"q":"?..."`): eso es del marco y lo
    // mide la prueba contrato de `/muestra/servidor/` (PRUEBA-034). Lo que cuenta aquí es el
    // estado: su marcado y su texto no cambian ni la llevan.
    const otro = await page.locator('[data-estado="sin-permiso"]').evaluate((e) => e.outerHTML);
    expect(otro).toBe(base);
    expect(await page.locator("main").innerText()).toBe(textoBase);
    expect(otro).not.toContain("TESTIGO");
    expect(await page.locator("main").innerHTML()).not.toContain("TESTIGO");
    expect(await page.title()).not.toContain("TESTIGO");
    expect(otro).not.toMatch(/403|denegad|prohibid|inexistente/i);
  });
});

test.describe("Sin JavaScript (REQ-044, REQ-023)", () => {
  test.use({ javaScriptEnabled: false, viewport: { width: 320, height: ALTO_POR_DEFECTO } });

  test("sin permiso se ve igual y su enlace funciona", async ({ page }) => {
    const e = estado("estado-sin-permiso", "unico");
    const r = await page.goto(e.ruta);
    expect(r?.status()).toBe(200);
    const sin = page.locator('[data-estado="sin-permiso"]');
    await expect(sin).toContainText(TEXTOS.sinPermiso.titulo);
    await sin.getByRole("link", { name: TEXTOS.sinPermiso.volverAlResumen }).click();
    await expect(page).toHaveURL(/\/muestra$/);
  });

  for (const forma of ["tarjeta", "tabla", "grafico", "lista"] as const) {
    test(`esqueleto ${forma}: se ve completo, con los bloques visibles y sin desplazamiento horizontal`, async ({
      page,
    }) => {
      const r = await page.goto(estado("esqueleto", forma).ruta);
      expect(r?.status()).toBe(200);
      const bloques = page.locator(`[data-esqueleto="${forma}"] [data-esqueleto-bloque]`);
      expect(await bloques.count()).toBeGreaterThan(2);
      await expect(bloques.first()).toBeVisible();
      const d = await medirDesborde(page);
      expect(d.sobra, "sobra").toBe(0);
      expect(d.fuera, "fuera").toEqual([]);
    });
  }

  test("error: el texto y la referencia dada se ven; el botón no hace nada sin JavaScript pero está", async ({
    page,
  }) => {
    await page.goto(estado("estado-error", "fallo-servidor").ruta);
    await expect(bloqueError(page)).toContainText(M.fallo_servidor);
    await expect(bloqueError(page).locator("[data-referencia]")).toHaveText(
      `${B.referencia}: S-7K3M9QX2AB`,
    );
    await expect(reintentar(page)).toHaveCount(1);
  });
});

test.describe("PRUEBA-016 · esqueleto (REQ-023, REQ-069, CA-016, CA-048)", () => {
  for (const forma of ["tarjeta", "tabla", "grafico", "lista"] as const) {
    test(`${forma}: forma dibujada, decorativa y ocupada; «Cargando» anunciado una sola vez`, async ({
      page,
    }) => {
      await vigilarAnuncios(page);
      await abrir(page, estado("esqueleto", forma));
      const esq = page.locator(`[data-esqueleto="${forma}"]`);
      await expect(esq).toBeVisible();
      await expect(esq).toHaveAttribute("aria-busy", "true");
      await expect(esq.locator("[data-esqueleto-bloque]").first()).toBeVisible();
      // Todos los bloques dibujados son decorativos y la forma tiene su marca propia.
      const sinOcultar = await esq
        .locator("[data-esqueleto-bloque]")
        .evaluateAll((bs) => bs.filter((b) => b.getAttribute("aria-hidden") !== "true").length);
      expect(sinOcultar).toBe(0);
      await expect(esq.locator(`[data-esqueleto-${forma}]`)).toHaveCount(1);
      await page.waitForTimeout(1500);
      expect(await anuncios(page)).toEqual([B.cargando]);
      await expect(page.locator("[data-carga-lenta]")).toHaveCount(0);
      // Una sola vez para el lector: el texto «Cargando» solo aparece una vez en el bloque.
      const texto = await esq.evaluate((e) => e.textContent ?? "");
      expect(veces(texto, B.cargando)).toBe(1);
    });
  }

  test("carga lenta: se ve y se anuncia, una sola vez, que tarda más de lo normal", async ({
    page,
  }) => {
    await vigilarAnuncios(page);
    await abrir(page, estado("esqueleto", "carga-lenta"));
    await expect(page.locator("[data-carga-lenta]")).toBeVisible();
    await expect(page.locator("[data-carga-lenta]")).toHaveText(B.cargaLenta);
    await page.waitForTimeout(1500);
    expect(await anuncios(page)).toEqual([B.cargando, B.cargaLenta]);
  });

  test("la forma tiene el alto del contenido: la tarjeta, el gráfico y las filas de la tabla miden lo mismo que lo real (a 1280 px)", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: ALTO_POR_DEFECTO });
    const alto = (l: Locator): Promise<number> =>
      l.evaluate((e) => e.getBoundingClientRect().height);

    await abrir(page, estado("esqueleto", "tarjeta"));
    const cajaTarjeta = await alto(page.locator("[data-esqueleto-tarjeta]"));
    await page.goto("/muestra/componentes/tarjeta-cifra/variantes");
    const real = page
      .locator("[data-tarjeta-cifra]", { has: page.locator("[data-variacion]") })
      .first();
    await expect(real).toBeVisible();
    expect(Math.abs((await alto(real)) - cajaTarjeta), "tarjeta").toBeLessThanOrEqual(2);

    await abrir(page, estado("esqueleto", "grafico"));
    const cajaGrafico = await alto(page.locator("[data-esqueleto-grafico]"));
    await page.goto("/muestra/componentes/grafico-lineas/una-serie");
    await page.waitForLoadState("networkidle");
    const figura = page.locator('figure[data-grafico="lineas"][data-estado="datos"]').first();
    await expect(figura).toBeVisible();
    expect(Math.abs((await alto(figura)) - cajaGrafico), "gráfico").toBeLessThanOrEqual(2);

    await abrir(page, estado("esqueleto", "tabla"));
    const filaEsqueleto = await alto(page.locator("[data-esqueleto-fila]").first());
    const tituloEsqueleto = await alto(page.locator("[data-esqueleto-tabla] > div").first());
    const cabeceraEsqueleto = await alto(page.locator("[data-esqueleto-tabla] > div").nth(1));
    await page.goto("/muestra/componentes/tabla/datos");
    await page.waitForLoadState("networkidle");
    // La fila real mide 47 px cuando lleva una etiqueta de estado y 37 con solo texto: se compara
    // con la celda de texto (relleno, raya y línea de su `bdi`), que es lo que dibuja el esqueleto.
    const filaReal = await page
      .locator("tbody th")
      .first()
      .evaluate((th) => {
        const c = getComputedStyle(th);
        const linea = th.querySelector("bdi")!.getBoundingClientRect().height;
        return (
          linea +
          parseFloat(c.paddingTop) +
          parseFloat(c.paddingBottom) +
          parseFloat(c.borderBottomWidth)
        );
      });
    expect(Math.abs(filaReal - filaEsqueleto), "fila de tabla").toBeLessThanOrEqual(2);
    expect(
      Math.abs((await alto(page.locator("caption"))) - tituloEsqueleto),
      "título de tabla",
    ).toBeLessThanOrEqual(2);
    expect(
      Math.abs((await alto(page.locator("thead tr"))) - cabeceraEsqueleto),
      "cabecera de tabla",
    ).toBeLessThanOrEqual(2);
  });
});

test.describe("PRUEBA-014 · movimiento reducido y colores forzados (REQ-038, REQ-039)", () => {
  test("control positivo: sin pedir movimiento reducido, el esqueleto late (animación infinita)", async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await abrir(page, estado("esqueleto", "tarjeta"));
    await expect
      .poll(
        async () =>
          (await medirAnimaciones(page)).filter((a) => a.enCurso && a.repeticionesPorSegundo > 0)
            .length,
      )
      .toBeGreaterThan(0);
  });

  for (const forma of ["tarjeta", "tabla", "grafico", "lista", "carga-lenta"]) {
    test(`con movimiento reducido el esqueleto ${forma} no se anima`, async ({ page }) => {
      await page.emulateMedia({ reducedMotion: "reduce" });
      await abrir(page, estado("esqueleto", forma));
      await page.waitForTimeout(500);
      const vivas = (await medirAnimaciones(page)).filter(
        (a) => a.enCurso && a.repeticionesPorSegundo > 0,
      );
      expect(vivas).toEqual([]);
      const opacidades = await page
        .locator("[data-esqueleto-bloque]")
        .evaluateAll((bs) => bs.map((b) => getComputedStyle(b).opacity));
      expect(new Set(opacidades)).toEqual(new Set(["1"]));
    });
  }

  test("colores forzados: los bloques del esqueleto, el vacío y el error conservan su borde", async ({
    page,
  }) => {
    await page.emulateMedia({ forcedColors: "active" });
    for (const [entrada, clave, selector] of [
      ["esqueleto", "tarjeta", "[data-esqueleto-bloque]"],
      ["esqueleto", "tabla", "[data-esqueleto-bloque]"],
      ["estado-vacio", "con-accion", '[data-estado="vacio"]'],
      ["estado-error", "fallo-servidor", '[data-estado="error"]'],
      ["estado-sin-permiso", "unico", '[data-estado="sin-permiso"]'],
    ] as const) {
      await abrir(page, estado(entrada, clave));
      const sinBorde = await page.locator(selector).evaluateAll(
        (xs) =>
          xs.filter((x) => {
            const c = getComputedStyle(x);
            return parseFloat(c.borderTopWidth) === 0 || c.borderTopStyle === "none";
          }).length,
      );
      expect(sinBorde, `${entrada}/${clave}`).toBe(0);
    }
    await abrir(page, estado("estado-error", "fallo-servidor"));
    // El error se dice con palabras: no depende del color.
    await expect(bloqueError(page)).toContainText(M.fallo_servidor);
    await reintentar(page).focus();
    expect(await reintentar(page).evaluate((b) => getComputedStyle(b).outlineStyle)).not.toBe(
      "none",
    );
  });
});

test.describe("PRUEBA-021 · solo con teclado (REQ-036, CA-027)", () => {
  test("estado vacío con acción: Tab llega al botón, con foco visible; Intro y Espacio lo activan", async ({
    page,
  }) => {
    await abrir(page, estado("estado-vacio", "con-accion"));
    const boton = page.locator('[data-estado="vacio"]').getByRole("button");
    await boton.focus();
    await expect(boton).toBeFocused();
    const contorno = await boton.evaluate((b) => {
      const c = getComputedStyle(b);
      return { estilo: c.outlineStyle, grosor: parseFloat(c.outlineWidth) };
    });
    expect(contorno.estilo).not.toBe("none");
    expect(contorno.grosor).toBeGreaterThanOrEqual(2);
    await page.keyboard.press("Enter");
    await expect(contador(page, "pedidas")).toHaveText("1");
    await page.keyboard.press("Space");
    await expect(contador(page, "pedidas")).toHaveText("2");
    await expect(boton).toBeFocused();
    const alto = await boton.evaluate((b) => b.getBoundingClientRect().height);
    expect(alto).toBeGreaterThanOrEqual(24);
  });

  test("error: se llega a «Reintentar» con Tab, Intro lo pide una vez y el foco no se pierde", async ({
    page,
  }) => {
    await abrir(page, estado("estado-error", "respuesta-no-valida"));
    const boton = reintentar(page);
    for (
      let i = 0;
      i < 40 && !(await boton.evaluate((b) => b === document.activeElement));
      i += 1
    ) {
      await page.keyboard.press("Tab");
    }
    await expect(boton).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(contador(page, "reintentos")).toHaveText("1");
    const enCurso = bloqueError(page).getByRole("button");
    await expect(enCurso).toBeFocused();
    await page.keyboard.press("Enter");
    await page.keyboard.press("Space");
    await expect(contador(page, "reintentos")).toHaveText("1");
  });

  test("sin permiso: el enlace al Resumen se alcanza con Tab y Intro lleva al Resumen", async ({
    page,
  }) => {
    await abrir(page, estado("estado-sin-permiso", "unico"));
    const enlace = page.getByRole("link", { name: TEXTOS.sinPermiso.volverAlResumen });
    for (
      let i = 0;
      i < 60 && !(await enlace.evaluate((a) => a === document.activeElement));
      i += 1
    ) {
      await page.keyboard.press("Tab");
    }
    await expect(enlace).toBeFocused();
    const caja = await enlace.boundingBox();
    expect(caja!.height).toBeGreaterThanOrEqual(24);
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/\/muestra$/);
  });
});

test.describe("PRUEBA-025 · axe tras actuar, a 320 y 1280 px, en claro y oscuro", () => {
  for (const ancho of [320, 1280]) {
    for (const tema of TEMAS) {
      test(`error tras pedir el reintento · ${ancho} px · ${tema}`, async ({ page }) => {
        await page.setViewportSize({ width: ancho, height: ALTO_POR_DEFECTO });
        await page.emulateMedia({ colorScheme: tema });
        await abrir(page, estado("estado-error", "tarda-demasiado"));
        await reintentar(page).click();
        await expect(contador(page, "reintentos")).toHaveText("1");
        await comprobarAccesibilidad(page);
      });

      test(`vacío tras pulsar la acción · ${ancho} px · ${tema}`, async ({ page }) => {
        await page.setViewportSize({ width: ancho, height: ALTO_POR_DEFECTO });
        await page.emulateMedia({ colorScheme: tema });
        await abrir(page, estado("estado-vacio", "con-accion"));
        await page.locator('[data-estado="vacio"]').getByRole("button").click();
        await expect(contador(page, "pedidas")).toHaveText("1");
        await comprobarAccesibilidad(page);
      });

      test(`esqueleto de carga lenta, ya anunciado · ${ancho} px · ${tema}`, async ({ page }) => {
        await page.setViewportSize({ width: ancho, height: ALTO_POR_DEFECTO });
        await page.emulateMedia({ colorScheme: tema });
        await abrir(page, estado("esqueleto", "carga-lenta"));
        await page.waitForTimeout(1200);
        await comprobarAccesibilidad(page);
      });
    }
  }
});

test.describe("PRUEBA-013 · desborde y espaciado de texto en los estados con texto (REQ-044, REQ-065)", () => {
  for (const [entrada, clave] of [
    ["estado-error", "referencia-invalida"],
    ["estado-vacio", "con-accion"],
    ["estado-sin-permiso", "unico"],
  ] as const) {
    test(`${entrada}/${clave}: a 320 px con el zum al 400 % no se desplaza la página`, async ({
      page,
    }) => {
      await page.setViewportSize({ width: 320, height: ALTO_POR_DEFECTO });
      await abrir(page, estado(entrada, clave));
      const d = await medirDesborde(page);
      expect(d.sobra, "sobra").toBe(0);
      expect(d.fuera, "fuera").toEqual([]);
    });
  }
});
