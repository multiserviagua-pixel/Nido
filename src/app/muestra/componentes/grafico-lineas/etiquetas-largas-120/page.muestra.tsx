// Estado «etiquetas-largas-120» de «grafico-lineas» en la muestra (T-010 (h)): /muestra/componentes/grafico-lineas/etiquetas-largas-120.
// Control 2 primero. El título es un valor fijo del inventario (sin generateMetadata).
import type { Metadata } from "next";
import { comprobarAccesoMuestra } from "../../../_datos/acceso-muestra";
import { tituloDeMuestra } from "../../../_vistas/cifras/marco";
import { VistaDeLineas } from "../../../_vistas/graficos/VistaDeGrafico";

export const metadata: Metadata = {
  title: tituloDeMuestra("grafico-lineas", "etiquetas-largas-120"),
};

export default async function Pagina() {
  await comprobarAccesoMuestra();
  return (
    <VistaDeLineas
      titulo={tituloDeMuestra("grafico-lineas", "etiquetas-largas-120")}
      estado="etiquetas-largas-120"
    />
  );
}
