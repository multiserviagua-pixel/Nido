// T-121: el escáner de secretos reconoce el DSN de Sentry (REQ-015, CA-015).
// El DSN se compone en ejecución: ningún literal con su forma en el repositorio.
import { randomBytes } from "node:crypto";
import { describe, expect, it } from "vitest";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

// El módulo es .mjs sin declaraciones: se carga por URL y se tipa aquí.
const { buscarSecretos } = (await import(
  /* @vite-ignore */ pathToFileURL(resolve("scripts/patrones-secretos.mjs")).href
)) as { buscarSecretos: (texto: string) => string[] };

const NOMBRE = "DSN de Sentry";
const hex32 = () => randomBytes(16).toString("hex");
const hex31 = () => randomBytes(16).toString("hex").slice(0, 31);
const ingreso = (sub = "o123.ingest.de") => [sub, "sentry", "io"].join(".");
const dsn = (clave = hex32(), sub?: string) => `https://${clave}@${ingreso(sub)}/4501`;

describe("escáner: DSN de Sentry (T-121)", () => {
  it("detecta el DSN suelto y solo devuelve el nombre, nunca el valor", () => {
    const clave = hex32();
    const nombres = buscarSecretos(dsn(clave));
    expect(nombres).toContain(NOMBRE);
    for (const n of nombres) expect(n).not.toContain(clave);
    expect(JSON.stringify(nombres)).not.toContain(clave.slice(0, 8));
  });

  it("detecta el DSN en SUPERVISION_DSN=…, en JSON y entre comillas", () => {
    expect(buscarSecretos(`SUPERVISION_DSN=${dsn()}`)).toContain(NOMBRE);
    expect(buscarSecretos(`SUPERVISION_DSN="${dsn()}"`)).toContain(NOMBRE);
    expect(buscarSecretos(JSON.stringify({ dsn: dsn() }))).toContain(NOMBRE);
    expect(buscarSecretos(`x${dsn()}`)).toContain(NOMBRE);
  });

  it("detecta el DSN codificado en URL (%40) y en mayúsculas", () => {
    const clave = hex32();
    const codificado = `https%3A%2F%2F${clave}%40${ingreso()}%2F4501`;
    expect(buscarSecretos(codificado)).toContain(NOMBRE);
    expect(buscarSecretos(`https://${clave}%40${ingreso()}/4501`)).toContain(NOMBRE);
    expect(buscarSecretos(dsn(hex32()).toUpperCase())).toContain(NOMBRE);
  });

  it("detecta el DSN con la parte secreta antigua (clave:secreto)", () => {
    const antiguo = `https://${hex32()}:${hex32()}@${ingreso()}/4501`;
    expect(buscarSecretos(antiguo)).toContain(NOMBRE);
    const nombres = buscarSecretos(antiguo);
    expect(JSON.stringify(nombres)).not.toContain(antiguo.slice(8, 16));
  });

  it("detecta cualquier subdominio de sentry.io, incluido el propio", () => {
    expect(buscarSecretos(dsn(hex32(), "sentry"))).toContain(NOMBRE);
    expect(buscarSecretos(dsn(hex32(), "o9.ingest.us"))).toContain(NOMBRE);
    expect(buscarSecretos(`${hex32()}@${["sentry", "io"].join(".")}`)).toContain(NOMBRE);
  });

  it("no detecta la URL de ingreso sin clave, 31 hexadecimales ni otro dominio", () => {
    expect(buscarSecretos(`https://${ingreso()}/api/4501/envelope/`)).not.toContain(NOMBRE);
    expect(buscarSecretos(`https://${hex31()}@${ingreso()}/4501`)).not.toContain(NOMBRE);
    expect(buscarSecretos(`https://${hex32()}@${["ejemplo", "com"].join(".")}/4501`)).not.toContain(
      NOMBRE,
    );
    expect(buscarSecretos(`https://${hex32()}@${["no-sentry", "com"].join(".")}/1`)).not.toContain(
      NOMBRE,
    );
    expect(buscarSecretos(`${hex32()} sentry.io`)).not.toContain(NOMBRE);
  });

  it("no cambia lo ya detectado: una clave de Supabase sigue marcándose", () => {
    const clave = ["sb", "secret", randomBytes(32).toString("base64url")].join("_");
    expect(buscarSecretos(clave)).toContain("clave secreta de Supabase");
  });
});
