// Pruebas contra `Nido` (T-111 c, 001; para T-114 (a): PRUEBA-022 L, PRUEBA-008, PRUEBA-018, PRUEBA-047;
// V-5, V-10 y V-107; artículos 3, 4 y 13).
//
//   npm run pruebas-bd
//
// La ejecuta una persona en su máquina, con dos variables que solo existen en su `.env.local` o en su sesión
// (`docs/operacion/entornos.md`): PRUEBAS_CONECTOR_BD_URL (rol `conector_prueba_mcp`) y
// PRUEBAS_AUTORIZACION_BD_URL (rol `conector_prueba_gestion`), las dos por el agrupador en modo transacción
// (6543) de `eu-north-1`. No acepta argumentos. Solo hace consultas de lectura sobre el catálogo y
// `validar_acceso` con un valor aleatorio (devuelve falso): no crea, cambia ni borra nada.
//
// Qué comprueba:
//  - forma de las dos direcciones (V-10): usuario del rol, agrupador de `eu-north-1`, puerto 6543, sin consulta;
//  - TLS con la raíz de Supabase (`raiz-supabase.crt`) verificando certificado y nombre; y que SIN esa raíz la
//    conexión se rechaza (el TLS no se acepta a ciegas);
//  - privilegios de cada rol (PRUEBA-022): solo uso del esquema `conector_prueba`, ninguna tabla ni secuencia
//    y solo las funciones previstas; ningún privilegio sobre objetos ajenos (los de PUBLIC son la acción AR-14);
//  - los roles de Supabase (`anon`, `authenticated`, `service_role`) no tienen nada en `conector_prueba`;
//  - diez llamadas a la vez por el agrupador sin errores de límite (PRUEBA-008).
//
// La salida son nombres de comprobación fijos y un estado; no lleva direcciones, contraseñas ni mensajes del
// servidor (solo el código SQLSTATE de un fallo). Los nombres de objetos del catálogo (no son secretos) se
// muestran solo si tienen forma de identificador.
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import process from "node:process";
import { fileURLToPath, pathToFileURL } from "node:url";
import { randomBytes } from "node:crypto";

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
const ESQUEMA = "conector_prueba";
const ROLES_SUPABASE = ["anon", "authenticated", "service_role"];
const CONCURRENCIA = 10;

const FUNCIONES_MCP = [
  "validar_acceso",
  "mcp_obtener_instrucciones",
  "mcp_enviar_informe",
  "mcp_confirmar_orden",
  "registrar_suceso",
];
const FUNCIONES_GESTION = [
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
  "registrar_suceso",
];

export const ROLES = [
  { nombre: "conector_prueba_mcp", variable: "PRUEBAS_CONECTOR_BD_URL", funciones: FUNCIONES_MCP },
  {
    nombre: "conector_prueba_gestion",
    variable: "PRUEBAS_AUTORIZACION_BD_URL",
    funciones: FUNCIONES_GESTION,
  },
];

// Consultas fijas (nada del exterior entra en el texto SQL; el rol va como parámetro). Postgres puede evaluar
// la función de privilegios antes que el filtro por `relkind` (42809 "... is not a sequence"): por eso cada
// llamada va dentro de un `case` que la protege.
const SISTEMA = `n.nspname !~ '^pg_' and n.nspname <> 'information_schema'`;
export const CONSULTAS = {
  rol: "select current_user::text as rol",
  esquemas: `select n.nspname::text as esquema from pg_namespace n where ${SISTEMA} and has_schema_privilege($1::text, n.oid, 'USAGE,CREATE') order by 1`,
  tablas: `select n.nspname::text as esquema, c.relname::text as objeto from pg_class c join pg_namespace n on n.oid = c.relnamespace where ${SISTEMA} and c.relkind in ('r','p','v','m','f') and case when c.relkind in ('r','p','v','m','f') then has_table_privilege($1::text, c.oid, 'SELECT,INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER') else false end order by 1, 2`,
  secuencias: `select n.nspname::text as esquema, c.relname::text as objeto from pg_class c join pg_namespace n on n.oid = c.relnamespace where ${SISTEMA} and c.relkind = 'S' and case when c.relkind = 'S' then has_sequence_privilege($1::text, c.oid, 'USAGE,SELECT,UPDATE') else false end order by 1, 2`,
  funciones: `select distinct n.nspname::text as esquema, p.proname::text as objeto from pg_proc p join pg_namespace n on n.oid = p.pronamespace where ${SISTEMA} and p.prokind in ('f','p') and has_function_privilege($1::text, p.oid, 'EXECUTE') order by 1, 2`,
  concurrencia: `select ${ESQUEMA}.validar_acceso($1, $2) as r`,
};

const RE_IDENTIFICADOR = /^[a-z_][a-z0-9_]{0,62}$/;
const RE_SQLSTATE = /^[0-9A-Z]{5}$/;
const RE_HOST = /^[a-z0-9]+-[0-9]+-eu-north-1\.pooler\.supabase\.com$/;
const RE_URL =
  /^postgres(?:ql)?:\/\/([^\s@/?#:]+):[^\s@/?#:]+@([a-z0-9.-]{1,253}):([0-9]{1,5})\/[A-Za-z0-9_]{1,63}$/;
const RE_REFERENCIA = /^[a-z0-9]{1,64}$/;

/** `true` si la dirección es del rol, del agrupador de eu-north-1, puerto 6543 y sin consulta. Sin eco. */
export function urlConforme(url, rol) {
  if (typeof url !== "string") return false;
  const m = RE_URL.exec(url);
  if (m === null) return false;
  const usuario = m[1];
  const delRol =
    usuario === rol ||
    (usuario.startsWith(`${rol}.`) && RE_REFERENCIA.test(usuario.slice(rol.length + 1)));
  return delRol && RE_HOST.test(m[2]) && m[3] === "6543";
}

const nombre = (v) => (typeof v === "string" && RE_IDENTIFICADOR.test(v) ? v : "?");
const sqlstate = (error) =>
  error !== null &&
  typeof error === "object" &&
  typeof error.code === "string" &&
  RE_SQLSTATE.test(error.code)
    ? error.code
    : "sin código";

const CODIGOS_TLS = new Set([
  "SELF_SIGNED_CERT_IN_CHAIN",
  "DEPTH_ZERO_SELF_SIGNED_CERT",
  "UNABLE_TO_GET_ISSUER_CERT",
  "UNABLE_TO_GET_ISSUER_CERT_LOCALLY",
  "UNABLE_TO_VERIFY_LEAF_SIGNATURE",
  "CERT_UNTRUSTED",
  "CERT_HAS_EXPIRED",
  "CERT_NOT_YET_VALID",
  "ERR_TLS_CERT_ALTNAME_INVALID",
]);
const esErrorTls = (error) =>
  error !== null &&
  typeof error === "object" &&
  typeof error.code === "string" &&
  CODIGOS_TLS.has(error.code);
const codigoNodo = (error) =>
  error !== null &&
  typeof error === "object" &&
  typeof error.code === "string" &&
  /^[A-Z0-9_]{3,64}$/.test(error.code)
    ? error.code
    : "sin código";

/** Conexión real con postgres.js: TLS verificado, sin consultas preparadas. Solo se importa si hace falta. */
export async function conectarReal({ url, ca, max }) {
  const postgres = (await import("postgres")).default;
  const sql = postgres(url, {
    ssl: ca === null ? { rejectUnauthorized: true } : { ca, rejectUnauthorized: true },
    prepare: false,
    fetch_types: false,
    max,
    connect_timeout: 10,
    idle_timeout: 5,
    onnotice: () => undefined,
  });
  return {
    async consultar(texto, parametros = []) {
      return [...(await sql.unsafe(texto, parametros, { prepare: false }))];
    },
    async cerrar() {
      try {
        await sql.end({ timeout: 2 });
      } catch {
        // Cerrar no puede fallar hacia fuera.
      }
    },
  };
}

const leerRaizReal = () =>
  readFileSync(join(RAIZ, "supabase", "conector-prueba", "raiz-supabase.crt"), "utf8");

const diferencia = (a, b) => a.filter((x) => !b.includes(x));

/** Privilegios de `rol` (nombre real, no la URL) vistos desde la conexión. Devuelve los hallazgos en texto fijo. */
async function privilegiosDe(conexion, rol, previstas) {
  const hallazgos = [];
  const esquemas = (await conexion.consultar(CONSULTAS.esquemas, [rol])).map((f) => f.esquema);
  const ajenos = diferencia(esquemas, [ESQUEMA]);
  if (!esquemas.includes(ESQUEMA)) hallazgos.push(`sin uso del esquema ${ESQUEMA}`);
  if (ajenos.length > 0)
    hallazgos.push(`esquemas ajenos con acceso (PUBLIC; AR-14): ${ajenos.map(nombre).join(", ")}`);
  const tablas = await conexion.consultar(CONSULTAS.tablas, [rol]);
  if (tablas.length > 0) {
    hallazgos.push(
      `tablas con acceso: ${tablas
        .slice(0, 10)
        .map((f) => `${nombre(f.esquema)}.${nombre(f.objeto)}`)
        .join(", ")}`,
    );
  }
  const secuencias = await conexion.consultar(CONSULTAS.secuencias, [rol]);
  if (secuencias.length > 0) hallazgos.push(`secuencias con acceso: ${secuencias.length}`);
  const funciones = await conexion.consultar(CONSULTAS.funciones, [rol]);
  const propias = funciones.filter((f) => f.esquema === ESQUEMA).map((f) => f.objeto);
  const sobran = diferencia(propias, previstas);
  const faltan = diferencia(previstas, propias);
  if (sobran.length > 0)
    hallazgos.push(`funciones no previstas de ${ESQUEMA}: ${sobran.map(nombre).join(", ")}`);
  if (faltan.length > 0)
    hallazgos.push(`funciones previstas sin permiso: ${faltan.map(nombre).join(", ")}`);
  const porEsquema = new Map();
  for (const f of funciones.filter((x) => x.esquema !== ESQUEMA)) {
    porEsquema.set(f.esquema, (porEsquema.get(f.esquema) ?? 0) + 1);
  }
  if (porEsquema.size > 0) {
    hallazgos.push(
      `funciones ajenas ejecutables (PUBLIC; AR-14): ${[...porEsquema].map(([e, n]) => `${nombre(e)}=${n}`).join(", ")}`,
    );
  }
  return hallazgos;
}

async function privilegiosSupabase(conexion) {
  const hallazgos = [];
  for (const rol of ROLES_SUPABASE) {
    const esquemas = (await conexion.consultar(CONSULTAS.esquemas, [rol])).filter(
      (f) => f.esquema === ESQUEMA,
    );
    const otras = [
      ...(await conexion.consultar(CONSULTAS.tablas, [rol])),
      ...(await conexion.consultar(CONSULTAS.secuencias, [rol])),
      ...(await conexion.consultar(CONSULTAS.funciones, [rol])),
    ].filter((f) => f.esquema === ESQUEMA);
    if (esquemas.length + otras.length > 0) {
      hallazgos.push(
        `${nombre(rol)} tiene ${esquemas.length + otras.length} privilegios en ${ESQUEMA}`,
      );
    }
  }
  return hallazgos;
}

/** Ejecuta las pruebas. Devuelve 0 si todas pasan. Dependencias inyectables (pruebas). */
export async function ejecutarPruebasBd({
  argv,
  entorno,
  conectar = conectarReal,
  leerRaiz = leerRaizReal,
  salida = (t) => process.stdout.write(`${t}\n`),
  errores = (t) => process.stderr.write(`${t}\n`),
}) {
  if (argv.length !== 0) {
    errores("Esta orden no acepta argumentos.");
    return 1;
  }
  const faltan = ROLES.filter(
    (r) => entorno[r.variable] === undefined || entorno[r.variable] === "",
  );
  if (faltan.length > 0) {
    errores(`Falta la variable: ${faltan.map((r) => r.variable).join(", ")}.`);
    return 1;
  }
  const resultados = [];
  const anotar = (ok, texto, motivo = "") => {
    resultados.push(ok);
    salida(`[${ok ? "OK" : "FALLA"}] ${texto}${ok || motivo === "" ? "" : `: ${motivo}`}`);
  };
  const malas = ROLES.filter((r) => !urlConforme(entorno[r.variable], r.nombre));
  anotar(
    malas.length === 0,
    "forma de las direcciones (agrupador de eu-north-1, puerto 6543, usuario del rol, sin consulta)",
    `no cumple: ${malas.map((r) => r.variable).join(", ")}`,
  );
  if (malas.length > 0) {
    salida("Sin direcciones conformes no se conecta.");
    return 1;
  }
  let ca;
  try {
    ca = leerRaiz();
  } catch {
    errores("No se pudo leer la raíz de Supabase del repositorio.");
    return 1;
  }

  const abiertas = [];
  const abrir = async (url, certificado, max) => {
    const c = await conectar({ url, ca: certificado, max });
    abiertas.push(c);
    return c;
  };
  try {
    let primera = null;
    for (const r of ROLES) {
      let conexion;
      try {
        conexion = await abrir(entorno[r.variable], ca, 2);
        const real = (await conexion.consultar(CONSULTAS.rol))[0]?.rol;
        if (real !== r.nombre) {
          anotar(false, `privilegios de ${r.nombre}`, "la conexión no entra con ese rol");
          continue;
        }
        primera ??= conexion;
        const hallazgos = await privilegiosDe(conexion, real, r.funciones);
        anotar(hallazgos.length === 0, `privilegios de ${r.nombre}`, hallazgos.join("; "));
      } catch (error) {
        anotar(
          false,
          `privilegios de ${r.nombre}`,
          `no se pudo consultar (SQLSTATE ${sqlstate(error)})`,
        );
      }
    }
    if (primera === null) {
      anotar(
        false,
        "roles de Supabase sin privilegios en conector_prueba",
        "sin conexión para comprobarlo",
      );
    } else {
      try {
        const hallazgos = await privilegiosSupabase(primera);
        anotar(
          hallazgos.length === 0,
          "roles de Supabase sin privilegios en conector_prueba",
          hallazgos.join("; "),
        );
      } catch (error) {
        anotar(
          false,
          "roles de Supabase sin privilegios en conector_prueba",
          `SQLSTATE ${sqlstate(error)}`,
        );
      }
    }

    // PRUEBA-008: diez a la vez por el agrupador, con el rol del conector.
    try {
      const diez = await abrir(entorno[ROLES[0].variable], ca, CONCURRENCIA);
      const recurso = "https://pruebas.invalid/api/mcp";
      const intentos = await Promise.allSettled(
        Array.from({ length: CONCURRENCIA }, () =>
          diez.consultar(CONSULTAS.concurrencia, [randomBytes(32).toString("hex"), recurso]),
        ),
      );
      const rechazados = intentos.filter((i) => i.status === "rejected");
      const distintos = intentos.filter((i) => i.status === "fulfilled" && i.value[0]?.r !== false);
      anotar(
        rechazados.length === 0 && distintos.length === 0,
        `diez a la vez por el agrupador (${CONCURRENCIA} llamadas a validar_acceso)`,
        rechazados.length > 0
          ? `${rechazados.length} rechazadas (SQLSTATE ${sqlstate(rechazados[0].reason)})`
          : `${distintos.length} respuestas distintas de falso`,
      );
    } catch (error) {
      anotar(
        false,
        `diez a la vez por el agrupador (${CONCURRENCIA} llamadas a validar_acceso)`,
        `SQLSTATE ${sqlstate(error)}`,
      );
    }

    // PRUEBA-018 (parte): sin la raíz de Supabase el certificado no se acepta.
    // Solo cuenta como rechazo por el certificado un código TLS de Node; otro error (red, límite, reinicio de la
    // conexión) no demuestra nada sobre el TLS y no se da por superado (art. 13).
    let motivo = "";
    try {
      const sinRaiz = await abrir(entorno[ROLES[0].variable], null, 1);
      await sinRaiz.consultar(CONSULTAS.rol);
      motivo =
        "la conexión se aceptó sin la raíz: el TLS no se está verificando, o la raíz ya es pública; decide el responsable";
    } catch (error) {
      motivo = esErrorTls(error)
        ? ""
        : `falló sin la raíz por una causa que no es el certificado (código ${codigoNodo(error)}): no se comprueba el TLS`;
    }
    anotar(
      motivo === "",
      "certificado verificado con la raíz de Supabase (sin ella se rechaza)",
      motivo,
    );
  } finally {
    for (const c of abiertas) await c.cerrar();
  }
  const falla = resultados.filter((r) => !r).length;
  salida(`Resultado: ${resultados.length - falla} correctas, ${falla} fallidas.`);
  return falla === 0 ? 0 : 1;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exitCode = await ejecutarPruebasBd({
    argv: process.argv.slice(2),
    entorno: {
      PRUEBAS_CONECTOR_BD_URL: process.env.PRUEBAS_CONECTOR_BD_URL,
      PRUEBAS_AUTORIZACION_BD_URL: process.env.PRUEBAS_AUTORIZACION_BD_URL,
    },
  });
}
