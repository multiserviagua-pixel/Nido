// L 2 de la función 010 (T-008; diseño, «Pruebas»): el contrato `contratos/informe.schema.json`
// coincide con la transcripción que lleva `supabase/tests/07_informes.test.sql` (CA-017, REQ-021).
// Texto, sin base de datos. pgTAP compara después esa misma transcripción con el catálogo
// (14 aserciones de contrato en 07); entre las dos cubren contrato → transcripción → catálogo.
//
// Formato de la transcripción en 07: entre las líneas `-- TRANSCRIPCION-CONTRATO-INICIO` y
// `-- TRANSCRIPCION-CONTRATO-FIN`, una tupla por propiedad de primer nivel del contrato:
//   (campo, clase, columnas, valores, minimo, maximo, patron, max_elementos)
// con `null` o un entero o un literal entre comillas simples (sin comillas dentro).
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const RAIZ = new URL("../../../", import.meta.url);
const contrato = JSON.parse(readFileSync(new URL("contratos/informe.schema.json", RAIZ), "utf8"));
const RUTA_07 = "supabase/tests/07_informes.test.sql";

type Valor = string | number | null;
export interface Fila {
  campo: string;
  clase: string;
  columnas: string | null;
  valores: string | null;
  minimo: number | null;
  maximo: number | null;
  patron: string | null;
  maxElementos: number | null;
}

/** Parte el contenido de una tupla por comas fuera de comillas simples. */
function partirTupla(cuerpo: string): Valor[] {
  const salida: Valor[] = [];
  let actual = "";
  let dentro = false;
  for (const c of cuerpo) {
    if (c === "'") dentro = !dentro;
    if (c === "," && !dentro) {
      salida.push(convertir(actual));
      actual = "";
    } else actual += c;
  }
  salida.push(convertir(actual));
  return salida;
}

function convertir(texto: string): Valor {
  const t = texto.trim();
  if (t === "null") return null;
  if (/^-?\d+$/.test(t)) return Number(t);
  const m = /^'([^']*)'$/.exec(t);
  if (m === null) throw new Error(`Valor no válido en la transcripción: ${t}`);
  return m[1] ?? "";
}

/** Lee la transcripción de 07. Falla (cierra en fallo) si falta el archivo o el bloque. */
export function leerTranscripcion(sql: string): Fila[] {
  const m = /-- TRANSCRIPCION-CONTRATO-INICIO\r?\n([\s\S]*?)-- TRANSCRIPCION-CONTRATO-FIN/.exec(
    sql,
  );
  if (m === null) throw new Error("07 no lleva el bloque de transcripción del contrato");
  const filas: Fila[] = [];
  for (const linea of (m[1] ?? "").split(/\r?\n/)) {
    const t = linea.trim();
    if (t === "" || t.startsWith("--")) continue;
    const tupla = /^\((.*)\),?;?$/.exec(t);
    if (tupla === null) continue;
    const v = partirTupla(tupla[1] ?? "");
    if (v.length !== 8) throw new Error(`Tupla con ${v.length} campos: ${t}`);
    filas.push({
      campo: String(v[0]),
      clase: String(v[1]),
      columnas: v[2] as string | null,
      valores: v[3] as string | null,
      minimo: v[4] as number | null,
      maximo: v[5] as number | null,
      patron: v[6] as string | null,
      maxElementos: v[7] as number | null,
    });
  }
  return filas;
}

const lista = (v: string | null) => (v === null ? [] : v.split(","));
const sql07 = () => readFileSync(new URL(RUTA_07, RAIZ), "utf8");

describe("L 2 · el contrato del informe coincide con la transcripción de 07 (CA-017)", () => {
  it("07 existe y lleva la transcripción, con una fila por propiedad del contrato", () => {
    const filas = leerTranscripcion(sql07());
    const propiedades = Object.keys(contrato.properties).sort();
    expect(propiedades).toHaveLength(14);
    expect(filas.map((f) => f.campo).sort()).toEqual(propiedades);
    expect(new Set(filas.map((f) => f.campo)).size).toBe(filas.length);
  });

  it("los campos obligatorios del contrato son exactamente las propiedades (todas not null)", () => {
    expect([...contrato.required].sort()).toEqual(Object.keys(contrato.properties).sort());
    expect(contrato.additionalProperties).toBe(false);
  });

  const filaDe = (campo: string): Fila => {
    const f = leerTranscripcion(sql07()).find((x) => x.campo === campo);
    if (f === undefined) throw new Error(`Sin fila para ${campo}`);
    return f;
  };

  for (const campo of ["estado", "modo", "asistente", "almacenamiento"]) {
    it(`${campo}: lista cerrada igual, en la misma columna`, () => {
      const f = filaDe(campo);
      expect(f.clase).toBe("enum");
      expect(f.columnas).toBe(campo);
      expect(lista(f.valores)).toEqual(contrato.properties[campo].enum);
    });
  }

  it("version_prompt: formato y longitud máxima", () => {
    const p = contrato.properties.version_prompt;
    const f = filaDe("version_prompt");
    expect(f.clase).toBe("texto");
    expect(f.columnas).toBe("version_prompt");
    expect(f.patron).toBe(p.pattern);
    expect(f.maximo).toBe(p.maxLength);
    expect(f.minimo).toBeNull();
  });

  for (const campo of [
    "frecuencia_horas",
    "tratados",
    "sin_tratar",
    "borradores",
    "documentos",
    "facturas_pendientes",
    "urgentes",
  ]) {
    it(`${campo}: entero con el mismo mínimo y máximo`, () => {
      const p = contrato.properties[campo];
      const f = filaDe(campo);
      expect(p.type).toBe("integer");
      expect(f.clase).toBe("entero");
      expect(f.columnas).toBe(campo);
      expect(f.minimo).toBe(p.minimum);
      expect(f.maximo).toBe(p.maximum);
    });
  }

  it("comprobaciones: las cuatro propiedades booleanas, en las columnas comp_*", () => {
    const p = contrato.properties.comprobaciones;
    const f = filaDe("comprobaciones");
    const nombres = Object.keys(p.properties);
    expect(f.clase).toBe("booleanos");
    expect(lista(f.valores)).toEqual(nombres);
    expect(lista(f.columnas)).toEqual(nombres.map((n) => `comp_${n}`));
    expect(p.required).toEqual(nombres);
    expect(p.additionalProperties).toBe(false);
    for (const n of nombres) expect(p.properties[n]).toEqual({ type: "boolean" });
  });

  it("problemas: lista de códigos del catálogo, sin repetir y como mucho cinco", () => {
    const p = contrato.properties.problemas;
    const f = filaDe("problemas");
    expect(f.clase).toBe("lista");
    expect(f.columnas).toBe("problemas");
    expect(lista(f.valores)).toEqual(p.items.enum);
    expect(f.maxElementos).toBe(p.maxItems);
    expect(p.uniqueItems).toBe(true);
  });

  it("ninguna propiedad del contrato es texto libre (artículo 1)", () => {
    for (const [campo, p] of Object.entries<{ type?: string; pattern?: string; enum?: unknown }>(
      contrato.properties,
    )) {
      if (p.type === "string") {
        expect(campo, "única cadena sin enum").toBe("version_prompt");
        expect(p.pattern).toBeDefined();
      }
    }
  });
});
