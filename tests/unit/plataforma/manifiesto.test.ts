import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

// Raíz del repositorio: tests/unit/plataforma -> tres niveles arriba.
const raiz = join(import.meta.dirname, "..", "..", "..");

function leer(nombre: string): string {
  return readFileSync(join(raiz, nombre), "utf8");
}

function leerJson(nombre: string): Record<string, unknown> {
  return JSON.parse(leer(nombre)) as Record<string, unknown>;
}

const exacta = /^\d+\.\d+\.\d+$/;

type DatosFechas = {
  limite: string;
  fechas: Record<string, string>;
  excepciones: { paquete: string; motivo: string; revisarDespues: string }[];
};

// Comprueba el archivo de fechas y excepciones; recibe los datos para poder alimentarla con copias alteradas.
function comprobarFechasYExcepciones(datos: DatosFechas): void {
  const limite = Date.parse(datos.limite);
  expect(limite).toBeLessThanOrEqual(Date.parse("2026-11-12T23:59:59Z"));
  const bloqueo = leerJson("package-lock.json") as {
    packages: Record<string, { version?: string }>;
  };
  const esperadas = new Set<string>();
  for (const [ruta, datosPaquete] of Object.entries(bloqueo.packages)) {
    if (ruta === "") continue;
    const nombre = ruta.slice(ruta.lastIndexOf("node_modules/") + "node_modules/".length);
    esperadas.add(`${nombre}@${datosPaquete.version ?? ""}`);
  }
  expect(esperadas.size).toBeGreaterThan(0);
  expect(Object.keys(datos.fechas).sort()).toEqual([...esperadas].sort());

  const motivoGhsa = "GHSA-g3hv-75wg-m249: versión previa vulnerable (typescript-eslint 8.72.2)";
  const motivoPglite =
    "Excepción por calendario, sin motivo de seguridad: pglite 0.5.17 exacta fijada por el diseño de la 002 (D-033)";
  // Mapa cerrado paquete@versión -> fecha de publicación en el registro, fijado aquí y no leído del JSON.
  // pglite 0.5.17: fecha del registro dada por la tarea. Los 11 de typescript-eslint 8.73.0: fechas que
  // ya constaban en fechas-publicacion.json y que el auditor dio por ciertas (no contrastadas con la red).
  const publicacionFijada: Record<string, string> = {
    "@electric-sql/pglite@0.5.17": "2026-11-19T11:17:03.254Z",
    "@typescript-eslint/eslint-plugin@8.73.0": "2026-11-16T17:07:51.653Z",
    "@typescript-eslint/parser@8.73.0": "2026-11-16T17:08:01.784Z",
    "@typescript-eslint/project-service@8.73.0": "2026-11-16T17:05:48.422Z",
    "@typescript-eslint/scope-manager@8.73.0": "2026-11-16T17:08:56.126Z",
    "@typescript-eslint/tsconfig-utils@8.73.0": "2026-11-16T17:06:31.812Z",
    "@typescript-eslint/type-utils@8.73.0": "2026-11-16T17:07:39.348Z",
    "@typescript-eslint/types@8.73.0": "2026-11-16T17:14:45.535Z",
    "@typescript-eslint/typescript-estree@8.73.0": "2026-11-16T17:06:48.419Z",
    "@typescript-eslint/utils@8.73.0": "2026-11-16T17:06:09.621Z",
    "@typescript-eslint/visitor-keys@8.73.0": "2026-11-16T17:05:49.224Z",
    "typescript-eslint@8.73.0": "2026-11-16T17:07:26.146Z",
  };
  expect(Object.keys(datos).sort()).toEqual(["excepciones", "fechas", "limite"]);
  const listadas = datos.excepciones.map((e) => e.paquete);
  expect(new Set(listadas).size, "excepciones duplicadas").toBe(listadas.length);
  for (const excepcion of datos.excepciones) {
    expect(Object.keys(excepcion).sort(), excepcion.paquete).toEqual([
      "motivo",
      "paquete",
      "revisarDespues",
    ]);
    expect(excepcion.paquete, "paquete fuera de la lista cerrada por nombre").toMatch(
      /^((typescript-eslint|@typescript-eslint\/[a-z-]+)@8\.73\.0|@electric-sql\/pglite@0\.5\.17)$/,
    );
    const esPglite = excepcion.paquete === "@electric-sql/pglite@0.5.17";
    expect(excepcion.motivo, `${excepcion.paquete}: motivo ligado a su paquete`).toBe(
      esPglite ? motivoPglite : motivoGhsa,
    );
    expect(
      datos.fechas[excepcion.paquete],
      `${excepcion.paquete}: la fecha no coincide con la del registro fijada en la prueba`,
    ).toBe(publicacionFijada[excepcion.paquete]);
    expect(excepcion.revisarDespues, excepcion.paquete).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    const publicacion = Date.parse(datos.fechas[excepcion.paquete] ?? "");
    expect(Number.isNaN(publicacion), `${excepcion.paquete} sin fecha`).toBe(false);
    const esperadaRevision = new Date(publicacion + 7 * 24 * 3600 * 1000)
      .toISOString()
      .slice(0, 10);
    expect(excepcion.revisarDespues, excepcion.paquete).toBe(esperadaRevision);
    const finDeDia = Date.parse(`${excepcion.revisarDespues}T23:59:59Z`);
    expect(
      Date.now() <= finDeDia,
      `${excepcion.paquete}: excepción caducada: en un cambio revisado, adelantar el límite de esta prueba y de scripts/generar-fechas-bloqueo.mjs, regenerar bloqueo y fechas y quitar las excepciones`,
    ).toBe(true);
    expect(esperadas.has(excepcion.paquete), `${excepcion.paquete} ya no está en el bloqueo`).toBe(
      true,
    );
    expect(
      Date.parse(datos.fechas[excepcion.paquete] ?? ""),
      `${excepcion.paquete} ya es anterior al límite: quitar la excepción`,
    ).toBeGreaterThan(limite);
  }

  const recientes = [...esperadas].filter((clave) => {
    const fecha = datos.fechas[clave];
    expect(fecha, clave).toBeTruthy();
    return Date.parse(fecha ?? "") > limite;
  });
  expect(recientes.sort()).toEqual([...listadas].sort());
}

describe("manifiesto (package.json)", () => {
  const paquete = leerJson("package.json") as {
    name: string;
    private: boolean;
    engines: Record<string, string>;
    scripts: Record<string, string>;
    dependencies: Record<string, string>;
    devDependencies: Record<string, string>;
  };

  it("todas las versiones son exactas, sin ^ ni ~ ni rangos", () => {
    const todas = { ...paquete.dependencies, ...paquete.devDependencies };
    expect(Object.keys(todas).length).toBeGreaterThan(0);
    for (const [nombre, version] of Object.entries(todas)) {
      expect(version, nombre).toMatch(exacta);
    }
  });

  it("fija las versiones del diseño y TypeScript 6.0.x", () => {
    expect(paquete.dependencies["next"]).toBe("16.4.6");
    expect(paquete.dependencies["react"]).toBe("19.3.1");
    expect(paquete.dependencies["react-dom"]).toBe("19.3.1");
    expect(paquete.devDependencies["typescript"]).toMatch(/^6\.0\.\d+$/);
    expect(paquete.devDependencies["eslint"]).toBe("9.39.5");
    expect(paquete.devDependencies["vitest"]).toBe("5.1.0");
    expect(paquete.devDependencies["@types/node"]).toMatch(/^26\./);
    expect(paquete.devDependencies["@types/react"]).toMatch(/^19\./);
    expect(paquete.devDependencies["@types/react-dom"]).toMatch(/^19\./);
  });

  it("las claves de nivel superior son una lista cerrada", () => {
    expect(Object.keys(paquete).sort()).toEqual(
      [
        "name",
        "version",
        "private",
        "license",
        "type",
        "engines",
        "scripts",
        "dependencies",
        "devDependencies",
      ].sort(),
    );
    for (const prohibida of [
      "overrides",
      "optionalDependencies",
      "bundleDependencies",
      "bundledDependencies",
      "workspaces",
      "packageManager",
    ]) {
      expect(paquete, prohibida).not.toHaveProperty(prohibida);
    }
  });

  it("es privado y exige Node 26.x y npm 11", () => {
    expect(paquete.private).toBe(true);
    expect(paquete.engines["node"]).toBe("26.x");
    expect(paquete.engines["npm"]).toBe(">=11 <12");
  });

  it("solo define las órdenes directas, con la cadena del diseño", () => {
    expect(paquete.scripts).toEqual({
      dev: "next dev",
      build: "next build",
      start: "next start",
      test: "vitest run --config vitest.config.ts",
      tipos: "next typegen && tsc --noEmit -p tsconfig.json",
      estilo:
        "prettier --check . --config .prettierrc.json --ignore-path .prettierignore && eslint --config eslint.config.mjs --max-warnings 0 .",
      arnes: "node scripts/comprobar-specs.mjs",
      aislamiento: "node scripts/probar-modelo.mjs",
      verificar:
        "npm run tipos && npm run estilo && npm run test && npm run aislamiento && npm run arnes && npm run build",
    });
  });

  it("no tiene scripts de instalación", () => {
    for (const nombre of ["preinstall", "install", "postinstall", "prepare"]) {
      expect(paquete.scripts, nombre).not.toHaveProperty(nombre);
    }
  });

  it("existe el bloqueo con registro oficial e integridad en cada paquete", () => {
    expect(existsSync(join(raiz, "package-lock.json"))).toBe(true);
    const bloqueo = leerJson("package-lock.json") as {
      lockfileVersion: number;
      packages: Record<string, { resolved?: string; integrity?: string; link?: boolean }>;
    };
    expect(bloqueo.lockfileVersion).toBe(3);
    for (const [ruta, datos] of Object.entries(bloqueo.packages)) {
      if (ruta === "") continue;
      expect(datos.link, ruta).not.toBe(true);
      expect(datos.resolved, ruta).toMatch(/^https:\/\/registry\.npmjs\.org\//);
      expect(datos.integrity, ruta).toBeTruthy();
    }
  });

  it("todo paquete posterior al límite está en la lista cerrada de excepciones, y solo esos", () => {
    // Sin red: las fechas salen de scripts/generar-fechas-bloqueo.mjs (npm view <pkg> time).
    // Limitación: el archivo lo genera el script; para las excepciones, la prueba fija en sí misma
    // las fechas de publicación (sin red) y las exige iguales a las del JSON.
    // Excepciones (D-019, D-027, D-033): typescript-eslint 8.73.0 y sus paquetes @typescript-eslint
    // (D-027: la versión 8.72.2 anterior arrastra GHSA-g3hv-75wg-m249) y @electric-sql/pglite 0.5.17
    // (D-033: solo por calendario, sin motivo de seguridad). Estructura cerrada. Cada
    // excepción caduca 7 días después de la publicación del paquete: pasada esa fecha la prueba
    // falla. Salida real: en un cambio revisado, adelantar el límite de esta prueba y de
    // scripts/generar-fechas-bloqueo.mjs, regenerar bloqueo y fechas y quitar las excepciones.
    // El límite va por días naturales (fin del 12/11), no por «ahora menos 7 días». Si el
    // paquete sale del bloqueo o ya es anterior al límite, también hay que quitarlo.
    const datos = leerJson("tests/unit/plataforma/fechas-publicacion.json") as DatosFechas;
    comprobarFechasYExcepciones(datos);
  });

  it("negativa: alargar la ventana de pglite solo en el JSON hace fallar la comprobación", () => {
    const datos = structuredClone(
      leerJson("tests/unit/plataforma/fechas-publicacion.json"),
    ) as DatosFechas;
    // Fecha y revisión coherentes entre sí, pero distintas de las del registro.
    datos.fechas["@electric-sql/pglite@0.5.17"] = "2026-11-30T11:17:03.254Z";
    const excepcion = datos.excepciones.find((e) => e.paquete === "@electric-sql/pglite@0.5.17");
    expect(excepcion).toBeDefined();
    if (excepcion) excepcion.revisarDespues = "2026-12-07";
    expect(() => comprobarFechasYExcepciones(datos)).toThrow();
  });

  it("negativa: un motivo cruzado entre paquetes hace fallar la comprobación", () => {
    const original = leerJson("tests/unit/plataforma/fechas-publicacion.json") as DatosFechas;
    const motivoGhsa = original.excepciones.find((e) =>
      e.paquete.includes("typescript-eslint"),
    )?.motivo;
    const motivoPglite = original.excepciones.find((e) => e.paquete.includes("pglite"))?.motivo;
    expect(motivoGhsa).toBeDefined();
    expect(motivoPglite).toBeDefined();
    const conPglite = structuredClone(original);
    const a = conPglite.excepciones.find((e) => e.paquete.includes("pglite"));
    if (a && motivoGhsa) a.motivo = motivoGhsa;
    expect(() => comprobarFechasYExcepciones(conPglite)).toThrow();
    const conTse = structuredClone(original);
    const b = conTse.excepciones.find((e) => e.paquete === "typescript-eslint@8.73.0");
    if (b && motivoPglite) b.motivo = motivoPglite;
    expect(() => comprobarFechasYExcepciones(conTse)).toThrow();
  });

  it("fija Node 26 y los saltos de línea", () => {
    expect(leer(".node-version").trim()).toBe("26");
    expect(leer(".gitattributes")).toContain("* text=auto eol=lf");
  });
});

describe("tsconfig.json", () => {
  const ts = leerJson("tsconfig.json") as { compilerOptions: Record<string, unknown> };

  it("es estricto y no admite JavaScript", () => {
    expect(ts.compilerOptions["strict"]).toBe(true);
    expect(ts.compilerOptions["noUncheckedIndexedAccess"]).toBe(true);
    expect(ts.compilerOptions["allowJs"]).toBe(false);
  });

  it("lleva incremental, que next y tsc escriben de todos modos", () => {
    expect(ts.compilerOptions["incremental"]).toBe(true);
  });
});

describe("vitest.config.ts", () => {
  it("no pasa sin pruebas, no admite .only e incluye tests y pglite", async () => {
    const modulo = (await import("../../../vitest.config")) as {
      default: { test?: Record<string, unknown> };
    };
    const prueba = modulo.default.test ?? {};
    expect(prueba["passWithNoTests"]).toBe(false);
    expect(prueba["allowOnly"]).toBe(false);
    const incluye = (prueba["include"] ?? []) as string[];
    expect(incluye.some((p) => p.startsWith("tests/**"))).toBe(true);
    expect(incluye.some((p) => p.startsWith("supabase/tests/pglite/**"))).toBe(true);
  });
});
