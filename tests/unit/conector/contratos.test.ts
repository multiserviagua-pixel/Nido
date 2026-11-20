// T-104 (c): contratos.ts (Ajv 2020-12 estricto). PRUEBA-003 (parte: los cuatro contratos compilan;
// lo publicado es el contrato sin $schema, $id ni x-version-esquema). No depende de los valores de
// las anotaciones ni de las descripciones: los lee del propio contrato.
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";
import {
  HERRAMIENTAS,
  contratoPublicado,
  crearAjv,
  validarEntrada,
  validarInforme,
  validarSalida,
} from "../../../src/mcp/esquemas/contratos";

const raiz = join(import.meta.dirname, "..", "..", "..", "contratos");
type Json = Record<string, unknown>;
const leer = (archivo: string): Json =>
  JSON.parse(readFileSync(join(raiz, archivo), "utf8")) as Json;

const ARCHIVO: Record<(typeof HERRAMIENTAS)[number], string> = {
  obtener_instrucciones: "obtener-instrucciones.schema.json",
  enviar_informe: "enviar-informe.schema.json",
  confirmar_orden: "confirmar-orden.schema.json",
};
const PROHIBIDAS = ["$schema", "$id", "x-version-esquema"];

// Quita recursivamente las claves que no se publican.
function sinMetadatos(valor: unknown): unknown {
  if (Array.isArray(valor)) return valor.map(sinMetadatos);
  if (valor !== null && typeof valor === "object") {
    return Object.fromEntries(
      Object.entries(valor as Json)
        .filter(([k]) => !PROHIBIDAS.includes(k))
        .map(([k, v]) => [k, sinMetadatos(v)]),
    );
  }
  return valor;
}

const uuid = (n: number): string => `0000000${n}-0000-4000-8000-00000000000${n}`;
const informe = (): Json => ({
  estado: "ok",
  modo: "conversacion",
  asistente: "claude",
  almacenamiento: "otro",
  version_prompt: "0.1",
  frecuencia_horas: 1,
  tratados: 3,
  sin_tratar: 0,
  borradores: 1,
  documentos: 0,
  facturas_pendientes: 1,
  urgentes: 1,
  comprobaciones: { correo: true, almacenamiento: true, contexto: true, registro: true },
  problemas: [],
});

describe("contratos: los cuatro compilan con Ajv 2020-12 estricto", () => {
  it("hay cuatro archivos en contratos/ y tres herramientas", () => {
    expect(readdirSync(raiz).filter((f) => f.endsWith(".schema.json"))).toHaveLength(4);
    expect([...HERRAMIENTAS].sort()).toEqual(
      ["confirmar_orden", "enviar_informe", "obtener_instrucciones"].sort(),
    );
  });

  it("entrada y salida de cada herramienta y el informe son validadores", () => {
    for (const h of HERRAMIENTAS) {
      expect(typeof validarEntrada(h)).toBe("function");
      expect(typeof validarSalida(h)).toBe("function");
    }
    expect(typeof validarInforme).toBe("function");
  });

  it("modo estricto: una palabra clave desconocida no compila, las x- vigentes sí", () => {
    const base = { type: "object", additionalProperties: false, properties: {} };
    expect(() => crearAjv().compile({ ...base, "x-desconocida": 1 })).toThrow();
    expect(() => crearAjv().compile({ ...base, desconocida: 1 })).toThrow();
    for (const k of ["x-anotaciones", "x-cuestion-abierta", "x-version-esquema"]) {
      expect(() => crearAjv().compile({ ...base, [k]: { cualquier: "cosa" } })).not.toThrow();
    }
  });

  it("el formato uuid es propio: acepta la forma canónica y nada más", () => {
    const v = crearAjv().compile({ type: "string", format: "uuid" });
    expect(v(uuid(1))).toBe(true);
    expect(v(uuid(1).toUpperCase())).toBe(true);
    for (const mal of [
      "",
      "TEXTO-CANARIO-123",
      `{${uuid(1)}}`,
      `urn:uuid:${uuid(1)}`,
      uuid(1).replaceAll("-", ""),
      `${uuid(1)}\n`,
      `${uuid(1)}0`,
    ]) {
      expect(v(mal), mal).toBe(false);
    }
    expect(v(5)).toBe(false);
  });

  it("un formato que no es uuid no se acepta (sin ajv-formats)", () => {
    expect(() => crearAjv().compile({ type: "string", format: "email" })).toThrow();
  });
});

describe("contratos: lo publicado es el contrato", () => {
  for (const h of HERRAMIENTAS) {
    it(`${h}: nombre (el title del contrato), descripción, anotaciones y esquemas salen del contrato`, () => {
      const c = leer(ARCHIVO[h]);
      const p = contratoPublicado(h);
      expect(p.name).toBe(c.title);
      expect(p.description).toBe(c.description);
      expect(p.annotations).toEqual(c["x-anotaciones"]);
      const props = c.properties as Json;
      const esperadaEntrada = sinMetadatos(props.entrada) as Json;
      const esperadaSalida = sinMetadatos(props.salida) as Json;
      if (h === "enviar_informe") {
        // La referencia al informe se publica resuelta: el cliente no ve ningún urn:.
        const inf = sinMetadatos(leer("informe.schema.json"));
        const ent = esperadaEntrada as { properties: Json };
        ent.properties = { ...ent.properties, informe: inf };
      }
      expect(p.inputSchema).toEqual(esperadaEntrada);
      expect(p.outputSchema).toEqual(esperadaSalida);
    });

    it(`${h}: no publica $schema, $id, x-version-esquema ni referencias`, () => {
      const texto = JSON.stringify(contratoPublicado(h));
      for (const k of PROHIBIDAS) expect(texto).not.toContain(`"${k}"`);
      expect(texto).not.toContain("$ref");
      expect(texto).not.toContain("urn:humanaia");
    });
  }

  it("lo publicado no comparte objetos con lo compilado (copia profunda)", () => {
    const a = contratoPublicado("enviar_informe");
    (a.inputSchema as Json).tocado = true;
    expect((contratoPublicado("enviar_informe").inputSchema as Json).tocado).toBeUndefined();
  });
});

describe("contratos: validadores", () => {
  it("entrada de obtener_instrucciones: sin parámetros; cualquiera de más no vale", () => {
    const v = validarEntrada("obtener_instrucciones");
    expect(v({})).toBe(true);
    expect(v({ cliente_id: uuid(1) })).toBe(false);
  });

  it("entrada de enviar_informe: informe válido y rechazos por tipo, rango y campo de más", () => {
    const v = validarEntrada("enviar_informe");
    expect(v({ ejecucion_id: uuid(1), informe: informe() })).toBe(true);
    expect(v({ ejecucion_id: "no-es-uuid", informe: informe() })).toBe(false);
    expect(v({ ejecucion_id: uuid(1), informe: { ...informe(), tratados: 1001 } })).toBe(false);
    expect(v({ ejecucion_id: uuid(1), informe: { ...informe(), tratados: "3" } })).toBe(false);
    expect(v({ ejecucion_id: uuid(1), informe: { ...informe(), extra: "x" } })).toBe(false);
    expect(v({ ejecucion_id: uuid(1), informe: { ...informe(), estado: "otro" } })).toBe(false);
    expect(
      v({ ejecucion_id: uuid(1), informe: { ...informe(), problemas: ["otro", "otro"] } }),
    ).toBe(false);
    expect(v({ ejecucion_id: uuid(1), informe: { ...informe(), version_prompt: "1.x" } })).toBe(
      false,
    );
    expect(v({ ejecucion_id: uuid(1), informe: informe(), cliente_id: uuid(2) })).toBe(false);
    expect(v({ ejecucion_id: uuid(1) })).toBe(false);
  });

  it("validarInforme valida el informe suelto", () => {
    expect(validarInforme(informe())).toBe(true);
    expect(validarInforme({ ...informe(), documentos: -1 })).toBe(false);
    expect(validarInforme({ ...informe(), texto_libre: "x" })).toBe(false);
  });

  it("entrada de confirmar_orden", () => {
    const v = validarEntrada("confirmar_orden");
    expect(v({ orden_id: uuid(3) })).toBe(true);
    expect(v({ orden_id: "x" })).toBe(false);
    expect(v({})).toBe(false);
  });

  it("salidas: forma cerrada", () => {
    expect(validarSalida("confirmar_orden")({ confirmada: true, repetida: false })).toBe(true);
    expect(validarSalida("confirmar_orden")({ confirmada: true, otro: 1 })).toBe(false);
    expect(validarSalida("enviar_informe")({ guardado: true })).toBe(true);
    expect(validarSalida("enviar_informe")({ guardado: "si" })).toBe(false);
    const pausada = {
      estado: "pausada",
      ejecucion_id: uuid(1),
      orden: null,
      instrucciones: null,
    };
    expect(validarSalida("obtener_instrucciones")(pausada)).toBe(true);
    expect(validarSalida("obtener_instrucciones")({ ...pausada, estado: "otro" })).toBe(false);
    expect(
      validarSalida("obtener_instrucciones")({
        ...pausada,
        orden: { id: uuid(2), tipo: "borrar" },
      }),
    ).toBe(false);
  });
});

describe("contratos: anotaciones fijadas (MAYOR-3)", () => {
  it("las tres herramientas se publican con readOnlyHint false", () => {
    for (const h of HERRAMIENTAS) {
      expect(contratoPublicado(h).annotations.readOnlyHint, h).toBe(false);
    }
  });

  it.each(Object.entries(ARCHIVO))(
    "%s: una copia del contrato con readOnlyHint true hace fallar la carga",
    async (_h, archivo) => {
      const original = leer(archivo);
      const anot = original["x-anotaciones"] as Json;
      vi.resetModules();
      vi.doMock(`../../../contratos/${archivo}`, () => ({
        default: { ...original, "x-anotaciones": { ...anot, readOnlyHint: true } },
      }));
      try {
        await expect(import("../../../src/mcp/esquemas/contratos")).rejects.toMatchObject({
          codigo: "error_no_controlado",
        });
      } finally {
        vi.doUnmock(`../../../contratos/${archivo}`);
        vi.resetModules();
      }
    },
  );
});

describe("contratos: coherencia de la salida de obtener_instrucciones (MENOR-3)", () => {
  const salida = {
    estado: "activa",
    ejecucion_id: uuid(1),
    orden: null,
    instrucciones: null,
  };
  const v = validarSalida("obtener_instrucciones");

  it("pausada con instrucciones no vale; pausada sin ellas, sí", () => {
    const instrucciones = leerInstrucciones();
    expect(v({ ...salida, estado: "pausada", instrucciones })).toBe(false);
    expect(v({ ...salida, estado: "pausada" })).toBe(true);
  });

  it("suspendida con orden o con instrucciones no vale", () => {
    const orden = { id: uuid(2), tipo: "pausar" };
    expect(v({ ...salida, estado: "suspendida", orden })).toBe(false);
    expect(v({ ...salida, estado: "suspendida", instrucciones: leerInstrucciones() })).toBe(false);
    expect(v({ ...salida, estado: "suspendida" })).toBe(true);
  });

  it("activa con instrucciones null no vale", () => {
    expect(v({ ...salida, estado: "activa", instrucciones: null })).toBe(false);
  });

  it("activa sigue necesitando sus instrucciones según el contrato", () => {
    expect(v({ ...salida, estado: "activa", instrucciones: leerInstrucciones() })).toBe(true);
  });
});

// Instrucciones válidas según el contrato (valores ficticios).
function leerInstrucciones(): Json {
  return {
    version: "0.1",
    huella_sha256: "a".repeat(64),
    prompt: "TEXTO-FICTICIO",
    reglas: {
      max_correos_por_revision: 30,
      ventana_dias: 7,
      guardar_adjuntos: false,
      preparar_borradores: true,
      descargar_facturas_por_enlace: false,
    },
  };
}
