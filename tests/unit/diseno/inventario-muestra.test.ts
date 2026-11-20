// 020 T-005 · inventario de la muestra y su índice (diseño, «Muestra de componentes»; REQ-061,
// REQ-084; CA-046). `src/app/muestra/inventario.ts` es la lista cerrada de lo que la muestra
// enseña: de ella salen el índice, las rutas y la lista que recorren las pruebas en navegador.
// Aquí solo se comprueba su forma y que el índice sale de ella; que coincida con el inventario
// completo del diseño lo comprueba PRUEBA-008 cuando T-016 (i) lo cierre.
import { renderToStaticMarkup } from "react-dom/server";
import type { ReactElement } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  buscarEstado,
  INVENTARIO,
  rutaDeEstado,
  type EntradaDeInventario,
} from "../../../src/app/muestra/inventario";

vi.setConfig({ testTimeout: 60_000 });

const estado = vi.hoisted(() => ({ host: "localhost:3000" as string | null }));
vi.mock("next/headers", () => ({
  headers: async () => ({ get: (n: string) => (n.toLowerCase() === "host" ? estado.host : null) }),
}));

afterEach(() => {
  vi.unstubAllEnvs();
  estado.host = "localhost:3000";
});

const CLAVE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

describe("inventario de la muestra · forma", () => {
  it("tiene al menos la primera entrada: el índice, en /muestra", () => {
    const [primera] = INVENTARIO;
    expect(primera).toMatchObject({ tipo: "pagina", clave: "indice", ruta: "/muestra" });
  });

  it("claves en minúscula con guiones, sin repetir, y cada entrada con al menos un estado", () => {
    const claves = INVENTARIO.map((e) => e.clave);
    expect(new Set(claves).size).toBe(claves.length);
    for (const e of INVENTARIO) {
      expect(e.clave).toMatch(CLAVE);
      expect(e.nombre.trim()).not.toBe("");
      expect(e.estados.length).toBeGreaterThan(0);
      const estados = e.estados.map((s) => s.clave);
      expect(new Set(estados).size).toBe(estados.length);
      for (const s of e.estados) {
        expect(s.clave).toMatch(CLAVE);
        expect(s.nombre.trim()).not.toBe("");
      }
    }
  });

  it("toda ruta empieza por /muestra y no repite", () => {
    const rutas = INVENTARIO.flatMap((e) => e.estados.map((s) => rutaDeEstado(e, s.clave)));
    expect(new Set(rutas).size).toBe(rutas.length);
    for (const r of rutas) expect(r === "/muestra" || r.startsWith("/muestra/")).toBe(true);
  });

  it("la ruta de un componente es /muestra/componentes/<componente>/<estado>", () => {
    const ficticio: EntradaDeInventario = {
      tipo: "componente",
      clave: "boton",
      nombre: "Botón",
      estados: [{ clave: "primario", nombre: "Primario" }],
    };
    expect(rutaDeEstado(ficticio, "primario")).toBe("/muestra/componentes/boton/primario");
  });

  it("está congelado: no se puede añadir ni cambiar nada en ejecución", () => {
    expect(Object.isFrozen(INVENTARIO)).toBe(true);
    for (const e of INVENTARIO) {
      expect(Object.isFrozen(e)).toBe(true);
      expect(Object.isFrozen(e.estados)).toBe(true);
    }
  });
});

describe("inventario de la muestra · buscarEstado (lo que no está, no existe)", () => {
  it("encuentra el índice", () => {
    expect(buscarEstado("indice", "unico")?.entrada.clave).toBe("indice");
  });

  it.each([
    ["indice", "otro"],
    ["otro", "unico"],
    ["INDICE", "unico"],
    ["indice ", "unico"],
    ["", ""],
    ["__proto__", "unico"],
    ["constructor", "unico"],
    ["toString", "unico"],
    ["indice", "__proto__"],
  ])("(%j, %j): no existe", (componente, estadoPedido) => {
    expect(buscarEstado(componente, estadoPedido)).toBeUndefined();
  });
});

describe("índice de la muestra (page.muestra.tsx)", () => {
  async function pintar(): Promise<string> {
    vi.resetModules();
    const m = (await import("../../../src/app/muestra/page.muestra")) as {
      default: () => Promise<ReactElement>;
    };
    return renderToStaticMarkup(await m.default());
  }

  it("con acceso, sale del inventario: una entrada por cada elemento, en español", async () => {
    vi.stubEnv("ENTORNO", "preproduccion");
    const html = await pintar();
    expect(html).toContain("<h1");
    for (const e of INVENTARIO) {
      expect(html).toContain(e.nombre);
      for (const s of e.estados) expect(html).toContain(`href="${rutaDeEstado(e, s.clave)}"`);
    }
  });

  it("no pinta el nombre de servidor ni el entorno", async () => {
    vi.stubEnv("ENTORNO", "preproduccion");
    estado.host = "127.0.0.1:3000";
    const html = await pintar();
    expect(html).not.toContain("127.0.0.1");
    expect(html).not.toContain("preproduccion");
  });

  it("sin acceso, responde como recurso inexistente y no pinta nada", async () => {
    vi.stubEnv("ENTORNO", "preproduccion");
    estado.host = "desconocido.invalid";
    await expect(pintar()).rejects.toMatchObject({ digest: "NEXT_HTTP_ERROR_FALLBACK;404" });
  });
});
