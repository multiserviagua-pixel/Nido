// Reglas de frontera de la 020 sobre el grafo de módulos (PRUEBA-008). Cada regla devuelve
// hallazgos; la prueba exige cero sobre `src/` y comprueba, con árboles sembrados, que cada
// regla detecta lo que dice detectar (una regla que no puede fallar no es una prueba).
import ts from "typescript";
import { alcanzables, type Grafo, type Modulo } from "./grafo";
import {
  excepcionesDeImportacion,
  type ExcepcionDeImportacion,
  type OrigenDeExcepcion,
} from "../excepciones";

export type Hallazgo = { regla: string; archivo: string; detalle: string };

export const ARCHIVO_ACCESO = "src/app/muestra/_datos/acceso-muestra.ts";
export const FALLO_SERVIDOR = "src/lib/errores/fallo-servidor.ts";
export const SIN_ACCESO = "src/lib/errores/sin-acceso.ts";
export const REGISTRO = "src/lib/registro/registro.ts";

const ARBOLES_DE_PANEL = ["src/app/admin/", "src/app/panel/"];
const CARPETAS_SIN_DATOS = ["src/components/", "src/app/muestra/"];
const PROHIBIDAS_DE_LIB = ["supabase", "oauth", "licencias", "stripe"];
const NOMBRES_DE_RED = ["fetch", "XMLHttpRequest", "WebSocket", "EventSource", "sendBeacon"];
const PAQUETES_DE_PRUEBA =
  /^(web-vitals|playwright|playwright-core|@playwright\/.+|axe-core|@axe-core\/.+)$/;
// Incluye la extensión (`next/navigation.js`) y las rutas internas del paquete
// (`next/dist/client/components/navigation`, `next/dist/client/router`).
const ES_ENRUTADOR_DE_NEXT = /^next\/(?:[\w./-]+\/)?(?:navigation|router)(?:\.[cm]?js)?$/;
export const SELECTOR_DE_PERIODO = "src/components/armazon/SelectorPeriodo.tsx";
const ES_RADIX = /^(radix-ui|@radix-ui\/.+)$/;

const enCarpetas = (ruta: string, carpetas: readonly string[]): boolean =>
  carpetas.some((c) => ruta.startsWith(c));

function nombreSinExtension(ruta: string): string {
  const base = ruta.slice(ruta.lastIndexOf("/") + 1);
  return base.replace(/\.(muestra\.)?(tsx|ts|jsx|js|mjs|cjs|mts|cts)$/, "");
}

function origenCoincide(o: OrigenDeExcepcion, ruta: string): boolean {
  if (o.tipo === "cualquiera") return true;
  if (o.tipo === "archivo") return ruta === o.ruta;
  return ruta.startsWith(o.ruta);
}

function estaExceptuada(
  excepciones: readonly ExcepcionDeImportacion[],
  desde: string,
  hacia: string,
): boolean {
  return excepciones.some((e) => e.hacia === hacia && origenCoincide(e.desde, desde));
}

// ---------------------------------------------------------------- R1: importaciones de src/lib

/** Una excepción que vale para cualquier origen no restringe a quien la usa. */
const exceptuadaParaTodos = (excepciones: readonly ExcepcionDeImportacion[], hacia: string) =>
  excepciones.some((e) => e.hacia === hacia && e.desde.tipo === "cualquiera");

function nombreImportado(
  e: ts.Expression | undefined,
  enlaces: Map<string, string>,
): string | null {
  let x = e;
  while (x !== undefined && (ts.isParenthesizedExpression(x) || ts.isAsExpression(x))) {
    x = x.expression;
  }
  return x !== undefined && ts.isIdentifier(x) && enlaces.has(x.text) ? x.text : null;
}

/** Lo que el módulo vuelve a exponer de `src/lib/` (reexportación directa, `export { x }` de algo
 * importado, `export default x` o `export const y = x`). Una excepción vale para quien importa
 * directamente: si el módulo exceptuado lo reexpone, un tercero se saltaría la regla. */
function reexposiciones(m: Modulo): Array<{ destino: string; como: string }> {
  const salida: Array<{ destino: string; como: string }> = [];
  const enlaces = new Map<string, string>(); // nombre local -> módulo de src/lib
  for (const s of m.fuente.statements) {
    if (!ts.isImportDeclaration(s) || !ts.isStringLiteral(s.moduleSpecifier)) continue;
    if (s.importClause === undefined || s.importClause.isTypeOnly) continue;
    const texto = s.moduleSpecifier.text;
    const destino = m.aristas.find((a) => a.especificador === texto && !a.soloTipo)?.hacia;
    if (!destino || !destino.startsWith("src/lib/")) continue;
    const c = s.importClause;
    if (c.name) enlaces.set(c.name.text, destino);
    if (c.namedBindings && ts.isNamespaceImport(c.namedBindings)) {
      enlaces.set(c.namedBindings.name.text, destino);
    } else if (c.namedBindings) {
      for (const e of c.namedBindings.elements) {
        if (!e.isTypeOnly) enlaces.set(e.name.text, destino);
      }
    }
  }
  for (const a of m.aristas) {
    if (a.tipo === "reexportacion" && !a.soloTipo && a.hacia?.startsWith("src/lib/")) {
      salida.push({ destino: a.hacia, como: `export ... from "${a.especificador}"` });
    }
  }
  const anotar = (nombre: string | null, como: string): void => {
    if (nombre !== null) salida.push({ destino: enlaces.get(nombre) as string, como });
  };
  for (const s of m.fuente.statements) {
    if (ts.isExportDeclaration(s) && !s.moduleSpecifier && !s.isTypeOnly && s.exportClause) {
      if (ts.isNamedExports(s.exportClause)) {
        for (const e of s.exportClause.elements) {
          const local = e.propertyName ?? e.name;
          if (!e.isTypeOnly) anotar(nombreImportado(local, enlaces), `export { ${local.text} }`);
        }
      }
    } else if (ts.isExportAssignment(s)) {
      anotar(nombreImportado(s.expression, enlaces), "export default");
    } else if (ts.isVariableStatement(s) && exportadoPorModificador(s)) {
      for (const d of s.declarationList.declarations) {
        anotar(nombreImportado(d.initializer, enlaces), "export const = importado");
      }
    }
  }
  return salida;
}

function reglaImportaciones(
  grafo: Grafo,
  excepciones: readonly ExcepcionDeImportacion[],
  salida: Hallazgo[],
): void {
  // Cada origen sigue sus importaciones a través de módulos que no son de src/lib/ ni de las
  // carpetas vigiladas (puentes y reexportaciones en `src/`, que comprueban su propio origen) y,
  // en el primer módulo de src/lib/ que toca, exige una excepción válida para ESE origen.
  for (const origen of grafo.modulos.values()) {
    if (!enCarpetas(origen.ruta, CARPETAS_SIN_DATOS)) continue;
    const padre = new Map<string, string>();
    const visitados = new Set<string>([origen.ruta]);
    const cola: string[] = [origen.ruta];
    while (cola.length > 0) {
      const actual = cola.shift() as string;
      for (const a of grafo.modulos.get(actual)?.aristas ?? []) {
        if (a.hacia === null) continue;
        if (a.hacia.startsWith("src/lib/")) {
          if (!estaExceptuada(excepciones, origen.ruta, a.hacia)) {
            // (sin excepción: hallazgo)
            const cadena = [a.hacia];
            for (let p = actual; p !== undefined; p = padre.get(p) as string) {
              cadena.unshift(p);
              if (p === origen.ruta) break;
            }
            salida.push({
              regla: "R1 importa src/lib",
              archivo: origen.ruta,
              detalle: `${cadena.join(" -> ")} (${a.tipo})`,
            });
          }
          continue;
        }
        if (visitados.has(a.hacia) || enCarpetas(a.hacia, CARPETAS_SIN_DATOS)) continue;
        visitados.add(a.hacia);
        padre.set(a.hacia, actual);
        cola.push(a.hacia);
      }
    }
  }
  // La excepción vale solo para quien importa: no puede reexponer lo exceptuado a un tercero.
  for (const origen of grafo.modulos.values()) {
    if (!enCarpetas(origen.ruta, CARPETAS_SIN_DATOS)) continue;
    for (const r of reexposiciones(origen)) {
      if (
        estaExceptuada(excepciones, origen.ruta, r.destino) &&
        !exceptuadaParaTodos(excepciones, r.destino)
      ) {
        salida.push({
          regla: "R1 reexpone src/lib desde un origen exceptuado",
          archivo: origen.ruta,
          detalle: `${r.destino} (${r.como})`,
        });
      }
    }
  }
  // Transitivo: aunque no la importe directamente, nada de la muestra ni de los componentes
  // puede llegar a las carpetas de supabase, oauth, licencias o stripe, sin excepción.
  const origenes = [...grafo.modulos.keys()].filter((r) => enCarpetas(r, CARPETAS_SIN_DATOS));
  const alcance = alcanzables(grafo, origenes, { incluirTipos: true });
  for (const destino of alcance.modulos) {
    if (PROHIBIDAS_DE_LIB.some((p) => destino.startsWith(`src/lib/${p}/`))) {
      const cadena = alcance.cadena(destino);
      salida.push({
        regla: "R1 llega a una carpeta prohibida de src/lib",
        archivo: cadena[0] ?? destino,
        detalle: cadena.join(" -> "),
      });
    }
  }
}

// ---------------------------------------------------------------- R2: llamadas de red

function nombreDeclarado(nodo: ts.Identifier): boolean {
  const p = nodo.parent;
  return (
    (ts.isVariableDeclaration(p) && p.name === nodo) ||
    (ts.isParameter(p) && p.name === nodo) ||
    (ts.isPropertyDeclaration(p) && p.name === nodo) ||
    (ts.isPropertySignature(p) && p.name === nodo) ||
    (ts.isPropertyAssignment(p) && p.name === nodo) ||
    (ts.isMethodDeclaration(p) && p.name === nodo) ||
    (ts.isFunctionDeclaration(p) && p.name === nodo) ||
    (ts.isImportSpecifier(p) && p.name === nodo) ||
    (ts.isBindingElement(p) && p.name === nodo)
  );
}

export function usosDeRed(fuente: ts.SourceFile): string[] {
  const nombres = new Set<string>(NOMBRES_DE_RED);
  const salida: string[] = [];
  const visitar = (nodo: ts.Node): void => {
    if (ts.isIdentifier(nodo) && nombres.has(nodo.text) && !nombreDeclarado(nodo)) {
      salida.push(nodo.text);
    } else if (
      ts.isElementAccessExpression(nodo) &&
      ts.isStringLiteralLike(nodo.argumentExpression) &&
      nombres.has(nodo.argumentExpression.text)
    ) {
      salida.push(nodo.argumentExpression.text);
    }
    ts.forEachChild(nodo, visitar);
  };
  visitar(fuente);
  return salida;
}

function reglaRed(grafo: Grafo, salida: Hallazgo[]): void {
  for (const m of grafo.modulos.values()) {
    if (!enCarpetas(m.ruta, CARPETAS_SIN_DATOS)) continue;
    for (const uso of usosDeRed(m.fuente)) {
      salida.push({ regla: "R2 llamada de red", archivo: m.ruta, detalle: uso });
    }
  }
}

// ---------------------------------------------------------------- R3: librerías confinadas

export function dondePuedeImportarseRadix(ruta: string): boolean {
  if (ruta.startsWith("src/components/dialogo/")) return true;
  if (ruta.startsWith("src/components/armazon/CajonMenu/")) return true;
  return /^src\/components\/armazon\/CajonMenu\.[a-z]+$/.test(ruta);
}
export const dondePuedeImportarseRecharts = (ruta: string): boolean =>
  ruta.startsWith("src/components/graficos/");
// `avisos/` no importa ninguna librería (enmienda 1): solo el propio React.
const LIBRERIAS_DE_AVISOS = new Set(["react", "react-dom"]);

function reglaLibrerias(grafo: Grafo, salida: Hallazgo[]): void {
  for (const m of grafo.modulos.values()) {
    for (const a of m.aristas) {
      if (a.paquete === null) continue;
      if (ES_RADIX.test(a.paquete) && !dondePuedeImportarseRadix(m.ruta)) {
        salida.push({
          regla: "R3 Radix fuera de su envoltorio",
          archivo: m.ruta,
          detalle: a.paquete,
        });
      }
      if (a.paquete === "recharts" && !dondePuedeImportarseRecharts(m.ruta)) {
        salida.push({
          regla: "R3 Recharts fuera de graficos/",
          archivo: m.ruta,
          detalle: a.paquete,
        });
      }
      // Cambio de periodo (T-010 (e2)): dentro de `src/components/`, el enrutador de Next solo lo
      // importa `armazon/SelectorPeriodo`. Ningún otro componente navega ni lee la dirección por esta vía.
      if (
        m.ruta.startsWith("src/components/") &&
        ES_ENRUTADOR_DE_NEXT.test(a.especificador) &&
        m.ruta !== SELECTOR_DE_PERIODO
      ) {
        salida.push({
          regla: "R3 next/navigation fuera de SelectorPeriodo",
          archivo: m.ruta,
          detalle: a.especificador,
        });
      }
      // Ni siquiera SelectorPeriodo usa el enrutador antiguo (`next/router`).
      if (m.ruta === SELECTOR_DE_PERIODO && a.especificador === "next/router") {
        salida.push({
          regla: "R3 next/navigation fuera de SelectorPeriodo",
          archivo: m.ruta,
          detalle: a.especificador,
        });
      }
      if (m.ruta.startsWith("src/components/avisos/") && !LIBRERIAS_DE_AVISOS.has(a.paquete)) {
        salida.push({
          regla: "R3 avisos/ importa una librería",
          archivo: m.ruta,
          detalle: a.paquete,
        });
      }
    }
  }
}

// ---------------------------------------------------------------- R4/R8: lo que llega a dónde

function reglaAlcance(grafo: Grafo, salida: Hallazgo[]): void {
  // Ningún módulo de cliente llega a fallo-servidor.ts ni a sin-acceso.ts (importaciones de
  // solo tipo no cuentan: se borran al compilar).
  const clientes = [...grafo.modulos.values()].filter((m) => m.cliente).map((m) => m.ruta);
  for (const origen of clientes) {
    const alcance = alcanzables(grafo, [origen], { incluirTipos: false });
    for (const vetado of [FALLO_SERVIDOR, SIN_ACCESO]) {
      if (alcance.modulos.has(vetado)) {
        salida.push({
          regla: "R4 un módulo de cliente llega a código de servidor",
          archivo: origen,
          detalle: alcance.cadena(vetado).join(" -> "),
        });
      }
    }
  }
  // Las rutas de /muestra/servidor/ no llegan a fallo-servidor.ts ni a registro.ts.
  const servidor = [...grafo.modulos.keys()].filter((r) =>
    r.startsWith("src/app/muestra/servidor/"),
  );
  if (servidor.length > 0) {
    for (const origen of servidor) {
      const alcance = alcanzables(grafo, [origen], { incluirTipos: true });
      for (const vetado of [FALLO_SERVIDOR, REGISTRO]) {
        if (alcance.modulos.has(vetado)) {
          salida.push({
            regla: "R8 una ruta de muestra/servidor llega al registro o a la supervisión",
            archivo: origen,
            detalle: alcance.cadena(vetado).join(" -> "),
          });
        }
      }
    }
  }
}

// ---------------------------------------------------------------- R5: herramientas de prueba

function reglaHerramientas(grafo: Grafo, salida: Hallazgo[]): void {
  for (const m of grafo.modulos.values()) {
    for (const a of m.aristas) {
      if (a.paquete !== null && PAQUETES_DE_PRUEBA.test(a.paquete)) {
        salida.push({
          regla: "R5 herramienta de prueba en src",
          archivo: m.ruta,
          detalle: a.paquete,
        });
      }
    }
  }
}

// ---------------------------------------------------------------- R0: lo que no se puede resolver

function reglaSinResolver(grafo: Grafo, salida: Hallazgo[]): void {
  for (const m of grafo.modulos.values()) {
    for (const a of m.aristas) {
      if (a.sinResolver) {
        salida.push({
          regla: "R0 importación que no se resuelve",
          archivo: m.ruta,
          detalle: `${a.especificador} (${a.tipo})`,
        });
      }
    }
  }
}

// ---------------------------------------------------------------- R6: árboles admin y panel

const FUNCIONES_DE_METADATOS: ReadonlySet<string> = new Set([
  "generateMetadata",
  "generateViewport",
  "generateImageMetadata",
  "generateSitemaps",
]);

function exportaGenerateMetadata(
  fuente: ts.SourceFile,
  nombres: ReadonlySet<string> = new Set(["generateMetadata"]),
): boolean {
  let hallado = false;
  const visitar = (n: ts.Node): void => {
    if (
      (ts.isFunctionDeclaration(n) || ts.isVariableDeclaration(n)) &&
      n.name &&
      ts.isIdentifier(n.name) &&
      nombres.has(n.name.text)
    ) {
      hallado = true;
    }
    if (
      ts.isExportSpecifier(n) &&
      (nombres.has(n.name.text) || nombres.has(n.propertyName?.text ?? ""))
    ) {
      hallado = true;
    }
    ts.forEachChild(n, visitar);
  };
  visitar(fuente);
  return hallado;
}

function reglaArbolesDePanel(grafo: Grafo, salida: Hallazgo[]): void {
  for (const arbol of ARBOLES_DE_PANEL) {
    for (const m of grafo.modulos.values()) {
      if (!m.ruta.startsWith(arbol)) continue;
      const nombre = nombreSinExtension(m.ruta);
      if (nombre === "loading") {
        salida.push({
          regla: "R6 loading en admin/panel",
          archivo: m.ruta,
          detalle: "prohibido (V-1)",
        });
      }
      if (nombre === "not-found") {
        const carpeta = m.ruta.slice(0, m.ruta.lastIndexOf("/") + 1);
        if (carpeta !== arbol) {
          salida.push({
            regla: "R6 not-found anidado",
            archivo: m.ruta,
            detalle: "solo en la raíz del árbol",
          });
        }
      }
      if (exportaGenerateMetadata(m.fuente)) {
        salida.push({
          regla: "R6 generateMetadata en admin/panel",
          archivo: m.ruta,
          detalle: "prohibido (V-1)",
        });
      }
    }
  }
}

// ---------------------------------------------------------------- R7: puntos de entrada de la muestra

type Entrada = { nombre: string; cuerpo: ts.ConciseBody | undefined };

const esFuncion = (n: ts.Node): n is ts.FunctionLikeDeclaration =>
  ts.isFunctionDeclaration(n) || ts.isArrowFunction(n) || ts.isFunctionExpression(n);

function exportadoPorModificador(n: ts.Node): boolean {
  return ts.canHaveModifiers(n)
    ? (ts.getModifiers(n)?.some((x) => x.kind === ts.SyntaxKind.ExportKeyword) ?? false)
    : false;
}
function esPorDefecto(n: ts.Node): boolean {
  return ts.canHaveModifiers(n)
    ? (ts.getModifiers(n)?.some((x) => x.kind === ts.SyntaxKind.DefaultKeyword) ?? false)
    : false;
}

function locales(fuente: ts.SourceFile): Map<string, Entrada> {
  const mapa = new Map<string, Entrada>();
  for (const s of fuente.statements) {
    if (ts.isFunctionDeclaration(s) && s.name) {
      mapa.set(s.name.text, { nombre: s.name.text, cuerpo: s.body });
    } else if (ts.isVariableStatement(s)) {
      for (const d of s.declarationList.declarations) {
        if (ts.isIdentifier(d.name) && d.initializer && esFuncion(d.initializer)) {
          mapa.set(d.name.text, { nombre: d.name.text, cuerpo: d.initializer.body });
        }
      }
    }
  }
  return mapa;
}

export function exportadas(fuente: ts.SourceFile, soloPorDefecto: boolean): Entrada[] {
  const propias = locales(fuente);
  const salida: Entrada[] = [];
  for (const s of fuente.statements) {
    if (ts.isFunctionDeclaration(s) && exportadoPorModificador(s)) {
      if (!soloPorDefecto || esPorDefecto(s)) {
        salida.push({ nombre: s.name?.text ?? "default", cuerpo: s.body });
      }
    } else if (ts.isVariableStatement(s) && exportadoPorModificador(s) && !soloPorDefecto) {
      for (const d of s.declarationList.declarations) {
        if (ts.isIdentifier(d.name)) {
          const f = d.initializer && esFuncion(d.initializer) ? d.initializer : undefined;
          salida.push({ nombre: d.name.text, cuerpo: f?.body });
        } else {
          salida.push({ nombre: d.name.getText(fuente), cuerpo: undefined });
        }
      }
    } else if (ts.isExportAssignment(s) && !s.isExportEquals && soloPorDefecto) {
      if (esFuncion(s.expression)) salida.push({ nombre: "default", cuerpo: s.expression.body });
      else if (ts.isIdentifier(s.expression)) {
        salida.push({ nombre: "default", cuerpo: propias.get(s.expression.text)?.cuerpo });
      } else salida.push({ nombre: "default", cuerpo: undefined });
    } else if (
      ts.isExportDeclaration(s) &&
      !s.moduleSpecifier &&
      s.exportClause &&
      ts.isNamedExports(s.exportClause)
    ) {
      for (const e of s.exportClause.elements) {
        const local = (e.propertyName ?? e.name).text;
        const esDefecto = e.name.text === "default";
        if (soloPorDefecto !== esDefecto) continue;
        // Con `{ x as default }` el nombre exportado es `default`, no el local.
        salida.push({ nombre: esDefecto ? "default" : local, cuerpo: propias.get(local)?.cuerpo });
      }
    }
  }
  return salida;
}

function funcionesConDirectivaEnLinea(fuente: ts.SourceFile): Entrada[] {
  const salida: Entrada[] = [];
  const visitar = (n: ts.Node): void => {
    if (esFuncion(n) && n.body && ts.isBlock(n.body)) {
      const primera = n.body.statements[0];
      if (
        primera &&
        ts.isExpressionStatement(primera) &&
        ts.isStringLiteral(primera.expression) &&
        primera.expression.text === "use server"
      ) {
        const nombre = ts.isFunctionDeclaration(n) && n.name ? n.name.text : "en línea";
        salida.push({ nombre, cuerpo: n.body });
      }
    }
    ts.forEachChild(n, visitar);
  };
  visitar(fuente);
  return salida;
}

function primeraInstruccion(cuerpo: ts.ConciseBody | undefined): ts.Statement | undefined {
  if (!cuerpo || !ts.isBlock(cuerpo)) return undefined;
  return cuerpo.statements.find(
    (s) => !(ts.isExpressionStatement(s) && ts.isStringLiteral(s.expression)),
  );
}

function esLlamadaDeComprobacion(s: ts.Statement | undefined): boolean {
  if (!s || !ts.isExpressionStatement(s)) return false;
  // Es asíncrona: sin `await` la página seguiría y la denegación llegaría tarde (artículo 3).
  let e: ts.Expression = s.expression;
  while (ts.isParenthesizedExpression(e)) e = e.expression;
  if (!ts.isAwaitExpression(e)) return false;
  e = e.expression;
  while (ts.isParenthesizedExpression(e)) e = e.expression;
  return (
    ts.isCallExpression(e) &&
    ts.isIdentifier(e.expression) &&
    e.expression.text === "comprobarAccesoMuestra" &&
    e.arguments.length === 0
  );
}

function importaLaComprobacion(m: Modulo): boolean {
  for (const s of m.fuente.statements) {
    if (!ts.isImportDeclaration(s) || !ts.isStringLiteral(s.moduleSpecifier)) continue;
    const enlaces = s.importClause?.namedBindings;
    if (!enlaces || !ts.isNamedImports(enlaces) || s.importClause?.isTypeOnly) continue;
    const trae = enlaces.elements.some(
      (e) =>
        !e.isTypeOnly &&
        (e.propertyName ?? e.name).text === "comprobarAccesoMuestra" &&
        e.name.text === "comprobarAccesoMuestra",
    );
    if (!trae) continue;
    const texto = s.moduleSpecifier.text;
    if (m.aristas.some((a) => a.especificador === texto && a.hacia === ARCHIVO_ACCESO)) return true;
  }
  return false;
}

export const ES_PAGINA = /^page(\.muestra)?\.(tsx|ts|jsx|js)$/;
const ES_CAPA = /^layout(\.muestra)?\.(tsx|ts|jsx|js)$/;
// Archivos de metadatos de ruta de Next (cada uno es una ruta que se sirve sola).
const METADATOS_DE_RUTA =
  /^(opengraph-image|twitter-image|icon|apple-icon)\d*$|^(sitemap|robots|manifest|favicon)$/;

function reglaPuntosDeEntrada(grafo: Grafo, salida: Hallazgo[]): void {
  for (const m of grafo.modulos.values()) {
    if (!m.ruta.startsWith("src/app/muestra/")) continue;
    const base = m.ruta.slice(m.ruta.lastIndexOf("/") + 1);
    if (/^route\./.test(base)) {
      salida.push({
        regla: "R7 manejador de ruta en la muestra",
        archivo: m.ruta,
        detalle: "la muestra no tiene archivos route",
      });
    }
    if (m.ruta === ARCHIVO_ACCESO) continue;
    if (METADATOS_DE_RUTA.test(nombreSinExtension(m.ruta))) {
      salida.push({
        regla: "R7 archivo de metadatos de ruta en la muestra",
        archivo: m.ruta,
        detalle: "la muestra no tiene archivos de metadatos de ruta (son rutas sin comprobación)",
      });
    }
    if (
      (ES_PAGINA.test(base) || ES_CAPA.test(base)) &&
      exportaGenerateMetadata(m.fuente, FUNCIONES_DE_METADATOS)
    ) {
      salida.push({
        regla: "R7 generateMetadata en la muestra",
        archivo: m.ruta,
        detalle:
          "generateMetadata, generateViewport, generateImageMetadata y generateSitemaps se evalúan antes de la página: prohibido",
      });
    }
    if (m.servidor) {
      for (const st of m.fuente.statements) {
        if (ts.isExportDeclaration(st) && st.moduleSpecifier) {
          salida.push({
            regla: "R7 reexportación en un archivo use server",
            archivo: m.ruta,
            detalle: "las acciones reexportadas no se pueden comprobar: se deniega",
          });
        }
      }
    }
    const entradas: Entrada[] = [];
    if (ES_PAGINA.test(base)) entradas.push(...exportadas(m.fuente, true));
    // En un archivo use server son acciones todas las exportaciones, también la de por defecto.
    if (m.servidor) {
      entradas.push(...exportadas(m.fuente, false));
      if (!ES_PAGINA.test(base)) {
        const vistos = new Set(entradas.map((e) => e.cuerpo).filter((c) => c !== undefined));
        for (const e of exportadas(m.fuente, true)) {
          if (e.cuerpo === undefined || !vistos.has(e.cuerpo)) entradas.push(e);
        }
      }
    }
    entradas.push(...funcionesConDirectivaEnLinea(m.fuente));
    const esEntrada = ES_PAGINA.test(base) || m.servidor || entradas.length > 0;
    if (!esEntrada) continue;
    if (m.servidor && entradas.length === 0) {
      salida.push({
        regla: "R7 archivo use server sin entradas analizables",
        archivo: m.ruta,
        detalle: "cierre en fallo: no se sabe qué acciones expone",
      });
    }
    if (ES_PAGINA.test(base) && entradas.length === 0) {
      salida.push({
        regla: "R7 página sin función exportada por defecto",
        archivo: m.ruta,
        detalle: "no analizable",
      });
    }
    for (const e of entradas) {
      if (!esLlamadaDeComprobacion(primeraInstruccion(e.cuerpo))) {
        salida.push({
          regla: "R7 punto de entrada sin comprobarAccesoMuestra() como primera instrucción",
          archivo: m.ruta,
          detalle: e.nombre,
        });
      }
    }
    if (entradas.length > 0 && !importaLaComprobacion(m)) {
      salida.push({
        regla: "R7 comprobarAccesoMuestra no se importa de _datos/acceso-muestra.ts",
        archivo: m.ruta,
        detalle: "el nombre debe venir de ese archivo",
      });
    }
  }
}

// ---------------------------------------------------------------- R9: la muestra no sale de su carpeta

const CARPETA_DE_LA_MUESTRA = "src/app/muestra/";

/** Nada fuera de `src/app/muestra/` importa la muestra, de ninguna forma (estática, dinámica,
 * reexportación o solo de tipo): su código no puede llegar a otra ruta (020 T-005). */
function reglaMuestraEncerrada(grafo: Grafo, salida: Hallazgo[]): void {
  for (const m of grafo.modulos.values()) {
    if (m.ruta.startsWith(CARPETA_DE_LA_MUESTRA)) continue;
    for (const a of m.aristas) {
      if (a.hacia?.startsWith(CARPETA_DE_LA_MUESTRA)) {
        salida.push({
          regla: "R9 importa la muestra desde fuera",
          archivo: m.ruta,
          detalle: `${a.hacia} (${a.tipo})`,
        });
      }
    }
  }
}

// ---------------------------------------------------------------- conjunto

export function comprobarFronteras(
  grafo: Grafo,
  excepciones: readonly ExcepcionDeImportacion[] = excepcionesDeImportacion,
): Hallazgo[] {
  const salida: Hallazgo[] = [];
  reglaSinResolver(grafo, salida);
  reglaImportaciones(grafo, excepciones, salida);
  reglaRed(grafo, salida);
  reglaLibrerias(grafo, salida);
  reglaAlcance(grafo, salida);
  reglaHerramientas(grafo, salida);
  reglaArbolesDePanel(grafo, salida);
  reglaPuntosDeEntrada(grafo, salida);
  reglaMuestraEncerrada(grafo, salida);
  return salida;
}
