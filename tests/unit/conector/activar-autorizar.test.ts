// T-110 (c) (001): `activacion.ts` y `POST /oauth/autorizar`. PRUEBA-006 (códigos y bloqueo; sin
// `x-vercel-forwarded-for` fuera de local), PRUEBA-009 (POST con Origin ajeno o `null`: rechazo sin contar
// intento; cookie y `state` ligados) y PRUEBA-018 (parte: no disponible). Base de datos: PGlite con el rol de
// gestión. Valores compuestos en ejecución (arts. 1 y 4).
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { huellaToken } from "../../../src/lib/oauth/secretos";
import { capturarConsola, entornoConector, URL_PUBLICA } from "./apoyo-oauth";
import {
  abrirSolicitud,
  activarCompleto,
  cerrarCiclos,
  claves,
  montarCiclo,
  peticionPost,
  sembrarCodigo,
  type Ciclo,
  type CamposPost,
  type OpcionesPost,
  type Solicitud,
} from "./apoyo-oauth-ciclo";
import { CB_CHATGPT, ESQUEMA, estado, gestion, hmacDe, una } from "./bd/comun";

const CANARIO = "TEXTO-CANARIO-" + "ACTIVAR-123";
// Con forma de código pero que ningún código real sembrado tiene (se compone en ejecución).
const MALO = ["ZZZZ", "ZZZZ", "ZZZZ"].join("-");
const FUERA_DEL_ALFABETO = ["UUUU", "UUUU", "UUUU"].join("-");
let consola: string[];
beforeEach(() => {
  entornoConector();
  consola = capturarConsola();
});
afterEach(async () => {
  await cerrarCiclos();
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

const fallos = async (c: Ciclo): Promise<{ fallos: number; bloqueado: boolean }[]> =>
  (
    await c.bd.db.query<{ fallos: number; bloqueado: boolean }>(
      `select fallos::int, (bloqueado_hasta is not null) as bloqueado
         from ${ESQUEMA}.limites_origen where ambito = 'activacion'`,
    )
  ).rows;
const conexiones = async (c: Ciclo): Promise<number> =>
  (await una<{ n: number }>(c.bd, `select count(*)::int as n from ${ESQUEMA}.conexiones`)).n;

describe("T-110 (c): éxito", () => {
  it("200 «aceptado» con code, state e iss; solo el HMAC del código de autorización llega a la base", async () => {
    const c = await montarCiclo();
    const s = await abrirSolicitud(c, { state: `a"<b>&c'` });
    const codigo = await sembrarCodigo(c.bd);
    const r = await c.post(peticionPost(s, { codigo }));
    expect(r.status).toBe(200);
    expect(r.headers.get("cache-control")).toBe("no-store");
    const html = await r.text();
    expect(html).toContain("Código aceptado.");
    const m = /href="([^"]+)"/
      .exec(html)![1]!
      .replaceAll("&#39;", "'")
      .replaceAll("&quot;", '"')
      .replaceAll("&amp;", "&");
    const u = new URL(m);
    expect(u.origin + u.pathname).toBe("https://claude.ai/api/mcp/auth_callback");
    const code = u.searchParams.get("code")!;
    expect(code).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(u.searchParams.get("state")).toBe(s.state);
    expect(u.searchParams.get("iss")).toBe(URL_PUBLICA);
    // La cookie de activación se borra al terminar.
    expect(r.headers.get("set-cookie")).toMatch(/^__Host-activacion=; Path=\/; Max-Age=0;/);
    expect(await conexiones(c)).toBe(1);
    const fila = await una<{ codigo_hmac: string }>(
      c.bd,
      `select codigo_hmac from ${ESQUEMA}.codigos_autorizacion`,
    );
    expect(fila.codigo_hmac).toBe(huellaToken(claves(), "codigo_autorizacion", code));
    const volcado = JSON.stringify(
      (await c.bd.db.query(`select * from ${ESQUEMA}.codigos_autorizacion`)).rows,
    );
    expect(volcado).not.toContain(code);
    expect(consola.join("\n")).not.toContain(code);
    expect(consola.join("\n")).not.toContain(s.cookie);
  });

  it("el código tecleado se normaliza (minúsculas, espacios, O por 0, I y L por 1)", async () => {
    const c = await montarCiclo();
    const s = await abrirSolicitud(c);
    const codigo = await sembrarCodigo(c.bd);
    const tecleado = codigo
      .toLowerCase()
      .replaceAll("-", " ")
      .replaceAll("0", "o")
      .replaceAll("1", "l");
    const r = await c.post(peticionPost(s, { codigo: ` ${tecleado} ` }));
    expect(r.status).toBe(200);
    expect(await r.text()).toContain("Código aceptado.");
  });

  it("el enlace va al callback del asistente que dice la base, no al del formulario", async () => {
    const c = await montarCiclo();
    const s = await abrirSolicitud(c, { callback: CB_CHATGPT });
    const codigo = await sembrarCodigo(c.bd);
    const r = await c.post(peticionPost(s, { codigo, asistente: "claude" }));
    const html = await r.text();
    expect(html).toContain("Continuar en ChatGPT");
    expect(html).toContain("chatgpt.com/connector_platform_oauth_redirect");
  });
});

describe("T-110 (c): Origin propio exacto, sin contar intento (PRUEBA-009)", () => {
  it.each([
    ["ajeno", "https://evil.example"],
    ["null", "null"],
    ["otro puerto", "http://localhost:3001"],
    ["otro esquema", "https://localhost:3000"],
    ["con barra final", `${URL_PUBLICA}/`],
    ["con ruta", `${URL_PUBLICA}/oauth/autorizar`],
    ["mayúsculas", URL_PUBLICA.toUpperCase()],
    ["dos orígenes", `${URL_PUBLICA}, https://evil.example`],
    ["vacío", ""],
  ])("Origin %s: 400 «solicitud no válida», sin tocar la base", async (_n, origin) => {
    const c = await montarCiclo();
    const s = await abrirSolicitud(c);
    const codigo = await sembrarCodigo(c.bd);
    const antes = await estado(c.bd);
    const n = c.llamadas.length;
    const r = await c.post(peticionPost(s, { codigo }, { origin }));
    expect(r.status).toBe(400);
    expect(await r.text()).toContain("Esta solicitud ha caducado");
    expect(c.llamadas.length).toBe(n);
    expect(await estado(c.bd)).toEqual(antes);
    expect(await fallos(c)).toEqual([]);
  });

  it("sin cabecera Origin: mismo rechazo, aunque el código sea bueno (no se consume)", async () => {
    const c = await montarCiclo();
    const s = await abrirSolicitud(c);
    const codigo = await sembrarCodigo(c.bd);
    const r = await c.post(peticionPost(s, { codigo }, { origin: null }));
    expect(r.status).toBe(400);
    expect((await c.post(peticionPost(s, { codigo }))).status).toBe(200);
  });
});

describe("T-110 (c): cookie y state ligados a la solicitud, sin contar intento", () => {
  async function caso(
    cambio: (s: Solicitud) => [CamposPost, OpcionesPost],
    llamaALaBase: boolean,
  ): Promise<void> {
    const c = await montarCiclo();
    const s = await abrirSolicitud(c);
    const codigo = await sembrarCodigo(c.bd);
    const n = c.llamadas.length;
    const [campos, o] = cambio(s);
    const r = await c.post(peticionPost(s, { codigo, ...campos }, o));
    expect(r.status).toBe(400);
    const html = await r.text();
    expect(html).toContain("Esta solicitud ha caducado");
    // Nunca el error de código: no es un oráculo para quien no tiene la cookie ni el state.
    expect(html).not.toContain("El código no es válido");
    expect(c.llamadas.length > n).toBe(llamaALaBase);
    expect((await fallos(c)).every((f) => f.fallos === 0 && !f.bloqueado)).toBe(true);
    expect(await conexiones(c)).toBe(0);
  }

  it("sin cookie", () => caso(() => [{}, { cookie: null }], false));
  it("cookie con forma incorrecta", () => caso(() => [{}, { cookie: "corta" }], false));
  it("cookie de otra solicitud (forma correcta): la rechaza la base", () =>
    caso(() => [{}, { cookie: "A".repeat(43) }], true));
  it("cookie repetida", () =>
    caso(
      (s) => [
        {},
        {
          cookie: null,
          cabeceras: {
            cookie: `__Host-activacion=${s.cookie}; __Host-activacion=${"B".repeat(43)}`,
          },
        },
      ],
      false,
    ));
  it("state distinto: lo rechaza la base", () => caso(() => [{ state: "otro" }, {}], true));
  it("state ausente", () => caso(() => [{ state: null }, {}], false));
  it("solicitud que no es un identificador", () => caso(() => [{ solicitud: "../x" }, {}], false));
  it("solicitud inexistente", () =>
    caso(() => [{ solicitud: "00000000-0000-4000-8000-000000000000" }, {}], true));
  it("campo repetido", () =>
    caso(() => [{ extra: [["solicitud", "00000000-0000-4000-8000-000000000000"]] }, {}], false));
  it("asistente desconocido", () => caso(() => [{ asistente: "otro" }, {}], false));

  it("la cookie de OTRA solicitud abierta no vale para esta", async () => {
    const c = await montarCiclo();
    const a = await abrirSolicitud(c);
    const b = await abrirSolicitud(c);
    const codigo = await sembrarCodigo(c.bd);
    const r = await c.post(peticionPost(a, { codigo }, { cookie: b.cookie }));
    expect(r.status).toBe(400);
    expect(await r.text()).not.toContain("El código no es válido");
  });
});

describe("T-110 (c): código incorrecto y bloqueo (PRUEBA-006)", () => {
  it("código incorrecto: 200 con el formulario y el error, cuenta un intento y la solicitud sigue", async () => {
    const c = await montarCiclo();
    const s = await abrirSolicitud(c);
    const r = await c.post(peticionPost(s, { codigo: MALO }));
    expect(r.status).toBe(200);
    const html = await r.text();
    expect(html).toContain("El código no es válido o ha caducado");
    expect(html).toContain('role="alert"');
    expect(html).toContain(`name="solicitud" value="${s.id}"`);
    expect(r.headers.get("set-cookie")).toBeNull();
    expect(await fallos(c)).toEqual([{ fallos: 1, bloqueado: false }]);
    const codigo = await sembrarCodigo(c.bd);
    expect((await c.post(peticionPost(s, { codigo }))).status).toBe(200);
  });

  it.each([
    ["vacío", ""],
    ["corto", "ABCD"],
    ["de más de 64", "A".repeat(65)],
    ["enorme", "A".repeat(3000)],
    ["con letras fuera del alfabeto", FUERA_DEL_ALFABETO],
    ["canario", CANARIO],
  ])("código %s: cuenta como fallo, sin eco", async (_n, texto) => {
    const c = await montarCiclo();
    const s = await abrirSolicitud(c);
    const r = await c.post(peticionPost(s, { codigo: texto }));
    expect(r.status).toBe(200);
    const html = await r.text();
    expect(html).toContain("El código no es válido");
    expect(html).not.toContain(CANARIO);
    expect(await fallos(c)).toEqual([{ fallos: 1, bloqueado: false }]);
    expect(consola.join("\n")).not.toContain(CANARIO);
  });

  it("5 fallos bloquean 15 minutos: 429 y el código bueno no se evalúa ni se consume", async () => {
    const c = await montarCiclo();
    const s = await abrirSolicitud(c);
    const bueno = await sembrarCodigo(c.bd);
    for (let i = 0; i < 5; i++) {
      expect((await c.post(peticionPost(s, { codigo: MALO }))).status).toBe(200);
    }
    const r = await c.post(peticionPost(s, { codigo: bueno }));
    expect(r.status).toBe(429);
    expect(await r.text()).toContain("Demasiados intentos. Espera 15 minutos");
    expect(await conexiones(c)).toBe(0);
    expect(
      (
        await una<{ n: number }>(
          c.bd,
          `select count(*)::int as n from ${ESQUEMA}.codigos_activacion where usado_en is null`,
        )
      ).n,
    ).toBe(1);
  });

  it("cada origen se cuenta aparte (fuera de local, por x-vercel-forwarded-for)", async () => {
    const c = await montarCiclo({ local: false });
    const s = await abrirSolicitud(c);
    const desde = (ip: string): OpcionesPost => ({ cabeceras: { "x-vercel-forwarded-for": ip } });
    for (let i = 0; i < 5; i++) {
      await c.post(peticionPost(s, { codigo: MALO }, desde("203.0.113.7")));
    }
    expect((await c.post(peticionPost(s, { codigo: MALO }, desde("203.0.113.7")))).status).toBe(
      429,
    );
    expect((await c.post(peticionPost(s, { codigo: MALO }, desde("203.0.113.8")))).status).toBe(
      200,
    );
    const volcado = JSON.stringify(
      (await c.bd.db.query(`select * from ${ESQUEMA}.limites_origen`)).rows,
    );
    expect(volcado).not.toContain("203.0.113");
  });

  it("fuera de local sin x-vercel-forwarded-for, o con una forma que no es una IP: 503 sin tocar la base", async () => {
    const c = await montarCiclo({ local: false });
    const s = await abrirSolicitud(c);
    const codigo = await sembrarCodigo(c.bd);
    const n = c.llamadas.length;
    const variantes: Record<string, string>[] = [
      {},
      { "x-vercel-forwarded-for": "no-es-ip" },
      { "x-forwarded-for": "203.0.113.9" },
    ];
    for (const cabeceras of variantes) {
      const r = await c.post(peticionPost(s, { codigo }, { cabeceras }));
      expect(r.status).toBe(503);
      expect(await r.text()).toContain("No se ha podido completar");
    }
    expect(c.llamadas.length).toBe(n);
    expect(await fallos(c)).toEqual([]);
  });

  it("un código usado no vale una segunda vez", async () => {
    const c = await montarCiclo();
    const s1 = await abrirSolicitud(c);
    const codigo = await sembrarCodigo(c.bd);
    expect((await c.post(peticionPost(s1, { codigo }))).status).toBe(200);
    const s2 = await abrirSolicitud(c);
    const r = await c.post(peticionPost(s2, { codigo }));
    expect(await r.text()).toContain("El código no es válido");
  });
});

describe("T-110 (c): cuerpo, método y cierre en fallo (PRUEBA-018, parte no disponible)", () => {
  it.each([
    ["tipo de contenido JSON", { tipo: "application/json" }],
    ["sin tipo de contenido", { tipo: null }],
    ["multipart", { tipo: "multipart/form-data; boundary=x" }],
  ])("%s: 400 sin tocar la base", async (_n, o) => {
    const c = await montarCiclo();
    const s = await abrirSolicitud(c);
    const n = c.llamadas.length;
    const r = await c.post(peticionPost(s, { codigo: MALO }, o));
    expect(r.status).toBe(400);
    expect(c.llamadas.length).toBe(n);
  });

  it("cuerpo de más de 4096 bytes: 400 sin tocar la base ni eco", async () => {
    const c = await montarCiclo();
    const s = await abrirSolicitud(c);
    const n = c.llamadas.length;
    const r = await c.post(
      peticionPost(s, { codigo: MALO }, { cuerpo: `codigo=${CANARIO}` + "a".repeat(5000) }),
    );
    expect(r.status).toBe(400);
    expect(await r.text()).not.toContain(CANARIO);
    expect(c.llamadas.length).toBe(n);
    expect(consola.join("\n")).toContain("cuerpo_demasiado_grande");
  });

  it("cuerpo que no es UTF-8: 400", async () => {
    const c = await montarCiclo();
    const s = await abrirSolicitud(c);
    const p = new Request(`${URL_PUBLICA}/oauth/autorizar`, {
      method: "POST",
      headers: {
        origin: URL_PUBLICA,
        cookie: `__Host-activacion=${s.cookie}`,
        "content-type": "application/x-www-form-urlencoded",
      },
      body: new Uint8Array([0xff, 0xfe, 0x3d]),
    });
    expect((await c.post(p)).status).toBe(400);
  });

  it("solo POST: GET, PUT y DELETE dan 405 sin tocar la base", async () => {
    const c = await montarCiclo();
    const n = c.llamadas.length;
    for (const m of ["GET", "PUT", "DELETE"]) {
      const r = await c.post(
        new Request(`${URL_PUBLICA}/oauth/autorizar`, {
          method: m,
          headers: { origin: URL_PUBLICA },
        }),
      );
      expect(r.status).toBe(405);
      expect(r.headers.get("content-security-policy")).toBe("frame-ancestors 'none'");
    }
    expect(c.llamadas.length).toBe(n);
  });

  it("prueba cerrada: 503 fijo, sin código de autorización", async () => {
    const c = await montarCiclo();
    const s = await abrirSolicitud(c);
    const codigo = await sembrarCodigo(c.bd);
    await gestion(c.bd, "cerrar_prueba", [hmacDe("operador")]);
    const r = await c.post(peticionPost(s, { codigo }));
    expect(r.status).toBe(503);
    const html = await r.text();
    expect(html).toContain("No se ha podido completar");
    expect(html).not.toContain("code=");
  });

  it("almacén caído y resultado desconocido o de otra forma: pantalla 503 fija, nunca éxito", async () => {
    const falsos: unknown[] = [
      new Error("caído " + CANARIO),
      { resultado: "activada" },
      { resultado: "otra_cosa" },
      { resultado: "codigo_no_valido", extra: 1 },
    ];
    for (const falso of falsos) {
      const c = await montarCiclo({ sustituir: (f) => (f === "activar" ? falso : undefined) });
      const s = await abrirSolicitud(c);
      const r = await c.post(peticionPost(s, { codigo: MALO }));
      expect(r.status).toBe(503);
      expect(r.headers.get("set-cookie")).toBeNull();
      expect(r.headers.get("content-security-policy")).toContain("frame-ancestors 'none'");
      const html = await r.text();
      expect(html).toContain("No se ha podido completar");
      expect(html).not.toContain("code=");
    }
    expect(consola.join("\n")).not.toContain(CANARIO);
  });

  it("secreto del conector inválido: error de configuración antes de leer nada", async () => {
    const c = await montarCiclo();
    const s = await abrirSolicitud(c);
    entornoConector(false);
    const n = c.llamadas.length;
    await expect(c.post(peticionPost(s, { codigo: MALO }))).rejects.toMatchObject({
      codigo: "configuracion_conector_invalida",
    });
    expect(c.llamadas.length).toBe(n);
  });

  it("los registros no contienen cuerpo, cookie, state ni código", async () => {
    const c = await montarCiclo();
    const { solicitud } = await activarCompleto(c);
    await c.post(
      peticionPost(
        solicitud,
        { codigo: CANARIO, state: CANARIO },
        { origin: "https://evil.example" },
      ),
    );
    await c.post(peticionPost(solicitud, { codigo: CANARIO }));
    const log = consola.join("\n");
    for (const v of [CANARIO, solicitud.cookie, solicitud.state, solicitud.id]) {
      expect(log).not.toContain(v);
    }
  });
});
