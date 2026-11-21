// Apoyo de las pruebas de activación y tokens (T-110 c y d, 001): monta las tres funciones sobre PGlite con el
// rol de gestión y recorre el ciclo real (solicitud, activación, canje). No es una prueba. Valores ficticios
// compuestos en ejecución (arts. 1 y 4).
import { createHash, randomBytes } from "node:crypto";
import { crearActivar } from "../../../src/lib/oauth/activacion";
import { nuevoCodigoActivacion, normalizarCodigo } from "../../../src/lib/oauth/codigo-activacion";
import { crearAutorizar } from "../../../src/lib/oauth/peticion";
import { derivarClaves, huellaToken } from "../../../src/lib/oauth/secretos";
import { crearToken } from "../../../src/lib/oauth/tokens";
import { cargarConfiguracionConector } from "../../../src/lib/plataforma/configuracion";
import {
  crearAutorizacion,
  type AdaptadorAutorizacion,
} from "../../../src/lib/supabase/autorizacion";
import { crearAlmacenPglite, type BdApoyo } from "../../conector/apoyo/index";
import { SECRETO, URL_PUBLICA } from "./apoyo-oauth";
import {
  abrir,
  CB_CHATGPT,
  CB_CLAUDE,
  ESQUEMA,
  gestion,
  hmacDe,
  idDcr,
  ROL_GESTION,
  una,
} from "./bd/comun";

export const RECURSO = `${URL_PUBLICA}/api/mcp`;
export const claves = (): ReturnType<typeof derivarClaves> => derivarClaves(SECRETO);

export interface Ciclo {
  bd: BdApoyo;
  cliente: string;
  llamadas: string[];
  get: (u: string) => Promise<Response>;
  post: (p: Request) => Promise<Response>;
  token: (p: Request) => Promise<Response>;
}

// Cada prueba crea su PGlite (memoria WebAssembly): se cierran al acabar cada una, no al final del fichero.
const creados: BdApoyo[] = [];
export async function cerrarCiclos(): Promise<void> {
  while (creados.length > 0) await creados.pop()?.cerrar();
}

export async function montarCiclo(
  opciones: { local?: boolean; sustituir?: (funcion: string) => unknown } = {},
): Promise<Ciclo> {
  const bd = await abrir();
  creados.push(bd);
  const real = await crearAlmacenPglite(bd, ROL_GESTION);
  const cliente = idDcr();
  const alta = await gestion(bd, "registrar_cliente_dcr", [
    hmacDe("origen"),
    cliente,
    [CB_CLAUDE, CB_CHATGPT],
  ]);
  if (alta.resultado !== "registrado") throw new Error("preparación");
  const llamadas: string[] = [];
  const adaptador: AdaptadorAutorizacion = {
    llamar: (funcion, argumentos) => {
      llamadas.push(funcion);
      const falso = opciones.sustituir?.(funcion);
      if (falso !== undefined) {
        return falso instanceof Error ? Promise.reject(falso) : Promise.resolve(falso);
      }
      return real.llamar(funcion, argumentos);
    },
  };
  const autorizacion = () => crearAutorizacion(adaptador);
  const g = crearAutorizar({
    configuracion: cargarConfiguracionConector,
    autorizacion,
    fetch: (() => Promise.reject(new Error("sin red"))) as typeof fetch,
    urlsCimd: [],
  });
  const p = crearActivar({
    configuracion: cargarConfiguracionConector,
    autorizacion,
    local: () => opciones.local ?? true,
  });
  const t = crearToken({ configuracion: cargarConfiguracionConector, autorizacion });
  return { bd, cliente, llamadas, get: (u) => g(new Request(u)), post: p, token: t };
}

export const nuevoVerificador = (): string => randomBytes(32).toString("base64url");
export const desafioDe = (v: string): string => createHash("sha256").update(v).digest("base64url");

export interface Solicitud {
  id: string;
  cookie: string;
  state: string;
  verificador: string;
  callback: string;
}

/** GET /oauth/autorizar correcto: devuelve el identificador de la solicitud y la cookie de la respuesta. */
export async function abrirSolicitud(
  c: Ciclo,
  opciones: { state?: string; callback?: string; verificador?: string } = {},
): Promise<Solicitud> {
  const verificador = opciones.verificador ?? nuevoVerificador();
  const callback = opciones.callback ?? CB_CLAUDE;
  const state = opciones.state ?? "estado-" + randomBytes(6).toString("hex");
  const q = new URLSearchParams({
    client_id: c.cliente,
    redirect_uri: callback,
    response_type: "code",
    code_challenge: desafioDe(verificador),
    code_challenge_method: "S256",
    resource: RECURSO,
    state,
  });
  const r = await c.get(`${URL_PUBLICA}/oauth/autorizar?${q.toString()}`);
  if (r.status !== 200) throw new Error("preparación: la solicitud no se abrió");
  const html = await r.text();
  const id = /name="solicitud" value="([^"]+)"/.exec(html)![1]!;
  const cookie = /^__Host-activacion=([^;]+);/.exec(r.headers.get("set-cookie")!)![1]!;
  return { id, cookie, state, verificador, callback };
}

/** Código de activación vigente de una licencia: devuelve el texto que teclearía la persona. */
export async function sembrarCodigo(bd: BdApoyo, tipo: "A" | "B" = "A"): Promise<string> {
  const codigo = nuevoCodigoActivacion();
  const { id } = await una<{ id: string }>(
    bd,
    `select id::text from ${ESQUEMA}.licencias where tipo = $1`,
    [tipo],
  );
  await bd.db.query(
    `insert into ${ESQUEMA}.codigos_activacion (licencia_id, codigo_hmac, caduca_en)
     values ($1, $2, now() + interval '10 minutes')`,
    [id, huellaToken(claves(), "codigo_activacion", normalizarCodigo(codigo)!)],
  );
  return codigo;
}

export interface CamposPost {
  solicitud?: string;
  asistente?: string;
  /** `null`: el campo no se envía. */
  state?: string | null;
  codigo?: string;
  extra?: [string, string][];
}
export interface OpcionesPost {
  origin?: string | null;
  cookie?: string | null;
  tipo?: string | null;
  cuerpo?: string;
  cabeceras?: Record<string, string>;
}

/** POST /oauth/autorizar tal como lo enviaría el formulario de la pantalla. */
export function peticionPost(s: Solicitud, campos: CamposPost, o: OpcionesPost = {}): Request {
  const f = new URLSearchParams();
  const valores: [string, string | null | undefined][] = [
    ["solicitud", campos.solicitud ?? s.id],
    ["asistente", campos.asistente ?? (s.callback === CB_CHATGPT ? "chatgpt" : "claude")],
    ["state", campos.state === undefined ? s.state : campos.state],
    ["codigo", campos.codigo ?? ""],
  ];
  for (const [k, v] of valores) if (v !== undefined && v !== null) f.append(k, v);
  for (const [k, v] of campos.extra ?? []) f.append(k, v);
  const h = new Headers(o.cabeceras);
  if (o.origin !== null) h.set("origin", o.origin ?? URL_PUBLICA);
  if (o.cookie !== null) h.set("cookie", `__Host-activacion=${o.cookie ?? s.cookie}`);
  if (o.tipo !== null) h.set("content-type", o.tipo ?? "application/x-www-form-urlencoded");
  return new Request(`${URL_PUBLICA}/oauth/autorizar`, {
    method: "POST",
    headers: h,
    body: o.cuerpo ?? f.toString(),
  });
}

/** Recorre solicitud y activación y devuelve el código de autorización de la página «aceptado». */
export async function activarCompleto(
  c: Ciclo,
  opciones: { callback?: string; tipo?: "A" | "B"; verificador?: string } = {},
): Promise<{ solicitud: Solicitud; codigoAut: string }> {
  const s = await abrirSolicitud(c, {
    callback: opciones.callback,
    verificador: opciones.verificador,
  });
  const codigo = await sembrarCodigo(c.bd, opciones.tipo ?? "A");
  const r = await c.post(peticionPost(s, { codigo }));
  const html = await r.text();
  const m = /code=([A-Za-z0-9_-]{43})&amp;state=/.exec(html);
  if (r.status !== 200 || m === null) throw new Error("preparación: la activación falló");
  return { solicitud: s, codigoAut: m[1]! };
}

export function peticionToken(
  campos: Record<string, string | undefined>,
  cabeceras: Record<string, string> = {},
): Request {
  const f = new URLSearchParams();
  for (const [k, v] of Object.entries(campos)) if (v !== undefined) f.append(k, v);
  return new Request(`${URL_PUBLICA}/oauth/token`, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded", ...cabeceras },
    body: f.toString(),
  });
}

export interface Par {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
}

/** Ciclo completo hasta tener el par emitido. */
export async function emitirPar(
  c: Ciclo,
  callback = CB_CLAUDE,
): Promise<{ par: Par; solicitud: Solicitud }> {
  const { solicitud, codigoAut } = await activarCompleto(c, { callback });
  const r = await c.token(
    peticionToken({
      grant_type: "authorization_code",
      code: codigoAut,
      redirect_uri: callback,
      client_id: c.cliente,
      code_verifier: solicitud.verificador,
    }),
  );
  if (r.status !== 200) throw new Error("preparación: el canje falló");
  return { par: (await r.json()) as Par, solicitud };
}
