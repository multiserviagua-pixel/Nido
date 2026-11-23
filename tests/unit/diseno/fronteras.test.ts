// PRUEBA-008 (parte de fronteras, 020 T-003 (a)): sobre el grafo de módulos resuelto (alias,
// importaciones dinámicas y reexportaciones incluidos). Tres cosas:
//  1. `src/` de verdad cumple las fronteras (hoy casi vacío: la prueba ya manda cuando crezca).
//  2. Cada regla detecta lo que dice detectar: se siembra un fallo por regla en un árbol
//     temporal y la comprobación tiene que verlo. Una regla que no puede fallar no vale.
//  3. Las excepciones son las tres del diseño y ninguna más; sin ellas, el árbol limpio falla.
//
// No cubre, y queda para las tareas que crean sus archivos: cada icono en `LICENCIAS.md`, el
// logotipo en SVG y el inventario del diseño frente al de la muestra (T-006, T-007, T-005).
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterAll, describe, expect, it, vi } from "vitest";
import { excepcionesDeImportacion } from "./excepciones";
import { borrarArboles, crearArbol } from "./apoyo/arbol";
import { ARBOL_LIMPIO } from "./apoyo/arbol-limpio";
import { comprobarFronteras, type Hallazgo } from "./apoyo/fronteras";
import { construirGrafo } from "./apoyo/grafo";

const RAIZ = resolve(import.meta.dirname, "..", "..", "..");

// Tiempo máximo explícito: siembra árboles y analiza el grafo; bajo la carga de la suite completa
// supera los 5 s por defecto. No cambia lo que se comprueba.
vi.setConfig({ testTimeout: 60_000, hookTimeout: 60_000 });

afterAll(borrarArboles);

function hallazgosDe(cambios: Record<string, string>, quitar: string[] = []): Hallazgo[] {
  const archivos = { ...ARBOL_LIMPIO, ...cambios };
  for (const q of quitar) delete archivos[q];
  return comprobarFronteras(construirGrafo(crearArbol(archivos)));
}

describe("PRUEBA-008 · src/ cumple las fronteras", () => {
  const grafo = construirGrafo(RAIZ);

  it("no hay ningún hallazgo en src/", () => {
    expect(comprobarFronteras(grafo)).toEqual([]);
  });

  it("el grafo es real: resuelve rutas relativas, tipos y paquetes de src/ (no está vacío)", () => {
    expect(grafo.modulos.size).toBeGreaterThan(5);
    // No depende de un archivo concreto: basta con que alguna arista interna se resuelva a un
    // archivo real de src/ y que alguna otra sea de un paquete.
    const todas = [...grafo.modulos.values()].flatMap((m) => m.aristas);
    expect(todas.some((a) => a.hacia?.startsWith("src/") && grafo.modulos.has(a.hacia))).toBe(true);
    expect(todas.some((a) => a.paquete !== null)).toBe(true);
    expect(todas.some((a) => a.soloTipo)).toBe(true);
  });

  it("el alias @/ del grafo es el de tsconfig.json", () => {
    const configuracion = JSON.parse(readFileSync(resolve(RAIZ, "tsconfig.json"), "utf8")) as {
      compilerOptions: { paths: Record<string, string[]> };
    };
    expect(configuracion.compilerOptions.paths).toEqual({ "@/*": ["./src/*"] });
  });
});

describe("PRUEBA-008 · control positivo: el árbol sembrado limpio no da hallazgos", () => {
  it("cumple todas las reglas, con las tres excepciones y todos los envoltorios", () => {
    expect(hallazgosDe({})).toEqual([]);
  });

  it("una página que llama a la comprobación con await, como primera instrucción, vale", () => {
    const h = hallazgosDe({
      "src/app/muestra/otra/page.muestra.tsx": `import { comprobarAccesoMuestra } from "../_datos/acceso-muestra";\nexport default async function P() {\n  await comprobarAccesoMuestra();\n  return null;\n}\n`,
    });
    expect(h).toEqual([]);
  });

  it("una importación de solo tipo hacia sin-acceso desde un módulo de cliente no cuenta", () => {
    const h = hallazgosDe({
      "src/app/otra/Cliente.tsx": `"use client";\nimport type { sinAcceso } from "../../lib/errores/sin-acceso";\nexport type T = typeof sinAcceso;\n`,
    });
    expect(h.filter((x) => x.regla.startsWith("R4"))).toEqual([]);
  });
});

type Caso = {
  nombre: string;
  cambios: Record<string, string>;
  regla: string;
  archivo?: string;
  detalle?: string;
};

const casos: Caso[] = [
  // R1: importaciones de src/lib
  {
    nombre: "alias @/ hacia supabase desde un componente",
    cambios: {
      "src/components/textos.ts": `import { clienteBd } from "@/lib/supabase/cliente";\nexport const t = clienteBd;\n`,
    },
    regla: "R1 importa src/lib",
    archivo: "src/components/textos.ts",
  },
  {
    nombre: "ruta relativa hacia oauth desde un componente",
    cambios: {
      "src/components/cifras/Tarjeta.tsx": `import { token } from "../../lib/oauth/token";\nexport const T = token;\n`,
    },
    regla: "R1 importa src/lib",
  },
  {
    nombre: "importación dinámica hacia licencias desde un componente",
    cambios: {
      "src/components/cifras/Tarjeta.tsx": `export const cargar = () => import("../../lib/licencias/licencia");\n`,
    },
    regla: "R1 importa src/lib",
  },
  {
    nombre: "require hacia stripe desde la muestra",
    cambios: {
      "src/app/muestra/_datos/otro.ts": `export const p = require("../../../lib/stripe/pagos");\n`,
    },
    regla: "R1 importa src/lib",
  },
  {
    nombre: "reexportación: el componente importa un puente que reexporta stripe",
    cambios: {
      "src/components/cifras/Tarjeta.tsx": `import { pagos } from "../../puente";\nexport const T = pagos;\n`,
      "src/puente.ts": `export * from "./lib/stripe/pagos";\n`,
    },
    regla: "R1 llega a una carpeta prohibida de src/lib",
    archivo: "src/components/cifras/Tarjeta.tsx",
  },
  {
    nombre: "puente con importación dinámica hasta supabase, dos saltos",
    cambios: {
      "src/components/cifras/Tarjeta.tsx": `import { a } from "../../puente-a";\nexport const T = a;\n`,
      "src/puente-a.ts": `export const a = () => import("./puente-b");\n`,
      "src/puente-b.ts": `export { clienteBd } from "@/lib/supabase/cliente";\n`,
    },
    regla: "R1 llega a una carpeta prohibida de src/lib",
  },
  {
    nombre: "otro archivo de _datos/ (no acceso-muestra.ts) lee el entorno",
    cambios: {
      "src/app/muestra/_datos/otro.ts": `import { leerEntorno } from "../../../lib/plataforma/configuracion";\nexport const e = leerEntorno;\n`,
    },
    regla: "R1 importa src/lib",
    archivo: "src/app/muestra/_datos/otro.ts",
  },
  {
    nombre: "acceso-muestra.ts importa algo más que el entorno (el registro)",
    cambios: {
      "src/app/muestra/_datos/acceso-muestra.ts": `import { registrar } from "../../../lib/registro/registro";\nexport async function comprobarAccesoMuestra(): Promise<void> { registrar(); }\n`,
    },
    regla: "R1 importa src/lib",
  },
  {
    nombre: "una página de la muestra fuera de servidor/ importa sin-acceso.ts",
    cambios: {
      "src/app/muestra/otra/page.muestra.tsx": `import { comprobarAccesoMuestra } from "../_datos/acceso-muestra";\nimport { sinAcceso } from "../../../lib/errores/sin-acceso";\nexport default async function P() {\n  await comprobarAccesoMuestra();\n  return sinAcceso;\n}\n`,
    },
    regla: "R1 importa src/lib",
  },
  {
    nombre: "un componente importa fallo-servidor.ts",
    cambios: {
      "src/components/cifras/Tarjeta.tsx": `import { registrarFallo } from "../../lib/errores/fallo-servidor";\nexport const T = registrarFallo;\n`,
    },
    regla: "R1 importa src/lib",
  },
  // M-1: reexportaciones fuera de las carpetas vetadas
  {
    nombre: "componente -> puente fuera de lib que reexporta con alias el registro",
    cambios: {
      "src/components/cifras/Tarjeta.tsx": `import { r } from "../../puente";
export const T = r;
`,
      "src/puente.ts": `export { registrar as r } from "./lib/registro/registro";
`,
    },
    regla: "R1 importa src/lib",
    archivo: "src/components/cifras/Tarjeta.tsx",
  },
  {
    nombre: "componente -> puente que reexporta fallo-servidor.ts",
    cambios: {
      "src/components/cifras/Tarjeta.tsx": `import { r } from "../../puente";
export const T = r;
`,
      "src/puente.ts": `export { registrarFallo as r } from "./lib/errores/fallo-servidor";
`,
    },
    regla: "R1 importa src/lib",
    archivo: "src/components/cifras/Tarjeta.tsx",
  },
  {
    nombre: "muestra -> dos puentes encadenados -> sin-acceso.ts fuera de servidor/",
    cambios: {
      "src/app/muestra/otra/page.muestra.tsx": `import { comprobarAccesoMuestra } from "../_datos/acceso-muestra";
import { s } from "../../../puente-a";
export default async function P() {
  await comprobarAccesoMuestra();
  return s;
}
`,
      "src/puente-a.ts": `export * from "./puente-b";
`,
      "src/puente-b.ts": `export { sinAcceso as s } from "./lib/errores/sin-acceso";
`,
    },
    regla: "R1 importa src/lib",
    archivo: "src/app/muestra/otra/page.muestra.tsx",
  },
  // R2: red
  ...[
    ["fetch directo", `export const f = () => fetch("/x");\n`],
    ["globalThis.fetch", `export const f = () => globalThis.fetch("/x");\n`],
    ['window["fetch"]', `export const f = () => (window as never)["fetch"];\n`],
    ["XMLHttpRequest", `export const f = () => new XMLHttpRequest();\n`],
    ["WebSocket", `export const f = () => new WebSocket("wss://example.invalid");\n`],
    ["EventSource", `export const f = () => new EventSource("/e");\n`],
    ["sendBeacon", `export const f = () => navigator.sendBeacon("/b", "x");\n`],
  ].map(([nombre, codigo]): Caso => ({
    nombre: `${nombre} en un componente`,
    cambios: { "src/components/cifras/Tarjeta.tsx": codigo as string },
    regla: "R2 llamada de red",
    archivo: "src/components/cifras/Tarjeta.tsx",
  })),
  {
    nombre: "fetch en un archivo de la muestra",
    cambios: { "src/app/muestra/_datos/datos.ts": `export const f = () => fetch("/muestra/x");\n` },
    regla: "R2 llamada de red",
  },
  // R3: librerías confinadas
  {
    nombre: "Radix en una tabla",
    cambios: {
      "src/components/tabla/Tabla.tsx": `import * as D from "@radix-ui/react-dialog";\nexport const T = D;\n`,
    },
    regla: "R3 Radix fuera de su envoltorio",
  },
  {
    nombre: "el paquete único radix-ui en cualquier sitio",
    cambios: { "src/app/otra/x.tsx": `import * as R from "radix-ui";\nexport const T = R;\n` },
    regla: "R3 Radix fuera de su envoltorio",
  },
  {
    nombre: "Radix en el armazón fuera de CajonMenu",
    cambios: {
      "src/components/armazon/Menu.tsx": `import * as D from "@radix-ui/react-dialog";\nexport const M = D;\n`,
    },
    regla: "R3 Radix fuera de su envoltorio",
  },
  {
    nombre: "Recharts fuera de graficos/",
    cambios: {
      "src/components/tabla/Tabla.tsx": `import { Bar } from "recharts";\nexport const T = Bar;\n`,
    },
    regla: "R3 Recharts fuera de graficos/",
  },
  {
    nombre: "avisos/ importa Radix",
    cambios: {
      "src/components/avisos/Aviso.tsx": `import * as T from "@radix-ui/react-toast";\nexport const A = T;\n`,
    },
    regla: "R3 avisos/ importa una librería",
  },
  {
    nombre: "avisos/ importa una librería cualquiera",
    cambios: {
      "src/components/avisos/Aviso.tsx": `import clsx from "clsx";\nexport const A = clsx;\n`,
    },
    regla: "R3 avisos/ importa una librería",
  },
  // R3 (T-010 (e2)): `next/navigation` dentro de `src/components/` solo en SelectorPeriodo
  {
    nombre: "next/navigation en un componente que no es SelectorPeriodo",
    cambios: {
      "src/components/armazon/Otro.tsx": `"use client";
import { useRouter } from "next/navigation";
export const O = useRouter;
`,
    },
    regla: "R3 next/navigation fuera de SelectorPeriodo",
  },
  {
    nombre: "next/navigation en una tarjeta",
    cambios: {
      "src/components/cifras/Tarjeta.tsx": `"use client";
import { usePathname } from "next/navigation";
export const T = usePathname;
`,
    },
    regla: "R3 next/navigation fuera de SelectorPeriodo",
  },
  {
    nombre: "next/navigation por importación dinámica en un componente",
    cambios: {
      "src/components/armazon/Otro.tsx": `export const cargar = () => import("next/navigation");
`,
    },
    regla: "R3 next/navigation fuera de SelectorPeriodo",
  },
  {
    nombre: "next/navigation.js con extensión en un componente",
    cambios: {
      "src/components/armazon/Otro.tsx": `"use client";
import { useRouter } from "next/navigation.js";
export const O = useRouter;
`,
    },
    regla: "R3 next/navigation fuera de SelectorPeriodo",
  },
  {
    nombre: "next/dist/client/components/navigation en un componente",
    cambios: {
      "src/components/armazon/Otro.tsx": `"use client";
import { useRouter } from "next/dist/client/components/navigation";
export const O = useRouter;
`,
    },
    regla: "R3 next/navigation fuera de SelectorPeriodo",
  },
  {
    nombre: "next/router en el propio SelectorPeriodo",
    cambios: {
      "src/components/armazon/SelectorPeriodo.tsx": `"use client";
import { useRouter } from "next/router";
export const S = useRouter;
`,
    },
    regla: "R3 next/navigation fuera de SelectorPeriodo",
  },
  // R3 (T-010 (d), menor 15 (a)): nada de `next/dist/…` en `src/components/` (ni en
  // SelectorPeriodo) y lista cerrada de entradas de `next`: solo `next/navigation`.
  {
    nombre: "next/dist/client/components/app-router-instance en un componente",
    cambios: {
      "src/components/armazon/Otro.tsx": `"use client";
import { createMutableActionQueue } from "next/dist/client/components/app-router-instance";
export const O = createMutableActionQueue;
`,
    },
    regla: "R3 next/dist en un componente",
  },
  {
    nombre: "next/dist/… en el propio SelectorPeriodo",
    cambios: {
      "src/components/armazon/SelectorPeriodo.tsx": `"use client";
import { useRouter } from "next/dist/client/components/navigation";
export const S = useRouter;
`,
    },
    regla: "R3 next/dist en un componente",
  },
  {
    nombre: "next/dist/… por importación dinámica en una tarjeta",
    cambios: {
      "src/components/cifras/Tarjeta.tsx": `export const cargar = () => import("next/dist/shared/lib/router/router");
`,
    },
    regla: "R3 next/dist en un componente",
  },
  {
    nombre: "next/link en un componente (fuera de la lista cerrada de entradas de next)",
    cambios: {
      "src/components/armazon/Otro.tsx": `import Link from "next/link";
export const O = Link;
`,
    },
    regla: "R3 entrada de next fuera de la lista",
  },
  {
    nombre: "next/font/local en un componente (fuera de la lista)",
    cambios: {
      "src/components/estilos/Fuente.tsx": `import localFont from "next/font/local";
export const F = localFont;
`,
    },
    regla: "R3 entrada de next fuera de la lista",
  },
  {
    nombre: "next sin subruta en un componente (fuera de la lista)",
    cambios: {
      "src/components/armazon/Otro.tsx": `import type { Metadata } from "next";
import next from "next";
export const O = next;
export type M = Metadata;
`,
    },
    regla: "R3 entrada de next fuera de la lista",
  },
  {
    nombre: "next/navigation.js (con extensión) en SelectorPeriodo no está en la lista",
    cambios: {
      "src/components/armazon/SelectorPeriodo.tsx": `"use client";
import { useRouter } from "next/navigation.js";
export const S = useRouter;
`,
    },
    regla: "R3 entrada de next fuera de la lista",
  },
  // R4: lo que llega al navegador
  {
    nombre: "módulo de cliente que reexporta sin-acceso.ts a través de un puente",
    cambios: {
      "src/app/otra/Cliente.tsx": `"use client";\nimport { sinAcceso } from "./puente";\nexport const C = sinAcceso;\n`,
      "src/app/otra/puente.ts": `export { sinAcceso } from "../../lib/errores/sin-acceso";\n`,
    },
    regla: "R4 un módulo de cliente llega a código de servidor",
    archivo: "src/app/otra/Cliente.tsx",
  },
  {
    nombre: "módulo de cliente que llega a fallo-servidor.ts por importación dinámica",
    cambios: {
      "src/app/otra/Cliente.tsx": `"use client";\nexport const C = () => import("../../lib/errores/fallo-servidor");\n`,
    },
    regla: "R4 un módulo de cliente llega a código de servidor",
  },
  // R8: rutas de /muestra/servidor/
  {
    nombre: "ruta de muestra/servidor importa fallo-servidor.ts",
    cambios: {
      "src/app/muestra/servidor/error/page.muestra.tsx": `import { comprobarAccesoMuestra } from "../../_datos/acceso-muestra";\nimport { registrarFallo } from "../../../../lib/errores/fallo-servidor";\nexport default async function P() {\n  await comprobarAccesoMuestra();\n  return registrarFallo;\n}\n`,
    },
    regla: "R8 una ruta de muestra/servidor llega al registro o a la supervisión",
  },
  {
    nombre: "ruta de muestra/servidor llega a registro.ts por un ayudante",
    cambios: {
      "src/app/muestra/servidor/error/page.muestra.tsx": `import { comprobarAccesoMuestra } from "../../_datos/acceso-muestra";\nimport { ayuda } from "../../_datos/ayuda";\nexport default async function P() {\n  await comprobarAccesoMuestra();\n  return ayuda;\n}\n`,
      "src/app/muestra/_datos/ayuda.ts": `export { registrar as ayuda } from "../../../lib/registro/registro";\n`,
    },
    regla: "R8 una ruta de muestra/servidor llega al registro o a la supervisión",
  },
  // R5: herramientas de prueba
  ...["web-vitals", "@playwright/test", "playwright-core", "axe-core", "@axe-core/playwright"].map(
    (paquete): Caso => ({
      nombre: `src importa ${paquete}`,
      cambios: {
        "src/lib/plataforma/x.ts": `import * as m from "${paquete}";\nexport const x = m;\n`,
      },
      regla: "R5 herramienta de prueba en src",
    }),
  ),
  // R6: árboles admin y panel
  {
    nombre: "loading en admin",
    cambios: { "src/app/admin/loading.tsx": `export default function C() { return null; }\n` },
    regla: "R6 loading en admin/panel",
  },
  {
    nombre: "loading anidado en panel",
    cambios: {
      "src/app/panel/clientes/loading.tsx": `export default function C() { return null; }\n`,
    },
    regla: "R6 loading en admin/panel",
  },
  {
    nombre: "not-found anidado en admin",
    cambios: {
      "src/app/admin/clientes/not-found.tsx": `export default function N() { return null; }\n`,
    },
    regla: "R6 not-found anidado",
  },
  {
    nombre: "generateMetadata como función en panel",
    cambios: {
      "src/app/panel/page.tsx": `export async function generateMetadata() { return {}; }\nexport default function P() { return null; }\n`,
    },
    regla: "R6 generateMetadata en admin/panel",
  },
  {
    nombre: "generateMetadata reexportado con otro nombre local en admin",
    cambios: {
      "src/app/admin/page.tsx": `const meta = async () => ({});\nexport { meta as generateMetadata };\nexport default function P() { return null; }\n`,
    },
    regla: "R6 generateMetadata en admin/panel",
  },
  // R7: puntos de entrada de la muestra
  {
    nombre: "archivo route bajo la muestra",
    cambios: { "src/app/muestra/datos/route.ts": `export const GET = () => new Response("x");\n` },
    regla: "R7 manejador de ruta en la muestra",
  },
  {
    nombre: "página que hace algo antes de comprobar",
    cambios: {
      "src/app/muestra/page.muestra.tsx": `import { comprobarAccesoMuestra } from "./_datos/acceso-muestra";\nexport default async function P() {\n  const x = 1;\n  await comprobarAccesoMuestra();\n  return x;\n}\n`,
    },
    regla: "R7 punto de entrada sin comprobarAccesoMuestra() como primera instrucción",
  },
  {
    nombre: "página que no comprueba",
    cambios: {
      "src/app/muestra/page.muestra.tsx": `export default function P() { return null; }\n`,
    },
    regla: "R7 punto de entrada sin comprobarAccesoMuestra() como primera instrucción",
  },
  {
    nombre: "página de flecha por defecto, con cuerpo de expresión",
    cambios: {
      "src/app/muestra/page.muestra.tsx": `export default () => null;\n`,
    },
    regla: "R7 punto de entrada sin comprobarAccesoMuestra() como primera instrucción",
  },
  {
    nombre: "página con export default de un identificador sin la comprobación",
    cambios: {
      "src/app/muestra/page.muestra.tsx": `const P = async () => null;\nexport default P;\n`,
    },
    regla: "R7 punto de entrada sin comprobarAccesoMuestra() como primera instrucción",
  },
  {
    nombre: "página cuya comprobación es de otro módulo (no de acceso-muestra.ts)",
    cambios: {
      "src/app/muestra/page.muestra.tsx": `async function comprobarAccesoMuestra() {}\nexport default async function P() {\n  await comprobarAccesoMuestra();\n  return null;\n}\n`,
    },
    regla: "R7 comprobarAccesoMuestra no se importa de _datos/acceso-muestra.ts",
  },
  {
    nombre: "acción de servidor sin comprobación",
    cambios: {
      "src/app/muestra/acciones.ts": `"use server";\nexport async function guardar() { return 1; }\n`,
    },
    regla: "R7 punto de entrada sin comprobarAccesoMuestra() como primera instrucción",
  },
  {
    nombre: "una segunda acción exportada sin comprobación en un archivo de acciones",
    cambios: {
      "src/app/muestra/acciones.ts": `"use server";\nimport { comprobarAccesoMuestra } from "./_datos/acceso-muestra";\nexport async function guardar() {\n  await comprobarAccesoMuestra();\n  return 1;\n}\nexport const borrar = async () => 2;\n`,
    },
    regla: "R7 punto de entrada sin comprobarAccesoMuestra() como primera instrucción",
  },
  {
    nombre: "acción de servidor en línea dentro de un componente, sin comprobación",
    cambios: {
      "src/app/muestra/ficha.tsx": `export function Ficha() {\n  async function enviar() {\n    "use server";\n    return 1;\n  }\n  return enviar;\n}\n`,
    },
    regla: "R7 punto de entrada sin comprobarAccesoMuestra() como primera instrucción",
  },
  // M-2, M-3 y m-2
  {
    nombre: "página que llama a la comprobación sin await",
    cambios: {
      "src/app/muestra/page.muestra.tsx": `import { comprobarAccesoMuestra } from "./_datos/acceso-muestra";
export default async function P() {
  comprobarAccesoMuestra();
  return null;
}
`,
    },
    regla: "R7 punto de entrada sin comprobarAccesoMuestra() como primera instrucción",
  },
  {
    nombre: "acción de servidor en línea que llama a la comprobación sin await",
    cambios: {
      "src/app/muestra/ficha.tsx": `import { comprobarAccesoMuestra } from "./_datos/acceso-muestra";
export function Ficha() {
  async function enviar() {
    "use server";
    comprobarAccesoMuestra();
    return "datos";
  }
  return enviar;
}
`,
    },
    regla: "R7 punto de entrada sin comprobarAccesoMuestra() como primera instrucción",
  },
  {
    nombre: "archivo use server que reexporta con nombre una acción de otro archivo",
    cambios: {
      "src/app/muestra/acciones.ts": `"use server";
export { borrar } from "./_datos/impl";
`,
      "src/app/muestra/_datos/impl.ts": `export async function borrar() { return 2; }
`,
    },
    regla: "R7 reexportación en un archivo use server",
  },
  {
    nombre: "archivo use server que reexporta todo con export *",
    cambios: {
      "src/app/muestra/acciones.ts": `"use server";
export * from "./_datos/impl";
`,
      "src/app/muestra/_datos/impl.ts": `export async function borrar() { return 2; }
`,
    },
    regla: "R7 reexportación en un archivo use server",
  },
  {
    nombre: "archivo use server sin ninguna entrada analizable",
    cambios: {
      "src/app/muestra/acciones.ts": `"use server";
const a = 1;
`,
    },
    regla: "R7 archivo use server sin entradas analizables",
  },
  {
    nombre:
      "archivo use server cuya única exportación es un valor por defecto no función (se enumera)",
    cambios: {
      "src/app/muestra/acciones.ts": `"use server";
const a = 1;
export default a;
`,
    },
    regla: "R7 punto de entrada sin comprobarAccesoMuestra() como primera instrucción",
    detalle: "default",
  },
  {
    nombre: "M-6: use server mixto con export default de un identificador sin comprobar",
    cambios: {
      "src/app/muestra/acciones.ts": `"use server";
import { comprobarAccesoMuestra } from "./_datos/acceso-muestra";
export async function guardar() {
  await comprobarAccesoMuestra();
  return 1;
}
const otra = async () => 2;
export default otra;
`,
    },
    regla: "R7 punto de entrada sin comprobarAccesoMuestra() como primera instrucción",
    detalle: "default",
  },
  {
    nombre: "M-6: use server mixto con export { x as default } sin comprobar",
    cambios: {
      "src/app/muestra/acciones.ts": `"use server";
import { comprobarAccesoMuestra } from "./_datos/acceso-muestra";
export async function guardar() {
  await comprobarAccesoMuestra();
  return 1;
}
const otra = async () => 2;
export { otra as default };
`,
    },
    regla: "R7 punto de entrada sin comprobarAccesoMuestra() como primera instrucción",
    detalle: "default",
  },
  {
    nombre: "M-6: use server mixto con export default async () => sin comprobar",
    cambios: {
      "src/app/muestra/acciones.ts": `"use server";
import { comprobarAccesoMuestra } from "./_datos/acceso-muestra";
export async function guardar() {
  await comprobarAccesoMuestra();
  return 1;
}
export default async () => 2;
`,
    },
    regla: "R7 punto de entrada sin comprobarAccesoMuestra() como primera instrucción",
    detalle: "default",
  },
  {
    nombre: "M-6: use server mixto con export default function sin comprobar",
    cambios: {
      "src/app/muestra/acciones.ts": `"use server";
import { comprobarAccesoMuestra } from "./_datos/acceso-muestra";
export async function guardar() {
  await comprobarAccesoMuestra();
  return 1;
}
export default async function () { return 2; }
`,
    },
    regla: "R7 punto de entrada sin comprobarAccesoMuestra() como primera instrucción",
    detalle: "default",
  },
  ...["generateViewport", "generateImageMetadata", "generateSitemaps"].map((f): Caso => ({
    nombre: `m-e: ${f} en una página de la muestra`,
    cambios: {
      "src/app/muestra/page.muestra.tsx": `import { comprobarAccesoMuestra } from "./_datos/acceso-muestra";
export async function ${f}() { return []; }
export default async function Pagina() {
  await comprobarAccesoMuestra();
  return null;
}
`,
    },
    regla: "R7 generateMetadata en la muestra",
  })),
  {
    nombre: "m-e: generateViewport exportado con export { } en una capa de la muestra",
    cambios: {
      "src/app/muestra/layout.muestra.tsx": `import { comprobarAccesoMuestra } from "./_datos/acceso-muestra";
const v = async () => ({});
export { v as generateViewport };
export default async function Capa(p: { children: unknown }) {
  await comprobarAccesoMuestra();
  return p.children;
}
`,
    },
    regla: "R7 generateMetadata en la muestra",
  },
  // m-d: la excepción vale para quien importa, no para quien lo reexporta
  {
    nombre: "m-d: acceso-muestra.ts reexporta la configuración con export { } from",
    cambios: {
      "src/app/muestra/_datos/acceso-muestra.ts": `import { leerEntorno } from "../../../lib/plataforma/configuracion";
export { leerEntorno as e } from "../../../lib/plataforma/configuracion";
export async function comprobarAccesoMuestra(): Promise<void> { leerEntorno(); }
`,
    },
    regla: "R1 reexpone src/lib desde un origen exceptuado",
    archivo: "src/app/muestra/_datos/acceso-muestra.ts",
  },
  {
    nombre:
      "m-d: acceso-muestra.ts reexporta lo importado con export { x as e } y un componente lo usa",
    cambios: {
      "src/app/muestra/_datos/acceso-muestra.ts": `import { leerEntorno } from "../../../lib/plataforma/configuracion";
export { leerEntorno as e };
export async function comprobarAccesoMuestra(): Promise<void> { leerEntorno(); }
`,
      "src/components/cifras/Tarjeta.tsx": `import { e } from "../../app/muestra/_datos/acceso-muestra";
export const T = e;
`,
    },
    regla: "R1 reexpone src/lib desde un origen exceptuado",
    archivo: "src/app/muestra/_datos/acceso-muestra.ts",
  },
  {
    nombre: "m-d: acceso-muestra.ts reexpone la configuración con export const",
    cambios: {
      "src/app/muestra/_datos/acceso-muestra.ts": `import { leerEntorno } from "../../../lib/plataforma/configuracion";
export const e = leerEntorno;
export async function comprobarAccesoMuestra(): Promise<void> { leerEntorno(); }
`,
    },
    regla: "R1 reexpone src/lib desde un origen exceptuado",
  },
  {
    nombre: "m-d: muestra/servidor reexporta sin-acceso.ts",
    cambios: {
      "src/app/muestra/servidor/permitido/page.muestra.tsx": `import { comprobarAccesoMuestra } from "../../_datos/acceso-muestra";
import { sinAcceso } from "../../../../lib/errores/sin-acceso";
export { sinAcceso as s };
export default async function Pagina() {
  await comprobarAccesoMuestra();
  return sinAcceso;
}
`,
    },
    regla: "R1 reexpone src/lib desde un origen exceptuado",
  },
  ...[
    "opengraph-image.muestra.tsx",
    "twitter-image.tsx",
    "icon.tsx",
    "icon1.muestra.tsx",
    "apple-icon.tsx",
    "sitemap.ts",
    "robots.muestra.ts",
    "manifest.ts",
  ].map((archivo): Caso => ({
    nombre: `archivo de metadatos de ruta ${archivo} en la muestra`,
    cambios: {
      [`src/app/muestra/${archivo}`]: `export default function X() { return null; }
`,
    },
    regla: "R7 archivo de metadatos de ruta en la muestra",
  })),
  {
    nombre: "generateMetadata en una página de la muestra",
    cambios: {
      "src/app/muestra/page.muestra.tsx": `import { comprobarAccesoMuestra } from "./_datos/acceso-muestra";
export async function generateMetadata() { return { title: "x" }; }
export default async function Pagina() {
  await comprobarAccesoMuestra();
  return null;
}
`,
    },
    regla: "R7 generateMetadata en la muestra",
  },
  // R9: nada fuera de src/app/muestra/ importa la muestra (020 T-005, condición (3) del
  // auditor-seguridad en T-004): así su código no puede llegar a otra ruta ni a producción.
  {
    nombre: "una página fuera de la muestra importa la comprobación de la muestra",
    cambios: {
      "src/app/otra/page.tsx": `import { comprobarAccesoMuestra } from "../muestra/_datos/acceso-muestra";\nexport default async function P() {\n  await comprobarAccesoMuestra();\n  return null;\n}\n`,
    },
    regla: "R9 importa la muestra desde fuera",
    archivo: "src/app/otra/page.tsx",
  },
  {
    nombre: "un componente importa la muestra por el alias @/, aunque sea solo de tipo",
    cambios: {
      "src/components/cifras/Tarjeta.tsx": `import type { comprobarAccesoMuestra } from "@/app/muestra/_datos/acceso-muestra";\nexport type T = typeof comprobarAccesoMuestra;\n`,
    },
    regla: "R9 importa la muestra desde fuera",
    archivo: "src/components/cifras/Tarjeta.tsx",
  },
  {
    nombre: "un archivo de src/lib importa una página de la muestra con import() dinámico",
    cambios: {
      "src/lib/errores/referencia.ts": `export const crearReferencia = (): string => "REF-0";\nexport const cargar = () => import("../../app/muestra/page.muestra");\n`,
    },
    regla: "R9 importa la muestra desde fuera",
    archivo: "src/lib/errores/referencia.ts",
  },
  {
    nombre: "un archivo fuera reexporta algo de la muestra",
    cambios: {
      "src/app/puente.ts": `export { comprobarAccesoMuestra } from "./muestra/_datos/acceso-muestra";\n`,
    },
    regla: "R9 importa la muestra desde fuera",
    archivo: "src/app/puente.ts",
  },
  // R0: lo que no se puede resolver
  {
    nombre: "importación interna que no existe",
    cambios: {
      "src/components/cifras/Tarjeta.tsx": `import { x } from "./falta";\nexport const T = x;\n`,
    },
    regla: "R0 importación que no se resuelve",
  },
  {
    nombre: "importación dinámica con un texto que no es literal",
    cambios: {
      "src/components/cifras/Tarjeta.tsx": `export const cargar = (n: string) => import("../../lib/" + n);\n`,
    },
    regla: "R0 importación que no se resuelve",
  },
];

describe("PRUEBA-008 · cada regla detecta su fallo sembrado", () => {
  it.each(casos)("$nombre", ({ cambios, regla, archivo, detalle }) => {
    const h = hallazgosDe(cambios);
    const coincide = h.filter(
      (x) =>
        x.regla === regla &&
        (archivo === undefined || x.archivo === archivo) &&
        (detalle === undefined || x.detalle === detalle),
    );
    expect(
      coincide.length,
      `se esperaba «${regla}»; hallazgos: ${JSON.stringify(h)}`,
    ).toBeGreaterThan(0);
  });
});

describe("PRUEBA-008 · las excepciones son las del diseño y solo esas", () => {
  it("son exactamente tres, las escritas en el diseño", () => {
    expect(excepcionesDeImportacion.map((e) => ({ desde: e.desde, hacia: e.hacia }))).toEqual([
      { desde: { tipo: "cualquiera" }, hacia: "src/lib/errores/referencia.ts" },
      {
        desde: { tipo: "archivo", ruta: "src/app/muestra/_datos/acceso-muestra.ts" },
        hacia: "src/lib/plataforma/configuracion.ts",
      },
      {
        desde: { tipo: "carpeta", ruta: "src/app/muestra/servidor/" },
        hacia: "src/lib/errores/sin-acceso.ts",
      },
    ]);
  });

  it("sin ellas, el árbol limpio falla en exactamente los tres sitios que las usan", () => {
    const grafo = construirGrafo(crearArbol(ARBOL_LIMPIO));
    const h = comprobarFronteras(grafo, []).filter((x) => x.regla === "R1 importa src/lib");
    expect(h.map((x) => x.archivo).sort()).toEqual([
      "src/app/muestra/_datos/acceso-muestra.ts",
      "src/app/muestra/servidor/permitido/page.muestra.tsx",
      "src/components/textos.ts",
    ]);
  });

  it("ninguna excepción cubre supabase, oauth, licencias ni stripe", () => {
    for (const e of excepcionesDeImportacion) {
      expect(e.hacia).not.toMatch(/^src\/lib\/(supabase|oauth|licencias|stripe)\//);
    }
  });
});
