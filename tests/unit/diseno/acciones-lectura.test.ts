// T-010 (d) · `leerResultadoAccion` (diseño 020, «Estados de cada vista», correspondencia entre lo
// que responde el servidor y el resultado; REQ-073, REQ-078; PRUEBA-015, PRUEBA-016). Función pura
// sobre una entrada no confiable (artículos 1 y 7): éxito solo con confirmación expresa, y todo lo
// que no encaja en una forma conocida cierra en `incierta` (artículo 3). Aquí, la tabla entera.
import { describe, expect, it } from "vitest";
import {
  leerResultadoAccion,
  RESULTADOS_DE_ACCION,
} from "../../../src/components/acciones/resultado";

const LISTAS = {
  motivos: ["estado_distinto"],
  campos: ["nombre", "descripcion"],
  codigos: ["obligatorio", "demasiado_largo"],
} as const;
const leer = (r: unknown) => leerResultadoAccion(r, LISTAS);
const INCIERTA = { resultado: "incierta" };

describe("leerResultadoAccion · la lista de resultados es cerrada", () => {
  it("son cuatro y en este orden", () => {
    expect([...RESULTADOS_DE_ACCION]).toEqual(["hecha", "rechazada", "no_permitida", "incierta"]);
  });
});

describe("leerResultadoAccion · éxito solo con confirmación expresa", () => {
  it("el cuerpo dice hecha, sin código HTTP o con uno 2xx: hecha", () => {
    expect(leer({ cuerpo: { resultado: "hecha" } })).toEqual({ resultado: "hecha" });
    expect(leer({ estado: 200, cuerpo: { resultado: "hecha" } })).toEqual({ resultado: "hecha" });
    expect(leer({ estado: 204, cuerpo: { resultado: "hecha" } })).toEqual({ resultado: "hecha" });
  });

  it("un 200 sin confirmación expresa no es éxito", () => {
    for (const cuerpo of [{}, { ok: true }, { resultado: "ok" }, { resultado: "HECHA" }, "hecha"]) {
      expect(leer({ estado: 200, cuerpo })).toEqual(INCIERTA);
    }
    expect(leer({ estado: 200 })).toEqual(INCIERTA);
  });

  it("hecha con un código que no es 2xx se contradice: incierta", () => {
    for (const estado of [301, 400, 404, 409, 500, 503]) {
      expect(leer({ estado, cuerpo: { resultado: "hecha" } }), String(estado)).toEqual(INCIERTA);
    }
  });

  it("hecha con campos de más es una forma distinta de la esperada: incierta", () => {
    expect(leer({ cuerpo: { resultado: "hecha", mensaje: "Listo" } })).toEqual(INCIERTA);
  });
});

describe("leerResultadoAccion · rechazada: no se aplicó nada, con motivo de lista cerrada", () => {
  it("con motivo de la lista y sin errores de campo", () => {
    expect(leer({ cuerpo: { resultado: "rechazada", motivo: "estado_distinto" } })).toEqual({
      resultado: "rechazada",
      motivo: "estado_distinto",
      errores: [],
    });
  });

  it("con un código 4xx (menos 401 y 403) también vale", () => {
    expect(
      leer({ estado: 409, cuerpo: { resultado: "rechazada", motivo: "estado_distinto" } }),
    ).toMatchObject({ resultado: "rechazada" });
    expect(
      leer({ estado: 422, cuerpo: { resultado: "rechazada", motivo: "estado_distinto" } }),
    ).toMatchObject({ resultado: "rechazada" });
  });

  it("con un 5xx no es rechazo: no se sabe si se aplicó", () => {
    expect(
      leer({ estado: 500, cuerpo: { resultado: "rechazada", motivo: "estado_distinto" } }),
    ).toEqual(INCIERTA);
  });

  it("un motivo fuera de la lista, ausente o no textual: incierta", () => {
    const motivos = ["otro", "", "ESTADO_DISTINTO", undefined, null, 3, {}, ["estado_distinto"]];
    for (const motivo of motivos) {
      const cuerpo = { resultado: "rechazada", ...(motivo === undefined ? {} : { motivo }) };
      expect(leer({ cuerpo }), String(motivo)).toEqual(INCIERTA);
    }
  });

  it("sin lista de motivos declarada, ningún motivo vale", () => {
    expect(
      leerResultadoAccion({ cuerpo: { resultado: "rechazada", motivo: "estado_distinto" } }),
    ).toEqual(INCIERTA);
  });

  it("errores de campo {campo, codigo} de las listas se conservan", () => {
    expect(
      leer({
        cuerpo: {
          resultado: "rechazada",
          motivo: "estado_distinto",
          errores: [{ campo: "nombre", codigo: "obligatorio" }],
        },
      }),
    ).toEqual({
      resultado: "rechazada",
      motivo: "estado_distinto",
      errores: [{ campo: "nombre", codigo: "obligatorio" }],
    });
  });

  it("un campo o un código desconocidos pasan a error general: nunca el valor recibido", () => {
    const r = leer({
      cuerpo: {
        resultado: "rechazada",
        motivo: "estado_distinto",
        errores: [
          { campo: "inventado", codigo: "obligatorio" },
          { campo: "nombre", codigo: "<script>alert(1)</script>" },
          { campo: "nombre", codigo: "obligatorio" },
        ],
      },
    });
    expect(r).toEqual({
      resultado: "rechazada",
      motivo: "estado_distinto",
      errores: [
        { campo: null, codigo: null },
        { campo: "nombre", codigo: "obligatorio" },
      ],
    });
    expect(JSON.stringify(r)).not.toMatch(/inventado|script/);
  });

  it("errores mal formados o demasiados: incierta", () => {
    const base = { resultado: "rechazada", motivo: "estado_distinto" };
    const malos: unknown[] = [
      "nombre",
      {},
      [null],
      ["nombre"],
      [{ campo: "nombre" }],
      [{ campo: 1, codigo: "obligatorio" }],
      [{ campo: "nombre", codigo: "obligatorio", texto: "Falta el nombre" }],
      Array.from({ length: 21 }, () => ({ campo: "nombre", codigo: "obligatorio" })),
    ];
    for (const errores of malos) {
      expect(leer({ cuerpo: { ...base, errores } }), JSON.stringify(errores)).toEqual(INCIERTA);
    }
  });
});

describe("leerResultadoAccion · sesión no válida o sin permiso", () => {
  it("un 401 o un 403 son no_permitida, con cualquier cuerpo o ninguno", () => {
    for (const estado of [401, 403]) {
      for (const cuerpo of [undefined, null, "", "<html>", { resultado: "hecha" }, { x: 1 }]) {
        expect(leer({ estado, cuerpo }), `${estado} ${JSON.stringify(cuerpo)}`).toEqual({
          resultado: "no_permitida",
        });
      }
    }
  });

  it("el cuerpo puede decirlo de forma expresa", () => {
    expect(leer({ cuerpo: { resultado: "no_permitida" } })).toEqual({ resultado: "no_permitida" });
    expect(leer({ estado: 200, cuerpo: { resultado: "no_permitida" } })).toEqual({
      resultado: "no_permitida",
    });
  });

  it("nunca afirma un cambio: un 401 con cuerpo de éxito no se lee como hecha", () => {
    expect(leer({ estado: 401, cuerpo: { resultado: "hecha" } }).resultado).not.toBe("hecha");
  });
});

describe("leerResultadoAccion · cualquier otra cosa cierra en incierta", () => {
  it("errores del servidor y códigos que no son 2xx ni 4xx", () => {
    for (const estado of [100, 301, 302, 500, 502, 503, 504, 599]) {
      expect(leer({ estado, cuerpo: { resultado: "hecha" } }), String(estado)).toEqual(INCIERTA);
      expect(leer({ estado }), String(estado)).toEqual(INCIERTA);
    }
  });

  it("código HTTP imposible o no entero", () => {
    for (const estado of [0, -1, 99, 600, 200.5, NaN, Infinity, "200", null, {}, true]) {
      expect(leer({ estado, cuerpo: { resultado: "hecha" } }), String(estado)).toEqual(INCIERTA);
    }
  });

  it("nada, ilegible, forma distinta o resultado desconocido", () => {
    const entradas: unknown[] = [
      undefined,
      null,
      "",
      "hecha",
      "<html>Error</html>",
      0,
      1,
      true,
      [],
      [{ resultado: "hecha" }],
      () => ({ resultado: "hecha" }),
      Symbol("x"),
      {},
      { cuerpo: null },
      { cuerpo: [] },
      { cuerpo: "texto" },
      { cuerpo: { resultado: "exito" } },
      { cuerpo: { resultado: 1 } },
      { cuerpo: { resultado: ["hecha"] } },
      { cuerpo: { resultado: "incierta" } },
      { resultado: "hecha" },
      { estado: 200, cuerpo: { resultado: "hecha" }, extra: 1 },
    ];
    for (const e of entradas) expect(leer(e), String(typeof e)).toEqual(INCIERTA);
  });

  it("un objeto cuyas propiedades fallan al leerse o que no es plano: incierta, sin lanzar", () => {
    const hostil = {
      get cuerpo(): unknown {
        throw new Error("a propósito");
      },
    };
    expect(leer(hostil)).toEqual(INCIERTA);
    class Falso {
      cuerpo = { resultado: "hecha" };
    }
    expect(leer(new Falso())).toEqual(INCIERTA);
    class Cuerpo {
      resultado = "hecha";
    }
    expect(leer({ cuerpo: new Cuerpo() })).toEqual(INCIERTA);
    const heredado = Object.create({ resultado: "hecha" }) as object;
    expect(leer({ cuerpo: heredado })).toEqual(INCIERTA);
  });

  it("claves de prototipo en el cuerpo no cuentan como propias", () => {
    expect(leer({ cuerpo: JSON.parse('{"__proto__":{"resultado":"hecha"}}') })).toEqual(INCIERTA);
  });

  it("devuelve resultados congelados: modificar uno no cambia las lecturas siguientes", () => {
    expect(Object.isFrozen(leer({ cuerpo: { resultado: "hecha" } }))).toBe(true);
    expect(Object.isFrozen(leer(undefined))).toBe(true);
  });
});
