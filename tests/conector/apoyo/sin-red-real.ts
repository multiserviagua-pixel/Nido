// Bloquea el fetch global real (T-102, 001): ninguna prueba sale a internet por descuido. Las pruebas
// usan el doble de red (red.ts). Se instala al importar el apoyo (index.ts).
//
// PENDIENTE (requiere tocar vitest.config.ts, reservado): registrarlo como `setupFiles` para que
// valga también en las pruebas que no importan el apoyo. Hasta entonces, se instala con el índice.

const MENSAJE = "red real bloqueada en las pruebas: usa el doble de red (crearDobleRed)";

export function bloquearFetchGlobal(): void {
  globalThis.fetch = (() => Promise.reject(new Error(MENSAJE))) as typeof globalThis.fetch;
}

bloquearFetchGlobal();
