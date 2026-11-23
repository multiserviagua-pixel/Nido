// Textos de las páginas de la muestra de `ListaAlertas` (T-010 (i)). Son de la muestra, no del
// componente: los textos de la lista salen de `src/components/textos.ts`.
export const TEXTOS_ALERTAS = {
  titulo: "Alertas de ejemplo",
  explicaciones: {
    gravedades: "Una alerta de cada gravedad, sin acción: la palabra, el icono y el tono.",
    "con-accion": "Alertas con un botón de acción, que se usa con teclado. La acción es ficticia.",
    "accion-en-curso": "Una acción en curso: el botón lo dice con palabra y no se vuelve a enviar.",
    vacia: "Sin alertas: se enseña el estado vacío, no una lista vacía.",
    desconocidas:
      "Gravedad, tipo y acción fuera de las listas, entradas que no son objetos y campos de más: se leen como desconocidos y no se pinta nada de lo recibido.",
    "nombres-largos-120": "Clientes con nombres de 120 caracteres: se parten, no se recortan.",
    "texto-hostil":
      "Cadenas hostiles como nombre de cliente: se pintan como texto, sin crear elementos.",
  },
  accionesPedidas: "Acciones pedidas",
  ultimaAccion: "Última acción pedida",
  ninguna: "Ninguna",
  alertaNumero: "alerta",
  accion: "acción",
} as const;
