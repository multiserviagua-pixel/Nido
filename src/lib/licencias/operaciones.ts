// Operaciones de HumanaIA (T-108 e, 001; diseño §Operaciones; REQ-017, REQ-019). `POST /api/operacion` y
// `npm run operar`: una persona de HumanaIA, con su credencial y sin desplegar, genera códigos, suspende y
// reactiva licencias, crea órdenes, revoca conexiones y cierra la prueba. Un token de conexión no puede
// nada de esto. Ninguna operación toca prompt, reglas ni contratos.
//
// Orden de la tubería (cada fallo responde y termina; todo lo recibido es dato, art. 7):
//  1. Entorno distinto de desarrollo y preproducción (producción incluida): 404 ANTES de leer nada
//     (ni cuerpo, ni cabeceras, ni configuración; art. 3).
//  2. Configuración del conector (C-1): si no vale, `configuracion_conector_invalida` (503 en HTTP).
//  3. Solo POST (405). 4. Consulta no vacía: 400, sin eco.
//  5. Origen (`x-vercel-forwarded-for`): ausente fuera de local, 403 sin evaluar nada.
//  6. Credencial `Bearer hia_op_` + 43 base64url contra `OPERACION_HUELLA` en TIEMPO CONSTANTE; sin ella
//     o mal formada, 401 sin contar; bien formada pero errónea, se cuenta el fallo por origen (5 en 15 min bloquean 15 min) y 401; origen bloqueado, 429.
//     Un origen bloqueado rechaza también la credencial válida (lo decide la función de la base).
//  7. Cuerpo de hasta 1 024 bytes, JSON, solo `operacion` y `argumentos`; argumentos exactos de la
//     operación, con su formato validado ANTES de llamar a la base. Lo que no vale: 400 sin eco.
//  8. Una función del rol de gestión; resultado de lista cerrada. `cerrada` y los demás resultados
//     se traducen a un estado fijo; un resultado desconocido nunca es éxito (autorizacion.ts lo deniega).
// Nada de lo recibido (credencial, cuerpo, consulta) se registra ni se devuelve. El código de activación
// solo se devuelve en la respuesta de `generar_codigo` (una vez) y en la base solo existe su HMAC.
import { derivarClaves, coincideHuellaOperacion, huellaToken } from "../oauth/secretos";
import { nuevoCodigoActivacion, normalizarCodigo } from "../oauth/codigo-activacion";
import { origenDePeticion } from "../oauth/origen";
import {
  cargarConfiguracionConector,
  esDesarrollo,
  leerEntornoOperable,
  type ConfiguracionConector,
  type Entorno,
} from "../plataforma/configuracion";
import { analizarJson } from "../plataforma/entrada";
import type { Codigo } from "../registro/codigos";
import { registrar } from "../registro/registro";
import { autorizacionDelConector, type Autorizacion } from "../supabase/autorizacion";

export const RUTA_OPERACION = "/api/operacion";
export const MAXIMO_CUERPO_OPERACION_BYTES = 1024;

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
} as const satisfies Record<string, readonly string[]>;
type Operacion = keyof typeof OPERACIONES;

const RE_UUID = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
const RE_DIA = /^([0-9]{4})-([0-9]{2})-([0-9]{2})$/;

function diaValido(dia: string): boolean {
  const m = RE_DIA.exec(dia);
  if (m === null) return false;
  const [anio, mes, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const f = new Date(Date.UTC(anio, mes - 1, d));
  return f.getUTCFullYear() === anio && f.getUTCMonth() === mes - 1 && f.getUTCDate() === d;
}

type Argumentos = Readonly<Record<string, unknown>>;
const esObjeto = (v: unknown): v is Record<string, unknown> =>
  v !== null && typeof v === "object" && !Array.isArray(v);
const esTipo = (v: unknown): v is "A" | "B" => v === "A" || v === "B";

// Cuerpo ya analizado -> operación y argumentos válidos, o null. Sin eco de lo recibido.
function validarCuerpo(cuerpo: unknown): { operacion: Operacion; argumentos: Argumentos } | null {
  if (!esObjeto(cuerpo)) return null;
  const claves = Object.keys(cuerpo);
  if (!claves.every((c) => c === "operacion" || c === "argumentos")) return null;
  const nombre = cuerpo.operacion;
  if (typeof nombre !== "string" || !Object.hasOwn(OPERACIONES, nombre)) return null;
  const operacion = nombre as Operacion;
  const argumentos = cuerpo.argumentos === undefined ? {} : cuerpo.argumentos;
  if (!esObjeto(argumentos)) return null;
  const esperadas: readonly string[] = OPERACIONES[operacion];
  const recibidas = Object.keys(argumentos);
  if (
    recibidas.length !== esperadas.length ||
    !esperadas.every((c) => Object.hasOwn(argumentos, c))
  ) {
    return null;
  }
  if (esperadas.includes("tipo") && !esTipo(argumentos.tipo)) return null;
  if (
    operacion === "crear_orden" &&
    argumentos.orden !== "pausar" &&
    argumentos.orden !== "reanudar"
  ) {
    return null;
  }
  if (
    operacion === "revocar_conexion" &&
    !(typeof argumentos.conexion === "string" && RE_UUID.test(argumentos.conexion))
  ) {
    return null;
  }
  if (
    operacion === "exportar_sucesos" &&
    !(typeof argumentos.dia === "string" && diaValido(argumentos.dia))
  ) {
    return null;
  }
  return { operacion, argumentos };
}

const CABECERAS = { "Cache-Control": "no-store", "Content-Type": "application/json" };
const respuesta = (estado: number, cuerpo: unknown): Response =>
  new Response(JSON.stringify(cuerpo), { status: estado, headers: CABECERAS });
const error = (estado: number, codigo: string, extra: Record<string, string> = {}): Response =>
  new Response(JSON.stringify({ error: codigo }), {
    status: estado,
    headers: { ...CABECERAS, ...extra },
  });

// Estado HTTP fijo de cada resultado de lista cerrada. Lo que no figura aquí no llega a ser éxito.
// Es un `Map`: un nombre heredado de Object.prototype (`constructor`, `__proto__`) no cuenta como resultado.
const ESTADO_RESULTADO: ReadonlyMap<string, number> = new Map([
  ["origen_bloqueado", 429],
  ["cerrada", 409],
  ["no_valido", 400],
  ["licencia_desconocida", 404],
  ["conexion_desconocida", 404],
  ["licencia_no_activa", 409],
]);
const EXITOS: ReadonlySet<string> = new Set([
  "generado",
  "suspendida",
  "reactivada",
  "sin_cambio",
  "creada",
  "listado",
  "revocada",
  "resumen",
  "exportado",
  "prueba_cerrada",
  "ya_cerrada",
]);

type Lectura =
  | { readonly tipo: "texto"; readonly texto: string }
  | { readonly tipo: "grande" }
  | { readonly tipo: "utf8" };

// Lee el cuerpo con tope en bytes; pasado el tope corta la lectura.
async function leerAcotado(peticion: Request): Promise<Lectura> {
  const declarado = peticion.headers.get("content-length");
  if (
    declarado !== null &&
    /^[0-9]{1,15}$/.test(declarado) &&
    Number(declarado) > MAXIMO_CUERPO_OPERACION_BYTES
  ) {
    await peticion.body?.cancel().catch(() => undefined);
    return { tipo: "grande" };
  }
  if (peticion.body === null) return { tipo: "texto", texto: "" };
  const lector = peticion.body.getReader();
  const partes: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await lector.read();
    if (done) break;
    total += value.byteLength;
    if (total > MAXIMO_CUERPO_OPERACION_BYTES) {
      await lector.cancel().catch(() => undefined);
      return { tipo: "grande" };
    }
    partes.push(value);
  }
  const bytes = new Uint8Array(total);
  let desplazamiento = 0;
  for (const parte of partes) {
    bytes.set(parte, desplazamiento);
    desplazamiento += parte.byteLength;
  }
  try {
    return { tipo: "texto", texto: new TextDecoder("utf-8", { fatal: true }).decode(bytes) };
  } catch {
    return { tipo: "utf8" };
  }
}

const RE_BEARER_OPERACION = /^Bearer (hia_op_[A-Za-z0-9_-]{43})$/;

export interface DependenciasOperaciones {
  /** Configuración validada del conector; lanza `configuracion_conector_invalida`. */
  readonly configuracion: () => ConfiguracionConector;
  /** Rol de gestión; en la batería, el de PGlite. Se pide solo cuando hace falta. */
  readonly autorizacion: () => Autorizacion;
  /** Entorno (`configuracion.ts`); solo desarrollo y preproducción operan. */
  readonly entorno: () => Entorno | undefined;
  /** `true` en local: el origen es fijo y no se exige la cabecera de la plataforma. */
  readonly local: () => boolean;
}

type Funcion = (peticion: Request) => Promise<Response>;

export function crearOperaciones(dependencias: DependenciasOperaciones): Funcion {
  const rechazo = (estado: number, codigo: Codigo, texto: string): Response => {
    registrar("aviso", codigo, RUTA_OPERACION);
    return error(estado, texto);
  };

  return async (peticion) => {
    // 1. Producción (o un entorno que no se reconoce): 404 sin leer nada.
    const entorno = dependencias.entorno();
    if (entorno !== "desarrollo" && entorno !== "preproduccion") {
      return new Response(null, { status: 404, headers: { "Cache-Control": "no-store" } });
    }
    // 2. Configuración.
    const configuracion = dependencias.configuracion();
    // 3. Solo POST.
    if (peticion.method !== "POST") {
      registrar("aviso", "metodo_no_permitido", RUTA_OPERACION);
      return new Response(null, {
        status: 405,
        headers: { "Cache-Control": "no-store", Allow: "POST" },
      });
    }
    // 4. Los argumentos van en el cuerpo: cualquier consulta, aunque esté vacía, es 400.
    if (peticion.url.includes("?")) {
      await peticion.body?.cancel().catch(() => undefined);
      return rechazo(400, "entrada_invalida", "consulta_no_permitida");
    }
    // 5. Origen: sin la cabecera de la plataforma, fuera de local, no se evalúa nada.
    const claves = derivarClaves(configuracion.secreto);
    const origen = origenDePeticion(peticion.headers, claves, dependencias.local());
    if (origen.estado !== "ok") {
      await peticion.body?.cancel().catch(() => undefined);
      return rechazo(403, "origen_no_permitido", "origen_no_permitido");
    }
    const autorizacion = dependencias.autorizacion();

    // 6. Credencial, en tiempo constante contra la huella; sin ella o distinta, se cuenta el fallo.
    const cabecera = peticion.headers.get("authorization");
    const credencial = cabecera === null ? null : (RE_BEARER_OPERACION.exec(cabecera)?.[1] ?? null);
    // Sin cabecera o mal formada nunca puede coincidir: 401 sin contar (cada cuenta es una escritura sobre
    // el grupo de gestión, de 2 conexiones como máximo). Solo cuenta la bien formada y errónea.
    if (credencial === null) {
      await peticion.body?.cancel().catch(() => undefined);
      return rechazo(
        401,
        cabecera === null ? "sin_token" : "token_no_valido",
        "credencial_no_valida",
      );
    }
    if (!coincideHuellaOperacion(credencial, configuracion.operacionHuella)) {
      await peticion.body?.cancel().catch(() => undefined);
      const contado = await autorizacion.operarContarFallo(origen.hmac);
      if (contado.resultado === "bloqueado") {
        registrar("aviso", "token_no_valido", RUTA_OPERACION);
        return respuesta(429, { resultado: "origen_bloqueado" });
      }
      return rechazo(401, "token_no_valido", "credencial_no_valida");
    }

    // 7. Cuerpo con tope y formato.
    const lectura = await leerAcotado(peticion);
    if (lectura.tipo === "grande") {
      return rechazo(413, "cuerpo_demasiado_grande", "cuerpo_demasiado_grande");
    }
    let analizado: ReturnType<typeof validarCuerpo> = null;
    if (lectura.tipo === "texto") {
      try {
        analizado = validarCuerpo(analizarJson(lectura.texto));
      } catch {
        analizado = null;
      }
    }
    if (analizado === null) return rechazo(400, "entrada_invalida", "operacion_no_valida");
    const { operacion, argumentos } = analizado;

    // 8. Ejecución.
    const o = origen.hmac;
    const tipo = argumentos.tipo as "A" | "B";
    let resultado: { readonly resultado: string } & Readonly<Record<string, unknown>>;
    let codigoNuevo: string | undefined;
    switch (operacion) {
      case "generar_codigo": {
        codigoNuevo = nuevoCodigoActivacion();
        const normalizado = normalizarCodigo(codigoNuevo);
        if (normalizado === null) return error(500, "error_interno");
        resultado = await autorizacion.operarGenerarCodigo(
          o,
          tipo,
          huellaToken(claves, "codigo_activacion", normalizado),
        );
        break;
      }
      case "suspender_licencia":
        resultado = await autorizacion.operarSuspenderLicencia(o, tipo);
        break;
      case "reactivar_licencia":
        resultado = await autorizacion.operarReactivarLicencia(o, tipo);
        break;
      case "crear_orden":
        resultado = await autorizacion.operarCrearOrden(
          o,
          tipo,
          argumentos.orden as "pausar" | "reanudar",
        );
        break;
      case "listar_conexiones":
        resultado = await autorizacion.operarListarConexiones(o);
        break;
      case "revocar_conexion":
        resultado = await autorizacion.operarRevocarConexion(
          o,
          (argumentos.conexion as string).toLowerCase(),
        );
        break;
      case "resumen":
        resultado = await autorizacion.operarResumen(o);
        break;
      case "exportar_sucesos":
        resultado = await autorizacion.operarExportarSucesos(o, argumentos.dia as string);
        break;
      case "cerrar_prueba":
        resultado = await autorizacion.cerrarPrueba(o);
        break;
    }

    const estado =
      ESTADO_RESULTADO.get(resultado.resultado) ?? (EXITOS.has(resultado.resultado) ? 200 : 0);
    // Cierre en fallo: un resultado que ni es éxito ni está en la tabla no llega a la persona como éxito.
    if (estado === 0) return error(500, "error_interno");
    if (resultado.resultado === "origen_bloqueado")
      return respuesta(429, { resultado: "origen_bloqueado" });
    if (resultado.resultado === "generado" && codigoNuevo !== undefined) {
      return respuesta(200, { operacion, ...resultado, codigo: codigoNuevo });
    }
    return respuesta(estado, { operacion, ...resultado });
  };
}

// El punto de producto: entorno y configuración de `configuracion.ts`, rol de gestión y origen de la plataforma.
export const puntoOperacion: Funcion = crearOperaciones({
  configuracion: cargarConfiguracionConector,
  autorizacion: autorizacionDelConector,
  entorno: leerEntornoOperable,
  local: esDesarrollo,
});
