"use client";

// `DialogoConfirmacion` (diseño 020, «Diálogo, cajón y avisos», fila `DialogoConfirmacion`;
// REQ-017, REQ-018, REQ-073, REQ-074, REQ-078, REQ-082; CA-013, CA-053). Diálogo de alerta de la
// primitiva de T-001 (`@radix-ui/react-alert-dialog`, PRUEBA-011) tras una interfaz propia: Radix
// atrapa el foco, deja inerte el fondo, cierra con Escape y devuelve el foco al disparador. Aquí no
// hay código de foco propio salvo dos casos, dichos en su sitio.
//
// - Título con qué va a pasar; descripción con a qué o a quién afecta (el objetivo, un dato, con
//   `TextoDato`, más un segundo dato que lo distingue) y cuándo se aplica. Todo texto fijo sale de
//   `TEXTOS.dialogo`: no hay propiedad para un título, un verbo ni un mensaje libre.
// - El foco inicial va a «Cancelar» (Radix lo hace con `AlertDialog.Cancel`): Intro nada más abrir
//   cancela. Confirmar lleva el verbo con su objeto y, si la acción lo pide, la variante `peligro`.
// - El envío es el de `useAccion`: cerrojo, plazo de 30 s y los cuatro resultados de
//   `leerResultadoAccion`. Con la acción en curso no se cierra (Escape, «Cancelar»): ya se envió y
//   cerrarlo ocultaría un resultado que puede ser «no se sabe si se aplicó». Un clic fuera no cierra
//   (así es un diálogo de alerta). `hecha` cierra y lo anuncia; `rechazada` deja el diálogo y se
//   puede volver a confirmar; `no_permitida` e `incierta` quitan «confirmar» (no se reintenta sola)
//   y mueven el foco a «Cerrar»; `incierta` ofrece «Comprobar estado», que relee la vista.
// - Alto máximo el de la ventana: el texto y los botones se desplazan juntos dentro del diálogo.
// - El mensaje se anuncia una vez por la región cortés; lo visible no es región viva.
import * as AlertDialog from "@radix-ui/react-alert-dialog";
import { useEffect, useRef, useState, type ReactElement } from "react";
import { Boton, VARIANTES } from "../acciones/Boton";
import { useAccion } from "../acciones/useAccion";
import type { ListasDeLectura } from "../acciones/resultado";
import { TextoDato } from "../texto/TextoDato";
import { anunciar } from "../texto/anuncios";
import { TEXTOS } from "../textos";
import {
  leerAccionDeDialogo,
  leerDatoDistintivo,
  leerObjetivo,
  presentarResultado,
  puedeCerrarse,
  variantePorAccion,
  type ClaveDeAccionDeDialogo,
  type ClaveDeDatoDistintivo,
} from "./logica";

export type PropiedadesDeDialogoConfirmacion = {
  /** El botón que lo abre: un solo elemento que acepte `ref` y los atributos de botón. */
  readonly disparador: ReactElement;
  /** Qué acción confirma (lista cerrada); de ella salen el título, el cuándo y el verbo. */
  readonly accion: ClaveDeAccionDeDialogo;
  /** A qué o a quién afecta: dos datos, el nombre y otro que lo distinga de uno parecido. */
  readonly objetivo: { readonly nombre: string; readonly distintivo: string };
  /** Qué dato es el distintivo (lo declara cada vista). */
  readonly datoDistintivo: ClaveDeDatoDistintivo;
  /** Hace el envío y devuelve `{estado?, cuerpo?}` o una promesa de ello (ver `useAccion`). */
  readonly ejecutar: () => unknown;
  /** Hace que la vista relea el estado real. */
  readonly alReleer?: () => void;
  readonly lectura?: ListasDeLectura;
  /** Solo para la muestra: abierto al cargar la página. */
  readonly abiertoAlCargar?: boolean;
};

export function DialogoConfirmacion({
  disparador,
  accion,
  objetivo,
  datoDistintivo,
  ejecutar,
  alReleer,
  lectura,
  abiertoAlCargar = false,
}: PropiedadesDeDialogoConfirmacion) {
  // Cierra en fallo: una acción o un dato distintivo fuera de las listas no abren nada.
  const clave = leerAccionDeDialogo(accion);
  const dato = leerDatoDistintivo(datoDistintivo);
  const leido = leerObjetivo(objetivo);
  const [abierto, fijarAbierto] = useState(abiertoAlCargar);
  const cancelar = useRef<HTMLButtonElement>(null);
  const envio = useAccion(ejecutar, { alReleer, lectura });
  const vista = presentarResultado(envio.lectura);
  const { restablecer } = envio;

  // Un anuncio por resultado. `hecha` cierra el diálogo y vuelve a reposo.
  const mensaje = vista.mensaje;
  useEffect(() => {
    if (mensaje !== null) anunciar(mensaje);
  }, [mensaje]);
  // `hecha` cierra el diálogo: el estado se ajusta durante el pintado (no en un efecto) y el
  // controlador vuelve a reposo después.
  const cierraSolo = vista.cierra;
  if (cierraSolo && abierto) fijarAbierto(false);
  useEffect(() => {
    if (cierraSolo) restablecer();
  }, [cierraSolo, restablecer]);

  // Si «confirmar» desaparece (no permitida, incierta), el foco no puede quedar en el aire.
  const sinConfirmar = !vista.mostrarConfirmar;
  useEffect(() => {
    if (sinConfirmar) cancelar.current?.focus();
  }, [sinConfirmar]);

  const cambiar = (siguiente: boolean): void => {
    if (clave === null || dato === null) return;
    if (!siguiente && !puedeCerrarse(envio.enCurso)) return;
    fijarAbierto(siguiente);
    if (!siguiente) restablecer();
  };

  if (clave === null || dato === null) return disparador;
  const textos = TEXTOS.dialogo.acciones[clave];

  return (
    <AlertDialog.Root open={abierto} onOpenChange={cambiar}>
      <AlertDialog.Trigger asChild>{disparador}</AlertDialog.Trigger>
      <AlertDialog.Portal>
        <AlertDialog.Overlay className="fixed inset-0 z-50 flex items-center justify-center bg-velo p-4">
          <AlertDialog.Content
            // Con poca altura el diálogo se desplaza por dentro y el elemento con el foco podría
            // quedar fuera de la vista (REQ-082): se acerca siempre, sin mover el foco.
            onFocus={(evento) => evento.target.scrollIntoView({ block: "nearest" })}
            className="flex max-h-full w-full flex-col gap-4 overflow-y-auto rounded-grande border border-borde-control bg-superficie p-4 text-texto shadow-elevada sm:p-6 md:w-1/2 lg:w-2/5"
          >
            <AlertDialog.Title className="text-subtitulo font-seminegrita">
              {textos.titulo}
            </AlertDialog.Title>
            <AlertDialog.Description asChild>
              <div className="flex min-w-0 flex-col gap-2 text-cuerpo">
                <p className="max-w-full wrap-anywhere">
                  {TEXTOS.dialogo.afecta}: <TextoDato texto={leido.nombre} />
                </p>
                <p className="max-w-full text-cuerpo-menor text-texto-secundario wrap-anywhere">
                  {TEXTOS.dialogo.datosDistintivos[dato]}: <TextoDato texto={leido.distintivo} />
                </p>
                <p className="max-w-full wrap-anywhere">{textos.cuando}</p>
              </div>
            </AlertDialog.Description>
            {mensaje === null ? null : (
              <p
                data-resultado={envio.resultado ?? undefined}
                className="max-w-full rounded-medio border border-borde-control p-3 text-cuerpo-menor text-texto wrap-anywhere"
              >
                {mensaje}
              </p>
            )}
            <div className="flex flex-wrap justify-end gap-3">
              <AlertDialog.Cancel asChild>
                <button
                  ref={cancelar}
                  type="button"
                  className={VARIANTES.secundario}
                  aria-disabled={envio.enCurso ? "true" : undefined}
                  onClick={(evento) => {
                    // Con el envío en curso no se cierra; Radix no cierra si se anula el clic.
                    if (envio.enCurso) evento.preventDefault();
                  }}
                >
                  {vista.cierre === "cerrar" ? TEXTOS.dialogo.cerrar : TEXTOS.acciones.cancelar}
                </button>
              </AlertDialog.Cancel>
              {vista.ofrecerComprobar ? (
                <Boton
                  texto={TEXTOS.acciones.resultado.comprobarEstado}
                  onClick={() => {
                    alReleer?.();
                    cambiar(false);
                  }}
                />
              ) : null}
              {vista.mostrarConfirmar ? (
                <Boton
                  texto={textos.confirmar}
                  textoEnCurso={textos.enCurso}
                  variante={variantePorAccion(clave)}
                  enCurso={envio.enCurso}
                  onClick={envio.lanzar}
                />
              ) : null}
            </div>
          </AlertDialog.Content>
        </AlertDialog.Overlay>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}
