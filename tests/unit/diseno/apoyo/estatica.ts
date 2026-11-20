// Comprobación estática de los archivos de prueba (PRUEBA-036, parte que no depende de la 002).
// Falla si en `tests/e2e/` o en `tests/unit/diseno/`, fuera de los archivos que deciden el
// resultado, aparece: una importación de `axe`; una prueba saltada, aislada o marcada como
// fallo esperado; un filtro sobre la lista de infracciones; o una desactivación de reglas.
// Lee el código con el analizador de TypeScript: el texto de una cadena o de un comentario no
// cuenta, solo la sintaxis real.
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";
import ts from "typescript";
import type { Hallazgo } from "./fronteras";

export const CARPETAS_VIGILADAS = ["tests/e2e", "tests/unit/diseno"];

/** Los archivos de pruebas que deciden el resultado y que pueden salirse de la regla (están
 * protegidos por el «sí» del responsable). `playwright.config.ts` e `inventario.ts` están
 * fuera de las carpetas vigiladas. */
export const ARCHIVOS_EXENTOS = [
  "tests/e2e/muestra/configuracion-interfaz.ts",
  "tests/unit/diseno/excepciones.ts",
  "tests/unit/diseno/paquetes-de-cliente.ts",
];

const PAQUETES_DE_AXE = /^(axe-core|axe-playwright|jest-axe|vitest-axe|@axe-core\/.+)$/;
// Nombres que marcan una prueba como saltada, aislada o pendiente, sobre cualquier objeto.
const MARCAS_DE_SALTO = new Set(["skip", "only", "fixme", "todo", "skipIf", "runIf"]);
// `fail` y `fails` con cualquier raíz (`test.fail`, `testInfo.fail()`, `test.info().fail()`),
// salvo las aserciones: `expect.fail` y `assert.fail` hacen fallar, no esperan el fallo.
const MARCAS_DE_FALLO_ESPERADO = new Set(["fail", "fails"]);
const RAICES_DE_ASERCION = new Set(["expect", "assert"]);
const PREFIJOS_VIEJOS = new Set(["xit", "xtest", "xdescribe", "fit", "fdescribe"]);
const LISTA_DE_INFRACCIONES = new Set(["violations", "infracciones"]);
const METODOS_QUE_FILTRAN = new Set([
  "filter",
  "slice",
  "splice",
  "pop",
  "shift",
  "flatMap",
  "reduce",
]);
const LLAMADAS_QUE_DESACTIVAN = new Set(["disableRules", "exclude", "include", "options"]);

function listar(carpeta: string, salida: string[]): void {
  if (!existsSync(carpeta)) return;
  for (const nombre of readdirSync(carpeta)) {
    if (nombre === "node_modules") continue;
    const completa = join(carpeta, nombre);
    if (statSync(completa).isDirectory()) listar(completa, salida);
    else if (/\.(ts|tsx|mts|cts|js|jsx|mjs|cjs)$/.test(nombre)) salida.push(completa);
  }
}

function nombreDePropiedad(n: ts.Node): string | null {
  if (ts.isPropertyAccessExpression(n)) return n.name.text;
  if (ts.isElementAccessExpression(n) && ts.isStringLiteralLike(n.argumentExpression)) {
    return n.argumentExpression.text;
  }
  return null;
}

/** Raíz de una cadena `a.b.c`, `a["b"].c` o `a.b().c` (por ejemplo `test` en `test.info().fail`). */
function raizDeCadena(n: ts.Node): string | null {
  let actual: ts.Node = n;
  while (
    ts.isPropertyAccessExpression(actual) ||
    ts.isElementAccessExpression(actual) ||
    ts.isCallExpression(actual) ||
    ts.isParenthesizedExpression(actual) ||
    ts.isNonNullExpression(actual)
  ) {
    actual = actual.expression;
  }
  return ts.isIdentifier(actual) ? actual.text : null;
}

/** Nombres `expect` o `assert` que en realidad son otra cosa: `import { test as expect }`,
 * `import * as expect from "vitest"` o `const expect = test`. Con ellos, `expect.fail` es
 * `test.fail` y no se exime. */
function nombresDeAsercionReasignados(fuente: ts.SourceFile): Set<string> {
  const salida = new Set<string>();
  const visitar = (n: ts.Node): void => {
    if (ts.isImportSpecifier(n) && RAICES_DE_ASERCION.has(n.name.text)) {
      if (!RAICES_DE_ASERCION.has((n.propertyName ?? n.name).text)) salida.add(n.name.text);
    } else if (ts.isNamespaceImport(n) && RAICES_DE_ASERCION.has(n.name.text)) {
      salida.add(n.name.text);
    } else if (
      ts.isVariableDeclaration(n) &&
      ts.isIdentifier(n.name) &&
      RAICES_DE_ASERCION.has(n.name.text) &&
      n.initializer !== undefined
    ) {
      const raiz = raizDeCadena(n.initializer);
      if (raiz === null || !RAICES_DE_ASERCION.has(raiz)) salida.add(n.name.text);
    }
    ts.forEachChild(n, visitar);
  };
  visitar(fuente);
  return salida;
}

function esListaDeInfracciones(n: ts.Node): boolean {
  if (ts.isIdentifier(n)) return LISTA_DE_INFRACCIONES.has(n.text);
  const nombre = nombreDePropiedad(n);
  return nombre !== null && LISTA_DE_INFRACCIONES.has(nombre);
}

export function analizarArchivo(ruta: string, texto: string): Hallazgo[] {
  const salida: Hallazgo[] = [];
  const fuente = ts.createSourceFile(
    ruta,
    texto,
    ts.ScriptTarget.Latest,
    true,
    ruta.endsWith("x") ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  );
  const reasignados = nombresDeAsercionReasignados(fuente);
  const anotar = (regla: string, detalle: string): void => {
    salida.push({ regla, archivo: ruta, detalle });
  };
  const visitar = (n: ts.Node): void => {
    // 1. Importaciones de axe: estáticas, dinámicas, require y reexportaciones.
    let especificador: string | null = null;
    if (ts.isImportDeclaration(n) && ts.isStringLiteral(n.moduleSpecifier)) {
      especificador = n.moduleSpecifier.text;
    } else if (
      ts.isExportDeclaration(n) &&
      n.moduleSpecifier &&
      ts.isStringLiteral(n.moduleSpecifier)
    ) {
      especificador = n.moduleSpecifier.text;
    } else if (
      ts.isCallExpression(n) &&
      (n.expression.kind === ts.SyntaxKind.ImportKeyword ||
        (ts.isIdentifier(n.expression) && n.expression.text === "require"))
    ) {
      // Una importación con un texto que no es literal no se evalúa: es un límite conocido
      // (el diseño dice que esta comprobación no ve todo; lo completa la revisión).
      const a = n.arguments[0];
      if (a && ts.isStringLiteralLike(a)) especificador = a.text;
    }
    if (especificador !== null) {
      const paquete = especificador.startsWith("@")
        ? especificador.split("/").slice(0, 2).join("/")
        : (especificador.split("/")[0] ?? "");
      if (PAQUETES_DE_AXE.test(paquete)) anotar("importación de axe", especificador);
    }

    // 2. Pruebas saltadas, aisladas o marcadas como fallo esperado.
    if (ts.isPropertyAccessExpression(n) || ts.isElementAccessExpression(n)) {
      const nombre = nombreDePropiedad(n);
      if (nombre !== null && MARCAS_DE_SALTO.has(nombre)) {
        anotar("prueba saltada o aislada", nombre);
      } else if (nombre !== null && MARCAS_DE_FALLO_ESPERADO.has(nombre)) {
        const raiz = raizDeCadena(n);
        if (raiz === null || !RAICES_DE_ASERCION.has(raiz) || reasignados.has(raiz)) {
          anotar("prueba marcada como fallo esperado", nombre);
        }
      }
    }
    // `const { skip } = test` o `const { fail } = it`: sacar la marca del ejecutor para llamarla
    // sin punto. `const { fail } = expect` (aserción real) no cuenta.
    if (ts.isBindingElement(n) && ts.isObjectBindingPattern(n.parent)) {
      const marca = (n.propertyName ?? n.name).getText(fuente).replace(/["']/g, "");
      if (MARCAS_DE_SALTO.has(marca)) {
        anotar("prueba saltada o aislada", `desestructura ${marca}`);
      } else if (MARCAS_DE_FALLO_ESPERADO.has(marca)) {
        let declaracion: ts.Node = n.parent;
        while (
          declaracion.parent !== undefined &&
          (ts.isBindingElement(declaracion.parent) || ts.isObjectBindingPattern(declaracion.parent))
        ) {
          declaracion = declaracion.parent;
        }
        const origen = declaracion.parent;
        const raiz =
          origen !== undefined && ts.isVariableDeclaration(origen) && origen.initializer
            ? raizDeCadena(origen.initializer)
            : null;
        if (raiz === null || !RAICES_DE_ASERCION.has(raiz) || reasignados.has(raiz)) {
          anotar("prueba marcada como fallo esperado", `desestructura ${marca}`);
        }
      }
    }
    // `test.describe.configure({ retries })`: los reintentos enmascaran un fallo intermitente.
    if (
      ts.isCallExpression(n) &&
      nombreDePropiedad(n.expression) === "configure" &&
      n.arguments.some(
        (a) =>
          ts.isObjectLiteralExpression(a) &&
          a.properties.some(
            (p) =>
              p.name !== undefined && p.name.getText(fuente).replace(/["']/g, "") === "retries",
          ),
      )
    ) {
      anotar("reintentos que enmascaran fallos", "configure({ retries })");
    }
    if (ts.isIdentifier(n) && PREFIJOS_VIEJOS.has(n.text) && ts.isCallExpression(n.parent)) {
      anotar("prueba saltada o aislada", n.text);
    }

    // 3. Filtros sobre la lista de infracciones.
    if (ts.isPropertyAccessExpression(n) || ts.isElementAccessExpression(n)) {
      const metodo = nombreDePropiedad(n);
      if (
        metodo !== null &&
        METODOS_QUE_FILTRAN.has(metodo) &&
        esListaDeInfracciones(n.expression)
      ) {
        anotar("filtro sobre las infracciones", metodo);
      }
    }
    if (
      ts.isBinaryExpression(n) &&
      n.operatorToken.kind >= ts.SyntaxKind.FirstAssignment &&
      n.operatorToken.kind <= ts.SyntaxKind.LastAssignment &&
      (esListaDeInfracciones(n.left) ||
        ((ts.isPropertyAccessExpression(n.left) || ts.isElementAccessExpression(n.left)) &&
          esListaDeInfracciones(n.left.expression)))
    ) {
      anotar("filtro sobre las infracciones", "asignación a la lista");
    }
    if (ts.isDeleteExpression(n) && esListaDeInfracciones(n.expression)) {
      anotar("filtro sobre las infracciones", "delete");
    }

    // 4. Reglas desactivadas o resultados excluidos.
    if (ts.isCallExpression(n)) {
      const llamada = nombreDePropiedad(n.expression);
      if (llamada !== null && LLAMADAS_QUE_DESACTIVAN.has(llamada)) {
        anotar("regla desactivada o elemento excluido", llamada);
      }
    }
    if (
      ts.isPropertyAssignment(n) &&
      (ts.isIdentifier(n.name) || ts.isStringLiteral(n.name)) &&
      n.name.text === "enabled" &&
      n.initializer.kind === ts.SyntaxKind.FalseKeyword
    ) {
      anotar("regla desactivada o elemento excluido", "enabled: false");
    }
    ts.forEachChild(n, visitar);
  };
  visitar(fuente);
  return salida;
}

/** Analiza las carpetas vigiladas bajo `raiz`, salvo los archivos exentos. */
export function analizarCarpetas(
  raiz: string,
  carpetas: readonly string[] = CARPETAS_VIGILADAS,
  exentos: readonly string[] = ARCHIVOS_EXENTOS,
): { archivos: string[]; hallazgos: Hallazgo[] } {
  const completos: string[] = [];
  for (const c of carpetas) listar(join(raiz, c), completos);
  const archivos: string[] = [];
  const hallazgos: Hallazgo[] = [];
  for (const completo of completos.sort()) {
    const ruta = relative(raiz, completo).split(sep).join("/");
    if (exentos.includes(ruta)) continue;
    archivos.push(ruta);
    hallazgos.push(...analizarArchivo(ruta, readFileSync(completo, "utf8")));
  }
  return { archivos, hallazgos };
}
