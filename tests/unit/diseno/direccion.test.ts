// T-007 (d) · PRUEBA-009 (REQ-059, REQ-083, CA-044): lo que va en la dirección de la página son
// solo enteros acotados, valores de listas cerradas e identificadores con el formato exacto.
// Texto libre, imposible; parámetros de más, ignorados; un identificador mal formado lleva al
// Resumen (`..`, `/`, `%2F`, espacios, mayúsculas, un UUID con un carácter de más).
import { describe, expect, it } from "vitest";
import {
  escribirEstadoDireccion,
  leerEstadoDireccion,
  type Esquema,
} from "../../../src/components/direccion/estado-direccion";
import {
  FORMATO_DE_IDENTIFICADOR,
  PLANTILLAS,
  construirRuta,
  esIdentificador,
} from "../../../src/components/direccion/rutas";

const UUID = "123e4567-e89b-12d3-a456-426614174000";

const ESQUEMA = {
  pagina: { tipo: "entero", minimo: 1, maximo: 400, porDefecto: 1 },
  orden: { tipo: "lista", valores: ["fecha", "nombre", "estado"], porDefecto: "fecha" },
  periodo: { tipo: "lista", valores: ["7_dias", "30_dias", "90_dias"], porDefecto: "30_dias" },
  cliente: { tipo: "identificador" },
} as const satisfies Esquema;

const leer = (consulta: string) => leerEstadoDireccion(ESQUEMA, consulta);

const VALORES_POR_DEFECTO = {
  pagina: 1,
  orden: "fecha",
  periodo: "30_dias",
  cliente: null,
} as const;

describe("PRUEBA-009 · leer la dirección", () => {
  it("sin parámetros, o con un origen vacío, devuelve los valores por defecto", () => {
    expect(leer("")).toEqual(VALORES_POR_DEFECTO);
    expect(leer("?")).toEqual(VALORES_POR_DEFECTO);
    expect(leerEstadoDireccion(ESQUEMA, new URLSearchParams())).toEqual(VALORES_POR_DEFECTO);
    expect(leerEstadoDireccion(ESQUEMA, {})).toEqual(VALORES_POR_DEFECTO);
  });

  it("admite enteros dentro del rango, listas cerradas e identificadores", () => {
    expect(leer(`?pagina=3&orden=nombre&periodo=7_dias&cliente=${UUID}`)).toEqual({
      pagina: 3,
      orden: "nombre",
      periodo: "7_dias",
      cliente: UUID,
    });
    expect(leer("pagina=400").pagina).toBe(400);
    expect(leer("pagina=1").pagina).toBe(1);
  });

  it("acepta los tres tipos de origen con el mismo resultado", () => {
    const esperado = { ...VALORES_POR_DEFECTO, pagina: 2, orden: "estado" };
    expect(leer("?pagina=2&orden=estado")).toEqual(esperado);
    expect(leerEstadoDireccion(ESQUEMA, new URLSearchParams("pagina=2&orden=estado"))).toEqual(
      esperado,
    );
    expect(leerEstadoDireccion(ESQUEMA, { pagina: "2", orden: "estado" })).toEqual(esperado);
  });

  it("un entero que no encaja vuelve al valor por defecto", () => {
    for (const malo of [
      "0",
      "401",
      "-1",
      "1.5",
      "1e2",
      "03",
      "+3",
      " 3",
      "3 ",
      "0x10",
      "abc",
      "",
      "99999999999999999999",
      "%33",
      "٣",
      "3%0A",
    ]) {
      expect(leerEstadoDireccion(ESQUEMA, { pagina: malo }).pagina, `«${malo}»`).toBe(1);
    }
  });

  it("un valor de lista que no está en la lista vuelve al valor por defecto", () => {
    for (const malo of [
      "FECHA",
      "Fecha",
      "fecha ",
      " fecha",
      "otro",
      "",
      "__proto__",
      "constructor",
      "toString",
      "hasOwnProperty",
      "fecha,nombre",
      "<script>",
    ]) {
      expect(leerEstadoDireccion(ESQUEMA, { orden: malo }).orden, `«${malo}»`).toBe("fecha");
    }
  });

  it("un identificador mal formado se ignora (queda `null`)", () => {
    const malos = [
      "..",
      "../x",
      "../../admin",
      "a/b",
      "%2F",
      "%2e%2e",
      " ",
      UUID.toUpperCase(),
      `${UUID}a`,
      ` ${UUID}`,
      `${UUID} `,
      `${UUID}\n`,
      UUID.slice(1),
      UUID.replaceAll("-", ""),
      `{${UUID}}`,
      "",
      "1",
      "<script>alert(1)</script>",
    ];
    for (const malo of malos) {
      expect(leerEstadoDireccion(ESQUEMA, { cliente: malo }).cliente, `«${malo}»`).toBeNull();
    }
  });

  it("los parámetros que el esquema no declara no se leen ni se conservan", () => {
    const estado = leer(
      `?pagina=2&usuario=${UUID}&cliente_id=${UUID}&q=texto+libre&correo=a%40b.es&orden=nombre`,
    );
    expect(estado).toEqual({ ...VALORES_POR_DEFECTO, pagina: 2, orden: "nombre" });
    expect(Object.keys(estado).sort()).toEqual(["cliente", "orden", "pagina", "periodo"]);
    // Escribir tampoco los conserva.
    expect(escribirEstadoDireccion(ESQUEMA, estado)).toBe("?pagina=2&orden=nombre");
  });

  it("un parámetro repetido es ambiguo: valor por defecto", () => {
    expect(leer("?pagina=2&pagina=3").pagina).toBe(1);
    expect(leer("?orden=nombre&orden=estado").orden).toBe("fecha");
    expect(leerEstadoDireccion(ESQUEMA, { pagina: ["2", "3"] }).pagina).toBe(1);
    expect(leerEstadoDireccion(ESQUEMA, { pagina: ["2"] }).pagina).toBe(2);
    expect(leerEstadoDireccion(ESQUEMA, { pagina: undefined }).pagina).toBe(1);
  });

  it("el fragmento no es un parámetro", () => {
    expect(leer("?pagina=2#pagina=3").pagina).toBe(2);
    expect(leer("#orden=estado").orden).toBe("fecha");
  });

  it("no hay forma de llevar texto libre: un campo de otro tipo no se lee nunca", () => {
    const conTexto = {
      ...ESQUEMA,
      busqueda: { tipo: "texto" },
    } as unknown as Esquema;
    const estado = leerEstadoDireccion(conTexto, "?busqueda=hola+mundo&q=hola");
    expect(estado.busqueda).toBeNull();
    expect(JSON.stringify(estado)).not.toContain("hola");
    expect(escribirEstadoDireccion(conTexto, { busqueda: "hola mundo" })).toBe("");
  });

  it("nombres de campo peligrosos en el esquema se descartan sin tocar el prototipo", () => {
    const peligroso = Object.fromEntries([
      ["__proto__", { tipo: "entero", minimo: 0, maximo: 5, porDefecto: 0 }],
      ["constructor", { tipo: "entero", minimo: 0, maximo: 5, porDefecto: 0 }],
      ["Mayusculas", { tipo: "entero", minimo: 0, maximo: 5, porDefecto: 0 }],
      ["pagina", { tipo: "entero", minimo: 1, maximo: 9, porDefecto: 1 }],
    ]) as unknown as Esquema;
    const estado = leerEstadoDireccion(
      peligroso,
      "?__proto__=3&constructor=2&Mayusculas=1&pagina=4",
    );
    expect(estado).toEqual({ pagina: 4 });
    expect(Object.getPrototypeOf(estado)).toBe(Object.prototype);
    expect(({} as Record<string, unknown>).polluted).toBeUndefined();
    expect(escribirEstadoDireccion(peligroso, { pagina: 4, __proto__: 3 } as never)).toBe(
      "?pagina=4",
    );
  });

  it("una dirección enorme no rompe la lectura", () => {
    const larga = `?pagina=2&${"x=1&".repeat(20000)}orden=nombre`;
    expect(leer(larga)).toEqual({ ...VALORES_POR_DEFECTO, pagina: 2, orden: "nombre" });
  });
});

describe("PRUEBA-009 · escribir la dirección", () => {
  it("omite lo que vale lo mismo que el valor por defecto", () => {
    expect(escribirEstadoDireccion(ESQUEMA, VALORES_POR_DEFECTO)).toBe("");
    expect(escribirEstadoDireccion(ESQUEMA, {})).toBe("");
    expect(escribirEstadoDireccion(ESQUEMA, { pagina: 1, orden: "fecha" })).toBe("");
  });

  it("escribe en el orden del esquema", () => {
    expect(
      escribirEstadoDireccion(ESQUEMA, {
        cliente: UUID,
        orden: "nombre",
        pagina: 2,
        periodo: "90_dias",
      }),
    ).toBe(`?pagina=2&orden=nombre&periodo=90_dias&cliente=${UUID}`);
  });

  it("no escribe un valor que no cumple el esquema", () => {
    expect(
      escribirEstadoDireccion(ESQUEMA, {
        pagina: 0,
        orden: "otro",
        periodo: "__proto__",
        cliente: "../x",
      } as never),
    ).toBe("");
    expect(escribirEstadoDireccion(ESQUEMA, { pagina: 2.5 } as never)).toBe("");
    expect(escribirEstadoDireccion(ESQUEMA, { pagina: "2" } as never)).toBe("");
    expect(escribirEstadoDireccion(ESQUEMA, { pagina: 401 })).toBe("");
    // Un campo que no está en el esquema, tampoco.
    expect(escribirEstadoDireccion(ESQUEMA, { q: "hola", usuario: UUID } as never)).toBe("");
  });

  it("solo escribe caracteres de enteros, listas y UUID", () => {
    const direccion = escribirEstadoDireccion(ESQUEMA, {
      pagina: 12,
      orden: "estado",
      periodo: "7_dias",
      cliente: UUID,
    });
    expect(direccion).toMatch(/^\?[a-z0-9_=&-]+$/);
  });

  it("leer lo escrito devuelve el mismo estado", () => {
    const estado = { pagina: 7, orden: "estado", periodo: "90_dias", cliente: UUID } as const;
    expect(leer(escribirEstadoDireccion(ESQUEMA, estado))).toEqual(estado);
  });
});

describe("PRUEBA-009 · formato de identificador", () => {
  it("es la expresión exacta del diseño", () => {
    expect(FORMATO_DE_IDENTIFICADOR.source).toBe(
      "^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$",
    );
    expect(FORMATO_DE_IDENTIFICADOR.flags).toBe("");
  });

  it("esIdentificador solo admite un UUID en minúsculas de 36 caracteres", () => {
    expect(esIdentificador(UUID)).toBe(true);
    for (const malo of [
      UUID.toUpperCase(),
      `${UUID}0`,
      `0${UUID}`,
      `${UUID}\n`,
      "..",
      "a/b",
      "%2F",
      " ",
      "",
      undefined,
      null,
      5,
      {},
      [UUID],
    ]) {
      expect(esIdentificador(malo)).toBe(false);
    }
  });
});

describe("PRUEBA-009 · rutas", () => {
  it("las plantillas son una lista cerrada", () => {
    expect(Object.keys(PLANTILLAS).sort()).toEqual(
      [
        "admin_ajustes",
        "admin_auditoria",
        "admin_cliente",
        "admin_clientes",
        "admin_orden",
        "admin_ordenes",
        "admin_resumen",
        "panel_actividad",
        "panel_cuenta",
        "panel_resumen",
        "panel_suscripcion",
      ].sort(),
    );
  });

  it("construye las direcciones fijas", () => {
    expect(construirRuta("admin_resumen")).toBe("/admin");
    expect(construirRuta("admin_clientes")).toBe("/admin/clientes");
    expect(construirRuta("admin_ordenes")).toBe("/admin/ordenes");
    expect(construirRuta("admin_auditoria")).toBe("/admin/auditoria");
    expect(construirRuta("admin_ajustes")).toBe("/admin/ajustes");
    expect(construirRuta("panel_resumen")).toBe("/panel");
    expect(construirRuta("panel_actividad")).toBe("/panel/actividad");
    expect(construirRuta("panel_suscripcion")).toBe("/panel/suscripcion");
    expect(construirRuta("panel_cuenta")).toBe("/panel/cuenta");
  });

  it("inserta un identificador solo si cumple el formato exacto", () => {
    expect(construirRuta("admin_cliente", { id: UUID })).toBe(`/admin/clientes/${UUID}`);
    expect(construirRuta("admin_orden", { id: UUID })).toBe(`/admin/ordenes/${UUID}`);
  });

  it("un identificador mal formado lleva al Resumen de su área", () => {
    const malos: unknown[] = [
      "..",
      "../x",
      "../../panel",
      "a/b",
      "%2F",
      "%2f",
      "%2e%2e",
      " ",
      "\t",
      UUID.toUpperCase(),
      `${UUID}a`,
      `${UUID} `,
      `${UUID}\n`,
      `${UUID}/../x`,
      `${UUID}?x=1`,
      `${UUID}#y`,
      "",
      undefined,
      null,
      5,
      {},
    ];
    for (const malo of malos) {
      expect(construirRuta("admin_cliente", { id: malo }), `«${String(malo)}»`).toBe("/admin");
      expect(construirRuta("admin_orden", { id: malo })).toBe("/admin");
    }
    expect(construirRuta("admin_cliente")).toBe("/admin");
    expect(construirRuta("admin_cliente", {})).toBe("/admin");
  });

  it("una plantilla sin identificador no lo añade aunque se le pase", () => {
    expect(construirRuta("admin_clientes", { id: UUID })).toBe("/admin/clientes");
    expect(construirRuta("panel_cuenta", { id: "../x" })).toBe("/panel/cuenta");
  });

  it("una plantilla que no existe no se inventa: raíz", () => {
    for (const nombre of ["", "__proto__", "constructor", "toString", "admin_x", "/admin"]) {
      expect(construirRuta(nombre as never)).toBe("/");
    }
    expect(construirRuta(undefined as never)).toBe("/");
  });

  it("la consulta sale del esquema y del estado, no de una cadena que se pase", () => {
    expect(
      construirRuta("admin_clientes", { esquema: ESQUEMA, estado: { pagina: 2, orden: "nombre" } }),
    ).toBe("/admin/clientes?pagina=2&orden=nombre");
    // Valores por defecto: sin consulta.
    expect(construirRuta("admin_clientes", { esquema: ESQUEMA, estado: { pagina: 1 } })).toBe(
      "/admin/clientes",
    );
    // Una consulta escrita a mano ya no existe como opción: se ignora.
    expect(
      construirRuta("admin_clientes", { consulta: "?busqueda=ana-lopez-garcia" } as never),
    ).toBe("/admin/clientes");
  });

  it("el texto libre no entra en la consulta, ni por un campo que no existe ni por uno de tipo texto", () => {
    const estado = { busqueda: "ana", pagina: 2 } as never;
    expect(construirRuta("panel_actividad", { esquema: ESQUEMA, estado })).toBe(
      "/panel/actividad?pagina=2",
    );
    const conTexto = {
      ...ESQUEMA,
      busqueda: { tipo: "texto" },
    } as never;
    expect(
      construirRuta("panel_actividad", {
        esquema: conTexto,
        estado: { busqueda: "ana-lopez-garcia" } as never,
      }),
    ).toBe("/panel/actividad");
  });

  it("en una plantilla del panel no viaja ningún identificador de cliente (art. 2)", () => {
    for (const plantilla of [
      "panel_resumen",
      "panel_actividad",
      "panel_suscripcion",
      "panel_cuenta",
    ] as const) {
      expect(
        construirRuta(plantilla, { esquema: ESQUEMA, estado: { cliente: UUID } }),
        plantilla,
      ).toBe(PLANTILLAS[plantilla]);
    }
    // En el área de administración sí puede viajar.
    expect(construirRuta("admin_clientes", { esquema: ESQUEMA, estado: { cliente: UUID } })).toBe(
      `/admin/clientes?cliente=${UUID}`,
    );
  });

  it("con un identificador malo la consulta tampoco viaja", () => {
    expect(
      construirRuta("admin_cliente", {
        id: "../x",
        esquema: ESQUEMA,
        estado: { pagina: 2 },
      }),
    ).toBe("/admin");
  });

  it("un esquema o un estado que no son objetos no rompen ni añaden nada", () => {
    for (const rareza of [null, 5, "x", [] as unknown]) {
      expect(
        construirRuta("admin_clientes", { esquema: rareza as never, estado: rareza as never }),
      ).toBe("/admin/clientes");
    }
  });

  it("los valores de lista deben cumplir [a-z0-9_-]+: un esquema con otros no los escribe", () => {
    const esquemaMalo = {
      q: { tipo: "lista", valores: ["ana lopez", "a&b=c", "Ab"], porDefecto: "ana lopez" },
      r: { tipo: "lista", valores: ["ok", "a&b=c"], porDefecto: "ok" },
    } as never;
    expect(escribirEstadoDireccion(esquemaMalo, { q: "a&b=c", r: "a&b=c" } as never)).toBe("");
    expect(leerEstadoDireccion(esquemaMalo, "?r=a%26b%3Dc")).toEqual({
      q: "ana lopez",
      r: "ok",
    });
  });

  it("toda dirección construida es interna, sin esquema, sin `..` y con caracteres seguros", () => {
    const direcciones = [
      ...Object.keys(PLANTILLAS).map((p) => construirRuta(p as never)),
      ...Object.keys(PLANTILLAS).map((p) => construirRuta(p as never, { id: UUID })),
      ...Object.keys(PLANTILLAS).map((p) => construirRuta(p as never, { id: "../../x" })),
    ];
    for (const d of direcciones) {
      expect(d).toMatch(/^\/(admin|panel)?(\/[a-z]+)*(\/[0-9a-f-]{36})?$/);
      expect(d).not.toContain("..");
      expect(d).not.toContain("//");
    }
  });
});
