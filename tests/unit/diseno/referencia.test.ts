// T-008 (a) · PRUEBA-010 (formato; REQ-057, CA-042): la referencia de un error es una letra de
// origen, un guion y 10 caracteres al azar de un alfabeto sin letras dudosas. Se crea con el
// generador criptográfico, sin derivar de la hora, y `leerReferencia` solo devuelve lo que cumple
// el formato exacto; lo demás se descarta (artículo 3, cierre en fallo).
// La parte del registro de PRUEBA-010 (`registrarFallo`, campo `referencia`) es T-008 (c).
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  FORMATO_DE_REFERENCIA,
  crearReferencia,
  leerReferencia,
} from "../../../src/lib/errores/referencia";
import { ErrorDeAplicacion } from "../../../src/lib/plataforma/errores";

const FORMATO = /^[SN]-[0-9A-HJKMNP-TV-Z]{10}$/;
const TESTIGO = "CADENA-TESTIGO-REFERENCIA-020";

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe("crearReferencia", () => {
  it("el formato exportado es exactamente el del diseño", () => {
    expect(FORMATO_DE_REFERENCIA.source).toBe(FORMATO.source);
    expect(FORMATO_DE_REFERENCIA.flags).toBe("");
  });

  it("crea `S-` en el servidor y `N-` en el navegador, con el formato exacto", () => {
    const s = crearReferencia("servidor");
    const n = crearReferencia("navegador");
    expect(s).toMatch(FORMATO);
    expect(s.startsWith("S-")).toBe(true);
    expect(n).toMatch(FORMATO);
    expect(n.startsWith("N-")).toBe(true);
  });

  it("no se repite en 10.000 y cumple siempre el formato", () => {
    const vistas = new Set<string>();
    for (let i = 0; i < 10_000; i++) {
      const r = crearReferencia(i % 2 === 0 ? "servidor" : "navegador");
      expect(FORMATO.test(r)).toBe(true);
      vistas.add(r.slice(2));
    }
    expect(vistas.size).toBe(10_000);
  });

  it("usa los 32 símbolos del alfabeto", () => {
    const simbolos = new Set<string>();
    for (let i = 0; i < 2_000; i++)
      for (const c of crearReferencia("servidor").slice(2)) simbolos.add(c);
    expect(simbolos.size).toBe(32);
  });

  it("usa el generador criptográfico y no Math.random", () => {
    const azar = vi.spyOn(Math, "random");
    const cripto = vi.spyOn(globalThis.crypto, "getRandomValues");
    crearReferencia("servidor");
    expect(cripto).toHaveBeenCalled();
    expect(azar).not.toHaveBeenCalled();
  });

  it("no deriva de la hora: con el reloj parado, dos referencias distintas", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-11-20T10:00:00Z"));
    expect(crearReferencia("servidor")).not.toBe(crearReferencia("servidor"));
  });

  it("si el generador criptográfico falla, no crea nada (sin respaldo inseguro)", () => {
    vi.spyOn(globalThis.crypto, "getRandomValues").mockImplementation(() => {
      throw new Error("sin generador");
    });
    const azar = vi.spyOn(Math, "random");
    expect(() => crearReferencia("servidor")).toThrow();
    expect(azar).not.toHaveBeenCalled();
  });

  it("rechaza un origen fuera de la lista sin repetirlo", () => {
    for (const origen of ["S", "N", "", TESTIGO, undefined, null, 1]) {
      let error: unknown = null;
      try {
        crearReferencia(origen as never);
      } catch (e) {
        error = e;
      }
      expect(error).toBeInstanceOf(ErrorDeAplicacion);
      expect((error as ErrorDeAplicacion).codigo).toBe("entrada_invalida");
      expect((error as Error).message).not.toContain(TESTIGO);
    }
  });
});

describe("leerReferencia", () => {
  it("devuelve la referencia si cumple el formato exacto", () => {
    expect(leerReferencia("S-0123456789")).toBe("S-0123456789");
    expect(leerReferencia("N-ABCDEFGHJK")).toBe("N-ABCDEFGHJK");
    expect(leerReferencia("N-MNPQRSTVWZ")).toBe("N-MNPQRSTVWZ");
    const r = crearReferencia("navegador");
    expect(leerReferencia(r)).toBe(r);
  });

  it("descarta una cadena que contiene la cadena testigo, una vacía y casi correctas", () => {
    const casos: unknown[] = [
      TESTIGO,
      `S-${TESTIGO}`,
      `S-0123456789${TESTIGO}`,
      `${TESTIGO}S-0123456789`,
      "",
      "S-012345678", // 9
      "S-01234567890", // 11
      "s-0123456789", // origen en minúscula
      "S-abcdefghjk", // minúsculas
      "X-0123456789", // origen desconocido
      "S_0123456789", // separador
      "S0123456789A", // sin guion
      "S-012345678I", // letras dudosas
      "S-012345678L",
      "S-012345678O",
      "S-012345678U",
      " S-0123456789",
      "S-0123456789 ",
      "S-0123456789\n",
      "S-0123456789\u0000",
      "S-\uFF10123456789", // cifra de ancho completo
      "S-0123456789\nS-0123456789",
    ];
    for (const valor of casos) expect(leerReferencia(valor)).toBeNull();
  });

  it("descarta lo que no es una cadena", () => {
    const valores: unknown[] = [
      undefined,
      null,
      0,
      123456789012,
      true,
      ["S-0123456789"],
      { referencia: "S-0123456789" },
      { toString: () => "S-0123456789" },
      new String("S-0123456789"),
      Symbol("S-0123456789"),
    ];
    for (const valor of valores) expect(leerReferencia(valor)).toBeNull();
  });
});

describe("referencia.ts se puede importar desde cualquier sitio", () => {
  it("solo importa el error de la aplicación (ni node:, ni paquetes, ni más de src/lib/)", () => {
    const fuente = readFileSync(
      resolve(import.meta.dirname, "..", "..", "..", "src", "lib", "errores", "referencia.ts"),
      "utf8",
    );
    const importaciones = [...fuente.matchAll(/from\s+["']([^"']+)["']/g)].map((m) => m[1]);
    expect(importaciones).toEqual(["../plataforma/errores"]);
    expect(fuente.match(/\bimport\b/g)?.length).toBe(1);
    expect(fuente).not.toMatch(/\brequire\s*\(/);
  });
});
