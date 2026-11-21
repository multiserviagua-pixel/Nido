// T-105 (a) (001): conector.ts (rol mcp, `postgres` por el agrupador). PRUEBA-018 (parte): almacén caído;
// certificado no confiable -> fallo SIN consultar; errores de Postgres sin `message`, `detail` ni
// `where`. Los servidores son efímeros en 127.0.0.1 (el guardián de red solo permite el bucle local).
// Solo `src/mcp/` importa `conector.ts` (frontera). Valores sembrados compuestos en ejecución.
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, readdirSync, rmSync, statSync } from "node:fs";
import net from "node:net";
import { tmpdir } from "node:os";
import { join, relative } from "node:path";
import tls from "node:tls";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ErrorDeAplicacion } from "../../../src/lib/plataforma/errores";
import { alcanzables, construirGrafo } from "../diseno/apoyo/grafo";
import {
  crearAdaptadorPostgres,
  leerRaizConfiable,
  type FabricaPostgres,
} from "../../../src/lib/supabase/conector";

afterEach(() => vi.restoreAllMocks());

const CANARIO = "TEXTO-CANARIO-" + "CONECTOR-123";
const RAIZ_REPO = process.cwd();
const url = (puerto: number) =>
  [
    "postgresql://",
    "conector_prueba_mcp.ref",
    ":",
    "x".repeat(12),
    "@127.0.0.1:",
    puerto,
    "/postgres",
  ].join("");
const CA = readFileSync(
  join(RAIZ_REPO, "supabase", "conector-prueba", "raiz-supabase.crt"),
  "utf8",
);

async function falla(promesa: Promise<unknown>): Promise<ErrorDeAplicacion> {
  try {
    await promesa;
  } catch (e) {
    expect(e).toBeInstanceOf(ErrorDeAplicacion);
    return e as ErrorDeAplicacion;
  }
  throw new Error("no falló");
}

// Doble de la fábrica de `postgres`: registra las opciones y las consultas, nunca sale a la red.
function dobleFabrica(unsafe: (q: string, p: unknown[]) => Promise<unknown>) {
  const registro: { url?: string; opciones?: Record<string, unknown>; consultas: string[] } = {
    consultas: [],
  };
  let cerrado = 0;
  const fabrica = ((direccion: string, opciones: Record<string, unknown>) => {
    registro.url = direccion;
    registro.opciones = opciones;
    return {
      unsafe: (q: string, p: unknown[]) => {
        registro.consultas.push(q);
        return unsafe(q, p);
      },
      end: () => {
        cerrado++;
        return Promise.resolve();
      },
    };
  }) as unknown as FabricaPostgres;
  return { fabrica, registro, cerrados: () => cerrado };
}

describe("conector.ts: opciones de conexión (V§9.2, diseño §Datos «Conexión»)", () => {
  it("TLS verificando certificado y nombre con la raíz de Supabase, sin sentencias preparadas, dos conexiones, 5 s", async () => {
    const d = dobleFabrica(() => Promise.resolve([{ r: true }]));
    const adaptador = crearAdaptadorPostgres({ url: url(6543), ca: CA, fabrica: d.fabrica });
    expect(
      await adaptador.llamar("validar_acceso", ["a".repeat(64), "https://x.test/api/mcp"]),
    ).toBe(true);
    expect(d.registro.url).toBe(url(6543));
    expect(d.registro.opciones).toMatchObject({
      ssl: { ca: CA, rejectUnauthorized: true },
      prepare: false,
      max: 2,
      connect_timeout: 5,
      fetch_types: false,
    });
    // Nada de `onnotice` que imprima: se pasa una función que no hace nada.
    expect(typeof d.registro.opciones!.onnotice).toBe("function");
    expect(d.registro.consultas).toEqual(["select conector_prueba.validar_acceso($1, $2) as r"]);
    await adaptador.cerrar();
    expect(d.cerrados()).toBe(1);
  });

  it("sin raíz configurada no se crea la conexión: falla cerrado", () => {
    const d = dobleFabrica(() => Promise.resolve([{ r: true }]));
    expect(() => crearAdaptadorPostgres({ url: url(6543), ca: "", fabrica: d.fabrica })).toThrow(
      ErrorDeAplicacion,
    );
    expect(d.registro.url).toBeUndefined();
  });

  it("solo funciones de la lista cerrada: otro nombre no se consulta", async () => {
    const d = dobleFabrica(() => Promise.resolve([{ r: true }]));
    const adaptador = crearAdaptadorPostgres({ url: url(6543), ca: CA, fabrica: d.fabrica });
    for (const nombre of [
      "pg_sleep",
      "validar_acceso; drop table x",
      "conector_prueba.validar_acceso",
      "",
    ]) {
      expect((await falla(adaptador.llamar(nombre, []))).codigo).toBe("almacen_no_disponible");
    }
    expect(d.registro.consultas).toEqual([]);
  });

  it("un error de Postgres con message, detail y where sale como almacen_no_disponible, sin ninguno de ellos", async () => {
    const consola = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const registro = vi.spyOn(console, "log").mockImplementation(() => undefined);
    const d = dobleFabrica(() =>
      Promise.reject(
        Object.assign(new Error(`message ${CANARIO}`), {
          detail: CANARIO,
          where: CANARIO,
          hint: CANARIO,
          code: "22P02",
        }),
      ),
    );
    const adaptador = crearAdaptadorPostgres({ url: url(6543), ca: CA, fabrica: d.fabrica });
    const e = await falla(adaptador.llamar("validar_acceso", ["a".repeat(64), "r"]));
    expect(e.message).toBe("almacen_no_disponible");
    expect((e as { cause?: unknown }).cause).toBeUndefined();
    expect(Object.keys(e)).not.toContain("detail");
    expect(JSON.stringify(e) + e.stack).not.toContain(CANARIO);
    expect(consola).not.toHaveBeenCalled();
    expect(registro).not.toHaveBeenCalled();
  });

  it("el adaptador no tiene más superficie que llamar y cerrar", () => {
    const d = dobleFabrica(() => Promise.resolve([]));
    const adaptador = crearAdaptadorPostgres({ url: url(6543), ca: CA, fabrica: d.fabrica });
    expect(Object.keys(adaptador).sort()).toEqual(["cerrar", "llamar"]);
  });
});

describe("conector.ts con el cliente `postgres` real contra un servidor local (PRUEBA-018, parte)", () => {
  // Servidor que dice no hablar TLS ('N'): el cliente no debe seguir en claro.
  it("servidor que dice no hablar TLS: el cliente no baja a texto claro y no envía arranque ni consulta", async () => {
    const recibido: Buffer[] = [];
    const servidor = net.createServer((s) => {
      s.on("data", (d) => {
        recibido.push(Buffer.from(d));
        s.write("N");
      });
      s.on("error", () => undefined);
    });
    await new Promise<void>((r) => servidor.listen(0, "127.0.0.1", r));
    const { port } = servidor.address() as net.AddressInfo;
    const adaptador = crearAdaptadorPostgres({ url: url(port), ca: CA });
    try {
      const e = await falla(adaptador.llamar("validar_acceso", ["a".repeat(64), "r"]));
      expect(e.codigo).toBe("almacen_no_disponible");
      // Nota (revisión 8): esta comprobación de bytes admite el saludo TLS (0x16) de postgres.js tras la
      // petición SSL; lo que nunca puede haber es el arranque de Postgres ni el nombre del rol.
      // postgres.js 3.4.9 con `ssl` de objeto sigue con TLS aunque el servidor diga 'N' (comprobado en
      // su código): nunca en claro. Tras la petición SSL (8 bytes) solo puede ir un registro TLS de
      // saludo (0x16), sin mensaje de arranque de Postgres ni el nombre del rol.
      const total = Buffer.concat(recibido);
      expect(total.readInt32BE(4)).toBe(80877103);
      const resto = total.subarray(8);
      if (resto.length > 0) expect(resto[0]).toBe(0x16);
      expect(total.includes(Buffer.from("conector_prueba_mcp"))).toBe(false);
      expect(total.includes(Buffer.from("validar_acceso"))).toBe(false);
    } finally {
      await adaptador.cerrar();
      await new Promise((r) => servidor.close(r));
    }
  }, 15000);

  // Certificados autofirmados generados en la prueba (sin openssl: se omite en local y FALLA en CI).
  const hayOpenssl = spawnSync("openssl", ["version"]).status === 0;
  const exigirOpenssl = (omitir: () => void) => {
    if (hayOpenssl) return;
    if (process.env.CI)
      throw new Error("openssl no está disponible en CI: la prueba no puede omitirse");
    omitir();
  };
  function generarCertificado(carpeta: string, san: string): { key: Buffer; cert: Buffer } {
    const r = spawnSync(
      "openssl",
      [
        "req",
        "-x509",
        "-newkey",
        "rsa:2048",
        "-nodes",
        "-days",
        "1",
        "-keyout",
        join(carpeta, "k.pem"),
        "-out",
        join(carpeta, "c.pem"),
        "-subj",
        "/CN=prueba.invalid",
        "-addext",
        `subjectAltName=${san}`,
      ],
      { encoding: "utf8" },
    );
    expect(r.status).toBe(0);
    return {
      key: readFileSync(join(carpeta, "k.pem")),
      cert: readFileSync(join(carpeta, "c.pem")),
    };
  }
  // Servidor que acepta TLS con el certificado dado y cuenta lo que llega tras el apretón.
  async function servidorTls(key: Buffer, cert: Buffer) {
    const cuenta = { bytesDeAplicacion: 0, apreton: 0 };
    const servidor = net.createServer((s) => {
      s.once("data", () => {
        s.write("S");
        const t = new tls.TLSSocket(s, { isServer: true, key, cert });
        t.on("secure", () => cuenta.apreton++);
        t.on("data", (d) => {
          cuenta.bytesDeAplicacion += d.length;
          t.destroy();
          s.destroy();
        });
        t.on("error", () => undefined);
      });
      s.on("error", () => undefined);
    });
    await new Promise<void>((res) => servidor.listen(0, "127.0.0.1", res));
    const { port } = servidor.address() as net.AddressInfo;
    return { cuenta, port, cerrar: () => new Promise((res) => servidor.close(res)) };
  }

  it("certificado no confiable: falla y el servidor no recibe ni un byte de aplicación", async (contexto) => {
    exigirOpenssl(() => contexto.skip());
    const carpeta = mkdtempSync(join(tmpdir(), "tls-"));
    try {
      const { key, cert } = generarCertificado(carpeta, "IP:127.0.0.1");
      const s = await servidorTls(key, cert);
      // Raíz de Supabase como única confianza: el autofirmado no está firmado por ella.
      const adaptador = crearAdaptadorPostgres({ url: url(s.port), ca: CA });
      try {
        const e = await falla(adaptador.llamar("validar_acceso", ["a".repeat(64), "r"]));
        expect(e.codigo).toBe("almacen_no_disponible");
        expect(s.cuenta.bytesDeAplicacion).toBe(0);
        expect(s.cuenta.apreton).toBe(0);
      } finally {
        await adaptador.cerrar();
        await s.cerrar();
      }
    } finally {
      rmSync(carpeta, { recursive: true, force: true });
    }
  }, 20000);

  it("nombre que no coincide: certificado de confianza para otro host -> falla sin consultar (con control: el del host correcto sí llega a enviar)", async (contexto) => {
    exigirOpenssl(() => contexto.skip());
    const carpeta = mkdtempSync(join(tmpdir(), "tls-"));
    try {
      // Control: certificado de confianza (es la raíz) para el nombre que usa el cliente (localhost): el cliente sí envía su arranque.
      const bueno = generarCertificado(carpeta, "DNS:localhost");
      const sBueno = await servidorTls(bueno.key, bueno.cert);
      const aBueno = crearAdaptadorPostgres({
        url: url(sBueno.port),
        ca: bueno.cert.toString("utf8"),
      });
      try {
        // Sin esperar a que termine (el servidor de la prueba no habla Postgres): basta con que llegue.
        void aBueno.llamar("validar_acceso", ["a".repeat(64), "r"]).catch(() => undefined);
        for (let i = 0; i < 60 && sBueno.cuenta.bytesDeAplicacion === 0; i += 1) {
          await new Promise((r) => setTimeout(r, 50));
        }
        expect(sBueno.cuenta.bytesDeAplicacion).toBeGreaterThan(0);
      } finally {
        await aBueno.cerrar();
        await sBueno.cerrar();
      }
      // Mismo caso, pero el certificado, igualmente de confianza, es para otro nombre.
      const ajeno = generarCertificado(carpeta, "DNS:otro-host.invalid");
      const sAjeno = await servidorTls(ajeno.key, ajeno.cert);
      const aAjeno = crearAdaptadorPostgres({
        url: url(sAjeno.port),
        ca: ajeno.cert.toString("utf8"),
      });
      try {
        const e = await falla(aAjeno.llamar("validar_acceso", ["a".repeat(64), "r"]));
        expect(e.codigo).toBe("almacen_no_disponible");
        expect(sAjeno.cuenta.bytesDeAplicacion).toBe(0);
      } finally {
        await aAjeno.cerrar();
        await sAjeno.cerrar();
      }
    } finally {
      rmSync(carpeta, { recursive: true, force: true });
    }
  }, 30000);

  it("servidor caído (puerto cerrado): almacen_no_disponible", async () => {
    const servidor = net.createServer();
    await new Promise<void>((r) => servidor.listen(0, "127.0.0.1", r));
    const { port } = servidor.address() as net.AddressInfo;
    await new Promise((r) => servidor.close(r));
    const adaptador = crearAdaptadorPostgres({ url: url(port), ca: CA });
    try {
      expect((await falla(adaptador.llamar("validar_acceso", ["a".repeat(64), "r"]))).codigo).toBe(
        "almacen_no_disponible",
      );
    } finally {
      await adaptador.cerrar();
    }
  }, 15000);
});

describe("raíz de confianza", () => {
  it("se lee la raíz de Supabase del repositorio y es un certificado", () => {
    const pem = leerRaizConfiable();
    expect(pem).toContain("BEGIN CERTIFICATE");
    expect(pem).toBe(CA);
  });
});

// Frontera (skill herramienta-mcp): solo `src/mcp/` importa `conector.ts`; `src/mcp/` no importa los
// clientes con la clave secreta ni el de sesión; solo `conector.ts` importa `postgres`.
function archivos(carpeta: string): string[] {
  const salida: string[] = [];
  for (const nombre of readdirSync(carpeta)) {
    const ruta = join(carpeta, nombre);
    if (statSync(ruta).isDirectory()) salida.push(...archivos(ruta));
    else if (/\.(ts|tsx|mjs)$/.test(nombre)) salida.push(ruta);
  }
  return salida;
}
const rel = (ruta: string) => relative(RAIZ_REPO, ruta).split("\\").join("/");
const importa = (texto: string, patron: RegExp) => patron.test(texto);

describe("fronteras de importación", () => {
  const fuentes = archivos(join(RAIZ_REPO, "src")).map((r) => ({
    ruta: rel(r),
    texto: readFileSync(r, "utf8"),
  }));
  const IMPORTA_CONECTOR =
    /from\s+["'][^"']*supabase\/conector["']|import\(\s*["'][^"']*supabase\/conector["']/;

  it("solo src/mcp/ importa supabase/conector", () => {
    const infractores = fuentes
      .filter((f) => importa(f.texto, IMPORTA_CONECTOR))
      .map((f) => f.ruta)
      .filter((r) => !r.startsWith("src/mcp/"));
    expect(infractores).toEqual([]);
  });

  it("src/mcp/ no importa admin ni servidor, ni usa la clave secreta", () => {
    for (const f of fuentes.filter((x) => x.ruta.startsWith("src/mcp/"))) {
      expect(f.texto, f.ruta).not.toMatch(/supabase\/(admin|servidor|autorizacion)["']/);
      expect(f.texto, f.ruta).not.toMatch(/SECRET_KEY|SERVICE_ROLE/i);
    }
  });

  // MENOR-8 del revisor: tampoco por una cadena de importaciones. Se recorre el grafo de módulos desde cada
  // archivo de `src/mcp/` (también reexportaciones y tipos) y no debe alcanzar el rol de gestión ni los
  // clientes con la clave secreta o de sesión.
  it("src/mcp/ no alcanza autorizacion, admin ni servidor, ni siquiera de forma transitiva", () => {
    const grafo = construirGrafo(RAIZ_REPO);
    const origenes = [...grafo.modulos.keys()].filter((r) => r.startsWith("src/mcp/"));
    expect(origenes.length).toBeGreaterThan(0);
    const alcance = alcanzables(grafo, origenes, { incluirTipos: true });
    const vetados = [
      "src/lib/supabase/autorizacion.ts",
      "src/lib/supabase/admin.ts",
      "src/lib/supabase/servidor.ts",
    ];
    for (const vetado of vetados) {
      expect(alcance.modulos.has(vetado), `${vetado}: ${alcance.cadena(vetado).join(" -> ")}`).toBe(
        false,
      );
    }
    // El módulo que sí debe alcanzar sigue alcanzándose (la prueba no es vacía).
    expect(alcance.modulos.has("src/lib/supabase/conector.ts")).toBe(true);
  });

  it("solo conector.ts y autorizacion.ts importan el cliente `postgres`", () => {
    const infractores = fuentes
      .filter((f) => importa(f.texto, /from\s+["']postgres["']|require\(\s*["']postgres["']/))
      .map((f) => f.ruta)
      .filter(
        (r) => r !== "src/lib/supabase/conector.ts" && r !== "src/lib/supabase/autorizacion.ts",
      );
    expect(infractores).toEqual([]);
  });
});
