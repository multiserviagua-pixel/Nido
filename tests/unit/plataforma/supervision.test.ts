import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  CODIGOS_SUPERVISADOS,
  enviarEvento,
  reiniciarLimite,
  RUTAS_SUPERVISADAS,
} from "../../../src/lib/plataforma/supervision";
import type { Configuracion } from "../../../src/lib/plataforma/configuracion";
import { CODIGOS, type Codigo } from "../../../src/lib/registro/codigos";

// PRUEBA-046 (002): evento cerrado pese a valores marcados; envío fallido sin bloqueo; sin DSN no
// hay petición. Canarios compuestos en ejecución: el literal completo no existe en el código.
const canario = (parte: string): string => ["TEXTO", "CANARIO", parte].join("-");
const CLAVE = "0123456789abcdef0123456789abcdef";
const DSN = `https://${CLAVE}@o7.ingest.de.sentry.io/42`;

const CONFIG: Configuracion = {
  entorno: "preproduccion",
  supervisionDsn: DSN,
  commitDesplegado: "abcdef1",
  vercel: "1",
  vercelEnv: "preview",
  vercelRegion: "arn1",
  vercelUrl: undefined,
};

interface Captura {
  url: string;
  init: RequestInit;
  cuerpo: string;
}

function doble(
  comportamiento: (c: Captura) => Promise<Response> | Response = () => new Response("{}"),
) {
  const capturas: Captura[] = [];
  const fetchDoble = vi.fn((url: string | URL | Request, init?: RequestInit) => {
    const captura = { url: String(url), init: init ?? {}, cuerpo: String(init?.body ?? "") };
    capturas.push(captura);
    return Promise.resolve(comportamiento(captura));
  });
  return { fetchDoble: fetchDoble as unknown as typeof fetch, capturas, espia: fetchDoble };
}

let consola: { mockRestore: () => void }[];
let salida: string;

beforeEach(() => {
  reiniciarLimite();
  salida = "";
  const captar = (...a: unknown[]): void => {
    salida += a.map(String).join(" ") + "\n";
  };
  consola = (["log", "info", "warn", "error", "debug"] as const).map((m) =>
    vi.spyOn(console, m).mockImplementation(captar),
  );
});
afterEach(() => {
  for (const e of consola) e.mockRestore();
  vi.useRealTimers();
});

function eventoDe(c: Captura): Record<string, unknown> {
  const lineas = c.cuerpo.split("\n");
  return JSON.parse(lineas[2] ?? "{}") as Record<string, unknown>;
}

const CODIGOS_ESPERADOS = [
  "almacen_no_disponible",
  "comprobacion_posterior_fallida",
  "configuracion_conector_invalida",
  "configuracion_invalida",
  "despliegue_fallido",
  "diagnostico_provocado",
  "entrada_invalida",
  "error_no_controlado",
  "region_no_permitida",
];

const ENTRADA = { ruta: "/api/salud", codigo: "error_no_controlado", metodo: "GET" } as const;

// Huellas [ruta, codigo] distintas y supervisadas: 6 rutas por 9 codigos.
function huellasDistintas(n: number): { ruta: string; codigo: Codigo }[] {
  const salida: { ruta: string; codigo: Codigo }[] = [];
  for (const ruta of RUTAS_SUPERVISADAS) {
    for (const codigo of CODIGOS_SUPERVISADOS) {
      if (salida.length < n) salida.push({ ruta, codigo });
    }
  }
  return salida;
}

describe("supervision.ts (PRUEBA-046)", () => {
  it("envia un evento cerrado al ingreso de la UE con los campos del diseno", async () => {
    const { fetchDoble, capturas } = doble();
    await enviarEvento(
      { ruta: "/api/salud", codigo: "configuracion_invalida", metodo: "GET" },
      { configuracion: CONFIG, fetch: fetchDoble },
    );
    expect(capturas).toHaveLength(1);
    const c = capturas[0]!;
    expect(c.url).toBe("https://o7.ingest.de.sentry.io/api/42/envelope/");
    expect(c.init.method).toBe("POST");
    expect(c.cuerpo).not.toContain(CLAVE);
    const e = eventoDe(c);
    expect(Object.keys(e).sort()).toEqual(
      [
        "environment",
        "event_id",
        "fingerprint",
        "level",
        "platform",
        "release",
        "tags",
        "timestamp",
        "transaction",
      ].sort(),
    );
    expect(e.level).toBe("error");
    expect(e.environment).toBe("preproduccion");
    expect(e.release).toBe("abcdef1");
    expect(e.transaction).toBe("/api/salud");
    expect(e.event_id).toMatch(/^[0-9a-f]{32}$/);
    expect(e.tags).toEqual({
      ruta: "/api/salud",
      codigo: "configuracion_invalida",
      metodo: "GET",
    });
    expect(e.fingerprint).toEqual(["/api/salud", "configuracion_invalida"]);
    expect(typeof e.timestamp).toBe("number");
  });

  it("valores marcados en ruta, codigo, metodo y objeto: ninguno sale en el cuerpo ni en consola", async () => {
    const { fetchDoble, capturas } = doble();
    const m1 = canario("uno");
    const m2 = canario("dos");
    const m3 = canario("tres");
    const entrada = {
      ruta: `/api/${m1}/x?q=${m2}`,
      codigo: m3,
      metodo: m1,
      mensaje: m2,
      traza: new Error(m3).stack,
      url: `https://x.test/${m1}`,
      cabeceras: { authorization: m2 },
    } as unknown as Parameters<typeof enviarEvento>[0];
    await enviarEvento(entrada, { configuracion: CONFIG, fetch: fetchDoble });
    // Un segmento de la ruta pedida (no plantilla) tampoco sale.
    await enviarEvento(
      { ruta: `/api/${m1}`, codigo: "entrada_invalida", metodo: "POST" },
      { configuracion: CONFIG, fetch: fetchDoble },
    );
    expect(capturas.length).toBeGreaterThan(0);
    for (const c of capturas) {
      for (const m of [m1, m2, m3]) {
        expect(c.cuerpo.toLowerCase()).not.toContain(m.toLowerCase());
        expect(JSON.stringify(c.init.headers ?? {}).toLowerCase()).not.toContain(m.toLowerCase());
      }
      const tags = eventoDe(c).tags as Record<string, string>;
      expect(CODIGOS_SUPERVISADOS).toContain(tags.codigo);
      expect(["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS", "otro"]).toContain(
        tags.metodo,
      );
    }
    for (const m of [m1, m2, m3]) expect(salida.toLowerCase()).not.toContain(m.toLowerCase());
  });

  it("la lista de codigos enviables sale de codigos.ts y excluye los propios de supervision", () => {
    for (const c of CODIGOS_SUPERVISADOS) expect(CODIGOS).toContain(c);
    expect(CODIGOS_SUPERVISADOS).toContain("almacen_no_disponible");
    expect(CODIGOS_SUPERVISADOS).toContain("configuracion_conector_invalida");
    expect(CODIGOS_SUPERVISADOS).not.toContain("supervision_no_disponible");
    expect(CODIGOS_SUPERVISADOS).not.toContain("salida_no_estructurada");
  });

  it("el conjunto de codigos supervisados es exactamente este", () => {
    expect([...CODIGOS_SUPERVISADOS].sort()).toEqual(CODIGOS_ESPERADOS);
  });

  it("sin DSN (desarrollo) no hay peticion", async () => {
    const { fetchDoble, espia } = doble();
    await enviarEvento(ENTRADA, {
      configuracion: { ...CONFIG, entorno: "desarrollo", supervisionDsn: undefined },
      fetch: fetchDoble,
    });
    expect(espia).not.toHaveBeenCalled();
  });

  it("un rechazo de red no lanza y deja solo supervision_no_disponible en el registro", async () => {
    const { fetchDoble } = doble(() => {
      throw new Error(canario("red"));
    });
    await expect(
      enviarEvento(ENTRADA, { configuracion: CONFIG, fetch: fetchDoble }),
    ).resolves.toBeUndefined();
    expect(salida).toContain("supervision_no_disponible");
    expect(salida).not.toContain(canario("red"));
    const linea = JSON.parse(salida.trim().split("\n")[0]!) as Record<string, unknown>;
    expect(Object.keys(linea).sort()).toEqual(["codigo", "momento", "nivel", "ruta"]);
  });

  it("una respuesta no 2xx cuenta como fallo, sin reintento", async () => {
    const { fetchDoble, espia } = doble(() => new Response("no", { status: 429 }));
    await enviarEvento(ENTRADA, { configuracion: CONFIG, fetch: fetchDoble });
    expect(espia).toHaveBeenCalledTimes(1);
    expect(salida).toContain("supervision_no_disponible");
  });

  it("espera como mucho 2 s: un envio colgado no bloquea y lleva una senal con limite de tiempo", async () => {
    let senal: AbortSignal | undefined;
    const colgado = vi.fn(
      (_u: unknown, init?: RequestInit) =>
        new Promise<Response>((_ok, no) => {
          senal = init?.signal ?? undefined;
          init?.signal?.addEventListener("abort", () => no(new Error("abortado")));
        }),
    ) as unknown as typeof fetch;
    const t0 = performance.now();
    const p = enviarEvento(ENTRADA, { configuracion: CONFIG, fetch: colgado });
    await expect(p).resolves.toBeUndefined();
    expect(performance.now() - t0).toBeLessThan(2500);
    expect(senal).toBeInstanceOf(AbortSignal);
    expect(senal?.aborted).toBe(true);
    expect((senal?.reason as { name?: string }).name).toBe("TimeoutError");
    expect(salida).toContain("supervision_no_disponible");
  }, 6000);

  it("release solo con forma de huella de commit y environment solo de la lista cerrada", async () => {
    const { fetchDoble, capturas } = doble();
    const c1 = canario("commit");
    const c2 = canario("entorno");
    await enviarEvento(ENTRADA, {
      configuracion: { ...CONFIG, commitDesplegado: c1 },
      fetch: fetchDoble,
    });
    reiniciarLimite(); // la misma huella solo sale una vez por minuto
    await enviarEvento(ENTRADA, {
      configuracion: { ...CONFIG, entorno: c2 as unknown as Configuracion["entorno"] },
      fetch: fetchDoble,
    });
    reiniciarLimite();
    await enviarEvento(ENTRADA, {
      configuracion: { ...CONFIG, commitDesplegado: undefined },
      fetch: fetchDoble,
    });
    expect(capturas).toHaveLength(3);
    expect(eventoDe(capturas[0]!).release).toBe("desconocido");
    expect(eventoDe(capturas[1]!).environment).not.toBe(c2);
    expect(["desarrollo", "preproduccion", "produccion"]).toContain(
      eventoDe(capturas[1]!).environment,
    );
    expect(eventoDe(capturas[2]!).release).toBe("desconocido");
    for (const c of capturas) {
      expect(c.cuerpo.toLowerCase()).not.toContain(c1.toLowerCase());
      expect(c.cuerpo.toLowerCase()).not.toContain(c2.toLowerCase());
    }
  });

  it("la ventana se renueva: tras 60 s vuelve a haber cupo", async () => {
    const { fetchDoble, espia } = doble();
    let reloj = 1_000_000;
    const ahora = vi.spyOn(Date, "now").mockImplementation(() => reloj);
    try {
      for (const h of huellasDistintas(21)) {
        await enviarEvento(h, { configuracion: CONFIG, fetch: fetchDoble });
      }
      expect(espia).toHaveBeenCalledTimes(20);
      reloj += 60_001;
      await enviarEvento(huellasDistintas(21)[20]!, { configuracion: CONFIG, fetch: fetchDoble });
      expect(espia).toHaveBeenCalledTimes(21);
    } finally {
      ahora.mockRestore();
    }
  });

  it("host forzado: un DSN fuera de la UE o de Sentry no provoca ninguna peticion", async () => {
    const { fetchDoble, espia } = doble();
    const clave = ["0123", "4567", "89ab", "cdef", "0123", "4567", "89ab", "cdef"].join("");
    for (const dsn of [
      `https://${clave}@o1.ingest.us.sentry.io/1`,
      `https://${clave}@ejemplo.test/1`,
    ]) {
      await enviarEvento(ENTRADA, {
        configuracion: { ...CONFIG, supervisionDsn: dsn },
        fetch: fetchDoble,
      });
    }
    expect(espia).not.toHaveBeenCalled();
  });

  it("no sigue redirecciones", async () => {
    const { fetchDoble, capturas } = doble();
    await enviarEvento(ENTRADA, { configuracion: CONFIG, fetch: fetchDoble });
    expect(capturas[0]!.init.redirect).toBe("error");
  });

  it("la respuesta se libera tras leer el estado", async () => {
    const cancelar = vi.fn(() => Promise.reject(new Error("x")));
    const { fetchDoble } = doble(
      () => ({ ok: true, body: { cancel: cancelar } }) as unknown as Response,
    );
    await expect(
      enviarEvento(ENTRADA, { configuracion: CONFIG, fetch: fetchDoble }),
    ).resolves.toBeUndefined();
    expect(cancelar).toHaveBeenCalledTimes(1);
  });

  it("limita a 20 envios por minuto e instancia", async () => {
    const { fetchDoble, espia } = doble();
    for (const h of huellasDistintas(25)) {
      await enviarEvento(h, { configuracion: CONFIG, fetch: fetchDoble });
    }
    expect(espia).toHaveBeenCalledTimes(20);
  });

  it("M1: una rafaga de una huella no agota el cupo de otra distinta", async () => {
    const { fetchDoble, espia, capturas } = doble();
    for (let i = 0; i < 25; i++) {
      await enviarEvento(
        { ruta: "/api/mcp", codigo: "entrada_invalida" },
        { configuracion: CONFIG, fetch: fetchDoble },
      );
    }
    expect(espia).toHaveBeenCalledTimes(1);
    await enviarEvento(
      { ruta: "/api/operacion", codigo: "almacen_no_disponible" },
      { configuracion: CONFIG, fetch: fetchDoble },
    );
    expect(espia).toHaveBeenCalledTimes(2);
    const ultimo = JSON.parse(capturas[1]!.cuerpo.split("\n")[2]!) as { tags: { codigo: string } };
    expect(ultimo.tags.codigo).toBe("almacen_no_disponible");
  });

  it("M1: la misma huella vuelve a salir pasados 60 s", async () => {
    const { fetchDoble, espia } = doble();
    let reloj = 2_000_000;
    const ahora = vi.spyOn(Date, "now").mockImplementation(() => reloj);
    try {
      const h = { ruta: "/api/mcp", codigo: "entrada_invalida" } as const;
      await enviarEvento(h, { configuracion: CONFIG, fetch: fetchDoble });
      reloj += 59_999;
      await enviarEvento(h, { configuracion: CONFIG, fetch: fetchDoble });
      expect(espia).toHaveBeenCalledTimes(1);
      reloj += 2;
      await enviarEvento(h, { configuracion: CONFIG, fetch: fetchDoble });
      expect(espia).toHaveBeenCalledTimes(2);
    } finally {
      ahora.mockRestore();
    }
  });

  it("una configuracion invalida en el entorno no lanza ni envia", async () => {
    const { fetchDoble, espia } = doble();
    const anterior = process.env.ENTORNO;
    process.env.ENTORNO = "invalido";
    try {
      await expect(enviarEvento(ENTRADA, { fetch: fetchDoble })).resolves.toBeUndefined();
    } finally {
      if (anterior === undefined) delete process.env.ENTORNO;
      else process.env.ENTORNO = anterior;
    }
    expect(espia).not.toHaveBeenCalled();
  });
});
