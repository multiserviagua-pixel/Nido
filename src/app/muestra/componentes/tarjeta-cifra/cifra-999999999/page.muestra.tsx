// Estado «cifra-999999999» de «tarjeta-cifra» en la muestra (T-010): /muestra/componentes/tarjeta-cifra/cifra-999999999.
// Control 2 primero. El título es un valor fijo del inventario (sin generateMetadata).
import type { Metadata } from "next";
import { comprobarAccesoMuestra } from "../../../_datos/acceso-muestra";
import { tituloDeMuestra } from "../../../_vistas/cifras/marco";
import { VistaDeTarjetas } from "../../../_vistas/cifras/VistaDeTarjetas";

export const metadata: Metadata = { title: tituloDeMuestra("tarjeta-cifra", "cifra-999999999") };

export default async function Pagina() {
  await comprobarAccesoMuestra();
  return (
    <VistaDeTarjetas
      titulo={tituloDeMuestra("tarjeta-cifra", "cifra-999999999")}
      estado="cifra-999999999"
    />
  );
}
