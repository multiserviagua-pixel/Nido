// T-108 (e) (001): operaciones.ts y POST /api/operacion (REQ-017). PRUEBA-020 (operaciones, consulta -> 400,
// rechazo sin credencial o con token de conexión), PRUEBA-021 (producción: 404 antes de leer nada) y
// PRUEBA-023 parte B (tras `cerrar_prueba`: lo que escribe se rechaza, lo de lectura sigue). Base de
// datos: PGlite con el rol de gestión; valores compuestos en ejecución (arts. 1 y 4).
import { createHash, randomBytes } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  crearOperaciones,
  type DependenciasOperaciones,
} from "../../../src/lib/licencias/operaciones";
import { nuevoCodigoActivacion, normalizarCodigo } from "../../../src/lib/oauth/codigo-activacion";
import { derivarClaves, huellaToken } from "../../../src/lib/oauth/secretos";
import { cargarConfiguracionConector } from "../../../src/lib/plataforma/configuracion";
import { ErrorDeAplicacion } from "../../../src/lib/plataforma/errores";
import { manejador } from "../../../src/lib/plataforma/manejador";
import {
  crearAutorizacion,
  type AdaptadorAutorizacion,
  type Autorizacion,
} from "../../../src/lib/supabase/autorizacion";
import { crearAlmacenPglite, type BdApoyo } from "../../conector/apoyo/index";
import { ESQUEMA, ROL_GESTION, abrir, cerrarAlFinal, sembrar, una } from "./bd/comun";

cerrarAlFinal();

// Espía de la comparación en tiempo constante: por defecto llama a la real; una prueba puede forzar su resultado.
const comparacion = vi.hoisted(() => ({
  llamadas: [] as Array<[string, string]>,
  forzar: undefined as boolean | undefined,
}));
vi.mock("../../../src/lib/oauth/secretos", async (original) => {
  const real = await original<typeof import("../../../src/lib/oauth/secretos")>();
  return {
    ...real,
    coincideHuellaOperacion: (credencial: string, huella: string): boolean => {
      comparacion.llamadas.push([credencial, huella]);
      return comparacion.forzar ?? real.coincideHuellaOperacion(credencial, huella);
    },
  };
});

const URL_PUBLICA = "http://localhost:3000";
const SECRETO = randomBytes(32).toString("base64url");
const CREDENCIAL = "hia_op_" + randomBytes(32).toString("base64url");
const HUELLA = createHash("sha256").update(CREDENCIAL, "utf8").digest("hex");
const CANARIO = "TEXTO-CANARIO-" + "OPERACION-123";
const IP = "203.0.113.7";
const urlBd = (rol: string): string =>
  ["postgres", "://", `${rol}.ref1`, ":", randomBytes(12).toString("hex"), "@"]
    .concat(["agrupador.ejemplo.invalid", ":6543", "/postgres"])
    .join("");

function entorno(): void {
  vi.stubEnv("ENTORNO", "desarrollo");
  vi.stubEnv("NODE_ENV", "development");
  for (const n of ["VERCEL", "VERCEL_ENV", "VERCEL_REGION", "VERCEL_URL", "SUPERVISION_DSN"]) {
    vi.stubEnv(n, undefined);
  }
  vi.stubEnv("URL_PUBLICA", URL_PUBLICA);
  vi.stubEnv("CONECTOR_SECRETO", SECRETO);
  vi.stubEnv("CONECTOR_BD_URL", urlBd("conector_prueba_mcp"));
  vi.stubEnv("AUTORIZACION_BD_URL", urlBd("conector_prueba_gestion"));
  vi.stubEnv("OPERACION_HUELLA", HUELLA);
}
let consola: string[];
beforeEach(() => {
  entorno();
  comparacion.llamadas = [];
  comparacion.forzar = undefined;
  consola = [];
  for (const m of ["log", "error", "warn", "info", "debug"] as const) {
    vi.spyOn(console, m).mockImplementation((...a: unknown[]) => {
      consola.push(a.map((x) => (typeof x === "string" ? x : JSON.stringify(x))).join(" "));
    });
  }
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

interface Montaje {
  bd: BdApoyo;
  llamadas: string[];
  atender: (p: Request) => Promise<Response>;
}
async function montar(
  opciones: {
    local?: boolean;
    entorno?: DependenciasOperaciones["entorno"];
    caido?: boolean;
  } = {},
): Promise<Montaje> {
  const bd = await abrir();
  const real = await crearAlmacenPglite(bd, ROL_GESTION);
  const llamadas: string[] = [];
  const adaptador: AdaptadorAutorizacion = {
    llamar: (funcion, argumentos) => {
      llamadas.push(funcion);
      if (opciones.caido) return Promise.reject(new Error("caído " + CANARIO));
      return real.llamar(funcion, argumentos);
    },
  };
  const atender = crearOperaciones({
    configuracion: cargarConfiguracionConector,
    autorizacion: () => crearAutorizacion(adaptador),
    entorno: opciones.entorno ?? (() => "desarrollo"),
    local: () => opciones.local ?? true,
  });
  return { bd, llamadas, atender };
}

const claves = () => derivarClaves(SECRETO);
function peticion(
  cuerpo: unknown,
  extra: {
    credencial?: string | null;
    cabeceras?: Record<string, string>;
    ruta?: string;
    metodo?: string;
  } = {},
): Request {
  const cabeceras: Record<string, string> = {
    "content-type": "application/json",
    ...extra.cabeceras,
  };
  const credencial = extra.credencial === undefined ? CREDENCIAL : extra.credencial;
  if (credencial !== null) cabeceras.authorization = `Bearer ${credencial}`;
  const metodo = extra.metodo ?? "POST";
  return new Request(`${URL_PUBLICA}${extra.ruta ?? "/api/operacion"}`, {
    method: metodo,
    headers: cabeceras,
    body:
      metodo === "GET" || metodo === "HEAD"
        ? undefined
        : typeof cuerpo === "string"
          ? cuerpo
          : JSON.stringify(cuerpo),
  });
}
const op = (operacion: string, argumentos?: Record<string, unknown>) =>
  argumentos === undefined ? { operacion } : { operacion, argumentos };
const json = async (r: Response) => (await r.json()) as Record<string, unknown>;

describe("PRUEBA-020: operaciones de HumanaIA sin desplegar", () => {
  it("generar_codigo: forma Crockford, mostrado en la respuesta y guardado solo como HMAC con 10 minutos", async () => {
    const { atender, bd } = await montar();
    const r = await atender(peticion(op("generar_codigo", { tipo: "A" })));
    expect(r.status).toBe(200);
    expect(r.headers.get("cache-control")).toBe("no-store");
    const c = await json(r);
    expect(c.resultado).toBe("generado");
    expect(String(c.codigo)).toMatch(
      /^[0-9A-HJKMNP-TV-Z]{4}-[0-9A-HJKMNP-TV-Z]{4}-[0-9A-HJKMNP-TV-Z]{4}$/,
    );
    const fila = await una<{ codigo_hmac: string; vigente: boolean }>(
      bd,
      `select codigo_hmac, caduca_en <= now() + interval '10 minutes' as vigente from ${ESQUEMA}.codigos_activacion`,
    );
    expect(fila.codigo_hmac).toBe(
      huellaToken(claves(), "codigo_activacion", normalizarCodigo(String(c.codigo))!),
    );
    expect(fila.vigente).toBe(true);
    const volcado = JSON.stringify(
      (await bd.db.query(`select * from ${ESQUEMA}.codigos_activacion`)).rows,
    );
    expect(volcado).not.toContain(String(c.codigo));
    // Otro código distinto cada vez.
    const c2 = await json(await atender(peticion(op("generar_codigo", { tipo: "A" }))));
    expect(c2.codigo).not.toBe(c.codigo);
  });

  it("el código no se registra en consola ni va en otra respuesta que la de generar", async () => {
    const { atender } = await montar();
    const c = await json(await atender(peticion(op("generar_codigo", { tipo: "B" }))));
    const otra = await (await atender(peticion(op("resumen")))).text();
    expect(otra).not.toContain(String(c.codigo));
    expect(consola.join("\n")).not.toContain(String(c.codigo));
  });

  it("normalizarCodigo y nuevoCodigoActivacion: 60 bits, sin I, L, O, U; I y L valen 1, O vale 0", () => {
    for (let i = 0; i < 50; i++) {
      const c = nuevoCodigoActivacion();
      expect(c).toMatch(/^[0-9A-HJKMNP-TV-Z]{4}-[0-9A-HJKMNP-TV-Z]{4}-[0-9A-HJKMNP-TV-Z]{4}$/);
      expect(normalizarCodigo(c)).toBe(c.replaceAll("-", ""));
    }
    expect(normalizarCodigo("abcd-ef12-3456")).toBe("ABCDEF123456");
    expect(normalizarCodigo("OIL0-0000-0000")).toBe("011000000000");
    for (const malo of [
      "",
      "ABCD-EFGH-JKM",
      "ABCD-EFGH-JKMNP",
      "UUUU-UUUU-UUUU",
      "ABCD EFGH JKMN!",
      CANARIO,
    ]) {
      expect(normalizarCodigo(malo)).toBeNull();
    }
  });

  it("normalizarCodigo acota la entrada: más de 64 caracteres es null sin procesarla (MENOR-7 del revisor)", () => {
    const valido = ["ABCD", "EFGH", "JKMN"].join("-");
    expect(normalizarCodigo(valido)).toBe("ABCDEFGHJKMN");
    // Espacios o guiones de relleno que, al quitarlos, dejarían un código válido, pasados los 64.
    expect(normalizarCodigo(valido + " ".repeat(64))).toBeNull();
    expect(normalizarCodigo("-".repeat(65) + "ABCDEFGHJKMN")).toBeNull();
    expect(normalizarCodigo(valido.padEnd(64, " "))).toBe("ABCDEFGHJKMN");
    expect(normalizarCodigo(valido.padEnd(65, " "))).toBeNull();
    expect(normalizarCodigo("A".repeat(1_000_000))).toBeNull();
  });

  it("suspender, reactivar y sin_cambio", async () => {
    const { atender } = await montar();
    expect(
      (await json(await atender(peticion(op("suspender_licencia", { tipo: "A" }))))).resultado,
    ).toBe("suspendida");
    expect(
      (await json(await atender(peticion(op("suspender_licencia", { tipo: "A" }))))).resultado,
    ).toBe("sin_cambio");
    expect(
      (await json(await atender(peticion(op("reactivar_licencia", { tipo: "A" }))))).resultado,
    ).toBe("reactivada");
  });

  it("crear_orden anula las no confirmadas", async () => {
    const { atender } = await montar();
    const a = await json(
      await atender(peticion(op("crear_orden", { tipo: "A", orden: "pausar" }))),
    );
    expect(a).toMatchObject({ resultado: "creada", anuladas: 0 });
    const b = await json(
      await atender(peticion(op("crear_orden", { tipo: "A", orden: "reanudar" }))),
    );
    expect(b).toMatchObject({ resultado: "creada", anuladas: 1 });
  });

  it("listar_conexiones y revocar_conexion: la revocada deja de validar", async () => {
    const { atender, bd } = await montar();
    const s = await sembrar(bd, "A");
    const l = await json(await atender(peticion(op("listar_conexiones"))));
    expect(l.resultado).toBe("listado");
    expect((l.conexiones as { id: string }[]).map((c) => c.id)).toEqual([s.conexionId]);
    const r = await atender(
      peticion(op("revocar_conexion", { conexion: s.conexionId.toUpperCase() })),
    );
    expect((await json(r)).resultado).toBe("revocada");
    expect(
      (await json(await atender(peticion(op("revocar_conexion", { conexion: s.conexionId })))))
        .resultado,
    ).toBe("sin_cambio");
    const v = await una<{ r: boolean }>(
      bd,
      `select ${ESQUEMA}.validar_acceso($1, 'https://conector.ejemplo.test/api/mcp') as r`,
      [s.acceso.hmac],
    ).catch(() => ({ r: false }));
    expect(v.r).toBe(false);
    const desconocida = await atender(
      peticion(op("revocar_conexion", { conexion: "11111111-1111-4111-8111-111111111111" })),
    );
    expect(desconocida.status).toBe(404);
    expect((await json(desconocida)).resultado).toBe("conexion_desconocida");
  });

  it("resumen y exportar_sucesos", async () => {
    const { atender } = await montar();
    const r = await json(await atender(peticion(op("resumen"))));
    expect(r.resultado).toBe("resumen");
    const e = await json(await atender(peticion(op("exportar_sucesos", { dia: "2026-11-21" }))));
    expect(e).toEqual({ operacion: "exportar_sucesos", resultado: "exportado", sucesos: [] });
  });

  it("la respuesta lleva la operación y el resultado cerrado; nada de lo recibido", async () => {
    const { atender } = await montar();
    const r = await json(await atender(peticion(op("suspender_licencia", { tipo: "B" }))));
    expect(r).toEqual({ operacion: "suspender_licencia", resultado: "suspendida" });
  });

  describe("formato validado ANTES de llamar a la base (sin eco)", () => {
    const casos: [string, unknown][] = [
      ["operación desconocida", op("borrar_todo")],
      ["operación que no es texto", { operacion: 3 }],
      ["sin operación", {}],
      ["tipo de licencia fuera de lista", op("generar_codigo", { tipo: "C" })],
      ["tipo ausente", op("suspender_licencia", {})],
      ["tipo en minúscula", op("suspender_licencia", { tipo: "a" })],
      ["orden fuera de lista", op("crear_orden", { tipo: "A", orden: "borrar" })],
      ["orden ausente", op("crear_orden", { tipo: "A" })],
      ["conexión que no es UUID", op("revocar_conexion", { conexion: "no-es-uuid-" + CANARIO })],
      ["día mal formado", op("exportar_sucesos", { dia: "21/11/2026" })],
      ["día inexistente", op("exportar_sucesos", { dia: "2026-02-30" })],
      ["día no es texto", op("exportar_sucesos", { dia: 20261121 })],
      ["argumento de más", op("generar_codigo", { tipo: "A", cliente_id: CANARIO })],
      ["argumentos en una operación sin ellos", op("resumen", { x: CANARIO })],
      ["campo de más en el cuerpo", { operacion: "resumen", extra: CANARIO }],
      ["argumentos que no son objeto", { operacion: "generar_codigo", argumentos: "A" }],
      ["cuerpo que no es objeto", [op("resumen")]],
      ["cuerpo no JSON", "no es json " + CANARIO],
      ["cuerpo vacío", ""],
    ];
    for (const [nombre, cuerpo] of casos) {
      it(`${nombre}: 400, ninguna llamada de operación y sin eco`, async () => {
        const { atender, llamadas } = await montar();
        const r = await atender(peticion(cuerpo));
        expect(r.status).toBe(400);
        const t = await r.text();
        expect(t).not.toContain(CANARIO);
        expect(consola.join("\n")).not.toContain(CANARIO);
        expect(llamadas).toEqual([]);
      });
    }
  });

  it("una consulta no vacía es 400, aunque la credencial sea válida, y no se refleja", async () => {
    const { atender, llamadas } = await montar();
    const r = await atender(peticion(op("resumen"), { ruta: `/api/operacion?x=${CANARIO}` }));
    expect(r.status).toBe(400);
    expect(await r.text()).not.toContain(CANARIO);
    expect(llamadas).toEqual([]);
    expect(consola.join("\n")).not.toContain(CANARIO);
    for (const ruta of ["/api/operacion?", "/api/operacion?a"]) {
      expect((await atender(peticion(op("resumen"), { ruta }))).status).toBe(400);
    }
  });

  it("cuerpo de más de 1024 bytes: 413", async () => {
    const { atender, llamadas } = await montar();
    const r = await atender(peticion(op("resumen", {}).operacion + " ".repeat(2000)));
    expect(r.status).toBe(413);
    expect(llamadas).toEqual([]);
  });

  it("frontera del tope: 1024 bytes pasan; 1025 dan 413 (con y sin Content-Length, y en varios trozos)", async () => {
    const { atender } = await montar();
    const base = JSON.stringify(op("resumen"));
    const relleno = (bytes: number) => base + " ".repeat(bytes - Buffer.byteLength(base));
    expect(Buffer.byteLength(relleno(1024))).toBe(1024);
    expect((await atender(peticion(relleno(1024)))).status).toBe(200);
    expect((await atender(peticion(relleno(1025)))).status).toBe(413);
    // Con Content-Length declarado.
    expect(
      (await atender(peticion(relleno(1024), { cabeceras: { "content-length": "1024" } }))).status,
    ).toBe(200);
    expect(
      (await atender(peticion(relleno(1025), { cabeceras: { "content-length": "1025" } }))).status,
    ).toBe(413);
    // Contenido por trozos (sin longitud declarada): el tope se cuenta en bytes, no en caracteres.
    const trozos = (texto: string) =>
      new Request(`${URL_PUBLICA}/api/operacion`, {
        method: "POST",
        headers: { authorization: `Bearer ${CREDENCIAL}`, "content-type": "application/json" },
        body: new ReadableStream({
          start(c) {
            const b = new TextEncoder().encode(texto);
            for (let i = 0; i < b.length; i += 100) c.enqueue(b.slice(i, i + 100));
            c.close();
          },
        }),
        duplex: "half",
      } as RequestInit);
    expect((await atender(trozos(relleno(1024)))).status).toBe(200);
    expect((await atender(trozos(relleno(1025)))).status).toBe(413);
    // 1024 caracteres que son más de 1024 bytes (multibyte): 413.
    expect((await atender(peticion(base + "é".repeat(600)))).status).toBe(413);
  });

  it("solo POST: 405 con Allow, sin leer nada", async () => {
    const { atender, llamadas } = await montar();
    for (const metodo of ["GET", "PUT", "DELETE", "PATCH"]) {
      const r = await atender(peticion(op("resumen"), { metodo }));
      expect(r.status).toBe(405);
      expect(r.headers.get("allow")).toBe("POST");
    }
    expect(llamadas).toEqual([]);
  });
});

describe("PRUEBA-020: credenciales", () => {
  const credencialAjena = () => "hia_op_" + randomBytes(32).toString("base64url");
  it.each([
    ["sin credencial", () => null],
    ["credencial distinta", credencialAjena],
    ["token de acceso de conexión", () => "hia_a_" + randomBytes(32).toString("base64url")],
    ["token de renovación", () => "hia_r_" + randomBytes(32).toString("base64url")],
    ["mal formada", () => "hia_op_corta"],
    ["sin prefijo", () => randomBytes(32).toString("base64url")],
    ["vacía", () => ""],
  ])("%s: 401, 0 operaciones ejecutadas, sin eco", async (_n, fabricar) => {
    const { atender, llamadas, bd } = await montar();
    const intento = fabricar();
    const antes = JSON.stringify(
      (await bd.db.query(`select tipo, estado from ${ESQUEMA}.licencias order by tipo`)).rows,
    );
    const r = await atender(
      peticion(op("suspender_licencia", { tipo: "A" }), { credencial: intento }),
    );
    expect(r.status).toBe(401);
    const t = await r.text();
    if (intento) {
      expect(t).not.toContain(intento);
      expect(consola.join("\n")).not.toContain(intento);
    }
    expect(llamadas.filter((l) => l.startsWith("operar_") && l !== "operar_contar_fallo")).toEqual(
      [],
    );
    expect(
      JSON.stringify(
        (await bd.db.query(`select tipo, estado from ${ESQUEMA}.licencias order by tipo`)).rows,
      ),
    ).toBe(antes);
  });

  it("5 fallos desde un origen lo bloquean (429), también con la credencial válida; otro origen no", async () => {
    const { atender } = await montar({ local: false });
    const desde = (ip: string, credencial: string) =>
      peticion(op("resumen"), { credencial, cabeceras: { "x-vercel-forwarded-for": ip } });
    for (let i = 0; i < 4; i++)
      expect((await atender(desde(IP, credencialAjena()))).status).toBe(401);
    expect((await atender(desde(IP, credencialAjena()))).status).toBe(429);
    const valida = await atender(desde(IP, CREDENCIAL));
    expect(valida.status).toBe(429);
    expect(await json(valida)).toEqual({ resultado: "origen_bloqueado" });
    expect((await atender(desde("203.0.113.8", CREDENCIAL))).status).toBe(200);
  });

  // MENOR-2 del revisor: sin cabecera o mal formada nunca puede coincidir, y contarla sería una escritura
  // más sobre el grupo de gestión (máximo 2 conexiones). Solo cuenta la credencial bien formada y errónea.
  it("sin Authorization o mal formada no cuenta fallo; la bien formada y errónea sí (5 bloquean, la sexta válida da 429)", async () => {
    const { atender, llamadas } = await montar({ local: false });
    const desde = (credencial: string | null) =>
      peticion(op("resumen"), { credencial, cabeceras: { "x-vercel-forwarded-for": IP } });
    for (let i = 0; i < 5; i++) expect((await atender(desde(null))).status).toBe(401);
    for (const mala of ["hia_op_corta", "", randomBytes(8).toString("base64url")]) {
      expect((await atender(desde(mala))).status).toBe(401);
    }
    expect(llamadas).toEqual([]);
    for (let i = 0; i < 4; i++) expect((await atender(desde(credencialAjena()))).status).toBe(401);
    expect((await atender(desde(credencialAjena()))).status).toBe(429);
    expect((await atender(desde(CREDENCIAL))).status).toBe(429);
  });

  it("la decisión sobre la credencial es solo de secretos.coincideHuellaOperacion (tiempo constante)", async () => {
    const { atender } = await montar();
    // Recibe la credencial tal cual y la huella configurada.
    expect((await atender(peticion(op("resumen")))).status).toBe(200);
    expect(comparacion.llamadas).toEqual([[CREDENCIAL, HUELLA]]);
    // La decisión depende solo de ella, en los dos sentidos: ninguna comparación `===`/`!==` con la huella
    // la sustituye ni la completa.
    comparacion.forzar = false;
    expect((await atender(peticion(op("resumen")))).status).toBe(401);
    comparacion.forzar = true;
    expect((await atender(peticion(op("resumen"), { credencial: credencialAjena() }))).status).toBe(
      200,
    );
  });

  it("fuera de local sin x-vercel-forwarded-for: 403 sin evaluar nada (ni siquiera contar el fallo)", async () => {
    const { atender, llamadas } = await montar({ local: false });
    for (const credencial of [CREDENCIAL, credencialAjena(), null]) {
      const r = await atender(peticion(op("resumen"), { credencial }));
      expect(r.status).toBe(403);
    }
    // Cabecera falsificable que no cuenta.
    const r = await atender(peticion(op("resumen"), { cabeceras: { "x-forwarded-for": IP } }));
    expect(r.status).toBe(403);
    expect(llamadas).toEqual([]);
  });
});

describe("cierre en fallo", () => {
  it("almacén caído: 503 con cuerpo fijo, tanto en la operación como al contar el fallo", async () => {
    const { atender: sinCapa } = await montar({ caido: true });
    const atender = manejador("/api/operacion", sinCapa);
    for (const credencial of [CREDENCIAL, "hia_op_" + randomBytes(32).toString("base64url")]) {
      const r = await atender(peticion(op("resumen"), { credencial }));
      expect(r.status).toBe(503);
      expect(await r.text()).not.toContain(CANARIO);
    }
  });

  it("un resultado desconocido de la base nunca es éxito", async () => {
    const bd = await abrir();
    const real = await crearAlmacenPglite(bd, ROL_GESTION);
    const atender = crearOperaciones({
      configuracion: cargarConfiguracionConector,
      autorizacion: () =>
        crearAutorizacion({
          llamar: (f, a) =>
            f === "operar_generar_codigo"
              ? Promise.resolve({ resultado: "exito" })
              : real.llamar(f, a),
        }),
      entorno: () => "desarrollo",
      local: () => true,
    });
    await expect(atender(peticion(op("generar_codigo", { tipo: "A" })))).rejects.toBeInstanceOf(
      ErrorDeAplicacion,
    );
  });
});

describe("cierre en fallo: resultado fuera de la tabla (MENOR-3 del revisor)", () => {
  // Un Autorizacion falso devuelve un resultado que ni es éxito ni está en la tabla de estados: 500, nunca
  // 200. Incluye nombres heredados de Object.prototype, que una búsqueda `tabla[resultado]` aceptaría.
  it.each(["exito", "constructor", "toString", "__proto__", "hasOwnProperty", ""])(
    "resultado %j: 500 con cuerpo fijo",
    async (resultado) => {
      const falso = new Proxy(
        {},
        { get: () => () => Promise.resolve({ resultado, sucesos: [], conexiones: [] }) },
      ) as unknown as Autorizacion;
      const atender = crearOperaciones({
        configuracion: cargarConfiguracionConector,
        autorizacion: () => falso,
        entorno: () => "desarrollo",
        local: () => true,
      });
      const r = await atender(peticion(op("suspender_licencia", { tipo: "A" })));
      expect(r.status).toBe(500);
      expect(await r.text()).toBe('{"error":"error_interno"}');
    },
  );
});

describe("PRUEBA-021: producción, 404 antes de leer nada", () => {
  for (const entornoDe of ["produccion", undefined] as const) {
    it(`entorno ${entornoDe ?? "no válido"}: 404 sin leer cuerpo, cabeceras ni configuración, y 0 llamadas`, async () => {
      vi.stubEnv("CONECTOR_SECRETO", "no válido");
      let llamadas = 0;
      const leida = vi.fn(() => cargarConfiguracionConector());
      const atender = crearOperaciones({
        configuracion: leida,
        autorizacion: () =>
          crearAutorizacion({
            llamar: () => {
              llamadas++;
              return Promise.reject(new Error("no"));
            },
          }),
        entorno: () => entornoDe,
        local: () => true,
      });
      for (const metodo of ["POST", "GET", "PUT", "DELETE"]) {
        const p = peticion(op("generar_codigo", { tipo: "A" }), { metodo });
        const r = await atender(p);
        expect(r.status).toBe(404);
        expect(r.headers.get("cache-control")).toBe("no-store");
        expect(await r.text()).toBe("");
        expect(p.bodyUsed).toBe(false);
      }
      expect(leida).not.toHaveBeenCalled();
      expect(llamadas).toBe(0);
    });
  }
});

describe("PRUEBA-023 (parte B): tras cerrar_prueba", () => {
  it("lo que escribe se rechaza con `cerrada` (409) y lo de lectura sigue", async () => {
    const { atender, bd } = await montar();
    const s = await sembrar(bd, "A");
    expect((await json(await atender(peticion(op("cerrar_prueba"))))).resultado).toBe(
      "prueba_cerrada",
    );
    expect((await json(await atender(peticion(op("cerrar_prueba"))))).resultado).toBe("ya_cerrada");
    for (const cuerpo of [
      op("generar_codigo", { tipo: "A" }),
      op("suspender_licencia", { tipo: "A" }),
      op("reactivar_licencia", { tipo: "A" }),
      op("crear_orden", { tipo: "A", orden: "pausar" }),
      op("revocar_conexion", { conexion: s.conexionId }),
    ]) {
      const r = await atender(peticion(cuerpo));
      expect(r.status, cuerpo.operacion).toBe(409);
      expect(await json(r)).toEqual({ operacion: cuerpo.operacion, resultado: "cerrada" });
    }
    expect((await atender(peticion(op("resumen")))).status).toBe(200);
    expect((await atender(peticion(op("listar_conexiones")))).status).toBe(200);
    expect((await atender(peticion(op("exportar_sucesos", { dia: "2026-11-21" })))).status).toBe(
      200,
    );
    const sin = await una<{ n: string }>(
      bd,
      `select count(*)::text as n from ${ESQUEMA}.codigos_activacion where usado_en is null`,
    );
    expect(sin.n).toBe("0");
  });
});
