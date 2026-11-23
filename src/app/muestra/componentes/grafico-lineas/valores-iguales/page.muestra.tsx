// Estado «valores-iguales» de «grafico-lineas» en la muestra (T-010 (h)): /muestra/componentes/grafico-lineas/valores-iguales.
// Control 2 primero. El título es un valor fijo del inventario (sin generateMetadata).
import type { Metadata } from "next";
import { comprobarAccesoMuestra } from "../../../_datos/acceso-muestra";
import { tituloDeMuestra } from "../../../_vistas/cifras/marco";
import { VistaDeLineas } from "../../../_vistas/graficos/VistaDeGrafico";

export const metadata: Metadata = { title: tituloDeMuestra("grafico-lineas", "valores-iguales") };

export default async function Pagina() {
  await comprobarAccesoMuestra();
  return (
    <VistaDeLineas
      titulo={tituloDeMuestra("grafico-lineas", "valores-iguales")}
      estado="valores-iguales"
    />
  );
}
