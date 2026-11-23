// Estado «objetivo-120» de «dialogo-confirmacion» en la muestra (T-010 (j)): /muestra/componentes/dialogo-confirmacion/objetivo-120.
// Control 2 primero. El título es un valor fijo del inventario (sin generateMetadata).
import type { Metadata } from "next";
import { comprobarAccesoMuestra } from "../../../_datos/acceso-muestra";
import { tituloDeMuestra } from "../../../_vistas/cifras/marco";
import { VistaDeDialogo } from "../../../_vistas/dialogo/VistaDeDialogo";

export const metadata: Metadata = {
  title: tituloDeMuestra("dialogo-confirmacion", "objetivo-120"),
};

export default async function Pagina() {
  await comprobarAccesoMuestra();
  return (
    <VistaDeDialogo
      titulo={tituloDeMuestra("dialogo-confirmacion", "objetivo-120")}
      estado="objetivo-120"
    />
  );
}
