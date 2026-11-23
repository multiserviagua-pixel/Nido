"use client";

// Estado de error de la muestra con un reintento ficticio (T-016 (c)): cuenta los reintentos y
// deja el botón en «Cargando». El caso de la referencia inválida se arma aquí, en el cliente: la
// cadena hostil no viaja en la carga del servidor.
import { useState } from "react";
import { EstadoError } from "@/components/estados/EstadoError";
import type { MotivoDeError } from "@/components/estados/logica";
import { TEXTOS_ESTADOS as T } from "./textos-estados";

export type CasoDeError = keyof typeof T.error.explicaciones;

type Caso = {
  readonly motivo: MotivoDeError;
  readonly referencia?: string;
  readonly reintentando?: boolean;
};

const REFERENCIA_INTERNA = 'TESTIGO-REFERENCIA-INTERNA: relation "clientes" does not exist';

const CASOS: Readonly<Record<CasoDeError, Caso>> = {
  "sin-conexion": { motivo: "sin_conexion" },
  "fallo-servidor": { motivo: "fallo_servidor", referencia: "S-7K3M9QX2AB" },
  "respuesta-no-valida": { motivo: "respuesta_no_valida", referencia: "S-4R8WZ1D6CF" },
  "tarda-demasiado": { motivo: "tarda_demasiado", referencia: "N-2H5J9PTV0G" },
  "sesion-no-valida": { motivo: "sesion_no_valida" },
  desconocido: { motivo: "desconocido" },
  "reintento-en-curso": {
    motivo: "fallo_servidor",
    referencia: "S-3C6D8F1GHJ",
    reintentando: true,
  },
  "referencia-invalida": { motivo: "fallo_servidor", referencia: REFERENCIA_INTERNA },
};

export function DemoDeEstadoError({ caso }: { caso: CasoDeError }) {
  const datos = CASOS[caso];
  const [pedidos, fijarPedidos] = useState(0);
  const [reintentando, fijarReintentando] = useState(datos.reintentando === true);
  return (
    <div className="flex min-w-0 flex-col gap-4">
      <EstadoError
        motivo={datos.motivo}
        {...(datos.referencia === undefined ? {} : { referencia: datos.referencia })}
        reintentando={reintentando}
        alReintentar={() => {
          fijarPedidos((n) => n + 1);
          fijarReintentando(true);
        }}
      />
      <p>
        {T.error.reintentosPedidos}: <span data-contador="reintentos">{pedidos}</span>
      </p>
    </div>
  );
}
