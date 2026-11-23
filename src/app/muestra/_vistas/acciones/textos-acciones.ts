// Textos de la página de la muestra de `Boton` y `useAccion` (T-010 (d)). Son de la muestra, no de
// los componentes: el simulador de respuestas del servidor solo existe aquí. Los textos de los
// componentes salen de `src/components/textos.ts`.
export const TEXTOS_ACCIONES = {
  tituloSimulador: "Simulador de la respuesta del servidor",
  explicacion:
    "La muestra no llama a ningún servidor. Pulsa «Pausar» para enviar y elige después cómo responde el servidor, a qué envío y cuándo.",
  etiquetaRespuesta: "Qué responde el servidor",
  respuestas: {
    hecha: "Hecha, con confirmación expresa",
    rechazada: "Rechazada, con motivo",
    no_permitida: "Sesión caducada (401)",
    servidor: "Error del servidor (500)",
    ilegible: "Cuerpo ilegible",
    desconocida: "Resultado desconocido (200)",
  },
  responderAntiguo: "Responder al envío más antiguo",
  responderReciente: "Responder al envío más reciente",
  envios: "Envíos hechos",
  pendientes: "Envíos sin respuesta",
  relecturas: "Relecturas de la vista",
  mensajes: "Mensaje de la acción",
  sinMensaje: "Sin mensaje",
  tituloVariantes: "Variantes y estados",
  primario: "Primario",
  secundario: "Secundario",
  peligro: "Peligro",
  enCurso: "En curso",
  enReposo: "En reposo",
} as const;
