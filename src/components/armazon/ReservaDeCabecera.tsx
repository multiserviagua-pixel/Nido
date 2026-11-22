"use client";

// Reserva el alto de la cabecera fija (diseño 020, «Armazón», `Cabecera`; REQ-036): pone en la
// raíz `scroll-padding-top` igual al alto de la cabecera (que cambia con el ancho y con el texto),
// para que el navegador, al llevar un elemento con foco a la vista, no lo deje debajo de ella.
// Solo reserva cuando la cabecera es de verdad fija (`position: sticky`; en ventanas bajas no lo
// es) y vuelve a medir al cambiar el tamaño de la ventana.
// Escribe solo una propiedad de estilo por el modelo de objetos de CSS, no un atributo `style`.
import { useEffect } from "react";

/** Margen para el contorno del foco (grosor y separación de `valores.css`, 2 px y 2 px). */
const MARGEN_DEL_FOCO_PX = 4;

export function ReservaDeCabecera() {
  useEffect(() => {
    const cabecera = document.querySelector<HTMLElement>("[data-cabecera]");
    if (cabecera === null) return;
    const raiz = document.documentElement;
    const aplicar = (): void => {
      if (getComputedStyle(cabecera).position !== "sticky") {
        raiz.style.removeProperty("scroll-padding-top");
        return;
      }
      const alto = Math.ceil(cabecera.getBoundingClientRect().height);
      raiz.style.setProperty("scroll-padding-top", `${alto + MARGEN_DEL_FOCO_PX}px`);
    };
    aplicar();
    const observador = new ResizeObserver(aplicar);
    observador.observe(cabecera);
    window.addEventListener("resize", aplicar);
    return () => {
      observador.disconnect();
      window.removeEventListener("resize", aplicar);
      raiz.style.removeProperty("scroll-padding-top");
    };
  }, []);
  return null;
}
