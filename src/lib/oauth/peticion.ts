// Solicitud de autorización `GET /oauth/autorizar` (T-110 b, 001; diseño §Servidor de autorización y
// §Pantalla de activación; REQ-003, REQ-005; RD-006, RD-039, RD-040; art. 3 y 7). Todo lo recibido es un dato.
//
// Pasos (cada fallo responde y termina; cierre en fallo):
//  0. Configuración del conector (C-1; 503 por el manejador) y solo GET (405).
//  1. Cliente: `client_id` único y acotado. `dcr_…` se lee de la base; cualquier otro valor solo vale si es
//     IGUAL a una URL de la lista constante de CIMD (vacía hasta V-6: ninguna petición saliente).
//  2. `redirect_uri` igual a uno de los dos callbacks fijos Y registrado para ese cliente. Y `state` (obligatorio) de ASCII
//     imprimible de hasta 512. Si algo de esto falla NO se redirige: pantalla `solicitud_no_valida` (400).
//  3. Ya con el destino de confianza: `response_type=code`, `code_challenge_method=S256` (`plain` y la
//     ausencia, que equivale a `plain`, se rechazan), desafío de 43 caracteres base64url y `resource` igual a
//     `<URL_PUBLICA>/api/mcp`. Si falla: redirección al callback fijo con `invalid_request` o
//     `invalid_target`, `state` e `iss` (RFC 9207). Cualquier otro `scope` se descarta.
//  4. `abrir_solicitud` con el HMAC de `state` y el de una cookie nueva `__Host-activacion` (256 bits del
//     generador criptográfico, distinta en cada solicitud): ni el valor de la cookie ni `state` se guardan.
//     `abierta` -> formulario (200) con el identificador de la solicitud en el campo oculto y la cookie;
//     `no_valida` -> pantalla `solicitud_no_valida`; `cerrada` -> `no_disponible` (estado fijo); un
//     resultado desconocido lo deniega `autorizacion.ts` (`almacen_no_disponible`, 503 por el manejador).
// La pantalla la construye `renderizarPantalla` (T-109): sus formatos están en su cabecera. Una excepción suya
// da 503 fijo sin registrar valores. Se registra ruta, resultado y código; nunca la consulta, ni `state`,
// ni la cookie, ni el cliente (art. 1 y 4).
import { randomBytes } from "node:crypto";
import {
  cargarConfiguracionConector,
  type ConfiguracionConector,
} from "../plataforma/configuracion";
import { analizarUrl } from "../plataforma/entrada";
import { ErrorDeAplicacion } from "../plataforma/errores";
import { registrar } from "../registro/registro";
import { autorizacionDelConector, type Autorizacion } from "../supabase/autorizacion";
import { asistenteDeCallback, type AsistenteCallback } from "./callbacks";
import { crearResolutorCimd } from "./cimd";
import { RE_CLIENT_ID_DCR } from "./clientes";
import { renderizarPantalla, type EstadoPantalla, type RespuestaPantalla } from "./pantalla";
import { derivarClaves, huellaLigadura } from "./secretos";

export const RUTA_AUTORIZAR = "/oauth/autorizar";
export const NOMBRE_COOKIE_ACTIVACION = "__Host-activacion";
export const DURACION_SOLICITUD_S = 600;
const MAXIMO_CONSULTA = 4096;
const MAXIMO_CLIENT_ID = 300;

// `state` opaco: ASCII imprimible, 0 a 512 (mismo criterio que la pantalla). Desafío S256: SHA-256 en
// base64url sin relleno = 43 caracteres (abrir_solicitud exige exactamente 43).
export const RE_STATE = /^[ -~]{0,512}$/;
const RE_DESAFIO = /^[A-Za-z0-9_-]{43}$/;
const PARAMETROS = [
  "client_id",
  "redirect_uri",
  "response_type",
  "code_challenge",
  "code_challenge_method",
  "resource",
  "state",
] as const;

export type CodigoErrorRedireccion = "invalid_request" | "invalid_target";

export type SolicitudAnalizada =
  | { readonly tipo: "no_valida" }
  | {
      readonly tipo: "cliente";
      readonly clientId: string;
      readonly redirectUri: string;
      readonly asistente: AsistenteCallback;
      readonly state: string;
      readonly desafio: string | null;
      readonly error: CodigoErrorRedireccion | null;
    };

// Primer paso, sin base de datos: extrae y valida la forma. `cliente` sin error aún no está autorizado:
// falta comprobar que el cliente existe y que el callback es el suyo.
export function analizarSolicitud(url: URL, urlPublica: string): SolicitudAnalizada {
  const consulta = url.search;
  if (consulta.length > MAXIMO_CONSULTA) return { tipo: "no_valida" };
  const valores = new Map<string, string>();
  for (const nombre of PARAMETROS) {
    const todos = url.searchParams.getAll(nombre);
    if (todos.length > 1) return { tipo: "no_valida" }; // parámetro repetido: ambiguo
    if (todos.length === 1) valores.set(nombre, todos[0]!);
  }
  const clientId = valores.get("client_id");
  if (clientId === undefined || clientId.length === 0 || clientId.length > MAXIMO_CLIENT_ID) {
    return { tipo: "no_valida" };
  }
  const redirectUri = valores.get("redirect_uri");
  const asistente = asistenteDeCallback(redirectUri);
  if (redirectUri === undefined || asistente === null) return { tipo: "no_valida" };
  // `state` es obligatorio: así el enlace de éxito y los errores siempre lo devuelven.
  const state = valores.get("state");
  if (state === undefined || !RE_STATE.test(state)) return { tipo: "no_valida" };

  let error: CodigoErrorRedireccion | null = null;
  const desafio = valores.get("code_challenge") ?? null;
  if (valores.get("response_type") !== "code") error = "invalid_request";
  else if (valores.get("code_challenge_method") !== "S256") error = "invalid_request";
  else if (desafio === null || !RE_DESAFIO.test(desafio)) error = "invalid_request";
  else if (valores.get("resource") !== `${urlPublica}/api/mcp`) error = "invalid_target";
  return {
    tipo: "cliente",
    clientId,
    redirectUri,
    asistente,
    state,
    desafio: error === null ? desafio : null,
    error,
  };
}

// Destino de un error de la solicitud: solo un callback fijo ya comprobado; `state` e `iss` codificados.
function redireccionDeError(
  s: Extract<SolicitudAnalizada, { tipo: "cliente" }>,
  codigo: CodigoErrorRedireccion,
  urlPublica: string,
): Response {
  const destino =
    `${s.redirectUri}?error=${codigo}` +
    `&state=${encodeURIComponent(s.state)}` +
    `&iss=${encodeURIComponent(urlPublica)}`;
  return new Response(null, {
    status: 302,
    headers: {
      Location: destino,
      "Cache-Control": "no-store",
      "Content-Security-Policy": CSP_SIN_PANTALLA,
    },
  });
}

// Las respuestas que no son la pantalla llevan igualmente `frame-ancestors 'none'`: la regla global de
// `next.config.ts` excluye esta ruta para no pisar la CSP de la pantalla.
export const CSP_SIN_PANTALLA = "frame-ancestors 'none'";

const FALLO_FIJO = (): Response =>
  new Response('{"estado":"error"}', {
    status: 503,
    headers: {
      "Cache-Control": "no-store",
      "Content-Type": "application/json",
      "Content-Security-Policy": CSP_SIN_PANTALLA,
    },
  });

// Una excepción de la pantalla no se propaga con su mensaje: 503 fijo, solo el código registrado.
function pantalla(estado: EstadoPantalla, cookie?: string): Response {
  let hecha: RespuestaPantalla;
  try {
    hecha = renderizarPantalla(estado);
  } catch {
    registrar("error", "error_no_controlado", RUTA_AUTORIZAR);
    return FALLO_FIJO();
  }
  const cabeceras = new Headers(hecha.cabeceras);
  if (cookie !== undefined && hecha.estado === 200) {
    cabeceras.append(
      "Set-Cookie",
      `${NOMBRE_COOKIE_ACTIVACION}=${cookie}; Path=/; Max-Age=${DURACION_SOLICITUD_S}; HttpOnly; Secure; SameSite=Strict`,
    );
  }
  return new Response(hecha.html, { status: hecha.estado, headers: cabeceras });
}

export interface DependenciasPeticion {
  /** Configuración validada del conector; lanza `configuracion_conector_invalida`. */
  readonly configuracion: () => ConfiguracionConector;
  /** Rol de gestión; se pide solo cuando hace falta. */
  readonly autorizacion: () => Autorizacion;
  /** Red de CIMD; solo se usa con una URL de la lista (vacía hasta V-6). */
  readonly fetch: typeof fetch;
  /** Lista de URLs de CIMD; solo se cambia en pruebas. */
  readonly urlsCimd?: readonly string[];
}

type Funcion = (peticion: Request) => Promise<Response>;

type Cliente =
  | { readonly estado: "ok"; readonly redirectUris: readonly string[] }
  | { readonly estado: "rechazado" }
  | { readonly estado: "no_disponible" };

async function resolverCliente(
  dependencias: DependenciasPeticion,
  autorizacion: Autorizacion,
  clientId: string,
): Promise<Cliente> {
  if (RE_CLIENT_ID_DCR.test(clientId)) {
    const leido = await autorizacion.leerCliente(clientId);
    if (leido.resultado === "conocido" && leido.origen === "dcr" && leido.vigente) {
      return { estado: "ok", redirectUris: leido.redirectUris };
    }
    return { estado: "rechazado" };
  }
  const resultado = await crearResolutorCimd({
    fetch: dependencias.fetch,
    almacen: autorizacion,
    urls: dependencias.urlsCimd,
  }).resolver(clientId);
  if (resultado.estado === "valido") return { estado: "ok", redirectUris: resultado.redirectUris };
  return resultado.estado === "no_disponible"
    ? { estado: "no_disponible" }
    : { estado: "rechazado" };
}

export function crearAutorizar(dependencias: DependenciasPeticion): Funcion {
  const noValida = (): Response => {
    registrar("aviso", "entrada_invalida", RUTA_AUTORIZAR);
    return pantalla({ tipo: "solicitud_no_valida" });
  };

  const tramitar = async (
    peticion: Request,
    configuracion: ConfiguracionConector,
  ): Promise<Response> => {
    const claves = derivarClaves(configuracion.secreto);

    // Solo la consulta: el servidor y la ruta pedidos no entran en ninguna decisión.
    let url: URL;
    try {
      url = analizarUrl(peticion.url);
    } catch {
      return noValida();
    }
    const solicitud = analizarSolicitud(url, configuracion.urlPublica);
    if (solicitud.tipo !== "cliente") return noValida();

    // 1 y 2. Cliente y callback registrado.
    const autorizacion = dependencias.autorizacion();
    const cliente = await resolverCliente(dependencias, autorizacion, solicitud.clientId);
    if (cliente.estado === "no_disponible") return pantalla({ tipo: "no_disponible" });
    if (cliente.estado !== "ok" || !cliente.redirectUris.includes(solicitud.redirectUri)) {
      return noValida();
    }

    // 3. Resto de la solicitud: error a un callback ya de confianza.
    if (solicitud.error !== null || solicitud.desafio === null) {
      registrar("aviso", "entrada_invalida", RUTA_AUTORIZAR);
      return redireccionDeError(
        solicitud,
        solicitud.error ?? "invalid_request",
        configuracion.urlPublica,
      );
    }

    // 4. Solicitud de 10 minutos ligada al HMAC de `state` y al de una cookie nueva.
    const cookie = randomBytes(32).toString("base64url");
    const abierta = await autorizacion.abrirSolicitud(
      solicitud.clientId,
      solicitud.redirectUri,
      solicitud.desafio,
      `${configuracion.urlPublica}/api/mcp`,
      huellaLigadura(claves, "state", solicitud.state),
      huellaLigadura(claves, "activacion", cookie),
    );
    switch (abierta.resultado) {
      case "abierta":
        return pantalla(
          {
            tipo: "formulario",
            asistente: solicitud.asistente,
            state: solicitud.state,
            solicitud: abierta.solicitud,
          },
          cookie,
        );
      case "no_valida":
        return noValida();
      default:
        // `cerrada` y cualquier valor que no se reconozca: estado fijo, sin detalle y sin cookie.
        registrar("aviso", "almacen_no_disponible", RUTA_AUTORIZAR);
        return pantalla({ tipo: "no_disponible" });
    }
  };

  return async (peticion) => {
    // 0. Configuración (su fallo sube al manejador) y método.
    const configuracion = dependencias.configuracion();
    if (peticion.method !== "GET") {
      registrar("aviso", "metodo_no_permitido", RUTA_AUTORIZAR);
      return new Response(null, {
        status: 405,
        headers: {
          "Cache-Control": "no-store",
          Allow: "GET, POST",
          "Content-Security-Policy": CSP_SIN_PANTALLA,
        },
      });
    }
    try {
      return await tramitar(peticion, configuracion);
    } catch (error) {
      // Almacén caído o respuesta inválida: pantalla fija (503, sin cookie); lo demás sube al manejador.
      if (!(error instanceof ErrorDeAplicacion) || error.codigo !== "almacen_no_disponible")
        return Promise.reject(error); // se relanza tal cual (la regla de lint solo admite lanzar ErrorDeAplicacion nuevos)
      registrar("aviso", "almacen_no_disponible", RUTA_AUTORIZAR);
      return pantalla({ tipo: "no_disponible" });
    }
  };
}

// El punto de producto: configuración de `configuracion.ts`, rol de gestión y red global (solo CIMD).
export const puntoAutorizar: Funcion = crearAutorizar({
  configuracion: cargarConfiguracionConector,
  autorizacion: autorizacionDelConector,
  fetch: (entrada, init) => fetch(entrada, init),
});
