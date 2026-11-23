// Estado «tabla-abierta» de «grafico-barras» en la muestra (T-010 (h)): /muestra/componentes/grafico-barras/tabla-abierta.
// Control 2 primero. El título es un valor fijo del inventario (sin generateMetadata).
import type { Metadata } from "next";
import { comprobarAccesoMuestra } from "../../../_datos/acceso-muestra";
import { tituloDeMuestra } from "../../../_vistas/cifras/marco";
import { VistaDeBarras } from "../../../_vistas/graficos/VistaDeGrafico";

export const metadata: Metadata = { title: tituloDeMuestra("grafico-barras", "tabla-abierta") };

export default async function Pagina() {
  await comprobarAccesoMuestra();
  return (
    <VistaDeBarras
      titulo={tituloDeMuestra("grafico-barras", "tabla-abierta")}
      estado="tabla-abierta"
    />
  );
}
