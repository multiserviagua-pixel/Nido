import { defineConfig } from "vitest/config";

export default defineConfig({
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
