// L 13 de la función 010 (diseño D-3, N-1): toda función de las migraciones que
// sea `security definer` o de disparador, en cualquier esquema, lleva
// `set search_path = pg_catalog, pg_temp` (con `pg_temp` el último). Con `''`,
// `pg_temp` iría primero para tipos y relaciones (B-1). Comprobación textual.
import { readdirSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { normalizar } from "./apoyo/texto";

const DIR_MIGRACIONES = new URL("../../../supabase/migrations/", import.meta.url);

const DIR_REVERSIONES = new URL("../../../supabase/reversiones/", import.meta.url);

/** Sentencias `alter function|procedure|routine` que cambian ruta, reinician o cambian la seguridad. */
export function alterFuncionProhibido(sql: string): string[] {
  const texto = normalizar(sql).replace(/"/g, "");
  const malas: string[] = [];
  for (const parte of texto.split(";")) {
    const p = parte.trim();
    if (
      /\balter (?:function|procedure|routine)\b/.test(p) &&
      /\b(?:set|reset|security)\b/.test(p)
    ) {
      malas.push(p.slice(0, 80));
    }
  }
  return malas;
}

const RUTA = /\bset search_path (?:=|to) pg_catalog, pg_temp(?=[\s;]|$)/;

/**
 * Cabeceras (de `create function` o `create procedure` hasta su `as`) que son
 * `security definer` o devuelven `trigger` (o `event_trigger`) y no llevan la
 * ruta fijada. Una cabecera que no se puede leer (sin `as` con cuerpo) también
 * se devuelve: cierra en fallo.
 */
export function funcionesSinRutaFija(sql: string): string[] {
  const texto = normalizar(sql).replace(/"/g, "");
  const malas: string[] = [];
  const crea = /\bcreate (?:or replace )?(?:function|procedure) /g;
  let m: RegExpExecArray | null;
  while ((m = crea.exec(texto)) !== null) {
    const desde = m.index;
    // Lista blanca: el cuerpo es `as $etiqueta$` y nada mas (sin as e'…', as '…', U&'…',
    // b'…'): cualquier otra forma cierra en fallo.
    const cuerpo = /\bas\s+\$[a-z_0-9]*\$/.exec(texto.slice(desde));
    const otro = /\bas\s+(?!\$[a-z_0-9]*\$)\S/.exec(texto.slice(desde));
    if (cuerpo === null || (otro !== null && otro.index < cuerpo.index)) {
      malas.push(texto.slice(desde, desde + 80));
      continue;
    }
    // Cabecera y, tras el cuerpo, las cláusulas que lo siguen hasta el `;`.
    const inicioCuerpo = desde + cuerpo.index + cuerpo[0].length;
    const delim = cuerpo[0].endsWith("'")
      ? "'"
      : (/\$[a-z_0-9]*\$$/.exec(cuerpo[0]) as RegExpExecArray)[0];
    let finCuerpo = inicioCuerpo;
    if (delim === "'") {
      while (
        finCuerpo < texto.length &&
        !(texto[finCuerpo] === "'" && texto[finCuerpo + 1] !== "'")
      ) {
        finCuerpo += texto[finCuerpo] === "'" ? 2 : 1;
      }
    } else {
      const f = texto.indexOf(delim, inicioCuerpo);
      finCuerpo = f === -1 ? texto.length : f;
    }
    const tras = texto.slice(finCuerpo + delim.length);
    const cola = tras.slice(0, tras.indexOf(";") === -1 ? tras.length : tras.indexOf(";"));
    const cabecera = `${texto.slice(desde, desde + cuerpo.index)} ${cola}`;
    const exige =
      /\bsecurity definer\b/.test(cabecera) ||
      /\breturns (?:pg_catalog\.)?(?:event_)?trigger\b/.test(cabecera);
    // Una sola cláusula: una segunda puede deshacer la primera.
    const clausulas = cabecera.match(/\bset search_path\b/g)?.length ?? 0;
    if (exige && (!RUTA.test(cabecera) || clausulas > 1)) malas.push(cabecera.slice(0, 80));
  }
  return malas;
}

describe("L 13 (N-1): detector (sin archivos)", () => {
  const F = (cab: string) => `create function privado.f() ${cab} as $f$ begin return 1; end $f$;`;
  const BUENA = "set search_path = pg_catalog, pg_temp";

  it("acepta security definer y disparadores con la ruta fijada", () => {
    expect(
      funcionesSinRutaFija(F(`returns pg_catalog.int4 language plpgsql security definer ${BUENA}`)),
    ).toEqual([]);
    expect(funcionesSinRutaFija(F(`returns trigger language plpgsql ${BUENA}`))).toEqual([]);
    expect(funcionesSinRutaFija(F(`returns pg_catalog.trigger language plpgsql ${BUENA}`))).toEqual(
      [],
    );
    expect(
      funcionesSinRutaFija(
        `CREATE OR REPLACE FUNCTION public.g() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO pg_catalog, pg_temp AS $x$ begin return null; end $x$;`,
      ),
    ).toEqual([]);
    expect(
      funcionesSinRutaFija(`do $$ begin ${F(`returns trigger language plpgsql ${BUENA}`)} end $$;`),
    ).toEqual([]);
  });

  it("acepta la ruta fijada en una cláusula que sigue al cuerpo", () => {
    expect(
      funcionesSinRutaFija(
        `create function privado.f() returns trigger language plpgsql as $f$ begin return null; end $f$ ${BUENA};`,
      ),
    ).toEqual([]);
  });

  it("acepta una función común (invoker, no de disparador) sin la ruta", () => {
    expect(funcionesSinRutaFija(F("returns pg_catalog.int4 language sql"))).toEqual([]);
    expect(
      funcionesSinRutaFija(F("returns pg_catalog.int4 language plpgsql security invoker")),
    ).toEqual([]);
    expect(funcionesSinRutaFija("select 1;")).toEqual([]);
  });

  it("rechaza security definer o disparador sin la ruta, en cualquier esquema", () => {
    const malas = [
      F("returns pg_catalog.int4 language plpgsql security definer"),
      F("returns trigger language plpgsql"),
      F("returns pg_catalog.trigger language plpgsql"),
      F("returns event_trigger language plpgsql"),
      F("returns trigger language plpgsql set search_path = ''"),
      F("returns trigger language plpgsql set search_path = ''''"),
      F("returns trigger language plpgsql set search_path = pg_temp, pg_catalog"),
      F("returns trigger language plpgsql set search_path = pg_catalog"),
      F("returns trigger language plpgsql set search_path = public, pg_catalog, pg_temp"),
      F("returns trigger language plpgsql set search_path = pg_catalog, pg_temp, public"),
      F('returns trigger language plpgsql "set" search_path = pg_catalog'),
      F("returns pg_catalog.int4 language sql SECURITY DEFINER"),
      // Más de una cláusula: la segunda puede deshacer la primera.
      F(`returns trigger language plpgsql ${BUENA} set search_path = public`),
      F(`returns trigger language plpgsql set search_path = public ${BUENA}`),
      F(`returns trigger language plpgsql ${BUENA} ${BUENA}`),
      `create function public.g() returns trigger language plpgsql as $x$ begin return null; end $x$;`,
      `create function auth.g() returns pg_catalog.int4 language sql security definer as 'select 1';`,
      `do $$ begin ${F("returns trigger language plpgsql")} end $$;`,
      "create procedure privado.p() language sql security definer as $p$ select 1 $p$;",
      // MENOR del revisor (vuelta 2): cláusulas que siguen al cuerpo.
      `create function privado.f() returns trigger language plpgsql ${BUENA} as $f$ begin return null; end $f$ set search_path = public;`,
      `create function privado.f() returns trigger language plpgsql as $f$ begin return null; end $f$ set search_path = public;`,
      `create function privado.f() returns trigger language plpgsql as $f$ begin return null; end $f$ ${BUENA} ${BUENA};`,
      `create function privado.f() returns trigger language sql as 'select 1' set search_path = pg_catalog;`,
      // Vuelta 3: cualquier cuerpo que no sea de comillas de dolar se rechaza.
      "create function privado.f() returns trigger language sql as e'select 1' set search_path = pg_catalog, pg_temp;",
      "create function privado.f() returns trigger language sql as E'select 1' set search_path = pg_catalog, pg_temp;",
      "create function privado.f() returns trigger language sql as 'select 1' set search_path = pg_catalog, pg_temp;",
      "create function privado.f() returns trigger language plpgsql as e'begin return null; end; as $x$' set search_path = pg_catalog, pg_temp;",
      "create function privado.f() returns trigger language sql as U&'select 1' set search_path = pg_catalog, pg_temp;",
      "create function privado.f() returns trigger language sql as b'0101' set search_path = pg_catalog, pg_temp;",
      "create function privado.f() returns trigger language sql as  e'select 1' set search_path = pg_catalog, pg_temp;",
      // Sin cuerpo legible: cierra en fallo.
      "create function privado.f() returns trigger language sql return null;",
    ];
    for (const caso of malas) expect(funcionesSinRutaFija(caso), caso).toHaveLength(1);
  });

  it("con varias funciones, devuelve solo las malas", () => {
    const sql = `${F(`returns trigger language plpgsql ${BUENA}`)} ${F("returns trigger language plpgsql")} ${F("returns pg_catalog.int4 language sql")}`;
    expect(funcionesSinRutaFija(sql)).toHaveLength(1);
  });
});

describe("L 13 (vuelta 3): alter function no cambia ruta ni seguridad", () => {
  const MALAS = [
    "alter function privado.f() set search_path = public",
    "alter function privado.f() set search_path to public",
    "alter function privado.f(text) reset search_path",
    "alter function privado.f() reset all",
    "alter function privado.f() security definer",
    "alter function privado.f() security invoker",
    "alter function privado.f() external security definer",
    "ALTER FUNCTION privado.f() SET search_path = public",
    'alter function "privado"."f"() set search_path = public',
    "alter function if exists privado.f() set search_path = public",
    "alter procedure privado.p() set search_path = public",
    "alter procedure privado.p() security definer",
    "alter routine privado.p() set search_path = public",
    "alter routine privado.p() reset search_path",
    "alter function privado.f() owner to postgres set search_path = public",
    "alter function privado.f() strict set search_path = public",
    "alter function privado.f() set search_path = public",
    "alter function privado.f() /* x */ set search_path = public",
    "execute pg_catalog.format('alter function privado.f() set search_path = %s', v)",
  ];
  for (const m of MALAS) {
    it(`rechaza: ${m}`, () => {
      expect(alterFuncionProhibido(`do $$ begin ${m}; end $$;`), m).toHaveLength(1);
    });
  }
  it("acepta lo demás (owner, rename, create)", () => {
    expect(alterFuncionProhibido("alter function privado.f() owner to postgres")).toEqual([]);
    expect(alterFuncionProhibido("alter function privado.f() rename to g")).toEqual([]);
    expect(alterFuncionProhibido("alter table public.a set schema x")).toEqual([]);
    expect(
      alterFuncionProhibido(
        "create function privado.f() returns trigger language sql security definer as $f$ select 1 $f$",
      ),
    ).toEqual([]);
  });
  it("ninguna migración ni reversión lo contiene", () => {
    for (const dir of [DIR_MIGRACIONES, DIR_REVERSIONES]) {
      for (const n of readdirSync(dir).filter((x) => x.endsWith(".sql"))) {
        expect(alterFuncionProhibido(readFileSync(new URL(n, dir), "utf8")), n).toEqual([]);
      }
    }
  });
});

describe("L 13 (N-1): migraciones", () => {
  it("toda función security definer o de disparador lleva search_path = pg_catalog, pg_temp", () => {
    const archivos = readdirSync(DIR_MIGRACIONES)
      .filter((n) => n.endsWith(".sql"))
      .sort();
    expect(archivos.length).toBeGreaterThan(0);
    for (const n of archivos) {
      expect(funcionesSinRutaFija(readFileSync(new URL(n, DIR_MIGRACIONES), "utf8")), n).toEqual(
        [],
      );
    }
  });
});
