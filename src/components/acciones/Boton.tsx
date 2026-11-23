"use client";

// `Boton` (diseño 020, «Componentes base», fila `Boton`, `useAccion`; REQ-024, REQ-037, REQ-074).
// El texto es obligatorio y solo puede ser uno de `TEXTOS` (tipo `TextoFijo`): no hay hijos libres ni
// forma de pasar un texto del servidor. En curso, dice la acción con palabra («Pausando…»), se
// marca `aria-disabled` (sigue en el orden de tabulación, no se pierde el foco) y la pulsación se
// ignora, también la de Intro repetido o la de un envío implícito de formulario. El cerrojo real
// contra el doble envío es el de `useAccion`. Dos variantes, con papeles de color ya declarados en
// `combinaciones.ts`; el foco es el de `base.css`. Alto de 40 px (`control`), por encima de los
// 24 px mínimos (REQ-037).
import type { MouseEvent } from "react";
import { TEXTOS, type TextoFijo } from "../textos";

export type VarianteDeBoton = "primario" | "secundario";

export type PropiedadesDeBoton = {
  readonly texto: TextoFijo;
  /** Lo que dice mientras la acción está en curso. Sin él, «Cargando». */
  readonly textoEnCurso?: TextoFijo;
  readonly enCurso?: boolean;
  readonly variante?: VarianteDeBoton;
  readonly type?: "button" | "submit";
  readonly onClick?: (evento: MouseEvent<HTMLButtonElement>) => void;
};

const BASE =
  "inline-flex min-h-10 min-w-10 items-center justify-center rounded-medio px-3 text-cuerpo font-medio";
const VARIANTES: Readonly<Record<VarianteDeBoton, string>> = {
  primario: `${BASE} border border-acento bg-acento text-texto-sobre-acento`,
  secundario: `${BASE} border border-borde-control bg-superficie text-texto`,
};

export function Boton({
  texto,
  textoEnCurso,
  enCurso = false,
  variante = "secundario",
  type = "button",
  onClick,
}: PropiedadesDeBoton) {
  // Cierra en lo discreto: una variante o un tipo desconocidos no abren nada nuevo.
  const clases = Object.hasOwn(VARIANTES, variante) ? VARIANTES[variante] : VARIANTES.secundario;
  return (
    <button
      type={type === "submit" ? "submit" : "button"}
      className={clases}
      aria-disabled={enCurso ? "true" : undefined}
      onClick={(evento) => {
        if (enCurso) {
          evento.preventDefault();
          return;
        }
        onClick?.(evento);
      }}
    >
      {enCurso ? (textoEnCurso ?? TEXTOS.bloque.cargando) : texto}
    </button>
  );
}
