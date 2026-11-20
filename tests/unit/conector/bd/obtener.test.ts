// T-103 (d) (001): `mcp_obtener_instrucciones` en PGlite. PRUEBA-015 (parte BD: estados y entrega de la
// orden) y PRUEBA-014 (parte: A no ve nada de B; B idéntico). No sustituye a Postgres real de Supabase
// ni a pgTAP (CI).
import { describe, expect, it } from "vitest";
import { crearAlmacenPglite, ROLES_SUPABASE, type BdApoyo } from "../../../conector/apoyo/index";
import {
  abrir,
  cerrarAlFinal,
  comprobarForma,
  ESQUEMA,
  estado,
  hmacDe,
  huellaDeLicencia,
  RECURSO,
  ROL_GESTION,
  ROL_MCP,
  sembrar,
  sembrarOrden,
  UUID_RE,
  una,
} from "./comun";

cerrarAlFinal();

interface Respuesta {
  resultado: string;
  estado?: string;
  ejecucion_id?: string;
  orden?: { id: string; tipo: string } | null;
}
async function obtener(bd: BdApoyo, hmac: unknown, recurso: unknown = RECURSO) {
  const almacen = await crearAlmacenPglite(bd, ROL_MCP);
  return (await almacen.llamar("mcp_obtener_instrucciones", [hmac, recurso])) as Respuesta;
}
const filaOrden = (bd: BdApoyo, id: string) =>
  una<{ estado: string; entregada_en: string | null }>(
    bd,
    `select estado::text, entregada_en::text from ${ESQUEMA}.ordenes where id = $1`,
    [id],
  );

describe("T-103 (d): mcp_obtener_instrucciones, estados (PRUEBA-015, parte BD)", () => {
  it("sin órdenes: activa, sin orden, y abre una ejecución de su conexión y licencia", async () => {
    const bd = await abrir();
    const a = await sembrar(bd, "A");
    const r = await obtener(bd, a.acceso.hmac);
    expect(r).toEqual({
      resultado: "servido",
      estado: "activa",
      ejecucion_id: expect.any(String),
      orden: null,
    });
    expect(r.ejecucion_id).toMatch(UUID_RE);
    const e = await una<Record<string, string | null>>(
      bd,
      `select conexion_id::text, licencia_id::text, estado_servido::text, cerrada_en::text
         from ${ESQUEMA}.ejecuciones where id = $1`,
      [r.ejecucion_id],
    );
    expect(e).toEqual({
      conexion_id: a.conexionId,
      licencia_id: a.licenciaId,
      estado_servido: "activa",
      cerrada_en: null,
    });
  });

  it("cada llamada abre su propia ejecución", async () => {
    const bd = await abrir();
    const a = await sembrar(bd, "A");
    const r1 = await obtener(bd, a.acceso.hmac);
    const r2 = await obtener(bd, a.acceso.hmac);
    expect(r1.ejecucion_id).not.toBe(r2.ejecucion_id);
    expect(
      (await una<{ n: number }>(bd, `select count(*)::int as n from ${ESQUEMA}.ejecuciones`)).n,
    ).toBe(2);
  });

  it("entrega la orden pendiente y la marca entregada; después la sigue entregando sin cambiar su marca", async () => {
    const bd = await abrir();
    const a = await sembrar(bd, "A");
    const orden = await sembrarOrden(bd, a.licenciaId, "pausar", "pendiente");
    const r1 = await obtener(bd, a.acceso.hmac);
    expect(r1.estado).toBe("pausada");
    expect(r1.orden).toEqual({ id: orden, tipo: "pausar" });
    const tras1 = await filaOrden(bd, orden);
    expect(tras1.estado).toBe("entregada");
    expect(tras1.entregada_en).not.toBeNull();
    await bd.reloj.avanzar(10_000);
    const r2 = await obtener(bd, a.acceso.hmac);
    expect(r2.orden).toEqual({ id: orden, tipo: "pausar" });
    expect(await filaOrden(bd, orden)).toEqual(tras1);
  });

  it("estado según la última orden no anulada: pausar -> pausada; reanudar posterior -> activa; la anulada no cuenta", async () => {
    const bd = await abrir();
    const a = await sembrar(bd, "A");
    // Una pausa ya confirmada deja la licencia pausada y no se vuelve a entregar.
    const p = await sembrarOrden(bd, a.licenciaId, "pausar", "confirmada", "1 hour");
    const r1 = await obtener(bd, a.acceso.hmac);
    expect(r1).toMatchObject({ estado: "pausada", orden: null });
    expect((await filaOrden(bd, p)).estado).toBe("confirmada");
    // Una reanudación posterior, pendiente, la hace activa y se entrega.
    const rea = await sembrarOrden(bd, a.licenciaId, "reanudar", "pendiente", "30 minutes");
    const r2 = await obtener(bd, a.acceso.hmac);
    expect(r2).toMatchObject({ estado: "activa", orden: { id: rea, tipo: "reanudar" } });
    // Una pausa posterior pero anulada no cuenta.
    await sembrarOrden(bd, a.licenciaId, "pausar", "anulada", "10 minutes");
    const r3 = await obtener(bd, a.acceso.hmac);
    expect(r3.estado).toBe("activa");
  });

  it("suspendida: estado suspendida, ninguna orden, la pendiente sigue pendiente y se abre la ejecución", async () => {
    const bd = await abrir();
    const a = await sembrar(bd, "A");
    const orden = await sembrarOrden(bd, a.licenciaId, "pausar", "pendiente");
    await bd.db.query(`update ${ESQUEMA}.licencias set estado = 'suspendida' where tipo = 'A'`);
    const r = await obtener(bd, a.acceso.hmac);
    expect(r).toEqual({
      resultado: "servido",
      estado: "suspendida",
      ejecucion_id: expect.any(String),
      orden: null,
    });
    expect(await filaOrden(bd, orden)).toEqual({ estado: "pendiente", entregada_en: null });
    expect(
      (
        await una<{ e: string }>(
          bd,
          `select estado_servido::text as e from ${ESQUEMA}.ejecuciones where id = $1`,
          [r.ejecucion_id],
        )
      ).e,
    ).toBe("suspendida");
  });

  it("reactivada la licencia, la orden pendiente se entrega", async () => {
    const bd = await abrir();
    const a = await sembrar(bd, "A");
    const orden = await sembrarOrden(bd, a.licenciaId, "pausar", "pendiente");
    await bd.db.query(`update ${ESQUEMA}.licencias set estado = 'suspendida' where tipo = 'A'`);
    await obtener(bd, a.acceso.hmac);
    await bd.db.query(`update ${ESQUEMA}.licencias set estado = 'activa' where tipo = 'A'`);
    const r = await obtener(bd, a.acceso.hmac);
    expect(r).toMatchObject({ estado: "pausada", orden: { id: orden, tipo: "pausar" } });
  });
});

describe("T-103 (d): cierre en fallo", () => {
  it("token o recurso no válido -> no_autorizado, sin efecto y sin eco", async () => {
    const bd = await abrir();
    const a = await sembrar(bd, "A");
    await sembrarOrden(bd, a.licenciaId, "pausar", "pendiente");
    const antes = await estado(bd);
    const casos: [string, unknown, unknown][] = [
      ["hmac desconocido", hmacDe("desconocido"), RECURSO],
      ["hmac nulo", null, RECURSO],
      ["recurso nulo", a.acceso.hmac, null],
      ["recurso de otro servidor", a.acceso.hmac, "https://otro.ejemplo.test/api/mcp"],
      ["token en claro", a.acceso.valor, RECURSO],
      ["hmac en mayúsculas", a.acceso.hmac.toUpperCase(), RECURSO],
      ["vacío", "", ""],
      ["recurso larguísimo", a.acceso.hmac, "https://" + "a".repeat(400)],
    ];
    for (const [nombre, hmac, recurso] of casos) {
      const r = await obtener(bd, hmac, recurso);
      expect(r, nombre).toEqual({ resultado: "no_autorizado" });
      if (typeof hmac === "string" && hmac !== "")
        expect(JSON.stringify(r), nombre).not.toContain(hmac);
    }
    expect(await estado(bd)).toEqual(antes);
  });

  it("token caducado (300 s), token revocado, conexión revocada o licencia revocada -> no_autorizado sin efecto", async () => {
    const bd = await abrir();
    const a = await sembrar(bd, "A");
    const antes = await estado(bd);
    await bd.reloj.avanzar(300_000);
    expect(await obtener(bd, a.acceso.hmac), "300 s").toEqual({ resultado: "no_autorizado" });
    expect(await estado(bd)).toEqual(antes);

    const bd2 = await abrir();
    const x = await sembrar(bd2, "A");
    await bd2.db.query(`update ${ESQUEMA}.tokens set revocado_en = now() where token_hmac = $1`, [
      x.acceso.hmac,
    ]);
    expect(await obtener(bd2, x.acceso.hmac), "token revocado").toEqual({
      resultado: "no_autorizado",
    });

    const bd3 = await abrir();
    const y = await sembrar(bd3, "A");
    await bd3.db.query(
      `update ${ESQUEMA}.conexiones set revocada_en = now(), motivo_revocacion = 'operador'`,
    );
    expect(await obtener(bd3, y.acceso.hmac), "conexión revocada").toEqual({
      resultado: "no_autorizado",
    });

    const bd4 = await abrir();
    const z = await sembrar(bd4, "A");
    await bd4.db.query(`update ${ESQUEMA}.licencias set estado = 'revocada' where tipo = 'A'`);
    expect(await obtener(bd4, z.acceso.hmac), "licencia revocada").toEqual({
      resultado: "no_autorizado",
    });
    for (const b of [bd2, bd3, bd4]) {
      expect(
        (await una<{ n: number }>(b, `select count(*)::int as n from ${ESQUEMA}.ejecuciones`)).n,
      ).toBe(0);
    }
  });
});

describe("T-103 (d): aislamiento entre clientes (PRUEBA-014, parte)", () => {
  it("A no ve ni toca nada de B, y B queda idéntico", async () => {
    const bd = await abrir();
    const a = await sembrar(bd, "A");
    const b = await sembrar(bd, "B", "chatgpt");
    const ordenB = await sembrarOrden(bd, b.licenciaId, "pausar", "pendiente");
    const ordenA = await sembrarOrden(bd, a.licenciaId, "reanudar", "pendiente");
    const antesB = await huellaDeLicencia(bd, b.licenciaId);
    const rA = await obtener(bd, a.acceso.hmac);
    expect(rA).toMatchObject({ estado: "activa", orden: { id: ordenA, tipo: "reanudar" } });
    expect(JSON.stringify(rA)).not.toContain(ordenB);
    expect(JSON.stringify(rA)).not.toContain(b.licenciaId);
    expect(await huellaDeLicencia(bd, b.licenciaId)).toBe(antesB);
    // B ve lo suyo, y lo de A no se ha movido por ello.
    const rB = await obtener(bd, b.acceso.hmac);
    expect(rB).toMatchObject({ estado: "pausada", orden: { id: ordenB, tipo: "pausar" } });
    expect((await filaOrden(bd, ordenA)).estado).toBe("entregada");
  });

  it("la ejecución abierta es siempre de la licencia y la conexión del token", async () => {
    const bd = await abrir();
    const a = await sembrar(bd, "A");
    const b = await sembrar(bd, "B");
    await obtener(bd, a.acceso.hmac);
    await obtener(bd, b.acceso.hmac);
    const filas = (
      await bd.db.query<{ l: string; c: string }>(
        `select licencia_id::text as l, conexion_id::text as c from ${ESQUEMA}.ejecuciones`,
      )
    ).rows;
    expect(filas.map((f) => `${f.l}|${f.c}`).sort()).toEqual(
      [`${a.licenciaId}|${a.conexionId}`, `${b.licenciaId}|${b.conexionId}`].sort(),
    );
  });
});

describe("T-103 (d): forma de la función", () => {
  it("security definer, search_path fijo, solo el rol mcp la ejecuta, sin cliente ni licencia de entrada", async () => {
    const bd = await abrir();
    await comprobarForma(
      bd,
      "mcp_obtener_instrucciones",
      "text,text",
      ["p_token_hmac", "p_recurso"],
      "$1, $2",
      [hmacDe("x"), RECURSO],
      { permitido: ROL_MCP, prohibidos: [ROL_GESTION, ...ROLES_SUPABASE] },
    );
  });
});
