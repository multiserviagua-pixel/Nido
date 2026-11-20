// Grafo de módulos de `src/` (020, T-003). Lo usan PRUEBA-008 (fronteras) y PRUEBA-037
// (paquetes que llegan al navegador). Lee el código con el analizador de TypeScript, no con
// expresiones regulares: ve importaciones estáticas, dinámicas, `require`, reexportaciones
// e importaciones de tipo, y resuelve el alias `@/` y las rutas relativas a un archivo real.
import { builtinModules } from "node:module";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative, resolve, sep } from "node:path";
import ts from "typescript";

export type TipoArista = "estatica" | "dinamica" | "reexportacion" | "require" | "tipo-importado";

export type Arista = {
  desde: string;
  especificador: string;
  tipo: TipoArista;
  /** Se borra al compilar: no llega a ningún paquete de ejecución. */
  soloTipo: boolean;
  /** Ruta (relativa a la raíz, con «/») del archivo interno al que lleva, si es interno. */
  hacia: string | null;
  /** Nombre del paquete, si el especificador es de un paquete de npm. */
  paquete: string | null;
  /** Módulo propio de Node (`node:fs`, `path`…). */
  nativo: boolean;
  /** Interno que no se resuelve a un archivo, o importación dinámica con texto no literal. */
  sinResolver: boolean;
};

export type Modulo = {
  ruta: string;
  cliente: boolean;
  servidor: boolean;
  aristas: Arista[];
  fuente: ts.SourceFile;
};

export type Grafo = { raiz: string; modulos: Map<string, Modulo> };

const EXTENSIONES = [".ts", ".tsx", ".mts", ".cts", ".js", ".jsx", ".mjs", ".cjs"];

export function aPosix(ruta: string): string {
  return ruta.split(sep).join("/");
}

function listarArchivos(carpeta: string, salida: string[]): void {
  if (!existsSync(carpeta)) return;
  for (const nombre of readdirSync(carpeta)) {
    if (nombre === "node_modules" || nombre === ".next") continue;
    const completa = join(carpeta, nombre);
    if (statSync(completa).isDirectory()) listarArchivos(completa, salida);
    else if (EXTENSIONES.some((e) => nombre.endsWith(e)) && !nombre.endsWith(".d.ts")) {
      salida.push(completa);
    }
  }
}

export function nombreDePaquete(especificador: string): string {
  const trozos = especificador.split("/");
  const primero = trozos[0] ?? especificador;
  return primero.startsWith("@") ? `${primero}/${trozos[1] ?? ""}` : primero;
}

const NATIVOS = new Set(builtinModules.flatMap((m) => [m, `node:${m}`]));

function directivas(fuente: ts.SourceFile): Set<string> {
  const salida = new Set<string>();
  for (const s of fuente.statements) {
    if (ts.isExpressionStatement(s) && ts.isStringLiteral(s.expression)) {
      salida.add(s.expression.text);
    } else break;
  }
  return salida;
}

function resolverInterno(raiz: string, desdeArchivo: string, especificador: string): string | null {
  let base: string;
  if (especificador.startsWith("@/")) base = resolve(raiz, "src", especificador.slice(2));
  else base = resolve(dirname(desdeArchivo), especificador);
  const resultado = ts.resolveModuleName(
    base,
    desdeArchivo,
    {
      moduleResolution: ts.ModuleResolutionKind.Bundler,
      module: ts.ModuleKind.ESNext,
      allowJs: true,
      jsx: ts.JsxEmit.ReactJSX,
    },
    ts.sys,
  ).resolvedModule;
  let destino: string | null = resultado ? resultado.resolvedFileName : null;
  if (destino === null) {
    // Recursos que no son módulos de código (hojas de estilo, SVG…): basta con que existan.
    for (const candidato of [base, ...EXTENSIONES.map((e) => base + e)]) {
      if (existsSync(candidato) && statSync(candidato).isFile()) {
        destino = candidato;
        break;
      }
    }
  }
  if (destino === null) return null;
  return aPosix(relative(raiz, destino));
}

function crearArista(
  raiz: string,
  archivo: string,
  especificador: string,
  tipo: TipoArista,
  soloTipo: boolean,
): Arista {
  const base = { desde: aPosix(relative(raiz, archivo)), especificador, tipo, soloTipo };
  if (NATIVOS.has(especificador)) {
    return { ...base, hacia: null, paquete: null, nativo: true, sinResolver: false };
  }
  if (
    especificador.startsWith(".") ||
    especificador.startsWith("/") ||
    especificador.startsWith("@/")
  ) {
    const hacia = resolverInterno(raiz, archivo, especificador);
    return { ...base, hacia, paquete: null, nativo: false, sinResolver: hacia === null };
  }
  return {
    ...base,
    hacia: null,
    paquete: nombreDePaquete(especificador),
    nativo: false,
    sinResolver: false,
  };
}

function textoLiteral(nodo: ts.Node | undefined): string | null {
  if (nodo && (ts.isStringLiteral(nodo) || ts.isNoSubstitutionTemplateLiteral(nodo))) {
    return nodo.text;
  }
  return null;
}

function todosLosNombresSonDeTipo(decl: ts.ImportDeclaration): boolean {
  const clausula = decl.importClause;
  if (!clausula) return false;
  if (clausula.isTypeOnly) return true;
  if (clausula.name) return false;
  const enlaces = clausula.namedBindings;
  if (!enlaces || ts.isNamespaceImport(enlaces)) return false;
  return enlaces.elements.length > 0 && enlaces.elements.every((e) => e.isTypeOnly);
}

function extraerAristas(raiz: string, archivo: string, fuente: ts.SourceFile): Arista[] {
  const aristas: Arista[] = [];
  const noLiteral = (tipo: TipoArista): Arista => ({
    desde: aPosix(relative(raiz, archivo)),
    especificador: "<no literal>",
    tipo,
    soloTipo: false,
    hacia: null,
    paquete: null,
    nativo: false,
    sinResolver: true,
  });
  const visitar = (nodo: ts.Node): void => {
    if (ts.isImportDeclaration(nodo)) {
      const e = textoLiteral(nodo.moduleSpecifier);
      if (e !== null) {
        const solo = todosLosNombresSonDeTipo(nodo);
        aristas.push(crearArista(raiz, archivo, e, solo ? "tipo-importado" : "estatica", solo));
      }
    } else if (ts.isExportDeclaration(nodo) && nodo.moduleSpecifier) {
      const e = textoLiteral(nodo.moduleSpecifier);
      if (e !== null) {
        aristas.push(crearArista(raiz, archivo, e, "reexportacion", nodo.isTypeOnly));
      }
    } else if (
      ts.isImportEqualsDeclaration(nodo) &&
      ts.isExternalModuleReference(nodo.moduleReference)
    ) {
      const e = textoLiteral(nodo.moduleReference.expression);
      if (e !== null) aristas.push(crearArista(raiz, archivo, e, "require", nodo.isTypeOnly));
    } else if (ts.isImportTypeNode(nodo)) {
      const lit = nodo.argument;
      const e = ts.isLiteralTypeNode(lit) ? textoLiteral(lit.literal) : null;
      if (e !== null) aristas.push(crearArista(raiz, archivo, e, "tipo-importado", true));
    } else if (ts.isCallExpression(nodo)) {
      const esDinamica = nodo.expression.kind === ts.SyntaxKind.ImportKeyword;
      const esRequire = ts.isIdentifier(nodo.expression) && nodo.expression.text === "require";
      if (esDinamica || esRequire) {
        const e = textoLiteral(nodo.arguments[0]);
        if (e !== null) {
          aristas.push(crearArista(raiz, archivo, e, esDinamica ? "dinamica" : "require", false));
        } else {
          aristas.push(noLiteral(esDinamica ? "dinamica" : "require"));
        }
      }
    }
    ts.forEachChild(nodo, visitar);
  };
  visitar(fuente);
  return aristas;
}

/** Construye el grafo de todos los módulos de código de las carpetas dadas (por defecto, `src`). */
export function construirGrafo(raiz: string, carpetas: readonly string[] = ["src"]): Grafo {
  const archivos: string[] = [];
  for (const c of carpetas) listarArchivos(join(raiz, c), archivos);
  const modulos = new Map<string, Modulo>();
  for (const archivo of archivos.sort()) {
    const texto = readFileSync(archivo, "utf8");
    const fuente = ts.createSourceFile(
      archivo,
      texto,
      ts.ScriptTarget.Latest,
      true,
      archivo.endsWith("x") ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
    );
    const d = directivas(fuente);
    const ruta = aPosix(relative(raiz, archivo));
    modulos.set(ruta, {
      ruta,
      cliente: d.has("use client"),
      servidor: d.has("use server"),
      aristas: extraerAristas(raiz, archivo, fuente),
      fuente,
    });
  }
  return { raiz, modulos };
}

export type Alcance = {
  modulos: Set<string>;
  paquetes: Set<string>;
  /** Cadena de módulos desde un origen hasta `destino` (para el mensaje del hallazgo). */
  cadena: (destino: string) => string[];
};

/** Todo lo que se alcanza siguiendo importaciones desde los orígenes dados. */
export function alcanzables(
  grafo: Grafo,
  origenes: readonly string[],
  opciones: { incluirTipos: boolean },
): Alcance {
  const modulos = new Set<string>();
  const paquetes = new Set<string>();
  const padre = new Map<string, string>();
  const cola: string[] = [];
  for (const o of origenes) {
    if (!modulos.has(o)) {
      modulos.add(o);
      cola.push(o);
    }
  }
  while (cola.length > 0) {
    const actual = cola.shift() as string;
    const modulo = grafo.modulos.get(actual);
    if (!modulo) continue;
    for (const a of modulo.aristas) {
      if (a.soloTipo && !opciones.incluirTipos) continue;
      if (a.paquete !== null) {
        const clave = `paquete:${a.paquete}`;
        if (!paquetes.has(a.paquete)) {
          paquetes.add(a.paquete);
          padre.set(clave, actual);
        }
      }
      if (a.hacia !== null && !modulos.has(a.hacia)) {
        modulos.add(a.hacia);
        padre.set(a.hacia, actual);
        cola.push(a.hacia);
      }
    }
  }
  const cadena = (destino: string): string[] => {
    const salida = [destino];
    let actual = padre.get(destino);
    while (actual !== undefined) {
      salida.unshift(actual);
      actual = padre.get(actual);
    }
    return salida;
  };
  return { modulos, paquetes, cadena };
}
