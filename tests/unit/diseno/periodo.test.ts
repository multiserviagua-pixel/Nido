// T-010 (c) · lógica del periodo (REQ-006, REQ-059; CA-004, CA-044): lista cerrada, valor en la
// dirección y texto con palabras y fechas. Puro.
import { describe, expect, it } from "vitest";
import {
  esquemaDePeriodo,
  periodoActivo,
  periodosValidos,
  rutaConPeriodo,
  textoDePeriodo,
  valorDePeriodo,
  type ConfiguracionDePeriodo,
  type PeriodoDeLista,
} from "../../../src/components/armazon/periodo";

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
