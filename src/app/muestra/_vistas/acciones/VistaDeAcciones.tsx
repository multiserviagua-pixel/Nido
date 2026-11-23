// `/muestra/componentes/boton-accion/acciones` (T-010 (d)): `useAccion` con el simulador.
import { DemoDeAccion } from "./DemoDeAccion";
import { MarcoDeComponente } from "./Marco";

export function VistaDeAcciones({ titulo }: { titulo: string }) {
  return (
    <MarcoDeComponente titulo={titulo}>
      <DemoDeAccion />
    </MarcoDeComponente>
  );
}
