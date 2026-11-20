// Servidor del punto MCP (T-105 g, 001; diseño §Punto MCP, pasos 8 y 9; REQ-009, REQ-013).
// `createMcpHandler` con `legacy: 'stateless'` y `responseMode: 'json'` (V-1), sin `mcp-handler`. Las
// herramientas se registran con entrada abierta y sin `outputSchema`: valida el conector con Ajv
// (entrada de cada herramienta y salida antes de responder) y publica el filtro de `salida.ts`, que
// sustituye lo que el SDK compone por lo que dicen los contratos.
//
// - Paso 8: el SDK recibe una petición SIN `Authorization` ni `Cookie` (solo `content-type`, `accept`
//   y `mcp-*`), con el cuerpo ya analizado por `entrada.ts`. El HMAC del token y el recurso viajan en
//   un contexto asíncrono de la propia llamada; el token nunca entra.
// - Cierre en fallo (art. 3): si una herramienta lanza (`error_no_controlado`, prompt no disponible ->
//   `configuracion_conector_invalida`), el SDK solo ve un `isError` genérico y esta capa vuelve a
//   lanzar el código cerrado para que `manejador.ts` responda 500 o 503 sin cuerpo de error propio.
// - Nota (revisión 7): el SDK emite por su cuenta un `console.warn` de texto fijo (sin valores
//   recibidos); fuera de `desarrollo`, `sustituirConsola` lo reduce a una línea cerrada. No se silencia.
import { AsyncLocalStorage } from "node:async_hooks";
import { createMcpHandler, fromJsonSchema, McpServer } from "@modelcontextprotocol/server";
import { ErrorDeAplicacion } from "../lib/plataforma/errores";
import type { Almacen } from "../lib/supabase/almacen";
import { contratoPublicado, HERRAMIENTAS, type Herramienta } from "./esquemas/contratos";
import { crearConfirmarOrden } from "./herramientas/confirmar-orden";
import { crearEnviarInforme } from "./herramientas/enviar-informe";
import { crearObtenerInstrucciones } from "./herramientas/obtener-instrucciones";
import type { ResultadoHerramienta } from "./herramientas/resultado";
import type { PromptFicticio } from "./prompt-ficticio";
import { filtrarRespuestaConEstado } from "./salida";

export interface DependenciasServidor {
  readonly almacen: Almacen;
  /** Lectura única con huella (`obtenerPromptFicticio`); lanza `configuracion_conector_invalida`. */
  readonly prompt: () => PromptFicticio;
}

export interface PeticionServidor {
  /** URL de la petición, solo para el SDK. */
  readonly url: string;
  /** Cabeceras recibidas: aquí se reducen a las que el SDK necesita (paso 8). */
  readonly cabeceras: Headers;
  /** Cuerpo en texto, tal como se leyó (con tope) en `entrada.ts`. */
  readonly texto: string;
  /** Mismo cuerpo, ya analizado por `entrada.ts`. */
  readonly cuerpo: unknown;
  /** HMAC del token presentado (ya comprobado con `validar_acceso`). */
  readonly tokenHmac: string;
  /** Recurso (URL del conector) al que se emitió el token. */
  readonly recurso: string;
  /** Señal de la petición original: si el cliente se va, el SDK deja de trabajar. */
  readonly signal?: AbortSignal;
}

/** Plazo total de `atender`: pasado, se rechaza con `error_no_controlado` y se aborta al SDK. */
export const PLAZO_ATENDER_MS = 30_000;

export type ResultadoSuceso = "correcto" | "rechazado" | "error";

export interface ResultadoServidor {
  readonly respuesta: Response;
  /** Herramienta llamada, si la llamada fue a una de las tres. */
  readonly herramienta: Herramienta | null;
  /** Para el suceso (paso 10): resultado y código de lista cerrada; nunca valores recibidos. */
  readonly resultado: ResultadoSuceso;
  readonly codigo: string;
}

const CABECERAS_SDK = new Set(["content-type", "accept"]);

/** Solo lo que el SDK necesita: nunca `Authorization`, `Cookie`, origen ni direcciones. */
export function cabecerasParaSdk(entrada: Headers): Headers {
  const salida = new Headers();
  for (const [nombre, valor] of entrada.entries()) {
    const n = nombre.toLowerCase();
    if (CABECERAS_SDK.has(n) || n.startsWith("mcp-")) salida.set(n, valor);
  }
  return salida;
}

interface ContextoLlamada {
  readonly tokenHmac: string;
  readonly recurso: string;
  resultado?: ResultadoHerramienta;
  fallo?: ErrorDeAplicacion;
}

function herramientaDe(cuerpo: unknown): Herramienta | null {
  if (cuerpo === null || typeof cuerpo !== "object" || Array.isArray(cuerpo)) return null;
  const { method, params } = cuerpo as { method?: unknown; params?: unknown };
  if (method !== "tools/call" || params === null || typeof params !== "object") return null;
  const nombre = (params as { name?: unknown }).name;
  return (HERRAMIENTAS as readonly unknown[]).includes(nombre) ? (nombre as Herramienta) : null;
}

// `createMcpHandler` avisa una vez por instancia, por consola y con un texto fijo del SDK, de que `json`
// descarta las notificaciones intermedias (las tres herramientas no emiten ninguna). No lleva datos.
function crearManejadorSdk(factoria: () => McpServer) {
  return createMcpHandler(factoria, {
    legacy: "stateless",
    responseMode: "json",
    onerror: () => undefined,
  });
}

export function crearServidorMcp(dependencias: DependenciasServidor): {
  atender(peticion: PeticionServidor): Promise<ResultadoServidor>;
} {
  const contexto = new AsyncLocalStorage<ContextoLlamada>();
  const obtener = crearObtenerInstrucciones(dependencias);
  const enviar = crearEnviarInforme({ almacen: dependencias.almacen });
  const confirmar = crearConfirmarOrden({ almacen: dependencias.almacen });

  async function ejecutar(herramienta: Herramienta, argumentos: unknown) {
    const llamada = contexto.getStore();
    if (llamada === undefined) {
      return { content: [{ type: "text" as const, text: "error_interno" }], isError: true };
    }
    try {
      const base = { tokenHmac: llamada.tokenHmac, recurso: llamada.recurso };
      const r: ResultadoHerramienta =
        herramienta === "obtener_instrucciones"
          ? await obtener(base)
          : herramienta === "enviar_informe"
            ? await enviar(base, argumentos)
            : await confirmar(base, argumentos);
      llamada.resultado = r;
      return r.ok
        ? {
            content: [{ type: "text" as const, text: JSON.stringify(r.salida) }],
            structuredContent: r.salida,
          }
        : { content: [{ type: "text" as const, text: r.codigo }], isError: true };
    } catch (error) {
      llamada.fallo =
        error instanceof ErrorDeAplicacion ? error : new ErrorDeAplicacion("error_no_controlado");
      return { content: [{ type: "text" as const, text: "error_interno" }], isError: true };
    }
  }

  const manejador = crearManejadorSdk(() => {
    const servidor = new McpServer({ name: "humanaia-conector-prueba", version: "0.1.0" });
    for (const herramienta of HERRAMIENTAS) {
      const publicada = contratoPublicado(herramienta);
      servidor.registerTool(
        herramienta,
        {
          description: publicada.description,
          inputSchema: fromJsonSchema({ type: "object", additionalProperties: true }),
          annotations: publicada.annotations,
        },
        (argumentos: unknown) => ejecutar(herramienta, argumentos),
      );
    }
    return servidor;
  });

  async function atenderSinPlazo(
    peticion: PeticionServidor,
    signal: AbortSignal,
  ): Promise<ResultadoServidor> {
    const llamada: ContextoLlamada = { tokenHmac: peticion.tokenHmac, recurso: peticion.recurso };
    const herramienta = herramientaDe(peticion.cuerpo);
    const paraSdk = new Request(peticion.url, {
      method: "POST",
      headers: cabecerasParaSdk(peticion.cabeceras),
      body: peticion.texto,
      signal,
    });
    const bruta = await contexto.run(llamada, () =>
      manejador.fetch(paraSdk, { parsedBody: peticion.cuerpo }),
    );
    const falloDe = (): ErrorDeAplicacion | undefined => llamada.fallo;
    const antes = falloDe();
    if (antes !== undefined) throw new ErrorDeAplicacion(antes.codigo);
    const { respuesta, hayError } = await filtrarRespuestaConEstado(bruta, herramienta);
    // En 2025-11-25 el SDK puede responder por flujo antes de que la herramienta termine: se vuelve a mirar.
    const tardio = falloDe();
    if (tardio !== undefined) throw new ErrorDeAplicacion(tardio.codigo);

    const r = llamada.resultado;
    if (r === undefined) {
      return {
        respuesta,
        herramienta,
        resultado: hayError ? "rechazado" : "correcto",
        codigo: hayError ? "error_protocolo" : "ok",
      };
    }
    if (!r.ok) {
      return { respuesta, herramienta, resultado: "error", codigo: r.codigo };
    }
    const motivo =
      typeof r.salida.motivo === "string"
        ? r.salida.motivo
        : r.salida.confirmada === false
          ? "no_confirmada"
          : null;
    return motivo === null
      ? { respuesta, herramienta, resultado: "correcto", codigo: "ok" }
      : { respuesta, herramienta, resultado: "rechazado", codigo: motivo };
  }

  return {
    async atender(peticion) {
      const control = new AbortController();
      let temporizador: ReturnType<typeof setTimeout> | undefined;
      const plazo = new Promise<never>((_, rechazar) => {
        temporizador = setTimeout(() => {
          control.abort();
          rechazar(new ErrorDeAplicacion("error_no_controlado"));
        }, PLAZO_ATENDER_MS);
      });
      const signal =
        peticion.signal === undefined
          ? control.signal
          : AbortSignal.any([peticion.signal, control.signal]);
      try {
        return await Promise.race([atenderSinPlazo(peticion, signal), plazo]);
      } finally {
        clearTimeout(temporizador);
      }
    },
  };
}
