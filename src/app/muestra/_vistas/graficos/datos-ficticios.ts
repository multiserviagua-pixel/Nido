// Datos ficticios de los gráficos de la muestra (T-010 (h)). Una configuración por estado y tipo;
// la muestra no pide nada a la red. Las fechas son instantes a las 12:00 UTC, que caen en el mismo
// día en la hora de Madrid. Las cadenas hostiles son las de la tabla de la muestra.
import type { PropiedadesDeGrafico } from "@/components/graficos/GraficoLineas";
import { HOSTILES, nombreDe120 } from "../tabla/datos-ficticios";

export type TipoDeMuestra = "lineas" | "barras";

export const ESTADOS_DE_LINEAS = [
  "una-serie",
  "cuatro-series",
  "con-hueco",
  "pocos-puntos",
  "sin-datos",
  "tabla-abierta",
  "un-punto",
  "valores-iguales",
  "negativos",
  "cientos-de-puntos",
  "etiquetas-largas-120",
  "texto-hostil",
] as const;

export const ESTADOS_DE_BARRAS = [
  "una-serie",
  "varias-series",
  "con-cero",
  "pocos-puntos",
  "sin-datos",
  "tabla-abierta",
  "valores-iguales",
  "muchos-puntos",
  "etiquetas-largas-120",
  "texto-hostil",
] as const;

export type EstadoDeLineas = (typeof ESTADOS_DE_LINEAS)[number];
export type EstadoDeBarras = (typeof ESTADOS_DE_BARRAS)[number];

export const dia = (i: number): number => Date.UTC(2026, 9, 1 + i, 12);
const dias = (n: number): number[] => Array.from({ length: n }, (_, i) => dia(i));
const onda = (n: number, base: number, amplitud: number, fase: number): number[] =>
  Array.from({ length: n }, (_, i) => Math.round(base + amplitud * Math.sin(i / 2 + fase) + i));

const EJE_FECHA = { nombre: "Día", tipo: "fecha" } as const;
const EJE_CORREOS = { nombre: "Correos revisados", unidad: "correos" } as const;
const SEMANA = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
const NOMBRES = ["Revisados", "Borradores", "Avisos", "Archivados"] as const;

function serie(i: number, n: number): { nombre: string; valores: number[] } {
  return { nombre: NOMBRES[i] ?? `Serie ${i + 1}`, valores: onda(n, 120 - i * 25, 40, i) };
}

const LARGAS_120 = [0, 1, 2, 3, 4, 5].map(nombreDe120);
const CATEGORIAS_HOSTILES = [0, 1, 2, 3, 4, 6, 7, 8, 11].map((i) => HOSTILES[i] ?? "x");

const BASE_LINEAS: PropiedadesDeGrafico = {
  titulo: "Correos revisados cada día de octubre",
  ejeX: EJE_FECHA,
  ejeY: EJE_CORREOS,
  categorias: dias(14),
  series: [serie(0, 14)],
  minimoPuntos: 2,
};

const BASE_BARRAS: PropiedadesDeGrafico = {
  titulo: "Correos revisados por día de la semana",
  ejeX: { nombre: "Día de la semana", tipo: "texto" },
  ejeY: EJE_CORREOS,
  categorias: SEMANA,
  series: [{ nombre: "Revisados", valores: [320, 410, 380, 295, 450, 120, 85] }],
  minimoPuntos: 2,
};

export function configuracionDeLineas(estado: EstadoDeLineas): PropiedadesDeGrafico {
  switch (estado) {
    case "una-serie":
      return BASE_LINEAS;
    case "cuatro-series":
      return {
        ...BASE_LINEAS,
        titulo: "Cuatro medidas por día en octubre",
        series: [0, 1, 2, 3].map((i) => serie(i, 14)),
      };
    case "con-hueco": {
      const v = onda(14, 140, 30, 0).map((x, i) =>
        i === 5 || i === 6 || i === 8 || i === 10 ? null : x,
      );
      return {
        ...BASE_LINEAS,
        titulo: "Correos revisados con días sin datos",
        series: [{ nombre: "Revisados", valores: v }],
      };
    }
    case "pocos-puntos":
      return {
        ...BASE_LINEAS,
        titulo: "Correos revisados con un solo dato",
        categorias: dias(7),
        series: [{ nombre: "Revisados", valores: [null, null, 90, null, null, null, null] }],
        minimoPuntos: 3,
      };
    case "sin-datos":
      return { ...BASE_LINEAS, categorias: [], series: [] };
    case "tabla-abierta":
      return { ...BASE_LINEAS, tablaAbierta: true };
    case "un-punto":
      return {
        ...BASE_LINEAS,
        titulo: "Correos revisados en un solo día",
        categorias: [dia(0)],
        series: [{ nombre: "Revisados", valores: [95] }],
        minimoPuntos: 1,
      };
    case "valores-iguales":
      return {
        ...BASE_LINEAS,
        titulo: "Correos revisados sin variación",
        categorias: dias(10),
        series: [{ nombre: "Revisados", valores: Array.from({ length: 10 }, () => 50) }],
      };
    case "negativos":
      return {
        ...BASE_LINEAS,
        titulo: "Saldo diario con días en negativo",
        ejeY: { nombre: "Saldo", unidad: "euros", minimo: -100000 },
        series: [
          {
            nombre: "Saldo",
            valores: [120, 80, 20, -40, -90, -30, 15, 60, 110, 70, -10, -55, 5, 90],
          },
        ],
      };
    case "cientos-de-puntos":
      return {
        ...BASE_LINEAS,
        titulo: "Correos revisados cada día de un año",
        categorias: Array.from({ length: 366 }, (_, i) => Date.UTC(2026, 0, 1 + i, 12)),
        series: [
          { nombre: "Revisados", valores: onda(366, 200, 80, 0) },
          { nombre: "Borradores", valores: onda(366, 90, 30, 2) },
        ],
      };
    case "etiquetas-largas-120":
      return {
        titulo: nombreDe120(6),
        ejeX: { nombre: nombreDe120(7), tipo: "texto" },
        ejeY: { nombre: nombreDe120(8), unidad: nombreDe120(9) },
        categorias: LARGAS_120,
        series: [
          { nombre: nombreDe120(10), valores: [10, 40, 25, 60, 35, 80] },
          { nombre: nombreDe120(11), valores: [5, 15, 30, 20, 45, 55] },
        ],
        minimoPuntos: 2,
      };
    case "texto-hostil":
      return {
        titulo: HOSTILES[1] ?? "x",
        ejeX: { nombre: HOSTILES[0] ?? "x", tipo: "texto" },
        ejeY: { nombre: HOSTILES[3] ?? "x", unidad: HOSTILES[7] ?? "x" },
        categorias: CATEGORIAS_HOSTILES,
        series: [
          { nombre: HOSTILES[4] ?? "x", valores: CATEGORIAS_HOSTILES.map((_, i) => 10 + i * 5) },
          { nombre: HOSTILES[6] ?? "x", valores: CATEGORIAS_HOSTILES.map((_, i) => 60 - i * 4) },
        ],
        minimoPuntos: 2,
      };
  }
}

export function configuracionDeBarras(estado: EstadoDeBarras): PropiedadesDeGrafico {
  switch (estado) {
    case "una-serie":
      return BASE_BARRAS;
    case "varias-series":
      return {
        ...BASE_BARRAS,
        titulo: "Tres medidas por día de la semana",
        series: [
          { nombre: "Revisados", valores: [320, 410, 380, 295, 450, 120, 85] },
          { nombre: "Borradores", valores: [140, 190, 160, 120, 210, 40, 30] },
          { nombre: "Avisos", valores: [30, 45, 38, 22, 51, 9, 6] },
        ],
      };
    case "con-cero":
      return {
        ...BASE_BARRAS,
        titulo: "Correos revisados con días sin actividad",
        series: [{ nombre: "Revisados", valores: [320, 0, 380, 295, 0, 120, 85] }],
      };
    case "pocos-puntos":
      return {
        ...BASE_BARRAS,
        titulo: "Correos revisados con un solo dato",
        series: [{ nombre: "Revisados", valores: [null, null, 380, null, null, null, null] }],
        minimoPuntos: 3,
      };
    case "sin-datos":
      return { ...BASE_BARRAS, categorias: [], series: [] };
    case "tabla-abierta":
      return { ...BASE_BARRAS, tablaAbierta: true };
    case "valores-iguales":
      return {
        ...BASE_BARRAS,
        titulo: "Correos revisados sin variación",
        series: [{ nombre: "Revisados", valores: SEMANA.map(() => 200) }],
      };
    case "muchos-puntos":
      return {
        ...BASE_BARRAS,
        titulo: "Correos revisados cada día durante dos meses",
        ejeX: EJE_FECHA,
        categorias: dias(61),
        series: [{ nombre: "Revisados", valores: onda(61, 150, 50, 0) }],
      };
    case "etiquetas-largas-120":
      return {
        titulo: nombreDe120(6),
        ejeX: { nombre: nombreDe120(7), tipo: "texto" },
        ejeY: { nombre: nombreDe120(8), unidad: nombreDe120(9) },
        categorias: LARGAS_120,
        series: [
          { nombre: nombreDe120(10), valores: [10, 40, 25, 60, 35, 80] },
          { nombre: nombreDe120(11), valores: [5, 15, 30, 20, 45, 55] },
        ],
        minimoPuntos: 2,
      };
    case "texto-hostil":
      return {
        titulo: HOSTILES[1] ?? "x",
        ejeX: { nombre: HOSTILES[0] ?? "x", tipo: "texto" },
        ejeY: { nombre: HOSTILES[3] ?? "x", unidad: HOSTILES[7] ?? "x" },
        categorias: CATEGORIAS_HOSTILES,
        series: [
          { nombre: HOSTILES[4] ?? "x", valores: CATEGORIAS_HOSTILES.map((_, i) => 10 + i * 5) },
        ],
        minimoPuntos: 2,
      };
  }
}
