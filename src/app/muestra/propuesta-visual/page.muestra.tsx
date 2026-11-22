// `/muestra/propuesta-visual` (T-012): la propuesta para el responsable (T-013). Control 2 primero.
// Título fijo, igual al h1 y distinto del de las demás páginas de la muestra.
import type { Metadata } from "next";
import { comprobarAccesoMuestra } from "../_datos/acceso-muestra";
import { TEXTOS_PROPUESTA } from "../_vistas/propuesta/textos-propuesta";
import { VistaPropuesta } from "../_vistas/propuesta/VistaPropuesta";

export const metadata: Metadata = { title: TEXTOS_PROPUESTA.titulo };

export default async function Pagina() {
  await comprobarAccesoMuestra();
  return <VistaPropuesta />;
}
