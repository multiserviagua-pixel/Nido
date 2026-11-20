import { ESLint } from "eslint";
import { beforeAll, describe, expect, it } from "vitest";

const eslint = new ESLint({ overrideConfigFile: "eslint.config.mjs" });

async function reglasQueSaltan(codigo: string, archivo: string): Promise<string[]> {
  const [resultado] = await eslint.lintText(codigo, { filePath: archivo });
  return (resultado?.messages ?? []).filter((m) => m.severity === 2).map((m) => m.ruleId ?? "");
}

const dentro = "src/lib/otro/uso.ts";

// El primer lintText carga el programa de tipos y el complemento de TypeScript, y con la máquina cargada
// supera los 5000 ms por defecto. Se calienta aquí, con plazo propio, y no se toca el plazo global.
beforeAll(async () => {
  await eslint.lintText("export const calentar = 1;\n", { filePath: dentro });
}, 60_000);

describe("reglas de Umbrales en eslint.config.mjs (negativas)", () => {
  it("1. process.env fuera de configuracion.ts", async () => {
    const r = await reglasQueSaltan("export const a = process.env.X;\n", dentro);
    expect(r).toContain("no-restricted-properties");
  });
  it("2. console fuera de src/lib/registro/", async () => {
    expect(await reglasQueSaltan("console.log(1);\n", dentro)).toContain("no-console");
  });
  it("3. runtime = 'edge'", async () => {
    const r = await reglasQueSaltan("export const runtime = 'edge';\n", "src/app/x/route.ts");
    expect(r).toContain("no-restricted-syntax");
  });
  it("4. preferredRegion", async () => {
    const r = await reglasQueSaltan(
      "export const preferredRegion = 'iad1';\n",
      "src/app/x/route.ts",
    );
    expect(r).toContain("no-restricted-syntax");
  });
  it("5. JSON.parse fuera de entrada.ts", async () => {
    const r = await reglasQueSaltan("export const a = JSON.parse('{}');\n", dentro);
    expect(r).toContain("no-restricted-properties");
  });
  it("6. new URL fuera de entrada.ts", async () => {
    const r = await reglasQueSaltan("export const a = new URL('http://a');\n", dentro);
    expect(r).toContain("no-restricted-syntax");
  });
  it("7. regla de eslint-plugin-security (detect-child-process)", async () => {
    const r = await reglasQueSaltan(
      "const cp = require('child_process');\ncp.exec(process.argv[2]);\n",
      dentro,
    );
    expect(r).toContain("security/detect-child-process");
  });
  it("8. ban-ts-comment", async () => {
    const r = await reglasQueSaltan("// @ts-ignore\nexport const a: number = 1;\n", dentro);
    expect(r).toContain("@typescript-eslint/ban-ts-comment");
  });
});

describe("reglas de Umbrales: negativas de cierre de huecos", () => {
  const ruta = "src/app/x/route.ts";
  const casos: Array<[string, string[], string, string]> = [
    [
      "9. disable-next-line no vale",
      ["// eslint-disable-next-line no-restricted-properties", "export const a = process.env.X;"],
      dentro,
      "no-restricted-properties",
    ],
    [
      "10. runtime = 'edge' as const",
      ['export const runtime = "edge" as const;'],
      ruta,
      "no-restricted-syntax",
    ],
    ["11. runtime = plantilla", ["export const runtime = `edge`;"], ruta, "no-restricted-syntax"],
    [
      "12. runtime = 'edge' satisfies string",
      ['export const runtime = "edge" satisfies string;'],
      ruta,
      "no-restricted-syntax",
    ],
    [
      "13. runtime exportado aparte",
      ['const runtime = "edge";', "export { runtime };"],
      ruta,
      "no-restricted-syntax",
    ],
    [
      "14. import { env } de node:process",
      ['import { env } from "node:process";', "export const a = env.X;"],
      dentro,
      "no-restricted-imports",
    ],
    [
      "15. globalThis.JSON.parse",
      ["export const a = globalThis.JSON.parse('{}');"],
      dentro,
      "no-restricted-syntax",
    ],
    [
      "16. URL.parse",
      ["export const a = URL.parse('http://a');"],
      dentro,
      "no-restricted-properties",
    ],
    [
      "17. process.env en proxy.ts de la raíz",
      ["export const a = process.env.X;"],
      "proxy.ts",
      "no-restricted-properties",
    ],
  ];
  for (const [nombre, lineas, archivo, regla] of casos) {
    it(nombre, async () => {
      expect(await reglasQueSaltan(lineas.join("\n") + "\n", archivo)).toContain(regla);
    });
  }
  it("un disable queda ignorado y se avisa (con --max-warnings 0 falla)", async () => {
    const codigo = "// eslint-disable-next-line no-console\nexport const a = 1;\n";
    const [resultado] = await eslint.lintText(codigo, { filePath: dentro });
    const textos = (resultado?.messages ?? []).map((m) => m.message);
    expect(textos.some((t) => t.includes("noInlineConfig"))).toBe(true);
  });
});

describe("reglas de Umbrales: conjunto efectivo en src/**", () => {
  it("coincide con el esperado", async () => {
    const config = await eslint.calculateConfigForFile("src/lib/otro/uso.ts");
    const reglas = config.rules ?? {};
    const nivel = (r: string): number | string => {
      const v = reglas[r];
      const n = Array.isArray(v) ? v[0] : v;
      return n === "error" ? 2 : n === "off" ? 0 : (n as number | string);
    };
    const apagadas = [
      "security/detect-object-injection",
      "security/detect-non-literal-fs-filename",
      "security/detect-non-literal-regexp",
      "security/detect-possible-timing-attacks",
    ];
    const deSeguridad = Object.keys(reglas).filter((r) => r.startsWith("security/"));
    expect(deSeguridad).toHaveLength(15);
    expect(deSeguridad.filter((r) => nivel(r) === 0).sort()).toEqual([...apagadas].sort());
    expect(deSeguridad.filter((r) => nivel(r) === 2)).toHaveLength(11);
    for (const r of [
      "no-eval",
      "no-implied-eval",
      "no-new-func",
      "no-script-url",
      "react/no-danger",
      "@typescript-eslint/ban-ts-comment",
    ]) {
      expect(nivel(r), r).toBe(2);
    }
    expect(config.linterOptions?.noInlineConfig).toBe(true);
    expect(config.linterOptions?.reportUnusedDisableDirectives).toBe(2); // ESLint normaliza "error" a 2
  });
  it("con noInlineConfig una directiva eslint-disable se reporta como aviso (falla con --max-warnings 0)", async () => {
    const [resultado] = await eslint.lintText(
      "/* eslint-disable no-console */\nexport const a = 1;\n",
      { filePath: dentro },
    );
    const avisos = (resultado?.messages ?? []).filter((m) => m.ruleId === null);
    expect(avisos).toHaveLength(1);
    expect(avisos[0]?.message).toContain("has no effect");
    // No comprueba reportUnusedDisableDirectives (eso lo fija el toBe(2) de la prueba anterior): comprueba que, con
    // noInlineConfig, la directiva se reporta como aviso (severidad 1) y `npm run estilo` usa --max-warnings 0.
    expect(resultado?.warningCount).toBe(1);
  });
});

describe("reglas de Umbrales: lugares permitidos", () => {
  it("process.env en configuracion.ts", async () => {
    expect(
      await reglasQueSaltan(
        "export const a = process.env.X;\n",
        "src/lib/plataforma/configuracion.ts",
      ),
    ).toEqual([]);
  });
  it("console en src/lib/registro/", async () => {
    expect(await reglasQueSaltan("console.log(1);\n", "src/lib/registro/registro.ts")).toEqual([]);
  });
  it("JSON.parse y new URL en entrada.ts", async () => {
    expect(
      await reglasQueSaltan(
        "export const a = JSON.parse('{}');\nexport const b = new URL('http://a');\n",
        "src/lib/plataforma/entrada.ts",
      ),
    ).toEqual([]);
  });
});

describe("src/mcp/entrada.ts: excepción de la regla de JSON.parse (T-105 h)", () => {
  it("JSON.parse sí en src/mcp/entrada.ts, y process.env y las demás reglas siguen vigentes", async () => {
    expect(
      await reglasQueSaltan("export const a = JSON.parse('{}');\n", "src/mcp/entrada.ts"),
    ).toEqual([]);
    expect(
      (await reglasQueSaltan("export const a = process.env.X;\n", "src/mcp/entrada.ts")).length,
    ).toBeGreaterThan(0);
    expect(
      (await reglasQueSaltan("export const a = JSON.parse('{}');\n", "src/mcp/servidor.ts")).length,
    ).toBeGreaterThan(0);
    expect(
      (await reglasQueSaltan("export const a = JSON.parse('{}');\n", "src/mcp/salida.ts")).length,
    ).toBeGreaterThan(0);
  });
});
