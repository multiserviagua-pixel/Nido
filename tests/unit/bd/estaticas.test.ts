// L 11 a L 14 de la función 010 (diseño D-1 y D-3): comprobaciones estáticas
// sobre supabase/migrations/ y supabase/reversiones/. No necesitan base de datos.
import { readdirSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const DIR_MIGRACIONES = new URL("../../../supabase/migrations/", import.meta.url);
const DIR_REVERSIONES = new URL("../../../supabase/reversiones/", import.meta.url);

// El operador va calificado: `<>` a secas se resuelve con el search_path de la
// sesión, y un `<>` ajeno puesto delante de pg_catalog anularía la guarda.
const GUARDA =
  "do $$ begin if current_user operator(pg_catalog.<>) 'postgres' then raise exception 'migracion_rol_no_permitido'; end if; end $$;";

interface Limpieza {
  texto: string;
  /** Falso si queda un literal o un comentario sin cerrar. */
  cerrado: boolean;
}

function limpiar(sql: string): Limpieza {
  let salida = "";
  let cerrado = true;
  let i = 0;
  while (i < sql.length) {
    const c = sql[i];
    const d = sql[i + 1];
    if (c === "-" && d === "-") {
      while (i < sql.length && sql[i] !== "\n") i++;
    } else if (c === "/" && d === "*") {
      // Los comentarios de bloque de PostgreSQL se anidan.
      let nivel = 1;
      i += 2;
      while (i < sql.length && nivel > 0) {
        if (sql[i] === "/" && sql[i + 1] === "*") {
          nivel++;
          i += 2;
        } else if (sql[i] === "*" && sql[i + 1] === "/") {
          nivel--;
          i += 2;
        } else i++;
      }
      if (nivel > 0) cerrado = false;
      salida += " ";
    } else if (c === "'") {
      // E'…' admite \' como escape.
      const conEscapes = /^[eE]$/.test(sql[i - 1] ?? "") && !/\w/.test(sql[i - 2] ?? "");
      let j = i + 1;
      let fin = false;
      while (j < sql.length) {
        if (conEscapes && sql[j] === "\\") j += 2;
        else if (sql[j] === "'" && sql[j + 1] === "'") j += 2;
        else if (sql[j] === "'") {
          fin = true;
          break;
        } else j++;
      }
      if (!fin) cerrado = false;
      salida += sql.slice(i, j + 1);
      i = j + 1;
    } else if (c === "$" && !/[\w$]/.test(sql[i - 1] ?? "")) {
      const m = /^\$([A-Za-z_][A-Za-z0-9_]*)?\$/.exec(sql.slice(i, i + 80));
      const fin = m === null ? -1 : sql.indexOf(m[0], i + m[0].length);
      if (m === null || fin === -1) {
        salida += c;
        i++;
      } else {
        // El cuerpo es código (do, funciones) o texto. Si se lee como código sin
        // dejar nada abierto, se conserva limpio; si no, es texto opaco y se vacía.
        const cuerpo = limpiar(sql.slice(i + m[0].length, fin));
        salida += m[0] + (cuerpo.cerrado ? cuerpo.texto : " ") + m[0];
        i = fin + m[0].length;
      }
    } else {
      salida += c;
      i++;
    }
  }
  return { texto: salida, cerrado };
}

/**
 * Quita comentarios de línea y de bloque (anidados), respetando los literales
 * entre comillas simples (con E'…') y entre comillas de dólar con o sin
 * etiqueta: un «--» dentro de `$e$ … $e$` no es un comentario.
 */
export function sinComentarios(sql: string): string {
  return limpiar(sql).texto;
}

/** Texto normalizado: sin comentarios, espacios colapsados y en minúsculas. */
export function normalizar(sql: string): string {
  return sinComentarios(sql).replace(/\s+/g, " ").trim().toLowerCase();
}

/** L 11: la primera sentencia es la guarda de rol. */
export function empiezaPorLaGuarda(sql: string): boolean {
  return normalizar(sql).startsWith(GUARDA);
}

const GUARDA_INTERNA =
  "if current_user operator(pg_catalog.<>) 'postgres' then raise exception 'migracion_rol_no_permitido'; end if;";
const CAPTURA_RUTA = "v_ruta_previa := pg_catalog.current_setting('search_path');";
const RUTA_FIJA = "perform pg_catalog.set_config('search_path', 'pg_catalog, pg_temp', true);";
const RUTA_RESTAURADA = "perform pg_catalog.set_config('search_path', v_ruta_previa, true);";

/** Cuerpos (normalizados) de cada bloque `do … $$ … $$` del archivo. */
export function cuerposDo(sql: string): string[] {
  const texto = normalizar(sql);
  const cuerpos: string[] = [];
  const buscar = /\bdo\s+(?:language\s+[a-z_]+\s+)?(\$[a-z_0-9]*\$)([\s\S]*?)\1/g;
  let m: RegExpExecArray | null;
  while ((m = buscar.exec(texto)) !== null) cuerpos.push((m[2] as string).trim());
  return cuerpos;
}

/** Lo que sigue a `begin` (saltando el `declare`), o null si el bloque no tiene `begin`. */
function trasBegin(cuerpo: string): string | null {
  const sinDeclare = cuerpo.replace(/^declare\b[\s\S]*?\bbegin\b/, "begin");
  return sinDeclare.startsWith("begin ") ? sinDeclare.slice("begin ".length) : null;
}

/**
 * L 11 (interna): la guarda de rol es la primera instrucción dentro de cada
 * bloque `do`. Con `psql -f` en autocommit y sin ON_ERROR_STOP, la guarda de la
 * línea 1 no basta. Devuelve los cuerpos que no cumplen.
 */
export function doSinGuardaInterna(sql: string): string[] {
  return cuerposDo(sql).filter((c) => !(trasBegin(c) ?? "").startsWith(GUARDA_INTERNA));
}

/**
 * L 13: justo después de la guarda, cada `do` guarda la ruta de la sesión y
 * fija `search_path` con `set_config(…, true)`; como última instrucción, la
 * restaura (lo que siga en la misma transacción no hereda la ruta fijada). El
 * bloque que solo contiene la guarda (línea 1) queda fuera. Devuelve los
 * cuerpos que no cumplen.
 */
export function doSinRutaFija(sql: string): string[] {
  return cuerposDo(sql).filter((c) => {
    const resto = trasBegin(c) ?? "";
    if (resto === `${GUARDA_INTERNA} end`) return false;
    return !(
      resto.startsWith(`${GUARDA_INTERNA} ${CAPTURA_RUTA} ${RUTA_FIJA}`) &&
      resto.endsWith(` ${RUTA_RESTAURADA} end`)
    );
  });
}

/** Sentencias de nivel superior del texto normalizado (respeta '…' y $etiqueta$…$etiqueta$). */
export function sentencias(sql: string): string[] {
  const texto = normalizar(sql);
  const salida: string[] = [];
  let actual = "";
  let i = 0;
  while (i < texto.length) {
    const c = texto[i] as string;
    if (c === "'") {
      let j = i + 1;
      while (j < texto.length && !(texto[j] === "'" && texto[j + 1] !== "'")) {
        j += texto[j] === "'" ? 2 : 1;
      }
      actual += texto.slice(i, j + 1);
      i = j + 1;
    } else if (c === "$" && !/[\w$]/.test(texto[i - 1] ?? "")) {
      const m = /^\$([a-z_][a-z0-9_]*)?\$/.exec(texto.slice(i, i + 80));
      const fin = m === null ? -1 : texto.indexOf(m[0], i + m[0].length);
      const hasta = m === null ? i + 1 : fin === -1 ? texto.length : fin + m[0].length;
      actual += texto.slice(i, hasta);
      i = hasta;
    } else if (c === ";") {
      if (actual.trim() !== "") salida.push(actual.trim());
      actual = "";
      i++;
    } else {
      actual += c;
      i++;
    }
  }
  if (actual.trim() !== "") salida.push(actual.trim());
  return salida;
}

/**
 * Un `do $etiqueta$ … $etiqueta$` (opcionalmente `language plpgsql` delante)
 * cuyo `declare`, si lo hay, no tiene inicializadores (`:=`, `=`, `default`:
 * se evaluarían antes de la guarda), con cada tipo calificado como
 * `pg_catalog.<tipo>`, y cuya primera instrucción es la guarda.
 */
function esDoConGuarda(sentencia: string): boolean {
  const m = /^do (?:language plpgsql )?(\$[a-z_0-9]*\$)([\s\S]*)\1$/.exec(sentencia);
  if (m === null) return false;
  const cuerpo = (m[2] as string).trim();
  let resto = cuerpo;
  const d = /^declare ([\s\S]*?) begin /.exec(cuerpo);
  if (d !== null) {
    const declaraciones = (d[1] as string)
      .split(";")
      .map((x) => x.trim())
      .filter((x) => x !== "");
    for (const x of declaraciones) {
      if (/:=|=|\bdefault\b/.test(x)) return false;
      // Tipo calificado con pg_catalog (mayor 1, quinta vuelta): los tipos de
      // declare se resuelven al compilar, con la ruta de la sesión.
      if (!/^[a-z_][a-z0-9_]* pg_catalog\.[a-z_][a-z0-9_]*$/.test(x)) return false;
    }
    resto = cuerpo.slice(d[0].length - "begin ".length);
  }
  // Condición MENOR A (vuelta 5 del auditor, T-002): solo se valida el primer
  // declare; cualquier otro (bloque anidado o cuerpo de función, con o sin
  // etiqueta) se rechaza. Si una función necesitara declare, se consulta antes
  // y se valida cada sección con la regla de pg_catalog (tareas.md, Convenciones).
  if (/\bdeclare\b/.test(resto)) return false;
  return resto.startsWith(`begin ${GUARDA_INTERNA}`);
}

/**
 * L 14 (hallazgo 3 de la vuelta 3 del auditor): la primera sentencia es la
 * guarda y cada una de las demás es un bloque `do` con comillas de dólar que
 * empieza por la guarda. Nada de DDL suelto, cuerpos entre comillas simples ni
 * inicializadores en `declare`. Devuelve las sentencias que no cumplen.
 */
export function sentenciasFueraDeForma(sql: string): string[] {
  const lista = sentencias(sql);
  const malas: string[] = [];
  if (lista[0] !== GUARDA.slice(0, -1)) malas.push((lista[0] ?? "(vacío)").slice(0, 80));
  if (lista.length < 2) malas.push("(sin bloque do tras la guarda)");
  for (const s of lista.slice(1)) if (!esDoConGuarda(s)) malas.push(s.slice(0, 80));
  return malas;
}

/**
 * L 12: cada `raise` lleva solo un literal sin `%` (opcionalmente `using errcode`
 * con otro literal). Devuelve los `raise` que no cumplen.
 */
export function raiseIncorrectos(sql: string): string[] {
  const limpio = sinComentarios(sql).replace(/\s+/g, " ");
  const malos: string[] = [];
  const buscar = /\braise\b/gi;
  const valido =
    /^raise (?:exception|warning|notice|info|log|debug)? ?'(?:[^'%]|'')*'(?: using errcode = '[0-9a-z_]+')? ?;/i;
  let m: RegExpExecArray | null;
  while ((m = buscar.exec(limpio)) !== null) {
    const resto = limpio.slice(m.index);
    if (!valido.test(resto)) malos.push(resto.slice(0, 60));
  }
  for (const m2 of limpio.matchAll(/\bassert\b/gi)) {
    if (!assertValido(limpio.slice(m2.index + m2[0].length))) {
      malos.push(limpio.slice(m2.index, m2.index + 60));
    }
  }
  return malos;
}

/**
 * `assert condición;` o `assert condición, 'literal sin %';`. La coma que separa
 * el mensaje es la de nivel 0 (fuera de paréntesis y de literales).
 */
function assertValido(resto: string): boolean {
  let nivel = 0;
  let coma = -1;
  let i = 0;
  while (i < resto.length) {
    const c = resto[i];
    if (c === "'") {
      i++;
      while (i < resto.length && !(resto[i] === "'" && resto[i + 1] !== "'")) {
        i += resto[i] === "'" ? 2 : 1;
      }
    } else if (c === "(") nivel++;
    else if (c === ")") nivel--;
    else if (c === "," && nivel === 0 && coma === -1) coma = i;
    else if (c === ";" && nivel === 0) {
      if (coma === -1) return true;
      return /^ ?'(?:[^'%]|'')*' ?$/.test(resto.slice(coma + 1, i));
    }
    i++;
  }
  return false;
}

function archivos(dir: URL): string[] {
  return readdirSync(dir)
    .filter((n) => n.endsWith(".sql"))
    .sort();
}

const migraciones = archivos(DIR_MIGRACIONES);
const reversiones = archivos(DIR_REVERSIONES);

describe("detectores (sin archivos)", () => {
  it("L 11: acepta la guarda tras comentarios y espacios, rechaza otro orden", () => {
    expect(empiezaPorLaGuarda(`-- cabecera\n/* x */\n${GUARDA}\ncreate schema a;`)).toBe(true);
    expect(empiezaPorLaGuarda(`create schema a;\n${GUARDA}`)).toBe(false);
    expect(empiezaPorLaGuarda(`begin;\n${GUARDA}`)).toBe(false);
    expect(empiezaPorLaGuarda(GUARDA.replace("postgres", "otro"))).toBe(false);
    expect(empiezaPorLaGuarda("")).toBe(false);
  });

  it("L 11: la guarda con <> sin calificar (resuelto por el search_path de la sesión) no vale", () => {
    const sinCalificar = GUARDA.replace("operator(pg_catalog.<>)", "<>");
    expect(empiezaPorLaGuarda(sinCalificar)).toBe(false);
    expect(
      doSinGuardaInterna(`do $$ begin ${G.replace("operator(pg_catalog.<>)", "<>")} ${R} end $$;`),
    ).toHaveLength(1);
    expect(
      sentenciasFueraDeForma(`${sinCalificar}\ndo $$ begin ${G} ${A} ${F} end $$;`),
    ).toHaveLength(1);
  });

  const G =
    "if current_user operator(pg_catalog.<>) 'postgres' then raise exception 'migracion_rol_no_permitido'; end if;";
  const C = "v_ruta_previa := pg_catalog.current_setting('search_path');";
  const R = "perform pg_catalog.set_config('search_path', 'pg_catalog, pg_temp', true);";
  const A = `${C} ${R}`;
  const F = "perform pg_catalog.set_config('search_path', v_ruta_previa, true);";
  const D = "declare v_ruta_previa pg_catalog.text;";

  it("L 11 interna: acepta la guarda como primera instrucción de cada do", () => {
    expect(doSinGuardaInterna(GUARDA)).toEqual([]);
    expect(doSinGuardaInterna(`${GUARDA}\ndo $$ begin ${G} ${R} create schema a; end $$;`)).toEqual(
      [],
    );
    // Con declare, con etiqueta, con language, en mayúsculas y con comentarios por medio.
    expect(doSinGuardaInterna(`do $x$ declare v int; begin ${G} ${R} end $x$;`)).toEqual([]);
    expect(
      doSinGuardaInterna(`DO LANGUAGE plpgsql $$ BEGIN\n-- c\n${G.toUpperCase()} ${R} END $$;`),
    ).toEqual([]);
  });

  it("L 11 interna: rechaza un do sin guarda, con la guarda tras otra instrucción o alterada", () => {
    expect(doSinGuardaInterna(`${GUARDA}\ndo $$ begin create schema a; end $$;`)).toHaveLength(1);
    expect(doSinGuardaInterna(`do $$ begin ${R} ${G} end $$;`)).toHaveLength(1);
    expect(doSinGuardaInterna(`do $$ begin ${G.replace("postgres", "otro")} end $$;`)).toHaveLength(
      1,
    );
    expect(doSinGuardaInterna(`do $$ begin ${G.replace("<>", "=")} end $$;`)).toHaveLength(1);
    expect(doSinGuardaInterna(`do $$ begin /* ${G} */ create schema a; end $$;`)).toHaveLength(1);
    expect(doSinGuardaInterna(`do $$ begin -- ${G}\n create schema a; end $$;`)).toHaveLength(1);
    expect(doSinGuardaInterna(`do $$ declare v int := 1; begin v := 2; ${G} end $$;`)).toHaveLength(
      1,
    );
    // Uno bueno y uno malo: se devuelve solo el malo.
    expect(
      doSinGuardaInterna(`do $$ begin ${G} ${R} end $$; do $$ begin create schema a; end $$;`),
    ).toHaveLength(1);
    expect(doSinGuardaInterna("create schema a;")).toEqual([]);
  });

  it("L 13: acepta guardar y fijar el search_path tras la guarda y restaurarlo al final; rechaza lo demás", () => {
    expect(doSinRutaFija(GUARDA)).toEqual([]);
    expect(doSinRutaFija(`do $$ ${D} begin ${G} ${A} create schema a; ${F} end $$;`)).toEqual([]);
    expect(doSinRutaFija(`do $$ ${D} begin ${G} create schema a; ${F} end $$;`)).toHaveLength(1);
    expect(doSinRutaFija(`do $$ begin ${R} create schema a; end $$;`)).toHaveLength(1);
    expect(doSinRutaFija(`do $$ begin create schema a; end $$;`)).toHaveLength(1);
    expect(doSinRutaFija(`do $$ ${D} begin ${G} create schema a; ${A} ${F} end $$;`)).toHaveLength(
      1,
    );
    expect(
      doSinRutaFija(
        `do $$ ${D} begin ${G} ${C} ${R.replace("'pg_catalog, pg_temp'", "'public'")} ${F} end $$;`,
      ),
    ).toHaveLength(1);
    expect(
      doSinRutaFija(`do $$ ${D} begin ${G} ${C} ${R.replace("true", "false")} ${F} end $$;`),
    ).toHaveLength(1);
    expect(
      doSinRutaFija(`do $$ ${D} begin ${G} -- ${A}\n create schema a; ${F} end $$;`),
    ).toHaveLength(1);
    // Sin capturar la ruta previa, o fijando sin restaurar al final (hallazgo 1, vuelta 3).
    expect(doSinRutaFija(`do $$ begin ${G} ${R} create schema a; ${F} end $$;`)).toHaveLength(1);
    expect(doSinRutaFija(`do $$ ${D} begin ${G} ${A} create schema a; end $$;`)).toHaveLength(1);
    expect(doSinRutaFija(`do $$ ${D} begin ${G} ${A} ${F} create schema a; end $$;`)).toHaveLength(
      1,
    );
    expect(
      doSinRutaFija(
        `do $$ ${D} begin ${G} ${A} create schema a; ${F.replace("true", "false")} end $$;`,
      ),
    ).toHaveLength(1);
  });

  it("L 14: tras la guarda, solo bloques do con comillas de dólar que empiezan por la guarda", () => {
    const BUENO = `do $$ ${D} begin ${G} ${A} create schema a; ${F} end $$;`;
    expect(sentenciasFueraDeForma(`-- c\n${GUARDA}\n${BUENO}`)).toEqual([]);
    expect(sentenciasFueraDeForma(`${GUARDA}\n${BUENO}\n${BUENO}`)).toEqual([]);
    expect(
      sentenciasFueraDeForma(`${GUARDA}\ndo $e$ begin ${G} ${A} select 'a;b'; ${F} end $e$;`),
    ).toEqual([]);
    // DDL suelto fuera de un do, antes o después del bloque.
    expect(sentenciasFueraDeForma(`${GUARDA}\ncreate schema a;\n${BUENO}`)).toHaveLength(1);
    expect(sentenciasFueraDeForma(`${GUARDA}\n${BUENO}\ndrop role conector;`)).toHaveLength(1);
    expect(sentenciasFueraDeForma(`${GUARDA}\nbegin;\n${BUENO}\ncommit;`)).toHaveLength(2);
    // Cuerpo entre comillas simples (L 11 interna y L 13 no lo ven).
    expect(
      sentenciasFueraDeForma(`${GUARDA}\ndo 'begin create schema a; end';\n${BUENO}`),
    ).toHaveLength(1);
    // Inicializadores de declare: se evalúan antes de la guarda.
    for (const decl of [
      "declare v pg_catalog.int4 := public.f();",
      "declare v pg_catalog.int4 = public.f();",
      "declare v pg_catalog.int4 default public.f();",
      "declare v constant pg_catalog.int4 := 1;",
    ]) {
      expect(
        sentenciasFueraDeForma(`${GUARDA}\ndo $$ ${decl} begin ${G} ${A} ${F} end $$;`),
        decl,
      ).toHaveLength(1);
    }
    // Tipos de declare sin calificar con pg_catalog: se resuelven con la ruta de
    // la sesión al compilar, antes de la guarda (mayor 1 de la quinta vuelta).
    for (const decl of [
      "declare v name;",
      "declare v text;",
      "declare v record;",
      'declare v "char";',
      "declare v public.dominio;",
      "declare v atacante.text;",
      "declare v pg_catalog.text; w text;",
      "declare v pg_catalog .text;",
      "declare v pg_catalog.text extra;",
    ]) {
      expect(
        sentenciasFueraDeForma(`${GUARDA}\ndo $$ ${decl} begin ${G} ${A} ${F} end $$;`),
        decl,
      ).toHaveLength(1);
    }
    for (const decl of [
      "declare v pg_catalog.text;",
      "declare v pg_catalog.name; w pg_catalog.record;",
      "declare v pg_catalog.int4;",
    ]) {
      expect(
        sentenciasFueraDeForma(`${GUARDA}\ndo $$ ${decl} begin ${G} ${A} ${F} end $$;`),
        decl,
      ).toEqual([]);
    }
    // Do sin guarda, guarda tras otra instrucción, language que no es plpgsql.
    expect(sentenciasFueraDeForma(`${GUARDA}\ndo $$ begin ${A} end $$;`)).toHaveLength(1);
    expect(sentenciasFueraDeForma(`${GUARDA}\ndo $$ begin perform 1; ${G} end $$;`)).toHaveLength(
      1,
    );
    expect(
      sentenciasFueraDeForma(`${GUARDA}\ndo language plsh $$ begin ${G} end $$;`),
    ).toHaveLength(1);
    // Sin la guarda de la línea 1, o solo con ella.
    expect(sentenciasFueraDeForma(BUENO)).not.toEqual([]);
    expect(sentenciasFueraDeForma(GUARDA)).toHaveLength(1);
    expect(sentenciasFueraDeForma("")).not.toEqual([]);
  });

  it("L 14, condición MENOR A (T-002): se rechaza todo declare posterior al primero", () => {
    // Un declare de un bloque anidado o del cuerpo de una función se compila con
    // la ruta de la sesión; el detector solo validaba el primero. Se rechaza
    // cualquiera que venga después, con su tipo calificado o no.
    const casos = [
      // Bloque anidado sin pg_catalog, con y sin declare inicial.
      `do $$ ${D} begin ${G} ${A} begin declare w text; begin null; end; end; ${F} end $$;`,
      `do $$ begin ${G} ${A} declare w text; begin null; end; ${F} end $$;`,
      `do $$ ${D} begin ${G} ${A} declare w public.dominio; begin null; end; ${F} end $$;`,
      // Con etiqueta de bloque delante.
      `do $$ ${D} begin ${G} ${A} <<interno>> declare w text; begin null; end; ${F} end $$;`,
      // Aun calificado: la opción elegida es rechazar todo declare posterior.
      `do $$ ${D} begin ${G} ${A} declare w pg_catalog.text; begin null; end; ${F} end $$;`,
      // En el cuerpo de una función creada dentro del do, con otra etiqueta.
      `do $$ ${D} begin ${G} ${A} create function privado.f() returns pg_catalog.int4 language plpgsql as $f$ declare w text; begin return 1; end $f$; ${F} end $$;`,
      // En mayúsculas y con comentarios por medio.
      `do $$ ${D} begin ${G} ${A} /* c */ DECLARE w text; BEGIN null; END; ${F} end $$;`,
    ];
    for (const caso of casos) {
      expect(sentenciasFueraDeForma(`${GUARDA}\n${caso}`), caso).toHaveLength(1);
    }
    // Sin declare posterior, la forma sigue aceptándose (con y sin el primero).
    expect(sentenciasFueraDeForma(`${GUARDA}\ndo $$ ${D} begin ${G} ${A} ${F} end $$;`)).toEqual(
      [],
    );
    expect(
      sentenciasFueraDeForma(
        `${GUARDA}\ndo $$ ${D} begin ${G} ${A} create table public.declarada (id pg_catalog.int4); ${F} end $$;`,
      ),
    ).toEqual([]);
  });

  it("L 12: acepta un literal y rechaza % y concatenación", () => {
    expect(raiseIncorrectos("raise exception 'codigo_fijo';")).toEqual([]);
    expect(raiseIncorrectos("raise exception 'codigo' using errcode = 'P0001';")).toEqual([]);
    expect(raiseIncorrectos("raise exception 'valor %', x;")).toHaveLength(1);
    expect(raiseIncorrectos("raise exception 'a' || x;")).toHaveLength(1);
    expect(raiseIncorrectos("raise exception format('a%s', x);")).toHaveLength(1);
    expect(raiseIncorrectos("raise exception 'a' using detail = x;")).toHaveLength(1);
    expect(raiseIncorrectos("raise;")).toHaveLength(1);
    expect(raiseIncorrectos("-- raise exception 'x %', y;\nselect 1;")).toEqual([]);
  });

  it("L 12: comillas de dólar con etiqueta no ocultan un raise posterior", () => {
    // Un «--» o «/*» dentro de un literal $e$…$e$ no es un comentario y no se come lo que sigue.
    expect(raiseIncorrectos("select $e$ -- $e$; raise exception 'a %', x;")).toHaveLength(1);
    expect(raiseIncorrectos("select $e$ /* $e$; raise exception 'a %', x;")).toHaveLength(1);
    expect(raiseIncorrectos("select $e$ -- $e$; raise exception 'a';")).toEqual([]);
    // Un apóstrofo dentro de un literal $e$…$e$ no abre un literal normal.
    expect(raiseIncorrectos("select $e$ it's $e$; raise exception 'a %', x;")).toHaveLength(1);
    expect(raiseIncorrectos("select $$ it's $$; raise exception 'a %', x;")).toHaveLength(1);
    expect(raiseIncorrectos("select $e$ it's $e$; raise exception 'a';")).toEqual([]);
    // El cuerpo de un do con etiqueta es código: su raise se comprueba.
    expect(
      raiseIncorrectos("do $cuerpo$ begin raise exception 'a %', x; end $cuerpo$;"),
    ).toHaveLength(1);
    expect(raiseIncorrectos("do $cuerpo$ begin raise exception 'a'; end $cuerpo$;")).toEqual([]);
    // Cuerpo que parece código aunque sea texto: se comprueba igual (lado conservador).
    expect(raiseIncorrectos("select $t$ raise exception 'a %', x $t$;")).toHaveLength(1);
    // Mensaje entre comillas de dólar: no es un literal admitido.
    expect(raiseIncorrectos("raise exception $m$valor$m$;")).toHaveLength(1);
  });

  it("L 12: raise tras comentarios de línea, de bloque y anidados", () => {
    expect(raiseIncorrectos("/* a */raise exception 'a %', x;")).toHaveLength(1);
    expect(raiseIncorrectos("-- c\nraise exception 'a %', x;")).toHaveLength(1);
    expect(raiseIncorrectos("/* a /* anidado */ raise exception 'x %', y; */ select 1;")).toEqual(
      [],
    );
    expect(raiseIncorrectos("/* a /* anidado */ */ raise exception 'x %', y;")).toHaveLength(1);
    expect(raiseIncorrectos("raise /* c */ exception 'a';")).toEqual([]);
    expect(raiseIncorrectos("raise exception -- c\n 'a %', x;")).toHaveLength(1);
  });

  it("L 12: assert con mensaje no literal", () => {
    expect(raiseIncorrectos("assert x > 0;")).toEqual([]);
    expect(raiseIncorrectos("assert x in ('a', 'b');")).toEqual([]);
    expect(raiseIncorrectos("assert x > 0, 'codigo_fijo';")).toEqual([]);
    expect(raiseIncorrectos("assert x > 0, 'valor ' || x;")).toHaveLength(1);
    expect(raiseIncorrectos("assert x > 0, format('v %s', x);")).toHaveLength(1);
    expect(raiseIncorrectos("assert x > 0, 'valor %';")).toHaveLength(1);
    expect(raiseIncorrectos("assert f(a, b) > 0, 'ok';")).toEqual([]);
    expect(raiseIncorrectos("assert f(a, b) > 0, m;")).toHaveLength(1);
    expect(raiseIncorrectos("-- assert x, y;\nselect 1;")).toEqual([]);
  });
});

describe("migraciones y reversiones", () => {
  it("existe M01 y cada migración tiene su reversión con el mismo nombre", () => {
    expect(migraciones.some((n) => n.endsWith("_privado_rol_y_permisos.sql"))).toBe(true);
    expect(reversiones).toEqual(migraciones);
  });

  it("los nombres son 14 dígitos, guion bajo y nombre en minúsculas", () => {
    for (const n of migraciones) expect(n).toMatch(/^2026\d{10}_[a-z0-9_]+\.sql$/);
  });

  it("L 11: la guarda de rol es la primera sentencia de cada migración", () => {
    for (const n of migraciones) {
      expect(empiezaPorLaGuarda(readFileSync(new URL(n, DIR_MIGRACIONES), "utf8")), n).toBe(true);
    }
  });

  it("L 11: la guarda de rol es la primera sentencia de cada reversión", () => {
    for (const n of reversiones) {
      expect(empiezaPorLaGuarda(readFileSync(new URL(n, DIR_REVERSIONES), "utf8")), n).toBe(true);
    }
  });

  it("L 11 interna: la guarda es la primera instrucción de cada bloque do, en migraciones y reversiones", () => {
    for (const [dir, lista] of [
      [DIR_MIGRACIONES, migraciones],
      [DIR_REVERSIONES, reversiones],
    ] as const) {
      for (const n of lista) {
        const sql = readFileSync(new URL(n, dir), "utf8");
        expect(cuerposDo(sql).length, n).toBeGreaterThanOrEqual(2);
        expect(doSinGuardaInterna(sql), n).toEqual([]);
      }
    }
  });

  it("L 13: cada bloque do, salvo el de la guarda, fija el search_path justo después de ella", () => {
    for (const [dir, lista] of [
      [DIR_MIGRACIONES, migraciones],
      [DIR_REVERSIONES, reversiones],
    ] as const) {
      for (const n of lista) {
        expect(doSinRutaFija(readFileSync(new URL(n, dir), "utf8")), n).toEqual([]);
      }
    }
  });

  it("L 14: tras la guarda, cada sentencia de migraciones y reversiones es un do con guarda", () => {
    for (const [dir, lista] of [
      [DIR_MIGRACIONES, migraciones],
      [DIR_REVERSIONES, reversiones],
    ] as const) {
      for (const n of lista) {
        expect(sentenciasFueraDeForma(readFileSync(new URL(n, dir), "utf8")), n).toEqual([]);
      }
    }
  });

  it("L 12: todo raise es un literal sin % ni concatenación", () => {
    for (const [dir, lista] of [
      [DIR_MIGRACIONES, migraciones],
      [DIR_REVERSIONES, reversiones],
    ] as const) {
      for (const n of lista) {
        expect(raiseIncorrectos(readFileSync(new URL(n, dir), "utf8")), n).toEqual([]);
      }
    }
  });
});
