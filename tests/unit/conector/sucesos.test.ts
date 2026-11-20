// T-105 (b) (001): sucesos.ts. PRUEBA-019 (parte): el suceso se registra tras responder; lo marcado
// (canario) no llega a la tabla de sucesos ni a la consola; si el registro falla, se descarta y la
// respuesta no cambia. Valores sembrados compuestos en ejecución (arts. 1 y 4).
import { afterEach, describe, expect, it, vi } from "vitest";
import { registrarSucesoTrasResponder } from "../../../src/lib/registro/sucesos";
import { crearAlmacen, type Almacen, type SucesoAlmacen } from "../../../src/lib/supabase/almacen";
import { capturarConsola, crearAlmacenPglite, crearSumidero } from "../../conector/apoyo/index";
import { abrir, cerrarAlFinal, ROL_MCP, sembrar } from "./bd/comun";

cerrarAlFinal();
afterEach(() => vi.restoreAllMocks());

const CANARIO = "TEXTO-CANARIO-" + "SUCESO-123";
const base: SucesoAlmacen = {
  tokenHmac: null,
  ruta: "api/mcp",
  herramienta: "obtener_instrucciones",
  resultado: "correcto",
  codigo: "ok",
  duracionMs: 7,
  protocolo: "2025-11-25",
};

// «Después de responder»: el doble acumula las tareas; la prueba las ejecuta cuando la respuesta ya salió.
function programador() {
  const tareas: (() => Promise<void>)[] = [];
  return {
    despues: (t: () => Promise<void>) => void tareas.push(t),
    ejecutar: async () => {
      for (const t of tareas.splice(0)) await t();
    },
    pendientes: () => tareas.length,
  };
}

const cuenta = async (bd: Awaited<ReturnType<typeof abrir>>) =>
  (await bd.db.query<{ n: number }>("select count(*)::int as n from conector_prueba.sucesos"))
    .rows[0]!.n;

describe("sucesos: tras responder (PRUEBA-019, parte)", () => {
  it("no escribe antes de que la respuesta salga y escribe un suceso después", async () => {
    const bd = await abrir();
    const a = await sembrar(bd, "A", "chatgpt");
    const almacen = crearAlmacen(await crearAlmacenPglite(bd, ROL_MCP));
    const p = programador();
    registrarSucesoTrasResponder(almacen, { ...base, tokenHmac: a.acceso.hmac }, p.despues);
    expect(p.pendientes()).toBe(1);
    expect(await cuenta(bd)).toBe(0);
    await p.ejecutar();
    expect(await cuenta(bd)).toBe(1);
    const fila = (
      await bd.db.query<Record<string, unknown>>(
        "select ruta, herramienta, resultado::text, codigo, duracion_ms, protocolo, asistente::text from conector_prueba.sucesos",
      )
    ).rows[0];
    expect(fila).toEqual({
      ruta: "api/mcp",
      herramienta: "obtener_instrucciones",
      resultado: "correcto",
      codigo: "ok",
      duracion_ms: 7,
      protocolo: "2025-11-25",
      asistente: "chatgpt",
    });
  });

  it("lo marcado en cualquier campo se descarta: 0 en sucesos y 0 en la consola", async () => {
    const bd = await abrir();
    const almacen = crearAlmacen(await crearAlmacenPglite(bd, ROL_MCP));
    const sumidero = crearSumidero();
    const captura = capturarConsola(sumidero);
    try {
      const p = programador();
      const marcados: Partial<SucesoAlmacen>[] = [
        { ruta: CANARIO },
        { ruta: `api/mcp?x=${CANARIO}` },
        { codigo: CANARIO },
        { codigo: `ok ${CANARIO}` },
        { herramienta: CANARIO as never },
        { resultado: CANARIO as never },
        { protocolo: CANARIO as never },
        { tokenHmac: CANARIO },
      ];
      for (const m of marcados) registrarSucesoTrasResponder(almacen, { ...base, ...m }, p.despues);
      await p.ejecutar();
      expect(await cuenta(bd)).toBe(0);
      expect(sumidero.hallar(CANARIO)).toEqual([]);
      const volcado = (await bd.db.query("select s::text from conector_prueba.sucesos s")).rows;
      expect(JSON.stringify(volcado)).not.toContain(CANARIO);
    } finally {
      captura.restaurar();
    }
  });

  it("valores fuera de rango o de lista cerrada no llegan al almacén", async () => {
    const llamar = vi.fn(() => Promise.resolve({ resultado: "registrado" }));
    const almacen = crearAlmacen({ llamar });
    const p = programador();
    for (const m of [
      { duracionMs: -1 },
      { duracionMs: 600001 },
      { duracionMs: 1.5 },
      { duracionMs: Number.NaN },
      { protocolo: "1999" as never },
      { herramienta: "otra_herramienta" as never },
      { resultado: "ok" as never },
      { codigo: "registro_saturado" },
      { codigo: "" },
      { ruta: "" },
      { ruta: "API/MCP" },
      { tokenHmac: "ZZ" },
    ]) {
      registrarSucesoTrasResponder(almacen, { ...base, ...m }, p.despues);
    }
    await p.ejecutar();
    expect(llamar).not.toHaveBeenCalled();
  });

  it("si el almacén falla, el suceso se descarta sin error y sin valores en la consola", async () => {
    const sumidero = crearSumidero();
    const captura = capturarConsola(sumidero);
    try {
      const almacen: Almacen = crearAlmacen({
        llamar: () => Promise.reject(Object.assign(new Error(CANARIO), { detail: CANARIO })),
      });
      const p = programador();
      expect(() => registrarSucesoTrasResponder(almacen, base, p.despues)).not.toThrow();
      await expect(p.ejecutar()).resolves.toBeUndefined();
      expect(sumidero.hallar(CANARIO)).toEqual([]);
    } finally {
      captura.restaurar();
    }
  });

  it("si el almacén falla no se reintenta y una llamada posterior no se ve afectada", async () => {
    let n = 0;
    const almacen = crearAlmacen({
      llamar: () => {
        n++;
        return n === 1
          ? Promise.reject(new Error("caído"))
          : Promise.resolve({ resultado: "registrado" });
      },
    });
    const p = programador();
    registrarSucesoTrasResponder(almacen, base, p.despues);
    await p.ejecutar();
    expect(n).toBe(1);
    registrarSucesoTrasResponder(almacen, base, p.despues);
    await p.ejecutar();
    expect(n).toBe(2);
  });

  it("si el programador falla (fuera de una petición), se descarta sin error", () => {
    const almacen = crearAlmacen({ llamar: () => Promise.resolve({ resultado: "registrado" }) });
    const roto = () => {
      throw new Error(CANARIO);
    };
    expect(() => registrarSucesoTrasResponder(almacen, base, roto)).not.toThrow();
  });

  it("con el programador por defecto, fuera de una petición, no lanza", () => {
    const llamar = vi.fn(() => Promise.resolve({ resultado: "registrado" }));
    expect(() => registrarSucesoTrasResponder(crearAlmacen({ llamar }), base)).not.toThrow();
  });
});
