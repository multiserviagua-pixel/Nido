// Estado «texto-hostil» de «dialogo-confirmacion» en la muestra (T-010 (j)): /muestra/componentes/dialogo-confirmacion/texto-hostil.
// Control 2 primero. El título es un valor fijo del inventario (sin generateMetadata).
import type { Metadata } from "next";
import { comprobarAccesoMuestra } from "../../../_datos/acceso-muestra";
import { tituloDeMuestra } from "../../../_vistas/cifras/marco";
import { VistaDeDialogo } from "../../../_vistas/dialogo/VistaDeDialogo";

export const metadata: Metadata = {
  title: tituloDeMuestra("dialogo-confirmacion", "texto-hostil"),
};

export default async function Pagina() {
  await comprobarAccesoMuestra();
  return (
    <VistaDeDialogo
      titulo={tituloDeMuestra("dialogo-confirmacion", "texto-hostil")}
      estado="texto-hostil"
    />
  );
}
