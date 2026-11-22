// L 1 de la función 010 (T-009; diseño, «Pruebas»): la transcripción de la matriz que lleva
// `supabase/tests/02_matriz_acceso.test.sql` coincide celda a celda con la tabla D-6 de
// `specs/010-base-datos-rls/diseno.md` (CA-005, CA-034). Texto, sin base de datos.
// pgTAP compara después esa transcripción con el comportamiento real de la base (828 aserciones
// de matriz en 02); entre las dos cubren diseño → transcripción → base.
//
// Formato de la transcripción en 02: entre `-- TRANSCRIPCION-MATRIZ-INICIO` y
// `-- TRANSCRIPCION-MATRIZ-FIN`, una tupla por objeto, con las letras (leer, insertar, modificar,
// borrar) de cada perfil en este orden: SS, UA, UB, UAB, USV, AD1, AD2, CON, SR.
// No cambiar el formato sin cambiar esta prueba.
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const RAIZ = new URL("../../../", import.meta.url);
const RUTA_02 = "supabase/tests/02_matriz_acceso.test.sql";
const diseno = readFileSync(new URL("specs/010-base-datos-rls/diseno.md", RAIZ), "utf8");
const especificacion = readFileSync(
  new URL("specs/010-base-datos-rls/especificacion.md", RAIZ),
  "utf8",
);

export const PERFILES = ["SS", "UA", "UB", "UAB", "USV", "AD1", "AD2", "CON", "SR"] as const;
type Perfil = (typeof PERFILES)[number];
/** objeto → perfil → cuatro letras (leer, insertar, modificar, borrar). */
export type Matriz = Map<string, Map<Perfil, string>>;

/** Lee la tabla D-6 de `diseno.md`. Falla (cierra en fallo) si cambia su forma. */
export function leerD6(texto: string): Matriz {
  const ini = texto.indexOf("### D-6 ");
  const fin = texto.indexOf("### D-7 ");
  if (ini === -1 || fin === -1 || fin < ini) throw new Error("diseno.md no tiene D-6 y D-7");
  const seccion = texto.slice(ini, fin);

  const reglas =
    /SS y CON: `([XPT0C]{4})` en los (\d+) objetos\. SR: `([XPT0C]{4})` salvo `(\w+)`, `([XPT0C]{4})`/.exec(
      seccion,
    );
  if (reglas === null) throw new Error("D-6 no lleva la línea de SS, CON y SR");
  const [, base, total, sr, excepcion, srExcepcion] = reglas;

  const matriz: Matriz = new Map();
  let cabecera = false;
  for (const linea of seccion.split(/\r?\n/)) {
    if (!linea.startsWith("|")) continue;
    const celdas = linea
      .split("|")
      .slice(1, -1)
      .map((c) => c.trim());
    if (celdas[0] === "Objetos") {
      if (celdas.join("|") !== "Objetos|UA, UB, UAB|USV, AD1|AD2") {
        throw new Error(`Cabecera de D-6 inesperada: ${linea}`);
      }
      cabecera = true;
      continue;
    }
    if (!cabecera || /^-+$/.test(celdas[0] ?? "")) continue;
    if (celdas.length !== 4) throw new Error(`Fila de D-6 con ${celdas.length} celdas: ${linea}`);
    const [objetos, usuarios, sinAcceso, admin] = celdas as [string, string, string, string];
    for (const letras of [usuarios, sinAcceso, admin]) {
      if (!/^[XPT0C]{4}$/.test(letras)) throw new Error(`Letras no válidas en D-6: ${letras}`);
    }
    for (const objeto of objetos.split(",").map((o) => o.trim())) {
      if (matriz.has(objeto)) throw new Error(`Objeto repetido en D-6: ${objeto}`);
      matriz.set(
        objeto,
        new Map<Perfil, string>([
          ["SS", base ?? ""],
          ["UA", usuarios],
          ["UB", usuarios],
          ["UAB", usuarios],
          ["USV", sinAcceso],
          ["AD1", sinAcceso],
          ["AD2", admin],
          ["CON", base ?? ""],
          ["SR", objeto === excepcion ? (srExcepcion ?? "") : (sr ?? "")],
        ]),
      );
    }
  }
  if (matriz.size !== Number(total)) {
    throw new Error(`D-6 dice ${String(total)} objetos y la tabla trae ${String(matriz.size)}`);
  }
  if (!matriz.has(excepcion ?? "")) throw new Error("La excepción de SR no es un objeto de D-6");
  return matriz;
}

/** Lee la transcripción de 02. Falla si falta el archivo o el bloque. */
export function leerTranscripcion(sql: string): Matriz {
  const m = /-- TRANSCRIPCION-MATRIZ-INICIO\r?\n([\s\S]*?)-- TRANSCRIPCION-MATRIZ-FIN/.exec(sql);
  if (m === null) throw new Error("02 no lleva el bloque de transcripción de la matriz");
  const matriz: Matriz = new Map();
  for (const linea of (m[1] ?? "").split(/\r?\n/)) {
    const t = linea.trim();
    if (t === "" || t.startsWith("--")) continue;
    const tupla = /^\('([a-z_]+)',((?:\s*'[XPT0C]{4}',?){9})\),?;?$/.exec(t);
    if (tupla === null) continue;
    const letras = [...(tupla[2] ?? "").matchAll(/'([XPT0C]{4})'/g)].map((x) => x[1] ?? "");
    if (letras.length !== PERFILES.length) throw new Error(`Tupla con ${letras.length} perfiles`);
    const objeto = tupla[1] ?? "";
    if (matriz.has(objeto)) throw new Error(`Objeto repetido en la transcripción: ${objeto}`);
    matriz.set(objeto, new Map(PERFILES.map((p, i) => [p, letras[i] ?? ""] as const)));
  }
  return matriz;
}

/** Discrepancias entre la tabla de diseño y la transcripción, una cadena por celda. */
export function comparar(diseno: Matriz, transcripcion: Matriz): string[] {
  const dif: string[] = [];
  for (const objeto of diseno.keys()) {
    if (!transcripcion.has(objeto)) dif.push(`${objeto}: falta en la transcripción`);
  }
  for (const [objeto, perfiles] of transcripcion) {
    const esperado = diseno.get(objeto);
    if (esperado === undefined) {
      dif.push(`${objeto}: sobra en la transcripción`);
      continue;
    }
    for (const p of PERFILES) {
      if (perfiles.get(p) !== esperado.get(p)) {
        dif.push(
          `${objeto} · ${p}: diseño ${esperado.get(p) ?? "?"}, transcripción ${perfiles.get(p) ?? "?"}`,
        );
      }
    }
  }
  return dif;
}

/** Nombres de objeto de un bloque `-- <MARCA>-INICIO … -- <MARCA>-FIN`: la primera línea de cada fila. */
function objetosDeBloque(sql: string, marca: string): string[] {
  const m = new RegExp(`-- ${marca}-INICIO\\r?\\n([\\s\\S]*?)-- ${marca}-FIN`).exec(sql);
  if (m === null) throw new Error(`02 no lleva el bloque ${marca}`);
  return (m[1] ?? "")
    .split(/\r?\n/)
    .map((l) => /^\s*\('([a-z_]+)',/.exec(l)?.[1])
    .filter((x): x is string => x !== undefined);
}

describe("L 1 · matriz de acceso (D-6) = transcripción de 02", () => {
  const d6 = leerD6(diseno);
  // Lectura perezosa: sin 02, fallan solo las pruebas que lo necesitan.
  const leerSql = (): string => readFileSync(new URL(RUTA_02, RAIZ), "utf8");

  it("D-6 tiene los 23 objetos y 9 perfiles con cuatro letras cada uno", () => {
    expect(d6.size).toBe(23);
    for (const [objeto, perfiles] of d6) {
      expect([...perfiles.keys()], objeto).toEqual([...PERFILES]);
      for (const letras of perfiles.values()) expect(letras).toMatch(/^[XPT0C]{4}$/);
    }
  });

  it("las letras de cada operación son las que admite esa operación", () => {
    const admitidas = [/^[X0PTC]$/, /^[XC]$/, /^[X0C]$/, /^[X0T]$/];
    for (const [objeto, perfiles] of d6) {
      for (const [perfil, letras] of perfiles) {
        [...letras].forEach((l, i) =>
          expect(l, `${objeto} · ${perfil} · operación ${String(i)}`).toMatch(admitidas[i] ?? /^$/),
        );
      }
    }
  });

  it("la lista de lectura del usuario de cliente de D-6 es la de REQ-057 (CA-035)", () => {
    const req = /\| REQ-057 \| (.*?) \|/.exec(especificacion)?.[1] ?? "";
    expect(req).toContain(
      "su cliente, su licencia, sus órdenes, ejecuciones, informes y suscripción",
    );
    const leen = [...d6]
      .filter(([, p]) => /^[PT]/.test(p.get("UA") ?? ""))
      .map(([o]) => o)
      .sort();
    expect(leen).toEqual(
      [
        "catalogo_problemas",
        "clientes",
        "ejecuciones",
        "informes",
        "licencias",
        "metricas_version",
        "ordenes",
        "resumen_cliente",
        "suscripciones",
      ].sort(),
    );
    // UA, UB y UAB tienen las mismas letras; USV y AD1, también (D-6 las agrupa).
    for (const [objeto, p] of d6) {
      expect(p.get("UB"), objeto).toBe(p.get("UA"));
      expect(p.get("UAB"), objeto).toBe(p.get("UA"));
      expect(p.get("AD1"), objeto).toBe(p.get("USV"));
    }
  });

  it("la transcripción de 02 coincide con D-6: 0 discrepancias en 207 celdas", () => {
    const transcripcion = leerTranscripcion(leerSql());
    expect(transcripcion.size).toBe(23);
    expect(comparar(d6, transcripcion)).toEqual([]);
  });

  it("la prueba detecta una letra cambiada, un objeto que falta y uno que sobra", () => {
    const transcripcion = leerTranscripcion(leerSql());
    const copia = (m: Matriz): Matriz => new Map([...m].map(([o, p]) => [o, new Map(p)] as const));
    const cambiada = copia(transcripcion);
    cambiada.get("clientes")?.set("UA", "PXXX");
    expect(comparar(d6, cambiada)).toEqual(["clientes · UA: diseño PX0X, transcripción PXXX"]);
    const sr = copia(transcripcion);
    sr.get("versiones_prompt")?.set("SR", "XXXX");
    expect(comparar(d6, sr)).toEqual(["versiones_prompt · SR: diseño TCXX, transcripción XXXX"]);
    const falta = copia(transcripcion);
    falta.delete("tokens");
    expect(comparar(d6, falta)).toEqual(["tokens: falta en la transcripción"]);
    const sobra = copia(transcripcion);
    sobra.set("inventada", new Map(PERFILES.map((p) => [p, "XXXX"] as const)));
    expect(comparar(d6, sobra)).toEqual(["inventada: sobra en la transcripción"]);
  });

  it("el lector de D-6 falla si la tabla cambia de forma (cierra en fallo)", () => {
    expect(() =>
      leerD6(diseno.replace("| Objetos | UA, UB, UAB |", "| Objetos | UA, UB |")),
    ).toThrow(/Cabecera de D-6/);
    expect(() => leerD6(diseno.replace("`TCXX`", "`TCX`"))).toThrow(/línea de SS, CON y SR/);
    expect(() => leerD6(diseno.replace("| TXCX |", "| TXCZ |"))).toThrow(/Letras no válidas/);
  });

  it("los bloques de sentencias y de negativos de 02 cubren los mismos 23 objetos y 15 negativos", () => {
    const sql = leerSql();
    const objetos = [...d6.keys()].sort();
    expect(objetosDeBloque(sql, "SENTENCIAS").sort()).toEqual(objetos);
    const negativos = /-- NEGATIVOS-INICIO\r?\n([\s\S]*?)-- NEGATIVOS-FIN/.exec(sql)?.[1] ?? "";
    const numeros = negativos
      .split(/\r?\n/)
      .map((l) => /^\s*\((\d+),/.exec(l)?.[1])
      .filter((x): x is string => x !== undefined)
      .map(Number);
    expect(numeros).toEqual(Array.from({ length: 15 }, (_, i) => i + 1));
  });

  it("el plan de 02 es 23 × 9 × 4 + 1 (REQ-057) + 15 negativos = 844", () => {
    const sql = leerSql();
    const plan = /select plan\((\d+)\);/.exec(sql)?.[1];
    expect(Number(plan)).toBe(23 * 9 * 4 + 1 + 15);
    expect(Number(plan)).toBe(844);
  });
});
