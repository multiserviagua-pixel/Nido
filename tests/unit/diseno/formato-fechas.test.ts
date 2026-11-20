// T-007 (a) · PRUEBA-001 (fechas) y PRUEBA-002: formato de fechas y horas en la hora de Madrid,
// con el proceso en UTC, Nueva York y Tokio. Los instantes son los de CA-037 y CA-038.
import { readFileSync } from "node:fs";
import { afterEach, describe, expect, it } from "vitest";
import {
  diaDeMadrid,
  formatearFecha,
  formatearFechaHora,
  formatearPeriodo,
} from "../../../src/components/formato/fechas";

const ZONAS = ["UTC", "America/New_York", "Asia/Tokyo"] as const;
const ZONA_ORIGINAL = process.env.TZ;

function enZona(zona: string, cuerpo: () => void): void {
  process.env.TZ = zona;
  cuerpo();
}

afterEach(() => {
  if (ZONA_ORIGINAL === undefined) delete process.env.TZ;
  else process.env.TZ = ZONA_ORIGINAL;
});

const CASOS_DE_FECHA_HORA: ReadonlyArray<readonly [string, string]> = [
  // CA-037 y CA-038
  ["2026-11-12T07:04:00Z", "12 nov 2026, 08:04"],
  ["2026-07-01T06:04:00Z", "1 jul 2026, 08:04"],
  ["2026-03-29T01:30:00Z", "29 mar 2026, 03:30"],
  ["2026-10-25T00:30:00Z", "25 oct 2026, 02:30 (hora de verano)"],
  ["2026-10-25T01:30:00Z", "25 oct 2026, 02:30 (hora de invierno)"],
  // Alrededor de los dos cambios de hora.
  ["2026-03-29T00:59:00Z", "29 mar 2026, 01:59"],
  ["2026-03-29T01:00:00Z", "29 mar 2026, 03:00"],
  ["2026-10-24T23:59:00Z", "25 oct 2026, 01:59"],
  ["2026-10-25T00:00:00Z", "25 oct 2026, 02:00 (hora de verano)"],
  ["2026-10-25T00:59:00Z", "25 oct 2026, 02:59 (hora de verano)"],
  ["2026-10-25T01:00:00Z", "25 oct 2026, 02:00 (hora de invierno)"],
  ["2026-10-25T01:59:00Z", "25 oct 2026, 02:59 (hora de invierno)"],
  ["2026-10-25T02:00:00Z", "25 oct 2026, 03:00"],
  // Medianoche: nunca «24:30», y el día cambia con la hora de Madrid, no con la del proceso.
  ["2026-11-12T23:30:00Z", "13 nov 2026, 00:30"],
  ["2026-12-31T23:30:00Z", "1 ene 2027, 00:30"],
];

const MESES: ReadonlyArray<readonly [string, string]> = [
  ["2026-01-15T12:00:00Z", "15 ene 2026, 13:00"],
  ["2026-02-15T12:00:00Z", "15 feb 2026, 13:00"],
  ["2026-03-15T12:00:00Z", "15 mar 2026, 13:00"],
  ["2026-04-15T12:00:00Z", "15 abr 2026, 14:00"],
  ["2026-05-15T12:00:00Z", "15 may 2026, 14:00"],
  ["2026-06-15T12:00:00Z", "15 jun 2026, 14:00"],
  ["2026-07-15T12:00:00Z", "15 jul 2026, 14:00"],
  ["2026-08-15T12:00:00Z", "15 ago 2026, 14:00"],
  ["2026-09-15T12:00:00Z", "15 sep 2026, 14:00"],
  ["2026-10-15T12:00:00Z", "15 oct 2026, 14:00"],
  ["2026-11-15T12:00:00Z", "15 nov 2026, 13:00"],
  ["2026-12-15T12:00:00Z", "15 dic 2026, 13:00"],
];

describe("PRUEBA-002 · la zona del proceso no cambia lo que se ve", () => {
  it("las tres zonas son realmente distintas para el motor (la prueba no es vacía)", () => {
    const instante = new Date("2026-11-12T07:04:00Z");
    const horas = new Set<number>();
    for (const zona of ZONAS) {
      enZona(zona, () => horas.add(instante.getHours()));
    }
    expect(horas.size).toBe(3);
  });

  for (const zona of ZONAS) {
    describe(`con el proceso en ${zona}`, () => {
      for (const [entrada, esperado] of CASOS_DE_FECHA_HORA) {
        it(`${entrada} -> ${esperado}`, () => {
          enZona(zona, () => {
            expect(formatearFechaHora(entrada)).toBe(esperado);
            expect(formatearFechaHora(new Date(entrada))).toBe(esperado);
            expect(formatearFechaHora(Date.parse(entrada))).toBe(esperado);
          });
        });
      }

      it("formatearFecha, formatearPeriodo y diaDeMadrid usan el día de Madrid", () => {
        enZona(zona, () => {
          expect(formatearFecha("2026-11-12T23:30:00Z")).toBe("13 nov 2026");
          expect(formatearFecha("2026-11-12T07:04:00Z")).toBe("12 nov 2026");
          expect(diaDeMadrid("2026-11-12T23:30:00Z")).toBe("2026-11-13");
          expect(diaDeMadrid("2026-11-12T22:59:00Z")).toBe("2026-11-12");
          expect(diaDeMadrid("2026-03-29T01:30:00Z")).toBe("2026-03-29");
          expect(formatearPeriodo("2026-10-13T22:00:00Z", "2026-11-12T10:00:00Z")).toBe(
            "14 oct – 12 nov 2026",
          );
        });
      });
    });
  }
});

describe("PRUEBA-001 · formato de fechas", () => {
  it("los doce meses salen de la lista propia", () => {
    for (const [entrada, esperado] of MESES) {
      expect(formatearFechaHora(entrada)).toBe(esperado);
    }
  });

  it("formatearFecha no lleva hora", () => {
    expect(formatearFecha("2026-07-01T06:04:00Z")).toBe("1 jul 2026");
  });

  it("formatearPeriodo: mismo año, años distintos, mismo día", () => {
    expect(formatearPeriodo("2025-12-29T23:30:00Z", "2026-01-12T10:00:00Z")).toBe(
      "30 dic 2025 – 12 ene 2026",
    );
    expect(formatearPeriodo("2026-11-12T08:00:00Z", "2026-11-12T20:00:00Z")).toBe("12 nov 2026");
    expect(formatearPeriodo("2026-01-01T12:00:00Z", "2026-01-31T12:00:00Z")).toBe(
      "1 ene – 31 ene 2026",
    );
  });

  it("formatearPeriodo con el fin antes que el principio no inventa un periodo", () => {
    expect(formatearPeriodo("2026-11-12T10:00:00Z", "2026-10-13T22:00:00Z")).toBe("Sin datos");
  });

  it("cierra en fallo: lo que no es un instante válido es «Sin datos», nunca una fecha inventada", () => {
    const invalidos: unknown[] = [
      undefined,
      null,
      "",
      "ayer",
      "2026-11-12",
      "12/11/2026",
      "2026-13-45T00:00:00Z",
      "2026-11-12T07:04:00",
      Number.NaN,
      Number.POSITIVE_INFINITY,
      new Date("no es una fecha"),
      {},
      [],
      true,
    ];
    for (const valor of invalidos) {
      expect(formatearFechaHora(valor)).toBe("Sin datos");
      expect(formatearFecha(valor)).toBe("Sin datos");
      expect(diaDeMadrid(valor)).toBeNull();
    }
    expect(formatearPeriodo(null, "2026-11-12T10:00:00Z")).toBe("Sin datos");
    expect(formatearPeriodo("2026-11-12T10:00:00Z", undefined)).toBe("Sin datos");
  });

  it("un día que no existe no se convierte en otra fecha (REQ-047)", () => {
    const inexistentes: unknown[] = [
      "2026-02-30T10:00:00Z",
      "2026-02-29T10:00:00Z",
      "2026-04-31T10:00:00Z",
      "2026-00-10T10:00:00Z",
      "2026-11-00T10:00:00Z",
      "2026-11-12T24:00:00Z",
      "2026-11-12T10:60:00Z",
      "2026-11-12T10:00:60Z",
    ];
    for (const valor of inexistentes) {
      expect(formatearFechaHora(valor), String(valor)).toBe("Sin datos");
      expect(diaDeMadrid(valor)).toBeNull();
    }
    // Los bisiestos sí existen.
    expect(formatearFecha("2028-02-29T10:00:00Z")).toBe("29 feb 2028");
    expect(formatearFecha("2000-02-29T10:00:00Z")).toBe("29 feb 2000");
    expect(formatearFecha("1900-02-29T10:00:00Z")).toBe("Sin datos");
  });

  it("acota los años a 1000-9999 (REQ-047)", () => {
    for (const valor of [
      "0999-12-31T10:00:00Z",
      "0001-01-01T10:00:00Z",
      new Date(Date.UTC(999, 5, 1)),
      new Date(Date.UTC(10000, 0, 2)),
    ]) {
      expect(formatearFecha(valor)).toBe("Sin datos");
      expect(diaDeMadrid(valor)).toBeNull();
    }
    expect(formatearFecha("1000-01-02T10:00:00Z")).toBe("2 ene 1000");
    expect(formatearFecha("9999-06-15T10:00:00Z")).toBe("15 jun 9999");
  });

  it("acepta una cadena ISO con desplazamiento horario", () => {
    expect(formatearFechaHora("2026-11-12T08:04:00+01:00")).toBe("12 nov 2026, 08:04");
    expect(formatearFechaHora("2026-11-12T08:04:00.123Z")).toBe("12 nov 2026, 09:04");
  });

  it("no usa la localización ni la zona del navegador ni los nombres de mes del motor", () => {
    const codigo = readFileSync("src/components/formato/fechas.ts", "utf8")
      .split("\n")
      .filter((linea) => !linea.trim().startsWith("//") && !linea.trim().startsWith("*"))
      .join("\n");
    expect(codigo).not.toMatch(/toLocale|getHours|getMinutes|getDate\(|getMonth|getFullYear/);
    expect(codigo).not.toMatch(/month:\s*["'](short|long)["']/);
    expect(codigo).not.toMatch(/Intl\.NumberFormat/);
    expect(codigo).toContain('"es-ES"');
    expect(codigo).toContain('"Europe/Madrid"');
  });
});
