import { CODIGOS, type Codigo } from "../registro/codigos";
import { registrar } from "../registro/registro";
import { cargarConfiguracion, RE_DSN, type Configuracion } from "./configuracion";

// Supervisión en Sentry UE (Fráncfort) sin SDK (002 diseño §Supervisión, V-112): un SDK captura la
// petición. Aquí se construye a mano un evento cerrado y se envía con `fetch` al ingreso por
// «envelope». Solo salen enteros, un valor de entorno y listas cerradas: ningún mensaje, traza,
// URL, cabecera ni valor recibido (art. 1). Un fallo del envío nunca bloquea ni cambia la
// respuesta (art. 3): una sola vez, 2 s como mucho, sin reintento ni cola.

// Códigos que pueden salir: la lista de codigos.ts menos los de la propia supervisión, la consola y
// los rechazos anónimos del punto MCP (solo consola: el tráfico anónimo no debe llenar Sentry).
const EXCLUIDOS: readonly Codigo[] = [
  "supervision_no_disponible",
  "salida_no_estructurada",
  "metodo_no_permitido",
  "origen_no_permitido",
  "cuerpo_demasiado_grande",
  "sin_token",
  "token_no_valido",
];
export const CODIGOS_SUPERVISADOS: readonly Codigo[] = CODIGOS.filter(
  (c) => !EXCLUIDOS.includes(c),
);

// Plantillas de ruta conocidas (las fija quien escribe la ruta, nunca la pedida). Cualquier otra
// cosa, incluida una ruta con segmentos dinámicos o consulta, sale como «/desconocida». Quien añada
// una ruta nueva la añade aquí.
export const RUTAS_SUPERVISADAS: readonly string[] = [
  "/",
  "/api/salud",
  "/api/mcp",
  "/api/operacion",
  "/.well-known/oauth-protected-resource",
  "/.well-known/oauth-authorization-server",
];
const RUTA_DESCONOCIDA = "/desconocida";

const ENTORNOS_ENVIABLES: readonly string[] = ["desarrollo", "preproduccion", "produccion"];
const RE_HUELLA = /^[0-9a-f]{7,40}$/i;

const METODOS: readonly string[] = ["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"];

const ESPERA_MS = 2000;
const VENTANA_MS = 60_000;
const MAXIMO_POR_VENTANA = 20;

export interface EntradaEvento {
  readonly ruta: string;
  readonly codigo: Codigo;
  readonly metodo?: string;
}

export interface OpcionesEnvio {
  readonly configuracion?: Configuracion;
  readonly fetch?: typeof fetch;
}

// Ventana deslizante por instancia (módulo): como mucho 20 envíos por minuto y, además, 1 por
// huella [ruta, codigo] en 60 s, para que una ráfaga de un mismo error no agote el cupo de los demás.
// Las huellas son de listas cerradas (ya normalizadas): no hay valores recibidos ni crecimiento sin
// límite (6 rutas por 9 códigos como mucho).
let envios: number[] = [];
let huellas = new Map<string, number>();
export function reiniciarLimite(): void {
  envios = [];
  huellas = new Map();
}
function hayCupo(ahora: number, huella: string): boolean {
  envios = envios.filter((t) => ahora - t < VENTANA_MS);
  for (const [h, t] of huellas) if (ahora - t >= VENTANA_MS) huellas.delete(h);
  if (envios.length >= MAXIMO_POR_VENTANA) return false;
  if (huellas.has(huella)) return false;
  envios.push(ahora);
  huellas.set(huella, ahora);
  return true;
}

function identificador(): string {
  return crypto.randomUUID().replaceAll("-", "");
}

// DSN ya validado por configuracion.ts (RE_DSN): https://<clave>@<host>/<proyecto>.
function destino(dsn: string): { url: string; clave: string } | undefined {
  const m = RE_DSN.exec(dsn);
  if (m === null) return undefined;
  return { url: `https://${m[2]}/api/${m[3]}/envelope/`, clave: m[1]! };
}

function fallo(ruta: string): void {
  registrar("aviso", "supervision_no_disponible", ruta);
}

// Nunca lanza ni rechaza. Quien llama puede esperarla (como mucho 2 s) o no.
export async function enviarEvento(
  entrada: EntradaEvento,
  opciones: OpcionesEnvio = {},
): Promise<void> {
  try {
    let configuracion = opciones.configuracion;
    if (configuracion === undefined) {
      try {
        configuracion = cargarConfiguracion();
      } catch {
        // Configuración inválida: no se envía. En el camino del manejador nadie lo registra aquí, así
        // que `configuracion_invalida` no llega a Sentry: se detecta por el monitor externo
        // (UptimeRobot sobre /api/salud) y por el registro, no por Sentry.
        return;
      }
    }
    const dsn = configuracion.supervisionDsn;
    if (dsn === undefined) return; // desarrollo: sin petición
    const donde = destino(dsn);
    if (donde === undefined) return;

    // Todo valor se normaliza a lista cerrada antes de construir nada.
    const ruta = RUTAS_SUPERVISADAS.includes(entrada.ruta) ? entrada.ruta : RUTA_DESCONOCIDA;
    const codigo: Codigo = CODIGOS_SUPERVISADOS.includes(entrada.codigo)
      ? entrada.codigo
      : "error_no_controlado";
    const metodo =
      typeof entrada.metodo === "string" && METODOS.includes(entrada.metodo)
        ? entrada.metodo
        : "otro";

    const ahora = Date.now();
    if (!hayCupo(ahora, `${ruta}|${codigo}`)) return;

    const id = identificador();
    const evento = {
      event_id: id,
      timestamp: Math.floor(ahora / 1000),
      // «node» y no «javascript»: Sentry trata distinto las plataformas de navegador (puede
      // deducir la IP del cliente); aquí no hay cliente. Fuente: develop.sentry.dev, event-payloads
      // (platform solo personaliza la interfaz), 20/11/2026; la deducción de IP por plataforma no
      // aparece en la documentación consultada: se evita por prudencia (art. 1).
      platform: "node",
      level: "error",
      environment: ENTORNOS_ENVIABLES.includes(configuracion.entorno)
        ? configuracion.entorno
        : "produccion",
      release:
        typeof configuracion.commitDesplegado === "string" &&
        RE_HUELLA.test(configuracion.commitDesplegado)
          ? configuracion.commitDesplegado
          : "desconocido",
      transaction: ruta,
      tags: { ruta, codigo, metodo },
      fingerprint: [ruta, codigo],
    };
    const cuerpo = [
      JSON.stringify({ event_id: id, sent_at: new Date(ahora).toISOString() }),
      JSON.stringify({ type: "event" }),
      JSON.stringify(evento),
    ].join("\n");

    const enviar = opciones.fetch ?? fetch;
    try {
      const respuesta = await enviar(donde.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-sentry-envelope",
          "X-Sentry-Auth": `Sentry sentry_version=7, sentry_key=${donde.clave}, sentry_client=nido/1`,
        },
        body: cuerpo,
        signal: AbortSignal.timeout(ESPERA_MS),
        cache: "no-store",
        redirect: "error",
      });
      const bien = respuesta.ok;
      void respuesta.body?.cancel().catch(() => undefined);
      if (!bien) fallo(ruta);
    } catch {
      fallo(ruta);
    }
  } catch {
    // Cierre en fallo: nada de lo anterior debe escapar.
    try {
      fallo(RUTA_DESCONOCIDA);
    } catch {
      /* sin más */
    }
  }
}
