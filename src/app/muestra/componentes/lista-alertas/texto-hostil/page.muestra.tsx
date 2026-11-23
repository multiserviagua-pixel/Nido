// Estado «texto-hostil» de «lista-alertas» en la muestra (T-010 (i)): /muestra/componentes/lista-alertas/texto-hostil.
// Control 2 primero. El título es un valor fijo del inventario (sin generateMetadata).
import type { Metadata } from "next";
import { comprobarAccesoMuestra } from "../../../_datos/acceso-muestra";
import { tituloDeMuestra } from "../../../_vistas/cifras/marco";
import { VistaDeAlertas } from "../../../_vistas/alertas/VistaDeAlertas";

export const metadata: Metadata = { title: tituloDeMuestra("lista-alertas", "texto-hostil") };

export default async function Pagina() {
  await comprobarAccesoMuestra();
  return (
    <VistaDeAlertas
      titulo={tituloDeMuestra("lista-alertas", "texto-hostil")}
      estado="texto-hostil"
    />
  );
}
