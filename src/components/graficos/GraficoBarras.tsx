import { leerGrafico } from "./logica";
import type { PropiedadesDeGrafico } from "./GraficoLineas";
import { MarcoDeGrafico } from "./MarcoDeGrafico";

// `GraficoBarras` (diseño 020, «Gráficos»; REQ-014, REQ-015, REQ-052, REQ-054). Igual que el de
// líneas, con una diferencia que no se configura: el eje de valores empieza siempre en cero, así
// que un valor negativo es un hueco. Las series se distinguen por la trama además del color.

export type { PropiedadesDeGrafico };

export function GraficoBarras(propiedades: PropiedadesDeGrafico) {
  return (
    <MarcoDeGrafico
      modelo={leerGrafico(propiedades, "barras")}
      tipo="barras"
      tablaAbierta={propiedades.tablaAbierta === true}
    />
  );
}
