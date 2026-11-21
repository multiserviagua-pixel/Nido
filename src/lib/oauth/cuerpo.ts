// Lectura de un cuerpo con tope en bytes (T-110, 001; A-22). Pasado el tope corta la lectura y no sigue
// descargando; un cuerpo que no sea UTF-8 válido no es texto. Nada de lo leído se registra ni se devuelve.
export type Lectura =
  | { readonly tipo: "texto"; readonly texto: string }
  | { readonly tipo: "grande" }
  | { readonly tipo: "utf8" };

export async function leerCuerpoAcotado(peticion: Request, maximo: number): Promise<Lectura> {
  const declarado = peticion.headers.get("content-length");
  if (declarado !== null && /^[0-9]{1,15}$/.test(declarado) && Number(declarado) > maximo) {
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
    if (total > maximo) {
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
