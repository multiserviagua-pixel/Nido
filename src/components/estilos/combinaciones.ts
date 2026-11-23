// Pares de color declarados de los dos temas (020 T-007 (g); diseño «Cómo se comprueba el
// contraste»). Cada par es un papel de delante sobre un papel de detrás (un color o un degradado).
// PRUEBA-006 calcula su contraste con los valores reales de `valores.css`: 4,5:1 en todo texto,
// también el grande, y 3:1 en lo demás; sobre un degradado, el peor de 33 puntos. La tabla
// «Contraste calculado» de `docs/DISENO.md` dice lo mismo, y la prueba lo comprueba.
// Un componente que pinte un par que no esté aquí no pasa PRUEBA-022.

export type Tema = "claro" | "oscuro";

/** `texto` pide 4,5:1; `no-texto` (borde de control, estado, foco, icono con significado, serie) pide 3:1. */
export type TipoDePar = "texto" | "no-texto";

export type Par = {
  /** Papel de delante, con sus dos guiones: `--texto`. */
  delante: string;
  /** Papel de detrás: un color o un degradado. */
  detras: string;
  tipo: TipoDePar;
  /** Dónde se usa; sirve de informe para quien revise. */
  donde: string;
};

const SOBRE_PAGINA_Y_TARJETA = ["--fondo-pagina", "--superficie"] as const;

function texto(delante: string, detras: string, donde: string): Par {
  return { delante, detras, tipo: "texto", donde };
}
function noTexto(delante: string, detras: string, donde: string): Par {
  return { delante, detras, tipo: "no-texto", donde };
}

/** Los pares de un tema. Hoy los dos temas declaran los mismos; la lista se construye una vez por
 * tema para que uno pueda diferir del otro sin tocar el otro. */
function paresDelTema(): Par[] {
  return [
    // Texto principal y secundario
    texto("--texto", "--fondo-pagina", "Texto general de la página"),
    texto("--texto", "--superficie", "Texto de tarjetas, tablas y diálogos"),
    texto("--texto", "--acento-suave", "Texto sobre una selección o un icono con fondo suave"),
    texto("--texto-secundario", "--fondo-pagina", "Etiquetas, ayudas y periodos sobre la página"),
    texto("--texto-secundario", "--superficie", "Etiquetas, ayudas y periodos en tarjetas"),
    texto("--texto-secundario", "--acento-suave", "Ayudas sobre una selección"),
    // Enlaces y acento
    texto("--enlace", "--fondo-pagina", "Enlaces sobre la página"),
    texto("--enlace", "--superficie", "Enlaces en tarjetas, tablas y diálogos"),
    texto("--enlace", "--acento-suave", "Enlaces sobre una selección"),
    texto("--acento", "--acento-suave", "Texto de la opción seleccionada"),
    texto("--texto-sobre-acento", "--acento", "Texto del botón primario en reposo"),
    texto("--texto-sobre-acento", "--degradado-acento", "Texto del botón primario con degradado"),
    // Estados, siempre con palabra o icono
    ...SOBRE_PAGINA_Y_TARJETA.map((f) => texto("--correcto", f, "Etiqueta de estado correcto")),
    ...SOBRE_PAGINA_Y_TARJETA.map((f) => texto("--aviso", f, "Etiqueta de estado de aviso")),
    ...SOBRE_PAGINA_Y_TARJETA.map((f) => texto("--error", f, "Etiqueta y mensaje de error")),
    texto("--error", "--acento-suave", "Mensaje de error sobre un fondo suave"),
    // Menú lateral
    texto("--menu-texto", "--degradado-menu", "Entradas del menú"),
    texto("--menu-texto", "--menu-actual", "Entrada del área actual"),
    texto("--menu-texto-secundario", "--degradado-menu", "Textos menores del menú"),
    // No texto
    ...SOBRE_PAGINA_Y_TARJETA.map((f) =>
      noTexto("--borde-control", f, "Borde de campos, casillas y selectores"),
    ),
    noTexto("--borde-control", "--acento-suave", "Borde de un control sobre un fondo suave"),
    ...SOBRE_PAGINA_Y_TARJETA.map((f) => noTexto("--foco", f, "Contorno de foco")),
    noTexto("--foco", "--acento-suave", "Contorno de foco sobre un fondo suave"),
    noTexto("--foco", "--degradado-menu", "Contorno de foco en el menú"),
    noTexto("--foco", "--menu-actual", "Contorno de foco en el área actual"),
    noTexto("--menu-indicador", "--degradado-menu", "Barra lateral del área actual"),
    noTexto("--menu-indicador", "--menu-actual", "Barra lateral sobre el fondo del área actual"),
    ...["--serie-1", "--serie-2", "--serie-3", "--serie-4"].map((s) =>
      noTexto(s, "--superficie", "Serie de un gráfico"),
    ),
    // Botón de peligro (acción destructiva): relleno y borde `--error`, texto `--texto-sobre-acento`.
    // El borde y el relleno son el mismo color; contra la página y la tarjeta ya lo miden los pares
    // de texto de `--error` (4,5:1, más exigentes que los 3:1 de un borde).
    texto("--texto-sobre-acento", "--error", "Texto del botón de peligro"),
  ];
}

export const COMBINACIONES: Record<Tema, readonly Par[]> = {
  claro: paresDelTema(),
  oscuro: paresDelTema(),
};

export type Prohibida = {
  delante: string;
  detras: string;
  /** Temas en los que no llega al umbral (PRUEBA-006 lo comprueba). */
  temas: readonly Tema[];
  umbral: number;
  motivo: string;
};

/** Pares que no llegan al umbral y no se declaran. La tabla de `docs/DISENO.md` los repite. */
export const PROHIBIDAS: readonly Prohibida[] = [
  {
    delante: "--correcto",
    detras: "--acento-suave",
    temas: ["claro"],
    umbral: 4.5,
    motivo: "Texto por debajo de 4,5:1",
  },
  {
    delante: "--aviso",
    detras: "--acento-suave",
    temas: ["claro"],
    umbral: 4.5,
    motivo: "Texto por debajo de 4,5:1",
  },
  {
    delante: "--borde-decorativo",
    detras: "--superficie",
    temas: ["claro", "oscuro"],
    umbral: 3,
    motivo: "Separa, no delimita un control",
  },
  {
    delante: "--foco",
    detras: "--acento",
    temas: ["claro", "oscuro"],
    umbral: 3,
    motivo: "El foco va separado del botón, sobre el fondo",
  },
  {
    delante: "--texto-sobre-acento",
    detras: "--foco",
    temas: ["claro"],
    umbral: 4.5,
    motivo: "--foco no es un fondo",
  },
];

/** Un papel de delante sobre un fondo que lleva encima el velo (`--sombra-velo`). El fondo que se
 * mide es el que resulta de pintar el velo sobre `sobre`, mezclado en sRGB. Todos son no texto: lo
 * que se separa es el borde del cajón o del panel, no un texto. */
export type ParConVelo = {
  delante: string;
  /** Papel de fondo que queda debajo del velo. */
  sobre: string;
  donde: string;
};

/** Pares del velo (020 T-011 (a)). El velo oscurece en claro (0,5 de neutro 900) y casi no cambia un
 * fondo ya oscuro en oscuro (0,7 de neutro 950); por eso el borde del cajón es `--menu-texto` en los
 * dos temas, y el panel de la cuenta se separa por su superficie en claro y por su borde de control
 * en oscuro. Lo comprueba PRUEBA-006 (`contraste.test.ts`); la tabla «Velo» de `docs/DISENO.md` lo repite. */
export const PARES_CON_VELO: Record<Tema, readonly ParConVelo[]> = {
  claro: [
    { delante: "--menu-texto", sobre: "--fondo-pagina", donde: "Borde del cajón del menú" },
    { delante: "--menu-texto", sobre: "--superficie", donde: "Borde del cajón del menú" },
    { delante: "--superficie", sobre: "--fondo-pagina", donde: "Panel de la cuenta" },
    { delante: "--superficie", sobre: "--superficie", donde: "Panel de la cuenta" },
  ],
  oscuro: [
    { delante: "--menu-texto", sobre: "--fondo-pagina", donde: "Borde del cajón del menú" },
    { delante: "--menu-texto", sobre: "--superficie", donde: "Borde del cajón del menú" },
    { delante: "--borde-control", sobre: "--fondo-pagina", donde: "Borde del panel de la cuenta" },
    { delante: "--borde-control", sobre: "--superficie", donde: "Borde del panel de la cuenta" },
  ],
};
