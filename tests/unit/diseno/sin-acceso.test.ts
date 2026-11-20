// T-008 (b) · unitaria propia de `sinAcceso` (diseño V-1, punto 1; REQ-027, REQ-077; CA-046 por
// PRUEBA-008, que sigue en fronteras.test.ts). Una sola función responde «sin acceso» en los tres
// casos (denegado, inexistente y área de otra fase): no recibe motivo, nombre ni identificador,
// responde siempre lo mismo (el «no encontrado» de Next.js, 404, nunca 403) y nunca devuelve.
// El código real de la respuesta en carga completa y en navegación lo comprueba PRUEBA-034 (T-009).
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { sinAcceso } from "../../../src/lib/errores/sin-acceso";

const TESTIGO = "CADENA-TESTIGO-SIN-ACCESO-020";
const RUTA = resolve(
  import.meta.dirname,
  "..",
  "..",
  "..",
  "src",
  "lib",
  "errores",
  "sin-acceso.ts",
);

function capturar(llamada: () => unknown): unknown {
  try {
    llamada();
  } catch (e) {
    return e;
  }
  throw new Error("sinAcceso devolvió sin lanzar");
}

describe("sinAcceso", () => {
  it("no admite parámetros", () => {
    expect(sinAcceso.length).toBe(0);
  });

  it("nunca devuelve: lanza el «no encontrado» de Next.js (404)", () => {
    const error = capturar(() => sinAcceso());
    expect((error as { digest?: unknown }).digest).toBe("NEXT_HTTP_ERROR_FALLBACK;404");
  });

  it("responde igual en los tres casos, aunque se le pase algo", () => {
    const llamar = sinAcceso as unknown as (...a: unknown[]) => never;
    const respuestas = [
      capturar(() => llamar()),
      capturar(() => llamar("denegado", TESTIGO)),
      capturar(() => llamar({ motivo: "inexistente", id: TESTIGO })),
    ].map((e) => {
      const err = e as Error & { digest?: unknown };
      return { tipo: err.constructor.name, mensaje: err.message, digest: err.digest };
    });
    expect(respuestas[1]).toEqual(respuestas[0]);
    expect(respuestas[2]).toEqual(respuestas[0]);
    expect(JSON.stringify(respuestas)).not.toContain(TESTIGO);
  });

  it("solo usa `notFound` de next/navigation: ni 403, ni `forbidden`, ni `unauthorized`, ni registro", () => {
    const fuente = readFileSync(RUTA, "utf8");
    const importaciones = [...fuente.matchAll(/from\s+["']([^"']+)["']/g)].map((m) => m[1]);
    expect(importaciones).toEqual(["next/navigation"]);
    expect(fuente).toMatch(/import\s*\{\s*notFound\s*\}\s*from/);
    expect(fuente).not.toMatch(/\b403\b|forbidden|unauthorized|registro|console\./);
  });
});
