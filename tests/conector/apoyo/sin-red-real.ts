// Bloquea el fetch global real (T-102, 001): ninguna prueba sale a internet por descuido. Las pruebas
// usan el doble de red (red.ts). Está registrado como `setupFiles` en vitest.config.ts, así que vale
// para todas las pruebas, y también se instala al importar el apoyo (index.ts).
//
// Este archivo bloquea SOLO globalThis.fetch.
// PENDIENTE: ampliar a node:net/tls/http/https/dns, WebSocket y EventSource antes de la primera
// prueba que use `postgres` o un SDK sin fetch (T-105).
// No se hace no reasignable: configurable:false rompe vi.stubGlobal (comprobado).

const MENSAJE = "red real bloqueada en las pruebas: usa el doble de red (crearDobleRed)";

export function bloquearFetchGlobal(): void {
  globalThis.fetch = (() => Promise.reject(new Error(MENSAJE))) as typeof globalThis.fetch;
}

bloquearFetchGlobal();
