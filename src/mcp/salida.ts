// Filtro de salida del punto MCP (T-105 g, 001; diseño §Punto MCP, paso 9; REQ-009, REQ-013, REQ-015).
// Nada de lo que produce el SDK sale tal cual: lo que se publica y lo que se responde sale de los
// contratos y de textos fijos, nunca de lo recibido ni de lo que el SDK compone (sus mensajes de
// error citan el nombre de la herramienta o el valor, y una excepción de una herramienta llevaría su
// mensaje, art. 1).
//
// - `tools/list`: `title`, `description`, `inputSchema`, `outputSchema` y `annotations` salen de
//   `contratos/` (contratoPublicado). Si el SDK no lista exactamente las tres herramientas del
//   contrato, el filtro falla cerrado con `error_no_controlado` (500).
// - Errores JSON-RPC: código de lista cerrada con texto fijo y sin `data`, salvo `supported` de
//   -32022 (lista de versiones). Código desconocido -> -32603.
// - Resultado de `tools/call`: sin error, `structuredContent` válido contra el contrato de la
//   herramienta y texto igual a su JSON; con `isError`, solo un código fijo. Cualquier otra forma ->
//   `error_interno`.
// - Cuerpo ilegible: `error_no_controlado`. Siempre `Cache-Control: no-store`.
// Vale para las dos formas del SDK: JSON (2026-07-28) y SSE `event: message` (2025-11-25).
import { analizarJson } from "../lib/plataforma/entrada";
import { ErrorDeAplicacion } from "../lib/plataforma/errores";
import {
  contratoPublicado,
  HERRAMIENTAS,
  validarSalida,
  type Herramienta,
} from "./esquemas/contratos";

type Json = Record<string, unknown>;

export const CODIGOS_FALLO = ["error_temporal", "no_autorizado", "error_interno"] as const;

// Texto fijo por código JSON-RPC (lista cerrada).
const MENSAJES: Readonly<Record<number, string>> = {
  [-32700]: "Error de sintaxis",
  [-32600]: "Petición no válida",
  [-32601]: "Método no encontrado",
  [-32602]: "Parámetros no válidos",
  [-32603]: "Error interno",
  [-32022]: "Versión de protocolo no admitida",
};
const RE_VERSION = /^\d{4}-\d{2}-\d{2}$/;
// Id de JSON-RPC: política única para todo lo que sale (errores y resultados del SDK y los del punto):
// solo se repite un entero seguro o un texto corto de caracteres inocuos; si no, `null`.
const RE_ID = /^[A-Za-z0-9_.:-]{1,32}$/;
export function idSeguro(id: unknown): number | string | null {
  if (typeof id === "number" && Number.isSafeInteger(id)) return id;
  if (typeof id === "string" && RE_ID.test(id)) return id;
  return null;
}

const esObjeto = (v: unknown): v is Json =>
  v !== null && typeof v === "object" && !Array.isArray(v);

function fallo(codigo: (typeof CODIGOS_FALLO)[number]): Json {
  return { content: [{ type: "text", text: codigo }], isError: true };
}

function transformarError(mensaje: Json): Json {
  const bruto = mensaje.error;
  const codigo =
    esObjeto(bruto) && typeof bruto.code === "number" && bruto.code in MENSAJES
      ? bruto.code
      : -32603;
  const error: Json = { code: codigo, message: MENSAJES[codigo] };
  if (codigo === -32022 && esObjeto(bruto) && esObjeto(bruto.data)) {
    const s = bruto.data.supported;
    if (
      Array.isArray(s) &&
      s.length >= 1 &&
      s.length <= 8 &&
      s.every((v) => typeof v === "string" && RE_VERSION.test(v))
    ) {
      error.data = { supported: [...(s as string[])] };
    }
  }
  return { jsonrpc: "2.0", id: idSeguro(mensaje.id), error };
}

function transformarListado(resultado: Json, tools: unknown[]): Json {
  const nombres = tools.map((t) => (esObjeto(t) ? t.name : undefined));
  const esperados: readonly unknown[] = HERRAMIENTAS;
  // La condición del `Set` NO es redundante (tres nombres válidos con uno repetido pasarían el resto):
  // la cubre la prueba «tres con una repetida» de salida.test.ts (comprobado quitándola: falla).
  if (
    nombres.length !== HERRAMIENTAS.length ||
    new Set(nombres).size !== HERRAMIENTAS.length ||
    !nombres.every((n) => esperados.includes(n))
  ) {
    throw new ErrorDeAplicacion("error_no_controlado");
  }
  return { ...resultado, tools: HERRAMIENTAS.map((h) => contratoPublicado(h)) };
}

function transformarLlamada(resultado: Json, herramienta: Herramienta | null): Json {
  const { content, structuredContent, isError, ...resto } = resultado;
  const un = Array.isArray(content) && content.length === 1 ? content[0] : undefined;
  const texto = esObjeto(un) && un.type === "text" && typeof un.text === "string" ? un.text : null;

  if (isError === true) {
    const codigo = CODIGOS_FALLO.find((c) => c === texto) ?? "error_interno";
    return { ...fallo(codigo), ...resto };
  }
  if (
    herramienta === null ||
    texto === null ||
    !esObjeto(structuredContent) ||
    !validarSalida(herramienta)(structuredContent) ||
    texto !== JSON.stringify(structuredContent)
  ) {
    return { ...fallo("error_interno"), ...resto };
  }
  return { content: [{ type: "text", text: texto }], structuredContent, ...resto };
}

function transformar(bruto: unknown, herramienta: Herramienta | null): [Json, boolean] {
  if (!esObjeto(bruto)) throw new ErrorDeAplicacion("error_no_controlado");
  if ("error" in bruto) return [transformarError(bruto), true];
  const mensaje: Json = "id" in bruto ? { ...bruto, id: idSeguro(bruto.id) } : bruto;
  const resultado = mensaje.result;
  if (esObjeto(resultado)) {
    if (Array.isArray(resultado.tools)) {
      return [{ ...mensaje, result: transformarListado(resultado, resultado.tools) }, false];
    }
    if (Array.isArray(resultado.content)) {
      const nuevo = transformarLlamada(resultado, herramienta);
      return [{ ...mensaje, result: nuevo }, nuevo.isError === true];
    }
  }
  return [mensaje, false];
}

function transformarCuerpo(texto: string, herramienta: Herramienta | null): [string, boolean] {
  let analizado: unknown;
  try {
    analizado = analizarJson(texto);
  } catch {
    throw new ErrorDeAplicacion("error_no_controlado");
  }
  if (Array.isArray(analizado)) {
    const salidas = analizado.map((m) => transformar(m, herramienta));
    return [JSON.stringify(salidas.map(([m]) => m)), salidas.some(([, e]) => e)];
  }
  const [nuevo, hayError] = transformar(analizado, herramienta);
  return [JSON.stringify(nuevo), hayError];
}

export interface RespuestaFiltrada {
  readonly respuesta: Response;
  /** Hubo error JSON-RPC o `isError` (solo para el suceso; nunca su contenido). */
  readonly hayError: boolean;
}

export async function filtrarRespuestaConEstado(
  respuesta: Response,
  herramienta: Herramienta | null,
): Promise<RespuestaFiltrada> {
  const cabeceras = new Headers(respuesta.headers);
  cabeceras.delete("content-length");
  cabeceras.set("Cache-Control", "no-store");
  const crudo = await respuesta.text();
  const salida = (cuerpo: string | null, hayError: boolean): RespuestaFiltrada => ({
    respuesta: new Response(cuerpo, { status: respuesta.status, headers: cabeceras }),
    hayError,
  });
  if (crudo.trim() === "") return salida(null, false);

  if ((respuesta.headers.get("content-type") ?? "").includes("text/event-stream")) {
    let hayError = false;
    const lineas = crudo.split("\n").map((linea) => {
      if (!linea.startsWith("data: ")) return linea;
      const [texto, error] = transformarCuerpo(linea.slice("data: ".length), herramienta);
      hayError = hayError || error;
      return `data: ${texto}`;
    });
    return salida(lineas.join("\n"), hayError);
  }
  const [texto, hayError] = transformarCuerpo(crudo, herramienta);
  return salida(texto, hayError);
}

export async function filtrarRespuesta(
  respuesta: Response,
  herramienta: Herramienta | null,
): Promise<Response> {
  return (await filtrarRespuestaConEstado(respuesta, herramienta)).respuesta;
}
