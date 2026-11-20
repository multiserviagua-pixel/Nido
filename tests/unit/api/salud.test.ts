import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import * as ruta from "../../../src/app/api/salud/route";

const url = "http://localhost/api/salud?q=TEXTO-CANARIO-123";

describe("/api/salud (PRUEBA-025 y 044, partes L)", () => {
  beforeEach(() => {
    vi.stubEnv("ENTORNO", "desarrollo");
    for (const n of [
      "SUPERVISION_DSN",
      "COMMIT_DESPLEGADO",
      "VERCEL",
      "VERCEL_ENV",
      "VERCEL_REGION",
      "VERCEL_URL",
    ]) {
      vi.stubEnv(n, undefined);
    }
  });
  afterEach(() => vi.unstubAllEnvs());

  it("GET: 200, cuerpo exacto de un solo campo y no-store", async () => {
    const r = await ruta.GET(new Request(url));
    expect(r.status).toBe(200);
    expect(r.headers.get("cache-control")).toBe("no-store");
    const texto = await r.text();
    expect(texto).toBe('{"estado":"ok"}');
    expect(Object.keys(JSON.parse(texto))).toEqual(["estado"]);
  });

  it("HEAD: 200 sin cuerpo y no-store", async () => {
    const r = await ruta.HEAD(new Request(url, { method: "HEAD" }));
    expect(r.status).toBe(200);
    expect(r.headers.get("cache-control")).toBe("no-store");
    expect(await r.text()).toBe("");
  });

  it("no lee la petición", async () => {
    const r = await ruta.GET(undefined as unknown as Request);
    expect(r.status).toBe(200);
  });

  it.each(["POST", "PUT", "PATCH", "DELETE", "OPTIONS"] as const)("%s: 405", async (metodo) => {
    const r = await ruta[metodo](new Request(url, { method: metodo, body: "x" }));
    expect(r.status).toBe(405);
    expect(r.headers.get("allow")).toBe("GET, HEAD");
    expect(r.headers.get("cache-control")).toBe("no-store");
    expect(await r.text()).not.toContain("TEXTO-CANARIO-123");
  });
});
