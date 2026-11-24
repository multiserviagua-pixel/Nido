// Páginas de `BloqueDatos` en la muestra (T-016 (d); CA-016, CA-020, CA-042, CA-048). Un estado por
// página fija. Los datos son ficticios; la muestra no llama a la red.
import type { ReactNode } from "react";
import { MarcoDeComponente } from "../cifras/marco";
import {
  DemoDeBloque,
  DemoDeBloquesParciales,
  DemoDeCargaADatos,
  DemoDeHijosConservados,
  type CasoDeBloque,
  type CasoDeCargaADatos,
} from "./DemoDeBloque";
import { TEXTOS_ESTADOS as T } from "./textos-estados";

export type EstadoDeBloqueDeMuestra = keyof typeof T.bloque.explicaciones;

function Seccion({ estado, children }: { estado: EstadoDeBloqueDeMuestra; children: ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-4">
      <h2>{T.bloque.titulo}</h2>
      <p className="text-cuerpo-menor text-texto-secundario">{T.bloque.explicaciones[estado]}</p>
      {children}
    </div>
  );
}

export function VistaDeBloque({
  titulo,
  estado,
}: {
  titulo: string;
  estado: EstadoDeBloqueDeMuestra;
}): ReactNode {
  return (
    <MarcoDeComponente titulo={titulo}>
      <Seccion estado={estado}>
        {estado === "datos-parciales" ? (
          <DemoDeBloquesParciales />
        ) : estado === "conserva-hijos" ? (
          <DemoDeHijosConservados />
        ) : estado.startsWith("carga-a-") ? (
          <DemoDeCargaADatos caso={estado as CasoDeCargaADatos} />
        ) : (
          <DemoDeBloque caso={estado as CasoDeBloque} />
        )}
      </Seccion>
    </MarcoDeComponente>
  );
}
