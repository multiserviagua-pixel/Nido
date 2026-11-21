// Callbacks de los asistentes (T-108 a, 001; diseño §Servidor de autorización). Dos constantes y
// comparación exacta de cadenas: ni patrón, ni normalización, ni el callback variable de T-010, ni
// bucle local. Un valor que no sea texto no coincide con nada (art. 7: lo recibido es dato).
export const CALLBACKS = {
  claude: "https://claude.ai/api/mcp/auth_callback",
  chatgpt: "https://chatgpt.com/connector_platform_oauth_redirect",
} as const;

export type AsistenteCallback = keyof typeof CALLBACKS;

export const LISTA_CALLBACKS: readonly string[] = Object.values(CALLBACKS);

export function asistenteDeCallback(uri: unknown): AsistenteCallback | null {
  if (typeof uri !== "string") return null;
  if (uri === CALLBACKS.claude) return "claude";
  if (uri === CALLBACKS.chatgpt) return "chatgpt";
  return null;
}

export function esCallbackPermitido(uri: unknown): boolean {
  return asistenteDeCallback(uri) !== null;
}
