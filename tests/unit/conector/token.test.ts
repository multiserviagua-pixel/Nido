// T-110 (d) (001): `tokens.ts` y `POST /oauth/token`. PRUEBA-005 (PKCE S256, doble canje), PRUEBA-011 (parte:
// tokens opacos, solo HMAC, ligados a cliente y recurso), PRUEBA-012 (rotación, gracia de 60 s con el mismo par
// byte a byte, 18 h, 14 días; con reloj) y PRUEBA-018 (parte: emitir y renovar con el almacén caído o
// incoherente). Base de datos: PGlite con el rol de gestión. Valores compuestos en ejecución (arts. 1 y 4).
import { randomBytes } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { huellaToken } from "../../../src/lib/oauth/secretos";
import { crearAlmacenPglite } from "../../conector/apoyo/index";
import { capturarConsola, entornoConector } from "./apoyo-oauth";
import {
  activarCompleto,
  cerrarCiclos,
  claves,
  desafioDe,
  emitirPar,
  montarCiclo,
  nuevoVerificador,
  peticionToken,
  RECURSO,
  type Ciclo,
  type Par,
} from "./apoyo-oauth-ciclo";
import { CB_CHATGPT, CB_CLAUDE, ESQUEMA, idDcr, ROL_MCP, una } from "./bd/comun";

const CANARIO = "TEXTO-CANARIO-" + "TOKEN-123";
const S = 1000;
const H = 3_600_000;
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

const canje = (
  c: Ciclo,
  codigo: string,
  verificador: string,
  extra: Record<string, string | undefined> = {},
) =>
  c.token(
    peticionToken({
      grant_type: "authorization_code",
      code: codigo,
      redirect_uri: CB_CLAUDE,
      client_id: c.cliente,
      code_verifier: verificador,
      ...extra,
    }),
  );
const renovacion = (c: Ciclo, refresh: string, extra: Record<string, string | undefined> = {}) =>
  c.token(
    peticionToken({
      grant_type: "refresh_token",
      refresh_token: refresh,
      client_id: c.cliente,
      ...extra,
    }),
  );
const error = async (r: Response): Promise<string> => ((await r.json()) as { error: string }).error;
const vale = async (c: Ciclo, acceso: string): Promise<boolean> =>
  (await (
    await crearAlmacenPglite(c.bd, ROL_MCP)
  ).llamar("validar_acceso", [huellaToken(claves(), "acceso", acceso), RECURSO])) === true;
const conexion = (c: Ciclo) =>
  una<{ revocada: boolean; motivo: string | null }>(
    c.bd,
    `select (revocada_en is not null) as revocada, motivo_revocacion::text as motivo from ${ESQUEMA}.conexiones`,
  );

describe("T-110 (d): authorization_code con PKCE S256", () => {
  it("200 con el par opaco, token_type Bearer, expires_in 300 y cabeceras sin caché", async () => {
    const c = await montarCiclo();
    const { codigoAut, solicitud } = await activarCompleto(c);
    const r = await canje(c, codigoAut, solicitud.verificador);
    expect(r.status).toBe(200);
    expect(r.headers.get("cache-control")).toBe("no-store");
    expect(r.headers.get("pragma")).toBe("no-cache");
    expect(r.headers.get("content-type")).toBe("application/json");
    const par = (await r.json()) as Par;
    expect(Object.keys(par).sort()).toEqual([
      "access_token",
      "expires_in",
      "refresh_token",
      "token_type",
    ]);
    expect(par.token_type).toBe("Bearer");
    expect(par.expires_in).toBe(300);
    expect(par.access_token).toMatch(/^hia_a_[A-Za-z0-9_-]{43}$/);
    expect(par.refresh_token).toMatch(/^hia_r_[A-Za-z0-9_-]{43}$/);
    expect(await vale(c, par.access_token)).toBe(true);
    // Solo HMAC: ni el token, ni el código ni el verificador están en la base; ni en los registros.
    const volcado = JSON.stringify(
      (await c.bd.db.query(`select * from ${ESQUEMA}.tokens`)).rows.concat(
        (await c.bd.db.query(`select * from ${ESQUEMA}.codigos_autorizacion`)).rows,
      ),
    );
    for (const v of [par.access_token, par.refresh_token, codigoAut, solicitud.verificador]) {
      expect(volcado).not.toContain(v);
      expect(consola.join("\n")).not.toContain(v);
    }
    expect(volcado).toContain(huellaToken(claves(), "renovacion", par.refresh_token));
  });

  it("verificador de 43 y de 128 caracteres no reservados: valen", async () => {
    for (const largo of [43, 128]) {
      const c = await montarCiclo();
      const v = "aB3-._~".repeat(30).slice(0, largo);
      const { codigoAut } = await activarCompleto(c, { verificador: v });
      expect((await canje(c, codigoAut, v)).status).toBe(200);
    }
  });

  it.each([
    ["42 caracteres", "a".repeat(42)],
    ["129 caracteres", "a".repeat(129)],
    ["con un carácter reservado", "a".repeat(42) + "/"],
    ["con espacio", "a".repeat(42) + " "],
  ])("verificador %s: invalid_request, sin tocar la base", async (_n, v) => {
    const c = await montarCiclo();
    const { codigoAut } = await activarCompleto(c);
    const n = c.llamadas.length;
    const r = await canje(c, codigoAut, v);
    expect(r.status).toBe(400);
    expect(await error(r)).toBe("invalid_request");
    expect(c.llamadas.length).toBe(n);
  });

  it("verificador equivocado o el propio desafío (como si fuese `plain`): invalid_grant, sin emitir", async () => {
    const c = await montarCiclo();
    const { codigoAut, solicitud } = await activarCompleto(c);
    for (const v of [nuevoVerificador(), desafioDe(solicitud.verificador)]) {
      const r = await canje(c, codigoAut, v);
      expect(r.status).toBe(400);
      expect(await error(r)).toBe("invalid_grant");
    }
    expect(
      (await una<{ n: number }>(c.bd, `select count(*)::int as n from ${ESQUEMA}.tokens`)).n,
    ).toBe(0);
    // El código bueno sigue sirviendo con su verificador.
    expect((await canje(c, codigoAut, solicitud.verificador)).status).toBe(200);
  });

  it("redirect_uri o client_id distintos de los de la solicitud: invalid_grant", async () => {
    const c = await montarCiclo();
    const { codigoAut, solicitud } = await activarCompleto(c);
    const a = await canje(c, codigoAut, solicitud.verificador, { redirect_uri: CB_CHATGPT });
    expect(await error(a)).toBe("invalid_grant");
    const b = await canje(c, codigoAut, solicitud.verificador, { client_id: idDcr() });
    expect(await error(b)).toBe("invalid_grant");
    const d = await canje(c, codigoAut, solicitud.verificador, {
      client_id: "https://evil.example/oauth",
    });
    expect(await error(d)).toBe("invalid_grant");
  });

  it("resource: ausente vale; el de este servidor vale; otro es invalid_target", async () => {
    const c = await montarCiclo();
    const a = await activarCompleto(c);
    const mal = await canje(c, a.codigoAut, a.solicitud.verificador, {
      resource: "https://evil.example/api/mcp",
    });
    expect(mal.status).toBe(400);
    expect(await error(mal)).toBe("invalid_target");
    expect(
      (await canje(c, a.codigoAut, a.solicitud.verificador, { resource: RECURSO })).status,
    ).toBe(200);
  });

  it("código usado dos veces: la segunda es invalid_grant y revoca solo SU conexión y sus tokens", async () => {
    const c = await montarCiclo();
    const { par: otro } = await emitirPar(c);
    const { codigoAut, solicitud } = await activarCompleto(c);
    const primera = await canje(c, codigoAut, solicitud.verificador);
    expect(primera.status).toBe(200);
    const parUno = (await primera.json()) as Par;
    expect(await vale(c, parUno.access_token)).toBe(true);
    const segunda = await canje(c, codigoAut, solicitud.verificador);
    expect(segunda.status).toBe(400);
    expect(await error(segunda)).toBe("invalid_grant");
    const filas = await c.bd.db.query<{ motivo: string | null }>(
      `select motivo_revocacion::text as motivo from ${ESQUEMA}.conexiones order by creada_en`,
    );
    expect(filas.rows.map((f) => f.motivo)).toEqual([null, "reutilizacion"]);
    expect(await vale(c, parUno.access_token)).toBe(false);
    expect(await error(await renovacion(c, parUno.refresh_token))).toBe("invalid_grant");
    expect(await vale(c, otro.access_token)).toBe(true);
  });

  it("código con forma incorrecta: invalid_grant sin tocar la base", async () => {
    const c = await montarCiclo();
    const n = c.llamadas.length;
    for (const codigo of ["corto", "a".repeat(44), CANARIO]) {
      const r = await canje(c, codigo, nuevoVerificador());
      expect(await error(r)).toBe("invalid_grant");
    }
    expect(c.llamadas.length).toBe(n);
    expect(consola.join("\n")).not.toContain(CANARIO);
  });

  it("tokens.cliente_oauth_id no se acepta como entrada: sale del código", async () => {
    const c = await montarCiclo();
    const { codigoAut, solicitud } = await activarCompleto(c);
    const otro = "00000000-0000-4000-8000-000000000000";
    const r = await canje(c, codigoAut, solicitud.verificador, {
      cliente_oauth_id: otro,
      conexion_id: otro,
      licencia_id: otro,
      scope: "admin",
    });
    expect(r.status).toBe(200);
    const filas = (
      await c.bd.db.query<{ cliente: string }>(
        `select t.cliente_oauth_id::text as cliente from ${ESQUEMA}.tokens t`,
      )
    ).rows;
    const esperado = await una<{ id: string }>(
      c.bd,
      `select id::text from ${ESQUEMA}.clientes_oauth where client_id = $1`,
      [c.cliente],
    );
    expect(filas.length).toBe(2);
    expect(filas.every((f) => f.cliente === esperado.id)).toBe(true);
  });
});

describe("T-110 (d): forma de la petición", () => {
  it.each([
    ["grant_type ausente", { client_id: "x" }, 400, "invalid_request"],
    [
      "grant_type desconocido",
      { grant_type: "password", client_id: "x" },
      400,
      "unsupported_grant_type",
    ],
    [
      "client_credentials",
      { grant_type: "client_credentials", client_id: "x" },
      400,
      "unsupported_grant_type",
    ],
    [
      "client_id ausente",
      { grant_type: "refresh_token", refresh_token: "x" },
      400,
      "invalid_request",
    ],
    [
      "code ausente",
      {
        grant_type: "authorization_code",
        client_id: "x",
        redirect_uri: CB_CLAUDE,
        code_verifier: "a".repeat(43),
      },
      400,
      "invalid_request",
    ],
    [
      "refresh_token ausente",
      { grant_type: "refresh_token", client_id: "x" },
      400,
      "invalid_request",
    ],
    [
      "client_id enorme",
      { grant_type: "refresh_token", refresh_token: "x", client_id: "a".repeat(301) },
      400,
      "invalid_request",
    ],
  ])("%s", async (_n, campos, estado, codigo) => {
    const c = await montarCiclo();
    const n = c.llamadas.length;
    const r = await c.token(peticionToken(campos));
    expect(r.status).toBe(estado);
    expect(await error(r)).toBe(codigo);
    expect(r.headers.get("cache-control")).toBe("no-store");
    expect(r.headers.get("pragma")).toBe("no-cache");
    expect(c.llamadas.length).toBe(n);
  });

  it("campo repetido: ambiguo, invalid_request", async () => {
    const c = await montarCiclo();
    const f = new URLSearchParams({ grant_type: "refresh_token", client_id: c.cliente });
    f.append("refresh_token", "a");
    f.append("refresh_token", "b");
    const r = await c.token(
      new Request("http://localhost:3000/oauth/token", {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body: f.toString(),
      }),
    );
    expect(await error(r)).toBe("invalid_request");
  });

  it("cabecera Authorization (autenticación de cliente que no admitimos): 401 invalid_client, sin leer ni tocar la base", async () => {
    const c = await montarCiclo();
    const n = c.llamadas.length;
    const r = await c.token(
      peticionToken(
        { grant_type: "refresh_token", refresh_token: "x", client_id: c.cliente },
        { authorization: "Basic " + CANARIO },
      ),
    );
    expect(r.status).toBe(401);
    expect(await error(r)).toBe("invalid_client");
    expect(r.headers.get("www-authenticate")).toBe('Basic realm="oauth"'); // RFC 6749 §5.2
    expect(c.llamadas.length).toBe(n);
    expect(consola.join("\n")).not.toContain(CANARIO);
  });

  it.each([["application/json"], ["text/plain"]])(
    "tipo de contenido %s: invalid_request",
    async (tipo) => {
      const c = await montarCiclo();
      const r = await c.token(
        new Request("http://localhost:3000/oauth/token", {
          method: "POST",
          headers: { "content-type": tipo },
          body: JSON.stringify({ grant_type: "refresh_token" }),
        }),
      );
      expect(r.status).toBe(400);
      expect(await error(r)).toBe("invalid_request");
    },
  );

  it("cuerpo de más de 8192 bytes: 413 sin tocar la base ni eco", async () => {
    const c = await montarCiclo();
    const r = await c.token(
      peticionToken({
        grant_type: "refresh_token",
        client_id: c.cliente,
        relleno: CANARIO + "a".repeat(9000),
      }),
    );
    expect(r.status).toBe(413);
    expect(await r.text()).not.toContain(CANARIO);
    expect(c.llamadas.length).toBe(0);
    expect(consola.join("\n")).not.toContain(CANARIO);
  });

  it("solo POST: 405 con Allow y sin caché", async () => {
    const c = await montarCiclo();
    for (const m of ["GET", "PUT", "DELETE", "OPTIONS"]) {
      const r = await c.token(new Request("http://localhost:3000/oauth/token", { method: m }));
      expect(r.status).toBe(405);
      expect(r.headers.get("allow")).toBe("POST");
      expect(r.headers.get("cache-control")).toBe("no-store");
    }
  });
});

describe("T-110 (d): refresh_token con rotación y par de gracia (PRUEBA-012)", () => {
  it("rota: par nuevo y distinto, sin parte común entre acceso y renovación; siempre emite renovación", async () => {
    const c = await montarCiclo();
    await c.bd.reloj.fijar(new Date());
    let { par } = await emitirPar(c);
    const vistos = new Set<string>([par.access_token, par.refresh_token]);
    for (let i = 0; i < 4; i++) {
      await c.bd.reloj.avanzar(120 * S);
      const r = await renovacion(c, par.refresh_token);
      expect(r.status).toBe(200);
      expect(r.headers.get("cache-control")).toBe("no-store");
      expect(r.headers.get("pragma")).toBe("no-cache");
      const nuevo = (await r.json()) as Par;
      expect(nuevo.refresh_token).toMatch(/^hia_r_[A-Za-z0-9_-]{43}$/);
      expect(nuevo.access_token).toMatch(/^hia_a_[A-Za-z0-9_-]{43}$/);
      expect(nuevo.access_token.slice(6)).not.toBe(nuevo.refresh_token.slice(6));
      expect(nuevo.expires_in).toBe(300);
      expect(vistos.has(nuevo.access_token)).toBe(false);
      expect(vistos.has(nuevo.refresh_token)).toBe(false);
      vistos.add(nuevo.access_token);
      vistos.add(nuevo.refresh_token);
      expect(await vale(c, nuevo.access_token)).toBe(true);
      par = nuevo;
    }
    // La sal guardada no es el token ni deja derivarlo: solo es la sal.
    const volcado = JSON.stringify((await c.bd.db.query(`select * from ${ESQUEMA}.tokens`)).rows);
    for (const v of vistos) expect(volcado).not.toContain(v);
  });

  it("repetición dentro de 60 s: el MISMO par byte a byte; pasados los 60 s, invalid_grant y revocación", async () => {
    const c = await montarCiclo();
    await c.bd.reloj.fijar(new Date());
    const { par } = await emitirPar(c);
    const a = await renovacion(c, par.refresh_token);
    const parA = await a.text();
    expect(a.status).toBe(200);
    await c.bd.reloj.avanzar(30 * S);
    const b = await renovacion(c, par.refresh_token);
    expect(b.status).toBe(200);
    const parB = JSON.parse(await b.text()) as Par;
    const parAJson = JSON.parse(parA) as Par;
    expect(parB.access_token).toBe(parAJson.access_token);
    expect(parB.refresh_token).toBe(parAJson.refresh_token);
    expect(parB.expires_in).toBeLessThanOrEqual(270);
    expect(parB.expires_in).toBeGreaterThanOrEqual(269);
    // Pasada la gracia: reutilización.
    await c.bd.reloj.avanzar(31 * S);
    const tarde = await renovacion(c, par.refresh_token);
    expect(tarde.status).toBe(400);
    expect(await error(tarde)).toBe("invalid_grant");
    expect(await conexion(c)).toEqual({ revocada: true, motivo: "reutilizacion" });
    expect(await vale(c, parAJson.access_token)).toBe(false);
    expect(await error(await renovacion(c, parAJson.refresh_token))).toBe("invalid_grant");
  });

  it("dos renovaciones a la vez: una rota y la otra recibe el mismo par", async () => {
    const c = await montarCiclo();
    const { par } = await emitirPar(c);
    const [x, y] = await Promise.all([
      renovacion(c, par.refresh_token),
      renovacion(c, par.refresh_token),
    ]);
    expect([x.status, y.status]).toEqual([200, 200]);
    const px = (await x.json()) as Par;
    const py = (await y.json()) as Par;
    expect(px.access_token).toBe(py.access_token);
    expect(px.refresh_token).toBe(py.refresh_token);
  });

  it("18 horas sin uso: la renovación sigue valiendo (el acceso ya caducó)", async () => {
    const c = await montarCiclo();
    await c.bd.reloj.fijar(new Date());
    const { par } = await emitirPar(c);
    await c.bd.reloj.avanzar(18 * H);
    expect(await vale(c, par.access_token)).toBe(false);
    const r = await renovacion(c, par.refresh_token);
    expect(r.status).toBe(200);
    expect(await vale(c, ((await r.json()) as Par).access_token)).toBe(true);
  });

  it("14 días deslizantes: caduca a los 14 días de la última rotación", async () => {
    const c = await montarCiclo();
    await c.bd.reloj.fijar(new Date());
    const { par } = await emitirPar(c);
    await c.bd.reloj.avanzar(13 * 24 * H);
    const r1 = await renovacion(c, par.refresh_token);
    expect(r1.status).toBe(200);
    const nuevo = (await r1.json()) as Par;
    await c.bd.reloj.avanzar(13 * 24 * H); // 26 días desde el origen, 13 desde la rotación
    const r2 = await renovacion(c, nuevo.refresh_token);
    expect(r2.status).toBe(200);
    const ultimo = (await r2.json()) as Par;
    await c.bd.reloj.avanzar(14 * 24 * H + S);
    expect(await error(await renovacion(c, ultimo.refresh_token))).toBe("invalid_grant");
  });

  it("el token de acceso, una renovación inventada o con forma incorrecta: invalid_grant", async () => {
    const c = await montarCiclo();
    const { par } = await emitirPar(c);
    const inventado = "hia_r_" + randomBytes(32).toString("base64url");
    for (const t of [
      par.access_token,
      inventado,
      "hia_r_corto",
      CANARIO,
      "hia_a_" + "A".repeat(43),
    ]) {
      const r = await renovacion(c, t);
      expect(r.status).toBe(400);
      expect(await error(r)).toBe("invalid_grant");
    }
    expect(consola.join("\n")).not.toContain(CANARIO);
    // La conexión legítima no se tocó.
    expect(await conexion(c)).toEqual({ revocada: false, motivo: null });
  });

  it("de otro cliente o con otro resource: invalid_grant / invalid_target", async () => {
    const c = await montarCiclo();
    const { par } = await emitirPar(c);
    expect(await error(await renovacion(c, par.refresh_token, { client_id: idDcr() }))).toBe(
      "invalid_grant",
    );
    expect(
      await error(
        await renovacion(c, par.refresh_token, { resource: "https://evil.example/api/mcp" }),
      ),
    ).toBe("invalid_target");
    expect((await renovacion(c, par.refresh_token, { resource: RECURSO })).status).toBe(200);
  });

  it("conexión revocada por la persona: invalid_grant", async () => {
    const c = await montarCiclo();
    const { par } = await emitirPar(c);
    await c.bd.db.query(
      `update ${ESQUEMA}.conexiones set revocada_en = now(), motivo_revocacion = 'operador'`,
    );
    expect(await error(await renovacion(c, par.refresh_token))).toBe("invalid_grant");
  });
});

describe("T-110 (d): cierre en fallo (PRUEBA-018, parte emitir y renovar)", () => {
  const falsos: [string, unknown][] = [
    ["almacén caído", new Error("caído " + CANARIO)],
    ["cerrada", { resultado: "cerrada" }],
    ["resultado desconocido", { resultado: "inventado" }],
    ["forma incoherente", { resultado: "emitido" }],
    ["campo de más", { resultado: "no_valido", extra: 1 }],
  ];
  it.each(falsos)(
    "canjear_codigo con %s: error de almacén (503 por el manejador), sin tokens",
    async (_n, falso) => {
      const c = await montarCiclo({
        sustituir: (f) => (f === "canjear_codigo" ? falso : undefined),
      });
      const { codigoAut, solicitud } = await activarCompleto(c);
      await expect(canje(c, codigoAut, solicitud.verificador)).rejects.toMatchObject({
        codigo: "almacen_no_disponible",
      });
      expect(consola.join("\n")).not.toContain(CANARIO);
    },
  );
  it.each(falsos)(
    "renovar con %s: error de almacén (503 por el manejador), sin tokens",
    async (_n, falso) => {
      const c = await montarCiclo({ sustituir: (f) => (f === "renovar" ? falso : undefined) });
      const refresh = "hia_r_" + randomBytes(32).toString("base64url");
      await expect(renovacion(c, refresh)).rejects.toMatchObject({
        codigo: "almacen_no_disponible",
      });
      expect(consola.join("\n")).not.toContain(CANARIO);
    },
  );

  it("prueba cerrada en la base: invalid_grant, nunca un par", async () => {
    const c = await montarCiclo();
    const { par } = await emitirPar(c);
    const { codigoAut, solicitud } = await activarCompleto(c);
    await (
      await crearAlmacenPglite(c.bd, "conector_prueba_gestion")
    ).llamar("cerrar_prueba", ["a".repeat(64)]);
    expect(await error(await canje(c, codigoAut, solicitud.verificador))).toBe("invalid_grant");
    expect(await error(await renovacion(c, par.refresh_token))).toBe("invalid_grant");
  });

  it("secreto del conector inválido: error de configuración antes de leer el cuerpo", async () => {
    const c = await montarCiclo();
    entornoConector(false);
    await expect(c.token(peticionToken({ grant_type: "refresh_token" }))).rejects.toMatchObject({
      codigo: "configuracion_conector_invalida",
    });
    expect(c.llamadas.length).toBe(0);
  });

  it("los registros no contienen tokens, códigos ni verificadores en ninguna salida", async () => {
    const c = await montarCiclo();
    const { par, solicitud } = await emitirPar(c);
    await renovacion(c, par.refresh_token);
    await renovacion(c, "hia_r_" + randomBytes(32).toString("base64url"));
    const log = consola.join("\n");
    for (const v of [
      par.access_token,
      par.refresh_token,
      solicitud.verificador,
      solicitud.cookie,
    ]) {
      expect(log).not.toContain(v);
    }
  });
});
