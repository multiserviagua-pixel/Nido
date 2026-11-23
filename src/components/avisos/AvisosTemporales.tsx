"use client";

// `AvisosTemporales` (diseño 020, «Diálogo, cajón y avisos», fila `AvisosTemporales`, y «Avisos:
// componente propio (enmienda 1)»; REQ-021, REQ-042, REQ-072; CA-015). Sin librería, sobre
// `Anunciador`. Decisiones, todas del diseño:
//
// - Anuncio: lo hace `useAvisos().avisar` con `anunciar()`, una vez y en orden. La región visible
//   («Avisos», una `ol`) NO es región viva, para no leer cada texto dos veces.
// - Nunca mueve el foco al aparecer: ni `autoFocus`, ni `tabIndex`, ni `focus()` fuera del cierre.
//   «Cerrar aviso» está en el orden normal de tabulación. Sin atajos propios.
// - Pausa sin carrera: puntero y foco son manejadores de React en el propio aviso (nunca
//   `addEventListener` en un efecto). Además, al vencer el plazo se mira dónde están de verdad el
//   foco y el puntero antes de retirar (`decidirAlVencer`). Al salir los dos, el plazo empieza
//   entero (8 s).
// - Cierre: «Cerrar aviso» con Intro o Espacio (botón nativo) y Escape solo con el foco dentro del
//   aviso. Si el foco estaba en el aviso que se cierra, pasa a «Cerrar aviso» del siguiente (si no
//   hay siguiente, al anterior); si no queda ninguno, vuelve al elemento que lo tenía antes de
//   entrar en la región y, si ya no existe, al contenido principal.
// - Los avisos se apilan sin solaparse en una región fija que mide como mucho el 40 % del alto de
//   la ventana y se desplaza por dentro. Mientras haya avisos, `<html>` lleva
//   `data-avisos-abiertos` y `base.css` reserva ese alto (`scroll-padding-bottom` y relleno) para
//   que la región no tape el foco.
// - Sin avisos no pinta nada. El texto sale de `TEXTOS` por su clave: no hay texto libre ni avisos
//   de error (el tipo no los admite).
import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type FocusEvent,
  type KeyboardEvent,
} from "react";
import { IconoCerrar, IconoInformacion } from "../iconos";
import { TEXTOS } from "../textos";
import {
  ID_DE_RESPALDO_DEL_FOCO,
  conFoco,
  conPuntero,
  decidirAlVencer,
  estaPausado,
  iniciarPlazo,
  milisegundosHastaVencer,
  textoDeAviso,
  type AvisoTemporal,
} from "./logica";

/** Atributo de `<html>` mientras hay avisos abiertos (lo lee `base.css`). */
const MARCA_DE_AVISOS = "data-avisos-abiertos";

export type PropiedadesDeAvisos = {
  readonly avisos: readonly AvisoTemporal[];
  readonly alCerrar: (id: number) => void;
};

export function AvisosTemporales({ avisos, alCerrar }: PropiedadesDeAvisos) {
  const region = useRef<HTMLElement>(null);
  /** El elemento que tenía el foco justo antes de que entrara en la región. */
  const anterior = useRef<HTMLElement | null>(null);
  /** A dónde lleva el foco el cierre en curso, aplicado cuando el DOM ya cambió. */
  const pendiente = useRef<{ id: number } | "volver" | null>(null);
  /** Mientras el propio cierre mueve el foco dentro de la región, no es una «entrada» nueva. */
  const moviendo = useRef(false);
  const hay = avisos.length > 0;

  useEffect(() => {
    if (!hay) return;
    const raiz = document.documentElement;
    raiz.setAttribute(MARCA_DE_AVISOS, "");
    return () => raiz.removeAttribute(MARCA_DE_AVISOS);
  }, [hay]);

  useLayoutEffect(() => {
    const destino = pendiente.current;
    if (destino === null) return;
    pendiente.current = null;
    if (destino !== "volver") {
      moviendo.current = true;
      region.current?.querySelector<HTMLElement>(`[data-aviso-id="${destino.id}"] button`)?.focus();
      moviendo.current = false;
      return;
    }
    const previo = anterior.current;
    anterior.current = null;
    if (previo !== null && previo.isConnected) previo.focus();
    else document.getElementById(ID_DE_RESPALDO_DEL_FOCO)?.focus();
  }, [avisos]);

  const cerrar = (id: number): void => {
    const lista = avisos;
    const posicion = lista.findIndex((a) => a.id === id);
    if (posicion < 0) return;
    const items = region.current?.querySelectorAll<HTMLElement>("li[data-aviso]");
    const item = items?.[posicion];
    const focoDentro = item !== undefined && item.contains(document.activeElement);
    if (focoDentro) {
      const otro = lista[posicion + 1] ?? lista[posicion - 1];
      pendiente.current = otro === undefined ? "volver" : { id: otro.id };
    }
    alCerrar(id);
  };

  const alEntrarElFoco = (evento: FocusEvent<HTMLElement>): void => {
    if (moviendo.current) return;
    const venia = evento.relatedTarget;
    if (venia instanceof Node && evento.currentTarget.contains(venia)) return;
    anterior.current = venia instanceof HTMLElement ? venia : null;
  };

  if (!hay) return null;
  return (
    <section
      ref={region}
      aria-label={TEXTOS.avisos.region}
      onFocus={alEntrarElFoco}
      className="fixed inset-x-4 bottom-4 z-40 max-h-2/5 overflow-y-auto md:left-auto md:w-1/3"
    >
      <ol className="flex flex-col gap-2 p-1">
        {avisos.map((aviso) => (
          <AvisoDeLista key={aviso.id} aviso={aviso} alCerrar={cerrar} />
        ))}
      </ol>
    </section>
  );
}

function AvisoDeLista({
  aviso,
  alCerrar,
}: {
  aviso: AvisoTemporal;
  alCerrar: (id: number) => void;
}) {
  const item = useRef<HTMLLIElement>(null);
  const [plazo, fijarPlazo] = useState(() => iniciarPlazo(Date.now()));
  const pausado = estaPausado(plazo);
  const { id } = aviso;

  useEffect(() => {
    if (pausado) return;
    const espera = milisegundosHastaVencer(plazo, Date.now());
    const temporizador = setTimeout(() => {
      const el = item.current;
      const ahora = Date.now();
      const veredicto = decidirAlVencer(plazo, ahora, {
        focoDentro: el !== null && el.contains(document.activeElement),
        punteroEncima: el !== null && el.matches(":hover"),
      });
      if (veredicto === "retirar") alCerrar(id);
      else if (veredicto === "pausar") {
        // El foco o el puntero ya estaban dentro sin que lo supiéramos: se pausa de verdad.
        fijarPlazo((p) => conFoco(p, el !== null && el.contains(document.activeElement), ahora));
        fijarPlazo((p) => conPuntero(p, el !== null && el.matches(":hover"), ahora));
      } else fijarPlazo((p) => ({ ...p }));
    }, espera);
    return () => clearTimeout(temporizador);
  }, [plazo, pausado, alCerrar, id]);

  const alSalirElFoco = (evento: FocusEvent<HTMLLIElement>): void => {
    const destino = evento.relatedTarget;
    if (destino instanceof Node && evento.currentTarget.contains(destino)) return;
    fijarPlazo((p) => conFoco(p, false, Date.now()));
  };
  const alPulsarTecla = (evento: KeyboardEvent<HTMLLIElement>): void => {
    if (evento.key !== "Escape") return;
    evento.preventDefault();
    alCerrar(id);
  };

  return (
    <li
      ref={item}
      data-aviso=""
      data-aviso-id={id}
      onPointerEnter={() => fijarPlazo((p) => conPuntero(p, true, Date.now()))}
      onPointerLeave={() => fijarPlazo((p) => conPuntero(p, false, Date.now()))}
      onFocus={() => fijarPlazo((p) => conFoco(p, true, Date.now()))}
      onBlur={alSalirElFoco}
      onKeyDown={alPulsarTecla}
      className="flex items-start gap-3 rounded-medio border border-borde-control bg-superficie p-3 text-texto shadow-elevada"
    >
      <span className="inline-flex shrink-0 py-1 text-texto-secundario">
        <IconoInformacion tamano={20} />
      </span>
      <span data-aviso-texto="" className="min-w-0 flex-1 break-words py-1">
        {textoDeAviso(aviso.clave)}
      </span>
      <button
        type="button"
        aria-label={TEXTOS.avisos.cerrar}
        onClick={() => alCerrar(id)}
        className="inline-flex min-h-10 min-w-10 shrink-0 items-center justify-center rounded-medio border border-borde-control text-texto"
      >
        <IconoCerrar tamano={20} />
      </button>
    </li>
  );
}
