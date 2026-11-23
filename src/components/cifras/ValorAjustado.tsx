"use client";

// Valor de una `TarjetaCifra` que baja de paso de la escala hasta que cabe (REQ-081, CA-050).
// Lo único con estado de la tarjeta. Decisión de diseño (T-010 (e)): ni `style` ni clases de valor
// arbitrario (PRUEBA-005) ni contenedor con container queries (el tema de Tailwind se vacía con
// `--*: initial` y solo deja los tamaños de contenedor `menu-ancho` y `contenido-maximo`; no hay
// umbrales por paso), así que:
//  1. se pinta ya en un paso que cabe en el caso más estrecho, según los caracteres (`pasoInicial`):
//     sin JavaScript y antes de medir, el valor cabe en una ventana de 320 px;
//  2. con JavaScript se mide en el navegador (antes de pintar) el ancho natural del valor y el de la
//     tarjeta, y se elige el mayor paso que cabe (`elegirPaso`); un `ResizeObserver` repite la
//     medida cuando cambia el ancho (zum, giro, espaciado de texto) y, solo entonces, puede subir;
//  3. el valor siempre puede partirse en varias líneas (`wrap-anywhere`): hasta que el navegador mide
//     (un fotograma tras un cambio de ancho, o siempre sin JavaScript) y si ni el último paso cabe,
//     se parte, nunca se desborda, se corta ni se abrevia.
// El texto es siempre el mismo; solo cambia la clase del tamaño.
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { CLASE_DE_PASO, PASOS_DE_CIFRA, elegirPaso, leerTamanos, pasoInicial } from "./ajuste";

// Por defecto el valor puede partirse (nunca se desborda ni se corta, ni un fotograma antes de que
// el navegador mida ni sin JavaScript); para medir su ancho natural se le quita eso un instante.
const CLASES_PARTIBLE = "max-w-full whitespace-normal wrap-anywhere";

/** Ancho del valor sin partir: se le quita lo partible, se mide y se restaura antes de pintar. */
function medirAnchoNatural(v: HTMLElement): number {
  const partible = CLASES_PARTIBLE.split(" ");
  v.classList.remove(...partible);
  v.classList.add("whitespace-nowrap");
  const ancho = v.getBoundingClientRect().width;
  v.classList.remove("whitespace-nowrap");
  v.classList.add(...partible);
  return ancho;
}

/** Cambiar el `key` (el texto) reinicia el paso: el valor nuevo parte de su propio paso inicial. */
export function ValorAjustado({ id, texto }: { id: string; texto: string }) {
  const [paso, setPaso] = useState(() => pasoInicial(texto));
  const [revision, setRevision] = useState(0);
  const caja = useRef<HTMLDivElement>(null);
  const valor = useRef<HTMLSpanElement>(null);
  const anchoVisto = useRef<number | null>(null);

  useLayoutEffect(() => {
    const c = caja.current;
    const v = valor.current;
    if (c === null || v === null) return;
    const disponible = c.getBoundingClientRect().width;
    const cambio = anchoVisto.current === null || Math.abs(anchoVisto.current - disponible) >= 0.5;
    anchoVisto.current = disponible;
    const tamanos = leerTamanos((nombre) =>
      getComputedStyle(document.documentElement).getPropertyValue(nombre),
    );
    if (tamanos === null) return;
    const nuevo = elegirPaso({
      tamanos,
      actual: paso,
      natural: medirAnchoNatural(v),
      disponible,
      puedeSubir: cambio,
    });
    if (nuevo !== paso) setPaso(nuevo);
  }, [paso, revision]);

  useEffect(() => {
    const c = caja.current;
    const v = valor.current;
    if (c === null || v === null || typeof ResizeObserver === "undefined") return;
    const observador = new ResizeObserver(() => setRevision((n) => n + 1));
    observador.observe(c);
    observador.observe(v);
    return () => observador.disconnect();
  }, []);

  const nombre = PASOS_DE_CIFRA[paso] ?? PASOS_DE_CIFRA[0];
  return (
    <div ref={caja} className="min-w-0">
      <span
        ref={valor}
        id={id}
        data-cifra=""
        data-paso={nombre}
        className={`inline-block font-seminegrita text-texto ${CLASE_DE_PASO[nombre]} ${CLASES_PARTIBLE}`}
      >
        {texto}
      </span>
    </div>
  );
}
