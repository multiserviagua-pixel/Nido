// Estado «cinco» de «avisos-temporales» en la muestra (T-016 (b)): /muestra/componentes/avisos-temporales/cinco.
// Control 2 primero. El título es un valor fijo del inventario (sin generateMetadata).
import type { Metadata } from "next";
import { comprobarAccesoMuestra } from "../../../_datos/acceso-muestra";
import { tituloDeMuestra } from "../../../_vistas/cifras/marco";
import { VistaDeAvisos } from "../../../_vistas/avisos/VistaDeAvisos";

export const metadata: Metadata = { title: tituloDeMuestra("avisos-temporales", "cinco") };

export default async function Pagina() {
  await comprobarAccesoMuestra();
  return <VistaDeAvisos titulo={tituloDeMuestra("avisos-temporales", "cinco")} estado="cinco" />;
}
