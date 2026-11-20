import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  NOMBRES_CONFIGURACION,
  cargarConfiguracion,
  esDesarrollo,
  validarConfiguracion,
} from "../../../src/lib/plataforma/configuracion";
import { comprobarRegion } from "../../../src/lib/plataforma/region";
import { ErrorDeAplicacion } from "../../../src/lib/plataforma/errores";
import * as salud from "../../../src/app/api/salud/route";

type Env = Record<string, string | undefined>;

const MARCA = "TEXTO-CANARIO-123";
const CLAVE = "0123456789abcdef0123456789abcdef";
const DSN = `https://${CLAVE}@o1.ingest.de.sentry.io/1`;
const BASE_PRO: Env = {
  ENTORNO: "produccion",
  SUPERVISION_DSN: DSN,
  COMMIT_DESPLEGADO: "abcdef1",
  VERCEL: "1",
  VERCEL_ENV: "production",
  VERCEL_REGION: "arn1",
  VERCEL_URL: "nido-abc.vercel.app",
};
const BASE_DES: Env = { ENTORNO: "desarrollo" };

describe("configuracion: lista cerrada", () => {
  it("exporta exactamente los ocho nombres", () => {
    expect([...NOMBRES_CONFIGURACION]).toEqual([
      "ENTORNO",
      "SUPERVISION_DSN",
      "COMMIT_DESPLEGADO",
      "VERCEL",
      "VERCEL_ENV",
      "VERCEL_REGION",
      "VERCEL_URL",
      "NODE_ENV",
    ]);
  });

  it("acepta una configuración completa de producción y una mínima de desarrollo", () => {
    expect(validarConfiguracion(BASE_PRO).ok).toBe(true);
    expect(validarConfiguracion(BASE_DES).ok).toBe(true);
  });

  it("sin valores por defecto: ENTORNO ausente es inválido", () => {
    expect(validarConfiguracion({})).toMatchObject({ ok: false, codigo: "configuracion_invalida" });
  });

  it("ignora variables fuera de la lista", () => {
    const r = validarConfiguracion({ ...BASE_DES, OTRA: MARCA });
    expect(r.ok).toBe(true);
    expect(JSON.stringify(r)).not.toContain(MARCA);
  });

  it.each([
    ["ENTORNO", { ...BASE_PRO, ENTORNO: MARCA }],
    ["ENTORNO", { ...BASE_PRO, ENTORNO: undefined }],
    ["SUPERVISION_DSN", { ...BASE_PRO, SUPERVISION_DSN: undefined }],
    ["SUPERVISION_DSN", { ...BASE_PRO, SUPERVISION_DSN: MARCA }],
    ["SUPERVISION_DSN", { ...BASE_PRO, SUPERVISION_DSN: DSN.replace("https", "http") }],
    [
      "SUPERVISION_DSN",
      { ...BASE_PRO, SUPERVISION_DSN: `https://${CLAVE}@${MARCA}.example.com/1` },
    ],
    ["SUPERVISION_DSN", { ...BASE_PRO, SUPERVISION_DSN: "https://clave@o1.ingest.de.sentry.io/1" }],
    ["SUPERVISION_DSN", { ...BASE_PRO, SUPERVISION_DSN: DSN.replace("@o1", "@x1") }],
    ["SUPERVISION_DSN", { ...BASE_PRO, SUPERVISION_DSN: DSN.replace(CLAVE, CLAVE.toUpperCase()) }],
    ["SUPERVISION_DSN", { ...BASE_PRO, SUPERVISION_DSN: DSN + "/" }],
    ["SUPERVISION_DSN", { ...BASE_PRO, SUPERVISION_DSN: DSN + "?" + MARCA }],
    ["SUPERVISION_DSN", { ...BASE_PRO, SUPERVISION_DSN: DSN.replace("de.sentry", "us.sentry") }],
    [
      "SUPERVISION_DSN",
      {
        ...BASE_PRO,
        SUPERVISION_DSN: "https://" + CLAVE + ":" + MARCA + "@o1.ingest.de.sentry.io/1",
      },
    ],
    ["VERCEL", { ...BASE_PRO, VERCEL: undefined }],
    ["VERCEL_ENV", { ...BASE_PRO, VERCEL_ENV: undefined }],
    ["ENTORNO", { ...BASE_DES, NODE_ENV: "production" }],
    ["COMMIT_DESPLEGADO", { ...BASE_PRO, COMMIT_DESPLEGADO: undefined }],
    ["COMMIT_DESPLEGADO", { ...BASE_PRO, COMMIT_DESPLEGADO: "abc12" }],
    ["COMMIT_DESPLEGADO", { ...BASE_PRO, COMMIT_DESPLEGADO: MARCA }],
    ["VERCEL", { ...BASE_PRO, VERCEL: MARCA }],
    ["VERCEL_ENV", { ...BASE_PRO, VERCEL_ENV: MARCA }],
    ["VERCEL_REGION", { ...BASE_PRO, VERCEL_REGION: MARCA }],
    ["VERCEL_URL", { ...BASE_PRO, VERCEL_URL: MARCA + "/x y" }],
  ])("%s ausente o mal formada: código y nombre, nunca el valor", (nombre, env) => {
    const r = validarConfiguracion(env);
    expect(r).toMatchObject({ ok: false, codigo: "configuracion_invalida" });
    if (r.ok) return;
    expect(r.variables).toContain(nombre);
    expect(JSON.stringify(r)).not.toContain(MARCA);
    expect(JSON.stringify(r)).not.toContain(CLAVE);
  });

  it("con alguna VERCEL*, desarrollo no vale", () => {
    for (const extra of [
      { VERCEL: "1" },
      { VERCEL_REGION: "arn1" },
      { VERCEL_URL: "a.vercel.app" },
    ]) {
      expect(validarConfiguracion({ ...BASE_DES, ...extra }).ok).toBe(false);
    }
  });

  it("VERCEL_URL no es obligatoria fuera de desarrollo, pero si está se valida", () => {
    expect(validarConfiguracion({ ...BASE_PRO, VERCEL_URL: undefined }).ok).toBe(true);
    expect(validarConfiguracion({ ...BASE_PRO, VERCEL_URL: MARCA + "/x y" }).ok).toBe(false);
  });

  it("desarrollo exige NODE_ENV distinto de production; otros valores y ausente valen", () => {
    expect(validarConfiguracion({ ...BASE_DES, NODE_ENV: "production" }).ok).toBe(false);
    for (const n of ["development", "test", undefined]) {
      expect(validarConfiguracion({ ...BASE_DES, NODE_ENV: n }).ok).toBe(true);
    }
    expect(validarConfiguracion({ ...BASE_PRO, NODE_ENV: "production" }).ok).toBe(true);
  });

  it("esDesarrollo comparte predicado con la validación", () => {
    const caso = (env: Env) => {
      for (const n of NOMBRES_CONFIGURACION) vi.stubEnv(n, env[n]);
      const r = esDesarrollo();
      vi.unstubAllEnvs();
      return r;
    };
    expect(caso(BASE_DES)).toBe(true);
    expect(caso({ ...BASE_DES, NODE_ENV: "production" })).toBe(false);
    expect(caso({ ...BASE_DES, VERCEL: "1" })).toBe(false);
    expect(caso(BASE_PRO)).toBe(false);
    expect(caso({})).toBe(false);
  });

  it("en desarrollo, DSN y commit son opcionales pero si están deben ser válidos", () => {
    expect(validarConfiguracion({ ...BASE_DES, SUPERVISION_DSN: MARCA }).ok).toBe(false);
    expect(validarConfiguracion({ ...BASE_DES, COMMIT_DESPLEGADO: "zz" }).ok).toBe(false);
  });

  it("cargarConfiguracion lanza ErrorDeAplicacion sin el valor", () => {
    vi.stubEnv("ENTORNO", MARCA);
    let capturado: unknown;
    try {
      cargarConfiguracion();
    } catch (e) {
      capturado = e;
    } finally {
      vi.unstubAllEnvs();
    }
    expect(capturado).toBeInstanceOf(ErrorDeAplicacion);
    expect((capturado as ErrorDeAplicacion).codigo).toBe("configuracion_invalida");
    expect((capturado as Error).message).not.toContain(MARCA);
  });

  it("A-1: cargarConfiguracion mira todo process.env: VERCEL_GIT_COMMIT_SHA invalida desarrollo", () => {
    for (const n of NOMBRES_CONFIGURACION) vi.stubEnv(n, BASE_DES[n]);
    vi.stubEnv("VERCEL_GIT_COMMIT_SHA", "abcdef1");
    let capturado: unknown;
    try {
      cargarConfiguracion();
    } catch (e) {
      capturado = e;
    } finally {
      vi.unstubAllEnvs();
    }
    expect(capturado).toBeInstanceOf(ErrorDeAplicacion);
    expect((capturado as ErrorDeAplicacion).codigo).toBe("configuracion_invalida");
  });
});

describe("configuracion: DSN con saltos de línea (A-2)", () => {
  it.each([
    ["salto de línea al final", DSN + "\n"],
    ["salto de línea al principio", "\n" + DSN],
    ["retorno de carro al final", DSN + "\r"],
  ])("DSN con %s se rechaza como mal formado", (_n, dsn) => {
    for (const base of [BASE_PRO, BASE_DES]) {
      const r = validarConfiguracion({ ...base, SUPERVISION_DSN: dsn });
      expect(r).toMatchObject({ ok: false, codigo: "configuracion_invalida" });
      if (!r.ok) expect(r.variables).toContain("SUPERVISION_DSN");
    }
  });
});

describe("region (PRUEBA-012, parte L)", () => {
  const conf = (env: Env) => {
    const r = validarConfiguracion(env);
    if (!r.ok) throw new ErrorDeAplicacion("configuracion_invalida");
    return r.valor;
  };

  it("arn1 fuera de desarrollo pasa; desarrollo pasa", () => {
    expect(() => comprobarRegion(conf(BASE_PRO))).not.toThrow();
    expect(() => comprobarRegion(conf(BASE_DES))).not.toThrow();
  });

  it("otra región o sin región fuera de desarrollo: region_no_permitida", () => {
    for (const env of [
      { ...BASE_PRO, VERCEL_REGION: "iad1" },
      { ...BASE_PRO, VERCEL_REGION: undefined },
    ]) {
      expect(() => comprobarRegion(conf(env))).toThrowError(
        expect.objectContaining({ codigo: "region_no_permitida" }),
      );
    }
  });
});

describe("/api/salud con configuración (PRUEBA-012 y 044, partes L)", () => {
  let salida: string[];
  beforeEach(() => {
    salida = [];
    for (const m of ["log", "error"] as const) {
      vi.spyOn(console, m).mockImplementation(
        (...a: unknown[]) => void salida.push(a.map(String).join(" ")),
      );
    }
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  function poner(env: Env) {
    for (const n of NOMBRES_CONFIGURACION) vi.stubEnv(n, env[n]);
  }

  it("configuración válida: 200", async () => {
    poner(BASE_PRO);
    expect((await salud.GET(new Request("http://x/api/salud"))).status).toBe(200);
    poner(BASE_DES);
    expect((await salud.HEAD(new Request("http://x/api/salud"))).status).toBe(200);
  });

  it.each([
    ["ausente", {}],
    ["mal formada", { ...BASE_PRO, ENTORNO: MARCA }],
    ["sin región en la plataforma", { ...BASE_PRO, VERCEL_REGION: undefined }],
    ["otra región", { ...BASE_PRO, VERCEL_REGION: "iad1" }],
    ["desarrollo en la plataforma", { ...BASE_DES, VERCEL: "1" }],
    ["desarrollo con NODE_ENV=production", { ...BASE_DES, NODE_ENV: "production" }],
    ["sin VERCEL fuera de desarrollo", { ...BASE_PRO, VERCEL: undefined }],
    ["sin VERCEL_ENV fuera de desarrollo", { ...BASE_PRO, VERCEL_ENV: undefined }],
    [
      "DSN con otra forma",
      { ...BASE_PRO, SUPERVISION_DSN: `https://${CLAVE}@o1.ingest.sentry.io/1` },
    ],
  ] as [string, Env][])("%s: 503 {estado:error} sin valores", async (_n, env) => {
    poner(env);
    for (const metodo of ["GET", "HEAD"] as const) {
      const r = await salud[metodo](new Request("http://x/api/salud?q=" + MARCA));
      expect(r.status).toBe(503);
      expect(r.headers.get("cache-control")).toBe("no-store");
      expect(await r.text()).toBe(metodo === "GET" ? '{"estado":"error"}' : "");
    }
    expect(salida.join("\n")).not.toContain(MARCA);
    expect(salida.join("\n")).toMatch(/configuracion_invalida|region_no_permitida/);
  });

  it("A-1: desarrollo con VERCEL_GIT_COMMIT_SHA presente: 503 sin valores", async () => {
    poner(BASE_DES);
    vi.stubEnv("VERCEL_GIT_COMMIT_SHA", MARCA);
    const r = await salud.GET(new Request("http://x/api/salud"));
    expect(r.status).toBe(503);
    expect(await r.text()).toBe('{"estado":"error"}');
    expect(salida.join("\n")).not.toContain(MARCA);
  });
});
