// T-101 (a): prueba de humo de las dependencias nuevas (V-1, V-4; PRUEBA-002, parte).
// Todo en proceso y sin red: el manejador del SDK se llama con Request de la plataforma.
import { readFileSync } from "node:fs";
import {
  CLIENT_CAPABILITIES_META_KEY,
  CLIENT_INFO_META_KEY,
  McpServer,
  PROTOCOL_VERSION_META_KEY,
  createMcpHandler,
  fromJsonSchema,
} from "@modelcontextprotocol/server";
import Ajv2020 from "ajv/dist/2020.js";
import { describe, expect, it } from "vitest";

function crearManejador() {
  return createMcpHandler(
    () => {
      const servidor = new McpServer({ name: "humo", version: "0.0.0" });
      servidor.registerTool(
        "eco",
        {
          description: "Herramienta de humo con entrada abierta",
          inputSchema: fromJsonSchema({ type: "object", additionalProperties: true }),
        },
        async () => ({ content: [{ type: "text" as const, text: "ok" }] }),
      );
      return servidor;
    },
    { legacy: "stateless", responseMode: "json" },
  );
}

async function enviar(
  manejador: ReturnType<typeof crearManejador>,
  cuerpo: { method: string; id: number; params: Record<string, unknown> },
  cabecerasExtra: Record<string, string> = {},
) {
  const respuesta = await manejador.fetch(
    new Request("http://localhost/api/mcp", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        accept: "application/json, text/event-stream",
        ...cabecerasExtra,
      },
      body: JSON.stringify({ jsonrpc: "2.0", ...cuerpo }),
    }),
  );
  return { estado: respuesta.status, texto: await respuesta.text() };
}

// Respuesta legada: «event: message\ndata: {...}»; moderna: JSON directo.
function resultadoDe(texto: string): Record<string, unknown> {
  const linea = texto.split("\n").find((l) => l.startsWith("data: "));
  const json = linea ? linea.slice("data: ".length) : texto;
  return (JSON.parse(json) as { result: Record<string, unknown> }).result;
}

const sobre = {
  [PROTOCOL_VERSION_META_KEY]: "2026-07-28",
  [CLIENT_CAPABILITIES_META_KEY]: {},
  [CLIENT_INFO_META_KEY]: { name: "humo", version: "0.0.0" },
};
const cabecerasModernas = (metodo: string) => ({
  "mcp-protocol-version": "2026-07-28",
  "mcp-method": metodo,
});

describe("SDK del servidor MCP: manejador stateless y json (V-1)", () => {
  it("initialize con 2025-11-25 negocia 2025-11-25 y tools/list lista la herramienta", async () => {
    const manejador = crearManejador();
    const inicio = await enviar(manejador, {
      method: "initialize",
      id: 1,
      params: {
        protocolVersion: "2025-11-25",
        capabilities: {},
        clientInfo: { name: "humo", version: "0.0.0" },
      },
    });
    expect(inicio.estado).toBe(200);
    expect(resultadoDe(inicio.texto).protocolVersion).toBe("2025-11-25");

    const lista = await enviar(manejador, { method: "tools/list", id: 2, params: {} });
    expect(lista.estado).toBe(200);
    const herramientas = resultadoDe(lista.texto).tools as { name: string }[];
    expect(herramientas.map((h) => h.name)).toEqual(["eco"]);
    await manejador.close();
  });

  it("initialize pidiendo 2026-07-28 negocia 2025-11-25", async () => {
    const manejador = crearManejador();
    const inicio = await enviar(manejador, {
      method: "initialize",
      id: 1,
      params: {
        protocolVersion: "2026-07-28",
        capabilities: {},
        clientInfo: { name: "humo", version: "0.0.0" },
      },
    });
    expect(inicio.estado).toBe(200);
    expect(resultadoDe(inicio.texto).protocolVersion).toBe("2025-11-25");
    await manejador.close();
  });

  it("2026-07-28: server/discover anuncia la revisión y tools/list y tools/call responden en JSON", async () => {
    const manejador = crearManejador();
    const descubrir = await enviar(
      manejador,
      { method: "server/discover", id: 3, params: { _meta: sobre } },
      cabecerasModernas("server/discover"),
    );
    expect(descubrir.estado).toBe(200);
    expect(resultadoDe(descubrir.texto).supportedVersions).toContain("2026-07-28");

    const lista = await enviar(
      manejador,
      { method: "tools/list", id: 4, params: { _meta: sobre } },
      cabecerasModernas("tools/list"),
    );
    expect(lista.estado).toBe(200);
    const herramientas = resultadoDe(lista.texto).tools as { name: string }[];
    expect(herramientas.map((h) => h.name)).toEqual(["eco"]);

    const llamada = await enviar(
      manejador,
      { method: "tools/call", id: 5, params: { name: "eco", arguments: { x: 1 }, _meta: sobre } },
      { ...cabecerasModernas("tools/call"), "mcp-name": "eco" },
    );
    expect(llamada.estado).toBe(200);
    expect(resultadoDe(llamada.texto).content).toEqual([{ type: "text", text: "ok" }]);
    await manejador.close();
  });
});

describe("Ajv 2020-12 estricto (V-4, parte)", () => {
  it("compila contratos/informe.schema.json sin avisos", () => {
    const esquema = JSON.parse(readFileSync("contratos/informe.schema.json", "utf8")) as object;
    const ajv = new Ajv2020({ strict: true, allErrors: true });
    // Única extensión del contrato: la versión del esquema, solo informativa.
    ajv.addKeyword("x-version-esquema");
    const validar = ajv.compile(esquema);
    expect(typeof validar).toBe("function");
    expect(validar({})).toBe(false);
  });
});
