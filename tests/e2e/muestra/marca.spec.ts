// T-014 (020) · PRUEBA-023: nombre y logotipo (REQ-087; CA-056). Escrita antes de T-015 (b), que monta
// el logotipo elegido en `src/components/marca/` y en el menú. Contrato que fija esta prueba:
//   1. El nombre del producto sale de `TEXTOS.marca.nombreProducto` y va en el título de TODAS las
//      vistas del inventario: `<título de la vista> · <nombre>`, con título propio no vacío.
//   2. El menú (lateral desde 1024 px y cajón por debajo) lleva arriba un logotipo (`svg`) y, junto
//      a él, el nombre como texto visible.
//   3. El nombre accesible aparece UNA sola vez en el menú: el logotipo, que acompaña a un texto
//      que ya lo dice, es decorativo (`aria-hidden="true"`). Un logotipo que informa por sí solo
//      lleva `role="img"` y nombre; uno decorativo, `aria-hidden`; nunca los dos nombres a la vez.
//   4. El logotipo vive en `src/components/marca/`.
//   5. Capturas del logotipo a 16 y 32 px, guardadas en `evidencias/T-014/capturas/`.
// Lo que depende de T-015 (b) falla hoy con el mensaje «pendiente de T-015 (b)»: ni se salta ni se
// marca como fallo esperado. Lo verificable hoy (título; logotipos C de la maqueta) pasa.
import { existsSync, mkdirSync, readdirSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { expect, test, type Locator, type Page } from "@playwright/test";
import { TEXTOS } from "../../../src/components/textos";
import { ESTADOS, abrirEstado, estadosDe } from "./apoyo/estados";
import { ALTO_POR_DEFECTO, TEMAS } from "./configuracion-interfaz";

const NOMBRE = TEXTOS.marca.nombreProducto;
const SEPARADOR = " · ";
const PENDIENTE = "pendiente de T-015 (b)";
const RAIZ = process.cwd();
const CARPETA_MARCA = resolve(RAIZ, "src/components/marca");
const CAPTURAS = resolve(RAIZ, "specs/020-sistema-diseno-armazon/evidencias/T-014/capturas");
const ARMAZONES = estadosDe(/^armazon-/);

const menuLateral = (page: Page): Locator => page.locator("nav[data-menu-lateral]");

/** Ancho y alto de un PNG, leídos de su cabecera (IHDR). */
function dimensionesPng(png: Buffer): { ancho: number; alto: number } {
  return { ancho: png.readUInt32BE(16), alto: png.readUInt32BE(20) };
}

/**
 * Captura de un elemento de `lado` x `lado` px: recorta la página en coordenadas enteras. La captura
 * del elemento sola da 17 px cuando la caja cae en media posición de píxel.
 */
async function capturar(page: Page, elemento: Locator, lado: number): Promise<Buffer> {
  const caja = await elemento.evaluate((e) => {
    const r = e.getBoundingClientRect();
    return { x: r.left + window.scrollX, y: r.top + window.scrollY };
  });
  return page.screenshot({
    fullPage: true,
    clip: { x: Math.round(caja.x), y: Math.round(caja.y), width: lado, height: lado },
  });
}

function guardar(nombre: string, png: Buffer): void {
  mkdirSync(CAPTURAS, { recursive: true });
  writeFileSync(join(CAPTURAS, nombre), png);
}

/** Cuántas veces sale el nombre del producto en el árbol de accesibilidad de `donde`. */
async function mencionesDelNombre(donde: Locator): Promise<number> {
  const arbol = await donde.ariaSnapshot();
  return arbol.split(NOMBRE).length - 1;
}

/**
 * Comprueba el contrato de marca dentro de un menú (lateral o cajón). Cada fallo dice qué falta y
 * que lo trae T-015 (b); no hay ramas que lo den por bueno si el logotipo no existe.
 */
async function comprobarMarcaEnMenu(menu: Locator, etiqueta: string): Promise<Locator> {
  // El logotipo es un `svg` del menú que no está dentro de la lista de áreas (esos son sus iconos).
  const todos = menu.locator("svg");
  const logotipo = menu.locator("svg:not(ul svg, li svg)").first();
  expect(
    await logotipo.count(),
    `${PENDIENTE}: ${etiqueta} no lleva logotipo arriba (${await todos.count()} svg en el menú, todos de áreas)`,
  ).toBeGreaterThan(0);
  await expect(menu, `${PENDIENTE}: ${etiqueta} no muestra el nombre del producto`).toContainText(
    NOMBRE,
  );
  // Nombre accesible una sola vez: el logotipo, decorativo junto al texto, no se anuncia.
  expect(await mencionesDelNombre(menu), `${etiqueta}: el nombre accesible sale una sola vez`).toBe(
    1,
  );
  await expect(logotipo, `${etiqueta}: el logotipo junto al nombre es decorativo`).toHaveAttribute(
    "aria-hidden",
    "true",
  );
  return logotipo;
}

test.describe("PRUEBA-023 · el título lleva el nombre del producto en todas las vistas", () => {
  test("el nombre del producto es el de la constante y la plantilla del título lo añade", () => {
    expect(NOMBRE).toBe("Nido: Agentes de Correo");
    expect(ESTADOS.length).toBeGreaterThan(0);
  });

  for (const estado of ESTADOS) {
    test(`título con el nombre · ${estado.etiqueta}`, async ({ page }) => {
      await abrirEstado(page, estado);
      const titulo = await page.title();
      expect(titulo.endsWith(`${SEPARADOR}${NOMBRE}`), `título «${titulo}»`).toBe(true);
      const vista = titulo.slice(0, titulo.length - `${SEPARADOR}${NOMBRE}`.length);
      expect(vista.trim().length, `título de la vista en «${titulo}»`).toBeGreaterThan(0);
      expect(vista, "el nombre no se repite dentro del título de la vista").not.toContain(NOMBRE);
    });
  }

  test("los títulos de todas las vistas son distintos entre sí", async ({ page }) => {
    const vistos = new Map<string, string>();
    for (const estado of ESTADOS) {
      await abrirEstado(page, estado);
      const titulo = await page.title();
      expect(vistos.get(titulo), `«${titulo}» repetido en ${estado.etiqueta}`).toBeUndefined();
      vistos.set(titulo, estado.etiqueta);
    }
    expect(vistos.size).toBe(ESTADOS.length);
  });
});

test.describe("PRUEBA-023 · logotipo y nombre en el menú (depende de T-015 (b))", () => {
  test("el logotipo definitivo vive en src/components/marca/", () => {
    const archivos = existsSync(CARPETA_MARCA)
      ? readdirSync(CARPETA_MARCA).filter((n) => /\.tsx?$/.test(n))
      : [];
    expect(
      archivos.length,
      `${PENDIENTE}: no hay componentes en src/components/marca/`,
    ).toBeGreaterThan(0);
  });

  test("hay armazones en el inventario que recorrer", () => {
    expect(ARMAZONES.length).toBeGreaterThan(0);
  });

  for (const estado of ARMAZONES) {
    test(`menú lateral con logotipo y nombre, nombre accesible una vez · ${estado.etiqueta} · 1280 px`, async ({
      page,
    }) => {
      await page.setViewportSize({ width: 1280, height: ALTO_POR_DEFECTO });
      await abrirEstado(page, estado);
      await expect(menuLateral(page)).toBeVisible();
      await comprobarMarcaEnMenu(menuLateral(page), "el menú lateral");
    });
  }

  test("el cajón del menú (375 px) lleva el mismo logotipo y el nombre, accesible una vez", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: ALTO_POR_DEFECTO });
    const estado = ARMAZONES.find((e) => e.entrada === "armazon-cliente" && e.estado === "resumen");
    expect(estado, "estado armazon-cliente/resumen en el inventario").toBeDefined();
    await abrirEstado(page, estado!);
    await page.getByRole("button", { name: TEXTOS.armazon.abrirMenu }).click();
    const cajon = page.getByRole("dialog", { name: TEXTOS.armazon.menu });
    await expect(cajon).toBeVisible();
    await comprobarMarcaEnMenu(cajon, "el cajón del menú");
  });

  test("capturas del logotipo del menú a 16 y 32 px", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: ALTO_POR_DEFECTO });
    const estado = ARMAZONES.find(
      (e) => e.entrada === "armazon-superadmin" && e.estado === "resumen",
    );
    expect(estado, "estado armazon-superadmin/resumen en el inventario").toBeDefined();
    await abrirEstado(page, estado!);
    const logotipo = await comprobarMarcaEnMenu(menuLateral(page), "el menú lateral");
    for (const lado of [16, 32]) {
      await logotipo.evaluate((e, l) => {
        e.setAttribute("width", String(l));
        e.setAttribute("height", String(l));
      }, lado);
      const png = await capturar(page, logotipo, lado);
      expect(dimensionesPng(png), `captura a ${lado} px`).toEqual({ ancho: lado, alto: lado });
      guardar(`menu-${lado}.png`, png);
    }
  });
});

test.describe("PRUEBA-023 · capturas a 16 y 32 px del logotipo elegido (C, nido en anillo), en la maqueta", () => {
  for (const tema of TEMAS) {
    test(`los logotipos C a 16 y 32 px se pintan y se guardan · sistema ${tema}`, async ({
      page,
    }) => {
      await page.emulateMedia({ colorScheme: tema });
      await page.setViewportSize({ width: 1280, height: ALTO_POR_DEFECTO });
      await abrirEstado(
        page,
        ESTADOS.find((e) => e.entrada === "vista-propuesta-visual")!,
      );
      let guardadas = 0;
      for (const lado of [16, 32]) {
        const logos = page.locator(`[data-logotipo="c"][data-lado="${lado}"]`);
        const n = await logos.count();
        expect(n, `logotipos C a ${lado} px en la maqueta`).toBe(3);
        for (let i = 0; i < n; i++) {
          const l = logos.nth(i);
          const variante = (await l.getAttribute("data-variante"))!;
          const fondo = (await l.getAttribute("data-fondo"))!;
          await l.scrollIntoViewIfNeeded();
          const png = await capturar(page, l, lado);
          expect(dimensionesPng(png), `${variante}/${fondo} a ${lado} px`).toEqual({
            ancho: lado,
            alto: lado,
          });
          // Una captura que no puede fallar no prueba nada: sin el dibujo, el PNG tiene que cambiar.
          await l.locator("svg").evaluate((e) => (e.style.visibility = "hidden"));
          const vacio = await capturar(page, l, lado);
          await l.locator("svg").evaluate((e) => (e.style.visibility = ""));
          expect(
            png.equals(vacio),
            `${variante}/${fondo} a ${lado} px: la captura es igual a la caja sin dibujo`,
          ).toBe(false);
          guardar(`maqueta-c-${variante}-${fondo}-${lado}-${tema}.png`, png);
          guardadas++;
        }
      }
      expect(guardadas).toBe(6);
    });
  }

  test("en la maqueta ningún logotipo se anuncia: todos son decorativos y sin nombre accesible propio", async ({
    page,
  }) => {
    await abrirEstado(
      page,
      ESTADOS.find((e) => e.entrada === "vista-propuesta-visual")!,
    );
    const logos = page.locator("[data-logotipo]");
    const n = await logos.count();
    expect(n).toBe(27);
    for (let i = 0; i < n; i++) {
      const svg = logos.nth(i).locator("svg");
      await expect(svg).toHaveAttribute("aria-hidden", "true");
      await expect(svg).not.toHaveAttribute("role", /./);
      await expect(svg).not.toHaveAttribute("aria-label", /./);
    }
  });
});
