// PRUEBA-036, parte que no depende de la 002 (020 T-003 (b)): la comprobación estática de los
// archivos de prueba. Falla con cuatro archivos sembrados (una importación de `axe` fuera de su
// módulo, una prueba saltada, un filtro sobre las infracciones y una regla desactivada).
//
// No cubre, y figura como «no ejecutada» hasta que exista la 002: los tres candidatos en una
// copia de prueba (excluir una regla, quitar un estado del inventario, añadir una excepción de
// `style`) rechazados sin firma o con la batería en rojo por bajar la cuenta respecto de `main`.
import { resolve } from "node:path";
import { afterAll, describe, expect, it } from "vitest";
import { borrarArboles, crearArbol } from "./apoyo/arbol";
import { ARCHIVOS_EXENTOS, analizarArchivo, analizarCarpetas } from "./apoyo/estatica";

const RAIZ = resolve(import.meta.dirname, "..", "..", "..");

afterAll(borrarArboles);

const reglasDe = (ruta: string, texto: string): string[] =>
  analizarArchivo(ruta, texto).map((h) => h.regla);

describe("PRUEBA-036 · los cuatro archivos sembrados fallan", () => {
  const sembrados: Record<string, { ruta: string; texto: string; regla: string }> = {
    "importación de axe fuera de su módulo": {
      ruta: "tests/e2e/muestra/estados.spec.ts",
      texto: `import AxeBuilder from "@axe-core/playwright";\nexport const a = AxeBuilder;\n`,
      regla: "importación de axe",
    },
    "prueba saltada": {
      ruta: "tests/unit/diseno/saltada.test.ts",
      texto: `import { it } from "vitest";\nit.skip("no se ejecuta", () => {});\n`,
      regla: "prueba saltada o aislada",
    },
    "filtro sobre las infracciones": {
      ruta: "tests/e2e/muestra/filtro.spec.ts",
      texto: `export const f = (r: { violations: { id: string }[] }) =>\n  r.violations.filter((v) => v.id !== "color-contrast");\n`,
      regla: "filtro sobre las infracciones",
    },
    "regla desactivada": {
      ruta: "tests/e2e/muestra/regla.spec.ts",
      texto: `export const f = (b: { disableRules: (r: string[]) => unknown }) => b.disableRules(["color-contrast"]);\n`,
      regla: "regla desactivada o elemento excluido",
    },
  };

  it.each(Object.entries(sembrados))("%s", (_nombre, { ruta, texto, regla }) => {
    expect(reglasDe(ruta, texto)).toContain(regla);
  });

  it("sobre una carpeta: exactamente los cuatro sembrados fallan; el limpio y el exento, no", () => {
    const archivos: Record<string, string> = {
      "tests/e2e/muestra/limpio.spec.ts": `import { expect, test } from "@playwright/test";\ntest("ok", () => { expect(1).toBe(1); });\n`,
      // El módulo único de axe puede importarlo: está en la lista de los cinco archivos.
      "tests/e2e/muestra/configuracion-interfaz.ts": `import AxeBuilder from "@axe-core/playwright";\nexport const a = AxeBuilder;\n`,
    };
    for (const s of Object.values(sembrados)) archivos[s.ruta] = s.texto;
    const raiz = crearArbol(archivos);
    const { archivos: vistos, hallazgos } = analizarCarpetas(raiz);
    expect(vistos).not.toContain("tests/e2e/muestra/configuracion-interfaz.ts");
    expect(vistos).toContain("tests/e2e/muestra/limpio.spec.ts");
    expect([...new Set(hallazgos.map((h) => h.archivo))].sort()).toEqual(
      Object.values(sembrados)
        .map((s) => s.ruta)
        .sort(),
    );
  });

  it("el mismo contenido de configuracion-interfaz.ts en otro archivo sí falla", () => {
    expect(
      reglasDe(
        "tests/e2e/muestra/otro.ts",
        `import AxeBuilder from "@axe-core/playwright";\nexport const a = AxeBuilder;\n`,
      ),
    ).toContain("importación de axe");
  });
});

describe("PRUEBA-036 · cada forma prohibida se detecta", () => {
  const prohibidas: Array<[string, string, string, string?]> = [
    [
      "testInfo.fail() dentro de la prueba",
      `import { test } from "@playwright/test";
test("x", async ({}, testInfo) => { testInfo.fail(); });
`,
      "prueba marcada como fallo esperado",
    ],
    [
      "test.info().fail()",
      `import { test } from "@playwright/test";
test("x", async () => { test.info().fail(); });
`,
      "prueba marcada como fallo esperado",
    ],
    [
      "desestructurar skip de test",
      `import { test } from "@playwright/test";
const { skip } = test;
skip("x", () => {});
`,
      "prueba saltada o aislada",
    ],
    [
      "expect.fail donde expect es un alias de test (m-a)",
      `import { test as expect } from "@playwright/test";
expect.fail("x");
`,
      "prueba marcada como fallo esperado",
    ],
    [
      "assert.fail donde assert es un alias de test (m-a)",
      `import { test as assert } from "@playwright/test";
assert.fail("x");
`,
      "prueba marcada como fallo esperado",
    ],
    [
      "const expect = test y expect.fail (m-a)",
      `import { test } from "@playwright/test";
const expect = test;
expect.fail("x");
`,
      "prueba marcada como fallo esperado",
    ],
    [
      "desestructurar fail de test (m-b)",
      `import { test } from "@playwright/test";
const { fail } = test;
fail("x", () => {});
`,
      "prueba marcada como fallo esperado",
    ],
    [
      "desestructurar fails de it (m-b)",
      `import { it } from "vitest";
const { fails } = it;
fails("x", () => {});
`,
      "prueba marcada como fallo esperado",
    ],
    [
      "desestructurar anidado fail de test (m-b)",
      `import { test } from "@playwright/test";
const { info: { fail } } = test;
fail();
`,
      "prueba marcada como fallo esperado",
    ],
    [
      "test.describe.configure con retries",
      `import { test } from "@playwright/test";
test.describe.configure({ retries: 3 });
`,
      "reintentos que enmascaran fallos",
    ],
    [
      "violations.filter en un archivo .cts",
      `export const f = (violations: unknown[]) => violations.filter(Boolean);
`,
      "filtro sobre las infracciones",
      "tests/e2e/muestra/x.cts",
    ],
    [
      "it.skip en un archivo .cjs",
      `const { it } = require("vitest");
it.skip("x", () => {});
`,
      "prueba saltada o aislada",
      "tests/e2e/muestra/x.cjs",
    ],
    [
      "it.skip en un archivo .jsx",
      `import { it } from "vitest";
it.skip("x", () => {});
`,
      "prueba saltada o aislada",
      "tests/e2e/muestra/x.jsx",
    ],
    [
      "importación dinámica de axe",
      `export const a = () => import("@axe-core/playwright");\n`,
      "importación de axe",
    ],
    [
      "require de axe-core",
      `const a = require("axe-core");\nexport default a;\n`,
      "importación de axe",
    ],
    ["reexportación de axe", `export * from "@axe-core/playwright";\n`, "importación de axe"],
    [
      "importación de axe-core con ruta interna",
      `import "axe-core/axe.min.js";\n`,
      "importación de axe",
    ],
    [
      "it.skip",
      `import { it } from "vitest";\nit.skip("x", () => {});\n`,
      "prueba saltada o aislada",
    ],
    [
      "test.only",
      `import { test } from "@playwright/test";\ntest.only("x", () => {});\n`,
      "prueba saltada o aislada",
    ],
    [
      "test.fixme",
      `import { test } from "@playwright/test";\ntest.fixme("x", () => {});\n`,
      "prueba saltada o aislada",
    ],
    [
      "test.fixme dentro del cuerpo",
      `import { test } from "@playwright/test";\ntest("x", () => { test.fixme(); });\n`,
      "prueba saltada o aislada",
    ],
    [
      "describe.skip",
      `import { describe } from "vitest";\ndescribe.skip("x", () => {});\n`,
      "prueba saltada o aislada",
    ],
    [
      "test.describe.skip",
      `import { test } from "@playwright/test";\ntest.describe.skip("x", () => {});\n`,
      "prueba saltada o aislada",
    ],
    [
      "it.skipIf",
      `import { it } from "vitest";\nit.skipIf(true)("x", () => {});\n`,
      "prueba saltada o aislada",
    ],
    [
      "it.runIf",
      `import { it } from "vitest";\nit.runIf(false)("x", () => {});\n`,
      "prueba saltada o aislada",
    ],
    ["it.todo", `import { it } from "vitest";\nit.todo("x");\n`, "prueba saltada o aislada"],
    [
      "it.each(...).skip",
      `import { it } from "vitest";\nit.each([1]).skip("x", () => {});\n`,
      "prueba saltada o aislada",
    ],
    [
      "acceso con corchetes",
      `import { it } from "vitest";\nit["skip"]("x", () => {});\n`,
      "prueba saltada o aislada",
    ],
    [
      "skip en el contexto de la prueba",
      `import { it } from "vitest";\nit("x", (t) => { t.skip(); });\n`,
      "prueba saltada o aislada",
    ],
    ["xit", `xit("x", () => {});\n`, "prueba saltada o aislada"],
    ["fdescribe", `fdescribe("x", () => {});\n`, "prueba saltada o aislada"],
    [
      "test.fail",
      `import { test } from "@playwright/test";\ntest.fail("x", () => {});\n`,
      "prueba marcada como fallo esperado",
    ],
    [
      "it.fails",
      `import { it } from "vitest";\nit.fails("x", () => {});\n`,
      "prueba marcada como fallo esperado",
    ],
    [
      "test con otro nombre local",
      `import { test as prueba } from "@playwright/test";\nprueba.fail("x", () => {});\n`,
      "prueba marcada como fallo esperado",
    ],
    [
      "violations.filter",
      `export const f = (r: { violations: unknown[] }) => r.violations.filter(Boolean);\n`,
      "filtro sobre las infracciones",
    ],
    [
      "violations.slice",
      `export const f = (violations: unknown[]) => violations.slice(1);\n`,
      "filtro sobre las infracciones",
    ],
    [
      "violations.pop",
      `export const f = (violations: unknown[]) => violations.pop();\n`,
      "filtro sobre las infracciones",
    ],
    [
      "infracciones.filter",
      `export const f = (infracciones: unknown[]) => infracciones.filter(Boolean);\n`,
      "filtro sobre las infracciones",
    ],
    [
      "asignación a violations",
      `export const f = (r: { violations: unknown[] }) => { r.violations = []; };\n`,
      "filtro sobre las infracciones",
    ],
    [
      "violations.length = 0",
      `export const f = (violations: unknown[]) => { violations.length = 0; };\n`,
      "filtro sobre las infracciones",
    ],
    [
      "delete de violations",
      `export const f = (r: { violations?: unknown[] }) => { delete r.violations; };\n`,
      "filtro sobre las infracciones",
    ],
    [
      "disableRules",
      `export const f = (b: { disableRules(r: string): unknown }) => b.disableRules("x");\n`,
      "regla desactivada o elemento excluido",
    ],
    [
      "exclude de un elemento",
      `export const f = (b: { exclude(s: string): unknown }) => b.exclude(".logo");\n`,
      "regla desactivada o elemento excluido",
    ],
    [
      "include de un elemento",
      `export const f = (b: { include(s: string): unknown }) => b.include("main");\n`,
      "regla desactivada o elemento excluido",
    ],
    [
      "options con reglas",
      `export const f = (b: { options(o: unknown): unknown }) => b.options({});\n`,
      "regla desactivada o elemento excluido",
    ],
    [
      "enabled: false",
      `export const o = { rules: { "color-contrast": { enabled: false } } };\n`,
      "regla desactivada o elemento excluido",
    ],
    [
      '"enabled": false con comillas',
      `export const o = { rules: { x: { "enabled": false } } };\n`,
      "regla desactivada o elemento excluido",
    ],
  ];

  it.each(prohibidas)("%s", (_nombre, texto, regla, ruta = "tests/e2e/muestra/x.spec.ts") => {
    expect(reglasDe(ruta, texto)).toContain(regla);
  });

  it("las extensiones .cjs, .cts y .jsx entran en el recorrido de carpetas", () => {
    const raiz = crearArbol({
      "tests/e2e/muestra/a.cjs": `const { it } = require("vitest");
it.skip("x", () => {});
`,
      "tests/e2e/muestra/b.cts": `import { it } from "vitest";
it.only("x", () => {});
`,
      "tests/e2e/muestra/c.jsx": `import { it } from "vitest";
it.todo("x");
`,
    });
    const { archivos, hallazgos } = analizarCarpetas(raiz);
    expect(archivos).toEqual([
      "tests/e2e/muestra/a.cjs",
      "tests/e2e/muestra/b.cts",
      "tests/e2e/muestra/c.jsx",
    ]);
    expect(new Set(hallazgos.map((h) => h.archivo)).size).toBe(3);
  });
});

describe("PRUEBA-036 · lo legítimo no falla (control positivo)", () => {
  const legitimas: Array<[string, string]> = [
    [
      "una prueba normal",
      `import { expect, it } from "vitest";\nit("ok", () => { expect(1).toBe(1); });\n`,
    ],
    [
      "expect.fail",
      `import { expect } from "vitest";\nexport const f = () => expect.fail("motivo");\n`,
    ],
    [
      "assert.fail de chai/vitest importado con su nombre",
      `import { assert } from "vitest";
export const f = () => assert.fail("motivo");
`,
    ],
    [
      "const { fail } = expect (aserción real)",
      `import { expect } from "vitest";
export const { fail } = expect;
`,
    ],
    ["it.each", `import { it } from "vitest";\nit.each([1, 2])("x %s", () => {});\n`],
    [
      "las palabras vetadas solo en cadenas y comentarios",
      `// it.skip y violations.filter y disableRules\nexport const t = "test.only(@axe-core/playwright) enabled: false";\nexport const u = \`import axe from "axe-core"\`;\n`,
    ],
    [
      "violations solo para comprobar que está vacía",
      `export const f = (violations: unknown[]) => violations.length === 0;\n`,
    ],
    ["filter sobre otra lista", `export const f = (a: number[]) => a.filter((x) => x > 1);\n`],
    [
      "importación dinámica con texto no literal (límite conocido: no se evalúa)",
      `export const a = (n: string) => import(n);
`,
    ],
    ["enabled: true", `export const o = { enabled: true };\n`],
  ];
  it.each(legitimas)("%s", (_nombre, texto) => {
    expect(reglasDe("tests/unit/diseno/x.test.ts", texto)).toEqual([]);
  });
});

describe("PRUEBA-036 · los archivos de pruebas de verdad", () => {
  it("tests/e2e y tests/unit/diseno, fuera de los archivos exentos, no tienen ningún hallazgo", () => {
    const { archivos, hallazgos } = analizarCarpetas(RAIZ);
    expect(hallazgos).toEqual([]);
    // La comprobación se ve a sí misma: no está vacía ni se salta a sus propios archivos.
    expect(archivos).toContain("tests/e2e/arranque.spec.ts");
    expect(archivos).toContain("tests/unit/diseno/estatica-pruebas.test.ts");
    expect(archivos).toContain("tests/unit/diseno/apoyo/estatica.ts");
  });

  it("los exentos son solo tres de los cinco archivos protegidos que caen en estas carpetas", () => {
    expect([...ARCHIVOS_EXENTOS].sort()).toEqual([
      "tests/e2e/muestra/configuracion-interfaz.ts",
      "tests/unit/diseno/excepciones.ts",
      "tests/unit/diseno/paquetes-de-cliente.ts",
    ]);
  });
});
