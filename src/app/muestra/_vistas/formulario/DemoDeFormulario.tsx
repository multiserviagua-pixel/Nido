"use client";

// Simulador de `Formulario` (T-016 (a)): la muestra no llama a la red. La respuesta que «da el
// servidor» se elige con el selector y la lee `leerResultadoAccion` como la de cualquier acción. Los
// contadores son parte de la propia página; el último cuerpo enviado se enseña para que la prueba
// compruebe que lo escrito solo viaja en el cuerpo.
import { useState } from "react";
import { Formulario } from "@/components/formulario/Formulario";
import type { DefinicionDeCampo, ValoresDeFormulario } from "@/components/formulario/logica";
import { TEXTOS } from "@/components/textos";
import { TEXTOS_FORMULARIO as T } from "./textos-formulario";

type ClaveDeRespuesta = keyof typeof T.respuestas;
type ConRespuesta = Exclude<ClaveDeRespuesta, "sin_conexion" | "sin_respuesta">;
const CLAVES = Object.keys(T.respuestas) as ClaveDeRespuesta[];

const RECHAZO = (campo: string, codigo: string): unknown => ({
  estado: 422,
  cuerpo: {
    resultado: "rechazada",
    motivo: "estado_distinto",
    errores: [{ campo, codigo }],
  },
});
const RESPUESTAS: Readonly<Record<ConRespuesta, unknown>> = {
  hecha: { cuerpo: { resultado: "hecha" } },
  campo_conocido: RECHAZO("nombre", "nombre_en_uso"),
  campo_desconocido: RECHAZO("TESTIGO_CAMPO_DEL_SERVIDOR", "nombre_en_uso"),
  codigo_desconocido: RECHAZO("nombre", "TESTIGO_CODIGO_DEL_SERVIDOR"),
  motivo_conocido: {
    estado: 409,
    cuerpo: { resultado: "rechazada", motivo: "estado_distinto" },
  },
  no_permitida: { estado: 401 },
  servidor: { estado: 500 },
  ilegible: { cuerpo: "<html>" },
  desconocida: { estado: 200, cuerpo: { resultado: "exito" } },
};

export type PropiedadesDeDemo = {
  readonly nombre: typeof TEXTOS.formulario.ejemplo.nombreDelFormulario;
  readonly campos: readonly DefinicionDeCampo[];
  readonly textoEnviar:
    typeof TEXTOS.formulario.ejemplo.guardar | typeof TEXTOS.formulario.ejemplo.guardarTipos;
  readonly respuestaInicial: ClaveDeRespuesta;
  readonly intentadoAlCargar?: boolean;
};

export function DemoDeFormulario({
  nombre,
  campos,
  textoEnviar,
  respuestaInicial,
  intentadoAlCargar,
}: PropiedadesDeDemo) {
  const [envios, fijarEnvios] = useState(0);
  const [relecturas, fijarRelecturas] = useState(0);
  const [hechas, fijarHechas] = useState(0);
  const [elegida, fijarElegida] = useState<ClaveDeRespuesta>(respuestaInicial);
  const [cuerpo, fijarCuerpo] = useState<string | null>(null);

  const ejecutar = (valores: ValoresDeFormulario): unknown => {
    fijarEnvios((n) => n + 1);
    fijarCuerpo(JSON.stringify(valores));
    if (elegida === "sin_conexion") return Promise.reject(new Error("sin conexión"));
    if (elegida === "sin_respuesta") return new Promise<unknown>(() => undefined);
    if (elegida === "hecha") fijarHechas((n) => n + 1);
    return Promise.resolve(RESPUESTAS[elegida]);
  };

  return (
    <div className="flex min-w-0 flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <label htmlFor="respuesta-simulada">{T.etiquetaRespuesta}</label>
        <select
          id="respuesta-simulada"
          value={elegida}
          onChange={(e) => {
            const nueva = CLAVES.find((c) => c === e.target.value);
            if (nueva !== undefined) fijarElegida(nueva);
          }}
          className="min-h-10 max-w-full rounded-medio border border-borde-control bg-superficie px-3 text-texto"
        >
          {CLAVES.map((c) => (
            <option key={c} value={c}>
              {T.respuestas[c]}
            </option>
          ))}
        </select>
      </div>
      <Formulario
        nombre={nombre}
        campos={campos}
        textoEnviar={textoEnviar}
        textoEnCurso={TEXTOS.formulario.ejemplo.guardando}
        codigosDelServidor={["nombre_en_uso", "valor_no_valido"]}
        motivos={["estado_distinto"]}
        ejecutar={ejecutar}
        alReleer={() => fijarRelecturas((n) => n + 1)}
        intentadoAlCargar={intentadoAlCargar}
      />
      <dl className="flex flex-wrap gap-x-6 gap-y-1">
        <div className="flex gap-2">
          <dt>{T.envios}:</dt>
          <dd data-contador="envios">{envios}</dd>
        </div>
        <div className="flex gap-2">
          <dt>{T.hechas}:</dt>
          <dd data-contador="hechas">{hechas}</dd>
        </div>
        <div className="flex gap-2">
          <dt>{T.relecturas}:</dt>
          <dd data-contador="relecturas">{relecturas}</dd>
        </div>
        <div className="flex min-w-0 gap-2">
          <dt>{T.ultimoCuerpo}:</dt>
          <dd className="min-w-0 wrap-anywhere" data-contador="cuerpo">
            {cuerpo ?? T.ninguno}
          </dd>
        </div>
      </dl>
    </div>
  );
}
