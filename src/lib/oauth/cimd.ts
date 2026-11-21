// CIMD: documento de metadatos de cliente por URL (T-108 b, 001; diseño §Servidor de autorización,
// «CIMD»; REQ-003; art. 7). Lo descargado es un dato, nunca amplía callbacks ni permisos.
//
// - Antes de cualquier red, `client_id` debe ser IGUAL (cadena exacta) a una URL de una lista constante,
//   y la propia entrada de la lista debe ser una URL `https` sin puerto, usuario, consulta ni fragmento
//   y ya normalizada: una entrada que no lo cumple se ignora (cierre en fallo).
// - Lista vacía mientras no se compruebe la URL del documento de Claude (V-6): ninguna petición saliente.
// - Sin redirecciones, 3 s en total (petición y lectura), 16 384 bytes, sin cabeceras de credenciales.
// - `client_id` del documento idéntico a la URL y todos los `redirect_uris` entre los dos callbacks
//   (si no, rechazo entero); nada más se guarda; clientes siempre públicos.
// - Caché de 1 h en la base de datos (`leer_cliente`, `vigente`); la caducada nunca se usa.
// Nada de lo recibido se registra ni se devuelve.
import { analizarJson, analizarUrl } from "../plataforma/entrada";
import { esCallbackPermitido } from "./callbacks";

// URLs EXACTAS de documentos CIMD admitidas (más estricto que una lista de «hosts»: se compara la cadena
// completa). Vacía hasta V-6 (URL del documento de Claude comprobada).
export const URLS_CIMD: readonly string[] = [];

export const TIEMPO_CIMD_MS = 3000;
export const MAXIMO_DOCUMENTO_BYTES = 16384;
const MAXIMO_CALLBACKS = 10;

export type ClienteLeido =
  | { readonly resultado: "desconocido" }
  | {
      readonly resultado: "conocido";
      readonly origen: "cimd" | "dcr";
      readonly redirectUris: readonly string[];
      readonly vigente: boolean;
    };

export interface AlmacenCimd {
  leerCliente(clientId: string): Promise<ClienteLeido>;
  guardarClienteCimd(
    clientId: string,
    redirectUris: readonly string[],
  ): Promise<{ readonly resultado: "guardado" | "no_valido" | "cerrada" }>;
}

export type ResultadoCimd =
  | { readonly estado: "valido"; readonly redirectUris: readonly string[] }
  | { readonly estado: "rechazado" }
  | { readonly estado: "no_disponible" };

export interface DependenciasCimd {
  readonly urls?: readonly string[];
  readonly fetch: typeof fetch;
  readonly almacen: AlmacenCimd;
  /** Plazo total; por defecto 3 s. Solo se cambia en pruebas. */
  readonly tiempoMs?: number;
}

export interface ResolutorCimd {
  resolver(clientId: unknown): Promise<ResultadoCimd>;
}

// Una entrada de la lista solo vale si es una URL exacta aceptable: https, sin puerto, usuario, contraseña,
// consulta ni fragmento, y escrita en su forma normalizada (host en minúsculas, etc.).
function entradaAceptable(texto: string): boolean {
  try {
    const u = analizarUrl(texto);
    return (
      u.protocol === "https:" &&
      u.port === "" &&
      u.username === "" &&
      u.password === "" &&
      u.search === "" &&
      u.hash === "" &&
      u.href === texto
    );
  } catch {
    return false;
  }
}

const RECHAZADO: ResultadoCimd = { estado: "rechazado" };
const NO_DISPONIBLE: ResultadoCimd = { estado: "no_disponible" };

type Descarga =
  | { readonly tipo: "texto"; readonly texto: string }
  | { readonly tipo: "rechazo" }
  | { readonly tipo: "caida" };

// Lee el cuerpo con tope en bytes; pasado el tope corta la lectura.
async function leerCuerpo(respuesta: Response): Promise<Descarga> {
  if (respuesta.body === null) return { tipo: "texto", texto: "" };
  const lector = respuesta.body.getReader();
  const partes: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await lector.read();
    if (done) break;
    total += value.byteLength;
    if (total > MAXIMO_DOCUMENTO_BYTES) {
      await lector.cancel().catch(() => undefined);
      return { tipo: "rechazo" };
    }
    partes.push(value);
  }
  const bytes = new Uint8Array(total);
  let desplazamiento = 0;
  for (const parte of partes) {
    bytes.set(parte, desplazamiento);
    desplazamiento += parte.byteLength;
  }
  try {
    return { tipo: "texto", texto: new TextDecoder("utf-8", { fatal: true }).decode(bytes) };
  } catch {
    return { tipo: "rechazo" };
  }
}

async function descargar(
  fetchInyectado: typeof fetch,
  url: string,
  controlador: AbortController,
): Promise<Descarga> {
  try {
    const respuesta = await fetchInyectado(url, {
      method: "GET",
      redirect: "manual",
      headers: { Accept: "application/json" },
      credentials: "omit",
      cache: "no-store",
      signal: controlador.signal,
    });
    if (
      respuesta.type === "opaqueredirect" ||
      (respuesta.status >= 300 && respuesta.status < 400)
    ) {
      await respuesta.body?.cancel().catch(() => undefined);
      return { tipo: "rechazo" };
    }
    if (respuesta.status !== 200) {
      await respuesta.body?.cancel().catch(() => undefined);
      return { tipo: "caida" };
    }
    return await leerCuerpo(respuesta);
  } catch {
    return { tipo: "caida" };
  }
}

function esObjeto(v: unknown): v is Record<string, unknown> {
  return v !== null && typeof v === "object" && !Array.isArray(v);
}

// Documento válido: devuelve solo sus callbacks (todos de la lista); cualquier otra cosa, null.
function callbacksDelDocumento(texto: string, clientId: string): string[] | null {
  let documento: unknown;
  try {
    documento = analizarJson(texto);
  } catch {
    return null;
  }
  if (!esObjeto(documento) || documento.client_id !== clientId) return null;
  const metodo = documento.token_endpoint_auth_method;
  if (metodo !== undefined && metodo !== "none") return null;
  const uris = documento.redirect_uris;
  if (!Array.isArray(uris) || uris.length === 0 || uris.length > MAXIMO_CALLBACKS) return null;
  const limpias: string[] = [];
  for (const uri of uris as unknown[]) {
    if (typeof uri !== "string" || !esCallbackPermitido(uri)) return null;
    if (!limpias.includes(uri)) limpias.push(uri);
  }
  return limpias;
}

export function crearResolutorCimd(dependencias: DependenciasCimd): ResolutorCimd {
  const lista = (dependencias.urls ?? URLS_CIMD).filter(entradaAceptable);
  const tiempoMs = dependencias.tiempoMs ?? TIEMPO_CIMD_MS;
  const { almacen } = dependencias;

  return {
    async resolver(clientId) {
      // Antes de cualquier red (y de cualquier consulta): igualdad exacta con la lista.
      if (typeof clientId !== "string" || !lista.includes(clientId)) return RECHAZADO;

      const conocido = await almacen.leerCliente(clientId);
      if (conocido.resultado === "conocido") {
        if (conocido.origen !== "cimd") return RECHAZADO;
        if (conocido.vigente) return { estado: "valido", redirectUris: conocido.redirectUris };
      }

      // Plazo total: petición y lectura del cuerpo. Vencido: se aborta y no hay documento.
      const controlador = new AbortController();
      let temporizador: ReturnType<typeof setTimeout> | undefined;
      const vencido = new Promise<Descarga>((resolver) => {
        temporizador = setTimeout(() => {
          controlador.abort();
          resolver({ tipo: "caida" });
        }, tiempoMs);
      });
      let descarga: Descarga;
      try {
        descarga = await Promise.race([
          descargar(dependencias.fetch, clientId, controlador),
          vencido,
        ]);
      } finally {
        clearTimeout(temporizador);
      }
      if (descarga.tipo === "caida") return NO_DISPONIBLE;
      if (descarga.tipo === "rechazo") return RECHAZADO;

      const callbacks = callbacksDelDocumento(descarga.texto, clientId);
      if (callbacks === null) return RECHAZADO;
      const guardado = await almacen.guardarClienteCimd(clientId, callbacks);
      // Solo `guardado` es éxito; `no_valido`, `cerrada` o cualquier valor desconocido deniegan.
      if (guardado.resultado !== "guardado") return RECHAZADO;
      return { estado: "valido", redirectUris: callbacks };
    },
  };
}
