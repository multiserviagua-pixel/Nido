// T-105 (c) (001): herramienta obtener_instrucciones. PRUEBA-015 (tres estados; 0 marcas sin `activa`),
// PRUEBA-016 (prompt ilegible o de otra huella -> 503, sin tocar el almacén) y PRUEBA-018 (parte: almacén
// caído -> `error_temporal`, sin instrucciones). Sobre PGlite con el SQL real (T-103 d).
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ErrorDeAplicacion } from "../../../src/lib/plataforma/errores";
import { crearAlmacen, type Almacen } from "../../../src/lib/supabase/almacen";
import { validarSalida } from "../../../src/mcp/esquemas/contratos";
import { crearObtenerInstrucciones } from "../../../src/mcp/herramientas/obtener-instrucciones";
import {
  crearLectorPrompt,
  HUELLA_PROMPT_FICTICIO,
  obtenerPromptFicticio,
  REGLAS_FICTICIAS,
} from "../../../src/mcp/prompt-ficticio";
import { crearAlmacenPglite } from "../../conector/apoyo/index";
import {
  abrir,
  cerrarAlFinal,
  ESQUEMA,
  RECURSO,
  ROL_MCP,
  sembrar,
  sembrarOrden,
  una,
} from "./bd/comun";

cerrarAlFinal();
afterEach(() => vi.restoreAllMocks());

const MARCA = "MARCA-PROMPT-FICTICIO-0001";
const TEXTO = readFileSync(join(process.cwd(), "prompts", "agente-prueba", "0.1.md"), "utf8");

async function montar() {
  const bd = await abrir();
  const almacen = crearAlmacen(await crearAlmacenPglite(bd, ROL_MCP));
  return { bd, almacen };
}
const herramientaDe = (almacen: Almacen) =>
  crearObtenerInstrucciones({ almacen, prompt: obtenerPromptFicticio });

describe("obtener_instrucciones: tres estados (PRUEBA-015)", () => {
  it("activa: versión, huella, texto íntegro y reglas constantes; la salida valida con el contrato", async () => {
    const { bd, almacen } = await montar();
    const a = await sembrar(bd, "A");
    const r = await herramientaDe(almacen)({ tokenHmac: a.acceso.hmac, recurso: RECURSO });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.salida).toEqual({
      estado: "activa",
      ejecucion_id: expect.stringMatching(/^[0-9a-f-]{36}$/),
      orden: null,
      instrucciones: {
        version: "0.1",
        huella_sha256: HUELLA_PROMPT_FICTICIO,
        prompt: TEXTO,
        reglas: { ...REGLAS_FICTICIAS },
      },
    });
    expect(validarSalida("obtener_instrucciones")(r.salida)).toBe(true);
    expect(JSON.stringify(r.salida)).toContain(MARCA);
    // La ejecución devuelta existe y es de esta conexión.
    const e = await una<{ conexion_id: string; estado_servido: string }>(
      bd,
      `select conexion_id::text, estado_servido::text from ${ESQUEMA}.ejecuciones where id = $1`,
      [r.salida.ejecucion_id],
    );
    expect(e).toEqual({ conexion_id: a.conexionId, estado_servido: "activa" });
  });

  it("pausada: estado explícito, orden si la hay, sin instrucciones y 0 marcas", async () => {
    const { bd, almacen } = await montar();
    const a = await sembrar(bd, "A");
    const orden = await sembrarOrden(bd, a.licenciaId, "pausar", "pendiente");
    const r = await herramientaDe(almacen)({ tokenHmac: a.acceso.hmac, recurso: RECURSO });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.salida).toMatchObject({
      estado: "pausada",
      orden: { id: orden, tipo: "pausar" },
      instrucciones: null,
    });
    expect(JSON.stringify(r.salida)).not.toContain(MARCA);
    expect(JSON.stringify(r.salida)).not.toContain(HUELLA_PROMPT_FICTICIO);
    expect(validarSalida("obtener_instrucciones")(r.salida)).toBe(true);
  });

  it("suspendida: sin orden (sigue pendiente), sin instrucciones y 0 marcas", async () => {
    const { bd, almacen } = await montar();
    const a = await sembrar(bd, "A");
    const orden = await sembrarOrden(bd, a.licenciaId, "pausar", "pendiente");
    await bd.db.query(`update ${ESQUEMA}.licencias set estado = 'suspendida' where id = $1`, [
      a.licenciaId,
    ]);
    const r = await herramientaDe(almacen)({ tokenHmac: a.acceso.hmac, recurso: RECURSO });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.salida).toMatchObject({ estado: "suspendida", orden: null, instrucciones: null });
    expect(JSON.stringify(r.salida)).not.toContain(MARCA);
    expect(validarSalida("obtener_instrucciones")(r.salida)).toBe(true);
    const o = await una<{ estado: string }>(
      bd,
      `select estado::text from ${ESQUEMA}.ordenes where id = $1`,
      [orden],
    );
    expect(o.estado).toBe("pendiente");
  });

  it("reanudada: tras una orden de reanudar vuelve a activa con instrucciones", async () => {
    const { bd, almacen } = await montar();
    const a = await sembrar(bd, "A");
    await sembrarOrden(bd, a.licenciaId, "pausar", "confirmada", "10 seconds");
    const reanudar = await sembrarOrden(bd, a.licenciaId, "reanudar", "pendiente");
    const r = await herramientaDe(almacen)({ tokenHmac: a.acceso.hmac, recurso: RECURSO });
    expect(r.ok && r.salida).toMatchObject({
      estado: "activa",
      orden: { id: reanudar, tipo: "reanudar" },
    });
    if (r.ok) expect(JSON.stringify(r.salida)).toContain(MARCA);
  });

  it("token no válido: no_autorizado y nada de instrucciones", async () => {
    const { almacen } = await montar();
    const r = await herramientaDe(almacen)({ tokenHmac: "b".repeat(64), recurso: RECURSO });
    expect(r).toEqual({ ok: false, codigo: "no_autorizado" });
  });

  it("dos llamadas a la vez: dos ejecuciones distintas y la orden entregada una sola vez", async () => {
    const { bd, almacen } = await montar();
    const a = await sembrar(bd, "A");
    const orden = await sembrarOrden(bd, a.licenciaId, "pausar", "pendiente");
    const h = herramientaDe(almacen);
    const [x, y] = await Promise.all([
      h({ tokenHmac: a.acceso.hmac, recurso: RECURSO }),
      h({ tokenHmac: a.acceso.hmac, recurso: RECURSO }),
    ]);
    expect(x.ok && y.ok).toBe(true);
    if (x.ok && y.ok) expect(x.salida.ejecucion_id).not.toBe(y.salida.ejecucion_id);
    const n = await una<{ n: number }>(
      bd,
      `select count(*)::int as n from ${ESQUEMA}.ordenes where id = $1 and estado = 'entregada'`,
      [orden],
    );
    expect(n.n).toBe(1);
  });
});

describe("obtener_instrucciones: prompt no disponible -> 503 (PRUEBA-016)", () => {
  const lectorCon = (bytes: () => Uint8Array) => crearLectorPrompt({ ruta: "x.md", leer: bytes });
  const cambiado = () => {
    const b = Buffer.from(TEXTO, "utf8");
    b[0] = b[0]! ^ 1;
    return b;
  };

  for (const [nombre, lector] of [
    ["huella distinta", lectorCon(cambiado)],
    [
      "archivo ilegible",
      lectorCon(() => {
        throw new Error("no se lee");
      }),
    ],
    ["archivo vacío", lectorCon(() => new Uint8Array())],
  ] as const) {
    it(`${nombre}: configuracion_conector_invalida y el almacén ni se toca (ni ejecución ni orden marcada)`, async () => {
      const { bd, almacen } = await montar();
      const a = await sembrar(bd, "A");
      const orden = await sembrarOrden(bd, a.licenciaId, "pausar", "pendiente");
      const h = crearObtenerInstrucciones({ almacen, prompt: lector });
      await expect(h({ tokenHmac: a.acceso.hmac, recurso: RECURSO })).rejects.toMatchObject({
        codigo: "configuracion_conector_invalida",
      });
      const e = await una<{ n: number }>(
        bd,
        `select count(*)::int as n from ${ESQUEMA}.ejecuciones`,
      );
      expect(e.n).toBe(0);
      const o = await una<{ estado: string }>(
        bd,
        `select estado::text from ${ESQUEMA}.ordenes where id = $1`,
        [orden],
      );
      expect(o.estado).toBe("pendiente");
    });
  }
});

describe("obtener_instrucciones: almacén caído (PRUEBA-018, parte)", () => {
  it("devuelve error_temporal, sin prompt, reglas ni datos", async () => {
    const consola = vi.spyOn(console, "log").mockImplementation(() => undefined);
    const almacen = crearAlmacen({ llamar: () => Promise.reject(new Error("caído")) });
    const r = await herramientaDe(almacen)({ tokenHmac: "a".repeat(64), recurso: RECURSO });
    expect(r).toEqual({ ok: false, codigo: "error_temporal" });
    expect(consola).not.toHaveBeenCalled();
  });

  it("un error que no es del almacén no se disfraza: se propaga", async () => {
    const almacen = {
      validarAcceso: () => Promise.resolve(true),
      registrarSuceso: () => Promise.resolve(),
      obtenerInstrucciones: () => Promise.reject(new ErrorDeAplicacion("error_no_controlado")),
    } as unknown as Almacen;
    await expect(
      herramientaDe(almacen)({ tokenHmac: "a".repeat(64), recurso: RECURSO }),
    ).rejects.toMatchObject({
      codigo: "error_no_controlado",
    });
  });

  it("salida que no valida con el contrato -> error_interno, sin instrucciones", async () => {
    const almacen = crearAlmacen({
      llamar: () =>
        Promise.resolve({
          resultado: "servido",
          estado: "activa",
          ejecucion_id: "11111111-1111-4111-8111-111111111111",
          orden: null,
        }),
    });
    const h = crearObtenerInstrucciones({
      almacen,
      prompt: () => ({ version: "no-es-version", texto: "x", huella: HUELLA_PROMPT_FICTICIO }),
    });
    expect(await h({ tokenHmac: "a".repeat(64), recurso: RECURSO })).toEqual({
      ok: false,
      codigo: "error_interno",
    });
  });
});
