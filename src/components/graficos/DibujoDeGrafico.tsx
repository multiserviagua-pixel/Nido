"use client";

// El dibujo de un gráfico (diseño 020, «Gráficos»): Recharts se carga solo en el navegador y de
// forma diferida, cuando el contenedor ya tiene medida. Sin JavaScript, o si la carga falla, el
// contenedor queda con su tamaño reservado y la tabla equivalente sigue ahí: el dibujo no es lo
// único que informa. Esta capa no pide datos ni toca el almacenamiento. Solo mide su caja con
// `ResizeObserver` y pasa a Recharts un ancho y un alto en números.
import { Component, Suspense, lazy, useEffect, useRef, useState, type ReactNode } from "react";
import type { ModeloDeGrafico, TipoDeGrafico } from "./logica";

const DibujoConRecharts = lazy(() => import("./DibujoConRecharts"));

type Medida = { readonly ancho: number; readonly alto: number };

/** Si el dibujo falla, se queda sin dibujo (la tabla sigue ahí) y no tira la página. */
class SinDibujoSiFalla extends Component<{ children: ReactNode }, { fallo: boolean }> {
  override state = { fallo: false };
  static getDerivedStateFromError(): { fallo: boolean } {
    return { fallo: true };
  }
  override render(): ReactNode {
    return this.state.fallo ? null : this.props.children;
  }
}

export function DibujoDeGrafico({
  modelo,
  tipo,
  base,
}: {
  modelo: ModeloDeGrafico;
  tipo: TipoDeGrafico;
  base: string;
}) {
  const caja = useRef<HTMLDivElement>(null);
  const [medida, setMedida] = useState<Medida | null>(null);

  useEffect(() => {
    const elemento = caja.current;
    if (elemento === null || typeof ResizeObserver === "undefined") return;
    const observador = new ResizeObserver((entradas) => {
      const r = entradas[0]?.contentRect;
      if (r === undefined) return;
      const ancho = Math.floor(r.width);
      const alto = Math.floor(r.height);
      setMedida((anterior) =>
        anterior !== null && anterior.ancho === ancho && anterior.alto === alto
          ? anterior
          : { ancho, alto },
      );
    });
    observador.observe(elemento);
    return () => observador.disconnect();
  }, []);

  return (
    <div ref={caja} data-dibujo className="size-full">
      {medida !== null && medida.ancho > 0 && medida.alto > 0 ? (
        <SinDibujoSiFalla>
          <Suspense fallback={null}>
            <DibujoConRecharts
              modelo={modelo}
              tipo={tipo}
              base={base}
              ancho={medida.ancho}
              alto={medida.alto}
            />
          </Suspense>
        </SinDibujoSiFalla>
      ) : null}
    </div>
  );
}
