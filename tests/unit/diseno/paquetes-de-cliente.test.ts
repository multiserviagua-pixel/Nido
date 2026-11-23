// PRUEBA-037, parte de la lista (020 T-003 (b)): los paquetes que alcanzan los módulos de
// cliente, sacados del grafo de módulos y del archivo de bloqueo, coinciden con los declarados
// en `paquetes-de-cliente.ts`. Un paquete nuevo hace fallar la prueba.
//
// No cubre, y figura como «no ejecutada» hasta que exista la 002: un navegador de prueba con un
// archivo alterado en su carpeta hace fallar la comprobación «interfaz» antes de ejecutar nada.
import { resolve } from "node:path";
import { afterAll, describe, expect, it, vi } from "vitest";
import { borrarArboles, crearArbol } from "./apoyo/arbol";
import { construirGrafo } from "./apoyo/grafo";
import { comparar, leerBloqueo, paquetesDeClienteDelGrafo } from "./apoyo/paquetes";
import { paquetesDeCliente } from "./paquetes-de-cliente";

// Tiempo máximo explícito: analiza el grafo de módulos; bajo carga supera los 5 s por defecto.
vi.setConfig({ testTimeout: 60_000, hookTimeout: 60_000 });

const RAIZ = resolve(import.meta.dirname, "..", "..", "..");
const bloqueo = leerBloqueo(RAIZ);

afterAll(borrarArboles);

const clienteConRecharts = {
  "src/components/graficos/Linea.tsx": `"use client";\nimport { LineChart } from "recharts";\nexport const Linea = LineChart;\n`,
};

// Lista fija de antes de T-010 (h): los paquetes de cliente sin `recharts` ni su clausura.
const listaSinRecharts: readonly string[] = [
  "@radix-ui/primitive",
  "@radix-ui/react-compose-refs",
  "@radix-ui/react-context",
  "@radix-ui/react-dialog",
  "@radix-ui/react-dismissable-layer",
  "@radix-ui/react-focus-guards",
  "@radix-ui/react-focus-scope",
  "@radix-ui/react-id",
  "@radix-ui/react-portal",
  "@radix-ui/react-presence",
  "@radix-ui/react-primitive",
  "@radix-ui/react-slot",
  "@radix-ui/react-use-callback-ref",
  "@radix-ui/react-use-controllable-state",
  "@radix-ui/react-use-effect-event",
  "@radix-ui/react-use-layout-effect",
  "aria-hidden",
  "detect-node-es",
  "get-nonce",
  "next",
  "react",
  "react-dom",
  "react-remove-scroll",
  "react-remove-scroll-bar",
  "react-style-singleton",
  "tslib",
  "use-callback-ref",
  "use-sidecar",
];

describe("PRUEBA-037 · la lista declarada es la del grafo y el bloqueo", () => {
  it("src/ de verdad: lo declarado coincide, sin más ni menos", () => {
    const real = paquetesDeClienteDelGrafo(construirGrafo(RAIZ), bloqueo);
    expect(
      real.sinBloqueo,
      "paquetes importados por un módulo de cliente que no están en el bloqueo",
    ).toEqual([]);
    expect(comparar(paquetesDeCliente, real.lista)).toEqual({ sobran: [], faltan: [] });
  });

  it("la lista declarada está ordenada y sin repetidos", () => {
    expect([...paquetesDeCliente]).toEqual([...new Set(paquetesDeCliente)].sort());
  });
});

describe("PRUEBA-037 · la prueba puede fallar", () => {
  it("un módulo de cliente que importa Recharts arrastra su árbol, tomado del bloqueo real", () => {
    const grafo = construirGrafo(crearArbol(clienteConRecharts));
    const { lista } = paquetesDeClienteDelGrafo(grafo, bloqueo);
    for (const esperado of [
      "recharts",
      "react",
      "react-is",
      "victory-vendor",
      "@reduxjs/toolkit",
    ]) {
      expect(lista, `falta ${esperado}`).toContain(esperado);
    }
    expect(lista.some((n) => n.startsWith("d3-"))).toBe(true);
    expect(lista.some((n) => n.startsWith("@types/"))).toBe(false);
    // Contra una lista fija anterior a Recharts (28 paquetes, sin `recharts` ni su clausura), el
    // paquete nuevo y lo que arrastra hacen fallar la comprobación `faltan`. No depende de lo
    // que declare hoy `paquetes-de-cliente.ts`.
    const diferencia = comparar(listaSinRecharts, lista);
    expect(diferencia.faltan).toContain("recharts");
    expect(diferencia.faltan).toContain("victory-vendor");
    expect(diferencia.faltan).toEqual(lista.filter((n) => !listaSinRecharts.includes(n)).sort());
  });

  it("declarada igual a la calculada: coincide; con uno de más o de menos: no", () => {
    const grafo = construirGrafo(crearArbol(clienteConRecharts));
    const { lista } = paquetesDeClienteDelGrafo(grafo, bloqueo);
    expect(comparar(lista, lista)).toEqual({ sobran: [], faltan: [] });
    expect(comparar([...lista, "paquete-ficticio"], lista).sobran).toEqual(["paquete-ficticio"]);
    expect(comparar(lista.slice(1), lista).faltan).toEqual([lista[0]]);
  });

  it("un paquete que solo importa un módulo de servidor no cuenta", () => {
    const grafo = construirGrafo(
      crearArbol({
        "src/app/servidor.ts": `import { LineChart } from "recharts";\nexport const x = LineChart;\n`,
      }),
    );
    expect(paquetesDeClienteDelGrafo(grafo, bloqueo).lista).toEqual([]);
  });

  it("una importación de solo tipo desde un módulo de cliente no cuenta", () => {
    const grafo = construirGrafo(
      crearArbol({
        "src/app/Cliente.tsx": `"use client";\nimport type { LineChartProps } from "recharts";\nexport type T = LineChartProps;\n`,
      }),
    );
    expect(paquetesDeClienteDelGrafo(grafo, bloqueo).lista).toEqual([]);
  });

  it("un paquete alcanzado por una importación dinámica o una reexportación sí cuenta", () => {
    const grafo = construirGrafo(
      crearArbol({
        "src/app/Cliente.tsx": `"use client";\nexport const c = () => import("./puente");\n`,
        "src/app/puente.ts": `export { LineChart } from "recharts";\n`,
      }),
    );
    expect(paquetesDeClienteDelGrafo(grafo, bloqueo).lista).toContain("recharts");
  });

  it("un paquete que no está en el bloqueo se señala", () => {
    const grafo = construirGrafo(
      crearArbol({
        "src/app/Cliente.tsx": `"use client";\nimport x from "paquete-que-no-existe";\nexport const c = x;\n`,
      }),
    );
    expect(paquetesDeClienteDelGrafo(grafo, bloqueo).sinBloqueo).toEqual(["paquete-que-no-existe"]);
  });

  it("next, react y react-dom se listan pero no arrastran su árbol", () => {
    const grafo = construirGrafo(
      crearArbol({
        "src/app/Cliente.tsx": `"use client";\nimport Link from "next/link";\nexport const c = Link;\n`,
      }),
    );
    expect(paquetesDeClienteDelGrafo(grafo, bloqueo).lista).toEqual(["next"]);
  });
});
