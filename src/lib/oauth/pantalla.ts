// Pantalla de activación del conector (T-109, 001; REQ-005, CA-005; diseño §Pantalla de activación).
// HTML del servidor sin JavaScript, sin recursos externos y compatible con la CSP del diseño (un único
// bloque de estilo con huella). De la petición solo se refleja `state` (y el identificador de la solicitud
// en un campo oculto), siempre escapados (art. 7: lo recibido es dato). Cierre en fallo (art. 3): cualquier
// entrada que no sea exactamente de la forma esperada produce «no disponible» sin reflejar nada.
// Formatos que T-110 debe respetar al generar los valores (el servidor los genera, no vienen de la petición):
//   solicitud y codigo: /^[A-Za-z0-9._~-]{1,256}$/ ; iss: ASCII imprimible /^[ -~]{1,512}$/ ;
//   state: ASCII imprimible de 0 a 512 caracteres. Lo que no cumpla produce «no disponible» (503).
// Esta pieza solo construye la respuesta; las rutas HTTP, la cookie, `Origin` y los intentos son de T-110.
import { createHash } from "node:crypto";
import { CALLBACKS, type AsistenteCallback } from "./callbacks";

export type EstadoPantalla =
  | {
      tipo: "formulario";
      asistente: AsistenteCallback;
      state: string;
      solicitud: string;
      codigoNoValido?: boolean;
    }
  | { tipo: "bloqueado" }
  | { tipo: "solicitud_no_valida" }
  | { tipo: "no_disponible" }
  | { tipo: "aceptado"; asistente: AsistenteCallback; codigo: string; state: string; iss: string };

export interface RespuestaPantalla {
  estado: number;
  html: string;
  cabeceras: Record<string, string>;
}

// Tabla fija por callback (no sale de la petición).
const NOMBRES: Record<AsistenteCallback, string> = { claude: "claude.ai", chatgpt: "ChatGPT" };

const TEXTOS = {
  titulo: "Activar el conector de HumanaIA",
  codigoNoValido: "El código no es válido o ha caducado. Pide uno nuevo a HumanaIA.",
  bloqueado: "Demasiados intentos. Espera 15 minutos y pide un código nuevo a HumanaIA.",
  solicitudNoValida: "Esta solicitud ha caducado. Vuelve a empezar desde tu asistente.",
  soloSiEmpezaste: "Continúa solo si has empezado tú esta conexión desde tu asistente.",
  noDisponible: "No se ha podido completar. Inténtalo de nuevo en unos minutos.",
} as const;

// Colores: papeles de docs/DISENO.md (tema claro; oscuro y colores forzados abajo). El enlace-botón y el
// botón usan el mismo aspecto; el foco va separado 2 px del control (DISENO: foco nunca pegado al acento).
const ESTILO = `
:root{--fondo:#F8FAFC;--superficie:#FFFFFF;--texto:#0F172A;--secundario:#475569;--borde:#E5E7EB;--control:#64748B;--acento:#6C3CE9;--sobre-acento:#FFFFFF;--foco:#8B5CF6;--error:#B91C1C;--correcto:#15803D}
@media (prefers-color-scheme:dark){:root{--fondo:#0B1120;--superficie:#151E2E;--texto:#F1F5F9;--secundario:#A3B0C2;--borde:#273449;--control:#7D8BA0;--acento:#A78BFA;--sobre-acento:#0F172A;--foco:#A78BFA;--error:#F87171;--correcto:#4ADE80}}
*,*::before,*::after{box-sizing:border-box}
html{-webkit-text-size-adjust:100%}
body{margin:0;background:var(--fondo);color:var(--texto);font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;font-size:1rem;line-height:1.5}
main{max-width:30rem;margin:0 auto;padding:1.5rem 1rem}
.tarjeta{background:var(--superficie);border:1px solid var(--borde);border-radius:.75rem;padding:1.5rem 1.25rem;max-width:100%}
h1{font-size:1.5rem;line-height:1.25;margin:0 0 1rem;overflow-wrap:anywhere}
p{margin:0 0 1rem;overflow-wrap:anywhere}
label{display:block;font-weight:600;margin:0 0 .25rem}
.ayuda{color:var(--secundario);font-size:.9375rem;margin:0 0 .5rem}
.error{color:var(--error);font-weight:600;margin:0 0 .5rem}
.error::before{content:"Error: "}
.correcto{color:var(--correcto);font-weight:600}
input[type=text]{display:block;width:100%;max-width:100%;min-height:44px;padding:.5rem .75rem;font:inherit;font-size:1rem;letter-spacing:.08em;text-transform:uppercase;color:var(--texto);background:var(--superficie);border:2px solid var(--control);border-radius:.5rem}
input[aria-invalid=true]{border-color:var(--error)}
.boton{display:inline-flex;align-items:center;justify-content:center;min-height:44px;min-width:44px;margin-top:1rem;padding:.5rem 1.25rem;font:inherit;font-weight:600;color:var(--sobre-acento);background:var(--acento);border:2px solid var(--acento);border-radius:.5rem;text-decoration:none;cursor:pointer;max-width:100%;text-align:center}
:focus-visible{outline:3px solid var(--foco);outline-offset:2px}
@media (forced-colors:active){.tarjeta,input[type=text]{border-color:CanvasText}.boton{border-color:ButtonText;color:ButtonText;background:ButtonFace}:focus-visible{outline-color:Highlight}}
`;

export const HUELLA_ESTILO = `sha256-${createHash("sha256").update(ESTILO, "utf8").digest("base64")}`;

export const CSP_PANTALLA = `default-src 'none'; style-src '${HUELLA_ESTILO}'; form-action 'self'; base-uri 'none'; frame-ancestors 'none'`;

// Escapado para HTML en texto y en atributos entre comillas dobles. Los caracteres de control y los
// separadores de línea Unicode se sustituyen por U+FFFD (no tienen sitio en un valor de campo).
const CONTROL = new RegExp("[\u0000-\u001f\u007f\u2028\u2029]", "g");

export function escaparHtml(valor: string): string {
  return valor
    .replaceAll(CONTROL, String.fromCharCode(0xfffd))
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;")
    .replaceAll("`", "&#96;");
}

function esAsistente(valor: unknown): valor is AsistenteCallback {
  return typeof valor === "string" && Object.hasOwn(CALLBACKS, valor);
}

const esTexto = (valor: unknown): valor is string => typeof valor === "string";

// `state` opaco del asistente: ASCII imprimible, hasta 512 caracteres (descarta también sustitutos sueltos).
const STATE_VALIDO = /^[ -~]{1,512}$/;
const esState = (valor: unknown): valor is string => esTexto(valor) && STATE_VALIDO.test(valor);

// Identificadores generados por el servidor: alfabeto no reservado de URL, 1 a 256 caracteres.
const ID_VALIDO = /^[A-Za-z0-9._~-]{1,256}$/;
const esId = (valor: unknown): valor is string => esTexto(valor) && ID_VALIDO.test(valor);

// Emisor (iss): ASCII imprimible, 1 a 512 caracteres.
const ISS_VALIDO = /^[ -~]{1,512}$/;
const esIss = (valor: unknown): valor is string => esTexto(valor) && ISS_VALIDO.test(valor);

function pagina(cuerpo: string): string {
  return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>Activar el conector de HumanaIA</title>
<style>${ESTILO}</style>
</head>
<body>
<main>
<div class="tarjeta">
<h1>${TEXTOS.titulo}</h1>
${cuerpo}
</div>
</main>
</body>
</html>
`;
}

const aviso = (texto: string): string => `<p class="error" role="alert">${texto}</p>`;

function formulario(e: Extract<EstadoPantalla, { tipo: "formulario" }>): string {
  const error = e.codigoNoValido === true;
  const descripcion = error ? "error-codigo ayuda-codigo" : "ayuda-codigo";
  return `<p>Vas a conectar: <strong>${NOMBRES[e.asistente]}</strong></p>
<p class="ayuda">${TEXTOS.soloSiEmpezaste}</p>
<form method="post" action="/oauth/autorizar">
<input type="hidden" name="solicitud" value="${escaparHtml(e.solicitud)}">
<input type="hidden" name="asistente" value="${e.asistente}">
<input type="hidden" name="state" value="${escaparHtml(e.state)}">
<label for="codigo">Código de activación</label>
<p class="ayuda" id="ayuda-codigo">Te lo da HumanaIA. Caduca a los 10 minutos y solo sirve una vez.</p>
${error ? `<p class="error" id="error-codigo" role="alert">${TEXTOS.codigoNoValido}</p>\n` : ""}<input type="text" id="codigo" name="codigo" autocomplete="one-time-code" autocapitalize="characters" spellcheck="false" required aria-describedby="${descripcion}"${error ? ' aria-invalid="true" autofocus' : ""}>
<button class="boton" type="submit">Activar</button>
</form>`;
}

function enlaceContinuar(e: Extract<EstadoPantalla, { tipo: "aceptado" }>): string {
  const destino =
    `${CALLBACKS[e.asistente]}?code=${encodeURIComponent(e.codigo)}` +
    `&state=${encodeURIComponent(e.state)}&iss=${encodeURIComponent(e.iss)}`;
  return `<p class="correcto" role="status">Código aceptado.</p>
<a class="boton" href="${escaparHtml(destino)}">Continuar en ${NOMBRES[e.asistente]}</a>`;
}

function respuesta(estado: number, cuerpo: string): RespuestaPantalla {
  return {
    estado,
    html: pagina(cuerpo),
    cabeceras: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-store",
      "content-security-policy": CSP_PANTALLA,
    },
  };
}

const noDisponible = (): RespuestaPantalla => respuesta(503, aviso(TEXTOS.noDisponible));

export function renderizarPantalla(e: EstadoPantalla): RespuestaPantalla {
  if (typeof e !== "object" || e === null) return noDisponible();
  switch (e.tipo) {
    case "formulario":
      if (!esAsistente(e.asistente) || !esState(e.state) || !esId(e.solicitud)) {
        return noDisponible();
      }
      return respuesta(200, formulario(e));
    case "bloqueado":
      return respuesta(429, aviso(TEXTOS.bloqueado));
    case "solicitud_no_valida":
      return respuesta(400, aviso(TEXTOS.solicitudNoValida));
    case "no_disponible":
      return noDisponible();
    case "aceptado":
      if (!esAsistente(e.asistente) || !esId(e.codigo) || !esState(e.state) || !esIss(e.iss)) {
        return noDisponible();
      }
      try {
        return respuesta(200, enlaceContinuar(e));
      } catch {
        return noDisponible(); // defensa: nunca una excepción al llamador
      }
    default:
      return noDisponible();
  }
}
