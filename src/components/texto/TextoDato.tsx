import { textoPlano } from "../formato/texto-plano";

/** Pinta una cadena que llega como dato: un nodo de texto dentro de `bdi`, que aísla su
 * dirección del texto vecino. React la escapa; `textoPlano` quita los caracteres de control y de
 * formato. No admite más propiedad que el texto: ni enlaces, ni atributos, ni HTML. */
export function TextoDato({ texto }: { texto: string }) {
  return <bdi>{textoPlano(texto)}</bdi>;
}
