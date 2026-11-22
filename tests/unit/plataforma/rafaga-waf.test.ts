// T-119 (a) (001): lógica de `scripts/conector/rafaga-waf.mjs` (ráfaga contra el límite de peticiones del WAF;
// dictamen del auditor sobre T-117 (a), 21/11/2026). Aquí NO se prueba el WAF de Vercel: se prueba que el
// script cuenta bien, decide bien (SUPERADA, FALLIDA, NO CONCLUYENTE), no lleva credenciales, no escribe la
// dirección y se niega a lanzarse fuera de preproduccion. El servidor es falso y local (127.0.0.1, puerto
// efímero) e imita una regla de ventana fija de 100 por minuto con operador «Starts with», «Equals» mal
// puesto, sin regla, Deny (403) y cambio de ventana. La red real sigue bloqueada (sin-red-real.ts): `fetch`
// global está anulado, así que la prueba inyecta uno propio sobre node:http que solo va a 127.0.0.1.
// Datos ficticios: hosts `*.ejemplo.invalid` compuestos en ejecución (arts. 1 y 4).
//
// Mutaciones que esta prueba detecta (comprobadas a mano el 22/11/2026, ver evidencias/T-119/a/):
//  - `veredicto` que da SUPERADA sin 429/403 -> fallan «sin regla» y «Equals».
//  - quitar el control `pre-` del host -> falla «producción rechazada».
//  - no contar el 403 como limitado -> falla «Deny 403».
// Y, tras la revisión (22/11/2026; ver evidencias/T-119/a/mutaciones.txt):
//  - SUPERADA con cualquier 429/403, sin mirar el n.º de la primera limitada -> fallan «403 desde la
//    primera», «límite de 180», «cambio de ventana a mitad» y las filas 1 y 105 de la tabla.
//  - `redirect: "follow"` en lugar de `"error"` -> falla «302 a otro puerto».
import { randomBytes } from "node:crypto";
import http from "node:http";
import type { AddressInfo } from "node:net";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { afterEach, describe, expect, it } from "vitest";

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const SCRIPT = join(RAIZ, "scripts", "conector", "rafaga-waf.mjs");

interface Resultado {
  ruta: string;
  enviadas: number;
  respondidas: number;
  erroresRed: number;
  codigos: Record<string, number>;
  limitadas: number;
  primeraLimitada: number | null;
  fueraDeVentana: boolean;
  duracionMs: number;
}
interface Modulo {
  MINIMO: number;
  POR_DEFECTO: number;
  MAXIMO: number;
  RUTAS: { ruta: string; metodo: string; tipo?: string; cuerpo?: string }[];
  leerConfiguracion(e: Record<string, string | undefined>): {
    ok: boolean;
    motivo?: string;
    origen?: string;
    peticiones?: number;
  };
  veredicto(r: Resultado): { estado: string; motivo: string };
  ejecutarRafaga(o: {
    entorno: Record<string, string | undefined>;
    red: typeof fetch;
    salida: (t: string) => void;
    errores: (t: string) => void;
    ahora?: () => number;
    concurrencia?: number;
  }): Promise<number>;
}
const cargar = async () => (await import(/* @vite-ignore */ pathToFileURL(SCRIPT).href)) as Modulo;

// ---- Servidor falso -------------------------------------------------------------------------------------
type Regla =
  | { tipo: "empieza"; prefijos: string[]; limite: number; accion: 429 | 403 }
  | { tipo: "igual"; valor: string; limite: number; accion: 429 | 403 }
  | { tipo: "ninguna" };

interface Recibida {
  metodo: string;
  ruta: string;
  tipo: string | undefined;
  autorizacion: boolean;
  cookie: boolean;
  cuerpo: string;
}

interface Falso {
  puerto: number;
  recibidas: Recibida[];
  /** Vacía los contadores (cambio de ventana a mano; la opción `ventanaEn` lo hace una vez en la petición N). */
  nuevaVentana(): void;
  cerrar(): Promise<void>;
}

const abiertos: Falso[] = [];
afterEach(async () => {
  await Promise.all(abiertos.splice(0).map((s) => s.cerrar()));
});

async function servidorFalso(
  regla: Regla,
  o: { ventanaEn?: number; soloRuta?: string } = {},
): Promise<Falso> {
  const recibidas: Recibida[] = [];
  let contadores = new Map<string, number>();
  let total = 0;
  const casa = (ruta: string): string | null => {
    if (regla.tipo === "ninguna") return null;
    if (o.soloRuta !== undefined && !ruta.startsWith(o.soloRuta)) return null;
    if (regla.tipo === "igual") return ruta === regla.valor ? regla.valor : null;
    return regla.prefijos.find((p) => ruta.startsWith(p)) ?? null;
  };
  const servidor = http.createServer((pet, res) => {
    const trozos: Buffer[] = [];
    pet.on("data", (t: Buffer) => trozos.push(t));
    pet.on("end", () => {
      const ruta = pet.url ?? "";
      recibidas.push({
        metodo: pet.method ?? "",
        ruta,
        tipo: pet.headers["content-type"],
        autorizacion: pet.headers.authorization !== undefined,
        cookie: pet.headers.cookie !== undefined,
        cuerpo: Buffer.concat(trozos).toString("utf8"),
      });
      total += 1;
      if (total === o.ventanaEn) contadores = new Map();
      const clave = casa(ruta);
      if (clave !== null && regla.tipo !== "ninguna") {
        const n = (contadores.get(clave) ?? 0) + 1;
        contadores.set(clave, n);
        if (n > regla.limite) {
          res.writeHead(regla.accion, { "content-type": "text/plain" });
          res.end("limitado");
          return;
        }
      }
      if (ruta === "/api/salud" && pet.method === "GET") {
        res.writeHead(200, { "content-type": "application/json" });
        res.end('{"estado":"ok"}');
      } else if (ruta === "/oauth/token" && pet.method === "POST") {
        res.writeHead(400, { "content-type": "application/json" });
        res.end('{"error":"unsupported_grant_type"}');
      } else {
        res.writeHead(404);
        res.end();
      }
    });
  });
  await new Promise<void>((ok) => servidor.listen(0, "127.0.0.1", ok));
  const falso: Falso = {
    puerto: (servidor.address() as AddressInfo).port,
    recibidas,
    nuevaVentana: () => {
      contadores = new Map();
    },
    cerrar: () =>
      new Promise<void>((ok) => {
        servidor.closeAllConnections();
        servidor.close(() => ok());
      }),
  };
  abiertos.push(falso);
  return falso;
}

/**
 * `fetch` mínimo sobre node:http, solo para `http://localhost:<puerto>` (lo traduce a 127.0.0.1). Cualquier
 * otra dirección se rechaza como un error de red: la prueba nunca sale de la máquina.
 */
function redLocal(): typeof fetch {
  const red = (async (entrada: string | URL | Request, init: RequestInit = {}, saltos = 0) => {
    const r = await unaPeticion(String(entrada), init);
    // Como `fetch`: con `redirect: "error"` una 3xx con Location es un error de red; con "manual" se
    // devuelve tal cual; si no, se sigue (hasta 20 saltos). Así una mutación a "follow" se nota.
    const destino = r.headers.get("location");
    if (r.status >= 300 && r.status < 400 && destino !== null) {
      if (init.redirect === "error") throw new TypeError("redirección con redirect: error");
      if (init.redirect !== "manual" && saltos < 20) {
        return await red(new URL(destino, String(entrada)).href, init, saltos + 1);
      }
    }
    return r;
  }) as (e: string | URL | Request, i?: RequestInit, s?: number) => Promise<Response>;
  return red as typeof fetch;
}

async function unaPeticion(texto: string, init: RequestInit): Promise<Response> {
  const m = /^http:\/\/localhost:([0-9]{1,5})(\/.*)$/.exec(texto);
  if (m === null) throw new Error("solo localhost en la prueba");
  const cabeceras = (init.headers ?? {}) as Record<string, string>;
  return await new Promise<Response>((ok, mal) => {
    const pet = http.request(
      {
        host: "127.0.0.1",
        port: Number(m[1]),
        path: m[2],
        method: init.method ?? "GET",
        headers: cabeceras,
        signal: init.signal ?? undefined,
      },
      (res) => {
        const trozos: Buffer[] = [];
        res.on("data", (t: Buffer) => trozos.push(t));
        res.on("end", () => {
          const vacio = res.statusCode === 204 || res.statusCode === 304;
          const location = res.headers.location;
          ok(
            new Response(vacio ? null : Buffer.concat(trozos), {
              status: res.statusCode ?? 0,
              headers: location === undefined ? {} : { location },
            }),
          );
        });
        res.on("error", mal);
      },
    );
    pet.on("error", mal);
    if (typeof init.body === "string") pet.write(init.body);
    pet.end();
  });
}

async function ejecutar(
  entorno: Record<string, string | undefined>,
  o: { red?: typeof fetch; ahora?: () => number; concurrencia?: number } = {},
) {
  const m = await cargar();
  const salida: string[] = [];
  const errores: string[] = [];
  const codigo = await m.ejecutarRafaga({
    entorno,
    red: o.red ?? redLocal(),
    salida: (t) => salida.push(t),
    errores: (t) => errores.push(t),
    ...(o.ahora ? { ahora: o.ahora } : {}),
    ...(o.concurrencia ? { concurrencia: o.concurrencia } : {}),
  });
  return { codigo, salida, errores, texto: [...salida, ...errores].join("\n") };
}

const local = (s: Falso, extra: Record<string, string> = {}) => ({
  RAFAGA_URL_BASE: `http://localhost:${s.puerto}`,
  ...extra,
});
const linea = (salida: string[], ruta: string) =>
  salida.find((l) => l.includes(` ${ruta}: `)) ?? "";

const REGLA_BUENA: Regla = {
  tipo: "empieza",
  prefijos: ["/api/", "/oauth/", "/.well-known/"],
  limite: 100,
  accion: 429,
};

// ---- Pruebas --------------------------------------------------------------------------------------------
describe("rafaga-waf: regla bien puesta (Starts with, 100 por minuto)", () => {
  it("429 en las dos rutas: SUPERADA y salida 0; se para tras 5 limitadas (más las 3 en vuelo como mucho)", async () => {
    const s = await servidorFalso(REGLA_BUENA);
    const r = await ejecutar(local(s));
    expect(r.codigo).toBe(0);
    for (const ruta of ["/api/salud", "/oauth/token"]) {
      const l = linea(r.salida, ruta);
      expect(l).toContain("SUPERADA");
      expect(l).toMatch(/429×[5-8]\b/);
      expect(l).toMatch(/primera limitada: n\.º 10[1-4]/);
    }
    expect(r.salida.at(-1)).toBe("Resultado: 2 superadas, 0 fallidas, 0 no concluyentes.");
    expect(r.texto).toContain("NO COMPROBADO: aciertos de cada regla en Firewall, Overview");
    // Entre 105 y 108 por ruta (100 + 5 limitadas, más las 3 que pueden estar en vuelo con 4 a la vez).
    const porRuta = (ruta: string) => s.recibidas.filter((x) => x.ruta === ruta).length;
    expect(porRuta("/api/salud")).toBeGreaterThanOrEqual(105);
    expect(porRuta("/api/salud")).toBeLessThanOrEqual(108);
    expect(porRuta("/oauth/token")).toBeGreaterThanOrEqual(105);
  });

  it("Deny (403) también cuenta como limitado", async () => {
    const s = await servidorFalso({ ...REGLA_BUENA, accion: 403 });
    const r = await ejecutar(local(s));
    expect(r.codigo).toBe(0);
    expect(linea(r.salida, "/api/salud")).toMatch(/SUPERADA.*403×[5-8]\b/);
  });

  it("con un cambio de ventana a mitad se ve el 429, pero tarde (n.º 160): NO CONCLUYENTE, repetir", async () => {
    // El servidor vacía los contadores en la petición 60: el primer 429 llega en la 160, que no distingue
    // un cambio de ventana de un límite mayor de 100 (MAYOR-1 de la revisión).
    const s = await servidorFalso(REGLA_BUENA, { ventanaEn: 60 });
    const r = await ejecutar(local(s), { concurrencia: 1 });
    expect(r.codigo).toBe(2);
    const l = linea(r.salida, "/api/salud");
    expect(l).toMatch(
      /NO CONCLUYENTE.*primera limitada: n\.º 160.*cambio de ventana o un límite mayor de 100/,
    );
  });
});

describe("rafaga-waf: limitado, pero no por la regla de 100 por minuto (MAYOR-1)", () => {
  it("403 desde la primera petición: NO CONCLUYENTE (no SUPERADA) y salida 2", async () => {
    // Imita una IP ya limitada por una ráfaga anterior o un 403 que no es de la regla.
    const s = await servidorFalso({ ...REGLA_BUENA, limite: 0, accion: 403 });
    const r = await ejecutar(local(s));
    expect(r.codigo).toBe(2);
    for (const ruta of ["/api/salud", "/oauth/token"]) {
      const l = linea(r.salida, ruta);
      expect(l).toMatch(/NO CONCLUYENTE.*primera limitada: n\.º 1 ·/);
      expect(l).toContain(
        "limitado desde la primera: esperar 60 s y repetir, o el 403 no es de la regla",
      );
    }
    expect(r.salida.at(-1)).toBe("Resultado: 0 superadas, 0 fallidas, 2 no concluyentes.");
  });

  it("límite de 180 por minuto: el 429 llega en la 181, NO CONCLUYENTE (no SUPERADA) y salida 2", async () => {
    const s = await servidorFalso({ ...REGLA_BUENA, limite: 180 });
    const r = await ejecutar(local(s));
    expect(r.codigo).toBe(2);
    const l = linea(r.salida, "/api/salud");
    expect(l).toMatch(/NO CONCLUYENTE.*primera limitada: n\.º 18[1-4]/);
    expect(l).toContain("puede ser un cambio de ventana o un límite mayor de 100: repetir");
  });
});

describe("rafaga-waf: regla que no limita", () => {
  it("sin regla: FALLIDA en las dos rutas y salida 1, con 210 enviadas", async () => {
    const s = await servidorFalso({ tipo: "ninguna" });
    const r = await ejecutar(local(s));
    expect(r.codigo).toBe(1);
    expect(linea(r.salida, "/api/salud")).toMatch(/FALLIDA · 210 enviadas.*200×210/);
    expect(linea(r.salida, "/oauth/token")).toMatch(/FALLIDA · 210 enviadas.*400×210/);
    expect(r.texto).toContain("revisar operador Starts with");
  });

  it("operador Equals con `/api/*` literal: no limita nada, FALLIDA", async () => {
    const s = await servidorFalso({ tipo: "igual", valor: "/api/*", limite: 100, accion: 429 });
    const r = await ejecutar(local(s));
    expect(r.codigo).toBe(1);
    expect(linea(r.salida, "/api/salud")).toContain("FALLIDA");
  });

  it("regla solo en /oauth/: /api/salud FALLIDA y /oauth/token SUPERADA (salida 1)", async () => {
    const s = await servidorFalso(REGLA_BUENA, { soloRuta: "/oauth/" });
    const r = await ejecutar(local(s));
    expect(r.codigo).toBe(1);
    expect(linea(r.salida, "/api/salud")).toContain("FALLIDA");
    expect(linea(r.salida, "/oauth/token")).toContain("SUPERADA");
  });
});

describe("rafaga-waf: casos que no deciden", () => {
  it("con 120 peticiones y cambio de ventana a mitad: NO CONCLUYENTE, no FALLIDA (salida 2)", async () => {
    const s = await servidorFalso(REGLA_BUENA, { ventanaEn: 60 });
    const r = await ejecutar(local(s, { RAFAGA_PETICIONES: "120" }), { concurrencia: 1 });
    expect(r.codigo).toBe(2);
    expect(linea(r.salida, "/api/salud")).toMatch(/NO CONCLUYENTE.*cambio de ventana/);
  });

  it("servidor caído: errores de red, NO CONCLUYENTE y salida 2", async () => {
    const s = await servidorFalso(REGLA_BUENA);
    const entorno = local(s);
    await s.cerrar();
    abiertos.splice(abiertos.indexOf(s), 1);
    const r = await ejecutar(entorno);
    expect(r.codigo).toBe(2);
    expect(linea(r.salida, "/api/salud")).toMatch(
      /NO CONCLUYENTE · 210 enviadas.*errores de red: 210/,
    );
  });

  it("ráfaga lenta (60 s o más): deja de enviar y NO CONCLUYENTE", async () => {
    const s = await servidorFalso({ tipo: "ninguna" });
    let t = 0;
    // Cada lectura del reloj avanza 400 ms: a las ~75 peticiones ya han pasado 60 s.
    const ahora = () => (t += 400);
    const r = await ejecutar(local(s), { ahora, concurrencia: 1 });
    expect(r.codigo).toBe(2);
    const l = linea(r.salida, "/api/salud");
    expect(l).toContain("NO CONCLUYENTE");
    expect(l).toContain("demasiado lenta");
    expect(s.recibidas.filter((x) => x.ruta === "/api/salud").length).toBeLessThan(101);
  });
});

describe("rafaga-waf: redirecciones (MENOR-2)", () => {
  it("una 302 a otro puerto no se sigue: el otro servidor recibe 0 peticiones", async () => {
    const otro = await servidorFalso({ tipo: "ninguna" });
    const recibidas: string[] = [];
    const servidor = http.createServer((pet, res) => {
      recibidas.push(pet.url ?? "");
      pet.resume();
      res.writeHead(302, { location: `http://localhost:${otro.puerto}${pet.url ?? "/"}` });
      res.end();
    });
    await new Promise<void>((ok) => servidor.listen(0, "127.0.0.1", ok));
    try {
      const puerto = (servidor.address() as AddressInfo).port;
      const r = await ejecutar({ RAFAGA_URL_BASE: `http://localhost:${puerto}` });
      expect(recibidas.length).toBeGreaterThan(0);
      expect(otro.recibidas).toHaveLength(0);
      expect(r.codigo).toBe(2);
      expect(linea(r.salida, "/api/salud")).toMatch(/NO CONCLUYENTE.*errores de red: 210/);
    } finally {
      servidor.closeAllConnections();
      await new Promise<void>((ok) => servidor.close(() => ok()));
    }
  });

  it('cada petición lleva redirect: "error"', async () => {
    const vistos: (RequestRedirect | undefined)[] = [];
    const red = (async (_e: string, init: RequestInit = {}) => {
      vistos.push(init.redirect);
      return new Response(null, { status: 429 });
    }) as unknown as typeof fetch;
    await ejecutar({ RAFAGA_URL_BASE: "http://localhost:1" }, { red });
    expect(vistos.length).toBeGreaterThan(0);
    expect(vistos.every((v) => v === "error")).toBe(true);
  });
});

describe("rafaga-waf: lo que se envía", () => {
  it("GET /api/salud sin cuerpo; POST /oauth/token con formulario ficticio; nunca Authorization ni cookie", async () => {
    const s = await servidorFalso(REGLA_BUENA);
    await ejecutar(local(s));
    const salud = s.recibidas.filter((x) => x.ruta === "/api/salud");
    const token = s.recibidas.filter((x) => x.ruta === "/oauth/token");
    expect(salud.every((x) => x.metodo === "GET" && x.cuerpo === "")).toBe(true);
    expect(
      token.every(
        (x) =>
          x.metodo === "POST" &&
          x.tipo === "application/x-www-form-urlencoded" &&
          x.cuerpo === "grant_type=rafaga_waf_ficticia",
      ),
    ).toBe(true);
    expect(s.recibidas.some((x) => x.autorizacion || x.cookie)).toBe(false);
    expect(s.recibidas.every((x) => x.ruta === "/api/salud" || x.ruta === "/oauth/token")).toBe(
      true,
    );
  });

  it("la salida no lleva la dirección, el puerto ni cuerpos del servidor", async () => {
    const s = await servidorFalso(REGLA_BUENA);
    const r = await ejecutar(local(s));
    expect(r.texto).not.toContain("localhost");
    expect(r.texto).not.toContain(String(s.puerto));
    expect(r.texto).not.toContain("limitado");
    expect(r.texto).not.toContain("unsupported_grant_type");
    expect(r.texto).not.toContain('"estado"');
  });
});

describe("rafaga-waf: configuración (cierre en fallo, 0 peticiones)", () => {
  const HEX = randomBytes(4).toString("hex");
  const contadora = () => {
    let n = 0;
    const red = (async () => {
      n += 1;
      return new Response(null, { status: 200 });
    }) as unknown as typeof fetch;
    return { red, llamadas: () => n };
  };

  it.each([
    ["sin variable", {}],
    ["vacía", { RAFAGA_URL_BASE: "  " }],
    ["producción (host sin pre-)", { RAFAGA_URL_BASE: `https://nido-${HEX}.ejemplo.invalid` }],
    [
      "pre- en un segmento que no es el primero",
      { RAFAGA_URL_BASE: `https://x.pre-${HEX}.ejemplo.invalid` },
    ],
    ["http fuera de local", { RAFAGA_URL_BASE: `http://pre-${HEX}.ejemplo.invalid` }],
    ["con ruta", { RAFAGA_URL_BASE: `https://pre-${HEX}.ejemplo.invalid/api` }],
    ["con consulta", { RAFAGA_URL_BASE: `https://pre-${HEX}.ejemplo.invalid?x=1` }],
    ["con puerto", { RAFAGA_URL_BASE: `https://pre-${HEX}.ejemplo.invalid:8443` }],
    ["con usuario", { RAFAGA_URL_BASE: `https://u@pre-${HEX}.ejemplo.invalid` }],
    [
      "100 peticiones (no pasa del límite)",
      { RAFAGA_URL_BASE: `https://pre-${HEX}.ejemplo.invalid`, RAFAGA_PETICIONES: "100" },
    ],
    [
      "401 peticiones (más del tope)",
      { RAFAGA_URL_BASE: `https://pre-${HEX}.ejemplo.invalid`, RAFAGA_PETICIONES: "401" },
    ],
    [
      "peticiones no numéricas",
      { RAFAGA_URL_BASE: `https://pre-${HEX}.ejemplo.invalid`, RAFAGA_PETICIONES: "12a" },
    ],
    [
      "peticiones negativas",
      { RAFAGA_URL_BASE: `https://pre-${HEX}.ejemplo.invalid`, RAFAGA_PETICIONES: "-150" },
    ],
    [
      "TLS desactivado",
      { RAFAGA_URL_BASE: `https://pre-${HEX}.ejemplo.invalid`, NODE_TLS_REJECT_UNAUTHORIZED: "0" },
    ],
  ])("%s: salida 2, 0 peticiones y el motivo sin repetir lo recibido", async (_n, entorno) => {
    const c = contadora();
    const r = await ejecutar(entorno as Record<string, string>, { red: c.red });
    expect(r.codigo).toBe(2);
    expect(c.llamadas()).toBe(0);
    expect(r.errores).toHaveLength(1);
    expect(r.texto).not.toContain(HEX);
  });

  it("preproduccion válida: se acepta, con 210 por defecto y el número pedido si va de 101 a 400", async () => {
    const m = await cargar();
    const base = `https://pre-${HEX}.ejemplo.invalid`;
    expect(m.leerConfiguracion({ RAFAGA_URL_BASE: base })).toMatchObject({
      ok: true,
      origen: base,
      peticiones: 210,
    });
    expect(
      m.leerConfiguracion({ RAFAGA_URL_BASE: `${base}/`, RAFAGA_PETICIONES: "101" }),
    ).toMatchObject({
      ok: true,
      origen: base,
      peticiones: 101,
    });
    expect(m.leerConfiguracion({ RAFAGA_URL_BASE: base, RAFAGA_PETICIONES: "400" }).ok).toBe(true);
  });
});

describe("rafaga-waf: veredicto (tabla)", () => {
  const base: Resultado = {
    ruta: "/api/salud",
    enviadas: 210,
    respondidas: 210,
    erroresRed: 0,
    codigos: { 200: 210 },
    limitadas: 0,
    primeraLimitada: null,
    fueraDeVentana: false,
    duracionMs: 20_000,
  };
  it.each([
    ["con 429", { limitadas: 1, primeraLimitada: 101 }, "SUPERADA"],
    ["primera limitada n.º 1", { limitadas: 5, primeraLimitada: 1 }, "NO CONCLUYENTE"],
    ["primera limitada n.º 2", { limitadas: 5, primeraLimitada: 2 }, "SUPERADA"],
    ["primera limitada n.º 104", { limitadas: 5, primeraLimitada: 104 }, "SUPERADA"],
    ["primera limitada n.º 105", { limitadas: 5, primeraLimitada: 105 }, "NO CONCLUYENTE"],
    ["210 sin limitar en 20 s", {}, "FALLIDA"],
    [
      "200 sin limitar (posible cambio de ventana)",
      { enviadas: 200, respondidas: 200 },
      "NO CONCLUYENTE",
    ],
    ["201 sin limitar", { enviadas: 201, respondidas: 201 }, "FALLIDA"],
    ["100 respuestas", { respondidas: 100, erroresRed: 110 }, "NO CONCLUYENTE"],
    ["duró 60 s", { duracionMs: 60_000 }, "NO CONCLUYENTE"],
    ["cortada por la ventana", { fueraDeVentana: true }, "NO CONCLUYENTE"],
  ])("%s -> %s", async (_n, cambio, esperado) => {
    const m = await cargar();
    expect(m.veredicto({ ...base, ...cambio }).estado).toBe(esperado);
  });
});
