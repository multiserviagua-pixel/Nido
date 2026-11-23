// PRUEBA-014 (gráficos; diseño 020 §Pruebas) y, para ellos, PRUEBA-013 (anchos, zum, nombres de
// 120 caracteres), PRUEBA-025 (axe), colores forzados, teclado y movimiento. CA-006, CA-011,
// CA-040, CA-041, CA-049, CA-050; REQ-014, REQ-015, REQ-038, REQ-039, REQ-043, REQ-052, REQ-054,
// REQ-056, REQ-071. Recorre las entradas `grafico-lineas` y `grafico-barras` del inventario. La
// carga y el error del gráfico son del bloque de datos (T-016).
//
// Lo central: el dibujo y la tabla equivalente tienen los mismos valores. Se comprueba contra lo
// que Recharts ha pintado de verdad (vértices de cada trazado, marcadores y barras con su valor),
// no contra los datos de entrada.
import { expect, test, type Locator, type Page } from "@playwright/test";
import { ESTADOS, abrirEstado, type EstadoDePrueba } from "./apoyo/estados";
import { ALTO_POR_DEFECTO, TEMAS, comprobarAccesibilidad } from "./configuracion-interfaz";
import {
  inyectarEspaciadoDeTexto,
  medirAnimaciones,
  medirDesborde,
  medirRecortes,
  medirSolapes,
} from "./apoyo/medidas";

const LINEAS = ESTADOS.filter((e) => e.entrada === "grafico-lineas");
const BARRAS = ESTADOS.filter((e) => e.entrada === "grafico-barras");
const TODOS = [...LINEAS, ...BARRAS];
const SIN_DIBUJO = new Set(["sin-datos", "pocos-puntos"]);
const CON_DIBUJO = TODOS.filter((e) => !SIN_DIBUJO.has(e.estado));

const estado = (entrada: string, clave: string): EstadoDePrueba => {
  const e = ESTADOS.find((x) => x.entrada === entrada && x.estado === clave);
  if (e === undefined) throw new Error(`falta el estado ${entrada}/${clave} del inventario`);
  return e;
};

/** Abre el estado y espera a que Recharts haya pintado su `svg` (se carga tras hidratar). */
async function abrirConDibujo(page: Page, e: EstadoDePrueba): Promise<void> {
  await abrirEstado(page, e);
  await page.waitForLoadState("networkidle");
  await expect(page.locator("[data-grafico] [data-dibujo] svg.recharts-surface")).toHaveCount(1);
  await expect(page.locator("[data-grafico] [data-dibujo] svg.recharts-surface")).toBeVisible();
}

const tabla = (page: Page): Locator => page.locator("table[data-tabla-equivalente]");
const sinDatos = "Sin datos";

/** El texto de cada celda de la columna `columna` (1 = primera serie) de la tabla equivalente. */
async function columnaDe(page: Page, columna: number): Promise<string[]> {
  // `textContent`: la tabla puede estar dentro del bloque cerrado.
  return tabla(page)
    .locator(`tbody tr td:nth-of-type(${columna})`)
    .evaluateAll((celdas) => celdas.map((c) => (c.textContent ?? "").trim()));
}
const numero = (texto: string): number =>
  Number(texto.replace(/\./g, "").replace(",", ".").replace("−", "-"));

test("hay entradas que recorrer: los gráficos tienen sus estados en el inventario", () => {
  expect(LINEAS.map((e) => e.estado).sort()).toEqual(
    [
      "una-serie",
      "cuatro-series",
      "con-hueco",
      "pocos-puntos",
      "sin-datos",
      "tabla-abierta",
      "un-punto",
      "valores-iguales",
      "negativos",
      "cientos-de-puntos",
      "etiquetas-largas-120",
      "texto-hostil",
    ].sort(),
  );
  expect(BARRAS.map((e) => e.estado).sort()).toEqual(
    [
      "una-serie",
      "varias-series",
      "con-cero",
      "pocos-puntos",
      "sin-datos",
      "tabla-abierta",
      "valores-iguales",
      "muchos-puntos",
      "etiquetas-largas-120",
      "texto-hostil",
    ].sort(),
  );
});

test.describe("PRUEBA-014 · gráficos: título, unidades, nombre accesible y tabla (REQ-014, REQ-015)", () => {
  for (const e of [estado("grafico-lineas", "una-serie"), estado("grafico-barras", "una-serie")]) {
    test(`${e.etiqueta}: figura con título, ejes con unidad e imagen con nombre y descripción`, async ({
      page,
    }) => {
      await abrirConDibujo(page, e);
      const figura = page.locator("figure[data-grafico]");
      await expect(figura.locator("figcaption")).not.toHaveText("");
      const titulo = ((await figura.locator("figcaption").textContent()) ?? "").trim();
      const imagen = figura.getByRole("img", { name: titulo, exact: true });
      await expect(imagen).toHaveCount(1);
      await expect(figura).toContainText("Eje horizontal");
      await expect(figura).toContainText("Eje vertical");
      await expect(figura).toContainText("(correos)");
      const descripcion = await imagen.evaluate((el) => {
        const id = el.getAttribute("aria-describedby") ?? "";
        return document.getElementById(id)?.textContent ?? "";
      });
      expect(descripcion).toContain("tabla de datos");
      expect(descripcion).toMatch(/Gráfico de (líneas|barras) con 1 serie y/);
    });

    test(`${e.etiqueta}: la tabla está justo después del dibujo, cerrada, y se abre con teclado`, async ({
      page,
    }) => {
      await abrirConDibujo(page, e);
      const detalles = page.locator("figure[data-grafico] details");
      await expect(detalles).not.toHaveAttribute("open", "");
      await expect(tabla(page)).toBeHidden();
      const orden = await page.evaluate(() => {
        const i = document.querySelector("[role=img]");
        const d = document.querySelector("figure[data-grafico] details");
        return !!i && !!d && !!(i.compareDocumentPosition(d) & Node.DOCUMENT_POSITION_FOLLOWING);
      });
      expect(orden).toBe(true);
      await page.getByText("Ver los datos en tabla").focus();
      await page.keyboard.press("Enter");
      await expect(detalles).toHaveAttribute("open", "");
      await expect(tabla(page)).toBeVisible();
      await page.keyboard.press("Space");
      await expect(tabla(page)).toBeHidden();
    });
  }

  for (const e of [
    estado("grafico-lineas", "tabla-abierta"),
    estado("grafico-barras", "tabla-abierta"),
  ]) {
    test(`${e.etiqueta}: sale con la tabla abierta, con encabezados de fila y de columna`, async ({
      page,
    }) => {
      await abrirConDibujo(page, e);
      await expect(tabla(page)).toBeVisible();
      await expect(tabla(page).locator("caption")).not.toHaveText("");
      await expect(tabla(page).locator("th[scope=col]")).toHaveCount(2);
      expect(await tabla(page).locator("tbody th[scope=row]").count()).toBeGreaterThan(5);
    });
  }
});

test.describe("PRUEBA-014 · el dibujo y la tabla tienen los mismos valores (CA-011, REQ-015)", () => {
  test("líneas con marcadores: cada marcador dibujado está en su fila de la tabla, con su valor", async ({
    page,
  }) => {
    for (const clave of [
      "una-serie",
      "cuatro-series",
      "con-hueco",
      "valores-iguales",
      "negativos",
    ]) {
      await abrirConDibujo(page, estado("grafico-lineas", clave));
      const series = await page.locator("figure[data-grafico]").getAttribute("data-estado");
      expect(series).toBe("datos");
      const nSeries = Number(await page.locator("[role=img]").getAttribute("data-series"));
      for (let s = 0; s < nSeries; s++) {
        const celdas = await columnaDe(page, s + 1);
        const presentes = celdas.map((t, i) => ({ t, i })).filter((x) => x.t !== sinDatos);
        const marcadores = await page.locator(`[data-punto][data-serie="${s}"]`).evaluateAll((ms) =>
          ms.map((m) => ({
            indice: Number(m.getAttribute("data-indice")),
            valor: m.getAttribute("data-valor") ?? "",
          })),
        );
        expect(marcadores.length, `${clave} serie ${s}: marcadores`).toBe(presentes.length);
        for (const m of marcadores) {
          expect(celdas[m.indice], `${clave} serie ${s} punto ${m.indice}`).toBe(m.valor);
        }
        // Y el trazado tiene tantos vértices como valores con dato.
        const vertices = await page
          .locator(`.grafico-serie-${s} path.recharts-line-curve`)
          .evaluateAll((ps) =>
            ps.reduce((t, p) => t + (p.getAttribute("d")?.match(/[ML]/g)?.length ?? 0), 0),
          );
        expect(vertices, `${clave} serie ${s}: vértices del trazado`).toBe(presentes.length);
      }
    }
  });

  test("con huecos: la línea no se une y los días sin dato no tienen marcador ni son cero", async ({
    page,
  }) => {
    await abrirConDibujo(page, estado("grafico-lineas", "con-hueco"));
    const celdas = await columnaDe(page, 1);
    expect(celdas.filter((c) => c === sinDatos)).toHaveLength(4);
    expect(celdas).not.toContain("0");
    const trazos = await page
      .locator(".grafico-serie-0 path.recharts-line-curve")
      .evaluate((p) => (p.getAttribute("d") ?? "").match(/M/g)?.length ?? 0);
    expect(trazos, "tramos separados (5 + 1 + 1 + 3 puntos)").toBe(4);
    const indices = await page
      .locator("[data-punto]")
      .evaluateAll((ms) => ms.map((m) => Number(m.getAttribute("data-indice"))));
    for (const i of [5, 6, 8, 10]) expect(indices).not.toContain(i);
    expect(indices).toHaveLength(10);
  });

  test("366 puntos: el trazado de cada serie tiene los 366 vértices y la tabla las 366 filas", async ({
    page,
  }) => {
    await abrirConDibujo(page, estado("grafico-lineas", "cientos-de-puntos"));
    await page.getByText("Ver los datos en tabla").click();
    await expect(tabla(page).locator("tbody tr")).toHaveCount(366);
    for (const s of [0, 1]) {
      const vertices = await page
        .locator(`.grafico-serie-${s} path.recharts-line-curve`)
        .evaluate((p) => (p.getAttribute("d") ?? "").match(/[ML]/g)?.length ?? 0);
      expect(vertices, `serie ${s}`).toBe(366);
      const celdas = await columnaDe(page, s + 1);
      expect(celdas).toHaveLength(366);
      expect(celdas.every((c) => c !== sinDatos)).toBe(true);
    }
    // Sin marcadores (se taparían) y sin desbordar.
    await expect(page.locator("[data-punto]")).toHaveCount(0);
    expect(await medirDesborde(page)).toEqual({ sobra: 0, fuera: [] });
  });

  test("barras: cada barra dibujada está en su fila de la tabla, con su valor", async ({
    page,
  }) => {
    for (const clave of [
      "una-serie",
      "varias-series",
      "con-cero",
      "valores-iguales",
      "muchos-puntos",
    ]) {
      await abrirConDibujo(page, estado("grafico-barras", clave));
      const nSeries = Number(await page.locator("[role=img]").getAttribute("data-series"));
      for (let s = 0; s < nSeries; s++) {
        const celdas = await columnaDe(page, s + 1);
        const barras = await page.locator(`[data-barra][data-serie="${s}"]`).evaluateAll((bs) =>
          bs.map((b) => ({
            indice: Number(b.getAttribute("data-indice")),
            valor: b.getAttribute("data-valor") ?? "",
          })),
        );
        expect(barras.length, `${clave} serie ${s}: barras`).toBe(
          celdas.filter((c) => c !== sinDatos).length,
        );
        for (const b of barras) expect(celdas[b.indice], `${clave} serie ${s}`).toBe(b.valor);
        // La suma de lo dibujado es la suma de la tabla.
        const suma = (xs: string[]): number => xs.reduce((t, x) => t + numero(x), 0);
        expect(suma(barras.map((b) => b.valor))).toBe(suma(celdas.filter((c) => c !== sinDatos)));
      }
    }
  });

  test("barras desde cero: todas apoyan en la misma base, el eje empieza en 0 y la altura es proporcional", async ({
    page,
  }) => {
    await abrirConDibujo(page, estado("grafico-barras", "una-serie"));
    const cajas = await page.locator('[data-barra][data-serie="0"]').evaluateAll((bs) =>
      bs.map((b) => {
        const r = (b as SVGRectElement).getBoundingClientRect();
        return { valor: b.getAttribute("data-valor") ?? "", base: r.bottom, alto: r.height };
      }),
    );
    expect(cajas.length).toBe(7);
    for (const c of cajas) expect(Math.abs(c.base - cajas[0]!.base)).toBeLessThan(2);
    const [a, b] = [cajas[0]!, cajas[1]!]; // 320 y 410
    expect(a.alto / b.alto).toBeCloseTo(numero(a.valor) / numero(b.valor), 1);
    // La marca más baja del eje de valores es el 0.
    const marcas = await page
      .locator(".recharts-yAxis-tick-labels .recharts-cartesian-axis-tick-value")
      .evaluateAll((ts) =>
        ts
          .map((t) => ({ y: t.getBoundingClientRect().top, texto: (t.textContent ?? "").trim() }))
          .sort((p, q) => q.y - p.y),
      );
    expect(marcas[0]?.texto).toBe("0");
  });

  test("un valor cero se marca sobre el eje y no se confunde con un hueco", async ({ page }) => {
    await abrirConDibujo(page, estado("grafico-barras", "con-cero"));
    const ceros = await page
      .locator('[data-barra][data-valor="0"]')
      .evaluateAll((bs) => bs.map((b) => b.getBoundingClientRect().height));
    expect(ceros).toHaveLength(2);
    for (const h of ceros) expect(h).toBeGreaterThan(0);
    expect((await columnaDe(page, 1)).filter((c) => c === "0")).toHaveLength(2);
  });

  test("líneas con negativos: el eje incluye el cero y la tabla usa el signo menos", async ({
    page,
  }) => {
    await abrirConDibujo(page, estado("grafico-lineas", "negativos"));
    const celdas = await columnaDe(page, 1);
    expect(celdas.filter((c) => c.startsWith("−")).length).toBeGreaterThan(0);
    const marcas = await page
      .locator(".recharts-yAxis-tick-labels .recharts-cartesian-axis-tick-value")
      .evaluateAll((ts) => ts.map((t) => t.textContent ?? ""));
    expect(marcas.map((t) => t.trim())).toContain("0");
    expect(marcas.some((t) => t.trim().startsWith("−"))).toBe(true);
  });
});

test.describe("PRUEBA-014 · «Sin datos» y «Sin datos suficientes» en lugar del gráfico (REQ-052, REQ-054)", () => {
  for (const entrada of ["grafico-lineas", "grafico-barras"]) {
    test(`${entrada}: menos puntos que el mínimo`, async ({ page }) => {
      await abrirEstado(page, estado(entrada, "pocos-puntos"));
      await page.waitForLoadState("networkidle");
      await expect(page.locator("[data-grafico-vacio]")).toContainText("Sin datos suficientes");
      await expect(page.locator("[role=img]")).toHaveCount(0);
      await expect(page.locator("svg.recharts-surface")).toHaveCount(0);
      await expect(tabla(page)).toHaveCount(0);
    });
    test(`${entrada}: sin datos`, async ({ page }) => {
      await abrirEstado(page, estado(entrada, "sin-datos"));
      await page.waitForLoadState("networkidle");
      await expect(page.locator("[data-grafico-vacio]")).toContainText("Sin datos");
      await expect(page.locator("[data-grafico-vacio]")).not.toContainText("suficientes");
      await expect(page.locator("[role=img]")).toHaveCount(0);
      await expect(page.locator("svg.recharts-surface")).toHaveCount(0);
      await expect(page.locator("figure[data-grafico] figcaption")).not.toHaveText("");
    });
  }

  test("un solo punto en líneas: se pinta el marcador, sin línea", async ({ page }) => {
    await abrirConDibujo(page, estado("grafico-lineas", "un-punto"));
    await expect(page.locator("[data-punto]")).toHaveCount(1);
    expect(await columnaDe(page, 1)).toEqual(["95"]);
  });
});

test.describe("PRUEBA-014 · las series se distinguen sin color y nada exige el puntero (REQ-014, REQ-038)", () => {
  test("cuatro líneas: cuatro combinaciones distintas de grosor, trazo y marcador, y la leyenda dice cuál es cuál", async ({
    page,
  }) => {
    await abrirConDibujo(page, estado("grafico-lineas", "cuatro-series"));
    const estilos = await page.locator(".recharts-line-curve").evaluateAll((ps) =>
      ps.map((p) => {
        const s = getComputedStyle(p);
        return `${s.strokeWidth}|${s.strokeDasharray}`;
      }),
    );
    expect(new Set(estilos).size).toBe(4);
    const marcadores = await page
      .locator("[data-punto]")
      .evaluateAll((ms) => [...new Set(ms.map((m) => m.getAttribute("data-marcador")))]);
    expect(marcadores.sort()).toEqual(["circulo", "cuadrado", "rombo", "triangulo"]);
    const leyenda = page.locator("[data-leyenda-serie]");
    await expect(leyenda).toHaveCount(4);
    await expect(leyenda.nth(2).locator('[data-trazo="rayas"]')).toHaveCount(1);
    await expect(leyenda.nth(3).locator('[data-trazo="puntos"]')).toHaveCount(1);
    // La serie principal va en el acento.
    const colores = await page.evaluate(() => {
      const sonda = document.createElement("span");
      sonda.style.color = "var(--serie-1)";
      document.body.append(sonda);
      const esperado = getComputedStyle(sonda).color;
      sonda.remove();
      const trazo = getComputedStyle(
        document.querySelector(".grafico-serie-0 path.recharts-line-curve")!,
      ).stroke;
      return { esperado, trazo };
    });
    expect(colores.trazo).toBe(colores.esperado);
  });

  test("tres barras: tramas distintas en la leyenda y en el dibujo", async ({ page }) => {
    await abrirConDibujo(page, estado("grafico-barras", "varias-series"));
    const tramas = await page
      .locator("[data-leyenda-serie] [data-trama]")
      .evaluateAll((ts) => ts.map((t) => t.getAttribute("data-trama")));
    expect(tramas).toEqual(["lisa", "diagonal", "puntos"]);
    const rellenos = await page
      .locator("[data-barra]")
      .evaluateAll((bs) => [...new Set(bs.map((b) => b.getAttribute("fill")))]);
    expect(rellenos).toHaveLength(3);
    // Las tramas existen de verdad en el documento (el relleno apunta a un patrón que existe).
    const rotos = await page.evaluate(() =>
      [...document.querySelectorAll("[data-barra]")]
        .map((b) => /url\(#([^)]+)\)/.exec(b.getAttribute("fill") ?? "")?.[1])
        .filter((id): id is string => id !== undefined && document.getElementById(id) === null),
    );
    expect(rotos).toEqual([]);
  });

  test("ningún valor exige pasar el puntero: sin información emergente ni título nativo", async ({
    page,
  }) => {
    await abrirConDibujo(page, estado("grafico-lineas", "una-serie"));
    await page.mouse.move(300, 300);
    await page.locator("[data-punto]").first().hover();
    await expect(page.locator(".recharts-tooltip-wrapper, .recharts-default-tooltip")).toHaveCount(
      0,
    );
    await expect(page.locator("[data-grafico] [title]")).toHaveCount(0);
    // Recharts añade `<title>` y `<desc>` al `svg`: si llevaran texto saldría como información emergente.
    const textos = await page
      .locator("svg.recharts-surface > title, svg.recharts-surface > desc")
      .evaluateAll((ts) => ts.map((t) => (t.textContent ?? "").trim()));
    expect(textos.filter((t) => t !== "")).toEqual([]);
  });

  test("el dibujo no tiene controles ni foco, y Tab recorre solo el resumen y la región de la tabla", async ({
    page,
  }) => {
    await abrirConDibujo(page, estado("grafico-lineas", "tabla-abierta"));
    expect(
      await page
        .locator("[data-grafico] [data-dibujo] :is(a, button, [tabindex], input, select, textarea)")
        .count(),
    ).toBe(0);
    await page.getByText("Ver los datos en tabla").focus();
    const visitados: string[] = [];
    for (let i = 0; i < 4; i++) {
      await page.keyboard.press("Tab");
      visitados.push(
        await page.evaluate(() => {
          const a = document.activeElement;
          if (a?.closest("[role=img]")) return "DENTRO-DEL-DIBUJO";
          return a?.getAttribute("role") ?? a?.tagName ?? "";
        }),
      );
    }
    expect(visitados).not.toContain("DENTRO-DEL-DIBUJO");
    expect(visitados[0]).toBe("region");
  });
});

test.describe("PRUEBA-014 · sin animación, sin estilo propio, sin red ni almacenamiento (REQ-039)", () => {
  for (const reducido of ["reduce", "no-preference"] as const) {
    test(`movimiento ${reducido}: ninguna animación en curso en el dibujo`, async ({ page }) => {
      await page.emulateMedia({ reducedMotion: reducido });
      await abrirConDibujo(page, estado("grafico-lineas", "cuatro-series"));
      await page.waitForTimeout(600);
      const animaciones = await medirAnimaciones(page);
      expect(animaciones.filter((a) => a.enCurso)).toEqual([]);
      expect(
        await page
          .locator("svg.recharts-surface animate, svg.recharts-surface animateTransform")
          .count(),
      ).toBe(0);
    });
  }

  test("el gráfico no escribe `style` propio: lo que lleva `style` es de Recharts y se inventaría", async ({
    page,
  }, info) => {
    const e = estado("grafico-lineas", "cuatro-series");
    await abrirConDibujo(page, e);
    const conStyle = await page.evaluate(() =>
      [...document.querySelectorAll("[data-grafico] [style]")].map(
        (el) => `${el.tagName.toLowerCase()}.${el.getAttribute("class") ?? ""}`,
      ),
    );
    // Lo propio (figura, leyenda, tabla, contenedor, marcadores, barras) nunca lleva `style`.
    const propios = conStyle.filter((x) => !/recharts/.test(x));
    expect(propios, "elementos propios con style").toEqual([]);
    info.annotations.push({
      type: "style de Recharts (inventario)",
      description: JSON.stringify(conStyle),
    });
  });

  test("sin red del gráfico y sin almacenamiento", async ({ page, baseURL }) => {
    const peticiones: string[] = [];
    page.on("request", (r) => peticiones.push(r.url()));
    await abrirConDibujo(page, estado("grafico-barras", "varias-series"));
    const origen = new URL(baseURL ?? "http://127.0.0.1").origin;
    expect(peticiones.filter((u) => !u.startsWith(origen) && !u.startsWith("data:"))).toEqual([]);
    const almacen = await page.evaluate(() => ({
      local: window.localStorage.length,
      sesion: window.sessionStorage.length,
      cookies: document.cookie,
    }));
    expect(almacen).toEqual({ local: 0, sesion: 0, cookies: "" });
  });
});

test.describe("PRUEBA-014 · contraste de las marcas en los dos temas y colores forzados (REQ-029, REQ-043)", () => {
  for (const tema of TEMAS) {
    test(`${tema}: trazos, marcadores y barras llegan a 3:1 sobre la superficie`, async ({
      page,
    }) => {
      await page.emulateMedia({ colorScheme: tema });
      for (const e of [
        estado("grafico-lineas", "cuatro-series"),
        estado("grafico-barras", "varias-series"),
      ]) {
        await abrirConDibujo(page, e);
        const peores = await page.evaluate(() => {
          const canal = (c: number): number => {
            const v = c / 255;
            return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
          };
          const luz = (css: string): number | null => {
            const m = /rgba?\(([^)]+)\)/.exec(css);
            if (!m) return null;
            const [r, g, b] = m[1]!.split(/[ ,/]+/).map(Number);
            return 0.2126 * canal(r!) + 0.7152 * canal(g!) + 0.0722 * canal(b!);
          };
          const fondo = luz(
            getComputedStyle(document.querySelector("figure[data-grafico]")!).backgroundColor,
          );
          const razon = (css: string): number | null => {
            const l = luz(css);
            if (l === null || fondo === null) return null;
            return (Math.max(l, fondo) + 0.05) / (Math.min(l, fondo) + 0.05);
          };
          const medidas: Array<{ que: string; razon: number | null }> = [];
          for (const p of document.querySelectorAll("path.recharts-line-curve")) {
            medidas.push({ que: "trazo", razon: razon(getComputedStyle(p).stroke) });
          }
          for (const m of document.querySelectorAll("[data-punto]")) {
            medidas.push({ que: "marcador", razon: razon(getComputedStyle(m).fill) });
          }
          for (const b of document.querySelectorAll("[data-barra]")) {
            medidas.push({ que: "barra", razon: razon(getComputedStyle(b).stroke) });
          }
          return medidas;
        });
        expect(peores.length).toBeGreaterThan(3);
        for (const m of peores) {
          expect(m.razon, `${e.etiqueta} ${tema}: ${m.que}`).not.toBeNull();
          expect(m.razon!, `${e.etiqueta} ${tema}: ${m.que}`).toBeGreaterThanOrEqual(3);
        }
      }
    });
  }

  test("colores forzados: trazos, barras y ejes usan colores del sistema, sin degradados, y se siguen viendo", async ({
    page,
  }) => {
    await page.emulateMedia({ forcedColors: "active" });
    for (const e of [
      estado("grafico-lineas", "cuatro-series"),
      estado("grafico-barras", "varias-series"),
    ]) {
      await abrirConDibujo(page, e);
      const r = await page.evaluate(() => {
        const sistema = (nombre: string): string => {
          const s = document.createElement("span");
          s.style.color = nombre;
          document.body.append(s);
          const c = getComputedStyle(s).color;
          s.remove();
          return c;
        };
        const permitidos = new Set(
          ["CanvasText", "Highlight", "Canvas", "ButtonText", "LinkText", "GrayText"].map(sistema),
        );
        const fuera: string[] = [];
        const marcas = [
          ...[...document.querySelectorAll("path.recharts-line-curve")].map(
            (p) => getComputedStyle(p).stroke,
          ),
          ...[...document.querySelectorAll("[data-barra]")].map((b) => getComputedStyle(b).stroke),
          ...[...document.querySelectorAll(".recharts-xAxis .recharts-cartesian-axis-line")].map(
            (l) => getComputedStyle(l).stroke,
          ),
        ];
        for (const c of marcas) if (!permitidos.has(c)) fuera.push(c);
        return {
          marcas: marcas.length,
          fuera,
          degradados: [...document.querySelectorAll("[data-grafico], [data-grafico] *")].filter(
            (x) => getComputedStyle(x).backgroundImage.includes("gradient"),
          ).length,
        };
      });
      expect(r.marcas, e.etiqueta).toBeGreaterThan(3);
      expect(r.fuera, `${e.etiqueta}: colores fuera del sistema`).toEqual([]);
      expect(r.degradados).toBe(0);
    }
  });
});

test.describe("PRUEBA-017 · texto hostil en título, ejes, series, categorías y tabla (CA-041, REQ-071)", () => {
  for (const entrada of ["grafico-lineas", "grafico-barras"]) {
    test(`${entrada}: se pinta como texto, sin ejecutar nada ni crear elementos`, async ({
      page,
    }) => {
      const dialogos: string[] = [];
      page.on("dialog", (d) => {
        dialogos.push(d.message());
        void d.dismiss();
      });
      await abrirConDibujo(page, estado(entrada, "texto-hostil"));
      await page.getByText("Ver los datos en tabla").click();
      const r = await page.evaluate(() => ({
        marca: (window as unknown as { __hostil?: number }).__hostil ?? null,
        imagenes: document.querySelectorAll("figure[data-grafico] img, figure[data-grafico] script")
          .length,
        enlaces: document.querySelectorAll("figure[data-grafico] a").length,
        tabla: document.querySelectorAll("table").length,
      }));
      expect(dialogos).toEqual([]);
      expect(r).toEqual({ marca: null, imagenes: 0, enlaces: 0, tabla: 1 });
      // El texto aparece literal, en la tabla.
      await expect(tabla(page)).toContainText("<script>window.__hostil = 1</script>");
      await expect(tabla(page)).toContainText("[pulsa aquí](https://malo.example/phishing)");
    });
  }
});

test.describe("PRUEBA-013 · anchos, zum y nombres de 120 caracteres (CA-006, CA-049, CA-050)", () => {
  for (const e of TODOS) {
    test(`${e.etiqueta}: nueve anchos sin desplazamiento de página y el dibujo cabe en su caja`, async ({
      page,
    }) => {
      await abrirEstado(page, e);
      for (const ancho of [320, 375, 414, 768, 1024, 1280, 1440, 1920, 2560]) {
        await page.setViewportSize({ width: ancho, height: ALTO_POR_DEFECTO });
        if (!SIN_DIBUJO.has(e.estado)) {
          await expect(page.locator("[data-dibujo] svg.recharts-surface")).toBeVisible();
          await page.waitForTimeout(150);
          const cabe = await page.evaluate(() => {
            const caja = document.querySelector("[role=img]")!.getBoundingClientRect();
            const svg = document.querySelector("svg.recharts-surface")!.getBoundingClientRect();
            return {
              anchoCaja: caja.width,
              anchoSvg: svg.width,
              altoCaja: caja.height,
              altoSvg: svg.height,
            };
          });
          expect(cabe.anchoSvg, `${ancho} px: ancho del dibujo`).toBeLessThanOrEqual(
            cabe.anchoCaja + 1,
          );
          expect(cabe.altoSvg, `${ancho} px: alto del dibujo`).toBeLessThanOrEqual(
            cabe.altoCaja + 1,
          );
        }
        expect(await medirDesborde(page), `${ancho} px`).toEqual({ sobra: 0, fuera: [] });
      }
    });
  }

  test("la caja del dibujo mantiene su proporción: no se desplaza el contenido al cargar", async ({
    page,
  }) => {
    const e = estado("grafico-lineas", "una-serie");
    await page.setViewportSize({ width: 375, height: ALTO_POR_DEFECTO });
    await page.goto(e.ruta);
    const antes = await page
      .locator("[role=img]")
      .evaluate((el) => el.getBoundingClientRect().height);
    await expect(page.locator("svg.recharts-surface")).toBeVisible();
    await page.waitForLoadState("networkidle");
    const despues = await page
      .locator("[role=img]")
      .evaluate((el) => el.getBoundingClientRect().height);
    expect(Math.abs(despues - antes)).toBeLessThanOrEqual(1);
    expect(antes).toBeGreaterThan(150);
  });

  for (const e of TODOS.filter((x) => /120/.test(x.estado))) {
    test(`${e.etiqueta}: etiquetas de 120 caracteres sin solapes ni recortes, a 320 y 1280 px`, async ({
      page,
    }) => {
      for (const ancho of [320, 1280]) {
        await page.setViewportSize({ width: ancho, height: ALTO_POR_DEFECTO });
        await abrirConDibujo(page, e);
        expect(await medirSolapes(page), `${ancho} px: solapes`).toEqual([]);
        expect(await medirRecortes(page), `${ancho} px: recortes`).toEqual([]);
        expect(await medirDesborde(page), `${ancho} px`).toEqual({ sobra: 0, fuera: [] });
      }
      // La tabla trae los nombres enteros aunque el eje los abrevie.
      await page.getByText("Ver los datos en tabla").click();
      const encabezados = await tabla(page)
        .locator("tbody th[scope=row]")
        .evaluateAll((hs) => hs.map((h) => (h.textContent ?? "").trim().length));
      expect(encabezados.every((n) => n === 120)).toBe(true);
    });
  }

  test("zum al 200 % y al 400 % (ventanas de 640 por 400 y de 320 por 256) y espaciado de texto", async ({
    page,
  }) => {
    for (const [ancho, alto] of [
      [640, 400],
      [320, 256],
    ] as const) {
      await page.setViewportSize({ width: ancho, height: alto });
      await abrirConDibujo(page, estado("grafico-lineas", "cuatro-series"));
      await inyectarEspaciadoDeTexto(page);
      expect(await medirDesborde(page), `${ancho} px`).toEqual({ sobra: 0, fuera: [] });
      expect(await medirRecortes(page), `${ancho} px: recortes`).toEqual([]);
    }
  });
});

test.describe("PRUEBA-014 · sin JavaScript: el dibujo no es lo único que informa (REQ-015)", () => {
  test("título, descripción, leyenda y tabla equivalente se pintan en el documento", async ({
    browser,
  }) => {
    const contexto = await browser.newContext({ javaScriptEnabled: false });
    const page = await contexto.newPage();
    try {
      await abrirEstado(page, estado("grafico-lineas", "cuatro-series"));
      await expect(page.locator("figure[data-grafico] figcaption")).not.toHaveText("");
      await expect(page.locator("[data-leyenda-serie]")).toHaveCount(4);
      await expect(page.locator("svg.recharts-surface")).toHaveCount(0);
      await page.getByText("Ver los datos en tabla").click();
      await expect(tabla(page).locator("tbody tr")).toHaveCount(14);
      expect(await medirDesborde(page)).toEqual({ sobra: 0, fuera: [] });
    } finally {
      await contexto.close();
    }
  });
});

test.describe("PRUEBA-025 · axe sobre los gráficos, a 320 y 1280 px, en claro y oscuro", () => {
  for (const e of TODOS) {
    for (const ancho of [320, 1280]) {
      for (const tema of TEMAS) {
        test(`${e.etiqueta} · ${ancho} px · ${tema}`, async ({ page }) => {
          await page.setViewportSize({ width: ancho, height: ALTO_POR_DEFECTO });
          await page.emulateMedia({ colorScheme: tema });
          if (CON_DIBUJO.includes(e)) await abrirConDibujo(page, e);
          else await abrirEstado(page, e);
          await page.waitForLoadState("networkidle");
          await comprobarAccesibilidad(page);
        });
      }
    }
  }

  test("con la tabla abierta también", async ({ page }) => {
    for (const e of [
      estado("grafico-lineas", "tabla-abierta"),
      estado("grafico-barras", "tabla-abierta"),
    ]) {
      await abrirConDibujo(page, e);
      await comprobarAccesibilidad(page);
    }
  });
});
