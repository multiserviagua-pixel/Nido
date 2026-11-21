// T-010 (a) · `Anunciador` (REQ-042; CA-033): dos regiones de anuncios, cortés y urgente, siempre
// presentes en el documento, y `anunciar()`. Las regiones son de servidor y nacen vacías; la cola
// (orden, repetición, texto plano) les cambia el texto. Aquí no hay navegador: se usa un
// documento mínimo que anota cada cambio de texto de cada región. Lo que se oye en un navegador
// real queda para `armazon.spec.ts` y la revisión manual (PRUEBA-028).
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  ATRIBUTO_DE_REGION,
  anunciar,
  leerAnuncio,
  reiniciarAnunciosParaPruebas,
} from "../../../src/components/texto/anuncios";
import { Anunciador } from "../../../src/components/texto/Anunciador";

type Region = { textContent: string };
let regiones: Record<string, Region>;
let escrituras: Array<[string, string]>;

function instalarDocumento(): void {
  escrituras = [];
  regiones = {};
  for (const nombre of ["cortes", "urgente"]) {
    let actual = "";
    regiones[nombre] = {
      get textContent() {
        return actual;
      },
      set textContent(v: string) {
        actual = v;
        escrituras.push([nombre, v]);
      },
    };
  }
  vi.stubGlobal("document", {
    querySelector: (selector: string) => {
      const m = new RegExp(`^\\[${ATRIBUTO_DE_REGION}="([a-z]+)"\\]$`).exec(selector);
      return m === null ? null : (regiones[m[1]!] ?? null);
    },
  });
}

beforeEach(() => {
  vi.useFakeTimers();
  reiniciarAnunciosParaPruebas();
  instalarDocumento();
});
afterEach(() => {
  reiniciarAnunciosParaPruebas();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

const dichos = (region: string): string[] =>
  escrituras.filter(([r, t]) => r === region && t !== "").map(([, t]) => t);

describe("Anunciador · las dos regiones están siempre en el documento", () => {
  const html = renderToStaticMarkup(<Anunciador />);

  it("región cortés (status, polite) y región urgente (alert, assertive), vacías al pintar", () => {
    expect(html).toMatch(/<div[^>]*role="status"[^>]*aria-live="polite"[^>]*><\/div>/);
    expect(html).toMatch(/<div[^>]*role="alert"[^>]*aria-live="assertive"[^>]*><\/div>/);
  });

  it("cada región lleva la marca con la que anunciar() la encuentra", () => {
    expect(html).toContain(`${ATRIBUTO_DE_REGION}="cortes"`);
    expect(html).toContain(`${ATRIBUTO_DE_REGION}="urgente"`);
  });

  it("son solo para el lector de pantalla: no se ven y no llevan enlaces ni controles", () => {
    expect(html.match(/class="sr-only"/g)).toHaveLength(2);
    expect(html).not.toMatch(/<(a|button|input)\b/);
  });
});

describe("anunciar · cola por región", () => {
  it("el texto llega a la región cortés tras un instante, y no a la urgente", () => {
    anunciar("Periodo cambiado");
    expect(regiones["cortes"]!.textContent).toBe("");
    vi.advanceTimersByTime(200);
    expect(regiones["cortes"]!.textContent).toBe("Periodo cambiado");
    expect(leerAnuncio("cortes")).toBe("Periodo cambiado");
    expect(regiones["urgente"]!.textContent).toBe("");
  });

  it("la urgencia urgente va a su región", () => {
    anunciar("Sin conexión", "urgente");
    vi.advanceTimersByTime(200);
    expect(regiones["urgente"]!.textContent).toBe("Sin conexión");
    expect(regiones["cortes"]!.textContent).toBe("");
  });

  it("el mismo texto dos veces se vuelve a anunciar: la región se vacía entre las dos", () => {
    anunciar("Orden cambiado");
    vi.advanceTimersByTime(1000);
    anunciar("Orden cambiado");
    vi.advanceTimersByTime(1000);
    expect(dichos("cortes")).toEqual(["Orden cambiado", "Orden cambiado"]);
    // Entre una escritura y la siguiente hay una región vacía: ahí el lector ve el cambio.
    const orden = escrituras.filter(([r]) => r === "cortes").map(([, t]) => t);
    expect(orden).toEqual(["Orden cambiado", "", "Orden cambiado", ""]);
  });

  it("dos anuncios seguidos se anuncian los dos, en orden, sin pisarse", () => {
    anunciar("Primero");
    anunciar("Segundo");
    vi.advanceTimersByTime(2000);
    expect(dichos("cortes")).toEqual(["Primero", "Segundo"]);
    const orden = escrituras.filter(([r]) => r === "cortes").map(([, t]) => t);
    expect(orden).toEqual(["Primero", "", "Segundo", ""]);
  });

  it("una cadena vacía o solo de espacios no anuncia nada", () => {
    anunciar("");
    anunciar("   ");
    vi.advanceTimersByTime(1000);
    expect(escrituras).toEqual([]);
    expect(leerAnuncio("cortes")).toBe("");
  });

  it("el texto pasa por textoPlano: sin caracteres de control ni de formato", () => {
    anunciar("Hola\u0000 \u{202E}mundo");
    vi.advanceTimersByTime(200);
    expect(regiones["cortes"]!.textContent).toBe("Hola mundo");
  });

  it("se escribe como texto: unas marcas no crean elementos (textContent, no innerHTML)", () => {
    anunciar("<img src=x onerror=1>");
    vi.advanceTimersByTime(200);
    expect(regiones["cortes"]!.textContent).toBe("<img src=x onerror=1>");
  });

  it("sin documento (en el servidor) no falla y deja el texto en la cola", () => {
    vi.unstubAllGlobals();
    expect(() => {
      anunciar("Algo");
      vi.advanceTimersByTime(200);
    }).not.toThrow();
    expect(leerAnuncio("cortes")).toBe("Algo");
  });

  it("una región que no está en el documento no rompe la cola", () => {
    delete regiones["cortes"];
    anunciar("Uno");
    anunciar("Dos");
    expect(() => vi.advanceTimersByTime(2000)).not.toThrow();
  });
});
