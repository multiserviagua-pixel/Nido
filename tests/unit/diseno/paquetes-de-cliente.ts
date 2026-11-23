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
//
// T-010 (e) (22/11/2026): entra `next` (paquete del marco, sin su árbol) porque `SelectorPeriodo`
// importa `next/navigation` para el cambio de periodo con `router.replace` (diseño 020, «Una vista
// en uso», «Cambio de periodo», y «Coste»). Es la única importación de `next` en `src/components/`
// (PRUEBA-008). El marco ya está en el navegador: no llega código nuevo. Cambio hecho con el «sí»
// de la coordinación por D-036 (22/11/2026) que nombra esta ruta; lo revisa el `revisor`.
//
// T-010 (h) (23/11/2026): entra `recharts` con su clausura de dependencias (29 paquetes; los que
// llevan comentario), porque `DibujoConRecharts.tsx` es un módulo de cliente que lo importa
// (diseño 020, gráficos). La lista es la que calcula la prueba según el archivo de bloqueo. Cambio
// hecho con el «sí» de la coordinación por D-036 (23/11/2026) que nombra esta ruta; solo se añaden
// datos a la lista, sin tocar la lógica de PRUEBA-037; lo revisa el `revisor`.

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
  "@reduxjs/toolkit", // dependencia de recharts, arrastrada por DibujoConRecharts.tsx
  "@standard-schema/spec", // dependencia de recharts, arrastrada por DibujoConRecharts.tsx
  "@standard-schema/utils", // dependencia de recharts, arrastrada por DibujoConRecharts.tsx
  "aria-hidden",
  "clsx", // dependencia de recharts, arrastrada por DibujoConRecharts.tsx
  "d3-array", // dependencia de recharts, arrastrada por DibujoConRecharts.tsx
  "d3-color", // dependencia de recharts, arrastrada por DibujoConRecharts.tsx
  "d3-ease", // dependencia de recharts, arrastrada por DibujoConRecharts.tsx
  "d3-format", // dependencia de recharts, arrastrada por DibujoConRecharts.tsx
  "d3-interpolate", // dependencia de recharts, arrastrada por DibujoConRecharts.tsx
  "d3-path", // dependencia de recharts, arrastrada por DibujoConRecharts.tsx
  "d3-scale", // dependencia de recharts, arrastrada por DibujoConRecharts.tsx
  "d3-shape", // dependencia de recharts, arrastrada por DibujoConRecharts.tsx
  "d3-time", // dependencia de recharts, arrastrada por DibujoConRecharts.tsx
  "d3-time-format", // dependencia de recharts, arrastrada por DibujoConRecharts.tsx
  "d3-timer", // dependencia de recharts, arrastrada por DibujoConRecharts.tsx
  "decimal.js-light", // dependencia de recharts, arrastrada por DibujoConRecharts.tsx
  "detect-node-es",
  "es-toolkit", // dependencia de recharts, arrastrada por DibujoConRecharts.tsx
  "eventemitter3", // dependencia de recharts, arrastrada por DibujoConRecharts.tsx
  "get-nonce",
  "immer", // dependencia de recharts, arrastrada por DibujoConRecharts.tsx
  "internmap", // dependencia de recharts, arrastrada por DibujoConRecharts.tsx
  "next",
  "react",
  "react-dom",
  "react-is", // dependencia de recharts, arrastrada por DibujoConRecharts.tsx
  "react-redux", // dependencia de recharts, arrastrada por DibujoConRecharts.tsx
  "react-remove-scroll",
  "react-remove-scroll-bar",
  "react-style-singleton",
  "recharts", // paquete de gráficos; lo importa DibujoConRecharts.tsx
  "redux", // dependencia de recharts, arrastrada por DibujoConRecharts.tsx
  "redux-thunk", // dependencia de recharts, arrastrada por DibujoConRecharts.tsx
  "reselect", // dependencia de recharts, arrastrada por DibujoConRecharts.tsx
  "tiny-invariant", // dependencia de recharts, arrastrada por DibujoConRecharts.tsx
  "tslib",
  "use-callback-ref",
  "use-sidecar",
  "use-sync-external-store", // dependencia de recharts, arrastrada por DibujoConRecharts.tsx
  "victory-vendor", // dependencia de recharts, arrastrada por DibujoConRecharts.tsx
];
