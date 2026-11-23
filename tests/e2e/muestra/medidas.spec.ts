// Controles de las medidas de `apoyo/medidas.ts` (PRUEBA-013, PRUEBA-020): cada una detecta lo
// que debe sobre una página sembrada. Una prueba generada con una medida que no puede detectar
// nada no probaría nada (rol de `qa`: una prueba que no puede fallar no es una prueba).
import { expect, test } from "@playwright/test";
import {
  fotoDelEstado,
  inyectarEspaciadoDeTexto,
  leerViewport,
  medirAnimaciones,
  medirControlesSinBorde,
  medirDegradados,
  medirDesborde,
  medirFuentesQueOcultan,
  medirRecortes,
  medirSolapes,
} from "./apoyo/medidas";

const pagina = (cuerpo: string, cabeza = "") =>
  `<!doctype html><html lang="es"><head><meta name="viewport" content="width=device-width, initial-scale=1"><title>Control</title>${cabeza}</head><body>${cuerpo}</body></html>`;

test.describe("controles de las medidas de anchura y texto", () => {
  test("el desborde horizontal se detecta, y una región desplazable propia se admite", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 320, height: 600 });
    await page.setContent(pagina(`<p>Corto</p>`));
    expect((await medirDesborde(page)).sobra).toBe(0);
    await page.setContent(pagina(`<div style="width:900px">Ancho de más</div>`));
    const d = await medirDesborde(page);
    expect(d.sobra).toBeGreaterThan(0);
    expect(d.fuera).toContain("div");
    await page.setContent(
      pagina(
        `<div style="overflow-x:auto"><table style="width:900px"><tr><td>x</td></tr></table></div>`,
      ),
    );
    expect((await medirDesborde(page)).fuera).toEqual([]);
  });

  test("el recorte de texto se detecta", async ({ page }) => {
    await page.setContent(pagina(`<p>Entero</p>`));
    expect(await medirRecortes(page)).toEqual([]);
    await page.setContent(
      pagina(
        `<div style="width:30px;overflow:hidden;white-space:nowrap">Texto largo recortado</div>`,
      ),
    );
    expect(await medirRecortes(page)).toContain("div");
    await page.setContent(
      pagina(
        `<div style="width:30px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">Texto largo</div>`,
      ),
    );
    expect(await medirRecortes(page)).toContain("div");
  });

  test("la excepción del nombre acortable de la cuenta es solo para el botón de la cabecera", async ({
    page,
  }) => {
    const recortado = `width:30px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap`;
    // Dentro del botón de la cuenta de la cabecera, el nombre marcado se admite…
    await page.setContent(
      pagina(
        `<header><button aria-haspopup="dialog" aria-label="Cuenta: Nombre largo"><span data-nombre-acortable style="${recortado}">Nombre largo</span></button></header>`,
      ),
    );
    expect(await medirRecortes(page)).toEqual([]);
    // …pero no si el nombre accesible del botón no lleva el nombre entero, ni si no abre un diálogo.
    await page.setContent(
      pagina(
        `<header><button aria-haspopup="dialog" aria-label="Cuenta"><span data-nombre-acortable style="${recortado}">Nombre largo</span></button></header>`,
      ),
    );
    expect(await medirRecortes(page)).toContain("span");
    await page.setContent(
      pagina(
        `<header><button aria-label="Cuenta: Nombre largo"><span data-nombre-acortable style="${recortado}">Nombre largo</span></button></header>`,
      ),
    );
    expect(await medirRecortes(page)).toContain("span");
    // …pero la misma marca fuera de ese botón no exime, ni otro recorte dentro de él.
    await page.setContent(
      pagina(`<p><span data-nombre-acortable style="${recortado}">Nombre largo</span></p>`),
    );
    expect(await medirRecortes(page)).toContain("span");
    await page.setContent(
      pagina(
        `<header><button aria-haspopup="dialog" aria-label="Cuenta: Otro texto"><span style="${recortado}">Otro texto</span></button></header>`,
      ),
    );
    expect(await medirRecortes(page)).toContain("span");
  });

  test("el solape de textos se detecta", async ({ page }) => {
    await page.setContent(pagina(`<p>Uno</p><p>Dos</p>`));
    expect(await medirSolapes(page)).toEqual([]);
    await page.setContent(
      pagina(
        `<span style="position:absolute;left:10px;top:10px">Uno encima</span><span style="position:absolute;left:12px;top:12px">Otro debajo</span>`,
      ),
    );
    expect((await medirSolapes(page)).length).toBeGreaterThan(0);
  });

  test("el espaciado de texto de la norma se aplica", async ({ page }) => {
    await page.setContent(
      pagina(`<p style="line-height:1"><span id="s">Texto de prueba</span></p>`),
    );
    const antes = await page.locator("#s").evaluate((e) => e.getBoundingClientRect().width);
    await inyectarEspaciadoDeTexto(page);
    const despues = await page.locator("#s").evaluate((e) => e.getBoundingClientRect().width);
    expect(despues).toBeGreaterThan(antes);
    expect(await page.locator("p").evaluate((e) => getComputedStyle(e).lineHeight)).not.toBe(
      "normal",
    );
  });

  test("la cabecera viewport se lee", async ({ page }) => {
    await page.setContent(pagina(`<p>x</p>`));
    expect(await leerViewport(page)).toContain("width=device-width");
  });
});

test.describe("controles de las medidas de tema, movimiento y colores forzados", () => {
  const girando = `<style>@keyframes g{to{transform:rotate(1turn)}}#g{animation:g 100ms linear infinite}</style><div id="g">giro</div>`;

  test("una animación que se repite 10 veces por segundo se detecta", async ({ page }) => {
    await page.setContent(pagina(girando));
    const animaciones = await medirAnimaciones(page);
    expect(animaciones.some((a) => a.enCurso && a.repeticionesPorSegundo > 3)).toBe(true);
  });

  test("sin animaciones, ninguna en curso", async ({ page }) => {
    await page.setContent(pagina(`<p>quieta</p>`));
    expect(await medirAnimaciones(page)).toEqual([]);
  });

  test("un degradado se detecta, y no hay falsos positivos", async ({ page }) => {
    await page.setContent(pagina(`<p>x</p>`));
    expect(await medirDegradados(page)).toEqual([]);
    await page.setContent(
      pagina(`<div style="background-image:linear-gradient(red,blue)">degradado</div>`),
    );
    expect(await medirDegradados(page)).toContain("div");
  });

  test("un control sin borde se detecta", async ({ page }) => {
    await page.setContent(
      pagina(
        `<input aria-label="a" style="border:0;outline:none"><input aria-label="b" style="border:2px solid black">`,
      ),
    );
    expect(await medirControlesSinBorde(page)).toEqual(["input"]);
  });

  test("una casilla o un radio nativos no cuentan; sin aspecto nativo y sin borde, sí", async ({
    page,
  }) => {
    await page.setContent(
      pagina(
        `<input type="checkbox" aria-label="a"><input type="radio" aria-label="b"><input type="checkbox" aria-label="c" style="appearance:none;border:0"><input type="radio" aria-label="d" style="appearance:none;border:0">`,
      ),
    );
    expect(await medirControlesSinBorde(page)).toEqual(["input", "input"]);
  });

  test("un tipo de letra que oculta el texto mientras carga se detecta", async ({ page }) => {
    await page.setContent(pagina(`<p>x</p>`));
    expect(await medirFuentesQueOcultan(page)).toEqual([]);
    await page.setContent(
      pagina(
        `<p>x</p>`,
        `<style>@font-face{font-family:Mala;src:url(data:font/woff2;base64,AAAA);font-display:block}@font-face{font-family:Buena;src:url(data:font/woff2;base64,AAAA);font-display:swap}</style>`,
      ),
    );
    const malas = await medirFuentesQueOcultan(page);
    expect(malas).toHaveLength(1);
    expect(malas[0]).toContain("Mala");
  });

  test("la foto del estado cambia si cambia lo escrito, lo expandido o lo ordenado", async ({
    page,
  }) => {
    await page.setContent(
      pagina(
        `<input aria-label="a"><button aria-expanded="false">m</button><table><tr><th aria-sort="none">c</th></tr></table>`,
      ),
    );
    const antes = await fotoDelEstado(page);
    await page.locator("input").fill("escrito");
    await page.locator("button").evaluate((b) => b.setAttribute("aria-expanded", "true"));
    await page.locator("th").evaluate((t) => t.setAttribute("aria-sort", "ascending"));
    const despues = await fotoDelEstado(page);
    expect(despues["valor-0"]).not.toBe(antes["valor-0"]);
    expect(despues["expandido-0"]).not.toBe(antes["expandido-0"]);
    expect(despues["orden-0"]).not.toBe(antes["orden-0"]);
  });
});
