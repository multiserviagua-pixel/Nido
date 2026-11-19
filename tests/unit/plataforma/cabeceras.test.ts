import { describe, expect, it } from "vitest";

type Cabecera = { key: string; value: string };
type Regla = { source: string; headers: Cabecera[] };

async function reglas(): Promise<{ regla: Regla[]; poweredByHeader: unknown }> {
  const modulo = (await import("../../../next.config")) as {
    default: { headers?: () => Promise<Regla[]>; poweredByHeader?: unknown };
  };
  const config = modulo.default;
  if (typeof config.headers !== "function") throw new Error("next.config.ts no define headers()");
  return { regla: await config.headers(), poweredByHeader: config.poweredByHeader };
}

// Aplica las reglas en orden: una posterior que coincida sustituye la misma clave (como Next.js).
function efectivas(regla: Regla[], ruta: string): Map<string, string> {
  const salida = new Map<string, string>();
  for (const r of regla) {
    const coincide = r.source === "/:path*" || r.source === ruta;
    if (!coincide) continue;
    for (const c of r.headers) salida.set(c.key, c.value);
  }
  return salida;
}

const esperadas: Record<string, string> = {
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "no-referrer",
  "X-Frame-Options": "DENY",
  "Content-Security-Policy": "frame-ancestors 'none'",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
  "X-Robots-Tag": "noindex",
};

describe("cabeceras de next.config.ts", () => {
  it("desactiva X-Powered-By", async () => {
    expect((await reglas()).poweredByHeader).toBe(false);
  });

  it("todas las rutas llevan las cabeceras de App base", async () => {
    const { regla } = await reglas();
    const efecto = efectivas(regla, "/api/salud");
    expect(Object.fromEntries(efecto)).toEqual(esperadas);
  });

  it("/oauth/autorizar usa Referrer-Policy same-origin y conserva el resto", async () => {
    const { regla } = await reglas();
    const efecto = efectivas(regla, "/oauth/autorizar");
    expect(Object.fromEntries(efecto)).toEqual({ ...esperadas, "Referrer-Policy": "same-origin" });
  });

  it("no declara HSTS (lo pone la plataforma)", async () => {
    const { regla } = await reglas();
    const claves = regla.flatMap((r) => r.headers.map((c) => c.key.toLowerCase()));
    expect(claves).not.toContain("strict-transport-security");
  });
});
