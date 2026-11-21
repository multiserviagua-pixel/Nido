import { TEXTOS } from "../textos";

/** Primer elemento con foco de cada vista (REQ-009): lleva el foco al contenido principal, que
 * es un destino con `tabindex="-1"`. Es un enlace nativo a un fragmento de la misma página: no
 * necesita código de cliente y vale también sin JavaScript. El fragmento es el único admitido en
 * la dirección (PRUEBA-018) y no lleva datos. Escondido fuera de la ventana, no con `sr-only`:
 * así no recorta y se ve entero al recibir el foco. */
export function EnlaceSaltar({ destino }: { destino: string }) {
  return (
    <a
      href={`#${destino}`}
      className="absolute top-0 left-0 z-10 -translate-y-full bg-superficie px-4 py-3 text-texto focus:translate-y-0"
    >
      {TEXTOS.armazon.saltarAlContenido}
    </a>
  );
}
