// T-105 (d) (001): sanear-informe.ts. PRUEBA-017 (parte): del informe y de `comprobaciones` solo pasan las
// claves del contrato; las demás se cuentan (campos_descartados) sin leer su valor y sin guardar su
// nombre; `__proto__` y `constructor` no contaminan nada. Valores marcados compuestos en ejecución.
import { describe, expect, it } from "vitest";
import informeContrato from "../../../contratos/informe.schema.json";
import { sanearInforme } from "../../../src/mcp/esquemas/sanear-informe";
import { validarInforme } from "../../../src/mcp/esquemas/contratos";
import { capturarConsola, crearSumidero } from "../../conector/apoyo/index";

const CANARIO = "TEXTO-CANARIO-" + "INFORME-123";
const valido = () => ({
  estado: "ok",
  modo: "desatendido",
  asistente: "claude",
  almacenamiento: "drive",
  version_prompt: "0.1",
  frecuencia_horas: 24,
  tratados: 3,
  sin_tratar: 10,
  borradores: 1,
  documentos: 0,
  facturas_pendientes: 2,
  urgentes: 0,
  comprobaciones: { correo: true, almacenamiento: true, contexto: true, registro: true },
  problemas: ["sin_contexto"],
});
// JSON.parse crea `__proto__` y `constructor` como claves propias, como llegarían por la red.
const deJson = (texto: string): unknown => JSON.parse(texto);

describe("sanear informe: descarte y recuento (PRUEBA-017, parte)", () => {
  it("un informe limpio pasa igual, con 0 descartados, y valida con el contrato", () => {
    const r = sanearInforme(valido());
    expect(r).toEqual({ informe: valido(), descartados: 0 });
    expect(validarInforme(r.informe)).toBe(true);
  });

  it("las claves aceptadas salen del contrato publicado", () => {
    const completo = { ...valido(), ...{ [CANARIO]: 1 } };
    const r = sanearInforme(completo);
    expect(Object.keys(r.informe!).sort()).toEqual(Object.keys(informeContrato.properties).sort());
  });

  it("tres campos de más (dos en el informe y uno en comprobaciones): campos_descartados 3 y 0 apariciones", () => {
    const sucio = valido() as Record<string, unknown>;
    sucio[`nombre_${CANARIO}`] = `valor ${CANARIO}`;
    sucio.otro = { anidado: CANARIO };
    (sucio.comprobaciones as Record<string, unknown>)[`extra_${CANARIO}`] = CANARIO;
    const sumidero = crearSumidero();
    const captura = capturarConsola(sumidero);
    try {
      const r = sanearInforme(sucio);
      expect(r.descartados).toBe(3);
      expect(r.informe).toEqual(valido());
      const texto = JSON.stringify(r);
      expect(texto).not.toContain(CANARIO);
      expect(texto).not.toContain("anidado");
      expect(texto).not.toContain("otro");
      expect(sumidero.hallar(CANARIO)).toEqual([]);
    } finally {
      captura.restaurar();
    }
  });

  it("no lee el valor de lo descartado (ni getters ni proxies de las claves ajenas)", () => {
    let lecturas = 0;
    const sucio = valido() as Record<string, unknown>;
    Object.defineProperty(sucio, "ajena", {
      enumerable: true,
      get() {
        lecturas++;
        return CANARIO;
      },
    });
    const r = sanearInforme(sucio);
    expect(r.descartados).toBe(1);
    expect(lecturas).toBe(0);
  });

  it("__proto__ y constructor llegados por JSON se cuentan y no contaminan nada", () => {
    const texto = JSON.stringify(valido()).replace(
      "{",
      `{"__proto__":{"contaminado":true},"constructor":{"prototype":{"contaminado":true}},`,
    );
    const entrada = deJson(texto);
    expect(Object.keys(entrada as object)).toContain("__proto__");
    const r = sanearInforme(entrada);
    expect(r.descartados).toBe(2);
    expect(r.informe).toEqual(valido());
    expect(Object.getPrototypeOf(r.informe)).toBe(Object.prototype);
    expect(Object.keys(r.informe!)).not.toContain("__proto__");
    expect(Object.keys(r.informe!)).not.toContain("constructor");
    expect((r.informe as { contaminado?: unknown }).contaminado).toBeUndefined();
    expect(({} as { contaminado?: unknown }).contaminado).toBeUndefined();
    expect(Object.prototype.hasOwnProperty.call(Object.prototype, "contaminado")).toBe(false);
  });

  it("__proto__ y constructor dentro de comprobaciones también se cuentan", () => {
    const base = JSON.stringify(valido()).replace(
      '"comprobaciones":{',
      '"comprobaciones":{"__proto__":{"x":1},"constructor":1,',
    );
    const r = sanearInforme(deJson(base));
    expect(r.descartados).toBe(2);
    expect(r.informe).toEqual(valido());
  });

  it("lo que no es un objeto simple da informe nulo y 0 descartados (el almacén decidirá: informe_invalido)", () => {
    for (const malo of [null, undefined, 1, "texto", true, [], [valido()], new Date(), () => 1]) {
      expect(sanearInforme(malo)).toEqual({ informe: null, descartados: 0 });
    }
  });

  it("comprobaciones que no es un objeto se deja tal cual para que la validación lo rechace, sin contar", () => {
    const r = sanearInforme({ ...valido(), comprobaciones: CANARIO });
    expect(r.descartados).toBe(0);
    expect(validarInforme(r.informe)).toBe(false);
  });

  it("valores ajenos al contrato en claves del contrato no se corrigen: la validación los rechaza", () => {
    const r = sanearInforme({ ...valido(), estado: CANARIO, tratados: 1001 });
    expect(r.descartados).toBe(0);
    expect(validarInforme(r.informe)).toBe(false);
  });

  it("un informe incompleto sigue incompleto (no se rellenan claves)", () => {
    const { tratados: _quitada, ...resto } = valido();
    void _quitada;
    const r = sanearInforme(resto);
    expect(r.informe).toEqual(resto);
    expect(validarInforme(r.informe)).toBe(false);
  });

  it("un objeto hostil que lanza al leer se trata como informe nulo, sin propagar", () => {
    const hostil = new Proxy(
      {},
      {
        ownKeys() {
          throw new Error(CANARIO);
        },
      },
    );
    expect(sanearInforme(hostil)).toEqual({ informe: null, descartados: 0 });
  });

  it("no modifica la entrada", () => {
    const sucio = { ...valido(), ajena: 1 };
    const antes = JSON.stringify(sucio);
    sanearInforme(sucio);
    expect(JSON.stringify(sucio)).toBe(antes);
  });
});
