// Ciclo OAuth y MCP completo desde la máquina de la persona (T-111 b, 001; diseño, paso 11; C-3; art. 4).
//
//   npm run conector:ciclo -- preproduccion
//
// Abre una conexión nueva de la licencia cuyo código de activación teclea la persona (se genera antes con
// `npm run operar -- preproduccion generar_codigo A`): descubre los metadatos, se registra (DCR), abre la
// solicitud, activa con el código, toma el `code` del enlace de la pantalla SIN seguir el callback, lo
// canjea (PKCE S256), espera a que la persona revoque la conexión de Claude, renueva con rotación (el acceso
// dura 300 s y la espera puede pasarse), lista las tres herramientas y llama a una (abre una ejecución real
// sin informe). La conexión del ciclo se registra como ChatGPT para distinguirla de la de Claude. Solo
// JSON-RPC directo: no usa el cliente del SDK.
//
// Reglas (artículos 1, 3 y 4):
//  - Solo `preproduccion`; cualquier otro entorno se rechaza antes de leer nada. Sin más argumentos.
//  - Sin `NODE_TLS_REJECT_UNAUTHORIZED=0`; el código tiene su forma fija y no se envía a un origen que no se
//    identifique con su emisor y que la persona no confirme escribiendo SI (el destino va solo a la terminal).
//  - La dirección y el código de activación se piden sin eco, en una terminal real (PowerShell o Windows
//    Terminal); sin terminal se rechaza. Ni por argumentos ni por entorno.
//  - Los tokens, el verificador PKCE, el `code` y el `state` viven solo en variables locales de esta
//    ejecución: no se escriben en disco, no se imprimen y no se envían a ninguna dirección distinta de la
//    dada. La salida lleva pasos y recuentos, nunca valores recibidos ni la dirección.
//  - Sin seguir redirecciones. Lo que responde el servidor es dato: se comprueba su forma y se descarta.
import { createHash, randomBytes } from "node:crypto";
import process from "node:process";
import { pathToFileURL } from "node:url";
import {
  confirmarDestino,
  crearLector,
  origenValido,
  RE_CODIGO_ACTIVACION,
  TEXTO_DESTINO,
  TEXTO_SIN_TERMINAL,
  TEXTO_TLS,
  tlsDesactivado,
} from "./entrada.mjs";

const ENTORNO = "preproduccion";
// La conexión del ciclo se registra como ChatGPT (callback de ChatGPT) para distinguirla en el listado de la
// conexión de Claude, que es la que la persona revoca en la pausa.
const CALLBACK = "https://chatgpt.com/connector_platform_oauth_redirect";
const ASISTENTE = "chatgpt";
const HERRAMIENTAS = ["obtener_instrucciones", "enviar_informe", "confirmar_orden"];
const PLAZO_MS = 20_000;
const RE_CLIENTE = /^dcr_[A-Za-z0-9_-]{22}$/;
const RE_ACCESO = /^hia_a_[A-Za-z0-9_-]{43}$/;
const RE_RENOVACION = /^hia_r_[A-Za-z0-9_-]{43}$/;
const RE_CODIGO_AUT = /^[A-Za-z0-9_-]{43}$/;

class Fallo extends Error {}

const sha256b64 = (t) => createHash("sha256").update(t).digest("base64url");
const esObjeto = (v) => v !== null && typeof v === "object" && !Array.isArray(v);

function formulario(campos) {
  const f = new URLSearchParams();
  for (const [k, v] of Object.entries(campos)) f.append(k, v);
  return f.toString();
}

async function json(respuesta) {
  try {
    const v = JSON.parse(await respuesta.text());
    return esObjeto(v) ? v : null;
  } catch {
    return null;
  }
}

// El SDK puede responder en JSON o en un evento `data:`; en ambos casos un único objeto.
async function jsonRpc(respuesta) {
  const crudo = await respuesta.text();
  const linea = crudo.split("\n").find((l) => l.startsWith("data: "));
  try {
    const v = JSON.parse(linea === undefined ? crudo : linea.slice(6));
    return esObjeto(v) ? v : null;
  } catch {
    return null;
  }
}

/**
 * Ejecuta el ciclo. Devuelve el código de salida. `permitirLocal` solo lo usan las pruebas (la orden real
 * exige `https://`).
 */
export async function ejecutarCiclo({
  argv,
  lector = crearLector({ exigirTerminal: true }),
  fetch: red = globalThis.fetch,
  salida = (t) => process.stdout.write(`${t}\n`),
  errores = (t) => process.stderr.write(`${t}\n`),
  permitirLocal = false,
  entorno,
}) {
  if (argv.length !== 1 || argv[0] !== ENTORNO) {
    errores(`Solo se opera sobre ${ENTORNO}, sin más argumentos.`);
    errores(`Uso: npm run conector:ciclo -- ${ENTORNO}`);
    return 1;
  }
  // Sin verificación TLS desactivada: ni el código ni nada viaja por una conexión sin comprobar.
  if (tlsDesactivado(entorno)) {
    errores(TEXTO_TLS);
    return 1;
  }
  // La dirección y el código se teclean sin eco: sin terminal (tubería, mintty de Git Bash) no se pide nada.
  if (lector.esTerminal === false) {
    errores(TEXTO_SIN_TERMINAL);
    return 1;
  }

  let origen;
  let codigoActivacion;
  try {
    origen = origenValido(await lector.pedir("Dirección del despliegue de preproducción"), {
      permitirLocal,
    });
    if (origen === null) {
      errores("La dirección debe ser https://servidor, sin ruta, puerto, usuario ni consulta.");
      return 1;
    }
    codigoActivacion = await lector.pedir("Código de activación");
  } catch {
    errores("No se pudo leer la entrada.");
    return 1;
  }
  // El código tiene su forma fija: cualquier otra cosa (por ejemplo una credencial de operación) no sale.
  if (!RE_CODIGO_ACTIVACION.test(codigoActivacion)) {
    errores("El código de activación no tiene la forma esperada. No se envía nada.");
    return 1;
  }
  // El origen tecleado se identifica con su emisor y la persona confirma el destino antes de enviar el código.
  if (!(await confirmarDestino({ origen, red, lector }))) {
    errores(TEXTO_DESTINO);
    return 1;
  }

  const llamar = async (ruta, init) => {
    try {
      return await red(`${origen}${ruta}`, {
        redirect: "error",
        signal: AbortSignal.timeout(PLAZO_MS),
        ...init,
      });
    } catch {
      throw new Fallo("sin respuesta (red, plazo o redirección)");
    }
  };
  const exigir = (condicion, texto) => {
    if (!condicion) throw new Fallo(texto);
  };

  let paso = 0;
  const hecho = (texto) => {
    paso += 1;
    salida(`${paso}. ${texto}`);
  };

  try {
    // Descubrimiento: los puntos son los de siempre y los metadatos tienen que coincidir.
    const recurso = await llamar("/.well-known/oauth-protected-resource/api/mcp");
    const mRecurso = recurso.status === 200 ? await json(recurso) : null;
    exigir(
      mRecurso !== null &&
        mRecurso.resource === `${origen}/api/mcp` &&
        Array.isArray(mRecurso.authorization_servers) &&
        mRecurso.authorization_servers.length === 1 &&
        mRecurso.authorization_servers[0] === origen,
      `metadatos del recurso no válidos (HTTP ${recurso.status})`,
    );
    const servidor = await llamar("/.well-known/oauth-authorization-server");
    const mServidor = servidor.status === 200 ? await json(servidor) : null;
    exigir(
      mServidor !== null &&
        mServidor.issuer === origen &&
        mServidor.authorization_endpoint === `${origen}/oauth/autorizar` &&
        mServidor.token_endpoint === `${origen}/oauth/token` &&
        mServidor.registration_endpoint === `${origen}/oauth/registro` &&
        Array.isArray(mServidor.code_challenge_methods_supported) &&
        mServidor.code_challenge_methods_supported.includes("S256") &&
        mServidor.authorization_response_iss_parameter_supported === true,
      `metadatos del servidor no válidos (HTTP ${servidor.status})`,
    );
    hecho("Metadatos del recurso y del servidor de autorización: correctos.");

    // Registro dinámico del cliente.
    const alta = await llamar("/oauth/registro", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ redirect_uris: [CALLBACK], token_endpoint_auth_method: "none" }),
    });
    const cliente = alta.status === 201 ? await json(alta) : null;
    exigir(
      cliente !== null &&
        typeof cliente.client_id === "string" &&
        RE_CLIENTE.test(cliente.client_id),
      `el registro del cliente falló (HTTP ${alta.status})`,
    );
    const clientId = cliente.client_id;
    hecho("Cliente registrado.");

    // Solicitud de autorización con PKCE S256.
    const verificador = randomBytes(32).toString("base64url");
    const state = `ciclo-${randomBytes(8).toString("hex")}`;
    const consulta = formulario({
      client_id: clientId,
      redirect_uri: CALLBACK,
      response_type: "code",
      code_challenge: sha256b64(verificador),
      code_challenge_method: "S256",
      resource: `${origen}/api/mcp`,
      state,
    });
    const pantalla = await llamar(`/oauth/autorizar?${consulta}`);
    exigir(pantalla.status === 200, `la solicitud no se abrió (HTTP ${pantalla.status})`);
    const html = await pantalla.text();
    const solicitud = /name="solicitud" value="([^"]{1,128})"/.exec(html)?.[1];
    const galleta =
      (typeof pantalla.headers.getSetCookie === "function"
        ? pantalla.headers.getSetCookie()[0]
        : pantalla.headers.get("set-cookie")) ?? "";
    const valorGalleta = /^__Host-activacion=([^;]{1,256});/.exec(galleta)?.[1];
    exigir(
      solicitud !== undefined && valorGalleta !== undefined,
      "la pantalla no tiene la forma esperada",
    );
    hecho("Solicitud de autorización abierta.");

    // Activación con el código: el `code` se toma del enlace de la pantalla; el callback no se sigue.
    const activar = await llamar("/oauth/autorizar", {
      method: "POST",
      headers: {
        "content-type": "application/x-www-form-urlencoded",
        origin: origen,
        cookie: `__Host-activacion=${valorGalleta}`,
      },
      body: formulario({ solicitud, asistente: ASISTENTE, state, codigo: codigoActivacion }),
    });
    exigir(activar.status === 200, `la activación se rechazó (HTTP ${activar.status})`);
    const aceptado = await activar.text();
    const enlace = /code=([A-Za-z0-9_-]{43})&amp;state=([^&"]*)&amp;iss=([^&"]*)/.exec(aceptado);
    exigir(enlace !== null, "el código de activación no fue aceptado");
    exigir(
      RE_CODIGO_AUT.test(enlace[1]) &&
        decodeURIComponent(enlace[2]) === state &&
        decodeURIComponent(enlace[3]) === origen,
      "el enlace de la pantalla no coincide con la solicitud (state o iss)",
    );
    const codigoAut = enlace[1];
    hecho("Código de activación aceptado; el enlace de retorno no se sigue.");

    // Canje por tokens (solo en memoria).
    const canje = await llamar("/oauth/token", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: formulario({
        grant_type: "authorization_code",
        code: codigoAut,
        redirect_uri: CALLBACK,
        client_id: clientId,
        code_verifier: verificador,
      }),
    });
    const par = canje.status === 200 ? await json(canje) : null;
    exigir(
      par !== null &&
        typeof par.access_token === "string" &&
        RE_ACCESO.test(par.access_token) &&
        typeof par.refresh_token === "string" &&
        RE_RENOVACION.test(par.refresh_token) &&
        par.expires_in === 300,
      `el canje no emitió un par válido (HTTP ${canje.status})`,
    );
    hecho("Código canjeado por un par de tokens (en memoria, no se muestran).");

    // Punto de espera (CA-008, paso 11): la persona revoca ahora la conexión de Claude; esta sigue abierta y
    // lo que viene demuestra que la otra conexión sigue funcionando.
    try {
      await lector.pedir(
        "Revoca ahora la conexión de Claude y pulsa Intro (la de este ciclo figura como ChatGPT: no la revoques; el acceso dura 300 s y se renueva al seguir)",
        { oculto: false },
      );
    } catch {
      throw new Fallo("no se pudo leer la espera");
    }
    hecho("Espera terminada: se sigue con la conexión del ciclo.");

    // Renovación con rotación.
    const renovar = await llamar("/oauth/token", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: formulario({
        grant_type: "refresh_token",
        refresh_token: par.refresh_token,
        client_id: clientId,
      }),
    });
    const nuevo = renovar.status === 200 ? await json(renovar) : null;
    exigir(
      nuevo !== null &&
        typeof nuevo.access_token === "string" &&
        RE_ACCESO.test(nuevo.access_token) &&
        nuevo.access_token !== par.access_token &&
        typeof nuevo.refresh_token === "string" &&
        RE_RENOVACION.test(nuevo.refresh_token) &&
        nuevo.refresh_token !== par.refresh_token,
      `la renovación no rotó el par (HTTP ${renovar.status})`,
    );
    hecho("Renovación con rotación: correcta.");

    // Herramientas.
    const mcp = (cuerpo, acceso) =>
      llamar("/api/mcp", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          accept: "application/json, text/event-stream",
          authorization: `Bearer ${acceso}`,
        },
        body: JSON.stringify(cuerpo),
      });
    const listado = await mcp(
      { jsonrpc: "2.0", id: 1, method: "tools/list", params: {} },
      nuevo.access_token,
    );
    const rl = listado.status === 200 ? await jsonRpc(listado) : null;
    const nombres =
      rl !== null && esObjeto(rl.result) && Array.isArray(rl.result.tools)
        ? rl.result.tools.map((t) => (esObjeto(t) ? t.name : undefined))
        : [];
    exigir(
      nombres.length === HERRAMIENTAS.length && HERRAMIENTAS.every((h) => nombres.includes(h)),
      "el listado de herramientas no es el esperado",
    );
    const prueba = await mcp(
      {
        jsonrpc: "2.0",
        id: 2,
        method: "tools/call",
        params: { name: HERRAMIENTAS[0], arguments: {} },
      },
      nuevo.access_token,
    );
    const rp = prueba.status === 200 ? await jsonRpc(prueba) : null;
    exigir(
      rp !== null &&
        esObjeto(rp.result) &&
        rp.result.isError !== true &&
        esObjeto(rp.result.structuredContent),
      "la llamada de prueba a una herramienta no respondió",
    );
    hecho(
      `Herramientas listadas: ${nombres.length} de ${HERRAMIENTAS.length}; llamada de prueba respondida.`,
    );
  } catch (error) {
    // Solo textos fijos de esta función; nunca el mensaje de un error ajeno.
    errores(
      error instanceof Fallo
        ? `Ciclo interrumpido en el paso ${paso + 1}: ${error.message}.`
        : `Ciclo interrumpido en el paso ${paso + 1}.`,
    );
    return 1;
  }
  salida(
    `Ciclo completo (${paso} pasos). La conexión sigue abierta; los tokens no se han guardado ni mostrado.`,
  );
  salida(
    "Para revocarla: npm run operar -- preproduccion listar_conexiones y después revocar_conexion con su identificador.",
  );
  return 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exitCode = await ejecutarCiclo({ argv: process.argv.slice(2) });
}
