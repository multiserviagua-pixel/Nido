// T-010 (f) · `EtiquetaEstado` (diseño 020, «Componentes base», fila `EtiquetaEstado` y `catalogo.ts`;
// REQ-012, REQ-030, REQ-038, REQ-075; CA-009, CA-051). Se pinta en el servidor de pruebas. La
// comprobación de colores, contraste y colores forzados en navegador está en
// `cifras-y-etiquetas.spec.ts` y en las pruebas de PRUEBA-006, PRUEBA-020 y PRUEBA-022.
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  CLAVES_DE_ESTADO,
  ICONOS_DE_ESTADO,
  TONOS_DE_ESTADO,
  describirEstado,
} from "../../../src/components/estado/catalogo";
import {
  CLASES_DE_TONO,
  EtiquetaEstado,
  ICONO_DE_ESTADO,
} from "../../../src/components/estado/EtiquetaEstado";
import { TEXTOS } from "../../../src/components/textos";

const RAIZ = resolve(import.meta.dirname, "..", "..", "..");
const pintar = (ambito: string, valor: unknown): string =>
  renderToStaticMarkup(<EtiquetaEstado ambito={ambito} valor={valor} />);
const clases = (html: string): string[] => /class="([^"]*)"/.exec(html)![1]!.split(" ");
const separar = (clave: string): [string, string] => {
  const [a, v] = clave.split(".");
  return [a!, v!];
};

describe("EtiquetaEstado · cada estado del catálogo: palabra, tono e icono (REQ-012, REQ-038)", () => {
  const CONOCIDOS = CLAVES_DE_ESTADO.filter((c) => c !== "desconocido");

  it("hay estados que recorrer", () => {
    expect(CONOCIDOS.length).toBeGreaterThanOrEqual(4);
  });

  for (const clave of CONOCIDOS) {
    it(`${clave}: su palabra, un icono y el tono del catálogo`, () => {
      const [ambito, valor] = separar(clave);
      const html = pintar(ambito, valor);
      const d = describirEstado(clave);
      expect(html).toContain(`>${d.palabra}<`);
      expect(html).toMatch(/<svg[^>]*aria-hidden="true"/);
      expect(html).toContain(`data-estado="${clave}"`);
      expect(html).toContain(`data-tono="${d.tono}"`);
      for (const c of CLASES_DE_TONO[d.tono].split(" ")) expect(clases(html), clave).toContain(c);
    });
  }

  it("nunca depende solo del color: palabra e icono en todos, y el tono distingue por clases", () => {
    for (const clave of CLAVES_DE_ESTADO) {
      const [ambito, valor] = clave === "desconocido" ? ["x", "y"] : separar(clave);
      const html = pintar(ambito, valor);
      expect(html.replace(/<[^>]*>/g, "").trim().length, clave).toBeGreaterThan(0);
      expect(html, clave).toContain("<svg");
    }
  });
});

describe("EtiquetaEstado · papeles de color por tono, sin valores sueltos", () => {
  it("hay una entrada por tono de la lista, y una distinta por tono", () => {
    expect(Object.keys(CLASES_DE_TONO).sort()).toEqual([...TONOS_DE_ESTADO].sort());
    expect(new Set(Object.values(CLASES_DE_TONO)).size).toBe(TONOS_DE_ESTADO.length);
  });

  it("correcto, aviso y error usan su papel; neutro, el secundario; informativo, el fondo suave", () => {
    expect(CLASES_DE_TONO.correcto).toContain("text-correcto");
    expect(CLASES_DE_TONO.aviso).toContain("text-aviso");
    expect(CLASES_DE_TONO.error).toContain("text-error");
    expect(CLASES_DE_TONO.neutro).toContain("text-texto-secundario");
    expect(CLASES_DE_TONO.informativo).toContain("bg-acento-suave");
    expect(CLASES_DE_TONO.informativo).toContain("text-texto");
  });

  it("solo clases de papeles y de la escala: sin corchetes ni colores literales ni style", () => {
    for (const c of Object.values(CLASES_DE_TONO)) expect(c).not.toMatch(/[[\]#]/);
    const html = pintar("agente", "activo");
    expect(html).not.toMatch(/\sstyle=/);
    expect(clases(html).filter((c) => /[[\]]/.test(c))).toEqual([]);
  });

  it("tiene un icono para cada nombre de icono del catálogo, y es decorativo (la palabra va al lado)", () => {
    expect(Object.keys(ICONO_DE_ESTADO).sort()).toEqual([...ICONOS_DE_ESTADO].sort());
  });
});

describe("EtiquetaEstado · valor fuera del catálogo (REQ-075, CA-051)", () => {
  const fuera: Array<[string, string, unknown]> = [
    ["valor inventado", "agente", "inventado"],
    ["mayúsculas", "agente", "ACTIVO"],
    ["con espacio", "agente", "activo "],
    ["vacío", "agente", ""],
    ["undefined", "agente", undefined],
    ["null", "agente", null],
    ["número", "agente", 1],
    ["objeto", "agente", { estado: "activo" }],
    ["matriz", "agente", ["activo"]],
    ["__proto__", "agente", "__proto__"],
    ["ámbito desconocido", "cliente", "activo"],
    ["ámbito con punto", "agente.activo", ""],
  ];

  it.each(fuera)("%s: «Estado desconocido», neutro, nunca favorable", (_n, ambito, valor) => {
    const html = pintar(ambito, valor);
    expect(html).toContain(`>${TEXTOS.estados.desconocido}<`);
    expect(html).toContain('data-estado="desconocido"');
    expect(html).toContain('data-tono="neutro"');
    for (const c of CLASES_DE_TONO.neutro.split(" ")) expect(clases(html)).toContain(c);
    expect(clases(html)).not.toContain("text-correcto");
    expect(html).not.toContain(TEXTOS.estados["agente.activo"]);
  });

  it("no pinta el valor recibido en ningún sitio, ni como texto ni como atributo", () => {
    const html = pintar("agente", "TESTIGO-VALOR-1");
    expect(html).not.toContain("TESTIGO");
    const otro = pintar("TESTIGO-AMBITO", "TESTIGO-VALOR-2");
    expect(otro).not.toContain("TESTIGO");
  });

  it("los campos de más de una respuesta no llegan a la etiqueta: solo recibe ámbito y valor", () => {
    const respuesta: Record<string, unknown> = {
      estado: "activo",
      extra1: "TESTIGO-CAMPO-1",
      extra2: "TESTIGO-CAMPO-2",
      extra3: "TESTIGO-CAMPO-3",
    };
    const html = pintar("agente", respuesta.estado);
    expect(html).toContain(`>${TEXTOS.estados["agente.activo"]}<`);
    expect(html).not.toContain("TESTIGO");
  });
});

describe("EtiquetaEstado · código", () => {
  it("lee el estado con leerEstado y lo describe con el catálogo; sin red, sin style", () => {
    const fuente = readFileSync(resolve(RAIZ, "src/components/estado/EtiquetaEstado.tsx"), "utf8");
    expect(fuente).toMatch(/leerEstado/);
    expect(fuente).toMatch(/describirEstado/);
    expect(fuente).not.toMatch(/fetch\(|style=|dangerouslySetInnerHTML/);
  });
});
