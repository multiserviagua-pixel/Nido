// T-010 (g) · `Tabla`, `Paginacion` y `RegionDesplazable` pintadas en el servidor de pruebas
// (diseño 020, fila `Tabla`; REQ-013, REQ-045, REQ-056, REQ-066, REQ-067, REQ-071, REQ-075;
// CA-010, CA-051). El comportamiento en navegador (teclado, foco, anchos, axe) está en
// `tabla.spec.ts`. Aquí: estructura, nombres, `aria-sort`, texto hostil, una sola página en el
// documento y los avisos de cambio.
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Paginacion } from "../../../src/components/tabla/Paginacion";
import { RegionDesplazable } from "../../../src/components/tabla/RegionDesplazable";
import { Tabla } from "../../../src/components/tabla/Tabla";
import {
  calcularPaginacion,
  cambioDeOrden,
  cambioDePagina,
  columnasValidas,
  type ColumnaDeTabla,
} from "../../../src/components/tabla/logica";

const COLUMNAS: readonly ColumnaDeTabla[] = [
  { clave: "nombre", etiqueta: "Cliente", ordenable: true },
  { clave: "correos", etiqueta: "Correos", tipo: "numero", ordenable: true },
  { clave: "estado", etiqueta: "Estado", tipo: "estado", ambito: "agente" },
];
const fila = (i: number): Record<string, unknown> => ({
  nombre: `Cliente ${i}`,
  correos: i * 1000,
  estado: "activo",
});
const filas = (n: number): Record<string, unknown>[] =>
  Array.from({ length: n }, (_, i) => fila(i + 1));
const sinAviso = (): void => undefined;

const pintar = (propiedades: Partial<Parameters<typeof Tabla>[0]> = {}): string =>
  renderToStaticMarkup(
    <Tabla
      titulo="Clientes"
      columnas={COLUMNAS}
      filas={filas(25)}
      total={1234}
      pagina={2}
      orden={null}
      alCambiar={sinAviso}
      {...propiedades}
    />,
  );
const cuenta = (html: string, patron: RegExp): number => (html.match(patron) ?? []).length;

describe("RegionDesplazable · región con nombre y foco (REQ-045)", () => {
  const html = renderToStaticMarkup(
    <RegionDesplazable nombre={"Cli\u202Eentes"}>
      <p>dentro</p>
    </RegionDesplazable>,
  );
  it("es una región con nombre limpio, enfocable y con desplazamiento horizontal propio", () => {
    expect(html).toContain('role="region"');
    expect(html).toContain('aria-label="Clientes"');
    expect(html).toContain('tabindex="0"');
    expect(html).toMatch(/class="[^"]*overflow-x-auto/);
    expect(html).toContain("<p>dentro</p>");
  });
  it("sin trampas: ningún manejador de teclado, ningún tabindex positivo, ningún style", () => {
    expect(html).not.toMatch(/onkey|tabindex="[1-9]|style=/i);
  });
  it("sin nombre válido, nombre de reserva (no queda una región sin nombre)", () => {
    const h = renderToStaticMarkup(<RegionDesplazable nombre={"\u200B"}>x</RegionDesplazable>);
    expect(h).toContain('aria-label="Tabla de datos"');
  });
});

describe("Paginacion · posición, página actual y límites (REQ-013, REQ-066, REQ-067)", () => {
  const p = (total: number, pagina: number, extra: Record<string, unknown> = {}): string =>
    renderToStaticMarkup(
      <Paginacion total={total} pagina={pagina} alCambiarPagina={sinAviso} {...extra} />,
    );

  it("«Del 26 al 50 de 1.234», en una navegación con nombre", () => {
    const html = p(1234, 2);
    expect(html).toContain("Del 26 al 50 de 1.234");
    expect(html).toContain("<nav");
    expect(html).toContain('aria-label="Paginación"');
  });

  it("la página actual lleva aria-current y solo ella; las demás, su nombre «Página N»", () => {
    const html = p(1234, 2);
    expect(cuenta(html, /aria-current="page"/g)).toBe(1);
    expect(html).toMatch(/aria-current="page"[^>]*>2</);
    expect(html).toContain('aria-label="Página 3"');
    expect(html).toContain('aria-label="Página 50"');
  });

  it("en la primera, «Anterior» está desactivado sin perder el foco (aria-disabled, no disabled)", () => {
    const html = p(1234, 1);
    expect(html).toMatch(/<button[^>]*aria-disabled="true"[^>]*>(?:(?!<\/button>).)*Anterior/);
    expect(html).not.toMatch(/\sdisabled(=|>|\s)/);
    expect(html).not.toMatch(/<button[^>]*aria-disabled="true"[^>]*>(?:(?!<\/button>).)*Siguiente/);
  });

  it("en la última, «Siguiente» está desactivado", () => {
    expect(p(1234, 50)).toMatch(
      /<button[^>]*aria-disabled="true"[^>]*>(?:(?!<\/button>).)*Siguiente/,
    );
  });

  it("una sola página: posición sin botones de paginación", () => {
    const html = p(8, 1);
    expect(html).toContain("Del 1 al 8 de 8");
    expect(html).not.toContain("<button");
  });

  it("0 filas: nada (ni «Del 0 al 0» ni botones)", () => {
    expect(p(0, 1)).toBe("");
    expect(p(Number.NaN, 1)).toBe("");
  });

  it("una página fuera de rango se corrige: 9999 pinta la última, NaN la primera", () => {
    expect(p(1234, 9999)).toContain("Del 1.226 al 1.234 de 1.234");
    expect(p(1234, Number.NaN)).toContain("Del 1 al 25 de 1.234");
  });

  it("10.000 filas: 400 páginas, con números de página acotados, no 400 botones", () => {
    const html = p(10000, 200);
    expect(html).toContain("Del 4.976 al 5.000 de 10.000");
    expect(cuenta(html, /<button/g)).toBeLessThanOrEqual(9);
    expect(html).toContain('aria-label="Página 400"');
  });

  it("el nombre de la navegación lleva el título, limpio de invisibles y dirección", () => {
    const html = p(100, 1, { etiqueta: "Clien\u202Etes\u200B" });
    expect(html).toContain('aria-label="Paginación de Clientes"');
  });

  it("los botones son botones, no enlaces (no hay dirección que llevar)", () => {
    expect(p(1234, 2)).not.toContain("<a ");
    expect(p(1234, 2)).toContain('type="button"');
  });
});

describe("Tabla · estructura nativa, orden y nombre (REQ-013)", () => {
  it("una table nativa con caption, encabezados de columna y la primera columna como encabezado de fila", () => {
    const html = pintar();
    expect(html).toContain("<table");
    expect(html).toMatch(/<caption[^>]*>(?:(?!<\/caption>).)*Clientes/);
    expect(cuenta(html, /<th scope="col"/g)).toBe(3);
    expect(cuenta(html, /<th scope="row"/g)).toBe(25);
    expect(html).not.toContain('role="grid"');
  });

  it("solo las columnas ordenables llevan botón en la cabecera", () => {
    const html = pintar();
    const cabecera = /<thead>(.*)<\/thead>/s.exec(html)![1]!;
    expect(cuenta(cabecera, /<button/g)).toBe(2);
    expect(cabecera).toMatch(
      /<th scope="col"[^>]*>Estado<\/th>|<th scope="col"[^>]*>(?:(?!<button).)*Estado/,
    );
  });

  it("sin orden, ningún aria-sort; con orden, solo la columna ordenada, en su sentido", () => {
    expect(pintar()).not.toContain("aria-sort");
    const asc = pintar({ orden: { columna: "correos", sentido: "ascendente" } });
    expect(cuenta(asc, /aria-sort/g)).toBe(1);
    expect(asc).toMatch(/<th scope="col" aria-sort="ascending"[^>]*>(?:(?!<\/th>).)*Correos/);
    const desc = pintar({ orden: { columna: "nombre", sentido: "descendente" } });
    expect(desc).toMatch(/aria-sort="descending"[^>]*>(?:(?!<\/th>).)*Cliente/);
  });

  it("un orden de una columna que no es ordenable, o desconocida, se ignora", () => {
    for (const orden of [
      { columna: "estado", sentido: "ascendente" },
      { columna: "no_existe", sentido: "ascendente" },
      { columna: "nombre", sentido: "arriba" },
      "nombre",
    ]) {
      expect(pintar({ orden: orden as never })).not.toContain("aria-sort");
    }
  });

  it("el botón de columna es un botón con el nombre de la columna e icono decorativo", () => {
    const html = pintar();
    expect(html).toMatch(
      /<button[^>]*type="button"[^>]*>(?:(?!<\/button>).)*Cliente(?:(?!<\/button>).)*<svg[^>]*aria-hidden="true"/,
    );
  });

  it("la tabla va dentro de una región desplazable con nombre y la paginación fuera de ella", () => {
    const html = pintar();
    expect(html).toMatch(/role="region"[^>]*aria-label="Clientes, se puede desplazar"/);
    expect(html.indexOf("</table>")).toBeLessThan(html.indexOf("<nav"));
    expect(html.indexOf('role="region"')).toBeLessThan(html.indexOf("<table"));
  });

  it("incluye la posición con miles", () => {
    expect(pintar()).toContain("Del 26 al 50 de 1.234");
  });

  it("los números van con miles y alineados como cifras", () => {
    const html = pintar();
    expect(html).toContain("1.000");
    expect(html).toContain("data-cifra");
  });

  it("sin truncados: ninguna clase de recorte ni de elipsis, ni style en línea", () => {
    const html = pintar({
      filas: [{ nombre: "x".repeat(120), correos: 1, estado: "activo" }],
      total: 1,
      pagina: 1,
    });
    expect(html).not.toMatch(/truncate|text-ellipsis|line-clamp|overflow-hidden|style=/);
    expect(html).toContain("x".repeat(120));
  });
});

describe("Tabla · nunca más de una página en el documento (REQ-067)", () => {
  it("con 10.000 filas recibidas, pinta 25", () => {
    const html = pintar({ filas: filas(10000), total: 10000, pagina: 1 });
    expect(cuenta(html, /<tr/g)).toBe(26); // cabecera + 25
    expect(html).toContain("Del 1 al 25 de 10.000");
  });

  it("con un tamaño de página menor, pinta ese tamaño", () => {
    const html = pintar({ filas: filas(100), tamano: 10, total: 100, pagina: 1 });
    expect(cuenta(html, /<tr/g)).toBe(11);
  });

  it("la posición sale de las filas pintadas: la última página de 9 filas", () => {
    const html = pintar({ filas: filas(9), total: 1234, pagina: 50 });
    expect(html).toContain("Del 1.226 al 1.234 de 1.234");
  });
});

describe("Tabla · sin filas, estado vacío (REQ-066)", () => {
  it.each([
    ["0 filas y total 0", { filas: [], total: 0 }],
    ["filas recibidas pero total 0", { filas: filas(3), total: 0 }],
    ["total inválido", { filas: filas(3), total: Number.NaN }],
    ["total negativo", { filas: filas(3), total: -5 }],
    ["total sin filas", { filas: [], total: 100 }],
    ["filas que no son una lista", { filas: "no" as never, total: 100 }],
  ])("%s: el estado vacío, no una tabla vacía ni «Del 0 al 0»", (_nombre, propiedades) => {
    const html = pintar({ pagina: 1, ...propiedades });
    expect(html).not.toContain("<table");
    expect(html).not.toContain("<nav");
    expect(html).not.toMatch(/Del 0/);
    expect(html).toContain("No hay filas que mostrar");
    expect(html).toContain("Cuando haya datos, aparecerán aquí.");
  });

  it("sin columnas válidas también cierra en vacío", () => {
    const html = pintar({ columnas: [{ clave: "MAL", etiqueta: "x" }] });
    expect(html).not.toContain("<table");
    expect(html).toContain("No hay filas que mostrar");
  });
});

describe("Tabla · todo dato pasa por el lector (art. 1 y 7; REQ-056, REQ-071, REQ-075)", () => {
  const HOSTIL = [
    "<script>alert(1)</script>",
    '"><img src=x onerror=alert(1)>',
    "javascript:alert(1)",
    "[enlace](https://malo.example)",
    "a\u202Eb\u200B\u2066c\u2069",
    "\u0000\u0007x",
    "{{constructor}} ${process.env.X}",
  ];

  it("el texto hostil se pinta como texto: escapado, sin elementos ni enlaces nuevos", () => {
    const html = pintar({
      filas: HOSTIL.map((nombre) => ({ nombre, correos: 1, estado: "activo" })),
      total: HOSTIL.length,
      pagina: 1,
    });
    expect(html).not.toContain("<script");
    expect(html).not.toContain("<img");
    expect(html).not.toContain("<a ");
    expect(html).toContain("&lt;script&gt;alert(1)&lt;/script&gt;");
    expect(html).not.toMatch(/[\u202A-\u202E\u2066-\u2069\u200B\u0000\u0007]/);
    expect(html).toContain("javascript:alert(1)");
    expect(html).toContain("ab");
  });

  it("cada texto de dato va en un nodo bdi", () => {
    const html = pintar({
      filas: [{ nombre: "Ana", correos: 1, estado: "activo" }],
      total: 1,
      pagina: 1,
    });
    expect(html).toContain("<bdi>Ana</bdi>");
  });

  it("encabezado hostil: limpio y sin elementos", () => {
    const html = pintar({
      columnas: [
        { clave: "nombre", etiqueta: "<b>Clie\u202Ente</b>", ordenable: true },
        { clave: "correos", etiqueta: "Correos", tipo: "numero" },
      ],
      titulo: "<i>Título\u200B</i>",
    });
    expect(html).not.toContain("<b>");
    expect(html).not.toContain("<i>");
    expect(html).toContain("&lt;b&gt;Cliente&lt;/b&gt;");
    expect(html).toContain("&lt;i&gt;Título&lt;/i&gt;");
  });

  it("un título vacío o invisible tiene uno de reserva", () => {
    expect(pintar({ titulo: "\u200B" })).toMatch(
      /<caption[^>]*>(?:(?!<\/caption>).)*Tabla de datos/,
    );
    expect(pintar({ titulo: 5 as never })).toContain("Tabla de datos");
  });

  it("campos de más en las filas no se pintan, ni el identificador ni el resto", () => {
    const html = pintar({
      filas: [
        {
          nombre: "Ana",
          correos: 2,
          estado: "activo",
          id: "TESTIGO-ID",
          cliente_id: "TESTIGO-CLIENTE",
          campo_de_mas: "TESTIGO-CAMPO-DE-MAS",
          __proto__: { nombre: "TESTIGO-PROTO" },
        },
      ],
      total: 1,
      pagina: 1,
    });
    expect(html).not.toContain("TESTIGO");
  });

  it("una propiedad heredada no se lee como dato: constructor y toString no son celdas", () => {
    const html = pintar({
      columnas: [{ clave: "nombre", etiqueta: "N" }],
      filas: [Object.create({ nombre: "TESTIGO-HEREDADO" }) as Record<string, unknown>],
      total: 1,
      pagina: 1,
    });
    expect(html).not.toContain("TESTIGO-HEREDADO");
    expect(html).toContain("Sin datos");
  });

  it("valores imposibles en las celdas dan «Sin datos», nunca cero ni el valor recibido", () => {
    const html = pintar({
      filas: [
        { nombre: null, correos: Number.NaN, estado: "activo" },
        { nombre: 42, correos: "12", estado: "activo" },
        { nombre: {}, correos: -4, estado: "activo" },
        { nombre: [], correos: 1e30, estado: "activo" },
      ],
      total: 4,
      pagina: 1,
    });
    expect(cuenta(html, /Sin datos/g)).toBe(8);
    expect(html).not.toMatch(/>0</);
  });

  it("un estado fuera del catálogo es «Estado desconocido» y no se pinta el valor recibido", () => {
    const html = pintar({
      filas: [{ nombre: "Ana", correos: 1, estado: "TESTIGO-ESTADO" }],
      total: 1,
      pagina: 1,
    });
    expect(html).toContain("Estado desconocido");
    expect(html).not.toContain("TESTIGO-ESTADO");
  });

  it("un estado del catálogo lleva palabra, icono y tono", () => {
    const html = pintar({
      filas: [{ nombre: "Ana", correos: 1, estado: "en_pausa" }],
      total: 1,
      pagina: 1,
    });
    expect(html).toContain("En pausa");
    expect(html).toContain('data-estado="agente.en_pausa"');
  });
});

describe("avisos de cambio (la tabla es controlada)", () => {
  const columnas = columnasValidas(COLUMNAS);
  it("pulsar una columna ordenable avisa del orden nuevo y vuelve a la página 1", () => {
    expect(cambioDeOrden(columnas, null, "nombre")).toEqual({
      pagina: 1,
      orden: { columna: "nombre", sentido: "ascendente" },
    });
    expect(cambioDeOrden(columnas, { columna: "nombre", sentido: "ascendente" }, "nombre")).toEqual(
      {
        pagina: 1,
        orden: { columna: "nombre", sentido: "descendente" },
      },
    );
  });
  it("una columna que no es ordenable, o que no existe, no avisa de nada", () => {
    for (const clave of ["estado", "no_existe", "constructor", "__proto__"]) {
      expect(cambioDeOrden(columnas, null, clave)).toBeNull();
    }
  });
  it("cambiar de página avisa con la página y conserva el orden; fuera de rango o la misma, nada", () => {
    const orden = { columna: "correos", sentido: "descendente" } as const;
    const p = calcularPaginacion(1234, 2);
    expect(cambioDePagina(p, 3, orden)).toEqual({ pagina: 3, orden });
    for (const destino of [2, 0, -1, 51, 1.5, Number.NaN, "3", null, Number.POSITIVE_INFINITY]) {
      expect(cambioDePagina(p, destino, orden)).toBeNull();
    }
    expect(cambioDePagina(calcularPaginacion(0, 1), 1, null)).toBeNull();
  });
});
