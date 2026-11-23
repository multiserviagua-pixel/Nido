// Logotipos de la propuesta visual como datos (T-012). Salen de los SVG de
// `specs/020-…/propuesta-visual/logotipos/`: cada forma lleva su geometría tal cual y sus colores
// como pasos de la escala (`valores.css`), no como hexadecimales. Una prueba
// (`muestra-propuesta.test.ts`) los compara con los SVG: forma a forma, geometría y color.
// El icono lleva su fondo aparte: la muestra lo dibuja como una caja con el degradado, no como
// `rect` con degradado (los identificadores de degradado se repetirían en la página).

export type Variante = "menu-oscuro" | "fondo-claro" | "icono";
export type Forma = {
  readonly el: "path" | "circle" | "ellipse" | "rect" | "polygon";
  readonly geometria: Readonly<Record<string, string>>;
  /** Paso de la escala (sin `--escala-`) o `null` si no se rellena. */
  readonly relleno: string | null;
  readonly trazo: string | null;
};
export type DatosDeVariante = {
  readonly formas: readonly Forma[];
  readonly fondo?: { readonly radio: string; readonly desde: string; readonly hasta: string };
  readonly grupo?: string;
};
export type Logotipo = {
  readonly nombre: string;
  readonly variantes: Readonly<Record<Variante, DatosDeVariante>>;
};

export const LOGOTIPOS: Readonly<Record<"a" | "b" | "c", Logotipo>> = {
  a: {
    nombre: "Pájaro en el nido",
    variantes: {
      "menu-oscuro": {
        formas: [
          {
            el: "path",
            geometria: {
              d: "M8 38 Q32 70 56 38",
              "stroke-width": "6",
              "stroke-linecap": "round",
            },
            relleno: null,
            trazo: "acento-400",
          },
          {
            el: "path",
            geometria: {
              d: "M17 45 Q32 54 47 45",
              "stroke-width": "6",
              "stroke-linecap": "round",
            },
            relleno: null,
            trazo: "acento-300",
          },
          {
            el: "polygon",
            geometria: {
              points: "19,26 5,15 10,31",
            },
            relleno: "acento-300",
            trazo: null,
          },
          {
            el: "ellipse",
            geometria: {
              cx: "30",
              cy: "27",
              rx: "14",
              ry: "10",
            },
            relleno: "acento-400",
            trazo: null,
          },
          {
            el: "circle",
            geometria: {
              cx: "42",
              cy: "17",
              r: "7",
            },
            relleno: "acento-400",
            trazo: null,
          },
          {
            el: "polygon",
            geometria: {
              points: "47,14 58,18 47,21",
            },
            relleno: "acento-300",
            trazo: null,
          },
          {
            el: "circle",
            geometria: {
              cx: "43",
              cy: "16",
              r: "2",
            },
            relleno: "neutro-100",
            trazo: null,
          },
        ],
      },
      "fondo-claro": {
        formas: [
          {
            el: "path",
            geometria: {
              d: "M8 38 Q32 70 56 38",
              "stroke-width": "6",
              "stroke-linecap": "round",
            },
            relleno: null,
            trazo: "acento-600",
          },
          {
            el: "path",
            geometria: {
              d: "M17 45 Q32 54 47 45",
              "stroke-width": "6",
              "stroke-linecap": "round",
            },
            relleno: null,
            trazo: "acento-800",
          },
          {
            el: "polygon",
            geometria: {
              points: "19,26 5,15 10,31",
            },
            relleno: "acento-800",
            trazo: null,
          },
          {
            el: "ellipse",
            geometria: {
              cx: "30",
              cy: "27",
              rx: "14",
              ry: "10",
            },
            relleno: "acento-600",
            trazo: null,
          },
          {
            el: "circle",
            geometria: {
              cx: "42",
              cy: "17",
              r: "7",
            },
            relleno: "acento-600",
            trazo: null,
          },
          {
            el: "polygon",
            geometria: {
              points: "47,14 58,18 47,21",
            },
            relleno: "acento-800",
            trazo: null,
          },
          {
            el: "circle",
            geometria: {
              cx: "43",
              cy: "16",
              r: "2",
            },
            relleno: "neutro-900",
            trazo: null,
          },
        ],
      },
      icono: {
        formas: [
          {
            el: "path",
            geometria: {
              d: "M8 38 Q32 70 56 38",
              "stroke-width": "7",
              "stroke-linecap": "round",
            },
            relleno: null,
            trazo: "neutro-0",
          },
          {
            el: "path",
            geometria: {
              d: "M17 45 Q32 54 47 45",
              "stroke-width": "7",
              "stroke-linecap": "round",
            },
            relleno: null,
            trazo: "acento-50",
          },
          {
            el: "polygon",
            geometria: {
              points: "19,26 5,15 10,31",
            },
            relleno: "acento-50",
            trazo: null,
          },
          {
            el: "ellipse",
            geometria: {
              cx: "30",
              cy: "27",
              rx: "14",
              ry: "10",
            },
            relleno: "neutro-0",
            trazo: null,
          },
          {
            el: "circle",
            geometria: {
              cx: "42",
              cy: "17",
              r: "7",
            },
            relleno: "neutro-0",
            trazo: null,
          },
          {
            el: "polygon",
            geometria: {
              points: "47,14 58,18 47,21",
            },
            relleno: "acento-50",
            trazo: null,
          },
          {
            el: "circle",
            geometria: {
              cx: "43",
              cy: "16",
              r: "2",
            },
            relleno: "neutro-0",
            trazo: null,
          },
        ],
        fondo: {
          radio: "14",
          desde: "acento-550",
          hasta: "acento-700",
        },
        grupo: "translate(7 7) scale(0.78)",
      },
    },
  },
  b: {
    nombre: "Nido de capas",
    variantes: {
      "menu-oscuro": {
        formas: [
          {
            el: "circle",
            geometria: {
              cx: "32",
              cy: "17",
              r: "10",
            },
            relleno: "neutro-100",
            trazo: null,
          },
          {
            el: "rect",
            geometria: {
              x: "8",
              y: "30",
              width: "48",
              height: "9",
              rx: "4.5",
            },
            relleno: "acento-400",
            trazo: null,
          },
          {
            el: "rect",
            geometria: {
              x: "14",
              y: "41",
              width: "36",
              height: "9",
              rx: "4.5",
            },
            relleno: "acento-300",
            trazo: null,
          },
          {
            el: "rect",
            geometria: {
              x: "20",
              y: "52",
              width: "24",
              height: "9",
              rx: "4.5",
            },
            relleno: "acento-400",
            trazo: null,
          },
        ],
      },
      "fondo-claro": {
        formas: [
          {
            el: "circle",
            geometria: {
              cx: "32",
              cy: "17",
              r: "10",
            },
            relleno: "neutro-900",
            trazo: null,
          },
          {
            el: "rect",
            geometria: {
              x: "8",
              y: "30",
              width: "48",
              height: "9",
              rx: "4.5",
            },
            relleno: "acento-600",
            trazo: null,
          },
          {
            el: "rect",
            geometria: {
              x: "14",
              y: "41",
              width: "36",
              height: "9",
              rx: "4.5",
            },
            relleno: "acento-800",
            trazo: null,
          },
          {
            el: "rect",
            geometria: {
              x: "20",
              y: "52",
              width: "24",
              height: "9",
              rx: "4.5",
            },
            relleno: "acento-600",
            trazo: null,
          },
        ],
      },
      icono: {
        formas: [
          {
            el: "circle",
            geometria: {
              cx: "32",
              cy: "17",
              r: "10",
            },
            relleno: "neutro-0",
            trazo: null,
          },
          {
            el: "rect",
            geometria: {
              x: "8",
              y: "30",
              width: "48",
              height: "9",
              rx: "4.5",
            },
            relleno: "neutro-0",
            trazo: null,
          },
          {
            el: "rect",
            geometria: {
              x: "14",
              y: "41",
              width: "36",
              height: "9",
              rx: "4.5",
            },
            relleno: "acento-50",
            trazo: null,
          },
          {
            el: "rect",
            geometria: {
              x: "20",
              y: "52",
              width: "24",
              height: "9",
              rx: "4.5",
            },
            relleno: "neutro-0",
            trazo: null,
          },
        ],
        fondo: {
          radio: "14",
          desde: "acento-550",
          hasta: "acento-700",
        },
        grupo: "translate(7 7) scale(0.78)",
      },
    },
  },
  c: {
    nombre: "Nido en anillo",
    variantes: {
      "menu-oscuro": {
        formas: [
          {
            el: "path",
            geometria: {
              d: "M32 8 A24 24 0 1 1 8 32",
              "stroke-width": "6",
              "stroke-linecap": "round",
            },
            relleno: null,
            trazo: "acento-400",
          },
          {
            el: "circle",
            geometria: {
              cx: "32",
              cy: "8",
              r: "5",
            },
            relleno: "neutro-100",
            trazo: null,
          },
          {
            el: "circle",
            geometria: {
              cx: "8",
              cy: "32",
              r: "5",
            },
            relleno: "neutro-100",
            trazo: null,
          },
          {
            el: "circle",
            geometria: {
              cx: "32",
              cy: "32",
              r: "13",
              "stroke-width": "4.8",
            },
            relleno: null,
            trazo: "acento-300",
          },
          {
            el: "ellipse",
            geometria: {
              cx: "32",
              cy: "32",
              rx: "5",
              ry: "6.5",
            },
            relleno: "neutro-100",
            trazo: null,
          },
        ],
      },
      "fondo-claro": {
        formas: [
          {
            el: "path",
            geometria: {
              d: "M32 8 A24 24 0 1 1 8 32",
              "stroke-width": "6",
              "stroke-linecap": "round",
            },
            relleno: null,
            trazo: "acento-600",
          },
          {
            el: "circle",
            geometria: {
              cx: "32",
              cy: "8",
              r: "5",
            },
            relleno: "neutro-900",
            trazo: null,
          },
          {
            el: "circle",
            geometria: {
              cx: "8",
              cy: "32",
              r: "5",
            },
            relleno: "neutro-900",
            trazo: null,
          },
          {
            el: "circle",
            geometria: {
              cx: "32",
              cy: "32",
              r: "13",
              "stroke-width": "4.8",
            },
            relleno: null,
            trazo: "acento-800",
          },
          {
            el: "ellipse",
            geometria: {
              cx: "32",
              cy: "32",
              rx: "5",
              ry: "6.5",
            },
            relleno: "neutro-900",
            trazo: null,
          },
        ],
      },
      icono: {
        formas: [
          {
            el: "path",
            geometria: {
              d: "M32 8 A24 24 0 1 1 8 32",
              "stroke-width": "7",
              "stroke-linecap": "round",
            },
            relleno: null,
            trazo: "neutro-0",
          },
          {
            el: "circle",
            geometria: {
              cx: "32",
              cy: "8",
              r: "5",
            },
            relleno: "neutro-0",
            trazo: null,
          },
          {
            el: "circle",
            geometria: {
              cx: "8",
              cy: "32",
              r: "5",
            },
            relleno: "neutro-0",
            trazo: null,
          },
          {
            el: "circle",
            geometria: {
              cx: "32",
              cy: "32",
              r: "13",
              "stroke-width": "5.6",
            },
            relleno: null,
            trazo: "acento-50",
          },
          {
            el: "ellipse",
            geometria: {
              cx: "32",
              cy: "32",
              rx: "5",
              ry: "6.5",
            },
            relleno: "neutro-0",
            trazo: null,
          },
        ],
        fondo: {
          radio: "14",
          desde: "acento-550",
          hasta: "acento-700",
        },
        grupo: "translate(7 7) scale(0.78)",
      },
    },
  },
};
