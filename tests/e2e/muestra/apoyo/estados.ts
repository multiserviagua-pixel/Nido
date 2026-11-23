// Lista de lo que recorren las pruebas en navegador: sale de `m/inventario.ts` (REQ-061, CA-046),
// no de una lista aparte. Lo que no está en el inventario no se prueba, y lo que se añade al
// inventario se prueba sin tocar nada aquí (tareas.md, «Prueba primero»).
import { expect, type Page, type TestInfo } from "@playwright/test";
import { INVENTARIO, rutaDeEstado } from "../../../../src/app/muestra/inventario";

export type EstadoDePrueba = {
  /** Clave de la entrada del inventario. */
  entrada: string;
  tipo: "pagina" | "componente";
  estado: string;
  ruta: string;
  /** Texto para el nombre de la prueba: `entrada/estado`. */
  etiqueta: string;
};

export const ESTADOS: readonly EstadoDePrueba[] = INVENTARIO.flatMap((e) =>
  e.estados.map((s) => ({
    entrada: e.clave,
    tipo: e.tipo,
    estado: s.clave,
    ruta: rutaDeEstado(e, s.clave),
    etiqueta: `${e.clave}/${s.clave}`,
  })),
);

/** Estados de las entradas cuya clave cumple el patrón (p. ej. el armazón, el diálogo). */
export function estadosDe(clave: RegExp): readonly EstadoDePrueba[] {
  return ESTADOS.filter((e) => clave.test(e.entrada));
}

/** Abre un estado: responde 200 y pinta el encabezado principal. */
export async function abrirEstado(page: Page, estado: EstadoDePrueba): Promise<void> {
  const respuesta = await page.goto(estado.ruta);
  expect(respuesta?.status(), `código de ${estado.ruta}`).toBe(200);
  await expect(page.locator("h1").first()).toBeVisible();
  await esperarDialogoSiLoHay(page, estado);
}

/** Entradas del inventario cuyas páginas se abren con un diálogo de alerta ya abierto. */
const ENTRADAS_CON_DIALOGO_ABIERTO: readonly string[] = ["dialogo-confirmacion"];

/**
 * El diálogo abierto al cargar lo pinta Radix (Portal) después de hidratar, no en el HTML del
 * servidor: si la prueba decide o mide sin esperarlo, ve una página distinta según el instante.
 * Se decide por la entrada del inventario, no por un conteo instantáneo.
 */
export async function esperarDialogoSiLoHay(page: Page, estado: EstadoDePrueba): Promise<void> {
  if (ENTRADAS_CON_DIALOGO_ABIERTO.includes(estado.entrada)) {
    await expect(page.getByRole("alertdialog")).toBeVisible();
  }
}

/**
 * Anota en el informe, sin fingir que se comprobó, lo que una prueba generada no pudo recorrer
 * porque el inventario aún no tiene la entrada (artículo 13). No salta nada: la prueba que lo
 * escribe sí se ejecuta, y la anotación lleva el motivo y qué tarea lo activa.
 */
export function anotarPendiente(info: TestInfo, que: string, activa: string): void {
  info.annotations.push({ type: "no ejecutada", description: `${que}. Se activa con ${activa}.` });
}
