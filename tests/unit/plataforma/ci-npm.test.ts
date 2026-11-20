import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

// Raíz del repositorio: tests/unit/plataforma -> tres niveles arriba.
const raiz = join(import.meta.dirname, "..", "..", "..");
const flujo = readFileSync(join(raiz, ".github", "workflows", "arnes.yml"), "utf8");

const COMANDOS = [
  "npm ci --ignore-scripts",
  "npm audit",
  "npm audit signatures",
  "npx vitest run tests/unit/plataforma",
] as const;

function sinComentarios(texto: string): string[] {
  return texto.split(/\r?\n/).filter((l) => !l.trim().startsWith("#"));
}

/** Líneas del trabajo `comprobar` y si es el primero de `jobs:`. */
function trabajoComprobar(lineas: string[]): { cuerpo: string[]; primero: boolean } {
  const inicioJobs = lineas.findIndex((l) => /^jobs:\s*$/.test(l));
  if (inicioJobs < 0) return { cuerpo: [], primero: false };
  const claves: number[] = [];
  for (let i = inicioJobs + 1; i < lineas.length; i++) {
    if (/^\S/.test(lineas[i] ?? "")) break; // otra clave de primer nivel
    if (/^ {2}[\w-]+:\s*$/.test(lineas[i] ?? "")) claves.push(i);
  }
  const k = claves.findIndex((i) => /^ {2}comprobar:\s*$/.test(lineas[i] ?? ""));
  if (k < 0) return { cuerpo: [], primero: false };
  const fin = claves[k + 1] ?? lineas.length;
  return { cuerpo: lineas.slice((claves[k] ?? 0) + 1, fin), primero: k === 0 };
}

/** Devuelve la lista de incumplimientos del texto de un workflow (vacía si cumple). */
export function comprobarFlujo(texto: string): string[] {
  const lineas = sinComentarios(texto);
  const fallos: string[] = [];

  if (/continue-on-error/.test(lineas.join("\n"))) fallos.push("continue-on-error");
  // Cualquier forma de clave `if` (entrecomillada, con espacio antes de los dos puntos).
  if (lineas.some((l) => /^\s*(-\s+)?["']?if["']?\s*:/.test(l))) fallos.push("if:");
  // Claves que cambian el entorno, el directorio, el intérprete o cuándo se dispara el flujo.
  const prohibidas =
    /^\s*(-\s+)?["']?(shell|working-directory|env|defaults|strategy|paths|paths-ignore|branches-ignore)["']?\s*:/;
  for (const l of lineas) {
    const m = prohibidas.exec(l);
    if (m) fallos.push(`clave prohibida: ${m[2]}`);
  }
  // actions/checkout no deja credenciales en el repositorio local.
  const iCheckout = lineas.findIndex((l) => /^\s*-\s+uses:\s*actions\/checkout@/.test(l));
  const pasoCheckout: string[] = [];
  if (iCheckout >= 0) {
    for (let k = iCheckout + 1; k < lineas.length && !/^\s*-\s/.test(lineas[k] ?? ""); k++)
      pasoCheckout.push((lineas[k] ?? "").trim());
  }
  if (!(pasoCheckout.includes("with:") && pasoCheckout.includes("persist-credentials: false")))
    fallos.push("checkout sin persist-credentials: false");

  const { cuerpo, primero } = trabajoComprobar(lineas);
  if (cuerpo.length === 0) fallos.push("no hay trabajo comprobar");
  if (!primero) fallos.push("comprobar no es el primer trabajo");
  const posiciones = COMANDOS.map((c) => cuerpo.findIndex((l) => l.trim() === `run: ${c}`));
  posiciones.forEach((p, i) => {
    if (p < 0) fallos.push(`falta en comprobar: ${COMANDOS[i]}`);
  });
  if (posiciones.every((p) => p >= 0) && !posiciones.slice(1).every((p) => posiciones[0]! < p)) {
    fallos.push("npm ci debe ir antes que las auditorías y Vitest");
  }
  for (const c of COMANDOS) {
    const total = lineas.filter((l) => l.trim() === `run: ${c}`).length;
    if (total > 1) fallos.push(`repetido: ${c}`);
  }

  if (!lineas.some((l) => /^ {2}schedule:\s*$/.test(l))) fallos.push("sin schedule");
  if (!lineas.some((l) => /^\s+- cron:\s*"\d{1,2} \d{1,2} \* \* \*"\s*$/.test(l)))
    fallos.push("cron no diario");

  const permisos = lineas.filter((l) => /^\s*permissions:/.test(l));
  if (permisos.length !== 1) fallos.push("debe haber un solo permissions:");
  const i = lineas.findIndex((l) => /^permissions:\s*$/.test(l));
  if (i < 0) fallos.push("falta permissions: de primer nivel");
  else {
    if (lineas[i + 1]?.trim() !== "contents: read")
      fallos.push("permissions distinto de contents: read");
    if ((lineas[i + 2]?.trim() ?? "") !== "") fallos.push("permissions con más entradas");
  }
  if (/(write|id-token)/.test(texto)) fallos.push("write o id-token");
  if (texto.includes("pull_request_target")) fallos.push("pull_request_target");
  return fallos;
}

/** Aplica una alteración y exige que no se pueda aplicar en vacío. */
function mutar(buscar: string | RegExp, poner: string): string {
  const resultado = flujo.replace(buscar, poner);
  expect(resultado, "la mutación no cambió el texto").not.toBe(flujo);
  return resultado;
}

describe("arnes.yml: dependencias de npm (D-030)", () => {
  it("el archivo real cumple todo", () => {
    expect(comprobarFlujo(flujo)).toEqual([]);
  });

  it("el trabajo se llama «Comprobador documental y de suministro»", () => {
    expect(flujo).toContain("name: Comprobador documental y de suministro");
  });

  it("mutación: continue-on-error hace fallar", () => {
    const t = mutar(/(runs-on: ubuntu-latest)/, "$1\n    continue-on-error: true");
    expect(comprobarFlujo(t)).toContain("continue-on-error");
  });

  it("mutación: una línea if: hace fallar", () => {
    const t = mutar(/(      - name: Auditar vulnerabilidades)/, "$1\n        if: false");
    expect(comprobarFlujo(t)).toContain("if:");
  });

  it("mutación: un run fuera de comprobar hace fallar", () => {
    const t =
      mutar(/ {6}- name: Auditar vulnerabilidades\n {8}run: npm audit\n/, "") +
      "  otro:\n    runs-on: ubuntu-latest\n    steps:\n      - run: npm audit\n";
    expect(comprobarFlujo(t).join("|")).toContain("falta en comprobar: npm audit");
  });

  it("mutación: otro trabajo antes de comprobar hace fallar", () => {
    const t = mutar(
      /jobs:\n/,
      "jobs:\n  previo:\n    runs-on: ubuntu-latest\n    steps:\n      - run: echo hola\n",
    );
    expect(comprobarFlujo(t)).toContain("comprobar no es el primer trabajo");
  });

  it("mutación: npm ci tras las auditorías hace fallar", () => {
    const t = mutar(
      "run: npm ci --ignore-scripts",
      "run: npm audit signatures\n      - run: npm ci --ignore-scripts\n      - run: echo",
    );
    expect(comprobarFlujo(t).length).toBeGreaterThan(0);
  });

  it("mutación: npm ci sin --ignore-scripts hace fallar", () => {
    const t = mutar("npm ci --ignore-scripts", "npm ci");
    expect(comprobarFlujo(t).join("|")).toContain("falta en comprobar: npm ci --ignore-scripts");
  });

  it("mutación: sin el paso de Vitest de plataforma, o antes de npm ci, hace fallar", () => {
    const paso =
      /\n {6}- name: [^\n]*Vitest[^\n]*\n {8}run: npx vitest run tests\/unit\/plataforma/;
    expect(flujo).toMatch(paso);
    expect(comprobarFlujo(mutar(paso, "")).join("|")).toContain(
      "falta en comprobar: npx vitest run tests/unit/plataforma",
    );
    expect(
      comprobarFlujo(mutar("npx vitest run tests/unit/plataforma", "npx vitest run")),
    ).not.toEqual([]);
    const antes = mutar(
      /( {6}- name: Instalar dependencias)/,
      "      - name: antes\n        run: npx vitest run tests/unit/plataforma\n$1",
    );
    expect(comprobarFlujo(antes).join("|")).toContain("npm ci debe ir antes");
  });

  it("mutación: formas de if que el auditor probó hacen fallar", () => {
    const tras = /( {6}- name: Auditar vulnerabilidades)/;
    expect(comprobarFlujo(mutar(tras, '$1\n        "if": false'))).toContain("if:");
    expect(comprobarFlujo(mutar(tras, "$1\n        'if': false"))).toContain("if:");
    expect(comprobarFlujo(mutar(tras, "$1\n        if : ${{ false }}"))).toContain("if:");
    expect(
      comprobarFlujo(mutar(/( {6}- uses: actions\/setup-node@v4)/, "$1\n        if: false")),
    ).toContain("if:");
  });

  it("mutación: claves que alteran el entorno de ejecución hacen fallar", () => {
    const tras = /( {6}- name: Auditar vulnerabilidades)/;
    const casos: [string, string, string][] = [
      ["shell", "$1\n        shell: true {0}", "shell"],
      ["working-directory", "$1\n        working-directory: docs", "working-directory"],
      ["env", "$1\n        env:\n          NPM_CONFIG_AUDIT_LEVEL: none", "env"],
      ["env de trabajo", "$1\n        env: {}", "env"],
    ];
    for (const [, poner, clave] of casos) {
      expect(comprobarFlujo(mutar(tras, poner)).join("|")).toContain(`clave prohibida: ${clave}`);
    }
    expect(
      comprobarFlujo(mutar("  pull_request:", "  pull_request:\n    paths-ignore: ['**']")).join(
        "|",
      ),
    ).toContain("clave prohibida: paths-ignore");
    expect(
      comprobarFlujo(mutar("  pull_request:", "  pull_request:\n    paths: ['x']")).join("|"),
    ).toContain("clave prohibida: paths");
    expect(
      comprobarFlujo(mutar("  pull_request:", "  pull_request:\n    branches-ignore: ['*']")).join(
        "|",
      ),
    ).toContain("clave prohibida: branches-ignore");
    expect(
      comprobarFlujo(mutar("  push:", "defaults:\n  run:\n    shell: bash\n  push:")).join("|"),
    ).toContain("clave prohibida: defaults");
  });

  it("mutación: strategy (fail-fast) no se admite", () => {
    const t = mutar(
      /(runs-on: ubuntu-latest)/,
      "$1\n    strategy:\n      fail-fast: false\n      matrix:\n        n: [1]",
    );
    expect(comprobarFlujo(t).join("|")).toContain("clave prohibida: strategy");
  });

  it("actions/checkout lleva persist-credentials: false, con mutación", () => {
    expect(flujo).toMatch(
      /- uses: actions\/checkout@v4\n {8}with:\n {10}persist-credentials: false/,
    );
    expect(
      comprobarFlujo(mutar(/\n {8}with:\n {10}persist-credentials: false/, "")).join("|"),
    ).toContain("checkout sin persist-credentials: false");
    expect(
      comprobarFlujo(mutar("persist-credentials: false", "persist-credentials: true")).join("|"),
    ).toContain("checkout sin persist-credentials: false");
  });

  it("mutación: sin schedule o con cron no diario hace fallar", () => {
    expect(comprobarFlujo(mutar("  schedule:", "  scheduled:"))).toContain("sin schedule");
    expect(comprobarFlujo(mutar(/"17 5 \* \* \*"/, '"17 5 * * 1"'))).toContain("cron no diario");
  });

  it("mutación: un segundo permissions: o permisos de escritura hace fallar", () => {
    const t = mutar(/(runs-on: ubuntu-latest)/, "$1\n    permissions:\n      contents: read");
    expect(comprobarFlujo(t)).toContain("debe haber un solo permissions:");
    expect(comprobarFlujo(mutar("contents: read", "contents: write"))).toContain(
      "write o id-token",
    );
  });

  it("mutación: pull_request_target hace fallar", () => {
    expect(comprobarFlujo(mutar("  pull_request:", "  pull_request_target:"))).toContain(
      "pull_request_target",
    );
  });
});
