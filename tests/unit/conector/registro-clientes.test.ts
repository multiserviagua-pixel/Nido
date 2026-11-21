// T-110 (a) (001): `clientes.ts` y `POST /oauth/registro` (DCR). PRUEBA-005 (DCR: callbacks fuera de la lista,
// límite por origen y global, resto ignorado, 0 clientes registrados ante un rechazo) y parte de la 018
// (cierre en fallo). Base de datos: PGlite con el rol de gestión. Valores compuestos en ejecución.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  crearRegistro,
  MAXIMO_CUERPO_REGISTRO_BYTES,
  nuevoClientIdDcr,
} from "../../../src/lib/oauth/clientes";
import { cargarConfiguracionConector } from "../../../src/lib/plataforma/configuracion";
import { manejador } from "../../../src/lib/plataforma/manejador";
import {
  crearAutorizacion,
  type AdaptadorAutorizacion,
} from "../../../src/lib/supabase/autorizacion";
import { crearAlmacenPglite, type BdApoyo } from "../../conector/apoyo/index";
import { capturarConsola, entornoConector, URL_PUBLICA } from "./apoyo-oauth";
import { abrir, cerrarAlFinal, ESQUEMA, hmacDe, ROL_GESTION, una } from "./bd/comun";

cerrarAlFinal();

const CB_CLAUDE = "https://claude.ai/api/mcp/auth_callback";
const CB_CHATGPT = "https://chatgpt.com/connector_platform_oauth_redirect";
const CANARIO = "TEXTO-CANARIO-" + "REGISTRO-123";
const RE_CLIENT = /^dcr_[A-Za-z0-9_-]{22}$/;

let consola: string[];
beforeEach(() => {
  entornoConector();
  consola = capturarConsola();
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

interface Montaje {
  bd: BdApoyo;
  llamadas: string[];
  atender: (p: Request) => Promise<Response>;
}
async function montar(
  opciones: { local?: boolean; sustituir?: (funcion: string) => unknown } = {},
): Promise<Montaje> {
  const bd = await abrir();
  const real = await crearAlmacenPglite(bd, ROL_GESTION);
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
  const atender = crearRegistro({
    configuracion: cargarConfiguracionConector,
    autorizacion: () => crearAutorizacion(adaptador),
    local: () => opciones.local ?? true,
  });
  return { bd, llamadas, atender };
}

function peticion(
  cuerpo: unknown,
  extra: { metodo?: string; tipo?: string | null; cabeceras?: Record<string, string> } = {},
): Request {
  const cabeceras: Record<string, string> = { ...extra.cabeceras };
  if (extra.tipo !== null) cabeceras["content-type"] = extra.tipo ?? "application/json";
  const metodo = extra.metodo ?? "POST";
  return new Request(`${URL_PUBLICA}/oauth/registro`, {
    method: metodo,
    headers: cabeceras,
    body:
      metodo === "GET" ? undefined : typeof cuerpo === "string" ? cuerpo : JSON.stringify(cuerpo),
  });
}
const cuantos = async (bd: BdApoyo) =>
  (await una<{ n: number }>(bd, `select count(*)::int as n from ${ESQUEMA}.clientes_oauth`)).n;
const json = async (r: Response) => JSON.parse(await r.text()) as Record<string, unknown>;

describe("T-110 (a): registro correcto", () => {
  it("201 con client_id sorteado, callbacks, auth none y sin cabeceras CORS; fila en la base", async () => {
    const { atender, bd } = await montar();
    const r = await atender(peticion({ redirect_uris: [CB_CLAUDE, CB_CHATGPT, CB_CLAUDE] }));
    expect(r.status).toBe(201);
    expect(r.headers.get("cache-control")).toBe("no-store");
    expect(r.headers.get("content-type")).toBe("application/json");
    expect([...r.headers.keys()].filter((k) => k.startsWith("access-control"))).toEqual([]);
    const c = await json(r);
    expect(c.client_id).toMatch(RE_CLIENT);
    expect(c.redirect_uris).toEqual([CB_CLAUDE, CB_CHATGPT]);
    expect(c.token_endpoint_auth_method).toBe("none");
    expect(c.grant_types).toEqual(["authorization_code", "refresh_token"]);
    expect(c.response_types).toEqual(["code"]);
    const fila = await una<{ origen: string; redirect_uris: string[] }>(
      bd,
      `select origen::text, redirect_uris from ${ESQUEMA}.clientes_oauth where client_id = $1`,
      [c.client_id],
    );
    expect(fila.origen).toBe("dcr");
    expect(fila.redirect_uris).toEqual([CB_CLAUDE, CB_CHATGPT]);
  });

  it("auth ausente o none vale; el resto de campos se ignora sin guardarse ni registrarse", async () => {
    const { atender, bd } = await montar();
    const r = await atender(
      peticion(
        '{"redirect_uris":["' +
          CB_CLAUDE +
          '"],"token_endpoint_auth_method":"none","client_name":"' +
          CANARIO +
          '","logo_uri":"https://evil.example/' +
          CANARIO +
          '","scope":"admin ' +
          CANARIO +
          '","__proto__":{"x":1},"constructor":"' +
          CANARIO +
          '"}',
      ),
    );
    expect(r.status).toBe(201);
    expect(JSON.stringify(await json(r))).not.toContain(CANARIO);
    const todo = JSON.stringify(
      (await bd.db.query(`select * from ${ESQUEMA}.clientes_oauth`)).rows,
    );
    expect(todo).not.toContain(CANARIO);
    expect(consola.join("\n")).not.toContain(CANARIO);
  });

  it("el client_id nunca es entrada: uno enviado se ignora y el servidor sortea otro", async () => {
    const { atender } = await montar();
    const pedido = nuevoClientIdDcr();
    const r = await atender(peticion({ redirect_uris: [CB_CLAUDE], client_id: pedido }));
    expect(r.status).toBe(201);
    expect((await json(r)).client_id).not.toBe(pedido);
  });

  it("dos registros dan identificadores distintos", async () => {
    const { atender } = await montar();
    const a = (await json(await atender(peticion({ redirect_uris: [CB_CLAUDE] })))).client_id;
    const b = (await json(await atender(peticion({ redirect_uris: [CB_CLAUDE] })))).client_id;
    expect(a).not.toBe(b);
  });
});

describe("T-110 (a): rechazos sin registrar nada (RD-039, RD-042)", () => {
  const MALOS: unknown[][] = [
    ["http://claude.ai/api/mcp/auth_callback"],
    ["https://claude.ai/api/mcp/auth_callback/"],
    ["https://claude.ai/api/mcp/auth_callback/x"],
    ["https://claude.ai/api/mcp/auth_callback?a=1"],
    ["https://claude.ai/api/mcp/auth_callback#f"],
    ["https://claude.ai:443/api/mcp/auth_callback"],
    ["https://CLAUDE.ai/api/mcp/auth_callback"],
    ["https://evil.example/api/mcp/auth_callback"],
    ["http://localhost:3000/callback"],
    [CB_CLAUDE, "https://evil.example/cb"],
    [CB_CLAUDE, 7],
    [CB_CLAUDE, null],
    [],
    [""],
    [{ 0: CB_CLAUDE }],
    Array.from({ length: 11 }, () => CB_CLAUDE),
  ];
  it.each(MALOS.map((u, i) => [i, u] as const))(
    "redirect_uris no válidos (%i): 400 invalid_redirect_uri y 0 clientes",
    async (_i, uris) => {
      const { atender, bd } = await montar();
      const r = await atender(peticion({ redirect_uris: uris }));
      expect(r.status).toBe(400);
      expect(await json(r)).toEqual({ error: "invalid_redirect_uri" });
      expect(await cuantos(bd)).toBe(0);
    },
  );

  it.each([
    ["sin redirect_uris", {}],
    ["redirect_uris no es lista", { redirect_uris: CB_CLAUDE }],
    ["redirect_uris es objeto", { redirect_uris: { a: CB_CLAUDE } }],
  ])("%s: invalid_redirect_uri", async (_n, cuerpo) => {
    const { atender, bd } = await montar();
    const r = await atender(peticion(cuerpo));
    expect(r.status).toBe(400);
    expect(await json(r)).toEqual({ error: "invalid_redirect_uri" });
    expect(await cuantos(bd)).toBe(0);
  });

  it.each(["client_secret_basic", "client_secret_post", "private_key_jwt", "", null, 0, ["none"]])(
    "autenticación del cliente distinta de none (%j): invalid_client_metadata",
    async (metodo) => {
      const { atender, bd } = await montar();
      const r = await atender(
        peticion({ redirect_uris: [CB_CLAUDE], token_endpoint_auth_method: metodo }),
      );
      expect(r.status).toBe(400);
      expect(await json(r)).toEqual({ error: "invalid_client_metadata" });
      expect(await cuantos(bd)).toBe(0);
    },
  );

  it.each([
    ["no es JSON", "{" + CANARIO],
    ["es una lista", "[]"],
    ["es un número", "7"],
    ["es null", "null"],
    ["está vacío", ""],
  ])("cuerpo que %s: 400 sin eco y sin tocar la base", async (_n, texto) => {
    const { atender, llamadas } = await montar();
    const r = await atender(peticion(texto));
    expect(r.status).toBe(400);
    expect((await r.text()).includes(CANARIO)).toBe(false);
    expect(llamadas).toEqual([]);
    expect(consola.join("\n")).not.toContain(CANARIO);
  });

  it.each([null, "text/plain", "application/x-www-form-urlencoded", "application/jsonx"])(
    "tipo de contenido %j: 400 sin tocar la base",
    async (tipo) => {
      const { atender, llamadas } = await montar();
      const r = await atender(peticion({ redirect_uris: [CB_CLAUDE] }, { tipo }));
      expect(r.status).toBe(400);
      expect(llamadas).toEqual([]);
    },
  );

  it("application/json con parámetros (charset) se admite", async () => {
    const { atender } = await montar();
    const r = await atender(
      peticion({ redirect_uris: [CB_CLAUDE] }, { tipo: "Application/JSON; charset=utf-8" }),
    );
    expect(r.status).toBe(201);
  });

  it("cuerpo que no es UTF-8 válido: 400", async () => {
    const { atender, llamadas } = await montar();
    const r = await atender(
      new Request(`${URL_PUBLICA}/oauth/registro`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: new Uint8Array([0x7b, 0xff, 0xfe, 0x7d]),
      }),
    );
    expect(r.status).toBe(400);
    expect(llamadas).toEqual([]);
  });

  it("cuerpo por encima de 32 768 bytes: 413, con y sin content-length, sin tocar la base", async () => {
    const { atender, llamadas } = await montar();
    const grande = JSON.stringify({
      redirect_uris: [CB_CLAUDE],
      relleno: "x".repeat(MAXIMO_CUERPO_REGISTRO_BYTES),
    });
    const a = await atender(peticion(grande));
    expect(a.status).toBe(413);
    const flujo = new ReadableStream<Uint8Array>({
      start(c) {
        c.enqueue(new TextEncoder().encode(grande));
        c.close();
      },
    });
    const b = await atender(
      new Request(`${URL_PUBLICA}/oauth/registro`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: flujo,
        duplex: "half",
      } as RequestInit),
    );
    expect(b.status).toBe(413);
    expect(llamadas).toEqual([]);
  });

  it("el cuerpo justo en el tope se lee", async () => {
    const { atender } = await montar();
    const base = JSON.stringify({ redirect_uris: [CB_CLAUDE], r: "" });
    const relleno = "x".repeat(MAXIMO_CUERPO_REGISTRO_BYTES - base.length);
    const texto = JSON.stringify({ redirect_uris: [CB_CLAUDE], r: relleno });
    expect(texto.length).toBe(MAXIMO_CUERPO_REGISTRO_BYTES);
    expect((await atender(peticion(texto))).status).toBe(201);
  });

  it.each(["GET", "PUT", "PATCH", "DELETE"])(
    "%s: 405 con Allow: POST y sin tocar la base",
    async (m) => {
      const { atender, llamadas } = await montar();
      const r = await atender(peticion(m === "GET" ? "" : {}, { metodo: m }));
      expect(r.status).toBe(405);
      expect(r.headers.get("allow")).toBe("POST");
      expect(llamadas).toEqual([]);
    },
  );
});

describe("T-110 (a): origen y límites", () => {
  const desde = (ip: string) =>
    peticion({ redirect_uris: [CB_CLAUDE] }, { cabeceras: { "x-vercel-forwarded-for": ip } });

  it("fuera de local, sin x-vercel-forwarded-for: 403 sin evaluar nada", async () => {
    const { atender, llamadas, bd } = await montar({ local: false });
    const r = await atender(peticion({ redirect_uris: [CB_CLAUDE] }));
    expect(r.status).toBe(403);
    expect(await json(r)).toEqual({ error: "origen_no_permitido" });
    expect(llamadas).toEqual([]);
    expect(await cuantos(bd)).toBe(0);
  });

  it.each(["x", "203.0.113.7, 198.51.100.1", "203.0.113.7:80", "[::1]", "fe80::1%eth0"])(
    "fuera de local, origen mal formado (%s): 403",
    async (valor) => {
      const { atender, llamadas } = await montar({ local: false });
      expect((await atender(desde(valor))).status).toBe(403);
      expect(llamadas).toEqual([]);
    },
  );

  it("x-forwarded-for no se mira: sin la cabecera de la plataforma, 403", async () => {
    const { atender } = await montar({ local: false });
    const r = await atender(
      peticion({ redirect_uris: [CB_CLAUDE] }, { cabeceras: { "x-forwarded-for": "203.0.113.7" } }),
    );
    expect(r.status).toBe(403);
  });

  it("5 registros por origen y hora: el sexto da 429 y otro origen sigue pudiendo; la IP no se guarda ni se registra", async () => {
    const { atender, bd } = await montar({ local: false });
    for (let i = 0; i < 5; i++) expect((await atender(desde("203.0.113.7"))).status).toBe(201);
    const sexto = await atender(desde("203.0.113.7"));
    expect(sexto.status).toBe(429);
    expect(await json(sexto)).toEqual({ error: "limite_alcanzado" });
    expect(await cuantos(bd)).toBe(5);
    expect((await atender(desde("203.0.113.8"))).status).toBe(201);
    const todo = JSON.stringify(
      (await bd.db.query(`select * from ${ESQUEMA}.limites_origen`)).rows,
    );
    for (const ip of ["203.0.113.7", "203.0.113.8"]) {
      expect(todo).not.toContain(ip);
      expect(consola.join("\n")).not.toContain(ip);
    }
  });

  it("50 clientes sin uso en total: el 51 da 429 desde un origen nuevo", async () => {
    const { atender, bd } = await montar({ local: false });
    for (let i = 0; i < 50; i++) {
      expect((await atender(desde(`198.51.100.${i + 1}`))).status).toBe(201);
    }
    expect((await atender(desde("192.0.2.200"))).status).toBe(429);
    expect(await cuantos(bd)).toBe(50);
  });
});

describe("T-110 (a): cierre en fallo", () => {
  it("prueba cerrada: nunca 201, estado fijo 503 y 0 clientes", async () => {
    const { atender, bd } = await montar();
    await (await crearAlmacenPglite(bd, ROL_GESTION)).llamar("cerrar_prueba", [hmacDe("o")]);
    const r = await atender(peticion({ redirect_uris: [CB_CLAUDE] }));
    expect(r.status).toBe(503);
    expect(await json(r)).toEqual({ error: "no_disponible" });
    expect(await cuantos(bd)).toBe(0);
  });

  it("resultado de la base que no es de la lista (también con forma de éxito): ni 201 ni cliente", async () => {
    for (const falso of [
      { resultado: "otra_cosa" },
      { resultado: "registrado", extra: 1 },
      { resultado: "constructor" },
      "registrado",
      null,
      [],
    ]) {
      const { atender } = await montar({
        sustituir: (f) => (f === "registrar_cliente_dcr" ? (falso ?? "nulo") : undefined),
      });
      const r = await manejador(
        "/oauth/registro",
        atender,
      )(peticion({ redirect_uris: [CB_CLAUDE] }));
      expect(r.status).toBe(503);
      expect(await r.text()).toBe('{"estado":"error"}');
    }
  }, 60_000);

  it("almacén caído: 503 por el manejador, sin el error de postgres.js ni valores en los registros", async () => {
    const { atender } = await montar({ sustituir: () => new Error("caído " + CANARIO) });
    const r = await manejador("/oauth/registro", atender)(peticion({ redirect_uris: [CB_CLAUDE] }));
    expect(r.status).toBe(503);
    expect(await r.text()).toBe('{"estado":"error"}');
    expect(consola.join("\n")).not.toContain(CANARIO);
    expect(consola.join("\n")).toContain("almacen_no_disponible");
  });

  it("limite y origen_bloqueado de la base: 429 fijo", async () => {
    for (const r of ["limite", "origen_bloqueado"]) {
      const { atender } = await montar({
        sustituir: (f) => (f === "registrar_cliente_dcr" ? { resultado: r } : undefined),
      });
      expect((await atender(peticion({ redirect_uris: [CB_CLAUDE] }))).status).toBe(429);
    }
  });

  it("no_valido de la base: 400 invalid_client_metadata", async () => {
    const { atender } = await montar({
      sustituir: (f) => (f === "registrar_cliente_dcr" ? { resultado: "no_valido" } : undefined),
    });
    const r = await atender(peticion({ redirect_uris: [CB_CLAUDE] }));
    expect(r.status).toBe(400);
    expect(await json(r)).toEqual({ error: "invalid_client_metadata" });
  });

  it("configuración no válida: 503 antes de leer nada", async () => {
    entornoConector(false);
    const { atender, llamadas } = await montar();
    const r = await manejador("/oauth/registro", atender)(peticion({ redirect_uris: [CB_CLAUDE] }));
    expect(r.status).toBe(503);
    expect(llamadas).toEqual([]);
  });

  it("los registros solo llevan ruta, código, nivel y momento (nunca el cuerpo)", async () => {
    const { atender } = await montar();
    await atender(peticion({ redirect_uris: ["https://evil.example/" + CANARIO] }));
    await atender(peticion("{" + CANARIO));
    const lineas = consola.filter((l) => l.includes("/oauth/registro"));
    expect(lineas.length).toBeGreaterThan(0);
    for (const l of lineas) {
      expect(Object.keys(JSON.parse(l) as object).sort()).toEqual([
        "codigo",
        "momento",
        "nivel",
        "ruta",
      ]);
    }
    expect(consola.join("\n")).not.toContain(CANARIO);
  });
});
