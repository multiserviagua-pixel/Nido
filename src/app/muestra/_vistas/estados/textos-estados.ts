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
  bloque: {
    titulo: "Bloque de datos de ejemplo",
    explicaciones: {
      carga: "Carga: esqueleto, «Cargando» una vez, aviso a los 10 segundos y error a los 30.",
      vacio: "Vacío: dice qué pasa y qué hacer.",
      error:
        "Error del servidor, con referencia y «Reintentar», que vuelve a pedir solo este bloque.",
      "sin-permiso":
        "Sin permiso: el mismo estado que la dirección inexistente, sin nada del recurso.",
      datos: "Con datos: el contenido de la fuente.",
      "datos-parciales":
        "Tres fuentes y la segunda falla: ese bloque lo dice y las otras dos se pintan.",
      "respuesta-tardia":
        "Respuestas a mano: la del envío en curso lo resuelve, la de un envío anterior no pisa nada.",
      "conserva-hijos":
        "Con los hijos conservados: un contador de cliente que no debe perder su cuenta al pasar por la carga o el error.",
      "carga-a-tarjeta": "Del esqueleto de tarjeta a la tarjeta real.",
      "carga-a-tabla": "Del esqueleto de tabla a una tabla de cinco filas.",
      "carga-a-tabla-llena": "Del esqueleto de tabla a una página llena de veinticinco filas.",
      "carga-a-grafico": "Del esqueleto de gráfico al gráfico real.",
      "carga-a-lista": "Del esqueleto de lista a tres alertas.",
    },
    contadorHijo: "Pulsaciones del hijo",
    poner: { datos: "Poner datos", carga: "Poner carga", error: "Poner error" },
    envioActual: "Envío en curso",
    reintentosPedidos: "Reintentos pedidos",
    accionesPedidas: "Acciones pedidas",
    responderDatos: "Responder con datos",
    responderError: "Responder con error",
    responderAnterior: "Responder al primer envío",
    fuente: "Fuente",
    marcador: "Contenido que va debajo del bloque",
  },
  aviso: {
    titulo: "Aviso de conexión de ejemplo",
    explicaciones: {
      "sin-conexion":
        "Corta la red del navegador: el armazón dice «Sin conexión» y cada bloque con datos añade la hora en que los cargó.",
      recuperada:
        "Al volver la red, el aviso se retira, se anuncia «Conexión recuperada» y las horas de carga desaparecen.",
    },
    bloqueUno: "Primer bloque con datos",
    bloqueDos: "Segundo bloque con datos",
  },
} as const;
