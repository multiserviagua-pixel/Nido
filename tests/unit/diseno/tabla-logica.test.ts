// T-010 (g) · lógica pura de `Tabla` y `Paginacion` (diseño 020, «Componentes base», fila `Tabla`;
// REQ-013, REQ-048, REQ-059, REQ-066, REQ-067; CA-010). Posición con miles, página corregida, orden
// de lista cerrada, esquema de dirección y celdas leídas sin confiar en el dato.
import { describe, expect, it } from "vitest";
import {
  leerEstadoDireccion,
  escribirEstadoDireccion,
} from "../../../src/components/direccion/estado-direccion";
import { rutaParaCambiarPeriodo } from "../../../src/components/armazon/periodo";
import {
  PAGINA_MAXIMA,
  TAMANO_DE_PAGINA,
  calcularPaginacion,
  columnasValidas,
  esquemaDeTabla,
  leerCelda,
  leerOrden,
  ordenDeEstado,
  ordenSiguiente,
  paginasVisibles,
  textoDeAnuncioDeOrden,
  textoDeAnuncioDePagina,
  textoDePosicion,
  type ColumnaDeTabla,
} from "../../../src/components/tabla/logica";

const COLUMNAS: readonly ColumnaDeTabla[] = [
  { clave: "nombre", etiqueta: "Cliente", ordenable: true },
  { clave: "correos", etiqueta: "Correos", tipo: "numero", ordenable: true },
  { clave: "estado", etiqueta: "Estado", tipo: "estado", ambito: "agente" },
];

describe("calcularPaginacion · posición y página corregida (REQ-013, REQ-066, REQ-067)", () => {
  it("el tamaño por defecto es 25 y la primera página va del 1 al 25", () => {
    expect(TAMANO_DE_PAGINA).toBe(25);
    expect(calcularPaginacion(1234, 1)).toMatchObject({
      desde: 1,
      hasta: 25,
      paginas: 50,
      pagina: 1,
    });
  });

  it("«Del 26 al 50 de 1.234» con miles con punto", () => {
    expect(textoDePosicion(calcularPaginacion(1234, 2))).toBe("Del 26 al 50 de 1.234");
  });

  it("la última página acaba en el total", () => {
    const p = calcularPaginacion(1234, 50);
    expect(p).toMatchObject({ desde: 1226, hasta: 1234, pagina: 50 });
    expect(textoDePosicion(p)).toBe("Del 1.226 al 1.234 de 1.234");
  });

  it("10.000 filas son 400 páginas de 25", () => {
    expect(calcularPaginacion(10000, 400)).toMatchObject({
      paginas: 400,
      desde: 9976,
      hasta: 10000,
    });
  });

  it("cero filas: vacía, sin «Del 0 al 0»", () => {
    const p = calcularPaginacion(0, 1);
    expect(p.vacia).toBe(true);
    expect(p.paginas).toBe(0);
  });

  it("una página fuera de rango se corrige al límite más cercano", () => {
    expect(calcularPaginacion(1234, 9999).pagina).toBe(50);
    expect(calcularPaginacion(1234, 0).pagina).toBe(1);
    expect(calcularPaginacion(1234, -4).pagina).toBe(1);
  });

  it.each([Number.NaN, Number.POSITIVE_INFINITY, 2.5, "3", null, undefined, {}, 1e300])(
    "página no válida %j: la primera",
    (valor) => {
      expect(calcularPaginacion(100, valor).pagina).toBe(1);
    },
  );

  it.each([-1, Number.NaN, Number.POSITIVE_INFINITY, 1.5, "10", null, undefined, 1e15, 1e300])(
    "total no válido %j: se trata como vacío (cierra en fallo)",
    (total) => {
      expect(calcularPaginacion(total, 1).vacia).toBe(true);
    },
  );

  it.each([0, -3, 1.5, Number.NaN, 5000, "10"])("tamaño no válido %j: 25", (tamano) => {
    expect(calcularPaginacion(100, 1, tamano).tamano).toBe(25);
  });

  it("el final sale de las filas realmente pintadas, nunca más allá del total", () => {
    expect(calcularPaginacion(1234, 2, 25, 10)).toMatchObject({ desde: 26, hasta: 35 });
    expect(calcularPaginacion(30, 2, 25, 500).hasta).toBe(30);
  });

  it("los anuncios dicen la página y la posición", () => {
    expect(textoDeAnuncioDePagina(calcularPaginacion(1234, 3))).toBe(
      "Página 3 de 50. Del 51 al 75 de 1.234",
    );
  });
});

describe("paginasVisibles · números de página con huecos", () => {
  it("pocas páginas: todas", () => {
    expect(paginasVisibles(1, 5)).toEqual([1, 2, 3, 4, 5]);
    expect(paginasVisibles(1, 1)).toEqual([1]);
  });
  it("muchas: primera, última, la actual y sus vecinas, con huecos", () => {
    expect(paginasVisibles(1, 400)).toEqual([1, 2, null, 400]);
    expect(paginasVisibles(200, 400)).toEqual([1, null, 199, 200, 201, null, 400]);
    expect(paginasVisibles(400, 400)).toEqual([1, null, 399, 400]);
  });
  it("un hueco de una sola página se escribe, no se resume", () => {
    expect(paginasVisibles(4, 400)).toEqual([1, 2, 3, 4, 5, null, 400]);
  });
  it("nunca repite ni se sale de rango, con entradas absurdas", () => {
    for (const [p, n] of [
      [0, 10],
      [99, 10],
      [Number.NaN, 10],
      [3, 0],
      [3, -1],
    ] as const) {
      const lista = paginasVisibles(p, n);
      const numeros = lista.filter((x): x is number => x !== null);
      expect(new Set(numeros).size).toBe(numeros.length);
      for (const x of numeros) expect(x >= 1 && x <= Math.max(n, 1)).toBe(true);
    }
  });
});

describe("columnas, orden y celdas", () => {
  it("columnasValidas descarta claves malas, repetidas y heredadas, y limpia la etiqueta", () => {
    const sucias = [
      { clave: "ok", etiqueta: "Bien" },
      { clave: "ok", etiqueta: "Repetida" },
      { clave: "Mala", etiqueta: "x" },
      { clave: "con espacio", etiqueta: "x" },
      { clave: "constructor", etiqueta: "x" },
      { clave: "__proto__", etiqueta: "x" },
      { clave: 5, etiqueta: "x" },
      null,
      { clave: "oculta", etiqueta: "\u202E\u200B" },
      { clave: "falsa", etiqueta: "Falsa", ordenable: "true", tipo: "inventado" },
    ] as unknown as readonly ColumnaDeTabla[];
    const v = columnasValidas(sucias);
    expect(v.map((c) => c.clave)).toEqual(["ok", "oculta", "falsa"]);
    expect(v[1]!.etiqueta).toBe("Columna");
    expect(v[2]).toMatchObject({ ordenable: false, tipo: "texto" });
    expect(columnasValidas("no es una lista" as never)).toEqual([]);
  });

  it("leerOrden solo admite columnas ordenables y sentidos de la lista", () => {
    const c = columnasValidas(COLUMNAS);
    expect(leerOrden({ columna: "nombre", sentido: "descendente" }, c)).toEqual({
      columna: "nombre",
      sentido: "descendente",
    });
    for (const malo of [
      null,
      undefined,
      "nombre",
      { columna: "estado", sentido: "ascendente" }, // no ordenable
      { columna: "no_existe", sentido: "ascendente" },
      { columna: "nombre", sentido: "arriba" },
      { columna: "constructor", sentido: "ascendente" },
      { columna: ["nombre"], sentido: "ascendente" },
    ]) {
      expect(leerOrden(malo, c)).toBeNull();
    }
  });

  it("ordenSiguiente: ascendente la primera vez, luego alterna en los dos sentidos", () => {
    const a = ordenSiguiente(null, "nombre");
    expect(a).toEqual({ columna: "nombre", sentido: "ascendente" });
    const d = ordenSiguiente(a, "nombre");
    expect(d).toEqual({ columna: "nombre", sentido: "descendente" });
    expect(ordenSiguiente(d, "nombre").sentido).toBe("ascendente");
    expect(ordenSiguiente(d, "correos")).toEqual({ columna: "correos", sentido: "ascendente" });
  });

  it("anuncio del orden con la etiqueta limpia", () => {
    expect(textoDeAnuncioDeOrden("Cliente", "descendente")).toBe(
      "Ordenado por Cliente, descendente",
    );
    expect(textoDeAnuncioDeOrden("Cl\u202Eiente", "ascendente")).toBe(
      "Ordenado por Cliente, ascendente",
    );
  });

  it("leerCelda: texto sin invisibles, número con miles, nada que no sea dato", () => {
    const [nombre, correos] = columnasValidas(COLUMNAS) as [ColumnaDeTabla, ColumnaDeTabla];
    expect(leerCelda(nombre, "Ana\u202E\u200B Pérez").texto).toBe("Ana Pérez");
    expect(leerCelda(nombre, "<script>alert(1)</script>").texto).toBe("<script>alert(1)</script>");
    for (const malo of [null, undefined, 5, {}, [], "\u200B\u202E", "   "]) {
      expect(leerCelda(nombre, malo).texto).toBe("Sin datos");
    }
    expect(leerCelda(correos, 1234).texto).toBe("1.234");
    expect(leerCelda(correos, 0).texto).toBe("0");
    for (const malo of [-1, Number.NaN, Number.POSITIVE_INFINITY, "12", null, 1e20]) {
      expect(leerCelda(correos, malo).texto).toBe("Sin datos");
    }
    expect(leerCelda({ clave: "p", etiqueta: "P", tipo: "porcentaje" }, 28.4).texto).toBe("28,4 %");
    expect(
      leerCelda({ clave: "f", etiqueta: "F", tipo: "fecha" }, "2026-11-12T07:04:00Z").texto,
    ).toBe("12 nov 2026");
    expect(leerCelda({ clave: "f", etiqueta: "F", tipo: "fecha" }, "ayer").texto).toBe("Sin datos");
  });
});

describe("esquemaDeTabla · página y orden solo como parámetros de dirección (REQ-059)", () => {
  const esquema = esquemaDeTabla({ columnas: COLUMNAS, ordenPorDefecto: "correos" });

  it("declara pagina (entero acotado), orden (lista de ordenables) y sentido", () => {
    expect(esquema.pagina).toEqual({
      tipo: "entero",
      minimo: 1,
      maximo: PAGINA_MAXIMA,
      porDefecto: 1,
    });
    expect(esquema.orden).toMatchObject({
      tipo: "lista",
      valores: ["nombre", "correos"],
      porDefecto: "correos",
    });
    expect(esquema.sentido).toMatchObject({ tipo: "lista", porDefecto: "ascendente" });
  });

  it("sin columnas ordenables solo hay página; el orden por defecto desconocido cae a la primera", () => {
    expect(Object.keys(esquemaDeTabla({ columnas: [{ clave: "a", etiqueta: "A" }] }))).toEqual([
      "pagina",
    ]);
    expect(esquemaDeTabla({ columnas: COLUMNAS, ordenPorDefecto: "estado" }).orden).toMatchObject({
      porDefecto: "nombre",
    });
  });

  it.each([
    "?pagina=-1",
    "?pagina=0",
    "?pagina=abc",
    "?pagina=NaN",
    "?pagina=1.5",
    "?pagina=99999999999999999999",
    "?pagina=100001",
    "?pagina=1&pagina=2",
    "?pagina=%00",
  ])("página mala %s: la primera", (consulta) => {
    expect(leerEstadoDireccion(esquema, consulta).pagina).toBe(1);
  });

  it.each([
    "?orden=estado",
    "?orden=__proto__",
    "?orden=constructor",
    "?orden=NOMBRE",
    "?orden=nombre%20x",
    "?orden=<script>",
  ])("orden desconocido %s: el de por defecto", (consulta) => {
    expect(leerEstadoDireccion(esquema, consulta).orden).toBe("correos");
  });

  it("lo que no es del esquema no se lee: ni texto libre ni búsqueda", () => {
    const e = leerEstadoDireccion(esquema, "?buscar=ana&q=x&pagina=3");
    expect(Object.keys(e).sort()).toEqual(["orden", "pagina", "sentido"]);
    expect(e.pagina).toBe(3);
  });

  it("se escribe solo lo distinto del defecto y nada de texto libre", () => {
    expect(
      escribirEstadoDireccion(esquema, { pagina: 3, orden: "nombre", sentido: "descendente" }),
    ).toBe("?pagina=3&orden=nombre&sentido=descendente");
    expect(
      escribirEstadoDireccion(esquema, { pagina: 1, orden: "correos", sentido: "ascendente" }),
    ).toBe("");
    expect(escribirEstadoDireccion(esquema, { orden: "<x>" } as never)).toBe("");
  });

  it("ordenDeEstado traduce el estado leído al orden de la tabla", () => {
    const e = leerEstadoDireccion(esquema, "?orden=nombre&sentido=descendente");
    expect(ordenDeEstado(e)).toEqual({ columna: "nombre", sentido: "descendente" });
    expect(ordenDeEstado({} as never)).toBeNull();
  });

  it("al cambiar el periodo se conserva el orden y la página vuelve a la primera", () => {
    const ruta = rutaParaCambiarPeriodo(
      "/admin/clientes",
      "?pagina=7&orden=nombre&sentido=descendente&buscar=ana",
      {
        periodos: [
          {
            clave: "7_dias",
            etiqueta: "7 días",
            desde: "2026-11-05T00:00:00+01:00",
            hasta: "2026-11-12T00:00:00+01:00",
          },
          {
            clave: "30_dias",
            etiqueta: "30 días",
            desde: "2026-10-13T00:00:00+02:00",
            hasta: "2026-11-12T00:00:00+01:00",
          },
        ],
        porDefecto: "30_dias",
        valor: "30_dias",
        esquemaDeLaVista: esquema,
      },
      "7_dias",
    );
    expect(ruta).toBe("/admin/clientes?periodo=7_dias&orden=nombre&sentido=descendente");
  });
});
