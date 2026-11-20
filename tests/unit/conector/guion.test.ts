// T-118 (001), PRUEBA-053 (parte): guion de la prueba real fechado, con sus 13 pasos y cada uno con un CA.
// Revisión automática de documentos: no ejecuta la prueba real (la hace una persona).
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { describe, expect, it } from "vitest";

const RAIZ = resolve(import.meta.dirname, "../../..");
const CARPETA = resolve(RAIZ, "specs/001-conector-prueba-real");

function leer(ruta: string): string {
  return readFileSync(resolve(CARPETA, ruta), "utf8");
}

const FECHA = /\b(0[1-9]|[12]\d|3[01])\/(0[1-9]|1[0-2])\/(20\d\d)\b/;
const CORREO = /[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)+/;
const URL_CON_CREDENCIALES =
  /https?:\/\/[^\s/@]+:[^\s/@]*@|[?&#](?:token|code|access_token|refresh_token|key|password|secret)=[^\s&)]+/i;

function contieneCredencial(texto: string): boolean {
  return CORREO.test(texto) || URL_CON_CREDENCIALES.test(texto);
}

async function secretos(texto: string): Promise<string[]> {
  const url = pathToFileURL(resolve(RAIZ, "scripts/patrones-secretos.mjs")).href;
  const modulo = (await import(url)) as { buscarSecretos: (t: string) => string[] };
  return modulo.buscarSecretos(texto);
}

interface Paso {
  numero: number;
  cuerpo: string;
}

function pasos(guion: string): Paso[] {
  const trozos = guion.split(/^## Paso (\d+)\b.*$/m);
  const lista: Paso[] = [];
  for (let i = 1; i < trozos.length; i += 2) {
    lista.push({ numero: Number(trozos[i]), cuerpo: trozos[i + 1] ?? "" });
  }
  return lista;
}

function casDeLaEspecificacion(): Set<string> {
  const texto = readFileSync(resolve(CARPETA, "especificacion.md"), "utf8");
  return new Set([...texto.matchAll(/^\| (CA-\d{3}) \|/gm)].map((m) => m[1] as string));
}

describe("guion de la prueba real: comprobadores (la prueba puede fallar)", () => {
  it("detecta direcciones de correo, URL con credenciales y secretos", async () => {
    expect(contieneCredencial("escribe a nombre@ejemplo.com")).toBe(true);
    expect(contieneCredencial("https://usuario:clave@host.test/")).toBe(true);
    expect(contieneCredencial("https://host.test/cb?code=abc123")).toBe(true);
    expect(contieneCredencial("buzón de pruebas, sin dirección")).toBe(false);
    expect((await secretos("sk-ant-" + "a".repeat(30))).length).toBeGreaterThan(0);
    expect(await secretos("texto sin valores")).toEqual([]);
    expect(FECHA.test("20/11/2026")).toBe(true);
    expect(FECHA.test("2026-11-20")).toBe(false);
  });
});

describe("guion-prueba.md", () => {
  it("existe y lleva fecha dd/mm/aaaa antes de ejecutarse (cabecera)", () => {
    expect(existsSync(resolve(CARPETA, "guion-prueba.md"))).toBe(true);
    const cabecera = leer("guion-prueba.md").split(/^## /m)[0] ?? "";
    expect(cabecera).toMatch(/^Fecha: /m);
    expect(cabecera).toMatch(FECHA);
  });

  it("tiene los pasos 1 a 13, cada uno una sola vez y en orden", () => {
    const numeros = pasos(leer("guion-prueba.md")).map((p) => p.numero);
    expect(numeros).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13]);
  });

  it("cada paso cita al menos un CA que existe en la especificación (0 pasos sin CA)", () => {
    const existentes = casDeLaEspecificacion();
    expect(existentes.size).toBeGreaterThan(20);
    for (const paso of pasos(leer("guion-prueba.md"))) {
      const linea = paso.cuerpo.match(/^- CA: (.+)$/m);
      expect(linea, `paso ${paso.numero} sin línea «- CA:»`).not.toBeNull();
      const citados = [...(linea?.[1] ?? "").matchAll(/CA-\d{3}/g)].map((m) => m[0]);
      expect(citados.length, `paso ${paso.numero} sin CA`).toBeGreaterThan(0);
      for (const ca of citados) {
        expect(existentes.has(ca), `paso ${paso.numero}: ${ca} no existe`).toBe(true);
      }
    }
  });

  it("cada paso dice quién lo hace (persona o qa) y qué evidencia se anota", () => {
    for (const paso of pasos(leer("guion-prueba.md"))) {
      expect(paso.cuerpo, `paso ${paso.numero}`).toMatch(/^- Quién: .*\b(persona|qa)\b/m);
      expect(paso.cuerpo, `paso ${paso.numero}`).toMatch(/^- Evidencia: \S/m);
    }
  });

  it("ChatGPT figura como no ejecutado", () => {
    const guion = leer("guion-prueba.md");
    expect(guion).toMatch(/ChatGPT[^\n]*no ejecutado/i);
  });

  it("no contiene secretos, valores con forma de credencial, correos ni URL con credenciales", async () => {
    const guion = leer("guion-prueba.md");
    expect(await secretos(guion)).toEqual([]);
    expect(contieneCredencial(guion)).toBe(false);
  });
});

describe("calendario.md", () => {
  it("existe, no es un documento firmado y cita la regla del día de prueba y la ventana", () => {
    expect(existsSync(resolve(CARPETA, "calendario.md"))).toBe(true);
    const calendario = leer("calendario.md");
    expect(calendario).toMatch(/no es un documento firmado/i);
    expect(calendario).toMatch(/bloque de 24 h/i);
    expect(calendario).toMatch(/27\/11\/2026/);
    expect(calendario).toMatch(/decision-pago/);
    expect(calendario).toMatch(/26\/11\/2026/);
    expect(calendario).toMatch(FECHA);
  });

  it("no contiene secretos, correos ni URL con credenciales", async () => {
    const calendario = leer("calendario.md");
    expect(await secretos(calendario)).toEqual([]);
    expect(contieneCredencial(calendario)).toBe(false);
  });
});

describe("plantillas de resultados", () => {
  it("existen y no llevan datos reales", async () => {
    for (const archivo of ["resultados/claude-max.md", "resultados/chatgpt.md"]) {
      expect(existsSync(resolve(CARPETA, archivo)), archivo).toBe(true);
      const texto = leer(archivo);
      expect(await secretos(texto), archivo).toEqual([]);
      expect(contieneCredencial(texto), archivo).toBe(false);
    }
    expect(leer("resultados/chatgpt.md")).toMatch(/no ejecutado/i);
  });
});

describe("guion y plantillas: menores del revisor (M-1, M-5, M-6)", () => {
  it("el paso 3 cita CA-025 y lo previo (V-6, navegador real, AR-16, PRUEBA-009)", () => {
    const paso3 = pasos(leer("guion-prueba.md")).find((p) => p.numero === 3);
    expect(paso3?.cuerpo).toMatch(/^- CA: .*CA-025/m);
    expect(paso3?.cuerpo).toMatch(
      /Antes de este paso: V-6 y GET y POST con navegador real \(AR-16, PRUEBA-009\)/,
    );
    expect(leer("resultados/claude-max.md")).toMatch(/^\| 3 \| CA-021, CA-025 \|/m);
  });

  it("las plantillas remiten a conclusiones.md y dicen que Claude Pro no se probó", () => {
    for (const archivo of ["resultados/claude-max.md", "resultados/chatgpt.md"]) {
      const texto = leer(archivo);
      expect(texto, archivo).toMatch(
        /Decisión, declaración de datos ficticios y plan B: en `conclusiones\.md` \(CAD-031, AR-15\)/,
      );
      expect(texto, archivo).toMatch(/Claude Pro: no probado \(RD-078, R-6\)/);
    }
  });

  it("el guion repite los pasos 1 a 13 en ChatGPT; claude-max usa «pendiente» y chatgpt «no ejecutado»", () => {
    expect(leer("guion-prueba.md")).toMatch(
      /los pasos 1 a 13 se repiten tal cual en ChatGPT cuando haya cuenta/,
    );
    const max = leer("resultados/claude-max.md");
    expect(max).toMatch(/\| pendiente \|/);
    expect(max).not.toMatch(/\| no ejecutado \|/);
    expect(leer("resultados/chatgpt.md")).toMatch(/\| no ejecutado \|/);
  });
});
