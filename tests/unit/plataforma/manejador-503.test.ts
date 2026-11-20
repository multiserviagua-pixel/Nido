// T-105 (h) (001): condición abierta de T-104. En la capa HTTP (manejador.ts), un fallo de
// configuración del conector o un almacén caído dan 503 y no 500; todo lo demás sigue en 500 (art. 3).
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ErrorDeAplicacion } from "../../../src/lib/plataforma/errores";
import { manejador } from "../../../src/lib/plataforma/manejador";
import { CODIGOS, type Codigo } from "../../../src/lib/registro/codigos";

const MARCA = "TEXTO-CANARIO-123";
let salida: string[];

beforeEach(() => {
  salida = [];
  for (const metodo of ["log", "error", "warn", "info", "debug"] as const) {
    vi.spyOn(console, metodo).mockImplementation((...args: unknown[]) => {
      salida.push(args.map((a) => (typeof a === "string" ? a : JSON.stringify(a))).join(" "));
    });
  }
});
afterEach(() => vi.restoreAllMocks());

const peticion = () =>
  new Request(`http://localhost/x?q=${MARCA}`, { method: "POST", body: MARCA });

describe("manejador: 503 para configuración del conector y almacén caído", () => {
  for (const codigo of ["configuracion_conector_invalida", "almacen_no_disponible"] as const) {
    it(`${codigo}: 503, cuerpo fijo, no-store, solo el código en el registro`, async () => {
      const r = await manejador("/api/mcp", () => {
        throw new ErrorDeAplicacion(codigo);
      })(peticion());
      expect(r.status).toBe(503);
      expect(r.headers.get("cache-control")).toBe("no-store");
      expect(r.headers.get("content-type")).toBe("application/json");
      const texto = await r.text();
      expect(texto).toBe('{"estado":"error"}');
      expect(texto).not.toContain(MARCA);
      expect(salida.join("\n")).toContain(codigo);
      expect(salida.join("\n")).not.toContain(MARCA);
    });
  }

  it("cualquier otro código sigue en 500, y un error sin código también", async () => {
    const otros: Codigo[] = CODIGOS.filter(
      (c) => c !== "configuracion_conector_invalida" && c !== "almacen_no_disponible",
    );
    for (const codigo of otros) {
      const r = await manejador("/x", () => {
        throw new ErrorDeAplicacion(codigo);
      })(peticion());
      expect(r.status).toBe(500);
    }
    const r = await manejador("/x", () => {
      throw new Error(MARCA);
    })(peticion());
    expect(r.status).toBe(500);
    expect(await r.text()).not.toContain(MARCA);
  });
});
