import type { ReactElement } from "react";
import {
  IconoAdvertencia,
  IconoCorrecto,
  IconoError,
  IconoInformacion,
  IconoNeutro,
  IconoPausa,
  type PropiedadesIcono,
} from "../iconos";
import { describirEstado, leerEstado, type IconoDeEstado, type TonoDeEstado } from "./catalogo";

// `EtiquetaEstado` (diseño 020, «Componentes base», fila `EtiquetaEstado` y `catalogo.ts`; REQ-012,
// REQ-030, REQ-038, REQ-075). Siempre tono, icono y palabra: el color nunca va solo. Recibe el
// ámbito y el valor tal como llegan, los lee con `leerEstado` y los describe con el catálogo; un
// valor fuera del catálogo es «Estado desconocido» en tono neutro y el valor recibido no se pinta
// en ningún sitio. El icono es decorativo porque la palabra va al lado. Solo papeles de color que
// ya tienen su par declarado en `combinaciones.ts` (`--correcto`, `--aviso` y `--error` sobre
// página y tarjeta; `--texto-secundario` sobre página y tarjeta; `--texto` sobre `--acento-suave`).
// Pensada para ir sobre la página o una tarjeta, nunca sobre un fondo suave (PROHIBIDAS).

/** Clases por tono. El borde usa el color del texto, así que en colores forzados la etiqueta sigue
 * teniendo forma. */
export const CLASES_DE_TONO: Readonly<Record<TonoDeEstado, string>> = {
  neutro: "text-texto-secundario",
  correcto: "text-correcto",
  aviso: "text-aviso",
  error: "text-error",
  informativo: "bg-acento-suave text-texto",
};

export const ICONO_DE_ESTADO: Readonly<
  Record<IconoDeEstado, (propiedades: PropiedadesIcono) => ReactElement>
> = {
  neutro: IconoNeutro,
  correcto: IconoCorrecto,
  aviso: IconoAdvertencia,
  error: IconoError,
  informacion: IconoInformacion,
  pausa: IconoPausa,
};

/** Forma común de la etiqueta; la reutiliza la gravedad de `ListaAlertas`. */
export const BASE_DE_ETIQUETA =
  "inline-flex max-w-full items-center gap-1 rounded-pequeno border border-current px-2 py-1 text-cuerpo-menor font-medio";

export function EtiquetaEstado({ ambito, valor }: { ambito: string; valor: unknown }) {
  const estado = describirEstado(leerEstado(ambito, valor));
  const Icono = ICONO_DE_ESTADO[estado.icono];
  return (
    <span
      data-estado={estado.clave}
      data-tono={estado.tono}
      className={`${BASE_DE_ETIQUETA} ${CLASES_DE_TONO[estado.tono]}`}
    >
      <span className="inline-flex shrink-0">
        <Icono tamano={16} />
      </span>
      <span>{estado.palabra}</span>
    </span>
  );
}
