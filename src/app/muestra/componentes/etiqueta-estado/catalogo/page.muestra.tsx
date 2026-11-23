// Estado «catalogo» de «etiqueta-estado» en la muestra (T-010): /muestra/componentes/etiqueta-estado/catalogo.
// Control 2 primero. El título es un valor fijo del inventario (sin generateMetadata).
import type { Metadata } from "next";
import { comprobarAccesoMuestra } from "../../../_datos/acceso-muestra";
import { tituloDeMuestra } from "../../../_vistas/cifras/marco";
import { VistaDeEtiquetas } from "../../../_vistas/cifras/VistaDeEtiquetas";

export const metadata: Metadata = { title: tituloDeMuestra("etiqueta-estado", "catalogo") };

export default async function Pagina() {
  await comprobarAccesoMuestra();
  return (
    <VistaDeEtiquetas titulo={tituloDeMuestra("etiqueta-estado", "catalogo")} estado="catalogo" />
  );
}
