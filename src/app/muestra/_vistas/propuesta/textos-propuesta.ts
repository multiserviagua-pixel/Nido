// Textos propios de las páginas `/muestra/propuesta-visual` y `/muestra/valores` (T-012). Son de la
// muestra, no del producto: no salen de `src/components/textos.ts` (la muestra no es una vista del
// cliente) y desaparecen con ella. Español de España, trato de tú. Datos y nombres, ficticios.

export const TEXTOS_PROPUESTA = {
  titulo: "Propuesta visual",
  tituloValores: "Valores de diseño",
  introduccion:
    "Esto es lo que se te pide validar (T-013): la paleta y los degradados, el logotipo y tres vistas de ejemplo. Cada bloque sale en el tema claro y en el oscuro a la vez; la página que lo rodea sigue el tema de tu sistema.",
  /** Declaración honesta (artículo 13): lo que se ve no son los componentes definitivos. */
  declaracion:
    "Las tres vistas son una representación de la propuesta; los componentes definitivos llegan tras la validación. Llevan datos ficticios, no se pueden pulsar y el gráfico es un dibujo de ejemplo.",
  graficoFicticio: "Gráfico de ejemplo, con datos ficticios",
  graficoDescripcion:
    "Una línea que sube de forma irregular a lo largo del periodo, con un relleno suave debajo. Es un dibujo, no una serie real.",
  temaClaro: "Tema claro",
  temaOscuro: "Tema oscuro",
  paleta: {
    titulo: "Paleta y degradados",
    texto:
      "Un solo acento morado, neutros azulados y un menú azul noche que es el mismo en los dos temas. Cada muestra es un papel de valores.css; el nombre es el del papel.",
    colores: "Papeles de color",
    degradados: "Degradados",
  },
  logotipos: {
    titulo: "Logotipos",
    texto:
      "Tres propuestas de nido de aves. Cada una se ve a 16, 32 y 128 píxeles sobre fondo claro (variante para la página), sobre fondo oscuro (variante para el menú) y como icono de aplicación, que lleva su propio fondo.",
    sobreClaro: "Sobre claro",
    sobreOscuro: "Sobre oscuro",
    icono: "Icono de aplicación",
    pixeles: "px",
    propuesta: "Propuesta",
  },
  vistas: {
    titulo: "Tres vistas de ejemplo",
    resumenSuperadmin: {
      titulo: "Resumen de superadmin",
      descripcion:
        "Menú azul noche con el área actual marcada, cabecera con el título y la cuenta, tres tarjetas de cifras, un gráfico de ejemplo y la lista de alertas.",
    },
    tablaDialogo: {
      titulo: "Tabla con el diálogo abierto",
      descripcion:
        "Una tabla de clientes ficticios con un diálogo de confirmación encima y el fondo atenuado con el velo. El diálogo dice qué va a pasar y cuándo.",
    },
    resumenCliente: {
      titulo: "Resumen de cliente a 375 píxeles",
      descripcion:
        "Lo mismo que el resumen, en una pantalla de móvil: el menú pasa a un botón, las tarjetas se apilan y todo cabe sin desplazamiento horizontal.",
    },
  },
  valores: {
    introduccion:
      "La escala de valores.css, pintada. Es la lista cerrada de la que salen todos los papeles: ninguna pantalla usa un valor que no esté aquí.",
    color: "Color",
    degradados: "Degradados",
    espaciado: "Espaciado",
    radios: "Radios",
    sombras: "Sombras",
    texto: "Texto",
    tamanos: "Tamaños y duraciones",
    pesos: "Pesos",
    paso: "Paso",
    valor: "Valor",
    muestra: "Muestra",
    ejemploTexto: "Texto de ejemplo",
  },
} as const;
