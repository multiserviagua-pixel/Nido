// T-105 (g) (001): servidor del punto MCP (diseño §Punto MCP, pasos 8 y 9). PRUEBA-003 (listado =
// contratos y salidas válidas, con un validador independiente construido desde lo PUBLICADO),
// PRUEBA-002 (parte: las dos épocas, 2025-11-25 y 2026-07-28) y la parte de cierre en fallo de
// PRUEBA-017/018: el SDK no recibe Authorization ni Cookie, nada del SDK sale con valores recibidos.
// Sobre PGlite con el SQL real y el SDK real, sin red.
import { randomUUID } from "node:crypto";
import { describe, expect, it, vi } from "vitest";
import { crearAlmacen } from "../../../src/lib/supabase/almacen";
import { crearAjv, contratoPublicado, HERRAMIENTAS } from "../../../src/mcp/esquemas/contratos";
import { crearLectorPrompt, obtenerPromptFicticio } from "../../../src/mcp/prompt-ficticio";
import { cabecerasParaSdk, crearServidorMcp, PLAZO_ATENDER_MS } from "../../../src/mcp/servidor";
import { capturarConsola, crearAlmacenPglite, crearSumidero } from "../../conector/apoyo/index";
import {
  abrir,
  cerrarAlFinal,
  ESQUEMA,
  RECURSO,
  ROL_MCP,
  sembrar,
  sembrarOrden,
  una,
  type Sembrado,
} from "./bd/comun";

cerrarAlFinal();

const CANARIO = `TEXTO-CANARIO-${randomUUID()}`;
type Obj = Record<string, unknown>;
const URL_MCP = "http://localhost/api/mcp";

const bueno = (): Obj => ({
  estado: "ok",
  modo: "conversacion",
  asistente: "claude",
  almacenamiento: "drive",
  version_prompt: "0.1",
  frecuencia_horas: 24,
  tratados: 3,
  sin_tratar: 0,
  borradores: 1,
  documentos: 0,
  facturas_pendientes: 0,
  urgentes: 0,
  comprobaciones: { correo: true, almacenamiento: true, contexto: true, registro: true },
  problemas: [],
});

type Epoca = "2025-11-25" | "2026-07-28";
const sobre = {
  "io.modelcontextprotocol/protocolVersion": "2026-07-28",
  "io.modelcontextprotocol/clientCapabilities": {},
  "io.modelcontextprotocol/clientInfo": { name: "prueba", version: "0.0.0" },
};

// Petición de una época: la moderna lleva sobre en `_meta` y cabeceras `mcp-*`; la de 2025, nada de eso.
function peticion(epoca: Epoca, metodo: string, params: Obj, s: Sembrado) {
  const moderna = epoca === "2026-07-28";
  const cuerpo = {
    jsonrpc: "2.0",
    id: 1,
    method: metodo,
    params: moderna ? { ...params, _meta: sobre } : params,
  };
  const cabeceras = new Headers({
    "content-type": "application/json",
    accept: "application/json, text/event-stream",
    authorization: `Bearer ${CANARIO}`,
    cookie: `sesion=${CANARIO}`,
  });
  if (moderna) {
    cabeceras.set("mcp-protocol-version", "2026-07-28");
    cabeceras.set("mcp-method", metodo);
    if (typeof params.name === "string") cabeceras.set("mcp-name", params.name);
  }
  return {
    url: URL_MCP,
    cabeceras,
    texto: JSON.stringify(cuerpo),
    cuerpo: cuerpo as unknown,
    tokenHmac: s.acceso.hmac,
    recurso: RECURSO,
  };
}

async function montar(opciones: { prompt?: () => ReturnType<typeof obtenerPromptFicticio> } = {}) {
  const bd = await abrir();
  const almacen = crearAlmacen(await crearAlmacenPglite(bd, ROL_MCP));
  const servidor = crearServidorMcp({ almacen, prompt: opciones.prompt ?? obtenerPromptFicticio });
  return { bd, almacen, servidor, s: await sembrar(bd, "A") };
}

async function mensajeDe(r: Response): Promise<{ crudo: string; mensaje: Obj }> {
  const crudo = await r.text();
  const linea = crudo.split("\n").find((l) => l.startsWith("data: "));
  return { crudo, mensaje: JSON.parse(linea ? linea.slice(6) : crudo) as Obj };
}
const resultadoDe = (m: Obj) => m.result as Obj;

describe("cabecerasParaSdk: el SDK no recibe Authorization ni Cookie (paso 8)", () => {
  it("solo content-type, accept y mcp-*", () => {
    const entrada = new Headers({
      authorization: `Bearer ${CANARIO}`,
      cookie: CANARIO,
      "x-vercel-forwarded-for": CANARIO,
      origin: CANARIO,
      "content-type": "application/json",
      accept: "application/json",
      "mcp-protocol-version": "2026-07-28",
      "mcp-method": "tools/list",
      "mcp-name": "x",
    });
    const salida = cabecerasParaSdk(entrada);
    expect([...salida.keys()].sort()).toEqual([
      "accept",
      "content-type",
      "mcp-method",
      "mcp-name",
      "mcp-protocol-version",
    ]);
    expect([...salida.values()].join(" ")).not.toContain(CANARIO);
  });
});

for (const epoca of ["2025-11-25", "2026-07-28"] as const) {
  describe(`punto MCP en la época ${epoca} (PRUEBA-002 parte; PRUEBA-003)`, () => {
    it("tools/list devuelve exactamente los tres contratos", async () => {
      const { servidor, s } = await montar();
      const { respuesta } = await servidor.atender(peticion(epoca, "tools/list", {}, s));
      expect(respuesta.status).toBe(200);
      const { crudo, mensaje } = await mensajeDe(respuesta);
      expect(resultadoDe(mensaje).tools).toEqual(HERRAMIENTAS.map((h) => contratoPublicado(h)));
      expect(crudo).not.toContain(CANARIO);
    });

    it("las tres herramientas por el SDK: salidas válidas contra lo PUBLICADO y texto = structuredContent", async () => {
      const { bd, servidor, s } = await montar();
      const orden = await sembrarOrden(bd, s.licenciaId, "pausar", "pendiente");
      const ajv = crearAjv();
      const validarPublicado = (h: (typeof HERRAMIENTAS)[number], datos: unknown) =>
        ajv.compile(contratoPublicado(h).outputSchema)(datos);

      const o = await servidor.atender(
        peticion(epoca, "tools/call", { name: "obtener_instrucciones", arguments: {} }, s),
      );
      const ro = resultadoDe((await mensajeDe(o.respuesta)).mensaje);
      expect(ro.isError).toBeUndefined();
      const so = ro.structuredContent as Obj;
      expect(validarPublicado("obtener_instrucciones", so)).toBe(true);
      expect(so).toMatchObject({ estado: "pausada", orden: { id: orden, tipo: "pausar" } });
      expect(ro.content).toEqual([{ type: "text", text: JSON.stringify(so) }]);
      expect(o).toMatchObject({ herramienta: "obtener_instrucciones", resultado: "correcto" });

      const activa = await sembrar(bd, "B");
      const a = await servidor.atender(
        peticion(epoca, "tools/call", { name: "obtener_instrucciones", arguments: {} }, activa),
      );
      const sa = resultadoDe((await mensajeDe(a.respuesta)).mensaje).structuredContent as Obj;
      expect(validarPublicado("obtener_instrucciones", sa)).toBe(true);
      expect(sa.estado).toBe("activa");

      const e = await servidor.atender(
        peticion(
          epoca,
          "tools/call",
          {
            name: "enviar_informe",
            arguments: { ejecucion_id: sa.ejecucion_id, informe: bueno() },
          },
          activa,
        ),
      );
      const se = resultadoDe((await mensajeDe(e.respuesta)).mensaje).structuredContent as Obj;
      expect(se).toEqual({ guardado: true, campos_descartados: 0 });
      expect(validarPublicado("enviar_informe", se)).toBe(true);

      const c = await servidor.atender(
        peticion(
          epoca,
          "tools/call",
          { name: "confirmar_orden", arguments: { orden_id: orden } },
          s,
        ),
      );
      const sc = resultadoDe((await mensajeDe(c.respuesta)).mensaje).structuredContent as Obj;
      expect(sc).toEqual({ confirmada: true });
      expect(validarPublicado("confirmar_orden", sc)).toBe(true);
      expect(c).toMatchObject({
        herramienta: "confirmar_orden",
        resultado: "correcto",
        codigo: "ok",
      });
    });

    it("campos ajenos, __proto__ y constructor llegan hasta la herramienta y se descartan y cuentan", async () => {
      const { bd, servidor, s } = await montar();
      const o = await servidor.atender(
        peticion(epoca, "tools/call", { name: "obtener_instrucciones", arguments: {} }, s),
      );
      const ejecucion = (
        resultadoDe((await mensajeDe(o.respuesta)).mensaje).structuredContent as Obj
      ).ejecucion_id as string;
      const base = peticion(
        epoca,
        "tools/call",
        { name: "enviar_informe", arguments: { ejecucion_id: ejecucion, informe: bueno() } },
        s,
      );
      // El cuerpo llega ya analizado por entrada.ts: aquí se fabrica con claves propias hostiles.
      const texto = JSON.stringify(JSON.parse(base.texto)).replace(
        '"informe":{',
        `"informe":{"__proto__":{"a":"${CANARIO}"},"constructor":"${CANARIO}","extra":"${CANARIO}",`,
      );
      const r = await servidor.atender({ ...base, texto, cuerpo: JSON.parse(texto) as unknown });
      const { crudo, mensaje } = await mensajeDe(r.respuesta);
      expect(resultadoDe(mensaje).structuredContent).toEqual({
        guardado: true,
        campos_descartados: 3,
      });
      expect(crudo).not.toContain(CANARIO);
      const f = await una<{ d: number }>(
        bd,
        `select campos_descartados::int as d from ${ESQUEMA}.informes`,
      );
      expect(f.d).toBe(3);
      expect(
        JSON.stringify((await bd.db.query(`select i::text from ${ESQUEMA}.informes i`)).rows),
      ).not.toContain(CANARIO);
    });

    it("nombre de herramienta ajeno: -32602 de texto fijo, sin eco", async () => {
      const { servidor, s } = await montar();
      const r = await servidor.atender(
        peticion(epoca, "tools/call", { name: `x-${CANARIO}`, arguments: {} }, s),
      );
      const { crudo, mensaje } = await mensajeDe(r.respuesta);
      expect(mensaje.error).toEqual({ code: -32602, message: "Parámetros no válidos" });
      expect(crudo).not.toContain(CANARIO);
      expect(r.herramienta).toBeNull();
      expect(r.resultado).toBe("rechazado");
    });

    it("método desconocido: -32601 de texto fijo, sin eco", async () => {
      const { servidor, s } = await montar();
      const r = await servidor.atender(peticion(epoca, `raro/${CANARIO}`, {}, s));
      const { crudo, mensaje } = await mensajeDe(r.respuesta);
      expect(crudo).not.toContain(CANARIO);
      expect((mensaje.error as Obj | undefined)?.message).toBe("Método no encontrado");
    });
  });
}

describe("punto MCP: initialize y descubrimiento", () => {
  it("2025-11-25: initialize negocia 2025-11-25 con el SDK", async () => {
    const { servidor, s } = await montar();
    const r = await servidor.atender(
      peticion(
        "2025-11-25",
        "initialize",
        {
          protocolVersion: "2025-11-25",
          capabilities: {},
          clientInfo: { name: "prueba", version: "0.0.0" },
        },
        s,
      ),
    );
    expect(resultadoDe((await mensajeDe(r.respuesta)).mensaje).protocolVersion).toBe("2025-11-25");
  });

  it("2026-07-28: server/discover anuncia la revisión", async () => {
    const { servidor, s } = await montar();
    const r = await servidor.atender(peticion("2026-07-28", "server/discover", {}, s));
    expect(resultadoDe((await mensajeDe(r.respuesta)).mensaje).supportedVersions).toContain(
      "2026-07-28",
    );
  });
});

describe("punto MCP: cierre en fallo (PRUEBA-017 y 018, partes)", () => {
  it("almacén caído: isError con error_temporal, sin estado, prompt ni guardado", async () => {
    const bd = await abrir();
    const caido = await crearAlmacenPglite(bd, ROL_MCP);
    const servidor = crearServidorMcp({
      almacen: crearAlmacen(caido),
      prompt: obtenerPromptFicticio,
    });
    const s = await sembrar(bd, "A");
    caido.caer(true);
    for (const [name, argumentos] of [
      ["obtener_instrucciones", {}],
      ["enviar_informe", { ejecucion_id: randomUUID(), informe: bueno() }],
      ["confirmar_orden", { orden_id: randomUUID() }],
    ] as const) {
      for (const epoca of ["2025-11-25", "2026-07-28"] as const) {
        const r = await servidor.atender(
          peticion(epoca, "tools/call", { name, arguments: argumentos }, s),
        );
        const { mensaje } = await mensajeDe(r.respuesta);
        expect(resultadoDe(mensaje)).toMatchObject({
          content: [{ type: "text", text: "error_temporal" }],
          isError: true,
        });
        expect(resultadoDe(mensaje).structuredContent).toBeUndefined();
        expect(r).toMatchObject({ resultado: "error", codigo: "error_temporal" });
      }
    }
  });

  it("token no válido: isError no_autorizado", async () => {
    const { servidor, s } = await montar();
    const r = await servidor.atender({
      ...peticion(
        "2026-07-28",
        "tools/call",
        { name: "confirmar_orden", arguments: { orden_id: randomUUID() } },
        s,
      ),
      tokenHmac: "b".repeat(64),
    });
    expect(resultadoDe((await mensajeDe(r.respuesta)).mensaje)).toMatchObject({
      content: [{ type: "text", text: "no_autorizado" }],
      isError: true,
    });
  });

  it("prompt no disponible: la llamada falla con prompt_no_valido (503 en HTTP)", async () => {
    const { servidor, s } = await montar({
      prompt: crearLectorPrompt({
        ruta: "x.md",
        leer: () => {
          throw new Error(CANARIO);
        },
      }),
    });
    await expect(
      servidor.atender(
        peticion("2026-07-28", "tools/call", { name: "obtener_instrucciones", arguments: {} }, s),
      ),
    ).rejects.toMatchObject({ codigo: "prompt_no_valido" });
  });

  it("excepción inesperada en la herramienta: rechaza con error_no_controlado (500), sin su mensaje en la consola", async () => {
    const { almacen, s } = await montar();
    const sumidero = crearSumidero();
    const captura = capturarConsola(sumidero);
    try {
      const servidor = crearServidorMcp({
        almacen: {
          ...almacen,
          obtenerInstrucciones: () => Promise.reject(new Error(CANARIO)),
        },
        prompt: obtenerPromptFicticio,
      });
      await expect(
        servidor.atender(
          peticion("2025-11-25", "tools/call", { name: "obtener_instrucciones", arguments: {} }, s),
        ),
      ).rejects.toMatchObject({ codigo: "error_no_controlado" });
      expect(sumidero.hallar(CANARIO)).toEqual([]);
    } finally {
      captura.restaurar();
    }
  });
});

describe("plazo total de atender (revisión de seguridad 2)", () => {
  it("un almacén que no responde nunca: atender rechaza con error_no_controlado al cumplirse el plazo (reloj simulado)", async () => {
    const { almacen, s } = await montar();
    const servidor = crearServidorMcp({
      almacen: { ...almacen, obtenerInstrucciones: () => new Promise(() => undefined) },
      prompt: obtenerPromptFicticio,
    });
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
    try {
      const resultado = servidor
        .atender(
          peticion("2026-07-28", "tools/call", { name: "obtener_instrucciones", arguments: {} }, s),
        )
        .then(
          () => "respondio",
          (e: unknown) => (e as { codigo?: string }).codigo,
        );
      await vi.advanceTimersByTimeAsync(PLAZO_ATENDER_MS - 1);
      let pendiente = true;
      void resultado.then(() => (pendiente = false));
      await vi.advanceTimersByTimeAsync(0);
      expect(pendiente).toBe(true);
      await vi.advanceTimersByTimeAsync(1);
      expect(await resultado).toBe("error_no_controlado");
    } finally {
      vi.useRealTimers();
    }
  });

  it("el plazo es de 30 s", () => {
    expect(PLAZO_ATENDER_MS).toBe(30_000);
  });
});

describe("fallo tardío de la herramienta en las dos épocas (revisión de seguridad 3)", () => {
  for (const epoca of ["2025-11-25", "2026-07-28"] as const) {
    it(`${epoca}: un TypeError del almacén tras 100 ms hace rechazar a atender con error_no_controlado`, async () => {
      const { almacen, s } = await montar();
      const servidor = crearServidorMcp({
        almacen: {
          ...almacen,
          obtenerInstrucciones: async () => {
            await new Promise((r) => setTimeout(r, 100));
            throw new TypeError(CANARIO);
          },
        },
        prompt: obtenerPromptFicticio,
      });
      await expect(
        servidor.atender(
          peticion(epoca, "tools/call", { name: "obtener_instrucciones", arguments: {} }, s),
        ),
      ).rejects.toMatchObject({ codigo: "error_no_controlado" });
    });
  }
});
