// T-010 (e) · `TarjetaCifra` (diseño 020, «Componentes base», fila `TarjetaCifra`; REQ-011, REQ-050,
// REQ-053, REQ-055, REQ-076, REQ-081; CA-008, CA-039, CA-040, CA-050). Se pinta en el servidor de
// pruebas (no hay jsdom). El ajuste real del tamaño al ancho y el nombre accesible calculado por el
// navegador los mide `cifras-y-etiquetas.spec.ts`.
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { TarjetaCifra } from "../../../src/components/cifras/TarjetaCifra";
import { TEXTOS } from "../../../src/components/textos";

const RAIZ = resolve(import.meta.dirname, "..", "..", "..");
const NBSP = " ";
const MENOS = "−";

type Propiedades = Parameters<typeof TarjetaCifra>[0];
const ETIQUETA = TEXTOS.cifras.ejemplo.correosRevisados;
const PERIODO = TEXTOS.cifras.comparacion.ultimos7Dias;

const pintar = (p: Partial<Propiedades> & Pick<Propiedades, "valor">): string =>
  renderToStaticMarkup(<TarjetaCifra etiqueta={ETIQUETA} {...p} />);

/** Texto visible de un trozo de HTML: sin etiquetas, con las entidades de una sola vez. */
const texto = (html: string): string =>
  html
    .replace(/<[^>]*>/g, " ")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/[ \t\r\n]+/g, " ")
    .trim();

/** Lo que hace el navegador con `aria-labelledby`: el texto de cada elemento citado, en orden. */
function nombreAccesible(html: string): string {
  const grupo = /<div[^>]*role="group"[^>]*>/.exec(html)![0];
  const ids = /aria-labelledby="([^"]*)"/.exec(grupo)![1]!.split(" ");
  return ids
    .map((id) => {
      const ancla = html.indexOf(`id="${id}"`);
      expect(ancla, `el id ${id} existe`).toBeGreaterThan(-1);
      const apertura = html.lastIndexOf("<", ancla);
      const etiqueta = /^<(\w+)/.exec(html.slice(apertura))![1]!;
      let profundidad = 0;
      const patron = new RegExp(`<(/?)${etiqueta}\\b[^>]*>`, "g");
      patron.lastIndex = apertura;
      for (let m = patron.exec(html); m !== null; m = patron.exec(html)) {
        profundidad += m[1] === "/" ? -1 : 1;
        if (profundidad === 0) return texto(html.slice(apertura, patron.lastIndex));
      }
      throw new Error(`sin cierre para ${id}`);
    })
    .join(" ");
}

const clasesDe = (html: string): string[] =>
  [...html.matchAll(/class="([^"]*)"/g)].flatMap((m) => m[1]!.split(" "));

describe("TarjetaCifra · un grupo con nombre accesible (REQ-011, CA-008)", () => {
  it("es un grupo cuyo nombre une etiqueta, valor, variación y periodo, en ese orden", () => {
    const html = pintar({
      valor: 1234,
      comparacion: {
        anterior: 1100,
        anteriorCompleto: true,
        periodo: PERIODO,
        valoracion: "favorable",
      },
    });
    expect(html).toMatch(/role="group"/);
    expect(nombreAccesible(html)).toBe(`${ETIQUETA} 1.234 +12,2${NBSP}% (Favorable) ${PERIODO}`);
  });

  it("sin comparación pedida, el nombre es solo etiqueta y valor", () => {
    expect(nombreAccesible(pintar({ valor: 7 }))).toBe(`${ETIQUETA} 7`);
  });

  it("dos tarjetas no comparten ids", () => {
    const html = renderToStaticMarkup(
      <>
        <TarjetaCifra etiqueta={ETIQUETA} valor={1} />
        <TarjetaCifra etiqueta={ETIQUETA} valor={2} />
      </>,
    );
    const ids = [...html.matchAll(/ id="([^"]+)"/g)].map((m) => m[1]);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids.length).toBeGreaterThanOrEqual(4);
  });
});

describe("TarjetaCifra · el valor entra por leerCifra (REQ-050, REQ-076, CA-039)", () => {
  it("cero se ve como «0», nunca como «Sin datos»", () => {
    const html = pintar({ valor: 0 });
    expect(nombreAccesible(html)).toBe(`${ETIQUETA} 0`);
    expect(html).not.toContain(TEXTOS.formato.sinDatos);
  });

  it.each([
    ["undefined", undefined],
    ["null", null],
    ["NaN", Number.NaN],
    ["Infinity", Number.POSITIVE_INFINITY],
    ["una cadena numérica", "12"],
    ["un negativo donde no cabe", -5],
    ["un objeto", { valor: 12 }],
    ["15 cifras o más", 1e15],
  ])(
    "%s se ve y se lee como «Sin datos», nunca como cero ni como el valor recibido",
    (_n, valor) => {
      const html = pintar({ valor });
      expect(nombreAccesible(html)).toBe(`${ETIQUETA} ${TEXTOS.formato.sinDatos}`);
      expect(texto(html)).not.toMatch(/(?:^|\s)0(?:\s|$)/);
      expect(html).not.toContain("12<");
      expect(html).not.toContain("[object");
    },
  );

  it("un negativo cabe si la vista baja el mínimo", () => {
    expect(nombreAccesible(pintar({ valor: -5, minimo: -10 }))).toBe(`${ETIQUETA} ${MENOS}5`);
  });

  it("con decimales los pone con coma", () => {
    expect(nombreAccesible(pintar({ valor: 28.4, decimales: 1 }))).toBe(`${ETIQUETA} 28,4`);
  });

  it("999.999.999 se pinta completo: sin abreviar ni cortar (REQ-081)", () => {
    const html = pintar({ valor: 999_999_999 });
    expect(html).toContain(">999.999.999<");
    expect(texto(html)).not.toMatch(/\d\s?(?:M|mil|k|mill)/i);
    expect(
      clasesDe(html).filter((c) =>
        /truncate|ellipsis|line-clamp|overflow-hidden|overflow-clip/.test(c),
      ),
    ).toEqual([]);
  });

  it("la cifra lleva números tabulares (data-cifra)", () => {
    expect(pintar({ valor: 1 })).toMatch(/<span[^>]*data-cifra/);
  });
});

describe("TarjetaCifra · variación (REQ-053, REQ-055, CA-008, CA-040)", () => {
  const comparar = (
    valor: unknown,
    anterior: unknown,
    extra: Partial<NonNullable<Propiedades["comparacion"]>> = {},
  ): string =>
    pintar({
      valor,
      comparacion: { anterior, anteriorCompleto: true, periodo: PERIODO, ...extra },
    });

  it("positiva: signo «+», porcentaje con coma y el periodo", () => {
    const html = comparar(112, 100);
    expect(nombreAccesible(html)).toContain(`+12,0${NBSP}%`);
    expect(nombreAccesible(html)).toContain(PERIODO);
  });

  it("negativa: signo menos propio (U+2212), no un guion", () => {
    const nombre = nombreAccesible(comparar(90, 100));
    expect(nombre).toContain(`${MENOS}10,0${NBSP}%`);
    expect(nombre).not.toMatch(/ -\d/);
  });

  it("nula: «0 %» con la palabra «Sin cambios»", () => {
    const nombre = nombreAccesible(comparar(100, 100));
    expect(nombre).toContain(`0${NBSP}%`);
    expect(nombre).toContain(TEXTOS.formato.sinCambios);
  });

  it("con valor anterior cero no hay porcentaje: diferencia absoluta con signo", () => {
    const html = comparar(50, 0);
    const nombre = nombreAccesible(html);
    expect(nombre).toContain("+50");
    expect(nombre).not.toContain("%");
    expect(nombre).not.toMatch(/Infinity|NaN/);
  });

  it("sin periodo anterior completo: «Sin datos para comparar», sin signo ni valoración", () => {
    const html = pintar({
      valor: 100,
      comparacion: {
        anterior: 90,
        anteriorCompleto: false,
        periodo: PERIODO,
        valoracion: "favorable",
      },
    });
    const nombre = nombreAccesible(html);
    expect(nombre).toContain(TEXTOS.formato.sinDatosParaComparar);
    expect(nombre).not.toMatch(/[+−]\d|Favorable|Desfavorable|%/);
  });

  it("valor ausente con comparación pedida: «Sin datos» y «Sin datos para comparar»", () => {
    const nombre = nombreAccesible(comparar(undefined, 100));
    expect(nombre).toContain(`${ETIQUETA} ${TEXTOS.formato.sinDatos} `);
    expect(nombre).toContain(TEXTOS.formato.sinDatosParaComparar);
  });

  it("valor anterior que no es un número: «Sin datos para comparar»", () => {
    expect(nombreAccesible(comparar(100, "90"))).toContain(TEXTOS.formato.sinDatosParaComparar);
    expect(nombreAccesible(comparar(100, null))).toContain(TEXTOS.formato.sinDatosParaComparar);
  });

  it("la valoración la declara la vista: la misma subida puede ser favorable o desfavorable", () => {
    const favorable = comparar(120, 100, { valoracion: "favorable" });
    const desfavorable = comparar(120, 100, { valoracion: "desfavorable" });
    expect(nombreAccesible(favorable)).toContain(
      `+20,0${NBSP}% (${TEXTOS.cifras.valoracion.favorable})`,
    );
    expect(nombreAccesible(desfavorable)).toContain(
      `+20,0${NBSP}% (${TEXTOS.cifras.valoracion.desfavorable})`,
    );
    // Y la bajada también.
    expect(nombreAccesible(comparar(80, 100, { valoracion: "favorable" }))).toContain(
      `${MENOS}20,0${NBSP}% (${TEXTOS.cifras.valoracion.favorable})`,
    );
  });

  it("sin valoración declarada o con una que no existe es neutra: nunca favorable por defecto", () => {
    for (const valoracion of [undefined, "excelente", "__proto__", 3] as unknown[]) {
      const html = comparar(120, 100, { valoracion: valoracion as "favorable" });
      expect(nombreAccesible(html), String(valoracion)).toContain(
        `(${TEXTOS.cifras.valoracion.neutra})`,
      );
      expect(clasesDe(html)).not.toContain("text-correcto");
      expect(clasesDe(html)).not.toContain("text-error");
    }
  });

  it("el color acompaña a la palabra: correcto, error y secundario, con papeles de color", () => {
    expect(clasesDe(comparar(120, 100, { valoracion: "favorable" }))).toContain("text-correcto");
    expect(clasesDe(comparar(120, 100, { valoracion: "desfavorable" }))).toContain("text-error");
    expect(clasesDe(comparar(120, 100, { valoracion: "neutra" }))).toContain(
      "text-texto-secundario",
    );
  });
});

describe("TarjetaCifra · solo sistema de diseño (PRUEBA-005, PRUEBA-008)", () => {
  const todas = [
    pintar({ valor: 1234 }),
    pintar({ valor: 999_999_999 }),
    pintar({ valor: null }),
    pintar({
      valor: 1,
      comparacion: {
        anterior: 0,
        anteriorCompleto: true,
        periodo: PERIODO,
        valoracion: "favorable",
      },
    }),
  ];

  it("sin `style` en línea, sin colores literales y sin clases de valor arbitrario", () => {
    for (const html of todas) {
      expect(html).not.toMatch(/\sstyle=/);
      expect(html).not.toMatch(/#[0-9a-f]{3,8}\b|rgb\(|hsl\(/i);
      expect(clasesDe(html).filter((c) => /[[\]]/.test(c))).toEqual([]);
    }
  });

  it("el tamaño del valor es una clase de la escala, nada más", () => {
    for (const html of todas) {
      const valor = /<span[^>]*data-cifra[^>]*>/.exec(html)![0];
      expect(valor).toMatch(
        /class="[^"]*\btext-(?:cifra|titulo|subtitulo|cuerpo|cuerpo-menor|pequeno)\b/,
      );
      expect(valor).toMatch(/data-paso="(?:cifra|titulo|subtitulo|cuerpo|cuerpo-menor|pequeno)"/);
    }
  });

  it("la etiqueta y el periodo son textos fijos: el tipo no admite una cadena cualquiera", () => {
    // @ts-expect-error una cadena libre no es un texto fijo de TEXTOS
    pintar({ valor: 1, etiqueta: "Texto libre" });
    expect(true).toBe(true);
  });

  it("el código lee el valor con leerCifra y la variación con calcularVariacion", () => {
    const fuente = readFileSync(resolve(RAIZ, "src/components/cifras/TarjetaCifra.tsx"), "utf8");
    expect(fuente).toMatch(/leerCifra|formatearCifra/);
    expect(fuente).toMatch(/calcularVariacion/);
    expect(fuente).not.toMatch(/fetch\(|style=|toLocaleString|Intl\./);
  });
});
