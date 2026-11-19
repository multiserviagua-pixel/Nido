import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";
import { defineConfig, globalIgnores } from "eslint/config";

export default defineConfig([
  ...nextVitals,
  ...nextTypescript,
  globalIgnores([
    ".next/**",
    "node_modules/**",
    "coverage/**",
    "out/**",
    "dist/**",
    "next-env.d.ts",
  ]),
]);
