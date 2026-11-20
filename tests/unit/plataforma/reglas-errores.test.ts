import { ESLint } from "eslint";
import { beforeAll, describe, expect, it } from "vitest";

const eslint = new ESLint({ overrideConfigFile: "eslint.config.mjs" });

// La primera lintText en frío tarda varios segundos: se calienta aquí con plazo propio.
beforeAll(async () => {
  await eslint.lintText("export const a = 1;", { filePath: "src/lib/otro/uso.ts" });
}, 30_000);

async function saltan(codigo: string, archivo = "src/lib/otro/uso.ts"): Promise<string[]> {
  const [r] = await eslint.lintText(codigo, { filePath: archivo });
  return (r?.messages ?? []).filter((m) => m.severity === 2).map((m) => m.ruleId ?? "");
}

describe("regla de Umbrales: new Error no literal o throw de otra cosa que ErrorDeAplicacion", () => {
  const prohibidos: Array<[string, string]> = [
    ["17. throw new Error(variable)", "export function f(v: string) { throw new Error(v); }\n"],
    ["18. throw de una cadena", 'export function f() { throw "x"; }\n'],
    ["19. throw new TypeError()", "export function f() { throw new TypeError(); }\n"],
    ["20. throw new Error con literal", 'export function f() { throw new Error("x"); }\n'],
    ["21. new Error con plantilla", "export const e = (v: string) => new Error(`a ${v}`);\n"],
    ["22. Error(variable) sin new", "export const e = (v: string) => Error(v);\n"],
    [
      "23. relanzar lo capturado",
      "declare function g(): void;\nexport function f() { try { g(); } catch (e) { throw e; } }\n",
    ],
  ];
  for (const [nombre, codigo] of prohibidos) {
    it(nombre, async () => expect(await saltan(codigo)).toContain("no-restricted-syntax"));
  }

  it("24. en entrada.ts también (sobrescribe no-restricted-syntax)", async () => {
    const r = await saltan(
      "export function f(v: string) { throw new Error(v); }\n",
      "src/lib/plataforma/entrada.ts",
    );
    expect(r).toContain("no-restricted-syntax");
  });

  const permitidos: Array<[string, string, string?]> = [
    [
      "throw new ErrorDeAplicacion(...)",
      'declare class ErrorDeAplicacion { constructor(c: string); }\nexport function f() { throw new ErrorDeAplicacion("entrada_invalida"); }\n',
    ],
    ["new Error con literal como valor", 'export const e = new Error("fijo");\n'],
    [
      "definición en errores.ts",
      "export class ErrorDeAplicacion extends Error { constructor(c: string) { super(c); } }\n",
      "src/lib/plataforma/errores.ts",
    ],
    [
      "new URL y JSON.parse en entrada.ts",
      'export const a = new URL("http://a");\nexport const b = JSON.parse("{}");\n',
      "src/lib/plataforma/entrada.ts",
    ],
  ];
  for (const [nombre, codigo, archivo] of permitidos) {
    it(`permite ${nombre}`, async () => expect(await saltan(codigo, archivo)).toEqual([]));
  }
});
