// T-108 (d) (001): autorizacion.ts, rol de gestión con adaptador inyectable (como almacen.ts).
// PRUEBA-018 (parte): almacén caído, plazo de 5 s y respuesta que no es de la lista cerrada dan
// `almacen_no_disponible` en CADA función, sin valores ni mensajes de la base (art. 3); `cerrada` es un
// resultado propio y uno desconocido nunca es éxito. Con el adaptador PGlite del rol de gestión se
// comprueba además que nombre y orden de argumentos coinciden con las funciones SQL reales.
import { randomBytes } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ErrorDeAplicacion } from "../../../src/lib/plataforma/errores";
import {
  FUNCIONES_GESTION,
  crearAdaptadorGestion,
  crearAutorizacion,
  type FabricaPostgres,
  type AdaptadorAutorizacion,
  type Autorizacion,
} from "../../../src/lib/supabase/autorizacion";
import { crearAlmacenPglite } from "../../conector/apoyo/index";
import {
  CB_CHATGPT,
  CB_CLAUDE,
  RECURSO,
  ROL_GESTION,
  abrir,
  cerrarAlFinal,
  hmacDe,
  idDcr,
  origen,
  una,
  ESQUEMA,
} from "./bd/comun";

cerrarAlFinal();
afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

const CANARIO = "TEXTO-CANARIO-" + "AUTORIZACION-123";
const H = "a".repeat(64);
const UUID = "11111111-1111-4111-8111-111111111111";
const DESAFIO = randomBytes(32).toString("base64url");
const SAL = randomBytes(16).toString("base64url");

// Una llamada válida por función (nombre en TypeScript, función SQL, ejecución).
const LLAMADAS: Record<string, (a: Autorizacion) => Promise<unknown>> = {
  leer_cliente: (a) => a.leerCliente("https://c.ejemplo.test/x"),
  guardar_cliente_cimd: (a) => a.guardarClienteCimd("https://c.ejemplo.test/x", [CB_CLAUDE]),
  registrar_cliente_dcr: (a) => a.registrarClienteDcr(H, "dcr_" + "a".repeat(22), [CB_CLAUDE]),
  abrir_solicitud: (a) => a.abrirSolicitud("c", CB_CLAUDE, DESAFIO, RECURSO, H, H),
  activar: (a) => a.activar(UUID, H, H, H, H, H),
  canjear_codigo: (a) => a.canjearCodigo(H, "c", CB_CLAUDE, DESAFIO, RECURSO, H, H),
  renovar: (a) => a.renovar(H, "c", RECURSO, SAL, H, H),
  operar_contar_fallo: (a) => a.operarContarFallo(H),
  operar_generar_codigo: (a) => a.operarGenerarCodigo(H, "A", H),
  operar_suspender_licencia: (a) => a.operarSuspenderLicencia(H, "A"),
  operar_reactivar_licencia: (a) => a.operarReactivarLicencia(H, "A"),
  operar_crear_orden: (a) => a.operarCrearOrden(H, "A", "pausar"),
  operar_listar_conexiones: (a) => a.operarListarConexiones(H),
  operar_revocar_conexion: (a) => a.operarRevocarConexion(H, UUID),
  operar_resumen: (a) => a.operarResumen(H),
  operar_exportar_sucesos: (a) => a.operarExportarSucesos(H, "2026-11-21"),
  cerrar_prueba: (a) => a.cerrarPrueba(H),
};

const adaptadorDe = (respuesta: () => Promise<unknown>) => {
  const llamadas: { funcion: string; argumentos: unknown[] }[] = [];
  const adaptador: AdaptadorAutorizacion = {
    llamar: (funcion, argumentos) => {
      llamadas.push({ funcion, argumentos });
      return respuesta();
    },
  };
  return { adaptador, llamadas };
};

async function falla(promesa: Promise<unknown>): Promise<ErrorDeAplicacion> {
  try {
    await promesa;
  } catch (e) {
    expect(e).toBeInstanceOf(ErrorDeAplicacion);
    return e as ErrorDeAplicacion;
  }
  throw new Error("no falló");
}

describe("autorizacion.ts: lista cerrada de funciones", () => {
  it("cubre exactamente las funciones del rol de gestión, sin las del rol mcp", () => {
    expect([...FUNCIONES_GESTION].sort()).toEqual([...Object.keys(LLAMADAS)].sort());
    for (const f of FUNCIONES_GESTION) expect(f).not.toMatch(/^(mcp_|validar_)/);
  });
});

describe("autorizacion.ts: caído en cada función (PRUEBA-018, parte)", () => {
  for (const [funcion, llamar] of Object.entries(LLAMADAS)) {
    it(`${funcion}: el adaptador falla con un mensaje con contenido -> almacen_no_disponible sin él`, async () => {
      const { adaptador, llamadas } = adaptadorDe(() =>
        Promise.reject(new Error(`detalle ${CANARIO}`)),
      );
      const e = await falla(llamar(crearAutorizacion(adaptador)));
      expect(e.codigo).toBe("almacen_no_disponible");
      expect(e.message).not.toContain(CANARIO);
      expect(String(e.cause ?? "")).not.toContain(CANARIO);
      expect(llamadas.map((l) => l.funcion)).toEqual([funcion]);
    });

    it(`${funcion}: plazo de 5 s vencido -> almacen_no_disponible`, async () => {
      vi.useFakeTimers();
      const { adaptador } = adaptadorDe(() => new Promise(() => undefined));
      const p = falla(llamar(crearAutorizacion(adaptador)));
      await vi.advanceTimersByTimeAsync(5001);
      expect((await p).codigo).toBe("almacen_no_disponible");
    });

    for (const [nombre, respuesta] of [
      ["sin resultado", {}],
      ["no es objeto", "texto"],
      ["nulo", null],
      ["resultado desconocido", { resultado: "exito" }],
      ["resultado de otra función", { resultado: "servido" }],
      ["campo de más", { resultado: "cerrada", extra: CANARIO }],
    ] as const) {
      it(`${funcion}: respuesta ${nombre} -> almacen_no_disponible`, async () => {
        const { adaptador } = adaptadorDe(() => Promise.resolve(respuesta));
        const e = await falla(llamar(crearAutorizacion(adaptador)));
        // `cerrada` con campo de más tampoco vale; en funciones sin `cerrada` solo cuenta el resto.
        expect(e.codigo).toBe("almacen_no_disponible");
        expect(e.message).not.toContain(CANARIO);
      });
    }
  }
});

describe("autorizacion.ts: formas cerradas y traducción de resultados", () => {
  const con = (r: unknown) => crearAutorizacion(adaptadorDe(() => Promise.resolve(r)).adaptador);

  it("`cerrada` es un resultado explícito, no una excepción, donde la base lo devuelve", async () => {
    const a = con({ resultado: "cerrada" });
    expect(await LLAMADAS.guardar_cliente_cimd!(a)).toEqual({ resultado: "cerrada" });
    expect(await LLAMADAS.registrar_cliente_dcr!(a)).toEqual({ resultado: "cerrada" });
    expect(await LLAMADAS.abrir_solicitud!(a)).toEqual({ resultado: "cerrada" });
    expect(await LLAMADAS.activar!(a)).toEqual({ resultado: "cerrada" });
    expect(await LLAMADAS.operar_generar_codigo!(a)).toEqual({ resultado: "cerrada" });
    expect(await LLAMADAS.operar_revocar_conexion!(a)).toEqual({ resultado: "cerrada" });
  });

  it("`cerrada` NO es un resultado de canjear_codigo ni de renovar (la base da no_valido)", async () => {
    const a = con({ resultado: "cerrada" });
    expect((await falla(LLAMADAS.canjear_codigo!(a))).codigo).toBe("almacen_no_disponible");
    expect((await falla(LLAMADAS.renovar!(a))).codigo).toBe("almacen_no_disponible");
  });

  it("leer_cliente: desconocido y conocido; los callbacks tienen que ser de la lista", async () => {
    expect(await con({ resultado: "desconocido" }).leerCliente("x")).toEqual({
      resultado: "desconocido",
    });
    expect(
      await con({
        resultado: "conocido",
        origen: "dcr",
        redirect_uris: [CB_CLAUDE, CB_CHATGPT],
        vigente: true,
      }).leerCliente("x"),
    ).toEqual({
      resultado: "conocido",
      origen: "dcr",
      redirectUris: [CB_CLAUDE, CB_CHATGPT],
      vigente: true,
    });
    for (const malo of [
      { origen: "dcr", redirect_uris: ["https://evil.test/cb"], vigente: true },
      { origen: "otro", redirect_uris: [CB_CLAUDE], vigente: true },
      { origen: "dcr", redirect_uris: [CB_CLAUDE], vigente: "si" },
      { origen: "dcr", redirect_uris: CB_CLAUDE, vigente: true },
    ]) {
      expect((await falla(con({ resultado: "conocido", ...malo }).leerCliente("x"))).codigo).toBe(
        "almacen_no_disponible",
      );
    }
  });

  it("activar: el redirect_uri devuelto debe ser de la lista (si no, se deniega)", async () => {
    expect(
      await con({ resultado: "activada", redirect_uri: CB_CLAUDE }).activar(UUID, H, H, H, H, H),
    ).toEqual({ resultado: "activada", redirectUri: CB_CLAUDE });
    const e = await falla(
      con({ resultado: "activada", redirect_uri: "https://evil.test/" }).activar(
        UUID,
        H,
        H,
        H,
        H,
        H,
      ),
    );
    expect(e.codigo).toBe("almacen_no_disponible");
  });

  it("canjear y renovar: formas de éxito", async () => {
    expect(
      await con({ resultado: "emitido", expires_in: 300 }).canjearCodigo(
        H,
        "c",
        CB_CLAUDE,
        DESAFIO,
        RECURSO,
        H,
        H,
      ),
    ).toEqual({ resultado: "emitido", expiresIn: 300 });
    expect(
      await con({ resultado: "rotado", expires_in: 300 }).renovar(H, "c", RECURSO, SAL, H, H),
    ).toEqual({ resultado: "rotado", expiresIn: 300 });
    expect(
      await con({ resultado: "repetido", sal: SAL, expires_in: 12 }).renovar(
        H,
        "c",
        RECURSO,
        SAL,
        H,
        H,
      ),
    ).toEqual({ resultado: "repetido", sal: SAL, expiresIn: 12 });
    expect(await con({ resultado: "reutilizado" }).renovar(H, "c", RECURSO, SAL, H, H)).toEqual({
      resultado: "reutilizado",
    });
    for (const malo of [
      { resultado: "emitido", expires_in: -1 },
      { resultado: "emitido", expires_in: "300" },
      { resultado: "repetido", sal: "corta", expires_in: 1 },
    ]) {
      const a = con(malo);
      expect(
        (
          await falla(
            Promise.all([
              a.canjearCodigo(H, "c", CB_CLAUDE, DESAFIO, RECURSO, H, H),
              a.renovar(H, "c", RECURSO, SAL, H, H),
            ]),
          )
        ).codigo,
      ).toBe("almacen_no_disponible");
    }
  });

  it("operar_*: formas de éxito y tras el cierre", async () => {
    expect(
      await con({ resultado: "creada", orden: UUID, anuladas: 2 }).operarCrearOrden(
        H,
        "A",
        "pausar",
      ),
    ).toEqual({
      resultado: "creada",
      orden: UUID,
      anuladas: 2,
    });
    expect(await con({ resultado: "generado" }).operarGenerarCodigo(H, "A", H)).toEqual({
      resultado: "generado",
    });
    expect(await con({ resultado: "prueba_cerrada" }).cerrarPrueba(H)).toEqual({
      resultado: "prueba_cerrada",
    });
    expect(await con({ resultado: "ya_cerrada" }).cerrarPrueba(H)).toEqual({
      resultado: "ya_cerrada",
    });
    const lista = {
      resultado: "listado",
      conexiones: [
        {
          id: UUID,
          licencia: "A",
          asistente: "claude",
          creada_en: "2026-11-21T10:00:00Z",
          ultimo_uso_en: null,
          revocada_en: null,
          motivo: null,
        },
      ],
    };
    expect(await con(lista).operarListarConexiones(H)).toEqual(lista);
    // Un elemento con un campo de más o de otro tipo no pasa.
    for (const malo of [
      { ...lista, conexiones: [{ ...lista.conexiones[0], extra: CANARIO }] },
      { ...lista, conexiones: [{ ...lista.conexiones[0], id: "no-uuid" }] },
      { ...lista, conexiones: "x" },
      // MENOR-4 del auditor: los instantes validan como los de un suceso (forma ISO y fecha analizable).
      { ...lista, conexiones: [{ ...lista.conexiones[0], creada_en: CANARIO }] },
      { ...lista, conexiones: [{ ...lista.conexiones[0], creada_en: "2026-13-45T99:99:99Z" }] },
      { ...lista, conexiones: [{ ...lista.conexiones[0], ultimo_uso_en: CANARIO }] },
      {
        ...lista,
        conexiones: [{ ...lista.conexiones[0], revocada_en: CANARIO, motivo: "cierre" }],
      },
      { ...lista, conexiones: [{ ...lista.conexiones[0], creada_en: null }] },
    ]) {
      expect((await falla(con(malo).operarListarConexiones(H))).codigo).toBe(
        "almacen_no_disponible",
      );
    }
    const res = { resultado: "exportado", sucesos: [] };
    expect(await con(res).operarExportarSucesos(H, "2026-11-21")).toEqual(res);
  });

  // MENOR-5 del revisor: formas exactas de `operar_resumen` y `operar_exportar_sucesos`
  // (supabase/conector-prueba/001_estado.sql): claves fijas, enumerados y enteros o null.
  describe("formas exactas de resumen y exportación", () => {
    const RESUMEN = {
      resultado: "resumen",
      cerrada: false,
      licencias: [
        { tipo: "A", estado: "activa" },
        { tipo: "B", estado: "suspendida" },
      ],
      conexiones: { total: 2, activas: 1, revocadas: 1 },
      ordenes: { pendiente: 0, entregada: 1, confirmada: 2, anulada: 0 },
      ejecuciones: { total: 3, cerradas: 2 },
      informes: 4,
      sucesos: { total: 5, correcto: 3, rechazado: 1, error: 1 },
      protocolos: { "2025-11-25": 3, "2026-07-28": 1, otra: 1 },
      p95_ms: { obtener_instrucciones: 12, enviar_informe: null, confirmar_orden: 7 },
    };
    const SUCESO = {
      momento: "2026-11-21T10:00:00.123456+00:00",
      ruta: "api/mcp",
      herramienta: "enviar_informe",
      resultado: "correcto",
      codigo: "ok",
      duracion_ms: 12,
      protocolo: "2025-11-25",
      asistente: null,
    };
    const exportar = (s: unknown) =>
      con({ resultado: "exportado", sucesos: [s] }).operarExportarSucesos(H, "2026-11-21");
    const resumen = (r: unknown) => con(r).operarResumen(H);
    const sin = (o: Record<string, unknown>, k: string) =>
      Object.fromEntries(Object.entries(o).filter(([c]) => c !== k));

    it("la forma real se acepta, con p95 a null", async () => {
      expect(await resumen(RESUMEN)).toEqual(RESUMEN);
      const sinDatos = { ...RESUMEN, p95_ms: { ...RESUMEN.p95_ms, obtener_instrucciones: null } };
      expect(await resumen(sinDatos)).toEqual(sinDatos);
      expect(await exportar(SUCESO)).toBeDefined();
      expect(await exportar({ ...SUCESO, herramienta: null, asistente: "claude" })).toBeDefined();
    });

    it.each<[string, (r: typeof RESUMEN) => unknown]>([
      ["clave de más", (r) => ({ ...r, extra: 1 })],
      ["falta una clave", (r) => sin(r, "informes")],
      ["cerrada no booleano", (r) => ({ ...r, cerrada: "no" })],
      [
        "licencia con tipo desconocido",
        (r) => ({ ...r, licencias: [{ tipo: "C", estado: "activa" }] }),
      ],
      [
        "licencia con estado desconocido",
        (r) => ({ ...r, licencias: [{ tipo: "A", estado: "x" }] }),
      ],
      [
        "licencia con campo de más",
        (r) => ({ ...r, licencias: [{ tipo: "A", estado: "activa", x: 1 }] }),
      ],
      ["licencias que no es lista", (r) => ({ ...r, licencias: "A" })],
      ["conexiones con campo de más", (r) => ({ ...r, conexiones: { ...r.conexiones, x: 1 } })],
      ["conexiones sin campo", (r) => ({ ...r, conexiones: { total: 1, activas: 1 } })],
      ["entero negativo", (r) => ({ ...r, ordenes: { ...r.ordenes, pendiente: -1 } })],
      ["entero con decimales", (r) => ({ ...r, informes: 1.5 })],
      ["texto en un recuento", (r) => ({ ...r, ejecuciones: { total: CANARIO, cerradas: 0 } })],
      [
        "sucesos sin resultado",
        (r) => ({ ...r, sucesos: { total: 1, correcto: 1, rechazado: 0 } }),
      ],
      [
        "protocolo desconocido",
        (r) => ({ ...r, protocolos: { ...r.protocolos, "1999-01-01": 1 } }),
      ],
      ["p95 con texto", (r) => ({ ...r, p95_ms: { ...r.p95_ms, enviar_informe: "12" } })],
      ["p95 con herramienta desconocida", (r) => ({ ...r, p95_ms: { ...r.p95_ms, otra: 1 } })],
      ["p95 fuera de rango", (r) => ({ ...r, p95_ms: { ...r.p95_ms, confirmar_orden: 600001 } })],
    ])("resumen: %s se rechaza", async (_n, mutar) => {
      expect((await falla(resumen(mutar(RESUMEN)))).codigo).toBe("almacen_no_disponible");
    });

    it.each<[string, (s: typeof SUCESO) => unknown]>([
      ["campo de más", (s) => ({ ...s, extra: 1 })],
      ["falta un campo", (s) => sin(s, "codigo")],
      ["momento que no es fecha", (s) => ({ ...s, momento: CANARIO })],
      ["ruta con mayúsculas o texto libre", (s) => ({ ...s, ruta: "Ruta con espacios" })],
      ["herramienta desconocida", (s) => ({ ...s, herramienta: "borrar" })],
      ["resultado desconocido", (s) => ({ ...s, resultado: "exito" })],
      ["código con texto libre", (s) => ({ ...s, codigo: "Mensaje de error" })],
      ["duración negativa", (s) => ({ ...s, duracion_ms: -1 })],
      ["duración fuera de rango", (s) => ({ ...s, duracion_ms: 600001 })],
      ["protocolo desconocido", (s) => ({ ...s, protocolo: "x" })],
      ["asistente desconocido", (s) => ({ ...s, asistente: "otro asistente" })],
      ["un suceso que no es objeto", () => CANARIO],
    ])("exportación: %s se rechaza", async (_n, mutar) => {
      expect((await falla(exportar(mutar(SUCESO)))).codigo).toBe("almacen_no_disponible");
    });
  });
});

describe("autorizacion.ts: sobre el adaptador PGlite del rol de gestión (argumentos reales)", () => {
  it("recorre el ciclo de gestión: cliente, solicitud, activación, canje, renovación y operaciones", async () => {
    const bd = await abrir();
    const a = crearAutorizacion(await crearAlmacenPglite(bd, ROL_GESTION));

    // Clientes.
    expect(await a.leerCliente("https://c.ejemplo.test/x")).toEqual({ resultado: "desconocido" });
    expect(await a.guardarClienteCimd("https://c.ejemplo.test/x", [CB_CLAUDE])).toEqual({
      resultado: "guardado",
    });
    expect(await a.leerCliente("https://c.ejemplo.test/x")).toMatchObject({
      resultado: "conocido",
      origen: "cimd",
      redirectUris: [CB_CLAUDE],
    });
    const dcr = idDcr();
    expect(await a.registrarClienteDcr(origen("reg"), dcr, [CB_CLAUDE, CB_CHATGPT])).toEqual({
      resultado: "registrado",
    });
    expect(await a.registrarClienteDcr(origen("reg"), "malo", [CB_CLAUDE])).toEqual({
      resultado: "no_valido",
    });

    // Operación: generar un código y usarlo.
    const codigoHmac = hmacDe("codigo:ciclo");
    expect(await a.operarGenerarCodigo(origen("op"), "A", codigoHmac)).toEqual({
      resultado: "generado",
    });
    const solicitud = await a.abrirSolicitud(
      dcr,
      CB_CLAUDE,
      DESAFIO,
      RECURSO,
      hmacDe("s"),
      hmacDe("c"),
    );
    expect(solicitud.resultado).toBe("abierta");
    if (solicitud.resultado !== "abierta") throw new Error("solicitud");
    expect(
      await a.abrirSolicitud(dcr, CB_CLAUDE, "corto", RECURSO, hmacDe("s2"), hmacDe("c2")),
    ).toEqual({ resultado: "no_valida" });
    expect(
      await a.activar(
        solicitud.solicitud,
        hmacDe("c"),
        hmacDe("s"),
        origen("nav"),
        codigoHmac,
        hmacDe("aut"),
      ),
    ).toEqual({ resultado: "activada", redirectUri: CB_CLAUDE });
    expect(
      await a.canjearCodigo(
        hmacDe("aut"),
        dcr,
        CB_CLAUDE,
        DESAFIO,
        RECURSO,
        hmacDe("acc1"),
        hmacDe("ren1"),
      ),
    ).toEqual({ resultado: "emitido", expiresIn: 300 });
    expect(
      await a.renovar(hmacDe("ren1"), dcr, RECURSO, SAL, hmacDe("acc2"), hmacDe("ren2")),
    ).toEqual({
      resultado: "rotado",
      expiresIn: 300,
    });
    expect(
      await a.renovar(hmacDe("ren1"), dcr, RECURSO, SAL, hmacDe("acc2"), hmacDe("ren2")),
    ).toMatchObject({
      resultado: "repetido",
      sal: SAL,
    });

    const lista = await a.operarListarConexiones(origen("op"));
    expect(lista.resultado).toBe("listado");
    if (lista.resultado !== "listado") throw new Error("lista");
    expect(lista.conexiones).toHaveLength(1);
    const conexion = lista.conexiones[0]!;
    expect(await a.operarSuspenderLicencia(origen("op"), "A")).toEqual({ resultado: "suspendida" });
    expect(await a.operarReactivarLicencia(origen("op"), "A")).toEqual({ resultado: "reactivada" });
    expect(await a.operarCrearOrden(origen("op"), "A", "pausar")).toMatchObject({
      resultado: "creada",
    });
    expect(await a.operarRevocarConexion(origen("op"), conexion.id)).toEqual({
      resultado: "revocada",
    });
    expect((await a.operarResumen(origen("op"))).resultado).toBe("resumen");
    expect((await a.operarExportarSucesos(origen("op"), "2026-11-21")).resultado).toBe("exportado");
    expect(await a.operarContarFallo(origen("op"))).toEqual({ resultado: "contado" });

    // Cierre: terminal; lo que escribe se rechaza con `cerrada` y lo de lectura sigue.
    expect(await a.cerrarPrueba(origen("op"))).toEqual({ resultado: "prueba_cerrada" });
    expect(await a.cerrarPrueba(origen("op"))).toEqual({ resultado: "ya_cerrada" });
    expect(await a.operarGenerarCodigo(origen("op"), "A", hmacDe("codigo:otro"))).toEqual({
      resultado: "cerrada",
    });
    expect(await a.guardarClienteCimd("https://d.ejemplo.test/x", [CB_CLAUDE])).toEqual({
      resultado: "cerrada",
    });
    expect((await a.operarResumen(origen("op"))).resultado).toBe("resumen");
    expect(
      (await una<{ n: string }>(bd, `select count(*)::text as n from ${ESQUEMA}.cierre`)).n,
    ).toBe("1");
  });
});

describe("autorizacion.ts: adaptador de gestión sobre postgres (doble de la fábrica, sin red)", () => {
  const CA = readFileSync(
    join(process.cwd(), "supabase", "conector-prueba", "raiz-supabase.crt"),
    "utf8",
  );
  const URL_BD = [
    "postgresql://",
    "conector_prueba_gestion.ref",
    ":",
    "x".repeat(12),
    "@127.0.0.1:6543/postgres",
  ].join("");
  const doble = (unsafe: (q: string, p: unknown[]) => Promise<unknown>) => {
    const registro: {
      opciones?: Record<string, unknown>;
      consultas: { q: string; p: unknown[] }[];
    } = { consultas: [] };
    const fabrica = ((_u: string, o: Record<string, unknown>) => {
      registro.opciones = o;
      return {
        unsafe: (q: string, p: unknown[]) => {
          registro.consultas.push({ q, p });
          return unsafe(q, p);
        },
        end: () => Promise.resolve(),
      };
    }) as unknown as FabricaPostgres;
    return { fabrica, registro };
  };

  it("TLS verificado, sin sentencias preparadas; SQL fijo y valores por parámetros", async () => {
    const d = doble(() => Promise.resolve([{ r: { resultado: "guardado" } }]));
    const a = crearAdaptadorGestion({ url: URL_BD, ca: CA, fabrica: d.fabrica });
    expect(
      await a.llamar("guardar_cliente_cimd", ["https://c.test/x", [CB_CLAUDE, CB_CHATGPT]]),
    ).toEqual({
      resultado: "guardado",
    });
    expect(d.registro.opciones).toMatchObject({
      ssl: { ca: CA, rejectUnauthorized: true },
      prepare: false,
      fetch_types: false,
      max: 2,
    });
    // Las matrices viajan como literal de `text[]` con su conversión explícita.
    expect(d.registro.consultas[0]).toEqual({
      q: "select conector_prueba.guardar_cliente_cimd($1, $2::text[]) as r",
      p: ["https://c.test/x", `{"${CB_CLAUDE}","${CB_CHATGPT}"}`],
    });
  });

  it("sin raíz no se crea la conexión; otra función (también las del rol mcp) no se consulta", async () => {
    const d = doble(() => Promise.resolve([{ r: true }]));
    expect(() => crearAdaptadorGestion({ url: URL_BD, ca: " ", fabrica: d.fabrica })).toThrow(
      ErrorDeAplicacion,
    );
    const a = crearAdaptadorGestion({ url: URL_BD, ca: CA, fabrica: d.fabrica });
    for (const nombre of [
      "validar_acceso",
      "mcp_obtener_instrucciones",
      "registrar_suceso",
      "pg_sleep",
      "activar; x",
      "",
    ]) {
      expect((await falla(a.llamar(nombre, []))).codigo).toBe("almacen_no_disponible");
    }
    expect(d.registro.consultas).toEqual([]);
  });

  it("un error de postgres con contenido se sustituye por el código fijo, sin causa", async () => {
    const d = doble(() =>
      Promise.reject(Object.assign(new Error(`detalle ${CANARIO}`), { detail: CANARIO })),
    );
    const a = crearAdaptadorGestion({ url: URL_BD, ca: CA, fabrica: d.fabrica });
    const e = await falla(a.llamar("cerrar_prueba", [H]));
    expect(e.codigo).toBe("almacen_no_disponible");
    expect(JSON.stringify(e) + e.message + String(e.stack)).not.toContain(CANARIO);
  });

  it("escapa comillas y barras en el literal de la matriz", async () => {
    const d = doble(() => Promise.resolve([{ r: { resultado: "no_valido" } }]));
    const a = crearAdaptadorGestion({ url: URL_BD, ca: CA, fabrica: d.fabrica });
    await a.llamar("guardar_cliente_cimd", ["x", [String.raw`a"b\c`]]);
    expect(d.registro.consultas[0]!.p[1]).toBe(String.raw`{"a\"b\\c"}`);
  });
});
