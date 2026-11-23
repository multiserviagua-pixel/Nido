// Estado «sin-accion» de «estado-vacio» en la muestra (T-016 (c)): /muestra/componentes/estado-vacio/sin-accion.
// Control 2 primero. El título es un valor fijo del inventario (sin generateMetadata).
import type { Metadata } from "next";
import { comprobarAccesoMuestra } from "../../../_datos/acceso-muestra";
import { tituloDeMuestra } from "../../../_vistas/cifras/marco";
import { VistaDeEstadoVacio } from "../../../_vistas/estados/VistaDeEstados";

export const metadata: Metadata = { title: tituloDeMuestra("estado-vacio", "sin-accion") };

export default async function Pagina() {
  await comprobarAccesoMuestra();
  return (
    <VistaDeEstadoVacio
      titulo={tituloDeMuestra("estado-vacio", "sin-accion")}
      estado="sin-accion"
    />
  );
}
