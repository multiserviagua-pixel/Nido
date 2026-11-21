// Cambio de CI (D-036, 21/11/2026): toda action de los flujos va fijada por SHA completo de commit
// (40 hex) con la versión en un comentario, y CODEOWNERS protege CI, .npmrc y el bloqueo.
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const raiz = join(import.meta.dirname, "..", "..", "..");
const carpeta = join(raiz, ".github", "workflows");

// Detecta cualquier clave `uses` (con comillas, con espacio antes de los dos puntos o en línea).
const mencionaUses = (l: string) => !/^\s*#/.test(l) && /(^|[\s{,-])["']?uses["']?\s*:/.test(l);
// Única forma admitida: `uses: dueño/repo@<40 hex> # vX.Y.Z`, sin comillas.
const usoFijado = (l: string) =>
  /^\s*(-\s+)?uses: [\w.-]+\/[\w./-]+@[0-9a-f]{40}\s+#\s*v\d+\.\d+\.\d+\s*$/.test(l);

describe("acciones de GitHub fijadas por huella", () => {
  const usos = readdirSync(carpeta)
    .filter((f) => /\.ya?ml$/.test(f))
    .flatMap((f) =>
      readFileSync(join(carpeta, f), "utf8")
        .split(/\r?\n/)
        .filter(mencionaUses)
        .map((l) => ({ f, l })),
    );

  it("hay acciones que comprobar", () => {
    expect(usos.length).toBeGreaterThan(0);
  });

  it.each(usos)("$f: $l", ({ l }) => {
    expect(usoFijado(l)).toBe(true);
  });

  const sha = "a".repeat(40);
  it.each([
    ["etiqueta", "      - uses: actions/checkout@v4"],
    ["clave entre comillas", "      - 'uses': actions/checkout@v4"],
    ["clave entre comillas dobles", '      - "uses": actions/checkout@v4'],
    ["espacio antes de los dos puntos", "      - uses : actions/checkout@v4"],
    ["forma en línea", "      - { uses: actions/checkout@v4 }"],
    ["valor entre comillas", `      - uses: "actions/checkout@${sha}" # v4.4.0`],
    ["sin versión comentada", `      - uses: actions/checkout@${sha}`],
  ])("mutación detectada y rechazada: %s", (_n, l) => {
    expect(mencionaUses(l)).toBe(true);
    expect(usoFijado(l)).toBe(false);
  });
  it("una línea correcta pasa", () => {
    const l = `      - uses: actions/checkout@${sha} # v4.4.0`;
    expect(mencionaUses(l) && usoFijado(l)).toBe(true);
  });
});

describe("CODEOWNERS", () => {
  const ruta = join(raiz, ".github", "CODEOWNERS");
  // Toda línea efectiva debe terminar en al menos un propietario (@usuario o @equipo/org).
  const sinPropietario = (l: string) => !/\s@[\w-]+(\/[\w-]+)?(\s+@[\w-]+(\/[\w-]+)?)*\s*$/.test(l);
  it("toda línea efectiva termina con propietario", () => {
    const efectivas = readFileSync(ruta, "utf8")
      .split(/\r?\n/)
      .filter((l) => l.trim() !== "" && !l.trim().startsWith("#"));
    expect(efectivas.length).toBeGreaterThan(0);
    for (const l of efectivas) expect(sinPropietario(l), l).toBe(false);
  });
  it.each([
    ["sin propietario", "/nuevo/"],
    ["propietario sin arroba", "/nuevo/ usuario"],
    ["propietario seguido de ruta", "/nuevo/ @a /otra/"],
  ])("mutación detectada y rechazada: %s", (_n, l) => {
    expect(sinPropietario(l)).toBe(true);
  });

  it("protege el CI, la cadena de suministro y las rutas críticas", () => {
    expect(existsSync(ruta)).toBe(true);
    const lineas = readFileSync(ruta, "utf8")
      .split(/\r?\n/)
      .filter((l) => l.trim() !== "" && !l.trim().startsWith("#"));
    const patrones = [
      "/.github/",
      "/.github/CODEOWNERS",
      "/.npmrc",
      "/package-lock.json",
      "/package.json",
      "/scripts/",
      "/tests/unit/plataforma/",
      "/vitest.config.ts",
      "/vercel.json",
      "/next.config.ts",
      "/supabase/migrations/",
      "/supabase/reversiones/",
      "/prompts/",
      "/docs/CONSTITUCION.md",
      "/.claude/",
      "/contratos/",
      "/supabase/conector-prueba/",
      "/eslint.config.mjs",
      "/docs/SEGURIDAD.md",
      "/.gitattributes",
    ];
    for (const patron of patrones) {
      expect(existsSync(join(raiz, patron.slice(1))), `no existe ${patron}`).toBe(true);
      const linea = lineas.find((l) => l.split(/\s+/)[0] === patron);
      expect(linea, patron).toBeDefined();
      expect(linea).toMatch(/\s@[\w-]+(\/[\w-]+)?\s*$/);
    }
  });
});
