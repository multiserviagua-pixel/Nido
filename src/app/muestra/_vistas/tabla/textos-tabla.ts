// Textos de las páginas de la muestra de `Tabla`, `Paginacion` y `RegionDesplazable` (T-010 (g)).
// Son de la muestra, no de los componentes: los textos de los componentes salen de
// `src/components/textos.ts`.
export const TEXTOS_TABLA = {
  tituloDeLaTabla: "Clientes de ejemplo",
  nombresLargos: "Asociaciones de ejemplo",
  hostil: "Cadenas hostiles de ejemplo",
  ancha: "Medidas de ejemplo",
  explicaciones: {
    datos:
      "1.234 filas ficticias, 25 por página. Ordena por cada columna con teclado, ratón o táctil.",
    intermedia: "Página intermedia, ordenada de mayor a menor por correos revisados.",
    ultima: "Última página: nueve filas.",
    "una-pagina": "Ocho filas: una sola página, sin botones de paginación.",
    vacia: "Sin filas: se enseña el estado vacío, no una tabla vacía.",
    "diez-mil": "10.000 filas ficticias: en pantalla nunca hay más de una página.",
    ancha: "Más ancha que la pantalla: solo se desplaza la tabla, dentro de su región.",
    "nombres-largos-120":
      "Nombres de 120 caracteres, con y sin espacios: se parten, no se recortan.",
    "texto-hostil":
      "Cadenas hostiles en los nombres y en los estados: se pintan como texto, sin crear elementos.",
  },
  titulosDeSeccion: {
    datos: "Con datos",
    intermedia: "Página intermedia",
    ultima: "Última página",
    "una-pagina": "Una sola página",
    vacia: "Sin filas",
    "diez-mil": "Diez mil filas",
    ancha: "Más ancha que la pantalla",
    "nombres-largos-120": "Nombres de 120 caracteres",
    "texto-hostil": "Texto hostil",
  },
} as const;
