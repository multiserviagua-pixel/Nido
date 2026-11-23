// Título fijo de un estado de las páginas de componentes de cifras y estados (T-010 (e) y (f)): el
// del inventario, sin datos (la muestra no admite `generateMetadata`).
import { notFound } from "next/navigation";
import { buscarEstado } from "../../inventario";

export { MarcoDeComponente } from "../acciones/Marco";

export function tituloDeMuestra(clave: string, estado: string): string {
  const encontrado = buscarEstado(clave, estado);
  if (encontrado === undefined) notFound();
  return `${encontrado.entrada.nombre}: ${encontrado.estado.nombre}`;
}
