// T-105 (e) (001): herramienta enviar_informe y `enviarInforme` del almacén. PRUEBA-017 (herramienta:
// ajenos descartados y contados, inválidos sin eco, ejecución desconocida, repeticiones) y PRUEBA-007
// (parte: 10 llamadas con la misma ejecución -> 1 `guardado`; una sola conexión PGlite, NO demuestra
// carreras reales: eso es la 008). Valores marcados compuestos en ejecución (arts. 1 y 4).
import { randomUUID } from "node:crypto";
import { describe, expect, it, vi } from "vitest";
import { ErrorDeAplicacion } from "../../../src/lib/plataforma/errores";
import { crearAlmacen, type Almacen } from "../../../src/lib/supabase/almacen";
import { validarSalida } from "../../../src/mcp/esquemas/contratos";
import { crearEnviarInforme } from "../../../src/mcp/herramientas/enviar-informe";
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
  otraConexion,
  RECURSO,
  ROL_MCP,
  sembrar,
  una,
  type Sembrado,
} from "./bd/comun";

cerrarAlFinal();

const CANARIO = `TEXTO-CANARIO-${randomUUID()}`;
type Obj = Record<string, unknown>;
const bueno = (): Obj => ({
  estado: "aviso",
  modo: "desatendido",
  asistente: "claude",
  almacenamiento: "drive",
  version_prompt: "0.1",
  frecuencia_horas: 24,
  tratados: 12,
  sin_tratar: 3,
  borradores: 4,
  documentos: 5,
  facturas_pendientes: 1,
  urgentes: 2,
  comprobaciones: { correo: true, almacenamiento: true, contexto: false, registro: true },
  problemas: ["sin_contexto", "error_borrador"],
});

async function montar() {
  const bd = await abrir();
  const almacen = crearAlmacen(await crearAlmacenPglite(bd, ROL_MCP));
  const herramienta = crearEnviarInforme({ almacen });
  const s = await sembrar(bd, "A");
  const ejecucion = await abrirEjecucion(almacen, s);
  return { bd, almacen, herramienta, s, ejecucion };
}
async function abrirEjecucion(almacen: Almacen, s: Sembrado): Promise<string> {
  const r = await almacen.obtenerInstrucciones(s.acceso.hmac, RECURSO);
  if (r.resultado !== "servido") throw new Error("siembra");
  return r.ejecucion_id;
}
const contexto = (s: Sembrado) => ({ tokenHmac: s.acceso.hmac, recurso: RECURSO });
const informes = async (bd: BdApoyo) =>
  (await una<{ n: number }>(bd, `select count(*)::int as n from ${ESQUEMA}.informes`)).n;
const abierta = async (bd: BdApoyo, id: string) =>
  (
    await una<{ a: boolean }>(
      bd,
      `select cerrada_en is null as a from ${ESQUEMA}.ejecuciones where id = $1`,
      [id],
    )
  ).a;
const volcado = async (bd: BdApoyo) =>
  JSON.stringify((await bd.db.query(`select i::text from ${ESQUEMA}.informes i`)).rows) +
  JSON.stringify((await bd.db.query(`select e::text from ${ESQUEMA}.ejecuciones e`)).rows) +
  JSON.stringify((await bd.db.query(`select s::text from ${ESQUEMA}.sucesos s`)).rows);

describe("enviar_informe: informe válido (PRUEBA-017, herramienta)", () => {
  it("guarda, cierra la ejecución y responde con el contrato", async () => {
    const { bd, herramienta, s, ejecucion } = await montar();
    const r = await herramienta(contexto(s), { ejecucion_id: ejecucion, informe: bueno() });
    expect(r).toEqual({ ok: true, salida: { guardado: true, campos_descartados: 0 } });
    if (r.ok) expect(validarSalida("enviar_informe")(r.salida)).toBe(true);
    expect(await informes(bd)).toBe(1);
    expect(await abierta(bd, ejecucion)).toBe(false);
  });

  it("3 campos ajenos (2 en la raíz y 1 en comprobaciones): campos_descartados 3 y 0 apariciones", async () => {
    const { bd, herramienta, s, ejecucion } = await montar();
    const sumidero = crearSumidero();
    const captura = capturarConsola(sumidero);
    try {
      const informe = bueno();
      informe[`nombre_${CANARIO}`] = CANARIO;
      informe.asunto = CANARIO;
      (informe.comprobaciones as Obj)[`otro_${CANARIO}`] = CANARIO;
      const r = await herramienta(contexto(s), { ejecucion_id: ejecucion, informe });
      expect(r).toEqual({ ok: true, salida: { guardado: true, campos_descartados: 3 } });
      sumidero.registrar("respuesta", r);
      expect(sumidero.hallar(CANARIO)).toEqual([]);
      expect(await volcado(bd)).not.toContain(CANARIO);
      const f = await una<{ d: number }>(
        bd,
        `select campos_descartados::int as d from ${ESQUEMA}.informes`,
      );
      expect(f.d).toBe(3);
    } finally {
      captura.restaurar();
    }
  });

  it("__proto__ y constructor como claves propias (JSON.parse) se descartan y cuentan", async () => {
    const { bd, herramienta, s, ejecucion } = await montar();
    const texto = JSON.stringify(bueno()).replace(
      /^\{/,
      `{"__proto__":{"x":"${CANARIO}"},"constructor":"${CANARIO}",`,
    );
    // JSON.parse solo en la prueba, para fabricar la entrada hostil que llegaría del SDK.
    const informe = JSON.parse(texto) as unknown;
    const r = await herramienta(contexto(s), { ejecucion_id: ejecucion, informe });
    expect(r).toEqual({ ok: true, salida: { guardado: true, campos_descartados: 2 } });
    expect(await volcado(bd)).not.toContain(CANARIO);
    expect(({} as Obj).x).toBeUndefined();
  });

  it("campos ajenos en la raíz de los argumentos se ignoran sin leerlos y NO se cuentan (solo cuentan los del informe y de comprobaciones)", async () => {
    const { bd, herramienta, s, ejecucion } = await montar();
    let lecturas = 0;
    const argumentos: Obj = { ejecucion_id: ejecucion, informe: bueno() };
    Object.defineProperty(argumentos, `cliente_${CANARIO}`, {
      enumerable: true,
      get: () => {
        lecturas += 1;
        return CANARIO;
      },
    });
    const r = await herramienta(contexto(s), argumentos);
    expect(r).toEqual({ ok: true, salida: { guardado: true, campos_descartados: 0 } });
    expect(lecturas).toBe(0);
    expect(await volcado(bd)).not.toContain(CANARIO);
  });
});

describe("enviar_informe: inválido, sin eco y con la ejecución abierta (PRUEBA-017)", () => {
  const casos: [string, (i: Obj) => void][] = [
    ["texto donde va una cifra", (i) => (i.tratados = CANARIO)],
    ["mínimo menos 1", (i) => (i.frecuencia_horas = 0)],
    ["máximo más 1", (i) => (i.tratados = 1001)],
    ["valor fuera de su lista", (i) => (i.estado = CANARIO)],
    ["código de problema desconocido", (i) => (i.problemas = [CANARIO])],
    ["seis problemas", (i) => (i.problemas = ["otro", "otro", "otro", "otro", "otro", "otro"])],
    ["campo obligatorio ausente", (i) => delete i.urgentes],
    ["comprobaciones con texto", (i) => ((i.comprobaciones as Obj).correo = CANARIO)],
  ];
  for (const [nombre, tocar] of casos) {
    it(`${nombre}: informe_invalido, 0 apariciones y la misma ejecución acepta después uno válido`, async () => {
      const { bd, herramienta, s, ejecucion } = await montar();
      const sumidero = crearSumidero();
      const captura = capturarConsola(sumidero);
      try {
        const informe = bueno();
        tocar(informe);
        const r = await herramienta(contexto(s), { ejecucion_id: ejecucion, informe });
        expect(r).toEqual({
          ok: true,
          salida: { guardado: false, motivo: "informe_invalido", campos_descartados: 0 },
        });
        if (r.ok) expect(validarSalida("enviar_informe")(r.salida)).toBe(true);
        sumidero.registrar("respuesta", r);
        expect(sumidero.hallar(CANARIO)).toEqual([]);
        expect(await volcado(bd)).not.toContain(CANARIO);
        expect(await informes(bd)).toBe(0);
        expect(await abierta(bd, ejecucion)).toBe(true);
        const ok = await herramienta(contexto(s), { ejecucion_id: ejecucion, informe: bueno() });
        expect(ok).toEqual({ ok: true, salida: { guardado: true, campos_descartados: 0 } });
      } finally {
        captura.restaurar();
      }
    });
  }

  it("el informe que no es un objeto (texto, lista, null, ausente) es informe_invalido", async () => {
    const { bd, herramienta, s, ejecucion } = await montar();
    for (const informe of [CANARIO, [1], null, 7, undefined]) {
      const r = await herramienta(contexto(s), { ejecucion_id: ejecucion, informe });
      expect(r).toEqual({
        ok: true,
        salida: { guardado: false, motivo: "informe_invalido", campos_descartados: 0 },
      });
    }
    expect(await informes(bd)).toBe(0);
  });

  it("argumentos que no son un objeto: ejecucion_desconocida, sin tocar el almacén", async () => {
    const llamar = vi.fn(() => Promise.resolve(true));
    const h = crearEnviarInforme({ almacen: crearAlmacen({ llamar }) });
    for (const args of [null, CANARIO, [bueno()], 5, undefined]) {
      expect(await h({ tokenHmac: "a".repeat(64), recurso: RECURSO }, args)).toEqual({
        ok: true,
        salida: { guardado: false, motivo: "ejecucion_desconocida" },
      });
    }
    expect(llamar).not.toHaveBeenCalled();
  });

  it("lo que no valida con Ajv llega al almacén como null, nunca el informe recibido", async () => {
    const llamar = vi.fn(() => Promise.resolve({ resultado: "informe_invalido" }));
    const h = crearEnviarInforme({ almacen: crearAlmacen({ llamar }) });
    const informe = bueno();
    informe.tratados = CANARIO;
    informe.extra = CANARIO;
    await h(
      { tokenHmac: "a".repeat(64), recurso: RECURSO },
      { ejecucion_id: randomUUID(), informe },
    );
    expect(llamar).toHaveBeenCalledTimes(1);
    const argumentos = (llamar.mock.calls[0] as unknown as [string, unknown[]])[1];
    expect(argumentos[3]).toBeNull();
    expect(argumentos[4]).toBe(1);
    expect(JSON.stringify(argumentos)).not.toContain(CANARIO);
  });

  it("un informe válido llega al almacén como TEXTO con solo las claves del contrato", async () => {
    const llamar = vi.fn(() => Promise.resolve({ resultado: "guardado" }));
    const h = crearEnviarInforme({ almacen: crearAlmacen({ llamar }) });
    await h(
      { tokenHmac: "a".repeat(64), recurso: RECURSO },
      { ejecucion_id: randomUUID(), informe: { ...bueno(), extra: CANARIO } },
    );
    const argumentos = (llamar.mock.calls[0] as unknown as [string, unknown[]])[1];
    expect(typeof argumentos[3]).toBe("string");
    expect(argumentos[3]).not.toContain(CANARIO);
    expect(argumentos[3]).toBe(JSON.stringify(bueno()));
  });
});

describe("enviar_informe: ejecución desconocida, igual en todos los casos (PRUEBA-017)", () => {
  const esperado = { ok: true, salida: { guardado: false, motivo: "ejecucion_desconocida" } };
  it("mal formada, inexistente, de otra conexión de la misma licencia y de otra licencia", async () => {
    const { bd, almacen, herramienta, s } = await montar();
    const b = await sembrar(bd, "B");
    const ajenaB = await abrirEjecucion(almacen, b);
    const otra = await otraConexion(bd, s.licenciaId);
    const ajenaMisma = await abrirEjecucion(almacen, {
      ...s,
      conexionId: otra.conexionId,
      acceso: otra.acceso,
    });
    for (const id of [CANARIO, randomUUID(), ajenaB, ajenaMisma, 5, null, undefined]) {
      const r = await herramienta(contexto(s), { ejecucion_id: id, informe: bueno() });
      expect(r).toEqual(esperado);
      expect(JSON.stringify(r)).not.toContain(CANARIO);
    }
    expect(await informes(bd)).toBe(0);
    expect(
      await una(
        bd,
        `select count(*)::int as n from ${ESQUEMA}.ejecuciones where cerrada_en is not null`,
      ),
    ).toEqual({ n: 0 });
  });

  it("token de otro cliente: nada escrito en la ejecución del primero", async () => {
    const { bd, herramienta, ejecucion } = await montar();
    const b = await sembrar(bd, "B");
    const r = await herramienta(contexto(b), { ejecucion_id: ejecucion, informe: bueno() });
    expect(r).toEqual(esperado);
    expect(await informes(bd)).toBe(0);
    expect(await abierta(bd, ejecucion)).toBe(true);
  });

  it("token no válido: no_autorizado", async () => {
    const { herramienta, ejecucion } = await montar();
    const r = await herramienta(
      { tokenHmac: "b".repeat(64), recurso: RECURSO },
      { ejecucion_id: ejecucion, informe: bueno() },
    );
    expect(r).toEqual({ ok: false, codigo: "no_autorizado" });
  });
});

describe("enviar_informe: repeticiones y simultaneidad (PRUEBA-017; PRUEBA-007, parte)", () => {
  it("el segundo envío, igual o distinto, responde repetido y conserva el primero", async () => {
    const { bd, herramienta, s, ejecucion } = await montar();
    await herramienta(contexto(s), { ejecucion_id: ejecucion, informe: bueno() });
    const otro = { ...bueno(), tratados: 99 };
    for (const informe of [bueno(), otro]) {
      const r = await herramienta(contexto(s), { ejecucion_id: ejecucion, informe });
      expect(r).toEqual({
        ok: true,
        salida: { guardado: true, repetido: true, campos_descartados: 0 },
      });
      if (r.ok) expect(validarSalida("enviar_informe")(r.salida)).toBe(true);
    }
    expect(await informes(bd)).toBe(1);
    const f = await una<{ t: number }>(bd, `select tratados::int as t from ${ESQUEMA}.informes`);
    expect(f.t).toBe(12);
  });

  it("10 llamadas iguales con la misma ejecución: 1 guardado, 9 repetido y 1 informe", async () => {
    const { bd, herramienta, s, ejecucion } = await montar();
    const rs = await Promise.all(
      Array.from({ length: 10 }, () =>
        herramienta(contexto(s), { ejecucion_id: ejecucion, informe: bueno() }),
      ),
    );
    const salidas = rs.map((r) => (r.ok ? r.salida : null));
    expect(salidas.filter((x) => x?.repetido === undefined && x?.guardado === true)).toHaveLength(
      1,
    );
    expect(salidas.filter((x) => x?.repetido === true)).toHaveLength(9);
    expect(await informes(bd)).toBe(1);
  });
});

describe("enviar_informe: almacén caído y errores (PRUEBA-018, parte)", () => {
  it("almacén caído -> error_temporal, sin guardado y sin valores en la consola", async () => {
    const sumidero = crearSumidero();
    const captura = capturarConsola(sumidero);
    try {
      const almacen = crearAlmacen({
        llamar: () => Promise.reject(Object.assign(new Error(CANARIO), { detail: CANARIO })),
      });
      const r = await crearEnviarInforme({ almacen })(
        { tokenHmac: "a".repeat(64), recurso: RECURSO },
        { ejecucion_id: randomUUID(), informe: bueno() },
      );
      expect(r).toEqual({ ok: false, codigo: "error_temporal" });
      expect(sumidero.hallar(CANARIO)).toEqual([]);
    } finally {
      captura.restaurar();
    }
  });

  it("un error que no es del almacén se propaga con su código cerrado", async () => {
    const almacen = {
      enviarInforme: () => Promise.reject(new ErrorDeAplicacion("error_no_controlado")),
    } as unknown as Almacen;
    await expect(
      crearEnviarInforme({ almacen })(
        { tokenHmac: "a".repeat(64), recurso: RECURSO },
        { ejecucion_id: randomUUID(), informe: bueno() },
      ),
    ).rejects.toMatchObject({ codigo: "error_no_controlado" });
  });

  it("la respuesta del almacén fuera de la lista cerrada es almacén no disponible -> error_temporal", async () => {
    for (const mala of [
      { resultado: "guardado", extra: CANARIO },
      { resultado: CANARIO },
      { resultado: "obtenido" },
      "guardado",
      null,
      [],
    ]) {
      const almacen = crearAlmacen({ llamar: () => Promise.resolve(mala) });
      const r = await crearEnviarInforme({ almacen })(
        { tokenHmac: "a".repeat(64), recurso: RECURSO },
        { ejecucion_id: randomUUID(), informe: bueno() },
      );
      expect(r).toEqual({ ok: false, codigo: "error_temporal" });
    }
  });
});

describe("almacén.enviarInforme: llamada fija", () => {
  it("llama a mcp_enviar_informe con cinco parámetros y el informe como texto", async () => {
    const llamar = vi.fn(() => Promise.resolve({ resultado: "repetido" }));
    const almacen = crearAlmacen({ llamar });
    const ejecucion = randomUUID();
    expect(await almacen.enviarInforme("c".repeat(64), RECURSO, ejecucion, bueno(), 2)).toEqual({
      resultado: "repetido",
    });
    expect(llamar).toHaveBeenCalledWith("mcp_enviar_informe", [
      "c".repeat(64),
      RECURSO,
      ejecucion,
      JSON.stringify(bueno()),
      2,
    ]);
    await almacen.enviarInforme("c".repeat(64), RECURSO, ejecucion, null, 0);
    expect((llamar.mock.calls[1] as unknown as [string, unknown[]])[1][3]).toBeNull();
  });
});
