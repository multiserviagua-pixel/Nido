// Apoyo común de las órdenes de la persona del conector (T-111, 001; artículos 3 y 4).
//
// - Entrada sin eco: lo que es secreto (credencial de operación, código de activación) y la dirección
//   del despliegue se piden en la terminal sin eco. Nunca por argumentos ni por variables de entorno:
//   quedarían en el historial del intérprete o en la lista de procesos. Las órdenes con secretos
//   (`exigirTerminal`) rechazan una entrada que no sea una terminal (tubería, o mintty de Git Bash, donde
//   Node no ve una terminal y el secreto se mostraría o pasaría por una tubería): se usa PowerShell o
//   Windows Terminal. Solo la orden sin secretos (`conector:comprobar`) admite una tubería.
// - Validación de la dirección: solo `https://host`, sin usuario, puerto, ruta, consulta ni fragmento.
// - Nada de lo que se lee se devuelve en un mensaje de error.
import process from "node:process";
import { buscarSecretos } from "../patrones-secretos.mjs";

const RE_ORIGEN_HTTPS = /^https:\/\/([a-z0-9.-]{1,253})$/;
const RE_ORIGEN_LOCAL = /^http:\/\/localhost(?::([1-9][0-9]{0,4}))?$/;

/** Origen válido (`https://host`, solo minúsculas y sin barra final: la barra se quita) o `null`. Con `permitirLocal`, también `http://localhost[:puerto]`. */
export function origenValido(texto, { permitirLocal = false } = {}) {
  if (typeof texto !== "string") return null;
  const t = texto.trim().replace(/\/$/, "");
  const https = RE_ORIGEN_HTTPS.exec(t);
  if (https !== null) {
    const host = https[1];
    if (/^[.-]|[.-]$/.test(host) || host.includes("..")) return null;
    return t;
  }
  if (permitirLocal) {
    const local = RE_ORIGEN_LOCAL.exec(t);
    if (local !== null && (local[1] === undefined || Number(local[1]) <= 65535)) return t;
  }
  return null;
}

// Forma fija del código de activación (`src/lib/oauth/codigo-activacion.ts`): 12 símbolos Crockford base32 en tres grupos.
export const RE_CODIGO_ACTIVACION =
  /^[0-9A-HJKMNP-TV-Z]{4}-[0-9A-HJKMNP-TV-Z]{4}-[0-9A-HJKMNP-TV-Z]{4}$/;

export const TEXTO_TLS =
  "El entorno desactiva la comprobación del certificado (NODE_TLS_REJECT_UNAUTHORIZED=0): no se pide ni se envía nada. Quita esa variable de esta terminal y repite.";

/** `true` si el entorno apaga la verificación TLS de Node (un secreto no debe viajar así). */
export const tlsDesactivado = (entorno = process.env) =>
  entorno?.NODE_TLS_REJECT_UNAUTHORIZED === "0";

export const TEXTO_DESTINO =
  "El servidor no se identifica con la dirección tecleada o no se confirmó el destino. No se envía nada.";

/**
 * Antes de enviar un secreto (credencial de operación, código de activación): el origen tecleado tiene que
 * identificarse a sí mismo (`/.well-known/oauth-authorization-server` con `issuer` igual al origen, sin
 * redirecciones y con plazo) y la persona confirma el destino escribiendo SI. El destino solo se muestra en
 * la terminal (la etiqueta va a stderr con el lector real), nunca por `salida` ni `errores`. Devuelve
 * `true` solo si todo coincide; cualquier otra cosa, `false` (cierre en fallo). No lleva ninguna credencial.
 */
export async function confirmarDestino({ origen, red, lector, plazoMs = 20_000 }) {
  try {
    const r = await red(`${origen}/.well-known/oauth-authorization-server`, {
      redirect: "error",
      signal: AbortSignal.timeout(plazoMs),
      headers: { accept: "application/json" },
    });
    if (r.status !== 200) return false;
    const m = JSON.parse(await r.text());
    if (m === null || typeof m !== "object" || Array.isArray(m) || m.issuer !== origen) {
      return false;
    }
    const respuesta = await lector.pedir(
      `Se enviará el secreto a ${origen.replace(/^https?:\/\//, "")}. Comprueba que es tu despliegue y escribe SI para continuar`,
      { oculto: false },
    );
    return respuesta.trim().toUpperCase() === "SI";
  } catch {
    return false;
  }
}

export const esLocal = (origen) => origen.startsWith("http://localhost");

export const TEXTO_SIN_TERMINAL =
  "Esta orden pide secretos y necesita una terminal real: ejecútala en PowerShell o Windows Terminal (no en Git Bash ni con una tubería).";

/** Un argumento de la línea de órdenes que parece un secreto: se rechaza sin repetirlo. */
export function argumentoConSecreto(argumentos) {
  return argumentos.some((a) => buscarSecretos(String(a)).length > 0);
}

/**
 * Lector de líneas. En una terminal: sin eco (si `oculto`), hasta Intro; Ctrl+C cancela. Sin terminal: con
 * `exigirTerminal` lanza sin leer nada; si no, una línea por petición, en orden. Devuelve texto sin el
 * salto de línea; si no hay entrada, lanza (sin detalle). `esTerminal` lo consultan las órdenes antes de
 * pedir nada.
 */
export function crearLector({
  entrada = process.stdin,
  aviso = process.stderr,
  exigirTerminal = false,
} = {}) {
  let lineas = null;
  const leerTuberia = () =>
    new Promise((resolver, rechazar) => {
      const trozos = [];
      entrada.on("data", (t) => trozos.push(t));
      entrada.on("end", () => resolver(Buffer.concat(trozos).toString("utf8")));
      entrada.on("error", rechazar);
    });
  const leerTerminal = (etiqueta, oculto) =>
    new Promise((resolver, rechazar) => {
      aviso.write(`${etiqueta}${oculto ? " (no se muestra)" : ""}: `);
      let texto = "";
      entrada.setRawMode(true);
      entrada.resume();
      entrada.setEncoding("utf8");
      const fin = (error, valor) => {
        entrada.setRawMode(false);
        entrada.pause();
        entrada.removeListener("data", alTecla);
        aviso.write("\n");
        if (error) rechazar(error);
        else resolver(valor);
      };
      const alTecla = (tecla) => {
        for (const c of tecla) {
          if (c === "\r" || c === "\n") return fin(null, texto);
          if (c === "\u0003") return fin(new Error("cancelado"));
          if (c === "\u007f" || c === "\b") texto = texto.slice(0, -1);
          else {
            texto += c;
            // En modo crudo la terminal no repite lo tecleado: solo se muestra lo que no es secreto.
            if (!oculto) aviso.write(c);
          }
        }
      };
      entrada.on("data", alTecla);
    });
  return {
    esTerminal: Boolean(entrada.isTTY),
    async pedir(etiqueta, { oculto = true } = {}) {
      if (entrada.isTTY) return leerTerminal(etiqueta, oculto);
      if (exigirTerminal) throw new Error("sin_terminal");
      if (lineas === null) lineas = (await leerTuberia()).split(/\r?\n/);
      const linea = lineas.shift();
      if (linea === undefined) throw new Error("sin_entrada");
      return linea;
    },
  };
}
