// `/muestra/componentes/boton-accion/variantes` (T-010 (d)): `Boton` en cada variante, en reposo y
// en curso (`aria-disabled`, con la palabra de la acción). Sin manejadores: es solo el aspecto.
import { Boton } from "@/components/acciones/Boton";
import { TEXTOS } from "@/components/textos";
import { MarcoDeComponente } from "./Marco";
import { TEXTOS_ACCIONES as T } from "./textos-acciones";

export function VistaDeVariantes({ titulo }: { titulo: string }) {
  return (
    <MarcoDeComponente titulo={titulo}>
      <section aria-labelledby="variantes-titulo" className="flex flex-col gap-4">
        <h2 id="variantes-titulo">{T.tituloVariantes}</h2>
        {(["primario", "secundario"] as const).map((variante) => (
          <div
            key={variante}
            data-variante={variante}
            className="flex flex-wrap items-center gap-3"
          >
            <h3 className="w-full">{T[variante]}</h3>
            <span>{T.enReposo}</span>
            <Boton texto={TEXTOS.acciones.confirmar.pausar} variante={variante} />
            <span>{T.enCurso}</span>
            <Boton
              texto={TEXTOS.acciones.confirmar.pausar}
              textoEnCurso={TEXTOS.acciones.enCurso.pausar}
              enCurso
              variante={variante}
            />
          </div>
        ))}
        <div className="flex flex-wrap items-center gap-3">
          <Boton texto={TEXTOS.acciones.cancelar} />
          <Boton texto={TEXTOS.acciones.confirmar.volverAtras} variante="primario" />
        </div>
      </section>
    </MarcoDeComponente>
  );
}
