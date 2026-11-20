import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

// Raíz del repositorio: tests/unit/plataforma -> tres niveles arriba.
const raiz = join(import.meta.dirname, "..", "..", "..");

// Lista cerrada (D-030, D-034): añadir una entrada exige cambiar esta prueba en una revisión
// con dictamen del auditor-seguridad. Hoy solo fsevents (opcional, solo macOS).
const paquetesConScriptDeInstalacion = ["node_modules/fsevents"];

/** Líneas efectivas de un .npmrc: sin espacios sobrantes, vacías ni comentarios. */
function lineasEfectivas(texto: string): string[] {
  return texto
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l !== "" && !l.startsWith("#") && !l.startsWith(";"));
}

/** Incumplimientos de un .npmrc: debe valer exactamente ["ignore-scripts=true"]. */
function comprobarNpmrc(texto: string): string[] {
  const l = lineasEfectivas(texto);
  return l.length === 1 && l[0] === "ignore-scripts=true"
    ? []
    : [`líneas efectivas distintas de ignore-scripts=true: ${JSON.stringify(l)}`];
}

describe(".npmrc (scripts de instalación desactivados)", () => {
  const ruta = join(raiz, ".npmrc");

  it("existe en la raíz y sus líneas efectivas son exactamente ignore-scripts=true", () => {
    expect(existsSync(ruta), ".npmrc ausente").toBe(true);
    expect(lineasEfectivas(readFileSync(ruta, "utf8"))).toEqual(["ignore-scripts=true"]);
  });

  it.each(["audit-level=none", "omit=dev", "registry=https://ejemplo.invalid/"])(
    "mutación: añadir %s hace fallar",
    (extra) => {
      const t = readFileSync(ruta, "utf8") + `\n${extra}\n`;
      expect(comprobarNpmrc(t)).not.toEqual([]);
    },
  );

  it("el .npmrc real no tiene incumplimientos", () => {
    expect(comprobarNpmrc(readFileSync(ruta, "utf8"))).toEqual([]);
  });

  it("la lista de paquetes con hasInstallScript es exactamente la lista cerrada", () => {
    const bloqueo = JSON.parse(readFileSync(join(raiz, "package-lock.json"), "utf8")) as {
      packages: Record<string, { hasInstallScript?: boolean }>;
    };
    const con = Object.entries(bloqueo.packages)
      .filter(([, d]) => d.hasInstallScript === true)
      .map(([r]) => r)
      .sort();
    expect(con).toEqual([...paquetesConScriptDeInstalacion].sort());
  });
});
