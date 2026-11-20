import { ErrorDeAplicacion } from "./errores";

// Único sitio con JSON.parse y new URL. Los analizadores citan su entrada en el mensaje,
// así que el fallo se sustituye por `entrada_invalida` sin `cause` (diseño §App base, punto 3).

export function analizarJson(texto: string): unknown {
  let resultado: unknown;
  let fallo = false;
  try {
    resultado = JSON.parse(texto);
  } catch {
    fallo = true;
  }
  if (fallo) throw new ErrorDeAplicacion("entrada_invalida");
  return resultado;
}

export function analizarUrl(texto: string, base?: string): URL {
  let resultado: URL | undefined;
  try {
    resultado = new URL(texto, base);
  } catch {
    resultado = undefined;
  }
  if (resultado === undefined) throw new ErrorDeAplicacion("entrada_invalida");
  return resultado;
}
