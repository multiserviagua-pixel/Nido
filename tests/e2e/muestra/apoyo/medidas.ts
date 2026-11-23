// Medidas que toman las pruebas de PRUEBA-013, PRUEBA-020 y PRUEBA-021 sobre la página abierta.
// Cada función corre dentro del navegador y devuelve solo datos simples. Sus controles
// (`medidas.spec.ts`) las prueban contra páginas sembradas: una medida que no puede detectar nada
// no es una medida.
import type { Page } from "@playwright/test";

export type Desborde = {
  /** Ancho del contenido del documento menos el ancho de la ventana (>0: hay desplazamiento). */
  sobra: number;
  /** Elementos con texto que se salen por la derecha y no están en una región que se desplaza. */
  fuera: string[];
};

const nombreCorto = `(e) => e.tagName.toLowerCase() + (e.id ? "#" + e.id : "") + (e.getAttribute("role") ? "[" + e.getAttribute("role") + "]" : "")`;

/** Desplazamiento horizontal de la página (REQ-044). Las regiones desplazables propias se admiten. */
export async function medirDesborde(page: Page): Promise<Desborde> {
  return page.evaluate(`(() => {
    const nombre = ${nombreCorto};
    const ancho = document.documentElement.clientWidth;
    const sobra = Math.max(0, document.documentElement.scrollWidth - ancho);
    const enRegion = (e) => {
      for (let p = e.parentElement; p && p !== document.body; p = p.parentElement) {
        const o = getComputedStyle(p).overflowX;
        if (o === "auto" || o === "scroll") return true;
      }
      return false;
    };
    const fuera = [];
    for (const e of document.body.querySelectorAll("*")) {
      const r = e.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) continue;
      if (r.right > ancho + 1 && !enRegion(e)) fuera.push(nombre(e));
    }
    return { sobra, fuera: fuera.slice(0, 10) };
  })()`) as Promise<Desborde>;
}

/** Elementos cuyo texto queda recortado (overflow oculto con contenido que no cabe).
 * Única excepción (diseño 020, «Nombres largos»; REQ-065): el nombre de la cuenta dentro del botón
 * de la cuenta de la cabecera (`header button[aria-haspopup="dialog"] [data-nombre-acortable]`)
 * puede acortarse, y solo si el `aria-label` del botón contiene el nombre entero del `span` (el
 * nombre completo está en el nombre accesible y en el panel que abre; `cabecera.spec.ts` lo
 * comprueba). Cualquier otro recorte cuenta, también dentro de ese botón. */
export async function medirRecortes(page: Page): Promise<string[]> {
  return page.evaluate(`(() => {
    const nombre = ${nombreCorto};
    const recortados = [];
    for (const e of document.body.querySelectorAll("*")) {
      const s = getComputedStyle(e);
      const oculta = (v) => v === "hidden" || v === "clip";
      const tieneTexto = [...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim() !== "");
      if (!tieneTexto) continue;
      if (e.matches("[data-nombre-acortable]")) {
        const boton = e.closest('header button[aria-haspopup="dialog"]');
        const entero = e.textContent.trim();
        if (boton !== null && entero !== "" && (boton.getAttribute("aria-label") || "").includes(entero)) continue;
      }
      if (
        (oculta(s.overflowX) && e.scrollWidth > e.clientWidth + 1) ||
        (oculta(s.overflowY) && e.scrollHeight > e.clientHeight + 1) ||
        s.textOverflow === "ellipsis"
      ) {
        recortados.push(nombre(e));
      }
    }
    return recortados.slice(0, 10);
  })()`) as Promise<string[]>;
}

/** Pares de elementos con texto propio cuyas cajas se pisan (nombres largos sin solapes). */
export async function medirSolapes(page: Page): Promise<string[]> {
  return page.evaluate(`(() => {
    const nombre = ${nombreCorto};
    // Con un diálogo de alerta abierto (T-010 (j)) la página de detrás queda bajo el velo: solo se
    // miden los elementos del propio diálogo.
    const modal = document.querySelector('[role="alertdialog"]');
    const hojas = [...document.body.querySelectorAll("*")].filter(
      (e) =>
        (modal === null || modal.contains(e)) &&
        [...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim() !== "") &&
        e.getBoundingClientRect().width > 0 &&
        getComputedStyle(e).visibility !== "hidden",
    );
    const pares = [];
    for (let i = 0; i < hojas.length; i++) {
      for (let j = i + 1; j < hojas.length; j++) {
        const a = hojas[i];
        const b = hojas[j];
        if (a.contains(b) || b.contains(a)) continue;
        const ra = a.getBoundingClientRect();
        const rb = b.getBoundingClientRect();
        const x = Math.min(ra.right, rb.right) - Math.max(ra.left, rb.left);
        const y = Math.min(ra.bottom, rb.bottom) - Math.max(ra.top, rb.top);
        if (x > 1 && y > 1) pares.push(nombre(a) + " con " + nombre(b));
      }
    }
    return pares.slice(0, 10);
  })()`) as Promise<string[]>;
}

/** Texto de la norma 1.4.12 inyectado: interlineado 1,5, letras 0,12, palabras 0,16, párrafos 2. */
export async function inyectarEspaciadoDeTexto(page: Page): Promise<void> {
  await page.addStyleTag({
    content: `* { line-height: 1.5 !important; letter-spacing: 0.12em !important; word-spacing: 0.16em !important; }
p { margin-bottom: 2em !important; }`,
  });
}

/** Animaciones en curso con su ritmo: veces por segundo que se repiten (Infinity si no acaba). */
export async function medirAnimaciones(
  page: Page,
): Promise<Array<{ enCurso: boolean; repeticionesPorSegundo: number }>> {
  return page.evaluate(`(() =>
    document.getAnimations().map((a) => {
      const t = a.effect.getComputedTiming();
      const dur = typeof t.duration === "number" ? t.duration : 0;
      const repite = t.iterations > 1;
      return {
        enCurso: a.playState === "running",
        repeticionesPorSegundo: repite && dur > 0 ? 1000 / dur : 0,
      };
    }))()`) as Promise<Array<{ enCurso: boolean; repeticionesPorSegundo: number }>>;
}

/** Fondos con degradado calculado, uno por elemento (colores forzados: ninguno). */
export async function medirDegradados(page: Page): Promise<string[]> {
  return page.evaluate(`(() => {
    const nombre = ${nombreCorto};
    return [...document.querySelectorAll("body, body *")]
      .filter((e) => getComputedStyle(e).backgroundImage.includes("gradient"))
      .map(nombre)
      .slice(0, 10);
  })()`) as Promise<string[]>;
}

/**
 * Papeles de degradado (`--degradado-*`) que declaran las hojas de la página y los que, tal como
 * los calcula el navegador en `:root`, no valen `none`. En colores forzados Chromium ya quita por
 * su cuenta todo `background-image` calculado, así que `medirDegradados` no prueba nada allí: lo
 * que sí prueba que el sistema de diseño los restablece es que cada papel valga `none`.
 */
export async function medirPapelesDeDegradado(
  page: Page,
): Promise<{ papeles: string[]; sinRestablecer: string[] }> {
  return page.evaluate(`(() => {
    const nombres = new Set();
    const recorrer = (reglas) => {
      for (const r of reglas) {
        if (r.style) {
          for (const p of r.style) if (p.startsWith("--degradado-")) nombres.add(p);
        }
        if (r.cssRules) recorrer(r.cssRules);
      }
    };
    for (const hoja of document.styleSheets) {
      let reglas;
      try {
        reglas = hoja.cssRules;
      } catch {
        continue;
      }
      recorrer(reglas);
    }
    const estilo = getComputedStyle(document.documentElement);
    const papeles = [...nombres].sort();
    return {
      papeles,
      sinRestablecer: papeles.filter((p) => estilo.getPropertyValue(p).trim() !== "none"),
    };
  })()`) as Promise<{ papeles: string[]; sinRestablecer: string[] }>;
}

/** Controles que no dibujan borde (colores forzados: el borde tiene que estar). Las casillas y los
 * radios nativos quedan fuera porque los dibuja el navegador (T-016 (a)). */
export async function medirControlesSinBorde(page: Page): Promise<string[]> {
  return page.evaluate(`(() => {
    const nombre = ${nombreCorto};
    const selector = 'button, input:not([type="hidden"]), select, textarea, [role="button"], table, td, th';
    return [...document.querySelectorAll(selector)]
      .filter((e) => {
        const s = getComputedStyle(e);
        // Casilla o radio con el aspecto nativo: los dibuja el navegador con los colores del sistema
        // (T-016 (a)). Con «appearance: none» ya no los dibuja nadie y sí cuentan.
        if (e.matches('input[type="checkbox"], input[type="radio"]') && s.appearance !== "none") {
          return false;
        }
        const lados = ["Top", "Right", "Bottom", "Left"].map(
          (l) => s["border" + l + "Style"] !== "none" && parseFloat(s["border" + l + "Width"]) > 0,
        );
        return !lados.some(Boolean) && s.outlineStyle === "none";
      })
      .map(nombre)
      .slice(0, 10);
  })()`) as Promise<string[]>;
}

/** Tipos de letra de la página que ocultan el texto mientras cargan (`font-display: block` o ninguno). */
export async function medirFuentesQueOcultan(page: Page): Promise<string[]> {
  return page.evaluate(`(() => {
    const malas = [];
    for (const hoja of document.styleSheets) {
      let reglas;
      try {
        reglas = hoja.cssRules;
      } catch {
        continue;
      }
      for (const r of reglas) {
        if (r instanceof CSSFontFaceRule) {
          const d = r.style.getPropertyValue("font-display") || "auto";
          if (d !== "swap" && d !== "fallback" && d !== "optional") {
            malas.push(r.style.getPropertyValue("font-family") + " (" + d + ")");
          }
        }
      }
    }
    return malas;
  })()`) as Promise<string[]>;
}

/** Ancho de dos cifras con el estilo de cifras de la página (`data-cifra`). */
export async function medirAnchoDeCifras(
  page: Page,
  a: string,
  b: string,
): Promise<[number, number]> {
  return page.evaluate(
    ({ a, b }) => {
      const medir = (texto: string): number => {
        const e = document.createElement("span");
        e.setAttribute("data-cifra", "");
        e.style.cssText = "position:absolute;visibility:hidden;white-space:nowrap";
        e.textContent = texto;
        document.body.appendChild(e);
        const ancho = e.getBoundingClientRect().width;
        e.remove();
        return ancho;
      };
      return [medir(a), medir(b)] as [number, number];
    },
    { a, b },
  );
}

/** Valor de `font-variant-numeric` con el que se pintan las cifras de la página (`data-cifra`). */
export async function leerVarianteDeCifras(page: Page): Promise<string> {
  return page.evaluate(() => {
    const e = document.createElement("span");
    e.setAttribute("data-cifra", "");
    document.body.appendChild(e);
    const v = getComputedStyle(e).fontVariantNumeric;
    e.remove();
    return v;
  });
}

/** Cabecera `viewport` de la página: texto de su `content`, o vacío si no hay. */
export async function leerViewport(page: Page): Promise<string> {
  return page.evaluate(
    () => document.querySelector('meta[name="viewport"]')?.getAttribute("content") ?? "",
  );
}

/** Estado de lo que el usuario ha tocado: valores, expandidos, orden, abiertos. */
export async function fotoDelEstado(page: Page): Promise<Record<string, string>> {
  return page.evaluate(() => {
    const foto: Record<string, string> = {};
    document.querySelectorAll("input, textarea, select").forEach((e, i) => {
      foto[`valor-${i}`] = (e as HTMLInputElement).value;
    });
    document.querySelectorAll("[aria-expanded]").forEach((e, i) => {
      foto[`expandido-${i}`] = e.getAttribute("aria-expanded") ?? "";
    });
    document.querySelectorAll("[aria-sort]").forEach((e, i) => {
      foto[`orden-${i}`] = e.getAttribute("aria-sort") ?? "";
    });
    foto["abiertos"] = String(document.querySelectorAll("dialog[open], [role='dialog']").length);
    return foto;
  });
}
