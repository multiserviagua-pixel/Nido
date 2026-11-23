"use client";

// `ListaAlertas` (diseño 020, «Componentes base», fila `ListaAlertas`; REQ-016, REQ-047, REQ-056,
// REQ-071, REQ-075). Una lista con nombre. Cada alerta: la gravedad con su palabra, un icono y un
// tono (el color nunca va solo); el texto, que sale del tipo (lista cerrada, `TEXTOS.alertas`);
// el cliente, si lo nombra, en otra línea con `TextoDato`; el momento con el formato común; y,
// como mucho, un botón cuyo verbo sale de una lista cerrada. No hay propiedad para un mensaje libre
// ni para el texto de un botón. Este componente es de cliente y solo recibe alertas ya leídas
// (`leerAlertas`, que corre en el servidor): lo que no se reconoce ya cerró en «desconocida» y lo
// recibido de más no viaja al navegador (regla V-2). Aun así, la gravedad, el tipo y la acción se
// vuelven a comprobar contra sus listas (cierra en fallo) y se pintan como mucho 25. `alAccionar` recibe la posición de la alerta
// en la lista recibida y su acción; la acción real, el cerrojo y el resultado son de la vista
// (`useAccion`). Sin alertas, un estado vacío. La carga y el error son del bloque de datos.
import { Boton } from "../acciones/Boton";
import { BASE_DE_ETIQUETA, CLASES_DE_TONO, ICONO_DE_ESTADO } from "../estado/EtiquetaEstado";
import { TextoDato } from "../texto/TextoDato";
import { TEXTOS } from "../textos";
import {
  ASPECTO_DE_GRAVEDAD,
  MAXIMO_DE_ALERTAS,
  leerAccionDeAlerta,
  leerGravedadDeAlerta,
  leerTipoDeAlerta,
  type AccionDeAlerta,
  type AlertaLeida,
} from "./logica";

export type PropiedadesDeListaAlertas = {
  /** Las alertas ya leídas en el servidor con `leerAlertas` (regla V-2): una fila cruda no es de
   * este tipo y no compila. */
  readonly alertas: readonly AlertaLeida[];
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
  const lista: readonly AlertaLeida[] = Array.isArray(alertas)
    ? (alertas as readonly AlertaLeida[]).slice(0, MAXIMO_DE_ALERTAS)
    : [];
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
      {lista.map((leida, posicion) => {
        // Defensa en profundidad: lo que no esté en las listas cerradas no llega a `TEXTOS`.
        const a = {
          gravedad: leerGravedadDeAlerta(leida?.gravedad),
          tipo: leerTipoDeAlerta(leida?.tipo),
          momento: typeof leida?.momento === "string" ? leida.momento : TEXTOS.formato.sinDatos,
          cliente: typeof leida?.cliente === "string" ? leida.cliente : null,
          accion: leerAccionDeAlerta(leida?.accion),
          enCurso: leida?.enCurso === true,
        };
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
