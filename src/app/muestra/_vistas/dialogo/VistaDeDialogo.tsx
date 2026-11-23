// Páginas de `DialogoConfirmacion` en la muestra (T-010 (j); CA-013, CA-041, CA-053). Un estado por
// página fija; todas se abren con el diálogo ya abierto (convención de `anchos.spec.ts`), con
// datos ficticios.
import type { ReactNode } from "react";
import { MarcoDeComponente } from "../cifras/marco";
import { HOSTILES, nombreDe120 } from "../tabla/datos-ficticios";
import { DemoDeDialogo, type DisparadorDeMuestra } from "./DemoDeDialogo";
import { TEXTOS_DIALOGO as T } from "./textos-dialogo";

export type EstadoDeDialogo = keyof typeof T.explicaciones;

const DISPARADORES: Readonly<Record<EstadoDeDialogo, readonly DisparadorDeMuestra[]>> = {
  pausar: [
    {
      etiqueta: T.abrirPausar,
      accion: "pausar_agente",
      objetivo: { nombre: T.objetivoEjemplo, distintivo: T.distintivoEjemplo },
      dato: "identificador",
      abiertoAlCargar: true,
    },
    {
      etiqueta: T.abrirReanudar,
      accion: "reanudar_agente",
      objetivo: { nombre: T.objetivoEjemplo, distintivo: T.distintivoEjemplo },
      dato: "identificador",
    },
  ],
  "objetivo-120": [
    {
      etiqueta: T.abrirObjetivo,
      accion: "revocar_licencia",
      objetivo: { nombre: nombreDe120(1), distintivo: nombreDe120(0) },
      dato: "identificador",
      abiertoAlCargar: true,
    },
  ],
  "texto-hostil": HOSTILES.map((h, i) => ({
    etiqueta: `${T.abrirObjetivo} ${i + 1}`,
    accion: "pausar_agente" as const,
    objetivo: { nombre: h, distintivo: h },
    dato: "identificador" as const,
    abiertoAlCargar: i === 0,
  })),
};

export function VistaDeDialogo({
  titulo,
  estado,
}: {
  titulo: string;
  estado: EstadoDeDialogo;
}): ReactNode {
  return (
    <MarcoDeComponente titulo={titulo}>
      <section aria-labelledby="dialogo-titulo" className="flex min-w-0 flex-col gap-4">
        <h2 id="dialogo-titulo">{T.titulo}</h2>
        <p className="text-cuerpo-menor text-texto-secundario">{T.explicaciones[estado]}</p>
        <DemoDeDialogo disparadores={DISPARADORES[estado]} />
      </section>
    </MarcoDeComponente>
  );
}
