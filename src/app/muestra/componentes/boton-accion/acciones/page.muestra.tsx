// Estado «acciones» de «boton-accion» en la muestra (T-010 (d)): /muestra/componentes/boton-accion/acciones.
// Control 2 primero. El título es un valor fijo del inventario (sin generateMetadata).
import type { Metadata } from "next";
import { comprobarAccesoMuestra } from "../../../_datos/acceso-muestra";
import { tituloDeBoton } from "../../../_vistas/acciones/Marco";
import { VistaDeAcciones } from "../../../_vistas/acciones/VistaDeAcciones";

export const metadata: Metadata = { title: tituloDeBoton("acciones") };

export default async function Pagina() {
  await comprobarAccesoMuestra();
  return <VistaDeAcciones titulo={tituloDeBoton("acciones")} />;
}
