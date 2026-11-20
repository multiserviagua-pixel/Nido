import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const paquete = JSON.parse(readFileSync("package.json", "utf8")) as {
  scripts: Record<string, string>;
  devDependencies: Record<string, string>;
};

describe("npm run verificar (PRUEBA-055)", () => {
  it("encadena con && y en este orden: tipos, estilo, test, aislamiento, arnes, build", () => {
    expect(paquete.scripts.verificar).toBe(
      "npm run tipos && npm run estilo && npm run test && npm run aislamiento && npm run arnes && npm run build",
    );
  });

  it("aislamiento ejecuta el probador del modelo", () => {
    expect(paquete.scripts.aislamiento).toBe("node scripts/probar-modelo.mjs");
  });

  it("pglite y eslint-plugin-security van fijados en versión exacta", () => {
    expect(paquete.devDependencies["@electric-sql/pglite"]).toBe("0.5.17");
    expect(paquete.devDependencies["eslint-plugin-security"]).toMatch(/^\d+\.\d+\.\d+$/);
  });
});
