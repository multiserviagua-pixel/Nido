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

type PaquetesBloqueo = Record<
  string,
  {
    resolved?: string;
    integrity?: string;
    link?: boolean;
    inBundle?: boolean;
    hasInstallScript?: boolean;
    bundleDependencies?: string[];
  }
>;

// Listas cerradas: añadir una entrada exige cambiar esta prueba en una revisión.
const padresConInBundleAdmitidos = ["node_modules/@tailwindcss/oxide-wasm32-wasi"];
const entradasConScriptDeInstalacion = ["node_modules/fsevents"];

// Cada entrada exige registro oficial e integridad. Solo se exime inBundle === true si: la ruta es
// anidada, el nombre figura en bundleDependencies del padre, la entrada no tiene resolved ni
// integrity, el padre tiene registro e integridad y el padre está en una lista cerrada.
function comprobarRegistroEIntegridad(paquetes: PaquetesBloqueo): void {
  for (const [ruta, datos] of Object.entries(paquetes)) {
    if (ruta === "") continue;
    if (datos.inBundle === true) {
      const corte = ruta.lastIndexOf("/node_modules/");
      expect(corte, `${ruta}: inBundle solo en rutas anidadas`).toBeGreaterThan(0);
      const rutaPadre = ruta.slice(0, corte);
      const nombre = ruta.slice(corte + "/node_modules/".length);
      const padre = paquetes[rutaPadre];
      expect(padresConInBundleAdmitidos, `${ruta}: padre fuera de la lista cerrada`).toContain(
        rutaPadre,
      );
      expect(padre?.bundleDependencies ?? [], `${ruta}: no figura en bundleDependencies`).toContain(
        nombre,
      );
      expect(datos.resolved, `${ruta}: inBundle con resolved`).toBeUndefined();
      expect(datos.integrity, `${ruta}: inBundle con integrity`).toBeUndefined();
      expect(padre?.resolved, `${ruta}: padre sin registro`).toMatch(
        /^https:\/\/registry\.npmjs\.org\//,
      );
      expect(padre?.integrity, `${ruta}: padre sin integridad`).toBeTruthy();
      continue;
    }
    expect(datos.link, ruta).not.toBe(true);
    expect(datos.resolved, ruta).toMatch(/^https:\/\/registry\.npmjs\.org\//);
    expect(datos.integrity, ruta).toBeTruthy();
  }
}

function comprobarScriptsDeInstalacion(paquetes: PaquetesBloqueo): void {
  const con = Object.entries(paquetes)
    .filter(([, d]) => d.hasInstallScript === true)
    .map(([r]) => r);
  expect(con.sort()).toEqual([...entradasConScriptDeInstalacion].sort());
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
      navegador: "playwright test --config playwright.config.ts",
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

  it("existe el bloqueo con registro oficial e integridad en cada paquete (salvo inBundle)", () => {
    expect(existsSync(join(raiz, "package-lock.json"))).toBe(true);
    const bloqueo = leerJson("package-lock.json") as {
      lockfileVersion: number;
      packages: PaquetesBloqueo;
    };
    expect(bloqueo.lockfileVersion).toBe(3);
    comprobarRegistroEIntegridad(bloqueo.packages);
  });

  it("negativa: una entrada sin integridad y sin inBundle sigue fallando", () => {
    const sinIntegridad: PaquetesBloqueo = {
      "": {},
      "node_modules/x": { resolved: "https://registry.npmjs.org/x/-/x-1.0.0.tgz" },
    };
    expect(() => comprobarRegistroEIntegridad(sinIntegridad)).toThrow();
    // Caso admitido: padre de la lista cerrada, con bundleDependencies, registro e integridad.
    const padreAdmitido = {
      resolved: "https://registry.npmjs.org/p/-/p-1.0.0.tgz",
      integrity: "sha512-x",
      bundleDependencies: ["y"],
    };
    const rutaPadre = "node_modules/@tailwindcss/oxide-wasm32-wasi";
    expect(() =>
      comprobarRegistroEIntegridad({
        [rutaPadre]: padreAdmitido,
        [`${rutaPadre}/node_modules/y`]: { inBundle: true },
      }),
    ).not.toThrow();
    // Padre fuera de la lista cerrada falla, aunque todo lo demás sea correcto.
    expect(() =>
      comprobarRegistroEIntegridad({
        "node_modules/p": padreAdmitido,
        "node_modules/p/node_modules/y": { inBundle: true },
      }),
    ).toThrow(/lista cerrada/);
    // Padre sin bundleDependencies falla.
    expect(() =>
      comprobarRegistroEIntegridad({
        [rutaPadre]: { resolved: padreAdmitido.resolved, integrity: "sha512-x" },
        [`${rutaPadre}/node_modules/y`]: { inBundle: true },
      }),
    ).toThrow(/bundleDependencies/);
    // inBundle con resolved falla.
    expect(() =>
      comprobarRegistroEIntegridad({
        [rutaPadre]: padreAdmitido,
        [`${rutaPadre}/node_modules/y`]: { inBundle: true, resolved: "https://x.example/y.tgz" },
      }),
    ).toThrow(/resolved/);
    // inBundle con integrity falla.
    expect(() =>
      comprobarRegistroEIntegridad({
        [rutaPadre]: padreAdmitido,
        [`${rutaPadre}/node_modules/y`]: { inBundle: true, integrity: "sha512-z" },
      }),
    ).toThrow(/integrity/);
    // Nombre ausente de bundleDependencies del padre falla.
    expect(() =>
      comprobarRegistroEIntegridad({
        [rutaPadre]: padreAdmitido,
        [`${rutaPadre}/node_modules/otro`]: { inBundle: true },
      }),
    ).toThrow(/bundleDependencies/);
    // inBundle de primer nivel falla.
    expect(() => comprobarRegistroEIntegridad({ "node_modules/y": { inBundle: true } })).toThrow();
    // inBundle anidado con padre sin integridad falla.
    expect(() =>
      comprobarRegistroEIntegridad({
        [rutaPadre]: { resolved: padreAdmitido.resolved, bundleDependencies: ["y"] },
        [`${rutaPadre}/node_modules/y`]: { inBundle: true },
      }),
    ).toThrow();
    // inBundle distinto de true no exime.
    expect(() => comprobarRegistroEIntegridad({ "node_modules/z": { inBundle: false } })).toThrow();
  });

  it("los scripts de instalación del bloqueo son una lista cerrada, con caso negativo", () => {
    const bloqueo = leerJson("package-lock.json") as { packages: PaquetesBloqueo };
    comprobarScriptsDeInstalacion(bloqueo.packages);
    expect(() =>
      comprobarScriptsDeInstalacion({
        "node_modules/fsevents": { hasInstallScript: true },
        "node_modules/malo": { hasInstallScript: true },
      }),
    ).toThrow();
    expect(() => comprobarScriptsDeInstalacion({})).toThrow();
  });

  it("playwright.config.ts no usa npx ni envía telemetría", () => {
    const config = leer("playwright.config.ts");
    expect(config).not.toMatch(/\bnpx\b/);
    expect(config).toMatch(/NEXT_TELEMETRY_DISABLED:\s*"1"/);
  });

  it("el bloqueo no contiene paquetes de Radix descartados", () => {
    const bloqueo = leerJson("package-lock.json") as { packages: PaquetesBloqueo };
    const rutas = Object.keys(bloqueo.packages);
    for (const nombre of [
      "@radix-ui/react-toast",
      "@radix-ui/react-collection",
      "@radix-ui/react-visually-hidden",
    ]) {
      expect(
        rutas.filter((r) => r.endsWith(`node_modules/${nombre}`)),
        nombre,
      ).toEqual([]);
    }
  });

  it("playwright.config.ts no admite reintentos", () => {
    expect(leer("playwright.config.ts")).toMatch(/^\s*retries:\s*0,/m);
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
