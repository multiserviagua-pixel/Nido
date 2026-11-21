// T-107 (c) (001): `canjear_codigo` y `renovar` en PGlite. PRUEBA-012 (parte BD, con reloj: gracia de 60 s,
// 18 h sin uso, 14 días deslizantes, el par de gracia es el mismo) y PRUEBA-005 (doble canje). Una sola
// conexión de base de datos: las «10 simultáneas» comprueban la lógica, NO demuestran carreras (008, L).
// No sustituye a Postgres real de Supabase ni a pgTAP (CI). Valores sembrados compuestos en ejecución.
import { describe, expect, it } from "vitest";
import type { BdApoyo } from "../../../conector/apoyo/index";
import {
  abrir,
  autorizar,
  canjear,
  cerrarAlFinal,
  CB_CHATGPT,
  comprobarForma,
  conectar,
  ESQUEMA,
  estado,
  fabrica,
  gestion,
  RECURSO,
  registrarCliente,
  ROL_GESTION,
  ROL_MCP,
  type Emitido,
  una,
  vale,
} from "./comun";

cerrarAlFinal();

const S = 1000;
const H = 3_600_000;
const D = 24 * H;
const SAL = () =>
  Buffer.from(fabrica.token("acceso").hmac.slice(0, 32), "hex").toString("base64url").slice(0, 22);

const renovar = (
  bd: BdApoyo,
  e: Pick<Emitido, "renovacion">,
  cliente: string,
  sal: unknown = SAL(),
  nuevoAcceso = fabrica.token("acceso"),
  nuevaRenovacion = fabrica.token("renovacion"),
  recurso: unknown = RECURSO,
) =>
  gestion(bd, "renovar", [
    e.renovacion.hmac,
    cliente,
    recurso,
    sal,
    nuevoAcceso.hmac,
    nuevaRenovacion.hmac,
  ]).then((r) => ({ r, nuevoAcceso, nuevaRenovacion }));

const cuenta = async (bd: BdApoyo, tabla: string, donde = "true") =>
  (
    await una<{ n: number }>(
      bd,
      `select count(*)::int as n from ${ESQUEMA}.${tabla} where ${donde}`,
    )
  ).n;
const conexion = (bd: BdApoyo, id: string) =>
  una<{ revocada: boolean; motivo: string | null }>(
    bd,
    `select (revocada_en is not null) as revocada, motivo_revocacion::text as motivo
       from ${ESQUEMA}.conexiones where id = $1`,
    [id],
  );

describe("T-107 (c): forma y permisos", () => {
  it("security definer, search_path, sin identificadores de licencia, solo el rol de gestión", async () => {
    const bd = await abrir();
    const cliente = await registrarCliente(bd);
    const prohibidos = ["anon", "authenticated", "service_role", ROL_MCP];
    const h = fabrica.token("acceso").hmac;
    await comprobarForma(
      bd,
      "canjear_codigo",
      "text, text, text, text, text, text, text",
      [
        "p_codigo_hmac",
        "p_client_id",
        "p_redirect_uri",
        "p_desafio",
        "p_recurso",
        "p_acceso_hmac",
        "p_renovacion_hmac",
      ],
      "$1, $2, $3, $4, $5, $6, $7",
      [h, cliente, "https://claude.ai/api/mcp/auth_callback", "A".repeat(43), RECURSO, h, h],
      { permitido: ROL_GESTION, prohibidos },
    );
    await comprobarForma(
      bd,
      "renovar",
      "text, text, text, text, text, text",
      [
        "p_presentado_hmac",
        "p_client_id",
        "p_recurso",
        "p_sal",
        "p_acceso_hmac",
        "p_renovacion_hmac",
      ],
      "$1, $2, $3, $4, $5, $6",
      [h, cliente, RECURSO, SAL(), h, h],
      { permitido: ROL_GESTION, prohibidos },
    );
  });
});

describe("T-107 (c): canjear_codigo (PRUEBA-005)", () => {
  it("emite el par: acceso de 300 s y renovación de 14 días, ligados a la conexión, el cliente y el recurso", async () => {
    const bd = await abrir();
    await bd.reloj.fijar(new Date());
    const cliente = await registrarCliente(bd);
    const e = await conectar(bd, cliente);
    const filas = (
      await bd.db.query<Record<string, string | boolean>>(
        `select t.tipo::text, t.recurso, (t.caduca_en - t.creado_en)::text as vida,
                t.conexion_id::text as conexion, (t.sal is null) as sin_sal,
                (t.cliente_oauth_id = (select id from ${ESQUEMA}.clientes_oauth where client_id = $1)) as del_cliente
           from ${ESQUEMA}.tokens t order by t.tipo`,
        [cliente],
      )
    ).rows;
    expect(filas).toEqual([
      {
        tipo: "acceso",
        recurso: RECURSO,
        vida: "00:05:00",
        conexion: e.conexion,
        sin_sal: true,
        del_cliente: true,
      },
      {
        tipo: "renovacion",
        recurso: RECURSO,
        vida: "14 days",
        conexion: e.conexion,
        sin_sal: true,
        del_cliente: true,
      },
    ]);
    expect(await vale(bd, e.acceso)).toBe(true);
    expect(await vale(bd, e.renovacion), "el de renovación no sirve como acceso").toBe(false);
    expect(await cuenta(bd, "codigos_autorizacion", "usado_en is not null")).toBe(1);
  });

  it("el código de autorización caduca a los 300 s: vale a los 299 s y no a los 300 s", async () => {
    const bd = await abrir();
    await bd.reloj.fijar(new Date());
    const cliente = await registrarCliente(bd);
    const a = await autorizar(bd, cliente);
    const b = await autorizar(bd, cliente);
    await bd.reloj.avanzar(299 * S);
    const t = [fabrica.token("acceso"), fabrica.token("renovacion")] as const;
    expect((await canjear(bd, a, cliente, ...t)).resultado, "299 s").toBe("emitido");
    await bd.reloj.avanzar(1 * S);
    const u = [fabrica.token("acceso"), fabrica.token("renovacion")] as const;
    expect(await canjear(bd, b, cliente, ...u), "300 s").toEqual({ resultado: "no_valido" });
    expect(await cuenta(bd, "tokens")).toBe(2);
  });

  it("cliente, callback, desafío o recurso distintos, código ajeno o mal formado: no_valido, sin tokens y sin consumir", async () => {
    const bd = await abrir();
    const cliente = await registrarCliente(bd);
    const otro = await registrarCliente(bd, "otro");
    const a = await autorizar(bd, cliente);
    const acceso = fabrica.token("acceso");
    const renovacion = fabrica.token("renovacion");
    const antes = await estado(bd);
    const buenos = [
      a.codigoAut,
      cliente,
      "https://claude.ai/api/mcp/auth_callback",
      a.desafio,
      RECURSO,
      acceso.hmac,
      renovacion.hmac,
    ];
    const con = (i: number, v: unknown) => buenos.map((x, k) => (k === i ? v : x));
    const casos: [string, unknown[]][] = [
      ["otro cliente", con(1, otro)],
      ["cliente desconocido", con(1, "dcr_" + "z".repeat(22))],
      ["otro callback (de la lista)", con(2, CB_CHATGPT)],
      ["callback con barra", con(2, "https://claude.ai/api/mcp/auth_callback/")],
      ["otro desafío", con(3, "B".repeat(43))],
      ["desafío corto", con(3, a.desafio.slice(1))],
      ["otro recurso", con(4, "https://otro.ejemplo.test/api/mcp")],
      ["código inexistente", con(0, "a".repeat(64))],
      ["código mal formado", con(0, "no-es-hmac")],
      ["código nulo", con(0, null)],
      ["acceso mal formado", con(5, "x")],
      ["renovación mal formada", con(6, null)],
      ["acceso y renovación iguales", con(6, acceso.hmac)],
    ];
    for (const [nombre, args] of casos) {
      expect(await gestion(bd, "canjear_codigo", args), nombre).toEqual({ resultado: "no_valido" });
    }
    expect(await estado(bd), "nada cambia: el código sigue sin consumir").toEqual(antes);
    expect((await canjear(bd, a, cliente, acceso, renovacion)).resultado).toBe("emitido");
  });

  it("un token cuyo HMAC ya existe no se emite: no_valido y el código queda sin consumir", async () => {
    const bd = await abrir();
    const cliente = await registrarCliente(bd);
    const previo = await conectar(bd, cliente);
    const a = await autorizar(bd, cliente);
    const antes = await estado(bd);
    expect(await canjear(bd, a, cliente, previo.acceso, fabrica.token("renovacion"))).toEqual({
      resultado: "no_valido",
    });
    expect(await estado(bd)).toEqual(antes);
  });

  it("doble canje: el segundo se rechaza, revoca la conexión (reutilizacion) y sus tokens; otras conexiones siguen", async () => {
    const bd = await abrir();
    const cliente = await registrarCliente(bd);
    const otra = await conectar(bd, cliente, "A");
    const deB = await conectar(bd, cliente, "B");
    const a = await autorizar(bd, cliente);
    const t1 = [fabrica.token("acceso"), fabrica.token("renovacion")] as const;
    expect((await canjear(bd, a, cliente, ...t1)).resultado).toBe("emitido");
    expect(await vale(bd, t1[0])).toBe(true);
    const t2 = [fabrica.token("acceso"), fabrica.token("renovacion")] as const;
    expect(await canjear(bd, a, cliente, ...t2)).toEqual({ resultado: "no_valido" });
    expect(await conexion(bd, a.conexion)).toEqual({ revocada: true, motivo: "reutilizacion" });
    expect(await vale(bd, t1[0]), "el acceso emitido ya no vale").toBe(false);
    expect(await vale(bd, t2[0]), "el segundo canje no emitió nada").toBe(false);
    expect(
      await cuenta(bd, "tokens", `conexion_id = '${a.conexion}' and revocado_en is null`),
    ).toBe(0);
    expect(await vale(bd, otra.acceso)).toBe(true);
    expect(await vale(bd, deB.acceso)).toBe(true);
    expect(await conexion(bd, deB.conexion)).toEqual({ revocada: false, motivo: null });
  });

  it("repetir un código usado, aunque venga con datos erróneos, revoca la conexión; si ya estaba revocada, conserva su motivo", async () => {
    const bd = await abrir();
    const cliente = await registrarCliente(bd);
    const e = await conectar(bd, cliente);
    await bd.db.query(
      `update ${ESQUEMA}.conexiones set revocada_en = now(), motivo_revocacion = 'operador' where id = $1`,
      [e.conexion],
    );
    const r = await gestion(bd, "canjear_codigo", [
      e.codigoAut,
      cliente,
      "https://claude.ai/api/mcp/auth_callback",
      "C".repeat(43),
      RECURSO,
      fabrica.token("acceso").hmac,
      fabrica.token("renovacion").hmac,
    ]);
    expect(r).toEqual({ resultado: "no_valido" });
    expect(await conexion(bd, e.conexion)).toEqual({ revocada: true, motivo: "operador" });
  });

  it("con la conexión o la licencia revocadas no se emite nada; con la licencia suspendida sí (se sirve `suspendida`)", async () => {
    const bd = await abrir();
    const cliente = await registrarCliente(bd);
    const a = await autorizar(bd, cliente);
    await bd.db.query(`update ${ESQUEMA}.licencias set estado = 'revocada' where id = $1`, [
      a.licencia,
    ]);
    const t = [fabrica.token("acceso"), fabrica.token("renovacion")] as const;
    expect((await canjear(bd, a, cliente, ...t)).resultado, "licencia revocada").toBe("no_valido");
    await bd.db.query(`update ${ESQUEMA}.licencias set estado = 'suspendida' where id = $1`, [
      a.licencia,
    ]);
    await bd.db.query(
      `update ${ESQUEMA}.conexiones set revocada_en = now(), motivo_revocacion = 'operador' where id = $1`,
      [a.conexion],
    );
    expect((await canjear(bd, a, cliente, ...t)).resultado, "conexión revocada").toBe("no_valido");
    await bd.db.query(
      `update ${ESQUEMA}.conexiones set revocada_en = null, motivo_revocacion = null where id = $1`,
      [a.conexion],
    );
    expect((await canjear(bd, a, cliente, ...t)).resultado, "suspendida").toBe("emitido");
  });
});

describe("T-107 (c): renovar (PRUEBA-012, parte BD, con reloj)", () => {
  it("rota: devuelve `rotado`, deja el par nuevo ligado a lo mismo y marca el anterior como sustituido con su sal", async () => {
    const bd = await abrir();
    await bd.reloj.fijar(new Date());
    const cliente = await registrarCliente(bd);
    const e = await conectar(bd, cliente);
    await bd.reloj.avanzar(2 * H);
    const sal = SAL();
    const { r, nuevoAcceso, nuevaRenovacion } = await renovar(bd, e, cliente, sal);
    expect(r).toEqual({ resultado: "rotado", expires_in: 300 });
    expect(await vale(bd, nuevoAcceso)).toBe(true);
    const viejo = await una<{ sal: string; sustituido: boolean; hacia_el_nuevo: boolean }>(
      bd,
      `select sal, (sustituido_en is not null) as sustituido,
              (sustituido_por = (select id from ${ESQUEMA}.tokens where token_hmac = $2)) as hacia_el_nuevo
         from ${ESQUEMA}.tokens where token_hmac = $1`,
      [e.renovacion.hmac, nuevaRenovacion.hmac],
    );
    expect(viejo).toEqual({ sal, sustituido: true, hacia_el_nuevo: true });
    const nuevo = await una<{ vida: string; cliente: boolean; conexion: string }>(
      bd,
      `select (caduca_en - creado_en)::text as vida, (cliente_oauth_id is not null) as cliente, conexion_id::text as conexion
         from ${ESQUEMA}.tokens where token_hmac = $1`,
      [nuevaRenovacion.hmac],
    );
    expect(nuevo).toEqual({ vida: "14 days", cliente: true, conexion: e.conexion });
  });

  it("repetida dentro de la gracia (60 s): `repetido` con la misma sal y sin escribir nada; a 61 s revoca esa conexión", async () => {
    const bd = await abrir();
    await bd.reloj.fijar(new Date());
    const cliente = await registrarCliente(bd);
    const e = await conectar(bd, cliente);
    await bd.reloj.avanzar(10 * S);
    const sal = SAL();
    expect((await renovar(bd, e, cliente, sal)).r.resultado).toBe("rotado");
    const antes = await estado(bd);
    await bd.reloj.avanzar(30 * S);
    const otra = await renovar(bd, e, cliente, SAL());
    expect(otra.r).toEqual({ resultado: "repetido", sal, expires_in: 270 });
    await bd.reloj.avanzar(20 * S);
    expect((await renovar(bd, e, cliente, SAL())).r, "a 50 s").toMatchObject({
      resultado: "repetido",
      sal,
    });
    await bd.reloj.avanzar(10 * S);
    expect((await renovar(bd, e, cliente, SAL())).r, "justo a 60 s").toMatchObject({
      resultado: "repetido",
      sal,
    });
    expect(await estado(bd), "repetir no escribe").toEqual(antes);
    await bd.reloj.avanzar(1 * S);
    expect((await renovar(bd, e, cliente, SAL())).r, "a 61 s").toEqual({
      resultado: "reutilizado",
    });
    expect(await conexion(bd, e.conexion)).toEqual({ revocada: true, motivo: "reutilizacion" });
  });

  it("10 renovaciones seguidas con el mismo token: una rota y las otras 9 dan la misma sal; un solo par nuevo", async () => {
    const bd = await abrir();
    const cliente = await registrarCliente(bd);
    const e = await conectar(bd, cliente);
    const intentos = await Promise.all(Array.from({ length: 10 }, () => renovar(bd, e, cliente)));
    const rotados = intentos.filter((x) => x.r.resultado === "rotado");
    const repetidos = intentos.filter((x) => x.r.resultado === "repetido");
    expect(rotados).toHaveLength(1);
    expect(repetidos).toHaveLength(9);
    const sal = (
      await una<{ sal: string }>(bd, `select sal from ${ESQUEMA}.tokens where token_hmac = $1`, [
        e.renovacion.hmac,
      ])
    ).sal;
    for (const x of repetidos) expect(x.r.sal).toBe(sal);
    expect(await cuenta(bd, "tokens")).toBe(4);
    expect((await conexion(bd, e.conexion)).revocada).toBe(false);
  });

  it("fuera de la gracia revoca solo esa conexión: la otra de la misma licencia y las de B siguen", async () => {
    const bd = await abrir();
    await bd.reloj.fijar(new Date());
    const cliente = await registrarCliente(bd);
    const e = await conectar(bd, cliente, "A");
    const hermana = await conectar(bd, cliente, "A");
    const deB = await conectar(bd, cliente, "B");
    const { nuevoAcceso } = await renovar(bd, e, cliente);
    await bd.reloj.avanzar(61 * S);
    const hermanaRenovada = await renovar(bd, hermana, cliente);
    expect(hermanaRenovada.r.resultado).toBe("rotado");
    expect((await renovar(bd, e, cliente)).r).toEqual({ resultado: "reutilizado" });
    expect(await vale(bd, nuevoAcceso), "el acceso nuevo de la revocada ya no vale").toBe(false);
    expect(await vale(bd, e.acceso)).toBe(false);
    expect(
      await cuenta(bd, "tokens", `conexion_id = '${e.conexion}' and revocado_en is null`),
    ).toBe(0);
    expect(await vale(bd, hermanaRenovada.nuevoAcceso)).toBe(true);
    expect(await vale(bd, deB.acceso)).toBe(true);
    // La conexión revocada ya no renueva: invalid_grant.
    expect((await renovar(bd, e, cliente)).r).toEqual({ resultado: "no_valido" });
  });

  it("tras 18 h sin uso renueva (el acceso de 5 min ya caducó); 14 días desde el último uso, no", async () => {
    const bd = await abrir();
    await bd.reloj.fijar(new Date());
    const cliente = await registrarCliente(bd);
    const e = await conectar(bd, cliente);
    await bd.reloj.avanzar(18 * H);
    expect(await vale(bd, e.acceso)).toBe(false);
    const primera = await renovar(bd, e, cliente);
    expect(primera.r.resultado, "18 h").toBe("rotado");
    // Deslizante: la caducidad se cuenta desde la rotación.
    const e2 = { renovacion: primera.nuevaRenovacion };
    await bd.reloj.avanzar(14 * D - 1 * S);
    const segunda = await renovar(bd, e2, cliente);
    expect(segunda.r.resultado, "14 días menos 1 s").toBe("rotado");
    await bd.reloj.avanzar(14 * D);
    expect(
      (await renovar(bd, { renovacion: segunda.nuevaRenovacion }, cliente)).r,
      "14 días",
    ).toEqual({
      resultado: "no_valido",
    });
  });

  it("rechaza (no_valido) sin escribir: tipo equivocado, desconocido, otro cliente o recurso, sal o HMAC mal formados", async () => {
    const bd = await abrir();
    const cliente = await registrarCliente(bd);
    const otro = await registrarCliente(bd, "otro");
    const e = await conectar(bd, cliente);
    const antes = await estado(bd);
    const buenos = [
      e.renovacion.hmac,
      cliente,
      RECURSO,
      SAL(),
      fabrica.token("acceso").hmac,
      fabrica.token("renovacion").hmac,
    ];
    const con = (i: number, v: unknown) => buenos.map((x, k) => (k === i ? v : x));
    const casos: [string, unknown[]][] = [
      ["token de acceso como renovación", con(0, e.acceso.hmac)],
      ["token desconocido", con(0, "a".repeat(64))],
      ["token mal formado", con(0, "x")],
      ["token nulo", con(0, null)],
      ["otro cliente", con(1, otro)],
      ["cliente desconocido", con(1, "dcr_" + "z".repeat(22))],
      ["otro recurso", con(2, "https://otro.ejemplo.test/api/mcp")],
      ["sal corta", con(3, "abc")],
      ["sal con caracteres ajenos", con(3, "+".repeat(22))],
      ["sal nula", con(3, null)],
      ["acceso nuevo mal formado", con(4, "x")],
      ["renovación nueva mal formada", con(5, null)],
      ["acceso y renovación nuevos iguales", con(5, buenos[4])],
      ["acceso nuevo ya existente", con(4, e.acceso.hmac)],
    ];
    for (const [nombre, args] of casos) {
      expect(await gestion(bd, "renovar", args), nombre).toEqual({ resultado: "no_valido" });
    }
    expect(await estado(bd)).toEqual(antes);
  });

  it("con la licencia suspendida los tokens siguen valiendo y se renueva; con la revocada, no", async () => {
    const bd = await abrir();
    const cliente = await registrarCliente(bd);
    const e = await conectar(bd, cliente);
    await bd.db.query(`update ${ESQUEMA}.licencias set estado = 'suspendida' where id = $1`, [
      e.licencia,
    ]);
    const r = await renovar(bd, e, cliente);
    expect(r.r.resultado).toBe("rotado");
    await bd.db.query(`update ${ESQUEMA}.licencias set estado = 'revocada' where id = $1`, [
      e.licencia,
    ]);
    expect((await renovar(bd, { renovacion: r.nuevaRenovacion }, cliente)).r).toEqual({
      resultado: "no_valido",
    });
  });

  it("una renovación caducada (14 días sin rotar) no se renueva", async () => {
    const bd = await abrir();
    await bd.reloj.fijar(new Date());
    const cliente = await registrarCliente(bd);
    const e = await conectar(bd, cliente);
    await bd.reloj.avanzar(14 * D);
    expect((await renovar(bd, e, cliente)).r).toEqual({ resultado: "no_valido" });
  });

  it("la respuesta no contiene tokens ni HMAC enviados", async () => {
    const bd = await abrir();
    const cliente = await registrarCliente(bd);
    const e = await conectar(bd, cliente);
    const { r, nuevoAcceso, nuevaRenovacion } = await renovar(bd, e, cliente);
    const texto = JSON.stringify(r);
    for (const t of [nuevoAcceso, nuevaRenovacion, e.renovacion]) {
      expect(texto).not.toContain(t.hmac);
      expect(texto).not.toContain(t.valor);
    }
  });
});

describe("T-107 (c): el cierre de la prueba se comprueba dentro de canjear_codigo y renovar (menor 6 del revisor)", () => {
  // Con la fila de `cierre` insertada a mano (sin pasar por `cerrar_prueba`), el código, el token, la conexión y
  // la licencia siguen vivos: lo único que puede rechazar es la comprobación del cierre dentro de la función.
  // Quitada la fila, la misma llamada vale: demuestra que el rechazo era solo por el cierre.
  const cerrar = (bd: BdApoyo) =>
    bd.db.query(`insert into ${ESQUEMA}.cierre (id, cerrado_en) values (true, now())`);
  const reabrir = (bd: BdApoyo) => bd.db.query(`delete from ${ESQUEMA}.cierre`);

  it("canjear_codigo con un código vivo y el cierre hecho: no_valido, sin escribir", async () => {
    const bd = await abrir();
    const cliente = await registrarCliente(bd);
    const a = await autorizar(bd, cliente);
    await cerrar(bd);
    const antes = await estado(bd);
    const acceso = fabrica.token("acceso");
    const renovacion = fabrica.token("renovacion");
    expect(await canjear(bd, a, cliente, acceso, renovacion)).toEqual({ resultado: "no_valido" });
    expect(await estado(bd)).toEqual(antes);
    expect(await cuenta(bd, "codigos_autorizacion", "usado_en is null")).toBe(1);
    expect(await cuenta(bd, "tokens")).toBe(0);
    await reabrir(bd);
    expect((await canjear(bd, a, cliente, acceso, renovacion)).resultado).toBe("emitido");
  });

  it("renovar con un token vivo y el cierre hecho: no_valido, sin escribir", async () => {
    const bd = await abrir();
    const cliente = await registrarCliente(bd);
    const e = await conectar(bd, cliente);
    await cerrar(bd);
    const antes = await estado(bd);
    const r = await renovar(bd, e, cliente);
    expect(r.r).toEqual({ resultado: "no_valido" });
    expect(await estado(bd)).toEqual(antes);
    await reabrir(bd);
    expect((await renovar(bd, e, cliente)).r.resultado).toBe("rotado");
  });
});

describe("T-107 (hallazgo 3 del auditor): orden de bloqueos, conexión primero y luego tokens (estructural)", () => {
  // Una sola conexión de base de datos no demuestra interbloqueos (008, L); aquí se fija el orden en el código,
  // el mismo de operar_revocar_conexion y cerrar_prueba.
  const cuerpo = async (bd: BdApoyo, firma: string) =>
    (
      await una<{ c: string }>(
        bd,
        `select prosrc as c from pg_proc where oid = '${ESQUEMA}.${firma}'::regprocedure`,
      )
    ).c
      .replace(/--[^\n]*/g, "")
      .replace(/\s+/g, " ");
  const BLOQUEO_CONEXION = /from conector_prueba\.conexiones c where c\.id = v_conexion for update/;
  const TOCA_TOKENS =
    /(?:insert into|update|delete from) conector_prueba\.tokens|from conector_prueba\.tokens t where[^;]*for update/g;

  for (const firma of [
    "canjear_codigo(text, text, text, text, text, text, text)",
    "renovar(text, text, text, text, text, text)",
  ]) {
    it(`${firma.split("(")[0]} bloquea la conexión con for update antes de cualquier bloqueo o escritura en tokens`, async () => {
      const bd = await abrir();
      const c = await cuerpo(bd, firma);
      const bloqueo = c.search(BLOQUEO_CONEXION);
      expect(bloqueo, "bloquea la conexión").toBeGreaterThan(-1);
      const toques = [...c.matchAll(TOCA_TOKENS)].map((m) => m.index!);
      expect(toques.length).toBeGreaterThan(0);
      for (const t of toques) expect(t).toBeGreaterThan(bloqueo);
    });
  }
});
