// Estado «reintento-en-curso» de «estado-error» en la muestra (T-016 (c)): /muestra/componentes/estado-error/reintento-en-curso.
// Control 2 primero. El título es un valor fijo del inventario (sin generateMetadata).
import type { Metadata } from "next";
import { comprobarAccesoMuestra } from "../../../_datos/acceso-muestra";
import { tituloDeMuestra } from "../../../_vistas/cifras/marco";
import { VistaDeEstadoError } from "../../../_vistas/estados/VistaDeEstados";

export const metadata: Metadata = { title: tituloDeMuestra("estado-error", "reintento-en-curso") };

export default async function Pagina() {
  await comprobarAccesoMuestra();
  return (
    <VistaDeEstadoError
      titulo={tituloDeMuestra("estado-error", "reintento-en-curso")}
      estado="reintento-en-curso"
    />
  );
}
