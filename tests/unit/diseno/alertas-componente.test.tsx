// T-010 (i) · `ListaAlertas` (diseño 020, «Componentes base», fila `ListaAlertas`; REQ-016, REQ-047,
// REQ-056, REQ-071; CA-012, CA-041, CA-051). Se pinta en el servidor de pruebas. El teclado, los
// anchos, el contraste y `axe` están en `tests/e2e/muestra/alertas.spec.ts`.
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ListaAlertas } from "../../../src/components/alertas/ListaAlertas";
import {
  ACCIONES_DE_ALERTA,
  GRAVEDADES_DE_ALERTA,
  TIPOS_DE_ALERTA,
} from "../../../src/components/alertas/logica";
import { TEXTOS } from "../../../src/components/textos";

const RAIZ = resolve(import.meta.dirname, "..", "..", "..");
const MOMENTO = "2026-11-12T07:04:00Z";
const nada = (): void => undefined;
const pintar = (alertas: readonly unknown[]): string =>
  renderToStaticMarkup(<ListaAlertas alertas={alertas} alAccionar={nada} />);
const elementos = (html: string): string[] => html.match(/<li[\s\S]*?<\/li>/g) ?? [];
const texto = (html: string): string => html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ");

const base = (extra: Record<string, unknown> = {}): Record<string, unknown> => ({
  gravedad: "aviso",
  tipo: "licencia_por_caducar",
  momento: MOMENTO,
  ...extra,
});

describe("ListaAlertas · estructura (REQ-016)", () => {
  it("es una lista con nombre y un elemento por alerta, en el orden recibido", () => {
    const html = pintar([
      base({ tipo: "agente_sin_senal" }),
      base({ tipo: "licencia_por_caducar" }),
      base({ tipo: "revision_completada" }),
    ]);
    expect(html).toMatch(/^<ul[^>]*aria-label="Alertas"/);
    const lis = elementos(html);
    expect(lis).toHaveLength(3);
    expect(lis[0]).toContain(TEXTOS.alertas.tipos.agente_sin_senal);
    expect(lis[1]).toContain(TEXTOS.alertas.tipos.licencia_por_caducar);
    expect(lis[2]).toContain(TEXTOS.alertas.tipos.revision_completada);
  });

  it("cada gravedad se dice con su palabra, con un icono decorativo, y el tono acompaña", () => {
    for (const g of GRAVEDADES_DE_ALERTA) {
      const li = elementos(pintar([base({ gravedad: g })]))[0]!;
      expect(li, g).toContain(`data-gravedad="${g}"`);
      expect(li, g).toContain(`>${TEXTOS.alertas.gravedad[g]}<`);
      expect(li, g).toMatch(/<svg[^>]*aria-hidden="true"/);
    }
    const tonos = GRAVEDADES_DE_ALERTA.map(
      (g) => /data-tono="([a-z]+)"/.exec(elementos(pintar([base({ gravedad: g })]))[0]!)![1],
    );
    expect(new Set(tonos).size).toBe(GRAVEDADES_DE_ALERTA.length);
  });

  it("una gravedad fuera de la lista es «Gravedad desconocida», nunca una de las tres", () => {
    for (const g of ["urgente", "", null, undefined, { gravedad: "critica" }]) {
      const li = elementos(pintar([base({ gravedad: g })]))[0]!;
      expect(li).toContain('data-gravedad="desconocida"');
      expect(li).toContain(`>${TEXTOS.alertas.gravedad.desconocida}<`);
      expect(li).toContain('data-tono="neutro"');
      for (const real of GRAVEDADES_DE_ALERTA) {
        expect(li).not.toContain(`>${TEXTOS.alertas.gravedad[real]}<`);
      }
    }
  });

  it("el momento sale con el formato común", () => {
    const li = elementos(pintar([base()]))[0]!;
    expect(li).toContain("12 nov 2026, 08:04");
  });

  it("el tipo desconocido lleva su texto fijo y no el recibido", () => {
    const html = pintar([base({ tipo: "TESTIGO-TIPO-<b>" })]);
    expect(html).toContain(TEXTOS.alertas.tipos.desconocido);
    expect(html).not.toContain("TESTIGO-TIPO");
  });

  it("los campos de más no aparecen en ningún sitio (CA-051)", () => {
    const html = pintar([
      base({ mensaje: "TESTIGO-1", detalle: "TESTIGO-2", prompt: "TESTIGO-3", id: "TESTIGO-4" }),
    ]);
    expect(html).not.toContain("TESTIGO");
  });

  it("cada tipo de la lista tiene su texto", () => {
    for (const t of TIPOS_DE_ALERTA) {
      expect(pintar([base({ tipo: t })])).toContain(TEXTOS.alertas.tipos[t]);
    }
  });

  it("nada que no sea un objeto se pinta como texto: cierra en alerta desconocida", () => {
    const html = pintar(["TESTIGO-CADENA", null, 7]);
    expect(html).not.toContain("TESTIGO");
    expect(elementos(html)).toHaveLength(3);
    expect(html).toContain(TEXTOS.alertas.tipos.desconocido);
  });
});

describe("ListaAlertas · vacía", () => {
  it("sin alertas, un estado vacío coherente y ninguna lista vacía", () => {
    for (const v of [[], undefined, null, "no es una lista", {}]) {
      const html = renderToStaticMarkup(
        <ListaAlertas alertas={v as unknown as readonly unknown[]} alAccionar={nada} />,
      );
      expect(html, String(v)).toContain(TEXTOS.alertas.vacio.titulo);
      expect(html, String(v)).toContain(TEXTOS.alertas.vacio.explicacion);
      expect(html, String(v)).not.toContain("<ul");
      expect(html, String(v)).not.toContain("<li");
    }
  });
});

describe("ListaAlertas · la acción: como mucho un botón, con verbo (REQ-016, CA-012)", () => {
  it("sin acción no hay botón", () => {
    expect(pintar([base()])).not.toContain("<button");
  });

  it("con acción, un solo botón de tipo button con su verbo", () => {
    for (const a of ACCIONES_DE_ALERTA) {
      const li = elementos(pintar([base({ accion: a })]))[0]!;
      expect(li.match(/<button/g), a).toHaveLength(1);
      expect(li).toContain('type="button"');
      expect(li).toContain(`>${TEXTOS.alertas.acciones[a].texto}<`);
      expect(li).not.toContain("aria-disabled");
    }
  });

  it("una acción que no es de la lista no pinta botón y no se pinta lo recibido", () => {
    const html = pintar([base({ accion: "Borrar todo <i>" }), base({ accion: { texto: "x" } })]);
    expect(html).not.toContain("<button");
    expect(html).not.toContain("Borrar todo");
  });

  it("en curso: el botón lo dice con palabra y queda aria-disabled, sin perder su sitio", () => {
    for (const a of ACCIONES_DE_ALERTA) {
      const li = elementos(pintar([base({ accion: a, enCurso: true })]))[0]!;
      expect(li).toContain(`>${TEXTOS.alertas.acciones[a].enCurso}<`);
      expect(li).toContain('aria-disabled="true"');
      expect(li).not.toContain(" disabled");
    }
  });

  it("cada texto de acción lleva un verbo y ninguna palabra genérica", () => {
    for (const a of ACCIONES_DE_ALERTA) {
      const { texto: t } = TEXTOS.alertas.acciones[a];
      expect(t).not.toMatch(/^(?:Aceptar|Sí|Enviar|OK|Haz clic aquí)$/i);
      expect(t.split(" ")[0]).toMatch(/(?:ar|er|ir)$/);
    }
  });
});

describe("ListaAlertas · el cliente y el texto hostil (REQ-056, REQ-071; CA-041)", () => {
  const RLO = String.fromCharCode(0x202e);
  const HOSTILES: readonly string[] = [
    "<script>window.__hostil = 1</script>",
    '"><img src=x onerror="window.__hostil = 2">',
    "[pulsa aquí](https://malo.example/phishing)",
    "<a href=https://malo.example>enlace</a>",
    "&lt;b&gt;entidades&lt;/b&gt; &amp; &#x3c;",
    "{{constructor.constructor('1')()}} ${1+1}",
    `Ana${RLO} Pérez`,
  ];

  it("el cliente va aparte, dentro de bdi y escapado: ni elementos ni enlaces nuevos", () => {
    for (const h of HOSTILES) {
      const html = pintar([base({ cliente: h })]);
      expect(html, h).toContain("<bdi>");
      expect(html, h).not.toMatch(/<script|<img|<a[ >]/i);
      expect(html, h).not.toContain(RLO);
    }
  });

  it("el cliente no entra en el texto de la alerta: es otra línea, con su rótulo", () => {
    const li = elementos(pintar([base({ cliente: "Cliente de ejemplo" })]))[0]!;
    expect(li).toContain(TEXTOS.alertas.cliente);
    expect(li).toContain("<bdi>Cliente de ejemplo</bdi>");
    expect(texto(li)).toContain(`${TEXTOS.alertas.cliente}: Cliente de ejemplo`);
  });

  it("un cliente de 120 caracteres se pinta entero y no se recorta", () => {
    const largo = "x".repeat(120);
    expect(pintar([base({ cliente: largo })])).toContain(`<bdi>${largo}</bdi>`);
  });

  it("sin cliente (o vacío) no hay línea de cliente", () => {
    for (const c of [undefined, "", String.fromCharCode(0x200b), null]) {
      expect(pintar([base({ cliente: c })])).not.toContain(TEXTOS.alertas.cliente);
    }
  });

  it("el tipo, la acción, la gravedad y el momento hostiles no llegan al documento", () => {
    for (const h of HOSTILES) {
      const html = pintar([base({ tipo: h, gravedad: h, accion: h, momento: h })]);
      expect(html, h).not.toContain("<script");
      expect(html, h).not.toContain("<img");
      expect(html, h).not.toContain("malo.example");
      expect(html, h).not.toContain("&lt;b&gt;");
    }
  });
});

describe("ListaAlertas · reglas de los componentes (diseño, «Reglas comunes»)", () => {
  const FUENTE = readFileSync(resolve(RAIZ, "src/components/alertas/ListaAlertas.tsx"), "utf8");
  const LOGICA = readFileSync(resolve(RAIZ, "src/components/alertas/logica.ts"), "utf8");

  it("no llama a la red, no usa HTML sin escapar ni valores de color sueltos", () => {
    for (const f of [FUENTE, LOGICA]) {
      expect(f).not.toMatch(/fetch\(|dangerouslySetInnerHTML|innerHTML|XMLHttpRequest/);
      expect(f).not.toMatch(/#[0-9a-fA-F]{3,8}\b|rgb\(|hsl\(|style=\{/);
      expect(f).not.toMatch(/from "next\/|@radix-ui|recharts/);
    }
  });

  it("el botón sale de `Boton` y el texto de los textos fijos", () => {
    expect(FUENTE).toMatch(/from "\.\.\/acciones\/Boton"/);
    expect(FUENTE).toMatch(/TEXTOS\.alertas/);
    expect(FUENTE).toMatch(/TextoDato/);
  });
});
