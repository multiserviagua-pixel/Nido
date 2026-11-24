// Páginas de `AvisoConexion` en la muestra (T-016 (e); REQ-060, CA-045). El armazón ya lleva el
// aviso: la página solo da dos bloques con datos ficticios que enseñan su hora de carga cuando se
// corta la red del navegador (en las pruebas, con `context.setOffline`). La muestra no llama a la red.
import type { ReactNode } from "react";
import { TarjetaCifra } from "@/components/cifras/TarjetaCifra";
import { BloqueDatos } from "@/components/estados/BloqueDatos";
import { TEXTOS } from "@/components/textos";
import { MarcoDeComponente } from "../cifras/marco";
import { TEXTOS_ESTADOS as T } from "./textos-estados";

export type EstadoDeAvisoDeMuestra = keyof typeof T.aviso.explicaciones;

export function VistaDeAviso({
  titulo,
  estado,
}: {
  titulo: string;
  estado: EstadoDeAvisoDeMuestra;
}): ReactNode {
  return (
    <MarcoDeComponente titulo={titulo}>
      <div className="flex min-w-0 flex-col gap-4">
        <h2>{T.aviso.titulo}</h2>
        <p className="text-cuerpo-menor text-texto-secundario">{T.aviso.explicaciones[estado]}</p>
        {[T.aviso.bloqueUno, T.aviso.bloqueDos].map((nombre) => (
          <div key={nombre} className="flex min-w-0 flex-col gap-2" data-fuente={nombre}>
            <h3 className="text-cuerpo font-seminegrita">{nombre}</h3>
            <BloqueDatos estado="datos" forma="tarjeta">
              <TarjetaCifra
                etiqueta={TEXTOS.cifras.ejemplo.correosRevisados}
                valor={1234}
                comparacion={{
                  anterior: 1100,
                  anteriorCompleto: true,
                  periodo: TEXTOS.cifras.comparacion.ultimos7Dias,
                  valoracion: "favorable",
                }}
              />
            </BloqueDatos>
          </div>
        ))}
      </div>
    </MarcoDeComponente>
  );
}
