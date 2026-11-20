import { defineConfig } from "@playwright/test";

// Pruebas en navegador sobre la compilación servida en local (diseño 020, T-002).
// Sin reintentos: una prueba intermitente es un fallo, no se oculta (artículo 13).
// Los navegadores y su suma llegan en T-020; aquí solo se usa el que haya instalado.
const puerto = 3100;

export default defineConfig({
  testDir: "tests/e2e",
  retries: 0,
  // Fuera de lo que vigilan prettier, eslint y git (node_modules ya está ignorado en los tres).
  outputDir: "node_modules/.playwright-resultados",
  forbidOnly: true,
  fullyParallel: false,
  reporter: [["list"]],
  use: { baseURL: `http://127.0.0.1:${puerto}` },
  webServer: {
    // Sin lanzador externo: la orden se ejecuta con `npm run navegador`, que pone node_modules/.bin en el PATH.
    // ENTORNO se fija al compilar y al servir: se compila aquí dentro (mismo `env`) para que
    // ambos pasos vean el mismo valor, también en Windows.
    command: `next build && next start --hostname 127.0.0.1 --port ${puerto}`,
    url: `http://127.0.0.1:${puerto}`,
    reuseExistingServer: false,
    timeout: 300_000,
    env: { ENTORNO: "preproduccion", NEXT_TELEMETRY_DISABLED: "1" },
  },
});
