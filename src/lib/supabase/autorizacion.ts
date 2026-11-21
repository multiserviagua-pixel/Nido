// Rol de gestión del conector (T-108 d, 001; diseño §Datos y §Servidor de autorización; ADR-0003).
// Rol `conector_prueba_gestion` por el agrupador en modo transacción (6543): autorización OAuth y
// operaciones de HumanaIA. Lo que recibe entradas de un modelo (`src/mcp/`) no emite ni opera: este
// archivo NO lo importa `src/mcp/` (prueba de frontera) y no usa la clave secreta ni el rol `postgres`.
//
// Una llamada, una función `conector_prueba.f(...)`, SQL fijo y valores solo como parámetros; adaptador
// inyectable como `almacen.ts` (en la batería, PGlite). Cierre en fallo (art. 3): un error del adaptador,
// un plazo vencido (5 s) o una respuesta que no tiene la forma cerrada de su función es
// `almacen_no_disponible`, sin mensaje, causa ni valores (art. 1). `cerrada` (prueba terminada) es un
// resultado propio donde la base lo devuelve; cualquier otro valor desconocido nunca es éxito.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import postgres from "postgres";
import { esCallbackPermitido } from "../oauth/callbacks";
import type { ClienteLeido } from "../oauth/cimd";
import { cargarConfiguracionConector } from "../plataforma/configuracion";
import { ErrorDeAplicacion } from "../plataforma/errores";

export const TIEMPO_LLAMADA_MS = 5000;

export interface AdaptadorAutorizacion {
  /** `select conector_prueba.<funcion>($1, ...)`; devuelve la primera columna de la primera fila. */
  llamar(funcion: string, argumentos: unknown[]): Promise<unknown>;
}

// Las únicas funciones que este rol puede llamar (T-103/T-107: `execute` solo al rol de gestión).
export const FUNCIONES_GESTION = [
  "leer_cliente",
  "guardar_cliente_cimd",
  "registrar_cliente_dcr",
  "abrir_solicitud",
  "activar",
  "canjear_codigo",
  "renovar",
  "operar_contar_fallo",
  "operar_generar_codigo",
  "operar_suspender_licencia",
  "operar_reactivar_licencia",
  "operar_crear_orden",
  "operar_listar_conexiones",
  "operar_revocar_conexion",
  "operar_resumen",
  "operar_exportar_sucesos",
  "cerrar_prueba",
] as const;

// --- Formas cerradas ---------------------------------------------------------------------------

type Predicado = (v: unknown) => boolean;
const RE_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const RE_SAL = /^[A-Za-z0-9_-]{22}$/;

const esObjeto = (v: unknown): v is Record<string, unknown> =>
  v !== null && typeof v === "object" && !Array.isArray(v);
const esUuid: Predicado = (v) => typeof v === "string" && RE_UUID.test(v);
const esSal: Predicado = (v) => typeof v === "string" && RE_SAL.test(v);
const esEntero: Predicado = (v) =>
  Number.isInteger(v) && (v as number) >= 0 && (v as number) <= 1e9;
const esBooleano: Predicado = (v) => typeof v === "boolean";
const esCallback: Predicado = (v) => esCallbackPermitido(v);
const esListaCallbacks: Predicado = (v) =>
  Array.isArray(v) && v.length >= 1 && v.length <= 10 && (v as unknown[]).every(esCallback);
const esOrigenCliente: Predicado = (v) => v === "cimd" || v === "dcr";

// Instante de Postgres (ISO 8601): solo estos caracteres y una fecha que se analice.
const RE_MOMENTO = /^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9:.+Z-]{8,30}$/;
const esInstante: Predicado = (v) =>
  typeof v === "string" && RE_MOMENTO.test(v) && !Number.isNaN(Date.parse(v));

const esConexion: Predicado = (v) =>
  esObjeto(v) &&
  Object.keys(v).sort().join(",") ===
    "asistente,creada_en,id,licencia,motivo,revocada_en,ultimo_uso_en" &&
  esUuid(v.id) &&
  (v.licencia === "A" || v.licencia === "B") &&
  (v.asistente === "claude" || v.asistente === "chatgpt" || v.asistente === "otro") &&
  esInstante(v.creada_en) &&
  (v.ultimo_uso_en === null || esInstante(v.ultimo_uso_en)) &&
  (v.revocada_en === null || esInstante(v.revocada_en)) &&
  (v.motivo === null ||
    v.motivo === "operador" ||
    v.motivo === "reutilizacion" ||
    v.motivo === "cierre");
const esListaConexiones: Predicado = (v) =>
  Array.isArray(v) && v.length <= 1000 && (v as unknown[]).every(esConexion);

// Objeto de claves exactas (ni más ni menos), cada una con su predicado.
const objetoExacto =
  (campos: Record<string, Predicado>): Predicado =>
  (v) =>
    esObjeto(v) &&
    Object.keys(v).length === Object.keys(campos).length &&
    Object.entries(campos).every(([c, p]) => Object.hasOwn(v, c) && p(v[c]));
// p95 de duraciones (0 a 600000 ms) o null sin datos.
const p95Ms: Predicado = (v) =>
  v === null || (Number.isInteger(v) && (v as number) >= 0 && (v as number) <= 600000);
const enumerado =
  (...valores: string[]): Predicado =>
  (v) =>
    typeof v === "string" && valores.includes(v);
const RE_RUTA = /^[a-z0-9_/-]{1,60}$/;
const RE_CODIGO = /^[a-z0-9_]{1,40}$/;

// Forma de `operar_resumen` (supabase/conector-prueba/001_estado.sql): recuentos, enumerados y p95 en ms.
const esLicenciaResumen = objetoExacto({
  tipo: enumerado("A", "B"),
  estado: enumerado("activa", "suspendida", "revocada"),
});
const FORMA_RESUMEN: Record<string, Predicado> = {
  cerrada: esBooleano,
  licencias: (v) =>
    Array.isArray(v) && v.length <= 100 && (v as unknown[]).every(esLicenciaResumen),
  conexiones: objetoExacto({ total: esEntero, activas: esEntero, revocadas: esEntero }),
  ordenes: objetoExacto({
    pendiente: esEntero,
    entregada: esEntero,
    confirmada: esEntero,
    anulada: esEntero,
  }),
  ejecuciones: objetoExacto({ total: esEntero, cerradas: esEntero }),
  informes: esEntero,
  sucesos: objetoExacto({
    total: esEntero,
    correcto: esEntero,
    rechazado: esEntero,
    error: esEntero,
  }),
  protocolos: objetoExacto({ "2025-11-25": esEntero, "2026-07-28": esEntero, otra: esEntero }),
  p95_ms: objetoExacto({
    obtener_instrucciones: p95Ms,
    enviar_informe: p95Ms,
    confirmar_orden: p95Ms,
  }),
};
// Forma de cada suceso exportado (tabla `sucesos`): sin texto libre.
const esSuceso = objetoExacto({
  momento: esInstante,
  ruta: (v) => typeof v === "string" && RE_RUTA.test(v),
  herramienta: (v) =>
    v === null || enumerado("obtener_instrucciones", "enviar_informe", "confirmar_orden")(v),
  resultado: enumerado("correcto", "rechazado", "error"),
  codigo: (v) => typeof v === "string" && RE_CODIGO.test(v),
  duracion_ms: (v) => Number.isInteger(v) && (v as number) >= 0 && (v as number) <= 600000,
  protocolo: enumerado("2025-11-25", "2026-07-28", "otra"),
  asistente: (v) => v === null || enumerado("claude", "chatgpt", "otro")(v),
});
const esListaSucesos: Predicado = (v) =>
  Array.isArray(v) && v.length <= 50000 && (v as unknown[]).every(esSuceso);

// Resultados de cada función y los campos que lleva cada uno (exactos).
const SIN: Record<string, Predicado> = {};
type Formas = Record<string, Record<string, Predicado>>;
const operacionConCierre = (...resultados: string[]): Formas =>
  Object.fromEntries(
    [...resultados, "no_valido", "licencia_desconocida", "origen_bloqueado", "cerrada"].map((r) => [
      r,
      SIN,
    ]),
  );
const FORMAS: Record<(typeof FUNCIONES_GESTION)[number], Formas> = {
  leer_cliente: {
    desconocido: SIN,
    conocido: { origen: esOrigenCliente, redirect_uris: esListaCallbacks, vigente: esBooleano },
  },
  guardar_cliente_cimd: { guardado: SIN, no_valido: SIN, cerrada: SIN },
  registrar_cliente_dcr: {
    registrado: SIN,
    limite: SIN,
    origen_bloqueado: SIN,
    no_valido: SIN,
    cerrada: SIN,
  },
  abrir_solicitud: { abierta: { solicitud: esUuid }, no_valida: SIN, cerrada: SIN },
  activar: {
    activada: { redirect_uri: esCallback },
    solicitud_no_valida: SIN,
    origen_bloqueado: SIN,
    codigo_no_valido: SIN,
    cerrada: SIN,
  },
  canjear_codigo: { emitido: { expires_in: esEntero }, no_valido: SIN },
  renovar: {
    rotado: { expires_in: esEntero },
    repetido: { sal: esSal, expires_in: esEntero },
    reutilizado: SIN,
    no_valido: SIN,
  },
  operar_contar_fallo: { contado: SIN, bloqueado: SIN, invalido: SIN },
  operar_generar_codigo: {
    ...operacionConCierre("generado"),
    licencia_no_activa: SIN,
  },
  operar_suspender_licencia: { ...operacionConCierre("suspendida"), sin_cambio: SIN },
  operar_reactivar_licencia: { ...operacionConCierre("reactivada"), sin_cambio: SIN },
  operar_crear_orden: {
    ...operacionConCierre(),
    creada: { orden: esUuid, anuladas: esEntero },
  },
  operar_listar_conexiones: { listado: { conexiones: esListaConexiones }, origen_bloqueado: SIN },
  operar_revocar_conexion: {
    revocada: SIN,
    sin_cambio: SIN,
    conexion_desconocida: SIN,
    origen_bloqueado: SIN,
    cerrada: SIN,
  },
  operar_resumen: { resumen: FORMA_RESUMEN, origen_bloqueado: SIN },
  operar_exportar_sucesos: {
    exportado: { sucesos: esListaSucesos },
    no_valido: SIN,
    origen_bloqueado: SIN,
  },
  cerrar_prueba: { prueba_cerrada: SIN, ya_cerrada: SIN, origen_bloqueado: SIN },
};

const caido = (): ErrorDeAplicacion => new ErrorDeAplicacion("almacen_no_disponible");

function validar(
  funcion: (typeof FUNCIONES_GESTION)[number],
  r: unknown,
): Record<string, unknown> & { resultado: string } {
  if (!esObjeto(r) || typeof r.resultado !== "string")
    throw new ErrorDeAplicacion("almacen_no_disponible");
  const formas = FORMAS[funcion];
  if (!Object.hasOwn(formas, r.resultado)) throw new ErrorDeAplicacion("almacen_no_disponible");
  const campos = formas[r.resultado]!;
  const claves = Object.keys(r).filter((c) => c !== "resultado");
  const esperadas = Object.keys(campos);
  if (claves.length !== esperadas.length || !esperadas.every((c) => Object.hasOwn(r, c))) {
    throw new ErrorDeAplicacion("almacen_no_disponible");
  }
  if (!esperadas.every((c) => campos[c]!(r[c]))) {
    throw new ErrorDeAplicacion("almacen_no_disponible");
  }
  return r as Record<string, unknown> & { resultado: string };
}

// --- Interfaz -----------------------------------------------------------------------------------

export type ResultadoLicencia = "A" | "B";
export type TipoOrdenOperada = "pausar" | "reanudar";

export interface ConexionListada {
  readonly id: string;
  readonly licencia: "A" | "B";
  readonly asistente: "claude" | "chatgpt" | "otro";
  readonly creada_en: string;
  readonly ultimo_uso_en: string | null;
  readonly revocada_en: string | null;
  readonly motivo: "operador" | "reutilizacion" | "cierre" | null;
}

type SoloResultado<R extends string> = { readonly resultado: R };

export interface Autorizacion {
  leerCliente(clientId: string): Promise<ClienteLeido>;
  guardarClienteCimd(
    clientId: string,
    redirectUris: readonly string[],
  ): Promise<SoloResultado<"guardado" | "no_valido" | "cerrada">>;
  registrarClienteDcr(
    origenHmac: string,
    clientId: string,
    redirectUris: readonly string[],
  ): Promise<SoloResultado<"registrado" | "limite" | "origen_bloqueado" | "no_valido" | "cerrada">>;
  abrirSolicitud(
    clientId: string,
    redirectUri: string,
    desafio: string,
    recurso: string,
    stateHmac: string,
    cookieHmac: string,
  ): Promise<
    | { readonly resultado: "abierta"; readonly solicitud: string }
    | SoloResultado<"no_valida" | "cerrada">
  >;
  activar(
    solicitud: string,
    cookieHmac: string,
    stateHmac: string,
    origenHmac: string,
    codigoHmac: string,
    autorizacionHmac: string,
  ): Promise<
    | { readonly resultado: "activada"; readonly redirectUri: string }
    | SoloResultado<"solicitud_no_valida" | "origen_bloqueado" | "codigo_no_valido" | "cerrada">
  >;
  canjearCodigo(
    codigoHmac: string,
    clientId: string,
    redirectUri: string,
    desafio: string,
    recurso: string,
    accesoHmac: string,
    renovacionHmac: string,
  ): Promise<
    { readonly resultado: "emitido"; readonly expiresIn: number } | SoloResultado<"no_valido">
  >;
  renovar(
    presentadoHmac: string,
    clientId: string,
    recurso: string,
    sal: string,
    accesoHmac: string,
    renovacionHmac: string,
  ): Promise<
    | { readonly resultado: "rotado"; readonly expiresIn: number }
    | { readonly resultado: "repetido"; readonly sal: string; readonly expiresIn: number }
    | SoloResultado<"reutilizado" | "no_valido">
  >;
  operarContarFallo(
    origenHmac: string,
  ): Promise<SoloResultado<"contado" | "bloqueado" | "invalido">>;
  operarGenerarCodigo(
    origenHmac: string,
    tipo: ResultadoLicencia,
    codigoHmac: string,
  ): Promise<
    SoloResultado<
      | "generado"
      | "no_valido"
      | "licencia_desconocida"
      | "licencia_no_activa"
      | "origen_bloqueado"
      | "cerrada"
    >
  >;
  operarSuspenderLicencia(
    origenHmac: string,
    tipo: ResultadoLicencia,
  ): Promise<
    SoloResultado<
      | "suspendida"
      | "sin_cambio"
      | "no_valido"
      | "licencia_desconocida"
      | "origen_bloqueado"
      | "cerrada"
    >
  >;
  operarReactivarLicencia(
    origenHmac: string,
    tipo: ResultadoLicencia,
  ): Promise<
    SoloResultado<
      | "reactivada"
      | "sin_cambio"
      | "no_valido"
      | "licencia_desconocida"
      | "origen_bloqueado"
      | "cerrada"
    >
  >;
  operarCrearOrden(
    origenHmac: string,
    tipo: ResultadoLicencia,
    orden: TipoOrdenOperada,
  ): Promise<
    | { readonly resultado: "creada"; readonly orden: string; readonly anuladas: number }
    | SoloResultado<"no_valido" | "licencia_desconocida" | "origen_bloqueado" | "cerrada">
  >;
  operarListarConexiones(
    origenHmac: string,
  ): Promise<
    | { readonly resultado: "listado"; readonly conexiones: readonly ConexionListada[] }
    | SoloResultado<"origen_bloqueado">
  >;
  operarRevocarConexion(
    origenHmac: string,
    conexion: string,
  ): Promise<
    SoloResultado<
      "revocada" | "sin_cambio" | "conexion_desconocida" | "origen_bloqueado" | "cerrada"
    >
  >;
  operarResumen(
    origenHmac: string,
  ): Promise<
    | ({ readonly resultado: "resumen" } & Readonly<Record<string, unknown>>)
    | SoloResultado<"origen_bloqueado">
  >;
  operarExportarSucesos(
    origenHmac: string,
    dia: string,
  ): Promise<
    | { readonly resultado: "exportado"; readonly sucesos: readonly unknown[] }
    | SoloResultado<"no_valido" | "origen_bloqueado">
  >;
  cerrarPrueba(
    origenHmac: string,
  ): Promise<SoloResultado<"prueba_cerrada" | "ya_cerrada" | "origen_bloqueado">>;
}

export interface OpcionesAutorizacion {
  /** Plazo por llamada; por defecto 5 s (diseño §Datos). Solo se cambia en pruebas. */
  readonly tiempoMs?: number;
}

export function crearAutorizacion(
  adaptador: AdaptadorAutorizacion,
  opciones: OpcionesAutorizacion = {},
): Autorizacion {
  const tiempoMs = opciones.tiempoMs ?? TIEMPO_LLAMADA_MS;

  // Una llamada, una función, con plazo. Todo error se sustituye por el mismo código fijo.
  // Limitación conocida (A-22): el plazo no cancela la consulta ya en marcha en el agrupador.
  const llamar = async (
    funcion: (typeof FUNCIONES_GESTION)[number],
    argumentos: unknown[],
  ): Promise<Record<string, unknown> & { resultado: string }> => {
    let temporizador: ReturnType<typeof setTimeout> | undefined;
    const plazo = new Promise<never>((_, rechazar) => {
      temporizador = setTimeout(() => rechazar(caido()), tiempoMs);
    });
    let respuesta: unknown;
    try {
      respuesta = await Promise.race([adaptador.llamar(funcion, argumentos), plazo]);
    } catch {
      throw new ErrorDeAplicacion("almacen_no_disponible");
    } finally {
      clearTimeout(temporizador);
    }
    return validar(funcion, respuesta);
  };
  const solo = async <R extends string>(
    funcion: (typeof FUNCIONES_GESTION)[number],
    argumentos: unknown[],
  ): Promise<SoloResultado<R>> => {
    const r = await llamar(funcion, argumentos);
    return { resultado: r.resultado as R };
  };

  return {
    async leerCliente(clientId) {
      const r = await llamar("leer_cliente", [clientId]);
      if (r.resultado === "desconocido") return { resultado: "desconocido" };
      return {
        resultado: "conocido",
        origen: r.origen as "cimd" | "dcr",
        redirectUris: [...(r.redirect_uris as string[])],
        vigente: r.vigente as boolean,
      };
    },
    guardarClienteCimd: (clientId, uris) => solo("guardar_cliente_cimd", [clientId, [...uris]]),
    registrarClienteDcr: (origen, clientId, uris) =>
      solo("registrar_cliente_dcr", [origen, clientId, [...uris]]),
    async abrirSolicitud(clientId, redirectUri, desafio, recurso, stateHmac, cookieHmac) {
      const r = await llamar("abrir_solicitud", [
        clientId,
        redirectUri,
        desafio,
        recurso,
        stateHmac,
        cookieHmac,
      ]);
      if (r.resultado === "abierta") {
        return { resultado: "abierta", solicitud: r.solicitud as string };
      }
      return { resultado: r.resultado as "no_valida" | "cerrada" };
    },
    async activar(solicitud, cookieHmac, stateHmac, origenHmac, codigoHmac, autorizacionHmac) {
      const r = await llamar("activar", [
        solicitud,
        cookieHmac,
        stateHmac,
        origenHmac,
        codigoHmac,
        autorizacionHmac,
      ]);
      if (r.resultado === "activada") {
        return { resultado: "activada", redirectUri: r.redirect_uri as string };
      }
      return {
        resultado: r.resultado as
          "solicitud_no_valida" | "origen_bloqueado" | "codigo_no_valido" | "cerrada",
      };
    },
    async canjearCodigo(codigoHmac, clientId, redirectUri, desafio, recurso, acceso, renovacion) {
      const r = await llamar("canjear_codigo", [
        codigoHmac,
        clientId,
        redirectUri,
        desafio,
        recurso,
        acceso,
        renovacion,
      ]);
      if (r.resultado === "emitido") {
        return { resultado: "emitido", expiresIn: r.expires_in as number };
      }
      return { resultado: "no_valido" };
    },
    async renovar(presentadoHmac, clientId, recurso, sal, acceso, renovacion) {
      const r = await llamar("renovar", [
        presentadoHmac,
        clientId,
        recurso,
        sal,
        acceso,
        renovacion,
      ]);
      if (r.resultado === "rotado")
        return { resultado: "rotado", expiresIn: r.expires_in as number };
      if (r.resultado === "repetido") {
        return { resultado: "repetido", sal: r.sal as string, expiresIn: r.expires_in as number };
      }
      return { resultado: r.resultado as "reutilizado" | "no_valido" };
    },
    operarContarFallo: (origen) => solo("operar_contar_fallo", [origen]),
    operarGenerarCodigo: (origen, tipo, codigo) =>
      solo("operar_generar_codigo", [origen, tipo, codigo]),
    operarSuspenderLicencia: (origen, tipo) => solo("operar_suspender_licencia", [origen, tipo]),
    operarReactivarLicencia: (origen, tipo) => solo("operar_reactivar_licencia", [origen, tipo]),
    async operarCrearOrden(origen, tipo, orden) {
      const r = await llamar("operar_crear_orden", [origen, tipo, orden]);
      if (r.resultado === "creada") {
        return { resultado: "creada", orden: r.orden as string, anuladas: r.anuladas as number };
      }
      return {
        resultado: r.resultado as
          "no_valido" | "licencia_desconocida" | "origen_bloqueado" | "cerrada",
      };
    },
    async operarListarConexiones(origen) {
      const r = await llamar("operar_listar_conexiones", [origen]);
      if (r.resultado === "listado") {
        return { resultado: "listado", conexiones: r.conexiones as ConexionListada[] };
      }
      return { resultado: "origen_bloqueado" };
    },
    operarRevocarConexion: (origen, conexion) =>
      solo("operar_revocar_conexion", [origen, conexion]),
    async operarResumen(origen) {
      const r = await llamar("operar_resumen", [origen]);
      return r.resultado === "resumen"
        ? { ...r, resultado: "resumen" }
        : { resultado: "origen_bloqueado" };
    },
    async operarExportarSucesos(origen, dia) {
      const r = await llamar("operar_exportar_sucesos", [origen, dia]);
      if (r.resultado === "exportado") {
        return { resultado: "exportado", sucesos: r.sucesos as unknown[] };
      }
      return { resultado: r.resultado as "no_valido" | "origen_bloqueado" };
    },
    cerrarPrueba: (origen) => solo("cerrar_prueba", [origen]),
  };
}

// --- Conexión de producto ---------------------------------------------------------------------

export type FabricaPostgres = typeof postgres;

export interface AdaptadorPostgresGestion extends AdaptadorAutorizacion {
  cerrar(): Promise<void>;
}

export interface OpcionesAdaptadorGestion {
  /** URL del agrupador con el rol de gestión (la valida `configuracion.ts`). */
  readonly url: string;
  /** Raíz de confianza en PEM. Vacía: no se conecta. */
  readonly ca: string;
  /** Fábrica de `postgres`; solo se sustituye en pruebas. */
  readonly fabrica?: FabricaPostgres;
}

// `text[]` como literal de Postgres (`{"a","b"}`) con su conversión explícita: con `fetch_types: false`
// postgres.js no tipa matrices. Los valores ya son de lista cerrada (callbacks), y aun así se escapan.
const literalMatriz = (valores: unknown[]): string =>
  `{${valores
    .map((v) => `"${String(v).replaceAll("\\", "\\\\").replaceAll('"', '\\"')}"`)
    .join(",")}}`;

export function crearAdaptadorGestion(
  opciones: OpcionesAdaptadorGestion,
): AdaptadorPostgresGestion {
  if (opciones.ca.trim() === "") throw new ErrorDeAplicacion("almacen_no_disponible");
  const fabrica = opciones.fabrica ?? postgres;
  const sql = fabrica(opciones.url, {
    ssl: { ca: opciones.ca, rejectUnauthorized: true },
    prepare: false,
    fetch_types: false,
    max: 2,
    connect_timeout: 5,
    idle_timeout: 20,
    max_lifetime: 1800,
    onnotice: () => undefined,
  });
  return {
    async llamar(funcion, argumentos) {
      if (!(FUNCIONES_GESTION as readonly string[]).includes(funcion))
        throw new ErrorDeAplicacion("almacen_no_disponible");
      const marcas = argumentos
        .map((a, i) => (Array.isArray(a) ? `$${i + 1}::text[]` : `$${i + 1}`))
        .join(", ");
      const valores = argumentos.map((a) => (Array.isArray(a) ? literalMatriz(a) : a));
      try {
        // Sin registrar nada del error de postgres.js (`message`, `detail`, `where`: art. 1).
        const filas = (await sql.unsafe(
          `select conector_prueba.${funcion}(${marcas}) as r`,
          valores as never[],
          { prepare: false },
        )) as unknown as { r: unknown }[];
        return filas[0]?.r;
      } catch {
        throw new ErrorDeAplicacion("almacen_no_disponible");
      }
    },
    async cerrar() {
      try {
        await sql.end({ timeout: 1 });
      } catch {
        // Cerrar no puede fallar hacia fuera.
      }
    },
  };
}

// Raíz pública de Supabase, del repositorio (la traza de `next build` la incluye: T-106; claves de
// `outputFileTracingIncludes` de cada ruta que use este archivo).
export function leerRaizConfiable(): string {
  try {
    return readFileSync(
      join(process.cwd(), "supabase", "conector-prueba", "raiz-supabase.crt"),
      "utf8",
    );
  } catch {
    throw new ErrorDeAplicacion("almacen_no_disponible");
  }
}

let autorizacion: Autorizacion | undefined;

/**
 * Autorización de producto con el rol de gestión. Se crea la primera vez que se pide: sin configuración
 * válida lanza `configuracion_conector_invalida`; sin raíz legible, `almacen_no_disponible` (503 ambos).
 */
export function autorizacionDelConector(): Autorizacion {
  if (autorizacion === undefined) {
    const configuracion = cargarConfiguracionConector();
    autorizacion = crearAutorizacion(
      crearAdaptadorGestion({ url: configuracion.autorizacionBdUrl, ca: leerRaizConfiable() }),
    );
  }
  return autorizacion;
}
