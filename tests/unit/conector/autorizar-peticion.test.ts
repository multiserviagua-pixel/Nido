// T-110 (b) (001): `peticion.ts` y `GET /oauth/autorizar`. PRUEBA-005 (callbacks y variantes, PKCE S256 y
// `plain`, `state` e `iss`, sin redirigir ante cliente o callback erróneos, CIMD sin red con la lista vacía) y
// PRUEBA-009 (parte: solicitud y cookie nueva en cada solicitud, solo como HMAC). Base de datos: PGlite con el
// rol de gestión. Valores compuestos en ejecución (arts. 1 y 4).
import { createHash, randomBytes } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { crearAutorizar } from "../../../src/lib/oauth/peticion";
import { derivarClaves, huellaLigadura } from "../../../src/lib/oauth/secretos";
import { cargarConfiguracionConector } from "../../../src/lib/plataforma/configuracion";
import { manejador } from "../../../src/lib/plataforma/manejador";
import {
  crearAutorizacion,
  type AdaptadorAutorizacion,
} from "../../../src/lib/supabase/autorizacion";
import { crearAlmacenPglite, type BdApoyo } from "../../conector/apoyo/index";
import { capturarConsola, entornoConector, SECRETO, URL_PUBLICA } from "./apoyo-oauth";
import {
  abrir,
  CB_CHATGPT,
  CB_CLAUDE,
  cerrarAlFinal,
  ESQUEMA,
  gestion,
  hmacDe,
  idDcr,
  ROL_GESTION,
  una,
  UUID_RE,
} from "./bd/comun";

cerrarAlFinal();

// La pantalla se puede forzar a fallar para comprobar el cierre en fallo de la ruta.
const pantalla = vi.hoisted(() => ({ fallar: false }));
vi.mock("../../../src/lib/oauth/pantalla", async (original) => {
  const real = await original<typeof import("../../../src/lib/oauth/pantalla")>();
  return {
    ...real,
    renderizarPantalla: (e: Parameters<typeof real.renderizarPantalla>[0]) => {
      if (pantalla.fallar) throw new Error("pantalla rota " + "TEXTO-CANARIO-PANTALLA-123");
      return real.renderizarPantalla(e);
    },
  };
});

const CANARIO = "TEXTO-CANARIO-" + "AUTORIZAR-123";
const RUTA = "/oauth/autorizar";
const DESAFIO = createHash("sha256")
  .update(randomBytes(32).toString("base64url"), "utf8")
  .digest("base64url");
const RECURSO = `${URL_PUBLICA}/api/mcp`;

let consola: string[];
beforeEach(() => {
  entornoConector();
  pantalla.fallar = false;
  consola = capturarConsola();
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

interface Montaje {
  bd: BdApoyo;
  llamadas: string[];
  llamadasRed: string[];
  cliente: string;
  atender: (p: Request) => Promise<Response>;
}
async function montar(
  opciones: {
    sustituir?: (funcion: string) => unknown;
    urlsCimd?: readonly string[];
    red?: (url: string) => Response;
    callbacks?: string[];
  } = {},
): Promise<Montaje> {
  const bd = await abrir();
  const real = await crearAlmacenPglite(bd, ROL_GESTION);
  const cliente = idDcr();
  const alta = await gestion(bd, "registrar_cliente_dcr", [
    hmacDe("origen"),
    cliente,
    opciones.callbacks ?? [CB_CLAUDE, CB_CHATGPT],
  ]);
  expect(alta.resultado).toBe("registrado");
  const llamadas: string[] = [];
  const llamadasRed: string[] = [];
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
  const atender = crearAutorizar({
    configuracion: cargarConfiguracionConector,
    autorizacion: () => crearAutorizacion(adaptador),
    fetch: ((entrada: string) => {
      llamadasRed.push(String(entrada));
      return Promise.resolve(
        opciones.red?.(String(entrada)) ?? new Response("{}", { status: 404 }),
      );
    }) as typeof fetch,
    urlsCimd: opciones.urlsCimd ?? [],
  });
  return { bd, llamadas, llamadasRed, cliente, atender };
}

type Parametros = Record<string, string | undefined>;
function url(cliente: string, cambios: Parametros = {}, base = URL_PUBLICA): string {
  const p: Parametros = {
    client_id: cliente,
    redirect_uri: CB_CLAUDE,
    response_type: "code",
    code_challenge: DESAFIO,
    code_challenge_method: "S256",
    resource: RECURSO,
    state: "estado-opaco_123",
    ...cambios,
  };
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(p)) if (v !== undefined) q.append(k, v);
  return `${base}${RUTA}?${q.toString()}`;
}
const get = (u: string, metodo = "GET") => new Request(u, { method: metodo });
const solicitudes = async (bd: BdApoyo) =>
  (
    await una<{ n: number }>(
      bd,
      `select count(*)::int as n from ${ESQUEMA}.solicitudes_autorizacion`,
    )
  ).n;
const cookieDe = (r: Response): string => {
  const c = r.headers.get("set-cookie");
  expect(c).not.toBeNull();
  return c!;
};
const valorCookie = (r: Response): string => /^__Host-activacion=([^;]+);/.exec(cookieDe(r))![1]!;

describe("T-110 (b): solicitud correcta y cookie", () => {
  it("200 con el formulario, solicitud en el campo oculto, state escapado y cookie __Host- segura", async () => {
    const { atender, bd, cliente } = await montar();
    const state = `a"<b>&c' d`;
    const r = await atender(get(url(cliente, { state })));
    expect(r.status).toBe(200);
    const html = await r.text();
    expect(html).toContain("Vas a conectar: <strong>claude.ai</strong>");
    expect(html).toContain('<form method="post" action="/oauth/autorizar">');
    expect(html).not.toContain(state);
    expect(html).toContain("a&quot;&lt;b&gt;&amp;c&#39; d");
    const id = /name="solicitud" value="([^"]+)"/.exec(html)![1]!;
    expect(id).toMatch(UUID_RE);
    // Cabeceras de la pantalla (T-109): CSP con huella, sin caché.
    expect(r.headers.get("content-security-policy")).toMatch(
      /^default-src 'none'; style-src 'sha256-/,
    );
    expect(r.headers.get("cache-control")).toBe("no-store");
    // Cookie: nombre con prefijo, ruta raíz, sin Domain, HttpOnly, Secure, SameSite=Strict, 10 minutos.
    const c = cookieDe(r);
    expect(c).toMatch(
      /^__Host-activacion=[A-Za-z0-9_-]{43}; Path=\/; Max-Age=600; HttpOnly; Secure; SameSite=Strict$/,
    );
    expect(c).not.toMatch(/Domain/i);
    // En la base: solo HMAC de la cookie y del state; ni el valor de la cookie ni el state.
    const claves = derivarClaves(SECRETO);
    const fila = await una<{
      redirect_uri: string;
      desafio_pkce: string;
      recurso: string;
      state_hmac: string;
      cookie_hmac: string;
    }>(
      bd,
      `select redirect_uri, desafio_pkce, recurso, state_hmac, cookie_hmac
         from ${ESQUEMA}.solicitudes_autorizacion where id = $1`,
      [id],
    );
    expect(fila.redirect_uri).toBe(CB_CLAUDE);
    expect(fila.desafio_pkce).toBe(DESAFIO);
    expect(fila.recurso).toBe(RECURSO);
    expect(fila.state_hmac).toBe(huellaLigadura(claves, "state", state));
    expect(fila.cookie_hmac).toBe(huellaLigadura(claves, "activacion", valorCookie(r)));
    const todo = JSON.stringify(
      (await bd.db.query(`select * from ${ESQUEMA}.solicitudes_autorizacion`)).rows,
    );
    expect(todo).not.toContain(valorCookie(r));
    expect(todo).not.toContain(state);
  });

  it("la cookie es nueva en cada solicitud y también lo es la solicitud", async () => {
    const { atender, cliente } = await montar();
    const a = await atender(get(url(cliente)));
    const b = await atender(get(url(cliente)));
    expect(valorCookie(a)).not.toBe(valorCookie(b));
    expect(/name="solicitud" value="([^"]+)"/.exec(await a.text())![1]).not.toBe(
      /name="solicitud" value="([^"]+)"/.exec(await b.text())![1],
    );
  });

  it("el callback de ChatGPT muestra «ChatGPT»", async () => {
    const { atender, cliente } = await montar();
    const r = await atender(get(url(cliente, { redirect_uri: CB_CHATGPT })));
    expect(r.status).toBe(200);
    expect(await r.text()).toContain("<strong>ChatGPT</strong>");
  });

  it("state vacío (presente): se admite", async () => {
    const { atender, cliente } = await montar();
    expect((await atender(get(url(cliente, { state: "" })))).status).toBe(200);
  });

  it("scope, parámetros desconocidos y fragmento se descartan sin efecto ni eco", async () => {
    const { atender, cliente, bd } = await montar();
    const r = await atender(
      get(url(cliente, { scope: "admin " + CANARIO, otro: CANARIO }) + "#" + CANARIO),
    );
    expect(r.status).toBe(200);
    expect(await r.text()).not.toContain(CANARIO);
    expect(
      JSON.stringify((await bd.db.query(`select * from ${ESQUEMA}.solicitudes_autorizacion`)).rows),
    ).not.toContain(CANARIO);
  });

  it("el servidor de la petición no decide nada: iss y resource salen de URL_PUBLICA", async () => {
    const { atender, cliente } = await montar();
    const ajeno = "https://evil.example";
    const ok = await atender(get(url(cliente, {}, ajeno)));
    expect(ok.status).toBe(200);
    const mal = await atender(get(url(cliente, { resource: `${ajeno}/api/mcp` }, ajeno)));
    expect(mal.status).toBe(302);
    expect(mal.headers.get("location")).toContain(`iss=${encodeURIComponent(URL_PUBLICA)}`);
    expect(mal.headers.get("location")).not.toContain("evil");
  });
});

describe("T-110 (b): sin redirigir ante cliente, callback o state erróneos (RD-039)", () => {
  const CALLBACKS_MALOS = [
    "http://claude.ai/api/mcp/auth_callback",
    "https://claude.ai/api/mcp/auth_callback/",
    "https://claude.ai/api/mcp/auth_callback/x",
    "https://claude.ai/api/mcp/auth_callback?a=1",
    "https://claude.ai/api/mcp/auth_callback#f",
    "https://claude.ai:443/api/mcp/auth_callback",
    "https://CLAUDE.ai/api/mcp/auth_callback",
    "https://evil.example/api/mcp/auth_callback",
    "http://localhost:3000/callback",
    "https://chatgpt.com/connector_platform_oauth_redirect/abc",
    "",
  ];
  async function sinRedirigir(r: Response, bd: BdApoyo): Promise<void> {
    expect(r.status).toBe(400);
    expect(r.headers.get("location")).toBeNull();
    expect(r.headers.get("set-cookie")).toBeNull();
    expect(await r.text()).toContain(
      "Esta solicitud ha caducado. Vuelve a empezar desde tu asistente.",
    );
    expect(await solicitudes(bd)).toBe(0);
  }

  it.each(CALLBACKS_MALOS.map((c, i) => [i, c] as const))(
    "redirect_uri fuera de la lista (%i): pantalla de solicitud no válida",
    async (_i, malo) => {
      const { atender, bd, cliente } = await montar();
      await sinRedirigir(await atender(get(url(cliente, { redirect_uri: malo }))), bd);
    },
  );

  it("redirect_uri ausente o repetido: pantalla de solicitud no válida", async () => {
    const { atender, bd, cliente } = await montar();
    await sinRedirigir(await atender(get(url(cliente, { redirect_uri: undefined }))), bd);
    await sinRedirigir(
      await atender(get(url(cliente) + "&redirect_uri=" + encodeURIComponent(CB_CHATGPT))),
      bd,
    );
  });

  it("callback de la lista pero no registrado para ese cliente: no se redirige", async () => {
    const { atender, bd, cliente } = await montar({ callbacks: [CB_CLAUDE] });
    await sinRedirigir(await atender(get(url(cliente, { redirect_uri: CB_CHATGPT }))), bd);
  });

  it.each([
    ["ausente", undefined],
    ["vacío", ""],
    ["no es DCR ni CIMD", "cliente-cualquiera"],
    ["DCR desconocido", "dcr_" + "A".repeat(22)],
    ["DCR con forma incorrecta", "dcr_corto"],
    ["demasiado largo", "dcr_" + "A".repeat(400)],
    ["URL que no está en la lista de CIMD", "https://claude.ai/oauth/metadata"],
  ])("client_id %s: no se redirige", async (_n, malo) => {
    const { atender, bd, llamadasRed } = await montar();
    await sinRedirigir(await atender(get(url(malo ?? "", { client_id: malo }))), bd);
    expect(llamadasRed).toEqual([]);
  });

  it("client_id repetido: ambiguo, no se redirige", async () => {
    const { atender, bd, cliente } = await montar();
    await sinRedirigir(
      await atender(get(url(cliente) + "&client_id=" + encodeURIComponent(idDcr()))),
      bd,
    );
  });

  it.each([
    ["más de 512", "a".repeat(513)],
    ["salto de línea", "a%0Ab"],
    ["tabulador", "a%09b"],
    ["fuera de ASCII", "caf%C3%A9"],
    ["DEL", "a%7Fb"],
  ])("state %s: no se redirige (no se puede devolver)", async (_n, malo) => {
    const { atender, bd, cliente } = await montar();
    const u = url(cliente, { state: undefined }) + "&state=" + malo;
    await sinRedirigir(await atender(get(u)), bd);
  });

  it("sin state: se rechaza sin redirigir y sin abrir solicitud", async () => {
    const { atender, bd, cliente } = await montar();
    await sinRedirigir(await atender(get(url(cliente, { state: undefined }))), bd);
  });

  it("state repetido o consulta de más de 4096 caracteres: no se redirige", async () => {
    const { atender, bd, cliente } = await montar();
    await sinRedirigir(await atender(get(url(cliente) + "&state=otro")), bd);
    await sinRedirigir(await atender(get(url(cliente) + "&x=" + "a".repeat(4100))), bd);
  });

  it("state de 512 caracteres imprimibles se admite", async () => {
    const { atender, cliente } = await montar();
    expect((await atender(get(url(cliente, { state: "a".repeat(512) })))).status).toBe(200);
  });

  it("cliente DCR expirado o purgado: no se redirige", async () => {
    const { atender, bd, cliente } = await montar();
    await bd.db.query(
      `update ${ESQUEMA}.clientes_oauth set creado_en = now() - interval '25 hours' where client_id = $1`,
      [cliente],
    );
    await sinRedirigir(await atender(get(url(cliente))), bd);
  });
});

describe("T-110 (b): errores de la solicitud con redirección al callback fijo (RD-040)", () => {
  async function conRedireccion(
    r: Response,
    bd: BdApoyo,
    codigo: string,
    state: string | null,
    callback = CB_CLAUDE,
  ): Promise<void> {
    expect(r.status).toBe(302);
    expect(r.headers.get("set-cookie")).toBeNull();
    expect(r.headers.get("cache-control")).toBe("no-store");
    expect(r.headers.get("content-security-policy")).toBe("frame-ancestors 'none'");
    const destino = r.headers.get("location")!;
    // Solo un callback fijo, y la consulta exacta: error, state (si venía) e iss.
    expect(destino.startsWith(callback + "?")).toBe(true);
    const consulta = new URLSearchParams(destino.slice(callback.length + 1));
    expect(consulta.get("error")).toBe(codigo);
    expect(consulta.get("state")).toBe(state);
    expect(consulta.get("iss")).toBe(URL_PUBLICA);
    expect([...consulta.keys()].sort()).toEqual(
      state === null ? ["error", "iss"] : ["error", "iss", "state"],
    );
    expect(await solicitudes(bd)).toBe(0);
  }

  it.each([
    ["response_type=token", { response_type: "token" }],
    ["response_type ausente", { response_type: undefined }],
    ["response_type=code id_token", { response_type: "code id_token" }],
    ["método plain", { code_challenge_method: "plain" }],
    ["método ausente (equivale a plain)", { code_challenge_method: undefined }],
    ["método en minúsculas", { code_challenge_method: "s256" }],
    ["método vacío", { code_challenge_method: "" }],
    ["desafío ausente", { code_challenge: undefined }],
    ["desafío de 42", { code_challenge: DESAFIO.slice(0, 42) }],
    ["desafío de 44", { code_challenge: DESAFIO + "A" }],
    ["desafío de 128", { code_challenge: "A".repeat(128) }],
    ["desafío con relleno", { code_challenge: DESAFIO.slice(0, 42) + "=" }],
    ["desafío con carácter no permitido", { code_challenge: DESAFIO.slice(0, 42) + "+" }],
  ] as [string, Parametros][])("%s: invalid_request", async (_n, cambios) => {
    const { atender, bd, cliente } = await montar();
    await conRedireccion(
      await atender(get(url(cliente, cambios))),
      bd,
      "invalid_request",
      "estado-opaco_123",
    );
  });

  it.each([
    ["resource ausente", { resource: undefined }],
    ["resource con barra final", { resource: RECURSO + "/" }],
    ["resource de otro host", { resource: "https://evil.example/api/mcp" }],
    ["resource sin ruta", { resource: URL_PUBLICA }],
    ["resource con consulta", { resource: RECURSO + "?a=1" }],
    ["resource en mayúsculas", { resource: RECURSO.toUpperCase() }],
  ] as [string, Parametros][])("%s: invalid_target", async (_n, cambios) => {
    const { atender, bd, cliente } = await montar();
    await conRedireccion(
      await atender(get(url(cliente, cambios))),
      bd,
      "invalid_target",
      "estado-opaco_123",
    );
  });

  it("el state viaja codificado y sin state no se añade; ChatGPT vuelve a su callback", async () => {
    const { atender, bd, cliente } = await montar();
    const raro = `a&b="c"<d> e#f%g`;
    await conRedireccion(
      await atender(get(url(cliente, { state: raro, response_type: "token" }))),
      bd,
      "invalid_request",
      raro,
    );
    const sin = await atender(get(url(cliente, { state: undefined, response_type: "token" })));
    expect(sin.status).toBe(400); // sin state no se redirige ni con otro error
    expect(sin.headers.get("location")).toBeNull();
    expect(await solicitudes(bd)).toBe(0);
    await conRedireccion(
      await atender(
        get(url(cliente, { redirect_uri: CB_CHATGPT, code_challenge_method: "plain" })),
      ),
      bd,
      "invalid_request",
      "estado-opaco_123",
      CB_CHATGPT,
    );
  });

  it("ningún error se redirige a un callback que no sea uno de los dos fijos (barrido)", async () => {
    const { atender, cliente } = await montar();
    const lista = [
      { response_type: "x" },
      { code_challenge_method: "plain" },
      { code_challenge: "x" },
      { resource: "https://evil.example/api/mcp" },
    ];
    for (const cambios of lista) {
      for (const cb of [CB_CLAUDE, CB_CHATGPT]) {
        const r = await atender(get(url(cliente, { ...cambios, redirect_uri: cb })));
        const destino = r.headers.get("location")!;
        expect([CB_CLAUDE, CB_CHATGPT].some((c) => destino.startsWith(c + "?"))).toBe(true);
      }
    }
  });
});

describe("T-110 (b): CIMD sin red con la lista vacía (V-6)", () => {
  it("un client_id con forma de URL no hace ninguna petición saliente ni consulta la base", async () => {
    const { atender, llamadasRed, llamadas } = await montar();
    const antes = llamadas.length;
    const r = await atender(get(url("https://claude.ai/oauth/metadata")));
    expect(r.status).toBe(400);
    expect(llamadasRed).toEqual([]);
    expect(llamadas.length).toBe(antes);
  });

  it("con una URL en la lista (solo en pruebas) y un documento válido, la solicitud se abre", async () => {
    const cimd = "https://cliente.ejemplo.test/oauth/metadata";
    const { atender, llamadasRed } = await montar({
      urlsCimd: [cimd],
      red: () =>
        new Response(JSON.stringify({ client_id: cimd, redirect_uris: [CB_CLAUDE] }), {
          status: 200,
        }),
    });
    const r = await atender(get(url(cimd)));
    expect(r.status).toBe(200);
    expect(llamadasRed).toEqual([cimd]);
  });

  it("CIMD con documento fuera de reglas o red caída: no se redirige; caída es «no disponible»", async () => {
    const cimd = "https://cliente.ejemplo.test/oauth/metadata";
    const malo = await montar({
      urlsCimd: [cimd],
      red: () =>
        new Response(
          JSON.stringify({
            client_id: cimd,
            redirect_uris: [CB_CLAUDE, "https://evil.example/cb"],
          }),
          { status: 200 },
        ),
    });
    const a = await malo.atender(get(url(cimd)));
    expect(a.status).toBe(400);
    expect(a.headers.get("location")).toBeNull();
    const caida = await montar({ urlsCimd: [cimd], red: () => new Response("x", { status: 500 }) });
    const b = await caida.atender(get(url(cimd)));
    expect(b.status).toBe(503);
    expect(await b.text()).toContain("No se ha podido completar");
    expect(b.headers.get("location")).toBeNull();
  });
});

describe("T-110 (b): método y cierre en fallo", () => {
  it.each(["PUT", "PATCH", "DELETE"])(
    "%s: 405 con Allow: GET, POST y sin tocar la base",
    async (m) => {
      const { atender, llamadas, cliente } = await montar();
      const antes = llamadas.length;
      const r = await atender(get(url(cliente), m));
      expect(r.status).toBe(405);
      expect(r.headers.get("allow")).toBe("GET, POST");
      expect(r.headers.get("content-security-policy")).toBe("frame-ancestors 'none'");
      expect(llamadas.length).toBe(antes);
    },
  );

  it("prueba cerrada: estado fijo «no disponible» (503), sin cookie y sin solicitud", async () => {
    const { atender, bd, cliente } = await montar();
    await (await crearAlmacenPglite(bd, ROL_GESTION)).llamar("cerrar_prueba", [hmacDe("o")]);
    const r = await atender(get(url(cliente)));
    expect(r.status).toBe(503);
    expect(r.headers.get("set-cookie")).toBeNull();
    expect(await r.text()).toContain("No se ha podido completar");
    expect(await solicitudes(bd)).toBe(0);
  });

  it("abrir_solicitud no_valida (tope de solicitudes): pantalla de solicitud no válida, sin cookie", async () => {
    const { atender, cliente } = await montar({
      sustituir: (f) => (f === "abrir_solicitud" ? { resultado: "no_valida" } : undefined),
    });
    const r = await atender(get(url(cliente)));
    expect(r.status).toBe(400);
    expect(r.headers.get("set-cookie")).toBeNull();
  });

  it("resultado desconocido de abrir_solicitud: ni formulario ni cookie (pantalla 503 fija)", async () => {
    for (const falso of [
      { resultado: "otra_cosa" },
      { resultado: "abierta" },
      { resultado: "abierta", solicitud: "no-es-uuid" },
      { resultado: "constructor" },
      "abierta",
      [],
    ]) {
      const { atender, cliente } = await montar({
        sustituir: (f) => (f === "abrir_solicitud" ? falso : undefined),
      });
      const r = await manejador(RUTA, atender)(get(url(cliente)));
      expect(r.status).toBe(503);
      expect(r.headers.get("set-cookie")).toBeNull();
      expect(r.headers.get("content-security-policy")).toContain("frame-ancestors 'none'");
      expect(await r.text()).toContain("No se ha podido completar");
    }
  });

  it("leer_cliente con resultado desconocido: 503 y sin formulario", async () => {
    const { atender, cliente } = await montar({
      sustituir: (f) => (f === "leer_cliente" ? { resultado: "conocido", origen: "x" } : undefined),
    });
    const r = await manejador(RUTA, atender)(get(url(cliente)));
    expect(r.status).toBe(503);
    expect(r.headers.get("set-cookie")).toBeNull();
  });

  it("almacén caído: pantalla 503 fija, sin el error de postgres.js ni valores en los registros", async () => {
    const { atender, cliente } = await montar({ sustituir: () => new Error("caído " + CANARIO) });
    const r = await manejador(RUTA, atender)(get(url(cliente, { state: CANARIO })));
    expect(r.status).toBe(503);
    expect(r.headers.get("set-cookie")).toBeNull();
    expect(await r.text()).toContain("No se ha podido completar");
    expect(consola.join("\n")).not.toContain(CANARIO);
    expect(consola.join("\n")).toContain("almacen_no_disponible");
  });

  it("configuración no válida: 503 y ni se mira la base", async () => {
    entornoConector(false);
    const { atender, llamadas, cliente } = await montar();
    const r = await manejador(RUTA, atender)(get(url(cliente)));
    expect(r.status).toBe(503);
    expect(llamadas).toEqual([]);
  });

  it("una excepción de renderizarPantalla da 503 fijo, sin cookie y sin valores en los registros", async () => {
    const { atender, cliente } = await montar();
    pantalla.fallar = true;
    const r = await atender(get(url(cliente, { state: CANARIO })));
    expect(r.status).toBe(503);
    expect(r.headers.get("set-cookie")).toBeNull();
    const cuerpo = await r.text();
    expect(cuerpo).toBe('{"estado":"error"}');
    expect(cuerpo + consola.join("\n")).not.toContain("CANARIO-PANTALLA");
    expect(consola.join("\n")).not.toContain(CANARIO);
    expect(consola.join("\n")).toContain("error_no_controlado");
  });
});

describe("T-110 (b): registros sin valores (arts. 1 y 4)", () => {
  it("rechazos y éxitos solo registran nivel, código, ruta y momento", async () => {
    const { atender, cliente } = await montar();
    const ok = await atender(get(url(cliente, { state: CANARIO })));
    const cookie = valorCookie(ok);
    await atender(
      get(url(cliente, { state: CANARIO, redirect_uri: "https://evil.example/" + CANARIO })),
    );
    await atender(get(url(cliente, { state: CANARIO, response_type: CANARIO })));
    await atender(get(url(CANARIO, { state: CANARIO })));
    await atender(get(url(cliente, { state: CANARIO }), "POST"));
    const lineas = consola.filter((l) => l.includes(RUTA));
    expect(lineas.length).toBeGreaterThan(0);
    for (const l of lineas) {
      expect(Object.keys(JSON.parse(l) as object).sort()).toEqual([
        "codigo",
        "momento",
        "nivel",
        "ruta",
      ]);
    }
    const todo = consola.join("\n");
    for (const v of [CANARIO, cookie, cliente, DESAFIO, SECRETO]) expect(todo).not.toContain(v);
  });
});
