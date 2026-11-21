// Estado «actividad» de «armazon-cliente» en la muestra (T-010 (a)): /muestra/componentes/armazon-cliente/actividad.
// Control 2 primero. El título es un valor fijo del inventario (sin generateMetadata, que la muestra
// no admite): distinto en cada estado y sin datos.
import { comprobarAccesoMuestra } from "../../../_datos/acceso-muestra";
import { metadatosDeArmazon, VistaDeArmazon } from "../../../_vistas/armazon";

export const metadata = metadatosDeArmazon("armazon-cliente", "actividad");

export default async function Pagina() {
  await comprobarAccesoMuestra();
  return <VistaDeArmazon clave="armazon-cliente" estado="actividad" />;
}
