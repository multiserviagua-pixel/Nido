// `/muestra/servidor/periodo` (T-010 (e2)): vista cuyas cifras pinta el servidor en cada petición a
// partir de `?periodo=`, con datos ficticios. Existe para medir el cambio de periodo con
// `router.replace` (PRUEBA-012, PRUEBA-016, PRUEBA-034). Control 2 primero. No importa el registro
// ni la supervisión (diseño, «Cómo no tiene acceso a datos», punto 3). Al leer `searchParams` y
// llamar a `headers()`, la respuesta se pinta en cada petición y lleva `Cache-Control: no-store`.
import { comprobarAccesoMuestra } from "../../_datos/acceso-muestra";
import { CLAVE_SERVIDOR_PERIODO, metadatosDeArmazon, VistaDeArmazon } from "../../_vistas/armazon";

export const metadata = metadatosDeArmazon(CLAVE_SERVIDOR_PERIODO, "unico");

type Propiedades = { searchParams?: Promise<Record<string, string | string[] | undefined>> };

export default async function Pagina({ searchParams }: Propiedades = {}) {
  await comprobarAccesoMuestra();
  const parametros = searchParams === undefined ? undefined : await searchParams;
  return <VistaDeArmazon clave={CLAVE_SERVIDOR_PERIODO} estado="unico" parametros={parametros} />;
}
