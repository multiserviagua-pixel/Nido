// T-101 (b): el escáner de secretos reconoce las formas propias del conector (PRUEBA-019, parte).
// Los valores se componen en ejecución: ningún literal con la forma de un secreto en el repositorio.
import { randomBytes } from "node:crypto";
import { describe, expect, it } from "vitest";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

// El módulo es .mjs sin declaraciones: se carga por URL y se tipa aquí.
const { buscarSecretos } = (await import(
  /* @vite-ignore */ pathToFileURL(resolve("scripts/patrones-secretos.mjs")).href
)) as { buscarSecretos: (texto: string) => string[] };

const base64url43 = () => randomBytes(32).toString("base64url");
const token = (clase: string, cuerpo = base64url43()) => ["hia", clase, cuerpo].join("_");
const ALFABETO = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
const grupo = () =>
  Array.from({ length: 4 }, () => ALFABETO[randomBytes(1)[0]! % ALFABETO.length]).join("");
const codigo = () => [grupo(), grupo(), grupo()].join("-");

const formas = [
  { clase: "a", nombre: "token de acceso del conector" },
  { clase: "r", nombre: "token de renovación del conector" },
  { clase: "op", nombre: "credencial de operación del conector" },
] as const;

describe("escáner: formas del conector (PRUEBA-019, parte)", () => {
  it.each(formas)("detecta $nombre (prefijo + 43 base64url) y solo devuelve el nombre", (f) => {
    const valor = token(f.clase);
    expect(valor.length).toBe(`hia_${f.clase}_`.length + 43);
    const nombres = buscarSecretos(`Authorization: Bearer ${valor}`);
    expect(nombres).toContain(f.nombre);
    for (const n of nombres) expect(n).not.toContain(valor);
    expect(JSON.stringify(nombres)).not.toContain(valor.slice(-12));
  });

  it.each(formas)("detecta $nombre con el cuerpo en base64 estándar (con y sin relleno)", (f) => {
    for (let i = 0; i < 200; i++) {
      const bytes = i % 2 === 0 ? randomBytes(32) : randomBytes(33 + (i % 3));
      const cuerpo = bytes.toString("base64");
      expect(buscarSecretos(token(f.clase, cuerpo))).toContain(f.nombre);
    }
    const conRelleno = randomBytes(32).toString("base64");
    expect(conRelleno.endsWith("=")).toBe(true);
    expect(buscarSecretos(token(f.clase, conRelleno))).toContain(f.nombre);
  });

  it.each(formas)(
    "detecta $nombre pegado a otros caracteres (codificado, escapado o en JSON)",
    (f) => {
      const valor = token(f.clase);
      expect(buscarSecretos(`Authorization=Bearer%20${valor}`)).toContain(f.nombre);
      expect(buscarSecretos(`%7B%22token%22%3A%22${valor}`)).toContain(f.nombre);
      expect(buscarSecretos(JSON.stringify({ log: "x\n" + valor }))).toContain(f.nombre);
      expect(buscarSecretos(`x${valor}`)).toContain(f.nombre);
    },
  );

  it("detecta un token incrustado en una línea de registro o en una URL", () => {
    const valor = token("a");
    expect(buscarSecretos(`GET /api/mcp?x=${valor}&y=1`)).toContain("token de acceso del conector");
    expect(buscarSecretos(`"token":"${valor}"`)).toContain("token de acceso del conector");
  });

  it("detecta el código de activación (12 Crockford en tres grupos) sin devolver el valor", () => {
    const valor = codigo();
    const nombres = buscarSecretos(`código: ${valor}`);
    expect(nombres).toContain("código de activación del conector");
    expect(JSON.stringify(nombres)).not.toContain(valor.slice(0, 4));
  });

  it("no detecta cuerpos cortos, prefijos sueltos ni letras fuera de Crockford", () => {
    const cuerpoCorto = base64url43().slice(0, 42);
    expect(buscarSecretos(token("a", cuerpoCorto))).not.toContain("token de acceso del conector");
    expect(buscarSecretos(["hia", "a", ""].join("_"))).toEqual([]);
    expect(buscarSecretos(["hia", "x", base64url43()].join("_"))).toEqual([]);
    // I, L, O y U no existen en Crockford.
    expect(buscarSecretos("ABCD-EFGH-ILOU")).not.toContain("código de activación del conector");
    expect(buscarSecretos("ABCD-EFGH-JKMN-PQRS")).not.toContain(
      "código de activación del conector",
    );
  });

  it("no cambia lo ya detectado: una clave de Supabase sigue marcándose", () => {
    const clave = ["sb", "secret", base64url43()].join("_");
    expect(buscarSecretos(clave)).toContain("clave secreta de Supabase");
  });
});
