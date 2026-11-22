"use client";

// Cajón del menú (diseño 020, «Armazón» y «Diálogo, cajón y avisos»; REQ-004, REQ-035, REQ-037):
// con 1023 px o menos, el menú lateral queda oculto con `display: none` y el cajón no pinta su
// lista hasta abrirlo: el botón «Abrir menú» la abre como diálogo modal. Sin JavaScript no hay
// menú por debajo de 1024 px (menor 6, pendiente). La primitiva es la de T-001 (PRUEBA-011),
// `@radix-ui/react-dialog`: atrapa el foco, deja inerte el fondo, cierra con Escape y devuelve el
// foco al botón. Aquí no hay código de foco propio salvo un caso: si la ventana pasa a 1024 px o
// más con el cajón abierto, el botón queda oculto y el foco va al menú lateral (nunca queda en un
// elemento oculto). No recuerda su estado: no escribe nada en el navegador (REQ-058).
// Radix solo se importa aquí y en `dialogo/` (PRUEBA-008).
import * as Dialog from "@radix-ui/react-dialog";
import { useEffect, useRef, useState } from "react";
import { IconoCerrar, IconoMenu } from "../iconos";
import { TEXTOS } from "../textos";
import { CONSULTA_MENU_FIJO, alEnsancharLaVentana } from "./ancho-menu";
import type { Area } from "./areas";
import { ListaDeAreas } from "./ListaDeAreas";

/** Destino del foco si el botón del cajón ya no se ve: el área actual del menú lateral o, si no
 * hay, su primer enlace. */
function enlaceDelMenuLateral(): HTMLElement | null {
  return (
    document.querySelector<HTMLElement>('nav[data-menu-lateral] [aria-current="page"]') ??
    document.querySelector<HTMLElement>("nav[data-menu-lateral] a")
  );
}

export function CajonMenu({ areas, areaActual }: { areas: readonly Area[]; areaActual: string }) {
  const [abierto, setAbierto] = useState(false);
  const boton = useRef<HTMLButtonElement>(null);

  useEffect(
    () => alEnsancharLaVentana(window.matchMedia(CONSULTA_MENU_FIJO), () => setAbierto(false)),
    [],
  );

  return (
    <Dialog.Root open={abierto} onOpenChange={setAbierto}>
      <Dialog.Trigger asChild>
        <button
          ref={boton}
          type="button"
          aria-label={TEXTOS.armazon.abrirMenu}
          className="inline-flex min-h-10 min-w-10 items-center justify-center rounded-medio border border-borde-control bg-superficie text-texto lg:hidden"
        >
          <IconoMenu tamano={20} />
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-velo" />
        <Dialog.Content
          aria-describedby={undefined}
          // Radix mueve el foco sin desplazar (al dar la vuelta con el tabulador). Con poca altura
          // el cajón se desplaza por dentro y el elemento con el foco podría quedar fuera de la
          // vista (CA-027): se acerca siempre a la vista, sin mover el foco.
          onFocus={(evento) => evento.target.scrollIntoView({ block: "nearest" })}
          onCloseAutoFocus={(evento) => {
            const b = boton.current;
            if (b !== null && b.getClientRects().length > 0) return;
            // El botón no se ve (ventana ensanchada): el foco va al menú lateral, no a un oculto.
            evento.preventDefault();
            enlaceDelMenuLateral()?.focus();
          }}
          className="fixed inset-y-0 left-0 z-50 flex w-menu-ancho max-w-full flex-col overflow-y-auto border-r border-menu-texto bg-menu-fondo bg-degradado-menu py-4 text-menu-texto shadow-elevada"
        >
          <div className="flex items-center justify-between gap-3 px-4 pb-4">
            <Dialog.Title className="text-subtitulo font-seminegrita text-menu-texto">
              {TEXTOS.armazon.menu}
            </Dialog.Title>
            <Dialog.Close asChild>
              <button
                type="button"
                aria-label={TEXTOS.armazon.cerrarMenu}
                className="inline-flex min-h-10 min-w-10 items-center justify-center rounded-medio border border-menu-texto text-menu-texto"
              >
                <IconoCerrar tamano={20} />
              </button>
            </Dialog.Close>
          </div>
          <nav aria-label={TEXTOS.armazon.navegacionPrincipal}>
            <ListaDeAreas
              areas={areas}
              areaActual={areaActual}
              alElegir={() => setAbierto(false)}
            />
          </nav>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
