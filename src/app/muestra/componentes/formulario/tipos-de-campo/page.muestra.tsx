// Estado «tipos-de-campo» de «formulario» en la muestra (T-016 (a)): /muestra/componentes/formulario/tipos-de-campo.
// Control 2 primero. El título es un valor fijo del inventario (sin generateMetadata).
import type { Metadata } from "next";
import { comprobarAccesoMuestra } from "../../../_datos/acceso-muestra";
import { tituloDeMuestra } from "../../../_vistas/cifras/marco";
import { VistaDeFormulario } from "../../../_vistas/formulario/VistaDeFormulario";

export const metadata: Metadata = { title: tituloDeMuestra("formulario", "tipos-de-campo") };

export default async function Pagina() {
  await comprobarAccesoMuestra();
  return (
    <VistaDeFormulario
      titulo={tituloDeMuestra("formulario", "tipos-de-campo")}
      estado="tipos-de-campo"
    />
  );
}
