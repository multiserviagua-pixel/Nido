import { textoPlano } from "../formato/texto-plano";

/** Texto que solo lee el lector de pantalla. Solo admite una cadena: un elemento se descarta. */
export function SoloLector({ children }: { children: string }) {
  return <span className="sr-only">{textoPlano(children)}</span>;
}
