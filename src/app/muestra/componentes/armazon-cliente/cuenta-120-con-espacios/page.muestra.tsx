// Estado «cuenta-120-con-espacios» de «armazon-cliente» en la muestra (T-010 (c)):
// /muestra/componentes/armazon-cliente/cuenta-120-con-espacios. Control 2 primero. El título es un
// valor fijo del inventario (sin generateMetadata): distinto en cada estado y sin datos.
import { comprobarAccesoMuestra } from "../../../_datos/acceso-muestra";
import { metadatosDeArmazon, VistaDeArmazon } from "../../../_vistas/armazon";

export const metadata = metadatosDeArmazon("armazon-cliente", "cuenta-120-con-espacios");

export default async function Pagina() {
  await comprobarAccesoMuestra();
  return <VistaDeArmazon clave="armazon-cliente" estado="cuenta-120-con-espacios" />;
}
