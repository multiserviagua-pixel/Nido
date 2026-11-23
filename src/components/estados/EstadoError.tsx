"use client";

// `EstadoError` (diseño 020, «Estados de cada vista», fila `error`, y «Errores sin datos internos y
// referencia opaca»; REQ-026, REQ-028, REQ-057, REQ-068; V-6). Solo acepta un motivo de lista
// cerrada y una referencia: no hay propiedad para un mensaje, una traza ni un valor. El texto sale
// de `TEXTOS.motivosDeError` (con «No se ha podido cargar» una sola vez); una referencia solo se
// pinta si cumple el formato exacto (`leerReferencia`): si no, se descarta y, ya en el navegador, se
// crea una `N-` (REQ-057: todo error lleva una referencia; sin generador, se pinta sin ella). El
// botón «Reintentar» es único, solo si la vista da la acción (vuelve a pedir solo ese bloque) y, con
// el reintento en curso, dice «Cargando» y queda `aria-disabled`. No es región viva ni anuncia nada:
// el anuncio, una sola vez, lo hace quien detecta el fallo (`BloqueDatos` o el proveedor del cambio
// de periodo). El menú y la cabecera no dependen de este bloque.
import { useCallback, useRef, useSyncExternalStore } from "react";
import { crearReferencia, leerReferencia } from "../../lib/errores/referencia";
import { Boton } from "../acciones/Boton";
import { TEXTOS } from "../textos";
import { CAJA_DE_ESTADO } from "./EstadoVacio";
import { encabezadoDeError, leerMotivoDeError, type MotivoDeError } from "./logica";

const sinSuscripcion = (): (() => void) => () => undefined;
const sinReferenciaEnServidor = (): null => null;

export type PropiedadesDeEstadoError = {
  readonly motivo: MotivoDeError;
  /** Referencia opaca (`S-` o `N-`); si no cumple el formato, se descarta. */
  readonly referencia?: string | null;
  /** Vuelve a pedir solo este bloque. Sin ella no hay botón. */
  readonly alReintentar?: () => void;
  /** El reintento está en curso. */
  readonly reintentando?: boolean;
};

export function EstadoError({
  motivo,
  referencia,
  alReintentar,
  reintentando = false,
}: PropiedadesDeEstadoError) {
  const leido = leerMotivoDeError(motivo);
  const encabezado = encabezadoDeError(leido);
  const valida = leerReferencia(referencia);
  // Sin referencia válida, una `N-` creada aquí, solo en el navegador y después de hidratar (el
  // servidor no la crea: el documento y la hidratación no pueden diferir). Sin generador, el error
  // se queda sin ella. Se crea una vez por instancia.
  const creada = useRef<string | null | undefined>(undefined);
  const crear = useCallback((): string | null => {
    if (valida !== null) return null;
    if (creada.current === undefined) {
      try {
        creada.current = crearReferencia("navegador");
      } catch {
        creada.current = null;
      }
    }
    return creada.current;
  }, [valida]);
  const propia = useSyncExternalStore(sinSuscripcion, crear, sinReferenciaEnServidor);
  const visible = valida ?? propia;

  return (
    <div data-estado="error" className={CAJA_DE_ESTADO}>
      {encabezado === null ? null : (
        <p className="break-words text-cuerpo font-seminegrita text-texto">{encabezado}</p>
      )}
      <p
        className={`break-words text-cuerpo ${encabezado === null ? "font-seminegrita" : "text-texto"}`}
      >
        {TEXTOS.motivosDeError[leido]}
      </p>
      {visible === null ? null : (
        <p data-referencia className="break-words text-cuerpo-menor text-texto-secundario">
          {`${TEXTOS.bloque.referencia}: ${visible}`}
        </p>
      )}
      {typeof alReintentar === "function" ? (
        <Boton
          texto={TEXTOS.bloque.reintentar}
          textoEnCurso={TEXTOS.bloque.cargando}
          enCurso={reintentando === true}
          onClick={() => alReintentar()}
        />
      ) : null}
    </div>
  );
}
