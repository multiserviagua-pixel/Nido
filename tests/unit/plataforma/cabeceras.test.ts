import { createRequire } from "node:module";
import { describe, expect, it } from "vitest";

// Mismo path-to-regexp que usa Next.js para los `source` de headers() (sin tipos publicados).
const pathToRegexp = createRequire(import.meta.url)("next/dist/compiled/path-to-regexp") as {
  pathToRegexp: (ruta: string) => RegExp;
};
const coincideRuta = (source: string, ruta: string): boolean =>
  pathToRegexp.pathToRegexp(source).test(ruta);

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

// Aplica las reglas en orden: una posterior que coincida sustituye la misma clave (como Next.js). El
// `source` se compila con el mismo path-to-regexp que usa Next.js (incluidas las exclusiones con `(?!…)`).
function efectivas(regla: Regla[], ruta: string): Map<string, string> {
  const salida = new Map<string, string>();
  for (const r of regla) {
    const coincide = coincideRuta(r.source, ruta);
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

  it("/oauth/autorizar usa Referrer-Policy same-origin, conserva el resto y no lleva la CSP global (C-4)", async () => {
    const { regla } = await reglas();
    const sinCsp = Object.fromEntries(
      Object.entries(esperadas).filter(([k]) => k !== "Content-Security-Policy"),
    );
    for (const ruta of ["/oauth/autorizar", "/oauth/autorizar/"]) {
      const efecto = efectivas(regla, ruta);
      expect(Object.fromEntries(efecto), ruta).toEqual({
        ...sinCsp,
        "Referrer-Policy": "same-origin",
      });
    }
  });

  it("la exclusión es exacta: cualquier otra ruta, también bajo /oauth, lleva las globales", async () => {
    const { regla } = await reglas();
    for (const ruta of [
      "/",
      "/oauth/registro",
      "/oauth/token",
      "/oauth/autorizarx",
      "/oauth/autorizar/x",
      "/api/mcp",
    ]) {
      expect(Object.fromEntries(efectivas(regla, ruta)), ruta).toEqual(esperadas);
    }
  });

  it("ninguna ruta recibe dos veces la misma cabecera (la global y la de /oauth/autorizar no se suman)", async () => {
    const { regla } = await reglas();
    for (const ruta of ["/oauth/autorizar", "/oauth/autorizar/", "/api/salud", "/oauth/registro"]) {
      const aplicadas = regla
        .filter((r) => coincideRuta(r.source, ruta))
        .flatMap((r) => r.headers.map((c) => c.key));
      expect(new Set(aplicadas).size, ruta).toBe(aplicadas.length);
    }
  });

  it("no declara HSTS (lo pone la plataforma)", async () => {
    const { regla } = await reglas();
    const claves = regla.flatMap((r) => r.headers.map((c) => c.key.toLowerCase()));
    expect(claves).not.toContain("strict-transport-security");
  });
});
