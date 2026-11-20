// Fechas y horas en la hora de Madrid (diseño, «Formatos»). Funciones puras que valen igual en
// el servidor y en el navegador. No dependen de la localización ni de la zona del dispositivo:
// piden a `Intl.DateTimeFormat` solo las partes numéricas, con localización, zona, calendario y
// reloj fijos, y el texto del mes sale de la lista propia de aquí.
import { TEXTOS } from "../textos";

const MESES = [
  "ene",
  "feb",
  "mar",
  "abr",
  "may",
  "jun",
  "jul",
  "ago",
  "sep",
  "oct",
  "nov",
  "dic",
] as const;

const UNA_HORA = 3_600_000;
const SEPARADOR_DE_PERIODO = " – ";

// Una cadena solo vale si es un instante ISO 8601 completo, con zona: no se interpreta nada más.
const DIA_ISO = /^\d{4}-\d{2}-\d{2}$/;
const DOS_CIFRAS = /^\d{2}$/;
const FRACCION = /^\d{1,9}$/;
const DESPLAZAMIENTO = /^[+-]\d{2}:\d{2}$/;

function esHoraYMinuto(texto: string): boolean {
  const campos = texto.split(":");
  return (campos.length === 2 || campos.length === 3) && campos.every((c) => DOS_CIFRAS.test(c));
}

function esHoraIsoConZona(texto: string): boolean {
  let hora = texto;
  if (texto.endsWith("Z")) hora = texto.slice(0, -1);
  else if (DESPLAZAMIENTO.test(texto.slice(-6))) hora = texto.slice(0, -6);
  else return false;
  const [principal, fraccion, ...resto] = hora.split(".");
  return (
    resto.length === 0 &&
    esHoraYMinuto(principal ?? "") &&
    (fraccion === undefined || FRACCION.test(fraccion))
  );
}

const ANIO_MINIMO = 1000;
const ANIO_MAXIMO = 9999;

const esBisiesto = (a: number): boolean => (a % 4 === 0 && a % 100 !== 0) || a % 400 === 0;

// El día debe existir en el calendario: `2026-02-30` no se convierte en el 2 de marzo.
function esDiaDelCalendario(texto: string): boolean {
  if (!DIA_ISO.test(texto)) return false;
  const [a, m, d] = texto.split("-").map(Number) as [number, number, number];
  if (a < ANIO_MINIMO || a > ANIO_MAXIMO || m < 1 || m > 12 || d < 1) return false;
  const dias = [31, esBisiesto(a) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][m - 1] ?? 0;
  return d <= dias;
}

// Horas 00-23, minutos y segundos 00-59: `24:00` ni `10:61` se corrigen solos.
function esHoraDelReloj(texto: string): boolean {
  const principal = texto.replace(/(Z|[+-]\d{2}:\d{2})$/, "").split(".")[0] ?? "";
  const [h, m, s] = principal.split(":").map(Number) as [number, number, number | undefined];
  return h <= 23 && m <= 59 && (s === undefined || s <= 59);
}

function esIsoConZona(texto: string): boolean {
  const partes = texto.split("T");
  return (
    partes.length === 2 &&
    esDiaDelCalendario(partes[0] ?? "") &&
    esHoraIsoConZona(partes[1] ?? "") &&
    esHoraDelReloj(partes[1] ?? "")
  );
}

const PARTES = new Intl.DateTimeFormat("es-ES", {
  timeZone: "Europe/Madrid",
  calendar: "gregory",
  numberingSystem: "latn",
  hourCycle: "h23",
  year: "numeric",
  month: "numeric",
  day: "numeric",
  hour: "numeric",
  minute: "numeric",
});

type Partes = { anio: number; mes: number; dia: number; hora: number; minuto: number };

/** Milisegundos desde 1970 si el valor es un instante válido; `null` si no. */
function aMilisegundos(instante: unknown): number | null {
  let ms: number;
  if (instante instanceof Date) ms = instante.getTime();
  else if (typeof instante === "number") ms = instante;
  else if (typeof instante === "string") ms = esIsoConZona(instante) ? Date.parse(instante) : NaN;
  else return null;
  // Más allá de este límite `Intl` ya no puede representar el instante.
  return Number.isFinite(ms) && Math.abs(ms) <= 8_640_000_000_000_000 ? ms : null;
}

function partesDeMadrid(ms: number): Partes | null {
  let anio = NaN;
  let mes = NaN;
  let dia = NaN;
  let hora = NaN;
  let minuto = NaN;
  for (const parte of PARTES.formatToParts(ms)) {
    const n = Number(parte.value);
    if (parte.type === "year") anio = n;
    else if (parte.type === "month") mes = n;
    else if (parte.type === "day") dia = n;
    else if (parte.type === "hour") hora = n;
    else if (parte.type === "minute") minuto = n;
  }
  const todas = [anio, mes, dia, hora, minuto];
  if (!todas.every(Number.isInteger)) return null;
  // Años de cuatro cifras (REQ-047): fuera de ahí no hay formato fiable.
  if (anio < ANIO_MINIMO || anio > ANIO_MAXIMO) return null;
  return { anio, mes, dia, hora, minuto };
}

const mismoMomento = (a: Partes, b: Partes): boolean =>
  a.anio === b.anio &&
  a.mes === b.mes &&
  a.dia === b.dia &&
  a.hora === b.hora &&
  a.minuto === b.minuto;

const dos = (n: number): string => String(n).padStart(2, "0");

function textoDeFecha(p: Partes, conAnio: boolean): string {
  const mes = MESES[p.mes - 1];
  if (mes === undefined) return TEXTOS.formato.sinDatos;
  return conAnio ? `${p.dia} ${mes} ${p.anio}` : `${p.dia} ${mes}`;
}

/** `12 nov 2026, 08:04`. En la hora que se repite al volver al horario de invierno añade
 * «(hora de verano)» a la primera vez y «(hora de invierno)» a la segunda. */
export function formatearFechaHora(instante: unknown): string {
  const ms = aMilisegundos(instante);
  if (ms === null) return TEXTOS.formato.sinDatos;
  const p = partesDeMadrid(ms);
  if (p === null) return TEXTOS.formato.sinDatos;
  const base = `${textoDeFecha(p, true)}, ${dos(p.hora)}:${dos(p.minuto)}`;
  const antes = aMilisegundos(ms - UNA_HORA);
  const despues = aMilisegundos(ms + UNA_HORA);
  const pAntes = antes === null ? null : partesDeMadrid(antes);
  const pDespues = despues === null ? null : partesDeMadrid(despues);
  if (pDespues !== null && mismoMomento(p, pDespues)) {
    return `${base} (${TEXTOS.formato.horaDeVerano})`;
  }
  if (pAntes !== null && mismoMomento(p, pAntes)) {
    return `${base} (${TEXTOS.formato.horaDeInvierno})`;
  }
  return base;
}

/** `12 nov 2026`, con el día de Madrid. */
export function formatearFecha(instante: unknown): string {
  const ms = aMilisegundos(instante);
  const p = ms === null ? null : partesDeMadrid(ms);
  return p === null ? TEXTOS.formato.sinDatos : textoDeFecha(p, true);
}

/** Día de Madrid como `2026-11-12`, para agrupar por día. `null` si no es un instante válido. */
export function diaDeMadrid(instante: unknown): string | null {
  const ms = aMilisegundos(instante);
  const p = ms === null ? null : partesDeMadrid(ms);
  return p === null ? null : `${p.anio}-${dos(p.mes)}-${dos(p.dia)}`;
}

/** `14 oct – 12 nov 2026`. Si empieza y acaba el mismo día, solo ese día. Con el fin antes del
 * principio, o con un extremo que no es un instante, no inventa un periodo: «Sin datos». */
export function formatearPeriodo(desde: unknown, hasta: unknown): string {
  const a = aMilisegundos(desde);
  const b = aMilisegundos(hasta);
  if (a === null || b === null || b < a) return TEXTOS.formato.sinDatos;
  const pa = partesDeMadrid(a);
  const pb = partesDeMadrid(b);
  if (pa === null || pb === null) return TEXTOS.formato.sinDatos;
  if (pa.anio === pb.anio && pa.mes === pb.mes && pa.dia === pb.dia) {
    return textoDeFecha(pb, true);
  }
  const inicio = textoDeFecha(pa, pa.anio !== pb.anio);
  return `${inicio}${SEPARADOR_DE_PERIODO}${textoDeFecha(pb, true)}`;
}
