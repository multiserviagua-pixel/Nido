// T-105 (a) (001): almacen.ts, adaptador inyectable. PRUEBA-018 (parte): almacén caído, 5 s y respuesta
// que no es la esperada -> `almacen_no_disponible` sin valores ni mensajes de la base (art. 3). Con el
// adaptador PGlite de la batería se comprueba también que las llamadas de producto coinciden con las
// funciones SQL reales (nombre y orden de los argumentos).
import { afterEach, describe, expect, it, vi } from "vitest";
import { ErrorDeAplicacion } from "../../../src/lib/plataforma/errores";
import {
  crearAlmacen,
  TIEMPO_LLAMADA_MS,
  type AdaptadorAlmacen,
} from "../../../src/lib/supabase/almacen";
import { crearAlmacenPglite } from "../../conector/apoyo/index";
import { abrir, cerrarAlFinal, RECURSO, ROL_MCP, sembrar, sembrarOrden } from "./bd/comun";

cerrarAlFinal();
afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

const CANARIO = "TEXTO-CANARIO-" + "ALMACEN-123";
const HMAC = "a".repeat(64);
const UUID = "11111111-1111-4111-8111-111111111111";

const adaptadorDe = (respuesta: unknown) => {
  const llamadas: { funcion: string; argumentos: unknown[] }[] = [];
  const adaptador: AdaptadorAlmacen = {
    llamar: (funcion, argumentos) => {
      llamadas.push({ funcion, argumentos });
      return Promise.resolve(respuesta);
    },
  };
  return { adaptador, llamadas };
};

const SUCESO = {
  tokenHmac: null,
  ruta: "api/mcp",
  herramienta: null,
  resultado: "error",
  codigo: "x",
  duracionMs: 1,
  protocolo: "otra",
} as const;

async function falla(promesa: Promise<unknown>): Promise<ErrorDeAplicacion> {
  try {
    await promesa;
  } catch (e) {
    expect(e).toBeInstanceOf(ErrorDeAplicacion);
    return e as ErrorDeAplicacion;
  }
  throw new Error("no falló");
}

describe("almacén de producto sobre el adaptador PGlite (PRUEBA-018, parte: camino correcto)", () => {
  it("validarAcceso: verdadero con el token sembrado y falso con otro HMAC u otro recurso", async () => {
    const bd = await abrir();
    const a = await sembrar(bd, "A");
    const almacen = crearAlmacen(await crearAlmacenPglite(bd, ROL_MCP));
    expect(await almacen.validarAcceso(a.acceso.hmac, RECURSO)).toBe(true);
    expect(await almacen.validarAcceso("b".repeat(64), RECURSO)).toBe(false);
    expect(await almacen.validarAcceso(a.acceso.hmac, RECURSO + "/otro")).toBe(false);
  });

  it("obtenerInstrucciones: servido con estado, ejecución y orden; no_autorizado sin más", async () => {
    const bd = await abrir();
    const a = await sembrar(bd, "A");
    const orden = await sembrarOrden(bd, a.licenciaId, "pausar", "pendiente");
    const almacen = crearAlmacen(await crearAlmacenPglite(bd, ROL_MCP));
    const r = await almacen.obtenerInstrucciones(a.acceso.hmac, RECURSO);
    expect(r).toEqual({
      resultado: "servido",
      estado: "pausada",
      ejecucion_id: expect.stringMatching(/^[0-9a-f-]{36}$/),
      orden: { id: orden, tipo: "pausar" },
    });
    expect(await almacen.obtenerInstrucciones("b".repeat(64), RECURSO)).toEqual({
      resultado: "no_autorizado",
    });
  });

  it("registrarSuceso: registrado en la tabla de sucesos", async () => {
    const bd = await abrir();
    const a = await sembrar(bd, "A");
    const almacen = crearAlmacen(await crearAlmacenPglite(bd, ROL_MCP));
    await almacen.registrarSuceso({
      tokenHmac: a.acceso.hmac,
      ruta: "api/mcp",
      herramienta: "obtener_instrucciones",
      resultado: "correcto",
      codigo: "ok",
      duracionMs: 12,
      protocolo: "2025-11-25",
    });
    const n = await bd.db.query<{ n: number }>(
      "select count(*)::int as n from conector_prueba.sucesos where ruta = 'api/mcp'",
    );
    expect(n.rows[0]!.n).toBe(1);
  });
});

describe("almacén: SQL fijo y argumentos en orden", () => {
  it("cada método llama a su función con sus argumentos y nada más", async () => {
    const v = adaptadorDe(true);
    await crearAlmacen(v.adaptador).validarAcceso(HMAC, RECURSO);
    expect(v.llamadas).toEqual([{ funcion: "validar_acceso", argumentos: [HMAC, RECURSO] }]);

    const o = adaptadorDe({
      resultado: "servido",
      estado: "activa",
      ejecucion_id: UUID,
      orden: null,
    });
    await crearAlmacen(o.adaptador).obtenerInstrucciones(HMAC, RECURSO);
    expect(o.llamadas).toEqual([
      { funcion: "mcp_obtener_instrucciones", argumentos: [HMAC, RECURSO] },
    ]);

    const s = adaptadorDe({ resultado: "registrado" });
    await crearAlmacen(s.adaptador).registrarSuceso({
      ...SUCESO,
      resultado: "rechazado",
      codigo: "no_autorizado",
      duracionMs: 3,
    });
    expect(s.llamadas).toEqual([
      {
        funcion: "registrar_suceso",
        argumentos: [null, "api/mcp", null, "rechazado", "no_autorizado", 3, "otra"],
      },
    ]);
  });
});

describe("almacén caído, lento o con respuesta inesperada (PRUEBA-018, parte)", () => {
  it("un fallo del adaptador es almacen_no_disponible, sin mensaje, causa ni valores", async () => {
    const consola = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const mala: AdaptadorAlmacen = {
      llamar: () =>
        Promise.reject(
          Object.assign(new Error(`falló con ${CANARIO}`), {
            detail: CANARIO,
            where: CANARIO,
            code: "XX000",
          }),
        ),
    };
    const e = await falla(crearAlmacen(mala).validarAcceso(HMAC, RECURSO));
    expect(e.codigo).toBe("almacen_no_disponible");
    expect(e.message).toBe("almacen_no_disponible");
    expect((e as { cause?: unknown }).cause).toBeUndefined();
    expect(JSON.stringify(e) + String(e.stack)).not.toContain(CANARIO);
    expect(consola).not.toHaveBeenCalled();
  });

  it("cada método falla cerrado cuando el adaptador cae", async () => {
    const mala: AdaptadorAlmacen = { llamar: () => Promise.reject(new Error("caído")) };
    const almacen = crearAlmacen(mala);
    for (const f of [
      () => almacen.validarAcceso(HMAC, RECURSO),
      () => almacen.obtenerInstrucciones(HMAC, RECURSO),
      () => almacen.registrarSuceso(SUCESO),
    ]) {
      expect((await falla(f())).codigo).toBe("almacen_no_disponible");
    }
  });

  it("una llamada que no responde en 5 s falla; antes de los 5 s sigue pendiente", async () => {
    vi.useFakeTimers();
    expect(TIEMPO_LLAMADA_MS).toBe(5000);
    const colgado: AdaptadorAlmacen = { llamar: () => new Promise(() => undefined) };
    const promesa = crearAlmacen(colgado).validarAcceso(HMAC, RECURSO);
    let estado = "pendiente";
    promesa.catch(() => (estado = "rechazada"));
    await vi.advanceTimersByTimeAsync(4999);
    expect(estado).toBe("pendiente");
    await vi.advanceTimersByTimeAsync(1);
    expect(estado).toBe("rechazada");
    expect((await falla(promesa)).codigo).toBe("almacen_no_disponible");
  });

  it("una respuesta tardía tras el plazo no cambia nada", async () => {
    vi.useFakeTimers();
    let resolver: (v: unknown) => void = () => undefined;
    const lento: AdaptadorAlmacen = { llamar: () => new Promise((r) => (resolver = r)) };
    const resultado = falla(crearAlmacen(lento).validarAcceso(HMAC, RECURSO));
    await vi.advanceTimersByTimeAsync(5000);
    resolver(true);
    expect((await resultado).codigo).toBe("almacen_no_disponible");
  });

  it("respuestas que no son de la forma cerrada se tratan como almacén caído", async () => {
    for (const mala of ["true", 1, null, undefined, {}, [], { resultado: true }]) {
      const e = await falla(crearAlmacen(adaptadorDe(mala).adaptador).validarAcceso(HMAC, RECURSO));
      expect(e.codigo).toBe("almacen_no_disponible");
    }
    const malas: unknown[] = [
      null,
      "servido",
      { resultado: "otro" },
      { resultado: "servido" },
      { resultado: "servido", estado: "otro", ejecucion_id: UUID, orden: null },
      { resultado: "servido", estado: "activa", ejecucion_id: "no-uuid", orden: null },
      {
        resultado: "servido",
        estado: "activa",
        ejecucion_id: UUID,
        orden: { id: UUID, tipo: "borrar" },
      },
      { resultado: "servido", estado: "activa", ejecucion_id: UUID, orden: null, extra: CANARIO },
    ];
    for (const mala of malas) {
      const e = await falla(
        crearAlmacen(adaptadorDe(mala).adaptador).obtenerInstrucciones(HMAC, RECURSO),
      );
      expect(e.codigo).toBe("almacen_no_disponible");
      expect(JSON.stringify(e)).not.toContain(CANARIO);
    }
  });

  it("registrarSuceso con una respuesta ajena también falla cerrado", async () => {
    const e = await falla(
      crearAlmacen(adaptadorDe({ resultado: "otro" }).adaptador).registrarSuceso(SUCESO),
    );
    expect(e.codigo).toBe("almacen_no_disponible");
  });
});
