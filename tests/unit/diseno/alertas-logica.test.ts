// T-010 (i) · lectura de las alertas (diseño 020, «Componentes base», fila `ListaAlertas`; REQ-016,
// REQ-047, REQ-056, REQ-075; CA-012, CA-051). Lo que llega es un dato no confiable: gravedad, tipo
// y acción son de listas cerradas, el momento sale del formato común y el cliente es el único
// texto libre (se pinta aparte con `TextoDato`). Lo que no se reconoce cierra en «desconocida» o
// «desconocido», nunca en algo favorable, y lo recibido de más no se lee.
import { describe, expect, it } from "vitest";
import {
  ACCIONES_DE_ALERTA,
  GRAVEDADES_DE_ALERTA,
  TIPOS_DE_ALERTA,
  leerAccionDeAlerta,
  leerAlerta,
  leerGravedadDeAlerta,
  leerTipoDeAlerta,
} from "../../../src/components/alertas/logica";
import { TEXTOS } from "../../../src/components/textos";

const MOMENTO = "2026-11-12T07:04:00Z"; // 08:04 en Madrid

describe("leerGravedadDeAlerta · lista cerrada", () => {
  it("reconoce las tres gravedades", () => {
    expect([...GRAVEDADES_DE_ALERTA]).toEqual(["critica", "aviso", "informacion"]);
    for (const g of GRAVEDADES_DE_ALERTA) expect(leerGravedadDeAlerta(g)).toBe(g);
  });

  it("cualquier otra cosa es «desconocida», nunca una gravedad menor", () => {
    for (const v of [
      "CRITICA",
      "grave",
      "",
      " critica",
      "critica ",
      "__proto__",
      "constructor",
      "toString",
      null,
      undefined,
      0,
      1,
      true,
      {},
      [],
      ["critica"],
      { gravedad: "critica" },
      Symbol("critica"),
    ]) {
      expect(leerGravedadDeAlerta(v), String(typeof v)).toBe("desconocida");
    }
  });
});

describe("leerTipoDeAlerta y leerAccionDeAlerta · listas cerradas", () => {
  it("el tipo conocido se devuelve; el resto, «desconocido»", () => {
    for (const t of TIPOS_DE_ALERTA) expect(leerTipoDeAlerta(t)).toBe(t);
    for (const v of ["Agente_sin_senal", "otro", "", "__proto__", "hasOwnProperty", null, 3, {}]) {
      expect(leerTipoDeAlerta(v)).toBe("desconocido");
    }
  });

  it("la acción conocida se devuelve; el resto, ninguna (no hay botón)", () => {
    for (const a of ACCIONES_DE_ALERTA) expect(leerAccionDeAlerta(a)).toBe(a);
    for (const v of ["Reanudar agente", "", "__proto__", "constructor", null, undefined, 7, {}]) {
      expect(leerAccionDeAlerta(v)).toBeNull();
    }
  });

  it("cada tipo, gravedad y acción tiene su texto fijo en TEXTOS.alertas", () => {
    for (const t of TIPOS_DE_ALERTA) expect(TEXTOS.alertas.tipos[t].length).toBeGreaterThan(0);
    expect(TEXTOS.alertas.tipos.desconocido.length).toBeGreaterThan(0);
    for (const g of GRAVEDADES_DE_ALERTA) {
      expect(TEXTOS.alertas.gravedad[g].length).toBeGreaterThan(0);
    }
    expect(TEXTOS.alertas.gravedad.desconocida.length).toBeGreaterThan(0);
    for (const a of ACCIONES_DE_ALERTA) {
      expect(TEXTOS.alertas.acciones[a].texto.length).toBeGreaterThan(0);
      expect(TEXTOS.alertas.acciones[a].enCurso.length).toBeGreaterThan(0);
    }
  });

  it("cada gravedad tiene una palabra distinta", () => {
    const palabras = Object.values(TEXTOS.alertas.gravedad);
    expect(new Set(palabras).size).toBe(palabras.length);
  });
});

describe("leerAlerta · una alerta entera", () => {
  it("una alerta bien formada: gravedad, tipo, momento con el formato común, cliente y acción", () => {
    expect(
      leerAlerta({
        gravedad: "critica",
        tipo: "agente_sin_senal",
        momento: MOMENTO,
        cliente: "Cliente de ejemplo",
        accion: "reanudar_agente",
        enCurso: true,
      }),
    ).toEqual({
      gravedad: "critica",
      tipo: "agente_sin_senal",
      momento: "12 nov 2026, 08:04",
      cliente: "Cliente de ejemplo",
      accion: "reanudar_agente",
      enCurso: true,
    });
  });

  it("sin cliente, sin acción y sin «en curso»: nulos y falso", () => {
    expect(
      leerAlerta({ gravedad: "aviso", tipo: "licencia_por_caducar", momento: MOMENTO }),
    ).toMatchObject({ cliente: null, accion: null, enCurso: false });
  });

  it("el momento que no es un instante válido es «Sin datos», nunca una fecha inventada", () => {
    for (const m of [undefined, null, "", "ayer", "2026-02-30T10:00:00Z", "2026-11-12", {}, NaN]) {
      expect(
        leerAlerta({ gravedad: "aviso", tipo: "licencia_por_caducar", momento: m }).momento,
      ).toBe(TEXTOS.formato.sinDatos);
    }
  });

  it("«en curso» solo con true exacto", () => {
    for (const v of ["true", 1, "si", {}, [], null, undefined, false]) {
      expect(leerAlerta({ enCurso: v }).enCurso, String(v)).toBe(false);
    }
    expect(leerAlerta({ enCurso: true }).enCurso).toBe(true);
  });

  it("el cliente pasa por el texto plano: sin control ni dirección; vacío o no cadena, ninguno", () => {
    const RLO = String.fromCharCode(0x202e);
    expect(leerAlerta({ cliente: `Ana${RLO} Pérez\u0007` }).cliente).toBe("Ana Pérez");
    for (const v of ["", "\u200b\u2060", "   ", null, undefined, 5, {}, ["a"]]) {
      expect(leerAlerta({ cliente: v }).cliente, String(v)).toBeNull();
    }
  });

  it("un cliente de 120 caracteres se conserva entero", () => {
    const largo = "a".repeat(120);
    expect(leerAlerta({ cliente: largo }).cliente).toBe(largo);
  });

  it("lo que no es un objeto cierra en alerta desconocida, sin botón ni cliente", () => {
    for (const v of [null, undefined, "texto", 3, [], () => 1]) {
      expect(leerAlerta(v)).toEqual({
        gravedad: "desconocida",
        tipo: "desconocido",
        momento: TEXTOS.formato.sinDatos,
        cliente: null,
        accion: null,
        enCurso: false,
      });
    }
  });

  it("solo se leen las claves propias: nada heredado ni de más", () => {
    const heredada = Object.create({ gravedad: "critica", tipo: "agente_sin_senal" }) as object;
    expect(leerAlerta(heredada)).toMatchObject({ gravedad: "desconocida", tipo: "desconocido" });
    const conExtras = {
      gravedad: "aviso",
      tipo: "licencia_por_caducar",
      momento: MOMENTO,
      mensaje: "TESTIGO-MENSAJE",
      detalle: "TESTIGO-DETALLE",
      id: "TESTIGO-ID",
    };
    expect(JSON.stringify(leerAlerta(conExtras))).not.toContain("TESTIGO");
  });

  it("el resultado no tiene más campos que los seis esperados y no se puede cambiar", () => {
    const a = leerAlerta({ gravedad: "aviso", tipo: "licencia_por_caducar", momento: MOMENTO });
    expect(Object.keys(a).sort()).toEqual(
      ["accion", "cliente", "enCurso", "gravedad", "momento", "tipo"].sort(),
    );
    expect(Object.isFrozen(a)).toBe(true);
  });

  it("nunca lanza con una entrada hostil (captadores que fallan, proxies)", () => {
    const malo = {
      get gravedad(): string {
        throw new Error("no");
      },
    };
    expect(() => leerAlerta(malo)).not.toThrow();
    expect(leerAlerta(malo).gravedad).toBe("desconocida");
    const proxy = new Proxy(
      {},
      {
        has() {
          throw new Error("no");
        },
        getOwnPropertyDescriptor() {
          throw new Error("no");
        },
      },
    );
    expect(() => leerAlerta(proxy)).not.toThrow();
  });
});
