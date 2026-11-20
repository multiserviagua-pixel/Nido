// T-007 (c, d) · comprobaciones estáticas propias de la 020.
//
// 1. Ningún carácter de control (Cc), de formato (Cf), U+2028 ni U+2029 escritos tal cual en el
//    código de `src/components/**` ni en `tests/unit/diseno/**` (art. 7; diseño, «Texto literal»):
//    se escriben con `\uXXXX` o `\u{XXXXX}`. Se exceptúan solo el salto de línea, el retorno de
//    carro y el tabulador del propio código fuente.
// 2. Mientras la nota aclaratoria del artículo 2 no esté aplicada, la ruta `admin_cliente` no se
//    usa fuera de `rutas.ts` y el panel no declara un campo identificador de cliente.
//
// Este archivo usa solo escapes: no contiene ninguno de los caracteres que busca.
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { describe, expect, it } from "vitest";

const RAIZ = resolve(import.meta.dirname, "..", "..", "..");
const EXTENSIONES = /\.(?:tsx?|mjs|cjs|js|css|json|md)$/;

function archivos(carpeta: string): string[] {
  let entradas: string[];
  try {
    entradas = readdirSync(carpeta);
  } catch {
    return [];
  }
  return entradas.flatMap((nombre) => {
    const ruta = join(carpeta, nombre);
    if (statSync(ruta).isDirectory()) return nombre === "node_modules" ? [] : archivos(ruta);
    return EXTENSIONES.test(nombre) ? [ruta] : [];
  });
}

const REGEX_INVISIBLE = /[\p{Cc}\p{Cf}\u2028\u2029]/u;

/** Los puntos de código prohibidos que hay literales en el texto, con su línea. */
export function invisiblesLiterales(texto: string): string[] {
  const hallazgos: string[] = [];
  texto.split("\n").forEach((linea, i) => {
    for (const c of linea) {
      if (c === "\r" || c === "\t") continue;
      if (REGEX_INVISIBLE.test(c)) {
        const cp = (c.codePointAt(0) ?? 0).toString(16).toUpperCase().padStart(4, "0");
        hallazgos.push(`línea ${i + 1}: U+${cp}`);
      }
    }
  });
  return hallazgos;
}

describe("PRUEBA-004 · sin invisibles ni controles de dirección literales en el código", () => {
  it("la comprobación detecta cada uno de los caracteres que el diseño manda quitar", () => {
    const lista = [
      0x0000, 0x0007, 0x007f, 0x0085, 0x00ad, 0x061c, 0x180e, 0x200b, 0x200c, 0x200d, 0x200e,
      0x200f, 0x2028, 0x2029, 0x202a, 0x202b, 0x202c, 0x202d, 0x202e, 0x2060, 0x2061, 0x2062,
      0x2063, 0x2064, 0x2066, 0x2067, 0x2068, 0x2069, 0xfeff, 0xe0001, 0xe0020, 0xe007f,
    ];
    for (const cp of lista) {
      const c = String.fromCodePoint(cp);
      expect(invisiblesLiterales(`const a = "x${c}y";`), `U+${cp.toString(16)}`).toHaveLength(1);
    }
  });

  it("no da falsos positivos con el código corriente, los escapes y los saltos de línea", () => {
    expect(invisiblesLiterales('const a = "\\u202E y \\u{E0001}";\r\n\tconst b = 1;\n')).toEqual(
      [],
    );
    expect(invisiblesLiterales("café — «sí» \u{1F600}")).toEqual([]);
  });

  it("src/components/** y tests/unit/diseno/** no llevan ninguno escrito tal cual", () => {
    const carpetas = [join(RAIZ, "src", "components"), join(RAIZ, "tests", "unit", "diseno")];
    const lista = carpetas.flatMap(archivos);
    expect(lista.length).toBeGreaterThan(20);
    const fallos = lista.flatMap((ruta) =>
      invisiblesLiterales(readFileSync(ruta, "utf8")).map(
        (h) => `${relative(RAIZ, ruta).replaceAll("\\", "/")} ${h}`,
      ),
    );
    expect(fallos).toEqual([]);
  });
});

// Una referencia a la ruta de cliente (`admin_cliente`, no `admin_clientes`).
export const USA_RUTA_DE_CLIENTE = /\badmin_cliente\b(?!s)/;
// Un campo del esquema de dirección llamado «cliente…» de tipo identificador.
export const CAMPO_CLIENTE_EN_ESQUEMA = /\bcliente\w*["']?\s*:\s*\{[^}]*identificador/;
// Un parámetro de consulta con el cliente.
export const PARAMETRO_CLIENTE = /[?&]cliente\w*=/;

describe("art. 2 · la dirección no lleva el cliente (hasta aplicar la nota aclaratoria)", () => {
  it("las expresiones detectan los casos que deben fallar", () => {
    expect(USA_RUTA_DE_CLIENTE.test('construirRuta("admin_cliente", { id })')).toBe(true);
    expect(USA_RUTA_DE_CLIENTE.test('construirRuta("admin_clientes")')).toBe(false);
    expect(CAMPO_CLIENTE_EN_ESQUEMA.test('{ cliente: { tipo: "identificador" } }')).toBe(true);
    expect(CAMPO_CLIENTE_EN_ESQUEMA.test('{ cliente_id: { tipo: "identificador" } }')).toBe(true);
    expect(CAMPO_CLIENTE_EN_ESQUEMA.test('{ pagina: { tipo: "entero" } }')).toBe(false);
    expect(PARAMETRO_CLIENTE.test("/panel?cliente=abc")).toBe(true);
    expect(PARAMETRO_CLIENTE.test("/panel?pagina=2&cliente_id=abc")).toBe(true);
    expect(PARAMETRO_CLIENTE.test("/panel?pagina=2")).toBe(false);
  });

  it("`admin_cliente` no se usa en src/ fuera de rutas.ts", () => {
    const rutas = join(RAIZ, "src", "components", "direccion", "rutas.ts");
    const usos = archivos(join(RAIZ, "src"))
      .filter((ruta) => ruta !== rutas)
      .filter((ruta) => USA_RUTA_DE_CLIENTE.test(readFileSync(ruta, "utf8")))
      .map((ruta) => relative(RAIZ, ruta).replaceAll("\\", "/"));
    expect(usos).toEqual([]);
  });

  it("src/app/panel/** no declara un campo identificador de cliente ni lo pone en la consulta", () => {
    // Hoy la carpeta no existe (la crea la 030): la comprobación se activa sola cuando aparezca.
    const fallos = archivos(join(RAIZ, "src", "app", "panel"))
      .filter((ruta) => {
        const texto = readFileSync(ruta, "utf8");
        return CAMPO_CLIENTE_EN_ESQUEMA.test(texto) || PARAMETRO_CLIENTE.test(texto);
      })
      .map((ruta) => relative(RAIZ, ruta).replaceAll("\\", "/"));
    expect(fallos).toEqual([]);
  });
});
