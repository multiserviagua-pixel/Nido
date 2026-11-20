// 020 T-004 (PRUEBA-024, control 1): `next.config.ts` solo añade la extensión `muestra.tsx` con
// `ENTORNO` exactamente `desarrollo` o `preproduccion`, leído a través de `configuracion.ts`
// (`leerEntorno`). Cierre en fallo: ausente, desconocido, `desarrollo` sin el predicado único o
// un fallo al leer la configuración dejan la muestra fuera y las extensiones por defecto intactas.
// Los cinco valores de PRUEBA-024 y el control positivo están en tests/unit/diseno/acceso-muestra.test.ts.
import { afterEach, describe, expect, it, vi } from "vitest";

const POR_DEFECTO = ["tsx", "ts", "jsx", "js"];
const CON_MUESTRA = [...POR_DEFECTO, "muestra.tsx"];

afterEach(() => {
  vi.unstubAllEnvs();
  vi.doUnmock("../../../src/lib/plataforma/configuracion");
  vi.resetModules();
});

async function leerEntorno(): Promise<string | undefined> {
  vi.resetModules();
  const modulo = await import("../../../src/lib/plataforma/configuracion");
  return modulo.leerEntorno();
}

async function extensiones(): Promise<unknown> {
  vi.resetModules();
  const modulo = (await import("../../../next.config")) as {
    default: { pageExtensions?: unknown };
  };
  return modulo.default.pageExtensions;
}

describe("configuracion: leerEntorno", () => {
  it.each(["preproduccion", "produccion"])("devuelve %s exacto", async (valor) => {
    vi.stubEnv("ENTORNO", valor);
    expect(await leerEntorno()).toBe(valor);
  });

  it("devuelve desarrollo con el predicado único (sin VERCEL*, NODE_ENV distinto de production)", async () => {
    vi.stubEnv("ENTORNO", "desarrollo");
    vi.stubEnv("NODE_ENV", "development");
    expect(await leerEntorno()).toBe("desarrollo");
  });

  it.each([
    undefined,
    "",
    "Produccion",
    "produccion ",
    "prod",
    "Desarrollo",
    " preproduccion",
    "PREPRODUCCION",
    "test",
  ])("ENTORNO=%j: undefined", async (valor) => {
    vi.stubEnv("ENTORNO", valor);
    expect(await leerEntorno()).toBeUndefined();
  });

  it("desarrollo con NODE_ENV=production (next build, next start): undefined", async () => {
    vi.stubEnv("ENTORNO", "desarrollo");
    vi.stubEnv("NODE_ENV", "production");
    expect(await leerEntorno()).toBeUndefined();
  });

  it.each(["VERCEL", "VERCEL_ENV", "VERCEL_GIT_COMMIT_SHA"])(
    "desarrollo con %s presente: undefined",
    async (nombre) => {
      vi.stubEnv("ENTORNO", "desarrollo");
      vi.stubEnv(nombre, "1");
      expect(await leerEntorno()).toBeUndefined();
    },
  );

  it("no exige el resto de variables: preproduccion sin DSN ni VERCEL sigue siendo preproduccion", async () => {
    vi.stubEnv("ENTORNO", "preproduccion");
    vi.stubEnv("SUPERVISION_DSN", undefined);
    vi.stubEnv("VERCEL", undefined);
    expect(await leerEntorno()).toBe("preproduccion");
  });
});

describe("next.config.ts: pageExtensions según ENTORNO (control 1)", () => {
  it("con preproduccion añade muestra.tsx a las extensiones por defecto", async () => {
    vi.stubEnv("ENTORNO", "preproduccion");
    expect(await extensiones()).toEqual(CON_MUESTRA);
  });

  it("con desarrollo (servidor de desarrollo) añade muestra.tsx", async () => {
    vi.stubEnv("ENTORNO", "desarrollo");
    vi.stubEnv("NODE_ENV", "development");
    expect(await extensiones()).toEqual(CON_MUESTRA);
  });

  it.each([undefined, "", "produccion", "Produccion", "prod", "desconocido"])(
    "ENTORNO=%j: solo las extensiones por defecto",
    async (valor) => {
      vi.stubEnv("ENTORNO", valor);
      expect(await extensiones()).toEqual(POR_DEFECTO);
    },
  );

  it("desarrollo en una compilación (NODE_ENV=production): sin la muestra", async () => {
    vi.stubEnv("ENTORNO", "desarrollo");
    vi.stubEnv("NODE_ENV", "production");
    expect(await extensiones()).toEqual(POR_DEFECTO);
  });

  it("si leer la configuración falla, la muestra no entra y next.config.ts carga igual", async () => {
    vi.stubEnv("ENTORNO", "preproduccion");
    vi.doMock("../../../src/lib/plataforma/configuracion", () => ({
      leerEntorno: () => {
        throw new Error("fallo sembrado");
      },
    }));
    expect(await extensiones()).toEqual(POR_DEFECTO);
  });

  it("si la configuración devuelve un valor fuera de la lista, la muestra no entra", async () => {
    vi.doMock("../../../src/lib/plataforma/configuracion", () => ({
      leerEntorno: () => "preproduccion ",
    }));
    expect(await extensiones()).toEqual(POR_DEFECTO);
  });

  it("next.config.ts no lee process.env: el entorno llega solo por configuracion.ts", async () => {
    const { readFileSync } = await import("node:fs");
    const { join } = await import("node:path");
    const fuente = readFileSync(
      join(import.meta.dirname, "..", "..", "..", "next.config.ts"),
      "utf8",
    );
    expect(fuente).not.toMatch(/process\s*\.\s*env|process\s*\[/);
    expect(fuente).toMatch(/from "\.\/src\/lib\/plataforma\/configuracion"/);
  });
});
