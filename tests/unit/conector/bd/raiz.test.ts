// T-103 (b) (001): raíz pública de Supabase para el TLS del agrupador (V-10; PRUEBA-018, parte).
// El certificado es público (no es un secreto). Aquí se comprueba solo el archivo: que es una CA
// autofirmada, vigente y con la huella anotada en LEEME.md. Que el certificado del agrupador de `Nido`
// encadene a esta raíz se comprueba en T-114 contra el proyecto real (no aquí).
import { X509Certificate } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const CARPETA = resolve(import.meta.dirname, "..", "..", "..", "..", "supabase", "conector-prueba");
const pem = () => readFileSync(resolve(CARPETA, "raiz-supabase.crt"), "utf8");
const leeme = () => readFileSync(resolve(CARPETA, "LEEME.md"), "utf8");

describe("T-103 (b): raiz-supabase.crt", () => {
  it("es un único certificado PEM, sin clave privada ni otra cosa", () => {
    const texto = pem();
    expect(texto.match(/-----BEGIN [A-Z ]+-----/g)).toEqual(["-----BEGIN CERTIFICATE-----"]);
    expect(texto).not.toMatch(/PRIVATE KEY/);
    expect(texto.endsWith("\n")).toBe(true);
  });

  it("es una CA autofirmada: emisor igual al sujeto y firma válida con su propia clave", () => {
    const c = new X509Certificate(pem());
    expect(c.ca).toBe(true);
    expect(c.issuer).toBe(c.subject);
    expect(c.subject).toMatch(/CN=Supabase Root 2021 CA/);
    expect(c.checkIssued(c)).toBe(true);
    expect(c.verify(c.publicKey)).toBe(true);
  });

  it("está vigente hoy (si caduca, esta prueba falla y obliga a renovarla)", () => {
    const c = new X509Certificate(pem());
    const ahora = Date.now();
    expect(new Date(c.validFrom).getTime()).toBeLessThanOrEqual(ahora);
    expect(new Date(c.validTo).getTime()).toBeGreaterThan(ahora);
  });

  it("su huella SHA-256 es la anotada en LEEME.md, junto con la URL oficial y la fecha de descarga", () => {
    const c = new X509Certificate(pem());
    const texto = leeme();
    const anotada = /Huella SHA-256:\s*`?([0-9A-F]{2}(?::[0-9A-F]{2}){31})`?/.exec(texto)?.[1];
    expect(anotada, "LEEME.md debe anotar «Huella SHA-256: XX:XX:…»").toBeDefined();
    expect(c.fingerprint256).toBe(anotada);
    expect(texto).toMatch(
      /URL de descarga:\s*`?https:\/\/supabase-downloads\.[^\s`]+\/prod-ca-2021\.crt/,
    );
    expect(texto).toMatch(/Fecha de descarga:\s*`?\d{4}-\d{2}-\d{2}/);
  });

  it("la comprobación puede fallar: un certificado alterado no tiene la huella anotada ni valida", () => {
    const original = pem();
    const lineas = original.split("\n");
    // Cambia un carácter del cuerpo (una línea intermedia), conservando la forma base64.
    const i = 3;
    lineas[i] = (lineas[i]![0] === "A" ? "B" : "A") + lineas[i]!.slice(1);
    const alterado = lineas.join("\n");
    let huella: string | null = null;
    let valida = false;
    try {
      const c = new X509Certificate(alterado);
      huella = c.fingerprint256;
      valida = c.verify(c.publicKey);
    } catch {
      // Un PEM alterado puede dejar de analizarse: también es un fallo detectado.
      huella = null;
    }
    expect(huella === new X509Certificate(original).fingerprint256 && valida).toBe(false);
  });
});
