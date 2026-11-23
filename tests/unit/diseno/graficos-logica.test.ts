// T-010 (h) · lectores cerrados de los gráficos (diseño 020, «Gráficos»; REQ-014, REQ-015, REQ-052,
// REQ-054, REQ-071; CA-011, CA-040, CA-041). Lo que llega de la vista es un dato: se lee con listas
// cerradas y formateadores y nunca se pinta tal cual. De este modelo salen el dibujo y la tabla
// equivalente, así que lo que se comprueba aquí es lo que ven los dos.
import { describe, expect, it } from "vitest";
import {
  MAXIMO_DE_PUNTOS,
  MAXIMO_DE_SERIES,
  abreviarParaEje,
  descripcionDeGrafico,
  leerGrafico,
} from "../../../src/components/graficos/logica";

const dia = (n: number): string => `2026-10-${String(n).padStart(2, "0")}T12:00:00Z`;
const base = {
  titulo: "Correos revisados por día",
  ejeX: { nombre: "Día", tipo: "fecha" },
  ejeY: { nombre: "Correos revisados", unidad: "correos" },
  categorias: [dia(1), dia(2), dia(3)],
  series: [{ nombre: "Revisados", valores: [10, 1234, 0] }],
};
const con = (cambios: Record<string, unknown>): unknown => ({ ...base, ...cambios });

describe("leerGrafico · datos válidos", () => {
  it("lee título, ejes, categorías con el formateador de fechas y valores con miles", () => {
    const m = leerGrafico(base, "lineas");
    expect(m.estado).toBe("datos");
    expect(m.titulo).toBe("Correos revisados por día");
    expect(m.ejeX).toEqual({ nombre: "Día", tipo: "fecha" });
    expect(m.ejeY).toMatchObject({ nombre: "Correos revisados", unidad: "correos", decimales: 0 });
    expect(m.categorias.map((c) => c.texto)).toEqual(["1 oct 2026", "2 oct 2026", "3 oct 2026"]);
    expect(m.series).toHaveLength(1);
    expect(m.series[0]?.valores).toEqual([10, 1234, 0]);
    expect(m.series[0]?.textos).toEqual(["10", "1.234", "0"]);
    expect(m.puntos).toBe(3);
  });

  it("el cero es un valor, no un hueco", () => {
    const m = leerGrafico(base, "barras");
    expect(m.series[0]?.valores[2]).toBe(0);
    expect(m.series[0]?.textos[2]).toBe("0");
  });

  it("valores iguales: se leen todos y el mínimo y el máximo coinciden", () => {
    const m = leerGrafico(con({ series: [{ nombre: "A", valores: [7, 7, 7] }] }), "lineas");
    expect(m.estado).toBe("datos");
    expect(m.minimo).toBe(7);
    expect(m.maximo).toBe(7);
  });

  it("decimales acotados de 0 a 6 y con coma", () => {
    const m = leerGrafico(
      con({
        ejeY: { nombre: "Tasa", unidad: "%", decimales: 1 },
        series: [{ nombre: "A", valores: [1.25, 2, 3] }],
      }),
      "lineas",
    );
    expect(m.series[0]?.textos).toEqual(["1,3", "2,0", "3,0"]);
    for (const malo of [Number.NaN, -3, 99, "2", null]) {
      const x = leerGrafico(con({ ejeY: { nombre: "T", unidad: "u", decimales: malo } }), "lineas");
      expect(x.ejeY.decimales).toBeGreaterThanOrEqual(0);
      expect(x.ejeY.decimales).toBeLessThanOrEqual(6);
    }
  });

  it("categorías de texto: el texto se limpia de invisibles y de dirección", () => {
    const m = leerGrafico(
      con({
        ejeX: { nombre: "Agente", tipo: "texto" },
        categorias: ["Ventas\u202E", "  Soporte  "],
        series: [{ nombre: "A", valores: [1, 2] }],
      }),
      "barras",
    );
    expect(m.categorias.map((c) => c.texto)).toEqual(["Ventas", "Soporte"]);
  });

  it("366 puntos: se leen todos", () => {
    const categorias = Array.from({ length: 366 }, (_, i) => Date.UTC(2026, 0, 1 + i, 12));
    const m = leerGrafico(
      con({ categorias, series: [{ nombre: "A", valores: categorias.map((_, i) => i) }] }),
      "lineas",
    );
    // Los instantes numéricos son válidos para el formateador de fechas.
    expect(m.puntos).toBe(366);
    expect(m.categorias).toHaveLength(366);
    expect(m.series[0]?.valores).toHaveLength(366);
  });

  it("etiquetas de 120 caracteres: se conservan enteras en el modelo", () => {
    const larga = "L".repeat(120);
    const m = leerGrafico(
      con({
        ejeX: { nombre: "Agente", tipo: "texto" },
        categorias: [larga],
        series: [{ nombre: "S".repeat(120), valores: [3] }],
      }),
      "barras",
    );
    expect(m.categorias[0]?.texto).toBe(larga);
    expect(m.series[0]?.nombre).toBe("S".repeat(120));
  });
});

describe("leerGrafico · valores imposibles", () => {
  it("no numéricos, no finitos, cadenas y demasiado grandes son hueco, no cero", () => {
    const m = leerGrafico(
      con({
        categorias: [dia(1), dia(2), dia(3), dia(4), dia(5), dia(6), dia(7)],
        series: [
          {
            nombre: "A",
            valores: [Number.NaN, Number.POSITIVE_INFINITY, "12", null, undefined, 1e15, 5],
          },
        ],
      }),
      "lineas",
    );
    expect(m.series[0]?.valores).toEqual([null, null, null, null, null, null, 5]);
    expect(m.series[0]?.textos).toEqual([
      "Sin datos",
      "Sin datos",
      "Sin datos",
      "Sin datos",
      "Sin datos",
      "Sin datos",
      "5",
    ]);
    expect(m.puntos).toBe(1);
  });

  it("un negativo es hueco salvo que la vista declare un mínimo que lo admita (líneas)", () => {
    const series = [{ nombre: "A", valores: [-5, 3, 4] }];
    expect(leerGrafico(con({ series }), "lineas").series[0]?.valores).toEqual([null, 3, 4]);
    const admitido = leerGrafico(
      con({ ejeY: { nombre: "Saldo", unidad: "euros", minimo: -1000 }, series }),
      "lineas",
    );
    expect(admitido.series[0]?.valores).toEqual([-5, 3, 4]);
    expect(admitido.series[0]?.textos[0]).toBe("−5");
    expect(admitido.minimo).toBe(-5);
  });

  it("las barras empiezan en cero y no admiten negativos aunque la vista declare un mínimo", () => {
    const m = leerGrafico(
      con({
        ejeY: { nombre: "Saldo", unidad: "euros", minimo: -1000 },
        series: [{ nombre: "A", valores: [-5, 3, 4] }],
      }),
      "barras",
    );
    expect(m.series[0]?.valores).toEqual([null, 3, 4]);
  });

  it("un mínimo declarado que no es un número se ignora", () => {
    for (const minimo of ["-5", Number.NaN, Number.NEGATIVE_INFINITY, null, {}]) {
      const m = leerGrafico(
        con({
          ejeY: { nombre: "A", unidad: "u", minimo },
          series: [{ nombre: "A", valores: [-5, 3, 4] }],
        }),
        "lineas",
      );
      expect(m.series[0]?.valores[0], String(minimo)).toBeNull();
    }
  });

  it("valores más cortos que las categorías: lo que falta es hueco; lo que sobra se ignora", () => {
    const m = leerGrafico(
      con({
        series: [
          { nombre: "A", valores: [1] },
          { nombre: "B", valores: [1, 2, 3, 4, 5] },
        ],
      }),
      "lineas",
    );
    expect(m.series[0]?.valores).toEqual([1, null, null]);
    expect(m.series[1]?.valores).toEqual([1, 2, 3]);
  });

  it("una categoría que no es válida se descarta con sus valores", () => {
    const m = leerGrafico(
      con({
        categorias: [dia(1), "no es una fecha", "2026-02-30T12:00:00Z", dia(4)],
        series: [{ nombre: "A", valores: [1, 2, 3, 4] }],
      }),
      "lineas",
    );
    expect(m.categorias.map((c) => c.texto)).toEqual(["1 oct 2026", "4 oct 2026"]);
    expect(m.series[0]?.valores).toEqual([1, 4]);
  });

  it("categorías de texto vacías o que no son cadenas se descartan", () => {
    const m = leerGrafico(
      con({
        ejeX: { nombre: "Agente", tipo: "texto" },
        categorias: ["A", "", "   ", 5, null, "B"],
        series: [{ nombre: "S", valores: [1, 2, 3, 4, 5, 6] }],
      }),
      "barras",
    );
    expect(m.categorias.map((c) => c.texto)).toEqual(["A", "B"]);
    expect(m.series[0]?.valores).toEqual([1, 6]);
  });
});

describe("leerGrafico · estados", () => {
  it("0 puntos: vacío", () => {
    const m = leerGrafico(
      con({ categorias: [], series: [{ nombre: "A", valores: [] }] }),
      "lineas",
    );
    expect(m.estado).toBe("vacio");
    expect(m.puntos).toBe(0);
  });

  it("sin series, o todo hueco: vacío (CA-040)", () => {
    expect(leerGrafico(con({ series: [] }), "barras").estado).toBe("vacio");
    expect(
      leerGrafico(con({ series: [{ nombre: "A", valores: [null, "x", -1] }] }), "barras").estado,
    ).toBe("vacio");
  });

  it("menos puntos que el mínimo: «insuficiente»; con los justos: datos", () => {
    const una = con({ series: [{ nombre: "A", valores: [5, null, null] }] });
    expect(leerGrafico({ ...(una as object), minimoPuntos: 2 }, "lineas").estado).toBe(
      "insuficiente",
    );
    expect(leerGrafico({ ...(una as object), minimoPuntos: 1 }, "lineas").estado).toBe("datos");
    const dos = con({ series: [{ nombre: "A", valores: [5, 6, null] }] });
    expect(leerGrafico({ ...(dos as object), minimoPuntos: 2 }, "lineas").estado).toBe("datos");
  });

  it("un punto con dato en una sola serie cuenta como punto", () => {
    const m = leerGrafico(
      con({
        series: [
          { nombre: "A", valores: [1, null, null] },
          { nombre: "B", valores: [null, 2, null] },
        ],
      }),
      "lineas",
    );
    expect(m.puntos).toBe(2);
  });

  it("el mínimo de puntos no válido se corrige a 1", () => {
    for (const minimoPuntos of [0, -4, Number.NaN, "3", null, 1.5]) {
      const m = leerGrafico({ ...(base as object), minimoPuntos }, "lineas");
      expect(m.estado, String(minimoPuntos)).toBe("datos");
    }
  });

  it("entrada que no es un objeto: vacío y con título de reserva, sin lanzar", () => {
    for (const x of [null, undefined, "texto", 42, [], () => 1, true]) {
      const m = leerGrafico(x, "lineas");
      expect(m.estado).toBe("vacio");
      expect(m.titulo.length).toBeGreaterThan(0);
    }
  });

  it("más puntos que el máximo: vacío (cierra en fallo), y con el máximo justo, datos", () => {
    const n = MAXIMO_DE_PUNTOS + 1;
    const cat = Array.from({ length: n }, (_, i) => `c${i}`);
    const grande = con({
      ejeX: { nombre: "x", tipo: "texto" },
      categorias: cat,
      series: [{ nombre: "A", valores: cat.map(() => 1) }],
    });
    expect(leerGrafico(grande, "barras").estado).toBe("vacio");
    const justo = con({
      ejeX: { nombre: "x", tipo: "texto" },
      categorias: cat.slice(0, MAXIMO_DE_PUNTOS),
      series: [{ nombre: "A", valores: cat.slice(0, MAXIMO_DE_PUNTOS).map(() => 1) }],
    });
    expect(leerGrafico(justo, "barras").estado).toBe("datos");
  });
});

describe("leerGrafico · título, ejes y series", () => {
  it("título y unidad obligatorios: sin ellos hay texto de reserva, nunca vacío", () => {
    const m = leerGrafico(
      con({ titulo: "  \u200B ", ejeY: { nombre: "", unidad: "" }, ejeX: {} }),
      "lineas",
    );
    expect(m.titulo).toBe("Gráfico sin título");
    expect(m.ejeY.unidad.trim()).not.toBe("");
    expect(m.ejeY.nombre.trim()).not.toBe("");
    expect(m.ejeX.nombre.trim()).not.toBe("");
    expect(m.ejeX.tipo).toBe("texto");
  });

  it("el tipo del eje horizontal sale de una lista cerrada", () => {
    for (const tipo of ["html", "FECHA", 3, null, undefined]) {
      expect(leerGrafico(con({ ejeX: { nombre: "x", tipo } }), "lineas").ejeX.tipo).toBe("texto");
    }
    expect(leerGrafico(con({ ejeX: { nombre: "x", tipo: "fecha" } }), "lineas").ejeX.tipo).toBe(
      "fecha",
    );
  });

  it(`como mucho ${MAXIMO_DE_SERIES} series: las demás se descartan`, () => {
    const series = Array.from({ length: 6 }, (_, i) => ({ nombre: `S${i}`, valores: [1, 2, 3] }));
    const m = leerGrafico(con({ series }), "lineas");
    expect(m.series.map((s) => s.nombre)).toEqual(["S0", "S1", "S2", "S3"]);
    expect(m.series.map((s) => s.indice)).toEqual([0, 1, 2, 3]);
  });

  it("serie sin nombre válido: «Serie N»; una serie que no es un objeto se descarta", () => {
    const m = leerGrafico(
      con({
        series: [{ nombre: "\u202E", valores: [1, 2, 3] }, 5, null, { valores: [1, 2, 3] }],
      }),
      "lineas",
    );
    expect(m.series.map((s) => s.nombre)).toEqual(["Serie 1", "Serie 2"]);
  });

  it("solo se leen claves propias: __proto__ y heredadas no cuentan", () => {
    const hostil = JSON.parse(
      '{"titulo":"T","ejeX":{"nombre":"x","tipo":"texto"},"ejeY":{"nombre":"y","unidad":"u"},"categorias":["a"],"series":[{"nombre":"A","valores":[1],"__proto__":{"nombre":"mal"}}]}',
    ) as unknown;
    const m = leerGrafico(hostil, "lineas");
    expect(m.series[0]?.nombre).toBe("A");
    const heredado = Object.create({ titulo: "heredado", series: [], categorias: [] }) as unknown;
    expect(leerGrafico(heredado, "lineas").titulo).toBe("Gráfico sin título");
    expect(({} as Record<string, unknown>).nombre).toBeUndefined();
  });

  it("los campos de más no pasan al modelo", () => {
    const m = leerGrafico(
      {
        ...(base as object),
        identificador: "cli_123",
        correo: "a@b.c",
        series: [{ nombre: "A", valores: [1, 2, 3], asunto: "SECRETO", html: "<b>x</b>" }],
      },
      "lineas",
    );
    const texto = JSON.stringify(m);
    for (const prohibido of ["cli_123", "a@b.c", "SECRETO", "<b>"]) {
      expect(texto).not.toContain(prohibido);
    }
  });

  it("cadenas hostiles: el modelo guarda texto, sin invisibles ni dirección", () => {
    const m = leerGrafico(
      con({
        titulo: "<img src=x onerror=alert(1)>\u202E fin",
        ejeY: { nombre: "\u2066Y\u2069", unidad: "\u200Bu" },
      }),
      "lineas",
    );
    expect(m.titulo).toBe("<img src=x onerror=alert(1)> fin");
    expect(m.ejeY.nombre).toBe("Y");
    expect(m.ejeY.unidad).toBe("u");
  });
});

describe("descripcionDeGrafico y abreviarParaEje", () => {
  it("dice el tipo, el número de series y puntos, el rango y que los valores están en la tabla", () => {
    const m = leerGrafico(
      con({
        series: [
          { nombre: "A", valores: [10, 1234, 0] },
          { nombre: "B", valores: [1, 2, 3] },
        ],
      }),
      "lineas",
    );
    const d = descripcionDeGrafico(m, "lineas");
    expect(d).toContain("Gráfico de líneas");
    expect(d).toContain("2 series");
    expect(d).toContain("3 puntos");
    expect(d).toContain("1.234");
    expect(d).toContain("tabla");
    expect(descripcionDeGrafico(m, "barras")).toContain("Gráfico de barras");
  });

  it("en singular con una serie y un punto", () => {
    const m = leerGrafico(
      con({ categorias: [dia(1)], series: [{ nombre: "A", valores: [4] }] }),
      "barras",
    );
    const d = descripcionDeGrafico(m, "barras");
    expect(d).toContain("1 serie ");
    expect(d).toContain("1 punto");
  });

  it("abreviar corta solo lo largo, con puntos suspensivos, sin partir un par sustituto", () => {
    expect(abreviarParaEje("Corta", 12)).toBe("Corta");
    expect(abreviarParaEje("L".repeat(120), 12)).toBe(`${"L".repeat(11)}…`);
    const emojis = "\u{1F600}".repeat(30);
    const corto = abreviarParaEje(emojis, 12);
    expect([...corto]).toHaveLength(12);
    expect(corto.endsWith("…")).toBe(true);
    expect(corto).not.toMatch(/[\uD800-\uDBFF]$/);
  });
});
