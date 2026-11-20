import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";
import security from "eslint-plugin-security";
import { defineConfig, globalIgnores } from "eslint/config";

// Umbrales de diseño §Batería. Los cuatro detectores de eslint-plugin-security
// que quedan fuera son los que el diseño excluye por ruido.
const seguridad = security.configs.recommended;
const comoError = Object.fromEntries(Object.keys(seguridad.rules).map((regla) => [regla, "error"]));
const sinRuido = {
  "security/detect-object-injection": "off",
  "security/detect-non-literal-fs-filename": "off",
  "security/detect-non-literal-regexp": "off",
  "security/detect-possible-timing-attacks": "off",
};

// runtime = 'edge' en cualquiera de sus formas: literal, `as const`/`satisfies`,
// plantilla y exportado por separado (`export { runtime }`).
const sintaxisEdge = [
  {
    selector: "ExportNamedDeclaration VariableDeclarator[id.name='runtime'][init.value='edge']",
    message: "runtime = 'edge' no se admite: todo corre en Node (arn1).",
  },
  {
    selector:
      "ExportNamedDeclaration VariableDeclarator[id.name='runtime'][init.expression.value='edge']",
    message: "runtime = 'edge' no se admite: todo corre en Node (arn1).",
  },
  {
    selector:
      "ExportNamedDeclaration VariableDeclarator[id.name='runtime'][init.type='TemplateLiteral'][init.quasis.0.value.cooked='edge']",
    message: "runtime = 'edge' no se admite: todo corre en Node (arn1).",
  },
  {
    selector: "ExportSpecifier[exported.name='runtime']",
    message: "No se reexporta runtime: se declara en el propio export y no puede ser 'edge'.",
  },
  {
    selector: "ExportNamedDeclaration VariableDeclarator[id.name='preferredRegion']",
    message: "preferredRegion no se admite: la región se fija en vercel.json.",
  },
  {
    selector: "ExportSpecifier[exported.name='preferredRegion']",
    message: "preferredRegion no se admite: la región se fija en vercel.json.",
  },
];
const sintaxisUrl = {
  selector: "NewExpression[callee.name='URL']",
  message: "new URL solo en src/lib/plataforma/entrada.ts.",
};
const sintaxisJsonGlobal = {
  selector:
    "MemberExpression[property.name='parse'][object.type='MemberExpression'][object.object.name='globalThis'][object.property.name='JSON']",
  message: "JSON.parse solo en src/lib/plataforma/entrada.ts.",
};
// Errores (diseño §App base, punto 2): solo se lanza `ErrorDeAplicacion(codigo)`; `Error`
// solo con argumento literal y como valor, nunca lanzado.
const sintaxisErrores = [
  {
    selector: "ThrowStatement > :not(NewExpression[callee.name='ErrorDeAplicacion'])",
    message: "throw solo de new ErrorDeAplicacion(codigo).",
  },
  {
    selector: "NewExpression[callee.name='Error'] > .arguments:not(Literal)",
    message: "new Error solo con argumento literal.",
  },
  {
    selector: "CallExpression[callee.name='Error'] > .arguments:not(Literal)",
    message: "Error() solo con argumento literal.",
  },
];
const propiedadesEnv = {
  object: "process",
  property: "env",
  message: "process.env solo en src/lib/plataforma/configuracion.ts.",
};
const propiedadesJson = {
  object: "JSON",
  property: "parse",
  message: "JSON.parse solo en src/lib/plataforma/entrada.ts.",
};
const propiedadesUrl = {
  object: "URL",
  property: "parse",
  message: "URL.parse solo en src/lib/plataforma/entrada.ts.",
};
const importacionesEnv = {
  paths: ["node:process", "process"].map((name) => ({
    name,
    importNames: ["env"],
    message: "process.env solo en src/lib/plataforma/configuracion.ts.",
  })),
};

// Límite conocido: el proxy.ts de la raíz (Next 16) queda fuera de src/**, así que se
// incluye explícitamente para que las mismas reglas lo cubran cuando exista.
const alcance = ["src/**", "proxy.ts"];

export default defineConfig([
  ...nextVitals,
  ...nextTypescript,
  {
    ...seguridad,
    files: alcance,
    linterOptions: { noInlineConfig: true, reportUnusedDisableDirectives: "error" },
    rules: { ...comoError, ...sinRuido },
  },
  {
    files: alcance,
    linterOptions: { noInlineConfig: true, reportUnusedDisableDirectives: "error" },
    rules: {
      "no-eval": "error",
      "no-implied-eval": "error",
      "no-new-func": "error",
      "no-script-url": "error",
      "react/no-danger": "error",
      "@typescript-eslint/ban-ts-comment": "error",
      "no-console": "error",
      "no-restricted-properties": ["error", propiedadesEnv, propiedadesJson, propiedadesUrl],
      "no-restricted-imports": ["error", importacionesEnv],
      "no-restricted-syntax": [
        "error",
        ...sintaxisEdge,
        ...sintaxisErrores,
        sintaxisUrl,
        sintaxisJsonGlobal,
      ],
    },
  },
  {
    files: ["src/lib/plataforma/configuracion.ts"],
    rules: {
      "no-restricted-properties": ["error", propiedadesJson, propiedadesUrl],
      "no-restricted-imports": "off",
    },
  },
  {
    files: ["src/lib/registro/**"],
    rules: { "no-console": "off" },
  },
  {
    files: ["src/lib/plataforma/entrada.ts"],
    rules: {
      "no-restricted-properties": ["error", propiedadesEnv],
      "no-restricted-syntax": ["error", ...sintaxisEdge, ...sintaxisErrores],
    },
  },
  globalIgnores([
    ".next/**",
    "node_modules/**",
    "coverage/**",
    "out/**",
    "dist/**",
    "next-env.d.ts",
  ]),
]);
