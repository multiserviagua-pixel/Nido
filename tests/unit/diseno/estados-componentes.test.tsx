// T-016 (c) · marcado de `EstadoVacio`, `EstadoError`, `EstadoSinPermiso` y `Esqueleto` (diseño 020,
// «Estados de cada vista»; REQ-022, REQ-023, REQ-026, REQ-027, REQ-057, REQ-069, REQ-077; CA-016,
// CA-020, CA-042, CA-048). Sin navegador: lo que se ve en el HTML y lo que el código no puede hacer.
// El comportamiento (anuncio, plazos, teclado, anchos, axe) está en `tests/e2e/muestra/estados.spec.ts`.
import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  EstadoError,
  type PropiedadesDeEstadoError,
} from "../../../src/components/estados/EstadoError";
import {
  EstadoSinPermiso,
  type PropiedadesDeEstadoSinPermiso,
} from "../../../src/components/estados/EstadoSinPermiso";
import { EstadoVacio } from "../../../src/components/estados/EstadoVacio";
import { Esqueleto } from "../../../src/components/estados/Esqueleto";
import { FORMAS_DE_ESQUELETO, MOTIVOS_DE_ERROR } from "../../../src/components/estados/logica";
import { RejillaCuerpo } from "../../../src/components/armazon/RejillaCuerpo";
import { ContextoDeTransicion } from "../../../src/components/armazon/TransicionDePeriodo";
import { Tabla } from "../../../src/components/tabla/Tabla";
import { TEXTOS } from "../../../src/components/textos";

const RAIZ = resolve(import.meta.dirname, "..", "..", "..");
const nada = (): void => undefined;
const botones = (html: string): string[] =>
  [...html.matchAll(/<button\b[^>]*>[\s\S]*?<\/button>/g)].map((m) => m[0]);
const veces = (html: string, texto: string): number => html.split(texto).length - 1;

describe("EstadoVacio · qué pasa, qué hacer y, si procede, un botón (REQ-022)", () => {
  const E = TEXTOS.estadoVacio.ejemplo;

  it("pinta el título y la explicación, ambos textos fijos", () => {
    const html = renderToStaticMarkup(
      <EstadoVacio titulo={E.sinAccion.titulo} explicacion={E.sinAccion.explicacion} />,
    );
    expect(html).toContain('data-estado="vacio"');
    expect(html).toContain(E.sinAccion.titulo);
    expect(html).toContain(E.sinAccion.explicacion);
  });

  it("sin acción no hay botón ni enlace", () => {
    const html = renderToStaticMarkup(
      <EstadoVacio titulo={E.sinAccion.titulo} explicacion={E.sinAccion.explicacion} />,
    );
    expect(botones(html)).toHaveLength(0);
    expect(html).not.toContain("<a ");
  });

  it("con acción, un solo botón con su texto fijo", () => {
    const html = renderToStaticMarkup(
      <EstadoVacio
        titulo={E.conAccion.titulo}
        explicacion={E.conAccion.explicacion}
        accion={{ texto: E.conAccion.accion, alPulsar: nada }}
      />,
    );
    const b = botones(html);
    expect(b).toHaveLength(1);
    expect(b[0]).toContain(E.conAccion.accion);
    expect(b[0]).toContain('type="button"');
  });

  it("un texto que no es de TEXTOS cae en el genérico: no se pinta lo recibido", () => {
    const html = renderToStaticMarkup(
      <EstadoVacio
        titulo={"TESTIGO-TITULO" as never}
        explicacion={"TESTIGO-EXPLICACION" as never}
        accion={{ texto: "TESTIGO-ACCION" as never, alPulsar: nada }}
      />,
    );
    expect(html).not.toContain("TESTIGO");
    expect(html).toContain(TEXTOS.estadoVacio.generico.titulo);
    expect(html).toContain(TEXTOS.estadoVacio.generico.explicacion);
    expect(botones(html)).toHaveLength(0);
  });

  it("el tipo no admite texto libre ni hijos", () => {
    renderToStaticMarkup(
      // @ts-expect-error · un título que no es de TEXTOS no compila
      <EstadoVacio titulo="Texto libre" explicacion={E.sinAccion.explicacion} />,
    );
    renderToStaticMarkup(
      // @ts-expect-error · no hay hijos
      <EstadoVacio titulo={E.sinAccion.titulo} explicacion={E.sinAccion.explicacion}>
        libre
      </EstadoVacio>,
    );
    expect(true).toBe(true);
  });
});

describe("EstadoError · texto fijo por motivo, referencia validada y «Reintentar» único (REQ-026, REQ-057)", () => {
  const SERVIDOR = "S-0123456789";
  const NAVEGADOR = "N-ABCDEFGHJK";

  it.each([...MOTIVOS_DE_ERROR])(
    "%s: su texto fijo y «No se ha podido cargar» una sola vez",
    (motivo) => {
      const html = renderToStaticMarkup(<EstadoError motivo={motivo} />);
      expect(html).toContain('data-estado="error"');
      expect(html).toContain(TEXTOS.motivosDeError[motivo]);
      expect(veces(html, TEXTOS.bloque.noSePudoCargar), motivo).toBe(1);
    },
  );

  it("la referencia de formato exacto se pinta como «Referencia: …»", () => {
    for (const r of [SERVIDOR, NAVEGADOR]) {
      const html = renderToStaticMarkup(<EstadoError motivo="fallo_servidor" referencia={r} />);
      expect(html).toContain(`${TEXTOS.bloque.referencia}: ${r}`);
    }
  });

  it.each([
    ["mensaje interno", 'relation "clientes" does not exist'],
    ["minúscula", "s-0123456789"],
    ["letra dudosa", "S-IIIIIIIIII"],
    ["origen desconocido", "X-0123456789"],
    ["corta", "S-0123"],
    ["larga", "S-01234567890"],
    ["con marcado", "<img src=x onerror=alert(1)>"],
    ["con salto de línea", "S-0123456789\n"],
    ["un número", 12],
    ["un objeto", { referencia: SERVIDOR }],
    ["null", null],
    ["undefined", undefined],
  ])("referencia no válida (%s): no se pinta", (_nombre, valor) => {
    const html = renderToStaticMarkup(
      <EstadoError motivo="fallo_servidor" referencia={valor as never} />,
    );
    expect(html).not.toContain(TEXTOS.bloque.referencia);
    expect(html).not.toContain("clientes");
    expect(html).not.toContain("<img");
    expect(html).not.toContain("onerror");
  });

  it("un motivo que no es de la lista se pinta como «desconocido»", () => {
    for (const raro of ["TESTIGO-MOTIVO", "<script>", "__proto__", 500, null, undefined]) {
      const html = renderToStaticMarkup(<EstadoError motivo={raro as never} />);
      expect(html).toContain(TEXTOS.motivosDeError.desconocido);
      expect(html).not.toContain("TESTIGO");
      expect(html).not.toContain("<script");
    }
  });

  it("sin reintento no hay botón; con reintento, exactamente uno, «Reintentar»", () => {
    expect(botones(renderToStaticMarkup(<EstadoError motivo="sin_conexion" />))).toHaveLength(0);
    const b = botones(
      renderToStaticMarkup(<EstadoError motivo="sin_conexion" alReintentar={nada} />),
    );
    expect(b).toHaveLength(1);
    expect(b[0]).toContain(`>${TEXTOS.bloque.reintentar}</button>`);
    expect(b[0]).toContain('type="button"');
    expect(b[0]).not.toContain("aria-disabled");
  });

  it("reintento en curso: el botón dice «Cargando», queda aria-disabled y sigue siendo uno", () => {
    const html = renderToStaticMarkup(
      <EstadoError motivo="fallo_servidor" alReintentar={nada} reintentando />,
    );
    const b = botones(html);
    expect(b).toHaveLength(1);
    expect(b[0]).toContain('aria-disabled="true"');
    expect(b[0]).toContain(`>${TEXTOS.bloque.cargando}</button>`);
    expect(b[0]).not.toMatch(/\sdisabled(?:=|>)/);
  });

  it("no hay propiedad para un mensaje, una traza, un valor ni un resumen de error", () => {
    renderToStaticMarkup(
      // @ts-expect-error · no existe `mensaje`
      <EstadoError motivo="fallo_servidor" mensaje="relation clientes does not exist" />,
    );
    renderToStaticMarkup(
      // @ts-expect-error · no existe `error`
      <EstadoError motivo="fallo_servidor" error={new Error("interno")} />,
    );
    renderToStaticMarkup(
      // @ts-expect-error · no existe `digest`
      <EstadoError motivo="fallo_servidor" digest="1234567890" />,
    );
    renderToStaticMarkup(
      // @ts-expect-error · el motivo es de la lista
      <EstadoError motivo="una cadena libre" />,
    );
    expect(true).toBe(true);
  });

  it("aunque se le cuelen propiedades de más, no las pinta", () => {
    const cuelo = {
      motivo: "fallo_servidor",
      mensaje: "TESTIGO-MENSAJE",
      digest: "TESTIGO-DIGEST",
    };
    const html = renderToStaticMarkup(
      <EstadoError {...(cuelo as unknown as PropiedadesDeEstadoError)} />,
    );
    expect(html).not.toContain("TESTIGO");
  });

  it("no es región viva ni alerta (el anuncio lo hace quien detecta el fallo, una sola vez)", () => {
    const html = renderToStaticMarkup(<EstadoError motivo="tarda_demasiado" alReintentar={nada} />);
    expect(html).not.toMatch(/aria-live|role="(?:alert|status|log)"/);
  });
});

describe("EstadoSinPermiso · el mismo texto y el mismo marcado en los tres casos (REQ-027, REQ-077)", () => {
  it("texto genérico y un enlace al Resumen", () => {
    const html = renderToStaticMarkup(<EstadoSinPermiso />);
    expect(html).toContain('data-estado="sin-permiso"');
    expect(html).toContain(TEXTOS.sinPermiso.titulo);
    expect(html).toContain(TEXTOS.sinPermiso.explicacion);
    expect(html).toMatch(
      new RegExp(`<a [^>]*href="/admin"[^>]*>${TEXTOS.sinPermiso.volverAlResumen}</a>`),
    );
  });

  it("el enlace va al Resumen de su dashboard y solo si la ruta es interna", () => {
    expect(renderToStaticMarkup(<EstadoSinPermiso rutaDelResumen="/panel" />)).toContain(
      'href="/panel"',
    );
    for (const mala of ["//otro.invalid", "https://otro.invalid", "javascript:alert(1)"]) {
      const html = renderToStaticMarkup(<EstadoSinPermiso rutaDelResumen={mala} />);
      expect(html, mala).toContain('href="/admin"');
      expect(html, mala).not.toContain("otro.invalid");
      expect(html, mala).not.toContain("javascript");
    }
  });

  it("no tiene propiedad para el nombre, el identificador, el motivo ni la dirección pedida", () => {
    renderToStaticMarkup(
      // @ts-expect-error · no existe `nombre`
      <EstadoSinPermiso nombre="Cliente 1" />,
    );
    renderToStaticMarkup(
      // @ts-expect-error · no existe `id`
      <EstadoSinPermiso id="0f8fad5b-d9cb-469f-a165-70867728950e" />,
    );
    renderToStaticMarkup(
      // @ts-expect-error · no existe `motivo`
      <EstadoSinPermiso motivo="denegado" />,
    );
    renderToStaticMarkup(
      // @ts-expect-error · no existe `direccion`
      <EstadoSinPermiso direccion="/admin/clientes/x" />,
    );
    expect(true).toBe(true);
  });

  it("con propiedades colgadas a la fuerza, el marcado es idéntico byte a byte", () => {
    const base = renderToStaticMarkup(<EstadoSinPermiso />);
    const colgadas = {
      nombre: "TESTIGO-NOMBRE",
      id: "TESTIGO-ID",
      motivo: "denegado",
      direccion: "/admin/clientes/TESTIGO",
      children: "TESTIGO-HIJO",
    };
    for (const caso of [
      colgadas,
      { ...colgadas, motivo: "inexistente" },
      { motivo: "otra_fase" },
    ]) {
      const html = renderToStaticMarkup(
        <EstadoSinPermiso {...(caso as unknown as PropiedadesDeEstadoSinPermiso)} />,
      );
      expect(html).toBe(base);
    }
  });

  it("no usa 403 ni «denegado» en su texto ni distingue entre denegado e inexistente", () => {
    const html = renderToStaticMarkup(<EstadoSinPermiso />);
    expect(html).not.toMatch(/403|denegad|prohibid|inexistente|no existe\b/i);
  });
});

describe("Esqueleto · forma, «Cargando» una vez y carga lenta (REQ-023, REQ-069)", () => {
  it.each([...FORMAS_DE_ESQUELETO])(
    "%s: marcado ocupado, con su forma y sin texto propio salvo «Cargando»",
    (forma) => {
      const html = renderToStaticMarkup(<Esqueleto forma={forma} />);
      expect(html).toContain('data-estado="carga"');
      expect(html).toContain(`data-esqueleto="${forma}"`);
      expect(html).toContain('aria-busy="true"');
      expect(veces(html, TEXTOS.bloque.cargando)).toBe(1);
      expect(html).not.toContain(TEXTOS.bloque.cargaLenta);
      expect(html).not.toMatch(/\sstyle=/);
      expect(html).not.toMatch(/aria-live|role="(?:alert|status|log)"/);
    },
  );

  it("todos los bloques que dibujan son decorativos: ninguno sin aria-hidden", () => {
    for (const forma of FORMAS_DE_ESQUELETO) {
      const html = renderToStaticMarkup(<Esqueleto forma={forma} />);
      const bloques = html.match(/<(?:span|div)[^>]*data-esqueleto-bloque[^>]*>/g) ?? [];
      expect(bloques.length, forma).toBeGreaterThan(2);
      for (const b of bloques) expect(b, forma).toContain('aria-hidden="true"');
    }
  });

  it("la tabla tiene su cabecera y filas; la lista, varios elementos", () => {
    const tabla = renderToStaticMarkup(<Esqueleto forma="tabla" />);
    expect(tabla.match(/data-esqueleto-fila/g)?.length).toBeGreaterThanOrEqual(3);
    const lista = renderToStaticMarkup(<Esqueleto forma="lista" />);
    expect(lista.match(/data-esqueleto-elemento/g)?.length).toBeGreaterThanOrEqual(2);
  });

  it("carga lenta: añade, visible y una vez, «Está tardando más de lo normal»", () => {
    const html = renderToStaticMarkup(<Esqueleto forma="tarjeta" lenta />);
    expect(veces(html, TEXTOS.bloque.cargaLenta)).toBe(1);
    expect(html).toContain('data-lenta="true"');
    expect(veces(html, TEXTOS.bloque.cargando)).toBe(1);
  });

  it("una forma desconocida se pinta como tarjeta", () => {
    const html = renderToStaticMarkup(<Esqueleto forma={"mapa" as never} />);
    expect(html).toContain('data-esqueleto="tarjeta"');
  });

  it("no hay propiedad para un texto libre", () => {
    renderToStaticMarkup(
      // @ts-expect-error · no existe `texto`
      <Esqueleto forma="tarjeta" texto="Cargando clientes" />,
    );
    expect(true).toBe(true);
  });
});

describe("estados/ · código que no puede existir", () => {
  const dir = resolve(RAIZ, "src", "components", "estados");
  const fuentes = readdirSync(dir)
    .filter((f) => /\.tsx?$/.test(f))
    .map((f) => [f, readFileSync(resolve(dir, f), "utf8").replace(/\/\/.*$/gm, "")] as const);

  it("hay los siete archivos esperados", () => {
    expect(fuentes.map(([f]) => f).sort()).toEqual([
      "BloqueDatos.tsx",
      "Esqueleto.tsx",
      "EstadoError.tsx",
      "EstadoSinPermiso.tsx",
      "EstadoVacio.tsx",
      "bloque.ts",
      "logica.ts",
    ]);
  });

  it("sin red, sin almacenamiento, sin HTML en bruto, sin `digest` ni `error.message`", () => {
    for (const [f, texto] of fuentes) {
      expect(texto, f).not.toMatch(
        /\bfetch\(|XMLHttpRequest|localStorage|sessionStorage|document\.cookie|dangerouslySetInnerHTML|\.digest\b|error\.message|\.stack\b/,
      );
    }
  });

  it("ningún texto visible escrito en el componente: sin cadenas en español dentro del JSX", () => {
    for (const [f, texto] of fuentes) {
      if (!f.endsWith(".tsx")) continue;
      const jsx = texto.replace(/\{\/\*[\s\S]*?\*\/\}/g, "");
      expect(jsx, f).not.toMatch(/>\s*[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+[^<{]*</);
    }
  });

  it("solo `EstadoSinPermiso` y su enlace pintan una dirección, y solo tras comprobarla", () => {
    for (const [f, texto] of fuentes) {
      const conHref = /href=/.test(texto);
      expect(conHref, f).toBe(f === "EstadoSinPermiso.tsx");
    }
  });
});

describe("integración · `Tabla` y `ZonaDeDatos` usan los componentes comunes (menores 15 (g) y 24)", () => {
  const columnas = [{ clave: "nombre", etiqueta: "Nombre" }];

  it("el vacío de `Tabla` es `EstadoVacio` con los textos de `TEXTOS.tabla.vacio`, y conserva su sección con nombre", () => {
    const html = renderToStaticMarkup(
      <Tabla
        titulo="Clientes"
        columnas={columnas}
        filas={[]}
        total={0}
        pagina={1}
        alCambiar={nada}
      />,
    );
    expect(html).toContain('data-estado="vacio"');
    expect(html).toContain("data-tabla-vacia");
    expect(html).toContain('aria-label="Clientes"');
    expect(html).toContain(TEXTOS.tabla.vacio.titulo);
    expect(html).toContain(TEXTOS.tabla.vacio.explicacion);
    expect(html).not.toContain("<table");
    expect(botones(html)).toHaveLength(0);
  });

  it("con filas, `Tabla` no pinta el estado vacío", () => {
    const html = renderToStaticMarkup(
      <Tabla
        titulo="Clientes"
        columnas={columnas}
        filas={[{ nombre: "Cliente 1" }]}
        total={1}
        pagina={1}
        alCambiar={nada}
      />,
    );
    expect(html).not.toContain('data-estado="vacio"');
  });

  it("la fuente de `Tabla` ya no lleva su bloque vacío propio", () => {
    const fuente = readFileSync(resolve(RAIZ, "src/components/tabla/Tabla.tsx"), "utf8");
    expect(fuente).toContain('from "../estados/EstadoVacio"');
    expect(fuente).not.toMatch(/<p className="[^"]*">\{TEXTOS\.tabla\.vacio/);
  });

  function zonas(fallida: boolean): string {
    return renderToStaticMarkup(
      <ContextoDeTransicion.Provider
        value={{
          pendiente: true,
          lenta: true,
          fallida,
          referencia: fallida ? "N-0123456789" : null,
          iniciar: nada,
          reintentar: nada,
          registrarDestinoDeFoco: nada,
        }}
      >
        <RejillaCuerpo cifras={<p>48</p>} contenido={<p>tabla</p>} />
      </ContextoDeTransicion.Provider>,
    );
  }

  it("el error de cada zona es `EstadoError`: un solo «Reintentar» por zona, ninguno suelto", () => {
    const html = zonas(true);
    expect(html.match(/data-estado="error"/g)).toHaveLength(2);
    expect(botones(html)).toHaveLength(2);
    for (const b of botones(html)) expect(b).toContain(`>${TEXTOS.bloque.reintentar}</button>`);
    // Cada botón está dentro del `EstadoError` de su zona.
    const estados = html.match(/<div data-estado="error"[\s\S]*?<\/button><\/div>/g) ?? [];
    expect(estados).toHaveLength(2);
    for (const e of estados) expect(botones(e)).toHaveLength(1);
  });

  it("la fuente de `ZonaDeDatos` ya no pinta su propio botón", () => {
    const fuente = readFileSync(resolve(RAIZ, "src/components/armazon/ZonaDeDatos.tsx"), "utf8");
    // El error y su botón los pinta `BloqueDatos` (T-016 (d)), que usa `EstadoError`.
    expect(fuente).toContain("BloqueDatos");
    expect(fuente).not.toMatch(/<button\b/);
  });
});
