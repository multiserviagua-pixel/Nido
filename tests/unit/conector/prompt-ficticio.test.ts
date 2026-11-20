// T-104 (e): prompt-ficticio.ts. PRUEBA-016 (B): huella invariable; huella distinta, archivo
// ilegible o vacío → fallo cerrado (503). Archivo alterado en una copia temporal.
import { createHash } from "node:crypto";
import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { ErrorDeAplicacion } from "../../../src/lib/plataforma/errores";
import {
  HUELLA_PROMPT_FICTICIO,
  REGLAS_FICTICIAS,
  crearLectorPrompt,
  obtenerPromptFicticio,
} from "../../../src/mcp/prompt-ficticio";

const ORIGINAL = join(process.cwd(), "prompts", "agente-prueba", "0.1.md");
const carpetas: string[] = [];
const copiaTemporal = (): string => {
  const dir = mkdtempSync(join(tmpdir(), "prompt-"));
  carpetas.push(dir);
  mkdirSync(dir, { recursive: true });
  const ruta = join(dir, "0.1.md");
  copyFileSync(ORIGINAL, ruta);
  return ruta;
};
afterEach(() => {
  for (const d of carpetas.splice(0)) rmSync(d, { recursive: true, force: true });
});

const falla = (f: () => unknown): void => {
  try {
    f();
  } catch (e) {
    expect(e).toBeInstanceOf(ErrorDeAplicacion);
    expect((e as ErrorDeAplicacion).codigo).toBe("configuracion_conector_invalida");
    return;
  }
  throw new Error("no falló");
};

describe("prompt ficticio: huella", () => {
  it("la huella fijada en el código es el SHA-256 del archivo del repositorio", () => {
    const h = createHash("sha256").update(readFileSync(ORIGINAL)).digest("hex");
    expect(HUELLA_PROMPT_FICTICIO).toBe(h);
  });

  it("entrega texto y huella del archivo íntegro", () => {
    const p = obtenerPromptFicticio();
    expect(p.huella).toBe(HUELLA_PROMPT_FICTICIO);
    expect(p.texto).toBe(readFileSync(ORIGINAL, "utf8"));
    expect(p.texto).toContain("MARCA-PROMPT-FICTICIO-0001");
    expect(p.version).toBe("0.1");
  });

  it("copia sin cambios: acepta", () => {
    expect(crearLectorPrompt({ ruta: copiaTemporal() })().huella).toBe(HUELLA_PROMPT_FICTICIO);
  });

  it("un solo byte cambiado: fallo cerrado, sin texto", () => {
    const ruta = copiaTemporal();
    writeFileSync(ruta, readFileSync(ruta, "utf8").replace("Este texto", "Este texta"));
    falla(crearLectorPrompt({ ruta }));
  });

  it("salto de línea final añadido o quitado: fallo cerrado", () => {
    const ruta = copiaTemporal();
    writeFileSync(ruta, readFileSync(ruta, "utf8") + "\n");
    falla(crearLectorPrompt({ ruta }));
  });

  it("archivo vacío: fallo cerrado", () => {
    const ruta = copiaTemporal();
    writeFileSync(ruta, "");
    falla(crearLectorPrompt({ ruta }));
  });

  it("archivo inexistente o lector que lanza: fallo cerrado, sin filtrar la causa", () => {
    falla(crearLectorPrompt({ ruta: join(tmpdir(), "no-existe-0.1.md") }));
    try {
      crearLectorPrompt({
        ruta: "x",
        leer: () => {
          throw new Error("DETALLE-INTERNO-CANARIO");
        },
      })();
    } catch (e) {
      expect(String((e as Error).message)).not.toContain("CANARIO");
      expect((e as Error).cause).toBeUndefined();
    }
  });

  it("lectura única: tras acertar no vuelve a leer el disco", () => {
    let lecturas = 0;
    const lector = crearLectorPrompt({
      ruta: ORIGINAL,
      leer: (r) => {
        lecturas++;
        return readFileSync(r);
      },
    });
    lector();
    lector();
    lector();
    expect(lecturas).toBe(1);
  });

  it("un fallo no se guarda: la siguiente llamada vuelve a comprobar", () => {
    const ruta = copiaTemporal();
    const buena = readFileSync(ruta);
    writeFileSync(ruta, "");
    const lector = crearLectorPrompt({ ruta });
    falla(lector);
    writeFileSync(ruta, buena);
    expect(lector().huella).toBe(HUELLA_PROMPT_FICTICIO);
  });
});

describe("prompt ficticio: reglas constantes", () => {
  it("valores fijados por el diseño", () => {
    expect(REGLAS_FICTICIAS).toEqual({
      max_correos_por_revision: 30,
      ventana_dias: 3,
      preparar_borradores: true,
      guardar_adjuntos: false,
      descargar_facturas_por_enlace: false,
    });
    expect(Object.isFrozen(REGLAS_FICTICIAS)).toBe(true);
  });
});
