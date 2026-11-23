// Campos de `Formulario` (diseño 020, «Componentes base», fila `Formulario y campos`; REQ-019,
// REQ-020, REQ-036, REQ-037; CA-014). Seis campos controlados por el formulario que los contiene:
// texto, texto largo, selección, casilla, grupo de opciones y búsqueda. Cada uno lleva la etiqueta
// visible y permanente, «(obligatorio)» con palabra, la ayuda y el límite unidos con
// `aria-describedby`, y los errores junto al campo con `aria-invalid`, con un icono y con texto:
// el color nunca va solo. Sin `required` nativo: el formulario es `noValidate` y los mensajes son de
// la aplicación. Todo texto sale de `TEXTOS`; el valor lo guarda el formulario, en memoria. Los
// controles no llevan `name`: nada de lo escrito se envía por su cuenta (regla V-3).
import type { ReactNode } from "react";
import { IconoError } from "../iconos/IconoError";
import { TEXTOS, type TextoFijo } from "../textos";
import { descripcionDe, textoDeLimite, type CampoLeido, type ValorDeCampo } from "./logica";

export type PropiedadesDeCampo = {
  readonly campo: CampoLeido;
  /** Identificador del control en el documento (`<id del formulario>-<clave>`). */
  readonly id: string;
  readonly valor: ValorDeCampo;
  readonly alCambiar: (valor: ValorDeCampo) => void;
  /** Textos de los errores de este campo (de `TEXTOS.formulario.errores`). */
  readonly errores: readonly TextoFijo[];
};

const CONTROL =
  "min-h-10 w-full max-w-full rounded-medio border border-borde-control bg-superficie px-3 text-cuerpo text-texto aria-invalid:border-error";

/** Identificador del elemento que recibe el foco al saltar a este campo. */
export function idDelControl(campo: CampoLeido, id: string): string {
  return campo.tipo === "grupo" ? `${id}-opcion-0` : id;
}

function Etiqueta({
  htmlFor,
  campo,
  como: Elemento = "label",
}: {
  htmlFor?: string;
  campo: CampoLeido;
  como?: "label" | "legend";
}) {
  return (
    <Elemento
      {...(Elemento === "label" ? { htmlFor } : {})}
      className="text-cuerpo font-medio text-texto"
    >
      {campo.etiqueta}
      {campo.obligatorio ? (
        <>
          {" "}
          <span className="font-normal text-texto-secundario">{TEXTOS.formulario.obligatorio}</span>
        </>
      ) : null}
    </Elemento>
  );
}

function Mensajes({
  id,
  campo,
  errores,
}: {
  id: string;
  campo: CampoLeido;
  errores: readonly TextoFijo[];
}) {
  const limite = "longitudMaxima" in campo ? campo.longitudMaxima : null;
  return (
    <>
      {campo.ayuda === undefined ? null : (
        <p id={`${id}-ayuda`} className="text-cuerpo-menor text-texto-secundario">
          {campo.ayuda}
        </p>
      )}
      {limite === null ? null : (
        <p id={`${id}-limite`} className="text-cuerpo-menor text-texto-secundario">
          {textoDeLimite(limite)}
        </p>
      )}
      {errores.length === 0 ? null : (
        <p id={`${id}-error`} data-error-de-campo={campo.clave} className="flex flex-col gap-1">
          {errores.map((e) => (
            <span key={e} className="flex items-start gap-2 text-cuerpo-menor text-error">
              <span className="mt-1 inline-flex shrink-0">
                <IconoError tamano={16} />
              </span>
              <span className="min-w-0 wrap-anywhere">{e}</span>
            </span>
          ))}
        </p>
      )}
    </>
  );
}

function Contenedor({ children }: { children: ReactNode }) {
  return <div className="flex min-w-0 flex-col gap-2">{children}</div>;
}

function atributos(id: string, campo: CampoLeido, errores: readonly TextoFijo[]) {
  const limite = "longitudMaxima" in campo;
  return {
    "aria-invalid": errores.length > 0 ? ("true" as const) : undefined,
    "aria-required": campo.obligatorio ? ("true" as const) : undefined,
    "aria-describedby": descripcionDe(id, {
      ayuda: campo.ayuda !== undefined,
      limite,
      errores: errores.length > 0,
    }),
  };
}

export function CampoDeTexto({ campo, id, valor, alCambiar, errores }: PropiedadesDeCampo) {
  if (campo.tipo !== "texto" && campo.tipo !== "busqueda") return null;
  const busqueda = campo.tipo === "busqueda";
  return (
    <Contenedor>
      <Etiqueta htmlFor={id} campo={campo} />
      <input
        id={id}
        type="text"
        {...(busqueda
          ? { role: "searchbox", inputMode: "search" as const, enterKeyHint: "search" as const }
          : {})}
        className={CONTROL}
        maxLength={campo.longitudMaxima}
        autoComplete={campo.autocompletar}
        autoCapitalize="off"
        spellCheck={false}
        value={typeof valor === "string" ? valor : ""}
        onChange={(e) => alCambiar(e.target.value)}
        {...atributos(id, campo, errores)}
      />
      <Mensajes id={id} campo={campo} errores={errores} />
    </Contenedor>
  );
}

export function CampoDeTextoLargo({ campo, id, valor, alCambiar, errores }: PropiedadesDeCampo) {
  if (campo.tipo !== "texto_largo") return null;
  return (
    <Contenedor>
      <Etiqueta htmlFor={id} campo={campo} />
      <textarea
        id={id}
        rows={4}
        className={CONTROL}
        maxLength={campo.longitudMaxima}
        autoComplete="off"
        value={typeof valor === "string" ? valor : ""}
        onChange={(e) => alCambiar(e.target.value)}
        {...atributos(id, campo, errores)}
      />
      <Mensajes id={id} campo={campo} errores={errores} />
    </Contenedor>
  );
}

export function CampoDeSeleccion({ campo, id, valor, alCambiar, errores }: PropiedadesDeCampo) {
  if (campo.tipo !== "seleccion") return null;
  return (
    <Contenedor>
      <Etiqueta htmlFor={id} campo={campo} />
      <select
        id={id}
        className={CONTROL}
        value={typeof valor === "string" ? valor : ""}
        onChange={(e) => alCambiar(e.target.value)}
        {...atributos(id, campo, errores)}
      >
        <option value="">{TEXTOS.formulario.elegirOpcion}</option>
        {campo.opciones.map((o) => (
          <option key={o.valor} value={o.valor}>
            {o.etiqueta}
          </option>
        ))}
      </select>
      <Mensajes id={id} campo={campo} errores={errores} />
    </Contenedor>
  );
}

export function CasillaDeVerificacion({
  campo,
  id,
  valor,
  alCambiar,
  errores,
}: PropiedadesDeCampo) {
  if (campo.tipo !== "casilla") return null;
  return (
    <Contenedor>
      <div className="flex items-start gap-3">
        <input
          id={id}
          type="checkbox"
          className="mt-1 size-6 shrink-0 accent-acento"
          checked={valor === true}
          onChange={(e) => alCambiar(e.target.checked)}
          {...atributos(id, campo, errores)}
        />
        <Etiqueta htmlFor={id} campo={campo} />
      </div>
      <Mensajes id={id} campo={campo} errores={errores} />
    </Contenedor>
  );
}

export function GrupoDeOpciones({ campo, id, valor, alCambiar, errores }: PropiedadesDeCampo) {
  if (campo.tipo !== "grupo") return null;
  const atrs = atributos(id, campo, errores);
  return (
    <fieldset role="radiogroup" className="flex min-w-0 flex-col gap-2 border-0 p-0" {...atrs}>
      <Etiqueta campo={campo} como="legend" />
      <div className="flex flex-col gap-2">
        {campo.opciones.map((o, i) => (
          <div key={o.valor} className="flex items-start gap-3">
            <input
              id={`${id}-opcion-${i}`}
              type="radio"
              name={id}
              value={o.valor}
              className="mt-1 size-6 shrink-0 accent-acento"
              checked={valor === o.valor}
              onChange={() => alCambiar(o.valor)}
            />
            <label htmlFor={`${id}-opcion-${i}`} className="text-cuerpo text-texto">
              {o.etiqueta}
            </label>
          </div>
        ))}
      </div>
      <Mensajes id={id} campo={campo} errores={errores} />
    </fieldset>
  );
}

/** El campo que corresponde a la definición leída. */
export function CampoDeFormulario(propiedades: PropiedadesDeCampo) {
  switch (propiedades.campo.tipo) {
    case "texto":
    case "busqueda":
      return <CampoDeTexto {...propiedades} />;
    case "texto_largo":
      return <CampoDeTextoLargo {...propiedades} />;
    case "seleccion":
      return <CampoDeSeleccion {...propiedades} />;
    case "casilla":
      return <CasillaDeVerificacion {...propiedades} />;
    case "grupo":
      return <GrupoDeOpciones {...propiedades} />;
  }
}
