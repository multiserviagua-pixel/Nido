import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
// @ts-expect-error: el módulo de scripts/ es JavaScript sin declaraciones y no se toca desde aquí.
import { buscarSecretos as buscarSecretosJs } from "../../../scripts/patrones-secretos.mjs";
import {
  NOMBRES_CONFIGURACION,
  validarConfiguracion,
} from "../../../src/lib/plataforma/configuracion";
import { comprobarRegion } from "../../../src/lib/plataforma/region";

// PRUEBA-028 (parte L): los nombres de `.env.example`, de la lista de `configuracion.ts` y de
// `docs/operacion/entornos.md` coinciden y no hay ningún valor.
//
// Criterio de reparto (diseño §Entornos y credenciales y §App base «Configuración»):
// - `.env.example` lista SOLO las variables que pone una persona (columna «Quién» = «persona»).
// - Las que pone la plataforma (VERCEL*, NODE_ENV) o la orden de despliegue (COMMIT_DESPLEGADO)
//   figuran en `entornos.md` pero no en `.env.example`, porque nadie las escribe a mano.
// - Las variables de otras funciones las añade cada una con su configuración.
// - `entornos.md` debe cubrir exactamente la lista exportada por `configuracion.ts`.

const raiz = join(import.meta.dirname, "..", "..", "..");
const leer = (nombre: string): string => readFileSync(join(raiz, nombre), "utf8");

const buscarSecretos = buscarSecretosJs as (texto: string) => string[];

const RE_NOMBRE = /^[A-Z][A-Z0-9_]*$/;

// Nombres de `.env.example` y líneas con valor. Función pura para poder alimentarla con copias.
export function analizarEnvEjemplo(texto: string): { nombres: string[]; conValor: string[] } {
  const nombres: string[] = [];
  const conValor: string[] = [];
  for (const bruta of texto.split(/\r?\n/)) {
    const linea = bruta.trim();
    if (linea === "" || linea.startsWith("#")) continue;
    const i = linea.indexOf("=");
    const nombre = (i === -1 ? linea : linea.slice(0, i)).trim();
    const valor = i === -1 ? "" : linea.slice(i + 1).trim();
    nombres.push(nombre);
    if (i === -1 || valor !== "") conValor.push(nombre);
  }
  return { nombres, conValor };
}

// Valores que no pueden aparecer en ningún texto: URL con credencial y 32 hexadecimales.
// Se aplica al texto completo, comentarios incluidos.
export function buscarValores(texto: string): string[] {
  return [
    ...(texto.match(/https?:\/\/[^\s)]*@/g) ?? []),
    ...(texto.match(/\b[0-9a-f]{32}\b/gi) ?? []),
  ];
}

// Líneas de comentario con forma de asignación con valor (por ejemplo «# ENTORNO=produccion»).
export function comentariosConAsignacion(texto: string): string[] {
  return texto
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => /^#\s*[A-Z][A-Z0-9_]*\s*=\s*\S/.test(l))
    .map((l) => l.slice(1).split("=")[0]?.trim() ?? "");
}

const ENTORNOS_TABLA = ["desarrollo", "preproduccion", "produccion"] as const;
type EntornoTabla = (typeof ENTORNOS_TABLA)[number];

// Fuente sintética de buen formato, compuesta en ejecución (sin cadenas con forma de secreto).
// DSN: 32 hexadecimales + organización y proyecto inventados.
const dsnInventado = (): string =>
  ["https://", "ab".repeat(16), "@o", "1", ".ingest.de.sentry.io/", "2"].join("");

function fuenteValida(entorno: EntornoTabla): Record<string, string> {
  const base: Record<string, string> = {
    ENTORNO: entorno,
    SUPERVISION_DSN: dsnInventado(),
    COMMIT_DESPLEGADO: ["1234", "abc"].join(""),
  };
  if (entorno === "desarrollo") return { ...base, NODE_ENV: "development" };
  return {
    ...base,
    VERCEL: "1",
    VERCEL_ENV: entorno === "produccion" ? "production" : "preview",
    VERCEL_REGION: "arn1",
    VERCEL_URL: ["app", "ejemplo", "invalid"].join("."),
    NODE_ENV: "production",
  };
}

// ¿Se acepta esta fuente? Validación más comprobación de región.
function aceptada(fuente: Record<string, string>): boolean {
  const r = validarConfiguracion(fuente);
  if (!r.ok) return false;
  try {
    comprobarRegion(r.valor);
    return true;
  } catch {
    return false;
  }
}

interface FilaEntorno {
  variable: string;
  quien: string;
  secreta: string;
  donde: string;
  celdas: string[];
}

// Tabla de `entornos.md`: Variable | Quién | Secreta | Dónde vive | desarrollo | preproduccion | produccion.
export function analizarTabla(texto: string): FilaEntorno[] {
  const filas: FilaEntorno[] = [];
  for (const linea of texto.split(/\r?\n/)) {
    const t = linea.trim();
    if (!t.startsWith("|")) continue;
    const c = t
      .slice(1, t.endsWith("|") ? -1 : undefined)
      .split("|")
      .map((x) => x.trim());
    const variable = (c[0] ?? "").replace(/`/g, "");
    if (!RE_NOMBRE.test(variable)) continue;
    filas.push({
      variable,
      quien: c[1] ?? "",
      secreta: c[2] ?? "",
      donde: c[3] ?? "",
      celdas: c.slice(4),
    });
  }
  return filas;
}

const ordenados = (xs: readonly string[]): string[] => [...xs].sort();

describe("entornos: nombres de variables (PRUEBA-028 L)", () => {
  const ejemplo = analizarEnvEjemplo(leer(".env.example"));
  const tabla = analizarTabla(leer("docs/operacion/entornos.md"));
  const dePersona = tabla.filter((f) => f.quien.toLowerCase().startsWith("persona"));

  it("entornos.md cubre exactamente la lista de configuracion.ts, sin repetir", () => {
    expect(ordenados(tabla.map((f) => f.variable))).toEqual(ordenados(NOMBRES_CONFIGURACION));
  });

  it(".env.example contiene exactamente las variables que pone una persona", () => {
    expect(ordenados(ejemplo.nombres)).toEqual(ordenados(dePersona.map((f) => f.variable)));
    expect(dePersona.length).toBeGreaterThan(0);
    for (const n of ejemplo.nombres) {
      expect(NOMBRES_CONFIGURACION as readonly string[]).toContain(n);
    }
  });

  it(".env.example no repite nombres ni trae valores", () => {
    expect(new Set(ejemplo.nombres).size).toBe(ejemplo.nombres.length);
    expect(ejemplo.conValor).toEqual([]);
  });

  it("cada fila de entornos.md dice quién, si es secreta, dónde vive y los tres entornos", () => {
    for (const f of tabla) {
      expect(f.quien, f.variable).not.toBe("");
      expect(["sí", "no"], f.variable).toContain(f.secreta.toLowerCase());
      expect(f.donde, f.variable).not.toBe("");
      expect(f.celdas.length, f.variable).toBe(3);
      for (const celda of f.celdas) expect(celda, f.variable).not.toBe("");
    }
  });

  it("entornos.md no contiene valores (ni direcciones de ingesta ni URL con clave)", () => {
    const texto = leer("docs/operacion/entornos.md");
    expect(buscarValores(texto)).toEqual([]);
    expect(buscarSecretos(texto)).toEqual([]);
  });

  it("el texto completo de .env.example no contiene valores", () => {
    const texto = leer(".env.example");
    expect(buscarValores(texto)).toEqual([]);
    expect(buscarSecretos(texto)).toEqual([]);
    expect(comentariosConAsignacion(texto)).toEqual([]);
  });

  it("cada celda de entorno de la tabla se comporta como dice (validarConfiguracion y comprobarRegion)", () => {
    for (const f of tabla) {
      f.celdas.forEach((celda, i) => {
        const entorno = ENTORNOS_TABLA[i] as EntornoTabla;
        const etiqueta = `${f.variable} en ${entorno}`;
        const valida = fuenteValida(entorno);
        expect(aceptada(valida), `base de ${entorno}`).toBe(true);
        const sin = { ...valida };
        delete sin[f.variable];
        if (celda === "obligatoria") {
          expect(aceptada(sin), etiqueta).toBe(false);
        } else if (celda === "opcional") {
          expect(aceptada(sin), etiqueta).toBe(true);
        } else if (celda === "no se usa" || celda === "la fija la plataforma") {
          expect(aceptada(sin), etiqueta).toBe(true);
        } else if (celda.startsWith("prohibida")) {
          // Prohibida: con valor invalida el entorno.
          const con = { ...valida, [f.variable]: fuenteValida("produccion")[f.variable] ?? "x" };
          expect(aceptada(con), etiqueta).toBe(false);
        } else {
          expect.fail(`${etiqueta}: celda desconocida «${celda}»`);
        }
      });
    }
  });

  it("las cuatro VERCEL* están prohibidas en desarrollo y dicen que en local no deben existir", () => {
    const vercel = tabla.filter((f) => f.variable.startsWith("VERCEL"));
    expect(vercel.map((f) => f.variable).sort()).toEqual(
      ["VERCEL", "VERCEL_ENV", "VERCEL_REGION", "VERCEL_URL"].sort(),
    );
    for (const f of vercel) {
      expect(f.celdas[0], f.variable).toBe("prohibida (invalida desarrollo)");
      expect(f.donde, f.variable).toContain("en local no debe existir");
    }
  });

  it("no queda nada de la fase 0 ni la región eu-central-1", () => {
    const todo = leer(".env.example") + leer("docs/operacion/entornos.md");
    expect(todo).not.toContain("eu-central-1");
    for (const viejo of ["SUPABASE", "CONECTOR_", "STRIPE", "CRON_SECRETO"]) {
      expect(todo).not.toContain(viejo);
    }
  });
});

describe("entornos: pruebas negativas", () => {
  it("un .env.example con un valor se detecta", () => {
    expect(analizarEnvEjemplo("ENTORNO=desarrollo\n").conValor).toEqual(["ENTORNO"]);
    expect(analizarEnvEjemplo("ENTORNO=\n").conValor).toEqual([]);
    expect(analizarEnvEjemplo("ENTORNO\n").conValor).toEqual(["ENTORNO"]);
    expect(analizarEnvEjemplo("# nota\n\nENTORNO=  \n").conValor).toEqual([]);
  });

  it("un valor dentro de un comentario también se detecta", () => {
    expect(buscarValores("# clave 0123456789abcdef0123456789abcdef\nENTORNO=\n")).not.toEqual([]);
    expect(buscarValores("# https://usuario:clave@ejemplo.invalid/1\nENTORNO=\n")).not.toEqual([]);
    expect(buscarValores("# solo una nota\nENTORNO=\n")).toEqual([]);
  });

  it("un comentario con forma de asignación en .env.example se detecta", () => {
    expect(comentariosConAsignacion("# ENTORNO=produccion\nENTORNO=\n")).toEqual(["ENTORNO"]);
    expect(comentariosConAsignacion("# ENTORNO=\n# nota: sin valor\nENTORNO=\n")).toEqual([]);
  });

  it("buscarSecretos y buscarValores detectan un DSN con contraseña compuesto en ejecución", () => {
    const dsn = ["postgres", "://usuario:", "x".repeat(10), "@host.invalid/bd"].join("");
    expect(buscarSecretos(`# ${dsn}\nENTORNO=\n`)).not.toEqual([]);
    const url = ["https://", "usuario:", "x".repeat(10), "@host.invalid/1"].join("");
    expect(buscarValores(`# ${url}\nENTORNO=\n`)).not.toEqual([]);
  });

  it("un nombre ajeno a configuracion.ts en .env.example no coincide", () => {
    const { nombres } = analizarEnvEjemplo("ENTORNO=\nOTRA=\n");
    expect(nombres.every((n) => (NOMBRES_CONFIGURACION as readonly string[]).includes(n))).toBe(
      false,
    );
  });

  it("la tabla se analiza y distingue filas de persona", () => {
    const filas = analizarTabla(
      "| Variable | Quién |\n| --- | --- |\n| `ENTORNO` | persona | sí | Vercel | a | b | c |\n",
    );
    expect(filas.map((f) => f.variable)).toEqual(["ENTORNO"]);
    expect(filas[0]?.celdas).toEqual(["a", "b", "c"]);
  });
});
