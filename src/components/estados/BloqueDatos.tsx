"use client";

// `BloqueDatos` (diseño 020, «Estados de cada vista» y «Cambio de periodo», punto 4; REQ-022,
// REQ-023, REQ-025 a REQ-028, REQ-057, REQ-069, REQ-077). Envuelve cada bloque que depende de una
// fuente y pinta, según una lista cerrada de cinco estados, el componente que toca: `Esqueleto`
// (`carga`), `EstadoVacio`, `EstadoError`, `EstadoSinPermiso` o el contenido (`datos`). Un estado
// que no es de la lista es un error, nunca datos (artículo 3).
//
// Carga con los plazos propios (lo normal): «Cargando» se anuncia una vez (lo hace `Esqueleto`), a
// los 10 s se ve y se anuncia, una vez, que tarda más de lo normal, y a los 30 s el bloque se pinta
// como error `tarda_demasiado` con una referencia `N-` y «Reintentar», se anuncia una vez por la
// región urgente y NO se cancela nada: la lectura sigue en curso y, si la respuesta llega después,
// la vista cambia `estado` y el error se retira sin que se vean a la vez el error y las cifras. «Reintentar» vuelve a pedir solo este
// bloque (`alReintentar`, de la vista) y reinicia los plazos; el foco, si estaba en el botón que
// desaparece, pasa al bloque. Quién descarta la respuesta de un envío anterior es la vista, con
// `reducirLectura` (`bloque.ts`).
//
// Sin conexión (REQ-060, `conexion.ts`): los datos que se ven llevan «Datos cargados el …» con la
// hora de Madrid en que llegaron, para que no se tomen por actuales. El bloque anota esa hora al
// pasar a `datos` y la pinta detrás del contenido (los hijos no cambian de sitio); no pide ni
// recarga nada por su cuenta, tenga o no conexión.
//
// Con `plazos="externos"` (la zona del cambio de periodo) los plazos, los anuncios y el foco los
// lleva quien lo usa; el bloque solo pinta. El error se anuncia una sola vez, también aquí
// (menor 26 c): lo anuncia quien detecta el fallo y nunca `EstadoError`, que no es región viva.
//
// Sin permiso es de la vista entera y se pinta exactamente como `EstadoSinPermiso` suelto, sin
// envoltorio ni más propiedad que la ruta del Resumen: no hay forma de pasarle el recurso. Los
// hijos solo se pintan con `datos`. Con `conservarHijos` viven siempre en el mismo elemento
// (`<div data-estado=…>`, mismo tipo y misma posición, que solo alterna `contents` y `hidden`),
// así que React no los desmonta al cambiar de estado y conservan su estado de cliente (orden y
// página de una tabla, por ejemplo); nunca en sin permiso. No pide datos ni guarda nada.
import { useEffect, useRef, useState, type ReactNode } from "react";
import { crearReferencia } from "../../lib/errores/referencia";
import { anunciar } from "../texto/anuncios";
import { TEXTOS } from "../textos";
import {
  PLAZO_DE_AVISO_MS,
  PLAZO_DE_ERROR_MS,
  anuncioDeError,
  faseDeCarga,
  resolverBloque,
  type EstadoDeBloque,
  type FaseDeCarga,
} from "./bloque";
import { textoDeHoraDeCarga, useMomentoDeCarga, useSinConexion } from "./conexion";
import { EstadoError } from "./EstadoError";
import { EstadoSinPermiso } from "./EstadoSinPermiso";
import { EstadoVacio, type PropiedadesDeEstadoVacio } from "./EstadoVacio";
import { Esqueleto } from "./Esqueleto";
import { leerMotivoDeError, type FormaDeEsqueleto, type MotivoDeError } from "./logica";

export type PropiedadesDeBloqueDatos = {
  readonly estado: EstadoDeBloque;
  /** Forma del esqueleto: la del contenido que va a llegar. */
  readonly forma: FormaDeEsqueleto;
  /** Textos fijos del estado vacío y, si procede, su acción. */
  readonly vacio?: Partial<PropiedadesDeEstadoVacio>;
  /** Motivo del error que da la vista (lista cerrada). */
  readonly motivo?: MotivoDeError;
  /** Referencia del error (`S-` o `N-`); si no cumple el formato, se descarta. */
  readonly referencia?: string | null;
  /** Vuelve a pedir solo este bloque. Sin ella, el error no tiene botón. */
  readonly alReintentar?: () => void;
  /** El reintento que pidió la vista está en curso. */
  readonly reintentando?: boolean;
  /** Ruta del Resumen del dashboard (solo para sin permiso). */
  readonly rutaDelResumen?: string;
  /** `propios` (por defecto): el bloque lleva los plazos de 10 s y 30 s, los anuncios y el foco.
   * `externos`: los lleva quien lo usa. */
  readonly plazos?: "propios" | "externos";
  /** Con plazos externos: la carga lleva más de 10 s. */
  readonly lenta?: boolean;
  /** Con plazos externos: `false` si quien lo usa anuncia la carga y el error. */
  readonly anuncia?: boolean;
  /** Los hijos quedan montados y ocultos fuera de `datos`. */
  readonly conservarHijos?: boolean;
  readonly children?: ReactNode;
};

const TITULO_GENERICO = TEXTOS.estadoVacio.generico.titulo;
const EXPLICACION_GENERICA = TEXTOS.estadoVacio.generico.explicacion;

export function BloqueDatos({
  estado,
  forma,
  vacio,
  motivo,
  referencia,
  alReintentar,
  reintentando = false,
  rutaDelResumen,
  plazos = "propios",
  lenta = false,
  anuncia = true,
  conservarHijos = false,
  children,
}: PropiedadesDeBloqueDatos) {
  const propios = plazos !== "externos";
  const [fase, fijarFase] = useState<FaseDeCarga>("normal");
  const [intento, fijarIntento] = useState(0);
  const [referenciaPropia, fijarReferenciaPropia] = useState<string | null>(null);
  const envoltorio = useRef<HTMLDivElement | null>(null);
  const eraError = useRef(false);
  const dichoError = useRef(false);
  // Solo un bloque que ha mostrado un error puede recibir el foco al retirarse el botón.
  const [huboError, fijarHuboError] = useState(false);

  const sinConexion = useSinConexion();

  const resuelto = resolverBloque(estado, propios ? fase : "normal");
  const mostrado = resuelto.estado;
  const cargadoEn = useMomentoDeCarga(mostrado);
  const enCarga = resolverBloque(estado, "normal").estado === "carga";

  // Plazos de la carga: 10 s avisa, 30 s da error. No cancelan nada.
  useEffect(() => {
    if (!propios || !enCarga) return undefined;
    const aviso = setTimeout(() => fijarFase(faseDeCarga(PLAZO_DE_AVISO_MS)), PLAZO_DE_AVISO_MS);
    const error = setTimeout(() => {
      let nueva: string | null = null;
      try {
        nueva = crearReferencia("navegador");
      } catch {
        // Sin generador no se crea referencia: el error se pinta sin ella.
      }
      fijarReferenciaPropia(nueva);
      fijarFase(faseDeCarga(PLAZO_DE_ERROR_MS));
    }, PLAZO_DE_ERROR_MS);
    return () => {
      clearTimeout(aviso);
      clearTimeout(error);
      fijarFase("normal");
      fijarReferenciaPropia(null);
    };
  }, [propios, enCarga, intento]);

  const motivoVisible: MotivoDeError =
    resuelto.motivo ?? (motivo === undefined ? "desconocido" : leerMotivoDeError(motivo));
  const referenciaVisible = resuelto.motivo === null ? (referencia ?? null) : referenciaPropia;

  // El error se anuncia una sola vez por entrada en `error`, por la región urgente.
  const hayError = mostrado === "error";
  if (hayError && !huboError) fijarHuboError(true);
  useEffect(() => {
    if (!hayError) {
      dichoError.current = false;
      return;
    }
    if (propios && anuncia !== false && !dichoError.current) {
      dichoError.current = true;
      anunciar(anuncioDeError(motivoVisible, referenciaVisible), "urgente");
    }
  }, [hayError, propios, anuncia, motivoVisible, referenciaVisible]);

  // Si el error se retira y el botón que tenía el foco desaparece, el foco pasa al bloque.
  useEffect(() => {
    if (propios && eraError.current && !hayError) {
      const activo = document.activeElement;
      if ((activo === null || activo === document.body) && envoltorio.current !== null) {
        envoltorio.current.focus({ preventScroll: true });
      }
    }
    eraError.current = hayError;
  }, [hayError, propios]);

  if (mostrado === "sin_permiso") {
    // Idéntico a `EstadoSinPermiso` suelto: ni envoltorio ni hijos ni nada del recurso.
    return <EstadoSinPermiso {...(rutaDelResumen === undefined ? {} : { rutaDelResumen })} />;
  }

  const reintentoPropio = resuelto.motivo !== null;
  const reintentar =
    typeof alReintentar === "function"
      ? () => {
          alReintentar();
          if (reintentoPropio) fijarIntento((n) => n + 1);
        }
      : undefined;

  const hijos = (
    <div
      {...(mostrado === "datos" ? { "data-estado": "datos" } : { "data-hijos-ocultos": "" })}
      className={mostrado === "datos" ? "contents" : "hidden"}
    >
      {children}
    </div>
  );

  return (
    <div
      ref={envoltorio}
      data-bloque=""
      {...(propios && (mostrado === "error" || huboError) ? { tabIndex: -1 } : {})}
      className="min-w-0"
    >
      {conservarHijos ? hijos : null}
      {mostrado === "carga" ? (
        <Esqueleto
          forma={forma}
          lenta={propios ? resuelto.lenta : lenta === true}
          anunciarCarga={propios ? true : anuncia !== false}
        />
      ) : mostrado === "vacio" ? (
        <EstadoVacio
          titulo={vacio?.titulo ?? TITULO_GENERICO}
          explicacion={vacio?.explicacion ?? EXPLICACION_GENERICA}
          {...(vacio?.accion === undefined ? {} : { accion: vacio.accion })}
        />
      ) : mostrado === "error" ? (
        <EstadoError
          motivo={motivoVisible}
          referencia={referenciaVisible}
          {...(reintentar === undefined ? {} : { alReintentar: reintentar })}
          reintentando={reintentando === true}
        />
      ) : conservarHijos ? null : (
        hijos
      )}
      {sinConexion && mostrado === "datos" && cargadoEn !== null ? (
        <p
          data-hora-de-carga=""
          className="mt-2 break-words text-cuerpo-menor text-texto-secundario"
        >
          {textoDeHoraDeCarga(cargadoEn)}
        </p>
      ) : null}
    </div>
  );
}
