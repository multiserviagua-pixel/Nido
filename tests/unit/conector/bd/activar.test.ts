// T-107 (b) (001): `abrir_solicitud` y `activar` en PGlite. PRUEBA-006 (parte BD: códigos, bloqueo por
// origen, solicitud no válida sin contar), PRUEBA-007 (10 activaciones del mismo código -> 1 conexión; una
// sola conexión de base de datos, NO demuestra carreras: 008, L) y PRUEBA-018 (parte: un fallo deja solo el
// recuento). Condición dictaminada: un desafío PKCE que no mide 43 caracteres es `no_valida` ANTES de
// insertar. No sustituye a Postgres real de Supabase ni a pgTAP (CI).
import { randomBytes } from "node:crypto";
import { describe, expect, it } from "vitest";
import type { BdApoyo } from "../../../conector/apoyo/index";
import {
  abrir,
  cerrarAlFinal,
  CB_CHATGPT,
  CB_CLAUDE,
  comprobarForma,
  ESQUEMA,
  estado,
  gestion,
  hmacDe,
  idDcr,
  origen,
  RECURSO,
  ROL_GESTION,
  ROL_MCP,
  una,
} from "./comun";

cerrarAlFinal();

const MIN = 60_000;
const hex = (m: string) => hmacDe(m);
const desafio = () => randomBytes(32).toString("base64url");

/** Un cliente DCR registrado con ambos callbacks y la licencia A con un código de activación vigente. */
async function escenario(bd: BdApoyo) {
  const cliente = idDcr();
  await gestion(bd, "registrar_cliente_dcr", [
    origen("registro"),
    cliente,
    [CB_CLAUDE, CB_CHATGPT],
  ]);
  const { id: licencia } = await una<{ id: string }>(
    bd,
    `select id::text from ${ESQUEMA}.licencias where tipo = 'A'`,
  );
  return { cliente, licencia };
}
async function codigo(bd: BdApoyo, licencia: string, marca: string, vigencia = "10 minutes") {
  await bd.db.query(
    `insert into ${ESQUEMA}.codigos_activacion (licencia_id, codigo_hmac, caduca_en)
     values ($1, $2, now() + $3::interval)`,
    [licencia, hex(`codigo:${marca}`), vigencia],
  );
  return hex(`codigo:${marca}`);
}
interface Sol {
  id: string;
  cookie: string;
  state: string;
  desafio: string;
}
async function abrirSol(
  bd: BdApoyo,
  cliente: string,
  uri = CB_CLAUDE,
  n = randomBytes(6).toString("hex"),
): Promise<Sol> {
  const d = desafio();
  const r = await gestion(bd, "abrir_solicitud", [
    cliente,
    uri,
    d,
    RECURSO,
    hex(`state:${n}`),
    hex(`cookie:${n}`),
  ]);
  expect(r.resultado).toBe("abierta");
  return {
    id: r.solicitud as string,
    cookie: hex(`cookie:${n}`),
    state: hex(`state:${n}`),
    desafio: d,
  };
}
const activar = (
  bd: BdApoyo,
  s: Pick<Sol, "id" | "cookie" | "state">,
  cod: unknown,
  o = origen("navegador"),
  aut: unknown = hex(`aut:${randomBytes(6).toString("hex")}`),
) => gestion(bd, "activar", [s.id, s.cookie, s.state, o, cod, aut]);

const cuenta = async (bd: BdApoyo, tabla: string) =>
  (await una<{ n: number }>(bd, `select count(*)::int as n from ${ESQUEMA}.${tabla}`)).n;
const fallos = async (bd: BdApoyo, o = origen("navegador")) =>
  (
    await bd.db.query<{ fallos: number; bloqueado: boolean }>(
      `select fallos::int, (bloqueado_hasta is not null) as bloqueado
         from ${ESQUEMA}.limites_origen where ambito = 'activacion' and origen_hmac = $1`,
      [o],
    )
  ).rows[0] ?? { fallos: 0, bloqueado: false };

describe("T-107 (b): forma y permisos", () => {
  it("security definer, search_path, sin identificadores de licencia, solo el rol de gestión", async () => {
    const bd = await abrir();
    const { cliente } = await escenario(bd);
    const prohibidos = ["anon", "authenticated", "service_role", ROL_MCP];
    await comprobarForma(
      bd,
      "abrir_solicitud",
      "text, text, text, text, text, text",
      ["p_client_id", "p_redirect_uri", "p_desafio", "p_recurso", "p_state_hmac", "p_cookie_hmac"],
      "$1, $2, $3, $4, $5, $6",
      [cliente, CB_CLAUDE, desafio(), RECURSO, hex("s"), hex("c")],
      { permitido: ROL_GESTION, prohibidos },
    );
    await comprobarForma(
      bd,
      "activar",
      "text, text, text, text, text, text",
      [
        "p_solicitud",
        "p_cookie_hmac",
        "p_state_hmac",
        "p_origen_hmac",
        "p_codigo_hmac",
        "p_autorizacion_hmac",
      ],
      "$1, $2, $3, $4, $5, $6",
      ["00000000-0000-4000-8000-000000000000", hex("c"), hex("s"), origen("f"), hex("k"), hex("a")],
      { permitido: ROL_GESTION, prohibidos },
    );
  });
});

describe("T-107 (b): abrir_solicitud", () => {
  it("abre una solicitud de 10 minutos con lo recibido y solo los HMAC de state y cookie", async () => {
    const bd = await abrir();
    await bd.reloj.fijar(new Date());
    const { cliente } = await escenario(bd);
    const s = await abrirSol(bd, cliente);
    const f = await una<Record<string, string>>(
      bd,
      `select redirect_uri, desafio_pkce, recurso, state_hmac, cookie_hmac,
              (caduca_en - creada_en)::text as vida
         from ${ESQUEMA}.solicitudes_autorizacion where id = $1`,
      [s.id],
    );
    expect(f).toEqual({
      redirect_uri: CB_CLAUDE,
      desafio_pkce: s.desafio,
      recurso: RECURSO,
      state_hmac: s.state,
      cookie_hmac: s.cookie,
      vida: "00:10:00",
    });
  });

  it("un desafío PKCE que no mide exactamente 43 caracteres es `no_valida` antes de insertar (sin excepción)", async () => {
    const bd = await abrir();
    const { cliente } = await escenario(bd);
    const antes = await estado(bd);
    for (const malo of [
      "A".repeat(42),
      "A".repeat(44),
      "A".repeat(128),
      "",
      "A".repeat(42) + "+",
      "A".repeat(42) + "=",
      "A".repeat(42) + "\n",
      null,
    ]) {
      const r = await gestion(bd, "abrir_solicitud", [
        cliente,
        CB_CLAUDE,
        malo,
        RECURSO,
        hex("s"),
        hex("c"),
      ]);
      expect(r, JSON.stringify(malo)).toEqual({ resultado: "no_valida" });
    }
    expect(await estado(bd)).toEqual(antes);
  });

  it("el desafío que no mide 43 caracteres se rechaza ANTES de insertar: un disparador prohíbe todo insert y no salta (menor 9)", async () => {
    const bd = await abrir();
    const { cliente } = await escenario(bd);
    // Antes del primer insert de la tabla, el disparador lo impediría con una excepción (no check_violation):
    // si la función llegara a insertar, la prueba fallaría con un error, no con `no_valida`.
    await bd.db.exec(`
      create function ${ESQUEMA}.insert_prohibido() returns trigger language plpgsql as $$
      begin raise exception 'insert intentado'; end $$;
      create trigger insert_prohibido before insert on ${ESQUEMA}.solicitudes_autorizacion
        for each row execute function ${ESQUEMA}.insert_prohibido();`);
    const abrirCon = (d: unknown) =>
      gestion(bd, "abrir_solicitud", [cliente, CB_CLAUDE, d, RECURSO, hex("s"), hex("c")]);
    // Control: con un desafío válido la función SÍ llega al insert (y el disparador lo corta).
    await expect(abrirCon("A".repeat(43))).rejects.toThrow();
    for (const malo of ["A".repeat(42), "A".repeat(44), "", "A".repeat(42) + "+", null]) {
      expect(await abrirCon(malo), JSON.stringify(malo)).toEqual({ resultado: "no_valida" });
    }
    expect(await cuenta(bd, "solicitudes_autorizacion")).toBe(0);
  });

  it("cliente desconocido o caducado, callback ajeno al cliente o a la lista, recurso o HMAC mal formados: no_valida", async () => {
    const bd = await abrir();
    const { cliente } = await escenario(bd);
    await gestion(bd, "guardar_cliente_cimd", ["https://claude.ai/oauth/metadata", [CB_CLAUDE]]);
    const antes = await estado(bd);
    const base = [cliente, CB_CLAUDE, desafio(), RECURSO, hex("s"), hex("c")];
    const con = (i: number, v: unknown) => base.map((x, k) => (k === i ? v : x));
    const casos: [string, unknown[]][] = [
      ["cliente desconocido", con(0, idDcr())],
      ["cliente nulo", con(0, null)],
      ["callback con barra final", con(1, CB_CLAUDE + "/")],
      ["callback http", con(1, CB_CLAUDE.replace("https", "http"))],
      ["callback nulo", con(1, null)],
      ["recurso con otra ruta", con(3, "https://conector.ejemplo.test/api/otro")],
      ["recurso nulo", con(3, null)],
      ["state no hexadecimal", con(4, "x".repeat(64))],
      ["cookie corta", con(5, "ab")],
    ];
    for (const [nombre, args] of casos) {
      expect(await gestion(bd, "abrir_solicitud", args), nombre).toEqual({
        resultado: "no_valida",
      });
    }
    // Un callback de la lista pero que no es de ese cliente (registrado solo con Claude).
    const soloClaude = idDcr();
    await gestion(bd, "registrar_cliente_dcr", [origen("x"), soloClaude, [CB_CLAUDE]]);
    expect(
      await gestion(bd, "abrir_solicitud", [
        soloClaude,
        CB_CHATGPT,
        desafio(),
        RECURSO,
        hex("s"),
        hex("c"),
      ]),
    ).toEqual({ resultado: "no_valida" });
    expect((await estado(bd)).solicitudes_autorizacion).toEqual(antes.solicitudes_autorizacion);
  });

  it("un cliente CIMD con la comprobación caducada (1 h) no abre solicitudes", async () => {
    const bd = await abrir();
    await bd.reloj.fijar(new Date());
    const id = "https://claude.ai/oauth/metadata";
    await gestion(bd, "guardar_cliente_cimd", [id, [CB_CLAUDE]]);
    const args = [id, CB_CLAUDE, desafio(), RECURSO, hex("s"), hex("c")];
    expect((await gestion(bd, "abrir_solicitud", args)).resultado).toBe("abierta");
    await bd.reloj.avanzar(60 * MIN);
    expect(await gestion(bd, "abrir_solicitud", args)).toEqual({ resultado: "no_valida" });
  });
});

describe("T-107 (b): activar (PRUEBA-006, parte BD)", () => {
  it("un código válido crea una conexión de su licencia, consume el código y la solicitud y deja un código de autorización", async () => {
    const bd = await abrir();
    await bd.reloj.fijar(new Date());
    const { cliente, licencia } = await escenario(bd);
    const cod = await codigo(bd, licencia, "uno");
    const s = await abrirSol(bd, cliente, CB_CHATGPT);
    const aut = hex("autorizacion-1");
    const r = await activar(bd, s, cod, origen("n"), aut);
    expect(r).toEqual({ resultado: "activada", redirect_uri: CB_CHATGPT });
    const conexiones = (
      await bd.db.query<{ licencia_id: string; asistente: string }>(
        `select licencia_id::text, asistente::text from ${ESQUEMA}.conexiones`,
      )
    ).rows;
    expect(conexiones).toEqual([{ licencia_id: licencia, asistente: "chatgpt" }]);
    const a = await una<Record<string, string | boolean>>(
      bd,
      `select ca.codigo_hmac, ca.redirect_uri, ca.desafio_pkce, ca.recurso,
              (ca.caduca_en - ca.creado_en)::text as vida, (ca.usado_en is null) as sin_usar,
              (ca.cliente_oauth_id = (select id from ${ESQUEMA}.clientes_oauth where client_id = $1)) as del_cliente
         from ${ESQUEMA}.codigos_autorizacion ca`,
      [cliente],
    );
    expect(a).toEqual({
      codigo_hmac: aut,
      redirect_uri: CB_CHATGPT,
      desafio_pkce: s.desafio,
      recurso: RECURSO,
      vida: "00:05:00",
      sin_usar: true,
      del_cliente: true,
    });
    expect(await cuenta(bd, "solicitudes_autorizacion")).toBe(0);
    expect(
      (
        await una<{ usado: boolean }>(
          bd,
          `select (usado_en is not null) as usado from ${ESQUEMA}.codigos_activacion`,
        )
      ).usado,
    ).toBe(true);
    expect(
      (
        await una<{ uso: boolean }>(
          bd,
          `select (ultimo_uso_en is not null) as uso from ${ESQUEMA}.clientes_oauth where client_id = $1`,
          [cliente],
        )
      ).uso,
      "el cliente deja de ser «sin uso»",
    ).toBe(true);
    // Solo un código de uso: con otra solicitud, el mismo código ya no sirve.
    const s2 = await abrirSol(bd, cliente);
    expect((await activar(bd, s2, cod)).resultado).toBe("codigo_no_valido");
    expect(await cuenta(bd, "conexiones")).toBe(1);
  });

  it("código incorrecto, caducado, usado o de otra forma: el mismo resultado, 0 conexiones, y cada intento se cuenta", async () => {
    const bd = await abrir();
    await bd.reloj.fijar(new Date());
    const { cliente, licencia } = await escenario(bd);
    const caducado = await codigo(bd, licencia, "caducado", "1 minute");
    const usado = await codigo(bd, licencia, "usado");
    await bd.db.query(
      `update ${ESQUEMA}.codigos_activacion set usado_en = now() where codigo_hmac = $1`,
      [usado],
    );
    await bd.reloj.avanzar(MIN + 1000);
    const sols = [
      await abrirSol(bd, cliente),
      await abrirSol(bd, cliente),
      await abrirSol(bd, cliente),
    ];
    const respuestas = [
      await activar(bd, sols[0]!, hex("codigo:inventado")),
      await activar(bd, sols[1]!, caducado),
      await activar(bd, sols[2]!, usado),
    ];
    for (const r of respuestas) expect(r).toEqual({ resultado: "codigo_no_valido" });
    expect(await cuenta(bd, "conexiones")).toBe(0);
    expect(await cuenta(bd, "codigos_autorizacion")).toBe(0);
    expect((await fallos(bd)).fallos).toBe(3);
    // Un código mal formado ni se evalúa ni cuenta (hallazgo 7 del auditor): solicitud no válida.
    const s4 = await abrirSol(bd, cliente);
    expect((await activar(bd, s4, "no-es-hmac")).resultado).toBe("solicitud_no_valida");
    expect((await fallos(bd)).fallos).toBe(3);
  });

  it("el código de una licencia suspendida o revocada no activa nada", async () => {
    const bd = await abrir();
    const { cliente, licencia } = await escenario(bd);
    const cod = await codigo(bd, licencia, "x");
    for (const estadoLic of ["suspendida", "revocada"]) {
      await bd.db.query(`update ${ESQUEMA}.licencias set estado = $1 where id = $2`, [
        estadoLic,
        licencia,
      ]);
      const s = await abrirSol(bd, cliente);
      expect((await activar(bd, s, cod, origen(estadoLic))).resultado, estadoLic).toBe(
        "codigo_no_valido",
      );
    }
    expect(await cuenta(bd, "conexiones")).toBe(0);
  });

  it("5 fallos en 15 min bloquean el origen 15 min, también para un código válido, sin evaluar ni consumir", async () => {
    const bd = await abrir();
    await bd.reloj.fijar(new Date());
    const { cliente, licencia } = await escenario(bd);
    const cod = await codigo(bd, licencia, "valido", "60 minutes");
    for (let i = 0; i < 5; i++) {
      const s = await abrirSol(bd, cliente);
      expect((await activar(bd, s, hex(`codigo:mal${i}`))).resultado, `fallo ${i + 1}`).toBe(
        "codigo_no_valido",
      );
    }
    expect(await fallos(bd)).toEqual({ fallos: 5, bloqueado: true });
    const s = await abrirSol(bd, cliente);
    const antes = await estado(bd);
    expect(await activar(bd, s, cod)).toEqual({ resultado: "origen_bloqueado" });
    expect(await estado(bd), "bloqueado: nada cambia, ni la solicitud ni el código").toEqual(antes);
    // Otro origen no está bloqueado.
    expect((await activar(bd, s, cod, origen("otro"))).resultado).toBe("activada");
  });

  it("el bloqueo dura 15 min exactos y después el origen vuelve a poder activar", async () => {
    const bd = await abrir();
    await bd.reloj.fijar(new Date());
    const { cliente, licencia } = await escenario(bd);
    const cod = await codigo(bd, licencia, "valido", "60 minutes");
    for (let i = 0; i < 5; i++) {
      await activar(bd, await abrirSol(bd, cliente), hex(`codigo:mal${i}`));
    }
    await bd.reloj.avanzar(15 * MIN - 1000);
    const s = await abrirSol(bd, cliente);
    expect((await activar(bd, s, cod)).resultado, "14 min 59 s").toBe("origen_bloqueado");
    await bd.reloj.avanzar(1000);
    expect((await activar(bd, s, cod)).resultado, "15 min").toBe("activada");
  });

  it("fallos repartidos en más de 15 min no bloquean (la ventana se reinicia)", async () => {
    const bd = await abrir();
    await bd.reloj.fijar(new Date());
    const { cliente } = await escenario(bd);
    for (let i = 0; i < 4; i++)
      await activar(bd, await abrirSol(bd, cliente), hex(`codigo:mal${i}`));
    await bd.reloj.avanzar(15 * MIN);
    await activar(bd, await abrirSol(bd, cliente), hex("codigo:mal-5"));
    expect(await fallos(bd)).toEqual({ fallos: 1, bloqueado: false });
  });

  it("solicitud no válida (state, cookie, otra, caducada, ya usada, mal formada): sin efecto y SIN contar intento", async () => {
    const bd = await abrir();
    await bd.reloj.fijar(new Date());
    const { cliente, licencia } = await escenario(bd);
    const cod = await codigo(bd, licencia, "valido", "60 minutes");
    const s = await abrirSol(bd, cliente);
    // activar crea la fila del origen con 0 fallos (hallazgo 2 del auditor): no es un intento contado.
    const sinLimites = async () => ({ ...(await estado(bd)), limites_origen: "-" });
    const antes = await sinLimites();
    const casos: [string, unknown[]][] = [
      ["state ajeno", [s.id, s.cookie, hex("state:otro"), origen("n"), cod, hex("a1")]],
      ["cookie ajena", [s.id, hex("cookie:otra"), s.state, origen("n"), cod, hex("a1")]],
      [
        "solicitud inexistente",
        ["00000000-0000-4000-8000-000000000001", s.cookie, s.state, origen("n"), cod, hex("a1")],
      ],
      ["solicitud mal formada", ["no-es-uuid", s.cookie, s.state, origen("n"), cod, hex("a1")]],
      ["solicitud nula", [null, s.cookie, s.state, origen("n"), cod, hex("a1")]],
      ["state nulo", [s.id, s.cookie, null, origen("n"), cod, hex("a1")]],
      ["código de autorización mal formado", [s.id, s.cookie, s.state, origen("n"), cod, "x"]],
    ];
    for (const [nombre, args] of casos) {
      expect(await gestion(bd, "activar", args), nombre).toEqual({
        resultado: "solicitud_no_valida",
      });
    }
    expect(await sinLimites(), "ni código consumido ni nada más").toEqual(antes);
    expect(await fallos(bd), "ni intento contado").toEqual({ fallos: 0, bloqueado: false });
    // Caducada (10 min): tampoco cuenta.
    await bd.reloj.avanzar(10 * MIN);
    expect((await activar(bd, s, cod)).resultado, "10 min").toBe("solicitud_no_valida");
    expect(await fallos(bd)).toEqual({ fallos: 0, bloqueado: false });
    // Ya usada.
    const s2 = await abrirSol(bd, cliente);
    expect((await activar(bd, s2, cod)).resultado).toBe("activada");
    expect((await activar(bd, s2, cod)).resultado).toBe("solicitud_no_valida");
  });

  it("un origen mal formado se rechaza sin evaluar ni contar", async () => {
    const bd = await abrir();
    const { cliente, licencia } = await escenario(bd);
    const cod = await codigo(bd, licencia, "valido");
    const s = await abrirSol(bd, cliente);
    const antes = await estado(bd);
    for (const o of [null, "", "no-es-hmac"]) {
      expect(await activar(bd, s, cod, o as string), String(o)).toEqual({
        resultado: "origen_bloqueado",
      });
    }
    expect(await estado(bd)).toEqual(antes);
  });
});

describe("T-107 (b): PRUEBA-007 y PRUEBA-018 (parte)", () => {
  it("10 activaciones del mismo código (10 solicitudes) crean una sola conexión", async () => {
    const bd = await abrir();
    const { cliente, licencia } = await escenario(bd);
    const cod = await codigo(bd, licencia, "carrera");
    const sols = [];
    for (let i = 0; i < 10; i++) sols.push(await abrirSol(bd, cliente));
    const r = await Promise.all(sols.map((s, i) => activar(bd, s, cod, origen(`o${i}`))));
    expect(r.filter((x) => x.resultado === "activada")).toHaveLength(1);
    expect(r.filter((x) => x.resultado === "codigo_no_valido")).toHaveLength(9);
    expect(await cuenta(bd, "conexiones")).toBe(1);
    expect(await cuenta(bd, "codigos_autorizacion")).toBe(1);
  });

  it("código no válido: solo cambia el recuento de intentos (nada más)", async () => {
    const bd = await abrir();
    const { cliente } = await escenario(bd);
    const s = await abrirSol(bd, cliente);
    const antes = await estado(bd);
    expect((await activar(bd, s, hex("codigo:no"))).resultado).toBe("codigo_no_valido");
    const despues = await estado(bd);
    const cambiadas = Object.keys(antes).filter((t) => antes[t] !== despues[t]);
    expect(cambiadas).toEqual(["limites_origen"]);
  });

  it("un código de autorización repetido deja la activación entera sin hacer: código sin consumir, 0 conexiones", async () => {
    const bd = await abrir();
    const { cliente, licencia } = await escenario(bd);
    const cod = await codigo(bd, licencia, "uno");
    const aut = hex("autorizacion-repetida");
    const s1 = await abrirSol(bd, cliente);
    const otro = await codigo(bd, licencia, "dos");
    expect((await activar(bd, s1, otro, origen("n"), aut)).resultado).toBe("activada");
    const s2 = await abrirSol(bd, cliente);
    const antes = await estado(bd);
    expect((await activar(bd, s2, cod, origen("n"), aut)).resultado).toBe("solicitud_no_valida");
    expect(await estado(bd)).toEqual(antes);
    expect(await cuenta(bd, "conexiones")).toBe(1);
  });

  it("si falla un paso interno, la transacción entera se deshace: ni código consumido ni conexión", async () => {
    const bd = await abrir();
    const { cliente, licencia } = await escenario(bd);
    const cod = await codigo(bd, licencia, "uno");
    const s = await abrirSol(bd, cliente);
    // Un fallo forzado en el último paso (insertar el código de autorización).
    await bd.db.exec(`
      create function ${ESQUEMA}.fallo_de_prueba() returns trigger language plpgsql as $$
      begin raise exception 'fallo forzado'; end $$;
      create trigger fallo_de_prueba before insert on ${ESQUEMA}.codigos_autorizacion
        for each row execute function ${ESQUEMA}.fallo_de_prueba();`);
    const antes = await estado(bd);
    await expect(activar(bd, s, cod)).rejects.toThrow();
    expect(await estado(bd)).toEqual(antes);
    expect(await cuenta(bd, "conexiones")).toBe(0);
    // Sin el fallo, el mismo código y la misma solicitud siguen valiendo.
    await bd.db.exec(`drop trigger fallo_de_prueba on ${ESQUEMA}.codigos_autorizacion`);
    expect((await activar(bd, s, cod)).resultado).toBe("activada");
  });
});

describe("T-107 (b): el recuento de fallos no depende de carreras (menor 5 del revisor)", () => {
  // Una sola conexión no demuestra carreras (PRUEBA-008, en Nido). Aquí se simula el resultado de una: un
  // disparador inserta la fila del origen justo antes de que lo haga la función, como si otra petición
  // concurrente hubiera ganado. Con un `insert` simple eso es una `unique_violation` cuyo DETAIL lleva el
  // HMAC del origen; con `on conflict` no hay excepción y el fallo se cuenta sobre la fila ganadora.
  const carrera = async (bd: BdApoyo) => {
    await bd.db.exec(`
      create function ${ESQUEMA}.carrera_de_prueba() returns trigger language plpgsql as $$
      begin
        insert into ${ESQUEMA}.limites_origen (ambito, origen_hmac, ventana_desde, fallos)
        values (new.ambito, new.origen_hmac, new.ventana_desde, 1)
        on conflict (ambito, origen_hmac) do nothing;
        return new;
      end $$;
      create trigger carrera_de_prueba before insert on ${ESQUEMA}.limites_origen
        for each row when (pg_trigger_depth() = 0)
        execute function ${ESQUEMA}.carrera_de_prueba();`);
  };

  it("operar_contar_fallo: si otra petición crea la fila antes, no hay excepción y se cuenta sobre ella", async () => {
    const bd = await abrir();
    await carrera(bd);
    const o = origen("carrera-operar");
    expect(await gestion(bd, "operar_contar_fallo", [o])).toEqual({ resultado: "contado" });
    expect(
      await una<{ fallos: number; n: number }>(
        bd,
        `select fallos::int, (select count(*)::int from ${ESQUEMA}.limites_origen) as n
             from ${ESQUEMA}.limites_origen where ambito = 'operacion' and origen_hmac = $1`,
        [o],
      ),
    ).toEqual({ fallos: 2, n: 1 });
  });

  it("activar con un código no válido: igual, sin excepción y con el recuento sobre la fila ganadora", async () => {
    const bd = await abrir();
    const { cliente } = await escenario(bd);
    const s = await abrirSol(bd, cliente);
    await carrera(bd);
    expect((await activar(bd, s, hex("codigo:no"))).resultado).toBe("codigo_no_valido");
    expect(await fallos(bd)).toEqual({ fallos: 2, bloqueado: false });
  });

  it("activar toma el bloqueo de la fila del origen ANTES de evaluar si está bloqueado (estructural; la carrera real es de 008)", async () => {
    const bd = await abrir();
    const { cuerpo } = await una<{ cuerpo: string }>(
      bd,
      `select prosrc as cuerpo from pg_proc where oid = '${ESQUEMA}.activar(text, text, text, text, text, text)'::regprocedure`,
    );
    const limpio = cuerpo.replace(/--[^\n]*/g, "").replace(/\s+/g, " ");
    const bloqueo = limpio.search(
      /from conector_prueba\.limites_origen l where l\.ambito = 'activacion' and l\.origen_hmac = p_origen_hmac for update/,
    );
    const evaluacion = limpio.search(/v_bloqueo > (?:reloj_pruebas\.)?now\(\)/);
    const solicitud = limpio.search(/from conector_prueba\.solicitudes_autorizacion s where s\.id/);
    expect(bloqueo, "bloquea la fila del origen").toBeGreaterThan(-1);
    expect(evaluacion, "evalúa el bloqueo").toBeGreaterThan(bloqueo);
    expect(solicitud, "antes de mirar la solicitud").toBeGreaterThan(evaluacion);
  });
});

describe("T-107 (hallazgos 2 y 7 del auditor): fila del origen creada antes del bloqueo y código con forma", () => {
  const cuerpoActivar = async (bd: BdApoyo) => {
    const { cuerpo } = await una<{ cuerpo: string }>(
      bd,
      `select prosrc as cuerpo from pg_proc where oid = '${ESQUEMA}.activar(text, text, text, text, text, text)'::regprocedure`,
    );
    return cuerpo.replace(/--[^\n]*/g, "").replace(/\s+/g, " ");
  };

  it("activar crea la fila del origen (fallos 0, `do nothing`) antes del `select … for update` (estructural)", async () => {
    const bd = await abrir();
    const limpio = await cuerpoActivar(bd);
    const alta = limpio.search(
      /insert into conector_prueba\.limites_origen \(ambito, origen_hmac, ventana_desde, fallos\) values \('activacion', p_origen_hmac, (?:reloj_pruebas\.)?now\(\), 0\) on conflict \(ambito, origen_hmac\) do nothing/,
    );
    const bloqueo = limpio.search(
      /from conector_prueba\.limites_origen l where l\.ambito = 'activacion' and l\.origen_hmac = p_origen_hmac for update/,
    );
    expect(alta, "crea la fila").toBeGreaterThan(-1);
    expect(bloqueo, "la bloquea").toBeGreaterThan(alta);
  });

  it("con un origen nuevo la fila existe tras activar, con 0 fallos (también con la solicitud no válida)", async () => {
    const bd = await abrir();
    const o = origen("nuevo-hallazgo-2");
    const r = await gestion(bd, "activar", [
      "00000000-0000-4000-8000-000000000000",
      hex("c"),
      hex("s"),
      o,
      hex("k"),
      hex("a"),
    ]);
    expect(r.resultado).toBe("solicitud_no_valida");
    expect(
      await una<{ n: number; f: number }>(
        bd,
        `select count(*)::int as n, coalesce(max(fallos), 0)::int as f from ${ESQUEMA}.limites_origen
          where ambito = 'activacion' and origen_hmac = $1`,
        [o],
      ),
    ).toEqual({ n: 1, f: 0 });
  });

  it("un código que no es hexadecimal de 64 caracteres es solicitud_no_valida y no cuenta como intento", async () => {
    const bd = await abrir();
    const { cliente } = await escenario(bd);
    const s = await abrirSol(bd, cliente);
    for (const malo of [
      null,
      "",
      "abc",
      "G".repeat(64),
      "A".repeat(64),
      "a".repeat(63),
      "a".repeat(65),
    ]) {
      expect((await activar(bd, s, malo)).resultado, String(malo)).toBe("solicitud_no_valida");
    }
    expect(await fallos(bd)).toEqual({ fallos: 0, bloqueado: false });
    // La solicitud sigue viva: un código bueno (aunque desconocido) sí cuenta.
    expect((await activar(bd, s, hex("codigo:no"))).resultado).toBe("codigo_no_valido");
    expect(await fallos(bd)).toEqual({ fallos: 1, bloqueado: false });
  });
});

describe("T-107 (hallazgo 4 del auditor): tope global de solicitudes vigentes", () => {
  const llenar = async (bd: BdApoyo, cliente: string, n: number) => {
    await bd.db.query(
      `insert into ${ESQUEMA}.solicitudes_autorizacion
         (cliente_oauth_id, redirect_uri, desafio_pkce, recurso, state_hmac, cookie_hmac, caduca_en)
       select c.id, $2, repeat('a', 43), $3, repeat('b', 64), repeat('c', 64), now() + interval '10 minutes'
         from ${ESQUEMA}.clientes_oauth c, generate_series(1, $4::int)
        where c.client_id = $1`,
      [cliente, CB_CLAUDE, RECURSO, n],
    );
  };
  const abrirUna = (bd: BdApoyo, cliente: string) =>
    gestion(bd, "abrir_solicitud", [
      cliente,
      CB_CLAUDE,
      desafio(),
      RECURSO,
      hex("state:tope"),
      hex("cookie:tope"),
    ]);
  const vigentes = async (bd: BdApoyo) =>
    (
      await una<{ n: number }>(
        bd,
        `select count(*)::int as n from ${ESQUEMA}.solicitudes_autorizacion`,
      )
    ).n;

  it("con 1000 vigentes la siguiente es no_valida y no inserta; con 999 se abre (y la 1000 es la última)", async () => {
    const bd = await abrir();
    await bd.reloj.fijar(new Date());
    const { cliente } = await escenario(bd);
    await llenar(bd, cliente, 999);
    expect((await abrirUna(bd, cliente)).resultado).toBe("abierta");
    expect(await vigentes(bd)).toBe(1000);
    expect(await abrirUna(bd, cliente)).toEqual({ resultado: "no_valida" });
    expect(await vigentes(bd)).toBe(1000);
  });

  it("las caducadas no cuentan: pasados 10 minutos el tope se libera", async () => {
    const bd = await abrir();
    await bd.reloj.fijar(new Date());
    const { cliente } = await escenario(bd);
    await llenar(bd, cliente, 1000);
    expect((await abrirUna(bd, cliente)).resultado).toBe("no_valida");
    await bd.reloj.avanzar(10 * MIN + 1000);
    expect((await abrirUna(bd, cliente)).resultado).toBe("abierta");
  });
});
