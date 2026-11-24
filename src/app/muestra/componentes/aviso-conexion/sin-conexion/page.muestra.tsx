// Estado «sin-conexion» de «aviso-conexion» en la muestra (T-016 (e)): /muestra/componentes/aviso-conexion/sin-conexion.
// Control 2 primero. El título es un valor fijo del inventario (sin generateMetadata).
import type { Metadata } from "next";
import { comprobarAccesoMuestra } from "../../../_datos/acceso-muestra";
import { tituloDeMuestra } from "../../../_vistas/cifras/marco";
import { VistaDeAviso } from "../../../_vistas/estados/VistaDeAviso";

export const metadata: Metadata = { title: tituloDeMuestra("aviso-conexion", "sin-conexion") };

export default async function Pagina() {
  await comprobarAccesoMuestra();
  return (
    <VistaDeAviso
      titulo={tituloDeMuestra("aviso-conexion", "sin-conexion")}
      estado="sin-conexion"
    />
  );
}
