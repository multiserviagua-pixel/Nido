// Páginas de `AvisosTemporales` en la muestra (T-016 (b); CA-015, CA-053). Un estado por página
// fija. Sin avisos al cargar; el botón los muestra. Los textos de los avisos salen de `TEXTOS`.
import type { ReactNode } from "react";
import type { ClaveDeAviso } from "@/components/avisos/logica";
import { MarcoDeComponente } from "../cifras/marco";
import { DemoDeAvisos } from "./DemoDeAvisos";
import { TEXTOS_AVISOS as T } from "./textos-avisos";

export type EstadoDeAvisos = keyof typeof T.explicaciones;

const AVISOS: Readonly<Record<EstadoDeAvisos, readonly ClaveDeAviso[]>> = {
  uno: ["cambiosGuardados"],
  dos: ["pausaProgramada", "reanudacionProgramada"],
  cinco: [
    "cambiosGuardados",
    "codigoCopiado",
    "listaActualizada",
    "pausaProgramada",
    "reanudacionProgramada",
  ],
  "texto-largo": ["cambioProgramado"],
};

export function VistaDeAvisos({
  titulo,
  estado,
}: {
  titulo: string;
  estado: EstadoDeAvisos;
}): ReactNode {
  const claves = AVISOS[estado];
  return (
    <MarcoDeComponente titulo={titulo}>
      <div className="flex min-w-0 flex-col gap-4">
        <h2>{T.titulo}</h2>
        <p className="text-cuerpo-menor text-texto-secundario">{T.explicaciones[estado]}</p>
        <DemoDeAvisos
          claves={claves}
          etiqueta={claves.length === 1 ? T.mostrarUno : T.mostrarVarios}
        />
      </div>
    </MarcoDeComponente>
  );
}
