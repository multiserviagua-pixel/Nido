// T-112 (b) (001): aislamiento entre las licencias A y B por HTTP en proceso (manejadores reales de
// `src/app/api/**` y `/oauth/**`, PGlite detrás, sin red). PRUEBA-014 (CAD-015 entero; el estado de B,
// idéntico antes y después) y PRUEBA-013 (revocar una conexión). Datos ficticios, compuestos en ejecución.
//
// Mutaciones que estas pruebas detectan (art. 13: una prueba que no puede fallar no es una prueba):
//  - M1: `confirmar_orden` o `mcp_confirmar_orden` sin filtrar por licencia -> la orden entregada de B sale
//    `confirmada: true` y el estado de B cambia.
//  - M2: `enviar_informe` sin exigir la misma conexión -> el `ejecucion_id` de otra conexión de A o de B se
//    guarda (`guardado: true`) y deja de ser distinguible de lo inexistente.
//  - M3 (no aplicada a mano en T-112; pendiente): aceptar `licencia_id` (o similar) como campo de entrada -> la ejecución nace en B o se guarda en B.
//  - M4: `revocar_conexion` que no fecha la conexión o revoca la licencia entera -> la conexión revocada
//    sigue valiendo o la otra conexión de A deja de valer.
import { randomUUID } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  cerrarAlFinal,
  ESQUEMA,
  huellaDeLicencia,
  otraConexion,
  sembrarOrden,
  una,
} from "../unit/conector/bd/comun";
import { informeValido, RECURSO, montarServidor, type Servidor } from "./apoyo-http";

vi.mock("../../src/lib/supabase/conector", async (o) =>
  (await import("./apoyo-http")).sustitutoConector(await o()),
);
vi.mock("../../src/lib/supabase/autorizacion", async (o) =>
  (await import("./apoyo-http")).sustitutoAutorizacion(await o()),
);
vi.mock("next/server", async (o) => (await import("./apoyo-http")).sustitutoNextServer(await o()));

cerrarAlFinal();

let s: Servidor;
beforeEach(async () => {
  s = await montarServidor();
});
afterEach(async () => {
  await s.cerrar();
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

const esDesconocida = (c: Record<string, unknown> | null) =>
  c !== null && c.guardado === false && c.motivo === "ejecucion_desconocida";

/** Token con conexión propia en una licencia ya existente (la fábrica del servidor firma con la clave del conector). */
async function conexionDe(licenciaId: string) {
  const { acceso } = await (async () => {
    const o = await otraConexion(s.bd, licenciaId);
    // `otraConexion` usa la fábrica de pruebas de BD (otra clave de HMAC): se resiembra el token con la del conector.
    const t = s.fabrica.token("acceso");
    await s.bd.db.query(
      `update ${ESQUEMA}.tokens set token_hmac = $1, recurso = $3 where conexion_id = $2 and tipo = 'acceso'`,
      [t.hmac, o.conexionId, RECURSO],
    );
    return { acceso: t, conexionId: o.conexionId };
  })();
  return acceso.valor;
}

describe("PRUEBA-014 · CAD-015: casos cruzados con el token de A", () => {
  it("ejecucion_id de B, de otra conexión de A e inexistente dan la misma respuesta; B no cambia", async () => {
    const a1 = await s.sembrar("A");
    const b = await s.sembrar("B");
    const tokenA2 = await conexionDe(a1.licenciaId);
    // Cada una abre su ejecución (B y A2 tienen una abierta que A1 no puede tocar).
    const ejB = (await s.herramienta(b.acceso.valor, "obtener_instrucciones", {})).contenido!
      .ejecucion_id as string;
    const ejA2 = (await s.herramienta(tokenA2, "obtener_instrucciones", {})).contenido!
      .ejecucion_id as string;
    const antes = {
      b: await huellaDeLicencia(s.bd, b.licenciaId),
    };

    const casos = [ejB, ejA2, randomUUID()];
    const salidas: string[] = [];
    for (const id of casos) {
      const r = await s.herramienta(a1.acceso.valor, "enviar_informe", {
        ejecucion_id: id,
        informe: informeValido(),
      });
      expect(r.status).toBe(200);
      expect(esDesconocida(r.contenido)).toBe(true);
      salidas.push(JSON.stringify(r.contenido));
    }
    // Idénticas entre sí: no se distingue ajeno de inexistente.
    expect(new Set(salidas).size).toBe(1);

    // El estado de B es idéntico antes y después.
    expect(await huellaDeLicencia(s.bd, b.licenciaId)).toBe(antes.b);
    // Y nada se guardó: ningún informe en ninguna licencia.
    expect(
      (await una<{ n: number }>(s.bd, `select count(*)::int as n from ${ESQUEMA}.informes`)).n,
    ).toBe(0);
    // Las ejecuciones ajenas siguen abiertas para sus dueños (el intento no las consumió).
    const rb = await s.herramienta(b.acceso.valor, "enviar_informe", {
      ejecucion_id: ejB,
      informe: informeValido(),
    });
    expect(rb.contenido).toMatchObject({ guardado: true });
    const ra2 = await s.herramienta(tokenA2, "enviar_informe", {
      ejecucion_id: ejA2,
      informe: informeValido(),
    });
    expect(ra2.contenido).toMatchObject({ guardado: true });
  });

  it("orden de B, inexistente y de A no entregada dan confirmada: false; la orden de B queda entregada", async () => {
    const a = await s.sembrar("A");
    const b = await s.sembrar("B");
    const ordenB = await sembrarOrden(s.bd, b.licenciaId, "pausar", "entregada");
    const ordenAPendiente = await sembrarOrden(s.bd, a.licenciaId, "pausar", "pendiente");
    const antesB = await huellaDeLicencia(s.bd, b.licenciaId);

    for (const id of [ordenB, randomUUID(), ordenAPendiente]) {
      const r = await s.herramienta(a.acceso.valor, "confirmar_orden", { orden_id: id });
      expect(r.status).toBe(200);
      expect(r.contenido).toEqual({ confirmada: false });
    }
    expect(await huellaDeLicencia(s.bd, b.licenciaId)).toBe(antesB);
    // La de A sigue pendiente (confirmar no la entregó ni la confirmó).
    const filaA = await una<{ estado: string }>(
      s.bd,
      `select estado::text from ${ESQUEMA}.ordenes where id = $1`,
      [ordenAPendiente],
    );
    expect(filaA.estado).toBe("pendiente");
    // Control positivo: B sí puede confirmar la suya (la prueba no es trivialmente falsa).
    const rb = await s.herramienta(b.acceso.valor, "confirmar_orden", { orden_id: ordenB });
    expect(rb.contenido).toEqual({ confirmada: true });
  });

  it("el identificador de B como campo, en cabecera, en la URL o en cookie no cambia nada", async () => {
    const a = await s.sembrar("A");
    const b = await s.sembrar("B");
    const ordenB = await sembrarOrden(s.bd, b.licenciaId, "pausar", "entregada");
    const antesB = await huellaDeLicencia(s.bd, b.licenciaId);
    const extras = {
      licencia_id: b.licenciaId,
      conexion_id: b.conexionId,
      cliente_id: b.licenciaId,
      tipo: "B",
      licencia: "B",
    };
    // obtener_instrucciones ignora argumentos: misma forma con y sin ellos.
    const sin = await s.herramienta(a.acceso.valor, "obtener_instrucciones", {});
    const con = await s.herramienta(a.acceso.valor, "obtener_instrucciones", extras);
    expect(con.status).toBe(200);
    expect(Object.keys(con.contenido!).sort()).toEqual(Object.keys(sin.contenido!).sort());
    expect(con.contenido!.orden).toBeNull();
    // La ejecución nace en la licencia de A, nunca en la de B.
    const ejs = await s.bd.db.query<{ licencia_id: string }>(
      `select licencia_id::text from ${ESQUEMA}.ejecuciones where id = $1::uuid`,
      [con.contenido!.ejecucion_id],
    );
    expect(ejs.rows[0]?.licencia_id).toBe(a.licenciaId);

    // enviar_informe y confirmar_orden con identificadores de B como campos de más.
    const e = await s.herramienta(a.acceso.valor, "enviar_informe", {
      ...extras,
      ejecucion_id: con.contenido!.ejecucion_id,
      informe: informeValido(),
    });
    expect(e.contenido).toMatchObject({ guardado: true });
    const informe = await una<{ licencia_id: string }>(
      s.bd,
      `select licencia_id::text from ${ESQUEMA}.informes limit 1`,
    );
    expect(informe.licencia_id).toBe(a.licenciaId);
    const c = await s.herramienta(a.acceso.valor, "confirmar_orden", {
      ...extras,
      orden_id: ordenB,
    });
    expect(c.contenido).toEqual({ confirmada: false });

    // Vías de la petición: cabecera, consulta y cookie con el identificador de B no mueven la licencia.
    const r = await s.fetch(`http://localhost:3000/api/mcp?licencia_id=${b.licenciaId}&tipo=B`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        accept: "application/json, text/event-stream",
        authorization: `Bearer ${a.acceso.valor}`,
        "x-licencia-id": b.licenciaId,
        cookie: `licencia_id=${b.licenciaId}`,
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "tools/call",
        params: { name: "obtener_instrucciones", arguments: {} },
      }),
    });
    expect(r.status).toBe(200);
    const ejecB = await una<{ n: number }>(
      s.bd,
      `select count(*)::int as n from ${ESQUEMA}.ejecuciones where licencia_id = $1`,
      [b.licenciaId],
    );
    expect(ejecB.n).toBe(0);
    // Todo lo de B (órdenes, ejecuciones, informes, conexiones) es idéntico.
    expect(await huellaDeLicencia(s.bd, b.licenciaId)).toBe(antesB);
    // La orden de B quedó entregada y sin tocar.
    expect(
      (
        await una<{ estado: string }>(
          s.bd,
          `select estado::text from ${ESQUEMA}.ordenes where id = $1`,
          [ordenB],
        )
      ).estado,
    ).toBe("entregada");
  });

  it("el token de A en la URL cuenta como sin token (401)", async () => {
    const a = await s.sembrar("A");
    const r = await s.fetch(`http://localhost:3000/api/mcp?access_token=${a.acceso.valor}`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        accept: "application/json, text/event-stream",
      },
      body: "{}",
    });
    expect(r.status).toBe(401);
    expect(r.headers.get("www-authenticate")).toContain("resource_metadata=");
    expect(s.consola.join("\n")).not.toContain(a.acceso.valor);
  });

  it("A y B a la vez, cada uno con su conexión: ejecuciones separadas y cuentas exactas", async () => {
    const a1 = await s.sembrar("A");
    const b = await s.sembrar("B");
    const tokenA2 = await conexionDe(a1.licenciaId);
    const respuestas = await Promise.all([
      s.herramienta(a1.acceso.valor, "obtener_instrucciones", {}),
      s.herramienta(tokenA2, "obtener_instrucciones", {}),
      s.herramienta(b.acceso.valor, "obtener_instrucciones", {}),
      s.herramienta(a1.acceso.valor, "obtener_instrucciones", {}),
    ]);
    expect(respuestas.map((r) => r.status)).toEqual([200, 200, 200, 200]);
    const ids = respuestas.map((r) => r.contenido!.ejecucion_id as string);
    expect(new Set(ids).size).toBe(4); // una ejecución por llamada
    const porLicencia = await s.bd.db.query<{ licencia_id: string; n: number }>(
      `select licencia_id::text, count(*)::int as n from ${ESQUEMA}.ejecuciones group by 1`,
    );
    const cuenta = Object.fromEntries(porLicencia.rows.map((f) => [f.licencia_id, f.n]));
    expect(cuenta[a1.licenciaId]).toBe(3);
    expect(cuenta[b.licenciaId]).toBe(1);
  });
});

describe("PRUEBA-013: revocar una conexión", () => {
  it("la conexión revocada se rechaza (401), la otra de A y la de B siguen y el resto no cambia", async () => {
    const a1 = await s.sembrar("A");
    const b = await s.sembrar("B");
    const tokenA2 = await conexionDe(a1.licenciaId);
    // Antes: las tres sirven.
    for (const t of [a1.acceso.valor, tokenA2, b.acceso.valor]) {
      expect((await s.herramienta(t, "obtener_instrucciones", {})).status).toBe(200);
    }
    const revocar = await s.operar("revocar_conexion", { conexion: a1.conexionId });
    expect(revocar.status).toBe(200);
    expect(revocar.json).toMatchObject({ operacion: "revocar_conexion", resultado: "revocada" });

    const rechazada = await s.herramienta(a1.acceso.valor, "obtener_instrucciones", {});
    expect(rechazada.status).toBe(401);
    expect((await s.herramienta(tokenA2, "obtener_instrucciones", {})).status).toBe(200);
    expect((await s.herramienta(b.acceso.valor, "obtener_instrucciones", {})).status).toBe(200);
    // B: solo creó ejecuciones al llamar él mismo; la revocación no tocó sus órdenes, informes ni conexiones.
    const filas = await s.bd.db.query<{ n: number }>(
      `select count(*)::int as n from ${ESQUEMA}.conexiones where licencia_id = $1 and revocada_en is null`,
      [b.licenciaId],
    );
    expect(filas.rows[0]?.n).toBe(1);
    // Revocar dos veces: la segunda no cambia nada y no abre nada (resultado distinto de «revocada»).
    const otra = await s.operar("revocar_conexion", { conexion: a1.conexionId });
    expect((otra.json as { resultado: string }).resultado).not.toBe("revocada");
    // Una conexión inexistente NO da lo mismo que una ya revocada: el diseño de la orden de la persona las
    // distingue (404 `conexion_desconocida` frente a 200 `sin_cambio`). No es una vía de A a B (solo la
    // persona, solo terminal); se fija el comportamiento real y queda anotado como diferencia (T-112).
    const nada = await s.operar("revocar_conexion", { conexion: randomUUID() });
    expect(nada.status).toBe(404);
    expect(nada.json).toEqual({ operacion: "revocar_conexion", resultado: "conexion_desconocida" });
    expect(otra.status).toBe(200);
    expect(otra.json).toEqual({ operacion: "revocar_conexion", resultado: "sin_cambio" });
  });

  it("revocar no depende de la licencia: el estado terminal de una no cierra la otra (sin cerrar_prueba)", async () => {
    const a = await s.sembrar("A");
    const b = await s.sembrar("B");
    await s.operar("revocar_conexion", { conexion: b.conexionId });
    expect((await s.herramienta(b.acceso.valor, "obtener_instrucciones", {})).status).toBe(401);
    expect((await s.herramienta(a.acceso.valor, "obtener_instrucciones", {})).status).toBe(200);
  });
});
