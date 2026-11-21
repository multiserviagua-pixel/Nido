// Cola de anuncios para el lector de pantalla (diseño 020, «Armazón», `Anunciador`; REQ-042).
// Hay dos regiones, la cortés (espera a que el lector termine) y la urgente (interrumpe), y cada
// una tiene su propia cola para que dos anuncios seguidos se lean los dos y en orden.
// Las regiones las pinta `Anunciador` en el servidor, vacías, y esta cola solo les cambia el texto
// (`textContent`): así no hace falta un componente de cliente y los lectores ven un cambio de
// contenido en una región que ya estaba. React nunca les pone hijos, de modo que no se pisan.
// Para que un mismo texto dicho dos veces se vuelva a leer, la región se vacía un instante antes
// de recibirlo: los lectores solo anuncian un cambio de contenido.
// El texto es un dato: pasa por `textoPlano` y se escribe como texto, nunca como marcas.
import { textoPlano } from "../formato/texto-plano";

export type Urgencia = "cortes" | "urgente";

/** Instante con la región vacía antes de poner el texto. */
const VACIO_MS = 100;
/** Tiempo que el texto se queda puesto antes de pasar al siguiente de la cola. */
const MANTENER_MS = 400;

type Canal = {
  texto: string;
  cola: string[];
  ocupado: boolean;
  temporizador: ReturnType<typeof setTimeout> | undefined;
};

const canales: Record<Urgencia, Canal> = {
  cortes: { texto: "", cola: [], ocupado: false, temporizador: undefined },
  urgente: { texto: "", cola: [], ocupado: false, temporizador: undefined },
};

/** Marca con la que `Anunciador` identifica cada región. */
export const ATRIBUTO_DE_REGION = "data-anunciador";

function escribir(urgencia: Urgencia, texto: string): void {
  canales[urgencia].texto = texto;
  if (typeof document === "undefined") return;
  const region = document.querySelector(`[${ATRIBUTO_DE_REGION}="${urgencia}"]`);
  if (region !== null) region.textContent = texto;
}

function procesar(urgencia: Urgencia): void {
  const canal = canales[urgencia];
  const siguiente = canal.cola.shift();
  if (siguiente === undefined) {
    canal.ocupado = false;
    if (canal.texto !== "") escribir(urgencia, "");
    return;
  }
  canal.ocupado = true;
  if (canal.texto !== "") escribir(urgencia, "");
  canal.temporizador = setTimeout(() => {
    escribir(urgencia, siguiente);
    canal.temporizador = setTimeout(() => procesar(urgencia), MANTENER_MS);
  }, VACIO_MS);
}

/** Anuncia un texto. Una cadena vacía no anuncia nada. */
export function anunciar(texto: string, urgencia: Urgencia = "cortes"): void {
  const limpio = textoPlano(texto).trim();
  if (limpio === "") return;
  const canal = canales[urgencia];
  canal.cola.push(limpio);
  if (!canal.ocupado) procesar(urgencia);
}

export function leerAnuncio(urgencia: Urgencia): string {
  return canales[urgencia].texto;
}

/** Solo para las pruebas: deja la cola como al arrancar. */
export function reiniciarAnunciosParaPruebas(): void {
  for (const canal of Object.values(canales)) {
    if (canal.temporizador !== undefined) clearTimeout(canal.temporizador);
    canal.texto = "";
    canal.cola = [];
    canal.ocupado = false;
    canal.temporizador = undefined;
  }
}
