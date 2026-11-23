// Estado «texto-hostil» de «grafico-barras» en la muestra (T-010 (h)): /muestra/componentes/grafico-barras/texto-hostil.
// Control 2 primero. El título es un valor fijo del inventario (sin generateMetadata).
import type { Metadata } from "next";
import { comprobarAccesoMuestra } from "../../../_datos/acceso-muestra";
import { tituloDeMuestra } from "../../../_vistas/cifras/marco";
import { VistaDeBarras } from "../../../_vistas/graficos/VistaDeGrafico";

export const metadata: Metadata = { title: tituloDeMuestra("grafico-barras", "texto-hostil") };

export default async function Pagina() {
  await comprobarAccesoMuestra();
  return (
    <VistaDeBarras
      titulo={tituloDeMuestra("grafico-barras", "texto-hostil")}
      estado="texto-hostil"
    />
  );
}
