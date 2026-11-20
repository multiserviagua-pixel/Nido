// T-104 (b): secretos.ts (diseño §Tokens). PRUEBA-012 (parte: mil pares sin parte común; misma sal,
// mismo par) y PRUEBA-019 (parte: sal sin secreto → 0 tokens). Valores compuestos en ejecución.
import { createHash, randomBytes } from "node:crypto";
import { describe, expect, it } from "vitest";
import { ErrorDeAplicacion } from "../../../src/lib/plataforma/errores";
import {
  coincideHuellaOperacion,
  derivarClaves,
  derivarPar,
  generarSal,
  huellaLigadura,
  huellaOrigen,
  huellaToken,
  iguales,
  nuevoToken,
} from "../../../src/lib/oauth/secretos";

const secretoNuevo = (): string => randomBytes(32).toString("base64url");
const RE_B64 = /^[A-Za-z0-9_-]{43}$/;
const cuerpo = (t: string): string => t.slice(6);

describe("secretos: claves derivadas (HKDF-SHA-256)", () => {
  it("cuatro claves de 32 bytes, distintas entre sí y deterministas", () => {
    const secreto = secretoNuevo();
    const a = derivarClaves(secreto);
    const b = derivarClaves(secreto);
    const claves = [a.guardado, a.derivacion, a.origen, a.ligadura];
    for (const k of claves) expect(k.length).toBe(32);
    expect(new Set(claves.map((k) => k.toString("hex"))).size).toBe(4);
    expect(a.guardado.equals(b.guardado)).toBe(true);
    expect(a.derivacion.equals(b.derivacion)).toBe(true);
    expect(a.origen.equals(b.origen)).toBe(true);
    expect(a.ligadura.equals(b.ligadura)).toBe(true);
  });

  it("otro secreto, otras claves", () => {
    const a = derivarClaves(secretoNuevo());
    const b = derivarClaves(secretoNuevo());
    expect(a.guardado.equals(b.guardado)).toBe(false);
    expect(a.derivacion.equals(b.derivacion)).toBe(false);
  });

  it("MAYOR-1: un secreto débil o mal formado no deriva nada (cierre en fallo)", () => {
    const debiles = [
      "",
      "a".repeat(31),
      "a".repeat(32),
      "a".repeat(43),
      "ab".repeat(30),
      "é".repeat(40),
      "una frase de cuarenta bytes con espacios y mas",
      secretoNuevo().slice(0, 42),
      `${secretoNuevo().slice(0, 42)}+`,
      `${secretoNuevo().slice(0, 42)}=`,
      secretoNuevo().repeat(4).slice(0, 129),
    ];
    for (const corto of debiles) {
      let error: unknown;
      try {
        derivarClaves(corto);
      } catch (e) {
        error = e;
      }
      expect(error).toBeInstanceOf(ErrorDeAplicacion);
      expect((error as ErrorDeAplicacion).codigo).toBe("configuracion_conector_invalida");
      expect(String(error)).not.toContain(corto === "" ? "\u0000" : corto);
    }
  });
});

describe("secretos: vectores fijos (MENOR-1)", () => {
  // Valores compuestos en ejecución. Cualquier cambio de algoritmo, etiqueta o separador rompe
  // estos vectores y, con ellos, los tokens ya emitidos.
  const secreto = Buffer.from(Array.from({ length: 32 }, (_, i) => i)).toString("base64url");
  const t = ["hia", "r", Buffer.alloc(32, 0x11).toString("base64url")].join("_");
  const sal = Buffer.alloc(16, 0x22).toString("base64url");
  const k = derivarClaves(secreto);

  it("claves derivadas", () => {
    expect(k.guardado.toString("hex")).toBe(
      "3cc197c2c8c1fa7856bb728799d0abb0bceff1b4d3902be3ff1d7fa5c739e7b8",
    );
    expect(k.derivacion.toString("hex")).toBe(
      "df344d09addf516390d05aae34e61843f87dc87b7ef9a53dbbce030630bf4c25",
    );
  });

  it("huellas de token, origen y ligadura", () => {
    expect(huellaToken(k, "renovacion", t)).toBe(
      "3fdf5f7e9f820da52d20944e14b63e8d17188bf67093af3f644c6383ec6dede6",
    );
    expect(huellaOrigen(k, "203.0.113.7")).toBe(
      "488f6a083c08686e1d7adb42aa69f6b9ab076dd770d0b03b5f861bb9f94ef17e",
    );
    expect(huellaLigadura(k, "state", "abc")).toBe(
      "39d3a93720a1e82d8efc2c7d860bb2bdc1231999e52aff15bf2cf83dbc0b1e82",
    );
  });

  it("par derivado", () => {
    const par = derivarPar(k, t, sal);
    expect(par.acceso).toBe(["hia", "a", "VqGoJjcycoAOzjvBqO6izYtganaTWYge7yoZ4eGkiWE"].join("_"));
    expect(par.renovacion).toBe(
      ["hia", "r", "FvymTp48HNKFlP4ib0FBFE2Q7m1rFvKCis0oyxre9U8"].join("_"),
    );
  });

  it("MENOR-2: un ámbito de ligadura fuera de la lista cierra en fallo", () => {
    for (const ambito of ["state", "activacion"]) {
      expect(huellaLigadura(k, ambito as "state", "abc")).toMatch(/^[0-9a-f]{64}$/);
    }
    for (const mal of ["cookie", "", "State", "TEXTO-CANARIO-123"]) {
      let error: unknown;
      try {
        huellaLigadura(k, mal as "state", "abc");
      } catch (e) {
        error = e;
      }
      expect(error).toBeInstanceOf(ErrorDeAplicacion);
      expect(JSON.stringify(error, Object.getOwnPropertyNames(error))).not.toContain(mal || "@@");
    }
  });
});

describe("secretos: tokens y huellas", () => {
  const claves = derivarClaves(secretoNuevo());

  it("nuevoToken: prefijo del tipo + 43 base64url (256 bits), no repetido", () => {
    const vistos = new Set<string>();
    for (let i = 0; i < 200; i++) {
      const a = nuevoToken("acceso");
      const r = nuevoToken("renovacion");
      expect(a.startsWith("hia_a_")).toBe(true);
      expect(r.startsWith("hia_r_")).toBe(true);
      expect(cuerpo(a)).toMatch(RE_B64);
      expect(cuerpo(r)).toMatch(RE_B64);
      vistos.add(a);
      vistos.add(r);
    }
    expect(vistos.size).toBe(400);
  });

  it("huellaToken: 64 hexadecimales, determinista, ligada al tipo y a la clave", () => {
    const t = nuevoToken("acceso");
    const h = huellaToken(claves, "acceso", t);
    expect(h).toMatch(/^[0-9a-f]{64}$/);
    expect(huellaToken(claves, "acceso", t)).toBe(h);
    expect(huellaToken(claves, "renovacion", t)).not.toBe(h);
    expect(huellaToken(claves, "codigo_autorizacion", t)).not.toBe(h);
    expect(huellaToken(derivarClaves(secretoNuevo()), "acceso", t)).not.toBe(h);
    expect(h).not.toContain(t);
  });

  it("huellaOrigen y huellaLigadura: hexadecimales, deterministas y de claves distintas", () => {
    const o = "203.0.113.7";
    expect(huellaOrigen(claves, o)).toMatch(/^[0-9a-f]{64}$/);
    expect(huellaOrigen(claves, o)).toBe(huellaOrigen(claves, o));
    expect(huellaOrigen(claves, o)).not.toBe(huellaOrigen(claves, "203.0.113.8"));
    expect(huellaLigadura(claves, "state", o)).toMatch(/^[0-9a-f]{64}$/);
    expect(huellaLigadura(claves, "state", o)).not.toBe(huellaOrigen(claves, o));
    expect(huellaLigadura(claves, "state", o)).not.toBe(huellaLigadura(claves, "activacion", o));
  });

  it("generarSal: 128 bits en 22 base64url, no repetida", () => {
    const sales = new Set(Array.from({ length: 200 }, () => generarSal()));
    expect(sales.size).toBe(200);
    for (const s of sales) expect(s).toMatch(/^[A-Za-z0-9_-]{22}$/);
  });
});

describe("secretos: par derivado (PRUEBA-012 y 019, partes)", () => {
  const claves = derivarClaves(secretoNuevo());

  it("misma sal y mismo token: mismo par, byte a byte", () => {
    const t = nuevoToken("renovacion");
    const sal = generarSal();
    const p1 = derivarPar(claves, t, sal);
    const p2 = derivarPar(claves, t, sal);
    expect(p2.acceso).toBe(p1.acceso);
    expect(p2.renovacion).toBe(p1.renovacion);
    expect(p1.acceso).toMatch(/^hia_a_[A-Za-z0-9_-]{43}$/);
    expect(p1.renovacion).toMatch(/^hia_r_[A-Za-z0-9_-]{43}$/);
  });

  it("otra sal u otro token: otro par", () => {
    const t = nuevoToken("renovacion");
    const p = derivarPar(claves, t, generarSal());
    expect(derivarPar(claves, t, generarSal()).acceso).not.toBe(p.acceso);
    expect(derivarPar(claves, nuevoToken("renovacion"), generarSal()).renovacion).not.toBe(
      p.renovacion,
    );
  });

  it("mil pares sin parte común entre acceso y renovación, ni con el token presentado", () => {
    const ventana = 10;
    const comparten = (a: string, b: string): boolean => {
      for (let i = 0; i + ventana <= a.length; i++) {
        if (b.includes(a.slice(i, i + ventana))) return true;
      }
      return false;
    };
    const vistos = new Set<string>();
    for (let i = 0; i < 1000; i++) {
      const t = nuevoToken("renovacion");
      const sal = generarSal();
      const { acceso, renovacion } = derivarPar(claves, t, sal);
      expect(acceso).not.toBe(renovacion);
      expect(comparten(cuerpo(acceso), cuerpo(renovacion)), `par ${i}`).toBe(false);
      expect(comparten(cuerpo(t), cuerpo(acceso))).toBe(false);
      expect(comparten(cuerpo(t), cuerpo(renovacion))).toBe(false);
      expect(`${acceso}${renovacion}`).not.toContain(sal);
      vistos.add(acceso);
      vistos.add(renovacion);
    }
    expect(vistos.size).toBe(2000);
  });

  it("la sal sin el secreto no da ningún token (PRUEBA-019, parte)", () => {
    const t = nuevoToken("renovacion");
    const sal = generarSal();
    const real = derivarPar(claves, t, sal);
    // Quien solo tiene la sal y la huella guardada no obtiene el par: con otro secreto sale otro.
    for (let i = 0; i < 20; i++) {
      const ajeno = derivarPar(derivarClaves(secretoNuevo()), t, sal);
      expect(ajeno.acceso).not.toBe(real.acceso);
      expect(ajeno.renovacion).not.toBe(real.renovacion);
    }
    // La sal no contiene ni deja ver los tokens ni sus huellas.
    for (const secreto of [real.acceso, real.renovacion, t]) {
      expect(sal).not.toContain(cuerpo(secreto));
      expect(huellaToken(claves, "acceso", secreto)).not.toContain(sal);
    }
    // Y el par no se puede recomponer con un hash simple de la sal y el token.
    const ingenuo = createHash("sha256").update(t).update(sal).digest("base64url");
    expect(cuerpo(real.acceso)).not.toBe(ingenuo);
    expect(cuerpo(real.renovacion)).not.toBe(ingenuo);
  });

  it("rechaza un token o una sal con mala forma sin eco del valor (cierre en fallo)", () => {
    const sal = generarSal();
    const mal = "TEXTO-CANARIO-123";
    const casos: [string, string][] = [
      [mal, sal],
      [nuevoToken("acceso"), sal],
      [nuevoToken("renovacion"), mal],
      [nuevoToken("renovacion"), ""],
    ];
    for (const [t, s] of casos) {
      let error: unknown;
      try {
        derivarPar(claves, t, s);
      } catch (e) {
        error = e;
      }
      expect(error).toBeInstanceOf(ErrorDeAplicacion);
      expect(String(error)).not.toContain(mal);
      expect(JSON.stringify(error, Object.getOwnPropertyNames(error))).not.toContain(mal);
    }
  });
});

describe("secretos: tiempo constante", () => {
  it("iguales compara cadenas de cualquier longitud sin lanzar", () => {
    expect(iguales("abc", "abc")).toBe(true);
    expect(iguales("abc", "abd")).toBe(false);
    expect(iguales("abc", "abcd")).toBe(false);
    expect(iguales("", "")).toBe(true);
    expect(iguales("é", "e")).toBe(false);
  });

  it("coincideHuellaOperacion: SHA-256 de la credencial contra la huella esperada", () => {
    const credencial = ["hia", "op", randomBytes(32).toString("base64url")].join("_");
    const esperada = createHash("sha256").update(credencial, "utf8").digest("hex");
    expect(coincideHuellaOperacion(credencial, esperada)).toBe(true);
    expect(coincideHuellaOperacion(`${credencial}x`, esperada)).toBe(false);
    expect(coincideHuellaOperacion(credencial, "0".repeat(64))).toBe(false);
  });

  it("coincideHuellaOperacion cierra en fallo con credencial o huella mal formadas", () => {
    const credencial = ["hia", "op", randomBytes(32).toString("base64url")].join("_");
    const esperada = createHash("sha256").update(credencial, "utf8").digest("hex");
    expect(coincideHuellaOperacion("", esperada)).toBe(false);
    expect(coincideHuellaOperacion(credencial, "")).toBe(false);
    expect(coincideHuellaOperacion(credencial, esperada.toUpperCase())).toBe(false);
    expect(coincideHuellaOperacion(credencial, esperada.slice(1))).toBe(false);
    // Una credencial sin la forma hia_op_ + 43 no se evalúa, aunque su huella coincida.
    const sinForma = "TEXTO-CANARIO-123";
    const huellaSinForma = createHash("sha256").update(sinForma, "utf8").digest("hex");
    expect(coincideHuellaOperacion(sinForma, huellaSinForma)).toBe(false);
  });
});
