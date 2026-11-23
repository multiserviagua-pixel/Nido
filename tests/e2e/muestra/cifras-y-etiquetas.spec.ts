// PRUEBA-014 (tarjeta de cifra y etiqueta de estado; diseño 020 §Pruebas) y, para ellas, PRUEBA-013
// (999.999.999 completa a 320 px, sin recorte) y PRUEBA-025 (axe). CA-008, CA-009, CA-039, CA-040,
// CA-050, CA-051; REQ-011, REQ-012, REQ-038, REQ-050, REQ-053, REQ-055, REQ-075, REQ-076, REQ-081.
// Recorre las entradas `tarjeta-cifra` y `etiqueta-estado` del inventario. Los gráficos, la tabla y
// las alertas de PRUEBA-014 son de T-010 (g) a (i).
import { expect, test, type Locator, type Page } from "@playwright/test";
import { TEXTOS } from "../../../src/components/textos";
import { ESTADOS, abrirEstado, type EstadoDePrueba } from "./apoyo/estados";
import { ALTO_POR_DEFECTO, TEMAS, comprobarAccesibilidad } from "./configuracion-interfaz";
import {
  inyectarEspaciadoDeTexto,
  medirDesborde,
  medirRecortes,
  medirSolapes,
} from "./apoyo/medidas";

const TARJETAS = ESTADOS.filter((e) => e.entrada === "tarjeta-cifra");
const ETIQUETAS = ESTADOS.filter((e) => e.entrada === "etiqueta-estado");
const estado = (lista: readonly EstadoDePrueba[], clave: string): EstadoDePrueba => {
  const e = lista.find((x) => x.estado === clave);
  if (e === undefined) throw new Error(`falta el estado ${clave} del inventario`);
  return e;
};

const caso = (page: Page, clave: string): Locator => page.locator(`[data-caso="${clave}"]`);
const tarjeta = (page: Page, clave: string): Locator =>
  caso(page, clave).locator("[data-tarjeta-cifra]");

/** Nombre accesible exacto, con los espacios sin partir tratados como espacios. */
const espacios = (s: string): RegExp =>
  new RegExp(`^${s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/ /g, "\\s")}$`);

const E = TEXTOS.cifras.ejemplo;
const P = TEXTOS.cifras.comparacion.ultimos7Dias;
const V = TEXTOS.cifras.valoracion;

test("hay entradas que recorrer: la tarjeta y la etiqueta están en el inventario", () => {
  expect(TARJETAS.length).toBeGreaterThanOrEqual(4);
  expect(ETIQUETAS.length).toBeGreaterThanOrEqual(2);
});

test.describe("PRUEBA-014 · tarjeta: variantes y nombre accesible (CA-008, CA-040)", () => {
  const VARIANTES: ReadonlyArray<[string, string]> = [
    ["positiva-favorable", `${E.correosRevisados} 1.234 +12,2 % (${V.favorable}) ${P}`],
    ["negativa-favorable", `${E.avisosAbiertos} 8 −20,0 % (${V.favorable}) ${P}`],
    ["negativa-desfavorable", `${E.borradoresPreparados} 90 −25,0 % (${V.desfavorable}) ${P}`],
    ["positiva-desfavorable", `${E.respuestasPendientes} 45 +50,0 % (${V.desfavorable}) ${P}`],
    ["positiva-neutra", `${E.revisionesCompletas} 52 +8,3 % (${V.neutra}) ${P}`],
    ["nula", `${E.correosRevisados} 120 0 % (${TEXTOS.formato.sinCambios}) ${P}`],
    ["anterior-cero", `${E.borradoresPreparados} 50 +50 (${V.favorable}) ${P}`],
    ["sin-comparacion", `${E.correosRevisados} 100 ${TEXTOS.formato.sinDatosParaComparar} ${P}`],
    [
      "sin-dato",
      `${E.avisosAbiertos} ${TEXTOS.formato.sinDatos} ${TEXTOS.formato.sinDatosParaComparar} ${P}`,
    ],
    ["sin-variacion", `${E.revisionesCompletas} 1.234`],
  ];

  for (const [clave, nombre] of VARIANTES) {
    test(`${clave}: un solo grupo que se lee de una vez`, async ({ page }) => {
      await abrirEstado(page, estado(TARJETAS, "variantes"));
      const t = tarjeta(page, clave);
      await expect(t).toHaveAttribute("role", "group");
      await expect(t).toHaveAccessibleName(espacios(nombre));
    });
  }

  test("con valor anterior cero no hay porcentaje, y el periodo incompleto no lleva signo", async ({
    page,
  }) => {
    await abrirEstado(page, estado(TARJETAS, "variantes"));
    await expect(tarjeta(page, "anterior-cero")).not.toContainText("%");
    const incompleta = tarjeta(page, "sin-comparacion");
    await expect(incompleta).not.toContainText(/[+−]\d/);
    await expect(incompleta).not.toContainText(V.favorable);
  });

  test("el signo y la palabra van siempre, aunque el color acompañe: 4 variaciones con valoración", async ({
    page,
  }) => {
    await abrirEstado(page, estado(TARJETAS, "variantes"));
    for (const [clave, signo, palabra] of [
      ["positiva-favorable", "+", V.favorable],
      ["negativa-favorable", "−", V.favorable],
      ["negativa-desfavorable", "−", V.desfavorable],
      ["positiva-desfavorable", "+", V.desfavorable],
      ["positiva-neutra", "+", V.neutra],
    ] as const) {
      const variacion = tarjeta(page, clave).locator("[data-variacion]");
      await expect(variacion, clave).toHaveText(signo === "+" ? /^\+/ : /^−/);
      await expect(tarjeta(page, clave).locator("[data-valoracion]"), clave).toContainText(palabra);
    }
  });

  test("0 tarjetas con `style` en línea, y cada una es un grupo", async ({ page }) => {
    await abrirEstado(page, estado(TARJETAS, "variantes"));
    expect(
      await page.locator("[data-tarjeta-cifra] [style], [data-tarjeta-cifra][style]").count(),
    ).toBe(0);
    const tarjetas = await page.locator("[data-tarjeta-cifra]").count();
    expect(tarjetas).toBe(await page.locator('[data-tarjeta-cifra][role="group"]').count());
    expect(tarjetas).toBe(await page.locator("li[data-caso]").count());
  });
});

test.describe("PRUEBA-014 · tarjeta: cero, sin dato y valores imposibles (CA-039)", () => {
  const SIN_DATO = ["ausente", "nulo", "no-numerico", "no-finito", "negativo"] as const;

  test("cero se ve y se lee como «0»", async ({ page }) => {
    await abrirEstado(page, estado(TARJETAS, "casos-limite"));
    const t = tarjeta(page, "cero");
    await expect(t.locator("[data-cifra]")).toHaveText("0");
    await expect(t).toHaveAccessibleName(espacios(`${E.avisosAbiertos} 0`));
  });

  for (const clave of SIN_DATO) {
    test(`${clave}: «Sin datos» con ese mismo texto accesible, nunca cero ni el valor recibido`, async ({
      page,
    }) => {
      await abrirEstado(page, estado(TARJETAS, "casos-limite"));
      const t = tarjeta(page, clave);
      await expect(t.locator("[data-cifra]")).toHaveText(TEXTOS.formato.sinDatos);
      await expect(t).toHaveAccessibleName(
        espacios(`${E.avisosAbiertos} ${TEXTOS.formato.sinDatos}`),
      );
    });
  }

  test("un negativo que la vista admite se ve con el signo menos; un decimal, con coma", async ({
    page,
  }) => {
    await abrirEstado(page, estado(TARJETAS, "casos-limite"));
    await expect(tarjeta(page, "negativo-admitido").locator("[data-cifra]")).toHaveText("−5");
    await expect(tarjeta(page, "decimales").locator("[data-cifra]")).toHaveText("28,4");
    await expect(tarjeta(page, "cero-contra-cero")).toHaveAccessibleName(
      espacios(`${E.avisosAbiertos} 0 0 % (${TEXTOS.formato.sinCambios}) ${P}`),
    );
  });

  test("vaciando los datos, ninguna cifra se ve como cero ni como valor suelto", async ({
    page,
  }) => {
    await abrirEstado(page, estado(TARJETAS, "casos-limite"));
    for (const clave of SIN_DATO) {
      const texto = (await tarjeta(page, clave).innerText()).replace(/\s+/g, " ");
      expect(texto, clave).not.toMatch(/(?:^|\s)0(?:\s|$)/);
    }
  });
});

test.describe("PRUEBA-013 · cifras muy grandes: completas, sin abreviar ni cortar (CA-050, REQ-081)", () => {
  const GRANDES = [
    ["novecientos", "999.999.999"],
    ["doce-cifras", "999.999.999.999"],
    ["quince-cifras", "999.999.999.999.999"],
  ] as const;
  const PASOS = ["cifra", "titulo", "subtitulo", "cuerpo", "cuerpo-menor", "pequeno"];

  /** Mide el valor de una tarjeta: dónde queda respecto a ella y qué paso eligió. */
  async function medir(t: Locator) {
    return t.evaluate((tarjetaEl) => {
      const valor = tarjetaEl.querySelector("[data-cifra]") as HTMLElement;
      const caja = valor.parentElement as HTMLElement;
      const rt = tarjetaEl.getBoundingClientRect();
      const rv = valor.getBoundingClientRect();
      const rc = caja.getBoundingClientRect();
      return {
        texto: valor.textContent ?? "",
        paso: valor.dataset.paso ?? "",
        dentroX: rv.left >= rt.left - 1 && rv.right <= rt.right + 1,
        dentroCaja: rv.right <= rc.right + 1,
        lineas: Math.round(rv.height / parseFloat(getComputedStyle(valor).lineHeight)),
        tarjetaSeDesplaza: tarjetaEl.scrollWidth > tarjetaEl.clientWidth + 1,
        tamano: parseFloat(getComputedStyle(valor).fontSize),
      };
    });
  }

  for (const ancho of [320, 375, 640, 1280]) {
    for (const tema of TEMAS) {
      test(`${ancho} px · ${tema}: cada cifra se ve entera dentro de su tarjeta`, async ({
        page,
      }) => {
        await page.setViewportSize({ width: ancho, height: ALTO_POR_DEFECTO });
        await page.emulateMedia({ colorScheme: tema });
        await abrirEstado(page, estado(TARJETAS, "cifra-999999999"));
        await page.waitForLoadState("networkidle");
        for (const [clave, texto] of GRANDES) {
          const m = await medir(tarjeta(page, clave));
          expect(m.texto, clave).toBe(texto);
          expect(PASOS, clave).toContain(m.paso);
          expect(m.dentroX, `${clave}: dentro de la tarjeta`).toBe(true);
          expect(m.dentroCaja, `${clave}: dentro de su caja`).toBe(true);
          expect(m.tarjetaSeDesplaza, `${clave}: la tarjeta no se desplaza`).toBe(false);
          expect(m.lineas, `${clave}: en una línea`).toBe(1);
        }
        expect(await medirDesborde(page)).toEqual({ sobra: 0, fuera: [] });
        expect(await medirRecortes(page)).toEqual([]);
        await expect(page.getByText("999.999.999").first()).toBeVisible();
      });
    }
  }

  test("a 320 px el tamaño baja por pasos de la escala y es el mayor que cabe", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 320, height: ALTO_POR_DEFECTO });
    await abrirEstado(page, estado(TARJETAS, "cifra-999999999"));
    await page.waitForLoadState("networkidle");
    // En el paso siguiente por arriba, el valor ya no cabe en su caja.
    for (const [clave] of GRANDES) {
      const r = await tarjeta(page, clave).evaluate((tarjetaEl, pasos) => {
        const valor = tarjetaEl.querySelector("[data-cifra]") as HTMLElement;
        const caja = valor.parentElement as HTMLElement;
        const i = pasos.indexOf(valor.dataset.paso ?? "");
        if (i <= 0) return { indice: i, mayorCabe: true };
        const copia = valor.cloneNode(true) as HTMLElement;
        copia.removeAttribute("id");
        copia.className = copia.className.replace(
          /\btext-(?:cifra|titulo|subtitulo|cuerpo-menor|cuerpo|pequeno)\b/,
          `text-${pasos[i - 1]}`,
        );
        copia.classList.remove("max-w-full", "whitespace-normal", "wrap-anywhere");
        copia.classList.add("whitespace-nowrap");
        copia.style.visibility = "hidden";
        copia.style.position = "absolute";
        caja.appendChild(copia);
        const ancho = copia.getBoundingClientRect().width;
        copia.remove();
        return { indice: i, mayorCabe: ancho > caja.getBoundingClientRect().width - 1 };
      }, PASOS);
      expect(r.mayorCabe, `${clave}: el paso anterior no cabía`).toBe(true);
    }
  });

  test("a 1280 px, 999.999.999 cabe en el paso mayor", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: ALTO_POR_DEFECTO });
    await abrirEstado(page, estado(TARJETAS, "cifra-999999999"));
    await page.waitForLoadState("networkidle");
    expect((await medir(tarjeta(page, "novecientos"))).paso).toBe("cifra");
  });

  test("más de 15 cifras es «Sin datos»: no se pinta un número que no se puede leer entero", async ({
    page,
  }) => {
    await abrirEstado(page, estado(TARJETAS, "cifra-999999999"));
    await expect(tarjeta(page, "sin-paso").locator("[data-cifra]")).toHaveText(
      TEXTOS.formato.sinDatos,
    );
  });

  test("espaciado de texto de la norma inyectado: sigue entera, sin desplazamiento", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 320, height: ALTO_POR_DEFECTO });
    await abrirEstado(page, estado(TARJETAS, "cifra-999999999"));
    await page.waitForLoadState("networkidle");
    await inyectarEspaciadoDeTexto(page);
    await expect
      .poll(async () => {
        const salida: boolean[] = [];
        for (const [clave] of GRANDES) {
          const m = await medir(tarjeta(page, clave));
          salida.push(m.dentroX && m.dentroCaja && !m.tarjetaSeDesplaza);
        }
        return salida.every(Boolean);
      })
      .toBe(true);
    expect(await medirDesborde(page)).toEqual({ sobra: 0, fuera: [] });
    expect(await medirRecortes(page)).toEqual([]);
  });

  test("zum al 400 % (ventana de 320 px de ancho y poco alto): la cifra sigue entera", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 320, height: 256 });
    await abrirEstado(page, estado(TARJETAS, "cifra-999999999"));
    await page.waitForLoadState("networkidle");
    const m = await medir(tarjeta(page, "novecientos"));
    expect(m.dentroX && m.dentroCaja).toBe(true);
    expect(await medirDesborde(page)).toEqual({ sobra: 0, fuera: [] });
  });

  test.describe("sin JavaScript: el paso de partida ya cabe a 320 px", () => {
    test.use({ javaScriptEnabled: false });
    test("999.999.999 y 999.999.999.999.999 enteras", async ({ page }) => {
      await page.setViewportSize({ width: 320, height: ALTO_POR_DEFECTO });
      await abrirEstado(page, estado(TARJETAS, "cifra-999999999"));
      for (const [clave, texto] of GRANDES) {
        const m = await medir(tarjeta(page, clave));
        expect(m.texto).toBe(texto);
        expect(m.dentroX && m.dentroCaja, `${clave} dentro de la tarjeta`).toBe(true);
      }
      expect(await medirDesborde(page)).toEqual({ sobra: 0, fuera: [] });
    });
  });
});

test.describe("PRUEBA-013 · etiqueta larga: se parte en líneas, sin recorte ni solapes", () => {
  for (const ancho of [320, 1280]) {
    test(`${ancho} px`, async ({ page }) => {
      await page.setViewportSize({ width: ancho, height: ALTO_POR_DEFECTO });
      await abrirEstado(page, estado(TARJETAS, "etiqueta-larga"));
      expect(await medirSolapes(page), "solapes").toEqual([]);
      expect(await medirRecortes(page), "recortes").toEqual([]);
      expect(await medirDesborde(page), "desplazamiento").toEqual({ sobra: 0, fuera: [] });
      await expect(page.getByText(E.etiquetaLarga)).toBeVisible();
    });
  }

  test("con el espaciado de texto de la norma", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: ALTO_POR_DEFECTO });
    await abrirEstado(page, estado(TARJETAS, "etiqueta-larga"));
    await page.waitForLoadState("networkidle");
    await inyectarEspaciadoDeTexto(page);
    expect(await medirSolapes(page)).toEqual([]);
    expect(await medirRecortes(page)).toEqual([]);
    expect(await medirDesborde(page)).toEqual({ sobra: 0, fuera: [] });
  });
});

test.describe("PRUEBA-014 · etiqueta de estado: palabra, icono y tono (CA-009, REQ-012, REQ-038)", () => {
  const CATALOGO = [
    ["agente.activo", TEXTOS.estados["agente.activo"], "correcto"],
    ["agente.en_pausa", TEXTOS.estados["agente.en_pausa"], "aviso"],
    ["agente.con_avisos", TEXTOS.estados["agente.con_avisos"], "aviso"],
    ["agente.sin_senal", TEXTOS.estados["agente.sin_senal"], "error"],
  ] as const;

  test("cada estado muestra su palabra, su icono y su tono", async ({ page }) => {
    await abrirEstado(page, estado(ETIQUETAS, "catalogo"));
    for (const [clave, palabra, tono] of CATALOGO) {
      const etiqueta = caso(page, clave).locator("[data-estado]");
      await expect(etiqueta, clave).toHaveText(palabra);
      await expect(etiqueta, clave).toHaveAttribute("data-estado", clave);
      await expect(etiqueta, clave).toHaveAttribute("data-tono", tono);
      await expect(etiqueta.locator("svg"), clave).toHaveCount(1);
      // El icono es decorativo: el nombre de la etiqueta es su palabra.
      await expect(etiqueta.locator("svg")).toHaveAttribute("aria-hidden", "true");
    }
  });

  test("sin el color también se distinguen: icono y palabra distintos por estado", async ({
    page,
  }) => {
    await abrirEstado(page, estado(ETIQUETAS, "catalogo"));
    const iconos = new Set<string>();
    const palabras = new Set<string>();
    for (const [clave, palabra] of CATALOGO) {
      const etiqueta = caso(page, clave).locator("[data-estado]");
      iconos.add(await etiqueta.locator("svg").innerHTML());
      palabras.add(palabra);
    }
    expect(palabras.size).toBe(CATALOGO.length);
    // Correcto, pausa, aviso y error: cuatro iconos distintos.
    expect(iconos.size).toBe(CATALOGO.length);
  });

  test("escala de grises: la etiqueta conserva palabra, icono y borde", async ({ page }) => {
    await abrirEstado(page, estado(ETIQUETAS, "catalogo"));
    await page.addStyleTag({ content: "html { filter: grayscale(1); }" });
    for (const [clave, palabra] of CATALOGO) {
      const etiqueta = caso(page, clave).locator("[data-estado]");
      await expect(etiqueta).toBeVisible();
      await expect(etiqueta).toHaveText(palabra);
      const borde = await etiqueta.evaluate((e) => getComputedStyle(e).borderTopWidth);
      expect(parseFloat(borde), clave).toBeGreaterThan(0);
    }
  });

  test("colores forzados: la etiqueta mantiene borde y color de texto del sistema", async ({
    page,
  }) => {
    await page.emulateMedia({ forcedColors: "active" });
    await abrirEstado(page, estado(ETIQUETAS, "catalogo"));
    for (const [clave] of CATALOGO) {
      const medida = await caso(page, clave)
        .locator("[data-estado]")
        .evaluate((e) => {
          const s = getComputedStyle(e);
          return { borde: parseFloat(s.borderTopWidth), estilo: s.borderTopStyle };
        });
      expect(medida.borde, clave).toBeGreaterThan(0);
      expect(medida.estilo, clave).not.toBe("none");
    }
  });

  for (const ancho of [320, 1280]) {
    test(`${ancho} px: sin recortes ni desplazamiento`, async ({ page }) => {
      await page.setViewportSize({ width: ancho, height: ALTO_POR_DEFECTO });
      await abrirEstado(page, estado(ETIQUETAS, "catalogo"));
      expect(await medirRecortes(page)).toEqual([]);
      expect(await medirDesborde(page)).toEqual({ sobra: 0, fuera: [] });
    });
  }
});

test.describe("PRUEBA-014 · estado desconocido y campos de más (CA-051, REQ-075)", () => {
  const FUERA = ["inventado", "mayusculas", "vacio", "ausente", "objeto", "ambito"];

  test("todo valor fuera del catálogo es «Estado desconocido» en tono neutro", async ({ page }) => {
    await abrirEstado(page, estado(ETIQUETAS, "desconocido"));
    for (const clave of FUERA) {
      const etiqueta = caso(page, clave).locator("[data-estado]");
      await expect(etiqueta, clave).toHaveText(TEXTOS.estados.desconocido);
      await expect(etiqueta, clave).toHaveAttribute("data-estado", "desconocido");
      await expect(etiqueta, clave).toHaveAttribute("data-tono", "neutro");
    }
    // Ninguno se presenta como un estado favorable.
    await expect(page.locator('[data-tono="correcto"]')).toHaveCount(1); // solo el de la respuesta válida
  });

  test("tres campos de más en la respuesta no aparecen en ningún sitio", async ({ page }) => {
    const respuesta = await page.goto(estado(ETIQUETAS, "desconocido").ruta);
    expect(respuesta?.status()).toBe(200);
    await expect(page.locator("h1").first()).toBeVisible();
    // La fila de la respuesta lee solo el campo `estado`.
    await expect(caso(page, "campos-de-mas").locator("[data-estado]")).toHaveText(
      TEXTOS.estados["agente.activo"],
    );
    const crudo = await respuesta!.text();
    const pintado = await page.content();
    const texto = await page.locator("body").innerText();
    for (const [donde, contenido] of [
      ["el HTML recibido", crudo],
      ["el documento pintado", pintado],
      ["el texto visible", texto],
    ] as const) {
      expect(contenido, donde).not.toMatch(/TESTIGO-CAMPO-DE-MAS/);
    }
  });
});

test.describe("PRUEBA-025 · axe sobre tarjeta y etiqueta, a 320 y 1280 px, en claro y oscuro", () => {
  for (const e of [...TARJETAS, ...ETIQUETAS]) {
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
