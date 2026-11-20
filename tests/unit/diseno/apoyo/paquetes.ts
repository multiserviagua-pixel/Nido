// Paquetes de npm que pueden llegar al navegador (PRUEBA-037, parte de la lista): los que
// alcanzan los módulos con `"use client"` siguiendo sus importaciones (sin las de solo tipo) y,
// de cada uno, lo que el archivo de bloqueo dice que arrastra (dependencias y pares
// resolubles; las opcionales son binarios de plataforma y no viajan al navegador).
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { alcanzables, type Grafo } from "./grafo";

type EntradaBloqueo = {
  dependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
  peerDependenciesMeta?: Record<string, { optional?: boolean }>;
};
export type Bloqueo = { packages: Record<string, EntradaBloqueo> };

/** Paquetes del marco: se listan, pero no se expande lo que arrastran (lo cubre la 002). */
export const PAQUETES_DEL_MARCO = new Set(["next", "react", "react-dom"]);

const MARCA = "node_modules/";

export function leerBloqueo(raiz: string): Bloqueo {
  return JSON.parse(readFileSync(join(raiz, "package-lock.json"), "utf8")) as Bloqueo;
}

function nombreDeUbicacion(ubicacion: string): string {
  return ubicacion.slice(ubicacion.lastIndexOf(MARCA) + MARCA.length);
}

function ubicar(bloqueo: Bloqueo, desde: string, nombre: string): string | null {
  let base = desde;
  for (;;) {
    const candidata = `${base}${base === "" ? "" : "/"}${MARCA}${nombre}`;
    if (candidata in bloqueo.packages) return candidata;
    if (base === "") return null;
    const corte = base.lastIndexOf(`/${MARCA}`);
    base = corte === -1 ? "" : base.slice(0, corte);
  }
}

export type ListaDePaquetes = { lista: string[]; sinBloqueo: string[] };

/** Paquetes alcanzados desde los módulos de cliente, en orden alfabético. */
export function paquetesDeClienteDelGrafo(grafo: Grafo, bloqueo: Bloqueo): ListaDePaquetes {
  const clientes = [...grafo.modulos.values()].filter((m) => m.cliente).map((m) => m.ruta);
  const directos = [...alcanzables(grafo, clientes, { incluirTipos: false }).paquetes];
  const vistos = new Set<string>();
  const sinBloqueo: string[] = [];
  const pendientes: string[] = [];
  for (const nombre of directos) {
    const ubicacion = ubicar(bloqueo, "", nombre);
    if (ubicacion === null) sinBloqueo.push(nombre);
    else pendientes.push(ubicacion);
  }
  while (pendientes.length > 0) {
    const ubicacion = pendientes.pop() as string;
    if (vistos.has(ubicacion)) continue;
    vistos.add(ubicacion);
    if (PAQUETES_DEL_MARCO.has(nombreDeUbicacion(ubicacion))) continue;
    const entrada = bloqueo.packages[ubicacion] as EntradaBloqueo;
    const hijos = new Set(Object.keys(entrada.dependencies ?? {}));
    for (const par of Object.keys(entrada.peerDependencies ?? {})) {
      if (entrada.peerDependenciesMeta?.[par]?.optional !== true) hijos.add(par);
    }
    for (const hijo of hijos) {
      const destino = ubicar(bloqueo, ubicacion, hijo);
      if (destino !== null) pendientes.push(destino);
    }
  }
  const nombres = new Set([...vistos].map(nombreDeUbicacion));
  const lista = [...nombres].filter((n) => !n.startsWith("@types/")).sort();
  return { lista, sinBloqueo: sinBloqueo.sort() };
}

export function comparar(
  declarada: readonly string[],
  calculada: readonly string[],
): { sobran: string[]; faltan: string[] } {
  const d = new Set(declarada);
  const c = new Set(calculada);
  return {
    sobran: [...d].filter((x) => !c.has(x)).sort(),
    faltan: [...c].filter((x) => !d.has(x)).sort(),
  };
}
