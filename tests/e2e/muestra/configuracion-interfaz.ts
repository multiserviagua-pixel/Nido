// Configuración de las pruebas de interfaz y ÚNICA llamada a `axe` (diseño 020, «Protección de lo
// que decide el resultado»; REQ-062; PRUEBA-025, PRUEBA-026, PRUEBA-036). Es uno de los cinco
// archivos reservados (A-12): un cambio aquí solo entra con el «sí» expreso del responsable.
// Es el único archivo que importa `@axe-core/playwright`. La función no recibe ningún parámetro
// que permita excluir una regla, un elemento ni un resultado: lo que `axe` encuentra, falla.
import AxeBuilder from "@axe-core/playwright";
import type { Page } from "@playwright/test";

/** Reglas de nivel A y AA de WCAG 2.0, 2.1 y 2.2 (PRUEBA-025). Ninguna se retira. */
export const ETIQUETAS_DE_AXE = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] as const;

/** Anchos del recorrido de `axe` (PRUEBA-025). */
export const ANCHOS_DE_AXE = [320, 1280] as const;

/** Los dos temas del sistema; se emulan con `prefers-color-scheme`. */
export const TEMAS = ["light", "dark"] as const;
export type TemaDePrueba = (typeof TEMAS)[number];

/** Alto de ventana de las pruebas, salvo que la prueba diga otro. */
export const ALTO_POR_DEFECTO = 800;

export type PorRevisar = { regla: string; nodos: number };

/**
 * Recorre la página abierta con `axe` y falla si hay una sola infracción. Lo que `axe` deja «por
 * revisar» se devuelve para listarlo en la revisión manual: no cuenta como superado.
 */
export async function comprobarAccesibilidad(page: Page): Promise<PorRevisar[]> {
  const resultado = await new AxeBuilder({ page }).withTags([...ETIQUETAS_DE_AXE]).analyze();
  if (resultado.violations.length > 0) {
    const detalle = resultado.violations
      .map((v) => `${v.id} (${v.impact ?? "sin impacto"}, ${v.nodes.length} nodos): ${v.help}`)
      .join("\n");
    throw new Error(`axe: ${resultado.violations.length} infracciones\n${detalle}`);
  }
  return resultado.incomplete.map((r) => ({ regla: r.id, nodos: r.nodes.length }));
}
