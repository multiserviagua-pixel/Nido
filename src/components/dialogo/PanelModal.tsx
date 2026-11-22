"use client";

// Panel modal anclado arriba a la derecha (diseño 020, «Diálogo, cajón y avisos»; REQ-035): la
// primitiva de T-001 (`@radix-ui/react-dialog`) tras una interfaz propia, para que los demás
// componentes no importen Radix (PRUEBA-008, R3: solo `dialogo/` y `CajonMenu`). Radix atrapa el
// foco, deja inerte el fondo, cierra con Escape y devuelve el foco al disparador. Aquí no hay
// código de foco propio. Lo usa `CuentaUsuario`; `DialogoConfirmacion` (T-010 (j)) irá a su lado.
import * as Dialog from "@radix-ui/react-dialog";
import type { ReactElement, ReactNode } from "react";
import { IconoCerrar } from "../iconos";

export function PanelModal({
  disparador,
  titulo,
  etiquetaCerrar,
  children,
}: {
  /** El botón que lo abre. Debe ser un solo elemento que acepte `ref` y los atributos de botón. */
  disparador: ReactElement;
  /** Nombre accesible del panel; texto fijo de `textos.ts`. */
  titulo: string;
  /** Nombre accesible del botón que lo cierra; texto fijo de `textos.ts`. */
  etiquetaCerrar: string;
  children: ReactNode;
}) {
  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>{disparador}</Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-velo" />
        <Dialog.Content
          aria-describedby={undefined}
          className="fixed inset-x-0 top-0 z-50 max-h-dvh overflow-y-auto rounded-b-grande border border-borde-control bg-superficie p-4 text-texto shadow-elevada sm:inset-x-auto sm:right-0 sm:w-menu-ancho"
        >
          <div className="flex items-center justify-between gap-3 pb-3">
            <Dialog.Title className="text-subtitulo font-seminegrita">{titulo}</Dialog.Title>
            <Dialog.Close asChild>
              <button
                type="button"
                aria-label={etiquetaCerrar}
                className="inline-flex min-h-10 min-w-10 items-center justify-center rounded-medio border border-borde-control text-texto"
              >
                <IconoCerrar tamano={20} />
              </button>
            </Dialog.Close>
          </div>
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
