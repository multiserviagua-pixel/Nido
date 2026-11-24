// Estado «respuesta-tardia» de «bloque-datos» en la muestra (T-016 (d)): /muestra/componentes/bloque-datos/respuesta-tardia.
// Control 2 primero. El título es un valor fijo del inventario (sin generateMetadata).
import type { Metadata } from "next";
import { comprobarAccesoMuestra } from "../../../_datos/acceso-muestra";
import { tituloDeMuestra } from "../../../_vistas/cifras/marco";
import { VistaDeBloque } from "../../../_vistas/estados/VistaDeBloque";

export const metadata: Metadata = { title: tituloDeMuestra("bloque-datos", "respuesta-tardia") };

export default async function Pagina() {
  await comprobarAccesoMuestra();
  return (
    <VistaDeBloque
      titulo={tituloDeMuestra("bloque-datos", "respuesta-tardia")}
      estado="respuesta-tardia"
    />
  );
}
