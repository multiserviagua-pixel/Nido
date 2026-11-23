// Estado «uno» de «avisos-temporales» en la muestra (T-016 (b)): /muestra/componentes/avisos-temporales/uno.
// Control 2 primero. El título es un valor fijo del inventario (sin generateMetadata).
import type { Metadata } from "next";
import { comprobarAccesoMuestra } from "../../../_datos/acceso-muestra";
import { tituloDeMuestra } from "../../../_vistas/cifras/marco";
import { VistaDeAvisos } from "../../../_vistas/avisos/VistaDeAvisos";

export const metadata: Metadata = { title: tituloDeMuestra("avisos-temporales", "uno") };

export default async function Pagina() {
  await comprobarAccesoMuestra();
  return <VistaDeAvisos titulo={tituloDeMuestra("avisos-temporales", "uno")} estado="uno" />;
}
