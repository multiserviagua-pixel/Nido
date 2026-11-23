// T-016 (a) · marcado de `Formulario` y de sus campos (diseño 020, fila `Formulario y campos`;
// REQ-019, REQ-020, REQ-057, REQ-080; CA-014; PRUEBA-015, PRUEBA-017). Se pinta en el servidor de
// pruebas, sin DOM: el foco, el teclado, los anchos y `axe` están en
// `tests/e2e/muestra/formulario.spec.ts`.
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Formulario } from "../../../src/components/formulario/Formulario";
import type { DefinicionDeCampo } from "../../../src/components/formulario/logica";
import { TEXTOS } from "../../../src/components/textos";

const RAIZ = resolve(import.meta.dirname, "..", "..", "..");
const E = TEXTOS.formulario.ejemplo;
const PLANES = [
  { valor: "basico", etiqueta: E.planBasico },
  { valor: "profesional", etiqueta: E.planProfesional },
] as const;
const CAMPOS: readonly DefinicionDeCampo[] = [
  {
    clave: "nombre",
    tipo: "texto",
    etiqueta: E.nombre,
    ayuda: E.nombreAyuda,
    obligatorio: true,
    longitudMaxima: 120,
  },
  { clave: "codigo", tipo: "texto", etiqueta: E.codigo, longitudMaxima: 20 },
  { clave: "descripcion", tipo: "texto_largo", etiqueta: E.descripcion, longitudMaxima: 500 },
  { clave: "plan", tipo: "seleccion", etiqueta: E.plan, obligatorio: true, opciones: PLANES },
  {
    clave: "periodicidad",
    tipo: "grupo",
    etiqueta: E.periodicidad,
    obligatorio: true,
    opciones: [
      { valor: "diaria", etiqueta: E.periodicidadDiaria },
      { valor: "semanal", etiqueta: E.periodicidadSemanal },
    ],
  },
  { clave: "avisos", tipo: "casilla", etiqueta: E.avisos },
  { clave: "condiciones", tipo: "casilla", etiqueta: E.condiciones, obligatorio: true },
  { clave: "busqueda", tipo: "busqueda", etiqueta: E.busqueda, longitudMaxima: 60 },
];
const nada = (): void => undefined;
const pintar = (extra: { intentadoAlCargar?: boolean; campos?: unknown } = {}): string =>
  renderToStaticMarkup(
    <Formulario
      nombre={E.nombreDelFormulario}
      campos={(extra.campos ?? CAMPOS) as readonly DefinicionDeCampo[]}
      textoEnviar={E.guardar}
      textoEnCurso={E.guardando}
      ejecutar={nada}
      intentadoAlCargar={extra.intentadoAlCargar}
    />,
  );
const texto = (html: string): string => html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ");
const etiquetas = (html: string): string[] =>
  [...html.matchAll(/<label[^>]*>([\s\S]*?)<\/label>/g)].map((m) => texto(m[1]!).trim());

describe("Formulario · estructura y etiquetas (REQ-019, CA-014)", () => {
  const html = pintar();
  it("es un formulario con nombre, sin validación nativa, por POST y sin destino", () => {
    expect(html).toMatch(/^<form[^>]*\bnoValidate=""/);
    expect(html).toContain(`aria-label="${E.nombreDelFormulario}"`);
    expect(html).toContain('method="post"');
    expect(html).not.toMatch(/<form[^>]*\baction=/);
  });
  it("sin `required` nativo: los obligatorios dicen aria-required", () => {
    expect(html).not.toMatch(/(?<![-\w])required(?:=|\s|>)/);
    expect((html.match(/aria-required="true"/g) ?? []).length).toBe(4);
  });
  it("sin `name` en los campos de texto: nada de lo escrito se envía por su cuenta", () => {
    expect(html).not.toMatch(/<(?:input|textarea|select)[^>]*type="text"[^>]*\bname=/);
    expect(html).not.toMatch(/<(?:textarea|select)[^>]*\bname=/);
  });
  it("cada campo tiene su etiqueta visible; los obligatorios lo dicen con la palabra", () => {
    const l = etiquetas(html);
    expect(l).toContain(`${E.nombre} ${TEXTOS.formulario.obligatorio}`);
    expect(l).toContain(E.codigo);
    expect(l).toContain(`${E.condiciones} ${TEXTOS.formulario.obligatorio}`);
    expect(l.filter((x) => x.includes(TEXTOS.formulario.obligatorio))).toHaveLength(3);
    // El grupo lleva el nombre en su leyenda.
    expect(html).toMatch(
      new RegExp(`<legend[^>]*>${E.periodicidad}[^<]*<span[^>]*>\\(obligatorio\\)</span></legend>`),
    );
    // Todo control (menos los radios, dentro de su grupo) tiene un `label for` que lo nombra.
    for (const id of [...html.matchAll(/<(?:input|textarea|select)[^>]*\bid="([^"]+)"/g)].map(
      (m) => m[1]!,
    )) {
      expect(html, id).toContain(`for="${id}"`);
    }
  });
  it("hay una leyenda que explica la palabra, solo si hay obligatorios", () => {
    expect(texto(html)).toContain(TEXTOS.formulario.leyenda);
    expect(texto(pintar({ campos: [CAMPOS[1]] }))).not.toContain(TEXTOS.formulario.leyenda);
  });
  it("la ayuda y el límite se enlazan con aria-describedby", () => {
    const m = /<input[^>]*id="([^"]+)"[^>]*aria-describedby="([^"]+)"[^>]*/.exec(html)!;
    expect(m[2]).toBe(`${m[1]}-ayuda ${m[1]}-limite`);
    expect(html).toContain(`id="${m[1]}-ayuda"`);
    expect(html).toMatch(new RegExp(`id="${m[1]}-limite"[^>]*>Hasta 120 caracteres\\.<`));
  });
  it("longitud máxima, autocompletado y rol de búsqueda", () => {
    expect(html).toMatch(/maxLength="120"|maxlength="120"/i);
    expect(html).toMatch(/autoComplete="off"|autocomplete="off"/i);
    expect(html).toMatch(/role="searchbox"/);
    expect(html).toMatch(/<textarea[^>]*maxlength="500"/i);
  });
  it("el grupo es un grupo de radios con un solo nombre; la selección ofrece una opción vacía", () => {
    expect(html).toMatch(/<fieldset[^>]*role="radiogroup"/);
    const nombres = new Set(
      [...html.matchAll(/type="radio"[^>]*name="([^"]+)"/g)].map((m) => m[1]),
    );
    expect(nombres.size).toBe(1);
    expect(html).toContain(
      `<option value="" selected="">${TEXTOS.formulario.elegirOpcion}</option>`,
    );
  });
  it("el botón dice un verbo y su objeto, es de envío y nunca «Enviar»", () => {
    expect(html).toMatch(/<button[^>]*type="submit"[^>]*>Guardar ficha<\/button>/);
    expect(html).not.toMatch(/>(?:Enviar|Aceptar|OK)</);
  });
  it("en reposo no hay errores, resumen ni resultado", () => {
    expect(html).not.toContain('aria-invalid="');
    expect(html).not.toContain("data-resumen-errores");
    expect(html).not.toContain("data-resultado");
  });
});

describe("Formulario · enviado vacío (REQ-020, CA-014)", () => {
  const html = pintar({ intentadoAlCargar: true });
  it("un error junto a cada obligatorio, enlazado con aria-describedby y aria-invalid", () => {
    expect((html.match(/aria-invalid="true"/g) ?? []).length).toBe(4);
    const ids = [...html.matchAll(/id="([^"]+-error)"/g)].map((m) => m[1]!);
    expect(ids).toHaveLength(4);
    for (const id of ids) {
      expect(html, id).toMatch(new RegExp(`aria-describedby="[^"]*\\b${id}\\b[^"]*"`));
    }
  });
  it("los mensajes son de TEXTOS, en español, con un icono decorativo", () => {
    const t = texto(html);
    expect(t).toContain(TEXTOS.formulario.errores.obligatorio);
    expect(t).toContain(TEXTOS.formulario.errores.sin_marcar);
    expect((html.match(/data-error-de-campo="/g) ?? []).length).toBe(4);
    expect(html).toMatch(
      /data-error-de-campo="nombre"[^>]*><span[^>]*><span[^>]*><svg[^>]*aria-hidden="true"/,
    );
  });
  it("hay un resumen con el número de errores, en palabras", () => {
    expect(texto(html)).toContain(
      `${TEXTOS.formulario.resumenAntes} 4 ${TEXTOS.formulario.resumenDespues}`,
    );
  });
  it("lo escrito no se vacía: sin valores, los controles siguen vacíos, no con otro texto", () => {
    expect(html).not.toMatch(/value="[^"]+"[^>]*type="text"/);
  });
});

describe("Formulario · lo recibido nunca es texto (artículos 1 y 3; V-6)", () => {
  it("una etiqueta que no es de TEXTOS cae a «Campo» y una ayuda se descarta", () => {
    const html = pintar({
      campos: [
        {
          clave: "x",
          tipo: "texto",
          etiqueta: "<b>del servidor</b>",
          ayuda: "otra",
          longitudMaxima: 5,
        },
      ],
    });
    expect(html).not.toContain("servidor");
    expect(html).not.toContain("otra");
    expect(etiquetas(html)).toEqual([TEXTOS.formulario.campoSinNombre]);
  });
  it("un tipo desconocido no pinta nada", () => {
    const html = pintar({ campos: [{ clave: "x", tipo: "fecha", etiqueta: E.nombre }] });
    expect(html).not.toContain("<input");
    expect(html).not.toContain("<label");
  });
  it("el resultado no tiene propiedad para un texto libre (tipos) y el código no usa el HTML crudo", () => {
    for (const archivo of ["Formulario.tsx", "campos.tsx", "logica.ts"]) {
      const codigo = readFileSync(
        resolve(RAIZ, "src", "components", "formulario", archivo),
        "utf8",
      );
      expect(codigo, archivo).not.toMatch(
        /dangerouslySetInnerHTML|innerHTML|localStorage|sessionStorage|document\.cookie|\bfetch\(|history\.|location\./,
      );
    }
  });
});
