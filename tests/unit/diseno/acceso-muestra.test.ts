// PRUEBA-024 escrita (020 T-003 (c)): la muestra no existe en producción.
//
// Control 1 (compilación): `next.config.ts` solo añade la extensión `muestra.tsx` con `ENTORNO`
//   exactamente `desarrollo` o `preproduccion`; con los otros cinco valores de la prueba y con
//   otros más, no. Además, ningún archivo de la muestra es ruta sin esa extensión.
// Control 2 (cada petición, cada punto de entrada): `comprobarAccesoMuestra()` y, con ella, cada
//   página, el layout y cada acción de servidor de la muestra responden como recurso inexistente
//   salvo con `Host` en la lista y `ENTORNO` válido; `X-Forwarded-Host` no se lee.
// Control positivo: con `localhost` o `127.0.0.1` y `ENTORNO` válido, la muestra se ve.
//
// Cómo se declara lo que aún no se puede probar (artículo 13): los casos que necesitan la
// muestra se escriben ya, y mientras `src/app/muestra/` no tenga ningún archivo llevan en su
// nombre «[NO APLICABLE AÚN …]», escriben en la salida que no se han ejecutado y no afirman nada
// sobre el comportamiento: esos casos NO prueban nada y no se cuentan como prueba superada.
// En cuanto aparece un solo archivo de la muestra dejan de poder esquivarse: exigen
// `_datos/acceso-muestra.ts` y recorren todos los puntos de entrada, y fallan si alguno no cierra.
// Para que los casos puedan fallar desde hoy, el mismo recorrido se prueba contra una muestra
// sembrada (correcta y con siete defectos) y tiene que verlos.
//
// NO EJECUTADO AQUÍ (no hay compilación ni despliegue en esta tarea): la compilación con cada
// `ENTORNO` y su inventario de rutas, `/muestra` y `/muestra/valores` iguales a una dirección
// inexistente, la cadena testigo de `_datos/` ausente de la salida de la compilación, el nombre
// de servidor que recibe una función en Vercel, y la parte de producción. Van con T-004/T-005
// (compilación local) y con la 002 (despliegue).
import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import ts from "typescript";
import { afterAll, afterEach, describe, expect, it, vi } from "vitest";
import { borrarArboles, crearArbol } from "./apoyo/arbol";
import {
  archivosDeRutaSinExtensionDeLaMuestra,
  CASOS_DE_ACCESO,
  cabecerasDe,
  clasificarAccion,
  clasificarPagina,
  ENTORNOS_QUE_ABREN,
  evaluarControl1,
  type CargaDeConfiguracion,
  type CasoDeAcceso,
  type Resultado,
} from "./apoyo/control-acceso";
import { ARCHIVO_ACCESO, ES_PAGINA, exportadas } from "./apoyo/fronteras";
import { construirGrafo, type Grafo } from "./apoyo/grafo";

const RAIZ = resolve(import.meta.dirname, "..", "..", "..");

// Lo que `next/headers` devuelve en cada caso. Fuera de una petición real no existe.
const estado = vi.hoisted(() => ({ cabeceras: new Headers() }));
vi.mock("next/headers", () => ({ headers: async () => estado.cabeceras }));

afterEach(() => vi.unstubAllEnvs());
afterAll(borrarArboles);

const HAY_MUESTRA = [...construirGrafo(RAIZ).modulos.keys()].some((r) =>
  r.startsWith("src/app/muestra/"),
);
const NO_APLICA = "[NO APLICABLE AÚN: no existe src/app/muestra] ";
const marca = HAY_MUESTRA ? "" : NO_APLICA;

function avisarNoEjecutado(que: string): void {
  console.info(
    `NO EJECUTADA (${que}): no existe nada en src/app/muestra. No es una prueba superada.`,
  );
}

// ------------------------------------------------------------------ control 1

async function cargarConfiguracionReal(entorno: string | undefined) {
  vi.resetModules();
  vi.stubEnv("ENTORNO", entorno);
  const modulo = (await import("../../../next.config")) as {
    default: { pageExtensions?: string[] };
  };
  return modulo.default.pageExtensions;
}

const T004_HECHA = /muestra/.test(readFileSync(join(RAIZ, "next.config.ts"), "utf8"));

describe("PRUEBA-024 · control 1: la compilación solo incluye la muestra con ENTORNO válido", () => {
  it("con los cinco valores de la prueba y otros desconocidos, next.config.ts no abre la muestra", async () => {
    const real: CargaDeConfiguracion = cargarConfiguracionReal;
    expect(await evaluarControl1(real, false)).toEqual([]);
  });

  it(`${T004_HECHA ? "" : "[NO APLICABLE AÚN: next.config.ts todavía no declara la muestra (T-004)] "}con desarrollo y preproduccion la muestra sí entra (control positivo)`, async () => {
    if (!T004_HECHA) {
      console.info(
        "NO EJECUTADA (control 1 positivo): next.config.ts no menciona la muestra. No es una prueba superada.",
      );
      expect(T004_HECHA).toBe(false);
      return;
    }
    expect(await evaluarControl1(cargarConfiguracionReal, true)).toEqual([]);
  });

  it("ningún archivo de la muestra es ruta sin la extensión muestra.tsx", () => {
    expect(archivosDeRutaSinExtensionDeLaMuestra(RAIZ)).toEqual([]);
  });

  describe("la comprobación puede fallar (configuraciones sembradas)", () => {
    const configuracion = (abre: (e: string | undefined) => boolean): CargaDeConfiguracion => {
      return async (e) => (abre(e) ? ["tsx", "ts", "jsx", "js", "muestra.tsx"] : undefined);
    };
    const correcta = configuracion((e) => ENTORNOS_QUE_ABREN.includes(e ?? ""));

    it("la configuración correcta no da fallos, con y sin control positivo", async () => {
      expect(await evaluarControl1(correcta, true)).toEqual([]);
    });
    it.each([
      ["siempre abierta", configuracion(() => true)],
      [
        "abierta salvo si empieza por «prod» en minúsculas",
        configuracion((e) => !(e ?? "").startsWith("prod")),
      ],
      [
        "abierta si el valor, sin mayúsculas ni espacios, es desarrollo",
        configuracion((e) => (e ?? "").trim().toLowerCase() === "desarrollo"),
      ],
      [
        "abierta si no hay valor",
        configuracion((e) => e === undefined || ENTORNOS_QUE_ABREN.includes(e)),
      ],
    ])("%s: se detecta", async (_nombre, cargar) => {
      expect((await evaluarControl1(cargar, true)).length).toBeGreaterThan(0);
    });
    it("cerrada siempre: el control positivo lo detecta", async () => {
      expect(
        (
          await evaluarControl1(
            configuracion(() => false),
            true,
          )
        ).length,
      ).toBeGreaterThan(0);
    });
    it("un archivo page.tsx o route.ts en la muestra se detecta como ruta de cualquier compilación", () => {
      const raiz = crearArbol({
        "src/app/muestra/page.tsx": "export default function P() { return null; }\n",
        "src/app/muestra/datos/route.ts": "export const GET = () => new Response();\n",
        "src/app/muestra/layout.muestra.tsx": "export default function L() { return null; }\n",
        "src/app/muestra/_datos/acceso-muestra.ts": "export const x = 1;\n",
      });
      expect(archivosDeRutaSinExtensionDeLaMuestra(raiz)).toEqual([
        "src/app/muestra/datos/route.ts",
        "src/app/muestra/page.tsx",
      ]);
    });
  });
});

// ------------------------------------------------------------------ control 2

// `irresoluble`: archivo use server cuyas acciones no se pueden enumerar (reexportaciones o
// ninguna entrada analizable). Se cuenta como fallo: cierre en fallo, no se da por bueno.
type Entrada = {
  ruta: string;
  tipo: "pagina" | "capa" | "accion" | "irresoluble";
  nombre: string;
};

function descubrirEntradas(grafo: Grafo): Entrada[] {
  const salida: Entrada[] = [];
  for (const m of grafo.modulos.values()) {
    if (!m.ruta.startsWith("src/app/muestra/") || m.ruta === ARCHIVO_ACCESO) continue;
    const base = m.ruta.slice(m.ruta.lastIndexOf("/") + 1);
    if (ES_PAGINA.test(base)) salida.push({ ruta: m.ruta, tipo: "pagina", nombre: "default" });
    else if (/^layout(\.muestra)?\.(tsx|ts|jsx|js)$/.test(base)) {
      salida.push({ ruta: m.ruta, tipo: "capa", nombre: "default" });
    }
    if (m.servidor) {
      const propias = [...exportadas(m.fuente, false), ...exportadas(m.fuente, true)];
      for (const e of propias) salida.push({ ruta: m.ruta, tipo: "accion", nombre: e.nombre });
      const reexporta = m.fuente.statements.some(
        (st) => ts.isExportDeclaration(st) && st.moduleSpecifier !== undefined,
      );
      if (reexporta) {
        salida.push({ ruta: m.ruta, tipo: "irresoluble", nombre: "reexportación en use server" });
      } else if (propias.length === 0) {
        salida.push({ ruta: m.ruta, tipo: "irresoluble", nombre: "sin entradas analizables" });
      }
    }
  }
  return salida;
}

async function cargar(raiz: string, ruta: string): Promise<Record<string, unknown>> {
  vi.resetModules();
  return (await import(/* @vite-ignore */ pathToFileURL(join(raiz, ruta)).href)) as Record<
    string,
    unknown
  >;
}

async function invocarEntrada(raiz: string, e: Entrada): Promise<unknown> {
  const modulo = await cargar(raiz, e.ruta);
  const funcion = modulo[e.tipo === "accion" ? e.nombre : "default"];
  if (typeof funcion !== "function") throw new Error(`no exporta la función ${e.nombre}`);
  const sinParametros = { params: Promise.resolve({}), searchParams: Promise.resolve({}) };
  if (e.tipo === "pagina") return funcion(sinParametros);
  if (e.tipo === "capa") return funcion({ ...sinParametros, children: null });
  return funcion();
}

async function invocarComprobacion(raiz: string): Promise<unknown> {
  const modulo = await cargar(raiz, ARCHIVO_ACCESO);
  const funcion = modulo["comprobarAccesoMuestra"];
  if (typeof funcion !== "function")
    throw new Error("acceso-muestra.ts no exporta comprobarAccesoMuestra");
  return funcion();
}

function preparar(caso: CasoDeAcceso): void {
  estado.cabeceras = cabecerasDe(caso);
  vi.stubEnv("ENTORNO", caso.entorno);
}

/** Recorre los casos sobre cada punto de entrada y devuelve lo que no coincide con lo esperado. */
async function recorrer(
  raiz: string,
  casos: readonly CasoDeAcceso[],
  incluirComprobacion = true,
): Promise<string[]> {
  const fallos: string[] = [];
  const grafo = construirGrafo(raiz);
  // Las acciones no se enumeran por análisis estático: se cargan los módulos y se toman todas
  // sus exportaciones (`default` incluida), que es lo que Next expone como acciones.
  const entradas = descubrirEntradas(grafo).filter((e) => e.tipo !== "accion");
  for (const m of grafo.modulos.values()) {
    if (!m.servidor || !m.ruta.startsWith("src/app/muestra/") || m.ruta === ARCHIVO_ACCESO)
      continue;
    const claves = Object.keys(await cargar(raiz, m.ruta));
    for (const nombre of claves) entradas.push({ ruta: m.ruta, tipo: "accion", nombre });
    const yaIrresoluble = entradas.some((e) => e.ruta === m.ruta && e.tipo === "irresoluble");
    if (claves.length === 0 && !yaIrresoluble) {
      entradas.push({ ruta: m.ruta, tipo: "irresoluble", nombre: "sin entradas analizables" });
    }
  }
  const anotar = (donde: string, caso: CasoDeAcceso, obtenido: Resultado): void => {
    const esperado: Resultado = caso.abierta ? "abierta" : "cerrada";
    if (obtenido !== esperado) {
      fallos.push(`${donde} · ${caso.nombre}: se esperaba ${esperado} y fue ${obtenido}`);
    }
  };
  for (const caso of casos) {
    if (incluirComprobacion && existsSync(join(raiz, ARCHIVO_ACCESO))) {
      preparar(caso);
      anotar(
        "comprobarAccesoMuestra()",
        caso,
        await clasificarPagina(() => invocarComprobacion(raiz)),
      );
    }
    for (const e of entradas) {
      if (e.tipo === "irresoluble") {
        if (caso === casos[0]) fallos.push(`${e.ruta}: ${e.nombre}: no se puede comprobar`);
        continue;
      }
      // De una acción solo se prueba el cierre: con acceso permitido haría su trabajo.
      if (e.tipo === "accion" && caso.abierta) continue;
      preparar(caso);
      const clasificar = e.tipo === "accion" ? clasificarAccion : clasificarPagina;
      anotar(
        `${e.ruta} (${e.tipo} ${e.nombre})`,
        caso,
        await clasificar(() => invocarEntrada(raiz, e)),
      );
    }
  }
  return fallos;
}

const BLOQUES: ReadonlyArray<readonly [string, (c: CasoDeAcceso) => boolean]> = [
  ["control positivo: en local y en preproducción la muestra se ve", (c) => c.abierta],
  [
    "Host fuera de la lista, ausente o con trucos, y X-Forwarded-Host falsificado: inexistente",
    (c) => !c.abierta && !c.nombre.includes("ENTORNO="),
  ],
  [
    "ENTORNO desconocido al servir, con el nombre correcto: inexistente",
    (c) => c.nombre.includes("ENTORNO="),
  ],
];

describe("PRUEBA-024 · control 2 sobre la muestra real, en cada punto de entrada", () => {
  it(`${marca}si hay algo en la muestra, existe _datos/acceso-muestra.ts (no se puede esquivar)`, () => {
    if (!HAY_MUESTRA) {
      avisarNoEjecutado("existencia de acceso-muestra.ts");
      expect(HAY_MUESTRA).toBe(false);
      return;
    }
    expect(existsSync(join(RAIZ, ARCHIVO_ACCESO)), `falta ${ARCHIVO_ACCESO}`).toBe(true);
  });

  it.each(BLOQUES)(`${marca}%s`, async (_nombre, filtro) => {
    if (!HAY_MUESTRA) {
      avisarNoEjecutado("control 2");
      expect(HAY_MUESTRA).toBe(false);
      return;
    }
    expect(await recorrer(RAIZ, CASOS_DE_ACCESO.filter(filtro))).toEqual([]);
  });
});

// ------------------------------------------------------------------ la prueba puede fallar

const ACCESO_CORRECTO = `import { headers } from "next/headers";
import { notFound } from "next/navigation";
const NOMBRES = ["localhost", "127.0.0.1"];
const ENTORNOS = ["desarrollo", "preproduccion"];
export async function comprobarAccesoMuestra(): Promise<void> {
  const host = (await headers()).get("host") ?? "";
  const nombre = host.replace(/:\\d+$/, "");
  if (!NOMBRES.includes(nombre) || !ENTORNOS.includes(process.env.ENTORNO ?? "")) notFound();
}
`;

function muestraSembrada(cambios: Record<string, string> = {}): string {
  const archivos: Record<string, string> = {
    "src/app/muestra/_datos/acceso-muestra.ts": ACCESO_CORRECTO,
    "src/app/muestra/page.muestra.tsx": `import { comprobarAccesoMuestra } from "./_datos/acceso-muestra";\nexport default async function Pagina() {\n  await comprobarAccesoMuestra();\n  return "contenido-ficticio";\n}\n`,
    "src/app/muestra/layout.muestra.tsx": `import { comprobarAccesoMuestra } from "./_datos/acceso-muestra";\nexport default async function Capa() {\n  await comprobarAccesoMuestra();\n  return "capa-ficticia";\n}\n`,
    "src/app/muestra/acciones.ts": `"use server";\nimport { comprobarAccesoMuestra } from "./_datos/acceso-muestra";\nexport async function guardar() {\n  await comprobarAccesoMuestra();\n  return "datos-ficticios";\n}\n`,
    ...cambios,
  };
  return crearArbol(archivos, join(RAIZ, "node_modules", ".cache"));
}

describe("PRUEBA-024 · el recorrido de control 2 puede fallar (muestra sembrada)", () => {
  it("descubre página, layout y acción en la muestra sembrada", () => {
    const e = descubrirEntradas(construirGrafo(muestraSembrada()));
    expect(e.map((x) => `${x.tipo}:${x.nombre}`).sort()).toEqual([
      "accion:guardar",
      "capa:default",
      "pagina:default",
    ]);
  });

  it("la forma mixta con default comprobado tampoco da fallos", async () => {
    const acciones = `"use server";
import { comprobarAccesoMuestra } from "./_datos/acceso-muestra";
export async function guardar() {
  await comprobarAccesoMuestra();
  return "datos-ficticios";
}
export default async () => {
  await comprobarAccesoMuestra();
  return "datos-ficticios";
};
`;
    const raiz = muestraSembrada({ "src/app/muestra/acciones.ts": acciones });
    expect(await recorrer(raiz, CASOS_DE_ACCESO)).toEqual([]);
  });

  it("la muestra sembrada correcta no da fallos con ninguno de los casos", async () => {
    expect(await recorrer(muestraSembrada(), CASOS_DE_ACCESO)).toEqual([]);
  });

  const defectos: Array<[string, Record<string, string>, string]> = [
    [
      "una página que no comprueba",
      {
        "src/app/muestra/page.muestra.tsx": `export default async function Pagina() {\n  return "contenido-ficticio";\n}\n`,
      },
      "page.muestra.tsx (pagina default)",
    ],
    [
      "una acción que no comprueba y devuelve datos",
      {
        "src/app/muestra/acciones.ts": `"use server";\nexport async function guardar() {\n  return "datos-ficticios";\n}\n`,
      },
      "acciones.ts (accion guardar)",
    ],
    [
      "un layout que no comprueba (con la página sí)",
      {
        "src/app/muestra/layout.muestra.tsx": `export default async function Capa() {\n  return "capa-ficticia";\n}\n`,
      },
      "layout.muestra.tsx (capa default)",
    ],
    [
      "una comprobación que también lee X-Forwarded-Host",
      {
        "src/app/muestra/_datos/acceso-muestra.ts": ACCESO_CORRECTO.replace(
          `.get("host") ?? ""`,
          `.get("x-forwarded-host") ?? (await headers()).get("host") ?? ""`,
        ),
      },
      "X-Forwarded-Host",
    ],
    [
      "una comprobación que ignora ENTORNO al servir",
      {
        "src/app/muestra/_datos/acceso-muestra.ts": ACCESO_CORRECTO.replace(
          ` || !ENTORNOS.includes(process.env.ENTORNO ?? "")`,
          "",
        ),
      },
      "ENTORNO=",
    ],
    [
      "una comprobación del nombre por subcadena",
      {
        "src/app/muestra/_datos/acceso-muestra.ts": ACCESO_CORRECTO.replace(
          `!NOMBRES.includes(nombre)`,
          `!NOMBRES.some((n) => host.includes(n))`,
        ),
      },
      "como subdominio de otro",
    ],
    [
      "una comprobación de ENTORNO sin distinguir mayúsculas ni espacios",
      {
        "src/app/muestra/_datos/acceso-muestra.ts": ACCESO_CORRECTO.replace(
          `ENTORNOS.includes(process.env.ENTORNO ?? "")`,
          `ENTORNOS.includes((process.env.ENTORNO ?? "").trim().toLowerCase())`,
        ),
      },
      "Desarrollo",
    ],
    [
      "un archivo use server que reexporta una acción de otro archivo (no comprobable)",
      {
        "src/app/muestra/acciones.ts": `"use server";
export { borrar } from "./_datos/impl";
`,
        "src/app/muestra/_datos/impl.ts": `export async function borrar() {
  return "datos-ficticios";
}
`,
      },
      "reexportación",
    ],
    [
      "un archivo use server con export * (no comprobable)",
      {
        "src/app/muestra/acciones.ts": `"use server";
export * from "./_datos/impl";
`,
        "src/app/muestra/_datos/impl.ts": `export async function borrar() {
  return "datos-ficticios";
}
`,
      },
      "reexportación",
    ],
    [
      "un archivo use server sin ninguna acción analizable",
      {
        "src/app/muestra/acciones.ts": `"use server";
`,
      },
      "sin entradas analizables",
    ],
    [
      "un archivo use server cuya exportación por defecto no es una función",
      {
        "src/app/muestra/acciones.ts": `"use server";
export default 1;
`,
      },
      "no exporta la función default",
    ],
    [
      "forma mixta: acción comprobada y export default de un identificador sin comprobar",
      {
        "src/app/muestra/acciones.ts": `"use server";
import { comprobarAccesoMuestra } from "./_datos/acceso-muestra";
export async function guardar() {
  await comprobarAccesoMuestra();
  return "datos-ficticios";
}
const otra = async () => "datos-ficticios";
export default otra;
`,
      },
      "acciones.ts (accion default)",
    ],
    [
      "forma mixta: acción comprobada y export { x as default } sin comprobar",
      {
        "src/app/muestra/acciones.ts": `"use server";
import { comprobarAccesoMuestra } from "./_datos/acceso-muestra";
export async function guardar() {
  await comprobarAccesoMuestra();
  return "datos-ficticios";
}
const otra = async () => "datos-ficticios";
export { otra as default };
`,
      },
      "acciones.ts (accion default)",
    ],
    [
      "forma mixta: acción comprobada y export default async () => ... sin comprobar",
      {
        "src/app/muestra/acciones.ts": `"use server";
import { comprobarAccesoMuestra } from "./_datos/acceso-muestra";
export async function guardar() {
  await comprobarAccesoMuestra();
  return "datos-ficticios";
}
export default async () => "datos-ficticios";
`,
      },
      "acciones.ts (accion default)",
    ],
    [
      "una comprobación que no cierra nunca",
      {
        "src/app/muestra/_datos/acceso-muestra.ts": `export async function comprobarAccesoMuestra(): Promise<void> {}\n`,
      },
      "se esperaba cerrada",
    ],
    [
      "una comprobación que cierra siempre (rompe el control positivo)",
      {
        "src/app/muestra/_datos/acceso-muestra.ts": `import { notFound } from "next/navigation";\nexport async function comprobarAccesoMuestra(): Promise<void> {\n  notFound();\n}\n`,
      },
      "se esperaba abierta",
    ],
  ];

  it.each(defectos)("%s", async (_nombre, cambios, pista) => {
    const fallos = await recorrer(muestraSembrada(cambios), CASOS_DE_ACCESO);
    expect(fallos.length, "el recorrido no vio el defecto").toBeGreaterThan(0);
    expect(fallos.join("\n")).toContain(pista);
  });
});
