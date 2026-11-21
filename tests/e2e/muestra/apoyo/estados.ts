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
}

/**
 * Anota en el informe, sin fingir que se comprobó, lo que una prueba generada no pudo recorrer
 * porque el inventario aún no tiene la entrada (artículo 13). No salta nada: la prueba que lo
 * escribe sí se ejecuta, y la anotación lleva el motivo y qué tarea lo activa.
 */
export function anotarPendiente(info: TestInfo, que: string, activa: string): void {
  info.annotations.push({ type: "no ejecutada", description: `${que}. Se activa con ${activa}.` });
}
