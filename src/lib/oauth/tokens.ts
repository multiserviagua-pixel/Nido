// Punto de tokens `POST /oauth/token` (T-110 d, 001; diseño §Servidor de autorización y §Tokens; REQ-006,
// REQ-007, REQ-008; A-05, A-06; RFC 6749, 7636, 8707; art. 3 y 7). Todo lo recibido es un dato.
//
//  0. Configuración del conector (C-1; 503 por el manejador) y solo POST (405).
//  1. Cliente público: una cabecera `Authorization` es un intento de autenticar al cliente, que no admitimos
//     (`none`): 401 `invalid_client`. Cuerpo `application/x-www-form-urlencoded` de hasta 8192 bytes; cada
//     campo leído una sola vez; el resto se ignora (también `cliente_oauth_id`: nunca es entrada).
//  2. `authorization_code`: `code`, `redirect_uri`, `client_id` y `code_verifier` (PKCE S256, 43 a 128 caracteres
//     no reservados). El desafío se calcula del verificador (que no llega a la base) y `canjear_codigo` valida
//     de forma atómica cliente, callback, desafío y recurso y sirve el código una sola vez.
//  3. `refresh_token`: se sortea una sal, se deriva el par (acceso y renovación) del token presentado y la sal, y
//     `renovar` rota con bloqueo de fila. Repetición dentro de la gracia: la base devuelve la sal guardada y se
//     deriva el MISMO par. Siempre emite renovación nueva.
//  4. `resource`, si viene, debe ser `<URL_PUBLICA>/api/mcp` (`invalid_target`).
// Los tokens son opacos (`hia_a_`/`hia_r_` + 256 bits del generador criptográfico) y a la base solo llega su
// HMAC. Toda respuesta lleva `Cache-Control: no-store` y `Pragma: no-cache`. Un resultado desconocido o
// `cerrada` lo deniega `autorizacion.ts` (`almacen_no_disponible`: 503 por el manejador). Se registra ruta,
// resultado y código; nunca el cuerpo, tokens, códigos, verificadores ni el error del almacén (art. 1 y 4).
import { createHash } from "node:crypto";
import {
  cargarConfiguracionConector,
  type ConfiguracionConector,
} from "../plataforma/configuracion";
import { registrar } from "../registro/registro";
import { autorizacionDelConector, type Autorizacion } from "../supabase/autorizacion";
import { leerCuerpoAcotado } from "./cuerpo";
import { derivarClaves, derivarPar, generarSal, huellaToken, nuevoToken } from "./secretos";

export const RUTA_TOKEN = "/oauth/token";
export const MAXIMO_CUERPO_TOKEN_BYTES = 8192;
const MAXIMO_TEXTO = 300;

const RE_CODIGO = /^[A-Za-z0-9_-]{43}$/;
const RE_VERIFICADOR = /^[A-Za-z0-9._~-]{43,128}$/;
const RE_RENOVACION = /^hia_r_[A-Za-z0-9_-]{43}$/;

const CABECERAS = {
  "Cache-Control": "no-store",
  Pragma: "no-cache",
  "Content-Type": "application/json",
} as const;
const json = (estado: number, cuerpo: unknown): Response =>
  new Response(JSON.stringify(cuerpo), { status: estado, headers: CABECERAS });

type ErrorOauth =
  | "invalid_request"
  | "invalid_grant"
  | "invalid_client"
  | "invalid_target"
  | "unsupported_grant_type";

export interface DependenciasTokens {
  readonly configuracion: () => ConfiguracionConector;
  readonly autorizacion: () => Pick<Autorizacion, "canjearCodigo" | "renovar">;
}

type Funcion = (peticion: Request) => Promise<Response>;

export function crearToken(dependencias: DependenciasTokens): Funcion {
  const rechazo = (
    estado: number,
    codigo: ErrorOauth,
    registro: Parameters<typeof registrar>[1] = "entrada_invalida",
  ): Response => {
    registrar("aviso", registro, RUTA_TOKEN);
    return json(estado, { error: codigo });
  };

  return async (peticion) => {
    // 0. Configuración y método.
    const configuracion = dependencias.configuracion();
    if (peticion.method !== "POST") {
      registrar("aviso", "metodo_no_permitido", RUTA_TOKEN);
      return new Response(null, {
        status: 405,
        headers: { "Cache-Control": "no-store", Pragma: "no-cache", Allow: "POST" },
      });
    }
    const claves = derivarClaves(configuracion.secreto);
    const recursoFijo = `${configuracion.urlPublica}/api/mcp`;

    // 1. Cliente público y cuerpo.
    if (peticion.headers.has("authorization")) {
      await peticion.body?.cancel().catch(() => undefined);
      // RFC 6749 §5.2: el 401 por `Authorization` lleva el desafío de la autenticación que se intentó.
      const r = rechazo(401, "invalid_client", "token_no_valido");
      r.headers.set("WWW-Authenticate", 'Basic realm="oauth"');
      return r;
    }
    const tipo = peticion.headers.get("content-type");
    if (
      tipo === null ||
      tipo.split(";")[0]!.trim().toLowerCase() !== "application/x-www-form-urlencoded"
    ) {
      await peticion.body?.cancel().catch(() => undefined);
      return rechazo(400, "invalid_request");
    }
    const lectura = await leerCuerpoAcotado(peticion, MAXIMO_CUERPO_TOKEN_BYTES);
    if (lectura.tipo === "grande") {
      return rechazo(413, "invalid_request", "cuerpo_demasiado_grande");
    }
    if (lectura.tipo !== "texto") return rechazo(400, "invalid_request");
    const parametros = new URLSearchParams(lectura.texto);
    // Un campo repetido es ambiguo: no se elige uno.
    const leer = (nombre: string): string | null | undefined => {
      const todos = parametros.getAll(nombre);
      if (todos.length === 0) return undefined;
      return todos.length === 1 ? todos[0]! : null;
    };
    const texto = (nombre: string): string | null => {
      const v = leer(nombre);
      return typeof v === "string" && v.length > 0 && v.length <= MAXIMO_TEXTO ? v : null;
    };

    const grant = leer("grant_type");
    if (grant === undefined || grant === null) return rechazo(400, "invalid_request");
    if (grant !== "authorization_code" && grant !== "refresh_token") {
      return rechazo(400, "unsupported_grant_type");
    }
    const clientId = texto("client_id");
    if (clientId === null) return rechazo(400, "invalid_request");
    // 4. `resource`: opcional, pero si viene debe ser el recurso de este servidor.
    const recurso = leer("resource");
    if (recurso === null) return rechazo(400, "invalid_request");
    if (recurso !== undefined && recurso !== recursoFijo) {
      return rechazo(400, "invalid_target");
    }

    const emitido = (acceso: string, renovacion: string, expiresIn: number): Response =>
      json(200, {
        access_token: acceso,
        token_type: "Bearer",
        expires_in: expiresIn,
        refresh_token: renovacion,
      });

    if (grant === "authorization_code") {
      // 2. Canje del código de autorización.
      const codigo = leer("code");
      const verificador = leer("code_verifier");
      const redirectUri = texto("redirect_uri");
      if (typeof codigo !== "string" || typeof verificador !== "string" || redirectUri === null) {
        return rechazo(400, "invalid_request");
      }
      if (!RE_VERIFICADOR.test(verificador)) return rechazo(400, "invalid_request");
      if (!RE_CODIGO.test(codigo)) return rechazo(400, "invalid_grant", "token_no_valido");
      const desafio = createHash("sha256").update(verificador, "utf8").digest("base64url");
      const acceso = nuevoToken("acceso");
      const renovacion = nuevoToken("renovacion");
      const r = await dependencias
        .autorizacion()
        .canjearCodigo(
          huellaToken(claves, "codigo_autorizacion", codigo),
          clientId,
          redirectUri,
          desafio,
          recursoFijo,
          huellaToken(claves, "acceso", acceso),
          huellaToken(claves, "renovacion", renovacion),
        );
      if (r.resultado !== "emitido") return rechazo(400, "invalid_grant", "token_no_valido");
      return emitido(acceso, renovacion, r.expiresIn);
    }

    // 3. Renovación con par de gracia.
    const presentado = leer("refresh_token");
    if (typeof presentado !== "string") return rechazo(400, "invalid_request");
    if (!RE_RENOVACION.test(presentado)) return rechazo(400, "invalid_grant", "token_no_valido");
    const sal = generarSal();
    const par = derivarPar(claves, presentado, sal);
    const r = await dependencias
      .autorizacion()
      .renovar(
        huellaToken(claves, "renovacion", presentado),
        clientId,
        recursoFijo,
        sal,
        huellaToken(claves, "acceso", par.acceso),
        huellaToken(claves, "renovacion", par.renovacion),
      );
    if (r.resultado === "rotado") return emitido(par.acceso, par.renovacion, r.expiresIn);
    if (r.resultado === "repetido") {
      // Mismo par: se deriva con la sal que guardó la rotación, no con la nueva.
      const igual = derivarPar(claves, presentado, r.sal);
      return emitido(igual.acceso, igual.renovacion, r.expiresIn);
    }
    return rechazo(400, "invalid_grant", "token_no_valido");
  };
}

export const puntoToken: Funcion = crearToken({
  configuracion: cargarConfiguracionConector,
  autorizacion: autorizacionDelConector,
});
