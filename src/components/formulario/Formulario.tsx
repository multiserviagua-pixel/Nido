"use client";

// `Formulario` (diseño 020, «Componentes base», fila `Formulario y campos`, y «Acciones que cambian
// algo»; REQ-019, REQ-020, REQ-057, REQ-073, REQ-074, REQ-078, REQ-080; CA-014, CA-017, CA-045;
// reglas V-3 y V-6). Reúne los campos de `campos.tsx`, valida y envía con `useAccion`.
//
// - `noValidate`: la validación y sus mensajes son de la aplicación, en español (nunca los del
//   navegador). Sin `required` nativo; el control dice `aria-required`.
// - Al enviar con errores, el foco va al primer campo con error (ya con su error enlazado) y se
//   anuncia cuántos hay. Un resumen visible repite el número. Lo escrito no se vacía nunca: ni con
//   errores, ni con un rechazo, ni con la conexión perdida, ni tras `hecha`.
// - Lo escrito vive solo en el estado del formulario (memoria): no va a la dirección ni a ningún
//   almacenamiento, y los controles no llevan `name` ni el formulario `action`, de modo que ni un
//   envío nativo (sin JavaScript) pone nada en la dirección (regla V-3, `method="post"`).
// - Un error de campo del servidor llega como par `{campo, codigo}` de las listas que declara el
//   formulario (`leerResultadoAccion`); el texto sale de `TEXTOS`. Un campo o un código que no se
//   conocen son un error general con texto fijo (regla V-6).
// - Cuatro resultados de `useAccion`: `hecha` (mensaje fijo, lo escrito se conserva), `rechazada`
//   (no se cambió nada; errores junto a sus campos y el foco al primero), `no_permitida` e
//   `incierta` (no se sabe si se aplicó; «Comprobar estado», sin reintento solo). El mensaje se
//   anuncia una vez por la región cortés; lo visible no es región viva.
// - Los campos se leen una vez al montar: la vista los declara en su código y no cambian.
import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { Boton } from "../acciones/Boton";
import { useAccion } from "../acciones/useAccion";
import { IconoError } from "../iconos/IconoError";
import { anunciar } from "../texto/anuncios";
import { TEXTOS, type TextoFijo } from "../textos";
import { CampoDeFormulario, idDelControl } from "./campos";
import {
  leerCampos,
  leerValor,
  presentarResultadoDeFormulario,
  repartirErrores,
  resumenDeErrores,
  validarCampos,
  valoresIniciales,
  type CampoLeido,
  type CodigoDeError,
  type DefinicionDeCampo,
  type MotivoDeRechazo,
  type ValorDeCampo,
  type ValoresDeFormulario,
} from "./logica";

export type PropiedadesDeFormulario = {
  /** Nombre accesible del formulario (texto fijo). */
  readonly nombre: TextoFijo;
  readonly campos: readonly DefinicionDeCampo[];
  /** Verbo con su objeto («Guardar ficha»), nunca «Enviar». */
  readonly textoEnviar: TextoFijo;
  /** Lo que dice el botón mientras se envía («Guardando…»). */
  readonly textoEnCurso: TextoFijo;
  /** Códigos de error de campo que el servidor puede devolver; cualquier otro es un error general. */
  readonly codigosDelServidor?: readonly CodigoDeError[];
  /** Motivos de rechazo que el servidor puede dar; cualquier otro es `incierta`. */
  readonly motivos?: readonly MotivoDeRechazo[];
  /** Hace el envío con lo escrito y devuelve `{estado?, cuerpo?}` o una promesa de ello. */
  readonly ejecutar: (valores: ValoresDeFormulario) => unknown;
  /** Hace que la vista relea el estado real. */
  readonly alReleer?: () => void;
  /** Solo para la muestra: pinta el formulario como si ya se hubiera intentado enviar vacío. */
  readonly intentadoAlCargar?: boolean;
};

const SIN_CORREGIR: readonly string[] = Object.freeze([]);

export function Formulario({
  nombre,
  campos: definiciones,
  textoEnviar,
  textoEnCurso,
  codigosDelServidor = [],
  motivos = [],
  ejecutar,
  alReleer,
  intentadoAlCargar = false,
}: PropiedadesDeFormulario) {
  const base = useId();
  const [campos] = useState<readonly CampoLeido[]>(() => leerCampos(definiciones));
  const [valores, fijarValores] = useState<ValoresDeFormulario>(() => valoresIniciales(campos));
  const valoresRef = useRef<ValoresDeFormulario>(valores);
  const [intentado, fijarIntentado] = useState(intentadoAlCargar);
  // Campos que se han tocado desde el último resultado: su error del servidor ya no vale.
  const [corregidos, fijarCorregidos] = useState<readonly string[]>(SIN_CORREGIR);
  const [foco, fijarFoco] = useState<{ readonly clave: string } | null>(null);
  const envio = useAccion(() => ejecutar(Object.freeze({ ...valoresRef.current })), {
    alReleer,
    lectura: { motivos, campos: campos.map((c) => c.clave), codigos: codigosDelServidor },
  });
  const { lectura, restablecer } = envio;

  const idDe = (c: CampoLeido): string => `${base}-${c.clave}`;
  const erroresLocales = intentado ? validarCampos(campos, valores) : [];
  const delServidor =
    lectura !== null && lectura.resultado === "rechazada"
      ? repartirErrores(lectura.errores, campos)
      : { porCampo: Object.create(null) as Record<string, readonly CodigoDeError[]>, generales: 0 };
  const codigosDe = (clave: string): readonly CodigoDeError[] => {
    const locales = erroresLocales.filter((e) => e.campo === clave).map((e) => e.codigo);
    const remotos = corregidos.includes(clave) ? [] : (delServidor.porCampo[clave] ?? []);
    return [...new Set([...locales, ...remotos])];
  };
  const conError = campos.filter((c) => codigosDe(c.clave).length > 0);
  const vista = presentarResultadoDeFormulario(lectura, delServidor.generales);
  const mensaje = vista.mensaje;

  // Un anuncio por resultado (entre dos envíos el mensaje vuelve a `null`).
  useEffect(() => {
    if (mensaje !== null) anunciar(mensaje);
  }, [mensaje]);

  // El foco va al primer campo con error, ya pintado con su `aria-describedby`.
  useEffect(() => {
    if (foco === null) return;
    const campo = campos.find((c) => c.clave === foco.clave);
    if (campo !== undefined)
      document.getElementById(idDelControl(campo, `${base}-${campo.clave}`))?.focus();
  }, [foco, campos, base]);
  // Un rechazo con errores de campo lleva el foco al primero (en el orden de los campos).
  useEffect(() => {
    if (lectura === null || lectura.resultado !== "rechazada") return;
    const reparto = repartirErrores(lectura.errores, campos);
    const primero = campos.find((c) => (reparto.porCampo[c.clave]?.length ?? 0) > 0);
    if (primero !== undefined) {
      document.getElementById(idDelControl(primero, `${base}-${primero.clave}`))?.focus();
    }
  }, [lectura, campos, base]);

  const cambiar = (campo: CampoLeido, bruto: ValorDeCampo): void => {
    const siguiente = { ...valoresRef.current, [campo.clave]: leerValor(campo, bruto) };
    valoresRef.current = siguiente;
    fijarValores(siguiente);
    fijarCorregidos((c) => (c.includes(campo.clave) ? c : [...c, campo.clave]));
    // Un éxito ya dicho no debe quedarse junto a un texto nuevo.
    if (lectura !== null && lectura.resultado === "hecha") restablecer();
  };

  const alEnviar = (evento: FormEvent<HTMLFormElement>): void => {
    evento.preventDefault();
    if (envio.enCurso) return;
    fijarIntentado(true);
    const errores = validarCampos(campos, valoresRef.current);
    const primero = errores[0];
    if (primero !== undefined) {
      fijarFoco({ clave: primero.campo });
      anunciar(resumenDeErrores(new Set(errores.map((e) => e.campo)).size));
      return;
    }
    fijarCorregidos(SIN_CORREGIR);
    envio.lanzar();
  };

  const resumen = conError.length > 0 ? resumenDeErrores(conError.length) : "";

  return (
    <form
      noValidate
      method="post"
      aria-label={nombre}
      onSubmit={alEnviar}
      className="flex min-w-0 max-w-full flex-col gap-4 sm:max-w-xl"
    >
      {campos.some((c) => c.obligatorio) ? (
        <p className="text-cuerpo-menor text-texto-secundario">{TEXTOS.formulario.leyenda}</p>
      ) : null}
      {resumen === "" ? null : (
        <p
          data-resumen-errores=""
          className="flex items-start gap-2 text-cuerpo font-medio text-error"
        >
          <span className="mt-1 inline-flex shrink-0">
            <IconoError tamano={20} />
          </span>
          <span className="min-w-0">{resumen}</span>
        </p>
      )}
      {campos.map((campo) => (
        <CampoDeFormulario
          key={campo.clave}
          campo={campo}
          id={idDe(campo)}
          valor={Object.hasOwn(valores, campo.clave) ? (valores[campo.clave] ?? "") : ""}
          alCambiar={(v) => cambiar(campo, v)}
          errores={codigosDe(campo.clave).map((c) => TEXTOS.formulario.errores[c])}
        />
      ))}
      {mensaje === null ? null : (
        <p
          data-resultado={envio.resultado ?? undefined}
          className="max-w-full rounded-medio border border-borde-control p-3 text-cuerpo-menor text-texto wrap-anywhere"
        >
          {mensaje}
        </p>
      )}
      <div className="flex flex-wrap gap-3">
        <Boton
          type="submit"
          variante="primario"
          texto={textoEnviar}
          textoEnCurso={textoEnCurso}
          enCurso={envio.enCurso}
        />
        {vista.ofrecerComprobar ? (
          <Boton texto={TEXTOS.acciones.resultado.comprobarEstado} onClick={() => alReleer?.()} />
        ) : null}
      </div>
    </form>
  );
}
