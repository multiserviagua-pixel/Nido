// T-111 (c) (001): `npm run conector:comprobar` y `npm run pruebas-bd`. PRUEBA-001 (parte, en local: metadatos,
// reto, 405, cabeceras con las rutas reales en proceso), PRUEBA-047 (parte: `arn1` y `eu-north-1`), V-3
// (trazado) y PRUEBA-019 (parte: la salida no lleva dirección ni credencial). Sin red real y sin base real:
// la función de red y el conector de base de datos son dobles. Valores compuestos en ejecución (art. 4).
import { randomBytes } from "node:crypto";
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import configuracionNext from "../../../next.config";
import { crearBd, type BdApoyo } from "../../conector/apoyo/index";

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const CARPETA = join(RAIZ, "scripts", "conector");
const COMPROBAR = join(CARPETA, "comprobar-conector.mjs");
const PRUEBAS_BD = join(CARPETA, "pruebas-bd.mjs");
const cargar = async <T>(ruta: string) =>
  (await import(/* @vite-ignore */ pathToFileURL(ruta).href)) as T;

type Lector = { pedir: (etiqueta: string, o?: { oculto?: boolean }) => Promise<string> };
interface Sistema {
  leerTexto: (ruta: string) => string | null;
  /** `git` en un clon: lanza si falla. Sin él, las comprobaciones del repositorio no se pueden dar por buenas. */
  git?: (argumentos: string[]) => string;
}
interface ModuloComprobar {
  ejecutarComprobacion(o: {
    argv: string[];
    lector: Lector;
    fetch: typeof fetch;
    salida: (t: string) => void;
    errores: (t: string) => void;
    sistema?: Sistema;
    entorno?: Record<string, string | undefined>;
  }): Promise<number>;
}

const HEX = randomBytes(4).toString("hex");
const URL_PRE = `https://pre-${HEX}.ejemplo.invalid`;
const HOST_PRE = new URL(URL_PRE).host;
const SHA = randomBytes(20).toString("hex");
const CANARIO = "TEXTO-CANARIO-" + randomBytes(6).toString("hex");
const VERCEL_ID = (region = "arn1") => `cdg1::${region}::abcde-1700000000000-0123456789ab`;

const urlBd = (rol: string): string =>
  ["postgres", "://", `${rol}.ref1`, ":", randomBytes(12).toString("hex"), "@"]
    .concat(["agrupador.ejemplo.invalid", ":6543", "/postgres"])
    .join("");

function entornoPreproduccion(): void {
  vi.stubEnv("ENTORNO", "preproduccion");
  vi.stubEnv("VERCEL", "1");
  vi.stubEnv("VERCEL_ENV", "preview");
  vi.stubEnv("VERCEL_REGION", "arn1");
  vi.stubEnv("VERCEL_URL", undefined);
  vi.stubEnv("NODE_ENV", "production");
  vi.stubEnv(
    "SUPERVISION_DSN",
    ["https://", "ab".repeat(16), "@o1.ingest.de.sentry.io/2"].join(""),
  );
  vi.stubEnv("COMMIT_DESPLEGADO", "1234abc");
  vi.stubEnv("URL_PUBLICA", URL_PRE);
  vi.stubEnv("CONECTOR_SECRETO", randomBytes(32).toString("base64url"));
  vi.stubEnv("CONECTOR_BD_URL", urlBd("conector_prueba_mcp"));
  vi.stubEnv("AUTORIZACION_BD_URL", urlBd("conector_prueba_gestion"));
  vi.stubEnv("OPERACION_HUELLA", randomBytes(32).toString("hex"));
}
function entornoLocal(): void {
  vi.stubEnv("ENTORNO", "desarrollo");
  vi.stubEnv("NODE_ENV", "development");
  for (const n of ["VERCEL", "VERCEL_ENV", "VERCEL_REGION", "VERCEL_URL", "SUPERVISION_DSN"]) {
    vi.stubEnv(n, undefined);
  }
  vi.stubEnv("COMMIT_DESPLEGADO", undefined);
  vi.stubEnv("URL_PUBLICA", "http://localhost:3000");
  vi.stubEnv("CONECTOR_SECRETO", randomBytes(32).toString("base64url"));
  vi.stubEnv("CONECTOR_BD_URL", urlBd("conector_prueba_mcp"));
  vi.stubEnv("AUTORIZACION_BD_URL", urlBd("conector_prueba_gestion"));
  vi.stubEnv("OPERACION_HUELLA", "0".repeat(64));
}
afterEach(() => vi.unstubAllEnvs());

// --- Servidor en proceso: rutas reales + cabeceras de next.config.ts (que aplica Next, no las rutas) ----------
type Manejador = (p: Request) => Promise<Response> | Response;
interface Rutas {
  [ruta: string]: Partial<Record<"GET" | "POST", Manejador>>;
}
async function rutasReales(): Promise<Rutas> {
  const recurso = await import(
    /* @vite-ignore */ "../../../src/app/.well-known/oauth-protected-resource/[[...ruta]]/route"
  );
  const servidor = await import(
    /* @vite-ignore */ "../../../src/app/.well-known/oauth-authorization-server/route"
  );
  const mcp = await import("../../../src/app/api/mcp/route");
  const operacion = await import("../../../src/app/api/operacion/route");
  const salud = await import("../../../src/app/api/salud/route");
  const autorizar = await import("../../../src/app/oauth/autorizar/route");
  return {
    "/.well-known/oauth-protected-resource": { GET: recurso.GET },
    "/.well-known/oauth-protected-resource/api/mcp": { GET: recurso.GET },
    "/.well-known/oauth-authorization-server": { GET: servidor.GET },
    "/api/mcp": { GET: mcp.GET, POST: mcp.POST },
    "/api/operacion": { GET: operacion.GET, POST: operacion.POST },
    "/api/salud": { GET: salud.GET },
    "/oauth/autorizar": { GET: autorizar.GET },
  };
}

async function cabecerasDeNext(ruta: string): Promise<Record<string, string>> {
  const reglas = (await configuracionNext.headers?.()) ?? [];
  const salida: Record<string, string> = {};
  for (const regla of reglas) {
    if (new RegExp(`^${regla.source}$`).test(ruta)) {
      for (const h of regla.headers) salida[h.key.toLowerCase()] = h.value;
    }
  }
  return salida;
}

interface OpcionesServidor {
  idVercel?: string | null;
  sinCabecerasNext?: boolean;
  alterar?: (ruta: string, metodo: string, r: Response) => Response | Promise<Response>;
}
function servidorEnProceso(rutas: Rutas, o: OpcionesServidor = {}) {
  const llamadas: string[] = [];
  const red = (async (entrada: string, init?: RequestInit) => {
    const peticion = new Request(entrada, init);
    const ruta = new URL(peticion.url).pathname;
    llamadas.push(`${peticion.method} ${ruta}`);
    const metodo = peticion.method as "GET" | "POST";
    const manejador = rutas[ruta]?.[metodo];
    let r = manejador ? await manejador(peticion) : new Response(null, { status: 404 });
    const cabeceras = new Headers(r.headers);
    if (!o.sinCabecerasNext) {
      for (const [k, v] of Object.entries(await cabecerasDeNext(ruta))) cabeceras.set(k, v);
    }
    if (o.idVercel !== null) cabeceras.set("x-vercel-id", o.idVercel ?? VERCEL_ID());
    r = new Response(await r.text(), { status: r.status, headers: cabeceras });
    return o.alterar ? o.alterar(ruta, peticion.method, r) : r;
  }) as typeof fetch;
  return { red, llamadas };
}

/** Copia de trabajo real (lee los archivos del repositorio) y `git` de un clon en el commit `SHA`. */
const sistemaReal = (o: { head?: string; estado?: string } = {}): Sistema => ({
  leerTexto: (ruta) => {
    try {
      return readFileSync(join(RAIZ, ruta), "utf8");
    } catch {
      return null;
    }
  },
  git: (a) => (a[0] === "rev-parse" ? `${o.head ?? SHA}\n` : (o.estado ?? "")),
});

async function comprobar(
  red: typeof fetch,
  entradas: string[] = [URL_PRE, SHA],
  argv: string[] = [],
  sistema?: Sistema,
  entorno: Record<string, string | undefined> = {},
) {
  const { ejecutarComprobacion } = await cargar<ModuloComprobar>(COMPROBAR);
  const lineas: string[] = [];
  const pedidos: { etiqueta: string; oculto: boolean }[] = [];
  const cola = [...entradas];
  const codigo = await ejecutarComprobacion({
    argv,
    lector: {
      pedir: async (etiqueta, op) => {
        pedidos.push({ etiqueta, oculto: op?.oculto !== false });
        const v = cola.shift();
        if (v === undefined) throw new Error("sin_entrada");
        return v;
      },
    },
    fetch: red,
    salida: (t) => lineas.push(t),
    errores: (t) => lineas.push(t),
    sistema: sistema ?? sistemaReal(),
    entorno,
  });
  return { codigo, texto: lineas.join("\n"), lineas, pedidos };
}
const linea = (texto: string, sub: string) => texto.split("\n").find((l) => l.includes(sub)) ?? "";

describe("PRUEBA-001 (parte, en proceso): metadatos, reto, 405, cabeceras y arn1 con las rutas reales", () => {
  beforeEach(entornoPreproduccion);

  it("MENOR-1 (auditor): con NODE_TLS_REJECT_UNAUTHORIZED=0 no pide nada, no llama y sale con error", async () => {
    const s = servidorEnProceso(await rutasReales());
    const r = await comprobar(s.red, [URL_PRE, SHA], [], undefined, {
      NODE_TLS_REJECT_UNAUTHORIZED: "0",
    });
    expect(r.codigo).not.toBe(0);
    expect(r.pedidos).toHaveLength(0);
    expect(r.texto).toMatch(/NODE_TLS_REJECT_UNAUTHORIZED=0/);
    expect(r.texto).not.toContain(HOST_PRE);
  });

  it("todo conforme: sale con 0, cada comprobación dice OK y no queda nada por decir de la dirección", async () => {
    const s = servidorEnProceso(await rutasReales());
    const r = await comprobar(s.red);
    expect(r.texto).not.toContain("FALLA");
    expect(r.codigo).toBe(0);
    for (const tema of [
      "metadatos del recurso",
      "metadatos del servidor",
      "reto 401",
      "405",
      "cabeceras",
      "arn1",
    ]) {
      expect(linea(r.texto, tema), tema).toContain("OK");
    }
    // La dirección sin eco; la huella del commit (no es secreta) con eco.
    expect(r.pedidos).toHaveLength(2);
    expect(r.pedidos[0]!.oculto).toBe(true);
    expect(r.pedidos[1]!.oculto).toBe(false);
    // Solo lecturas y un POST sin credencial; nada con credencial.
    expect(s.llamadas.every((l) => l.startsWith("GET ") || l === "POST /api/mcp")).toBe(true);
  });

  it("PRUEBA-019 (parte): la salida no lleva la dirección ni ninguna credencial", async () => {
    const s = servidorEnProceso(await rutasReales());
    const r = await comprobar(s.red);
    expect(r.texto).not.toContain(HOST_PRE);
    expect(r.texto).not.toContain("https://");
    expect(r.texto).not.toMatch(/hia_(a|r|op)_/);
    expect(r.texto).not.toMatch(/postgres(ql)?:\/\//);
  });

  it("lo que dice el servidor no se repite: cabeceras y cuerpos con canarios no salen", async () => {
    const s = servidorEnProceso(await rutasReales(), {
      alterar: (_ruta, _m, r) => {
        const h = new Headers(r.headers);
        h.set("x-canario", CANARIO);
        h.set("www-authenticate", CANARIO);
        return new Response(CANARIO, { status: 418, headers: h });
      },
    });
    const r = await comprobar(s.red);
    expect(r.codigo).not.toBe(0);
    expect(r.texto).not.toContain(CANARIO);
    expect(r.texto).not.toContain(HOST_PRE);
  });

  it("un fallo de red falla sin dejar la dirección ni el motivo ajeno", async () => {
    const r = await comprobar((async () => {
      throw new TypeError(`fallo de ${URL_PRE}`, { cause: new Error(URL_PRE) });
    }) as typeof fetch);
    expect(r.codigo).not.toBe(0);
    expect(r.texto).not.toContain(HOST_PRE);
    expect(r.texto).toContain("FALLA");
  });

  it("metadatos del recurso con otro recurso: FALLA", async () => {
    const s = servidorEnProceso(await rutasReales(), {
      alterar: async (ruta, _m, r) =>
        ruta.startsWith("/.well-known/oauth-protected-resource")
          ? new Response((await r.text()).replace(URL_PRE, `https://otro-${HEX}.ejemplo.invalid`), {
              status: r.status,
              headers: r.headers,
            })
          : r,
    });
    const r = await comprobar(s.red);
    expect(r.codigo).not.toBe(0);
    expect(linea(r.texto, "metadatos del recurso")).toContain("FALLA");
  });

  it("metadatos con CORS o sin no-store: FALLA", async () => {
    const s = servidorEnProceso(await rutasReales(), {
      alterar: (ruta, _m, r) => {
        if (!ruta.startsWith("/.well-known/")) return r;
        const h = new Headers(r.headers);
        h.set("access-control-allow-origin", "*");
        return new Response(r.body, { status: r.status, headers: h });
      },
    });
    expect((await comprobar(s.red)).codigo).not.toBe(0);
  });

  it("metadatos sin Cache-Control no-store: FALLA (recurso y servidor)", async () => {
    for (const tema of ["metadatos del recurso", "metadatos del servidor"]) {
      const s = servidorEnProceso(await rutasReales(), {
        alterar: (ruta, _m, r) => {
          if (!ruta.startsWith("/.well-known/")) return r;
          const h = new Headers(r.headers);
          h.delete("cache-control");
          return new Response(r.body, { status: r.status, headers: h });
        },
      });
      const r = await comprobar(s.red);
      expect(r.codigo).not.toBe(0);
      expect(linea(r.texto, tema), tema).toContain("FALLA");
    }
  });

  it("sin reto WWW-Authenticate o con otro recurso en el reto: FALLA", async () => {
    for (const reto of [
      null,
      `Bearer resource_metadata="https://otro.ejemplo.invalid/x", scope="agente"`,
    ]) {
      const s = servidorEnProceso(await rutasReales(), {
        alterar: (ruta, m, r) => {
          if (ruta !== "/api/mcp" || m !== "POST") return r;
          const h = new Headers(r.headers);
          if (reto === null) h.delete("www-authenticate");
          else h.set("www-authenticate", reto);
          return new Response(r.body, { status: r.status, headers: h });
        },
      });
      const r = await comprobar(s.red);
      expect(linea(r.texto, "reto 401")).toContain("FALLA");
    }
  });

  it("GET a /api/mcp que no da 405 con Allow: POST: FALLA", async () => {
    const s = servidorEnProceso(await rutasReales(), {
      alterar: (ruta, m, r) =>
        ruta === "/api/mcp" && m === "GET" ? new Response(null, { status: 200 }) : r,
    });
    expect(linea((await comprobar(s.red)).texto, "405")).toContain("FALLA");
  });

  it("sin las cabeceras de next.config.ts: FALLA", async () => {
    const s = servidorEnProceso(await rutasReales(), { sinCabecerasNext: true });
    expect(linea((await comprobar(s.red)).texto, "cabeceras")).toContain("FALLA");
  });

  it("/oauth/autorizar con Referrer-Policy no-referrer en lugar de same-origin: FALLA", async () => {
    const s = servidorEnProceso(await rutasReales(), {
      alterar: (ruta, _m, r) => {
        if (ruta !== "/oauth/autorizar") return r;
        const h = new Headers(r.headers);
        h.set("referrer-policy", "no-referrer");
        return new Response(r.body, { status: r.status, headers: h });
      },
    });
    expect(linea((await comprobar(s.red)).texto, "cabeceras")).toContain("FALLA");
  });

  it.each([
    ["función fuera de arn1", VERCEL_ID("fra1")],
    ["solo borde, sin segmento de función", "cdg1::abcde-1700000000000-0123456789ab"],
    ["sin cabecera", null],
    ["vacío", ""],
  ])("PRUEBA-047 (parte): %s: FALLA", async (_nombre, id) => {
    const s = servidorEnProceso(await rutasReales(), { idVercel: id });
    const r = await comprobar(s.red);
    expect(r.codigo).not.toBe(0);
    expect(linea(r.texto, "arn1")).toContain("FALLA");
  });

  it("V-3 (parte): con el clon limpio en el commit desplegado, `next.config.ts` de esta copia traza prompts/ y contratos/; el suceso tras responder y la traza de la compilación no se dan por comprobados", async () => {
    const s = servidorEnProceso(await rutasReales());
    const r = await comprobar(s.red);
    expect(linea(r.texto, "trazado")).toContain("OK");
    expect(linea(r.texto, "trazado")).toContain("en esta copia");
    expect(linea(r.texto, "traza de la compilación")).toContain("NO COMPROBADO");
    expect(r.texto).toMatch(/NO COMPROBADO.*suceso tras responder/);
  });

  it("V-3: la huella (SHA completo) distinta de HEAD, o el clon con cambios, deja las comprobaciones del repositorio en NO COMPROBADO", async () => {
    const otro = randomBytes(20).toString("hex");
    for (const sistema of [
      sistemaReal({ head: otro }),
      sistemaReal({ estado: " M next.config.ts\n" }),
      sistemaReal({ estado: "?? nuevo.ts\n" }),
      { leerTexto: sistemaReal().leerTexto },
      {
        ...sistemaReal(),
        git: () => {
          throw new Error("git no disponible");
        },
      },
    ] as Sistema[]) {
      const s = servidorEnProceso(await rutasReales());
      const r = await comprobar(s.red, [URL_PRE, SHA], [], sistema);
      expect(linea(r.texto, "trazado")).toContain("NO COMPROBADO");
      expect(linea(r.texto, "trazado")).not.toContain("OK");
      expect(r.codigo).toBe(0);
    }
  });

  it("V-3: una huella con otra forma que 40 hexadecimales en minúscula se rechaza sin llamar a nadie ni repetirla", async () => {
    for (const mala of ["", "abc123", SHA.toUpperCase(), `${SHA}0`, "HEAD", CANARIO]) {
      const llamadas: string[] = [];
      const r = await comprobar(
        (async (u: string) => {
          llamadas.push(u);
          return new Response(null);
        }) as unknown as typeof fetch,
        [URL_PRE, mala],
      );
      expect(r.codigo).not.toBe(0);
      expect(llamadas).toHaveLength(0);
      if (mala !== "") expect(r.texto).not.toContain(mala);
    }
  });

  it("V-3: sin la traza de contratos en la configuración, FALLA", async () => {
    const real = sistemaReal();
    const sistema: Sistema = {
      git: real.git,
      leerTexto: (ruta) => real.leerTexto(ruta)?.replace("./contratos/**", "./otra/**") ?? null,
    };
    const s = servidorEnProceso(await rutasReales());
    const r = await comprobar(s.red, [URL_PRE, SHA], [], sistema);
    expect(r.codigo).not.toBe(0);
    expect(linea(r.texto, "trazado")).toContain("FALLA");
  });

  it("V-3: contra un despliegue (https), la traza .nft.json de esta copia NO puede decir OK: la compilación se hizo en Vercel", async () => {
    const base = sistemaReal();
    for (const ficheros of [
      ["../../../../prompts/agente-prueba/uno.md", "../../../../contratos/informe.schema.json"],
      [],
    ]) {
      const nft = JSON.stringify({ version: 1, files: ficheros });
      const sistema: Sistema = {
        git: base.git,
        leerTexto: (ruta) => (ruta.endsWith("route.js.nft.json") ? nft : base.leerTexto(ruta)),
      };
      const s = servidorEnProceso(await rutasReales());
      const r = await comprobar(s.red, [URL_PRE, SHA], [], sistema);
      expect(linea(r.texto, "traza de la compilación")).toContain("NO COMPROBADO");
      expect(linea(r.texto, "traza de la compilación")).not.toContain("OK");
    }
  });
});

describe("PRUEBA-001 (parte, en local): contra next start en localhost", () => {
  beforeEach(entornoLocal);

  it("V-3 en local (next start de esta copia): sin huella, y con compilación la traza (.nft.json) debe incluir prompts/ y contratos/", async () => {
    const nft = (ficheros: string[]) => JSON.stringify({ version: 1, files: ficheros });
    const base = sistemaReal();
    for (const [ficheros, esperado] of [
      [
        ["../../../../prompts/agente-prueba/uno.md", "../../../../contratos/informe.schema.json"],
        "OK",
      ],
      [["../../../../contratos/informe.schema.json"], "FALLA"],
    ] as const) {
      const sistema: Sistema = {
        leerTexto: (ruta) =>
          ruta.endsWith("route.js.nft.json") ? nft([...ficheros]) : base.leerTexto(ruta),
      };
      const s = servidorEnProceso(await rutasReales(), { idVercel: null });
      const r = await comprobar(s.red, ["http://localhost:3000"], [], sistema);
      expect(r.pedidos).toHaveLength(1);
      expect(linea(r.texto, "trazado")).toContain("OK");
      expect(linea(r.texto, "traza de la compilación"), esperado).toContain(esperado);
      expect(linea(r.texto, "traza de la compilación")).toContain("en esta copia");
    }
  });

  it("metadatos, reto, 405 y cabeceras OK; arn1 no aplica en local y no se da por comprobado", async () => {
    const s = servidorEnProceso(await rutasReales(), { idVercel: null });
    const r = await comprobar(s.red, ["http://localhost:3000"]);
    expect(r.codigo).toBe(0);
    for (const tema of [
      "metadatos del recurso",
      "metadatos del servidor",
      "reto 401",
      "405",
      "cabeceras",
    ]) {
      expect(linea(r.texto, tema), tema).toContain("OK");
    }
    expect(linea(r.texto, "arn1")).toContain("NO COMPROBADO");
    expect(linea(r.texto, "arn1")).not.toContain("OK");
    expect(r.texto).not.toContain("localhost");
  });
});

describe("entrada de la comprobación", () => {
  it.each([["preproduccion"], ["--url"], ["x"]])(
    "argumentos %j: rechazo sin pedir nada",
    async (...argv) => {
      const r = await comprobar(
        (async () => new Response(null)) as typeof fetch,
        [URL_PRE],
        argv.flat(),
      );
      expect(r.codigo).not.toBe(0);
      expect(r.pedidos).toHaveLength(0);
    },
  );

  it.each([
    "http://pre.ejemplo.invalid",
    "https://pre.ejemplo.invalid/ruta",
    "https://u:p@pre.ejemplo.invalid",
    "ftp://x",
    "",
  ])("dirección %j no válida: no se llama a nadie ni se repite", async (direccion) => {
    const llamadas: string[] = [];
    const r = await comprobar(
      (async (u: string) => {
        llamadas.push(u);
        return new Response(null);
      }) as unknown as typeof fetch,
      [direccion],
    );
    expect(r.codigo).not.toBe(0);
    expect(llamadas).toHaveLength(0);
    if (direccion !== "") expect(r.texto).not.toContain(direccion);
  });

  it("el script no escribe en disco ni lee variables de entorno", () => {
    const fuente = readFileSync(COMPROBAR, "utf8");
    expect(fuente).not.toMatch(/writeFile|appendFile|createWriteStream|writeSync|openSync/);
    expect(fuente).not.toMatch(/process\.env/);
  });
});

// --- pruebas-bd -----------------------------------------------------------------------------------------
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

interface ModuloBd {
  CONSULTAS: Record<
    "rol" | "esquemas" | "tablas" | "secuencias" | "funciones" | "concurrencia",
    string
  >;
  ejecutarPruebasBd(o: {
    argv: string[];
    entorno: Record<string, string | undefined>;
    conectar: (o: { url: string; ca: string | null; max: number }) => Promise<Conexion>;
    leerRaiz: () => string;
    salida: (t: string) => void;
    errores: (t: string) => void;
  }): Promise<number>;
}
interface Conexion {
  consultar: (texto: string, parametros?: unknown[]) => Promise<Record<string, unknown>[]>;
  cerrar: () => Promise<void>;
}

const URL_MCP_BD = (host = "aws-1-eu-north-1.pooler.supabase.com", puerto = "6543", extra = "") =>
  [
    "postgres",
    "://",
    "conector_prueba_mcp.ref1",
    ":",
    randomBytes(12).toString("hex"),
    "@",
    host,
    ":",
    puerto,
    "/postgres",
    extra,
  ].join("");
const URL_GESTION_BD = () =>
  [
    "postgres",
    "://",
    "conector_prueba_gestion.ref1",
    ":",
    randomBytes(12).toString("hex"),
    "@aws-1-eu-north-1.pooler.supabase.com:6543/postgres",
  ].join("");

interface Ajustes {
  esquemasMcp?: string[];
  tablasMcp?: { esquema: string; objeto: string }[];
  funcionesMcp?: string[];
  funcionesGestion?: string[];
  ajenas?: { esquema: string; objeto: string }[];
  supabase?: { esquema: string; objeto: string }[];
  fallaConcurrencia?: string;
  aceptaSinRaiz?: boolean;
  /** Código del error al conectar sin la raíz (por defecto, el de un certificado no confiable). */
  codigoSinRaiz?: string;
  errorConMensaje?: boolean;
}

async function correrBd(
  entorno: Record<string, string | undefined>,
  a: Ajustes = {},
  argv: string[] = [],
) {
  const m = await cargar<ModuloBd>(PRUEBAS_BD);
  const lineas: string[] = [];
  const conexiones: string[] = [];
  const abiertas = { n: 0, cerradas: 0 };
  const conectar = async ({ url, ca, max }: { url: string; ca: string | null; max: number }) => {
    conexiones.push(`${ca === null ? "sin-raiz" : "con-raiz"}:${max}`);
    if (ca === null && !a.aceptaSinRaiz) {
      throw Object.assign(new Error(`certificado de ${url}`), {
        code: a.codigoSinRaiz ?? "SELF_SIGNED_CERT_IN_CHAIN",
      });
    }
    const rol = /\/\/(conector_prueba_[a-z]+)\./.exec(url)![1]!;
    abiertas.n += 1;
    return {
      consultar: async (texto: string, p: unknown[] = []) => {
        if (texto === m.CONSULTAS.rol) return [{ rol }];
        const consultado = p[0];
        const delSistema =
          consultado === "anon" || consultado === "authenticated" || consultado === "service_role";
        if (texto === m.CONSULTAS.esquemas) {
          if (delSistema)
            return (a.supabase ?? []).filter((x) => !x.objeto).map((x) => ({ esquema: x.esquema }));
          return (
            rol === "conector_prueba_mcp"
              ? (a.esquemasMcp ?? ["conector_prueba"])
              : ["conector_prueba"]
          ).map((e) => ({ esquema: e }));
        }
        if (texto === m.CONSULTAS.tablas) {
          if (delSistema) return (a.supabase ?? []).filter((x) => x.objeto).map((x) => ({ ...x }));
          return rol === "conector_prueba_mcp" ? (a.tablasMcp ?? []) : [];
        }
        if (texto === m.CONSULTAS.secuencias) return [];
        if (texto === m.CONSULTAS.funciones) {
          if (delSistema) return [];
          const propias = (
            rol === "conector_prueba_mcp"
              ? (a.funcionesMcp ?? FUNCIONES_MCP)
              : (a.funcionesGestion ?? FUNCIONES_GESTION)
          ).map((objeto) => ({ esquema: "conector_prueba", objeto }));
          return [...propias, ...(a.ajenas ?? [])];
        }
        if (texto === m.CONSULTAS.concurrencia) {
          if (a.fallaConcurrencia) {
            throw Object.assign(new Error(`límite en ${url}`), { code: a.fallaConcurrencia });
          }
          return [{ r: false }];
        }
        throw new Error("consulta no prevista");
      },
      cerrar: async () => {
        abiertas.cerradas += 1;
      },
    } satisfies Conexion;
  };
  const codigo = await m.ejecutarPruebasBd({
    argv,
    entorno,
    conectar,
    leerRaiz: () => "-----RAIZ-DE-PRUEBA-----",
    salida: (t) => lineas.push(t),
    errores: (t) => lineas.push(t),
  });
  return { codigo, texto: lineas.join("\n"), conexiones, abiertas };
}

const entornoBd = () => ({
  PRUEBAS_CONECTOR_BD_URL: URL_MCP_BD(),
  PRUEBAS_AUTORIZACION_BD_URL: URL_GESTION_BD(),
});

describe("pruebas-bd: PRUEBA-022 (L, parte), PRUEBA-008 (L, parte), PRUEBA-018 (parte), PRUEBA-047 (parte)", () => {
  it("todo conforme: sale con 0, cierra todas las conexiones y la salida no lleva URL ni contraseña", async () => {
    const e = entornoBd();
    const r = await correrBd(e);
    expect(r.codigo).toBe(0);
    expect(r.texto).not.toContain("FALLA");
    for (const tema of [
      "forma de las direcciones",
      "privilegios de conector_prueba_mcp",
      "privilegios de conector_prueba_gestion",
      "roles de Supabase",
      "diez a la vez",
      "certificado",
    ]) {
      expect(linea(r.texto, tema), tema).toContain("OK");
    }
    expect(r.abiertas.cerradas).toBe(r.abiertas.n);
    for (const v of Object.values(e)) {
      const u = new URL(v);
      expect(r.texto).not.toContain(u.password);
      expect(r.texto).not.toContain(u.host);
      expect(r.texto).not.toContain(v);
    }
    expect(r.texto).not.toMatch(/postgres(ql)?:\/\//);
  });

  it("las diez consultas a la vez usan un agrupador con hasta diez conexiones", async () => {
    const r = await correrBd(entornoBd());
    expect(r.conexiones.some((c) => c === "con-raiz:10")).toBe(true);
  });

  it("un privilegio de más en una tabla: FALLA, con el nombre del objeto pero no de la URL", async () => {
    const r = await correrBd(entornoBd(), {
      tablasMcp: [{ esquema: "conector_prueba", objeto: "licencias" }],
    });
    expect(r.codigo).not.toBe(0);
    expect(linea(r.texto, "privilegios de conector_prueba_mcp")).toContain("FALLA");
  });

  it("una función de gestión ejecutable por mcp: FALLA", async () => {
    const r = await correrBd(entornoBd(), { funcionesMcp: [...FUNCIONES_MCP, "cerrar_prueba"] });
    expect(r.codigo).not.toBe(0);
    expect(linea(r.texto, "privilegios de conector_prueba_mcp")).toContain("FALLA");
  });

  it("una función prevista que falta: FALLA", async () => {
    const r = await correrBd(entornoBd(), { funcionesGestion: FUNCIONES_GESTION.slice(1) });
    expect(r.codigo).not.toBe(0);
    expect(linea(r.texto, "privilegios de conector_prueba_gestion")).toContain("FALLA");
  });

  it("funciones ajenas ejecutables (PUBLIC; AR-14): FALLA con el recuento por esquema", async () => {
    const r = await correrBd(entornoBd(), {
      ajenas: [
        { esquema: "extensions", objeto: "una" },
        { esquema: "extensions", objeto: "otra" },
      ],
    });
    expect(r.codigo).not.toBe(0);
    expect(r.texto).toMatch(/extensions.*2/);
  });

  it("un rol de Supabase con acceso a conector_prueba: FALLA", async () => {
    const r = await correrBd(entornoBd(), {
      supabase: [{ esquema: "conector_prueba", objeto: "licencias" }],
    });
    expect(r.codigo).not.toBe(0);
    expect(linea(r.texto, "roles de Supabase")).toContain("FALLA");
  });

  it("un límite del rol o del agrupador en la concurrencia: FALLA con el código SQLSTATE y sin el mensaje", async () => {
    const e = entornoBd();
    const r = await correrBd(e, { fallaConcurrencia: "53300" });
    expect(r.codigo).not.toBe(0);
    expect(linea(r.texto, "diez a la vez")).toContain("FALLA");
    expect(r.texto).toContain("53300");
    expect(r.texto).not.toContain(new URL(e.PRUEBAS_CONECTOR_BD_URL).host);
  });

  it("PRUEBA-018 (parte): si sin la raíz de Supabase la conexión se acepta, el TLS no se verifica: FALLA", async () => {
    const r = await correrBd(entornoBd(), { aceptaSinRaiz: true });
    expect(r.codigo).not.toBe(0);
    expect(linea(r.texto, "certificado")).toContain("FALLA");
  });

  it.each([
    "SELF_SIGNED_CERT_IN_CHAIN",
    "UNABLE_TO_GET_ISSUER_CERT_LOCALLY",
    "UNABLE_TO_VERIFY_LEAF_SIGNATURE",
  ])(
    "PRUEBA-018 (parte): sin la raíz, un rechazo del certificado (%s) cuenta como superado",
    async (codigoSinRaiz) => {
      const r = await correrBd(entornoBd(), { codigoSinRaiz });
      expect(linea(r.texto, "certificado")).toContain("OK");
      expect(r.codigo).toBe(0);
    },
  );

  it.each(["ECONNRESET", "ETIMEDOUT", "ENOTFOUND", "53300"])(
    "PRUEBA-018 (parte): sin la raíz, un error que no es del certificado (%s) no se da por superado",
    async (codigoSinRaiz) => {
      const r = await correrBd(entornoBd(), { codigoSinRaiz });
      expect(r.codigo).not.toBe(0);
      expect(linea(r.texto, "certificado")).toContain("FALLA");
      expect(linea(r.texto, "certificado")).toContain("no se comprueba el TLS");
    },
  );

  it.each([
    ["host de otra región", URL_MCP_BD("aws-1-eu-central-1.pooler.supabase.com")],
    ["host que no es del agrupador", URL_MCP_BD("db.ejemplo.invalid")],
    ["puerto 5432", URL_MCP_BD(undefined, "5432")],
    ["consulta sslmode", URL_MCP_BD(undefined, undefined, "?sslmode=disable")],
    ["consulta options", URL_MCP_BD(undefined, undefined, "?options=-c%20x%3Dy")],
    ["usuario de gestión en la variable de mcp", URL_GESTION_BD()],
  ])(
    "PRUEBA-047/V-10 (parte): %s: se rechaza antes de conectar, sin repetir la URL",
    async (_n, mala) => {
      const e = { ...entornoBd(), PRUEBAS_CONECTOR_BD_URL: mala };
      const r = await correrBd(e);
      expect(r.codigo).not.toBe(0);
      expect(r.conexiones).toHaveLength(0);
      expect(r.texto).not.toContain(mala);
      expect(r.texto).not.toContain(new URL(mala).password);
    },
  );

  it("falta una variable: se dice cuál (el nombre) y no se conecta", async () => {
    const r = await correrBd({ PRUEBAS_CONECTOR_BD_URL: URL_MCP_BD() });
    expect(r.codigo).not.toBe(0);
    expect(r.texto).toContain("PRUEBAS_AUTORIZACION_BD_URL");
    expect(r.conexiones).toHaveLength(0);
  });

  it("no acepta argumentos", async () => {
    const r = await correrBd(entornoBd(), {}, ["--url=x"]);
    expect(r.codigo).not.toBe(0);
    expect(r.conexiones).toHaveLength(0);
  });

  it("no escribe en disco y solo lee las dos variables de pruebas", () => {
    const fuente = readFileSync(PRUEBAS_BD, "utf8");
    expect(fuente).not.toMatch(/writeFile|appendFile|createWriteStream|writeSync|openSync/);
    const usos = [...fuente.matchAll(/process\.env(\.\w+)?/g)].map((m) => m[1]);
    expect(usos.length).toBeGreaterThan(0);
    for (const uso of usos) {
      expect([".PRUEBAS_CONECTOR_BD_URL", ".PRUEBAS_AUTORIZACION_BD_URL"]).toContain(uso);
    }
  });
});

describe("pruebas-bd: las CONSULTAS reales contra el catálogo de Postgres (PGlite con 001_estado.sql)", () => {
  let bd: BdApoyo | null = null;
  afterEach(async () => {
    await bd?.cerrar();
    bd = null;
  });

  const consultar = async (m: ModuloBd, clave: keyof ModuloBd["CONSULTAS"], rol: string) =>
    (await bd!.db.query<Record<string, string>>(m.CONSULTAS[clave], [rol])).rows;

  it("no fallan (p. ej. has_sequence_privilege sobre un índice, 42809) y devuelven lo esperado para los dos roles y los de Supabase", async () => {
    vi.setConfig({ testTimeout: 60_000, hookTimeout: 60_000 });
    const m = await cargar<ModuloBd>(PRUEBAS_BD);
    bd = await crearBd();
    const previstas: Record<string, string[]> = {
      conector_prueba_mcp: FUNCIONES_MCP,
      conector_prueba_gestion: FUNCIONES_GESTION,
    };
    for (const [rol, funciones] of Object.entries(previstas)) {
      const esquemas = (await consultar(m, "esquemas", rol)).map((f) => f.esquema);
      expect(esquemas, rol).toContain("conector_prueba");
      expect(await consultar(m, "tablas", rol), rol).toEqual([]);
      expect(await consultar(m, "secuencias", rol), rol).toEqual([]);
      const propias = (await consultar(m, "funciones", rol))
        .filter((f) => f.esquema === "conector_prueba")
        .map((f) => f.objeto)
        .sort();
      expect(propias, rol).toEqual([...funciones].sort());
    }
    for (const rol of ["anon", "authenticated", "service_role"]) {
      const propios = [
        ...(await consultar(m, "esquemas", rol)),
        ...(await consultar(m, "tablas", rol)),
        ...(await consultar(m, "secuencias", rol)),
        ...(await consultar(m, "funciones", rol)),
      ].filter((f) => f.esquema === "conector_prueba");
      expect(propios, rol).toEqual([]);
    }
  });

  it("detecta de verdad: una tabla y una secuencia con permiso aparecen; sin permiso no", async () => {
    const m = await cargar<ModuloBd>(PRUEBAS_BD);
    bd = await crearBd();
    await bd.db.exec(
      "create sequence conector_prueba.secuencia_de_prueba; grant usage on sequence conector_prueba.secuencia_de_prueba to conector_prueba_mcp; grant select on conector_prueba.licencias to conector_prueba_mcp",
    );
    const secuencias = await consultar(m, "secuencias", "conector_prueba_mcp");
    expect(secuencias.map((f) => f.objeto)).toEqual(["secuencia_de_prueba"]);
    const tablas = await consultar(m, "tablas", "conector_prueba_mcp");
    expect(tablas.map((f) => f.objeto)).toEqual(["licencias"]);
    expect(await consultar(m, "secuencias", "conector_prueba_gestion")).toEqual([]);
  });
});
