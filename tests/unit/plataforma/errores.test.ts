import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CODIGOS } from "../../../src/lib/registro/codigos";
import { ErrorDeAplicacion } from "../../../src/lib/plataforma/errores";
import { manejador } from "../../../src/lib/plataforma/manejador";
import { analizarJson, analizarUrl } from "../../../src/lib/plataforma/entrada";

const MARCA = "TEXTO-CANARIO-123";
let salida: string[];

beforeEach(() => {
  salida = [];
  for (const metodo of ["log", "error", "warn", "info", "debug"] as const) {
    vi.spyOn(console, metodo).mockImplementation((...args: unknown[]) => {
      salida.push(args.map((a) => (typeof a === "string" ? a : JSON.stringify(a))).join(" "));
    });
  }
});
afterEach(() => vi.restoreAllMocks());

const peticion = () =>
  new Request("http://localhost/x?q=" + MARCA, { method: "POST", body: MARCA });

async function comprobarGenerico(respuesta: Response) {
  expect(respuesta.status).toBe(500);
  expect(respuesta.headers.get("cache-control")).toBe("no-store");
  const texto = await respuesta.text();
  expect(texto).toBe('{"estado":"error"}');
  expect(texto).not.toContain(MARCA);
}

describe("manejador: ningún error lleva un valor recibido (PRUEBA-026)", () => {
  it("excepción con valor marcado: 500 genérico y registro sin el valor", async () => {
    const alto = manejador("/api/x", () => {
      throw new Error(MARCA);
    });
    await comprobarGenerico(await alto(peticion()));
    expect(salida).toHaveLength(1);
    expect(salida.join("\n")).not.toContain(MARCA);
    const linea = JSON.parse(salida[0] as string);
    expect(Object.keys(linea).sort()).toEqual(["codigo", "momento", "nivel", "ruta"]);
    expect(linea.codigo).toBe("error_no_controlado");
    expect(linea.ruta).toBe("/api/x");
    expect(Number.isNaN(Date.parse(linea.momento))).toBe(false);
  });

  it("rechazo asíncrono, valor que no es Error y objeto con toString malicioso", async () => {
    const casos = [
      () => Promise.reject(new Error(MARCA)),
      () => Promise.reject(MARCA),
      () => Promise.reject({ toString: () => MARCA, message: MARCA }),
    ];
    for (const caso of casos) {
      const alto = manejador("/api/x", caso);
      await comprobarGenerico(await alto(peticion()));
    }
    expect(salida).toHaveLength(3);
    expect(salida.join("\n")).not.toContain(MARCA);
  });

  it("ErrorDeAplicacion usa su código y no arrastra la causa", async () => {
    const alto = manejador("/api/x", () => {
      throw Object.assign(new ErrorDeAplicacion("configuracion_invalida"), { cause: MARCA });
    });
    await comprobarGenerico(await alto(peticion()));
    expect(JSON.parse(salida[0] as string).codigo).toBe("configuracion_invalida");
    expect(salida.join("\n")).not.toContain(MARCA);
  });

  it("un código fuera de la lista cerrada no se registra: error_no_controlado", async () => {
    const falso = Object.assign(new ErrorDeAplicacion("entrada_invalida"), {
      codigo: MARCA,
    }) as unknown as Error;
    const alto = manejador("/api/x", () => Promise.reject(falso));
    await comprobarGenerico(await alto(peticion()));
    expect(salida.join(" ")).not.toContain(MARCA);
    expect(JSON.parse(salida[0] as string).codigo).toBe("error_no_controlado");
  });

  it("devuelve la respuesta del manejador interno si no falla", async () => {
    const alto = manejador("/api/x", () => new Response("ok", { status: 201 }));
    expect((await alto(peticion())).status).toBe(201);
    expect(salida).toHaveLength(0);
  });

  it("los códigos son una lista cerrada y ErrorDeAplicacion los usa", () => {
    expect(CODIGOS).toContain("entrada_invalida");
    expect(CODIGOS).toContain("error_no_controlado");
    expect(new ErrorDeAplicacion("entrada_invalida").codigo).toBe("entrada_invalida");
    expect(new ErrorDeAplicacion("entrada_invalida").message).toBe("entrada_invalida");
  });
});

describe("entrada.ts: entrada_invalida sin cause (PRUEBA-026)", () => {
  function capturar(f: () => unknown): unknown {
    try {
      f();
    } catch (e) {
      return e;
    }
    return undefined;
  }

  it("JSON inválido con valor marcado", () => {
    const e = capturar(() => analizarJson("{" + MARCA));
    expect(e).toBeInstanceOf(ErrorDeAplicacion);
    expect((e as ErrorDeAplicacion).codigo).toBe("entrada_invalida");
    expect("cause" in (e as object)).toBe(false);
    expect(Object.getOwnPropertyNames(e)).not.toContain("cause");
    expect(String((e as Error).stack) + (e as Error).message).not.toContain(MARCA);
  });

  it("URL inválida con valor marcado", () => {
    const e = capturar(() => analizarUrl(MARCA));
    expect((e as ErrorDeAplicacion).codigo).toBe("entrada_invalida");
    expect("cause" in (e as object)).toBe(false);
    expect(String((e as Error).stack) + (e as Error).message).not.toContain(MARCA);
  });

  it("entradas válidas", () => {
    expect(analizarJson('{"a":1}')).toEqual({ a: 1 });
    expect(analizarUrl("http://localhost/a").pathname).toBe("/a");
  });
});
