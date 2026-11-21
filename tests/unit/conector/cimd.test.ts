// T-108 (b) (001): cimd.ts. PRUEBA-005 (parte): CIMD por URL exacta antes de cualquier red; lista vacía
// sin V-6 (0 peticiones); documento que no amplía nada; sin redirecciones, 3 s, 16 384 bytes.
// Red inyectable (doble de red de la batería): lo no registrado no sale a internet.
import { describe, expect, it, vi } from "vitest";
import { CALLBACKS } from "../../../src/lib/oauth/callbacks";
import {
  MAXIMO_DOCUMENTO_BYTES,
  TIEMPO_CIMD_MS,
  URLS_CIMD,
  crearResolutorCimd,
  type AlmacenCimd,
} from "../../../src/lib/oauth/cimd";
import { ErrorDeAplicacion } from "../../../src/lib/plataforma/errores";
import { crearDobleRed } from "../../conector/apoyo/index";

const URL_OK = "https://cimd.ejemplo.test/cliente.json";
const CANARIO = "TEXTO-CANARIO-" + "CIMD-123";

function almacenDe(parcial: Partial<AlmacenCimd> = {}) {
  const llamadas: { funcion: string; argumentos: unknown[] }[] = [];
  const almacen: AlmacenCimd = {
    leerCliente: (...a) => {
      llamadas.push({ funcion: "leerCliente", argumentos: a });
      return Promise.resolve({ resultado: "desconocido" });
    },
    guardarClienteCimd: (...a) => {
      llamadas.push({ funcion: "guardarClienteCimd", argumentos: a });
      return Promise.resolve({ resultado: "guardado" });
    },
    ...parcial,
  };
  return { almacen, llamadas };
}

const documento = (extra: Record<string, unknown> = {}) =>
  JSON.stringify({ client_id: URL_OK, redirect_uris: [CALLBACKS.claude], ...extra });

function montaje(cuerpo: string | (() => Response), opciones: { urls?: string[] } = {}) {
  const red = crearDobleRed();
  red.responder("GET", URL_OK, () =>
    typeof cuerpo === "function" ? cuerpo() : new Response(cuerpo, { status: 200 }),
  );
  const a = almacenDe();
  const resolutor = crearResolutorCimd({
    urls: opciones.urls ?? [URL_OK],
    fetch: red.fetch,
    almacen: a.almacen,
  });
  return { red, resolutor, ...a };
}

describe("cimd.ts: la lista constante vacía (sin V-6) no sale a la red", () => {
  it("la lista de producto está vacía hasta comprobar la URL de Claude (V-6)", () => {
    expect(URLS_CIMD).toEqual([]);
  });
  it("con la lista de producto vacía, ningún client_id produce peticiones ni consultas", async () => {
    const red = crearDobleRed();
    const a = almacenDe();
    const resolutor = crearResolutorCimd({ fetch: red.fetch, almacen: a.almacen });
    for (const id of [URL_OK, "https://claude.ai/oauth/cimd.json", "dcr_" + "a".repeat(22), ""]) {
      expect(await resolutor.resolver(id)).toEqual({ estado: "rechazado" });
    }
    expect(red.llamadas).toEqual([]);
    expect(a.llamadas).toEqual([]);
  });
});

describe("cimd.ts: URL exacta antes de cualquier red (0 peticiones fuera de la lista)", () => {
  it.each([
    "http://cimd.ejemplo.test/cliente.json",
    "https://cimd.ejemplo.test:443/cliente.json",
    "https://cimd.ejemplo.test:8443/cliente.json",
    "https://usuario@cimd.ejemplo.test/cliente.json",
    "https://usuario:clave@cimd.ejemplo.test/cliente.json",
    "https://cimd.ejemplo.test/cliente.json#f",
    "https://cimd.ejemplo.test/cliente.json?x=1",
    "https://CIMD.ejemplo.test/cliente.json",
    "https://cimd.ejemplo.test/Cliente.json",
    "https://cimd.ejemplo.test/cliente.json/",
    "https://cimd.ejemplo.test/otro.json",
    "https://sub.cimd.ejemplo.test/cliente.json",
    "https://cimd.ejemplo.test.evil.test/cliente.json",
    "https://evil.test/cliente.json",
    "https://cimd.ejemplo.test@evil.test/cliente.json",
    " https://cimd.ejemplo.test/cliente.json",
    "",
  ])("variante rechazada sin red ni consulta: %s", async (id) => {
    const { red, resolutor, llamadas } = montaje(documento());
    expect(await resolutor.resolver(id)).toEqual({ estado: "rechazado" });
    expect(red.llamadas).toEqual([]);
    expect(llamadas).toEqual([]);
  });

  it.each([null, undefined, 3, {}, [URL_OK]])(
    "un valor que no es texto no sale a la red (%#)",
    async (v) => {
      const { red, resolutor } = montaje(documento());
      expect(await resolutor.resolver(v)).toEqual({ estado: "rechazado" });
      expect(red.llamadas).toEqual([]);
    },
  );

  it("una entrada de la lista que no es una URL exacta aceptable se ignora (cierre en fallo)", async () => {
    for (const mala of [
      "http://cimd.ejemplo.test/c.json",
      "https://cimd.ejemplo.test:8443/c.json",
      "https://u@cimd.ejemplo.test/c.json",
      "https://cimd.ejemplo.test/c.json#f",
      "https://CIMD.ejemplo.test/c.json",
      "no es url",
    ]) {
      const red = crearDobleRed();
      const a = almacenDe();
      const r = crearResolutorCimd({ urls: [mala], fetch: red.fetch, almacen: a.almacen });
      expect(await r.resolver(mala)).toEqual({ estado: "rechazado" });
      expect(red.llamadas).toEqual([]);
    }
  });

  it("la URL de la lista sí se descarga, una vez, sin credenciales ni cookies", async () => {
    const { red, resolutor } = montaje(documento());
    const r = await resolutor.resolver(URL_OK);
    expect(r).toEqual({ estado: "valido", redirectUris: [CALLBACKS.claude] });
    expect(red.llamadas).toHaveLength(1);
    expect(red.llamadas[0]).toMatchObject({ metodo: "GET", url: URL_OK });
    expect(red.llamadas[0]!.cabeceras).not.toContain("authorization");
    expect(red.llamadas[0]!.cabeceras).not.toContain("cookie");
  });

  it("se pide sin seguir redirecciones y con plazo", async () => {
    const espia = vi.fn(() => Promise.resolve(new Response(documento())));
    const a = almacenDe();
    const r = crearResolutorCimd({ urls: [URL_OK], fetch: espia as never, almacen: a.almacen });
    await r.resolver(URL_OK);
    const init = (espia.mock.calls[0] as unknown as [string, RequestInit])[1];
    expect(init.redirect).toBe("manual");
    expect(init.method).toBe("GET");
    expect(init.signal).toBeInstanceOf(AbortSignal);
    expect(TIEMPO_CIMD_MS).toBe(3000);
    expect(MAXIMO_DOCUMENTO_BYTES).toBe(16384);
  });
});

describe("cimd.ts: el documento no amplía nada", () => {
  it("se guarda solo client_id y callbacks de la lista; el resto se ignora", async () => {
    const { resolutor, llamadas } = montaje(
      documento({ client_name: CANARIO, scope: "todo", grant_types: ["x"], logo_uri: CANARIO }),
    );
    expect(await resolutor.resolver(URL_OK)).toEqual({
      estado: "valido",
      redirectUris: [CALLBACKS.claude],
    });
    expect(llamadas.map((l) => l.funcion)).toEqual(["leerCliente", "guardarClienteCimd"]);
    expect(llamadas[1]!.argumentos).toEqual([URL_OK, [CALLBACKS.claude]]);
    expect(JSON.stringify(llamadas)).not.toContain(CANARIO);
  });

  it("los dos callbacks de la lista valen", async () => {
    const { resolutor } = montaje(
      JSON.stringify({ client_id: URL_OK, redirect_uris: [CALLBACKS.claude, CALLBACKS.chatgpt] }),
    );
    expect(await resolutor.resolver(URL_OK)).toEqual({
      estado: "valido",
      redirectUris: [CALLBACKS.claude, CALLBACKS.chatgpt],
    });
  });

  it.each([
    ["client_id distinto", { client_id: "https://otro.ejemplo.test/c.json" }],
    ["client_id ausente", { client_id: undefined }],
    [
      "un callback fuera de la lista (rechazo entero)",
      { redirect_uris: [CALLBACKS.claude, "https://evil.test/cb"] },
    ],
    ["callback con barra final", { redirect_uris: [CALLBACKS.claude + "/"] }],
    ["sin callbacks", { redirect_uris: [] }],
    ["callbacks que no son lista", { redirect_uris: CALLBACKS.claude }],
    ["callback que no es texto", { redirect_uris: [CALLBACKS.claude, 3] }],
    ["demasiados callbacks", { redirect_uris: Array.from({ length: 11 }, () => CALLBACKS.claude) }],
    ["cliente confidencial", { token_endpoint_auth_method: "client_secret_basic" }],
    ["jwks (clave propia)", { token_endpoint_auth_method: "private_key_jwt" }],
  ])("rechazo entero y nada guardado: %s", async (_n, cambios) => {
    const base = { client_id: URL_OK, redirect_uris: [CALLBACKS.claude], ...cambios };
    const { resolutor, llamadas } = montaje(JSON.stringify(base));
    expect(await resolutor.resolver(URL_OK)).toEqual({ estado: "rechazado" });
    expect(llamadas.map((l) => l.funcion)).toEqual(["leerCliente"]);
  });

  it("autenticación none explícita vale", async () => {
    const { resolutor } = montaje(documento({ token_endpoint_auth_method: "none" }));
    expect((await resolutor.resolver(URL_OK)).estado).toBe("valido");
  });

  it.each(["no es json " + CANARIO, "[]", "null", "3", '"texto"', ""])(
    "un cuerpo que no es un objeto JSON se rechaza: %s",
    async (cuerpo) => {
      const { resolutor, llamadas } = montaje(cuerpo);
      expect(await resolutor.resolver(URL_OK)).toEqual({ estado: "rechazado" });
      expect(llamadas.map((l) => l.funcion)).toEqual(["leerCliente"]);
    },
  );

  it("bytes que no son UTF-8 se rechazan", async () => {
    const { resolutor } = montaje(
      () => new Response(new Uint8Array([0xc3, 0x28, 0xff]), { status: 200 }),
    );
    expect(await resolutor.resolver(URL_OK)).toEqual({ estado: "rechazado" });
  });
});

describe("cimd.ts: sin redirecciones, 3 s, 16 384 bytes", () => {
  it.each([301, 302, 307, 308])("una redirección %i se rechaza sin seguirla", async (estado) => {
    const { red, resolutor } = montaje(
      () => new Response(null, { status: estado, headers: { location: "https://evil.test/x" } }),
    );
    expect(await resolutor.resolver(URL_OK)).toEqual({ estado: "rechazado" });
    expect(red.llamadas).toHaveLength(1);
  });

  it("un documento de más de 16 384 bytes se rechaza (y se corta la lectura)", async () => {
    let leidos = 0;
    const trozo = new Uint8Array(4096).fill(32);
    const flujo = new ReadableStream<Uint8Array>({
      pull(c) {
        leidos += 1;
        c.enqueue(trozo);
        if (leidos > 100) c.close();
      },
    });
    const { resolutor, llamadas } = montaje(() => new Response(flujo, { status: 200 }));
    expect(await resolutor.resolver(URL_OK)).toEqual({ estado: "rechazado" });
    expect(leidos).toBeLessThan(10);
    expect(llamadas.map((l) => l.funcion)).toEqual(["leerCliente"]);
  });

  it("exactamente 16 384 bytes se acepta", async () => {
    const base = documento();
    const relleno = " ".repeat(MAXIMO_DOCUMENTO_BYTES - base.length);
    const { resolutor } = montaje(base + relleno);
    expect((await resolutor.resolver(URL_OK)).estado).toBe("valido");
  });

  it("sin respuesta en el plazo: no disponible, nada guardado", async () => {
    const a = almacenDe();
    const r = crearResolutorCimd({
      urls: [URL_OK],
      fetch: (() => new Promise(() => undefined)) as never,
      almacen: a.almacen,
      tiempoMs: 20,
    });
    expect(await r.resolver(URL_OK)).toEqual({ estado: "no_disponible" });
    expect(a.llamadas.map((l) => l.funcion)).toEqual(["leerCliente"]);
  });

  it("cuerpo que no termina en el plazo: no disponible", async () => {
    const flujo = new ReadableStream<Uint8Array>({ start: () => undefined });
    const red = crearDobleRed();
    red.responder("GET", URL_OK, () => new Response(flujo, { status: 200 }));
    const a = almacenDe();
    const r = crearResolutorCimd({
      urls: [URL_OK],
      fetch: red.fetch,
      almacen: a.almacen,
      tiempoMs: 20,
    });
    expect(await r.resolver(URL_OK)).toEqual({ estado: "no_disponible" });
  });

  it("red caída o estado de error: no disponible, sin eco", async () => {
    const red = crearDobleRed();
    red.caer(URL_OK);
    const a = almacenDe();
    const r = crearResolutorCimd({ urls: [URL_OK], fetch: red.fetch, almacen: a.almacen });
    expect(await r.resolver(URL_OK)).toEqual({ estado: "no_disponible" });
    const m = montaje(() => new Response("error", { status: 503 }));
    expect(await m.resolutor.resolver(URL_OK)).toEqual({ estado: "no_disponible" });
    const n = montaje(() => new Response("no", { status: 404 }));
    expect(await n.resolutor.resolver(URL_OK)).toEqual({ estado: "no_disponible" });
  });
});

describe("cimd.ts: caché de 1 h en la base de datos; nunca se usa caducada", () => {
  const vigente = (vigenteBool: boolean) => ({
    leerCliente: () =>
      Promise.resolve({
        resultado: "conocido" as const,
        origen: "cimd" as const,
        redirectUris: [CALLBACKS.chatgpt],
        vigente: vigenteBool,
      }),
  });

  it("vigente: se usa sin ninguna petición", async () => {
    const red = crearDobleRed();
    const a = almacenDe(vigente(true));
    const r = crearResolutorCimd({ urls: [URL_OK], fetch: red.fetch, almacen: a.almacen });
    expect(await r.resolver(URL_OK)).toEqual({
      estado: "valido",
      redirectUris: [CALLBACKS.chatgpt],
    });
    expect(red.llamadas).toEqual([]);
  });

  it("caducada: se descarga de nuevo", async () => {
    const red = crearDobleRed();
    red.responder("GET", URL_OK, () => new Response(documento()));
    const a = almacenDe(vigente(false));
    const r = crearResolutorCimd({ urls: [URL_OK], fetch: red.fetch, almacen: a.almacen });
    expect(await r.resolver(URL_OK)).toEqual({
      estado: "valido",
      redirectUris: [CALLBACKS.claude],
    });
    expect(red.llamadas).toHaveLength(1);
  });

  it("caducada y la descarga falla: no se usa la caducada", async () => {
    const red = crearDobleRed();
    red.caer(URL_OK);
    const a = almacenDe(vigente(false));
    const r = crearResolutorCimd({ urls: [URL_OK], fetch: red.fetch, almacen: a.almacen });
    expect(await r.resolver(URL_OK)).toEqual({ estado: "no_disponible" });
  });

  it("un cliente conocido que no es CIMD no vale como CIMD", async () => {
    const red = crearDobleRed();
    const a = almacenDe({
      leerCliente: () =>
        Promise.resolve({
          resultado: "conocido" as const,
          origen: "dcr" as const,
          redirectUris: [CALLBACKS.claude],
          vigente: true,
        }),
    });
    const r = crearResolutorCimd({ urls: [URL_OK], fetch: red.fetch, almacen: a.almacen });
    expect(await r.resolver(URL_OK)).toEqual({ estado: "rechazado" });
    expect(red.llamadas).toEqual([]);
  });

  it.each(["no_valido", "cerrada", "algo_nuevo"])(
    "si la base dice %s al guardar, rechazo (un resultado desconocido nunca es éxito)",
    async (resultado) => {
      const red = crearDobleRed();
      red.responder("GET", URL_OK, () => new Response(documento()));
      const a = almacenDe({
        guardarClienteCimd: () => Promise.resolve({ resultado } as never),
      });
      const r = crearResolutorCimd({ urls: [URL_OK], fetch: red.fetch, almacen: a.almacen });
      expect(await r.resolver(URL_OK)).toEqual({ estado: "rechazado" });
    },
  );

  it("un fallo del almacén se propaga como almacen_no_disponible", async () => {
    const red = crearDobleRed();
    const a = almacenDe({
      leerCliente: () => Promise.reject(new ErrorDeAplicacion("almacen_no_disponible")),
    });
    const r = crearResolutorCimd({ urls: [URL_OK], fetch: red.fetch, almacen: a.almacen });
    await expect(r.resolver(URL_OK)).rejects.toMatchObject({ codigo: "almacen_no_disponible" });
    expect(red.llamadas).toEqual([]);
  });
});
