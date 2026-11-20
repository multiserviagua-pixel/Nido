// T-105 (f) (001): herramienta confirmar_orden y `confirmarOrden` del almacén. PRUEBA-007 (parte: 10
// llamadas con la misma orden -> 1 confirmación y 9 `repetida`; una sola conexión PGlite, no demuestra
// carreras reales: eso es la 008) y PRUEBA-017 (parte: orden ajena, inexistente, mal formada o no
// entregada, igual en todos los casos y sin eco). Valores marcados compuestos en ejecución.
import { randomUUID } from "node:crypto";
import { describe, expect, it, vi } from "vitest";
import { ErrorDeAplicacion } from "../../../src/lib/plataforma/errores";
import { crearAlmacen, type Almacen } from "../../../src/lib/supabase/almacen";
import { validarSalida } from "../../../src/mcp/esquemas/contratos";
import { crearConfirmarOrden } from "../../../src/mcp/herramientas/confirmar-orden";
import {
  capturarConsola,
  crearAlmacenPglite,
  crearSumidero,
  type BdApoyo,
} from "../../conector/apoyo/index";
import {
  abrir,
  cerrarAlFinal,
  ESQUEMA,
  huellaDeLicencia,
  RECURSO,
  ROL_MCP,
  sembrar,
  sembrarOrden,
  una,
  type Sembrado,
} from "./bd/comun";

cerrarAlFinal();

const CANARIO = `TEXTO-CANARIO-${randomUUID()}`;
const NO_CONFIRMADA = { ok: true, salida: { confirmada: false } };

async function montar() {
  const bd = await abrir();
  const almacen = crearAlmacen(await crearAlmacenPglite(bd, ROL_MCP));
  const herramienta = crearConfirmarOrden({ almacen });
  const s = await sembrar(bd, "A");
  return { bd, almacen, herramienta, s };
}
const contexto = (s: Sembrado) => ({ tokenHmac: s.acceso.hmac, recurso: RECURSO });
const estadoOrden = async (bd: BdApoyo, id: string) =>
  (
    await una<{ e: string }>(bd, `select estado::text as e from ${ESQUEMA}.ordenes where id = $1`, [
      id,
    ])
  ).e;
// La orden se entrega de verdad con obtener_instrucciones (camino real).
async function entregada(bd: BdApoyo, almacen: Almacen, s: Sembrado): Promise<string> {
  const orden = await sembrarOrden(bd, s.licenciaId, "pausar", "pendiente");
  const r = await almacen.obtenerInstrucciones(s.acceso.hmac, RECURSO);
  if (r.resultado !== "servido" || r.orden?.id !== orden) throw new Error("siembra");
  return orden;
}

describe("confirmar_orden: orden entregada (PRUEBA-007, parte)", () => {
  it("confirma una orden entregada y responde con el contrato", async () => {
    const { bd, almacen, herramienta, s } = await montar();
    const orden = await entregada(bd, almacen, s);
    const r = await herramienta(contexto(s), { orden_id: orden });
    expect(r).toEqual({ ok: true, salida: { confirmada: true } });
    if (r.ok) expect(validarSalida("confirmar_orden")(r.salida)).toBe(true);
    expect(await estadoOrden(bd, orden)).toBe("confirmada");
  });

  it("repetir no falla ni cambia nada: repetida", async () => {
    const { bd, almacen, herramienta, s } = await montar();
    const orden = await entregada(bd, almacen, s);
    await herramienta(contexto(s), { orden_id: orden });
    const antes = await huellaDeLicencia(bd, s.licenciaId);
    const r = await herramienta(contexto(s), { orden_id: orden });
    expect(r).toEqual({ ok: true, salida: { confirmada: true, repetida: true } });
    if (r.ok) expect(validarSalida("confirmar_orden")(r.salida)).toBe(true);
    expect(await huellaDeLicencia(bd, s.licenciaId)).toBe(antes);
  });

  it("10 llamadas con la misma orden: 1 confirmación y 9 repetida", async () => {
    const { bd, almacen, herramienta, s } = await montar();
    const orden = await entregada(bd, almacen, s);
    const rs = await Promise.all(
      Array.from({ length: 10 }, () => herramienta(contexto(s), { orden_id: orden })),
    );
    const salidas = rs.map((r) => (r.ok ? r.salida : null));
    expect(salidas.filter((x) => x?.repetida === true)).toHaveLength(9);
    expect(salidas.filter((x) => x?.confirmada === true && x.repetida === undefined)).toHaveLength(
      1,
    );
    expect(await estadoOrden(bd, orden)).toBe("confirmada");
  });

  it("campos de más en los argumentos se ignoran: solo cuenta orden_id", async () => {
    const { bd, almacen, herramienta, s } = await montar();
    const orden = await entregada(bd, almacen, s);
    const r = await herramienta(contexto(s), {
      orden_id: orden,
      licencia_id: randomUUID(),
      [`x_${CANARIO}`]: CANARIO,
    });
    expect(r).toEqual({ ok: true, salida: { confirmada: true } });
    expect(JSON.stringify(r)).not.toContain(CANARIO);
  });
});

describe("confirmar_orden: confirmada false, igual en todos los casos (PRUEBA-017, parte)", () => {
  it("inexistente, mal formada, no entregada, anulada y de otra licencia: confirmada false y sin efecto", async () => {
    const { bd, almacen, herramienta, s } = await montar();
    const b = await sembrar(bd, "B");
    const deB = await entregada(bd, almacen, b);
    const pendiente = await sembrarOrden(bd, s.licenciaId, "reanudar", "pendiente", "1 hour");
    const anulada = await sembrarOrden(bd, s.licenciaId, "pausar", "anulada", "2 hours");
    const sumidero = crearSumidero();
    const captura = capturarConsola(sumidero);
    try {
      const antesA = await huellaDeLicencia(bd, s.licenciaId);
      const antesB = await huellaDeLicencia(bd, b.licenciaId);
      for (const id of [randomUUID(), CANARIO, deB, pendiente, anulada, 5, null, undefined, ""]) {
        const r = await herramienta(contexto(s), { orden_id: id });
        expect(r).toEqual(NO_CONFIRMADA);
        sumidero.registrar("respuesta", r);
      }
      expect(sumidero.hallar(CANARIO)).toEqual([]);
      expect(await huellaDeLicencia(bd, s.licenciaId)).toBe(antesA);
      expect(await huellaDeLicencia(bd, b.licenciaId)).toBe(antesB);
      expect(await estadoOrden(bd, deB)).toBe("entregada");
    } finally {
      captura.restaurar();
    }
  });

  it("argumentos que no son un objeto: confirmada false, sin tocar el almacén", async () => {
    const llamar = vi.fn(() => Promise.resolve(true));
    const h = crearConfirmarOrden({ almacen: crearAlmacen({ llamar }) });
    for (const args of [null, CANARIO, [randomUUID()], 5, undefined]) {
      expect(await h({ tokenHmac: "a".repeat(64), recurso: RECURSO }, args)).toEqual(NO_CONFIRMADA);
    }
    expect(llamar).not.toHaveBeenCalled();
  });

  it("un orden_id que no es uuid no llega al almacén", async () => {
    const llamar = vi.fn(() => Promise.resolve(true));
    const h = crearConfirmarOrden({ almacen: crearAlmacen({ llamar }) });
    expect(await h({ tokenHmac: "a".repeat(64), recurso: RECURSO }, { orden_id: CANARIO })).toEqual(
      NO_CONFIRMADA,
    );
    expect(llamar).not.toHaveBeenCalled();
  });

  it("token no válido: no_autorizado", async () => {
    const { herramienta } = await montar();
    const r = await herramienta(
      { tokenHmac: "b".repeat(64), recurso: RECURSO },
      { orden_id: randomUUID() },
    );
    expect(r).toEqual({ ok: false, codigo: "no_autorizado" });
  });
});

describe("confirmar_orden: almacén caído y errores (PRUEBA-018, parte)", () => {
  it("almacén caído -> error_temporal, sin confirmada y sin valores en la consola", async () => {
    const sumidero = crearSumidero();
    const captura = capturarConsola(sumidero);
    try {
      const almacen = crearAlmacen({
        llamar: () => Promise.reject(Object.assign(new Error(CANARIO), { detail: CANARIO })),
      });
      const r = await crearConfirmarOrden({ almacen })(
        { tokenHmac: "a".repeat(64), recurso: RECURSO },
        { orden_id: randomUUID() },
      );
      expect(r).toEqual({ ok: false, codigo: "error_temporal" });
      expect(sumidero.hallar(CANARIO)).toEqual([]);
    } finally {
      captura.restaurar();
    }
  });

  it("un error que no es del almacén se propaga con su código cerrado", async () => {
    const almacen = {
      confirmarOrden: () => Promise.reject(new ErrorDeAplicacion("error_no_controlado")),
    } as unknown as Almacen;
    await expect(
      crearConfirmarOrden({ almacen })(
        { tokenHmac: "a".repeat(64), recurso: RECURSO },
        { orden_id: randomUUID() },
      ),
    ).rejects.toMatchObject({ codigo: "error_no_controlado" });
  });

  it("la respuesta del almacén fuera de la lista cerrada -> error_temporal", async () => {
    for (const mala of [
      { resultado: "confirmada", extra: CANARIO },
      { resultado: CANARIO },
      { resultado: "guardado" },
      "confirmada",
      null,
      [],
    ]) {
      const almacen = crearAlmacen({ llamar: () => Promise.resolve(mala) });
      const r = await crearConfirmarOrden({ almacen })(
        { tokenHmac: "a".repeat(64), recurso: RECURSO },
        { orden_id: randomUUID() },
      );
      expect(r).toEqual({ ok: false, codigo: "error_temporal" });
    }
  });
});

describe("almacén.confirmarOrden: llamada fija", () => {
  it("llama a mcp_confirmar_orden con tres parámetros", async () => {
    const llamar = vi.fn(() => Promise.resolve({ resultado: "repetida" }));
    const orden = randomUUID();
    expect(await crearAlmacen({ llamar }).confirmarOrden("c".repeat(64), RECURSO, orden)).toEqual({
      resultado: "repetida",
    });
    expect(llamar).toHaveBeenCalledWith("mcp_confirmar_orden", ["c".repeat(64), RECURSO, orden]);
  });
});
