// Estado «unico» de «estado-sin-permiso» en la muestra (T-016 (c)): /muestra/componentes/estado-sin-permiso/unico.
// Control 2 primero. El título es un valor fijo del inventario (sin generateMetadata).
import type { Metadata } from "next";
import { comprobarAccesoMuestra } from "../../../_datos/acceso-muestra";
import { tituloDeMuestra } from "../../../_vistas/cifras/marco";
import { VistaDeSinPermiso } from "../../../_vistas/estados/VistaDeEstados";

export const metadata: Metadata = { title: tituloDeMuestra("estado-sin-permiso", "unico") };

export default async function Pagina() {
  await comprobarAccesoMuestra();
  return <VistaDeSinPermiso titulo={tituloDeMuestra("estado-sin-permiso", "unico")} />;
}
