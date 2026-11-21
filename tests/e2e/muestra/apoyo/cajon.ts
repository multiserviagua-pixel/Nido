// Medidas del cajón y del menú que toman PRUEBA-012 (menú, cajón) y PRUEBA-021 (teclado, foco,
// objetivos de pulsación) sobre la página abierta. Cada una tiene su control sembrado en
// `cajon-menu.spec.ts`: una medida que no puede fallar no prueba nada.
import type { Page } from "@playwright/test";

export type Pulsacion = { numero: number; tecla: string; donde: string };

/**
 * Pulsa la tecla `veces` veces y devuelve cada pulsación tras la cual el foco no está dentro del
 * elemento que cumple `selector` (el diálogo): foco retenido es lista vacía.
 */
export async function pulsacionesQueSacanElFoco(
  page: Page,
  selector: string,
  tecla: "Tab" | "Shift+Tab",
  veces: number,
): Promise<Pulsacion[]> {
  const fuera: Pulsacion[] = [];
  for (let i = 1; i <= veces; i++) {
    await page.keyboard.press(tecla);
    const donde = await page.evaluate((s) => {
      const dentro = document.querySelector(s);
      const a = document.activeElement;
      if (dentro !== null && a !== null && dentro.contains(a)) return null;
      return a === null ? "nada" : `${a.tagName.toLowerCase()}${a.id ? `#${a.id}` : ""}`;
    }, selector);
    if (donde !== null) fuera.push({ numero: i, tecla, donde });
  }
  return fuera;
}

export type FocoEnLaVentana = {
  /** Elemento con el foco, descrito para el mensaje. */
  quien: string;
  enLaVentana: boolean;
  /** Lo que se ve en el centro del elemento es él mismo o algo suyo: nada lo tapa. */
  tapado: boolean;
};

/** Dónde está el elemento con el foco y si algo lo tapa (CA-027: 0 casos de foco oculto). */
export async function leerFocoEnLaVentana(page: Page): Promise<FocoEnLaVentana> {
  return page.evaluate(() => {
    const a = document.activeElement as HTMLElement | null;
    if (a === null || a === document.body)
      return { quien: "cuerpo", enLaVentana: false, tapado: true };
    const r = a.getBoundingClientRect();
    const enLaVentana =
      r.width > 0 &&
      r.height > 0 &&
      r.top >= 0 &&
      r.left >= 0 &&
      r.bottom <= innerHeight &&
      r.right <= innerWidth;
    const x = Math.min(Math.max(r.left + r.width / 2, 0), innerWidth - 1);
    const y = Math.min(Math.max(r.top + r.height / 2, 0), innerHeight - 1);
    const encima = document.elementFromPoint(x, y);
    const tapado = encima === null || !(a === encima || a.contains(encima));
    return { quien: `${a.tagName.toLowerCase()}${a.id ? `#${a.id}` : ""}`, enLaVentana, tapado };
  });
}

/** Contorno del elemento con el foco: debe verse (estilo distinto de «none» y grosor mayor que 0). */
export async function leerContornoDelFoco(
  page: Page,
): Promise<{ estilo: string; grosor: number; quien: string }> {
  return page.evaluate(() => {
    const a = document.activeElement as HTMLElement;
    const c = getComputedStyle(a);
    return {
      estilo: c.outlineStyle,
      grosor: parseFloat(c.outlineWidth),
      quien: a.tagName.toLowerCase(),
    };
  });
}

/** Objetivos de pulsación de lo que cumple `selector` que miden menos de `minimo` px por lado. */
export async function objetivosPequenos(
  page: Page,
  selector: string,
  minimo = 24,
): Promise<string[]> {
  return page.evaluate(
    ([s, m]) =>
      [...document.querySelectorAll(s as string)]
        .map((e) => {
          const r = e.getBoundingClientRect();
          return { e, ancho: r.width, alto: r.height };
        })
        .filter(({ ancho, alto }) => ancho < (m as number) || alto < (m as number))
        .map(
          ({ e, ancho, alto }) =>
            `${e.tagName.toLowerCase()} «${(e.textContent ?? e.getAttribute("aria-label") ?? "").trim().slice(0, 20)}» ${Math.round(ancho)}x${Math.round(alto)}`,
        ),
    [selector, minimo] as const,
  );
}

/**
 * Enlaces y botones del menú lateral que reciben el foco con el tabulador estando la página
 * plegada: pulsa el tabulador `veces` veces y cuenta cuántas veces el foco cae dentro de un `nav`
 * del menú lateral. Con el menú plegado debe ser 0 (CA-003).
 */
export async function focoEnElMenuLateral(page: Page, veces: number): Promise<number> {
  let dentro = 0;
  for (let i = 0; i < veces; i++) {
    await page.keyboard.press("Tab");
    const esDelMenu = await page.evaluate(
      () => document.activeElement?.closest("nav[data-menu-lateral]") != null,
    );
    if (esDelMenu) dentro++;
  }
  return dentro;
}
