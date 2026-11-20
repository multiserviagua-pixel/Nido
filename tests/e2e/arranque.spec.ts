import { expect, test } from "@playwright/test";

// Prueba mínima de arranque (020, T-002): la compilación se sirve en local y responde.
test("la página de inicio responde con el servicio en funcionamiento", async ({ page }) => {
  const respuesta = await page.goto("/");
  expect(respuesta?.status()).toBe(200);
  await expect(page.getByRole("heading", { level: 1, name: "Nido" })).toBeVisible();
  await expect(page.getByText("Servicio en funcionamiento")).toBeVisible();
});
