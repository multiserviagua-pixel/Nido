import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
// @ts-expect-error: el módulo de scripts/ es JavaScript sin declaraciones y no se toca desde aquí.
import { buscarSecretos as buscarSecretosJs } from "../../../scripts/patrones-secretos.mjs";

// PRUEBA-024 (parte L) y PRUEBA-048 (parte L): `docs/operacion/GUIA.md` existe, cuenta el trabajo
// local con las órdenes reales de `package.json` y no contiene valores.

const raiz = join(import.meta.dirname, "..", "..", "..");
const buscarSecretos = buscarSecretosJs as (texto: string) => string[];

const guia = (): string => readFileSync(join(raiz, "docs", "operacion", "GUIA.md"), "utf8");
const paquete = JSON.parse(readFileSync(join(raiz, "package.json"), "utf8")) as {
  scripts: Record<string, string>;
};

// Órdenes que `verificar` encadena, tomadas de package.json.
function ordenesDeVerificar(): string[] {
  const cadena = paquete.scripts.verificar ?? "";
  return [...cadena.matchAll(/npm run ([\w-]+)/g)].map((m) => m[1] ?? "");
}

describe("docs/operacion/GUIA.md", () => {
  it("existe y tiene el apartado «Trabajo local»", () => {
    expect(guia()).toMatch(/^#{1,3} Trabajo local\s*$/m);
  });

  it("cita los requisitos y las órdenes de arranque", () => {
    const t = guia();
    expect(t).toContain("Node 26");
    expect(t).toContain("npm 11");
    expect(t).toContain("npm ci --ignore-scripts");
    expect(t).toContain("npm run dev");
    expect(t).toContain("npm run verificar");
  });

  it("explica cada orden que encadena `verificar`", () => {
    const t = guia();
    const ordenes = ordenesDeVerificar();
    expect(ordenes.length).toBeGreaterThan(0);
    for (const o of ordenes) {
      expect(paquete.scripts[o], `package.json no define ${o}`).toBeDefined();
      expect(t, `falta la orden npm run ${o}`).toContain(`npm run ${o}`);
    }
  });

  it("no cita órdenes npm que no existan", () => {
    for (const m of guia().matchAll(/npm run ([\w-]+)/g)) {
      expect(paquete.scripts[m[1] ?? ""], `npm run ${m[1]} no existe`).toBeDefined();
    }
  });

  it("cuenta el «sí», la lectura de main y la vuelta atrás", () => {
    const t = guia();
    expect(t).toContain("git log --first-parent main");
    expect(t).toContain("git revert");
    expect(t).toContain("aprobacion.md");
    expect(t).toContain("entornos.md");
  });

  it("cuenta la delegación D-036 y las evidencias de cada tarea", () => {
    const t = guia();
    expect(t).toContain("D-036");
    expect(t).toContain("aprobado por delegación D-036");
    for (const a of ["verificar.md", "revision.md", "dictamen.md"]) expect(t).toContain(a);
    expect(t).toContain("tarea/T-NNN-revertir");
    expect(t).toContain("specs/<función>/evidencias/T-NNN/");
    expect(t).toContain("primer commit integrado por este procedimiento");
    expect(t).not.toMatch(/Solo vale un «sí»/);
  });

  it("dice qué verá y qué hacer si falla `npm run dev`", () => {
    const t = guia();
    expect(t).toContain("http://localhost:3000");
    expect(t).toContain("Ready");
    expect(t).toContain("/api/salud");
    expect(t).toContain("salida_no_estructurada");
    expect(t).toContain("VERCEL");
  });

  it("no da por reservado todo package.json ni manda borrar node_modules", () => {
    const t = guia();
    expect(t).not.toMatch(/borrar la carpeta `node_modules`/);
    expect(t).toContain("npm warn");
    expect(t).toContain("added");
  });

  it("no contiene secretos, URL con credenciales ni direcciones de correo", () => {
    const t = guia();
    expect(buscarSecretos(t)).toEqual([]);
    expect(t).not.toMatch(/[a-z][a-z0-9+.-]*:\/\/[^\s/@]+:[^\s/@]*@/i);
    expect(t).not.toMatch(/[\w.+-]+@[\w-]+\.[\w.-]+/);
  });
});
