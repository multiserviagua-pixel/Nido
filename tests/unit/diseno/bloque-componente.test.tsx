// T-016 (d) · marcado de `BloqueDatos` (diseño 020, «Estados de cada vista»; REQ-022, REQ-023,
// REQ-025, REQ-026, REQ-027, REQ-028, REQ-057, REQ-069, REQ-077; CA-016, CA-020, CA-042, CA-048).
// Sin navegador: lo que se ve en el HTML de cada estado y lo que el código no puede hacer. Los
// plazos, los anuncios, el foco y el desplazamiento de diseño están en
// `tests/e2e/muestra/bloque-datos.spec.ts`. Escrita antes que el componente (en rojo, sin módulo).
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ZonaDeDatos } from "../../../src/components/armazon/ZonaDeDatos";
import { ContextoDeTransicion } from "../../../src/components/armazon/TransicionDePeriodo";
import { BloqueDatos } from "../../../src/components/estados/BloqueDatos";
import { EstadoSinPermiso } from "../../../src/components/estados/EstadoSinPermiso";
import { MOTIVOS_DE_ERROR } from "../../../src/components/estados/logica";
import { TEXTOS } from "../../../src/components/textos";

const RAIZ = resolve(import.meta.dirname, "..", "..", "..");
const nada = (): void => undefined;
const veces = (html: string, texto: string): number => html.split(texto).length - 1;
const botones = (html: string): string[] =>
  [...html.matchAll(/<button\b[^>]*>[\s\S]*?<\/button>/g)].map((m) => m[0]);
const E = TEXTOS.estadoVacio.ejemplo;
const VACIO = { titulo: E.conAccion.titulo, explicacion: E.conAccion.explicacion };
const CONTENIDO = "CONTENIDO-DE-PRUEBA";

describe("BloqueDatos · un estado, una forma (REQ-025)", () => {
  it("carga: esqueleto con la forma pedida, «Cargando» una sola vez y ningún contenido", () => {
    for (const forma of ["tarjeta", "tabla", "grafico", "lista"] as const) {
      const html = renderToStaticMarkup(
        <BloqueDatos estado="carga" forma={forma}>
          {CONTENIDO}
        </BloqueDatos>,
      );
      expect(html).toContain('data-estado="carga"');
      expect(html).toContain(`data-esqueleto="${forma}"`);
      expect(veces(html, TEXTOS.bloque.cargando)).toBe(1);
      expect(html).not.toContain(CONTENIDO);
    }
  });

  it("vacío: título, explicación y, con acción, un botón; sin contenido", () => {
    const sin = renderToStaticMarkup(
      <BloqueDatos estado="vacio" forma="tabla" vacio={VACIO}>
        {CONTENIDO}
      </BloqueDatos>,
    );
    expect(sin).toContain('data-estado="vacio"');
    expect(sin).toContain(VACIO.titulo);
    expect(botones(sin)).toHaveLength(0);
    expect(sin).not.toContain(CONTENIDO);
    const con = renderToStaticMarkup(
      <BloqueDatos
        estado="vacio"
        forma="tabla"
        vacio={{ ...VACIO, accion: { texto: E.conAccion.accion, alPulsar: nada } }}
      />,
    );
    expect(botones(con)).toHaveLength(1);
    expect(con).toContain(E.conAccion.accion);
  });

  it("vacío sin textos propios usa el genérico", () => {
    const html = renderToStaticMarkup(<BloqueDatos estado="vacio" forma="tabla" />);
    expect(html).toContain(TEXTOS.estadoVacio.generico.titulo);
  });

  it.each([...MOTIVOS_DE_ERROR])(
    "error %s: su texto fijo, «No se ha podido cargar» una sola vez y sin contenido",
    (motivo) => {
      const html = renderToStaticMarkup(
        <BloqueDatos estado="error" forma="tarjeta" motivo={motivo} referencia="S-7K3M9QX2AB">
          {CONTENIDO}
        </BloqueDatos>,
      );
      expect(html).toContain('data-estado="error"');
      expect(html).toContain("S-7K3M9QX2AB");
      expect(html).not.toContain(CONTENIDO);
      if (motivo !== "sin_conexion" && motivo !== "sesion_no_valida") {
        expect(veces(html, TEXTOS.bloque.noSePudoCargar)).toBe(1);
      }
    },
  );

  it("error: «Reintentar» solo si la vista da la acción, y con el reintento en curso dice «Cargando»", () => {
    const sin = renderToStaticMarkup(
      <BloqueDatos estado="error" forma="tarjeta" motivo="fallo_servidor" />,
    );
    expect(botones(sin)).toHaveLength(0);
    const con = renderToStaticMarkup(
      <BloqueDatos estado="error" forma="tarjeta" motivo="fallo_servidor" alReintentar={nada} />,
    );
    expect(botones(con)).toHaveLength(1);
    expect(con).toContain(TEXTOS.bloque.reintentar);
    const enCurso = renderToStaticMarkup(
      <BloqueDatos
        estado="error"
        forma="tarjeta"
        motivo="fallo_servidor"
        alReintentar={nada}
        reintentando
      />,
    );
    expect(botones(enCurso)[0]).toContain(TEXTOS.bloque.cargando);
    expect(botones(enCurso)[0]).toContain('aria-disabled="true"');
  });

  it("error sin motivo, o con uno que no es de la lista: el de «desconocido»", () => {
    for (const motivo of [undefined, "boom: SQL", 3, null]) {
      const html = renderToStaticMarkup(
        <BloqueDatos estado="error" forma="tarjeta" motivo={motivo as never} />,
      );
      expect(html).toContain(TEXTOS.motivosDeError.desconocido);
    }
  });

  it("un estado que no es de la lista se pinta como error, nunca como datos", () => {
    for (const estado of ["lo-que-sea", "", undefined, null, 7, "DATOS", "__proto__"]) {
      const html = renderToStaticMarkup(
        <BloqueDatos estado={estado as never} forma="tarjeta">
          {CONTENIDO}
        </BloqueDatos>,
      );
      expect(html).toContain('data-estado="error"');
      expect(html).not.toContain(CONTENIDO);
    }
  });

  it("datos: el contenido, con su estado", () => {
    const html = renderToStaticMarkup(
      <BloqueDatos estado="datos" forma="tarjeta">
        <p>{CONTENIDO}</p>
      </BloqueDatos>,
    );
    expect(html).toContain(CONTENIDO);
    expect(html).toContain('data-estado="datos"');
    expect(html).not.toContain('data-estado="carga"');
  });
});

describe("BloqueDatos · sin permiso es el mismo estado que la dirección inexistente (REQ-027, REQ-077)", () => {
  const referencia = renderToStaticMarkup(<EstadoSinPermiso rutaDelResumen="/muestra" />);

  it("el marcado es byte a byte el de `EstadoSinPermiso`, con cualquier propiedad colgada", () => {
    const colgadas = [
      {},
      { nombre: "TESTIGO-NOMBRE-DEL-RECURSO" },
      { identificador: "TESTIGO-IDENTIFICADOR", motivo: "denegado" },
      { direccion: "/muestra/clientes/TESTIGO", error: new Error("TESTIGO-INTERNO") },
      { vacio: VACIO, referencia: "S-7K3M9QX2AB", alReintentar: nada },
    ];
    for (const extra of colgadas) {
      const html = renderToStaticMarkup(
        <BloqueDatos
          estado="sin_permiso"
          forma="tabla"
          rutaDelResumen="/muestra"
          {...(extra as object)}
        >
          {CONTENIDO}
        </BloqueDatos>,
      );
      expect(html).toBe(referencia);
      expect(html).not.toContain("TESTIGO");
      expect(html).not.toContain(CONTENIDO);
    }
  });

  it("la ruta del Resumen que no es interna no se enlaza", () => {
    const html = renderToStaticMarkup(
      <BloqueDatos estado="sin_permiso" forma="tabla" rutaDelResumen="//otro-servidor.test/" />,
    );
    expect(html).not.toContain("otro-servidor");
  });
});

describe("BloqueDatos · carga con los plazos de fuera (la zona del cambio de periodo)", () => {
  it("lenta: se ve el aviso una sola vez", () => {
    const html = renderToStaticMarkup(
      <BloqueDatos estado="carga" forma="tarjeta" plazos="externos" lenta anuncia={false} />,
    );
    expect(veces(html, TEXTOS.bloque.cargaLenta)).toBe(1);
    expect(html).toContain('data-lenta="true"');
  });

  it("con los plazos propios, el aviso lo pone el propio bloque: al montarse aún no", () => {
    const html = renderToStaticMarkup(<BloqueDatos estado="carga" forma="tarjeta" lenta />);
    expect(html).not.toContain(TEXTOS.bloque.cargaLenta);
  });
});

describe("BloqueDatos · conservar los hijos ocultos", () => {
  it("con `conservarHijos`, los hijos se quedan montados y ocultos fuera de `datos`", () => {
    for (const estado of ["carga", "vacio", "error"] as const) {
      const html = renderToStaticMarkup(
        <BloqueDatos estado={estado} forma="tarjeta" conservarHijos>
          <p>{CONTENIDO}</p>
        </BloqueDatos>,
      );
      expect(html).toMatch(new RegExp(`<div [^>]*class="hidden"[^>]*><p>${CONTENIDO}</p></div>`));
    }
  });

  it("con `datos` no están ocultos", () => {
    const html = renderToStaticMarkup(
      <BloqueDatos estado="datos" forma="tarjeta" conservarHijos>
        <p>{CONTENIDO}</p>
      </BloqueDatos>,
    );
    expect(html).not.toContain('class="hidden"');
    expect(html).toContain(CONTENIDO);
  });

  it("sin permiso nunca conserva hijos: lo que lleve el recurso no llega al documento", () => {
    const html = renderToStaticMarkup(
      <BloqueDatos estado="sin_permiso" forma="tarjeta" conservarHijos>
        <p>{CONTENIDO}</p>
      </BloqueDatos>,
    );
    expect(html).not.toContain(CONTENIDO);
  });
});

describe("datos parciales: una fuente falla y las otras no (REQ-028)", () => {
  it("el bloque que falló lo dice con su reintento; los demás pintan sus datos", () => {
    const html = renderToStaticMarkup(
      <div>
        <BloqueDatos estado="datos" forma="tarjeta">
          <p>FUENTE-UNO</p>
        </BloqueDatos>
        <BloqueDatos
          estado="error"
          forma="grafico"
          motivo="fallo_servidor"
          referencia="S-7K3M9QX2AB"
          alReintentar={nada}
        >
          <p>FUENTE-DOS</p>
        </BloqueDatos>
        <BloqueDatos estado="datos" forma="lista">
          <p>FUENTE-TRES</p>
        </BloqueDatos>
      </div>,
    );
    expect(html).toContain("FUENTE-UNO");
    expect(html).toContain("FUENTE-TRES");
    expect(html).not.toContain("FUENTE-DOS");
    expect(veces(html, TEXTOS.bloque.noSePudoCargar)).toBe(1);
    expect(botones(html)).toHaveLength(1);
    expect(veces(html, 'data-estado="datos"')).toBe(2);
  });
});

describe("ZonaDeDatos reutiliza el bloque sin perder lo que hacía", () => {
  const conTransicion = (valor: Partial<React.ContextType<typeof ContextoDeTransicion>>) =>
    renderToStaticMarkup(
      <ContextoDeTransicion.Provider
        value={{
          pendiente: false,
          lenta: false,
          fallida: false,
          referencia: null,
          iniciar: (a) => a(),
          reintentar: nada,
          registrarDestinoDeFoco: nada,
          ...valor,
        }}
      >
        <ZonaDeDatos zona="cifras" className="x">
          <p>{CONTENIDO}</p>
        </ZonaDeDatos>
      </ContextoDeTransicion.Provider>,
    );

  it("sin transición: los hijos, sin estado de carga ni de error", () => {
    const html = conTransicion({});
    expect(html).toContain(CONTENIDO);
    expect(html).not.toContain('data-estado="carga"');
    expect(html).not.toContain('data-estado="error"');
    expect(html).not.toContain("aria-busy");
  });

  it("pendiente: zona ocupada, esqueleto y los hijos ocultos", () => {
    const html = conTransicion({ pendiente: true });
    expect(html).toContain('aria-busy="true"');
    expect(html).toContain('data-estado="carga"');
    expect(html).toMatch(new RegExp(`<div [^>]*class="hidden"[^>]*><p>${CONTENIDO}</p></div>`));
    expect(veces(html, TEXTOS.bloque.cargando)).toBe(1);
  });

  it("lenta: el aviso, una vez", () => {
    const html = conTransicion({ pendiente: true, lenta: true });
    expect(veces(html, TEXTOS.bloque.cargaLenta)).toBe(1);
  });

  it("fallida: error de tarda_demasiado con su referencia y un solo «Reintentar»; sin aria-busy", () => {
    const html = conTransicion({ pendiente: true, fallida: true, referencia: "N-2H5J9PTV0G" });
    expect(html).toContain('data-estado="error"');
    expect(html).toContain("N-2H5J9PTV0G");
    expect(html).not.toContain("aria-busy");
    expect(botones(html)).toHaveLength(1);
    expect(veces(html, TEXTOS.bloque.noSePudoCargar)).toBe(1);
    expect(html).toMatch(new RegExp(`<div [^>]*class="hidden"[^>]*><p>${CONTENIDO}</p></div>`));
  });

  it("la zona usa `BloqueDatos` y no pinta su propio estado", () => {
    const fuente = readFileSync(
      resolve(RAIZ, "src", "components", "armazon", "ZonaDeDatos.tsx"),
      "utf8",
    );
    expect(fuente).toContain("BloqueDatos");
    expect(fuente).not.toMatch(/data-estado="carga"/);
  });
});

describe("BloqueDatos · lo que el código no puede hacer (artículos 1, 2 y 3)", () => {
  const fuente = readFileSync(
    resolve(RAIZ, "src", "components", "estados", "BloqueDatos.tsx"),
    "utf8",
  );
  const sinComentarios = fuente.replace(/\/\/.*$/gm, "").replace(/\/\*[\s\S]*?\*\//g, "");

  it("no pide datos, no guarda nada en el navegador y no pinta HTML", () => {
    expect(sinComentarios).not.toMatch(/\bfetch\s*\(/);
    expect(sinComentarios).not.toMatch(/localStorage|sessionStorage|indexedDB|document\.cookie/);
    expect(sinComentarios).not.toContain("dangerouslySetInnerHTML");
  });

  it("no tiene propiedad para un mensaje, una traza o el recurso", () => {
    expect(sinComentarios).not.toMatch(
      /\b(mensaje|message|traza|stack|digest|nombre|identificador)\??:/,
    );
  });
});
