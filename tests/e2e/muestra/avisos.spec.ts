// PRUEBA-015 (avisos: 8 s, pausa por puntero y por foco, cierre con teclado, 2 y 5 sin solapes ni
// foco tapado, anuncio por la región cortés una sola vez, sin texto libre) y las comprobaciones de
// avisos de PRUEBA-011 (T-001, informe 2.2, 2.2.1 y 2.2.2) con RELOJ REAL. PRUEBA-021 (solo con
// teclado) y PRUEBA-025 (axe). CA-013, CA-015, CA-027, CA-053; REQ-021, REQ-042, REQ-072, REQ-073.
// T-009 (g); la parte que los hace pasar es T-016 (b). Recorre la entrada `avisos-temporales`, que
// añade T-016 (b) a `inventario.ts` en su commit. El contrato de la página (ruta, controles, qué
// dispara el aviso) está en `specs/020-sistema-diseno-armazon/evidencias/T-009/avisos-contrato.md`.
//
// Motores: nada aquí fija el motor. El que corre es el de `--browser` (Chromium por defecto), y el
// nombre del motor va en las anotaciones. Antes de integrar, `qa` repite los dos casos de pausa por
// foco con `--repeat-each=10` en Chromium, Firefox y WebKit (tareas.md, T-016 (b)).
import { chromium, expect, firefox, test, webkit, type Locator, type Page } from "@playwright/test";
import { ESTADOS, abrirEstado, anotarPendiente, type EstadoDePrueba } from "./apoyo/estados";
import { comprobarAccesibilidad } from "./configuracion-interfaz";
import { medirDesborde } from "./apoyo/medidas";
import { TEXTOS } from "../../../src/components/textos";

// Textos que fija el diseño (REQ-021, «Avisos: componente propio»): el botón y el nombre de la
// región. Se exige además que estén entre los textos fijos de `TEXTOS` (más abajo).
const CERRAR = "Cerrar aviso";
const REGION = "Avisos";

const AVISOS = ESTADOS.filter((e) => e.entrada === "avisos-temporales");
const estado = (clave: string): EstadoDePrueba => {
  const e = AVISOS.find((x) => x.estado === clave);
  if (e === undefined)
    throw new Error(`falta el estado ${clave} de «avisos-temporales» del inventario`);
  return e;
};
/** Avisos que enseña cada estado al pulsar el disparador. */
const CUANTOS = { uno: 1, dos: 2, cinco: 5, "texto-largo": 1 } as const;

const DISPARADOR = '[data-disparador="aviso"]';
const NEUTRO = '[data-control="neutro"]';
const FINAL = '[data-control="final"]';
const AVISO = "[data-aviso]";

const disparador = (page: Page): Locator => page.locator(DISPARADOR);
const avisos = (page: Page): Locator => page.locator(AVISO);
const region = (page: Page): Locator => page.getByRole("region", { name: REGION });
const cortes = (page: Page): Locator => page.locator('[data-anunciador="cortes"]');
const urgente = (page: Page): Locator => page.locator('[data-anunciador="urgente"]');

// ---------------------------------------------------------------------------------------------
// Textos fijos: todo lo que sale de `TEXTOS` (REQ-021, artículo 1: sin texto libre).
function juntarHojas(valor: unknown, destino: Set<string>): void {
  if (typeof valor === "string") destino.add(valor.replace(/\s+/g, " ").trim());
  else if (valor !== null && typeof valor === "object") {
    for (const v of Object.values(valor)) juntarHojas(v, destino);
  }
}
const TEXTOS_FIJOS = new Set<string>();
juntarHojas(TEXTOS, TEXTOS_FIJOS);
const limpiar = (t: string): string => t.replace(/\s+/g, " ").trim();

// ---------------------------------------------------------------------------------------------
// Scripts que se inyectan antes de cargar la página (en la prueba, nunca en `src/`).
/** Apunta cada texto que recibe la región cortés (cada paso de vacía a con texto). */
function registrarAnuncios(): void {
  const w = window as unknown as { __anuncios: string[]; __anunciosUrgentes: string[] };
  w.__anuncios = [];
  w.__anunciosUrgentes = [];
  let ultimo = "";
  let ultimoUrgente = "";
  new MutationObserver(() => {
    const t = document.querySelector('[data-anunciador="cortes"]')?.textContent ?? "";
    if (t === "") ultimo = "";
    else if (t !== ultimo) {
      ultimo = t;
      w.__anuncios.push(t);
    }
    const u = document.querySelector('[data-anunciador="urgente"]')?.textContent ?? "";
    if (u === "") ultimoUrgente = "";
    else if (u !== ultimoUrgente) {
      ultimoUrgente = u;
      w.__anunciosUrgentes.push(u);
    }
  }).observe(document, { subtree: true, childList: true, characterData: true });
}

/** SEMBRADO 1 (prueba de la prueba): al aparecer un aviso, mueve el foco a su botón. */
function sembrarRoboAlAparecer(): void {
  new MutationObserver(() => {
    const b = document.querySelector("[data-aviso] button");
    if (b instanceof HTMLElement && document.activeElement !== b) b.focus();
  }).observe(document, { subtree: true, childList: true });
}

/** SEMBRADO 2: 1,5 s después de que el foco entre en un aviso, se lo lleva al último control. */
function sembrarRoboDelFocoDentro(): void {
  document.addEventListener("focusin", (e) => {
    const t = e.target;
    if (t instanceof HTMLElement && t.closest("[data-aviso]") !== null) {
      setTimeout(() => {
        const f = document.querySelector('[data-control="final"]');
        if (f instanceof HTMLElement) f.focus();
      }, 1500);
    }
  });
}

/** SEMBRADO 3: el aviso se retira a los 8 s aunque el foco esté dentro (la pausa que falla). */
function sembrarRetiradaConFocoDentro(): void {
  let armado = false;
  new MutationObserver(() => {
    if (armado || document.querySelector("[data-aviso]") === null) return;
    armado = true;
    setTimeout(() => {
      for (const n of document.querySelectorAll("[data-aviso]")) n.remove();
    }, 8000);
  }).observe(document, { subtree: true, childList: true });
}

// ---------------------------------------------------------------------------------------------
async function abrir(page: Page, e: EstadoDePrueba): Promise<void> {
  await page.addInitScript(registrarAnuncios);
  await abrirEstado(page, e);
  // Next hidrata los controles después de pintarlos: se espera a que respondan.
  await page.waitForLoadState("networkidle");
  await expect(disparador(page)).toBeVisible();
}

/** El foco está en un botón «Cerrar aviso» dentro de un aviso. */
const focoEnCerrar = (page: Page): Promise<boolean> =>
  page.evaluate((nombre) => {
    const a = document.activeElement;
    if (!(a instanceof HTMLElement) || a.closest("[data-aviso]") === null) return false;
    return (a.getAttribute("aria-label") ?? a.textContent ?? "").trim() === nombre;
  }, CERRAR);

const cuantosAvisos = (page: Page): Promise<number> =>
  page.evaluate(() => document.querySelectorAll("[data-aviso]").length);

/** Tabula hasta «Cerrar aviso» (como mucho 60 pulsaciones). Devuelve las pulsaciones dadas. */
async function tabularACerrar(page: Page): Promise<number> {
  let n = 0;
  while (!(await focoEnCerrar(page)) && n < 60) {
    await page.keyboard.press("Tab");
    n += 1;
  }
  return n;
}

type Via = "teclado" | "raton" | "tactil";
const VIAS: readonly Via[] = ["teclado", "raton", "tactil"];

async function pulsar(page: Page, selector: string, via: Via): Promise<void> {
  if (via === "teclado") {
    await page.focus(selector);
    await page.keyboard.press("Enter");
  } else if (via === "raton") {
    await page.locator(selector).click();
  } else {
    await page.locator(selector).tap();
  }
}

// ---------------------------------------------------------------------------------------------
// Comprobación 1 (T-001, 2.2.1): pausa por el foco con reloj real.
// Tabulador `retardoMs` después de abrir (0 = justo al abrir); el foco se comprueba en «Cerrar
// aviso» ANTES de contar; luego, 10 s con el aviso visible y el foco donde debe estar.
async function comprobarPausaPorFoco(page: Page, retardoMs: number): Promise<void> {
  await abrir(page, estado("uno"));
  await page.focus(DISPARADOR);
  const t0 = Date.now();
  await page.keyboard.press("Enter");
  if (retardoMs > 0) await page.waitForTimeout(retardoMs);
  const pulsaciones = await tabularACerrar(page);
  if (!(await focoEnCerrar(page))) {
    throw new Error(
      `precondición: el foco no llegó a «${CERRAR}» tras ${pulsaciones} tabulaciones; no se cuenta`,
    );
  }
  test.info().annotations.push({
    type: "pausa-por-foco",
    description: `retardo ${retardoMs} ms; ${pulsaciones} tabulaciones hasta «${CERRAR}»`,
  });
  for (;;) {
    const transcurrido = Date.now() - t0;
    if (transcurrido >= 10_000) break;
    const sigue = (await cuantosAvisos(page)) > 0;
    if (!sigue) {
      throw new Error(
        `el aviso se retiró a los ${transcurrido} ms con el foco dentro de «${CERRAR}» (la pausa por el foco falla)`,
      );
    }
    if (!(await focoEnCerrar(page))) {
      throw new Error(
        `el foco ya no está en «${CERRAR}» a los ${transcurrido} ms: la comprobación de pausa no es válida`,
      );
    }
    await page.waitForTimeout(200);
  }
  expect(await cuantosAvisos(page), "el aviso sigue a los 10 s con el foco dentro").toBe(1);
}

// Comprobación 2 (T-001, 2.2.2): el aviso no mueve el foco. Con ratón y táctil, WebKit manda el foco
// al cuerpo en CUALQUIER pulsación de botón: se mide antes con un botón que no abre nada y se exige
// lo mismo al aviso. Es una adaptación al motor, no una relajación.
async function comprobarNoRobaFoco(page: Page, via: Via): Promise<string> {
  await abrir(page, estado("uno"));
  let cuerpoTrasPulsar = false;
  if (via !== "teclado") {
    await page.focus(NEUTRO);
    await pulsar(page, NEUTRO, via);
    cuerpoTrasPulsar = await page.evaluate(() => document.activeElement === document.body);
  }
  await page.focus(DISPARADOR);
  await page.evaluate(() => {
    (window as unknown as { __antes: Element | null }).__antes = document.activeElement;
  });
  await pulsar(page, DISPARADOR, via);
  await expect(avisos(page)).toHaveCount(1);
  await page.waitForTimeout(1500);
  const mismo = await page.evaluate(
    (cuerpo) =>
      document.activeElement ===
      (cuerpo ? document.body : (window as unknown as { __antes: Element | null }).__antes),
    cuerpoTrasPulsar,
  );
  if (!mismo) {
    throw new Error(
      "el aviso no roba el foco: document.activeElement no es el mismo que antes de activarlo " +
        "(o el cuerpo, si el motor lo manda ahí con cualquier pulsación)",
    );
  }
  return cuerpoTrasPulsar ? "cuerpo (control del motor)" : "el botón que lo activó";
}

// ===========================================================================================
test("hay entradas que recorrer: «avisos-temporales» tiene sus cuatro estados en el inventario", () => {
  expect(AVISOS.map((a) => a.estado).sort()).toEqual(Object.keys(CUANTOS).sort());
});

test("motores: lo que no se puede repetir en este equipo queda anotado como no comprobado", async ({
  browserName,
}) => {
  test.setTimeout(60_000);
  const motores = { chromium, firefox, webkit };
  // Se comprueba lanzándolo: la ruta del ejecutable no sirve (Chromium sin interfaz usa otra carpeta).
  const instalados: { nombre: string; hay: boolean }[] = [];
  for (const [nombre, motor] of Object.entries(motores)) {
    let hay = false;
    try {
      await (await motor.launch({ timeout: 15_000 })).close();
      hay = true;
    } catch {
      hay = false;
    }
    instalados.push({ nombre, hay });
  }
  test.info().annotations.push({ type: "motor", description: browserName });
  for (const m of instalados.filter((x) => !x.hay)) {
    anotarPendiente(
      test.info(),
      `Repeticiones de la pausa por foco y del foco que no cambia en ${m.nombre}: navegador no instalado`,
      "la suma de navegadores de T-020 o CI",
    );
  }
  expect(instalados.find((m) => m.nombre === browserName)?.hay, `${browserName} instalado`).toBe(
    true,
  );
});

test.describe("PRUEBA-015 · la página de la muestra (contrato)", () => {
  for (const [clave, cuantos] of Object.entries(CUANTOS)) {
    test(`${clave}: sin avisos al cargar; el disparador muestra ${cuantos}; cada uno con «${CERRAR}» y un texto fijo; región «${REGION}» que no es viva`, async ({
      page,
    }) => {
      await abrir(page, estado(clave));
      await expect(avisos(page)).toHaveCount(0);
      await expect(page.locator("[data-disparador]")).toHaveCount(1);
      await expect(page.locator(NEUTRO)).toHaveCount(1);
      await expect(page.locator(FINAL)).toHaveCount(1);
      await disparador(page).click();
      await expect(avisos(page)).toHaveCount(cuantos);
      const r = region(page);
      await expect(r).toBeVisible();
      await expect(r.locator("ol > li[data-aviso]")).toHaveCount(cuantos);
      await expect(r.getByRole("button", { name: CERRAR })).toHaveCount(cuantos);
      const textos = await page.locator("[data-aviso-texto]").allInnerTexts();
      expect(textos).toHaveLength(cuantos);
      expect(new Set(textos.map(limpiar)).size, "textos distintos").toBe(cuantos);
      for (const t of textos) {
        expect(TEXTOS_FIJOS.has(limpiar(t)), `«${limpiar(t)}» es un texto fijo de TEXTOS`).toBe(
          true,
        );
      }
      expect(TEXTOS_FIJOS.has(CERRAR), `«${CERRAR}» está en TEXTOS`).toBe(true);
      expect(TEXTOS_FIJOS.has(REGION), `«${REGION}» está en TEXTOS`).toBe(true);
      if (clave === "texto-largo") {
        expect(limpiar(textos[0] ?? "").length, "texto largo").toBeGreaterThanOrEqual(120);
      }
      // La lista visible no es región viva: el anuncio sale solo de `Anunciador` (una vez).
      const vivos = await page.evaluate(() => {
        const marcados = (e: Element): boolean =>
          e.matches(
            '[aria-live]:not([aria-live="off"]), [role="status"], [role="alert"], [role="log"]',
          );
        const reg = document.querySelector('[role="region"], section[aria-label]');
        const dentro = reg === null ? [] : [...reg.querySelectorAll("*")].filter(marcados);
        const ancestros: Element[] = [];
        for (let p = reg; p !== null; p = p.parentElement) if (marcados(p)) ancestros.push(p);
        return dentro.length + ancestros.length;
      });
      expect(vivos, "elementos vivos en la región de avisos o por encima").toBe(0);
    });
  }
});

test.describe("PRUEBA-015 · el tipo no admite avisos de error; sin texto libre (REQ-021, REQ-072)", () => {
  test("ningún aviso es una alerta ni usa la región urgente; la página no ofrece otro tipo de aviso", async ({
    page,
  }) => {
    await abrir(page, estado("cinco"));
    await disparador(page).click();
    await expect(avisos(page)).toHaveCount(5);
    await expect(page.locator(`${AVISO}[role="alert"], ${AVISO} [role="alert"]`)).toHaveCount(0);
    await page.waitForTimeout(3500);
    await expect(urgente(page)).toHaveText("");
    const urgentes = await page.evaluate(
      () => (window as unknown as { __anunciosUrgentes: string[] }).__anunciosUrgentes,
    );
    expect(urgentes, "anuncios por la región urgente").toEqual([]);
    expect(
      await page.locator("[data-disparador]").count(),
      "un solo disparador, de tipo único",
    ).toBe(1);
    // El tipo (sin `error`, sin cadena libre) lo prueba la prueba unitaria de T-016 (b) con el
    // compilador; aquí solo se puede ver que nada de la página lo contradice.
  });
});

test.describe("PRUEBA-015 · anuncio por la región cortés, una vez y en orden (REQ-042)", () => {
  test("cinco avisos: cada texto se anuncia una sola vez, en el orden de la lista", async ({
    page,
  }) => {
    await abrir(page, estado("cinco"));
    await disparador(page).click();
    await expect(avisos(page)).toHaveCount(5);
    const lista = (await page.locator("[data-aviso-texto]").allInnerTexts()).map(limpiar);
    const leer = (): Promise<string[]> =>
      page
        .evaluate(() => (window as unknown as { __anuncios: string[] }).__anuncios)
        .then((a) => a.map(limpiar));
    await expect
      .poll(async () => (await leer()).length, { timeout: 5000 })
      .toBeGreaterThanOrEqual(5);
    await page.waitForTimeout(1500);
    expect(await leer(), "anuncios, en orden y sin repetir").toEqual(lista);
  });

  test("un aviso: se anuncia una vez y no se vuelve a anunciar al pasar el tiempo ni al enfocar su botón", async ({
    page,
  }) => {
    await abrir(page, estado("uno"));
    await page.focus(DISPARADOR);
    await page.keyboard.press("Enter");
    await expect(avisos(page)).toHaveCount(1);
    const texto = limpiar((await page.locator("[data-aviso-texto]").innerText()) ?? "");
    await tabularACerrar(page);
    await page.waitForTimeout(2500);
    const a = (
      await page.evaluate(() => (window as unknown as { __anuncios: string[] }).__anuncios)
    ).map(limpiar);
    expect(a).toEqual([texto]);
  });
});

test.describe("PRUEBA-015 · duración de 8 s sin foco ni puntero (REQ-021, reloj real)", () => {
  test("el aviso se retira a los 8 s, entre 7,5 y 9,5 s", async ({ page }) => {
    test.setTimeout(30_000);
    await abrir(page, estado("uno"));
    await page.focus(DISPARADOR);
    await page.keyboard.press("Enter");
    await expect(avisos(page)).toHaveCount(1);
    const t0 = Date.now();
    await expect(avisos(page)).toHaveCount(0, { timeout: 11_000 });
    const dur = Date.now() - t0;
    test.info().annotations.push({ type: "duracion-ms", description: String(dur) });
    expect(dur).toBeGreaterThanOrEqual(7500);
    expect(dur).toBeLessThanOrEqual(9500);
  });
});

test.describe("PRUEBA-015 · reloj simulado: 8 s, pausa por puntero y por foco, cierre", () => {
  test("a los 7 s sigue; a los 8,6 s ya no; con dos avisos, los dos", async ({ page }) => {
    await page.clock.install();
    await abrir(page, estado("dos"));
    await disparador(page).click();
    await expect(avisos(page)).toHaveCount(2);
    await page.clock.runFor(7_000);
    await expect(avisos(page)).toHaveCount(2);
    await page.clock.runFor(1_600);
    await expect(avisos(page)).toHaveCount(0);
  });

  test("con el puntero encima no se retira (20 s); al salir vuelve a empezar entero (8 s)", async ({
    page,
  }) => {
    await page.clock.install();
    await abrir(page, estado("uno"));
    await disparador(page).click();
    await expect(avisos(page)).toHaveCount(1);
    await avisos(page).hover();
    await page.clock.runFor(20_000);
    await expect(avisos(page), "con el puntero encima sigue a los 20 s").toHaveCount(1);
    await page.mouse.move(2, 2);
    await page.clock.runFor(7_000);
    await expect(avisos(page), "al salir el plazo vuelve a empezar entero").toHaveCount(1);
    await page.clock.runFor(1_600);
    await expect(avisos(page)).toHaveCount(0);
  });

  test("con el foco en «Cerrar aviso» no se retira (20 s); al sacarlo vuelve a empezar entero", async ({
    page,
  }) => {
    await page.clock.install();
    await abrir(page, estado("uno"));
    await page.focus(DISPARADOR);
    await page.keyboard.press("Enter");
    await expect(avisos(page)).toHaveCount(1);
    await tabularACerrar(page);
    expect(await focoEnCerrar(page), "foco en «Cerrar aviso» antes de contar").toBe(true);
    await page.clock.runFor(20_000);
    await expect(avisos(page), "con el foco dentro sigue a los 20 s").toHaveCount(1);
    await page.locator(FINAL).focus();
    await page.clock.runFor(7_000);
    await expect(avisos(page), "al salir el foco el plazo vuelve a empezar entero").toHaveCount(1);
    await page.clock.runFor(1_600);
    await expect(avisos(page)).toHaveCount(0);
  });

  test("el foco entra justo antes de vencer el plazo (reloj parado a los 7,7 s): el aviso no se retira", async ({
    page,
  }) => {
    const inicio = new Date("2026-11-23T10:00:00");
    await page.clock.install({ time: inicio });
    await abrir(page, estado("uno"));
    await page.clock.pauseAt(new Date(inicio.getTime() + 60_000));
    await page.focus(DISPARADOR);
    await page.keyboard.press("Enter");
    await expect(avisos(page)).toHaveCount(1);
    await page.clock.runFor(7_700);
    await expect(avisos(page)).toHaveCount(1);
    await tabularACerrar(page);
    expect(await focoEnCerrar(page), "foco en «Cerrar aviso» antes de contar").toBe(true);
    await page.clock.runFor(2_000);
    await expect(avisos(page), "venció el plazo con el foco dentro: no se retira").toHaveCount(1);
    expect(await focoEnCerrar(page)).toBe(true);
  });
});

test.describe("PRUEBA-015 · cierre con teclado (REQ-021, CA-015)", () => {
  for (const [nombre, tecla] of [
    ["Intro", "Enter"],
    ["Espacio", "Space"],
    ["Escape", "Escape"],
  ] as const) {
    test(`${nombre} con el foco en «${CERRAR}» cierra ese aviso y el foco pasa al siguiente; al cerrar el último vuelve al elemento anterior`, async ({
      page,
    }) => {
      await abrir(page, estado("dos"));
      await page.focus(DISPARADOR);
      await page.keyboard.press("Enter");
      await expect(avisos(page)).toHaveCount(2);
      // Se apunta el elemento enfocado antes de cada tabulación: el último antes de entrar es el que
      // debe recuperar el foco cuando no quede ningún aviso.
      let n = 0;
      while (!(await focoEnCerrar(page)) && n < 60) {
        await page.evaluate(() => {
          (window as unknown as { __previo: Element | null }).__previo = document.activeElement;
        });
        await page.keyboard.press("Tab");
        n += 1;
      }
      expect(await focoEnCerrar(page), "foco en «Cerrar aviso» antes de seguir").toBe(true);
      await page.keyboard.press(tecla === "Space" ? " " : tecla);
      await expect(avisos(page)).toHaveCount(1);
      expect(
        await page.evaluate(() => document.activeElement?.closest("[data-aviso]") !== null),
        "el foco pasa al aviso siguiente",
      ).toBe(true);
      expect(await focoEnCerrar(page)).toBe(true);
      await page.keyboard.press(tecla === "Space" ? " " : tecla);
      await expect(avisos(page)).toHaveCount(0);
      expect(
        await page.evaluate(
          () =>
            document.activeElement === (window as unknown as { __previo: Element | null }).__previo,
        ),
        "al cerrar el último, el foco vuelve al elemento que lo tenía antes de entrar",
      ).toBe(true);
    });
  }

  test("Escape con el foco fuera del aviso no lo cierra", async ({ page }) => {
    await abrir(page, estado("uno"));
    await page.focus(DISPARADOR);
    await page.keyboard.press("Enter");
    await expect(avisos(page)).toHaveCount(1);
    await page.keyboard.press("Escape");
    await page.waitForTimeout(600);
    await expect(avisos(page)).toHaveCount(1);
  });

  test("50 tabulaciones y 50 con Mayúsculas con cinco avisos abiertos: sin trampa y sin perder el foco", async ({
    page,
  }) => {
    await abrir(page, estado("cinco"));
    await page.focus(DISPARADOR);
    await page.keyboard.press("Enter");
    await expect(avisos(page)).toHaveCount(5);
    const vistos = new Set<string>();
    for (const tecla of ["Tab", "Shift+Tab"]) {
      for (let i = 0; i < 50; i += 1) {
        await page.keyboard.press(tecla);
        const id = await page.evaluate(() => {
          const a = document.activeElement;
          if (a === null || a === document.body) return "(cuerpo)";
          return `${a.tagName.toLowerCase()}#${a.id}|${a.textContent?.trim().slice(0, 20) ?? ""}|${[
            ...document.querySelectorAll("*"),
          ].indexOf(a)}`;
        });
        vistos.add(id);
      }
    }
    test.info().annotations.push({ type: "elementos-distintos", description: String(vistos.size) });
    expect(vistos.size, "elementos distintos recorridos").toBeGreaterThan(6);
  });
});

test.describe("PRUEBA-015 · 2 y 5 avisos sin solapes ni foco tapado; 40 % del alto; texto largo (REQ-072)", () => {
  test.use({ viewport: { width: 1280, height: 500 } });
  for (const clave of ["dos", "cinco"] as const) {
    test(`${clave}: sin solapes, región de 40 % como mucho que se desplaza por dentro, y ningún control enfocado queda tapado`, async ({
      page,
    }) => {
      await abrir(page, estado(clave));
      const alto = await page.evaluate(() => document.documentElement.scrollHeight);
      expect(alto, "precondición: la página es más alta que la ventana (contrato)").toBeGreaterThan(
        700,
      );
      await page.focus(DISPARADOR);
      await page.keyboard.press("Enter");
      await expect(avisos(page)).toHaveCount(CUANTOS[clave]);
      const m = await region(page).evaluate((el) => {
        const cajas = [...el.querySelectorAll("[data-aviso]")].map((e) =>
          e.getBoundingClientRect(),
        );
        let solapes = 0;
        for (let i = 0; i < cajas.length; i += 1) {
          for (let j = i + 1; j < cajas.length; j += 1) {
            const a = cajas[i];
            const b = cajas[j];
            if (a === undefined || b === undefined) continue;
            const dx = Math.min(a.right, b.right) - Math.max(a.left, b.left);
            const dy = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
            if (dx > 1 && dy > 1) solapes += 1;
          }
        }
        return {
          alto: el.getBoundingClientRect().height,
          ventana: window.innerHeight,
          scroll: el.scrollHeight,
          cliente: el.clientHeight,
          overflowY: getComputedStyle(el).overflowY,
          solapes,
        };
      });
      expect(m.solapes, "avisos que se pisan").toBe(0);
      expect(m.alto, "alto de la región").toBeLessThanOrEqual(m.ventana * 0.4 + 1);
      if (clave === "cinco") {
        expect(
          m.scroll,
          "con cinco avisos y 500 px de alto, la región se desplaza por dentro",
        ).toBeGreaterThan(m.cliente);
        expect(["auto", "scroll"]).toContain(m.overflowY);
      }
      // Foco tapado: en cada tabulación, un control fuera de los avisos no queda bajo la región.
      const tapados: string[] = [];
      for (let i = 0; i < 60; i += 1) {
        await page.keyboard.press("Tab");
        const tapa = await page.evaluate(() => {
          const a = document.activeElement;
          const reg = document.querySelector('[role="region"][aria-label], section[aria-label]');
          if (!(a instanceof HTMLElement) || reg === null || a === document.body) return null;
          if (reg.contains(a)) return null;
          const ra = a.getBoundingClientRect();
          const rr = reg.getBoundingClientRect();
          const dx = Math.min(ra.right, rr.right) - Math.max(ra.left, rr.left);
          const dy = Math.min(ra.bottom, rr.bottom) - Math.max(ra.top, rr.top);
          return dx > 1 && dy > 1
            ? `${a.tagName.toLowerCase()}#${a.id} «${(a.textContent ?? "").trim().slice(0, 20)}»`
            : null;
        });
        if (tapa !== null) tapados.push(tapa);
      }
      expect(tapados, "controles enfocados bajo la región de avisos").toEqual([]);
    });
  }

  test.describe("texto largo a 320 px", () => {
    test.use({ viewport: { width: 320, height: 640 } });
    test("sin desplazamiento horizontal, sin texto recortado y dentro del 40 %", async ({
      page,
    }) => {
      await abrir(page, estado("texto-largo"));
      await disparador(page).click();
      await expect(avisos(page)).toHaveCount(1);
      const d = await medirDesborde(page);
      expect(d.sobra, "desplazamiento horizontal").toBe(0);
      expect(d.fuera).toEqual([]);
      const m = await region(page).evaluate((el) => {
        const li = el.querySelector("[data-aviso]");
        const t = el.querySelector("[data-aviso-texto]");
        return {
          alto: el.getBoundingClientRect().height,
          ventana: window.innerHeight,
          anchoLi: li === null ? -1 : li.scrollWidth - li.clientWidth,
          recorte: t === null ? -1 : t.scrollWidth - t.clientWidth,
        };
      });
      expect(m.alto).toBeLessThanOrEqual(m.ventana * 0.4 + 1);
      expect(m.anchoLi).toBeLessThanOrEqual(1);
      expect(m.recorte).toBeLessThanOrEqual(1);
    });
  });
});

test.describe("PRUEBA-025 · avisos abiertos sin infracciones de axe", () => {
  for (const ancho of [1280, 320]) {
    test(`cinco avisos abiertos a ${ancho} px`, async ({ page }) => {
      await page.setViewportSize({ width: ancho, height: 800 });
      await abrir(page, estado("cinco"));
      await disparador(page).click();
      await expect(avisos(page)).toHaveCount(5);
      await comprobarAccesibilidad(page);
    });
  }
});

// ===========================================================================================
// T-001 con reloj real. Repetir con `--repeat-each=10` en cada motor.
test.describe("PRUEBA-011 en el componente · pausa por foco, reloj real (T-001 2.2.1; REQ-021)", () => {
  test("tabulador justo al abrir: el foco llega a «Cerrar aviso» y a los 10 s el aviso sigue", async ({
    page,
    browserName,
  }) => {
    test.setTimeout(45_000);
    test.info().annotations.push({ type: "motor", description: browserName });
    await comprobarPausaPorFoco(page, 0);
  });

  test("tabulador 600 ms después de abrir: el foco llega a «Cerrar aviso» y a los 10 s el aviso sigue", async ({
    page,
    browserName,
  }) => {
    test.setTimeout(45_000);
    test.info().annotations.push({ type: "motor", description: browserName });
    await comprobarPausaPorFoco(page, 600);
  });
});

for (const via of VIAS) {
  test.describe(`PRUEBA-011 en el componente · el aviso no roba el foco con ${via} (T-001 2.2.2; CA-015)`, () => {
    test.use({ hasTouch: via === "tactil" });
    test(`1,5 s después de activarlo, el foco activo es el mismo (control del motor medido antes)`, async ({
      page,
      browserName,
    }) => {
      const donde = await comprobarNoRobaFoco(page, via);
      test.info().annotations.push({ type: "motor", description: browserName });
      test.info().annotations.push({ type: "foco-esperado", description: donde });
      // El aviso es visible, se anuncia, y la página sigue operable (nada queda inerte).
      await expect(avisos(page)).toHaveCount(1);
      await page.locator(FINAL).click({ trial: true, timeout: 1500 });
      const a = await page.evaluate(
        () => (window as unknown as { __anuncios: string[] }).__anuncios,
      );
      expect(a.length, "anuncios por la región cortés").toBe(1);
      await expect(cortes(page)).toBeAttached();
    });
  });
}

// ===========================================================================================
// La prueba de la prueba (guion de T-001, 2.1): un fallo sembrado EN LA PRUEBA, sin tocar `src/`,
// tiene que hacer fallar cada comprobación, y por la razón correcta.
test.describe("La prueba de la prueba: un robo de foco sembrado las hace fallar (T-001 2.1)", () => {
  test("el aviso que mueve el foco a su botón al aparecer: falla «no roba el foco» con teclado", async ({
    page,
  }) => {
    await page.addInitScript(sembrarRoboAlAparecer);
    await expect(comprobarNoRobaFoco(page, "teclado")).rejects.toThrow(/el aviso no roba el foco/);
  });

  test("el foco se lo llevan 1,5 s después de entrar en «Cerrar aviso»: falla la pausa por foco", async ({
    page,
  }) => {
    test.setTimeout(45_000);
    await page.addInitScript(sembrarRoboDelFocoDentro);
    await expect(comprobarPausaPorFoco(page, 600)).rejects.toThrow(
      /el foco ya no está en «Cerrar aviso»/,
    );
  });

  test("el aviso se retira a los 8 s con el foco dentro: falla la pausa por foco", async ({
    page,
  }) => {
    test.setTimeout(45_000);
    await page.addInitScript(sembrarRetiradaConFocoDentro);
    await expect(comprobarPausaPorFoco(page, 600)).rejects.toThrow(
      /se retiró a los \d+ ms con el foco dentro/,
    );
  });
});
