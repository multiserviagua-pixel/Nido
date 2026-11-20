// 020 T-005 · unitaria propia de `comprobarAccesoMuestra()` (control 2 de la muestra; REQ-061,
// CA-046; PRUEBA-024 la recorre además en cada punto de entrada, en acceso-muestra.test.ts).
// Condiciones del auditor-seguridad (T-004): lee `Host` con `headers()` antes que nada; compara
// de forma exacta con la lista del código, que no lleva el dominio de producción; trata el
// puerto de forma explícita; no lee `X-Forwarded-Host` ni ninguna otra cabecera; y ante cualquier
// duda responde como recurso inexistente (`notFound()`, D-036), sin mensaje ni motivo.
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { esNoEncontrado } from "./apoyo/control-acceso";

const RAIZ = resolve(import.meta.dirname, "..", "..", "..");
const RUTA = resolve(RAIZ, "src", "app", "muestra", "_datos", "acceso-muestra.ts");
const CONFIGURACION = "../../../src/lib/plataforma/configuracion";

vi.setConfig({ testTimeout: 60_000 });

type Cabeceras = { get: (nombre: string) => string | null };
const estado = vi.hoisted(() => ({
  orden: [] as string[],
  leidas: [] as string[],
  cabeceras: null as null | Record<string, string>,
  fallaHeaders: false,
}));

vi.mock("next/headers", () => ({
  headers: async (): Promise<Cabeceras> => {
    estado.orden.push("headers");
    if (estado.fallaHeaders) throw new Error("fallo sembrado de headers");
    const valores = estado.cabeceras ?? {};
    return {
      get: (nombre: string) => {
        estado.leidas.push(nombre.toLowerCase());
        return valores[nombre.toLowerCase()] ?? null;
      },
    };
  },
}));

afterEach(() => {
  vi.unstubAllEnvs();
  vi.doUnmock(CONFIGURACION);
  vi.resetModules();
  estado.orden = [];
  estado.leidas = [];
  estado.cabeceras = null;
  estado.fallaHeaders = false;
});

async function cargar(): Promise<() => Promise<void>> {
  vi.resetModules();
  const m = (await import("../../../src/app/muestra/_datos/acceso-muestra")) as {
    comprobarAccesoMuestra: () => Promise<void>;
  };
  return m.comprobarAccesoMuestra;
}

type Resultado = "abierta" | "cerrada" | "otro error";
async function resultado(cabeceras: Record<string, string>, entorno?: string): Promise<Resultado> {
  estado.cabeceras = cabeceras;
  vi.stubEnv("ENTORNO", entorno);
  const comprobar = await cargar();
  try {
    await comprobar();
    return "abierta";
  } catch (e) {
    return esNoEncontrado(e) ? "cerrada" : "otro error";
  }
}

describe("comprobarAccesoMuestra · forma", () => {
  it("no admite parámetros y no devuelve nada cuando abre", async () => {
    const comprobar = await cargar();
    expect(comprobar.length).toBe(0);
    estado.cabeceras = { host: "localhost:3000" };
    vi.stubEnv("ENTORNO", "preproduccion");
    await expect(comprobar()).resolves.toBeUndefined();
  });

  it("cierra con el 404 de Next.js (notFound), sin mensaje propio", async () => {
    estado.cabeceras = { host: "desconocido.invalid" };
    vi.stubEnv("ENTORNO", "preproduccion");
    const comprobar = await cargar();
    const error = await comprobar().then(
      () => null,
      (e: unknown) => e,
    );
    expect(esNoEncontrado(error)).toBe(true);
    expect((error as Error).message).not.toMatch(/host|entorno|muestra|servidor/i);
  });
});

describe("comprobarAccesoMuestra · Host antes que nada", () => {
  it("llama a headers() antes de mirar la plataforma y de leer el entorno", async () => {
    vi.doMock(CONFIGURACION, () => ({
      fueraDeLaPlataforma: () => {
        estado.orden.push("fueraDeLaPlataforma");
        return true;
      },
      leerEntorno: () => {
        estado.orden.push("leerEntorno");
        return "preproduccion";
      },
    }));
    expect(await resultado({ host: "localhost" }, "preproduccion")).toBe("abierta");
    expect(estado.orden).toEqual(["headers", "fueraDeLaPlataforma", "leerEntorno"]);
  });

  it("si headers() falla, no abre y no llega a leer el entorno", async () => {
    vi.doMock(CONFIGURACION, () => ({
      fueraDeLaPlataforma: () => {
        estado.orden.push("fueraDeLaPlataforma");
        return true;
      },
      leerEntorno: () => {
        estado.orden.push("leerEntorno");
        return "preproduccion";
      },
    }));
    estado.fallaHeaders = true;
    expect(await resultado({ host: "localhost" }, "preproduccion")).not.toBe("abierta");
    expect(estado.orden).toEqual(["headers"]);
  });

  it("solo lee la cabecera Host (ni X-Forwarded-Host ni ninguna otra)", async () => {
    await resultado(
      { host: "localhost", "x-forwarded-host": "localhost", forwarded: "host=localhost" },
      "preproduccion",
    );
    expect(new Set(estado.leidas)).toEqual(new Set(["host"]));
  });

  it("si leer el entorno lanza, cierra con 404", async () => {
    vi.doMock(CONFIGURACION, () => ({
      fueraDeLaPlataforma: () => true,
      leerEntorno: () => {
        throw new Error("fallo sembrado de configuración");
      },
    }));
    expect(await resultado({ host: "localhost" }, "preproduccion")).toBe("cerrada");
  });

  it("si el entorno devuelve un valor fuera de la lista, cierra", async () => {
    vi.doMock(CONFIGURACION, () => ({
      fueraDeLaPlataforma: () => true,
      leerEntorno: () => "produccion",
    }));
    expect(await resultado({ host: "localhost" }, "preproduccion")).toBe("cerrada");
  });
  it("si mirar la plataforma lanza, cierra con 404 y no llega a leer el entorno", async () => {
    vi.doMock(CONFIGURACION, () => ({
      fueraDeLaPlataforma: () => {
        throw new Error("fallo sembrado de configuración");
      },
      leerEntorno: () => {
        estado.orden.push("leerEntorno");
        return "preproduccion";
      },
    }));
    expect(await resultado({ host: "localhost" }, "preproduccion")).toBe("cerrada");
    expect(estado.orden).toEqual(["headers"]);
  });

  it("si la plataforma dice que se está en ella, localhost cierra aunque el entorno valga", async () => {
    vi.doMock(CONFIGURACION, () => ({
      fueraDeLaPlataforma: () => false,
      leerEntorno: () => "preproduccion",
    }));
    expect(await resultado({ host: "localhost" }, "preproduccion")).toBe("cerrada");
  });
});

describe("comprobarAccesoMuestra · nombre de servidor exacto y puerto explícito", () => {
  it.each([
    "localhost",
    "localhost:3000",
    "localhost:1",
    "localhost:65535",
    "127.0.0.1",
    "127.0.0.1:3000",
  ])("Host %j con ENTORNO=preproduccion: abre", async (host) => {
    expect(await resultado({ host }, "preproduccion")).toBe("abierta");
  });

  it.each([
    "",
    " localhost",
    "localhost ",
    "LOCALHOST",
    "Localhost:3000",
    "localhost.",
    "localhost:",
    "localhost:0",
    "localhost:03000",
    "localhost:65536",
    "localhost:99999999",
    "localhost:3000:3000",
    "localhost:+3000",
    "localhost:3000 ",
    "localhost:abc",
    "localhost:3000/",
    "localhost/muestra",
    "127.0.0.1.",
    "127.0.0.01",
    "127.0.0.2",
    "0.0.0.0",
    "[::1]",
    "[::1]:3000",
    "::1",
    "user@localhost",
    "localhost@desconocido.invalid",
    "localhost.example.com",
    "pre-nido.<dominio>",
    "pre-nido.example.com",
    "app.nido-produccion.example",
  ])("Host %j: cierra", async (host) => {
    expect(await resultado({ host }, "preproduccion")).toBe("cerrada");
  });

  it("sin cabecera Host: cierra, aunque X-Forwarded-Host sea localhost", async () => {
    expect(await resultado({ "x-forwarded-host": "localhost" }, "preproduccion")).toBe("cerrada");
  });
});

describe("comprobarAccesoMuestra · ENTORNO al servir", () => {
  it("con desarrollo abre (NODE_ENV de Vitest, sin VERCEL*)", async () => {
    expect(await resultado({ host: "localhost:3000" }, "desarrollo")).toBe("abierta");
  });

  it.each([undefined, "", "produccion", "Preproduccion", "preproduccion ", "prod", "otro"])(
    "ENTORNO=%j con el nombre correcto: cierra",
    async (entorno) => {
      expect(await resultado({ host: "localhost:3000" }, entorno)).toBe("cerrada");
    },
  );

  it("compilación de preproducción servida con ENTORNO desconocido: cierra", async () => {
    expect(await resultado({ host: "localhost:3000" }, "desconocido")).toBe("cerrada");
  });

  it("ENTORNO=preproduccion con VERCEL_ENV=production (proyecto de producción): cierra", async () => {
    vi.stubEnv("VERCEL_ENV", "production");
    expect(await resultado({ host: "localhost:3000" }, "preproduccion")).toBe("cerrada");
  });

  it("desarrollo con NODE_ENV=production (next start): cierra", async () => {
    vi.stubEnv("NODE_ENV", "production");
    expect(await resultado({ host: "localhost:3000" }, "desarrollo")).toBe("cerrada");
  });
});

// MAYOR del auditor-seguridad en T-005 (art. 3, A-3): `Host` lo pone el cliente, así que
// `localhost` y `127.0.0.1` solo valen fuera de la plataforma (ninguna variable VERCEL*). Si no,
// en un proyecto de Vercel que no es de producción con ENTORNO=preproduccion bastaría
// `Host: localhost` para abrir la muestra.
describe("comprobarAccesoMuestra · localhost solo fuera de la plataforma", () => {
  const PLATAFORMA: ReadonlyArray<readonly [string, Record<string, string>]> = [
    ["VERCEL=1", { VERCEL: "1" }],
    ["VERCEL=1 y VERCEL_ENV=preview", { VERCEL: "1", VERCEL_ENV: "preview" }],
    ["solo VERCEL_ENV=preview", { VERCEL_ENV: "preview" }],
    ["solo VERCEL_ENV=development", { VERCEL_ENV: "development" }],
    ["solo VERCEL_URL", { VERCEL_URL: "algo.vercel.app" }],
    ["solo VERCEL_GIT_COMMIT_SHA", { VERCEL_GIT_COMMIT_SHA: "abc1234" }],
  ];
  const HOSTS = ["localhost", "localhost:3000", "127.0.0.1", "127.0.0.1:3000"];
  const casos = PLATAFORMA.flatMap(([nombre, variables]) =>
    HOSTS.flatMap((host) =>
      ["preproduccion", "desarrollo", "produccion"].map(
        (entorno) => [nombre, host, entorno, variables] as const,
      ),
    ),
  );

  it.each(casos)("%s, Host %j, ENTORNO=%s: cierra", async (_n, host, entorno, variables) => {
    for (const [k, v] of Object.entries(variables)) vi.stubEnv(k, v);
    expect(await resultado({ host }, entorno)).toBe("cerrada");
  });

  it.each(HOSTS.flatMap((host) => ["preproduccion", "desarrollo"].map((e) => [host, e] as const)))(
    "en local (sin VERCEL*), Host %j y ENTORNO=%s: abre",
    async (host, entorno) => {
      expect(await resultado({ host }, entorno)).toBe("abierta");
    },
  );
});

describe("comprobarAccesoMuestra · el código", () => {
  const fuente = readFileSync(RUTA, "utf8");

  it("no menciona X-Forwarded-Host ni otras cabeceras reenviadas", () => {
    expect(fuente).not.toMatch(/forwarded|x-real-ip|x-original/i);
  });

  it("no lee process.env: el entorno llega solo por configuracion.ts", () => {
    expect(fuente).not.toMatch(/process\s*\.\s*env|process\s*\[/);
    expect(fuente).toMatch(/from "@\/lib\/plataforma\/configuracion"/);
  });

  it("la lista de nombres no lleva ningún dominio público: solo localhost y 127.0.0.1", async () => {
    const m = (await import("../../../src/app/muestra/_datos/acceso-muestra")) as {
      NOMBRES_DE_SERVIDOR: ReadonlyArray<{ nombre: string }>;
    };
    expect(m.NOMBRES_DE_SERVIDOR.map((n) => n.nombre)).toEqual(["localhost", "127.0.0.1"]);
  });
});
