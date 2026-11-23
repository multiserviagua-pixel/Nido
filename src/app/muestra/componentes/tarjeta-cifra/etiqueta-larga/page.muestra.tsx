// Estado «etiqueta-larga» de «tarjeta-cifra» en la muestra (T-010): /muestra/componentes/tarjeta-cifra/etiqueta-larga.
// Control 2 primero. El título es un valor fijo del inventario (sin generateMetadata).
import type { Metadata } from "next";
import { comprobarAccesoMuestra } from "../../../_datos/acceso-muestra";
import { tituloDeMuestra } from "../../../_vistas/cifras/marco";
import { VistaDeTarjetas } from "../../../_vistas/cifras/VistaDeTarjetas";

export const metadata: Metadata = { title: tituloDeMuestra("tarjeta-cifra", "etiqueta-larga") };

export default async function Pagina() {
  await comprobarAccesoMuestra();
  return (
    <VistaDeTarjetas
      titulo={tituloDeMuestra("tarjeta-cifra", "etiqueta-larga")}
      estado="etiqueta-larga"
    />
  );
}
