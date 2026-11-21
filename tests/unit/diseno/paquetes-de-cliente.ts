// Lista declarada de los paquetes de npm que pueden llegar al navegador: los que alcanzan los
// módulos con `"use client"` siguiendo sus importaciones (sin las de solo tipo) y, de cada
// paquete, lo que el archivo de bloqueo dice que arrastra. PRUEBA-037 compara esta lista, sin
// más ni menos, con la sacada del grafo y del bloqueo: un paquete nuevo hace fallar la prueba.
//
// Es uno de los cinco archivos que deciden el resultado (diseño, «Protección de lo que decide
// el resultado»): un cambio entra solo con el «sí» expreso del responsable.
//
// T-010 (b) (21/11/2026): primer módulo de cliente, `src/components/armazon/CajonMenu.tsx`, que
// importa `react` y `@radix-ui/react-dialog` (primitiva de T-001). La lista es la que calcula la
// prueba: esos dos y lo que arrastran según el archivo de bloqueo (27 en total). Cambio hecho con
// el «sí» de la coordinación por D-036 (tareas.md, punto 11); lo revisa el `revisor`. No entra
// `@radix-ui/react-alert-dialog` hasta T-010 (j). Cada tarea que añada un módulo de cliente vuelve
// a escribirla con lo que pida la prueba. `next`, `react` y `react-dom` cuentan como paquetes
// del marco: se listan, pero no se despliega lo que arrastran (los cubre la 002).

export const paquetesDeCliente: readonly string[] = [
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
  "react",
  "react-dom",
  "react-remove-scroll",
  "react-remove-scroll-bar",
  "react-style-singleton",
  "tslib",
  "use-callback-ref",
  "use-sidecar",
];
