// T-007 (b) · PRUEBA-001 (números) y PRUEBA-003 (variaciones y lectura de cifras): miles con
// punto también en cuatro cifras, coma decimal, porcentaje con espacio que no se parte, signo
// menos propio (U+2212), variación sin porcentaje con el periodo anterior a cero y «Sin datos»
// donde no hay un valor utilizable. Casos de CA-037, CA-039, CA-040 y CA-008.
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { calcularVariacion } from "../../../src/components/formato/variacion";
import {
  formatearCifra,
  formatearNumero,
  formatearPorcentaje,
  leerCifra,
} from "../../../src/components/formato/numeros";

const MENOS = "−";
const NBSP = " ";

describe("PRUEBA-001 · formatearNumero", () => {
  it("miles con punto, también en cuatro cifras (CA-037)", () => {
    expect(formatearNumero(0)).toBe("0");
    expect(formatearNumero(7)).toBe("7");
    expect(formatearNumero(999)).toBe("999");
    expect(formatearNumero(1000)).toBe("1.000");
    expect(formatearNumero(1234)).toBe("1.234");
    expect(formatearNumero(12345)).toBe("12.345");
    expect(formatearNumero(1234567)).toBe("1.234.567");
    expect(formatearNumero(999999999)).toBe("999.999.999");
  });

  it("coma decimal y decimales fijos", () => {
    expect(formatearNumero(0.5, 1)).toBe("0,5");
    expect(formatearNumero(28.4, 1)).toBe("28,4");
    expect(formatearNumero(1234.5, 2)).toBe("1.234,50");
    expect(formatearNumero(28, 1)).toBe("28,0");
  });

  it("redondea como se espera de un decimal, no como un binario", () => {
    expect(formatearNumero(1.005, 2)).toBe("1,01");
    expect(formatearNumero(2.5)).toBe("3");
    expect(formatearNumero(0.4)).toBe("0");
    expect(formatearNumero(999.9996, 3)).toBe("1.000,000");
  });

  it("los negativos llevan el signo menos propio y un cero redondeado no lleva signo", () => {
    expect(formatearNumero(-1234)).toBe(`${MENOS}1.234`);
    expect(formatearNumero(-0.5, 1)).toBe(`${MENOS}0,5`);
    expect(formatearNumero(-0.04, 1)).toBe("0,0");
    expect(formatearNumero(-0)).toBe("0");
  });

  it("decimales fuera de rango o que no son enteros se acotan en lugar de fallar", () => {
    expect(formatearNumero(1234.5678, -3)).toBe("1.235");
    expect(formatearNumero(1234.5678, 2.9)).toBe("1.234,57");
    expect(formatearNumero(1.5, 99)).toBe("1,500000");
    expect(formatearNumero(1.5, Number.NaN)).toBe("2");
  });

  it("lo que no es un número finito y razonable es «Sin datos», nunca un valor en bruto", () => {
    for (const valor of [
      Number.NaN,
      Number.POSITIVE_INFINITY,
      Number.NEGATIVE_INFINITY,
      1e21,
      1e15,
      "12",
      null,
      undefined,
    ]) {
      expect(formatearNumero(valor as number)).toBe("Sin datos");
    }
  });

  it("no usa Intl.NumberFormat ni toLocaleString", () => {
    const codigo = readFileSync("src/components/formato/numeros.ts", "utf8")
      .split("\n")
      .filter((linea) => !linea.trim().startsWith("//") && !linea.trim().startsWith("*"))
      .join("\n");
    expect(codigo).not.toMatch(/Intl\.NumberFormat|toLocaleString/);
  });
});

describe("PRUEBA-001 · formatearPorcentaje", () => {
  it("número, espacio que no se parte y «%» (CA-037)", () => {
    expect(formatearPorcentaje(28.4)).toBe(`28,4${NBSP}%`);
    expect(formatearPorcentaje(28.4)).not.toBe("28,4 %");
    expect(formatearPorcentaje(0, 0)).toBe(`0${NBSP}%`);
    expect(formatearPorcentaje(1234.5, 1)).toBe(`1.234,5${NBSP}%`);
    expect(formatearPorcentaje(Number.NaN)).toBe("Sin datos");
  });
});

describe("PRUEBA-003 · calcularVariacion", () => {
  it("positiva: porcentaje con «+»", () => {
    expect(calcularVariacion(112.5, 100, true)).toMatchObject({
      tipo: "positiva",
      texto: `+12,5${NBSP}%`,
      sentido: "sube",
      palabra: null,
    });
  });

  it("negativa: porcentaje con el signo menos (U+2212)", () => {
    expect(calcularVariacion(90, 100, true)).toMatchObject({
      tipo: "negativa",
      texto: `${MENOS}10,0${NBSP}%`,
      sentido: "baja",
    });
    expect(calcularVariacion(0, 5, true)).toMatchObject({
      tipo: "negativa",
      texto: `${MENOS}100,0${NBSP}%`,
    });
  });

  it("nula: «0 %» con «Sin cambios»", () => {
    expect(calcularVariacion(100, 100, true)).toMatchObject({
      tipo: "nula",
      texto: `0${NBSP}%`,
      sentido: "igual",
      palabra: "Sin cambios",
    });
    expect(calcularVariacion(0, 0, true)).toMatchObject({ tipo: "nula", palabra: "Sin cambios" });
  });

  it("anterior igual a cero: diferencia absoluta con signo y sin porcentaje (CA-008)", () => {
    const sube = calcularVariacion(50, 0, true);
    expect(sube).toMatchObject({ tipo: "anterior_cero", texto: "+50", sentido: "sube" });
    expect(sube.texto).not.toContain("%");
    expect(calcularVariacion(-5, 0, true)).toMatchObject({
      tipo: "anterior_cero",
      texto: `${MENOS}5`,
      sentido: "baja",
    });
    expect(calcularVariacion(2.5, 0, true, { decimales: 1 }).texto).toBe("+2,5");
    expect(calcularVariacion(1234, 0, true).texto).toBe("+1.234");
  });

  it("sin periodo anterior completo: «Sin datos para comparar» (CA-040)", () => {
    for (const r of [
      calcularVariacion(10, 5, false),
      calcularVariacion(10, null, true),
      calcularVariacion(10, undefined, true),
      calcularVariacion(10, Number.NaN, true),
      calcularVariacion(10, "5", true),
      calcularVariacion(null, 5, true),
      calcularVariacion(Number.POSITIVE_INFINITY, 5, true),
    ]) {
      expect(r).toMatchObject({
        tipo: "sin_comparacion",
        texto: "Sin datos para comparar",
        sentido: null,
      });
    }
    // «Completo» solo vale si es `true`: cualquier otra cosa es no completo (artículo 3).
    expect(calcularVariacion(10, 5, "true" as unknown as boolean).tipo).toBe("sin_comparacion");
    expect(calcularVariacion(10, 5, 1 as unknown as boolean).tipo).toBe("sin_comparacion");
  });

  it("una variación minúscula conserva su signo y su sentido, no se hace pasar por nula", () => {
    expect(calcularVariacion(100.01, 100, true)).toMatchObject({
      tipo: "positiva",
      texto: `+0,0${NBSP}%`,
      sentido: "sube",
    });
    expect(calcularVariacion(99.99, 100, true)).toMatchObject({
      tipo: "negativa",
      texto: `${MENOS}0,0${NBSP}%`,
      sentido: "baja",
    });
  });

  it("con un periodo anterior negativo el signo sigue la dirección real", () => {
    expect(calcularVariacion(-50, -100, true)).toMatchObject({
      tipo: "positiva",
      texto: `+50,0${NBSP}%`,
    });
  });
});

describe("PRUEBA-003 · leerCifra", () => {
  it("cero es cero y un número válido se devuelve tal cual (CA-039)", () => {
    expect(leerCifra(0)).toBe(0);
    expect(leerCifra(5)).toBe(5);
    expect(leerCifra(999999999)).toBe(999999999);
    expect(leerCifra(0.5)).toBe(0.5);
  });

  it("ausente, no numérico, no finito o por debajo del mínimo: «ausente»", () => {
    for (const valor of [
      undefined,
      null,
      "",
      "12",
      "abc",
      Number.NaN,
      Number.POSITIVE_INFINITY,
      Number.NEGATIVE_INFINITY,
      -1,
      true,
      false,
      {},
      [],
      [5],
      10n,
      () => 3,
    ]) {
      expect(leerCifra(valor)).toBe("ausente");
    }
  });

  it("el mínimo por defecto es cero y se puede cambiar", () => {
    expect(leerCifra(-1)).toBe("ausente");
    expect(leerCifra(-1, { minimo: Number.NEGATIVE_INFINITY })).toBe(-1);
    expect(leerCifra(-1, { minimo: -5 })).toBe(-1);
    expect(leerCifra(3, { minimo: 5 })).toBe("ausente");
    expect(leerCifra(5, { minimo: 5 })).toBe(5);
  });
});

describe("PRUEBA-003 · formatearCifra (texto visible y accesible)", () => {
  it("un valor se ve formateado; cero se ve «0»", () => {
    expect(formatearCifra(1234)).toEqual({
      ausente: false,
      texto: "1.234",
      textoAccesible: "1.234",
    });
    expect(formatearCifra(0).texto).toBe("0");
    expect(formatearCifra(0.5, { decimales: 1 }).texto).toBe("0,5");
  });

  it("lo que no se puede leer se ve «Sin datos» con ese mismo texto accesible (CA-039)", () => {
    for (const valor of [undefined, null, -3, "7", Number.NaN, Number.POSITIVE_INFINITY, {}]) {
      expect(formatearCifra(valor)).toEqual({
        ausente: true,
        texto: "Sin datos",
        textoAccesible: "Sin datos",
      });
    }
    expect(formatearCifra(2, { minimo: 3 }).texto).toBe("Sin datos");
  });
});
