// T-111 (a) (001): `npm run operar` (REQ-017; C-3). PRUEBA-020 (parte: sin eco ni guardado de la credencial;
// otro entorno, rechazo ANTES de pedirla) y PRUEBA-019 (parte: ni la credencial ni la dirección salen por
// la salida). Sin red: la función de red es un doble. Valores compuestos en ejecución (art. 4).
import { spawnSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { describe, expect, it, vi } from "vitest";

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const SCRIPT = join(RAIZ, "scripts", "conector", "operar.mjs");

interface Modulo {
  ejecutarOperar(o: {
    argv: string[];
    git: (a: string[]) => string;
    lector: { pedir: (etiqueta: string, o?: { oculto?: boolean }) => Promise<string> };
    fetch: typeof fetch;
    salida: (t: string) => void;
    errores: (t: string) => void;
    entorno?: Record<string, string | undefined>;
    salidaEsTerminal?: boolean;
  }): Promise<number>;
}
const cargar = async () => (await import(/* @vite-ignore */ pathToFileURL(SCRIPT).href)) as Modulo;

const ORIGEN = "https://pre-nido-" + randomBytes(4).toString("hex") + ".ejemplo.invalid";
const credencial = () => "hia_op_" + randomBytes(32).toString("base64url");
const CANARIO = "TEXTO-CANARIO-" + randomBytes(6).toString("hex");

const gitLimpio = (a: string[]): string => (a[0] === "rev-parse" ? "main\n" : "");

interface EntradaPrueba {
  entradas: string[];
  git: (a: string[]) => string;
  respuesta: () => Response | Promise<Response>;
  /** Emisor que declara el servidor en sus metadatos (por defecto, el origen al que se llama). */
  emisor: (origen: string) => string;
  confirmacion: string;
  entorno: Record<string, string | undefined>;
  salidaEsTerminal: boolean;
}
interface Montaje {
  pedidos: { etiqueta: string; oculto: boolean }[];
  salidas: string[];
  llamadas: { url: string; init: RequestInit }[];
  /** Peticiones de identificación del servidor (sin credencial). */
  descubrimientos: { url: string; init: RequestInit }[];
  todo: () => string;
  correr: (argv: string[], opciones?: Partial<EntradaPrueba>) => Promise<number>;
}

async function montar(): Promise<Montaje> {
  const { ejecutarOperar } = await cargar();
  const pedidos: Montaje["pedidos"] = [];
  const salidas: string[] = [];
  const llamadas: Montaje["llamadas"] = [];
  const descubrimientos: Montaje["descubrimientos"] = [];
  return {
    pedidos,
    salidas,
    llamadas,
    descubrimientos,
    todo: () => salidas.join("\n"),
    correr: (argv, o = {}) => {
      const entradas = [...(o.entradas ?? [ORIGEN, credencial()])];
      return ejecutarOperar({
        argv,
        entorno: o.entorno ?? {},
        salidaEsTerminal: o.salidaEsTerminal ?? true,
        git: o.git ?? gitLimpio,
        lector: {
          pedir: async (etiqueta, op) => {
            pedidos.push({ etiqueta, oculto: op?.oculto !== false });
            if (/escribe SI/.test(etiqueta)) return o.confirmacion ?? "SI";
            const siguiente = entradas.shift();
            if (siguiente === undefined) throw new Error("sin_entrada");
            return siguiente;
          },
        },
        fetch: (async (url: string, init: RequestInit) => {
          if (url.endsWith("/.well-known/oauth-authorization-server")) {
            descubrimientos.push({ url, init });
            const origen = url.replace("/.well-known/oauth-authorization-server", "");
            return new Response(JSON.stringify({ issuer: (o.emisor ?? ((x) => x))(origen) }), {
              status: 200,
            });
          }
          llamadas.push({ url, init });
          return o.respuesta
            ? o.respuesta()
            : new Response(JSON.stringify({ operacion: "resumen", resultado: "resumen" }), {
                status: 200,
              });
        }) as unknown as typeof fetch,
        salida: (t) => salidas.push(t),
        errores: (t) => salidas.push(t),
      });
    },
  };
}

describe("PRUEBA-020 (parte): solo preproduccion, y se rechaza antes de pedir la credencial", () => {
  it.each(["produccion", "desarrollo", "Preproduccion", "preproduccion ", "", "otro", "pre"])(
    "entorno %j: rechazo sin pedir nada, sin red y sin mirar git",
    async (entorno) => {
      const m = await montar();
      const git = vi.fn(gitLimpio);
      const codigo = await m.correr([entorno, "resumen"], { git });
      expect(codigo).not.toBe(0);
      expect(m.pedidos).toHaveLength(0);
      expect(m.llamadas).toHaveLength(0);
      expect(git).not.toHaveBeenCalled();
    },
  );

  it("sin argumentos: uso, sin pedir nada", async () => {
    const m = await montar();
    expect(await m.correr([])).not.toBe(0);
    expect(m.pedidos).toHaveLength(0);
  });

  it("el rechazo no repite lo que se escribió como entorno", async () => {
    const m = await montar();
    await m.correr([CANARIO, "resumen"]);
    expect(m.todo()).not.toContain(CANARIO);
  });

  it("clon sucio o rama distinta de main: rechazo antes de pedir nada", async () => {
    for (const git of [
      (a: string[]) => (a[0] === "rev-parse" ? "tarea/T-111\n" : ""),
      (a: string[]) => (a[0] === "rev-parse" ? "main\n" : " M src/x.ts\n"),
      () => {
        throw new Error("git no disponible");
      },
    ]) {
      const m = await montar();
      expect(await m.correr(["preproduccion", "resumen"], { git })).not.toBe(0);
      expect(m.pedidos).toHaveLength(0);
      expect(m.llamadas).toHaveLength(0);
    }
  });

  it.each([
    [["preproduccion", "borrar_todo"]],
    [["preproduccion", "generar_codigo"]],
    [["preproduccion", "generar_codigo", "C"]],
    [["preproduccion", "generar_codigo", "A", "B"]],
    [["preproduccion", "crear_orden", "A", "borrar"]],
    [["preproduccion", "revocar_conexion", "no-es-un-uuid"]],
    [["preproduccion", "exportar_sucesos", "2026-02-30"]],
    [["preproduccion", "resumen", "A"]],
    [["preproduccion", "__proto__"]],
  ])("operación o argumentos no válidos %j: rechazo antes de pedir la credencial", async (argv) => {
    const m = await montar();
    expect(await m.correr(argv)).not.toBe(0);
    expect(m.pedidos).toHaveLength(0);
    expect(m.llamadas).toHaveLength(0);
  });

  // El control del secreto corre ANTES de validar la operación: aunque la validación también rechazaría el
  // valor, el mensaje es el propio del secreto y no se repite el argumento (si se quita el control, falla).
  it("un argumento con forma de secreto se rechaza con el aviso del secreto y sin repetirlo", async () => {
    const m = await montar();
    const secreto = credencial();
    expect(await m.correr(["preproduccion", "generar_codigo", secreto])).not.toBe(0);
    expect(m.pedidos).toHaveLength(0);
    expect(m.todo()).toMatch(/forma de secreto/);
    expect(m.todo()).not.toContain(secreto);
  });
});

describe("la entrada tiene que ser una terminal (en mintty de Git Bash Node no la ve: la credencial se mostraría)", () => {
  it("un lector que no es terminal: rechazo con texto fijo, sin pedir nada ni enviar", async () => {
    const { ejecutarOperar } = await cargar();
    const pedido = vi.fn(async () => "x");
    const salidas: string[] = [];
    const llamadas: unknown[] = [];
    const codigo = await ejecutarOperar({
      argv: ["preproduccion", "resumen"],
      git: gitLimpio,
      lector: { pedir: pedido, esTerminal: false } as unknown as Parameters<
        typeof ejecutarOperar
      >[0]["lector"],
      fetch: (async (...a: unknown[]) => {
        llamadas.push(a);
        return new Response("{}");
      }) as unknown as typeof fetch,
      salida: (t) => salidas.push(t),
      errores: (t) => salidas.push(t),
    });
    expect(codigo).not.toBe(0);
    expect(pedido).not.toHaveBeenCalled();
    expect(llamadas).toHaveLength(0);
    expect(salidas.join("\n")).toMatch(/PowerShell|Windows Terminal/);
  });

  it("crearLector con una entrada que no es terminal y exigirTerminal: no lee nada y lanza", async () => {
    const { EventEmitter } = await import("node:events");
    const entrada = Object.assign(new EventEmitter(), { isTTY: false });
    const { crearLector } = (await import(
      /* @vite-ignore */ pathToFileURL(join(RAIZ, "scripts", "conector", "entrada.mjs")).href
    )) as {
      crearLector: (o: unknown) => {
        esTerminal: boolean;
        pedir: (e: string) => Promise<string>;
      };
    };
    const lector = crearLector({ entrada, aviso: { write: () => true }, exigirTerminal: true });
    expect(lector.esTerminal).toBe(false);
    await expect(lector.pedir("Credencial")).rejects.toThrow();
    expect(entrada.listenerCount("data")).toBe(0);
  });
});

describe("PRUEBA-020 (parte): la credencial no se muestra ni se guarda", () => {
  it("dirección y credencial se piden sin eco, en ese orden, y la petición lleva la credencial solo en la cabecera", async () => {
    const m = await montar();
    const c = credencial();
    expect(await m.correr(["preproduccion", "resumen"], { entradas: [ORIGEN, c] })).toBe(0);
    expect(m.pedidos).toHaveLength(3);
    expect(m.pedidos.slice(0, 2).every((p) => p.oculto)).toBe(true);
    // La confirmación del destino se teclea a la vista (es la terminal, no la salida).
    expect(m.pedidos[2]!.oculto).toBe(false);
    expect(m.pedidos[2]!.etiqueta).toMatch(/escribe SI/);
    expect(m.descubrimientos).toHaveLength(1);
    expect(new Headers(m.descubrimientos[0]!.init.headers).get("authorization")).toBeNull();
    expect(m.llamadas).toHaveLength(1);
    const { url, init } = m.llamadas[0]!;
    expect(url).toBe(`${ORIGEN}/api/operacion`);
    expect(init.method).toBe("POST");
    expect(init.redirect).toBe("error");
    expect(new Headers(init.headers).get("authorization")).toBe(`Bearer ${c}`);
    expect(String(init.body)).not.toContain(c);
    expect(JSON.parse(String(init.body))).toEqual({ operacion: "resumen", argumentos: {} });
    expect(m.todo()).not.toContain(c);
    expect(m.todo()).not.toContain(new URL(ORIGEN).host);
  });

  it("argumentos exactos de cada operación", async () => {
    const casos: [string[], unknown][] = [
      [["generar_codigo", "A"], { tipo: "A" }],
      [["suspender_licencia", "B"], { tipo: "B" }],
      [["reactivar_licencia", "A"], { tipo: "A" }],
      [["crear_orden", "A", "pausar"], { tipo: "A", orden: "pausar" }],
      [
        ["revocar_conexion", "0b8f2c9e-1a2b-4c3d-8e4f-0123456789ab"],
        { conexion: "0b8f2c9e-1a2b-4c3d-8e4f-0123456789ab" },
      ],
      [["exportar_sucesos", "2026-11-21"], { dia: "2026-11-21" }],
      [["listar_conexiones"], {}],
    ];
    for (const [resto, argumentos] of casos) {
      const m = await montar();
      expect(await m.correr(["preproduccion", ...resto])).toBe(0);
      expect(JSON.parse(String(m.llamadas[0]!.init.body))).toEqual({
        operacion: resto[0],
        argumentos,
      });
    }
  });

  it("credencial mal formada: no se envía nada y no se repite", async () => {
    const m = await montar();
    const mala = "hia_op_" + CANARIO;
    expect(await m.correr(["preproduccion", "resumen"], { entradas: [ORIGEN, mala] })).not.toBe(0);
    expect(m.llamadas).toHaveLength(0);
    expect(m.todo()).not.toContain(CANARIO);
  });

  it.each([
    "http://pre.ejemplo.invalid",
    "https://pre.ejemplo.invalid/ruta",
    "https://u:p@x.test",
    "",
  ])("dirección no válida %j: no se pide la credencial ni se envía nada", async (direccion) => {
    const m = await montar();
    expect(
      await m.correr(["preproduccion", "resumen"], { entradas: [direccion, credencial()] }),
    ).not.toBe(0);
    expect(m.pedidos).toHaveLength(1);
    expect(m.llamadas).toHaveLength(0);
  });

  it("un fallo de red no deja la dirección ni la credencial en la salida", async () => {
    const { ejecutarOperar } = await cargar();
    const c = credencial();
    const salidas: string[] = [];
    const entradas = [ORIGEN, c];
    const codigo = await ejecutarOperar({
      argv: ["preproduccion", "resumen"],
      git: gitLimpio,
      lector: { pedir: async (e: string) => (/escribe SI/.test(e) ? "SI" : entradas.shift()!) },
      fetch: (async (url: string) => {
        if (url.endsWith("/.well-known/oauth-authorization-server")) {
          return new Response(JSON.stringify({ issuer: ORIGEN }), { status: 200 });
        }
        throw new TypeError(`fallo de ${ORIGEN} con Bearer ${c}`, { cause: new Error(ORIGEN) });
      }) as unknown as typeof fetch,
      salida: (t) => salidas.push(t),
      errores: (t) => salidas.push(t),
    });
    expect(codigo).not.toBe(0);
    const todo = salidas.join("\n");
    expect(todo).not.toContain(c);
    expect(todo).not.toContain(new URL(ORIGEN).host);
  });

  it("no escribe en disco, no usa variables de entorno y no ejecuta nada salvo git", () => {
    const fuente = readFileSync(SCRIPT, "utf8");
    expect(fuente).not.toMatch(/writeFile|appendFile|createWriteStream|writeSync|openSync/);
    expect(fuente).not.toMatch(/process\.env/);
    expect(fuente).not.toMatch(/(?<![.\w])exec(Sync)?\(|\bspawn(Sync)?\(|child_process\.exec\b/);
  });
});

describe("respuestas: estado fijo, sin eco de lo que devuelva el servidor", () => {
  it.each([
    [401, { error: "credencial_no_valida" }],
    [429, { resultado: "origen_bloqueado" }],
    [409, { resultado: "cerrada" }],
    [400, { error: "operacion_no_valida" }],
    [404, null],
    [503, { error: CANARIO }],
    [500, { error: "x".repeat(300) }],
  ])("HTTP %i: falla con un texto fijo", async (estado, cuerpo) => {
    const m = await montar();
    const codigo = await m.correr(["preproduccion", "resumen"], {
      respuesta: () =>
        new Response(cuerpo === null ? null : JSON.stringify(cuerpo), { status: estado }),
    });
    expect(codigo).not.toBe(0);
    expect(m.todo()).not.toContain(CANARIO);
    expect(m.todo()).not.toContain("x".repeat(300));
    expect(m.todo()).toContain(String(estado));
  });

  it("una respuesta 200 que no es JSON no es éxito", async () => {
    const m = await montar();
    expect(
      await m.correr(["preproduccion", "resumen"], {
        respuesta: () => new Response("<html>", { status: 200 }),
      }),
    ).not.toBe(0);
  });

  it("generar_codigo muestra el código una vez, en la salida de la persona", async () => {
    const m = await montar();
    const codigo = ["7QXM", "4TRD", "9KPA"].join("-");
    expect(
      await m.correr(["preproduccion", "generar_codigo", "A"], {
        respuesta: () =>
          new Response(
            JSON.stringify({ operacion: "generar_codigo", resultado: "generado", codigo }),
            { status: 200 },
          ),
      }),
    ).toBe(0);
    expect(m.todo().split(codigo)).toHaveLength(2);
    expect(m.todo()).toContain("generado");
  });

  it("generar_codigo con un código de forma no válida (dato ajeno): no se imprime", async () => {
    const m = await montar();
    const raro = "https://" + CANARIO + ".invalid/x";
    expect(
      await m.correr(["preproduccion", "generar_codigo", "A"], {
        respuesta: () =>
          new Response(
            JSON.stringify({ operacion: "generar_codigo", resultado: "generado", codigo: raro }),
            { status: 200 },
          ),
      }),
    ).not.toBe(0);
    expect(m.todo()).not.toContain(CANARIO);
  });

  it("si el servidor devolviera la credencial, no se imprime", async () => {
    const m = await montar();
    const c = credencial();
    const codigo = await m.correr(["preproduccion", "resumen"], {
      entradas: [ORIGEN, c],
      respuesta: () =>
        new Response(JSON.stringify({ resultado: "resumen", eco: c }), { status: 200 }),
    });
    expect(codigo).not.toBe(0);
    expect(m.todo()).not.toContain(c);
  });
});

describe("cerrar_prueba es terminal: pide confirmación escrita", () => {
  it("sin escribir CERRAR no se envía", async () => {
    const m = await montar();
    expect(
      await m.correr(["preproduccion", "cerrar_prueba"], {
        entradas: [ORIGEN, credencial(), "no"],
      }),
    ).not.toBe(0);
    expect(m.llamadas).toHaveLength(0);
  });

  it("escribiéndola, se envía", async () => {
    const m = await montar();
    expect(
      await m.correr(["preproduccion", "cerrar_prueba"], {
        entradas: [ORIGEN, credencial(), "CERRAR"],
        respuesta: () =>
          new Response(
            JSON.stringify({ operacion: "cerrar_prueba", resultado: "prueba_cerrada" }),
            { status: 200 },
          ),
      }),
    ).toBe(0);
    expect(m.llamadas).toHaveLength(1);
  });
});

describe("dictamen del auditor (T-111): el secreto no va a un host mal tecleado", () => {
  const DOMINIO_OTRO = "https://pre-nido.otro-dominio.com";

  it("MAYOR-1: si el emisor de los metadatos no es el origen tecleado, no sale ninguna petición con la credencial", async () => {
    const m = await montar();
    const c = credencial();
    const codigo = await m.correr(["preproduccion", "resumen"], {
      entradas: [DOMINIO_OTRO, c],
      emisor: () => "https://pre-nido.ejemplo.invalid",
    });
    expect(codigo).not.toBe(0);
    expect(m.descubrimientos).toHaveLength(1);
    expect(m.llamadas).toHaveLength(0);
    const todas = [...m.descubrimientos, ...m.llamadas];
    for (const { init } of todas) expect(new Headers(init.headers).get("authorization")).toBeNull();
    expect(JSON.stringify(todas.map((t) => String(t.init.body ?? "")))).not.toContain(c);
    expect(m.todo()).not.toContain("otro-dominio");
    expect(m.todo()).not.toContain(c);
  });

  it("MAYOR-1: el descubrimiento no sigue redirecciones y lleva plazo", async () => {
    const m = await montar();
    await m.correr(["preproduccion", "resumen"]);
    expect(m.descubrimientos[0]!.init.redirect).toBe("error");
    expect(m.descubrimientos[0]!.init.signal).toBeDefined();
  });

  it.each(["", "no", "NO", "s", "SIN", "y"])(
    "MAYOR-1: sin escribir SI (%j) en la confirmación del destino no se envía nada",
    async (respuesta) => {
      const m = await montar();
      expect(await m.correr(["preproduccion", "resumen"], { confirmacion: respuesta })).not.toBe(0);
      expect(m.llamadas).toHaveLength(0);
    },
  );

  it("MAYOR-1: la dirección solo se muestra en la etiqueta de la terminal, nunca en la salida", async () => {
    const m = await montar();
    expect(
      await m.correr(["preproduccion", "resumen"], { entradas: [DOMINIO_OTRO, credencial()] }),
    ).toBe(0);
    expect(m.pedidos[2]!.etiqueta).toContain("pre-nido.otro-dominio.com");
    expect(m.todo()).not.toContain("otro-dominio");
  });

  it("MAYOR-1: si el descubrimiento falla (red, estado o JSON), no se envía nada", async () => {
    const { ejecutarOperar } = await cargar();
    for (const respuesta of [
      () => {
        throw new TypeError("red");
      },
      () => new Response("{}", { status: 500 }),
      () => new Response("<html>", { status: 200 }),
      () => new Response("[]", { status: 200 }),
    ]) {
      const enviadas: string[] = [];
      const entradas = [ORIGEN, credencial()];
      const codigo = await ejecutarOperar({
        argv: ["preproduccion", "resumen"],
        git: gitLimpio,
        lector: { pedir: async () => entradas.shift() ?? "SI" },
        fetch: (async (url: string) => {
          enviadas.push(url);
          return respuesta();
        }) as unknown as typeof fetch,
        salida: () => undefined,
        errores: () => undefined,
      });
      expect(codigo).not.toBe(0);
      expect(enviadas.every((u) => u.endsWith("/.well-known/oauth-authorization-server"))).toBe(
        true,
      );
    }
  });

  it("MENOR-1: con NODE_TLS_REJECT_UNAUTHORIZED=0 se rechaza antes de pedir nada, con texto fijo", async () => {
    const m = await montar();
    const git = vi.fn(gitLimpio);
    const codigo = await m.correr(["preproduccion", "resumen"], {
      git,
      entorno: { NODE_TLS_REJECT_UNAUTHORIZED: "0" },
    });
    expect(codigo).not.toBe(0);
    expect(m.pedidos).toHaveLength(0);
    expect(m.llamadas).toHaveLength(0);
    expect(m.descubrimientos).toHaveLength(0);
    expect(m.todo()).toMatch(/NODE_TLS_REJECT_UNAUTHORIZED=0/);
  });

  it("MENOR-1: con otro valor (1) no se rechaza", async () => {
    const m = await montar();
    expect(
      await m.correr(["preproduccion", "resumen"], {
        entorno: { NODE_TLS_REJECT_UNAUTHORIZED: "1" },
      }),
    ).toBe(0);
  });

  it("MENOR-2: el aviso por un argumento con forma de secreto manda tratarlo como expuesto, con el texto exacto", async () => {
    const m = await montar();
    const secreto = credencial();
    await m.correr(["preproduccion", "generar_codigo", secreto]);
    expect(m.todo()).toContain(
      "considera la credencial expuesta (historial y registro de npm): pide otra y borra esa línea del historial",
    );
    expect(m.todo()).not.toContain(secreto);
  });

  const CODIGO = ["7QXM", "4TRD", "9KPA"].join("-");
  const respuestaCodigo = () =>
    new Response(
      JSON.stringify({ operacion: "generar_codigo", resultado: "generado", codigo: CODIGO }),
      {
        status: 200,
      },
    );

  it("MENOR-3: sin terminal en la salida estándar el código no se muestra y se avisa", async () => {
    const m = await montar();
    expect(
      await m.correr(["preproduccion", "generar_codigo", "A"], {
        respuesta: respuestaCodigo,
        salidaEsTerminal: false,
      }),
    ).toBe(0);
    expect(m.todo()).not.toContain(CODIGO);
    expect(m.todo()).not.toContain(CODIGO.replace(/-/g, ""));
    expect(m.todo()).toMatch(/se generó.*no se muestra/i);
  });

  it("MENOR-3: con terminal sí se muestra, una vez", async () => {
    const m = await montar();
    await m.correr(["preproduccion", "generar_codigo", "A"], {
      respuesta: respuestaCodigo,
      salidaEsTerminal: true,
    });
    expect(m.todo().split(CODIGO)).toHaveLength(2);
  });

  it("MENOR-4: el clon pide HEAD igual a origin/main; si difiere, rechazo antes de pedir nada", async () => {
    const m = await montar();
    const git = (a: string[]): string => {
      if (a[0] === "rev-parse" && a[1] === "--abbrev-ref") return "main\n";
      if (a[0] === "rev-parse" && a[1] === "origin/main") return "b".repeat(40) + "\n";
      if (a[0] === "rev-parse" && a[1] === "HEAD") return "a".repeat(40) + "\n";
      return "";
    };
    expect(await m.correr(["preproduccion", "resumen"], { git })).not.toBe(0);
    expect(m.pedidos).toHaveLength(0);
    expect(m.llamadas).toHaveLength(0);
  });

  it("MENOR-4: con HEAD igual a origin/main continúa", async () => {
    const m = await montar();
    const git = (a: string[]): string => {
      if (a[0] === "rev-parse" && a[1] === "--abbrev-ref") return "main\n";
      if (a[0] === "rev-parse") return "a".repeat(40) + "\n";
      return "";
    };
    expect(await m.correr(["preproduccion", "resumen"], { git })).toBe(0);
  });

  it("MENOR-4: git se ejecuta con la raíz del script como directorio de trabajo", () => {
    const fuente = readFileSync(SCRIPT, "utf8");
    expect(fuente).toMatch(/cwd:\s*RAIZ/);
  });

  it("sospecha: caracteres de control y de dirección del texto del servidor se escapan antes de imprimir", async () => {
    const m = await montar();
    const raros = "\u0085\u009b\u200e\u202e\u2066\u2069x";
    await m.correr(["preproduccion", "resumen"], {
      respuesta: () =>
        new Response(JSON.stringify({ operacion: "resumen", resultado: "resumen", nota: raros }), {
          status: 200,
        }),
    });
    expect(m.todo()).not.toMatch(/[\u0080-\u009f\u200e\u200f\u202a-\u202e\u2066-\u2069]/);
    expect(m.todo()).toContain(String.raw`\u0085`);
    expect(m.todo()).toContain(String.raw`\u202e`);
    expect(m.todo()).toContain("x");
  });
});

describe("el script real (proceso aparte)", () => {
  it("otro entorno: sale con error y no repite lo recibido por la entrada estándar", () => {
    const c = credencial();
    const r = spawnSync(process.execPath, [SCRIPT, "produccion", "resumen"], {
      input: `${ORIGEN}\n${c}\n`,
      encoding: "utf8",
      timeout: 20_000,
    });
    expect(r.status).not.toBe(0);
    expect(r.stdout + r.stderr).not.toContain(c);
    expect(r.stdout + r.stderr).not.toContain(new URL(ORIGEN).host);
  });

  it("una credencial en la línea de órdenes se rechaza sin repetirla", () => {
    const c = credencial();
    const r = spawnSync(process.execPath, [SCRIPT, "preproduccion", "generar_codigo", c], {
      input: "",
      encoding: "utf8",
      timeout: 20_000,
    });
    expect(r.status).not.toBe(0);
    expect(r.stdout + r.stderr).not.toContain(c);
  });
});
