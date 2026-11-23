"use client";

// Disparador de `AvisosTemporales` en la muestra (T-016 (b)). Cada pulsación añade los avisos del
// estado, en orden. La página no ofrece ningún otro tipo de aviso. Contrato de la prueba:
// `specs/020-sistema-diseno-armazon/evidencias/T-009/avisos-contrato.md`.
import { VARIANTES } from "@/components/acciones/Boton";
import { AvisosTemporales } from "@/components/avisos/AvisosTemporales";
import type { ClaveDeAviso } from "@/components/avisos/logica";
import { useAvisos } from "@/components/avisos/useAvisos";
import { TEXTOS_AVISOS as T } from "./textos-avisos";

export function DemoDeAvisos({
  claves,
  etiqueta,
}: {
  claves: readonly ClaveDeAviso[];
  etiqueta: string;
}) {
  const { avisos, avisar, cerrar } = useAvisos();
  return (
    <div className="flex min-w-0 flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          data-disparador="aviso"
          className={VARIANTES.primario}
          onClick={() => {
            for (const clave of claves) avisar(clave);
          }}
        >
          {etiqueta}
        </button>
        <button type="button" data-control="neutro" className={VARIANTES.secundario}>
          {T.neutro}
        </button>
      </div>
      <p className="min-h-dvh text-cuerpo-menor text-texto-secundario">{T.relleno}</p>
      <div>
        <button type="button" data-control="final" className={VARIANTES.secundario}>
          {T.final}
        </button>
      </div>
      <AvisosTemporales avisos={avisos} alCerrar={cerrar} />
    </div>
  );
}
