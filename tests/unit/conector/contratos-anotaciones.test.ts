// T-115 (001): anotaciones de las herramientas del conector en los contratos (RD-016, art. 8).
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const HERRAMIENTAS = ["obtener-instrucciones", "confirmar-orden", "enviar-informe"] as const;
const TODOS = [...HERRAMIENTAS, "informe"] as const;

interface Contrato {
  description: string;
  "x-anotaciones": {
    readOnlyHint: boolean;
    destructiveHint: boolean;
    idempotentHint: boolean;
    openWorldHint: boolean;
  };
}

function leer(nombre: string): Contrato {
  return JSON.parse(
    readFileSync(new URL(`../../../contratos/${nombre}.schema.json`, import.meta.url), "utf8"),
  );
}

describe("contratos: anotaciones de las herramientas", () => {
  for (const nombre of HERRAMIENTAS) {
    it(`${nombre}: no es de solo lectura, ni destructiva, ni de mundo abierto`, () => {
      const a = leer(nombre)["x-anotaciones"];
      expect(a.readOnlyHint).toBe(false);
      expect(a.destructiveHint).toBe(false);
      expect(a.openWorldHint).toBe(false);
    });
  }

  it("obtener-instrucciones no es idempotente (abre una ejecución cada vez)", () => {
    expect(leer("obtener-instrucciones")["x-anotaciones"].idempotentHint).toBe(false);
  });

  for (const nombre of ["confirmar-orden", "enviar-informe"]) {
    it(`${nombre} es idempotente`, () => {
      expect(leer(nombre)["x-anotaciones"].idempotentHint).toBe(true);
    });
  }

  for (const nombre of TODOS) {
    it(`${nombre}: sin cuestión abierta`, () => {
      expect(leer(nombre)).not.toHaveProperty("x-cuestion-abierta");
    });
  }

  it("obtener-instrucciones: la orden no llega con «suspendida»", () => {
    const d = leer("obtener-instrucciones").description;
    expect(d).toContain("suspendida");
    expect(d).not.toContain("y la orden vigente");
  });

  it("obtener-instrucciones: la description conserva la frase exacta sobre la orden y «suspendida»", () => {
    const d = leer("obtener-instrucciones").description;
    expect(d).toContain(
      "La orden pendiente llega salvo con estado «suspendida», en el que no se entrega y sigue pendiente.",
    );
    expect(d).not.toMatch(/solo con (estado )?«activa»[^.]*orden/i);
  });

  it("informe: la description declara additionalProperties: false y que el servidor descarta y cuenta lo ajeno", () => {
    const d = leer("informe").description;
    expect(d).toContain("additionalProperties: false");
    expect(d).toContain("el servidor descarta cualquier campo que no figure aquí");
    expect(d).toContain("solo cuenta cuántos eran");
  });
});
