// T-016 (d) · lógica de `BloqueDatos` (diseño 020, «Estados de cada vista» y «Cambio de periodo»,
// punto 4; REQ-023, REQ-025, REQ-026, REQ-028, REQ-069). Sin navegador ni jsdom: la lista cerrada
// de estados, los plazos de 10 s y 30 s y la regla de la respuesta tardía. Escrita antes que el
// código (en rojo, sin módulo).
import { describe, expect, it } from "vitest";
import { TEXTOS } from "../../../src/components/textos";
import {
  ESTADOS_DE_BLOQUE,
  LECTURA_INICIAL,
  anuncioDeError,
  PLAZO_DE_AVISO_MS,
  PLAZO_DE_ERROR_MS,
  faseDeCarga,
  leerEstadoDeBloque,
  reducirLectura,
  resolverBloque,
  type LecturaDeBloque,
} from "../../../src/components/estados/bloque";

describe("estado del bloque: lista cerrada (REQ-025)", () => {
  it("son los cinco del diseño", () => {
    expect([...ESTADOS_DE_BLOQUE]).toEqual(["carga", "vacio", "error", "sin_permiso", "datos"]);
  });

  it.each([...ESTADOS_DE_BLOQUE])("%s se lee tal cual", (estado) => {
    expect(leerEstadoDeBloque(estado)).toBe(estado);
  });

  it.each([
    ["una cadena libre", "relation clientes does not exist"],
    ["otra mayúscula", "DATOS"],
    ["con espacios", " datos "],
    ["__proto__", "__proto__"],
    ["constructor", "constructor"],
    ["vacío", ""],
    ["un número", 3],
    ["nulo", null],
    ["indefinido", undefined],
    ["un objeto", { estado: "datos" }],
  ])("%s cierra en fallo: es un error, nunca datos", (_nombre, valor) => {
    expect(leerEstadoDeBloque(valor)).toBe("error");
  });
});

describe("plazos: 10 s avisa y 30 s da error (REQ-023, REQ-069)", () => {
  it("las constantes son las del diseño", () => {
    expect(PLAZO_DE_AVISO_MS).toBe(10_000);
    expect(PLAZO_DE_ERROR_MS).toBe(30_000);
  });

  it.each([
    [0, "normal"],
    [1, "normal"],
    [9_999, "normal"],
    [10_000, "lenta"],
    [10_001, "lenta"],
    [29_999, "lenta"],
    [30_000, "agotada"],
    [30_001, "agotada"],
    [600_000, "agotada"],
  ])("a los %i ms la fase es %s", (ms, fase) => {
    expect(faseDeCarga(ms)).toBe(fase);
  });

  it("un tiempo que no es un número sano cierra en fallo: agotado, nunca una espera infinita", () => {
    expect(faseDeCarga(Number.NaN)).toBe("agotada");
    expect(faseDeCarga(Number.POSITIVE_INFINITY)).toBe("agotada");
    expect(faseDeCarga("10000" as unknown as number)).toBe("agotada");
  });

  it("un tiempo negativo (reloj retrasado) cuenta como cero", () => {
    expect(faseDeCarga(-5)).toBe("normal");
  });
});

describe("resolverBloque: qué se ve según el estado y los plazos", () => {
  it("carga normal: carga, sin aviso", () => {
    expect(resolverBloque("carga", "normal")).toEqual({
      estado: "carga",
      lenta: false,
      motivo: null,
    });
  });

  it("carga a los 10 s: sigue en carga y avisa", () => {
    expect(resolverBloque("carga", "lenta")).toEqual({
      estado: "carga",
      lenta: true,
      motivo: null,
    });
  });

  it("carga a los 30 s: error con el motivo tarda_demasiado, sin cancelar nada", () => {
    expect(resolverBloque("carga", "agotada")).toEqual({
      estado: "error",
      lenta: false,
      motivo: "tarda_demasiado",
    });
  });

  it.each(["vacio", "error", "sin_permiso", "datos"] as const)(
    "%s no depende de los plazos",
    (estado) => {
      for (const fase of ["normal", "lenta", "agotada"] as const) {
        expect(resolverBloque(estado, fase)).toEqual({ estado, lenta: false, motivo: null });
      }
    },
  );

  it("un estado desconocido es un error aunque el reloj diga otra cosa", () => {
    expect(resolverBloque("lo-que-sea", "normal")).toEqual({
      estado: "error",
      lenta: false,
      motivo: null,
    });
  });
});

describe("la lectura de un bloque y la respuesta tardía (diseño, «Cambio de periodo», puntos 4 y 6)", () => {
  const inicial = LECTURA_INICIAL;

  it("arranca en carga, en el primer envío", () => {
    expect(inicial).toEqual({ envio: 1, estado: "carga", motivo: null });
  });

  it("la respuesta del envío en curso lo resuelve", () => {
    const l = reducirLectura(inicial, { tipo: "llega", envio: 1, estado: "datos" });
    expect(l).toEqual({ envio: 1, estado: "datos", motivo: null });
  });

  it("un error trae su motivo de la lista; uno que no es de la lista es desconocido", () => {
    expect(
      reducirLectura(inicial, {
        tipo: "llega",
        envio: 1,
        estado: "error",
        motivo: "fallo_servidor",
      }),
    ).toEqual({ envio: 1, estado: "error", motivo: "fallo_servidor" });
    expect(
      reducirLectura(inicial, { tipo: "llega", envio: 1, estado: "error", motivo: "boom: SQL" }),
    ).toEqual({ envio: 1, estado: "error", motivo: "desconocido" });
  });

  it("pedir de nuevo (Reintentar) abre otro envío y vuelve a carga", () => {
    const fallo = reducirLectura(inicial, { tipo: "llega", envio: 1, estado: "error" });
    expect(reducirLectura(fallo, { tipo: "pedir" })).toEqual({
      envio: 2,
      estado: "carga",
      motivo: null,
    });
  });

  it("la respuesta tardía del mismo envío, tras haberse visto el error de los 30 s, se acepta (el error era solo visual)", () => {
    // A los 30 s el bloque pinta el error pero la lectura sigue en `carga`: no hay otro estado.
    const l = reducirLectura(inicial, { tipo: "llega", envio: 1, estado: "datos" });
    expect(l.estado).toBe("datos");
  });

  it("la respuesta de un envío anterior no pisa el envío en curso", () => {
    const segundo = reducirLectura(inicial, { tipo: "pedir" });
    expect(reducirLectura(segundo, { tipo: "llega", envio: 1, estado: "datos" })).toBe(segundo);
  });

  it("la respuesta de un envío anterior no pisa un estado ya final del envío siguiente", () => {
    const segundo = reducirLectura(inicial, { tipo: "pedir" });
    const final = reducirLectura(segundo, {
      tipo: "llega",
      envio: 2,
      estado: "error",
      motivo: "sin_conexion",
    });
    expect(reducirLectura(final, { tipo: "llega", envio: 1, estado: "datos" })).toBe(final);
  });

  it("una segunda respuesta del mismo envío no pisa un estado ya final", () => {
    const final = reducirLectura(inicial, { tipo: "llega", envio: 1, estado: "datos" });
    expect(reducirLectura(final, { tipo: "llega", envio: 1, estado: "error" })).toBe(final);
    expect(reducirLectura(final, { tipo: "llega", envio: 1, estado: "vacio" })).toBe(final);
  });

  it("una respuesta de un envío que aún no existe no se acepta", () => {
    expect(reducirLectura(inicial, { tipo: "llega", envio: 7, estado: "datos" })).toBe(inicial);
  });

  it("llegar con `carga` no resuelve nada; con un estado desconocido, error", () => {
    expect(reducirLectura(inicial, { tipo: "llega", envio: 1, estado: "carga" as never })).toBe(
      inicial,
    );
    const l: LecturaDeBloque = reducirLectura(inicial, {
      tipo: "llega",
      envio: 1,
      estado: "lo-que-sea" as never,
    });
    expect(l).toEqual({ envio: 1, estado: "error", motivo: "desconocido" });
  });

  it("un evento que no es de la lista no cambia nada", () => {
    expect(reducirLectura(inicial, { tipo: "borra-todo" } as never)).toBe(inicial);
    expect(reducirLectura(inicial, null as never)).toBe(inicial);
  });

  it("el número de envío que llega tiene que ser exactamente el actual (nada de cadenas)", () => {
    expect(reducirLectura(inicial, { tipo: "llega", envio: "1" as never, estado: "datos" })).toBe(
      inicial,
    );
  });
});

describe("texto del anuncio de un error (REQ-057, menor 26 c)", () => {
  it("es el texto fijo del motivo y, si hay una referencia válida, la referencia", () => {
    expect(anuncioDeError("fallo_servidor", "S-7K3M9QX2AB")).toBe(
      `${TEXTOS.motivosDeError.fallo_servidor} ${TEXTOS.bloque.referencia}: S-7K3M9QX2AB`,
    );
  });

  it("sin referencia, o con una que no cumple el formato, solo el texto del motivo", () => {
    expect(anuncioDeError("sin_conexion", null)).toBe(TEXTOS.motivosDeError.sin_conexion);
    expect(anuncioDeError("sin_conexion", undefined)).toBe(TEXTOS.motivosDeError.sin_conexion);
    expect(anuncioDeError("sin_conexion", 'relation "clientes" does not exist')).toBe(
      TEXTOS.motivosDeError.sin_conexion,
    );
  });

  it("un motivo que no es de la lista anuncia el de «desconocido»", () => {
    expect(anuncioDeError("boom" as never, null)).toBe(TEXTOS.motivosDeError.desconocido);
  });
});
