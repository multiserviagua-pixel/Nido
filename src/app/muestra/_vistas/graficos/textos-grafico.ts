// Textos de las páginas de la muestra de `GraficoLineas` y `GraficoBarras` (T-010 (h)). Son de la
// muestra, no de los componentes: los textos de los componentes salen de `src/components/textos.ts`.
export const TEXTOS_GRAFICO = {
  lineas: {
    "una-serie": ["Una serie", "Una sola serie en el color de acento, con marcador en cada punto."],
    "cuatro-series": [
      "Cuatro series",
      "Cuatro series que se distinguen también sin color: trazo continuo, continuo grueso, a rayas y de puntos, cada una con su marcador.",
    ],
    "con-hueco": [
      "Con huecos",
      "Un día sin dato es un hueco: la línea no se une y no se pinta un cero. En la tabla pone «Sin datos».",
    ],
    "pocos-puntos": [
      "Menos puntos que el mínimo",
      "Hay un solo dato y la vista pide tres: en lugar del gráfico, «Sin datos suficientes».",
    ],
    "sin-datos": ["Sin datos", "Sin datos: se dice, no se dibuja nada."],
    "tabla-abierta": ["Con la tabla abierta", "El bloque de la tabla equivalente sale abierto."],
    "un-punto": ["Un solo punto", "Un punto con su marcador, sin línea."],
    "valores-iguales": ["Valores iguales", "Todos los valores son iguales: una línea horizontal."],
    negativos: [
      "Con negativos",
      "La vista declara un mínimo que admite negativos; el eje incluye el cero.",
    ],
    "cientos-de-puntos": [
      "366 puntos",
      "Un año entero, dos series: sin marcadores para que no se tapen; el dibujo y la tabla tienen todos los puntos.",
    ],
    "etiquetas-largas-120": [
      "Etiquetas de 120 caracteres",
      "Título, ejes, unidad y series de 120 caracteres: se parten en el texto; en el eje se abrevian y la tabla las trae enteras.",
    ],
    "texto-hostil": [
      "Texto hostil",
      "Cadenas hostiles en título, ejes, series y categorías: se pintan como texto.",
    ],
  },
  barras: {
    "una-serie": ["Una serie", "Una serie en el color de acento. El eje empieza en cero."],
    "varias-series": [
      "Varias series",
      "Tres series que se distinguen por la trama además del color.",
    ],
    "con-cero": [
      "Con un valor cero",
      "Un valor cero se marca con una raya sobre el eje; no se confunde con un hueco.",
    ],
    "pocos-puntos": [
      "Menos puntos que el mínimo",
      "Hay un solo dato y la vista pide tres: en lugar del gráfico, «Sin datos suficientes».",
    ],
    "sin-datos": ["Sin datos", "Sin datos: se dice, no se dibuja nada."],
    "tabla-abierta": ["Con la tabla abierta", "El bloque de la tabla equivalente sale abierto."],
    "valores-iguales": [
      "Valores iguales",
      "Todos los valores son iguales: barras de la misma altura.",
    ],
    "muchos-puntos": [
      "61 barras",
      "Dos meses de datos diarios: el dibujo y la tabla tienen todos los puntos.",
    ],
    "etiquetas-largas-120": [
      "Etiquetas de 120 caracteres",
      "Título, ejes, unidad y series de 120 caracteres: se parten en el texto; en el eje se abrevian y la tabla las trae enteras.",
    ],
    "texto-hostil": [
      "Texto hostil",
      "Cadenas hostiles en título, ejes, series y categorías: se pintan como texto.",
    ],
  },
} as const;
