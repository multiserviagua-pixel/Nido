// Órdenes de la persona al conector de prueba (T-111 a, 001; REQ-017, C-3; artículos 3 y 4).
//
//   npm run operar -- preproduccion <operación> [argumentos]
//
//   generar_codigo <A|B>            suspender_licencia <A|B>        reactivar_licencia <A|B>
//   crear_orden <A|B> <pausar|reanudar>                              listar_conexiones
//   revocar_conexion <uuid>         resumen                          exportar_sucesos <AAAA-MM-DD>
//   cerrar_prueba                   (terminal, sin vuelta: pide escribir CERRAR)
//
// Quién y desde dónde: la persona, desde un clon limpio de `main` (no hay carpeta sellada). Solo con
// `preproduccion`: cualquier otro entorno (producción incluida) se rechaza ANTES de leer nada.
//
// La dirección del despliegue y la credencial de operación (`hia_op_` + 43 caracteres) se piden en una
// terminal real (PowerShell o Windows Terminal), sin eco; sin terminal se rechaza. No se aceptan por argumentos ni por variables
// de entorno (quedarían en el historial o en la lista de procesos), no se escriben en disco, no se
// repiten en ningún mensaje y no salen por la salida. Un argumento con forma de secreto se rechaza sin
// repetirlo. Lo que devuelve el servidor es dato: un fallo se traduce a un texto fijo con su estado HTTP.
// Cierre en fallo: ante cualquier duda (rama, clon sucio, dirección, respuesta rara) no se envía o no se
// da por buena.
import { execFileSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import process from "node:process";
import { fileURLToPath, pathToFileURL } from "node:url";
import {
  argumentoConSecreto,
  confirmarDestino,
  crearLector,
  origenValido,
  RE_CODIGO_ACTIVACION,
  TEXTO_DESTINO,
  TEXTO_SIN_TERMINAL,
  TEXTO_TLS,
  tlsDesactivado,
} from "./entrada.mjs";

// Raíz del repositorio de este script: git se ejecuta ahí y no en el directorio desde el que se lanza.
const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");

const ENTORNO = "preproduccion";
const RE_CREDENCIAL = /^hia_op_[A-Za-z0-9_-]{43}$/;
const RE_UUID = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
const RE_DIA = /^([0-9]{4})-([0-9]{2})-([0-9]{2})$/;
const PLAZO_MS = 20_000;

// Mismas operaciones y argumentos que `src/lib/licencias/operaciones.ts` (la ruta valida otra vez).
const OPERACIONES = {
  generar_codigo: ["tipo"],
  suspender_licencia: ["tipo"],
  reactivar_licencia: ["tipo"],
  crear_orden: ["tipo", "orden"],
  listar_conexiones: [],
  revocar_conexion: ["conexion"],
  resumen: [],
  exportar_sucesos: ["dia"],
  cerrar_prueba: [],
};

const USO = `Uso: npm run operar -- ${ENTORNO} <operación> [argumentos]
Operaciones: ${Object.keys(OPERACIONES).join(", ")}.`;

const MENSAJE_ESTADO = new Map([
  [400, "operación o argumentos rechazados"],
  [401, "credencial no válida"],
  [403, "origen no permitido"],
  [404, "no disponible en este entorno"],
  [405, "método no permitido"],
  [409, "la operación no procede en el estado actual"],
  [413, "cuerpo demasiado grande"],
  [429, "origen bloqueado temporalmente por demasiados fallos"],
  [503, "el conector no está disponible"],
]);

function diaValido(dia) {
  const m = RE_DIA.exec(dia);
  if (m === null) return false;
  const [a, mes, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const f = new Date(Date.UTC(a, mes - 1, d));
  return f.getUTCFullYear() === a && f.getUTCMonth() === mes - 1 && f.getUTCDate() === d;
}

/** Operación y argumentos del cuerpo, o `null` si no valen. Sin eco de lo recibido. */
export function analizarArgumentos(operacion, resto) {
  if (typeof operacion !== "string" || !Object.hasOwn(OPERACIONES, operacion)) return null;
  const nombres = OPERACIONES[operacion];
  if (resto.length !== nombres.length) return null;
  const argumentos = {};
  for (let i = 0; i < nombres.length; i += 1) {
    const valor = resto[i];
    const nombre = nombres[i];
    if (nombre === "tipo" && valor !== "A" && valor !== "B") return null;
    if (nombre === "orden" && valor !== "pausar" && valor !== "reanudar") return null;
    if (nombre === "conexion" && !RE_UUID.test(valor)) return null;
    if (nombre === "dia" && !diaValido(valor)) return null;
    argumentos[nombre] = valor;
  }
  return { operacion, argumentos };
}

/**
 * `true` solo en la rama `main`, con `HEAD` igual a `origin/main` (la referencia local; no hace `fetch`) y
 * sin cambios (ni archivos sin seguimiento). Cualquier fallo de git, `false`.
 */
export function clonLimpio(git) {
  try {
    if (git(["rev-parse", "--abbrev-ref", "HEAD"]).trim() !== "main") return false;
    const cabeza = git(["rev-parse", "HEAD"]).trim();
    if (cabeza === "" || cabeza !== git(["rev-parse", "origin/main"]).trim()) return false;
    return git(["status", "--porcelain", "--untracked-files=all"]).trim() === "";
  } catch {
    return false;
  }
}

const gitReal = (argumentos) =>
  execFileSync("git", argumentos, {
    cwd: RAIZ,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "ignore"],
  });

// Lo que devuelve el servidor es dato: los caracteres de control C1 y de dirección del texto (que pueden
// reescribir la terminal o disfrazar el orden de lectura) se imprimen escapados.
const RE_RAROS = /[\u0080-\u009f\u200e\u200f\u202a-\u202e\u2066-\u2069]/g;
const escapar = (texto) =>
  texto.replace(RE_RAROS, (c) => "\\u" + c.charCodeAt(0).toString(16).padStart(4, "0"));

function mostrar(estado, cuerpo, credencial, salida, mostrarCodigo) {
  let datos;
  try {
    datos = JSON.parse(cuerpo);
  } catch {
    datos = undefined;
  }
  if (estado !== 200) {
    const base = MENSAJE_ESTADO.get(estado) ?? "respuesta inesperada";
    // Solo un identificador cerrado del resultado, nunca texto libre del servidor.
    const clave =
      datos !== null && typeof datos === "object" ? (datos.resultado ?? datos.error) : undefined;
    const cierre = typeof clave === "string" && /^[a-z_]{1,48}$/.test(clave) ? ` (${clave})` : "";
    return { codigo: 1, texto: `Rechazado, HTTP ${estado}: ${base}${cierre}.` };
  }
  if (datos === null || typeof datos !== "object" || Array.isArray(datos)) {
    return { codigo: 1, texto: "Respuesta no válida del servidor (no es JSON de objeto)." };
  }
  const { codigo: activacion, ...resto } = datos;
  const texto = escapar(JSON.stringify(resto, null, 2));
  if (cuerpo.includes(credencial)) {
    return { codigo: 1, texto: "Respuesta descartada: devolvía datos que no corresponden." };
  }
  salida(texto);
  if (typeof activacion === "string" && resto.resultado === "generado") {
    // Solo se imprime con la forma fija; cualquier otra cosa que llegue en ese campo es dato ajeno.
    if (!RE_CODIGO_ACTIVACION.test(activacion)) {
      return { codigo: 1, texto: "Código de activación con una forma no válida: no se muestra." };
    }
    if (!mostrarCodigo) {
      return {
        codigo: 0,
        texto:
          "Se generó un código de activación, pero no se muestra porque la salida no es una terminal. Repite la orden en una terminal (PowerShell o Windows Terminal).",
      };
    }
    return {
      codigo: 0,
      texto: `Código de activación (se muestra una sola vez y no se guarda): ${activacion}`,
    };
  }
  return { codigo: 0, texto: null };
}

/**
 * Ejecuta la orden. Devuelve el código de salida. Todas las dependencias son inyectables (pruebas).
 * Orden: entorno -> argumentos -> secretos en la línea -> clon -> dirección -> credencial -> envío.
 */
export async function ejecutarOperar({
  argv,
  git = gitReal,
  lector = crearLector({ exigirTerminal: true }),
  fetch: peticion = globalThis.fetch,
  salida = (t) => process.stdout.write(`${t}\n`),
  errores = (t) => process.stderr.write(`${t}\n`),
  entorno,
  salidaEsTerminal = Boolean(process.stdout.isTTY),
}) {
  // 1. Entorno exacto, antes de cualquier otra cosa.
  if (argv[0] !== ENTORNO) {
    errores(`Solo se opera sobre ${ENTORNO}. Otro entorno se rechaza.`);
    errores(USO);
    return 1;
  }
  // 1 bis. Sin verificación TLS desactivada: un secreto no viaja por una conexión sin comprobar.
  if (tlsDesactivado(entorno)) {
    errores(TEXTO_TLS);
    return 1;
  }
  // 2. Operación y argumentos válidos; nada con forma de secreto en la línea de órdenes.
  const resto = argv.slice(1);
  if (argumentoConSecreto(resto)) {
    errores(
      "Un argumento tiene forma de secreto: no se pone en la línea de órdenes y no se repite; considera la credencial expuesta (historial y registro de npm): pide otra y borra esa línea del historial.",
    );
    return 1;
  }
  const analizado = analizarArgumentos(resto[0], resto.slice(1));
  if (analizado === null) {
    errores("Operación o argumentos no válidos.");
    errores(USO);
    return 1;
  }
  // 3. Clon limpio de main (C-3: no hay carpeta sellada).
  if (!clonLimpio(git)) {
    errores(
      "Ejecuta esta orden desde un clon limpio de la rama main (sin cambios ni archivos nuevos).",
    );
    return 1;
  }
  // 4. Dirección y credencial, sin eco y en una terminal real (en Git Bash Node no la ve y se mostraría).
  if (lector.esTerminal === false) {
    errores(TEXTO_SIN_TERMINAL);
    return 1;
  }
  let origen;
  let credencial;
  try {
    origen = origenValido(await lector.pedir("Dirección del despliegue de preproducción"));
    if (origen === null) {
      errores("La dirección debe ser https://servidor, sin ruta, puerto, usuario ni consulta.");
      return 1;
    }
    credencial = await lector.pedir("Credencial de operación");
  } catch {
    errores("No se pudo leer la entrada.");
    return 1;
  }
  if (!RE_CREDENCIAL.test(credencial)) {
    errores("La credencial no tiene la forma esperada. No se envía nada.");
    return 1;
  }
  // 4 bis. Destino: el origen tecleado se identifica con su emisor y la persona lo confirma (SI) antes de enviar.
  if (!(await confirmarDestino({ origen, red: peticion, lector }))) {
    errores(TEXTO_DESTINO);
    return 1;
  }
  // 5. Confirmación de lo irreversible.
  if (analizado.operacion === "cerrar_prueba") {
    let confirmacion;
    try {
      confirmacion = await lector.pedir(
        "cerrar_prueba es terminal y no tiene vuelta. Escribe CERRAR para continuar",
        {
          oculto: false,
        },
      );
    } catch {
      confirmacion = "";
    }
    if (confirmacion !== "CERRAR") {
      errores("Sin confirmación: no se envía nada.");
      return 1;
    }
  }
  // 6. Envío: sin seguir redirecciones (la credencial no sale de la dirección dada), con plazo.
  let respuesta;
  let cuerpo;
  try {
    respuesta = await peticion(`${origen}/api/operacion`, {
      method: "POST",
      redirect: "error",
      headers: {
        authorization: `Bearer ${credencial}`,
        "content-type": "application/json",
        accept: "application/json",
      },
      body: JSON.stringify(analizado),
      signal: AbortSignal.timeout(PLAZO_MS),
    });
    cuerpo = await respuesta.text();
  } catch {
    errores(
      "No se pudo completar la petición (red, plazo o redirección). No se da por hecha la operación.",
    );
    return 1;
  }
  const r = mostrar(respuesta.status, cuerpo, credencial, salida, salidaEsTerminal);
  if (r.texto !== null) (r.codigo === 0 ? salida : errores)(r.texto);
  return r.codigo;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exitCode = await ejecutarOperar({ argv: process.argv.slice(2) });
}
