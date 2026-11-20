// T-007 (c) · PRUEBA-004 (ruta crítica D, REQ-056 y REQ-071): `textoPlano` quita los caracteres de
// control (Cc), toda la categoría Unicode Cf salvo U+200C y U+200D, y los separadores U+2028 y
// U+2029, y no toca nada más. `TextoDato` y `SoloLector` pintan un dato como texto literal: ni
// elementos, ni atributos, ni enlaces. Un dato es un dato, nunca una instrucción.
//
// Los caracteres de dirección y los invisibles se escriben con secuencias de escape: el análisis
// estático de la 002 los rechaza en el código (diseño, «Texto literal»).
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { SoloLector } from "../../../src/components/texto/SoloLector";
import { TextoDato } from "../../../src/components/texto/TextoDato";
import { textoPlano } from "../../../src/components/formato/texto-plano";

const CONSERVADOS = new Set([0x200c, 0x200d]);
const SEPARADORES = [0x2028, 0x2029];

const esCaracterDeControl = (cp: number): boolean => /^\p{Cc}$/u.test(String.fromCodePoint(cp));
const esDeFormato = (cp: number): boolean => /^\p{Cf}$/u.test(String.fromCodePoint(cp));
const esSurrogado = (cp: number): boolean => cp >= 0xd800 && cp <= 0xdfff;

/** Los puntos de código que el diseño manda quitar, en forma de lista propia de la prueba. */
const LISTA_DEL_DISENO: number[] = [
  0x061c,
  0x200e,
  0x200f,
  ...[0x202a, 0x202b, 0x202c, 0x202d, 0x202e],
  ...[0x2066, 0x2067, 0x2068, 0x2069],
  ...[0x00ad, 0x180e, 0x200b, 0xfeff],
  ...[0x2060, 0x2061, 0x2062, 0x2063, 0x2064],
  0xe0001,
  ...Array.from({ length: 0xe007f - 0xe0020 + 1 }, (_, i) => 0xe0020 + i),
  ...SEPARADORES,
];

// Batería de cadenas de CA-041. Los controles de dirección, con escapes.
const BATERIA: readonly string[] = [
  "<b>negrita</b>",
  "<script>alert(1)</script>",
  '<img src=x onerror="alert(1)">',
  '"><svg onload=alert(1)>',
  '<a href="javascript:alert(1)">pulsa</a>',
  "javascript:alert(1)",
  "data:text/html,<script>alert(1)</script>",
  "&lt;b&gt; &amp; &#60;script&#62; &#x3c;",
  "comillas ' \" ` y ${plantilla} y {{llaves}}",
  "ab\u202Ecd\u202Cef \u2066x\u2069 \u200Fy \u061Cz",
  "emoji \u{1F469}\u200D\u{1F469}\u200D\u{1F467} \u{1F3F3}\uFE0F\u200D\u{1F308} \u{1F600}",
  "a".repeat(120),
];

describe("PRUEBA-004 · textoPlano quita lo que debe", () => {
  it("quita toda la categoría Cc (control), también tabulador, saltos de línea y NUL", () => {
    expect(textoPlano("a\u0000b\u0007c\td\ne\rf\u007Fg\u0085h\u009Fi")).toBe("abcdefghi");
  });

  it("quita cada carácter de la lista del diseño", () => {
    for (const cp of LISTA_DEL_DISENO) {
      const c = String.fromCodePoint(cp);
      expect(textoPlano(`a${c}b`), `U+${cp.toString(16).toUpperCase()}`).toBe("ab");
    }
  });

  it("casos concretos de U+2060 a U+2064, U+180E y U+FEFF (huecos que una lista dejaría)", () => {
    expect(textoPlano("a\u2060b\u2061c\u2062d\u2063e\u2064f")).toBe("abcdef");
    expect(textoPlano("a\u180Eb")).toBe("ab");
    expect(textoPlano("\uFEFFabc")).toBe("abc");
    expect(textoPlano("a\u00ADb")).toBe("ab");
    expect(textoPlano("a\u2028b\u2029c")).toBe("abc");
  });

  it("quita todo el Cf y todo el Cc de Unicode, por categoría y no por lista", () => {
    let comprobados = 0;
    for (let cp = 0; cp <= 0x10ffff; cp++) {
      if (esSurrogado(cp)) continue;
      const quitar = esCaracterDeControl(cp) || (esDeFormato(cp) && !CONSERVADOS.has(cp));
      if (!quitar) continue;
      comprobados++;
      expect(textoPlano(`x${String.fromCodePoint(cp)}y`), `U+${cp.toString(16)}`).toBe("xy");
    }
    // Hay más de 200 puntos de código en Cc y Cf (65 de control y unos 170 de formato): si fueran pocos, la categoría no se leyó.
    expect(comprobados).toBeGreaterThan(200);
  });

  it("la lista del diseño está incluida en Cf o Cc o son los separadores", () => {
    for (const cp of LISTA_DEL_DISENO) {
      const incluido = esDeFormato(cp) || esCaracterDeControl(cp) || SEPARADORES.includes(cp);
      expect(incluido, `U+${cp.toString(16)}`).toBe(true);
    }
  });
});

describe("PRUEBA-004 · textoPlano no toca el resto", () => {
  it("U+200C y U+200D se conservan: unen letras y emojis", () => {
    expect(textoPlano("a\u200Cb\u200Dc")).toBe("a\u200Cb\u200Dc");
    const familia = "\u{1F469}\u200D\u{1F469}\u200D\u{1F467}";
    expect(textoPlano(familia)).toBe(familia);
    const persa = "می\u200Cخواهم";
    expect(textoPlano(persa)).toBe(persa);
    expect(textoPlano("\u{1F3F3}\uFE0F\u200D\u{1F308}")).toBe("\u{1F3F3}\uFE0F\u200D\u{1F308}");
  });

  it("el texto corriente, los signos de marcado y las entidades pasan literales", () => {
    for (const cadena of [
      "Hola, ñandú — café «sí»",
      "<b>negrita</b>",
      "&lt;b&gt; &amp; &#60;",
      "\"comillas\" y 'simples' y `invertidas`",
      "espacio\u00A0que no se parte y − menos",
      "a".repeat(120),
      "á ë \uFE0F",
      "  espacios  dobles  ",
      "",
    ]) {
      expect(textoPlano(cadena)).toBe(cadena);
    }
  });

  it("conserva todo punto de código que no es Cc, Cf (salvo ZWNJ y ZWJ) ni separador", () => {
    let recibidos = "";
    let esperados = "";
    for (let cp = 0; cp <= 0x10ffff; cp++) {
      if (esSurrogado(cp)) continue;
      const c = String.fromCodePoint(cp);
      recibidos += c;
      const quitar =
        esCaracterDeControl(cp) ||
        (esDeFormato(cp) && !CONSERVADOS.has(cp)) ||
        SEPARADORES.includes(cp);
      if (!quitar) esperados += c;
    }
    expect(textoPlano(recibidos)).toBe(esperados);
  });

  it("es idempotente y no cambia el orden", () => {
    for (const cadena of BATERIA) {
      const una = textoPlano(cadena);
      expect(textoPlano(una)).toBe(una);
    }
    expect(textoPlano("1\u202E2\u202C3")).toBe("123");
  });

  it("lo que no es una cadena da cadena vacía, nunca el valor", () => {
    for (const valor of [undefined, null, 5, true, {}, [], ["a"], () => "a", Symbol("s")]) {
      expect(textoPlano(valor)).toBe("");
    }
  });
});

describe("PRUEBA-004 · TextoDato", () => {
  it("pinta la cadena como un nodo de texto dentro de bdi, escapada", () => {
    expect(renderToStaticMarkup(<TextoDato texto="Ana Pérez" />)).toBe("<bdi>Ana Pérez</bdi>");
    expect(renderToStaticMarkup(<TextoDato texto="<script>alert(1)</script>" />)).toBe(
      "<bdi>&lt;script&gt;alert(1)&lt;/script&gt;</bdi>",
    );
  });

  it("con toda la batería: 0 elementos y 0 atributos creados (solo el bdi), texto literal", () => {
    for (const cadena of BATERIA) {
      const html = renderToStaticMarkup(<TextoDato texto={cadena} />);
      expect(html.startsWith("<bdi>"), cadena).toBe(true);
      expect(html.endsWith("</bdi>"), cadena).toBe(true);
      const interior = html.slice("<bdi>".length, html.length - "</bdi>".length);
      expect(interior, cadena).not.toContain("<");
      expect(interior, cadena).not.toContain(">");
      expect(interior, cadena).not.toMatch(/"/);
      expect(html.match(/</g)?.length, cadena).toBe(2);
    }
  });

  it("los controles de dirección no llegan al documento", () => {
    const html = renderToStaticMarkup(<TextoDato texto={"ab\u202Ecd\u202Cef\u2066g\u2069"} />);
    expect(html).toBe("<bdi>abcdefg</bdi>");
    expect(html).not.toMatch(/[\u202A-\u202E\u2066-\u2069\u200E\u200F\u061C]/);
  });

  it("conserva el emoji unido y el texto de 120 caracteres entero", () => {
    const emoji = "\u{1F469}\u200D\u{1F467}";
    expect(renderToStaticMarkup(<TextoDato texto={emoji} />)).toBe(`<bdi>${emoji}</bdi>`);
    expect(renderToStaticMarkup(<TextoDato texto={"a".repeat(120)} />)).toBe(
      `<bdi>${"a".repeat(120)}</bdi>`,
    );
  });

  it("no tiene forma de crear un enlace, un atributo o HTML con lo que recibe", () => {
    const intruso = {
      texto: "dato",
      href: "javascript:alert(1)",
      src: "x",
      onClick: "alert(1)",
      className: "x",
      dangerouslySetInnerHTML: { __html: "<b>hola</b>" },
    } as unknown as { texto: string };
    const html = renderToStaticMarkup(<TextoDato {...intruso} />);
    expect(html).toBe("<bdi>dato</bdi>");
  });

  it("lo que no es una cadena se pinta vacío", () => {
    for (const valor of [undefined, null, 5, {}, ["a"]]) {
      expect(renderToStaticMarkup(<TextoDato texto={valor as unknown as string} />)).toBe(
        "<bdi></bdi>",
      );
    }
  });
});

describe("PRUEBA-004 · SoloLector", () => {
  it("pinta el texto solo para el lector de pantalla, escapado y limpio", () => {
    expect(renderToStaticMarkup(<SoloLector>Cargando</SoloLector>)).toBe(
      '<span class="sr-only">Cargando</span>',
    );
    expect(renderToStaticMarkup(<SoloLector>{"<b>x</b>\u202E"}</SoloLector>)).toBe(
      '<span class="sr-only">&lt;b&gt;x&lt;/b&gt;</span>',
    );
  });

  it("con toda la batería: solo el span propio", () => {
    for (const cadena of BATERIA) {
      const html = renderToStaticMarkup(<SoloLector>{cadena}</SoloLector>);
      expect(html.match(/</g)?.length, cadena).toBe(2);
      expect(html.startsWith('<span class="sr-only">'), cadena).toBe(true);
    }
  });

  it("lo que no es una cadena (elementos, números) no se pinta", () => {
    const elemento = <b>no</b>;
    for (const valor of [elemento, 5, null, undefined]) {
      expect(renderToStaticMarkup(<SoloLector>{valor as unknown as string}</SoloLector>)).toBe(
        '<span class="sr-only"></span>',
      );
    }
  });
});
