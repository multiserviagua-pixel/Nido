// Textos de las páginas de la muestra de `AvisosTemporales` (T-016 (b)). Son de la muestra, no del
// componente: los textos de los avisos y «Cerrar aviso» salen de `src/components/textos.ts`.
export const TEXTOS_AVISOS = {
  titulo: "Avisos temporales de ejemplo",
  explicaciones: {
    uno: "Un aviso: dura 8 segundos, se detiene con el puntero o el foco encima y no mueve el foco al aparecer.",
    dos: "Dos avisos a la vez: se apilan sin solaparse y, al cerrar uno con el foco dentro, el foco pasa al otro.",
    cinco:
      "Cinco avisos a la vez: la región mide como mucho el 40 % de la ventana y se desplaza por dentro.",
    "texto-largo":
      "Un aviso con un texto largo: se parte en varias líneas, sin recortarse ni desbordar a 320 píxeles.",
  },
  mostrarUno: "Mostrar aviso",
  mostrarVarios: "Mostrar avisos",
  neutro: "Botón que no abre nada",
  relleno:
    "Este bloque da altura a la página para comprobar que los avisos no tapan lo que tiene el foco.",
  final: "Último control de la página",
} as const;
