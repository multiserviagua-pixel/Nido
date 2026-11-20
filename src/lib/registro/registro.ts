import type { Codigo } from "./codigos";

export type Nivel = "info" | "aviso" | "error";

// Única salida de registro: una línea JSON con campos cerrados {nivel, codigo, ruta, momento}.
// Ningún argumento libre: ni mensajes, ni valores recibidos, ni objetos de error (art. 1).
export function registrar(nivel: Nivel, codigo: Codigo, ruta: string): void {
  const linea = JSON.stringify({ nivel, codigo, ruta, momento: new Date().toISOString() });
  if (nivel === "error") console.error(linea);
  else console.log(linea);
}
