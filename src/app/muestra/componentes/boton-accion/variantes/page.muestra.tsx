// Estado «variantes» de «boton-accion» en la muestra (T-010 (d)): /muestra/componentes/boton-accion/variantes.
// Control 2 primero. El título es un valor fijo del inventario (sin generateMetadata).
import type { Metadata } from "next";
import { comprobarAccesoMuestra } from "../../../_datos/acceso-muestra";
import { tituloDeBoton } from "../../../_vistas/acciones/Marco";
import { VistaDeVariantes } from "../../../_vistas/acciones/VistaDeVariantes";

export const metadata: Metadata = { title: tituloDeBoton("variantes") };

export default async function Pagina() {
  await comprobarAccesoMuestra();
  return <VistaDeVariantes titulo={tituloDeBoton("variantes")} />;
}
