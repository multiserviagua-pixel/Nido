// Verificador SCRAM-SHA-256 para la contraseña de un rol de Postgres (T-103, 001; artículo 4).
//
// Para qué: la persona calcula AQUÍ, en su máquina, el verificador y pega en el editor SQL solo
//   alter role conector_prueba_mcp password 'SCRAM-SHA-256$4096:...$...:...';
// La contraseña en claro nunca llega a Supabase: no queda en pg_stat_statements, en el registro de errores
// ni en el historial del editor.
//
// Uso (no acepta argumentos: una contraseña en la línea de órdenes queda en el historial del intérprete
// y en la lista de procesos):
//   - variable de entorno CONTRASENA_CONECTOR, o
//   - entrada estándar: en una terminal la pide sin eco; con una tubería lee una línea.
// Imprime solo el verificador. No usa la red, no escribe en disco y no tiene dependencias.
//
// Derivación (RFC 5802 y RFC 7677): SaltedPassword = PBKDF2-HMAC-SHA256(contraseña, sal, 4096),
// ClientKey = HMAC(SaltedPassword, "Client Key"), StoredKey = SHA-256(ClientKey),
// ServerKey = HMAC(SaltedPassword, "Server Key"). Formato de Postgres:
//   SCRAM-SHA-256$<iteraciones>:<sal en base64>$<StoredKey en base64>:<ServerKey en base64>
// Solo se aceptan contraseñas de ASCII imprimible: SASLprep no cambia el ASCII imprimible, así que no hace
// falta normalizar y el resultado coincide con el que calcularía Postgres.
import { createHash, createHmac, pbkdf2Sync, randomBytes } from "node:crypto";
import process from "node:process";
import { pathToFileURL } from "node:url";

const ITERACIONES = 4096;
const LONGITUD_MINIMA = 20;
const LONGITUD_MAXIMA = 256;
const VARIABLE = "CONTRASENA_CONECTOR";

/** Texto del problema de la contraseña (sin repetirla), o null si vale. */
export function validarContrasena(contrasena) {
  if (typeof contrasena !== "string" || contrasena.length === 0) return "la contraseña está vacía";
  if (!/^[\x21-\x7e]+$/.test(contrasena)) {
    return "la contraseña solo puede llevar ASCII imprimible, sin espacios ni saltos de línea";
  }
  if (contrasena.length < LONGITUD_MINIMA) {
    return `la contraseña es demasiado corta (mínimo ${LONGITUD_MINIMA} caracteres)`;
  }
  if (contrasena.length > LONGITUD_MAXIMA) return "la contraseña es demasiado larga";
  return null;
}

/** Verificador SCRAM-SHA-256 en el formato de Postgres. La sal es aleatoria salvo que se fije (pruebas). */
export function calcularVerificador(contrasena, opciones = {}) {
  const sal = opciones.sal ?? randomBytes(16);
  const iteraciones = opciones.iteraciones ?? ITERACIONES;
  const salada = pbkdf2Sync(contrasena, sal, iteraciones, 32, "sha256");
  const claveCliente = createHmac("sha256", salada).update("Client Key").digest();
  const claveGuardada = createHash("sha256").update(claveCliente).digest();
  const claveServidor = createHmac("sha256", salada).update("Server Key").digest();
  return `SCRAM-SHA-256$${iteraciones}:${sal.toString("base64")}$${claveGuardada.toString("base64")}:${claveServidor.toString("base64")}`;
}

function leerTuberia() {
  return new Promise((resolver, rechazar) => {
    const trozos = [];
    process.stdin.on("data", (t) => trozos.push(t));
    process.stdin.on("end", () => resolver(Buffer.concat(trozos).toString("utf8")));
    process.stdin.on("error", rechazar);
  });
}

/** En una terminal: sin eco, hasta Intro. Ctrl+C cancela. */
function leerTerminal() {
  return new Promise((resolver, rechazar) => {
    process.stderr.write("Contraseña (no se muestra): ");
    let texto = "";
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.setEncoding("utf8");
    const fin = (error, valor) => {
      process.stdin.setRawMode(false);
      process.stdin.pause();
      process.stdin.removeListener("data", alTecla);
      process.stderr.write("\n");
      if (error) rechazar(error);
      else resolver(valor);
    };
    const alTecla = (tecla) => {
      for (const c of tecla) {
        if (c === "\r" || c === "\n") return fin(null, texto);
        if (c === "\u0003") return fin(new Error("cancelado"));
        if (c === "\u007f" || c === "\b") texto = texto.slice(0, -1);
        else texto += c;
      }
    };
    process.stdin.on("data", alTecla);
  });
}

async function obtenerContrasena() {
  const deEntorno = process.env[VARIABLE];
  if (deEntorno !== undefined && deEntorno !== "") return deEntorno;
  const bruto = process.stdin.isTTY ? await leerTerminal() : await leerTuberia();
  // Una sola línea: se quita el salto final y nada más (los espacios no valen y se rechazan después).
  return bruto.replace(/\r?\n$/, "");
}

async function principal() {
  if (process.argv.length > 2) {
    process.stderr.write(
      `No se acepta ningún argumento: la contraseña va en la variable ${VARIABLE} o por entrada estándar.\n`,
    );
    return 2;
  }
  let contrasena;
  try {
    contrasena = await obtenerContrasena();
  } catch {
    process.stderr.write("No se pudo leer la contraseña.\n");
    return 1;
  }
  const problema = validarContrasena(contrasena);
  if (problema !== null) {
    process.stderr.write(`${problema}.\n`);
    return 1;
  }
  process.stdout.write(`${calcularVerificador(contrasena)}\n`);
  return 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exitCode = await principal();
}
