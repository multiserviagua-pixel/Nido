// Páginas de `TarjetaCifra` en la muestra (T-010 (e); CA-008, CA-039, CA-040, CA-050): cada variante
// con datos ficticios que llegan por propiedades (la muestra no llama a la red).
import type { ReactNode } from "react";
import { TarjetaCifra, type PropiedadesDeTarjetaCifra } from "@/components/cifras/TarjetaCifra";
import { TEXTOS } from "@/components/textos";
import { MarcoDeComponente } from "./marco";
import { TEXTOS_CIFRAS as T } from "./textos-cifras";

const E = TEXTOS.cifras.ejemplo;
const P = TEXTOS.cifras.comparacion.ultimos7Dias;

type Caso = { clave: string; pie: string; tarjeta: PropiedadesDeTarjetaCifra };

const comparar = (
  anterior: unknown,
  valoracion?: "favorable" | "desfavorable" | "neutra",
  anteriorCompleto = true,
): PropiedadesDeTarjetaCifra["comparacion"] => ({
  anterior,
  anteriorCompleto,
  periodo: P,
  valoracion,
});

const CASOS_VARIANTES: readonly Caso[] = [
  {
    clave: "positiva-favorable",
    pie: T.variantes.positivaFavorable,
    tarjeta: {
      etiqueta: E.correosRevisados,
      valor: 1234,
      comparacion: comparar(1100, "favorable"),
    },
  },
  {
    clave: "negativa-favorable",
    pie: T.variantes.negativaFavorable,
    tarjeta: { etiqueta: E.avisosAbiertos, valor: 8, comparacion: comparar(10, "favorable") },
  },
  {
    clave: "negativa-desfavorable",
    pie: T.variantes.negativaDesfavorable,
    tarjeta: {
      etiqueta: E.borradoresPreparados,
      valor: 90,
      comparacion: comparar(120, "desfavorable"),
    },
  },
  {
    clave: "positiva-desfavorable",
    pie: T.variantes.positivaDesfavorable,
    tarjeta: {
      etiqueta: E.respuestasPendientes,
      valor: 45,
      comparacion: comparar(30, "desfavorable"),
    },
  },
  {
    clave: "positiva-neutra",
    pie: T.variantes.positivaNeutra,
    tarjeta: { etiqueta: E.revisionesCompletas, valor: 52, comparacion: comparar(48) },
  },
  {
    clave: "nula",
    pie: T.variantes.nula,
    tarjeta: { etiqueta: E.correosRevisados, valor: 120, comparacion: comparar(120, "favorable") },
  },
  {
    clave: "anterior-cero",
    pie: T.variantes.anteriorCero,
    tarjeta: {
      etiqueta: E.borradoresPreparados,
      valor: 50,
      comparacion: comparar(0, "favorable"),
    },
  },
  {
    clave: "sin-comparacion",
    pie: T.variantes.sinComparacion,
    tarjeta: {
      etiqueta: E.correosRevisados,
      valor: 100,
      comparacion: comparar(90, "favorable", false),
    },
  },
  {
    clave: "sin-dato",
    pie: T.variantes.sinDato,
    tarjeta: { etiqueta: E.avisosAbiertos, valor: undefined, comparacion: comparar(10) },
  },
  {
    clave: "sin-variacion",
    pie: T.variantes.sinVariacion,
    tarjeta: { etiqueta: E.revisionesCompletas, valor: 1234 },
  },
];

const CASOS_LIMITE: readonly Caso[] = [
  { clave: "cero", pie: T.casosLimite.cero, tarjeta: { etiqueta: E.avisosAbiertos, valor: 0 } },
  {
    clave: "ausente",
    pie: T.casosLimite.ausente,
    tarjeta: { etiqueta: E.avisosAbiertos, valor: undefined },
  },
  { clave: "nulo", pie: T.casosLimite.nulo, tarjeta: { etiqueta: E.avisosAbiertos, valor: null } },
  {
    clave: "no-numerico",
    pie: T.casosLimite.noNumerico,
    tarjeta: { etiqueta: E.avisosAbiertos, valor: "12" },
  },
  {
    clave: "no-finito",
    pie: T.casosLimite.noFinito,
    tarjeta: { etiqueta: E.avisosAbiertos, valor: Number.POSITIVE_INFINITY },
  },
  {
    clave: "negativo",
    pie: T.casosLimite.negativo,
    tarjeta: { etiqueta: E.avisosAbiertos, valor: -5 },
  },
  {
    clave: "negativo-admitido",
    pie: T.casosLimite.negativoAdmitido,
    tarjeta: { etiqueta: E.avisosAbiertos, valor: -5, minimo: -100 },
  },
  {
    clave: "decimales",
    pie: T.casosLimite.decimales,
    tarjeta: { etiqueta: E.revisionesCompletas, valor: 28.4, decimales: 1 },
  },
  {
    clave: "cero-contra-cero",
    pie: T.casosLimite.ceroConAnteriorCero,
    tarjeta: { etiqueta: E.avisosAbiertos, valor: 0, comparacion: comparar(0) },
  },
];

const CASOS_GRANDES: readonly Caso[] = [
  {
    clave: "novecientos",
    pie: T.cifraGrande.novecientos,
    tarjeta: { etiqueta: E.correosRevisados, valor: 999_999_999 },
  },
  {
    clave: "doce-cifras",
    pie: T.cifraGrande.billones,
    tarjeta: { etiqueta: E.correosRevisados, valor: 999_999_999_999 },
  },
  {
    clave: "quince-cifras",
    pie: T.cifraGrande.maximo,
    tarjeta: { etiqueta: E.correosRevisados, valor: 999_999_999_999_999 },
  },
  {
    clave: "sin-paso",
    pie: T.cifraGrande.sinPaso,
    tarjeta: { etiqueta: E.correosRevisados, valor: 1e15 },
  },
];

const CASOS_ETIQUETA_LARGA: readonly Caso[] = [
  {
    clave: "etiqueta-larga",
    pie: T.tituloEtiquetaLarga,
    tarjeta: {
      etiqueta: E.etiquetaLarga,
      valor: 1234,
      comparacion: comparar(1100, "favorable"),
    },
  },
];

const POR_ESTADO: Readonly<Record<string, { titulo: string; casos: readonly Caso[] }>> = {
  variantes: { titulo: T.tituloVariantes, casos: CASOS_VARIANTES },
  "casos-limite": { titulo: T.tituloCasosLimite, casos: CASOS_LIMITE },
  "cifra-999999999": { titulo: T.tituloCifraGrande, casos: CASOS_GRANDES },
  "etiqueta-larga": { titulo: T.tituloEtiquetaLarga, casos: CASOS_ETIQUETA_LARGA },
};

export function VistaDeTarjetas({ titulo, estado }: { titulo: string; estado: string }): ReactNode {
  const contenido = Object.hasOwn(POR_ESTADO, estado) ? POR_ESTADO[estado] : undefined;
  if (contenido === undefined) return null;
  return (
    <MarcoDeComponente titulo={titulo}>
      <section aria-labelledby="tarjetas-titulo" className="flex flex-col gap-4">
        <h2 id="tarjetas-titulo">{contenido.titulo}</h2>
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {contenido.casos.map((caso) => (
            <li key={caso.clave} data-caso={caso.clave} className="flex min-w-0 flex-col gap-1">
              <TarjetaCifra {...caso.tarjeta} />
              <p className="text-pequeno text-texto-secundario">{caso.pie}</p>
            </li>
          ))}
        </ul>
      </section>
    </MarcoDeComponente>
  );
}
