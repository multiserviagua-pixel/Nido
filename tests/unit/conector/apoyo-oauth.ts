// Apoyo de las pruebas de las rutas OAuth (T-110, 001): entorno ficticio del conector y registro de consola.
// No es una prueba: no termina en .test.ts. Valores compuestos en ejecución (arts. 1 y 4).
import { randomBytes } from "node:crypto";
import { vi } from "vitest";

export const URL_PUBLICA = "http://localhost:3000";
export const SECRETO = randomBytes(32).toString("base64url");
export const urlBd = (rol: string): string =>
  ["postgres", "://", `${rol}.ref1`, ":", randomBytes(12).toString("hex"), "@"]
    .concat(["agrupador.ejemplo.invalid", ":6543", "/postgres"])
    .join("");

export function entornoConector(valido = true): void {
  vi.stubEnv("ENTORNO", "desarrollo");
  vi.stubEnv("NODE_ENV", "development");
  for (const n of ["VERCEL", "VERCEL_ENV", "VERCEL_REGION", "VERCEL_URL", "SUPERVISION_DSN"]) {
    vi.stubEnv(n, undefined);
  }
  vi.stubEnv("URL_PUBLICA", URL_PUBLICA);
  vi.stubEnv("CONECTOR_SECRETO", valido ? SECRETO : "corto");
  vi.stubEnv("CONECTOR_BD_URL", urlBd("conector_prueba_mcp"));
  vi.stubEnv("AUTORIZACION_BD_URL", urlBd("conector_prueba_gestion"));
  vi.stubEnv("OPERACION_HUELLA", "0".repeat(64));
}

/** Captura todo lo que la aplicación escribe en la consola (las pruebas buscan valores en ello). */
export function capturarConsola(): string[] {
  const lineas: string[] = [];
  for (const m of ["log", "error", "warn", "info", "debug"] as const) {
    vi.spyOn(console, m).mockImplementation((...a: unknown[]) => {
      lineas.push(a.map((x) => (typeof x === "string" ? x : JSON.stringify(x))).join(" "));
    });
  }
  return lineas;
}
