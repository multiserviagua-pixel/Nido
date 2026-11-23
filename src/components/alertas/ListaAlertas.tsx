"use client";

// `ListaAlertas` (diseño 020, «Componentes base», fila `ListaAlertas`; REQ-016, REQ-047, REQ-056,
// REQ-071, REQ-075). Una lista con nombre. Cada alerta: la gravedad con su palabra, un icono y un
// tono (el color nunca va solo); el texto, que sale del tipo (lista cerrada, `TEXTOS.alertas`);
// el cliente, si lo nombra, en otra línea con `TextoDato`; el momento con el formato común; y,
// como mucho, un botón cuyo verbo sale de una lista cerrada. No hay propiedad para un mensaje libre
// ni para el texto de un botón. Cada alerta se lee con `leerAlerta`: lo que no se reconoce cierra
// en «desconocida» y lo recibido de más no se lee. `alAccionar` recibe la posición de la alerta
// en la lista recibida y su acción; la acción real, el cerrojo y el resultado son de la vista
// (`useAccion`). Sin alertas, un estado vacío. La carga y el error son del bloque de datos.
import { Boton } from "../acciones/Boton";
import { BASE_DE_ETIQUETA, CLASES_DE_TONO, ICONO_DE_ESTADO } from "../estado/EtiquetaEstado";
import { TextoDato } from "../texto/TextoDato";
import { TEXTOS } from "../textos";
import { ASPECTO_DE_GRAVEDAD, leerAlerta, type AccionDeAlerta, type AlertaLeida } from "./logica";

export type PropiedadesDeListaAlertas = {
  /** Las alertas tal como llegan: se leen una a una, sin fiarse de su forma. */
  readonly alertas: readonly unknown[];
  readonly alAccionar: (posicion: number, accion: AccionDeAlerta) => void;
};

function Gravedad({ gravedad }: { gravedad: AlertaLeida["gravedad"] }) {
  const { tono, icono } = ASPECTO_DE_GRAVEDAD[gravedad];
  const Icono = ICONO_DE_ESTADO[icono];
  return (
    <span data-tono={tono} className={`${BASE_DE_ETIQUETA} ${CLASES_DE_TONO[tono]}`}>
      <span className="inline-flex shrink-0">
        <Icono tamano={16} />
      </span>
      <span>{TEXTOS.alertas.gravedad[gravedad]}</span>
    </span>
  );
}

export function ListaAlertas({ alertas, alAccionar }: PropiedadesDeListaAlertas) {
  const lista: readonly unknown[] = Array.isArray(alertas) ? (alertas as readonly unknown[]) : [];
  if (lista.length === 0) {
    return (
      <div data-alertas-vacia className="flex flex-col gap-1 text-texto">
        <p className="font-medio">{TEXTOS.alertas.vacio.titulo}</p>
        <p className="text-cuerpo-menor text-texto-secundario">
          {TEXTOS.alertas.vacio.explicacion}
        </p>
      </div>
    );
  }
  return (
    <ul aria-label={TEXTOS.alertas.lista} className="flex min-w-0 flex-col gap-3">
      {lista.map((bruta, posicion) => {
        const a = leerAlerta(bruta);
        return (
          <li
            key={posicion}
            data-alerta=""
            data-gravedad={a.gravedad}
            data-tipo={a.tipo}
            className="flex min-w-0 flex-col items-start gap-2 rounded-medio border border-borde-decorativo bg-superficie p-3"
          >
            <Gravedad gravedad={a.gravedad} />
            <p className="max-w-full break-words text-cuerpo text-texto">
              {TEXTOS.alertas.tipos[a.tipo]}
            </p>
            {a.cliente === null ? null : (
              <p className="max-w-full break-words text-cuerpo-menor text-texto-secundario">
                {TEXTOS.alertas.cliente}: <TextoDato texto={a.cliente} />
              </p>
            )}
            <p className="text-cuerpo-menor text-texto-secundario">{a.momento}</p>
            {a.accion === null ? null : (
              <Boton
                texto={TEXTOS.alertas.acciones[a.accion].texto}
                textoEnCurso={TEXTOS.alertas.acciones[a.accion].enCurso}
                enCurso={a.enCurso}
                onClick={() => {
                  if (a.accion !== null) alAccionar(posicion, a.accion);
                }}
              />
            )}
          </li>
        );
      })}
    </ul>
  );
}
