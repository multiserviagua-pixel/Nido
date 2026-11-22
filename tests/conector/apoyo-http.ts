// Servidor en proceso para las pruebas transversales de la 001 (T-112). No es una prueba: no termina en
// .test.ts. Despacha `Request` a los manejadores reales de `src/app/**/route.ts` (los mismos que ejecuta
// Next) con la base de PGlite detrás de los dos roles (mcp y gestión), sin red ni puerto. Todo valor es
// ficticio y se compone en ejecución (arts. 1 y 4).
//
// Uso en cada prueba (los `vi.mock` se elevan, por eso van en el archivo de la prueba):
//   vi.mock("../../src/lib/supabase/conector", async (o) => (await import("./apoyo-http")).sustitutoConector(await o()));
//   vi.mock("../../src/lib/supabase/autorizacion", async (o) => (await import("./apoyo-http")).sustitutoAutorizacion(await o()));
//   vi.mock("next/server", async (o) => (await import("./apoyo-http")).sustitutoNextServer(await o()));
import { createHash, createHmac, randomBytes } from "node:crypto";
import { vi } from "vitest";
import { derivarClaves } from "../../src/lib/oauth/secretos";
import { crearAlmacen, type Almacen } from "../../src/lib/supabase/almacen";
import { crearAutorizacion, type Autorizacion } from "../../src/lib/supabase/autorizacion";
import { entornoConector, SECRETO, URL_PUBLICA } from "../unit/conector/apoyo-oauth";
import {
  abrir,
  ESQUEMA,
  fabrica as fabricaComun,
  ROL_GESTION,
  ROL_MCP,
  sembrar,
  type Sembrado,
} from "../unit/conector/bd/comun";
import { crearAlmacenPglite, crearFabrica, type AlmacenPrueba, type BdApoyo } from "./apoyo/index";

export { URL_PUBLICA, SECRETO, ESQUEMA };
export const RECURSO = `${URL_PUBLICA}/api/mcp`;
export const CB_CLAUDE = "https://claude.ai/api/mcp/auth_callback";
export const CB_CHATGPT = "https://chatgpt.com/connector_platform_oauth_redirect";

// ---- Pasarela: lo que los módulos sustituidos devuelven a las rutas ---------------------------------------
export const pasarela: { almacen: Almacen | null; autorizacion: Autorizacion | null } = {
  almacen: null,
  autorizacion: null,
};
export const pendientes: Promise<unknown>[] = [];

export function sustitutoConector<T extends object>(real: T): T {
  return {
    ...real,
    almacenDelConector: () => {
      if (pasarela.almacen === null) throw new Error("sin almacén de prueba");
      return pasarela.almacen;
    },
  };
}
export function sustitutoAutorizacion<T extends object>(real: T): T {
  return {
    ...real,
    autorizacionDelConector: () => {
      if (pasarela.autorizacion === null) throw new Error("sin autorización de prueba");
      return pasarela.autorizacion;
    },
  };
}
/** `after` de Next fuera de una petición real no corre: aquí se recoge y la prueba espera los sucesos. */
export function sustitutoNextServer<T extends object>(real: T): T {
  return {
    ...real,
    after: (tarea: unknown) => {
      const p =
        typeof tarea === "function" ? Promise.resolve().then(tarea as () => unknown) : tarea;
      pendientes.push(Promise.resolve(p).catch(() => undefined));
    },
  };
}

// ---- Servidor ---------------------------------------------------------------------------------------------
type Modulo = Record<string, (p: Request) => Promise<Response>>;
const RUTAS: Record<string, () => Promise<Modulo>> = {
  "/api/mcp": () => import("../../src/app/api/mcp/route") as unknown as Promise<Modulo>,
  "/api/operacion": () => import("../../src/app/api/operacion/route") as unknown as Promise<Modulo>,
  "/api/salud": () => import("../../src/app/api/salud/route") as unknown as Promise<Modulo>,
  "/oauth/registro": () =>
    import("../../src/app/oauth/registro/route") as unknown as Promise<Modulo>,
  "/oauth/autorizar": () =>
    import("../../src/app/oauth/autorizar/route") as unknown as Promise<Modulo>,
  "/oauth/token": () => import("../../src/app/oauth/token/route") as unknown as Promise<Modulo>,
  "/.well-known/oauth-authorization-server": () =>
    import("../../src/app/.well-known/oauth-authorization-server/route") as unknown as Promise<Modulo>,
  "/.well-known/oauth-protected-resource": () =>
    import("../../src/app/.well-known/oauth-protected-resource/[[...ruta]]/route") as unknown as Promise<Modulo>,
};

function rutaDe(pathname: string): string | null {
  if (pathname.startsWith("/.well-known/oauth-protected-resource"))
    return "/.well-known/oauth-protected-resource";
  return pathname in RUTAS ? pathname : null;
}

export interface Fallos {
  /** Funciones del almacén (rol mcp) que fallan; `"todas"` = almacén caído. */
  almacen: Set<string> | "todas" | null;
  /** Funciones del rol de gestión que fallan. */
  autorizacion: Set<string> | "todas" | null;
  /** Funciones que se ejecutan y cuya respuesta se pierde (el error llega después de escribir). */
  despues: Set<string>;
}

export interface Servidor {
  bd: BdApoyo;
  fabrica: ReturnType<typeof crearFabrica>;
  fallos: Fallos;
  /** Nombre de cada función de la base llamada, en orden (almacén y gestión). */
  llamadas: string[];
  /** Todo lo que la aplicación escribió en la consola. */
  consola: string[];
  /** Credencial de operación ficticia (su SHA-256 es `OPERACION_HUELLA`). */
  credencialOperacion: string;
  fetch(url: string, init?: RequestInit): Promise<Response>;
  enviar(peticion: Request): Promise<Response>;
  sembrar(tipo: "A" | "B", asistente?: "claude" | "chatgpt" | "otro"): Promise<Sembrado>;
  mcp(token: string | null, cuerpo: unknown, cabeceras?: Record<string, string>): Promise<Response>;
  herramienta(token: string, nombre: string, argumentos: unknown): Promise<Resultado>;
  operar(operacion: string, argumentos?: unknown): Promise<{ status: number; json: unknown }>;
  esperarSucesos(): Promise<void>;
  cerrar(): Promise<void>;
}

export interface Resultado {
  status: number;
  json: { result?: Record<string, unknown>; error?: { code: number; message: string } } | null;
  texto: string;
  contenido: Record<string, unknown> | null;
}

function envolver(
  base: AlmacenPrueba,
  lista: () => Set<string> | "todas" | null,
  despues: () => Set<string>,
  registro: string[],
) {
  return {
    llamar: async (funcion: string, argumentos: unknown[]) => {
      registro.push(funcion);
      const f = lista();
      if (f === "todas" || (f !== null && f.has(funcion))) throw new Error("fallo inyectado");
      const r = await base.llamar(funcion, argumentos);
      // Respuesta perdida: la función se ejecutó en la base y a la aplicación le llega un error.
      if (despues().has(funcion)) throw new Error("respuesta perdida inyectada");
      return r;
    },
  };
}

export async function montarServidor(): Promise<Servidor> {
  entornoConector();
  const credencialOperacion = "hia_" + "op_" + randomBytes(32).toString("base64url");
  vi.stubEnv("OPERACION_HUELLA", createHash("sha256").update(credencialOperacion).digest("hex"));
  const claves = derivarClaves(SECRETO);
  const fabrica = crearFabrica({
    hmac: (m) => createHmac("sha256", claves.guardado).update(m).digest("hex"),
  });
  const bd = await abrir();
  const fallos: Fallos = { almacen: null, autorizacion: null, despues: new Set() };
  const llamadas: string[] = [];
  pasarela.almacen = crearAlmacen(
    envolver(
      await crearAlmacenPglite(bd, ROL_MCP),
      () => fallos.almacen,
      () => fallos.despues,
      llamadas,
    ),
  );
  pasarela.autorizacion = crearAutorizacion(
    envolver(
      await crearAlmacenPglite(bd, ROL_GESTION),
      () => fallos.autorizacion,
      () => fallos.despues,
      llamadas,
    ),
  );
  pendientes.length = 0;
  const consola: string[] = [];
  for (const m of ["log", "error", "warn", "info", "debug"] as const) {
    vi.spyOn(console, m).mockImplementation((...a: unknown[]) => {
      consola.push(a.map((x) => (typeof x === "string" ? x : JSON.stringify(x))).join(" "));
    });
  }

  const esperarSucesos = async (): Promise<void> => {
    while (pendientes.length > 0) await Promise.all(pendientes.splice(0));
  };

  const enviar = async (peticion: Request): Promise<Response> => {
    const ruta = rutaDe(new URL(peticion.url).pathname);
    if (ruta === null) return new Response(null, { status: 404 });
    const modulo = await RUTAS[ruta]!();
    const manejador = modulo[peticion.method];
    if (manejador === undefined) return new Response(null, { status: 405 });
    const respuesta = await manejador(peticion);
    // El suceso tras responder corre aquí antes de devolver: la base es de una sola conexión y una consulta
    // de la prueba no debe mezclarse con el `set role` de esa tarea.
    await esperarSucesos();
    return respuesta;
  };

  const despachar = (url: string, init?: RequestInit): Promise<Response> =>
    enviar(new Request(url, init));

  const cuerpoRpc = (cuerpo: unknown) =>
    typeof cuerpo === "string" ? cuerpo : JSON.stringify(cuerpo);
  const mcp: Servidor["mcp"] = (token, cuerpo, cabeceras = {}) =>
    despachar(RECURSO, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        accept: "application/json, text/event-stream",
        ...(token === null ? {} : { authorization: `Bearer ${token}` }),
        ...cabeceras,
      },
      body: cuerpoRpc(cuerpo),
    });

  return {
    bd,
    fabrica,
    fallos,
    llamadas,
    consola,
    credencialOperacion,
    fetch: despachar,
    enviar,
    sembrar: (tipo, asistente = "claude") => sembrar(bd, tipo, asistente, fabrica, RECURSO),
    mcp,
    async herramienta(token, nombre, argumentos) {
      const r = await mcp(token, {
        jsonrpc: "2.0",
        id: 1,
        method: "tools/call",
        params: { name: nombre, arguments: argumentos },
      });
      const texto = await r.text();
      const linea = texto.split("\n").find((l) => l.startsWith("data: "));
      let json: Resultado["json"] = null;
      try {
        json = JSON.parse(linea ? linea.slice(6) : texto) as Resultado["json"];
      } catch {
        json = null;
      }
      const contenido =
        (json?.result?.structuredContent as Record<string, unknown> | undefined) ?? null;
      return { status: r.status, json, texto, contenido };
    },
    async operar(operacion, argumentos = {}) {
      const r = await despachar(`${URL_PUBLICA}/api/operacion`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${credencialOperacion}`,
        },
        body: JSON.stringify({ operacion, argumentos }),
      });
      const t = await r.text();
      let json: unknown = null;
      try {
        json = JSON.parse(t);
      } catch {
        json = t;
      }
      return { status: r.status, json };
    },
    esperarSucesos,
    async cerrar() {
      pasarela.almacen = null;
      pasarela.autorizacion = null;
    },
  };
}

export { fabricaComun };

/** Informe válido del contrato, con cifras ficticias. */
export function informeValido(): Record<string, unknown> {
  return {
    estado: "ok",
    modo: "conversacion",
    asistente: "claude",
    almacenamiento: "drive",
    version_prompt: "0.1",
    frecuencia_horas: 24,
    tratados: 1,
    sin_tratar: 0,
    borradores: 0,
    documentos: 0,
    facturas_pendientes: 0,
    urgentes: 0,
    comprobaciones: { correo: true, almacenamiento: true, contexto: true, registro: true },
    problemas: [],
  };
}

// ---- Pasos del flujo OAuth sobre el servidor en proceso ---------------------------------------------------
import {
  desafioDe,
  nuevoVerificador,
  peticionPost,
  peticionToken,
  type Solicitud,
} from "../unit/conector/apoyo-oauth-ciclo";
export { peticionPost, peticionToken, type Solicitud };
import { randomBytes as aleatorio } from "node:crypto";

/** Alta DCR con los callbacks pedidos; devuelve el `client_id` (o el estado si no se registra). */
export async function registrarCliente(
  s: Servidor,
  callbacks: string[] = [CB_CLAUDE, CB_CHATGPT],
): Promise<string> {
  const r = await s.fetch(`${URL_PUBLICA}/oauth/registro`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ redirect_uris: callbacks, token_endpoint_auth_method: "none" }),
  });
  const j = (await r.json()) as { client_id?: string };
  if (r.status !== 201 || typeof j.client_id !== "string") throw new Error("preparación: DCR");
  return j.client_id;
}

/** `GET /oauth/autorizar` correcto: solicitud abierta y cookie. */
export async function abrirSolicitud(
  s: Servidor,
  cliente: string,
  o: { callback?: string; verificador?: string } = {},
): Promise<Solicitud> {
  const verificador = o.verificador ?? nuevoVerificador();
  const callback = o.callback ?? CB_CLAUDE;
  const state = "estado-" + aleatorio(6).toString("hex");
  const q = new URLSearchParams({
    client_id: cliente,
    redirect_uri: callback,
    response_type: "code",
    code_challenge: desafioDe(verificador),
    code_challenge_method: "S256",
    resource: RECURSO,
    state,
  });
  const r = await s.fetch(`${URL_PUBLICA}/oauth/autorizar?${q.toString()}`);
  if (r.status !== 200) throw new Error("preparación: la solicitud no se abrió");
  const html = await r.text();
  const id = /name="solicitud" value="([^"]+)"/.exec(html)![1]!;
  const cookie = /^__Host-activacion=([^;]+);/.exec(r.headers.get("set-cookie")!)![1]!;
  return { id, cookie, state, verificador, callback };
}

/** Código de activación pedido por la vía de la persona (`/api/operacion`). */
export async function generarCodigo(s: Servidor, tipo: "A" | "B" = "A"): Promise<string> {
  const r = await s.operar("generar_codigo", { tipo });
  const codigo = (r.json as { codigo?: string }).codigo;
  if (r.status !== 200 || typeof codigo !== "string") throw new Error("preparación: código");
  return codigo;
}

/** `POST /oauth/autorizar`; devuelve estado, HTML y el código de autorización si lo hay. */
export async function activar(
  s: Servidor,
  sol: Solicitud,
  codigo: string,
): Promise<{ status: number; html: string; codigoAut: string | null }> {
  const r = await s.enviar(peticionPost(sol, { codigo }));
  const html = await r.text();
  const m = /code=([A-Za-z0-9_-]{43})&amp;state=/.exec(html);
  return { status: r.status, html, codigoAut: m ? m[1]! : null };
}

export async function canjear(
  s: Servidor,
  cliente: string,
  sol: Solicitud,
  codigoAut: string,
): Promise<Response> {
  return s.enviar(
    peticionToken({
      grant_type: "authorization_code",
      code: codigoAut,
      redirect_uri: sol.callback,
      client_id: cliente,
      code_verifier: sol.verificador,
    }),
  );
}

export async function renovar(s: Servidor, cliente: string, refresh: string): Promise<Response> {
  return s.enviar(
    peticionToken({ grant_type: "refresh_token", refresh_token: refresh, client_id: cliente }),
  );
}

export interface ParTokens {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
}

/** Alta, activación y canje completos: devuelve cliente, solicitud y par. */
export async function ciclo(
  s: Servidor,
  tipo: "A" | "B" = "A",
  callback = CB_CLAUDE,
): Promise<{ cliente: string; sol: Solicitud; par: ParTokens; codigoAut: string }> {
  const cliente = await registrarCliente(s);
  const sol = await abrirSolicitud(s, cliente, { callback });
  const a = await activar(s, sol, await generarCodigo(s, tipo));
  if (a.codigoAut === null) throw new Error("preparación: activación");
  const r = await canjear(s, cliente, sol, a.codigoAut);
  if (r.status !== 200) throw new Error("preparación: canje");
  return { cliente, sol, par: (await r.json()) as ParTokens, codigoAut: a.codigoAut };
}
