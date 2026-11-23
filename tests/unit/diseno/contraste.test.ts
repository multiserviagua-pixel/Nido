// T-007 (g) · PRUEBA-006 (U): contraste de WCAG 2.2 de todos los pares declarados en
// `combinaciones.ts`, en claro y en oscuro, con los valores reales de `valores.css`; peor punto de
// cada degradado (33 puntos); foco; un solo color de acento. CA-022, CA-027, CA-054, CA-056,
// CA-057 (REQ-029, REQ-030, REQ-036, REQ-085, REQ-088). Parte unitaria de PRUEBA-022: lo declarado
// cubre todos los papeles de texto y de fondo. El logotipo (sus tres variantes) lo añade la
// tarea que lo crea. La parte en navegador de PRUEBA-022 es de T-009 y T-014.
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  COMBINACIONES,
  PARES_CON_VELO,
  PROHIBIDAS,
  type Par,
} from "../../../src/components/estilos/combinaciones";
import {
  contraste,
  formatoEs,
  luminancia,
  medir,
  puntosDeDegradado,
  PUNTOS_DE_DEGRADADO,
  tono,
  UMBRAL_NO_TEXTO,
  UMBRAL_TEXTO,
} from "./apoyo/contraste";
import {
  cifrasDeProhibidasDelDocumento,
  hexARgb,
  leerValores,
  rgbAHex,
  papelesDeTema,
  resolver,
  tablasDeSeccion,
  type Tema,
} from "./apoyo/valores";

const RAIZ = resolve(import.meta.dirname, "..", "..", "..");
const valores = leerValores(
  readFileSync(resolve(RAIZ, "src/components/estilos/valores.css"), "utf8"),
);
const documento = readFileSync(resolve(RAIZ, "docs/DISENO.md"), "utf8");
const TEMAS: Tema[] = ["claro", "oscuro"];
const umbralDe = (p: Par): number => (p.tipo === "texto" ? UMBRAL_TEXTO : UMBRAL_NO_TEXTO);

describe("PRUEBA-006 · la fórmula es la de WCAG 2.2", () => {
  it("negro sobre blanco 21:1; blanco sobre blanco 1:1", () => {
    expect(contraste("#000000", "#FFFFFF")).toBeCloseTo(21, 5);
    expect(contraste("#FFFFFF", "#FFFFFF")).toBeCloseTo(1, 5);
  });
  it("#767676 sobre blanco da 4,54:1 (valor de referencia conocido)", () => {
    expect(formatoEs(contraste("#767676", "#FFFFFF"))).toBe("4,54");
  });
  it("la luminancia del blanco es 1 y la del negro 0", () => {
    expect(luminancia("#FFFFFF")).toBeCloseTo(1, 6);
    expect(luminancia("#000000")).toBe(0);
  });
  it("un degradado se mide en 33 puntos que incluyen los dos extremos", () => {
    const p = puntosDeDegradado(["#000000", "#FFFFFF"]);
    expect(p).toHaveLength(PUNTOS_DE_DEGRADADO);
    expect(PUNTOS_DE_DEGRADADO).toBe(33);
    expect(p[0]).toBe("#000000");
    expect(p[32]).toBe("#FFFFFF");
    expect(p[16]).toBe("#808080");
  });
  it("el peor punto de un degradado puede no ser un extremo", () => {
    // Gris medio sobre negro-blanco: el peor fondo es el más cercano en luminancia, en medio.
    const m = medir("#777777", "linear-gradient(to bottom, #000000, #FFFFFF)");
    expect(m.razon).toBeLessThan(contraste("#777777", "#000000"));
    expect(m.razon).toBeLessThan(contraste("#777777", "#FFFFFF"));
    expect(m.peorFondo).not.toBe("#000000");
    expect(m.peorFondo).not.toBe("#FFFFFF");
  });
});

describe.each(TEMAS)("PRUEBA-006 · todos los pares declarados cumplen su umbral (%s)", (tema) => {
  const papeles = papelesDeTema(valores, tema);
  const color = (papel: string): string => {
    const v = papeles.get(papel);
    if (v === undefined) throw new Error(`El papel ${papel} no existe`);
    return v;
  };

  it("hay pares declarados y todos usan papeles que existen", () => {
    expect(COMBINACIONES[tema].length).toBeGreaterThan(30);
    for (const p of COMBINACIONES[tema]) {
      expect(papeles.has(p.delante), `${p.delante} (${tema})`).toBe(true);
      expect(papeles.has(p.detras), `${p.detras} (${tema})`).toBe(true);
    }
  });

  it("4,5:1 en todo texto y 3:1 en lo demás, con el peor punto de cada degradado", () => {
    const fallos: string[] = [];
    for (const p of COMBINACIONES[tema]) {
      const m = medir(color(p.delante), color(p.detras));
      if (m.razon < umbralDe(p)) {
        fallos.push(
          `${p.delante} sobre ${p.detras}: ${formatoEs(m.razon)} < ${umbralDe(p)} (${p.donde})`,
        );
      }
    }
    expect(fallos).toEqual([]);
  });

  it("ningún par está repetido y todos dicen dónde se usan", () => {
    const claves = COMBINACIONES[tema].map((p) => `${p.delante}|${p.detras}`);
    expect(new Set(claves).size).toBe(claves.length);
    for (const p of COMBINACIONES[tema])
      expect(p.donde.trim().length, p.delante).toBeGreaterThan(5);
  });

  it("el foco se declara sobre todos los fondos donde se pinta y llega a 3:1 en el peor punto", () => {
    const sobre = COMBINACIONES[tema].filter((p) => p.delante === "--foco").map((p) => p.detras);
    expect(sobre.sort()).toEqual(
      [
        "--acento-suave",
        "--degradado-menu",
        "--fondo-pagina",
        "--menu-actual",
        "--superficie",
      ].sort(),
    );
    for (const f of sobre) {
      expect(medir(color("--foco"), color(f)).razon, `foco sobre ${f}`).toBeGreaterThanOrEqual(3);
    }
  });

  it("las combinaciones prohibidas no se declaran", () => {
    const declaradas = new Set(COMBINACIONES[tema].map((p) => `${p.delante}|${p.detras}`));
    for (const x of PROHIBIDAS)
      expect(declaradas.has(`${x.delante}|${x.detras}`), x.delante).toBe(false);
  });

  it("cobertura (parte unitaria de PRUEBA-022): cada papel de texto y cada fondo opaco o degradado figura en algún par", () => {
    const delante = new Set(COMBINACIONES[tema].map((p) => p.delante));
    const detras = new Set(COMBINACIONES[tema].map((p) => p.detras));
    for (const t of [
      "--texto",
      "--texto-secundario",
      "--enlace",
      "--texto-sobre-acento",
      "--correcto",
      "--aviso",
      "--error",
      "--menu-texto",
      "--menu-texto-secundario",
      "--borde-control",
      "--foco",
      "--menu-indicador",
      "--serie-1",
      "--serie-2",
      "--serie-3",
      "--serie-4",
    ]) {
      expect(delante.has(t), `${t} delante`).toBe(true);
    }
    for (const f of [
      "--fondo-pagina",
      "--superficie",
      "--acento-suave",
      "--acento",
      "--menu-actual",
      "--degradado-menu",
      "--degradado-acento",
    ]) {
      expect(detras.has(f), `${f} detrás`).toBe(true);
    }
  });
});

describe("PRUEBA-006 · los dos temas declaran los mismos pares", () => {
  it("misma lista de pares en claro y en oscuro (REQ-088: todo se cumple en los dos temas)", () => {
    const clave = (t: Tema): string[] =>
      COMBINACIONES[t].map((p) => `${p.delante}|${p.detras}|${p.tipo}`).sort();
    expect(clave("oscuro")).toEqual(clave("claro"));
  });
});

describe("PRUEBA-006 · las combinaciones prohibidas no llegan al umbral", () => {
  it.each(
    PROHIBIDAS.map((x) => [`${x.delante} sobre ${x.detras} (${x.temas.join(", ")})`, x] as const),
  )("%s", (_nombre, x) => {
    for (const tema of x.temas) {
      const papeles = papelesDeTema(valores, tema);
      const m = medir(papeles.get(x.delante)!, papeles.get(x.detras)!);
      expect(m.razon, tema).toBeLessThan(x.umbral);
    }
  });
});

describe("PRUEBA-006 · la tabla «Contraste calculado» de docs/DISENO.md dice lo que mide la prueba", () => {
  const tablas = tablasDeSeccion(documento, "Contraste calculado");
  const filas = tablas[0] ?? [];
  const papelesEn = (celda: string): string[] =>
    [...celda.matchAll(/`(--[a-z0-9-]+)`/g)].map((m) => m[1]!);

  type Medido = {
    delante: string;
    detras: string;
    tipo: Par["tipo"];
    claro: string;
    oscuro: string;
  };
  const documentados: Medido[] = filas.flatMap((f) => {
    const delante = papelesEn(f[0]!);
    const detras = f[1]!.split(" / ").map((c) => papelesEn(c)[0]!);
    const claro = f[3]!.split(" / ");
    const oscuro = f[4]!.split(" / ");
    const tipo: Par["tipo"] = f[2]!.startsWith("Texto") ? "texto" : "no-texto";
    expect(delante, f[0]).toHaveLength(1);
    expect(claro, f.join("|")).toHaveLength(detras.length);
    expect(oscuro, f.join("|")).toHaveLength(detras.length);
    return detras.map((d, i) => ({
      delante: delante[0]!,
      detras: d,
      tipo,
      claro: claro[i]!,
      oscuro: oscuro[i]!,
    }));
  });

  it("la tabla se ha leído entera", () => {
    expect(documentados.length).toBeGreaterThanOrEqual(36);
  });

  it("cada par de la tabla está declarado en combinaciones.ts, y al revés", () => {
    const clave = (p: { delante: string; detras: string; tipo: Par["tipo"] }): string =>
      `${p.delante}|${p.detras}|${p.tipo}`;
    const enTabla = documentados.map(clave).sort();
    const enCodigo = COMBINACIONES.claro.map(clave).sort();
    expect(enCodigo).toEqual(enTabla);
  });

  it("cada cifra de la tabla es la que calcula la prueba con valores.css (dos decimales, coma)", () => {
    const diferencias: string[] = [];
    for (const d of documentados) {
      for (const tema of TEMAS) {
        const papeles = papelesDeTema(valores, tema);
        const calculado = formatoEs(medir(papeles.get(d.delante)!, papeles.get(d.detras)!).razon);
        if (calculado !== d[tema]) {
          diferencias.push(
            `${d.delante} sobre ${d.detras} (${tema}): tabla ${d[tema]}, calculado ${calculado}`,
          );
        }
      }
    }
    expect(diferencias).toEqual([]);
  });

  it("la tabla de combinaciones prohibidas de la documentación coincide con PROHIBIDAS", () => {
    const deDoc = (tablas[1] ?? []).map(
      (f) => `${papelesEn(f[0]!)[0]}|${papelesEn(f[1]!)[0] ?? "--superficie"}`,
    );
    const deCodigo = PROHIBIDAS.map((x) => `${x.delante}|${x.detras}`);
    // «cualquier fondo» del borde decorativo se comprueba sobre --superficie.
    expect(deDoc.sort()).toEqual(deCodigo.sort());
  });
});

describe("PRUEBA-006 · las cifras de la tabla de combinaciones prohibidas son las calculadas", () => {
  const dif = (md: string): string[] =>
    cifrasDeProhibidasDelDocumento(md, valores).map((d) => d.detalle);

  it("cada cifra de claro y de oscuro de la tabla coincide con el cálculo con valores.css", () => {
    expect(dif(documento)).toEqual([]);
  });
  it("se han leído todas las filas", () => {
    expect((tablasDeSeccion(documento, "Contraste calculado")[1] ?? []).length).toBe(
      PROHIBIDAS.length,
    );
  });
  it("control: una cifra cambiada en el documento se detecta (claro y oscuro)", () => {
    const claro = documento.replace(/^(\| `--correcto` \| `--acento-suave` \| )4,24/m, "$14,34");
    expect(claro).not.toBe(documento);
    expect(dif(claro).join("\n")).toMatch(/--correcto.*--acento-suave.*claro/);
    const oscuro = documento.replace(/^(\| `--foco` \| `--acento` \| 1,43 \| )1,00/m, "$11,50");
    expect(oscuro).not.toBe(documento);
    expect(dif(oscuro).join("\n")).toMatch(/--foco.*--acento.*oscuro/);
  });
  it("control: una fila sin cifra legible se detecta", () => {
    const sin = documento.replace(/^(\| `--aviso` \| `--acento-suave` \| )4,25/m, "$1alta");
    expect(dif(sin).join("\n")).toMatch(/--aviso.*--acento-suave/);
  });
  it("la tabla de cálculo ya no dice que el informe de PRUEBA-006 «aún no existe»", () => {
    expect(documento).not.toMatch(/cuando exista `combinaciones\.ts`/);
    expect(documento).toMatch(/PRUEBA-006[^\n]*contraste\.test\.ts/);
  });
});

describe("PRUEBA-006 · un solo color de acento (REQ-030)", () => {
  it("todos los pasos de la rampa acento están dentro de 8 grados de tono", () => {
    const pasos = [...valores.escala]
      .filter(([k]) => k.startsWith("--escala-acento-"))
      .map(([, v]) => tono(v));
    expect(pasos.length).toBeGreaterThanOrEqual(10);
    expect(Math.max(...pasos) - Math.min(...pasos)).toBeLessThanOrEqual(8);
  });

  it("los papeles de acento, enlace, foco, indicador y serie 1 salen de la rampa acento", () => {
    for (const tema of TEMAS) {
      const papeles = papelesDeTema(valores, tema);
      const rampa = new Set(
        [...valores.escala].filter(([k]) => k.startsWith("--escala-acento-")).map(([, v]) => v),
      );
      for (const p of [
        "--acento",
        "--enlace",
        "--foco",
        "--menu-indicador",
        "--serie-1",
        "--acento-suave",
      ]) {
        expect(rampa.has(papeles.get(p)!), `${p} (${tema})`).toBe(true);
      }
    }
  });

  it("ninguna otra rampa de la escala es de tono morado", () => {
    for (const [k, v] of valores.escala) {
      if (/^--escala-(correcto|aviso|error)-/.test(k)) {
        const t = tono(v);
        expect(t < 230 || t > 290, `${k} tono ${t}`).toBe(true);
      }
    }
  });
});

describe("PRUEBA-006 · los degradados usan colores de la escala y se miden con los valores reales", () => {
  it("el degradado de cada papel se resuelve a dos colores hexadecimales", () => {
    for (const tema of TEMAS) {
      for (const p of ["--degradado-menu", "--degradado-acento"]) {
        const v = resolver(valores.claro.get(p)!, valores.escala);
        expect(v).toMatch(/^linear-gradient\(to bottom, #[0-9A-F]{6}, #[0-9A-F]{6}\)$/);
        expect(papelesDeTema(valores, tema).get(p)).toMatch(/^linear-gradient\(/);
      }
    }
  });
});

describe.each(TEMAS)("PRUEBA-006 · el velo del cajón y del panel (%s)", (tema) => {
  const papeles = papelesDeTema(valores, tema);
  const velo = /^rgb\((\d+) (\d+) (\d+) \/ ([\d.]+)\)$/.exec(papeles.get("--sombra-velo")!);
  /** Fondo que resulta de pintar el velo sobre un papel, mezclado en sRGB. */
  const bajoElVelo = (papel: string): string => {
    const [r, g, b, a] = [1, 2, 3, 4].map((i) => Number(velo![i]));
    const base = hexARgb(papeles.get(papel)!);
    return rgbAHex(
      [r!, g!, b!].map((c, i) => c * a! + base[i]! * (1 - a!)) as [number, number, number],
    );
  };

  it("el velo es un rgb con alfa, del color de la sombra del tema", () => {
    expect(velo).not.toBeNull();
    const color = rgbAHex([Number(velo![1]), Number(velo![2]), Number(velo![3])]);
    expect(color).toBe(tema === "claro" ? "#0F172A" : "#0B1120");
    expect(Number(velo![4])).toBeGreaterThanOrEqual(0.5);
  });

  it("cada par con velo llega a 3:1 sobre el fondo que queda debajo del velo", () => {
    expect(PARES_CON_VELO[tema].length).toBeGreaterThanOrEqual(4);
    const fallos: string[] = [];
    for (const p of PARES_CON_VELO[tema]) {
      const razon = contraste(papeles.get(p.delante)!, bajoElVelo(p.sobre));
      if (razon < UMBRAL_NO_TEXTO) {
        fallos.push(`${p.delante} sobre ${p.sobre} con velo: ${formatoEs(razon)} (${p.donde})`);
      }
    }
    expect(fallos).toEqual([]);
  });

  it("control: sin velo, el borde de control del panel en claro no llegaría a 3:1 con el velo", () => {
    // Por eso en claro el panel se separa por su superficie y no por su borde (ver combinaciones.ts).
    if (tema === "claro") {
      expect(contraste(papeles.get("--borde-control")!, bajoElVelo("--fondo-pagina"))).toBeLessThan(
        3,
      );
    }
    expect(contraste(papeles.get("--superficie")!, papeles.get("--fondo-pagina")!)).toBeLessThan(3);
  });
});

describe("PRUEBA-006 · la tabla «Velo» de docs/DISENO.md dice lo que mide la prueba", () => {
  it.each(TEMAS)("cada cifra de %s coincide con el cálculo", (tema) => {
    const papeles = papelesDeTema(valores, tema);
    const m = /^rgb\((\d+) (\d+) (\d+) \/ ([\d.]+)\)$/.exec(papeles.get("--sombra-velo")!)!;
    const a = Number(m[4]);
    const filas = tablasDeSeccion(documento, "Velo")[0] ?? [];
    const esperadas = PARES_CON_VELO[tema].map((p) => {
      const base = hexARgb(papeles.get(p.sobre)!);
      const bajo = rgbAHex(
        [1, 2, 3].map((i, k) => Number(m[i]) * a + base[k]! * (1 - a)) as [number, number, number],
      );
      return `${p.delante}|${p.sobre}|${formatoEs(contraste(papeles.get(p.delante)!, bajo))}`;
    });
    const columna = tema === "claro" ? 3 : 4;
    const enTabla = filas
      .filter((f) => f[columna] !== "—")
      .map((f) => {
        const d = /`(--[a-z0-9-]+)`/.exec(f[0]!)![1]!;
        const s = /`(--[a-z0-9-]+)`/.exec(f[1]!)![1]!;
        return `${d}|${s}|${f[columna]}`;
      });
    expect(enTabla.sort()).toEqual(esperadas.sort());
  });
});
