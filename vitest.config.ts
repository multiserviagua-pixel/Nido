import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  // El mismo alias que `paths` de tsconfig.json (`@/*` → `./src/*`); 020 T-005, decisión D-036.
  resolve: {
    alias: [{ find: /^@\//, replacement: fileURLToPath(new URL("./src/", import.meta.url)) }],
  },
  test: {
    include: ["tests/**/*.test.{ts,tsx}", "supabase/tests/pglite/**/*.test.ts"],
    passWithNoTests: false,
    allowOnly: false,
    environment: "node",
    setupFiles: ["tests/conector/apoyo/sin-red-real.ts"],
    // Holgura para la contención de CPU con todos los archivos a la vez (T-103).
    testTimeout: 30000,
    hookTimeout: 30000,
  },
});
