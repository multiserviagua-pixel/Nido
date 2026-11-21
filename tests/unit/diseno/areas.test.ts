// T-010 (a) · PRUEBA-012 (áreas): listas cerradas de áreas del armazón (REQ-003, REQ-010; CA-002).
// Superadmin de la fase 3: exactamente Resumen, Clientes, Órdenes, Auditoría y Ajustes, en ese
// orden, sin entradas desactivadas ni de fases posteriores. El juego de cliente es el de la muestra.
import { describe, expect, it } from "vitest";
import {
  AREAS_CLIENTE_MUESTRA,
  AREAS_SUPERADMIN,
  type Area,
} from "../../../src/components/armazon/areas";
import { ICONOS } from "../../../src/components/iconos";
import { TEXTOS } from "../../../src/components/textos";

const JUEGOS: Array<[string, readonly Area[]]> = [
  ["superadmin", AREAS_SUPERADMIN],
  ["cliente de la muestra", AREAS_CLIENTE_MUESTRA],
];

describe("PRUEBA-012 · áreas de superadmin", () => {
  it("son exactamente cinco, con este orden y estas claves y etiquetas", () => {
    expect(AREAS_SUPERADMIN.map((a) => a.clave)).toEqual([
      "resumen",
      "clientes",
      "ordenes",
      "auditoria",
      "ajustes",
    ]);
    expect(AREAS_SUPERADMIN.map((a) => a.etiqueta)).toEqual([
      "Resumen",
      "Clientes",
      "Órdenes",
      "Auditoría",
      "Ajustes",
    ]);
  });

  it("las rutas cuelgan de /admin y no hay ninguna de fases posteriores", () => {
    expect(AREAS_SUPERADMIN.map((a) => a.ruta)).toEqual([
      "/admin",
      "/admin/clientes",
      "/admin/ordenes",
      "/admin/auditoria",
      "/admin/ajustes",
    ]);
    const texto = JSON.stringify(AREAS_SUPERADMIN).toLowerCase();
    for (const prohibida of ["versiones", "facturacion", "alertas", "proximamente"]) {
      expect(texto, prohibida).not.toContain(prohibida);
    }
  });
});

describe("PRUEBA-012 · áreas de cliente de la muestra", () => {
  it("son Resumen, Actividad, Suscripción y Cuenta, en ese orden", () => {
    expect(AREAS_CLIENTE_MUESTRA.map((a) => a.clave)).toEqual([
      "resumen",
      "actividad",
      "suscripcion",
      "cuenta",
    ]);
    expect(AREAS_CLIENTE_MUESTRA.map((a) => a.etiqueta)).toEqual([
      "Resumen",
      "Actividad",
      "Suscripción",
      "Cuenta",
    ]);
  });
});

describe.each(JUEGOS)("PRUEBA-012 · forma de las áreas de %s", (_nombre, areas) => {
  it("cada área solo tiene clave, etiqueta, ruta e icono: no admite entradas desactivadas", () => {
    for (const a of areas) {
      expect(Object.keys(a).sort()).toEqual(["clave", "etiqueta", "icono", "ruta"]);
    }
  });

  it("claves, etiquetas y rutas sin repetir; claves en minúscula sin tildes", () => {
    for (const campo of ["clave", "etiqueta", "ruta"] as const) {
      const valores = areas.map((a) => a[campo]);
      expect(new Set(valores).size, campo).toBe(valores.length);
    }
    for (const a of areas) expect(a.clave).toMatch(/^[a-z]+$/);
  });

  it("las etiquetas salen de textos.ts y los iconos existen", () => {
    const etiquetas = new Set<string>(Object.values(TEXTOS.areas));
    for (const a of areas) {
      expect(etiquetas.has(a.etiqueta), a.etiqueta).toBe(true);
      expect(Object.keys(ICONOS), a.icono).toContain(a.icono);
    }
  });

  it("las rutas son internas y sin consulta, fragmento ni identificador", () => {
    for (const a of areas) {
      expect(a.ruta).toMatch(/^\/(?:admin|panel)(?:\/[a-z]+)?$/);
    }
  });

  it("están congeladas: no se puede añadir ni cambiar una entrada en ejecución", () => {
    expect(Object.isFrozen(areas)).toBe(true);
    for (const a of areas) expect(Object.isFrozen(a)).toBe(true);
  });
});
