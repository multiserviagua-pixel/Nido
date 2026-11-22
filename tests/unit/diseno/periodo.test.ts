// T-010 (c) · lógica del periodo (REQ-006, REQ-059; CA-004, CA-044): lista cerrada, valor en la
// dirección y texto con palabras y fechas. Puro.
import { describe, expect, it } from "vitest";
import {
  esquemaDePeriodo,
  periodoActivo,
  periodosValidos,
  rutaConPeriodo,
  rutaParaCambiarPeriodo,
  textoDePeriodo,
  valorDePeriodo,
  type ConfiguracionDePeriodo,
  type PeriodoDeLista,
} from "../../../src/components/armazon/periodo";
import type { Esquema } from "../../../src/components/direccion/estado-direccion";

const LISTA: readonly PeriodoDeLista[] = [
  {
    clave: "ultimos-7-dias",
    etiqueta: "Últimos 7 días",
    desde: "2026-11-06T00:00:00+01:00",
    hasta: "2026-11-12T23:59:59+01:00",
  },
  {
    clave: "ultimos-30-dias",
    etiqueta: "Últimos 30 días",
    desde: "2026-10-14T00:00:00+02:00",
    hasta: "2026-11-12T23:59:59+01:00",
  },
];
const CONF: ConfiguracionDePeriodo = {
  periodos: LISTA,
  porDefecto: "ultimos-30-dias",
  valor: "ultimos-30-dias",
};

describe("periodo · lista cerrada", () => {
  it("descarta claves no admitidas, repetidas, sin etiqueta o con fechas que no valen", () => {
    const sucia = [
      ...LISTA,
      { ...LISTA[0]!, clave: "ultimos-7-dias" },
      { ...LISTA[0]!, clave: "Con Espacios" },
      { ...LISTA[0]!, clave: "sin-etiqueta", etiqueta: "  " },
      { ...LISTA[0]!, clave: "fecha-mala", desde: "ayer" },
      { ...LISTA[0]!, clave: "al-reves", desde: LISTA[0]!.hasta, hasta: LISTA[0]!.desde },
    ] as PeriodoDeLista[];
    expect(periodosValidos(sucia).map((p) => p.clave)).toEqual([
      "ultimos-7-dias",
      "ultimos-30-dias",
    ]);
    expect(periodosValidos(null as never)).toEqual([]);
  });

  it("el esquema es un campo de lista cerrada con el valor por defecto", () => {
    expect(esquemaDePeriodo(LISTA, "ultimos-30-dias")).toEqual({
      periodo: {
        tipo: "lista",
        valores: ["ultimos-7-dias", "ultimos-30-dias"],
        porDefecto: "ultimos-30-dias",
      },
    });
    expect(esquemaDePeriodo(LISTA, "no-existe")).toMatchObject({
      periodo: { porDefecto: "ultimos-7-dias" },
    });
    expect(esquemaDePeriodo([], "x")).toEqual({});
  });
});

describe("periodo · valor de la dirección", () => {
  it("lee una clave de la lista y, si no encaja, vuelve al valor por defecto", () => {
    expect(valorDePeriodo(LISTA, "ultimos-30-dias", "?periodo=ultimos-7-dias")).toBe(
      "ultimos-7-dias",
    );
    for (const malo of [
      "?periodo=<script>",
      "?periodo=otro",
      "?periodo=ultimos-7-dias&periodo=ultimos-30-dias",
      "?periodo=",
      "?q=Ana+Perez",
      "",
    ]) {
      expect(valorDePeriodo(LISTA, "ultimos-30-dias", malo), malo).toBe("ultimos-30-dias");
    }
  });

  it("acepta los parámetros de una página de Next y no lee los que no declara", () => {
    expect(
      valorDePeriodo(LISTA, "ultimos-30-dias", { periodo: "ultimos-7-dias", usuario: "x" }),
    ).toBe("ultimos-7-dias");
    expect(valorDePeriodo(LISTA, "ultimos-30-dias", { usuario: "x", cliente: "y" })).toBe(
      "ultimos-30-dias",
    );
  });

  it("el periodo activo cae al de por defecto o al primero; sin lista, ninguno", () => {
    expect(periodoActivo({ ...CONF, valor: "ultimos-7-dias" })?.clave).toBe("ultimos-7-dias");
    expect(periodoActivo({ ...CONF, valor: "raro" })?.clave).toBe("ultimos-30-dias");
    expect(periodoActivo({ ...CONF, valor: "raro", porDefecto: "raro" })?.clave).toBe(
      "ultimos-7-dias",
    );
    expect(periodoActivo({ periodos: [], porDefecto: "a", valor: "a" })).toBeNull();
  });
});

describe("periodo · texto con palabras y fechas", () => {
  it("«Últimos 30 días · 14 oct – 12 nov 2026»", () => {
    expect(textoDePeriodo(LISTA[1]!)).toBe("Últimos 30 días · 14 oct – 12 nov 2026");
  });
});

describe("periodo · dirección tras elegir", () => {
  it("escribe solo el periodo si no es el de por defecto: sin fragmento y descartando los demás parámetros", () => {
    expect(rutaConPeriodo("/muestra/x#f", CONF, "ultimos-7-dias")).toBe(
      "/muestra/x?periodo=ultimos-7-dias",
    );
    expect(rutaConPeriodo("/muestra/x?otro=1&b=a%20b#f", CONF, "ultimos-7-dias")).toBe(
      "/muestra/x?periodo=ultimos-7-dias",
    );
    // Sustituye el periodo anterior (también repetido) y, si vuelve al de por defecto, lo quita.
    expect(rutaConPeriodo("/muestra/x?periodo=a&otro=1&periodo=b", CONF, "ultimos-7-dias")).toBe(
      "/muestra/x?periodo=ultimos-7-dias",
    );
    expect(
      rutaConPeriodo("/muestra/x?periodo=ultimos-7-dias&otro=1", CONF, "ultimos-30-dias"),
    ).toBe("/muestra/x");
    expect(rutaConPeriodo("/muestra/x?q=Ana+Perez", CONF, "ultimos-7-dias")).toBe(
      "/muestra/x?periodo=ultimos-7-dias",
    );
    expect(rutaConPeriodo("/muestra/x", CONF, "ultimos-30-dias")).toBe("/muestra/x");
    expect(rutaConPeriodo("/muestra/x", CONF, "<img>")).toBe("/muestra/x");
  });
});

// T-010 (e2), PRUEBA-009: la ruta que recibe `router.replace` se construye con solo el `pathname` de
// la página y se descarta (no se navega) si no es una ruta interna de este origen. Lo que llegue
// por `location.pathname` puede empezar por `//` (`http://host//otro.example/x`).
describe("periodo · ruta del cambio de periodo (PRUEBA-009)", () => {
  it("con una ruta propia conserva origen y ruta y escribe solo una clave de la lista", () => {
    expect(rutaParaCambiarPeriodo("/muestra/x", "", CONF, "ultimos-7-dias")).toBe(
      "/muestra/x?periodo=ultimos-7-dias",
    );
    expect(rutaParaCambiarPeriodo("/muestra/x", "", CONF, "ultimos-30-dias")).toBe("/muestra/x");
    expect(rutaParaCambiarPeriodo("/", "", CONF, "ultimos-7-dias")).toBe(
      "/?periodo=ultimos-7-dias",
    );
  });

  it("descarta //otro.example/x, /\\otro.example, javascript:, otro origen y rutas relativas", () => {
    for (const ruta of [
      "//otro.example/x",
      "/\\otro.example",
      "/\\\\otro.example",
      "javascript:alert(1)",
      "https://otro.example/x",
      "http://otro.example",
      "data:text/html,x",
      "muestra/x",
      "",
      "/\t/otro.example",
      "/\n/otro.example",
      "/\u0000/otro.example",
    ]) {
      expect(
        rutaParaCambiarPeriodo(ruta, "", CONF, "ultimos-7-dias"),
        JSON.stringify(ruta),
      ).toBeNull();
    }
  });

  it("descarta lo que no es una cadena y una clave fuera de la lista no llega a la dirección", () => {
    expect(
      rutaParaCambiarPeriodo(undefined as unknown as string, "", CONF, "ultimos-7-dias"),
    ).toBeNull();
    expect(rutaParaCambiarPeriodo({} as unknown as string, "", CONF, "ultimos-7-dias")).toBeNull();
    expect(rutaParaCambiarPeriodo("/muestra/x", "", CONF, "//otro.example")).toBe("/muestra/x");
  });

  it("sin esquema de la vista, solo `periodo`: ni parámetros ni fragmento de la dirección actual", () => {
    expect(rutaParaCambiarPeriodo("/muestra/x", "?q=Ana&pagina=3#f", CONF, "ultimos-7-dias")).toBe(
      "/muestra/x?periodo=ultimos-7-dias",
    );
    expect(rutaParaCambiarPeriodo("/muestra/x", "?orden=nombre", CONF, "ultimos-30-dias")).toBe(
      "/muestra/x",
    );
  });
});

// T-010 (e2), diseño «Cambio de periodo», punto 2: con `esquemaDeLaVista` se conservan las listas y
// los identificadores válidos, los enteros vuelven a su valor por defecto y lo demás se pierde.
describe("periodo · parámetros propios de la vista al cambiar el periodo (PRUEBA-009)", () => {
  const CLIENTE = "3f2b8c1e-5d4a-4b7e-9c6d-1a2b3c4d5e6f";
  const ESQUEMA: Esquema = {
    pagina: { tipo: "entero", minimo: 1, maximo: 500, porDefecto: 1 },
    orden: { tipo: "lista", valores: ["fecha", "nombre"], porDefecto: "fecha" },
    cliente: { tipo: "identificador" },
  };
  const CON: ConfiguracionDePeriodo = { ...CONF, esquemaDeLaVista: ESQUEMA };
  const ir = (search: string, clave = "ultimos-7-dias", conf = CON): string | null =>
    rutaParaCambiarPeriodo("/muestra/x", search, conf, clave);

  it("`pagina=3` desaparece y el orden y el identificador válidos se conservan", () => {
    expect(ir(`?pagina=3&orden=nombre&cliente=${CLIENTE}`)).toBe(
      `/muestra/x?periodo=ultimos-7-dias&orden=nombre&cliente=${CLIENTE}`,
    );
    expect(ir("?pagina=3")).toBe("/muestra/x?periodo=ultimos-7-dias");
  });

  it("un orden fuera de la lista y un identificador mal formado desaparecen", () => {
    expect(ir("?orden=otro")).toBe("/muestra/x?periodo=ultimos-7-dias");
    for (const malo of [CLIENTE.toUpperCase(), `${CLIENTE}0`, "..", "%2F", "a%20b", "/otro"]) {
      expect(ir(`?cliente=${malo}`), malo).toBe("/muestra/x?periodo=ultimos-7-dias");
    }
  });

  it("un parámetro no declarado, un texto libre y un parámetro repetido desaparecen", () => {
    expect(ir("?q=Ana+Perez&usuario=otro&rol=superadmin")).toBe(
      "/muestra/x?periodo=ultimos-7-dias",
    );
    expect(ir(`?orden=nombre&orden=fecha&cliente=${CLIENTE}&cliente=${CLIENTE}`)).toBe(
      "/muestra/x?periodo=ultimos-7-dias",
    );
  });

  it("el fragmento no pasa y al volver al periodo por defecto solo queda lo conservado", () => {
    expect(ir("?orden=nombre#f", "ultimos-30-dias")).toBe("/muestra/x?orden=nombre");
    expect(ir("?pagina=2", "ultimos-30-dias")).toBe("/muestra/x");
  });

  it("un `periodo` declarado por la vista no pisa el elegido", () => {
    const conPeriodo: Esquema = {
      ...ESQUEMA,
      periodo: { tipo: "lista", valores: ["ultimos-7-dias", "ultimos-30-dias"], porDefecto: "x" },
    } as Esquema;
    const conf = { ...CONF, esquemaDeLaVista: conPeriodo };
    expect(ir("?periodo=ultimos-30-dias&orden=nombre", "ultimos-7-dias", conf)).toBe(
      "/muestra/x?periodo=ultimos-7-dias&orden=nombre",
    );
    expect(ir("?periodo=ultimos-7-dias&periodo=ultimos-30-dias", "ultimos-30-dias", conf)).toBe(
      "/muestra/x",
    );
  });

  it("sigue descartando rutas no internas con esquema y no admite un `search` que no sea texto", () => {
    expect(
      rutaParaCambiarPeriodo("//otro.example/x", "?orden=nombre", CON, "ultimos-7-dias"),
    ).toBeNull();
    expect(rutaParaCambiarPeriodo("/\\otro.example", "", CON, "ultimos-7-dias")).toBeNull();
    expect(
      rutaParaCambiarPeriodo("/muestra/x", undefined as unknown as string, CON, "ultimos-7-dias"),
    ).toBe("/muestra/x?periodo=ultimos-7-dias");
  });

  it("en rutas del panel no se conserva ningún identificador (art. 2: el cliente sale de la sesión)", () => {
    const enPanel = (ruta: string): string | null =>
      rutaParaCambiarPeriodo(ruta, `?orden=nombre&cliente=${CLIENTE}`, CON, "ultimos-7-dias");
    expect(enPanel("/panel/agentes")).toBe("/panel/agentes?periodo=ultimos-7-dias&orden=nombre");
    expect(enPanel("/panel")).toBe("/panel?periodo=ultimos-7-dias&orden=nombre");
    // Fuera del panel (superadmin, D-040) sí se conserva.
    expect(enPanel("/admin/agentes")).toBe(
      `/admin/agentes?periodo=ultimos-7-dias&orden=nombre&cliente=${CLIENTE}`,
    );
  });

  it("un esquema mal formado no rompe ni deja pasar nada", () => {
    const rota = { ...CONF, esquemaDeLaVista: null as unknown as Esquema };
    expect(ir("?orden=nombre", "ultimos-7-dias", rota)).toBe("/muestra/x?periodo=ultimos-7-dias");
  });
});
