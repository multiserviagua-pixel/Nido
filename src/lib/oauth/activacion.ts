// Activación `POST /oauth/autorizar` (T-110 c, 001; diseño §Pantalla de activación; REQ-004, REQ-005;
// A-01, A-02, A-21; art. 3 y 7). Todo lo recibido es un dato. Cada fallo responde y termina (cierre en fallo).
//
//  0. Configuración del conector (C-1; 503 por el manejador) y solo POST (405).
//  1. `Origin` IGUAL a `URL_PUBLICA` (ausente, `null` o ajeno: rechazo; no se lee el cuerpo ni se toca la base,
//     así que no cuenta intento). Es la defensa contra el envío desde otra página (A-21).
//  2. Origen para los intentos (`x-vercel-forwarded-for`; fijo en local): ausente fuera de local, 503 sin evaluar.
//  3. Cuerpo `application/x-www-form-urlencoded` de hasta 4096 bytes; campos `solicitud`, `asistente`, `state`
//     y `codigo`, cada uno una sola vez; lo demás se ignora sin leerse.
//  4. Cookie `__Host-activacion` presente una sola vez y con la forma que genera el servidor.
//     Hasta aquí, nada llega a la base y por tanto nada cuenta como intento.
//  5. `activar` (una transacción): comprueba el HMAC de la cookie y de `state` contra la solicitud vigente y
//     cuenta el fallo del código dentro de la función. El código tecleado se acota y se normaliza con
//     `codigo-activacion.ts` (`normalizarCodigo`); si no tiene forma de código se envía el HMAC de un valor que ningún código real
//     puede tener (cuenta como fallo, y así `codigo_no_valido` solo sale tras validar cookie y `state`).
//     `activada` -> «aceptado» con el código de autorización (256 bits, solo su HMAC va a la base), `state` e
//     `iss`; `solicitud_no_valida` -> 400; `origen_bloqueado` -> 429; `codigo_no_valido` -> formulario con el
//     error; `cerrada` -> 503. Un resultado desconocido lo deniega `autorizacion.ts` (503 por el manejador).
// Se registra ruta, resultado y código; nunca el cuerpo, la cookie, `state`, el código ni el origen (art. 1 y 4).
import { randomBytes } from "node:crypto";
import {
  cargarConfiguracionConector,
  esDesarrollo,
  type ConfiguracionConector,
} from "../plataforma/configuracion";
import { ErrorDeAplicacion } from "../plataforma/errores";
import { registrar } from "../registro/registro";
import { autorizacionDelConector, type Autorizacion } from "../supabase/autorizacion";
import { asistenteDeCallback, type AsistenteCallback } from "./callbacks";
import { normalizarCodigo } from "./codigo-activacion";
import { leerCuerpoAcotado } from "./cuerpo";
import { origenDePeticion } from "./origen";
import { CSP_SIN_PANTALLA, NOMBRE_COOKIE_ACTIVACION, RE_STATE } from "./peticion";
import { renderizarPantalla, type EstadoPantalla } from "./pantalla";
import { derivarClaves, huellaLigadura, huellaToken } from "./secretos";

export const RUTA_ACTIVACION = "/oauth/autorizar";
export const MAXIMO_CUERPO_ACTIVACION_BYTES = 4096;

const RE_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const RE_COOKIE = /^[A-Za-z0-9_-]{43}$/;
// Valor con el que se cuenta un código sin forma de código: los reales son 12 símbolos Crockford.
const CODIGO_SIN_FORMA = "sin-forma";

const FALLO_FIJO = (): Response =>
  new Response('{"estado":"error"}', {
    status: 503,
    headers: {
      "Cache-Control": "no-store",
      "Content-Type": "application/json",
      "Content-Security-Policy": CSP_SIN_PANTALLA,
    },
  });

function pantalla(estado: EstadoPantalla, limpiarCookie = false): Response {
  let cuerpo;
  try {
    cuerpo = renderizarPantalla(estado);
  } catch {
    registrar("error", "error_no_controlado", RUTA_ACTIVACION);
    return FALLO_FIJO();
  }
  const cabeceras = new Headers(cuerpo.cabeceras);
  if (limpiarCookie) {
    cabeceras.append(
      "Set-Cookie",
      `${NOMBRE_COOKIE_ACTIVACION}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Strict`,
    );
  }
  return new Response(cuerpo.html, { status: cuerpo.estado, headers: cabeceras });
}

// Valor de la cookie de activación: una sola, con la forma que genera el servidor; si no, null.
export function leerCookieActivacion(cabecera: string | null): string | null {
  if (cabecera === null || cabecera.length > 4096) return null;
  const valores: string[] = [];
  for (const par of cabecera.split(";")) {
    const i = par.indexOf("=");
    if (i < 0) continue;
    if (par.slice(0, i).trim() === NOMBRE_COOKIE_ACTIVACION) valores.push(par.slice(i + 1).trim());
  }
  return valores.length === 1 && RE_COOKIE.test(valores[0]!) ? valores[0]! : null;
}

interface Formulario {
  readonly solicitud: string;
  readonly asistente: AsistenteCallback;
  readonly state: string;
  readonly codigo: string;
}

// Campos del formulario: cada uno una sola vez y con su forma; lo demás ni se mira. `codigo` solo se exige
// como texto: su forma se resuelve al normalizarlo (y cuenta como fallo si no es un código).
export function leerFormulario(texto: string): Formulario | null {
  const p = new URLSearchParams(texto);
  const uno = (n: string): string | null => {
    const todos = p.getAll(n);
    return todos.length === 1 ? todos[0]! : null;
  };
  const solicitud = uno("solicitud");
  const asistente = uno("asistente");
  const state = uno("state");
  const codigo = uno("codigo");
  if (solicitud === null || !RE_UUID.test(solicitud)) return null;
  if (asistente === null || !Object.hasOwn({ claude: 1, chatgpt: 1 }, asistente)) return null;
  if (state === null || !RE_STATE.test(state)) return null;
  if (codigo === null) return null;
  return { solicitud, asistente: asistente as AsistenteCallback, state, codigo };
}

export interface DependenciasActivacion {
  readonly configuracion: () => ConfiguracionConector;
  readonly autorizacion: () => Pick<Autorizacion, "activar">;
  /** `true` en local: el origen de los intentos es fijo. */
  readonly local: () => boolean;
}

type Funcion = (peticion: Request) => Promise<Response>;

export function crearActivar(dependencias: DependenciasActivacion): Funcion {
  const noValida = (codigo: Parameters<typeof registrar>[1]): Response => {
    registrar("aviso", codigo, RUTA_ACTIVACION);
    return pantalla({ tipo: "solicitud_no_valida" });
  };

  const tramitar = async (
    peticion: Request,
    configuracion: ConfiguracionConector,
  ): Promise<Response> => {
    const claves = derivarClaves(configuracion.secreto);

    // 1. Origin propio exacto, antes de leer nada ni tocar la base.
    if (peticion.headers.get("origin") !== configuracion.urlPublica) {
      await peticion.body?.cancel().catch(() => undefined);
      return noValida("origen_no_permitido");
    }
    // 2. Origen de los intentos.
    const origen = origenDePeticion(peticion.headers, claves, dependencias.local());
    if (origen.estado !== "ok") {
      await peticion.body?.cancel().catch(() => undefined);
      registrar("aviso", "origen_no_permitido", RUTA_ACTIVACION);
      return pantalla({ tipo: "no_disponible" });
    }
    // 3. Cuerpo.
    const tipo = peticion.headers.get("content-type");
    if (
      tipo === null ||
      tipo.split(";")[0]!.trim().toLowerCase() !== "application/x-www-form-urlencoded"
    ) {
      await peticion.body?.cancel().catch(() => undefined);
      return noValida("entrada_invalida");
    }
    const lectura = await leerCuerpoAcotado(peticion, MAXIMO_CUERPO_ACTIVACION_BYTES);
    if (lectura.tipo === "grande") return noValida("cuerpo_demasiado_grande");
    if (lectura.tipo !== "texto") return noValida("entrada_invalida");
    const formulario = leerFormulario(lectura.texto);
    if (formulario === null) return noValida("entrada_invalida");
    // 4. Cookie.
    const cookie = leerCookieActivacion(peticion.headers.get("cookie"));
    if (cookie === null) return noValida("entrada_invalida");

    // 5. Activación.
    const normalizado = normalizarCodigo(formulario.codigo); // acota la longitud él mismo
    const codigoAutorizacion = randomBytes(32).toString("base64url");
    const r = await dependencias
      .autorizacion()
      .activar(
        formulario.solicitud.toLowerCase(),
        huellaLigadura(claves, "activacion", cookie),
        huellaLigadura(claves, "state", formulario.state),
        origen.hmac,
        huellaToken(claves, "codigo_activacion", normalizado ?? CODIGO_SIN_FORMA),
        huellaToken(claves, "codigo_autorizacion", codigoAutorizacion),
      );
    switch (r.resultado) {
      case "activada": {
        const asistente = asistenteDeCallback(r.redirectUri);
        if (asistente === null) {
          registrar("aviso", "almacen_no_disponible", RUTA_ACTIVACION);
          return pantalla({ tipo: "no_disponible" });
        }
        return pantalla(
          {
            tipo: "aceptado",
            asistente,
            codigo: codigoAutorizacion,
            state: formulario.state,
            iss: configuracion.urlPublica,
          },
          true,
        );
      }
      case "solicitud_no_valida":
        return noValida("entrada_invalida");
      case "origen_bloqueado":
        registrar("aviso", "origen_no_permitido", RUTA_ACTIVACION);
        return pantalla({ tipo: "bloqueado" });
      case "codigo_no_valido":
        return pantalla({
          tipo: "formulario",
          asistente: formulario.asistente,
          state: formulario.state,
          solicitud: formulario.solicitud.toLowerCase(),
          codigoNoValido: true,
        });
      default:
        // `cerrada`: estado fijo sin detalle.
        registrar("aviso", "almacen_no_disponible", RUTA_ACTIVACION);
        return pantalla({ tipo: "no_disponible" });
    }
  };

  return async (peticion) => {
    // 0. Configuración (su fallo sube al manejador) y método.
    const configuracion = dependencias.configuracion();
    if (peticion.method !== "POST") {
      registrar("aviso", "metodo_no_permitido", RUTA_ACTIVACION);
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
      // Almacén caído o respuesta inválida: pantalla fija (503); lo demás sube al manejador.
      if (!(error instanceof ErrorDeAplicacion) || error.codigo !== "almacen_no_disponible")
        return Promise.reject(error); // se relanza tal cual (la regla de lint solo admite lanzar ErrorDeAplicacion nuevos)
      registrar("aviso", "almacen_no_disponible", RUTA_ACTIVACION);
      return pantalla({ tipo: "no_disponible" });
    }
  };
}

export const puntoActivar: Funcion = crearActivar({
  configuracion: cargarConfiguracionConector,
  autorizacion: autorizacionDelConector,
  local: esDesarrollo,
});
