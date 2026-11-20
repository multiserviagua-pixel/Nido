import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { register } from "../../../src/instrumentation";
import { registrar } from "../../../src/lib/registro/registro";

const MARCA = "TEXTO-CANARIO-123";
const metodos = [
  "log",
  "info",
  "warn",
  "error",
  "debug",
  "dir",
  "dirxml",
  "trace",
  "table",
  "assert",
  "group",
  "groupCollapsed",
  "count",
  "countReset",
  "time",
  "timeLog",
  "timeEnd",
] as const;
let emitido: string[];
const copia: Record<string, unknown> = {};

beforeEach(() => {
  emitido = [];
  for (const m of metodos) {
    copia[m] = console[m];
    console[m] = (...a: unknown[]) => void emitido.push(a.map(String).join(" "));
  }
});
afterEach(() => {
  for (const m of metodos) console[m] = copia[m] as never;
  vi.unstubAllEnvs();
});

describe("instrumentation.register (REQ-019, punto 4)", () => {
  it("fuera de desarrollo, console.* no emite el valor y sale sin argumentos", async () => {
    vi.stubEnv("ENTORNO", "produccion");
    await register();
    for (const m of metodos) {
      // assert solo emite cuando la condición falla.
      const args = m === "assert" ? [false, MARCA] : [MARCA];
      (console[m] as (...a: unknown[]) => void)(...args, { a: MARCA }, new Error(MARCA));
    }
    expect(emitido.join("\n")).not.toContain(MARCA);
    // console.assert no emite nada.
    expect(emitido).toHaveLength(metodos.length - 1);
    for (const linea of emitido) {
      const o = JSON.parse(linea) as Record<string, string>;
      expect(Object.keys(o).sort()).toEqual(["codigo", "nivel"]);
      expect(o.codigo).toBe("salida_no_estructurada");
    }
  });

  it("console.assert no emite nada, ni con la condición falsa ni con la cierta", async () => {
    vi.stubEnv("ENTORNO", "produccion");
    await register();
    console.assert(false, MARCA);
    console.assert(true, MARCA);
    console.assert();
    expect(emitido).toEqual([]);
  });

  it("los sustitutos conservan el método y el nivel originales", async () => {
    vi.stubEnv("ENTORNO", "produccion");
    const llamado: string[] = [];
    const ms = ["log", "info", "debug", "warn", "error", "trace"] as const;
    for (const m of ms) console[m] = (...a: unknown[]) => void llamado.push(m + ":" + String(a[0]));
    await register();
    for (const m of ms) console[m](MARCA);
    const esperado: Record<string, string> = {
      log: "info",
      info: "info",
      debug: "info",
      warn: "aviso",
      error: "error",
      trace: "aviso",
    };
    expect(llamado).toHaveLength(6);
    for (const l of llamado) {
      const i = l.indexOf(":");
      expect(JSON.parse(l.slice(i + 1)).nivel).toBe(esperado[l.slice(0, i)]);
    }
  });

  it("el símbolo guardián es no enumerable y sustituir dos veces no envuelve de nuevo", async () => {
    vi.stubEnv("ENTORNO", "produccion");
    await register();
    const primero = console.log;
    await register();
    expect(console.log).toBe(primero);
    const simbolo = Symbol.for("nido.console.original");
    expect(Object.getOwnPropertySymbols(primero)).toContain(simbolo);
    expect(Object.getOwnPropertyDescriptor(primero, simbolo)?.enumerable).toBe(false);
    expect(Object.getOwnPropertyDescriptor(globalThis, simbolo)?.enumerable ?? false).toBe(false);
  });

  it("con NODE_ENV=production, ENTORNO=desarrollo no vale: sustituye", async () => {
    vi.stubEnv("ENTORNO", "desarrollo");
    vi.stubEnv("NODE_ENV", "production");
    for (const n of ["VERCEL", "VERCEL_ENV", "VERCEL_REGION", "VERCEL_URL"]) {
      vi.stubEnv(n, undefined);
    }
    await register();
    console.log(MARCA);
    expect(emitido.join("")).not.toContain(MARCA);
  });

  it("console.dir y console.dirxml no emiten el valor", async () => {
    vi.stubEnv("ENTORNO", "produccion");
    await register();
    console.dir(MARCA);
    console.dir({ a: MARCA });
    console.dirxml(MARCA);
    expect(emitido).toHaveLength(3);
    expect(emitido.join("\n")).not.toContain(MARCA);
  });

  it("con VERCEL, ENTORNO=desarrollo no vale: sustituye", async () => {
    vi.stubEnv("ENTORNO", "desarrollo");
    vi.stubEnv("VERCEL", "1");
    await register();
    console.log(MARCA);
    expect(emitido.join("")).not.toContain(MARCA);
  });

  it("registrar() sigue emitiendo su línea estructurada con el original", async () => {
    vi.stubEnv("ENTORNO", "preproduccion");
    await register();
    registrar("error", "entrada_invalida", "/r");
    const o = JSON.parse(emitido.at(-1) as string);
    expect(o).toMatchObject({ nivel: "error", codigo: "entrada_invalida", ruta: "/r" });
  });

  it("en desarrollo no sustituye nada", async () => {
    vi.stubEnv("ENTORNO", "desarrollo");
    for (const n of ["VERCEL", "VERCEL_ENV", "VERCEL_REGION", "VERCEL_URL"]) {
      vi.stubEnv(n, undefined);
    }
    await register();
    console.log(MARCA);
    expect(emitido).toEqual([MARCA]);
  });

  it("cierre en fallo: entorno ausente también sustituye", async () => {
    vi.stubEnv("ENTORNO", undefined);
    await register();
    console.log(MARCA);
    expect(emitido.join("")).not.toContain(MARCA);
  });
});
