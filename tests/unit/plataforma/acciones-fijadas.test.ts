// Cambio de CI (D-036, 21/11/2026): toda action de .github/ (cualquier .yml o .yaml, en cualquier
// subcarpeta) va fijada por SHA completo de commit (40 hex) con la versión en un comentario, y
// CODEOWNERS protege CI, .npmrc y el bloqueo. T-125 (22/11/2026): recorrido de .github/ entero,
// `* @propietario` como primera línea efectiva de CODEOWNERS y espera y tope de Dependabot.
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, sep } from "node:path";
import { describe, expect, it } from "vitest";

const raiz = join(import.meta.dirname, "..", "..", "..");
const carpeta = join(raiz, ".github");

// Todos los .yml y .yaml bajo `dir`, en cualquier subcarpeta, como rutas relativas con «/».
const ymlDe = (dir: string) =>
  readdirSync(dir, { recursive: true, encoding: "utf8" })
    .filter((f) => /\.ya?ml$/i.test(f))
    .map((f) => f.split(sep).join("/"))
    .sort();

// Detecta cualquier clave `uses` (con comillas, con espacio antes de los dos puntos o en línea).
const mencionaUses = (l: string) => !/^\s*#/.test(l) && /(^|[\s{,-])["']?uses["']?\s*:/.test(l);
// Única forma admitida: `uses: dueño/repo@<40 hex> # vX.Y.Z`, sin comillas.
const usoFijado = (l: string) =>
  /^\s*(-\s+)?uses: [\w.-]+\/[\w./-]+@[0-9a-f]{40}\s+#\s*v\d+\.\d+\.\d+\s*$/.test(l);

describe("acciones de GitHub fijadas por huella", () => {
  const archivos = ymlDe(carpeta);
  const usos = archivos.flatMap((f) =>
    readFileSync(join(carpeta, f), "utf8")
      .split(/\r?\n/)
      .filter(mencionaUses)
      .map((l) => ({ f, l })),
  );

  it("recorre .github/ entero: flujos y dependabot.yml", () => {
    expect(archivos).toContain("workflows/arnes.yml");
    expect(archivos).toContain("dependabot.yml");
  });

  it("el recorrido encuentra .yml y .yaml en subcarpetas a cualquier profundidad", () => {
    const tmp = mkdtempSync(join(tmpdir(), "acciones-"));
    try {
      mkdirSync(join(tmp, "sub", "honda"), { recursive: true });
      writeFileSync(join(tmp, "a.yml"), "");
      writeFileSync(join(tmp, "sub", "b.yaml"), "");
      writeFileSync(join(tmp, "sub", "honda", "c.YML"), "");
      writeFileSync(join(tmp, "sub", "nota.txt"), "");
      expect(ymlDe(tmp)).toEqual(["a.yml", "sub/b.yaml", "sub/honda/c.YML"]);
    } finally {
      rmSync(tmp, { recursive: true, force: true });
    }
  });

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

const efectivasDe = (texto: string) =>
  texto.split(/\r?\n/).filter((l) => l.trim() !== "" && !l.trim().startsWith("#"));
// La última coincidencia gana: `*` va la primera (para no tapar las rutas) y una sola vez.
const comodinPrimero = (texto: string) => {
  const efectivas = efectivasDe(texto);
  const primera = efectivas[0]?.trim().split(/\s+/) ?? [];
  return (
    primera.length === 2 &&
    primera[0] === "*" &&
    primera[1] === "@multiserviagua-pixel" &&
    efectivas.filter((l) => l.trim().split(/\s+/)[0] === "*").length === 1
  );
};

describe("CODEOWNERS", () => {
  const ruta = join(raiz, ".github", "CODEOWNERS");
  it("`* @multiserviagua-pixel` es la primera línea efectiva y la única con `*`", () => {
    expect(comodinPrimero(readFileSync(ruta, "utf8"))).toBe(true);
  });
  const rutas = "# cabecera\n/.github/ @multiserviagua-pixel\n/.npmrc @multiserviagua-pixel\n";
  it.each([
    ["ausente", rutas],
    ["no es la primera", rutas + "* @multiserviagua-pixel\n"],
    ["repetida al final", "* @multiserviagua-pixel\n" + rutas + "* @otro\n"],
    ["otro propietario", "* @otro\n" + rutas],
    ["sin propietario", "*\n" + rutas],
    ["comentada", "# * @multiserviagua-pixel\n" + rutas],
  ])("mutación detectada y rechazada: %s", (_n, texto) => {
    expect(comodinPrimero(texto)).toBe(false);
  });
  it("se admiten comentarios y líneas en blanco antes de `*`", () => {
    expect(comodinPrimero("# c\n\n* @multiserviagua-pixel\r\n" + rutas)).toBe(true);
  });
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

// Solo github-actions, con espera de 7 días tras cada publicación y como mucho 2 PR abiertos.
// Según la documentación de GitHub, la espera y el tope solo afectan a las actualizaciones de
// versión, no a las de seguridad. Sin parser YAML: se exige la forma de bloque, línea a línea.
const cumpleDependabot = (texto: string) => {
  const l = efectivasDe(texto).map((x) => x.replace(/\s+$/, ""));
  const entradas = l.filter((x) => /package-ecosystem/.test(x));
  if (entradas.length !== 1 || entradas[0] !== '  - package-ecosystem: "github-actions"') return false;
  const i = l.indexOf("    cooldown:");
  const dentro: string[] = [];
  for (let j = i + 1; i >= 0 && j < l.length && /^ {6,}/.test(l[j] ?? ""); j++) dentro.push(l[j] ?? "");
  return (
    l.filter((x) => /open-pull-requests-limit/.test(x)).length === 1 &&
    l.includes("    open-pull-requests-limit: 2") &&
    l.filter((x) => /cooldown/.test(x)).length === 1 &&
    dentro.length === 1 &&
    dentro[0] === "      default-days: 7"
  );
};

describe("dependabot.yml", () => {
  it("espera 7 días y abre como mucho 2 PR", () => {
    expect(cumpleDependabot(readFileSync(join(carpeta, "dependabot.yml"), "utf8"))).toBe(true);
  });
  const base = [
    "version: 2",
    "updates:",
    '  - package-ecosystem: "github-actions"',
    '    directory: "/"',
    "    schedule:",
    '      interval: "weekly"',
  ];
  const bien = [...base, "    open-pull-requests-limit: 2", "    cooldown:", "      default-days: 7"];
  it("una configuración correcta pasa", () => {
    expect(cumpleDependabot(bien.join("\n"))).toBe(true);
  });
  it.each([
    ["sin espera", [...base, "    open-pull-requests-limit: 2"]],
    ["sin tope", [...base, "    cooldown:", "      default-days: 7"]],
    ["espera de 3 días", [...base, "    open-pull-requests-limit: 2", "    cooldown:", "      default-days: 3"]],
    ["tope de 5", [...base, "    open-pull-requests-limit: 5", "    cooldown:", "      default-days: 7"]],
    ["espera en línea", [...base, "    open-pull-requests-limit: 2", "    cooldown: { default-days: 7 }"]],
    ["espera con exclusiones", [...bien, '      exclude: ["*"]']],
    ["tope repetido", [...bien, "    open-pull-requests-limit: 10"]],
    ["otro ecosistema", [...bien, '  - package-ecosystem: "npm"']],
  ])("mutación detectada y rechazada: %s", (_n, lineas) => {
    expect(cumpleDependabot(lineas.join("\n"))).toBe(false);
  });
});
