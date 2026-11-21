// T-107 (d) (001): `operar_*`, `operar_contar_fallo` y `cerrar_prueba` terminal en PGlite. PRUEBA-020
// (parte BD: cada operación y sus rechazos), PRUEBA-013 (revocar una conexión) y PRUEBA-023 (B: tras
// `cerrar_prueba` se rechaza generar, activar, canjear, renovar, validar y toda operación salvo `resumen`,
// `listar_conexiones` y `exportar_sucesos`). Condición dictaminada (cierre): el bloque de autenticación del
// token, repetido en las cuatro funciones que lo usan, es idéntico en las cuatro y comprueba el cierre.
// No sustituye a Postgres real de Supabase ni a pgTAP (CI). Valores sembrados compuestos en ejecución.
import { describe, expect, it } from "vitest";
import { crearAlmacenPglite, type BdApoyo } from "../../../conector/apoyo/index";
import {
  abrir,
  autorizar,
  cerrarAlFinal,
  comprobarForma,
  conectar,
  definicion,
  ESQUEMA,
  estado,
  fabrica,
  gestion,
  hmacDe,
  origen,
  RECURSO,
  registrarCliente,
  ROL_GESTION,
  ROL_MCP,
  sembrar,
  una,
  vale,
  type Resultado,
} from "./comun";

cerrarAlFinal();

const MIN = 60_000;
const OP = origen("operador");
const op = (bd: BdApoyo, f: string, ...args: unknown[]) => gestion(bd, f, [OP, ...args]);
const cuenta = async (bd: BdApoyo, tabla: string, donde = "true") =>
  (
    await una<{ n: number }>(
      bd,
      `select count(*)::int as n from ${ESQUEMA}.${tabla} where ${donde}`,
    )
  ).n;
const mcp = async (bd: BdApoyo, f: string, args: unknown[]) =>
  (await (await crearAlmacenPglite(bd, ROL_MCP)).llamar(f, args)) as Resultado;
const licencia = (bd: BdApoyo, tipo: string) =>
  una<{ id: string; estado: string }>(
    bd,
    `select id::text, estado::text from ${ESQUEMA}.licencias where tipo = $1 order by creada_en desc limit 1`,
    [tipo],
  );

const OPERACIONES: {
  f: string;
  firma: string;
  args: string[];
  llamada: string;
  params: unknown[];
}[] = [
  {
    f: "operar_contar_fallo",
    firma: "text",
    args: ["p_origen_hmac"],
    llamada: "$1",
    params: [origen("forma")],
  },
  {
    f: "operar_generar_codigo",
    firma: "text, text, text",
    args: ["p_origen_hmac", "p_tipo", "p_codigo_hmac"],
    llamada: "$1, $2, $3",
    params: [origen("forma"), "A", hmacDe("forma")],
  },
  {
    f: "operar_suspender_licencia",
    firma: "text, text",
    args: ["p_origen_hmac", "p_tipo"],
    llamada: "$1, $2",
    params: [origen("forma"), "B"],
  },
  {
    f: "operar_reactivar_licencia",
    firma: "text, text",
    args: ["p_origen_hmac", "p_tipo"],
    llamada: "$1, $2",
    params: [origen("forma"), "B"],
  },
  {
    f: "operar_crear_orden",
    firma: "text, text, text",
    args: ["p_origen_hmac", "p_tipo", "p_orden"],
    llamada: "$1, $2, $3",
    params: [origen("forma"), "B", "pausar"],
  },
  {
    f: "operar_listar_conexiones",
    firma: "text",
    args: ["p_origen_hmac"],
    llamada: "$1",
    params: [origen("forma")],
  },
  {
    f: "operar_revocar_conexion",
    firma: "text, text",
    args: ["p_origen_hmac", "p_conexion"],
    llamada: "$1, $2",
    params: [origen("forma"), "00000000-0000-4000-8000-000000000000"],
  },
  {
    f: "operar_resumen",
    firma: "text",
    args: ["p_origen_hmac"],
    llamada: "$1",
    params: [origen("forma")],
  },
  {
    f: "operar_exportar_sucesos",
    firma: "text, text",
    args: ["p_origen_hmac", "p_dia"],
    llamada: "$1, $2",
    params: [origen("forma"), "2026-03-01"],
  },
];

describe("T-107 (d): forma y permisos (solo el rol de gestión)", () => {
  it.each(OPERACIONES)(
    "$f: security definer, search_path, sin identificadores, solo gestión",
    async (o) => {
      const bd = await abrir();
      const usaHora = ["operar_generar_codigo", "operar_crear_orden"].includes(o.f);
      await comprobarForma(
        bd,
        o.f,
        o.firma,
        o.args,
        o.llamada,
        o.params,
        { permitido: ROL_GESTION, prohibidos: ["anon", "authenticated", "service_role", ROL_MCP] },
        !usaHora,
      );
    },
  );

  it("cerrar_prueba: security definer, search_path, solo gestión", async () => {
    const bd = await abrir();
    await comprobarForma(
      bd,
      "cerrar_prueba",
      "text",
      ["p_origen_hmac"],
      "$1",
      [origen("forma")],
      { permitido: ROL_GESTION, prohibidos: ["anon", "authenticated", "service_role", ROL_MCP] },
      false,
    );
  });
});

describe("T-107 (d): la puerta del operador (origen bloqueado o mal formado)", () => {
  it("5 fallos bloquean 15 min: toda operación (también cerrar_prueba) se rechaza sin cambiar nada", async () => {
    const bd = await abrir();
    await bd.reloj.fijar(new Date());
    for (let i = 1; i <= 4; i++) {
      expect(await gestion(bd, "operar_contar_fallo", [OP]), `fallo ${i}`).toEqual({
        resultado: "contado",
      });
    }
    expect(await gestion(bd, "operar_contar_fallo", [OP])).toEqual({ resultado: "bloqueado" });
    const antes = await estado(bd);
    const llamadas: [string, unknown[]][] = [
      ["operar_generar_codigo", ["A", hmacDe("c")]],
      ["operar_suspender_licencia", ["A"]],
      ["operar_reactivar_licencia", ["A"]],
      ["operar_crear_orden", ["A", "pausar"]],
      ["operar_listar_conexiones", []],
      ["operar_revocar_conexion", ["00000000-0000-4000-8000-000000000000"]],
      ["operar_resumen", []],
      ["operar_exportar_sucesos", ["2026-03-01"]],
      ["cerrar_prueba", []],
    ];
    for (const [f, a] of llamadas) {
      expect(await op(bd, f, ...a), f).toEqual({ resultado: "origen_bloqueado" });
    }
    expect(await estado(bd)).toEqual(antes);
    expect(await cuenta(bd, "cierre")).toBe(0);
    // Otro origen no está bloqueado.
    expect((await gestion(bd, "operar_resumen", [origen("otro")])).resultado).toBe("resumen");
    await bd.reloj.avanzar(15 * MIN - 1000);
    expect((await op(bd, "operar_resumen")).resultado, "14 min 59 s").toBe("origen_bloqueado");
    await bd.reloj.avanzar(1000);
    expect((await op(bd, "operar_resumen")).resultado, "15 min").toBe("resumen");
  });

  it("un origen mal formado o nulo se rechaza sin evaluar", async () => {
    const bd = await abrir();
    const antes = await estado(bd);
    for (const o of [null, "", "no-es-hmac", "A".repeat(64)]) {
      for (const f of ["operar_resumen", "operar_suspender_licencia", "cerrar_prueba"]) {
        const args = f === "operar_suspender_licencia" ? [o, "A"] : [o];
        expect(await gestion(bd, f, args), `${f} ${String(o)}`).toEqual({
          resultado: "origen_bloqueado",
        });
      }
    }
    expect(await gestion(bd, "operar_contar_fallo", [null])).toEqual({ resultado: "invalido" });
    expect(await estado(bd)).toEqual(antes);
  });
});

describe("T-107 (d): operar_generar_codigo, suspender, reactivar y crear_orden", () => {
  it("genera un código de 10 min para A o B (solo su HMAC) y con él se activa una conexión de esa licencia", async () => {
    const bd = await abrir();
    await bd.reloj.fijar(new Date());
    const cliente = await registrarCliente(bd);
    for (const tipo of ["A", "B"]) {
      const h = hmacDe(`generado:${tipo}`);
      expect(await op(bd, "operar_generar_codigo", tipo, h)).toEqual({ resultado: "generado" });
      const f = await una<{ vida: string; lic: string; usado: boolean }>(
        bd,
        `select (caduca_en - creado_en)::text as vida, l.tipo::text as lic, (usado_en is not null) as usado
           from ${ESQUEMA}.codigos_activacion c join ${ESQUEMA}.licencias l on l.id = c.licencia_id
          where c.codigo_hmac = $1`,
        [h],
      );
      expect(f).toEqual({ vida: "00:10:00", lic: tipo, usado: false });
    }
    const abierta = await gestion(bd, "abrir_solicitud", [
      cliente,
      "https://claude.ai/api/mcp/auth_callback",
      "A".repeat(43),
      RECURSO,
      hmacDe("s"),
      hmacDe("c"),
    ]);
    const r = await gestion(bd, "activar", [
      abierta.solicitud,
      hmacDe("c"),
      hmacDe("s"),
      origen("n"),
      hmacDe("generado:B"),
      hmacDe("aut"),
    ]);
    expect(r.resultado).toBe("activada");
    expect(
      (
        await una<{ t: string }>(
          bd,
          `select l.tipo::text as t from ${ESQUEMA}.conexiones c join ${ESQUEMA}.licencias l on l.id = c.licencia_id`,
        )
      ).t,
    ).toBe("B");
  });

  it("tipo o HMAC no válidos, licencia suspendida o repetido: se rechaza sin escribir", async () => {
    const bd = await abrir();
    const h = hmacDe("g");
    const antes = await estado(bd);
    for (const [t, c] of [
      ["C", h],
      ["a", h],
      ["", h],
      [null, h],
      ["A", "x"],
      ["A", null],
    ]) {
      expect(await op(bd, "operar_generar_codigo", t, c), `${String(t)} ${String(c)}`).toEqual({
        resultado: "no_valido",
      });
    }
    expect(await estado(bd)).toEqual(antes);
    await op(bd, "operar_generar_codigo", "A", h);
    expect(await op(bd, "operar_generar_codigo", "B", h), "HMAC repetido").toEqual({
      resultado: "no_valido",
    });
    await op(bd, "operar_suspender_licencia", "A");
    expect(await op(bd, "operar_generar_codigo", "A", hmacDe("g2"))).toEqual({
      resultado: "licencia_no_activa",
    });
    await bd.db.query(`update ${ESQUEMA}.licencias set estado = 'revocada' where tipo = 'B'`);
    expect(await op(bd, "operar_generar_codigo", "B", hmacDe("g3"))).toEqual({
      resultado: "licencia_desconocida",
    });
  });

  it("suspender y reactivar cambian el estado servido (`suspendida` / `activa`) solo de esa licencia", async () => {
    const bd = await abrir();
    const a = await sembrar(bd, "A");
    const b = await sembrar(bd, "B");
    const huellaB = JSON.stringify(await licencia(bd, "B"));
    expect(await op(bd, "operar_suspender_licencia", "A")).toEqual({ resultado: "suspendida" });
    expect(await mcp(bd, "mcp_obtener_instrucciones", [a.acceso.hmac, RECURSO])).toMatchObject({
      estado: "suspendida",
    });
    expect(await mcp(bd, "mcp_obtener_instrucciones", [b.acceso.hmac, RECURSO])).toMatchObject({
      estado: "activa",
    });
    expect(await op(bd, "operar_suspender_licencia", "A"), "ya suspendida").toEqual({
      resultado: "sin_cambio",
    });
    expect(await op(bd, "operar_reactivar_licencia", "A")).toEqual({ resultado: "reactivada" });
    expect(await mcp(bd, "mcp_obtener_instrucciones", [a.acceso.hmac, RECURSO])).toMatchObject({
      estado: "activa",
    });
    expect(await op(bd, "operar_reactivar_licencia", "A"), "ya activa").toEqual({
      resultado: "sin_cambio",
    });
    expect(JSON.stringify(await licencia(bd, "B"))).toBe(huellaB);
    for (const f of ["operar_suspender_licencia", "operar_reactivar_licencia"]) {
      for (const t of ["C", "", null])
        expect(await op(bd, f, t), f).toEqual({ resultado: "no_valido" });
    }
    await bd.db.query(`update ${ESQUEMA}.licencias set estado = 'revocada' where tipo = 'A'`);
    expect(await op(bd, "operar_suspender_licencia", "A")).toEqual({
      resultado: "licencia_desconocida",
    });
    expect(await op(bd, "operar_reactivar_licencia", "A")).toEqual({
      resultado: "licencia_desconocida",
    });
  });

  it("crear_orden: pausar se entrega, una nueva anula las no confirmadas y no toca otra licencia ni lo confirmado", async () => {
    const bd = await abrir();
    const a = await sembrar(bd, "A");
    const b = await sembrar(bd, "B");
    const r1 = await op(bd, "operar_crear_orden", "A", "pausar");
    expect(r1).toMatchObject({ resultado: "creada", anuladas: 0 });
    const ordenB = await op(bd, "operar_crear_orden", "B", "pausar");
    expect(await mcp(bd, "mcp_obtener_instrucciones", [a.acceso.hmac, RECURSO])).toMatchObject({
      estado: "pausada",
      orden: { id: r1.orden, tipo: "pausar" },
    });
    // Una confirmada en A no se anula; la entregada sí.
    await op(bd, "operar_crear_orden", "A", "reanudar").then(async (r2) => {
      expect(r2).toMatchObject({ resultado: "creada", anuladas: 1 });
      const estados = (
        await bd.db.query<{ estado: string }>(
          `select estado::text from ${ESQUEMA}.ordenes where id = $1`,
          [r1.orden],
        )
      ).rows;
      expect(estados).toEqual([{ estado: "anulada" }]);
      expect(await mcp(bd, "mcp_obtener_instrucciones", [a.acceso.hmac, RECURSO])).toMatchObject({
        estado: "activa",
        orden: { id: r2.orden, tipo: "reanudar" },
      });
      expect(await mcp(bd, "mcp_confirmar_orden", [a.acceso.hmac, RECURSO, r2.orden])).toEqual({
        resultado: "confirmada",
      });
    });
    const r3 = await op(bd, "operar_crear_orden", "A", "pausar");
    expect(r3, "la confirmada no se anula").toMatchObject({ resultado: "creada", anuladas: 0 });
    expect(await cuenta(bd, "ordenes", "estado = 'confirmada'")).toBe(1);
    expect(
      (
        await una<{ estado: string }>(
          bd,
          `select estado::text from ${ESQUEMA}.ordenes where id = $1`,
          [ordenB.orden],
        )
      ).estado,
      "la de B sigue pendiente",
    ).toBe("pendiente");
    expect(await mcp(bd, "mcp_obtener_instrucciones", [b.acceso.hmac, RECURSO])).toMatchObject({
      estado: "pausada",
      orden: { id: ordenB.orden },
    });
  });

  it("crear_orden rechaza tipos no válidos y licencias revocadas, sin escribir", async () => {
    const bd = await abrir();
    const antes = await estado(bd);
    for (const [l, t] of [
      ["C", "pausar"],
      ["A", "borrar"],
      ["A", null],
      [null, "pausar"],
      ["A", "PAUSAR"],
    ]) {
      expect(await op(bd, "operar_crear_orden", l, t), `${String(l)} ${String(t)}`).toEqual({
        resultado: "no_valido",
      });
    }
    await bd.db.query(`update ${ESQUEMA}.licencias set estado = 'revocada' where tipo = 'A'`);
    const despues = await estado(bd);
    expect(await op(bd, "operar_crear_orden", "A", "pausar")).toEqual({
      resultado: "licencia_desconocida",
    });
    expect(await estado(bd)).toEqual(despues);
    expect(antes.ordenes).toBe(despues.ordenes);
  });
});

describe("T-107 (d): listar_conexiones y revocar_conexion (PRUEBA-013)", () => {
  it("lista las conexiones sin ningún secreto", async () => {
    const bd = await abrir();
    const cliente = await registrarCliente(bd);
    const e1 = await conectar(bd, cliente, "A", "https://claude.ai/api/mcp/auth_callback");
    const e2 = await conectar(
      bd,
      cliente,
      "B",
      "https://chatgpt.com/connector_platform_oauth_redirect",
    );
    const r = await op(bd, "operar_listar_conexiones");
    expect(r.resultado).toBe("listado");
    const lista = r.conexiones as Record<string, unknown>[];
    expect(lista.map((c) => [c.licencia, c.asistente, c.revocada_en])).toEqual([
      ["A", "claude", null],
      ["B", "chatgpt", null],
    ]);
    expect(lista.map((c) => c.id).sort()).toEqual([e1.conexion, e2.conexion].sort());
    const texto = JSON.stringify(r);
    for (const t of [e1.acceso, e1.renovacion, e2.acceso]) {
      expect(texto).not.toContain(t.hmac);
      expect(texto).not.toContain(t.valor);
    }
    expect(texto).not.toMatch(/hmac|token|sal"/);
  });

  it("revocar una conexión de A la deja sin acceso y no afecta a la otra de A ni a las de B (PRUEBA-013)", async () => {
    const bd = await abrir();
    const cliente = await registrarCliente(bd);
    const a1 = await conectar(bd, cliente, "A");
    const a2 = await conectar(bd, cliente, "A");
    const b = await conectar(bd, cliente, "B");
    expect(await op(bd, "operar_revocar_conexion", a1.conexion)).toEqual({ resultado: "revocada" });
    expect(await vale(bd, a1.acceso), "la revocada").toBe(false);
    expect(await mcp(bd, "mcp_obtener_instrucciones", [a1.acceso.hmac, RECURSO])).toEqual({
      resultado: "no_autorizado",
    });
    expect(await vale(bd, a2.acceso), "la otra de A").toBe(true);
    expect(await vale(bd, b.acceso), "la de B").toBe(true);
    const f = await una<{ motivo: string; sin_tokens: number }>(
      bd,
      `select motivo_revocacion::text as motivo,
              (select count(*)::int from ${ESQUEMA}.tokens where conexion_id = c.id and revocado_en is null) as sin_tokens
         from ${ESQUEMA}.conexiones c where id = $1`,
      [a1.conexion],
    );
    expect(f).toEqual({ motivo: "operador", sin_tokens: 0 });
    // Su renovación tampoco sirve.
    expect(
      await gestion(bd, "renovar", [
        a1.renovacion.hmac,
        cliente,
        RECURSO,
        "A".repeat(22),
        fabrica.token("acceso").hmac,
        fabrica.token("renovacion").hmac,
      ]),
    ).toEqual({ resultado: "no_valido" });
    expect(await op(bd, "operar_revocar_conexion", a1.conexion), "ya revocada").toEqual({
      resultado: "sin_cambio",
    });
    expect(
      (
        await una<{ m: string }>(
          bd,
          `select motivo_revocacion::text as m from ${ESQUEMA}.conexiones where id = $1`,
          [a1.conexion],
        )
      ).m,
    ).toBe("operador");
  });

  it("un identificador inexistente, mal formado o nulo es `conexion_desconocida`, sin escribir", async () => {
    const bd = await abrir();
    await sembrar(bd, "A");
    const antes = await estado(bd);
    for (const id of ["00000000-0000-4000-8000-0000000000ff", "no-es-uuid", "", null]) {
      expect(await op(bd, "operar_revocar_conexion", id), String(id)).toEqual({
        resultado: "conexion_desconocida",
      });
    }
    expect(await estado(bd)).toEqual(antes);
  });
});

describe("T-107 (d): resumen y exportar_sucesos", () => {
  it("el resumen da recuentos, protocolos y el percentil 95, y ningún dato recibido", async () => {
    const bd = await abrir();
    const a = await sembrar(bd, "A");
    await sembrar(bd, "B");
    await mcp(bd, "mcp_obtener_instrucciones", [a.acceso.hmac, RECURSO]);
    await bd.db.query(
      `insert into ${ESQUEMA}.sucesos (ruta, herramienta, resultado, codigo, duracion_ms, protocolo)
       select 'mcp', 'obtener_instrucciones', 'correcto', 'ok', g, case when g % 2 = 0 then '2025-11-25' else '2026-07-28' end
         from generate_series(1, 20) g`,
    );
    await bd.db.query(
      `insert into ${ESQUEMA}.sucesos (ruta, herramienta, resultado, codigo, duracion_ms, protocolo)
       values ('mcp', null, 'rechazado', 'invalid_token', 3, 'otra')`,
    );
    const r = await op(bd, "operar_resumen");
    expect(r).toEqual({
      resultado: "resumen",
      cerrada: false,
      licencias: [
        { tipo: "A", estado: "activa" },
        { tipo: "B", estado: "activa" },
      ],
      conexiones: { total: 2, activas: 2, revocadas: 0 },
      ordenes: { pendiente: 0, entregada: 0, confirmada: 0, anulada: 0 },
      ejecuciones: { total: 1, cerradas: 0 },
      informes: 0,
      sucesos: { total: 21, correcto: 20, rechazado: 1, error: 0 },
      protocolos: { "2025-11-25": 10, "2026-07-28": 10, otra: 1 },
      p95_ms: { obtener_instrucciones: 19, enviar_informe: null, confirmar_orden: null },
    });
  });

  it("exporta los sucesos de un día (UTC) y rechaza un día mal formado o imposible", async () => {
    const bd = await abrir();
    await bd.db.query(
      `insert into ${ESQUEMA}.sucesos (momento, ruta, herramienta, resultado, codigo, duracion_ms, protocolo, asistente) values
         ('2026-03-01T00:00:00Z', 'mcp', 'obtener_instrucciones', 'correcto', 'ok', 5, '2025-11-25', 'claude'),
         ('2026-03-01T23:59:59Z', 'mcp', 'enviar_informe', 'rechazado', 'informe_invalido', 7, 'otra', null),
         ('2026-03-02T00:00:00Z', 'mcp', 'confirmar_orden', 'correcto', 'ok', 1, '2026-07-28', 'chatgpt')`,
    );
    const r = await op(bd, "operar_exportar_sucesos", "2026-03-01");
    expect(r.resultado).toBe("exportado");
    expect(
      (r.sucesos as Record<string, unknown>[]).map((s) => [
        s.herramienta,
        s.resultado,
        s.codigo,
        s.asistente,
      ]),
    ).toEqual([
      ["obtener_instrucciones", "correcto", "ok", "claude"],
      ["enviar_informe", "rechazado", "informe_invalido", null],
    ]);
    expect(Object.keys((r.sucesos as Record<string, unknown>[])[0]!).sort()).toEqual([
      "asistente",
      "codigo",
      "duracion_ms",
      "herramienta",
      "momento",
      "protocolo",
      "resultado",
      "ruta",
    ]);
    expect(await op(bd, "operar_exportar_sucesos", "2026-03-05")).toEqual({
      resultado: "exportado",
      sucesos: [],
    });
    for (const d of [
      "2026-02-30",
      "2026-3-1",
      "mañana",
      "",
      "2026-03-01 10:00",
      "2026-03-01\n",
      null,
    ]) {
      expect(await op(bd, "operar_exportar_sucesos", d), String(d)).toEqual({
        resultado: "no_valido",
      });
    }
  });
});

describe("T-107 (d): cerrar_prueba es terminal (PRUEBA-023, parte B)", () => {
  it("rechaza después generar, activar, abrir, canjear, renovar, validar y las operaciones de cambio; permite resumen, listar y exportar", async () => {
    const bd = await abrir();
    const cliente = await registrarCliente(bd);
    const viva = await conectar(bd, cliente, "A");
    const deB = await conectar(bd, cliente, "B");
    // Pendientes al cerrar: un código de autorización sin canjear y una solicitud abierta con su código.
    const sinCanjear = await autorizar(bd, cliente, "A");
    await op(bd, "operar_generar_codigo", "A", hmacDe("codigo-pendiente"));
    const solicitud = await gestion(bd, "abrir_solicitud", [
      cliente,
      "https://claude.ai/api/mcp/auth_callback",
      "A".repeat(43),
      RECURSO,
      hmacDe("s"),
      hmacDe("c"),
    ]);
    expect(await vale(bd, viva.acceso)).toBe(true);

    const r = await op(bd, "cerrar_prueba");
    expect(r).toEqual({ resultado: "prueba_cerrada" });

    // Lo que ya estaba entregado deja de valer.
    for (const e of [viva, deB]) {
      expect(await vale(bd, e.acceso)).toBe(false);
      expect(await mcp(bd, "mcp_obtener_instrucciones", [e.acceso.hmac, RECURSO])).toEqual({
        resultado: "no_autorizado",
      });
      expect(
        await gestion(bd, "renovar", [
          e.renovacion.hmac,
          cliente,
          RECURSO,
          "A".repeat(22),
          fabrica.token("acceso").hmac,
          fabrica.token("renovacion").hmac,
        ]),
        "renovar: invalid_grant",
      ).toEqual({ resultado: "no_valido" });
    }
    expect(
      await gestion(bd, "canjear_codigo", [
        sinCanjear.codigoAut,
        cliente,
        "https://claude.ai/api/mcp/auth_callback",
        sinCanjear.desafio,
        RECURSO,
        fabrica.token("acceso").hmac,
        fabrica.token("renovacion").hmac,
      ]),
    ).toEqual({ resultado: "no_valido" });
    expect(
      await gestion(bd, "activar", [
        solicitud.solicitud,
        hmacDe("c"),
        hmacDe("s"),
        origen("n"),
        hmacDe("codigo-pendiente"),
        hmacDe("aut-nueva"),
      ]),
    ).toEqual({ resultado: "cerrada" });
    expect(
      await gestion(bd, "abrir_solicitud", [
        cliente,
        "https://claude.ai/api/mcp/auth_callback",
        "B".repeat(43),
        RECURSO,
        hmacDe("s2"),
        hmacDe("c2"),
      ]),
    ).toEqual({ resultado: "cerrada" });
    for (const [f, a] of [
      ["operar_generar_codigo", ["A", hmacDe("nuevo")]],
      ["operar_suspender_licencia", ["A"]],
      ["operar_reactivar_licencia", ["A"]],
      ["operar_crear_orden", ["A", "pausar"]],
      ["operar_revocar_conexion", [viva.conexion]],
    ] as [string, unknown[]][]) {
      expect(await op(bd, f, ...a), f).toEqual({ resultado: "cerrada" });
    }
    // Lo que sigue permitido.
    expect((await op(bd, "operar_resumen")).resultado).toBe("resumen");
    expect((await op(bd, "operar_resumen")).cerrada).toBe(true);
    expect((await op(bd, "operar_listar_conexiones")).resultado).toBe("listado");
    expect((await op(bd, "operar_exportar_sucesos", "2026-03-01")).resultado).toBe("exportado");
    expect(await gestion(bd, "operar_contar_fallo", [OP])).toEqual({ resultado: "contado" });

    // Estado final: todo revocado o consumido; nada vuelve a abrirse.
    expect(await cuenta(bd, "licencias", "estado <> 'revocada'")).toBe(0);
    expect(await cuenta(bd, "conexiones", "revocada_en is null")).toBe(0);
    expect(await cuenta(bd, "conexiones", "motivo_revocacion = 'cierre'")).toBe(
      await cuenta(bd, "conexiones"),
    );
    expect(await cuenta(bd, "tokens", "revocado_en is null")).toBe(0);
    expect(await cuenta(bd, "codigos_activacion", "usado_en is null")).toBe(0);
    expect(await cuenta(bd, "codigos_autorizacion", "usado_en is null")).toBe(0);
    expect(await cuenta(bd, "cierre")).toBe(1);
  });

  it("el cierre conserva el motivo de las conexiones que ya estaban revocadas y es idempotente", async () => {
    const bd = await abrir();
    const cliente = await registrarCliente(bd);
    const a1 = await conectar(bd, cliente, "A");
    await conectar(bd, cliente, "B");
    await op(bd, "operar_revocar_conexion", a1.conexion);
    expect(await op(bd, "cerrar_prueba")).toEqual({ resultado: "prueba_cerrada" });
    expect(
      (
        await una<{ m: string }>(
          bd,
          `select motivo_revocacion::text as m from ${ESQUEMA}.conexiones where id = $1`,
          [a1.conexion],
        )
      ).m,
    ).toBe("operador");
    const antes = await estado(bd);
    expect(await op(bd, "cerrar_prueba")).toEqual({ resultado: "ya_cerrada" });
    expect(await estado(bd)).toEqual(antes);
  });

  it("tras el cierre ninguna licencia puede volver a crearse ni reactivarse (ni con la semilla): terminal sin vuelta", async () => {
    const bd = await abrir();
    await op(bd, "cerrar_prueba");
    await expect(
      bd.db.query(`update ${ESQUEMA}.licencias set estado = 'activa' where tipo = 'A'`),
    ).rejects.toThrow(/cierre/);
    await expect(
      bd.db.query(`update ${ESQUEMA}.licencias set estado = 'suspendida' where tipo = 'B'`),
    ).rejects.toThrow(/cierre/);
    await expect(
      bd.db.query(
        `insert into ${ESQUEMA}.licencias (cliente_id, tipo) values ('00000000-0000-4000-8000-0000000000d1', 'A')`,
      ),
    ).rejects.toThrow(/cierre/);
    expect(await cuenta(bd, "licencias", "estado <> 'revocada'")).toBe(0);
    // La tabla `cierre` no se puede vaciar ni duplicar desde las funciones del conector.
    expect(await cuenta(bd, "cierre")).toBe(1);
    await expect(
      bd.db.query(`insert into ${ESQUEMA}.cierre (id, cerrado_en) values (true, now())`),
    ).rejects.toThrow();
  });
});

describe("T-107 (d): el bloque de autenticación del token es idéntico en las cuatro funciones", () => {
  const FUNCIONES = [
    "validar_acceso(text, text)",
    "mcp_obtener_instrucciones(text, text)",
    "mcp_enviar_informe(text, text, text, text, integer)",
    "mcp_confirmar_orden(text, text, text)",
  ];
  /** Desde la tabla de tokens hasta la comprobación de licencia, sin espacios ni saltos de más. */
  const bloque = (cuerpo: string) => {
    const m = /from conector_prueba\.tokens t[\s\S]*?l\.estado <> 'revocada'[\s\S]*?cierre\)/.exec(
      cuerpo,
    );
    return m ? m[0].replace(/\s+/g, " ") : null;
  };

  it("las cuatro copias coinciden y comprueban el cierre además del token, la conexión y la licencia", async () => {
    const bd = await abrir();
    const bloques: string[] = [];
    for (const firma of FUNCIONES) {
      const b = bloque((await definicion(bd, firma)).cuerpo);
      expect(b, firma).not.toBeNull();
      bloques.push(b!);
    }
    for (const b of bloques) expect(b).toBe(bloques[0]);
    const b = bloques[0]!;
    expect(b).toContain("t.tipo = 'acceso'");
    expect(b).toContain("t.recurso = p_recurso");
    expect(b).toContain("t.revocado_en is null");
    expect(b).toMatch(/t\.caduca_en > (?:reloj_pruebas\.)?now\(\)( |$)/);
    expect(b).toContain("t.caduca_en <= t.creado_en + interval '300 seconds'");
    expect(b).toContain("c.revocada_en is null");
    expect(b).toMatch(/not exists \(select 1 from conector_prueba\.cierre\)$/);
  });

  it("con la tabla `cierre` rellena, las cuatro rechazan aunque el token, la conexión y la licencia sigan vivos", async () => {
    const bd = await abrir();
    const a = await sembrar(bd, "A");
    expect(await vale(bd, a.acceso)).toBe(true);
    await bd.db.query(`insert into ${ESQUEMA}.cierre (id, cerrado_en) values (true, now())`);
    expect(await vale(bd, a.acceso)).toBe(false);
    expect(await mcp(bd, "mcp_obtener_instrucciones", [a.acceso.hmac, RECURSO])).toEqual({
      resultado: "no_autorizado",
    });
    expect(
      await mcp(bd, "mcp_enviar_informe", [
        a.acceso.hmac,
        RECURSO,
        "00000000-0000-4000-8000-000000000000",
        "{}",
        0,
      ]),
    ).toEqual({ resultado: "no_autorizado" });
    expect(
      await mcp(bd, "mcp_confirmar_orden", [
        a.acceso.hmac,
        RECURSO,
        "00000000-0000-4000-8000-000000000000",
      ]),
    ).toEqual({ resultado: "no_autorizado" });
  });

  it("las funciones `operar_*` y `cerrar_prueba` pasan todas por la misma puerta", async () => {
    const bd = await abrir();
    for (const o of OPERACIONES.filter((x) => x.f !== "operar_contar_fallo")) {
      const { cuerpo } = await definicion(bd, `${o.f}(${o.firma})`);
      expect(cuerpo, o.f).toContain("conector_prueba.operar_puerta(p_origen_hmac)");
    }
    const c = await definicion(bd, "cerrar_prueba(text)");
    expect(c.cuerpo).toContain("conector_prueba.operar_puerta(p_origen_hmac)");
  });
});

describe("T-107 (d): `registrar_suceso` sigue escribiendo tras el cierre (observabilidad; menor 10 del revisor)", () => {
  // Decisión de la coordinación (D-036): no concede acceso, solo guarda la forma cerrada de un suceso y está
  // acotada por el tope de 20 000 al día. Esta prueba fija el comportamiento para que un cambio sea deliberado.
  it("registra el suceso, no concede nada y no cambia ninguna otra tabla", async () => {
    const bd = await abrir();
    await bd.db.query(`insert into ${ESQUEMA}.cierre (id, cerrado_en) values (true, now())`);
    const antes = await estado(bd);
    const r = await gestion(bd, "registrar_suceso", [
      null,
      "mcp",
      null,
      "rechazado",
      "no_autorizado",
      3,
      "otra",
    ]);
    expect(r).toEqual({ resultado: "registrado" });
    const despues = await estado(bd);
    const cambiadas = Object.keys(antes).filter((t) => antes[t] !== despues[t]);
    expect(cambiadas).toEqual(["sucesos"]);
  });
});
