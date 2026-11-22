// Comprobación del conector desde fuera (T-111 c, 001; PRUEBA-001, PRUEBA-047 y V-3; artículos 3, 4 y 13).
//
//   npm run conector:comprobar
//
// Sin argumentos. Pide, sin eco, la dirección del despliegue (`https://servidor`; con `http://localhost[:puerto]`
// comprueba un `next start` local) y, solo para un despliegue, con eco (no es secreta), la huella: el SHA
// completo del commit desplegado (el `$sha` del apartado 7 de `docs/operacion/despliegue-preproduccion.md`).
// Solo lee: GET y un POST sin credencial a /api/mcp. No usa ninguna credencial, no escribe en disco y no
// devuelve nada recibido: la salida son nombres de comprobación fijos y un estado (OK, FALLA o NO COMPROBADO),
// sin dirección, cabeceras ni cuerpos del servidor.
//
// Qué comprueba:
//  - metadatos del recurso y del servidor (CAD-002: todo sale de la dirección dada; sin CORS; no-store);
//  - reto 401 de /api/mcp sin credencial, con el recurso y el ámbito exactos;
//  - 405 con `Allow: POST` en /api/mcp y /api/operacion;
//  - cabeceras de seguridad en /api/salud y la excepción `same-origin` de /oauth/autorizar;
//  - región: la cabecera `x-vercel-id` debe llevar `arn1` como segmento de la función (no el del borde);
//  - V-3: `next.config.ts` traza `prompts/agente-prueba/` y `contratos/` en /api/mcp. Es una comprobación
//    sobre ESTA copia del repositorio: solo vale para el despliegue si la copia es un clon sin cambios cuyo
//    `HEAD` es la huella dada (si no, NO COMPROBADO). La traza real (`.nft.json`) solo se mira con un
//    `next start` local de esta copia; un despliegue se compila en Vercel y la traza local no es la suya
//    (NO COMPROBADO).
// Lo que desde fuera no se puede ver (el suceso que queda tras responder, que necesita una conexión) se
// declara NO COMPROBADO: nunca se da por superado (artículo 13).
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import process from "node:process";
import { fileURLToPath, pathToFileURL } from "node:url";
import { crearLector, esLocal, origenValido, TEXTO_TLS, tlsDesactivado } from "./entrada.mjs";

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
const PLAZO_MS = 20_000;
const RE_HUELLA = /^[0-9a-f]{40}$/;
const RE_REGION = /^[a-z]{3}[0-9]$/;
const REGION_FUNCION = "arn1";
const TRAZADO = ["./prompts/agente-prueba/**", "./contratos/**"];
const ARCHIVOS_TRAZADOS = [
  "prompts/agente-prueba/0.1.md",
  "contratos/informe.schema.json",
  "contratos/obtener-instrucciones.schema.json",
  "contratos/enviar-informe.schema.json",
  "contratos/confirmar-orden.schema.json",
];

const sistemaReal = () => ({
  leerTexto(ruta) {
    try {
      return readFileSync(join(RAIZ, ruta), "utf8");
    } catch {
      return null;
    }
  },
  git: (argumentos) =>
    execFileSync("git", argumentos, {
      cwd: RAIZ,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }),
});

/** `true` solo si la copia es un clon sin cambios (ni archivos nuevos) cuyo HEAD es la huella. Cualquier fallo, `false`. */
function copiaEsElCommit(sistema, huella) {
  try {
    if (typeof sistema.git !== "function") return false;
    if (sistema.git(["rev-parse", "HEAD"]).trim() !== huella) return false;
    return sistema.git(["status", "--porcelain", "--untracked-files=all"]).trim() === "";
  } catch {
    return false;
  }
}

const esObjeto = (v) => v !== null && typeof v === "object" && !Array.isArray(v);
const sinCors = (c) => c.get("access-control-allow-origin") === null;
const noStore = (c) => (c.get("cache-control") ?? "").toLowerCase().includes("no-store");

/** Respuesta resumida o `null` si no hubo respuesta (red, plazo, redirección). Nada se conserva salvo lo mirado. */
async function pedir(origen, red, ruta, init = {}) {
  try {
    const r = await red(`${origen}${ruta}`, {
      redirect: "error",
      signal: AbortSignal.timeout(PLAZO_MS),
      ...init,
    });
    const texto = await r.text();
    let json = null;
    try {
      const v = JSON.parse(texto);
      json = esObjeto(v) ? v : null;
    } catch {
      json = null;
    }
    return { estado: r.status, cabeceras: r.headers, json };
  } catch {
    return null;
  }
}

const mismoConjunto = (a, b) =>
  Array.isArray(a) && a.length === b.length && b.every((x) => a.includes(x));

function metadatosRecurso(origen, r) {
  return (
    r !== null &&
    r.estado === 200 &&
    sinCors(r.cabeceras) &&
    noStore(r.cabeceras) &&
    r.json !== null &&
    r.json.resource === `${origen}/api/mcp` &&
    mismoConjunto(r.json.authorization_servers, [origen]) &&
    mismoConjunto(r.json.scopes_supported, ["agente"]) &&
    mismoConjunto(r.json.bearer_methods_supported, ["header"])
  );
}

function metadatosServidor(origen, r) {
  const j = r?.json;
  return (
    r !== null &&
    r.estado === 200 &&
    sinCors(r.cabeceras) &&
    noStore(r.cabeceras) &&
    j !== null &&
    j.issuer === origen &&
    j.authorization_endpoint === `${origen}/oauth/autorizar` &&
    j.token_endpoint === `${origen}/oauth/token` &&
    j.registration_endpoint === `${origen}/oauth/registro` &&
    mismoConjunto(j.response_types_supported, ["code"]) &&
    mismoConjunto(j.code_challenge_methods_supported, ["S256"]) &&
    mismoConjunto(j.token_endpoint_auth_methods_supported, ["none"]) &&
    j.authorization_response_iss_parameter_supported === true
  );
}

/** Texto de `next.config.ts` -> los patrones trazados de la ruta `/api/mcp` (o `[]`). */
function patronesTrazados(fuente) {
  const bloque = /"\/api\/mcp"\s*:\s*\[([^\]]*)\]/.exec(fuente);
  if (bloque === null) return [];
  return [...bloque[1].matchAll(/"([^"]+)"/g)].map((m) => m[1]);
}

/**
 * Ejecuta la comprobación. Devuelve 0 si ninguna comprobación falla (las NO COMPROBADO se muestran y no
 * cuentan como superadas). Las dependencias son inyectables (pruebas).
 */
export async function ejecutarComprobacion({
  argv,
  lector = crearLector(),
  fetch: red = globalThis.fetch,
  salida = (t) => process.stdout.write(`${t}\n`),
  errores = (t) => process.stderr.write(`${t}\n`),
  sistema = sistemaReal(),
  entorno,
}) {
  if (argv.length !== 0) {
    errores("Esta orden no acepta argumentos: la dirección se escribe cuando la pide.");
    return 1;
  }
  // Con la verificación TLS apagada ninguna comprobación de un despliegue vale: se rechaza antes de pedir nada.
  if (tlsDesactivado(entorno)) {
    errores(TEXTO_TLS);
    return 1;
  }
  let origen;
  let huella = null;
  try {
    origen = origenValido(await lector.pedir("Dirección del despliegue (https://servidor)"), {
      permitirLocal: true,
    });
    if (origen !== null && !esLocal(origen)) {
      // La huella no es secreta: se pide con eco para poder revisarla.
      huella = (
        await lector.pedir("Huella del commit desplegado (SHA completo, 40 hexadecimales)", {
          oculto: false,
        })
      ).trim();
    }
  } catch {
    errores("No se pudo leer la entrada.");
    return 1;
  }
  if (origen === null) {
    errores(
      "La dirección debe ser https://servidor (o http://localhost[:puerto]), sin ruta, usuario ni consulta.",
    );
    return 1;
  }
  const local = esLocal(origen);
  if (!local && !RE_HUELLA.test(huella ?? "")) {
    errores("La huella debe ser el SHA completo del commit: 40 hexadecimales en minúscula.");
    return 1;
  }

  const resultados = [];
  const anotar = (estado, nombre, motivo = "") => {
    resultados.push(estado);
    salida(`[${estado}] ${nombre}${motivo === "" ? "" : `: ${motivo}`}`);
  };
  const comprobar = (nombre, condicion, motivo) =>
    anotar(condicion ? "OK" : "FALLA", nombre, condicion ? "" : motivo);

  // Metadatos (PRUEBA-001; CAD-002).
  const [rCon, rSin, rServ] = [
    await pedir(origen, red, "/.well-known/oauth-protected-resource/api/mcp"),
    await pedir(origen, red, "/.well-known/oauth-protected-resource"),
    await pedir(origen, red, "/.well-known/oauth-authorization-server"),
  ];
  comprobar(
    "metadatos del recurso",
    metadatosRecurso(origen, rCon) && metadatosRecurso(origen, rSin),
    "no responden con el recurso, el servidor y el ámbito esperados, o con CORS o sin no-store",
  );
  comprobar(
    "metadatos del servidor de autorización",
    metadatosServidor(origen, rServ),
    "no coinciden con la dirección, los puntos y el flujo previstos",
  );

  // Reto 401 sin credencial.
  const reto = await pedir(origen, red, "/api/mcp", {
    method: "POST",
    headers: { "content-type": "application/json", accept: "application/json, text/event-stream" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/list", params: {} }),
  });
  comprobar(
    "reto 401 sin credencial",
    reto !== null &&
      reto.estado === 401 &&
      reto.cabeceras.get("www-authenticate") ===
        `Bearer resource_metadata="${origen}/.well-known/oauth-protected-resource/api/mcp", scope="agente"`,
    "no responde 401 con el reto de OAuth del recurso",
  );

  // 405.
  const [mcpGet, opGet] = [
    await pedir(origen, red, "/api/mcp"),
    await pedir(origen, red, "/api/operacion"),
  ];
  const solo405 = (r) => r !== null && r.estado === 405 && r.cabeceras.get("allow") === "POST";
  comprobar(
    "405 con Allow: POST en /api/mcp y /api/operacion",
    solo405(mcpGet) && solo405(opGet),
    "alguna ruta no responde 405 con Allow: POST",
  );

  // Cabeceras de seguridad.
  const [salud, autorizar] = [
    await pedir(origen, red, "/api/salud"),
    await pedir(origen, red, "/oauth/autorizar"),
  ];
  const c = salud?.cabeceras;
  const a = autorizar?.cabeceras;
  comprobar(
    "cabeceras de seguridad (general y excepción de /oauth/autorizar)",
    c != null &&
      a != null &&
      c.get("x-content-type-options") === "nosniff" &&
      c.get("referrer-policy") === "no-referrer" &&
      c.get("x-frame-options") === "DENY" &&
      (c.get("content-security-policy") ?? "").includes("frame-ancestors 'none'") &&
      (c.get("permissions-policy") ?? "").includes("camera=()") &&
      (c.get("x-robots-tag") ?? "").includes("noindex") &&
      a.get("referrer-policy") === "same-origin" &&
      a.get("x-content-type-options") === "nosniff" &&
      a.get("x-frame-options") === "DENY",
    "falta alguna cabecera o tiene otro valor",
  );

  // Región (PRUEBA-047, parte).
  if (local) {
    anotar(
      "NO COMPROBADO",
      "región de la función arn1",
      "no aplica en local; se comprueba contra el despliegue",
    );
  } else {
    const segmentos = (salud?.cabeceras.get("x-vercel-id") ?? "").split("::");
    comprobar(
      "región de la función arn1 (x-vercel-id)",
      salud !== null &&
        salud.estado === 200 &&
        salud.json?.estado === "ok" &&
        segmentos.length === 3 &&
        RE_REGION.test(segmentos[1]) &&
        segmentos[1] === REGION_FUNCION,
      "la salud no responde ok o el segmento de la función no es arn1",
    );
  }

  // V-3: trazado. Es la configuración de ESTA copia: vale para el despliegue solo si la copia es su commit.
  const nombreTrazado =
    "V-3 trazado de prompts/ y contratos/ en /api/mcp (configuración en esta copia)";
  if (!local && !copiaEsElCommit(sistema, huella)) {
    anotar(
      "NO COMPROBADO",
      nombreTrazado,
      "esta copia no es un clon sin cambios en el commit desplegado (huella)",
    );
  } else {
    const configuracion = sistema.leerTexto("next.config.ts");
    const patrones = configuracion === null ? [] : patronesTrazados(configuracion);
    const existen = ARCHIVOS_TRAZADOS.every((f) => sistema.leerTexto(f) !== null);
    comprobar(
      nombreTrazado,
      TRAZADO.every((p) => patrones.includes(p)) && existen,
      "next.config.ts no traza las dos carpetas en /api/mcp o faltan archivos",
    );
  }
  const nombreTraza = "V-3 traza de la compilación (.nft.json en esta copia)";
  const nft = local ? sistema.leerTexto(".next/server/app/api/mcp/route.js.nft.json") : null;
  if (!local) {
    anotar(
      "NO COMPROBADO",
      nombreTraza,
      "el despliegue se compila en Vercel: la traza local no es la suya; se comprueba con una prueba real del conector (T-114)",
    );
  } else if (nft === null) {
    anotar("NO COMPROBADO", nombreTraza, "no hay compilación en esta copia (next build)");
  } else {
    let ficheros = [];
    try {
      const v = JSON.parse(nft);
      ficheros =
        esObjeto(v) && Array.isArray(v.files) ? v.files.filter((f) => typeof f === "string") : [];
    } catch {
      ficheros = [];
    }
    comprobar(
      nombreTraza,
      ficheros.some((f) => f.includes("prompts/agente-prueba/")) &&
        ficheros.some((f) => f.includes("contratos/")),
      "la traza de /api/mcp no incluye prompts/agente-prueba/ y contratos/",
    );
  }
  anotar(
    "NO COMPROBADO",
    "V-3 suceso tras responder",
    "necesita una conexión: se comprueba en T-114 (b) y en la prueba real",
  );

  const falla = resultados.filter((r) => r === "FALLA").length;
  const sin = resultados.filter((r) => r === "NO COMPROBADO").length;
  salida(
    `Resultado: ${resultados.length - falla - sin} correctas, ${falla} fallidas, ${sin} sin comprobar.`,
  );
  return falla === 0 ? 0 : 1;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exitCode = await ejecutarComprobacion({ argv: process.argv.slice(2) });
}
