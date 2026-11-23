// Textos de las páginas de la muestra de `Formulario` (T-016 (a)). Son de la muestra, no del
// componente: los textos del formulario salen de `src/components/textos.ts`.
export const TEXTOS_FORMULARIO = {
  titulo: "Formulario de ejemplo",
  explicaciones: {
    inicial:
      "Una ficha ficticia con un campo de cada tipo. La respuesta del servidor es simulada y se elige antes de enviar.",
    "enviado-vacio": "La ficha enviada en blanco: un error junto a cada campo obligatorio.",
    "error-servidor":
      "El servidor simulado rechaza el nombre. Rellena el formulario y envíalo: el error llega como un par campo y código.",
    enviando:
      "El servidor simulado no responde. Rellena el formulario y envíalo: el botón dice que está en curso.",
    hecho: "El servidor simulado aplica el cambio. Rellena el formulario y envíalo.",
    "conexion-perdida":
      "Se pierde la conexión al enviar. Rellena el formulario y envíalo: lo escrito se conserva.",
    "tipos-de-campo": "Cada tipo de campo, obligatorio y opcional.",
  },
  etiquetaRespuesta: "Respuesta simulada del servidor",
  respuestas: {
    hecha: "Se aplicó (hecha)",
    campo_conocido: "Rechazada con un error en el nombre",
    campo_desconocido: "Rechazada con un campo desconocido",
    codigo_desconocido: "Rechazada con un código desconocido",
    motivo_conocido: "Rechazada con un motivo de la lista",
    no_permitida: "Sin permiso (401)",
    servidor: "Error del servidor (500)",
    ilegible: "Cuerpo ilegible",
    desconocida: "Resultado desconocido",
    sin_conexion: "Se pierde la conexión",
    sin_respuesta: "Ninguna respuesta",
  },
  envios: "Envíos",
  relecturas: "Relecturas del estado",
  hechas: "Acciones aplicadas",
  ultimoCuerpo: "Lo que viajó en el último envío",
  ninguno: "Ninguno",
} as const;
