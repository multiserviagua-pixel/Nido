// T-010 (e2) · transición del cambio de periodo (diseño 020, «Una vista en uso», «Cambio de periodo»,
// puntos 3 a 6; REQ-006; CA-016, CA-018). Las zonas de cifras y de contenido de `RejillaCuerpo`
// leen la transición del armazón: mientras está pendiente llevan `aria-busy="true"` y pintan
// `carga`, y lo que había (los hijos de servidor) queda montado pero oculto, de modo que ninguna
// cifra del periodo anterior se ve como actual. Aquí, con el marcado del servidor y el contexto
// puesto a mano; el cambio real, con respuesta retenida, lo mide `periodo-servidor.spec.ts`.
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Armazon } from "../../../src/components/armazon/Armazon";
import { AREAS_SUPERADMIN } from "../../../src/components/armazon/areas";
import { RejillaCuerpo } from "../../../src/components/armazon/RejillaCuerpo";
import { ContextoDeTransicion } from "../../../src/components/armazon/TransicionDePeriodo";
import { TEXTOS } from "../../../src/components/textos";

const RAIZ = resolve(import.meta.dirname, "..", "..", "..");
const leer = (ruta: string): string => readFileSync(resolve(RAIZ, ruta), "utf8");

function rejilla(estado: {
  pendiente: boolean;
  lenta?: boolean;
  fallida?: boolean;
  referencia?: string | null;
}): string {
  return renderToStaticMarkup(
    <ContextoDeTransicion.Provider
      value={{
        pendiente: estado.pendiente,
        lenta: estado.lenta ?? false,
        fallida: estado.fallida ?? false,
        referencia: estado.referencia ?? null,
        iniciar: () => {},
        reintentar: () => {},
        registrarDestinoDeFoco: () => {},
      }}
    >
      <RejillaCuerpo
        cifras={<p id="cifra-vieja">48</p>}
        contenido={<p id="contenido-viejo">tabla</p>}
        alertas={<p id="alerta">alerta</p>}
      />
    </ContextoDeTransicion.Provider>,
  );
}
const zona = (html: string, nombre: string): string =>
  new RegExp(`<div data-zona="${nombre}"[\\s\\S]*?(?=<div data-zona=|$)`).exec(html)![0];

describe("T-010 (e2) · RejillaCuerpo con la transición en curso", () => {
  it("sin transición pendiente (y sin proveedor), las zonas no cambian: ni aria-busy ni carga", () => {
    for (const html of [
      rejilla({ pendiente: false }),
      renderToStaticMarkup(<RejillaCuerpo cifras={<p>k</p>} contenido={<p>c</p>} />),
    ]) {
      expect(html).not.toContain("aria-busy");
      expect(html).not.toContain('data-estado="carga"');
    }
  });

  it("pendiente: cifras y contenido llevan aria-busy=true y pintan carga", () => {
    const html = rejilla({ pendiente: true });
    for (const nombre of ["cifras", "contenido"]) {
      const z = zona(html, nombre);
      expect(z, nombre).toContain('aria-busy="true"');
      expect(z, nombre).toContain('data-estado="carga"');
      expect(z, nombre).toContain(TEXTOS.bloque.cargando);
    }
  });

  it("pendiente: lo que había queda montado y oculto, no a la vista como actual", () => {
    const html = rejilla({ pendiente: true });
    for (const [nombre, id] of [
      ["cifras", "cifra-vieja"],
      ["contenido", "contenido-viejo"],
    ] as const) {
      const z = zona(html, nombre);
      const envoltorio =
        /<div [^>]*class="([^"]*)"[^>]*>(?=<p id="(?:cifra-vieja|contenido-viejo)")/.exec(z);
      expect(envoltorio, `${nombre}: los hijos van en un envoltorio`).not.toBeNull();
      expect(envoltorio![1]!.split(" "), nombre).toContain("hidden");
      expect(z, nombre).toContain(`id="${id}"`);
    }
  });

  it("no pendiente: el envoltorio de los hijos no oculta nada (no cambia el diseño de la rejilla)", () => {
    const z = zona(rejilla({ pendiente: false }), "cifras");
    expect(z).toMatch(/<div [^>]*class="contents"[^>]*><p id="cifra-vieja">48<\/p><\/div>/);
  });

  it("las alertas no son datos del periodo: no se marcan ocupadas", () => {
    const html = rejilla({ pendiente: true });
    const alertas = /<div data-zona="alertas"[\s\S]*$/.exec(html)![0];
    expect(alertas).not.toContain("aria-busy");
    expect(alertas).not.toContain('data-estado="carga"');
  });

  it("lenta (más de 10 s): añade «Está tardando más de lo normal»", () => {
    expect(rejilla({ pendiente: true, lenta: true })).toContain(TEXTOS.bloque.cargaLenta);
    expect(rejilla({ pendiente: true, lenta: false })).not.toContain(TEXTOS.bloque.cargaLenta);
  });

  it("el orden del documento sigue siendo cifras, contenido y alertas", () => {
    const html = rejilla({ pendiente: true });
    expect([...html.matchAll(/data-zona="([a-z]+)"/g)].map((m) => m[1])).toEqual([
      "cifras",
      "contenido",
      "alertas",
    ]);
  });
});

// REQ-069, CA-048, diseño «Cambio de periodo» punto 4 y «Cuando algo falla»: a los 30 s pendiente las
// zonas de cifras y de contenido pasan a `error` con motivo de lista cerrada, referencia `N-` y
// reintento; ninguna cifra queda a la vista.
describe("T-010 (e2) · RejillaCuerpo con el cambio de periodo fallido (30 s)", () => {
  const REF = "N-0123456789";
  const html = (): string =>
    rejilla({ pendiente: true, lenta: true, fallida: true, referencia: REF });

  it("cifras y contenido pasan a error con el motivo «tarda demasiado», la referencia y «Reintentar»", () => {
    for (const nombre of ["cifras", "contenido"]) {
      const z = zona(html(), nombre);
      expect(z, nombre).toContain('data-estado="error"');
      expect(z, nombre).not.toContain('data-estado="carga"');
      expect(z, nombre).not.toContain("aria-busy");
      expect(z, nombre).toContain(TEXTOS.motivosDeError.tarda_demasiado);
      expect(z, nombre).toContain(TEXTOS.bloque.noSePudoCargar);
      expect(z, nombre).toContain(`${TEXTOS.bloque.referencia}: ${REF}`);
      expect(z, nombre).toMatch(
        new RegExp(`<button type="button"[^>]*>${TEXTOS.bloque.reintentar}</button>`),
      );
    }
  });

  it("el texto «No se ha podido cargar» no se repite: lo dice solo el motivo (menor 15 (d))", () => {
    for (const nombre of ["cifras", "contenido"]) {
      const z = zona(html(), nombre);
      expect(z.split(TEXTOS.bloque.noSePudoCargar).length - 1, nombre).toBe(1);
      expect(z, nombre).toContain(TEXTOS.motivosDeError.tarda_demasiado);
    }
  });

  it("lo que había sigue oculto: 0 cifras a la vista en el estado de error", () => {
    const z = zona(html(), "cifras");
    expect(
      /<div [^>]*class="([^"]*)"[^>]*>(?=<p id="cifra-vieja")/.exec(z)![1]!.split(" "),
    ).toContain("hidden");
  });

  it("una referencia que no cumple el formato no se pinta (se descarta)", () => {
    const z = zona(
      rejilla({ pendiente: true, fallida: true, referencia: "mensaje interno" }),
      "cifras",
    );
    expect(z).not.toContain("mensaje interno");
    expect(z).toContain('data-estado="error"');
  });

  it("las alertas no cambian", () => {
    const alertas = /<div data-zona="alertas"[\s\S]*$/.exec(html())![0];
    expect(alertas).not.toContain('data-estado="error"');
  });
});

describe("T-010 (e2) · el proveedor: error a los 30 s, leído en el código", () => {
  const proveedor = leer("src/components/armazon/TransicionDePeriodo.tsx");
  it("fija 30 s, crea una referencia N-, anuncia el error y no importa el enrutador", () => {
    expect(proveedor).toMatch(/30_?000/);
    expect(proveedor).toMatch(/crearReferencia\("navegador"\)/);
    expect(proveedor).toMatch(/tarda_demasiado/);
    expect(proveedor).toMatch(/"urgente"/);
    expect(proveedor).not.toMatch(/next\//);
  });
});

describe("T-010 (e2) · el proveedor y el anuncio, leídos en el código", () => {
  const proveedor = leer("src/components/armazon/TransicionDePeriodo.tsx");

  it("es de cliente, usa useTransition, no importa el enrutador ni guarda nada", () => {
    expect(proveedor.trimStart().startsWith('"use client"')).toBe(true);
    expect(proveedor).toMatch(/useTransition\(/);
    expect(proveedor).not.toMatch(/next\//);
    expect(proveedor).not.toMatch(
      /localStorage|sessionStorage|indexedDB|document\.cookie|\bfetch\b/,
    );
  });

  it("anuncia «Cargando» una vez al empezar y el aviso de lentitud a los 10 s", () => {
    expect(proveedor).toMatch(/anunciar\(TEXTOS\.bloque\.cargando\)/);
    expect(proveedor).toMatch(/10_?000/);
    expect(proveedor).toMatch(/anunciar\(TEXTOS\.bloque\.cargaLenta\)/);
  });

  it("Armazon envuelve cabecera y cuerpo en el proveedor, para que el selector y las zonas compartan la transición", () => {
    const a = leer("src/components/armazon/Armazon.tsx");
    expect(a).toMatch(/<ProveedorDeTransicion>/);
    const html = renderToStaticMarkup(
      <Armazon
        areas={AREAS_SUPERADMIN}
        areaActual="resumen"
        titulo="x"
        cuenta={{ nombre: "Usuario Ficticio" }}
      >
        <RejillaCuerpo cifras={<p>k</p>} />
      </Armazon>,
    );
    expect(html).not.toContain("aria-busy");
    expect(html).toContain('data-zona="cifras"');
  });
});

// Menor 15 (c): al retirarse el error (por «Reintentar» o por la llegada tardía de la respuesta) el
// botón desaparece y el foco caería al `body`; se lleva al `select` solo si el foco se ha perdido.
describe("T-010 (d) · el foco tras el error de 30 s", () => {
  it("focoPerdido: sin elemento activo o con el cuerpo, sí; con cualquier otro, no", async () => {
    const { focoPerdido } = await import("../../../src/components/armazon/TransicionDePeriodo");
    const cuerpo = {};
    expect(focoPerdido(null, cuerpo)).toBe(true);
    expect(focoPerdido(cuerpo, cuerpo)).toBe(true);
    expect(focoPerdido({}, cuerpo)).toBe(false);
  });

  it("el proveedor devuelve el foco al destino registrado al salir del error, y el selector lo registra", () => {
    const proveedor = leer("src/components/armazon/TransicionDePeriodo.tsx");
    expect(proveedor).toMatch(/registrarDestinoDeFoco/);
    expect(proveedor).toMatch(/focoPerdido\(document\.activeElement, document\.body\)/);
    const selector = leer("src/components/armazon/SelectorPeriodo.tsx");
    expect(selector).toMatch(/registrarDestinoDeFoco\(/);
    expect(selector).toMatch(/\.focus\(\)/);
  });
});
