// T-103 (c) (001): `validar_acceso` y `registrar_suceso` en PGlite. PRUEBA-011 (parte BD, con reloj: 5 min
// 1 s, tipo, recurso, revocada -> falso) y PRUEBA-019 (parte: suceso cerrado). No sustituye a Postgres
// real de Supabase ni a pgTAP (CI). Valores sembrados compuestos en ejecución (arts. 1 y 4).
import { createHmac, randomBytes } from "node:crypto";
import { afterAll, describe, expect, it, vi } from "vitest";

// Arrancar PGlite en cada prueba cuesta CPU; en paralelo con otros ficheros supera los 5 s por defecto.
vi.setConfig({ testTimeout: 60_000, hookTimeout: 60_000 });
import {
  crearAlmacenPglite,
  crearBd,
  crearFabrica,
  ROLES_SUPABASE,
  type BdApoyo,
} from "../../../conector/apoyo/index";

const ESQUEMA = "conector_prueba";
const ROL_MCP = "conector_prueba_mcp";
const ROL_GESTION = "conector_prueba_gestion";
const RECURSO = "https://conector.ejemplo.test/api/mcp";
const MIN = 60_000;

const clave = randomBytes(32);
const fabrica = crearFabrica({
  hmac: (m) => createHmac("sha256", clave).update(m).digest("hex"),
});
const hmacDe = (m: string) => createHmac("sha256", clave).update(m).digest("hex");

const abiertas: BdApoyo[] = [];
async function abrir() {
  const bd = await crearBd();
  abiertas.push(bd);
  return bd;
}
afterAll(async () => {
  while (abiertas.length > 0) await abiertas.pop()?.cerrar();
});

const una = async <T>(bd: BdApoyo, sql: string, p: unknown[] = []) =>
  (await bd.db.query<T>(sql, p)).rows[0]!;

/** Un cliente OAuth ficticio y estable: todo token tiene cliente (`tokens.cliente_oauth_id` es not null). */
async function clienteSemilla(bd: BdApoyo): Promise<string> {
  await bd.db.query(
    `insert into ${ESQUEMA}.clientes_oauth (client_id, origen, redirect_uris, comprobado_en)
     values ('https://semilla.test/oauth', 'cimd', array['https://claude.ai/api/mcp/auth_callback'], now())
     on conflict (client_id) do nothing`,
  );
  return (
    await una<{ id: string }>(
      bd,
      `select id::text from ${ESQUEMA}.clientes_oauth where client_id = 'https://semilla.test/oauth'`,
    )
  ).id;
}

interface Sembrado {
  licenciaId: string;
  conexionId: string;
  acceso: ReturnType<typeof fabrica.token>;
}

/** Una conexión con un token de acceso vigente (5 minutos desde el reloj de la prueba). */
async function sembrar(
  bd: BdApoyo,
  tipo: "A" | "B",
  asistente: "claude" | "chatgpt" | "otro" = "claude",
): Promise<Sembrado> {
  const { id: licenciaId } = await una<{ id: string }>(
    bd,
    `select id::text from ${ESQUEMA}.licencias where tipo = $1`,
    [tipo],
  );
  const { id: conexionId } = await una<{ id: string }>(
    bd,
    `insert into ${ESQUEMA}.conexiones (licencia_id, asistente) values ($1, $2) returning id::text`,
    [licenciaId, asistente],
  );
  const acceso = fabrica.token("acceso");
  await bd.db.query(
    `insert into ${ESQUEMA}.tokens (conexion_id, tipo, token_hmac, recurso, caduca_en, cliente_oauth_id)
     values ($1, 'acceso', $2, $3, now() + interval '300 seconds', $4)`,
    [conexionId, acceso.hmac, RECURSO, await clienteSemilla(bd)],
  );
  return { licenciaId, conexionId, acceso };
}

async function almacenMcp(bd: BdApoyo) {
  return crearAlmacenPglite(bd, ROL_MCP);
}

const TABLAS = [
  "clientes_oauth",
  "codigos_activacion",
  "codigos_autorizacion",
  "conexiones",
  "ejecuciones",
  "informes",
  "licencias",
  "limites_origen",
  "ordenes",
  "solicitudes_autorizacion",
  "sucesos",
  "tokens",
];
/** Huella del contenido de todas las tablas: lo que no debe cambiar ante un rechazo. */
async function estado(bd: BdApoyo): Promise<Record<string, string>> {
  const salida: Record<string, string> = {};
  for (const t of TABLAS) {
    salida[t] = (
      await una<{ h: string }>(
        bd,
        `select coalesce(md5(string_agg(x::text, '|' order by x::text)), 'vacia') as h from ${ESQUEMA}.${t} x`,
      )
    ).h;
  }
  return salida;
}

describe("T-103 (c): validar_acceso (PRUEBA-011, parte BD, con reloj)", () => {
  it("un token de acceso vigente, de su tipo y para su recurso es válido", async () => {
    const bd = await abrir();
    const a = await sembrar(bd, "A");
    const almacen = await almacenMcp(bd);
    expect(await almacen.llamar("validar_acceso", [a.acceso.hmac, RECURSO])).toBe(true);
  });

  it("caduca a los 5 minutos: vale a los 299 s y falla a los 300 s y a los 5 min 1 s", async () => {
    const bd = await abrir();
    const a = await sembrar(bd, "A");
    const almacen = await almacenMcp(bd);
    await bd.reloj.avanzar(299_000);
    expect(await almacen.llamar("validar_acceso", [a.acceso.hmac, RECURSO]), "299 s").toBe(true);
    await bd.reloj.avanzar(1000);
    expect(await almacen.llamar("validar_acceso", [a.acceso.hmac, RECURSO]), "300 s").toBe(false);
    await bd.reloj.avanzar(1000);
    expect(await almacen.llamar("validar_acceso", [a.acceso.hmac, RECURSO]), "5 min 1 s").toBe(
      false,
    );
  });

  it("caducidad acotada por los dos lados: ni un token aún no emitido ni uno con vida mayor de 5 minutos", async () => {
    const bd = await abrir();
    const a = await sembrar(bd, "A");
    const almacen = await almacenMcp(bd);
    const futuro = fabrica.token("acceso");
    await bd.db.query(
      `insert into ${ESQUEMA}.tokens (conexion_id, tipo, token_hmac, recurso, creado_en, caduca_en, cliente_oauth_id)
       values ($1, 'acceso', $2, $3, now() + interval '1 hour', now() + interval '65 minutes', $4)`,
      [a.conexionId, futuro.hmac, RECURSO, await clienteSemilla(bd)],
    );
    const largo = fabrica.token("acceso");
    await bd.db.query(
      `insert into ${ESQUEMA}.tokens (conexion_id, tipo, token_hmac, recurso, caduca_en, cliente_oauth_id)
       values ($1, 'acceso', $2, $3, now() + interval '1 day', $4)`,
      [a.conexionId, largo.hmac, RECURSO, await clienteSemilla(bd)],
    );
    expect(await almacen.llamar("validar_acceso", [futuro.hmac, RECURSO]), "aún no emitido").toBe(
      false,
    );
    expect(await almacen.llamar("validar_acceso", [largo.hmac, RECURSO]), "vida de un día").toBe(
      false,
    );
    // Y el vigente de la misma conexión sigue valiendo: el rechazo es por esos dos motivos.
    expect(await almacen.llamar("validar_acceso", [a.acceso.hmac, RECURSO])).toBe(true);
  });

  it("rechaza el tipo equivocado, el recurso ajeno y cualquier entrada mal formada o desconocida", async () => {
    const bd = await abrir();
    const a = await sembrar(bd, "A");
    const renov = fabrica.token("renovacion");
    await bd.db.query(
      `insert into ${ESQUEMA}.tokens (conexion_id, tipo, token_hmac, recurso, caduca_en, cliente_oauth_id)
       values ($1, 'renovacion', $2, $3, now() + interval '14 days', $4)`,
      [a.conexionId, renov.hmac, RECURSO, await clienteSemilla(bd)],
    );
    const almacen = await almacenMcp(bd);
    const casos: [string, unknown[]][] = [
      ["renovación usada como acceso", [renov.hmac, RECURSO]],
      ["recurso de otro servidor", [a.acceso.hmac, "https://otro.ejemplo.test/api/mcp"]],
      ["recurso con barra final", [a.acceso.hmac, `${RECURSO}/`]],
      ["recurso nulo", [a.acceso.hmac, null]],
      ["hmac nulo", [null, RECURSO]],
      ["hmac desconocido", [hmacDe("desconocido"), RECURSO]],
      ["hmac en mayúsculas", [a.acceso.hmac.toUpperCase(), RECURSO]],
      ["hmac corto", [a.acceso.hmac.slice(0, 63), RECURSO]],
      ["el token en claro en lugar del HMAC", [a.acceso.valor, RECURSO]],
      ["vacío", ["", ""]],
      ["recurso larguísimo", [a.acceso.hmac, "https://" + "a".repeat(400)]],
    ];
    for (const [nombre, args] of casos) {
      expect(await almacen.llamar("validar_acceso", args), nombre).toBe(false);
    }
  });

  it("una conexión revocada, un token revocado o una licencia revocada dan falso; suspendida sigue valiendo", async () => {
    const bd = await abrir();
    const almacen = await almacenMcp(bd);
    const comprobar = async (s: Sembrado) =>
      almacen.llamar("validar_acceso", [s.acceso.hmac, RECURSO]);

    const revocada = await sembrar(bd, "A");
    expect(await comprobar(revocada)).toBe(true);
    await bd.db.query(
      `update ${ESQUEMA}.conexiones set revocada_en = now(), motivo_revocacion = 'operador' where id = $1`,
      [revocada.conexionId],
    );
    expect(await comprobar(revocada), "conexión revocada").toBe(false);

    const tokenRevocado = await sembrar(bd, "A");
    await bd.db.query(`update ${ESQUEMA}.tokens set revocado_en = now() where token_hmac = $1`, [
      tokenRevocado.acceso.hmac,
    ]);
    expect(await comprobar(tokenRevocado), "token revocado").toBe(false);

    const suspendida = await sembrar(bd, "A");
    await bd.db.query(`update ${ESQUEMA}.licencias set estado = 'suspendida' where tipo = 'A'`);
    expect(await comprobar(suspendida), "licencia suspendida: se sirve el estado suspendida").toBe(
      true,
    );
    await bd.db.query(`update ${ESQUEMA}.licencias set estado = 'revocada' where tipo = 'A'`);
    expect(await comprobar(suspendida), "licencia revocada").toBe(false);
  });

  it("acceso cruzado: el token de A solo valida a A, nunca cambia nada y B queda idéntico", async () => {
    const bd = await abrir();
    const a = await sembrar(bd, "A");
    const b = await sembrar(bd, "B", "chatgpt");
    const almacen = await almacenMcp(bd);
    const antes = await estado(bd);
    expect(await almacen.llamar("validar_acceso", [a.acceso.hmac, RECURSO])).toBe(true);
    expect(await almacen.llamar("validar_acceso", [b.acceso.hmac, RECURSO])).toBe(true);
    // Sin un parámetro de cliente o de licencia no hay forma de pedir lo ajeno: lo de B con un token
    // inventado se responde igual que lo inexistente.
    expect(await almacen.llamar("validar_acceso", [hmacDe(b.conexionId), RECURSO])).toBe(false);
    expect(await estado(bd)).toEqual(antes);
  });

  it("es security definer con search_path fijo, solo la ejecuta el rol mcp y no recibe cliente ni licencia", async () => {
    const bd = await abrir();
    const f = await una<{
      secdef: boolean;
      config: string[] | null;
      args: string[] | null;
      cuerpo: string;
    }>(
      bd,
      `select prosecdef as secdef, proconfig as config, proargnames as args, prosrc as cuerpo
         from pg_proc where oid = '${ESQUEMA}.validar_acceso(text,text)'::regprocedure`,
    );
    expect(f.secdef).toBe(true);
    expect(f.config).toEqual(["search_path=pg_catalog, pg_temp"]);
    expect(f.args).toEqual(["p_token_hmac", "p_recurso"]);
    // Hora solo con now() (D-035 y condiciones del dictamen de T-102).
    expect(f.cuerpo).not.toMatch(/pg_catalog\s*\.\s*(now|clock_timestamp|transaction_timestamp)/i);
    expect(f.cuerpo).not.toMatch(/clock_timestamp|statement_timestamp|age\s*\(/i);
    expect(f.cuerpo).toMatch(/\bnow\(\)/);

    // Aunque se les diera uso del esquema, ni PUBLIC ni los roles de Supabase ejecutan la función.
    await bd.db.exec(`grant usage on schema ${ESQUEMA} to anon, authenticated, service_role`);
    for (const rol of [ROL_GESTION, ...ROLES_SUPABASE]) {
      await expect(
        bd.como(rol, () =>
          bd.db.query(`select ${ESQUEMA}.validar_acceso($1, $2)`, [hmacDe("x"), RECURSO]),
        ),
        rol,
      ).rejects.toThrow(/permission denied for function validar_acceso/);
    }
    // PUBLIC tampoco la tiene en su acl.
    const publico = await una<{ n: number }>(
      bd,
      `select count(*)::int as n from pg_proc p, aclexplode(p.proacl) a
        where p.oid = '${ESQUEMA}.validar_acceso(text,text)'::regprocedure and a.grantee = 0`,
    );
    expect(publico.n).toBe(0);
  });
});

describe("T-103 (c): ninguna función del esquema recibe un identificador de cliente ni de licencia (art. 2)", () => {
  it("ni por nombre de parámetro ni por tipo uuid", async () => {
    const bd = await abrir();
    const filas = (
      await bd.db.query<{ nombre: string; args: string[] | null; tipos: string }>(
        `select p.proname as nombre, p.proargnames as args, pg_get_function_arguments(p.oid) as tipos
           from pg_proc p where p.pronamespace = '${ESQUEMA}'::regnamespace`,
      )
    ).rows;
    expect(filas.map((f) => f.nombre)).toEqual(
      expect.arrayContaining(["validar_acceso", "registrar_suceso"]),
    );
    // Única excepción, nominal y justificada (REQ-017): `operar_revocar_conexion(p_origen_hmac, p_conexion)`
    // recibe, como TEXTO, el identificador de conexión que antes dio `operar_listar_conexiones`. No es una
    // autoridad: no sale de ningún token, solo elige UNA conexión para que la persona operadora la revoque (tras
    // la credencial de operación y la puerta por origen), y revocar es siempre restrictivo. Cualquier otra
    // función o parámetro con ese nombre sigue prohibido.
    const EXCEPCION = { funcion: "operar_revocar_conexion", parametro: "p_conexion" };
    for (const f of filas) {
      const args = (f.args ?? []).filter(
        (a) => !(f.nombre === EXCEPCION.funcion && a === EXCEPCION.parametro),
      );
      expect(args.join(","), f.nombre).not.toMatch(/cliente|licencia|conexion/);
      expect(f.tipos, f.nombre).not.toMatch(/uuid/);
    }
    const revocar = filas.find((f) => f.nombre === EXCEPCION.funcion)!;
    expect(revocar.args, "la excepción es exactamente ese parámetro, de texto").toEqual([
      "p_origen_hmac",
      EXCEPCION.parametro,
    ]);
    expect(revocar.tipos).toBe("p_origen_hmac text, p_conexion text");
  });

  it("todas las funciones security definer fijan search_path = pg_catalog, pg_temp y califican sus tablas", async () => {
    const bd = await abrir();
    const filas = (
      await bd.db.query<{
        nombre: string;
        secdef: boolean;
        config: string[] | null;
        cuerpo: string;
      }>(
        `select proname as nombre, prosecdef as secdef, proconfig as config, prosrc as cuerpo
           from pg_proc where pronamespace = '${ESQUEMA}'::regnamespace`,
      )
    ).rows;
    for (const f of filas) {
      expect(f.secdef, f.nombre).toBe(true);
      expect(f.config, f.nombre).toEqual(["search_path=pg_catalog, pg_temp"]);
      // Toda tabla del cuerpo va calificada con su esquema.
      const sinCalificar = [
        ...f.cuerpo.matchAll(/\b(?:from|join|update|into)\s+([a-z_][a-z0-9_.]*)/gi),
      ]
        .map((m) => m[1]!)
        // `into v_x` es una variable de PL/pgSQL, no una tabla.
        .filter((n) => !n.startsWith(`${ESQUEMA}.`) && !/^v_[a-z_]+$/.test(n));
      expect(sinCalificar, f.nombre).toEqual([]);
    }
  });
});

describe("T-103 (c): registrar_suceso", () => {
  const llamar = async (
    bd: BdApoyo,
    rol: string,
    args: [
      string | null,
      string | null,
      string | null,
      string | null,
      string | null,
      number | null,
      string | null,
    ],
  ) => {
    const almacen = await crearAlmacenPglite(bd, rol);
    return (await almacen.llamar("registrar_suceso", args)) as { resultado: string };
  };
  const bueno = (hmac: string | null = null) =>
    [hmac, "mcp", "obtener_instrucciones", "correcto", "ok", 12, "2025-11-25"] as [
      string | null,
      string | null,
      string | null,
      string | null,
      string | null,
      number | null,
      string | null,
    ];
  const contar = async (bd: BdApoyo) =>
    (await una<{ n: number }>(bd, `select count(*)::int as n from ${ESQUEMA}.sucesos`)).n;

  it("registra un suceso con forma cerrada; el asistente sale de la conexión del token, no de una entrada", async () => {
    const bd = await abrir();
    const a = await sembrar(bd, "A", "claude");
    const b = await sembrar(bd, "B", "chatgpt");
    expect(await llamar(bd, ROL_MCP, bueno(a.acceso.hmac))).toEqual({ resultado: "registrado" });
    expect(await llamar(bd, ROL_GESTION, bueno(b.acceso.hmac))).toEqual({
      resultado: "registrado",
    });
    expect(await llamar(bd, ROL_MCP, bueno(null))).toEqual({ resultado: "registrado" });
    expect(await llamar(bd, ROL_MCP, bueno(hmacDe("desconocido")))).toEqual({
      resultado: "registrado",
    });
    const filas = (
      await bd.db.query<{
        ruta: string;
        herramienta: string;
        resultado: string;
        codigo: string;
        duracion_ms: number;
        protocolo: string;
        asistente: string | null;
      }>(
        `select ruta, herramienta, resultado::text, codigo, duracion_ms, protocolo, asistente::text from ${ESQUEMA}.sucesos order by id`,
      )
    ).rows;
    expect(filas).toHaveLength(4);
    expect(filas[0]).toEqual({
      ruta: "mcp",
      herramienta: "obtener_instrucciones",
      resultado: "correcto",
      codigo: "ok",
      duracion_ms: 12,
      protocolo: "2025-11-25",
      asistente: "claude",
    });
    expect(filas.map((f) => f.asistente)).toEqual(["claude", "chatgpt", null, null]);
  });

  it("lo que no cabe en la forma cerrada se rechaza sin guardar nada y sin repetir el valor", async () => {
    const bd = await abrir();
    const canario = "canario-" + randomBytes(16).toString("hex");
    const ok = bueno();
    const malos: [string, typeof ok][] = [
      ["ruta con texto", [null, `/ruta pedida ${canario}`, ok[2], ok[3], ok[4], ok[5], ok[6]]],
      ["ruta nula", [null, null, ok[2], ok[3], ok[4], ok[5], ok[6]]],
      ["herramienta en mayúsculas", [null, ok[1], "Obtener", ok[3], ok[4], ok[5], ok[6]]],
      ["herramienta con el valor", [null, ok[1], canario, ok[3], ok[4], ok[5], ok[6]]],
      // Hallazgo 6: la herramienta es de la lista cerrada del contrato, aunque tenga la forma de un nombre.
      [
        "herramienta con forma de nombre pero fuera de la lista",
        [null, ok[1], "canario_texto", ok[3], ok[4], ok[5], ok[6]],
      ],
      ["resultado fuera de la lista", [null, ok[1], ok[2], canario, ok[4], ok[5], ok[6]]],
      ["resultado nulo", [null, ok[1], ok[2], null, ok[4], ok[5], ok[6]]],
      ["código con frase libre", [null, ok[1], ok[2], ok[3], `Mensaje ${canario}`, ok[5], ok[6]]],
      ["código nulo", [null, ok[1], ok[2], ok[3], null, ok[5], ok[6]]],
      [
        "código reservado del registro saturado",
        [null, ok[1], ok[2], ok[3], "registro_saturado", ok[5], ok[6]],
      ],
      ["duración negativa", [null, ok[1], ok[2], ok[3], ok[4], -1, ok[6]]],
      ["duración enorme", [null, ok[1], ok[2], ok[3], ok[4], 600001, ok[6]]],
      ["duración nula", [null, ok[1], ok[2], ok[3], ok[4], null, ok[6]]],
      ["protocolo desconocido", [null, ok[1], ok[2], ok[3], ok[4], ok[5], "2024-01-01"]],
      ["protocolo con el valor", [null, ok[1], ok[2], ok[3], ok[4], ok[5], canario]],
    ];
    for (const [nombre, args] of malos) {
      const respuesta = await llamar(bd, ROL_MCP, args);
      expect(respuesta, nombre).toEqual({ resultado: "invalido" });
      expect(JSON.stringify(respuesta), nombre).not.toContain(canario);
    }
    expect(await contar(bd)).toBe(0);
    // Y el canario no está en ninguna tabla del esquema.
    for (const t of TABLAS) {
      const n = await una<{ n: number }>(
        bd,
        `select count(*)::int as n from ${ESQUEMA}.${t} x where x::text like '%' || $1 || '%'`,
        [canario],
      );
      expect(n.n, t).toBe(0);
    }
  });

  it("las tres herramientas del contrato y la ausencia de herramienta se registran", async () => {
    const bd = await abrir();
    for (const h of ["obtener_instrucciones", "enviar_informe", "confirmar_orden", null]) {
      const args = bueno();
      args[2] = h;
      expect(await llamar(bd, ROL_MCP, args), String(h)).toEqual({ resultado: "registrado" });
    }
    expect(await contar(bd)).toBe(4);
  });

  it("solo la ejecutan los dos roles del conector; anon, authenticated, service_role y PUBLIC no", async () => {
    const bd = await abrir();
    await bd.db.exec(`grant usage on schema ${ESQUEMA} to anon, authenticated, service_role`);
    for (const rol of ROLES_SUPABASE) {
      await expect(
        bd.como(rol, () =>
          bd.db.query(
            `select ${ESQUEMA}.registrar_suceso(null, 'mcp', null, 'correcto', 'ok', 1, 'otra')`,
          ),
        ),
        rol,
      ).rejects.toThrow(/permission denied for function registrar_suceso/);
    }
    const privilegios = await bd.privilegios(ROL_MCP, ESQUEMA);
    expect(privilegios).toEqual(
      expect.arrayContaining([
        "funcion:registrar_suceso:execute",
        "funcion:validar_acceso:execute",
      ]),
    );
    expect(await bd.privilegios(ROL_GESTION, ESQUEMA)).toContain(
      "funcion:registrar_suceso:execute",
    );
    expect(await bd.privilegios(ROL_GESTION, ESQUEMA)).not.toContain(
      "funcion:validar_acceso:execute",
    );
    expect(privilegios.filter((p) => p.startsWith("tabla:"))).toEqual([]);
  });

  it("20 000 sucesos al día: el siguiente deja un solo registro_saturado y después se descarta", async () => {
    const bd = await abrir();
    await bd.db.query(
      `insert into ${ESQUEMA}.sucesos (ruta) select 'carga' from generate_series(1, 19999)`,
    );
    expect(await llamar(bd, ROL_MCP, bueno())).toEqual({ resultado: "registrado" });
    expect(await contar(bd)).toBe(20_000);
    expect(await llamar(bd, ROL_MCP, bueno())).toEqual({ resultado: "saturado" });
    expect(await contar(bd)).toBe(20_001);
    for (let i = 0; i < 3; i++) {
      expect(await llamar(bd, ROL_GESTION, bueno()), `descarte ${i}`).toEqual({
        resultado: "descartado",
      });
    }
    expect(await contar(bd)).toBe(20_001);
    const marcas = await una<{ n: number; resultado: string }>(
      bd,
      `select count(*)::int as n, min(resultado::text) as resultado from ${ESQUEMA}.sucesos where codigo = 'registro_saturado'`,
    );
    expect(marcas).toEqual({ n: 1, resultado: "error" });

    // Pasadas 24 h la ventana se vacía y vuelve a registrar.
    await bd.reloj.avanzar(24 * 60 * MIN + 1000);
    expect(await llamar(bd, ROL_MCP, bueno())).toEqual({ resultado: "registrado" });
    expect(await contar(bd)).toBe(20_002);
  });

  it("es security definer con search_path fijo y hora solo con now()", async () => {
    const bd = await abrir();
    const f = await una<{
      secdef: boolean;
      config: string[] | null;
      cuerpo: string;
      args: string[];
    }>(
      bd,
      `select prosecdef as secdef, proconfig as config, prosrc as cuerpo, proargnames as args
         from pg_proc where pronamespace = '${ESQUEMA}'::regnamespace and proname = 'registrar_suceso'`,
    );
    expect(f.secdef).toBe(true);
    expect(f.config).toEqual(["search_path=pg_catalog, pg_temp"]);
    expect(f.args).toEqual([
      "p_token_hmac",
      "p_ruta",
      "p_herramienta",
      "p_resultado",
      "p_codigo",
      "p_duracion_ms",
      "p_protocolo",
    ]);
    expect(f.cuerpo).not.toMatch(/pg_catalog\s*\.\s*(now|clock_timestamp|transaction_timestamp)/i);
    expect(f.cuerpo).not.toMatch(/clock_timestamp|statement_timestamp|age\s*\(/i);
  });
});
