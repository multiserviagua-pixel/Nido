// Estado «enviado-vacio» de «formulario» en la muestra (T-016 (a)): /muestra/componentes/formulario/enviado-vacio.
// Control 2 primero. El título es un valor fijo del inventario (sin generateMetadata).
import type { Metadata } from "next";
import { comprobarAccesoMuestra } from "../../../_datos/acceso-muestra";
import { tituloDeMuestra } from "../../../_vistas/cifras/marco";
import { VistaDeFormulario } from "../../../_vistas/formulario/VistaDeFormulario";

export const metadata: Metadata = { title: tituloDeMuestra("formulario", "enviado-vacio") };

export default async function Pagina() {
  await comprobarAccesoMuestra();
  return (
    <VistaDeFormulario
      titulo={tituloDeMuestra("formulario", "enviado-vacio")}
      estado="enviado-vacio"
    />
  );
}
