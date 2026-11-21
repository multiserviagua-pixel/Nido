// Recorrido de pares de color de la página abierta (PRUEBA-022). Corre dentro del navegador: toma
// el color calculado de cada texto, de cada borde de control y de cada contorno de foco, más el
// del fondo opaco o degradado más cercano, los traduce a papeles de `valores.css` y devuelve lo
// que no esté declarado en `combinaciones.ts`. Lo que no se puede traducir también se devuelve:
// cierra en fallo, no lo da por bueno.
//
// LÍMITES CONOCIDOS (pendientes antes de los gráficos, T-009 (f) y T-032/T-033): no mide el
// `fill` ni el `stroke` de SVG (los gráficos), no tiene en cuenta `opacity` del elemento ni de sus
// ascendientes, y el fondo se busca solo entre ascendientes: un fondo de un hermano posicionado
// debajo del texto (capas, `position:absolute`) no se ve. Tampoco mide imágenes de fondo que no
// sean degradados. Hasta entonces, un par así no se comprueba aquí y queda anotado como no
// ejecutado en la evidencia de T-009.
import type { Page } from "@playwright/test";

export type ParSinDeclarar = {
  /** Qué se midió: texto, borde de control o foco. */
  que: "texto" | "borde" | "foco";
  /** Elemento y, si es texto, sus primeras letras (los datos de la muestra son ficticios). */
  donde: string;
  delante: string;
  detras: string;
  motivo: string;
};

export type ResultadoDePares = {
  /** Cuántos pares se midieron, para que una página sin nada que medir no pase en vacío. */
  medidos: number;
  sinDeclarar: ParSinDeclarar[];
};

export async function recorrerPares(
  page: Page,
  papeles: string[],
  declarados: string[],
): Promise<ResultadoDePares> {
  return page.evaluate(
    ({ papeles, declarados }) => {
      const declaradosSet = new Set(declarados);
      // 1. Cada papel, tal como lo calcula el navegador en este tema.
      const sonda = document.createElement("div");
      sonda.style.cssText = "position:absolute;visibility:hidden;pointer-events:none";
      document.body.appendChild(sonda);
      const valorDe = (papel: string): string => {
        sonda.style.cssText = "position:absolute;visibility:hidden;pointer-events:none";
        if (papel.startsWith("--degradado")) {
          sonda.style.backgroundImage = `var(${papel})`;
          return getComputedStyle(sonda).backgroundImage;
        }
        sonda.style.color = `var(${papel})`;
        return getComputedStyle(sonda).color;
      };
      const papelesPorValor = new Map<string, string[]>();
      for (const papel of papeles) {
        const v = valorDe(papel);
        papelesPorValor.set(v, [...(papelesPorValor.get(v) ?? []), papel]);
      }
      sonda.remove();

      const nombre = (e: Element): string => e.tagName.toLowerCase() + (e.id ? `#${e.id}` : "");

      // 2. El fondo opaco o degradado más cercano, empezando por `desde`.
      const fondoDe = (desde: Element | null): string => {
        for (let e = desde; e !== null; e = e.parentElement) {
          const s = getComputedStyle(e);
          if (s.backgroundImage.includes("gradient")) return s.backgroundImage;
          const c = s.backgroundColor;
          if (c !== "rgba(0, 0, 0, 0)" && c !== "transparent") {
            return /^rgba\(.*,\s*(0?\.\d+|0)\)$/.test(c) ? `translúcido:${c}` : c;
          }
        }
        return "sin-fondo";
      };

      const sinDeclarar: ParSinDeclarar[] = [];
      let medidos = 0;
      const comprobar = (
        que: ParSinDeclarar["que"],
        donde: string,
        delante: string,
        detras: string,
        papelesDelante: string[],
      ): void => {
        medidos++;
        const traseros = papelesPorValor.get(detras) ?? [];
        if (papelesDelante.length === 0) {
          sinDeclarar.push({
            que,
            donde,
            delante,
            detras,
            motivo: "color de delante que no es un papel",
          });
        } else if (traseros.length === 0) {
          sinDeclarar.push({ que, donde, delante, detras, motivo: "fondo que no es un papel" });
        } else if (
          !papelesDelante.some((d) => traseros.some((t) => declaradosSet.has(`${d}|${t}`)))
        ) {
          sinDeclarar.push({
            que,
            donde,
            delante: papelesDelante.join(" o "),
            detras: traseros.join(" o "),
            motivo: "par no declarado",
          });
        }
      };

      const visible = (e: Element): boolean => {
        const r = e.getBoundingClientRect();
        const s = getComputedStyle(e);
        return r.width > 0 && r.height > 0 && s.visibility !== "hidden" && s.display !== "none";
      };

      // 3. Texto.
      for (const e of document.body.querySelectorAll("*")) {
        if (!visible(e)) continue;
        const conTexto = [...e.childNodes].some(
          (n) => n.nodeType === 3 && (n.textContent ?? "").trim() !== "",
        );
        if (!conTexto) continue;
        const fg = getComputedStyle(e).color;
        const muestra = [...e.childNodes]
          .filter((n) => n.nodeType === 3)
          .map((n) => (n.textContent ?? "").trim())
          .join(" ")
          .slice(0, 24);
        comprobar(
          "texto",
          `${nombre(e)} «${muestra}»`,
          fg,
          fondoDe(e),
          papelesPorValor.get(fg) ?? [],
        );
      }

      // 4. Borde de los controles de formulario, sobre el fondo de quien los contiene.
      for (const e of document.querySelectorAll('input:not([type="hidden"]), select, textarea')) {
        if (!visible(e)) continue;
        const borde = getComputedStyle(e).borderTopColor;
        comprobar(
          "borde",
          nombre(e),
          borde,
          fondoDe(e.parentElement),
          papelesPorValor.get(borde) ?? [],
        );
      }

      // 5. Contorno de foco de cada elemento que lo recibe, sobre el fondo de quien lo contiene.
      const enfocables = document.querySelectorAll(
        'a[href], button, input:not([type="hidden"]), select, textarea, summary, [tabindex]:not([tabindex="-1"])',
      );
      for (const e of enfocables) {
        if (!visible(e)) continue;
        (e as HTMLElement).focus({ focusVisible: true } as FocusOptions);
        const s = getComputedStyle(e);
        const contorno =
          s.outlineStyle !== "none" && parseFloat(s.outlineWidth) > 0 ? s.outlineColor : "";
        if (contorno === "") {
          sinDeclarar.push({
            que: "foco",
            donde: nombre(e),
            delante: "ninguno",
            detras: "",
            motivo: "sin contorno de foco",
          });
          medidos++;
        } else {
          comprobar(
            "foco",
            nombre(e),
            contorno,
            fondoDe(e.parentElement),
            papelesPorValor.get(contorno) ?? [],
          );
        }
        (e as HTMLElement).blur();
      }
      return { medidos, sinDeclarar };
    },
    { papeles, declarados },
  );
}
