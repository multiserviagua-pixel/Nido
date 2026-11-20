// Capa de la muestra (020 T-005). Solo es ruta con la extensión `muestra.tsx` (control 1). Repite
// la comprobación del control 2, pero no se cuenta con ella: un `layout` no se vuelve a ejecutar al
// navegar dentro de la app, así que cada página y cada acción comprueban por sí mismas.
import type { ReactNode } from "react";
import { comprobarAccesoMuestra } from "./_datos/acceso-muestra";

export default async function CapaDeLaMuestra({ children }: { children: ReactNode }) {
  await comprobarAccesoMuestra();
  return <>{children}</>;
}
