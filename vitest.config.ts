import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tests/**/*.test.{ts,tsx}", "supabase/tests/pglite/**/*.test.ts"],
    passWithNoTests: false,
    allowOnly: false,
    environment: "node",
  },
});
