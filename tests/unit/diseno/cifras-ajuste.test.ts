// T-010 (e) · lógica pura del ajuste del tamaño del valor de `TarjetaCifra` (diseño 020, «Componentes
// base», fila `TarjetaCifra`: «el valor nunca se abrevia ni se corta: el tamaño de letra baja por
// pasos de la escala hasta que cabe»; REQ-081, CA-050). El valor no puede llevar `style` (PRUEBA-005),
// así que el tamaño es una clase por paso; aquí se prueba qué paso se elige. Que cabe de verdad lo
// mide `cifras-y-etiquetas.spec.ts` en navegador.
import { describe, expect, it } from "vitest";
import {
  CLASE_DE_PASO,
  PASOS_DE_CIFRA,
  elegirPaso,
  leerTamanos,
  pasoInicial,
} from "../../../src/components/cifras/ajuste";

const TAMANOS = [30, 24, 18, 16, 14, 12] as const;

describe("pasos de la escala del valor", () => {
  it("son los de la escala de docs/DISENO.md, de mayor a menor, con una clase por paso", () => {
    expect([...PASOS_DE_CIFRA]).toEqual([
      "cifra",
      "titulo",
      "subtitulo",
      "cuerpo",
      "cuerpo-menor",
      "pequeno",
    ]);
    for (const paso of PASOS_DE_CIFRA) expect(CLASE_DE_PASO[paso]).toBe(`text-${paso}`);
  });

  it("leerTamanos lee los píxeles de las variables de la escala, o nada si falta alguna", () => {
    const leer = (nombre: string): string =>
      ({
        "--escala-texto-cifra": "30px",
        "--escala-texto-titulo": " 24px",
        "--escala-texto-subtitulo": "18px",
        "--escala-texto-cuerpo": "16px",
        "--escala-texto-cuerpo-menor": "14px",
        "--escala-texto-pequeno": "12px",
      })[nombre] ?? "";
    expect(leerTamanos(leer)).toEqual([...TAMANOS]);
    expect(leerTamanos(() => "")).toBeNull();
    expect(leerTamanos((n) => (n.endsWith("pequeno") ? "grande" : "10px"))).toBeNull();
  });
});

describe("pasoInicial: el paso de partida según los caracteres (sin JavaScript, cabe a 320 px)", () => {
  it("una cifra corriente y 999.999.999 se pintan en el paso mayor", () => {
    expect(pasoInicial("0")).toBe(0);
    expect(pasoInicial("1.234")).toBe(0);
    expect(pasoInicial("999.999.999")).toBe(0);
  });

  it("baja de paso a medida que el texto crece y nunca pasa del último", () => {
    const largo = (n: number): number => pasoInicial("9".repeat(n));
    let anterior = -1;
    for (let n = 1; n <= 80; n++) {
      const paso = largo(n);
      expect(paso, `${n} caracteres`).toBeGreaterThanOrEqual(anterior);
      expect(paso).toBeLessThanOrEqual(PASOS_DE_CIFRA.length - 1);
      anterior = paso;
    }
    expect(largo(16)).toBeGreaterThan(0);
    expect(largo(80)).toBe(PASOS_DE_CIFRA.length - 1);
  });

  it("un valor que no es texto o está vacío cae en el paso mayor", () => {
    expect(pasoInicial("")).toBe(0);
    expect(pasoInicial(undefined as unknown as string)).toBe(0);
  });
});

describe("elegirPaso: el mayor paso que cabe, a partir de lo medido", () => {
  const base = { tamanos: TAMANOS, actual: 0, puedeSubir: false };

  it("si cabe, se queda", () => {
    expect(elegirPaso({ ...base, natural: 180, disponible: 250 })).toBe(0);
  });

  it("si no cabe, baja al mayor paso cuyo tamaño proporcional cabe", () => {
    // A 30 px mide 300; hay 250: caben hasta 25 px, y el mayor paso por debajo es 24 (índice 1).
    expect(elegirPaso({ ...base, natural: 300, disponible: 250 })).toBe(1);
    // Hay 150: caben 15 px; el mayor paso es 14 (índice 4).
    expect(elegirPaso({ ...base, natural: 300, disponible: 150 })).toBe(4);
  });

  it("si ni el último paso cabe, devuelve el último (el texto se parte, no se corta)", () => {
    expect(elegirPaso({ ...base, natural: 900, disponible: 100 })).toBe(TAMANOS.length - 1);
  });

  it("deja un píxel de margen: lo que cabe justo baja un paso", () => {
    expect(elegirPaso({ ...base, natural: 250, disponible: 250 })).toBe(1);
  });

  it("solo sube de paso si puede (cuando ha cambiado el ancho); nunca baja de más", () => {
    const desdeUnPasoMenor = { tamanos: TAMANOS, actual: 3, natural: 100, disponible: 400 };
    expect(elegirPaso({ ...desdeUnPasoMenor, puedeSubir: false })).toBe(3);
    // A 16 px mide 100: con 400 caben 63 px; el mayor paso es el 0.
    expect(elegirPaso({ ...desdeUnPasoMenor, puedeSubir: true })).toBe(0);
  });

  it("medidas imposibles (cero, negativas, no finitas) no cambian nada", () => {
    for (const [natural, disponible] of [
      [0, 100],
      [100, 0],
      [-1, 100],
      [100, -5],
      [Number.NaN, 100],
      [100, Number.POSITIVE_INFINITY],
    ] as const) {
      expect(
        elegirPaso({ ...base, actual: 2, natural, disponible }),
        `${natural}/${disponible}`,
      ).toBe(2);
    }
  });
});
