// Prompt ficticio de la función 001 (diseño §Entrega del prompt y huella; REQ-012).
// El texto vive en el repositorio, fuera de la base de datos y de variables de entorno.
// Se lee una sola vez, se compara su SHA-256 con la huella fijada aquí y, ante cualquier
// diferencia, error de lectura o archivo vacío, se falla cerrado: ErrorDeAplicacion (503 en la capa HTTP).
// Nunca se registra ni se devuelve el contenido, la ruta ni la causa.
import { createHash, timingSafeEqual } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { ErrorDeAplicacion } from "../lib/plataforma/errores";

export const VERSION_PROMPT_FICTICIO = "0.1";

// SHA-256 (hexadecimal) de los bytes de prompts/agente-prueba/0.1.md, con finales de línea \n.
// Cambiar el texto obliga a una versión nueva (skill version-prompt), nunca a editar esta huella.
export const HUELLA_PROMPT_FICTICIO =
  "07e6ac6d4d85f7bf6af6f704fa3e33a5e3d524cffd17f91e87aedede8b68d184";

// Reglas constantes de la prueba (diseño §Entrega del prompt y huella).
export const REGLAS_FICTICIAS = Object.freeze({
  max_correos_por_revision: 30,
  ventana_dias: 3,
  preparar_borradores: true,
  guardar_adjuntos: false,
  descargar_facturas_por_enlace: false,
});

export interface PromptFicticio {
  readonly version: string;
  readonly texto: string;
  readonly huella: string;
}

export interface OpcionesLector {
  readonly ruta?: string;
  readonly leer?: (ruta: string) => Uint8Array;
}

const RUTA_POR_DEFECTO = (): string =>
  join(process.cwd(), "prompts", "agente-prueba", `${VERSION_PROMPT_FICTICIO}.md`);

export function crearLectorPrompt(opciones: OpcionesLector = {}): () => PromptFicticio {
  const ruta = opciones.ruta ?? RUTA_POR_DEFECTO();
  const leer = opciones.leer ?? ((r: string): Uint8Array => readFileSync(r));
  let valido: PromptFicticio | undefined;

  return () => {
    if (valido) return valido;
    let bytes: Uint8Array;
    try {
      bytes = leer(ruta);
    } catch {
      throw new ErrorDeAplicacion("prompt_no_valido");
    }
    if (bytes.length === 0) throw new ErrorDeAplicacion("prompt_no_valido");
    const huella = createHash("sha256").update(bytes).digest();
    const esperada = Buffer.from(HUELLA_PROMPT_FICTICIO, "hex");
    if (huella.length !== esperada.length || !timingSafeEqual(huella, esperada))
      throw new ErrorDeAplicacion("prompt_no_valido");
    valido = Object.freeze({
      version: VERSION_PROMPT_FICTICIO,
      texto: Buffer.from(bytes).toString("utf8"),
      huella: HUELLA_PROMPT_FICTICIO,
    });
    return valido;
  };
}

export const obtenerPromptFicticio = crearLectorPrompt();
