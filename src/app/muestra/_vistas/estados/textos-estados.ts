// Textos de las páginas de la muestra de los estados de una vista (T-016 (c)). Son de la muestra,
// no de los componentes: los textos de `EstadoVacio`, `EstadoError`, `EstadoSinPermiso` y
// `Esqueleto` salen de `src/components/textos.ts`.
export const TEXTOS_ESTADOS = {
  vacio: {
    titulo: "Estado vacío de ejemplo",
    explicaciones: {
      "con-accion":
        "Dice qué pasa y qué hacer, y trae el botón de la acción que el usuario puede hacer.",
      "sin-accion":
        "Dice qué pasa y qué esperar; sin botón porque el usuario no tiene nada que hacer.",
    },
    accionesPedidas: "Acciones pedidas",
  },
  error: {
    titulo: "Estado de error de ejemplo",
    explicaciones: {
      "sin-conexion": "Motivo «sin conexión», con una referencia creada en el navegador.",
      "fallo-servidor": "Motivo «fallo del servidor», con una referencia del servidor.",
      "respuesta-no-valida": "Motivo «respuesta no válida», con una referencia del servidor.",
      "tarda-demasiado": "Motivo «tarda demasiado», con una referencia del navegador.",
      "sesion-no-valida": "Motivo «sesión no válida», con una referencia creada en el navegador.",
      desconocido: "Motivo «desconocido»: lo que no es de la lista cae aquí.",
      "reintento-en-curso":
        "«Reintentar» ya pulsado: el botón dice la palabra y no se vuelve a lanzar.",
      "referencia-invalida":
        "Llega como referencia un mensaje interno: se descarta y se pinta una referencia creada en el navegador.",
    },
    reintentosPedidos: "Reintentos pedidos",
  },
  sinPermiso: {
    titulo: "Estado sin permiso de ejemplo",
    explicacion:
      "Es el mismo que ve quien pide una dirección que no existe o de un área que no está en esta fase.",
  },
  esqueleto: {
    titulo: "Esqueleto de carga de ejemplo",
    explicaciones: {
      tarjeta: "Esqueleto de una tarjeta de cifra, con su alto.",
      tabla: "Esqueleto de una tabla: título, cabecera y filas.",
      grafico: "Esqueleto de un gráfico, con su proporción.",
      lista: "Esqueleto de una lista de alertas.",
      "carga-lenta": "Carga lenta (más de 10 segundos): añade el aviso, visible y anunciado.",
    },
  },
} as const;
