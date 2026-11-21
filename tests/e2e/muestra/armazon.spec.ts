// PRUEBA-012 (diseño 020 §Pruebas), parte de T-010 (a): estructura del armazón, áreas, enlace de
// salto, regiones y orden del cuerpo, sobre las entradas `armazon-*` del inventario. CA-001,
// CA-002, CA-004 (título), CA-005 (orden), CA-007, CA-031, CA-033.
// Lo que depende de MenuLateral, CajonMenu, Cabecera, CuentaUsuario y SelectorPeriodo (cajón en
// 320, 375 y 768 px, cuenta en un paso, selector de periodo) lo añaden T-010 (b) y (c): aquí no
// se simula y queda anotado como «no ejecutada».
import { expect, test, type Page } from "@playwright/test";
import { AREAS_CLIENTE_MUESTRA, AREAS_SUPERADMIN } from "../../../src/components/armazon/areas";
import { TEXTOS } from "../../../src/components/textos";
import { abrirEstado, anotarPendiente, estadosDe, type EstadoDePrueba } from "./apoyo/estados";
import { ALTO_POR_DEFECTO } from "./configuracion-interfaz";

const ID_CONTENIDO = "contenido-principal";
const ARMAZONES = estadosDe(/^armazon/);
const SUPERADMIN = ARMAZONES.filter((e) => e.entrada === "armazon-superadmin");
const CLIENTE = ARMAZONES.filter((e) => e.entrada === "armazon-cliente");

/** El área que debe figurar como actual en un estado: el nombre largo es una ficha de Clientes. */
function areaEsperada(e: EstadoDePrueba): string {
  return e.estado.startsWith("nombre-largo") ? "clientes" : e.estado;
}
const areasDe = (e: EstadoDePrueba) =>
  e.entrada === "armazon-superadmin" ? AREAS_SUPERADMIN : AREAS_CLIENTE_MUESTRA;

/** Saltos de nivel de una lista de encabezados: un nivel más de uno por debajo del anterior. */
function saltosDeNivel(niveles: readonly number[]): string[] {
  const saltos: string[] = [];
  niveles.forEach((n, i) => {
    const antes = i === 0 ? 0 : niveles[i - 1]!;
    if (n > antes + 1) saltos.push(`h${antes} -> h${n}`);
  });
  return saltos;
}

async function leerNiveles(page: Page): Promise<number[]> {
  return page.evaluate(() =>
    [...document.querySelectorAll("h1, h2, h3, h4, h5, h6")].map((h) => Number(h.tagName[1])),
  );
}

/** Pulsa el tabulador una vez y Intro: devuelve qué tomó el foco primero y dónde acabó. */
async function saltar(
  page: Page,
): Promise<{ primero: string; visible: boolean; id: string; hash: string }> {
  await page.keyboard.press("Tab");
  const primero = await page.evaluate(() => {
    const a = document.activeElement as HTMLElement;
    const r = a.getBoundingClientRect();
    return {
      texto: (a.textContent ?? "").trim(),
      visible: r.width > 0 && r.height > 0 && r.top >= 0 && r.left >= 0 && r.bottom <= innerHeight,
    };
  });
  await page.keyboard.press("Enter");
  const id = await page.evaluate(() => document.activeElement?.id ?? "");
  return { primero: primero.texto, visible: primero.visible, id, hash: new URL(page.url()).hash };
}

test("centinela: el inventario trae el armazón de superadmin y el de cliente, y se recorren", () => {
  expect(SUPERADMIN.length, "estados del armazón de superadmin").toBeGreaterThanOrEqual(6);
  expect(CLIENTE.length, "estados del armazón de cliente").toBeGreaterThanOrEqual(4);
  for (const a of AREAS_SUPERADMIN) {
    expect(
      SUPERADMIN.map((e) => e.estado),
      a.clave,
    ).toContain(a.clave);
  }
});

test("control de la medida de encabezados: un salto de nivel se detecta", () => {
  expect(saltosDeNivel([1, 2, 3, 2, 3])).toEqual([]);
  expect(saltosDeNivel([1, 3])).toEqual(["h1 -> h3"]);
  expect(saltosDeNivel([2, 3])).toEqual(["h0 -> h2"]);
});

for (const estado of ARMAZONES) {
  test.describe(`PRUEBA-012 · ${estado.etiqueta}`, () => {
    test("idioma, regiones con nombre y encabezados sin saltos", async ({ page }) => {
      await abrirEstado(page, estado);
      await expect(page.locator("html")).toHaveAttribute("lang", "es");
      await expect(
        page.getByRole("navigation", { name: TEXTOS.armazon.navegacionPrincipal }),
      ).toHaveCount(1);
      await expect(page.getByRole("banner")).toHaveCount(1);
      await expect(page.getByRole("banner")).toHaveAccessibleName(TEXTOS.armazon.cabecera);
      await expect(page.getByRole("main", { name: TEXTOS.armazon.contenidoPrincipal })).toHaveCount(
        1,
      );
      await expect(page.locator("h1")).toHaveCount(1);
      await expect(page.locator("header h1")).toHaveCount(1);
      const niveles = await leerNiveles(page);
      expect(niveles[0]).toBe(1);
      expect(saltosDeNivel(niveles), "saltos de nivel").toEqual([]);
    });

    test("el título del documento es el h1 más el nombre del producto, sin datos", async ({
      page,
    }) => {
      await abrirEstado(page, estado);
      const h1 = (await page.locator("h1").innerText()).trim();
      expect(await page.title()).toBe(`${h1} · ${TEXTOS.marca.nombreProducto}`);
    });

    test("menú: las áreas del juego, en su orden, sin entradas desactivadas; el área actual lleva aria-current y forma", async ({
      page,
    }) => {
      await abrirEstado(page, estado);
      const areas = areasDe(estado);
      const enlaces = page.getByRole("navigation").getByRole("link");
      await expect(enlaces).toHaveText(areas.map((a) => a.etiqueta));
      await expect(page.locator("nav [aria-disabled], nav [disabled]")).toHaveCount(0);
      const actual = page.locator('nav [aria-current="page"]');
      await expect(actual).toHaveCount(1);
      const esperada = areas.find((a) => a.clave === areaEsperada(estado))!;
      await expect(actual).toHaveText(esperada.etiqueta);
      // Con forma y no solo con color: peso de letra y barra lateral que los demás no tienen.
      const estilo = await page.evaluate(() => {
        const leer = (e: Element) => {
          const s = getComputedStyle(e);
          return {
            peso: Number(s.fontWeight),
            barra: parseFloat(s.borderLeftWidth),
            fondo: s.backgroundColor,
            colorBarra: s.borderLeftColor,
          };
        };
        return {
          actual: leer(document.querySelector('nav [aria-current="page"]')!),
          otros: [...document.querySelectorAll("nav a:not([aria-current])")].map(leer),
        };
      });
      expect(estilo.actual.peso).toBeGreaterThanOrEqual(600);
      expect(estilo.actual.barra).toBeGreaterThan(0);
      for (const o of estilo.otros) {
        expect(o.peso).toBeLessThan(600);
        expect(o.colorBarra, "la barra solo se ve en el área actual").not.toBe(
          estilo.actual.colorBarra,
        );
        expect(o.fondo).not.toBe(estilo.actual.fondo);
      }
    });

    test("cuerpo: cifras, contenido y alertas en ese orden del documento", async ({ page }) => {
      await abrirEstado(page, estado);
      const zonas = await page.evaluate(() =>
        [...document.querySelectorAll("main [data-zona]")].map((z) => z.getAttribute("data-zona")),
      );
      expect(zonas).toEqual(["cifras", "contenido", "alertas"]);
    });

    test("cuerpo: a 1280 px las alertas quedan a la derecha; a 375 px, al final", async ({
      page,
    }) => {
      await abrirEstado(page, estado);
      const cajas = () =>
        page.evaluate(() => {
          const caja = (z: string) => {
            const r = document.querySelector(`[data-zona="${z}"]`)!.getBoundingClientRect();
            return { x: r.left, y: r.top, abajo: r.bottom, derecha: r.right };
          };
          return { cifras: caja("cifras"), contenido: caja("contenido"), alertas: caja("alertas") };
        });
      await page.setViewportSize({ width: 1280, height: ALTO_POR_DEFECTO });
      const ancho = await cajas();
      expect(ancho.alertas.x, "alertas a la derecha del contenido").toBeGreaterThanOrEqual(
        ancho.contenido.derecha - 1,
      );
      expect(ancho.contenido.y, "las cifras preceden al contenido").toBeGreaterThanOrEqual(
        ancho.cifras.abajo - 1,
      );
      await page.setViewportSize({ width: 375, height: 667 });
      const estrecho = await cajas();
      expect(estrecho.alertas.y, "alertas al final").toBeGreaterThanOrEqual(
        estrecho.contenido.abajo - 1,
      );
      expect(estrecho.contenido.y).toBeGreaterThanOrEqual(estrecho.cifras.abajo - 1);
    });

    test("el contenido no pasa del ancho máximo y el menú no cuenta", async ({ page }) => {
      await abrirEstado(page, estado);
      await page.setViewportSize({ width: 2560, height: ALTO_POR_DEFECTO });
      const r = await page.evaluate(() => {
        const nav = document.querySelector("nav")!.getBoundingClientRect();
        const main = document.querySelector("main")!.getBoundingClientRect();
        return { menu: nav.width, contenido: main.width, izquierda: main.left, nav: nav.right };
      });
      expect(r.contenido).toBeLessThanOrEqual(1440);
      expect(r.menu, "el menú tiene su ancho fijo").toBeGreaterThan(200);
      expect(r.izquierda, "el contenido empieza tras el menú").toBeGreaterThanOrEqual(r.nav - 1);
    });

    test("enlace de salto: primer elemento con foco, visible al recibirlo, lleva el foco a main", async ({
      page,
    }) => {
      await abrirEstado(page, estado);
      await page.waitForLoadState("networkidle");
      const r = await saltar(page);
      expect(r.primero).toBe(TEXTOS.armazon.saltarAlContenido);
      expect(r.visible, "el enlace se ve al recibir el foco").toBe(true);
      expect(r.id, "el foco está en el contenido principal").toBe(ID_CONTENIDO);
      // Con el enlace nativo, el único cambio de la dirección es el fragmento del destino (PRUEBA-018).
      expect(r.hash, "solo el fragmento del destino").toBe(`#${ID_CONTENIDO}`);
      expect(new URL(page.url()).search).toBe("");
    });

    test("regiones de anuncios: las dos están y arrancan vacías", async ({ page }) => {
      await abrirEstado(page, estado);
      const cortes = page.locator('div[role="status"][aria-live="polite"]');
      // Next añade su propio anunciador de rutas (#__next-route-announcer__, en un shadow DOM): aquí se cuenta el del armazón.
      const urgente = page.locator(
        'div[role="alert"][aria-live="assertive"]:not(#__next-route-announcer__)',
      );
      await expect(cortes).toHaveCount(1);
      await expect(urgente).toHaveCount(1);
      await expect(cortes).toHaveText("");
      await expect(urgente).toHaveText("");
    });

    test("lo que añaden (b) y (c) queda anotado, no simulado", async () => {
      anotarPendiente(
        test.info(),
        "cajón de menú en 320, 375 y 768 px, menú visible en 1024 o más, Escape y foco; cuenta en un paso a 320 px; selector de periodo y su anuncio",
        "T-010 (b) y (c)",
      );
    });
  });
}

test.describe("PRUEBA-012 · entre vistas", () => {
  test("el menú tiene el mismo orden en todas las vistas de superadmin y el título no se repite en ninguna", async ({
    page,
  }) => {
    const titulos: string[] = [];
    for (const estado of ARMAZONES) {
      await abrirEstado(page, estado);
      titulos.push(await page.title());
      if (estado.entrada === "armazon-superadmin") {
        const orden = await page.getByRole("navigation").getByRole("link").allInnerTexts();
        expect(orden, estado.etiqueta).toEqual(AREAS_SUPERADMIN.map((a) => a.etiqueta));
      }
    }
    expect(new Set(titulos).size, "títulos de documento repetidos").toBe(titulos.length);
  });

  test("con las áreas de cliente solo cambian las entradas: mismo aspecto y comportamiento", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: ALTO_POR_DEFECTO });
    const aspecto = async (estado: EstadoDePrueba) => {
      await abrirEstado(page, estado);
      return page.evaluate(() => {
        const medir = (s: string) => {
          const e = document.querySelector(s)!;
          const r = e.getBoundingClientRect();
          const c = getComputedStyle(e);
          return [
            s,
            Math.round(r.left),
            Math.round(r.width),
            c.backgroundImage,
            c.backgroundColor,
            c.color,
          ];
        };
        return ["nav", "header", "main"].map(medir);
      });
    };
    const a = await aspecto(SUPERADMIN.find((e) => e.estado === "resumen")!);
    const b = await aspecto(CLIENTE.find((e) => e.estado === "resumen")!);
    expect(b).toEqual(a);
  });
});

test.describe("PRUEBA-012 · control sembrado del salto", () => {
  const pagina = (main: string) =>
    `<!doctype html><html lang="es"><head><title>Control</title></head><body>
     <a href="#x" id="salto">Saltar</a><nav><a href="/">Inicio</a></nav>${main}</body></html>`;

  test("un destino que no puede recibir el foco no lo recibe, y la medida lo ve", async ({
    page,
  }) => {
    await page.setContent(pagina(`<main id="x"><h1>Control</h1></main>`));
    const r = await saltar(page);
    expect(r.primero).toBe("Saltar");
    expect(r.id, "sin tabindex el foco no llega a main").not.toBe("x");
  });

  test("con tabindex=-1 el foco llega (control positivo)", async ({ page }) => {
    await page.setContent(pagina(`<main id="x" tabindex="-1"><h1>Control</h1></main>`));
    const r = await saltar(page);
    expect(r.id).toBe("x");
  });
});
