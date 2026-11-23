// Estado «nombres-largos-120» de «tabla» en la muestra (T-010): /muestra/componentes/tabla/nombres-largos-120.
// Control 2 primero. El título es un valor fijo del inventario (sin generateMetadata).
import type { Metadata } from "next";
import { comprobarAccesoMuestra } from "../../../_datos/acceso-muestra";
import { tituloDeMuestra } from "../../../_vistas/cifras/marco";
import { VistaDeTabla } from "../../../_vistas/tabla/VistaDeTabla";

export const metadata: Metadata = { title: tituloDeMuestra("tabla", "nombres-largos-120") };

export default async function Pagina() {
  await comprobarAccesoMuestra();
  return (
    <VistaDeTabla
      titulo={tituloDeMuestra("tabla", "nombres-largos-120")}
      estado="nombres-largos-120"
    />
  );
}
