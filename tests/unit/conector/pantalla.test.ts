// T-109 (001): pantalla.ts. PRUEBA-009 (parte B: HTML sin JavaScript, `state` escapado, estados, CSP) y
// PRUEBA-010 (parte automática: lang, un h1, etiqueta, role=alert, objetivos de 44 px, 360 px, español,
// contraste de los papeles de docs/DISENO.md). La parte con navegador real (A) y la revisión de
// `disenador-ui` (T-113) quedan fuera.
import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import { CALLBACKS } from "../../../src/lib/oauth/callbacks";
import {
  CSP_PANTALLA,
  escaparHtml,
  HUELLA_ESTILO,
  renderizarPantalla,
  type EstadoPantalla,
} from "../../../src/lib/oauth/pantalla";

const base = { asistente: "claude", state: "abc_123-XYZ", solicitud: "id-solicitud-1" } as const;
const formulario = (extra: object = {}): EstadoPantalla =>
  ({ tipo: "formulario", ...base, ...extra }) as EstadoPantalla;
const aceptado: EstadoPantalla = {
  tipo: "aceptado",
  asistente: "claude",
  codigo: "codigo-asistente",
  state: "abc_123-XYZ",
  iss: "https://conector.example/",
};

const todos: Array<[string, EstadoPantalla, number]> = [
  ["formulario", formulario(), 200],
  ["código no válido", formulario({ codigoNoValido: true }), 200],
  ["bloqueado", { tipo: "bloqueado" }, 429],
  ["solicitud no válida", { tipo: "solicitud_no_valida" }, 400],
  ["no disponible", { tipo: "no_disponible" }, 503],
  ["aceptado", aceptado, 200],
];

const bloqueEstilo = (html: string): string => /<style>([\s\S]*?)<\/style>/.exec(html)![1]!;

describe("pantalla: estados y textos", () => {
  it.each(todos)("%s: estado HTTP %i", (_n, e, codigo) => {
    expect(renderizarPantalla(e).estado).toBe(codigo);
  });

  it("formulario inicial: textos del diseño", () => {
    const { html } = renderizarPantalla(formulario());
    expect(html).toContain("<h1>Activar el conector de HumanaIA</h1>");
    expect(html).toContain("Vas a conectar: <strong>claude.ai</strong>");
    expect(html).toContain("Código de activación");
    expect(html).toContain("Te lo da HumanaIA. Caduca a los 10 minutos y solo sirve una vez");
    expect(html).toContain(">Activar</button>");
    expect(html).toContain("Continúa solo si has empezado tú esta conexión desde tu asistente.");
    expect(html).not.toContain('role="alert"');
  });

  it("el asistente sale de la tabla fija por callback", () => {
    expect(renderizarPantalla(formulario({ asistente: "chatgpt" })).html).toContain("ChatGPT");
  });

  it("código no válido: un solo mensaje, con role=alert y aria-describedby", () => {
    const { html } = renderizarPantalla(formulario({ codigoNoValido: true }));
    expect(html).toContain("El código no es válido o ha caducado. Pide uno nuevo a HumanaIA.");
    expect(html).toMatch(/role="alert"/);
    expect(html).toMatch(/aria-describedby="[^"]*error-codigo/);
    expect(html).toContain("autofocus");
  });

  it("bloqueado, solicitud no válida y no disponible: mensaje del diseño y sin formulario", () => {
    const b = renderizarPantalla({ tipo: "bloqueado" }).html;
    const s = renderizarPantalla({ tipo: "solicitud_no_valida" }).html;
    const n = renderizarPantalla({ tipo: "no_disponible" }).html;
    expect(b).toContain(
      "Demasiados intentos. Espera 15 minutos y pide un código nuevo a HumanaIA.",
    );
    expect(s).toContain("Esta solicitud ha caducado. Vuelve a empezar desde tu asistente.");
    expect(n).toContain("No se ha podido completar. Inténtalo de nuevo en unos minutos.");
    for (const h of [b, s, n]) {
      expect(h).not.toContain("<form");
      expect(h).toMatch(/role="alert"/);
    }
  });

  it("aceptado: sin redirección automática y con enlace-botón codificado", () => {
    const { html } = renderizarPantalla(aceptado);
    expect(html).toContain("Código aceptado.");
    expect(html).toContain("Continuar en claude.ai");
    expect(html).not.toMatch(/http-equiv/i);
    const url = new URL(/href="([^"]+)"/.exec(html)![1]!.replaceAll("&amp;", "&"));
    expect(`${url.origin}${url.pathname}`).toBe(CALLBACKS.claude);
    expect(url.searchParams.get("code")).toBe("codigo-asistente");
    expect(url.searchParams.get("state")).toBe("abc_123-XYZ");
    expect(url.searchParams.get("iss")).toBe("https://conector.example/");
  });

  it("aceptado: valores raros se codifican para URL y se escapan para HTML", () => {
    const { html } = renderizarPantalla({
      ...aceptado,
      state: `a&b="c"<d>#e f`,
      iss: 'https://c.example/a b&c="d"<e>',
    } as EstadoPantalla);
    const crudo = /href="([^"]+)"/.exec(html)![1]!;
    expect(crudo).not.toMatch(/[<> "]/);
    const href = crudo.replaceAll("&amp;", "&");
    expect(new URL(href).searchParams.get("state")).toBe(`a&b="c"<d>#e f`);
    expect(new URL(href).searchParams.get("iss")).toBe('https://c.example/a b&c="d"<e>');
    expect(new URL(href).hash).toBe("");
  });
});

describe("pantalla: cierre en fallo", () => {
  it.each([
    ["asistente desconocido", formulario({ asistente: "otro" })],
    ["asistente de prototipo", formulario({ asistente: "__proto__" })],
    ["asistente que no es texto", formulario({ asistente: 3 })],
    ["state que no es texto", formulario({ state: { a: 1 } })],
    ["solicitud ausente", formulario({ solicitud: undefined })],
    ["state con sustituto suelto", formulario({ state: "\uD800" })],
    ["state con carácter de control", formulario({ state: "a\u0000b" })],
    ["state no ASCII", formulario({ state: "añ" })],
    ["state de 513 caracteres", formulario({ state: "a".repeat(513) })],
    ["aceptado con state de 513 caracteres", { ...aceptado, state: "a".repeat(513) }],
    ["aceptado con state de sustituto suelto", { ...aceptado, state: "\uD800" }],
    [
      "aceptado con asistente otro",
      { ...aceptado, asistente: "otro" } as unknown as EstadoPantalla,
    ],
    [
      "aceptado con codigo que no es texto",
      { ...aceptado, codigo: 1 } as unknown as EstadoPantalla,
    ],
    [
      "aceptado con state undefined",
      { ...aceptado, state: undefined } as unknown as EstadoPantalla,
    ],
    ["aceptado sin iss", { ...aceptado, iss: undefined } as unknown as EstadoPantalla],
    ["solicitud de 257 caracteres", formulario({ solicitud: "a".repeat(257) })],
    ["solicitud vacía", formulario({ solicitud: "" })],
    ["solicitud con comillas", formulario({ solicitud: 'ab"cd' })],
    ["solicitud con sustituto suelto", formulario({ solicitud: "ab\uD800" })],
    ["solicitud con canario", formulario({ solicitud: "CANARIO-<x>&" })],
    [
      "código no válido con solicitud con comillas",
      formulario({ codigoNoValido: true, solicitud: "a'b" }),
    ],
    ["aceptado con codigo con sustituto suelto", { ...aceptado, codigo: "ab\uD800" }],
    ["aceptado con codigo fuera del alfabeto", { ...aceptado, codigo: "x y&z" }],
    ["aceptado con codigo de 257 caracteres", { ...aceptado, codigo: "a".repeat(257) }],
    ["aceptado con codigo vacío", { ...aceptado, codigo: "" }],
    ["aceptado con iss con sustituto suelto", { ...aceptado, iss: "https://a/\uD800" }],
    ["aceptado con iss no ASCII", { ...aceptado, iss: "https://añ/" }],
    ["aceptado con iss de 513 caracteres", { ...aceptado, iss: "a".repeat(513) }],
    ["aceptado con iss vacío", { ...aceptado, iss: "" }],
    ["tipo desconocido", { tipo: "x" } as unknown as EstadoPantalla],
    ["entrada nula", null as unknown as EstadoPantalla],
  ])("%s: «no disponible» 503, sin reflejar nada", (_n, e) => {
    const r = renderizarPantalla(e);
    expect(r.estado).toBe(503);
    expect(r.html).toContain("No se ha podido completar.");
    expect(r.html).not.toContain("<form");
  });
});

describe("pantalla: escapado de lo reflejado (PRUEBA-009 B)", () => {
  const ataques = [
    `"><script>alert(1)</script>`,
    `' onfocus='alert(1)' x='`,
    `" autofocus onfocus="alert(1)`,
    `</textarea><img src=x onerror=alert(1)>`,
    "`&amp;&#x3c; ",
    `javascript:alert(1)`,
  ];
  it.each(ataques)("state hostil %j: sin marcado inyectado", (state) => {
    const { html } = renderizarPantalla(formulario({ state }));
    expect(html).not.toMatch(/<script/i);
    expect(html).not.toMatch(/<img/i);
    // Con los valores entre comillas dobles vaciados, no queda ninguna comilla, `<` ni acento grave.
    for (const m of html.matchAll(/<input[^>]*>/g)) {
      expect(m[0].slice(6, -1).replaceAll(/"[^"]*"/g, "")).not.toMatch(/["'<`]/);
    }
  });

  it("el canario de una solicitud no válida no se refleja", () => {
    const { html } = renderizarPantalla(formulario({ solicitud: "CANARIO-<x>&" }));
    expect(html).not.toContain("CANARIO");
  });

  it("solicitud y codigo de 256 caracteres del alfabeto, e iss de 512, se admiten", () => {
    const sol = "aZ09._~-".repeat(32);
    expect(renderizarPantalla(formulario({ solicitud: sol })).estado).toBe(200);
    const r = renderizarPantalla({ ...aceptado, codigo: sol, iss: "h".repeat(512) });
    expect(r.estado).toBe(200);
  });

  it("escaparHtml sustituye los caracteres de control por U+FFFD", () => {
    const html = escaparHtml("a\u0000b");
    expect(html).toContain("\uFFFD");
    expect(html).not.toContain("\u0000");
  });

  it("state de 512 caracteres ASCII imprimibles se admite", () => {
    expect(renderizarPantalla(formulario({ state: "a".repeat(512) })).estado).toBe(200);
  });

  it("el ampersand reflejado se escapa siempre", () => {
    const { html } = renderizarPantalla(formulario({ state: "&amp;&#x3c;" }));
    expect(html).toContain("&amp;amp;&amp;#x3c;");
  });

  it("el state aparece solo en el campo oculto, como valor exacto escapado", () => {
    const { html } = renderizarPantalla(formulario({ state: `a"b<c&d'e` }));
    expect(html).toContain(`name="state" value="a&quot;b&lt;c&amp;d&#39;e"`);
  });

  it("nada de la petición salvo state y solicitud aparece en el HTML", () => {
    const e = {
      ...formulario(),
      cabecera: "SECRETO-X",
      otro: "DATO-Y",
    } as unknown as EstadoPantalla;
    const { html } = renderizarPantalla(e);
    expect(html).not.toContain("SECRETO-X");
    expect(html).not.toContain("DATO-Y");
  });
});

describe("pantalla: sin JavaScript, sin recursos externos, CSP (PRUEBA-009 B)", () => {
  it.each(todos)("%s", (_n, e) => {
    const { html } = renderizarPantalla(e);
    expect(html).not.toMatch(/<script/i);
    expect(html).not.toMatch(/\son[a-z]+\s*=/i);
    expect(html).not.toMatch(/javascript:/i);
    expect(html).not.toMatch(/\sstyle\s*=/i); // la CSP solo admite el bloque con huella
    expect(html).not.toMatch(/<(link|img|iframe|object|embed|base|meta\s+http-equiv)/i);
    expect(html).not.toMatch(/\s(src|srcset)\s*=/i);
    expect(html).not.toMatch(/@import|url\(/i);
    // Único enlace saliente posible: el callback del asistente en «aceptado».
    const urls = [...html.matchAll(/https?:\/\/[^\s"'<)]+/g)].map((m) => m[0]);
    for (const u of urls) {
      expect(u.startsWith(CALLBACKS.claude) || u.startsWith("https://conector.example")).toBe(true);
    }
  });

  it("la huella de la CSP es la del único bloque de estilo", () => {
    const { html } = renderizarPantalla(formulario());
    expect([...html.matchAll(/<style>/g)]).toHaveLength(1);
    const huella = createHash("sha256").update(bloqueEstilo(html), "utf8").digest("base64");
    expect(HUELLA_ESTILO).toBe(`sha256-${huella}`);
    expect(CSP_PANTALLA).toBe(
      `default-src 'none'; style-src '${HUELLA_ESTILO}'; form-action 'self'; base-uri 'none'; frame-ancestors 'none'`,
    );
    for (const [, e] of todos) {
      expect(bloqueEstilo(renderizarPantalla(e).html)).toBe(bloqueEstilo(html));
    }
  });

  it("cabeceras: HTML en UTF-8, sin caché y la CSP del diseño", () => {
    for (const [, e] of todos) {
      const { cabeceras } = renderizarPantalla(e);
      expect(cabeceras["content-type"]).toBe("text/html; charset=utf-8");
      expect(cabeceras["cache-control"]).toBe("no-store");
      expect(cabeceras["content-security-policy"]).toBe(CSP_PANTALLA);
    }
  });

  it("el formulario envía por POST a /oauth/autorizar, sin acción externa", () => {
    const { html } = renderizarPantalla(formulario());
    expect(html).toMatch(/<form method="post" action="\/oauth\/autorizar"/);
  });
});

describe("pantalla: accesibilidad automática (PRUEBA-010)", () => {
  it.each(todos)("%s: lang, un h1, viewport, título y español", (_n, e) => {
    const { html } = renderizarPantalla(e);
    expect(html).toMatch(/^<!doctype html>\n<html lang="es">/i);
    expect(html.match(/<h1[ >]/g)).toHaveLength(1);
    expect(html).toContain('<meta charset="utf-8">');
    expect(html).toContain('<meta name="viewport" content="width=device-width, initial-scale=1">');
    expect(html).toMatch(/<title>[^<]*HumanaIA<\/title>/);
    expect(html).toContain("<main>");
    expect(html).not.toMatch(/\b(Submit|Activate|Invalid)\b/);
  });

  it("campo: etiqueta asociada, autocompletado de un solo uso y ayuda enlazada", () => {
    const { html } = renderizarPantalla(formulario());
    expect(html).toContain('<label for="codigo">Código de activación</label>');
    const input = /<input[^>]*id="codigo"[^>]*>/.exec(html)![0];
    expect(input).toContain('name="codigo"');
    expect(input).toContain('autocomplete="one-time-code"');
    expect(input).toContain("required");
    expect(input).toContain('type="text"');
    expect(input).toContain('autocapitalize="characters"');
    expect(input).toContain('spellcheck="false"');
    expect(input).toMatch(/aria-describedby="[^"]*ayuda-codigo/);
    expect(html).toContain('id="ayuda-codigo"');
  });

  it("los ids son únicos", () => {
    for (const [, e] of todos) {
      const ids = [...renderizarPantalla(e).html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });

  it("objetivos de 44 px, foco visible, 360 px y colores forzados", () => {
    const css = bloqueEstilo(renderizarPantalla(formulario()).html);
    expect(css).toMatch(/min-height:\s*44px/);
    expect(css).toMatch(/:focus-visible/);
    expect(css).toMatch(/outline-offset:\s*2px/);
    expect(css).toMatch(/max-width:\s*100%/);
    expect(css).toMatch(/overflow-wrap:\s*anywhere/);
    expect(css).toMatch(/box-sizing:\s*border-box/);
    expect(css).toMatch(/prefers-color-scheme:\s*dark/);
    expect(css).toMatch(/forced-colors:\s*active/);
    expect(css).not.toMatch(/\d{4,}px/); // sin anchos fijos que desborden 360 px
  });

  it("los colores son solo valores de docs/DISENO.md", () => {
    const css = bloqueEstilo(renderizarPantalla(formulario()).html);
    const permitidos = new Set([
      "#F8FAFC",
      "#FFFFFF",
      "#0F172A",
      "#475569",
      "#E5E7EB",
      "#64748B",
      "#6C3CE9",
      "#8B5CF6",
      "#B91C1C",
      "#15803D",
      "#0B1120",
      "#151E2E",
      "#F1F5F9",
      "#A3B0C2",
      "#273449",
      "#7D8BA0",
      "#A78BFA",
      "#F87171",
      "#4ADE80",
    ]);
    const usados = [...css.matchAll(/#[0-9a-fA-F]{3,8}\b/g)].map((m) => m[0].toUpperCase());
    expect(usados.length).toBeGreaterThan(0);
    for (const c of usados) expect(permitidos.has(c)).toBe(true);
  });

  const lum = (hex: string): number => {
    const c = [1, 3, 5].map((i) => {
      const v = Number.parseInt(hex.slice(i, i + 2), 16) / 255;
      return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * c[0]! + 0.7152 * c[1]! + 0.0722 * c[2]!;
  };
  const contraste = (a: string, b: string): number => {
    const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
    return (x! + 0.05) / (y! + 0.05);
  };

  it.each([
    ["claro texto", "#0F172A", "#F8FAFC", 4.5],
    ["claro secundario", "#475569", "#F8FAFC", 4.5],
    ["claro error", "#B91C1C", "#F8FAFC", 4.5],
    ["claro correcto", "#15803D", "#F8FAFC", 4.5],
    ["claro botón", "#FFFFFF", "#6C3CE9", 4.5],
    ["claro borde de control", "#64748B", "#FFFFFF", 3],
    ["claro foco", "#8B5CF6", "#F8FAFC", 3],
    ["oscuro texto", "#F1F5F9", "#0B1120", 4.5],
    ["oscuro secundario", "#A3B0C2", "#0B1120", 4.5],
    ["oscuro error", "#F87171", "#0B1120", 4.5],
    ["oscuro correcto", "#4ADE80", "#0B1120", 4.5],
    ["oscuro botón", "#0F172A", "#A78BFA", 4.5],
    ["oscuro borde de control", "#7D8BA0", "#151E2E", 3],
    ["oscuro foco", "#A78BFA", "#0B1120", 3],
  ] as const)("contraste %s", (_n, a, b, minimo) => {
    expect(contraste(a, b)).toBeGreaterThanOrEqual(minimo);
  });
});
