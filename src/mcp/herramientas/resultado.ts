// Resultado común de las herramientas del conector (T-105, 001). El punto MCP (servidor.ts) lo
// convierte en `structuredContent` y texto con el mismo JSON, o en `isError` con un código fijo.
// Nunca lleva valores recibidos (art. 1).

export interface ContextoHerramienta {
  /** HMAC del token de acceso ya presentado y validado; el token nunca entra en las herramientas. */
  readonly tokenHmac: string;
  /** Recurso (URL del conector) al que se emitió el token. */
  readonly recurso: string;
}

/** Fallos sin forma en el contrato: lista cerrada (diseño §Herramientas). */
export type CodigoFalloHerramienta = "error_temporal" | "no_autorizado" | "error_interno";

export type ResultadoHerramienta =
  | { readonly ok: true; readonly salida: Record<string, unknown> }
  | { readonly ok: false; readonly codigo: CodigoFalloHerramienta };
