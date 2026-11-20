// T-104 (d): textos del prompt ficticio y del arranque local (PRUEBA-016 y 019, partes).
// Marca, final de línea, ni dirección de correo ni URL, y nada de lo que el prompt no puede pedir.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const leer = (nombre: string): string =>
  readFileSync(join(process.cwd(), "prompts", "agente-prueba", nombre), "utf8");

const MARCA = "MARCA-PROMPT-FICTICIO-0001";

describe("prompts/agente-prueba/0.1.md", () => {
  const texto = leer("0.1.md");

  it("lleva la marca exactamente una vez", () => {
    expect(texto.split(MARCA).length - 1).toBe(1);
  });

  it("termina en un solo salto de línea y no usa retorno de carro", () => {
    expect(texto.endsWith("\n")).toBe(true);
    expect(texto.endsWith("\n\n")).toBe(false);
    expect(texto.includes("\r")).toBe(false);
  });

  it("no contiene dirección de correo ni URL", () => {
    expect(texto).not.toMatch(/\S@\S/);
    expect(texto).not.toMatch(/https?:|:\/\/|www\./i);
  });

  it("no pide enviar, eliminar, reenviar ni compartir", () => {
    const sinHerramienta = texto.replaceAll("enviar_informe", "");
    expect(sinHerramienta).not.toMatch(
      /(?<!\p{L})(envía|enviar|envíes|envíe|reenv\p{L}*|respond\p{L}*|descarg\p{L}*|elimin\p{L}*|borra|borrar|comparte|compartir)(?!\p{L})|enlace|contraseña|credencial/iu,
    );
  });
});

describe("prompts/agente-prueba/arranque.md", () => {
  const texto = leer("arranque.md");

  it("no lleva la marca del prompt", () => {
    expect(texto.includes(MARCA)).toBe(false);
  });

  it("termina en un solo salto de línea", () => {
    expect(texto.endsWith("\n")).toBe(true);
    expect(texto.endsWith("\n\n")).toBe(false);
    expect(texto.includes("\r")).toBe(false);
  });

  it("no contiene dirección de correo ni URL", () => {
    expect(texto).not.toMatch(/\S@\S/);
    expect(texto).not.toMatch(/https?:|:\/\/|www\./i);
  });

  it("llama primero a obtener_instrucciones y prohíbe enviar", () => {
    expect(texto.indexOf("obtener_instrucciones")).toBeGreaterThan(-1);
    expect(texto).toMatch(/Nunca envíes/);
  });
});
