// T-105 (g) (001): filtro de salida del punto MCP (diseño §Punto MCP, paso 9). PRUEBA-003 (listado =
// contratos; salidas válidas; distinto de tres herramientas -> 500) y la parte de «sin eco» de
// PRUEBA-017/019: errores JSON-RPC con texto fijo y sin `data` (salvo `supported` de -32022), `isError`
// ajeno -> código fijo. Respuestas fabricadas, en las dos formas del SDK (JSON y SSE de la época 2025).
import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  contratoPublicado,
  HERRAMIENTAS,
  type Herramienta,
} from "../../../src/mcp/esquemas/contratos";
import { filtrarRespuesta } from "../../../src/mcp/salida";

const CANARIO = `TEXTO-CANARIO-${randomUUID()}`;
type Obj = Record<string, unknown>;

const json = (cuerpo: unknown, estado = 200) =>
  new Response(JSON.stringify(cuerpo), {
    status: estado,
    headers: { "content-type": "application/json" },
  });
const sse = (cuerpo: unknown) =>
  new Response(`event: message\ndata: ${JSON.stringify(cuerpo)}\n\n`, {
    status: 200,
    headers: { "content-type": "text/event-stream" },
  });
async function leer(r: Response): Promise<{ crudo: string; mensaje: Obj }> {
  const crudo = await r.text();
  const linea = crudo.split("\n").find((l) => l.startsWith("data: "));
  return {
    crudo,
    mensaje: JSON.parse(linea ? linea.slice("data: ".length) : crudo) as Obj,
  };
}

const sdkTools = () =>
  HERRAMIENTAS.map((n) => ({
    name: n,
    title: CANARIO,
    description: CANARIO,
    inputSchema: { type: "object", additionalProperties: true, [`x_${CANARIO}`]: 1 },
    outputSchema: { type: "object", description: CANARIO },
    annotations: { readOnlyHint: true },
    execution: { taskSupport: CANARIO },
    _meta: { [CANARIO]: CANARIO },
  }));

describe("filtro de salida: tools/list = contratos (PRUEBA-003)", () => {
  for (const [nombre, hacer] of [
    ["JSON (2026-07-28)", json],
    ["SSE (2025-11-25)", sse],
  ] as const) {
    it(`${nombre}: tres herramientas, solo lo del contrato y en su orden`, async () => {
      const r = await filtrarRespuesta(
        hacer({
          jsonrpc: "2.0",
          id: 1,
          result: { tools: [...sdkTools()].reverse(), resultType: "complete", ttlMs: 0 },
        }),
        null,
      );
      const { crudo, mensaje } = await leer(r);
      expect(crudo).not.toContain(CANARIO);
      const resultado = mensaje.result as { tools: unknown[]; resultType?: string };
      expect(resultado.tools).toEqual(HERRAMIENTAS.map((h) => contratoPublicado(h)));
      expect(resultado.resultType).toBe("complete");
      expect(r.headers.get("cache-control")).toBe("no-store");
      expect(r.status).toBe(200);
    });
  }

  it("el publicado de cada herramienta no lleva $schema, $id ni x-version-esquema", () => {
    for (const h of HERRAMIENTAS) {
      const texto = JSON.stringify(contratoPublicado(h));
      for (const prohibido of ['"$schema"', '"$id"', "x-version-esquema"]) {
        expect(texto).not.toContain(prohibido);
      }
      expect(contratoPublicado(h).annotations.readOnlyHint).toBe(false);
    }
  });

  const incorrectos: [string, unknown[]][] = [
    ["ninguna", []],
    ["dos", sdkTools().slice(0, 2)],
    ["cuatro", [...sdkTools(), { name: "otra" }]],
    ["tres con una repetida", [sdkTools()[0], sdkTools()[0], sdkTools()[1]]],
    ["tres con una ajena", [...sdkTools().slice(0, 2), { name: CANARIO }]],
  ];
  for (const [nombre, tools] of incorrectos) {
    it(`distinto de las tres herramientas del contrato (${nombre}) -> error_no_controlado (500)`, async () => {
      await expect(
        filtrarRespuesta(json({ jsonrpc: "2.0", id: 1, result: { tools } }), null),
      ).rejects.toMatchObject({ codigo: "error_no_controlado" });
    });
  }
});

describe("filtro de salida: tools/call, salidas válidas (PRUEBA-003)", () => {
  const salidaOk = (h: Herramienta): Obj =>
    h === "obtener_instrucciones"
      ? { estado: "pausada", ejecucion_id: randomUUID(), orden: null, instrucciones: null }
      : h === "enviar_informe"
        ? { guardado: true, campos_descartados: 0 }
        : { confirmada: true };
  const resultado = (s: Obj, extra: Obj = {}): Obj => ({
    jsonrpc: "2.0",
    id: 7,
    result: {
      content: [{ type: "text", text: JSON.stringify(s) }],
      structuredContent: s,
      resultType: "complete",
      ...extra,
    },
  });

  for (const h of HERRAMIENTAS) {
    it(`${h}: la salida del contrato pasa tal cual, con texto igual al JSON`, async () => {
      const s = salidaOk(h);
      const r = await filtrarRespuesta(json(resultado(s)), h);
      const { mensaje } = await leer(r);
      expect(mensaje.result).toEqual({
        content: [{ type: "text", text: JSON.stringify(s) }],
        structuredContent: s,
        resultType: "complete",
      });
    });

    it(`${h}: campo de más o texto distinto -> isError error_interno, sin ecos`, async () => {
      for (const malo of [
        resultado({ ...salidaOk(h), [`x_${CANARIO}`]: CANARIO }),
        {
          jsonrpc: "2.0",
          id: 7,
          result: {
            content: [{ type: "text", text: CANARIO }],
            structuredContent: salidaOk(h),
          },
        },
        { jsonrpc: "2.0", id: 7, result: { content: [{ type: "text", text: CANARIO }] } },
      ]) {
        const r = await filtrarRespuesta(json(malo), h);
        const { crudo, mensaje } = await leer(r);
        expect(crudo).not.toContain(CANARIO);
        expect(mensaje.result).toMatchObject({
          content: [{ type: "text", text: "error_interno" }],
          isError: true,
        });
        expect((mensaje.result as Obj).structuredContent).toBeUndefined();
      }
    });
  }

  it("un resultado de herramienta sin herramienta conocida -> error_interno", async () => {
    const r = await filtrarRespuesta(json(resultado({ confirmada: true })), null);
    expect((await leer(r)).mensaje.result).toEqual({
      content: [{ type: "text", text: "error_interno" }],
      isError: true,
      resultType: "complete",
    });
  });

  it("isError con los códigos fijos pasa; cualquier otro texto -> error_interno; sin structuredContent", async () => {
    for (const codigo of ["error_temporal", "no_autorizado", "error_interno"]) {
      const r = await filtrarRespuesta(
        json({
          jsonrpc: "2.0",
          id: 1,
          result: {
            content: [{ type: "text", text: codigo }],
            isError: true,
            structuredContent: { x: CANARIO },
          },
        }),
        "confirmar_orden",
      );
      const { crudo, mensaje } = await leer(r);
      expect(crudo).not.toContain(CANARIO);
      expect(mensaje.result).toEqual({ content: [{ type: "text", text: codigo }], isError: true });
    }
    for (const texto of [CANARIO, `Error: ${CANARIO}`, "", "ERROR_TEMPORAL"]) {
      const r = await filtrarRespuesta(
        json({
          jsonrpc: "2.0",
          id: 1,
          result: { content: [{ type: "text", text: texto }], isError: true },
        }),
        "enviar_informe",
      );
      const { crudo, mensaje } = await leer(r);
      expect(crudo).not.toContain(CANARIO);
      expect(mensaje.result).toEqual({
        content: [{ type: "text", text: "error_interno" }],
        isError: true,
      });
    }
  });
});

describe("filtro de salida: errores JSON-RPC con texto fijo y sin data", () => {
  it("el mensaje y los datos del SDK no salen: texto fijo por código", async () => {
    const casos: [number, string][] = [
      [-32700, "Error de sintaxis"],
      [-32600, "Petición no válida"],
      [-32601, "Método no encontrado"],
      [-32602, "Parámetros no válidos"],
      [-32603, "Error interno"],
      [-32022, "Versión de protocolo no admitida"],
    ];
    for (const [codigo, texto] of casos) {
      const r = await filtrarRespuesta(
        sse({
          jsonrpc: "2.0",
          id: 5,
          error: { code: codigo, message: `Tool ${CANARIO} not found`, data: { x: CANARIO } },
        }),
        null,
      );
      const { crudo, mensaje } = await leer(r);
      expect(crudo).not.toContain(CANARIO);
      expect(mensaje).toEqual({ jsonrpc: "2.0", id: 5, error: { code: codigo, message: texto } });
    }
  });

  it("-32022 conserva solo `supported` (lista de versiones), nada más", async () => {
    const r = await filtrarRespuesta(
      json(
        {
          jsonrpc: "2.0",
          id: 1,
          error: {
            code: -32022,
            message: CANARIO,
            data: { supported: ["2026-07-28"], recibida: CANARIO },
          },
        },
        400,
      ),
      null,
    );
    const { crudo, mensaje } = await leer(r);
    expect(r.status).toBe(400);
    expect(crudo).not.toContain(CANARIO);
    expect((mensaje.error as Obj).data).toEqual({ supported: ["2026-07-28"] });
  });

  it("`supported` que no es una lista de versiones se descarta", async () => {
    for (const supported of [CANARIO, [CANARIO], [1], { a: 1 }, []]) {
      const r = await filtrarRespuesta(
        json({ jsonrpc: "2.0", id: 1, error: { code: -32022, message: "x", data: { supported } } }),
        null,
      );
      const { crudo, mensaje } = await leer(r);
      expect(crudo).not.toContain(CANARIO);
      expect((mensaje.error as Obj).data).toBeUndefined();
    }
  });

  it("un código desconocido o un error que no es objeto -> -32603 fijo", async () => {
    for (const error of [{ code: 12345, message: CANARIO }, { code: CANARIO }, CANARIO, null, {}]) {
      const r = await filtrarRespuesta(json({ jsonrpc: "2.0", id: 1, error }), null);
      const { crudo, mensaje } = await leer(r);
      expect(crudo).not.toContain(CANARIO);
      expect(mensaje.error).toEqual({ code: -32603, message: "Error interno" });
    }
  });
});

describe("filtro de salida: formas inesperadas, cierre en fallo", () => {
  it("un cuerpo que no es JSON -> error_no_controlado", async () => {
    await expect(
      filtrarRespuesta(
        new Response(CANARIO, { status: 200, headers: { "content-type": "application/json" } }),
        null,
      ),
    ).rejects.toMatchObject({ codigo: "error_no_controlado" });
  });

  it("un cuerpo vacío (202 de una notificación) pasa vacío", async () => {
    const r = await filtrarRespuesta(new Response(null, { status: 202 }), null);
    expect(r.status).toBe(202);
    expect(await r.text()).toBe("");
  });

  it("el resultado de initialize y de otros métodos pasa sin tocar sus campos", async () => {
    const cuerpo = {
      jsonrpc: "2.0",
      id: 1,
      result: {
        protocolVersion: "2025-11-25",
        capabilities: { tools: {} },
        serverInfo: { name: "x" },
      },
    };
    const { mensaje } = await leer(await filtrarRespuesta(json(cuerpo), null));
    expect(mensaje).toEqual(cuerpo);
  });

  it("conserva el estado HTTP y fija Cache-Control: no-store", async () => {
    const r = await filtrarRespuesta(
      json({ jsonrpc: "2.0", id: 1, error: { code: -32600, message: "x" } }, 400),
      null,
    );
    expect(r.status).toBe(400);
    expect(r.headers.get("cache-control")).toBe("no-store");
  });
});

describe("filtro de salida: política única del id JSON-RPC (revisión 2)", () => {
  const marcado500 = `${CANARIO}${"x".repeat(500)}`;
  const marcado50 = CANARIO; // 51 caracteres inocuos: pasaba con el máximo anterior de 64
  const cuerpos = (id: unknown): [string, Obj][] => [
    ["error -32601", { jsonrpc: "2.0", id, error: { code: -32601, message: CANARIO } }],
    [
      "resultado de confirmar_orden",
      {
        jsonrpc: "2.0",
        id,
        result: {
          content: [{ type: "text", text: JSON.stringify({ confirmada: true }) }],
          structuredContent: { confirmada: true },
        },
      },
    ],
    ["listado", { jsonrpc: "2.0", id, result: { tools: sdkTools() } }],
  ];
  for (const [nombre, hacer] of [
    ["JSON", json],
    ["SSE", sse],
  ] as const) {
    it(`${nombre}: un id de 500 o de 50 caracteres, de objeto o no entero seguro -> null; el corto y el entero se repiten`, async () => {
      for (const id of [marcado500, marcado50, { x: CANARIO }, 1.5, 2 ** 60, "a b", ""]) {
        for (const [, cuerpo] of cuerpos(id)) {
          const { crudo, mensaje } = await leer(
            await filtrarRespuesta(hacer(cuerpo), "confirmar_orden"),
          );
          expect(mensaje.id).toBeNull();
          expect(crudo).not.toContain(CANARIO);
        }
      }
      for (const id of [7, "abc", "a".repeat(32)]) {
        for (const [, cuerpo] of cuerpos(id)) {
          const { mensaje } = await leer(await filtrarRespuesta(hacer(cuerpo), "confirmar_orden"));
          expect(mensaje.id).toBe(id);
        }
      }
    });
  }
});
