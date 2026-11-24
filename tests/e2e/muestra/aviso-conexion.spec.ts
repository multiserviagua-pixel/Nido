// T-016 (e) · `AvisoConexion` y la hora de carga de los bloques, en navegador. PRUEBA-016 (sin
// conexión: «Sin conexión» visible y anunciado una vez, la hora de carga de lo ya visible, ninguna
// petición ni recarga, «Conexión recuperada» una vez y el aviso retirado), PRUEBA-013 (desborde a
// 320 px con el zum al 400 %), PRUEBA-017 (solo textos fijos), PRUEBA-021 (nada que enfoque y el
// foco no se mueve), PRUEBA-014 (colores forzados) y PRUEBA-025 (axe a 320 y 1280 px, en claro y
// oscuro, con la red cortada y recuperada). REQ-060, REQ-075; CA-045. La red se corta con
// `context.setOffline`, que cambia `navigator.onLine` y dispara los eventos reales; el reloj de la
// página es simulado (`page.clock`) para fijar la hora de carga y avanzar plazos.
import { expect, test, type Locator, type Page } from "@playwright/test";
import { ALTO_POR_DEFECTO, TEMAS, comprobarAccesibilidad } from "./configuracion-interfaz";
import { ESTADOS, abrirEstado, type EstadoDePrueba } from "./apoyo/estados";
import { medirDesborde } from "./apoyo/medidas";
import { TEXTOS } from "../../../src/components/textos";

const DEL_AVISO = ESTADOS.filter((e) => e.entrada === "aviso-conexion");
const estado = (clave: string): EstadoDePrueba => {
  const e = DEL_AVISO.find((x) => x.estado === clave);
  if (e === undefined) throw new Error(`falta aviso-conexion/${clave} en el inventario`);
  return e;
};
const C = TEXTOS.conexion;
const HORA_FIJA = Date.parse("2026-11-12T07:04:00Z");
const TEXTO_DE_HORA = "Datos cargados el 12 nov 2026, 08:04";

const aviso = (page: Page): Locator => page.locator("[data-aviso-conexion]");
const horas = (page: Page): Locator => page.locator("[data-hora-de-carga]");

/** Abre la página con la hora de la página fija y espera a la hidratación. */
async function abrir(page: Page, e: EstadoDePrueba): Promise<void> {
  await page.clock.install({ time: HORA_FIJA });
  await abrirEstado(page, e);
  await page.waitForLoadState("networkidle");
}

async function cortarRed(page: Page): Promise<void> {
  await page.context().setOffline(true);
  await expect(aviso(page)).toHaveAttribute("data-aviso-conexion", "sin_conexion");
}

/** Guarda cada anuncio de la región cortés (un texto tras un vacío es un anuncio nuevo). */
async function vigilarAnuncios(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const w = window as unknown as Record<string, string[]>;
    w["__anunciosCortes"] = [];
    let vacia = true;
    new MutationObserver(() => {
      const r = document.querySelector('[data-anunciador="cortes"]');
      const t = (r?.textContent ?? "").trim();
      if (t === "") {
        vacia = true;
        return;
      }
      const lista = w["__anunciosCortes"]!;
      if (vacia || lista[lista.length - 1] !== t) lista.push(t);
      vacia = false;
    }).observe(document, { subtree: true, childList: true, characterData: true });
  });
}
const anuncios = (page: Page): Promise<string[]> =>
  page.evaluate(() => (window as unknown as Record<string, string[]>)["__anunciosCortes"] ?? []);

test.afterEach(async ({ context }) => {
  await context.setOffline(false);
});

test("hay entradas que recorrer: sin conexión y recuperada", () => {
  expect(DEL_AVISO.map((e) => e.estado).sort()).toEqual(["recuperada", "sin-conexion"]);
});

test.describe("PRUEBA-016 · sin conexión (REQ-060, CA-045)", () => {
  test("en línea no hay aviso ni hora de carga: los datos son actuales", async ({ page }) => {
    await abrir(page, estado("sin-conexion"));
    await expect(aviso(page)).toHaveCount(0);
    await expect(horas(page)).toHaveCount(0);
    await expect(page.locator('[data-estado="datos"]')).toHaveCount(2);
  });

  test("al cortar la red: «Sin conexión» visible, anunciado una sola vez, y cada bloque con su hora de carga", async ({
    page,
  }) => {
    await vigilarAnuncios(page);
    await abrir(page, estado("sin-conexion"));
    await cortarRed(page);
    await expect(aviso(page)).toHaveCount(1);
    await expect(aviso(page)).toContainText(C.sinConexion);
    await expect(aviso(page)).toContainText(C.explicacion);
    await expect(horas(page)).toHaveCount(2);
    for (let i = 0; i < 2; i++) await expect(horas(page).nth(i)).toHaveText(TEXTO_DE_HORA);
    // Los datos siguen a la vista, marcados y no retirados.
    await expect(page.locator('[data-estado="datos"]')).toHaveCount(2);
    await page.clock.runFor(2000);
    expect(await anuncios(page)).toEqual([C.sinConexion]);
    // El texto visible no es región viva.
    expect(await aviso(page).locator("[aria-live], [role=status], [role=alert]").count()).toBe(0);
  });

  test("sin conexión nadie pide nada ni recarga: 0 peticiones en 35 s y los bloques siguen en datos", async ({
    page,
  }) => {
    await abrir(page, estado("sin-conexion"));
    await cortarRed(page);
    const peticiones: string[] = [];
    page.on("request", (r) => peticiones.push(r.url()));
    await page.clock.runFor(35_000);
    expect(peticiones).toEqual([]);
    await expect(page.locator('[data-estado="datos"]')).toHaveCount(2);
    await expect(page.locator('[data-estado="error"], [data-esqueleto]')).toHaveCount(0);
    await expect(horas(page)).toHaveCount(2);
  });

  test("al volver la red: se retira el aviso y las horas, se anuncia «Conexión recuperada» una vez y se retira sola", async ({
    page,
  }) => {
    await vigilarAnuncios(page);
    await abrir(page, estado("recuperada"));
    await cortarRed(page);
    await page.context().setOffline(false);
    await expect(aviso(page)).toHaveAttribute("data-aviso-conexion", "recuperada");
    await expect(aviso(page)).toContainText(C.recuperada);
    await expect(aviso(page)).not.toContainText(C.sinConexion);
    await expect(horas(page)).toHaveCount(0);
    await page.clock.runFor(2000);
    expect(await anuncios(page)).toEqual([C.sinConexion, C.recuperada]);
    await page.clock.runFor(8100);
    await expect(aviso(page)).toHaveCount(0);
    expect(await anuncios(page)).toEqual([C.sinConexion, C.recuperada]);
  });

  test("perder la red otra vez antes de que se retire la confirmación vuelve a avisar", async ({
    page,
  }) => {
    await vigilarAnuncios(page);
    await abrir(page, estado("sin-conexion"));
    await cortarRed(page);
    await page.context().setOffline(false);
    await expect(aviso(page)).toHaveAttribute("data-aviso-conexion", "recuperada");
    await cortarRed(page);
    await page.clock.runFor(10_000);
    // La pérdida no caduca.
    await expect(aviso(page)).toHaveAttribute("data-aviso-conexion", "sin_conexion");
    await page.clock.runFor(2000);
    expect(await anuncios(page)).toEqual([C.sinConexion, C.recuperada, C.sinConexion]);
  });

  test("la hora de carga es la de la carga, no la de cuando se corta la red (Madrid)", async ({
    page,
  }) => {
    await abrir(page, estado("sin-conexion"));
    await page.clock.runFor(3_600_000);
    await cortarRed(page);
    await expect(horas(page).first()).toHaveText(TEXTO_DE_HORA);
  });
});

test.describe("PRUEBA-017 y PRUEBA-021 · solo textos fijos y sin tocar el foco", () => {
  test("el aviso solo dice los textos fijos y no tiene nada que enfocar", async ({ page }) => {
    await abrir(page, estado("sin-conexion"));
    await cortarRed(page);
    const texto = ((await aviso(page).textContent()) ?? "").replace(/\s+/g, " ").trim();
    expect(texto).toBe(`${C.sinConexion} ${C.explicacion}`);
    expect(await aviso(page).locator("a, button, input, select, [tabindex]").count()).toBe(0);
  });

  test("el foco no se mueve al cortar la red ni al recuperarla", async ({ page }) => {
    await abrir(page, estado("sin-conexion"));
    await page.keyboard.press("Tab");
    const antes = await page.evaluate(() => document.activeElement?.outerHTML ?? "");
    expect(antes).not.toBe("");
    await cortarRed(page);
    expect(await page.evaluate(() => document.activeElement?.outerHTML ?? "")).toBe(antes);
    await page.context().setOffline(false);
    await expect(aviso(page)).toHaveAttribute("data-aviso-conexion", "recuperada");
    expect(await page.evaluate(() => document.activeElement?.outerHTML ?? "")).toBe(antes);
  });
});

test.describe("PRUEBA-013 · desborde con el aviso (REQ-044, REQ-065)", () => {
  test("a 320 px con el zum al 400 % no se desplaza la página, sin conexión y recuperada", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 320, height: ALTO_POR_DEFECTO });
    await abrir(page, estado("sin-conexion"));
    await cortarRed(page);
    for (let i = 0; i < 2; i++) {
      const d = await medirDesborde(page);
      expect(d.sobra, "sobra").toBe(0);
      expect(d.fuera, "fuera").toEqual([]);
      if (i === 0) await page.context().setOffline(false);
    }
  });
});

test.describe("PRUEBA-014 · colores forzados (REQ-043, REQ-085)", () => {
  test("el aviso conserva su borde y el icono sigue visible", async ({ page }) => {
    await page.emulateMedia({ forcedColors: "active" });
    await abrir(page, estado("sin-conexion"));
    await cortarRed(page);
    const borde = await aviso(page).evaluate((x) => {
      const c = getComputedStyle(x);
      return { ancho: parseFloat(c.borderTopWidth), estilo: c.borderTopStyle };
    });
    expect(borde.ancho).toBeGreaterThan(0);
    expect(borde.estilo).not.toBe("none");
    await expect(aviso(page).locator("svg")).toBeVisible();
    const trazo = await aviso(page)
      .locator("svg")
      .evaluate((s) => getComputedStyle(s).stroke);
    expect(trazo).not.toBe("none");
  });
});

test.describe("PRUEBA-025 · axe a 320 y 1280 px, en claro y oscuro", () => {
  for (const ancho of [320, 1280]) {
    for (const tema of TEMAS) {
      test(`sin conexión y recuperada · ${ancho} px · ${tema}`, async ({ page }) => {
        await page.setViewportSize({ width: ancho, height: ALTO_POR_DEFECTO });
        await page.emulateMedia({ colorScheme: tema });
        await abrir(page, estado("sin-conexion"));
        await cortarRed(page);
        await expect(horas(page)).toHaveCount(2);
        await comprobarAccesibilidad(page);
        await page.context().setOffline(false);
        await expect(aviso(page)).toHaveAttribute("data-aviso-conexion", "recuperada");
        await comprobarAccesibilidad(page);
      });
    }
  }
});
