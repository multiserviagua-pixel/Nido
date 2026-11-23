import { leerGrafico, type TipoDeEjeX } from "./logica";
import { MarcoDeGrafico } from "./MarcoDeGrafico";

// `GraficoLineas` (diseño 020, «Gráficos»; REQ-014, REQ-015, REQ-052, REQ-054). Recibe un único
// conjunto de datos y lo lee con listas cerradas (`logica.ts`): el dibujo y la tabla equivalente
// salen del mismo modelo. Hasta cuatro series; la principal en el acento y las demás con trazo y
// marcador propios. Un punto sin dato es un hueco: la línea no se une. Con menos puntos que
// `minimoPuntos`, «Sin datos suficientes»; sin datos, «Sin datos».

export type PropiedadesDeGrafico = {
  /** Dice la medida o la conclusión (REQ-014). Obligatorio. */
  readonly titulo: string;
  readonly ejeX: { readonly nombre: string; readonly tipo: TipoDeEjeX };
  /** `unidad` es obligatoria. `minimo` (solo líneas) admite valores por debajo de cero. */
  readonly ejeY: {
    readonly nombre: string;
    readonly unidad: string;
    readonly decimales?: number;
    readonly minimo?: number;
  };
  /** Un instante ISO con zona (tipo `fecha`) o una etiqueta de lista cerrada (tipo `texto`). */
  readonly categorias: readonly unknown[];
  readonly series: readonly { readonly nombre: string; readonly valores: readonly unknown[] }[];
  /** Categorías con dato que hacen falta para dibujar; por defecto, 1. */
  readonly minimoPuntos?: number;
  /** Para la muestra: el bloque de la tabla sale abierto. */
  readonly tablaAbierta?: boolean;
};

export function GraficoLineas(propiedades: PropiedadesDeGrafico) {
  return (
    <MarcoDeGrafico
      modelo={leerGrafico(propiedades, "lineas")}
      tipo="lineas"
      tablaAbierta={propiedades.tablaAbierta === true}
    />
  );
}
