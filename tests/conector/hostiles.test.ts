// T-112 (d) (001): entradas hostiles y valores marcados por HTTP en proceso. PRUEBA-017 (campos de más,
// tipos incorrectos, valores fuera de rango, repeticiones, concurrencia, lotes, cuerpos que no son objeto,
// `__proto__` y `constructor`) y PRUEBA-019 (valores marcados, también en `id`; la copia del estado no
// contiene tokens). Datos ficticios; las marcas se componen en ejecución (arts. 1 y 4).
//
// Mutaciones que estas pruebas detectan:
//  - M9: el saneado deja pasar un campo ajeno (o no lo cuenta) -> `campos_descartados` distinto de lo
//    esperado y la marca aparece en la base.
//  - M10: `enviar_informe` sin bloqueo de fila o sin «el primero gana» -> más de un `guardado`.
//  - M11: un registro (consola o sucesos) que añade la ruta pedida, un valor recibido o el `id` -> la marca
//    aparece en la consola o en el volcado.
//  - M12: lote o cuerpo que no es objeto aceptado -> distinto de -32600.
//  - M13: la base guarda un token o su código en claro -> el volcado contiene el valor emitido.
import { createHmac, randomBytes, randomUUID } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cerrarAlFinal, ESQUEMA, sembrarOrden, TABLAS, una } from "../unit/conector/bd/comun";
import { crearSumidero } from "./apoyo/index";
import {
  abrirSolicitud,
  activar,
  canjear,
  ciclo,
  generarCodigo,
  informeValido,
  montarServidor,
  peticionPost,
  peticionToken,
  registrarCliente,
  renovar,
  RECURSO,
  URL_PUBLICA,
  type Servidor,
} from "./apoyo-http";

vi.mock("../../src/lib/supabase/conector", async (o) =>
  (await import("./apoyo-http")).sustitutoConector(await o()),
);
vi.mock("../../src/lib/supabase/autorizacion", async (o) =>
  (await import("./apoyo-http")).sustitutoAutorizacion(await o()),
);
vi.mock("next/server", async (o) => (await import("./apoyo-http")).sustitutoNextServer(await o()));

cerrarAlFinal();

let s: Servidor;
beforeEach(async () => {
  s = await montarServidor();
});
afterEach(async () => {
  await s.cerrar();
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

const marca = (): string => "CANARIO" + randomBytes(9).toString("hex");
const contar = async (tabla: string): Promise<number> =>
  (await una<{ n: number }>(s.bd, `select count(*)::int as n from ${ESQUEMA}.${tabla}`)).n;
/** Todo lo guardado, tabla por tabla, como texto: lo que se llevaría quien copiara el estado. */
async function volcado(): Promise<string> {
  const partes: string[] = [];
  for (const t of TABLAS) {
    const r = await s.bd.db.query<{ t: string }>(`select x::text as t from ${ESQUEMA}.${t} x`);
    partes.push(...r.rows.map((f) => f.t));
  }
  return partes.join("\n");
}
async function abrirEjecucion(token: string): Promise<string> {
  const r = await s.herramienta(token, "obtener_instrucciones", {});
  return r.contenido!.ejecucion_id as string;
}
const rpc = (nombre: string, argumentos: unknown, id: unknown = 1) => ({
  jsonrpc: "2.0",
  id,
  method: "tools/call",
  params: { name: nombre, arguments: argumentos },
});

describe("PRUEBA-017 · informe: campos de más, tipos y rangos", () => {
  it("claves ajenas (también __proto__ y constructor) se descartan y se cuentan sin guardarse", async () => {
    const a = await s.sembrar("A");
    const ej = await abrirEjecucion(a.acceso.valor);
    const [m1, m2, m3] = [marca(), marca(), marca()];
    // El texto se compone a mano: con JSON.stringify, `__proto__` no sería una clave propia.
    const informe = JSON.stringify(informeValido()).slice(0, -1);
    const conAjenos =
      informe +
      `,"__proto__":{"x":"${m1}"},"constructor":{"prototype":{"y":"${m2}"}},"asunto":"${m3}"}`;
    const r = await s.mcp(
      a.acceso.valor,
      `{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"enviar_informe","arguments":{"ejecucion_id":"${ej}","informe":${conAjenos}}}}`,
    );
    const texto = await r.text();
    expect(r.status).toBe(200);
    expect(texto).toContain('"guardado":true');
    expect(texto).toContain('"campos_descartados":3');
    const sum = crearSumidero();
    sum.registrar("respuesta", texto);
    sum.registrar("consola", s.consola.join("\n"));
    sum.registrar("volcado", await volcado());
    for (const m of [m1, m2, m3]) expect(sum.hallar(m)).toEqual([]);
    const fila = await una<{ campos_descartados: number }>(
      s.bd,
      `select campos_descartados::int from ${ESQUEMA}.informes`,
    );
    expect(fila.campos_descartados).toBe(3);
  });

  it("claves ajenas dentro de comprobaciones también se descartan y se cuentan", async () => {
    const a = await s.sembrar("A");
    const ej = await abrirEjecucion(a.acceso.valor);
    const m = marca();
    const informe = informeValido();
    (informe.comprobaciones as Record<string, unknown>).detalle = m;
    const r = await s.herramienta(a.acceso.valor, "enviar_informe", { ejecucion_id: ej, informe });
    expect(r.contenido).toEqual({ guardado: true, campos_descartados: 1 });
    expect(await volcado()).not.toContain(m);
  });

  const invalidos: Array<[string, (i: Record<string, unknown>) => void]> = [
    ["tratados negativo", (i) => (i.tratados = -1)],
    ["tratados 1001", (i) => (i.tratados = 1001)],
    ["tratados decimal", (i) => (i.tratados = 1.5)],
    ["tratados como texto", (i) => (i.tratados = "3")],
    ["tratados null", (i) => (i.tratados = null)],
    ["tratados booleano", (i) => (i.tratados = true)],
    ["sin_tratar 100001", (i) => (i.sin_tratar = 100001)],
    ["frecuencia 0", (i) => (i.frecuencia_horas = 0)],
    ["frecuencia 169", (i) => (i.frecuencia_horas = 169)],
    ["estado fuera de lista", (i) => (i.estado = "casi")],
    ["modo fuera de lista", (i) => (i.modo = "x")],
    ["version_prompt con texto", (i) => (i.version_prompt = "1.0; drop table")],
    ["problemas: texto libre", (i) => (i.problemas = ["texto libre con espacios"])],
    ["problemas: más de 5", (i) => (i.problemas = ["a", "b", "c", "d", "e", "f"])],
    ["comprobaciones no booleanas", (i) => (i.comprobaciones = { correo: "si" })],
    ["falta un campo obligatorio", (i) => delete i.urgentes],
  ];
  it.each(invalidos)("%s -> informe_invalido y la ejecución sigue abierta", async (_n, muta) => {
    const a = await s.sembrar("A");
    const ej = await abrirEjecucion(a.acceso.valor);
    const informe = informeValido();
    muta(informe);
    const r = await s.herramienta(a.acceso.valor, "enviar_informe", { ejecucion_id: ej, informe });
    expect(r.status).toBe(200);
    expect(r.contenido).toMatchObject({ guardado: false, motivo: "informe_invalido" });
    expect(await contar("informes")).toBe(0);
    // Sigue abierta: uno válido, después, se guarda.
    const ok = await s.herramienta(a.acceso.valor, "enviar_informe", {
      ejecucion_id: ej,
      informe: informeValido(),
    });
    expect(ok.contenido).toMatchObject({ guardado: true });
  });

  it.each([
    ["texto", "texto"],
    ["null", null],
    ["lista", []],
    ["número", 7],
  ])("informe que es %s -> informe_invalido", async (_n, informe) => {
    const a = await s.sembrar("A");
    const ej = await abrirEjecucion(a.acceso.valor);
    const r = await s.herramienta(a.acceso.valor, "enviar_informe", { ejecucion_id: ej, informe });
    expect(r.contenido).toMatchObject({ guardado: false });
    expect(await contar("informes")).toBe(0);
  });

  it.each([
    ["no es uuid", "no-es-uuid"],
    ["numérico", 12],
    ["null", null],
    ["con marca", "CANARIO-" + "a".repeat(20)],
  ])("ejecucion_id %s -> ejecucion_desconocida sin eco", async (_n, id) => {
    const a = await s.sembrar("A");
    const r = await s.herramienta(a.acceso.valor, "enviar_informe", {
      ejecucion_id: id,
      informe: informeValido(),
    });
    expect(r.contenido).toMatchObject({ guardado: false, motivo: "ejecucion_desconocida" });
    if (typeof id === "string") expect(r.texto).not.toContain(id);
  });
});

describe("PRUEBA-017 · repeticiones y peticiones a la vez", () => {
  it("el mismo informe dos veces: guardado y repetido; una sola fila y gana el primero", async () => {
    const a = await s.sembrar("A");
    const ej = await abrirEjecucion(a.acceso.valor);
    const uno = await s.herramienta(a.acceso.valor, "enviar_informe", {
      ejecucion_id: ej,
      informe: informeValido(),
    });
    const dos = await s.herramienta(a.acceso.valor, "enviar_informe", {
      ejecucion_id: ej,
      informe: { ...informeValido(), tratados: 9 },
    });
    expect(uno.contenido).toMatchObject({ guardado: true });
    expect(dos.contenido).toMatchObject({ guardado: true, repetido: true });
    expect(await contar("informes")).toBe(1);
    const fila = await una<{ t: string }>(
      s.bd,
      `select to_jsonb(i)::text as t from ${ESQUEMA}.informes i`,
    );
    expect(JSON.parse(fila.t).tratados).toBe(1);
  });

  it("diez informes a la vez para una ejecución: uno guardado y nueve repetidos", async () => {
    const a = await s.sembrar("A");
    const ej = await abrirEjecucion(a.acceso.valor);
    const rs = await Promise.all(
      Array.from({ length: 10 }, () =>
        s.herramienta(a.acceso.valor, "enviar_informe", {
          ejecucion_id: ej,
          informe: informeValido(),
        }),
      ),
    );
    expect(
      rs.filter((r) => r.contenido?.guardado === true && r.contenido.repetido !== true),
    ).toHaveLength(1);
    expect(rs.filter((r) => r.contenido?.repetido === true)).toHaveLength(9);
    expect(await contar("informes")).toBe(1);
  });

  it("diez confirmaciones a la vez de la misma orden: una confirmada y nueve repetidas", async () => {
    const a = await s.sembrar("A");
    const orden = await sembrarOrden(s.bd, a.licenciaId, "pausar", "entregada");
    const rs = await Promise.all(
      Array.from({ length: 10 }, () =>
        s.herramienta(a.acceso.valor, "confirmar_orden", { orden_id: orden }),
      ),
    );
    expect(
      rs.filter((r) => r.contenido?.confirmada === true && r.contenido.repetida !== true),
    ).toHaveLength(1);
    expect(rs.filter((r) => r.contenido?.repetida === true)).toHaveLength(9);
    const fila = await una<{ estado: string }>(
      s.bd,
      `select estado::text from ${ESQUEMA}.ordenes where id = $1`,
      [orden],
    );
    expect(fila.estado).toBe("confirmada");
  });

  it("dos activaciones a la vez con el mismo código: una conexión y una sola recibe el código de autorización", async () => {
    const cliente = await registrarCliente(s);
    const [s1, s2] = [await abrirSolicitud(s, cliente), await abrirSolicitud(s, cliente)];
    const codigo = await generarCodigo(s, "A");
    const [r1, r2] = await Promise.all([activar(s, s1, codigo), activar(s, s2, codigo)]);
    expect([r1, r2].filter((r) => r.codigoAut !== null)).toHaveLength(1);
    const perdedora = [r1, r2].find((r) => r.codigoAut === null)!;
    expect(perdedora.html).toContain("El código no es válido o ha caducado.");
    expect(await contar("conexiones")).toBe(1);
    expect(await contar("codigos_autorizacion")).toBe(1);
  });

  it("dos canjes a la vez del mismo código de autorización: ningún token sigue valiendo (reutilización)", async () => {
    const cliente = await registrarCliente(s);
    const sol = await abrirSolicitud(s, cliente);
    const a = await activar(s, sol, await generarCodigo(s, "A"));
    const rs = await Promise.all([
      canjear(s, cliente, sol, a.codigoAut!),
      canjear(s, cliente, sol, a.codigoAut!),
    ]);
    const estados = rs.map((r) => r.status);
    expect(estados.filter((e) => e === 200).length).toBeLessThanOrEqual(1);
    expect(estados).toContain(400);
    for (const r of rs) {
      const j = (await r.json()) as { access_token?: string };
      if (j.access_token) {
        expect((await s.herramienta(j.access_token, "obtener_instrucciones", {})).status).toBe(401);
      }
    }
  });
});

describe("PRUEBA-017 · tubería del punto MCP: lotes, no objetos, nombres ajenos, tamaño y origen", () => {
  it.each([
    ["lote", '[{"jsonrpc":"2.0","id":1,"method":"tools/list"}]'],
    ["lote vacío", "[]"],
    ["texto JSON", '"hola"'],
    ["número", "7"],
    ["null", "null"],
    ["booleano", "true"],
  ])("%s -> -32600", async (_n, cuerpo) => {
    const a = await s.sembrar("A");
    const r = await s.mcp(a.acceso.valor, cuerpo);
    const j = (await r.json()) as { error?: { code: number } };
    expect(j.error?.code).toBe(-32600);
    expect(await contar("ejecuciones")).toBe(0);
  });

  it("JSON mal formado -> -32700 sin eco", async () => {
    const a = await s.sembrar("A");
    const m = marca();
    const r = await s.mcp(a.acceso.valor, `{"jsonrpc": "${m}`);
    const t = await r.text();
    expect(JSON.parse(t).error.code).toBe(-32700);
    expect(t).not.toContain(m);
  });

  it("nombre de herramienta ajeno -> -32602 sin eco del nombre", async () => {
    const a = await s.sembrar("A");
    const m = marca();
    const r = await s.herramienta(a.acceso.valor, m, {});
    expect(r.json?.error?.code).toBe(-32602);
    expect(r.texto).not.toContain(m);
  });

  it("cuerpo de más de 32 768 bytes -> 413", async () => {
    const a = await s.sembrar("A");
    const r = await s.mcp(
      a.acceso.valor,
      JSON.stringify(rpc("obtener_instrucciones", { x: "a".repeat(33000) })),
    );
    expect(r.status).toBe(413);
  });

  it("Origin ajeno o null -> 403; con el propio o con el de claude.ai sirve", async () => {
    const a = await s.sembrar("A");
    const c = JSON.stringify(rpc("obtener_instrucciones", {}));
    for (const origin of ["https://evil.invalid", "null", "https://claude.ai.evil.invalid"]) {
      expect((await s.mcp(a.acceso.valor, c, { origin })).status, origin).toBe(403);
    }
    expect((await s.mcp(a.acceso.valor, c, { origin: URL_PUBLICA })).status).toBe(200);
    expect((await s.mcp(a.acceso.valor, c, { origin: "https://claude.ai" })).status).toBe(200);
  });

  it("autorización mal formada o con otro tipo de token -> 401 con reto, sin eco", async () => {
    const a = await s.sembrar("A");
    const c = JSON.stringify(rpc("obtener_instrucciones", {}));
    const renovacion = s.fabrica.token("renovacion").valor;
    const casos = [
      `Bearer ${a.acceso.valor}x`,
      `Bearer ${a.acceso.valor.slice(0, -1)}`,
      `bearer ${a.acceso.valor}`,
      `Basic ${a.acceso.valor}`,
      `Bearer ${renovacion}`,
      `Bearer  ${a.acceso.valor}`,
      a.acceso.valor,
    ];
    for (const cab of casos) {
      const r = await s.fetch(RECURSO, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          accept: "application/json, text/event-stream",
          authorization: cab,
        },
        body: c,
      });
      expect(r.status, cab.slice(0, 12)).toBe(401);
      expect(r.headers.get("www-authenticate")).toContain("resource_metadata=");
      expect(await r.text()).not.toContain(a.acceso.valor);
    }
    expect(await contar("ejecuciones")).toBe(0);
  });

  it("token en el cuerpo, en una cookie o en la consulta no sustituye a Authorization", async () => {
    const a = await s.sembrar("A");
    const r = await s.fetch(`${RECURSO}?access_token=${a.acceso.valor}&token=${a.acceso.valor}`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        accept: "application/json, text/event-stream",
        cookie: `access_token=${a.acceso.valor}`,
      },
      body: JSON.stringify({ ...rpc("obtener_instrucciones", {}), access_token: a.acceso.valor }),
    });
    expect(r.status).toBe(401);
  });

  it.each(["GET", "PUT", "PATCH", "DELETE", "OPTIONS"])(
    "%s -> 405 con Allow: POST",
    async (metodo) => {
      const r = await s.fetch(RECURSO, { method: metodo });
      expect(r.status).toBe(405);
      expect(r.headers.get("allow")).toBe("POST");
    },
  );
});

describe("PRUEBA-017 · registro (DCR), autorización y token con entradas hostiles", () => {
  const CB = "https://claude.ai/api/mcp/auth_callback";
  const dcr = (cuerpo: unknown, tipo = "application/json") =>
    s.fetch(`${URL_PUBLICA}/oauth/registro`, {
      method: "POST",
      headers: { "content-type": tipo },
      body: typeof cuerpo === "string" ? cuerpo : JSON.stringify(cuerpo),
    });

  it.each([
    ["callback ajeno", { redirect_uris: ["https://evil.invalid/cb"] }],
    ["callback local", { redirect_uris: ["http://localhost:8080/cb"] }],
    ["callback con barra de más", { redirect_uris: [CB + "/"] }],
    ["redirect_uris no es lista", { redirect_uris: CB }],
    ["redirect_uris vacía", { redirect_uris: [] }],
    ["sin redirect_uris", {}],
    [
      "auth distinta de none",
      { redirect_uris: [CB], token_endpoint_auth_method: "client_secret_basic" },
    ],
    ["cuerpo que no es objeto", [CB]],
    ["JSON mal formado", "{no"],
  ])("DCR: %s -> 400 y nada guardado", async (_n, cuerpo) => {
    const r = await dcr(cuerpo);
    expect(r.status).toBe(400);
    expect(await contar("clientes_oauth")).toBe(0);
  });

  it("DCR: campos de más se ignoran y no se guardan (texto libre con marca)", async () => {
    const m = marca();
    const r = await dcr({
      redirect_uris: [CB],
      token_endpoint_auth_method: "none",
      client_name: m,
      contacts: [m + "@ejemplo.invalid"],
      logo_uri: `https://${m}.invalid/x.png`,
      scope: "agente " + m,
    });
    expect(r.status).toBe(201);
    expect(JSON.stringify(await r.json())).not.toContain(m);
    expect(await volcado()).not.toContain(m);
    expect(s.consola.join("\n")).not.toContain(m);
  });

  it("autorización: callback ajeno y cliente ajeno dan error sin redirigir; errores de solicitud redirigen con error e iss", async () => {
    const cliente = await registrarCliente(s);
    const q = (extra: Record<string, string | undefined>) =>
      new URLSearchParams({
        client_id: cliente,
        redirect_uri: CB,
        response_type: "code",
        code_challenge: "A".repeat(43),
        code_challenge_method: "S256",
        resource: RECURSO,
        state: "s",
        ...(extra as Record<string, string>),
      }).toString();
    for (const extra of [
      { redirect_uri: "https://evil.invalid/cb" },
      { client_id: "dcr_" + "Z".repeat(22) },
      { client_id: "https://evil.invalid/metadata.json" },
    ]) {
      const r = await s.fetch(`${URL_PUBLICA}/oauth/autorizar?${q(extra)}`);
      expect(r.status).toBe(400);
      expect(r.headers.get("location")).toBeNull();
    }
    for (const extra of [
      { code_challenge_method: "plain" },
      { code_challenge: "corto" },
      { resource: "https://evil.invalid/api/mcp" },
      { response_type: "token" },
    ]) {
      const r = await s.fetch(`${URL_PUBLICA}/oauth/autorizar?${q(extra)}`);
      expect(r.status).not.toBe(200);
      const loc = r.headers.get("location");
      expect(loc, JSON.stringify(extra)).not.toBeNull();
      expect(loc!.startsWith(CB)).toBe(true);
      expect(loc).toContain("error=");
      expect(loc).toContain("iss=");
    }
    expect(await contar("solicitudes_autorizacion")).toBe(0);
  });

  it("POST autorizar: Origin ajeno o null, cookie ajena, state cambiado, otra solicitud o JSON no activan ni cuentan intento", async () => {
    const cliente = await registrarCliente(s);
    const sol = await abrirSolicitud(s, cliente);
    const codigo = await generarCodigo(s, "A");
    const malas = [
      peticionPost(sol, { codigo }, { origin: "https://evil.invalid" }),
      peticionPost(sol, { codigo }, { origin: "null" }),
      peticionPost(sol, { codigo }, { origin: null }),
      peticionPost(sol, { codigo }, { cookie: "x".repeat(43) }),
      peticionPost(sol, { codigo }, { cookie: null }),
      peticionPost(sol, { codigo, state: "otro" }),
      peticionPost(sol, { codigo, solicitud: randomUUID() }),
      peticionPost(
        sol,
        { codigo },
        { tipo: "application/json", cuerpo: JSON.stringify({ codigo }) },
      ),
    ];
    for (const p of malas) {
      const r = await s.enviar(p);
      const t = await r.text();
      expect([400, 403, 415]).toContain(r.status);
      expect(t).not.toContain("code=");
    }
    expect(await contar("conexiones")).toBe(0);
    // Ninguna de ellas contó un intento: el código bueno sirve y no hay bloqueo.
    const ok = await activar(s, sol, codigo);
    expect(ok.status).toBe(200);
    expect(ok.codigoAut).not.toBeNull();
  });

  it("código incorrecto 5 veces bloquea: la sexta, con el código bueno, da 429 y no crea conexión", async () => {
    const cliente = await registrarCliente(s);
    const sol = await abrirSolicitud(s, cliente);
    const bueno = await generarCodigo(s, "A");
    // Formas válidas pero distintas del código generado; se componen en ejecución.
    const falso = (i: number): string => ["ABC" + "DEFGH"[i], "EFGH", "JKMN"].join("-");
    for (let i = 0; i < 5; i++) {
      const r = await activar(s, sol, falso(i));
      expect(r.status).toBe(200);
      expect(r.html).toContain("El código no es válido o ha caducado.");
    }
    const bloqueado = await activar(s, sol, bueno);
    expect(bloqueado.status).toBe(429);
    expect(bloqueado.html).toContain("Demasiados intentos.");
    expect(bloqueado.codigoAut).toBeNull();
    expect(await contar("conexiones")).toBe(0);
  });

  it("token: grant_type ajeno, sin verificador, verificador falso, otro cliente, otro callback, JSON", async () => {
    const cliente = await registrarCliente(s);
    const otro = await registrarCliente(s);
    const sol = await abrirSolicitud(s, cliente);
    const a = await activar(s, sol, await generarCodigo(s, "A"));
    const base = {
      grant_type: "authorization_code",
      code: a.codigoAut!,
      redirect_uri: sol.callback,
      client_id: cliente,
      code_verifier: sol.verificador,
    };
    const malos: Array<Record<string, string | undefined>> = [
      { ...base, grant_type: "password" },
      { ...base, code_verifier: undefined },
      { ...base, code_verifier: "X".repeat(43) },
      { ...base, client_id: otro },
      { ...base, redirect_uri: "https://chatgpt.com/connector_platform_oauth_redirect" },
      { ...base, code: "A".repeat(43) },
    ];
    for (const m of malos) {
      const r = await s.enviar(peticionToken(m));
      expect(r.status).toBe(400);
      const j = (await r.json()) as { error: string; access_token?: string };
      expect([
        "invalid_request",
        "invalid_grant",
        "unsupported_grant_type",
        "invalid_client",
      ]).toContain(j.error);
      expect(j.access_token).toBeUndefined();
    }
    const json = await s.fetch(`${URL_PUBLICA}/oauth/token`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(base),
    });
    expect(json.status).toBe(400);
    expect(await contar("tokens")).toBe(0);
  });

  it("renovación: token ajeno, de acceso, de otro cliente o sin forma -> 400; la buena sigue valiendo", async () => {
    const { cliente, par } = await ciclo(s);
    const otro = await registrarCliente(s);
    const malos = [
      await renovar(s, cliente, s.fabrica.token("renovacion").valor),
      await renovar(s, cliente, par.access_token),
      await renovar(s, otro, par.refresh_token),
      await renovar(s, cliente, "no-es-un-token"),
    ];
    for (const r of malos) {
      expect(r.status).toBe(400);
      expect(((await r.json()) as { error: string }).error).toMatch(
        /invalid_grant|invalid_request/,
      );
    }
    expect((await renovar(s, cliente, par.refresh_token)).status).toBe(200);
  });
});

describe("PRUEBA-019 · valores marcados y copia del estado", () => {
  it("marcas en argumentos, cabeceras, consulta, cookies y id: 0 en consola y en el volcado de la base", async () => {
    const a = await s.sembrar("A");
    const [mArg, mCab, mUrl, mCookie, mId, mNombre, mOrden, mEjec] = Array.from(
      { length: 8 },
      marca,
    ) as string[] as [string, string, string, string, string, string, string, string];
    const respuestas = await Promise.all([
      s.mcp(a.acceso.valor, rpc("obtener_instrucciones", { x: mArg }, mId), {
        "user-agent": mCab,
        "x-forwarded-for": mCab,
        cookie: `c=${mCookie}`,
      }),
      s.mcp(
        a.acceso.valor,
        rpc("enviar_informe", { ejecucion_id: mEjec, informe: { z: mArg } }, mId),
      ),
      s.mcp(a.acceso.valor, rpc("confirmar_orden", { orden_id: mOrden }, mId)),
      s.mcp(a.acceso.valor, rpc(mNombre, {}, mId)),
      s.fetch(`${RECURSO}?q=${mUrl}`, {
        method: "POST",
        headers: { "content-type": "application/json", authorization: `Bearer ${a.acceso.valor}` },
        body: JSON.stringify(rpc("obtener_instrucciones", {}, mId)),
      }),
      s.mcp(null, rpc("obtener_instrucciones", {}, mId), { "user-agent": mCab }),
      s.mcp(
        "hia_" + "a_" + mArg.padEnd(43, "x").slice(0, 43),
        rpc("obtener_instrucciones", {}, mId),
      ),
      s.mcp(a.acceso.valor, rpc("obtener_instrucciones", {}, { anidado: mId })),
    ]);
    const salida = crearSumidero();
    for (const r of respuestas) await salida.registrarRespuesta(r);
    const registros = crearSumidero();
    registros.registrar("consola", s.consola.join("\n"));
    const v = await volcado();
    registros.registrar("volcado", v);
    // El `id` y los argumentos que el protocolo devuelve al propio cliente pueden volver en su respuesta;
    // lo que nunca puede es quedar en la consola ni en la base. Cabecera, consulta, cookie, nombre, orden y
    // ejecución no vuelven ni siquiera en la respuesta.
    for (const m of [mArg, mId, mCab, mUrl, mCookie, mNombre, mOrden, mEjec]) {
      expect(registros.hallar(m), m).toEqual([]);
    }
    for (const m of [mCab, mUrl, mCookie, mNombre, mOrden, mEjec])
      expect(salida.hallar(m), m).toEqual([]);
    expect(registros.hallar(a.acceso.valor)).toEqual([]);
  });

  it("la copia del estado no contiene tokens ni códigos, y la consola del ciclo tampoco", async () => {
    const { par, codigoAut, sol } = await ciclo(s);
    const codigo = await generarCodigo(s, "A");
    const sum = crearSumidero();
    sum.registrar("volcado", await volcado());
    const c = crearSumidero();
    c.registrar("consola", s.consola.join("\n"));
    for (const [n, valor] of Object.entries({
      acceso: par.access_token,
      renovacion: par.refresh_token,
      autorizacion: codigoAut,
      verificador: sol.verificador,
      activacion: codigo,
      cookie: sol.cookie,
    })) {
      expect(sum.hallar(valor), `volcado: ${n}`).toEqual([]);
      expect(c.hallar(valor), `consola: ${n}`).toEqual([]);
    }
  });

  it("con la copia del estado y otra clave del conector no se obtiene ningún token válido", async () => {
    const { cliente, par } = await ciclo(s);
    const rot = (await (await renovar(s, cliente, par.refresh_token)).json()) as {
      access_token: string;
    };
    expect(typeof rot.access_token).toBe("string");
    const filas = await s.bd.db.query<{ token_hmac: string; sal: string | null }>(
      `select token_hmac, sal from ${ESQUEMA}.tokens`,
    );
    expect(filas.rows.length).toBeGreaterThan(0);
    const claveAjena = randomBytes(32).toString("base64url");
    const intentos = new Set<string>();
    for (const f of filas.rows) {
      for (const base of [f.token_hmac, f.sal ?? ""]) {
        if (base === "") continue;
        const b64 = Buffer.from(base, /^[0-9a-f]{64}$/.test(base) ? "hex" : "utf8").toString(
          "base64url",
        );
        intentos.add("hia_" + "a_" + b64.padEnd(43, "A").slice(0, 43));
        intentos.add("hia_" + "r_" + b64.padEnd(43, "A").slice(0, 43));
        const h = createHmac("sha256", claveAjena).update(base).digest("base64url");
        intentos.add("hia_" + "a_" + h.slice(0, 43).padEnd(43, "A"));
      }
    }
    expect(intentos.size).toBeGreaterThan(3);
    for (const t of intentos) {
      expect((await s.herramienta(t, "obtener_instrucciones", {})).status).toBe(401);
    }
  });
});
