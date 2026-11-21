// Registro dinámico de clientes (DCR, RFC 7591) del conector (T-110 a, 001; diseño §Servidor de
// autorización, «DCR»; REQ-003; RD-008, RD-042; art. 7). Lo recibido es un dato: solo se leen
// `redirect_uris` y `token_endpoint_auth_method`; todo lo demás se ignora sin leerse ni guardarse.
//
// Orden de la tubería (cada fallo responde y termina; cierre en fallo, art. 3):
//  1. Configuración del conector (C-1): si no vale, `configuracion_conector_invalida` (503 en el manejador).
//  2. Solo POST (405). 3. Origen (`x-vercel-forwarded-for`; fijo en local): ausente fuera de local, 403
//     sin evaluar nada. 4. Tipo de contenido JSON y cuerpo de hasta 32 768 bytes (A-22).
//  5. `redirect_uris`: 1 a 10, todos de la lista cerrada (`invalid_redirect_uri`); autenticación del cliente
//     ausente o `none` (`invalid_client_metadata`).
//  6. El `client_id` lo sortea el servidor (`dcr_` + 22 caracteres del generador criptográfico): nunca es
//     entrada. 7. `registrar_cliente_dcr` (límite de 50 sin uso y 5 por origen y hora; purga a 24 h dentro
//     de la función). Solo `registrado` es éxito (201); `limite` y `origen_bloqueado` dan 429; `cerrada`,
//     `no_valido` y cualquier otro resultado nunca son éxito (un resultado desconocido lo deniega
//     `autorizacion.ts` con `almacen_no_disponible`, 503).
// Sin CORS. Nada de lo recibido (cuerpo, origen) se registra ni se devuelve.
import { randomBytes } from "node:crypto";
import {
  cargarConfiguracionConector,
  esDesarrollo,
  type ConfiguracionConector,
} from "../plataforma/configuracion";
import { analizarJson } from "../plataforma/entrada";
import { registrar } from "../registro/registro";
import { autorizacionDelConector, type Autorizacion } from "../supabase/autorizacion";
import { esCallbackPermitido } from "./callbacks";
import { leerCuerpoAcotado } from "./cuerpo";
import { origenDePeticion } from "./origen";
import { derivarClaves } from "./secretos";

export const RUTA_REGISTRO = "/oauth/registro";
export const MAXIMO_CUERPO_REGISTRO_BYTES = 32768;
const MAXIMO_CALLBACKS = 10;

/** Identificador de cliente DCR: 22 caracteres base64url de 128 bits del generador criptográfico. */
export function nuevoClientIdDcr(): string {
  return "dcr_" + randomBytes(16).toString("base64url");
}

export const RE_CLIENT_ID_DCR = /^dcr_[A-Za-z0-9_-]{22}$/;

const CABECERAS = { "Cache-Control": "no-store", "Content-Type": "application/json" } as const;
const respuesta = (estado: number, cuerpo: unknown): Response =>
  new Response(JSON.stringify(cuerpo), { status: estado, headers: CABECERAS });
const error = (estado: number, codigo: string): Response => respuesta(estado, { error: codigo });

const esObjeto = (v: unknown): v is Record<string, unknown> =>
  v !== null && typeof v === "object" && !Array.isArray(v);

type Metadatos =
  | { readonly valido: true; readonly redirectUris: string[] }
  | { readonly valido: false; readonly codigo: "invalid_redirect_uri" | "invalid_client_metadata" };

// Solo lo que se lee: `redirect_uris` y `token_endpoint_auth_method`. Sin eco de lo recibido.
export function validarMetadatosCliente(cuerpo: unknown): Metadatos {
  if (!esObjeto(cuerpo)) return { valido: false, codigo: "invalid_client_metadata" };
  const metodo = Object.hasOwn(cuerpo, "token_endpoint_auth_method")
    ? cuerpo.token_endpoint_auth_method
    : undefined;
  if (metodo !== undefined && metodo !== "none") {
    return { valido: false, codigo: "invalid_client_metadata" };
  }
  const uris = Object.hasOwn(cuerpo, "redirect_uris") ? cuerpo.redirect_uris : undefined;
  if (!Array.isArray(uris) || uris.length === 0 || uris.length > MAXIMO_CALLBACKS) {
    return { valido: false, codigo: "invalid_redirect_uri" };
  }
  const limpias: string[] = [];
  for (const uri of uris as unknown[]) {
    if (typeof uri !== "string" || !esCallbackPermitido(uri)) {
      return { valido: false, codigo: "invalid_redirect_uri" };
    }
    if (!limpias.includes(uri)) limpias.push(uri);
  }
  return { valido: true, redirectUris: limpias };
}

function esJson(cabecera: string | null): boolean {
  if (cabecera === null) return false;
  return cabecera.split(";")[0]!.trim().toLowerCase() === "application/json";
}

export interface DependenciasRegistro {
  /** Configuración validada del conector; lanza `configuracion_conector_invalida`. */
  readonly configuracion: () => ConfiguracionConector;
  /** Rol de gestión; se pide solo cuando hace falta. */
  readonly autorizacion: () => Pick<Autorizacion, "registrarClienteDcr">;
  /** `true` en local: el origen es fijo y no se exige la cabecera de la plataforma. */
  readonly local: () => boolean;
}

type Funcion = (peticion: Request) => Promise<Response>;

export function crearRegistro(dependencias: DependenciasRegistro): Funcion {
  const rechazo = (
    estado: number,
    registro: Parameters<typeof registrar>[1],
    codigo: string,
  ): Response => {
    registrar("aviso", registro, RUTA_REGISTRO);
    return error(estado, codigo);
  };

  return async (peticion) => {
    // 1. Configuración.
    const configuracion = dependencias.configuracion();
    // 2. Solo POST.
    if (peticion.method !== "POST") {
      registrar("aviso", "metodo_no_permitido", RUTA_REGISTRO);
      return new Response(null, {
        status: 405,
        headers: { "Cache-Control": "no-store", Allow: "POST" },
      });
    }
    // 3. Origen: sin la cabecera de la plataforma, fuera de local, no se evalúa nada.
    const claves = derivarClaves(configuracion.secreto);
    const origen = origenDePeticion(peticion.headers, claves, dependencias.local());
    if (origen.estado !== "ok") {
      await peticion.body?.cancel().catch(() => undefined);
      return rechazo(403, "origen_no_permitido", "origen_no_permitido");
    }
    // 4. Tipo y tamaño del cuerpo.
    if (!esJson(peticion.headers.get("content-type"))) {
      await peticion.body?.cancel().catch(() => undefined);
      return rechazo(400, "entrada_invalida", "invalid_client_metadata");
    }
    const lectura = await leerCuerpoAcotado(peticion, MAXIMO_CUERPO_REGISTRO_BYTES);
    if (lectura.tipo === "grande") {
      return rechazo(413, "cuerpo_demasiado_grande", "cuerpo_demasiado_grande");
    }
    if (lectura.tipo !== "texto") {
      return rechazo(400, "entrada_invalida", "invalid_client_metadata");
    }
    // 5. Metadatos: solo lo permitido; lo demás ni se lee.
    let metadatos: Metadatos;
    try {
      metadatos = validarMetadatosCliente(analizarJson(lectura.texto));
    } catch {
      metadatos = { valido: false, codigo: "invalid_client_metadata" };
    }
    if (!metadatos.valido) return rechazo(400, "entrada_invalida", metadatos.codigo);

    // 6 y 7. Identificador sorteado por el servidor y registro con límites dentro de la función.
    const clientId = nuevoClientIdDcr();
    const resultado = await dependencias
      .autorizacion()
      .registrarClienteDcr(origen.hmac, clientId, metadatos.redirectUris);
    switch (resultado.resultado) {
      case "registrado":
        return respuesta(201, {
          client_id: clientId,
          client_id_issued_at: Math.floor(Date.now() / 1000),
          redirect_uris: metadatos.redirectUris,
          token_endpoint_auth_method: "none",
          grant_types: ["authorization_code", "refresh_token"],
          response_types: ["code"],
        });
      case "limite":
      case "origen_bloqueado":
        registrar("aviso", "origen_no_permitido", RUTA_REGISTRO);
        return error(429, "limite_alcanzado");
      case "no_valido":
        return rechazo(400, "entrada_invalida", "invalid_client_metadata");
      default:
        // `cerrada` y cualquier valor que no se reconozca: denegación, nunca éxito (art. 3).
        registrar("aviso", "almacen_no_disponible", RUTA_REGISTRO);
        return error(503, "no_disponible");
    }
  };
}

// El punto de producto: configuración de `configuracion.ts`, rol de gestión y origen de la plataforma.
export const puntoRegistro: Funcion = crearRegistro({
  configuracion: cargarConfiguracionConector,
  autorizacion: autorizacionDelConector,
  local: esDesarrollo,
});
