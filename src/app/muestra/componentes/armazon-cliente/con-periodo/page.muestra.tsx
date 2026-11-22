// Estado «con-periodo» de «armazon-cliente» en la muestra (T-010 (c)): /muestra/componentes/armazon-cliente/con-periodo.
// Control 2 primero. El título es un valor fijo del inventario (sin generateMetadata).
import { comprobarAccesoMuestra } from "../../../_datos/acceso-muestra";
import { metadatosDeArmazon, VistaDeArmazon } from "../../../_vistas/armazon";

export const metadata = metadatosDeArmazon("armazon-cliente", "con-periodo");

type Propiedades = { searchParams?: Promise<Record<string, string | string[] | undefined>> };

export default async function Pagina({ searchParams }: Propiedades = {}) {
  await comprobarAccesoMuestra();
  const parametros = searchParams === undefined ? undefined : await searchParams;
  return <VistaDeArmazon clave="armazon-cliente" estado="con-periodo" parametros={parametros} />;
}
