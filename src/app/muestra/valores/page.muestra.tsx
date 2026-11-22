// `/muestra/valores` (T-012): la escala de `valores.css` pintada. Control 2 primero.
import type { Metadata } from "next";
import { comprobarAccesoMuestra } from "../_datos/acceso-muestra";
import { TEXTOS_PROPUESTA } from "../_vistas/propuesta/textos-propuesta";
import { VistaValores } from "../_vistas/propuesta/VistaValores";

export const metadata: Metadata = { title: TEXTOS_PROPUESTA.tituloValores };

export default async function Pagina() {
  await comprobarAccesoMuestra();
  return <VistaValores />;
}
