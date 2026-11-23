// Textos de las páginas de la muestra de `DialogoConfirmacion` (T-010 (j)). Son de la muestra, no
// del componente: los textos del diálogo salen de `src/components/textos.ts`.
export const TEXTOS_DIALOGO = {
  titulo: "Diálogo de confirmación de ejemplo",
  explicaciones: {
    pausar:
      "Pausar y reanudar un agente ficticio. La respuesta del servidor es simulada y se elige antes de abrir el diálogo.",
    "objetivo-120":
      "Un objetivo con nombre y dato distintivo de 120 caracteres: se parte, no se recorta.",
    "texto-hostil":
      "Cadenas hostiles como nombre y como dato distintivo del objetivo: se pintan como texto, sin crear elementos.",
  },
  abrirPausar: "Abrir pausar",
  abrirReanudar: "Abrir reanudar",
  abrirObjetivo: "Abrir con el objetivo",
  etiquetaRespuesta: "Respuesta simulada del servidor",
  respuestas: {
    hecha: "Se aplicó (hecha)",
    rechazada: "No se aplicó (rechazada)",
    no_permitida: "Sin permiso (401)",
    servidor: "Error del servidor (500)",
    ilegible: "Cuerpo ilegible",
    desconocida: "Resultado desconocido",
    sin_respuesta: "Ninguna respuesta",
    tardia: "Respuesta a los 35 s",
  },
  envios: "Envíos",
  relecturas: "Relecturas del estado",
  hechas: "Acciones aplicadas",
  objetivoEjemplo: "Agente ficticio de ejemplo",
  distintivoEjemplo: "AG-0042",
} as const;
