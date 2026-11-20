// T-102 (001): pruebas del apoyo de la batería. Todos los valores sembrados se componen en
// ejecución; no hay secretos literales ni credenciales reales (arts. 1 y 4).
import { createHmac, randomBytes } from "node:crypto";
import { afterAll, afterEach, describe, expect, it } from "vitest";
import {
  capturarConsola,
  crearAlmacenPglite,
  crearBd,
  ErrorAlmacen,
  crearDobleRed,
  crearFabrica,
  crearSumidero,
  RelojPrueba,
  reescribirReloj,
  type BdApoyo,
} from "./apoyo/index";

const sembrado = () => "sembrado-" + randomBytes(24).toString("base64url");

const SQL_MINIMO = `
create schema conector_prueba;
revoke all on schema conector_prueba from public;
create table conector_prueba.cosas (id int primary key, creado timestamptz not null default now());
alter table conector_prueba.cosas enable row level security;
insert into conector_prueba.cosas (id) values (1);
create function conector_prueba.hora() returns timestamptz
  language sql security definer set search_path = '' as $$ select now() $$;
create function conector_prueba.cuenta() returns bigint
  language sql security definer set search_path = '' as $$ select count(*) from conector_prueba.cosas $$;
revoke execute on all functions in schema conector_prueba from public, anon, authenticated, service_role;
create role llamante_prueba nologin;
grant usage on schema conector_prueba to llamante_prueba;
grant execute on all functions in schema conector_prueba to llamante_prueba;
`;

const abiertas: BdApoyo[] = [];
async function abrir(sql: string[] = []) {
  const bd = await crearBd({ sqlExtra: sql });
  abiertas.push(bd);
  return bd;
}
// Una base compartida por las pruebas que no la dañan (arrancar PGlite cuesta CPU y la batería
// comparte máquina con pruebas sensibles al tiempo); la del reloj se libera tras cada prueba.
let unica: Promise<BdApoyo> | null = null;
const compartida = () => (unica ??= crearBd({ sqlExtra: [SQL_MINIMO] }));
afterAll(async () => {
  if (unica) await (await unica).cerrar();
});
afterEach(async () => {
  if (unica) await (await unica).reloj.liberar();
  while (abiertas.length > 0) await abiertas.pop()?.cerrar();
});

describe("sumidero de salida (PRUEBA-019, parte)", () => {
  it("halla un valor sembrado en consola, errores, respuestas y objetos, sin imprimirlo", async () => {
    const valor = sembrado();
    const sumidero = crearSumidero();
    expect(sumidero.hallar(valor)).toEqual([]);

    const consola = capturarConsola(sumidero);
    console.log("linea sin nada");
    console.error({ anidado: { lista: ["x", valor] } });
    consola.restaurar();

    sumidero.registrarError(new Error(`fallo con ${valor}`));
    await sumidero.registrarRespuesta(new Response(JSON.stringify({ a: valor }), { status: 200 }));
    await sumidero.registrarRespuesta(new Response("limpio", { headers: { "x-eco": valor } }));

    const hallazgos = sumidero.hallar(valor);
    expect(hallazgos.map((h) => h.origen).sort()).toEqual(
      ["consola.error", "error", "respuesta.cuerpo", "respuesta.cabecera"].sort(),
    );
    // El informe no contiene el valor (art. 4: ni siquiera en los mensajes de la prueba).
    expect(JSON.stringify(hallazgos)).not.toContain(valor);
  });

  it("halla también las formas codificadas y no da falsos positivos", () => {
    const valor = sembrado();
    const sumidero = crearSumidero();
    sumidero.registrar("registro", encodeURIComponent(`a=${valor}&b=ñ`));
    sumidero.registrar("registro", Buffer.from(valor).toString("base64"));
    expect(sumidero.hallar(valor)).toHaveLength(2);
    expect(sumidero.hallar(sembrado())).toEqual([]);
  });

  it("halla el valor sembrado en el util.inspect completo: Error con propiedades, Map, Headers y Buffer", () => {
    const casos: [string, (v: string) => unknown][] = [
      [
        "Error con propiedades",
        (v) => Object.assign(new Error("fallo"), { detalle: { profundo: { a: { b: [v] } } } }),
      ],
      [
        "Error con propiedad no enumerable",
        (v) => Object.defineProperty(new Error("fallo"), "oculta", { value: v, enumerable: false }),
      ],
      ["Map (clave)", (v) => new Map([[v, 1]])],
      ["Map (valor anidado)", (v) => new Map([["k", { x: new Set([v]) }]])],
      ["Headers", (v) => new Headers({ "x-prueba": v })],
      ["Buffer", (v) => Buffer.from(v)],
      ["Uint8Array en un objeto", (v) => ({ datos: new Uint8Array(Buffer.from(v)) })],
      ["símbolo como clave", (v) => ({ [Symbol("s")]: v })],
      ["getter", (v) => Object.defineProperty({}, "g", { get: () => v, enumerable: true })],
      ["lista larga", (v) => [...Array.from({ length: 300 }, () => 0), v]],
      ["cadena larga", (v) => "x".repeat(20_000) + v],
    ];
    for (const [nombre, hacer] of casos) {
      const valor = sembrado();
      const sumidero = crearSumidero();
      sumidero.registrar("caso", hacer(valor));
      const consola = capturarConsola(sumidero);
      console.log(hacer(valor));
      consola.restaurar();
      expect(sumidero.hallar(valor).length, nombre).toBe(2);
    }
  });

  it("captura también dir, trace, table, assert, stdout y stderr, y el formato %s con toString", () => {
    const casos: [string, (v: string) => void][] = [
      ["console.dir", (v) => console.dir({ a: v })],
      ["console.trace", (v) => console.trace(v)],
      ["console.table", (v) => console.table([{ a: v }])],
      ["console.assert", (v) => console.assert(false, v)],
      ["process.stdout.write", (v) => process.stdout.write(v)],
      ["process.stdout.write (Buffer)", (v) => process.stdout.write(Buffer.from(v))],
      ["process.stderr.write", (v) => process.stderr.write(v)],
      ["console.log con %s y toString", (v) => console.log("%s", { toString: () => v })],
    ];
    for (const [nombre, escribir] of casos) {
      const valor = sembrado();
      const sumidero = crearSumidero();
      const consola = capturarConsola(sumidero);
      try {
        escribir(valor);
      } finally {
        consola.restaurar();
      }
      expect(sumidero.hallar(valor), nombre).toHaveLength(1);
    }
  });

  it("mientras el sumidero está activo el valor no llega a la salida real, y se restaura al cerrar", () => {
    const valor = sembrado();
    const recibido: string[] = [];
    const escrituras = ["stdout", "stderr"] as const;
    const guardadas = escrituras.map((s) => process[s].write);
    for (const s of escrituras) {
      process[s].write = ((x: unknown) => {
        recibido.push(String(x));
        return true;
      }) as typeof process.stdout.write;
    }
    const espiasConsola = console.dir;
    try {
      const sumidero = crearSumidero();
      const consola = capturarConsola(sumidero);
      console.dir({ a: valor });
      process.stdout.write(valor);
      process.stderr.write(valor);
      consola.restaurar();
      expect(recibido.join("")).not.toContain(valor);
      expect(sumidero.hallar(valor)).toHaveLength(3);
      expect(console.dir).toBe(espiasConsola);
      process.stdout.write("tras-restaurar");
      expect(recibido).toContain("tras-restaurar");
    } finally {
      escrituras.forEach((s, i) => (process[s].write = guardadas[i]!));
    }
  });

  it("cada forma codificada se halla por separado con un valor que exige escapes", () => {
    const valor = `??>${sembrado()}"q"
/ñ&`;
    const buffer = Buffer.from(valor, "utf8");
    const formas = {
      literal: valor,
      url: encodeURIComponent(valor),
      json: JSON.stringify(valor).slice(1, -1),
      base64: buffer.toString("base64"),
      base64url: buffer.toString("base64url"),
      hex: buffer.toString("hex"),
    };
    // Condición previa: las seis formas son distintas entre sí, o la prueba no distinguiría nada.
    expect(new Set(Object.values(formas)).size).toBe(6);
    for (const [forma, texto] of Object.entries(formas)) {
      const sumidero = crearSumidero();
      sumidero.registrar("solo", `prefijo ${texto} sufijo`);
      expect(sumidero.hallar(valor), forma).toEqual([{ origen: "solo", forma }]);
    }
  });

  it("capturarConsola restaura la consola original", () => {
    const antes = console.log;
    const c = capturarConsola(crearSumidero());
    expect(console.log).not.toBe(antes);
    c.restaurar();
    expect(console.log).toBe(antes);
  });
});

describe("base de datos de apoyo y roles de Supabase imitados (PRUEBA-022, parte)", () => {
  it("no falla si supabase/conector-prueba no tiene SQL y carga lo que haya", async () => {
    const bd = await crearBd({ directorioSql: "tests/conector/apoyo/no-existe" });
    abiertas.push(bd);
    expect(bd.archivosCargados).toEqual([]);
    const roles = (
      await bd.db.query<{ rolname: string }>(
        "select rolname from pg_roles where rolname in ('anon','authenticated','service_role') order by 1",
      )
    ).rows.map((f) => f.rolname);
    expect(roles).toEqual(["anon", "authenticated", "service_role"]);
  });

  it("los roles de Supabase no tienen privilegio alguno sobre el esquema de la prueba", async () => {
    const bd = await compartida();
    for (const rol of ["anon", "authenticated", "service_role"]) {
      expect(await bd.privilegios(rol, "conector_prueba")).toEqual([]);
      await expect(
        bd.como(rol, () => bd.db.query("select * from conector_prueba.cosas")),
      ).rejects.toThrow(/permission denied/);
      await expect(
        bd.como(rol, () => bd.db.query("select conector_prueba.cuenta()")),
      ).rejects.toThrow(/permission denied/);
      await expect(
        bd.como(rol, () => bd.db.query("insert into conector_prueba.cosas (id) values (2)")),
      ).rejects.toThrow(/permission denied/);
    }
  });

  it("la comprobación puede fallar: detecta una concesión a un rol de Supabase", async () => {
    const bd = await abrir([
      SQL_MINIMO,
      "grant usage on schema conector_prueba to anon; grant select on conector_prueba.cosas to authenticated;",
    ]);
    expect((await bd.privilegios("anon", "conector_prueba")).length).toBeGreaterThan(0);
    expect((await bd.privilegios("authenticated", "conector_prueba")).length).toBeGreaterThan(0);
    expect(await bd.privilegios("service_role", "conector_prueba")).toEqual([]);
  });
});

describe("reloj de la prueba", () => {
  it("mueve now() de la base de datos, también en funciones con search_path vacío y en defaults", async () => {
    const bd = await compartida();
    const t0 = bd.reloj.actual().getTime();
    expect(Math.abs((await bd.ahoraBd()).getTime() - t0)).toBeLessThan(2000);

    await bd.reloj.avanzar(5 * 60_000 + 1000);
    const delta = (await bd.ahoraBd()).getTime() - t0;
    expect(delta).toBeGreaterThanOrEqual(5 * 60_000 + 1000);
    expect(delta).toBeLessThan(5 * 60_000 + 3000);

    const funcion = (await bd.db.query<{ h: Date }>("select conector_prueba.hora() as h")).rows[0]!;
    expect(funcion.h.getTime() - t0).toBeGreaterThanOrEqual(5 * 60_000 + 1000);

    await bd.db.exec("insert into conector_prueba.cosas (id) values (3) on conflict do nothing");
    const fila = (
      await bd.db.query<{ creado: Date }>("select creado from conector_prueba.cosas where id = 3")
    ).rows[0]!;
    expect(fila.creado.getTime() - t0).toBeGreaterThanOrEqual(5 * 60_000 + 1000);
  });

  it("fija un instante y lo congela; el reloj de la aplicación coincide", async () => {
    const bd = await compartida();
    const fijo = new Date("2030-01-02T03:04:05.000Z");
    await bd.reloj.fijar(fijo);
    expect(bd.reloj.actual().toISOString()).toBe(fijo.toISOString());
    expect((await bd.ahoraBd()).toISOString()).toBe(fijo.toISOString());
    await bd.reloj.avanzar(1000);
    expect((await bd.ahoraBd()).toISOString()).toBe("2030-01-02T03:04:06.000Z");
    expect(bd.reloj.actual().toISOString()).toBe("2030-01-02T03:04:06.000Z");
  });
});

describe("reloj: el SQL de prueba falla a la vista ante horas no controladas", () => {
  const prohibidas = [
    "select current_date",
    "select localtimestamp",
    "select 'now'::timestamptz",
    "select timeofday()",
    "select pg_catalog.now()",
    "select current_time",
    "select localtime",
    "select current_timestamp(3)",
    "select timestamptz 'today'",
    "select 'tomorrow'::date",
    "select pg_catalog.clock_timestamp()",
    "select CURRENT_DATE",
  ];
  for (const sql of prohibidas) {
    it(`rechaza: ${sql}`, async () => {
      await expect(crearBd({ sqlExtra: [sql] })).rejects.toThrow(/reloj: hora no controlada/);
    });
  }

  it("sigue aceptando now(), current_timestamp y los equivalentes reescritos", async () => {
    const bd = await abrir([
      "select now(), current_timestamp, clock_timestamp(), transaction_timestamp(), statement_timestamp()",
    ]);
    expect(bd.archivosCargados).toEqual([]);
  });

  it("now() es estable dentro de la transacción y cambia en la siguiente", async () => {
    const bd = await compartida();
    await bd.db.exec("begin");
    const a = (await bd.db.query<{ h: Date }>("select now() as h")).rows[0]!.h;
    await bd.db.query("select pg_sleep(0.05)");
    const b = (await bd.db.query<{ h: Date }>("select now() as h")).rows[0]!.h;
    const c = (await bd.db.query<{ h: Date }>("select conector_prueba.hora() as h")).rows[0]!.h;
    await bd.db.exec("commit");
    expect(b.getTime()).toBe(a.getTime());
    expect(c.getTime()).toBe(a.getTime());
    await bd.db.query("select pg_sleep(0.05)");
    const d = (await bd.db.query<{ h: Date }>("select now() as h")).rows[0]!.h;
    expect(d.getTime()).toBeGreaterThan(a.getTime());
  });
});

describe("doble de red", () => {
  it("responde lo registrado, cierra en fallo lo demás y simula caídas", async () => {
    const red = crearDobleRed();
    red.responder("GET", "https://ficticio.test/a", () => new Response("ok", { status: 200 }));
    const respuesta = await red.fetch("https://ficticio.test/a");
    expect(await respuesta.text()).toBe("ok");
    await expect(red.fetch("https://ficticio.test/otra")).rejects.toThrow(/sin respuesta/);
    red.caer("https://ficticio.test/a");
    await expect(red.fetch("https://ficticio.test/a")).rejects.toThrow(/red caída/);
    expect(red.llamadas.map((l) => l.metodo)).toEqual(["GET", "GET", "GET"]);
  });

  it("el mensaje de error no lleva la consulta de la URL", async () => {
    const valor = sembrado();
    const red = crearDobleRed();
    const url = `https://ficticio.test/cb?code=${valor}#f${valor}`;
    const sinRespuesta = await red.fetch(url).then(
      () => new Error("sin error"),
      (e: Error) => e,
    );
    expect(sinRespuesta.message).toMatch(/sin respuesta/);
    expect(sinRespuesta.message).not.toContain(valor);
    red.caer(url);
    const caida = await red.fetch(url).then(
      () => new Error("sin error"),
      (e: Error) => e,
    );
    expect(caida.message).not.toContain(valor);
  });

  it("no guarda cuerpos ni valores de cabeceras en las llamadas", async () => {
    const valor = sembrado();
    const red = crearDobleRed();
    red.responder("POST", "https://ficticio.test/p", () => new Response(null, { status: 204 }));
    await red.fetch("https://ficticio.test/p", {
      method: "POST",
      body: valor,
      headers: { authorization: valor },
    });
    expect(JSON.stringify(red.llamadas)).not.toContain(valor);
    // Request añade content-type solo por llevar un cuerpo de texto; lo que cuenta son los nombres.
    expect(red.llamadas[0]?.cabeceras).toContain("authorization");
  });
});

describe("almacén PGlite (interfaz local mínima)", () => {
  it("llama a una función del esquema y cierra en fallo si cae o el nombre no vale", async () => {
    const bd = await compartida();
    const almacen = await crearAlmacenPglite(bd, "llamante_prueba");
    const filas = Number(
      (await bd.db.query<{ n: number }>("select count(*)::int as n from conector_prueba.cosas"))
        .rows[0]!.n,
    );
    expect(Number(await almacen.llamar("cuenta", []))).toBe(filas);
    await expect(almacen.llamar("cuenta; drop table x", [])).rejects.toThrow(/nombre/);
    almacen.caer(true);
    await expect(almacen.llamar("cuenta", [])).rejects.toThrow(/almacén caído/);
    almacen.caer(false);
    expect(Number(await almacen.llamar("cuenta", []))).toBe(filas);
  });
});

describe("almacén: la causa solo lleva el SQLSTATE", () => {
  it("un error de la base con texto sembrado no llega a causa ni a mensaje", async () => {
    const valor = sembrado();
    const bd = await abrir([
      SQL_MINIMO,
      `create function conector_prueba.falla() returns int language plpgsql security definer set search_path = '' as $$
         begin raise exception 'detalle %', '${valor}' using errcode = 'P0001'; end $$;
       grant execute on function conector_prueba.falla() to llamante_prueba;`,
    ]);
    const almacen = await crearAlmacenPglite(bd, "llamante_prueba");
    const error = await almacen.llamar("falla", []).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ErrorAlmacen);
    expect((error as ErrorAlmacen).causa).toBe("P0001");
    const sumidero = crearSumidero();
    sumidero.registrarError(error);
    expect(sumidero.hallar(valor)).toEqual([]);
    const inexistente = await almacen.llamar("no_existe", []).catch((e: unknown) => e);
    expect((inexistente as ErrorAlmacen).causa).toMatch(/^[0-9A-Z]{5}$/);
  });

  it("sin SQLSTATE conocido la causa es un marcador fijo", () => {
    expect(new ErrorAlmacen("texto libre").causa).toBe("desconocida");
    expect(new ErrorAlmacen("simulado").causa).toBe("simulado");
  });
});

describe("fábrica de licencias, conexiones y tokens", () => {
  const clave = randomBytes(32);
  const hmac = (mensaje: string) => createHmac("sha256", clave).update(mensaje).digest("base64url");

  it("siembra tokens con la forma del diseño y su HMAC de guardado con tipo", () => {
    const f = crearFabrica({ hmac });
    const acceso = f.token("acceso");
    const renovacion = f.token("renovacion");
    expect(acceso.valor).toMatch(/^hia_a_[A-Za-z0-9_-]{43}$/);
    expect(renovacion.valor).toMatch(/^hia_r_[A-Za-z0-9_-]{43}$/);
    expect(acceso.hmac).toBe(hmac(`acceso:${acceso.valor}`));
    expect(acceso.hmac).not.toBe(hmac(`renovacion:${acceso.valor}`));
    expect(f.token("acceso").valor).not.toBe(acceso.valor);
  });

  it("licencias y conexiones de dos clientes ficticios, con identificadores distintos", () => {
    const f = crearFabrica({ hmac });
    const a = f.licencia("A");
    const b = f.licencia("B");
    expect(a.id).not.toBe(b.id);
    expect(a.clienteId).not.toBe(b.clienteId);
    const c = f.conexion(a, "claude");
    expect(c.licenciaId).toBe(a.id);
    expect(c.asistente).toBe("claude");
    expect(Object.keys(a).sort()).toEqual(["clienteId", "id", "tipo"]);
  });

  it("el HMAC lo pone quien llama: sin función inyectada no se crea la fábrica", () => {
    expect(() => crearFabrica({} as never)).toThrow(/hmac/);
  });
});

describe("almacén: el rol de llamada no puede saltarse la seguridad por filas", () => {
  it("rechaza roles con rolsuper o rolbypassrls, o que no existen", async () => {
    const bd = await compartida();
    await expect(crearAlmacenPglite(bd, "postgres")).rejects.toThrow(/superusuario/);
    await expect(crearAlmacenPglite(bd, "service_role")).rejects.toThrow(/bypassrls/);
    await expect(crearAlmacenPglite(bd, "rol_que_no_existe")).rejects.toThrow(/no existe/);
    await expect(crearAlmacenPglite(bd, "llamante_prueba")).resolves.toBeDefined();
  });
});

// 3.ª corrección: cuerpos entre comillas, U&"", backslash en E'', etiquetas no ASCII y palabras de hora
// dentro de un literal. Cada una falla al cargar y como consulta suelta.
const FUNCION_COMILLAS =
  "create function conector_prueba.h() returns timestamptz language sql security definer set search_path = '' as";
const NUEVAS_PROHIBIDAS = [
  `${FUNCION_COMILLAS} 'select now()'`,
  `${FUNCION_COMILLAS} E'select now()'`,
  `${FUNCION_COMILLAS} 'select pg_catalog.now()'`,
  `${FUNCION_COMILLAS} 'select clock_timestamp()'`,
  "do 'begin perform now(); end'",
  'select 1 as U&"now"',
  'select 1 as u&"x"',
  String.raw`select E'a\nb'`,
  String.raw`select E'\'' || 'x'`,
  "select $é$x$é$",
  "select $ñ$ now $ñ$",
  "select 'today 00:00'::timestamptz",
  "select 'yesterday +00'::timestamptz",
  "select 'tomorrow noon'::timestamptz",
  "select timestamptz 'now +01'",
  "select $$today 00:00$$::timestamptz",
  // 4.ª vuelta (condiciones del auditor)
  String.raw`select $_ñ$'$_ñ$ as a, extract(year from U&"\0070g_catalog".U&"\006eow"())::int as b, $_ñ$'$_ñ$`,
  String.raw`select $aé$'$aé$ as a, extract(year from U&"\0070g_catalog".U&"\006eow"())::int as b, $aé$'$aé$`,
  `${FUNCION_COMILLAS} ` + String.raw`'select U&"\006eow"()'`,
  String.raw`do 'begin perform U&"\006eow"(); end'`,
  "select 'today00:00'::timestamptz",
  "select '00:00today'::timestamptz",
  "select 'no'\r'w'::timestamptz",
  "select 'no'\r\n'w'::timestamptz",
];

describe("base de datos de apoyo: no hay vía en bruto hacia la base", () => {
  it("solo expone query y exec", async () => {
    const bd = await compartida();
    expect(Object.keys(bd.db).sort()).toEqual(["exec", "query"]);
    expect("transaction" in bd.db).toBe(false);
  });

  it("con la hora fijada en 2030, current_timestamp y compañía dan 2030 por la vía pública", async () => {
    const bd = await compartida();
    await bd.reloj.fijar(new Date("2030-06-07T08:09:10.000Z"));
    for (const expr of [
      "current_timestamp",
      "CURRENT_TIMESTAMP",
      "now()",
      '"now"()',
      "clock_timestamp()",
      "statement_timestamp()",
      "transaction_timestamp()",
      "now /* c */ ( )",
    ]) {
      const f = (await bd.db.query<{ a: number }>(`select extract(year from ${expr})::int as a`))
        .rows[0]!;
      expect(f.a, expr).toBe(2030);
    }
    const sueltas = await bd.db.exec("select current_timestamp as h");
    expect((sueltas[0]!.rows[0] as { h: Date }).h.getUTCFullYear()).toBe(2030);
  });

  const prohibidasEnEjecucion = [
    "select current_date",
    "select pg_catalog.now()",
    'select pg_catalog."now"()',
    'select "pg_catalog"."now"()',
    "select pg_catalog /* x */ . /* y */ now()",
    "select pg_catalog -- x\n . now()",
    "select 'a--', current_date",
    "select age(timestamptz '2000-01-01')",
    "select AGE ( timestamptz '2000-01-01' )",
    "select 'now'::timestamptz",
    "select $q$now$q$::timestamptz",
    "select $$ today $$::date",
    "select ('no' || 'w')::timestamptz",
    "select ('n' || 'o' || 'w')::timestamptz",
    "select 'no'\n'w'::timestamptz",
    "select $a$no$a$ || 'w'",
    "select E'\\x6eow'::timestamptz",
    "select U&'\\006eow'::timestamptz",
    "select localtimestamp",
    "select timeofday()",
    "set search_path = pg_catalog",
    "set standard_conforming_strings = off",
    "set standard_conforming_strings to 'off'",
    "select set_config('standard_conforming_strings', 'off', false)",
    "select set_config('search_path', 'pg_catalog', false)",
    "reset all",
    ...NUEVAS_PROHIBIDAS,
  ];
  for (const sql of prohibidasEnEjecucion) {
    it(`rechaza en consulta suelta (query y exec): ${JSON.stringify(sql)}`, async () => {
      const bd = await compartida();
      await expect(bd.db.query(sql)).rejects.toThrow(/reloj: /);
      await expect(bd.db.exec(sql)).rejects.toThrow(/reloj: /);
    });
  }

  it("rechaza un parámetro con una palabra de hora y acepta age con dos argumentos", async () => {
    const bd = await compartida();
    await expect(bd.db.query("select $1::timestamptz", [" NOW "])).rejects.toThrow(/reloj: /);
    await expect(bd.db.query("select $1::date", ["Tomorrow"])).rejects.toThrow(/reloj: /);
    await expect(bd.db.query("select $1::timestamptz", ["today 00:00"])).rejects.toThrow(/reloj: /);
    await expect(bd.db.query("select $1::timestamptz", ["yesterday +00"])).rejects.toThrow(
      /reloj: /,
    );
    await expect(bd.db.query("select $1::timestamptz", ["today00:00"])).rejects.toThrow(/reloj: /);
    await expect(bd.db.query("select $1::timestamptz", ["00:00today"])).rejects.toThrow(/reloj: /);
    await expect(bd.db.query("select 'hola' as v, E'adiós' as w")).resolves.toBeDefined();
    await expect(
      bd.db.query("select age(now(), timestamptz '2000-01-01') is not null as v"),
    ).resolves.toBeDefined();
    await expect(bd.db.query("select $1::int as v", ["7"])).resolves.toBeDefined();
  });

  it("las mismas formas fallan también en el SQL cargado", async () => {
    for (const sql of [
      'select pg_catalog."now"()',
      "select age(timestamptz '2000-01-01')",
      "select $q$now$q$::timestamptz",
      "select ('no' || 'w')::timestamptz",
      "select pg_catalog /* x */ . now()",
      ...NUEVAS_PROHIBIDAS,
    ]) {
      await expect(crearBd({ sqlExtra: [sql] }), sql).rejects.toThrow(/reloj: hora no controlada/);
    }
  });
});

describe("reloj: propagación segura", () => {
  it("avanzar dentro de como falla con un error claro y no mueve el reloj", async () => {
    const bd = await compartida();
    const antes = bd.reloj.actual().getTime();
    await expect(bd.como("anon", () => bd.reloj.avanzar(60_000))).rejects.toThrow(/reloj: .*como/);
    expect(Math.abs(bd.reloj.actual().getTime() - antes)).toBeLessThan(2000);
    expect(Math.abs((await bd.ahoraBd()).getTime() - antes)).toBeLessThan(2000);
  });

  it("avanzar con una transacción abierta falla, no mueve el reloj y tras el rollback funciona", async () => {
    const bd = await compartida();
    const antes = bd.reloj.actual().getTime();
    await bd.db.exec("begin");
    try {
      await expect(bd.reloj.avanzar(60_000)).rejects.toThrow(/reloj: .*transacci/);
    } finally {
      await bd.db.exec("rollback");
    }
    expect(Math.abs(bd.reloj.actual().getTime() - antes)).toBeLessThan(2000);
    await bd.reloj.avanzar(60_000);
    expect(bd.reloj.actual().getTime() - antes).toBeGreaterThanOrEqual(60_000);
    expect((await bd.ahoraBd()).getTime() - antes).toBeGreaterThanOrEqual(60_000);
  });

  it("si la propagación falla, el estado de la aplicación no cambia", async () => {
    const r2 = new RelojPrueba();
    let fallar = false;
    await r2.enlazar(async () => {
      if (fallar) throw new Error("propagación fallida");
    });
    fallar = true;
    const t0 = r2.actual().getTime();
    await expect(r2.avanzar(60_000)).rejects.toThrow(/propagación fallida/);
    await expect(r2.fijar(new Date("2030-01-01T00:00:00Z"))).rejects.toThrow();
    expect(Math.abs(r2.actual().getTime() - t0)).toBeLessThan(2000);
  });
});

describe("red: el fetch global real queda bloqueado", () => {
  it("globalThis.fetch falla sin salir a internet y sin mostrar la consulta", async () => {
    const valor = sembrado();
    const error = await globalThis.fetch(`https://ficticio.test/x?c=${valor}`).then(
      () => new Error("sin error"),
      (e: Error) => e,
    );
    expect(error.message).toMatch(/red real bloqueada/);
    expect(error.message).not.toContain(valor);
  });
});

describe("fábrica: longitud del token", () => {
  it("exige 43 caracteres tras el prefijo", () => {
    const f = crearFabrica({ hmac: () => "x", aleatorio: () => new Uint8Array(16) });
    expect(() => f.token("acceso")).toThrow(/43/);
    const g = crearFabrica({ hmac: () => "x", aleatorio: () => new Uint8Array(33) });
    expect(() => g.token("renovacion")).toThrow(/43/);
  });
});

describe("4.ª vuelta: ahoraBd no depende del search_path de la sesión", () => {
  it("con search_path vacío en la sesión, ahoraBd sigue dando la hora de la prueba", async () => {
    const bd = await crearBd({
      sqlExtra: ["select pg_catalog.set_config('search_path', '', false)"],
    });
    try {
      await bd.reloj.fijar(new Date("2030-06-07T08:09:10.000Z"));
      expect((await bd.ahoraBd()).getUTCFullYear()).toBe(2030);
    } finally {
      await bd.cerrar();
    }
  });
});

describe("3.ª corrección: reloj y propagación", () => {
  it("dos avanzar a la vez suman: 60 s + 60 s = 120 s", async () => {
    const r = new RelojPrueba();
    await r.enlazar(async () => {
      await new Promise((ok) => setTimeout(ok, 20));
    });
    const base = new Date("2030-01-01T00:00:00.000Z");
    await r.fijar(base);
    await Promise.all([r.avanzar(60_000), r.avanzar(60_000)]);
    expect(r.actual().getTime() - base.getTime()).toBe(120_000);
  });

  it("dos avanzar a la vez contra la base también suman en la base", async () => {
    const bd = await compartida();
    const base = new Date("2030-01-01T00:00:00.000Z");
    await bd.reloj.fijar(base);
    await Promise.all([bd.reloj.avanzar(60_000), bd.reloj.avanzar(60_000)]);
    expect((await bd.ahoraBd()).getTime() - base.getTime()).toBe(120_000);
    expect(bd.reloj.actual().getTime() - base.getTime()).toBe(120_000);
  });

  it("mover el reloj con un rol distinto de postgres falla y no lo mueve", async () => {
    const bd = await abrir([SQL_MINIMO]);
    const antes = bd.reloj.actual().getTime();
    await bd.db.exec("set role anon");
    try {
      await expect(bd.reloj.avanzar(60_000)).rejects.toThrow(/reloj: .*rol/);
    } finally {
      await bd.db.exec("reset role");
    }
    expect(Math.abs(bd.reloj.actual().getTime() - antes)).toBeLessThan(2000);
    await bd.reloj.avanzar(60_000);
    expect(bd.reloj.actual().getTime() - antes).toBeGreaterThanOrEqual(60_000);
  });
});

describe("3.ª corrección: almacén", () => {
  it("repite la comprobación en cada llamada: un bypassrls posterior se detecta", async () => {
    const bd = await abrir([SQL_MINIMO]);
    const almacen = await crearAlmacenPglite(bd, "llamante_prueba");
    expect(Number(await almacen.llamar("cuenta", []))).toBe(1);
    await bd.db.exec("alter role llamante_prueba bypassrls");
    await expect(almacen.llamar("cuenta", [])).rejects.toThrow(/bypassrls/);
    await bd.db.exec("alter role llamante_prueba nobypassrls");
    expect(Number(await almacen.llamar("cuenta", []))).toBe(1);
  });

  it("rechaza al dueño (o miembro del dueño) de tablas con RLS sin force, y acepta con force", async () => {
    const bd = await abrir([
      SQL_MINIMO,
      `create role dueno_prueba nologin;
       create role miembro_prueba nologin in role dueno_prueba;
       create role forzado_prueba nologin;
       create table public.t_rls (id int);
       alter table public.t_rls owner to dueno_prueba;
       alter table public.t_rls enable row level security;
       create table public.t_forzada (id int);
       alter table public.t_forzada owner to forzado_prueba;
       alter table public.t_forzada enable row level security;
       alter table public.t_forzada force row level security;`,
    ]);
    await expect(crearAlmacenPglite(bd, "dueno_prueba")).rejects.toThrow(/dueño/);
    await expect(crearAlmacenPglite(bd, "miembro_prueba")).rejects.toThrow(/dueño/);
    await expect(crearAlmacenPglite(bd, "forzado_prueba")).resolves.toBeDefined();
    await expect(crearAlmacenPglite(bd, "llamante_prueba")).resolves.toBeDefined();
  });
});

describe("3.ª corrección: sumidero", () => {
  it("captura console.dirxml", () => {
    const valor = sembrado();
    const sumidero = crearSumidero();
    const c = capturarConsola(sumidero);
    try {
      console.dirxml({ a: valor });
    } finally {
      c.restaurar();
    }
    expect(sumidero.hallar(valor)).toHaveLength(1);
  });

  it("restaurar fuera de orden LIFO falla sin tocar nada; en orden funciona", () => {
    const original = console.log;
    const a = capturarConsola(crearSumidero());
    const b = capturarConsola(crearSumidero());
    try {
      expect(() => a.restaurar()).toThrow(/LIFO/);
    } finally {
      b.restaurar();
      a.restaurar();
    }
    expect(console.log).toBe(original);
  });
});

describe("3.ª corrección: rendimiento del análisis de SQL", () => {
  it("400 KB de SQL con muchos literales se analizan en menos de ~1 s", () => {
    const trozo =
      "select 'abc' as a, E'def' as b, \"col\" as c, $q$cuerpo$q$ as d, 'x' || 'y' as e; -- nota\n";
    const sql = trozo.repeat(Math.ceil(400_000 / trozo.length));
    const t0 = performance.now();
    reescribirReloj(sql);
    expect(performance.now() - t0).toBeLessThan(1000);
  });
});
