// Punto MCP: tubería de entrada (T-105 h, 001; diseño §Punto MCP, pasos 1 a 7 y 10; REQ-001, REQ-007,
// REQ-013, REQ-014, REQ-015). Cada fallo responde y termina; lo recibido es dato, nunca orden (art. 7).
//
//  1. Configuración del conector (C-1): si no vale, `configuracion_conector_invalida` (503 en HTTP).
//  2. Solo POST: 405 con `Allow: POST`, sin leer nada.
//  3. `Origin` ausente, propio, claude.ai o chatgpt.com; otro -> 403.
//  4. Cuerpo de hasta 32 768 bytes, leído con tope: pasado el tope se corta la lectura -> 413.
//  5. `Authorization: Bearer hia_a_` + 43 base64url; la consulta, el cuerpo y las cookies no se miran
//     (un token en la URL es no tener token) -> 401 con el reto de OAuth.
//  6. `validar_acceso` con el HMAC del token -> 401 `invalid_token` (anónimo: solo consola, sin suceso);
//     almacén caído -> 503 (propagado).
//  7. JSON (único `JSON.parse` de la función): mal formado -> -32700; lote o cuerpo que no es un
//     objeto -> -32600; método fuera de la lista cerrada -> -32601 (sin pasar por el SDK); `tools/call`
//     con nombre ajeno -> -32602. Sin eco de lo recibido.
//  8 y 9. `servidor.ts` y `salida.ts`.
// 10. `registrar_suceso` tras responder; si falla, se descarta. Solo para lo posterior a autenticar
//     (pasos 7 a 9): los rechazos anónimos de los pasos 2 a 6 NO escriben en `sucesos` ni abren
//     conexión (un anónimo no puede llenar la tabla ni agotar el agrupador); van solo a la consola con
//     un código cerrado (`registrar`), sin valores.
//
// Emisor, recurso y reto salen de `URL_PUBLICA`, nunca de `Host`. Los sucesos llevan solo campos de
// lista cerrada: ni cabeceras, ni token, ni ruta pedida, ni valores (arts. 1 y 4).
import { derivarClaves, huellaToken } from "../lib/oauth/secretos";
import {
  cargarConfiguracionConector,
  type ConfiguracionConector,
} from "../lib/plataforma/configuracion";
import type { Codigo } from "../lib/registro/codigos";
import { registrar } from "../lib/registro/registro";
import { registrarSucesoTrasResponder, type Despues } from "../lib/registro/sucesos";
import type { Almacen, ProtocoloSuceso, ResultadoSuceso } from "../lib/supabase/almacen";
import { almacenDelConector } from "../lib/supabase/conector";
import { HERRAMIENTAS, type Herramienta } from "./esquemas/contratos";
import { obtenerPromptFicticio, type PromptFicticio } from "./prompt-ficticio";
import { idSeguro } from "./salida";
import { crearServidorMcp } from "./servidor";

export const RUTA_MCP = "api/mcp";
export const MAXIMO_CUERPO_BYTES = 32768;

const ORIGENES_AJENOS = ["https://claude.ai", "https://chatgpt.com"];
const RE_BEARER = /^Bearer (hia_a_[A-Za-z0-9_-]{43})$/;
const PROTOCOLOS: readonly string[] = ["2025-11-25", "2026-07-28"];

// Métodos que el SDK 2.4.0 necesita en las dos épocas: 2025-11-25 (`initialize`, `notifications/initialized`,
// `tools/list`, `tools/call`, `ping`) y 2026-07-28 (`server/discover`, `tools/list`, `tools/call`, `ping`).
// Todo lo demás (`subscriptions/listen`, recursos, prompts, completion, logging) responde -32601.
const METODOS_PERMITIDOS: readonly string[] = [
  "initialize",
  "notifications/initialized",
  "tools/list",
  "tools/call",
  "server/discover",
  "ping",
];

type Json = Record<string, unknown>;
type Funcion = (peticion: Request) => Promise<Response>;

export interface DependenciasPunto {
  /** Configuración validada del conector; lanza `configuracion_conector_invalida`. */
  readonly configuracion: () => ConfiguracionConector;
  /** Almacén de producto (rol mcp); en la batería, el de PGlite. Se pide solo cuando hace falta. */
  readonly almacen: () => Almacen;
  readonly prompt: () => PromptFicticio;
  /** Programa el suceso tras la respuesta (por defecto, `after` de Next). */
  readonly despues?: Despues;
}

const esObjeto = (v: unknown): v is Json =>
  v !== null && typeof v === "object" && !Array.isArray(v);

const CABECERAS_JSON = { "Cache-Control": "no-store", "Content-Type": "application/json" };

function rechazo(estado: number, codigo: string, extra: Record<string, string> = {}): Response {
  return new Response(JSON.stringify({ error: codigo }), {
    status: estado,
    headers: { ...CABECERAS_JSON, ...extra },
  });
}

function errorJsonRpc(
  estado: number,
  codigo: number,
  mensaje: string,
  id: unknown = null,
): Response {
  return new Response(
    JSON.stringify({ jsonrpc: "2.0", id: idSeguro(id), error: { code: codigo, message: mensaje } }),
    { status: estado, headers: CABECERAS_JSON },
  );
}

type Lectura =
  | { readonly tipo: "texto"; readonly texto: string }
  | { readonly tipo: "grande" }
  | { readonly tipo: "utf8" };

// Lee el cuerpo con tope en bytes; pasado el tope cancela el flujo y no sigue leyendo.
async function leerAcotado(peticion: Request): Promise<Lectura> {
  const declarado = peticion.headers.get("content-length");
  if (
    declarado !== null &&
    /^[0-9]{1,15}$/.test(declarado) &&
    Number(declarado) > MAXIMO_CUERPO_BYTES
  ) {
    await peticion.body?.cancel().catch(() => undefined);
    return { tipo: "grande" };
  }
  if (peticion.body === null) return { tipo: "texto", texto: "" };
  const lector = peticion.body.getReader();
  const partes: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await lector.read();
    if (done) break;
    total += value.byteLength;
    if (total > MAXIMO_CUERPO_BYTES) {
      await lector.cancel().catch(() => undefined);
      return { tipo: "grande" };
    }
    partes.push(value);
  }
  const bytes = new Uint8Array(total);
  let desplazamiento = 0;
  for (const parte of partes) {
    bytes.set(parte, desplazamiento);
    desplazamiento += parte.byteLength;
  }
  try {
    return { tipo: "texto", texto: new TextDecoder("utf-8", { fatal: true }).decode(bytes) };
  } catch {
    return { tipo: "utf8" };
  }
}

// Protocolo para el suceso: solo de la lista cerrada; el valor recibido nunca se guarda.
function protocoloDe(cabeceras: Headers, cuerpo: Json | null): ProtocoloSuceso {
  const cabecera = cabeceras.get("mcp-protocol-version");
  if (cabecera !== null && PROTOCOLOS.includes(cabecera)) return cabecera as ProtocoloSuceso;
  if (cuerpo !== null && cuerpo.method === "initialize" && esObjeto(cuerpo.params)) {
    const v = cuerpo.params.protocolVersion;
    if (typeof v === "string" && PROTOCOLOS.includes(v)) return v as ProtocoloSuceso;
  }
  return "otra";
}

interface DatosSuceso {
  tokenHmac?: string | null;
  herramienta?: Herramienta | null;
  resultado: ResultadoSuceso;
  codigo: string;
  protocolo?: ProtocoloSuceso;
}

export function crearPuntoMcp(dependencias: DependenciasPunto): Funcion {
  let enCache: { almacen: Almacen; servidor: ReturnType<typeof crearServidorMcp> } | undefined;
  const servidorDe = (almacen: Almacen) => {
    if (enCache?.almacen !== almacen) {
      enCache = { almacen, servidor: crearServidorMcp({ almacen, prompt: dependencias.prompt }) };
    }
    return enCache.servidor;
  };
  // El almacén se pide cuando el suceso se escribe. Los rechazos previos a la autenticación (pasos 2 a
  // 5) no llegan aquí: solo van a la consola (`anonimo`), sin abrir conexión ni escribir en `sucesos`.
  const registrador: Pick<Almacen, "registrarSuceso"> = {
    registrarSuceso: (suceso) => dependencias.almacen().registrarSuceso(suceso),
  };

  return async (peticion) => {
    const inicio = Date.now();
    const configuracion = dependencias.configuracion(); // 1
    const recurso = `${configuracion.urlPublica}/api/mcp`;

    const terminar = (respuesta: Response, suceso: DatosSuceso): Response => {
      registrarSucesoTrasResponder(
        registrador,
        {
          tokenHmac: suceso.tokenHmac ?? null,
          ruta: RUTA_MCP,
          herramienta: suceso.herramienta ?? null,
          resultado: suceso.resultado,
          codigo: suceso.codigo,
          duracionMs: Math.min(Math.max(Date.now() - inicio, 0), 600000),
          protocolo: suceso.protocolo ?? protocoloDe(peticion.headers, null),
        },
        dependencias.despues,
      );
      return respuesta;
    };
    const rechazado = (
      respuesta: Response,
      codigo: string,
      extra: Partial<DatosSuceso> = {},
    ): Response => terminar(respuesta, { resultado: "rechazado", codigo, ...extra });

    // Rechazo anterior a autenticar: solo consola con código cerrado; ni almacén ni sucesos.
    const anonimo = (respuesta: Response, codigo: Codigo): Response => {
      registrar("aviso", codigo, "/api/mcp");
      return respuesta;
    };

    // 2. Solo POST.
    if (peticion.method !== "POST") {
      return anonimo(
        new Response(null, {
          status: 405,
          headers: { "Cache-Control": "no-store", Allow: "POST" },
        }),
        "metodo_no_permitido",
      );
    }

    // 3. Origin.
    const origen = peticion.headers.get("origin");
    if (
      origen !== null &&
      origen !== configuracion.urlPublica &&
      !ORIGENES_AJENOS.includes(origen)
    ) {
      await peticion.body?.cancel().catch(() => undefined);
      return anonimo(rechazo(403, "origen_no_permitido"), "origen_no_permitido");
    }

    // 4. Cuerpo con tope.
    const lectura = await leerAcotado(peticion);
    if (lectura.tipo === "grande") {
      return anonimo(rechazo(413, "cuerpo_demasiado_grande"), "cuerpo_demasiado_grande");
    }

    // 5. Authorization: solo la cabecera.
    const reto = `resource_metadata="${configuracion.urlPublica}/.well-known/oauth-protected-resource/api/mcp", scope="agente"`;
    const cabeceraAuth = peticion.headers.get("authorization");
    const token = cabeceraAuth === null ? null : (RE_BEARER.exec(cabeceraAuth)?.[1] ?? null);
    if (token === null) {
      return anonimo(
        rechazo(401, "sin_token", { "WWW-Authenticate": `Bearer ${reto}` }),
        cabeceraAuth === null ? "sin_token" : "token_no_valido",
      );
    }

    // 6. validar_acceso con el HMAC; el token no sale de aquí.
    const tokenHmac = huellaToken(derivarClaves(configuracion.secreto), "acceso", token);
    const almacen = dependencias.almacen();
    if (!(await almacen.validarAcceso(tokenHmac, recurso))) {
      // Un token inexistente es anónimo: no escribe en `sucesos` (un anónimo no puede llenar la tabla).
      return anonimo(
        rechazo(401, "token_no_valido", {
          "WWW-Authenticate": `Bearer error="invalid_token", ${reto}`,
        }),
        "token_no_valido",
      );
    }

    // 7. JSON.
    const comun = { tokenHmac };
    if (lectura.tipo === "utf8") {
      return rechazado(errorJsonRpc(400, -32700, "Error de sintaxis"), "json_no_valido", comun);
    }
    let cuerpo: unknown;
    let correcto = true;
    try {
      cuerpo = JSON.parse(lectura.texto);
    } catch {
      correcto = false;
    }
    if (!correcto) {
      return rechazado(errorJsonRpc(400, -32700, "Error de sintaxis"), "json_no_valido", comun);
    }
    if (!esObjeto(cuerpo)) {
      return rechazado(
        errorJsonRpc(400, -32600, "Petición no válida"),
        "peticion_no_valida",
        comun,
      );
    }
    const protocolo = protocoloDe(peticion.headers, cuerpo);
    // Lista cerrada: el SDK no ve ningún otro método (`subscriptions/listen` abre un flujo SSE sin fin).
    if (typeof cuerpo.method !== "string" || !METODOS_PERMITIDOS.includes(cuerpo.method)) {
      return rechazado(
        errorJsonRpc(200, -32601, "Método no encontrado", cuerpo.id),
        "metodo_no_permitido",
        { ...comun, protocolo },
      );
    }
    if (cuerpo.method === "tools/call") {
      const nombre = esObjeto(cuerpo.params) ? cuerpo.params.name : undefined;
      if (typeof nombre !== "string" || !(HERRAMIENTAS as readonly string[]).includes(nombre)) {
        return rechazado(
          errorJsonRpc(200, -32602, "Parámetros no válidos", cuerpo.id),
          "herramienta_desconocida",
          { ...comun, protocolo },
        );
      }
    }

    // 8 y 9: SDK y filtro. Si lanza (configuración, almacén, error inesperado), responde el manejador.
    const r = await servidorDe(almacen).atender({
      url: recurso,
      cabeceras: peticion.headers,
      signal: peticion.signal,
      texto: lectura.texto,
      cuerpo,
      tokenHmac,
      recurso,
    });
    // 10.
    return terminar(r.respuesta, {
      tokenHmac,
      herramienta: r.herramienta,
      resultado: r.resultado,
      codigo: r.codigo,
      protocolo,
    });
  };
}

// El punto de producto: configuración del entorno, almacén con el rol mcp y prompt del repositorio.
export const puntoMcp: Funcion = crearPuntoMcp({
  configuracion: cargarConfiguracionConector,
  almacen: almacenDelConector,
  prompt: obtenerPromptFicticio,
});
