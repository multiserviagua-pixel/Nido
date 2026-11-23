// T-010 (h) · `GraficoLineas`, `GraficoBarras` y `TablaEquivalente` pintados en el servidor de
// pruebas (diseño 020, «Gráficos»; REQ-014, REQ-015, REQ-038, REQ-052, REQ-054, REQ-071; CA-011,
// CA-040, CA-041). El dibujo de Recharts solo se monta en el navegador: aquí se comprueba lo que
// hay en el documento sin JavaScript (título, descripción, leyenda, tabla equivalente y estados) y
// que la tabla sale del mismo modelo que el dibujo. El dibujo contra la tabla, en `graficos.spec.ts`.
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { GraficoBarras } from "../../../src/components/graficos/GraficoBarras";
import {
  GraficoLineas,
  type PropiedadesDeGrafico,
} from "../../../src/components/graficos/GraficoLineas";
import { TablaEquivalente } from "../../../src/components/graficos/TablaEquivalente";
import { leerGrafico } from "../../../src/components/graficos/logica";

const dia = (n: number): string => `2026-10-${String(n).padStart(2, "0")}T12:00:00Z`;
const BASE = {
  titulo: "Correos revisados por día",
  ejeX: { nombre: "Día", tipo: "fecha" },
  ejeY: { nombre: "Correos revisados", unidad: "correos" },
  categorias: [dia(1), dia(2), dia(3), dia(4)],
  series: [{ nombre: "Revisados", valores: [10, 1234, 0, null] }],
};
type Entrada = Record<string, unknown>;
const lineas = (e: Entrada = {}): string =>
  renderToStaticMarkup(
    <GraficoLineas {...({ ...BASE, ...e } as unknown as PropiedadesDeGrafico)} />,
  );
const barras = (e: Entrada = {}): string =>
  renderToStaticMarkup(
    <GraficoBarras {...({ ...BASE, ...e } as unknown as PropiedadesDeGrafico)} />,
  );
const cuenta = (html: string, patron: RegExp): number => (html.match(patron) ?? []).length;
const SERIES4 = ["Revisados", "Borradores", "Avisos", "Archivados"].map((nombre, i) => ({
  nombre,
  valores: [i + 1, i + 5, i + 2, i + 8],
}));

/** El contenido de las celdas del cuerpo de la tabla, fila a fila. */
function celdas(html: string): string[][] {
  const cuerpo = /<tbody>([\s\S]*?)<\/tbody>/.exec(html)?.[1] ?? "";
  return [...cuerpo.matchAll(/<tr>([\s\S]*?)<\/tr>/g)].map((f) =>
    [...(f[1] ?? "").matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/g)].map((c) =>
      (c[1] ?? "").replace(/<[^>]+>/g, "").trim(),
    ),
  );
}

describe.each([
  ["GraficoLineas", lineas, "lineas", "Gráfico de líneas"],
  ["GraficoBarras", barras, "barras", "Gráfico de barras"],
] as const)("%s · estructura sin JavaScript (REQ-014, REQ-015)", (_n, pintar, tipo, nombreTipo) => {
  const html = pintar();

  it("es una figura con su título y una imagen con nombre igual al título", () => {
    expect(html).toContain(`data-grafico="${tipo}"`);
    expect(html).toMatch(/<figure[^>]*aria-labelledby="[^"]+"/);
    expect(html).toMatch(/<figcaption[^>]*>[^<]*Correos revisados por día/);
    expect(html).toMatch(/<div[^>]*role="img"[^>]*aria-label="Correos revisados por día"/);
  });

  it("la imagen se describe con un texto que remite a la tabla", () => {
    const ref = /role="img"[^>]*aria-describedby="([^"]+)"/.exec(html)?.[1];
    expect(ref).toBeDefined();
    const descripcion = new RegExp(`id="${ref}"[^>]*>([^<]*)<`).exec(html)?.[1] ?? "";
    expect(descripcion).toContain(nombreTipo);
    expect(descripcion).toContain("tabla");
    expect(descripcion).toContain("1.234");
  });

  it("nombra los dos ejes con su unidad", () => {
    expect(html).toContain("Eje horizontal");
    expect(html).toContain("Día");
    expect(html).toContain("Eje vertical");
    expect(html).toContain("Correos revisados (correos)");
  });

  it("la tabla va justo después del dibujo, en un bloque desplegable nativo", () => {
    expect(html).toMatch(/<details[^>]*>\s*<summary[^>]*>Ver los datos en tabla<\/summary>/);
    expect(html.indexOf('role="img"')).toBeLessThan(html.indexOf("<details"));
    expect(html).not.toMatch(/<details[^>]* open/);
  });

  it("con tablaAbierta, el bloque sale abierto", () => {
    expect(pintar({ tablaAbierta: true })).toMatch(/<details[^>]* open/);
  });

  it("ningún control con foco propio, ni capa de teclado, ni estilo en línea propio", () => {
    expect(html).not.toMatch(/\sstyle=/);
    const dibujo = /<div role="img"[\s\S]*?<\/div><\/div>/.exec(html)?.[0] ?? "";
    expect(dibujo).not.toBe("");
    expect(dibujo).not.toContain("tabindex");
    expect(html.match(/tabindex/g)?.length ?? 0).toBeLessThanOrEqual(1); // solo la región de la tabla
    expect(html).not.toContain("<script");
    expect(html).not.toMatch(/\son[a-z]+=/);
  });

  it("no pide pasar el puntero: nada de información emergente en el documento", () => {
    expect(html).not.toContain("recharts-tooltip");
    expect(html).not.toMatch(/\stitle="/);
  });

  it("la zona del dibujo tiene tamaño reservado por clases, no por estilo", () => {
    expect(html).toMatch(/role="img"[^>]*class="[^"]*\baspect-/);
  });
});

describe("TablaEquivalente · los mismos valores que el dibujo (REQ-015)", () => {
  const modelo = leerGrafico(BASE, "lineas");
  const html = renderToStaticMarkup(<TablaEquivalente modelo={modelo} />);

  it("table nativa con título, encabezados de columna y de fila", () => {
    expect(html).toMatch(/<table[^>]*>\s*<caption[^>]*>[^<]*Correos revisados por día/);
    expect(html).toContain('<th scope="col"');
    expect(cuenta(html, /<th scope="col"/g)).toBe(2);
    expect(cuenta(html, /<th scope="row"/g)).toBe(4);
    expect(html).toContain("Revisados (correos)");
  });

  it("cada valor del modelo está en su celda, y el hueco dice «Sin datos», no 0", () => {
    expect(celdas(html)).toEqual([
      ["1 oct 2026", "10"],
      ["2 oct 2026", "1.234"],
      ["3 oct 2026", "0"],
      ["4 oct 2026", "Sin datos"],
    ]);
  });

  it("va dentro de una región desplazable con nombre", () => {
    expect(html).toContain('role="region"');
    expect(html).toContain("overflow-x-auto");
  });

  it("las cifras de las celdas son las del modelo, serie a serie y punto a punto", () => {
    const m = leerGrafico({ ...BASE, series: SERIES4 }, "barras");
    const filas = celdas(renderToStaticMarkup(<TablaEquivalente modelo={m} />));
    expect(filas).toHaveLength(m.puntos > 0 ? m.categorias.length : 0);
    filas.forEach((fila, i) => {
      expect(fila[0]).toBe(m.categorias[i]?.texto);
      m.series.forEach((s, j) => expect(fila[j + 1]).toBe(s.textos[i]));
    });
  });

  it("sin datos o con datos insuficientes no hay tabla", () => {
    expect(renderToStaticMarkup(<TablaEquivalente modelo={leerGrafico({}, "lineas")} />)).toBe("");
  });

  it("el texto hostil se pinta como texto, sin crear elementos", () => {
    const m = leerGrafico(
      {
        ...BASE,
        titulo: '<img src=x onerror="alert(1)"> <script>x</script>',
        ejeX: { nombre: "<b>Día</b>", tipo: "texto" },
        categorias: ["<a href=javascript:alert(1)>a</a>", "&amp;\u202E fin"],
        series: [{ nombre: "</table><b>S</b>", valores: [1, 2] }],
      },
      "lineas",
    );
    const h = renderToStaticMarkup(<TablaEquivalente modelo={m} />);
    expect(h).not.toContain("<img");
    expect(h).not.toContain("<script");
    expect(h).not.toContain("<a ");
    expect(h).not.toContain("<b>");
    expect(h).toContain("&lt;img src=x onerror=&quot;alert(1)&quot;&gt;");
    expect(h).toContain("&amp;amp; fin");
    expect(cuenta(h, /<table/g)).toBe(1);
  });
});

describe("366 puntos: están todos en la tabla (CA-011)", () => {
  it("una fila por punto y ningún valor se pierde", () => {
    const categorias = Array.from({ length: 366 }, (_, i) => Date.UTC(2026, 0, 1 + i, 12));
    const valores = categorias.map((_, i) => (i === 100 ? null : i * 3));
    const html = lineas({ categorias, series: [{ nombre: "A", valores }] });
    const filas = celdas(html);
    expect(filas).toHaveLength(366);
    expect(filas[100]?.[1]).toBe("Sin datos");
    expect(filas[365]?.[1]).toBe("1.095");
    const presentes = filas.filter((f) => f[1] !== "Sin datos");
    expect(presentes).toHaveLength(365);
  });
});

describe("estados sin dibujo (REQ-052, REQ-054)", () => {
  for (const [nombre, pintar] of [
    ["líneas", lineas],
    ["barras", barras],
  ] as const) {
    it(`${nombre}: sin datos dice «Sin datos» y no pinta imagen ni tabla`, () => {
      const html = pintar({ categorias: [], series: [] });
      expect(html).toContain("Sin datos");
      expect(html).not.toContain('role="img"');
      expect(html).not.toContain("<table");
      expect(html).toMatch(/<figcaption[^>]*>[^<]*Correos revisados por día/);
    });

    it(`${nombre}: con menos puntos que el mínimo dice «Sin datos suficientes»`, () => {
      const html = pintar({
        minimoPuntos: 3,
        categorias: [dia(1), dia(2), dia(3)],
        series: [{ nombre: "A", valores: [1, 2, null] }],
      });
      expect(html).toContain("Sin datos suficientes");
      expect(html).not.toContain('role="img"');
      expect(html).not.toContain("<table");
    });

    it(`${nombre}: un valor imposible no se pinta como cero`, () => {
      const html = pintar({ series: [{ nombre: "A", valores: [5, Number.NaN, "7", -1] }] });
      expect(celdas(html).map((f) => f[1])).toEqual(["5", "Sin datos", "Sin datos", "Sin datos"]);
    });
  }
});

describe("leyenda de series: no depende solo del color (REQ-014, REQ-038)", () => {
  it("una sola serie no lleva leyenda", () => {
    expect(lineas()).not.toContain("data-leyenda");
  });

  it("cuatro series de líneas: cuatro entradas con trazo y marcador distintos", () => {
    const html = lineas({ series: SERIES4 });
    expect(cuenta(html, /data-leyenda-serie=/g)).toBe(4);
    const trazos = [...html.matchAll(/data-trazo="([^"]+)"/g)].map((m) => m[1]);
    expect(new Set(trazos).size).toBe(4);
    const marcadores = [...html.matchAll(/data-marcador="([^"]+)"/g)].map((m) => m[1]);
    expect(new Set(marcadores).size).toBe(4);
    for (const nombre of ["Revisados", "Borradores", "Avisos", "Archivados"]) {
      expect(html).toContain(nombre);
    }
  });

  it("la serie principal usa el papel de acento y las demás los suyos, nunca un color suelto", () => {
    const html = lineas({ series: SERIES4 });
    for (const n of [1, 2, 3, 4]) expect(html).toContain(`serie-${n}`);
    expect(html).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
    expect(html).not.toMatch(/rgb\(|hsl\(/);
  });

  it("barras de varias series: cuatro tramas distintas", () => {
    const html = barras({ series: SERIES4 });
    const tramas = [...html.matchAll(/data-trama="([^"]+)"/g)].map((m) => m[1]);
    expect(new Set(tramas).size).toBe(4);
  });
});

describe("texto hostil en todo el gráfico (REQ-071, CA-041)", () => {
  const HOSTIL = '</figcaption><img src=x onerror="alert(1)"><script>alert(1)</script>';
  const html = lineas({
    titulo: HOSTIL,
    ejeX: { nombre: HOSTIL, tipo: "texto" },
    ejeY: { nombre: HOSTIL, unidad: HOSTIL },
    categorias: [HOSTIL, "b"],
    series: [
      { nombre: HOSTIL, valores: [1, 2] },
      { nombre: "x", valores: [2, 3] },
    ],
  });

  it("no crea elementos ni guiones y escapa lo que pinta", () => {
    expect(html).not.toContain("<img");
    expect(html).not.toContain("<script");
    expect(cuenta(html, /<figcaption/g)).toBe(1);
    expect(html).toContain("&lt;/figcaption&gt;");
  });

  it("los atributos con nombre accesible llevan el texto escapado", () => {
    expect(html).toContain(
      'aria-label="&lt;/figcaption&gt;&lt;img src=x onerror=&quot;alert(1)&quot;&gt;',
    );
  });
});

describe("casos límite del dibujo declarados (las barras empiezan en cero, hueco, etc.)", () => {
  it("el dibujo recibe los datos del modelo como datos puros serializables", () => {
    const html = barras({ series: SERIES4 });
    expect(html).toContain('data-puntos="4"');
    expect(html).toContain('data-series="4"');
  });
});
