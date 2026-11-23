// Estado «desconocido» de «estado-error» en la muestra (T-016 (c)): /muestra/componentes/estado-error/desconocido.
// Control 2 primero. El título es un valor fijo del inventario (sin generateMetadata).
import type { Metadata } from "next";
import { comprobarAccesoMuestra } from "../../../_datos/acceso-muestra";
import { tituloDeMuestra } from "../../../_vistas/cifras/marco";
import { VistaDeEstadoError } from "../../../_vistas/estados/VistaDeEstados";

export const metadata: Metadata = { title: tituloDeMuestra("estado-error", "desconocido") };

export default async function Pagina() {
  await comprobarAccesoMuestra();
  return (
    <VistaDeEstadoError
      titulo={tituloDeMuestra("estado-error", "desconocido")}
      estado="desconocido"
    />
  );
}
