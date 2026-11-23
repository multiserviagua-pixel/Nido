// Estado «carga-lenta» de «esqueleto» en la muestra (T-016 (c)): /muestra/componentes/esqueleto/carga-lenta.
// Control 2 primero. El título es un valor fijo del inventario (sin generateMetadata).
import type { Metadata } from "next";
import { comprobarAccesoMuestra } from "../../../_datos/acceso-muestra";
import { tituloDeMuestra } from "../../../_vistas/cifras/marco";
import { VistaDeEsqueleto } from "../../../_vistas/estados/VistaDeEstados";

export const metadata: Metadata = { title: tituloDeMuestra("esqueleto", "carga-lenta") };

export default async function Pagina() {
  await comprobarAccesoMuestra();
  return (
    <VistaDeEsqueleto titulo={tituloDeMuestra("esqueleto", "carga-lenta")} estado="carga-lenta" />
  );
}
