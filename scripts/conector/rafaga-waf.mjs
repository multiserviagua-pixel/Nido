// Ráfaga contra el límite de peticiones del WAF (T-119 (a), 001; dictamen del auditor sobre T-117 (a),
// 21/11/2026; `docs/operacion/despliegue-preproduccion.md` apartados 3 y 8; artículos 3, 4 y 13).
//
//   PowerShell:  $env:RAFAGA_URL_BASE = "https://pre-nido.<dominio>"; node scripts/conector/rafaga-waf.mjs
//
// Qué hace: desde esta máquina (una IP), más de 100 peticiones en menos de 60 s a `GET /api/salud` y, aparte,
// a `POST /oauth/token`, y cuenta los códigos de estado. Una ruta SUPERA si recibe 429 (acción Too Many
// Requests) o 403 (acción Deny) y la primera limitada es la n.º 2 a la n.º ULTIMA_ESPERADA (104: la 101 más
// las que pueden ir en vuelo a la vez). Limitada desde la n.º 1, o a partir de la 105, es NO CONCLUYENTE:
// la IP ya venía limitada, el 403 no es de la regla, la ventana cambió a mitad o el límite es mayor de 100.
// No usa ninguna credencial: a `/oauth/token` le manda un cuerpo de formulario
// ficticio con un `grant_type` que no existe, que responde 400 sin tocar la base mientras el límite no actúe.
//
// Entrada, solo por variables de entorno (no son secretas; la dirección no se escribe nunca en la salida):
//  - RAFAGA_URL_BASE (obligatoria): `https://host` sin usuario, puerto, ruta, consulta ni fragmento, y el
//    primer segmento del host tiene que empezar por `pre-` (solo preproduccion: CA-024). Para comprobar la
//    lógica en local, también `http://localhost[:puerto]`. El control `pre-` evita equivocarse de destino;
//    no es un control de autorización: cualquiera puede apuntar a un host que empiece por `pre-`, y lo que
//    impide abusar de la ráfaga es el propio WAF y que no lleva credenciales.
//  - RAFAGA_PETICIONES (opcional): peticiones por ruta, entero de 101 a 400. Por defecto 210: con ventana
//    fija de 60 s y 100 por minuto, 201 o más en menos de 60 s caen como mucho en dos ventanas y una de ellas
//    recibe más de 100, así que la ausencia de 429/403 ya no se puede achacar a un cambio de ventana.
//
// Salida: solo nombres fijos, recuentos de códigos, duración y veredicto. Nunca la dirección, cabeceras ni
// cuerpos (artículos 1 y 4). Los aciertos en Firewall, Overview no se ven desde fuera: se anotan como NO
// COMPROBADO y los mira la persona en el panel (artículo 13).
//
// Códigos de salida: 0 las dos rutas SUPERADAS; 1 alguna FALLIDA; 2 configuración rechazada o algún
// resultado NO CONCLUYENTE (y ninguna FALLIDA).
import process from "node:process";
import { pathToFileURL } from "node:url";
import { origenValido, TEXTO_TLS, tlsDesactivado } from "./entrada.mjs";

export const MINIMO = 101;
export const POR_DEFECTO = 210;
export const MAXIMO = 400;
/** Con 2 × 100 + 1 peticiones en una ventana de 60 s, alguna ventana fija recibe más de 100. */
export const SIN_DUDA_DE_VENTANA = 201;
export const VENTANA_MS = 60_000;
export const PLAZO_PETICION_MS = 10_000;
export const CONCURRENCIA = 4;
/** Vistas estas respuestas limitadas, se deja de enviar: la regla ya ha actuado. */
export const PARADA_TRAS_LIMITADAS = 5;
export const LIMITADORES = [429, 403];
/** Última n.º de primera limitada compatible con 100 por minuto: la 101 más las que van en vuelo. */
export const ULTIMA_ESPERADA = MINIMO + CONCURRENCIA - 1;

export const RUTAS = [
  { ruta: "/api/salud", metodo: "GET" },
  {
    ruta: "/oauth/token",
    metodo: "POST",
    tipo: "application/x-www-form-urlencoded",
    // Ficticio a la vista: un `grant_type` que no existe; ningún código, token ni cliente.
    cuerpo: "grant_type=rafaga_waf_ficticia",
  },
];

const RE_ENTERO = /^[0-9]{1,4}$/;
const RE_LOCAL = /^http:\/\/localhost(?::[0-9]{1,5})?$/;

/** Configuración desde el entorno, o el motivo del rechazo (sin repetir lo recibido). */
export function leerConfiguracion(entorno = process.env) {
  if (tlsDesactivado(entorno)) return { ok: false, motivo: TEXTO_TLS };
  const bruto = entorno?.RAFAGA_URL_BASE;
  if (typeof bruto !== "string" || bruto.trim() === "") {
    return { ok: false, motivo: "Falta RAFAGA_URL_BASE (la dirección de preproduccion)." };
  }
  const origen = origenValido(bruto, { permitirLocal: true });
  if (origen === null) {
    return {
      ok: false,
      motivo:
        "RAFAGA_URL_BASE no es un origen válido: https://host, sin usuario, puerto, ruta, consulta ni fragmento.",
    };
  }
  const local = RE_LOCAL.test(origen);
  if (!local) {
    const host = origen.slice("https://".length);
    if (!host.split(".")[0].startsWith("pre-")) {
      return {
        ok: false,
        motivo:
          "Solo se lanza contra preproduccion: el host de RAFAGA_URL_BASE tiene que empezar por «pre-».",
      };
    }
  }
  let peticiones = POR_DEFECTO;
  const n = entorno?.RAFAGA_PETICIONES;
  if (n !== undefined && n !== "") {
    if (typeof n !== "string" || !RE_ENTERO.test(n.trim())) {
      return {
        ok: false,
        motivo: `RAFAGA_PETICIONES tiene que ser un entero de ${MINIMO} a ${MAXIMO}.`,
      };
    }
    peticiones = Number(n.trim());
    if (peticiones < MINIMO || peticiones > MAXIMO) {
      return {
        ok: false,
        motivo: `RAFAGA_PETICIONES tiene que ser un entero de ${MINIMO} a ${MAXIMO}.`,
      };
    }
  }
  return { ok: true, origen, local, peticiones };
}

/**
 * Lanza la ráfaga contra una ruta. Devuelve solo recuentos: códigos por estado, errores de red, número de
 * orden (1, 2, ...) de la primera respuesta limitada y duración. Deja de enviar al ver
 * `PARADA_TRAS_LIMITADAS` respuestas limitadas o al pasar `VENTANA_MS` desde la primera petición.
 */
export async function lanzarRafaga({
  origen,
  ruta,
  peticiones,
  red,
  ahora = () => performance.now(),
  concurrencia = CONCURRENCIA,
  plazoMs = PLAZO_PETICION_MS,
}) {
  const codigos = {};
  let erroresRed = 0;
  let enviadas = 0;
  let limitadas = 0;
  let primeraLimitada = null;
  let fueraDeVentana = false;
  const inicio = ahora();
  let ultima = inicio;

  const init = {
    method: ruta.metodo,
    redirect: "error",
    cache: "no-store",
    headers: { accept: "application/json", ...(ruta.tipo ? { "content-type": ruta.tipo } : {}) },
    ...(ruta.cuerpo ? { body: ruta.cuerpo } : {}),
  };

  const siguiente = () => {
    if (enviadas >= peticiones || limitadas >= PARADA_TRAS_LIMITADAS) return null;
    if (ahora() - inicio >= VENTANA_MS) {
      fueraDeVentana = true;
      return null;
    }
    enviadas += 1;
    return enviadas;
  };

  const trabajador = async () => {
    for (let orden = siguiente(); orden !== null; orden = siguiente()) {
      try {
        const r = await red(`${origen}${ruta.ruta}`, {
          ...init,
          signal: AbortSignal.timeout(plazoMs),
        });
        // No se conserva ni se lee nada del cuerpo.
        await r.body?.cancel().catch(() => undefined);
        const estado = Number.isInteger(r.status) ? r.status : 0;
        codigos[estado] = (codigos[estado] ?? 0) + 1;
        if (LIMITADORES.includes(estado)) {
          limitadas += 1;
          if (primeraLimitada === null || orden < primeraLimitada) primeraLimitada = orden;
        }
      } catch {
        erroresRed += 1;
      }
      ultima = ahora();
    }
  };

  await Promise.all(Array.from({ length: Math.max(1, concurrencia) }, trabajador));
  return {
    ruta: ruta.ruta,
    pedidas: peticiones,
    enviadas,
    respondidas: enviadas - erroresRed,
    erroresRed,
    codigos,
    limitadas,
    primeraLimitada,
    fueraDeVentana,
    duracionMs: Math.max(0, ultima - inicio),
  };
}

/** Veredicto de una ruta: SUPERADA, FALLIDA o NO CONCLUYENTE, con el motivo. */
export function veredicto(r) {
  if (r.limitadas > 0) {
    const n = r.primeraLimitada;
    if (n === 1) {
      return {
        estado: "NO CONCLUYENTE",
        motivo: "limitado desde la primera: esperar 60 s y repetir, o el 403 no es de la regla",
      };
    }
    if (!Number.isInteger(n) || n < 2 || n > ULTIMA_ESPERADA) {
      return {
        estado: "NO CONCLUYENTE",
        motivo: `primera limitada después de la n.º ${ULTIMA_ESPERADA}: puede ser un cambio de ventana o un límite mayor de 100: repetir`,
      };
    }
    return {
      estado: "SUPERADA",
      motivo: `la regla devolvió 429 o 403 entre la n.º 2 y la n.º ${ULTIMA_ESPERADA}`,
    };
  }
  if (r.respondidas < MINIMO) {
    return {
      estado: "NO CONCLUYENTE",
      motivo: r.fueraDeVentana
        ? `menos de ${MINIMO} respuestas en 60 s: la ráfaga fue demasiado lenta para pasar del límite`
        : `menos de ${MINIMO} respuestas (errores de red): no se llegó al límite`,
    };
  }
  if (r.duracionMs >= VENTANA_MS || r.fueraDeVentana) {
    return {
      estado: "NO CONCLUYENTE",
      motivo: "la ráfaga duró 60 s o más: no prueba más de 100 por minuto",
    };
  }
  if (r.respondidas < SIN_DUDA_DE_VENTANA) {
    return {
      estado: "NO CONCLUYENTE",
      motivo: `ningún 429/403 con menos de ${SIN_DUDA_DE_VENTANA} respuestas: puede ser un cambio de ventana; repetir con RAFAGA_PETICIONES=${POR_DEFECTO}`,
    };
  }
  return {
    estado: "FALLIDA",
    motivo:
      "ningún 429/403 con más de 200 respuestas en menos de 60 s: la regla no limita (revisar operador Starts with y acción, apartado 3)",
  };
}

const segundos = (ms) => (ms / 1000).toFixed(1).replace(".", ",");

/** Texto de los códigos en orden: `200×100, 429×5`. Solo números. */
export function textoCodigos(codigos) {
  const claves = Object.keys(codigos)
    .map(Number)
    .filter((n) => Number.isInteger(n))
    .sort((a, b) => a - b);
  return claves.length === 0 ? "ninguno" : claves.map((c) => `${c}×${codigos[c]}`).join(", ");
}

export async function ejecutarRafaga({
  entorno = process.env,
  red = globalThis.fetch,
  salida = (t) => process.stdout.write(`${t}\n`),
  errores = (t) => process.stderr.write(`${t}\n`),
  ahora,
  concurrencia,
} = {}) {
  const config = leerConfiguracion(entorno);
  if (!config.ok) {
    errores(config.motivo);
    return 2;
  }
  salida(
    `Ráfaga WAF (T-119 a). Destino: el de RAFAGA_URL_BASE (no se muestra)${config.local ? ", en local: sin WAF delante" : ""}. Peticiones por ruta: ${config.peticiones}.`,
  );
  const estados = [];
  for (const ruta of RUTAS) {
    const r = await lanzarRafaga({
      origen: config.origen,
      ruta,
      peticiones: config.peticiones,
      red,
      ...(ahora ? { ahora } : {}),
      ...(concurrencia ? { concurrencia } : {}),
    });
    const v = veredicto(r);
    estados.push(v.estado);
    salida(
      `${ruta.metodo} ${ruta.ruta}: ${v.estado} · ${r.enviadas} enviadas en ${segundos(r.duracionMs)} s · códigos: ${textoCodigos(r.codigos)} · errores de red: ${r.erroresRed} · primera limitada: ${r.primeraLimitada === null ? "ninguna" : `n.º ${r.primeraLimitada}`} · ${v.motivo}.`,
    );
  }
  salida(
    "NO COMPROBADO: aciertos de cada regla en Firewall, Overview (panel de Vercel): los mira y anota la persona.",
  );
  const superadas = estados.filter((e) => e === "SUPERADA").length;
  const fallidas = estados.filter((e) => e === "FALLIDA").length;
  salida(
    `Resultado: ${superadas} superadas, ${fallidas} fallidas, ${estados.length - superadas - fallidas} no concluyentes.`,
  );
  if (fallidas > 0) return 1;
  return superadas === estados.length ? 0 : 2;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exitCode = await ejecutarRafaga();
}
