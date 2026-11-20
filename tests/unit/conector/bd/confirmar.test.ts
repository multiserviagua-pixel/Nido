// T-103 (f) (001): `mcp_confirmar_orden` en PGlite. PRUEBA-007 (parte: 10 llamadas -> 1 `confirmada`; una
// sola conexión, NO demuestra carreras: queda para la 008), PRUEBA-015 (parte: ciclo orden entregada ->
// confirmada y estados) y PRUEBA-014 (parte: A no confirma lo de B; B idéntico). No sustituye a Postgres
// real de Supabase ni a pgTAP (CI).
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
  una,
} from "./comun";

cerrarAlFinal();

async function confirmar(bd: BdApoyo, hmac: unknown, orden: unknown, recurso: unknown = RECURSO) {
  const almacen = await crearAlmacenPglite(bd, ROL_MCP);
  return (await almacen.llamar("mcp_confirmar_orden", [hmac, recurso, orden])) as {
    resultado: string;
  };
}
async function obtener(bd: BdApoyo, hmac: string) {
  const almacen = await crearAlmacenPglite(bd, ROL_MCP);
  return (await almacen.llamar("mcp_obtener_instrucciones", [hmac, RECURSO])) as {
    estado: string;
    orden: { id: string; tipo: string } | null;
  };
}
const fila = (bd: BdApoyo, id: string) =>
  una<{ estado: string; entregada_en: string | null; confirmada_en: string | null }>(
    bd,
    `select estado::text, entregada_en::text, confirmada_en::text from ${ESQUEMA}.ordenes where id = $1`,
    [id],
  );

describe("T-103 (f): mcp_confirmar_orden (PRUEBA-015, parte BD)", () => {
  it("confirma una orden entregada de su licencia y fija confirmada_en", async () => {
    const bd = await abrir();
    const a = await sembrar(bd, "A");
    const orden = await sembrarOrden(bd, a.licenciaId, "pausar", "entregada");
    expect(await confirmar(bd, a.acceso.hmac, orden)).toEqual({ resultado: "confirmada" });
    const f = await fila(bd, orden);
    expect(f.estado).toBe("confirmada");
    expect(f.entregada_en).not.toBeNull();
    expect(f.confirmada_en).not.toBeNull();
  });

  it("ciclo completo: obtener entrega la orden, confirmar la cierra y la siguiente obtener ya no la entrega", async () => {
    const bd = await abrir();
    const a = await sembrar(bd, "A");
    const orden = await sembrarOrden(bd, a.licenciaId, "pausar", "pendiente");
    const r1 = await obtener(bd, a.acceso.hmac);
    expect(r1).toMatchObject({ estado: "pausada", orden: { id: orden, tipo: "pausar" } });
    expect(await confirmar(bd, a.acceso.hmac, orden)).toEqual({ resultado: "confirmada" });
    const r2 = await obtener(bd, a.acceso.hmac);
    expect(r2).toMatchObject({ estado: "pausada", orden: null });
  });

  it("una orden pendiente (aún no entregada) no se confirma: no_confirmada y sin efecto", async () => {
    const bd = await abrir();
    const a = await sembrar(bd, "A");
    const orden = await sembrarOrden(bd, a.licenciaId, "pausar", "pendiente");
    const antes = await estado(bd);
    expect(await confirmar(bd, a.acceso.hmac, orden)).toEqual({ resultado: "no_confirmada" });
    expect(await estado(bd)).toEqual(antes);
  });

  it("una orden anulada no se confirma: no_confirmada y sin efecto", async () => {
    const bd = await abrir();
    const a = await sembrar(bd, "A");
    const orden = await sembrarOrden(bd, a.licenciaId, "reanudar", "anulada");
    const antes = await estado(bd);
    expect(await confirmar(bd, a.acceso.hmac, orden)).toEqual({ resultado: "no_confirmada" });
    expect(await estado(bd)).toEqual(antes);
  });

  it("orden inexistente, mal formada o nula -> no_confirmada, sin efecto y sin eco", async () => {
    const bd = await abrir();
    const a = await sembrar(bd, "A");
    await sembrarOrden(bd, a.licenciaId, "pausar", "entregada");
    const antes = await estado(bd);
    const casos: unknown[] = [
      "00000000-0000-4000-8000-000000000999",
      "no-es-un-uuid",
      "",
      null,
      "00000000-0000-4000-8000-000000000999; drop table x",
    ];
    for (const c of casos) {
      const r = await confirmar(bd, a.acceso.hmac, c);
      expect(r, String(c)).toEqual({ resultado: "no_confirmada" });
      if (typeof c === "string" && c !== "") expect(JSON.stringify(r)).not.toContain(c);
    }
    expect(await estado(bd)).toEqual(antes);
  });
});

describe("T-103 (f): idempotencia (PRUEBA-007, parte; una sola conexión, sin carreras)", () => {
  it("10 llamadas iguales -> 1 confirmada y 9 repetida; la marca de tiempo no se mueve", async () => {
    const bd = await abrir();
    const a = await sembrar(bd, "A");
    const orden = await sembrarOrden(bd, a.licenciaId, "pausar", "entregada");
    const resultados: string[] = [];
    let primera: Awaited<ReturnType<typeof fila>> | null = null;
    for (let i = 0; i < 10; i++) {
      resultados.push((await confirmar(bd, a.acceso.hmac, orden)).resultado);
      if (i === 0) primera = await fila(bd, orden);
      await bd.reloj.avanzar(1000);
    }
    expect(resultados).toEqual(["confirmada", ...Array<string>(9).fill("repetida")]);
    expect(await fila(bd, orden)).toEqual(primera);
    expect(
      (
        await una<{ n: number }>(
          bd,
          `select count(*)::int as n from ${ESQUEMA}.ordenes where estado = 'confirmada'`,
        )
      ).n,
    ).toBe(1);
  });
});

describe("T-103 (f): cierre en fallo", () => {
  it("token o recurso no válido -> no_autorizado, sin efecto y sin eco", async () => {
    const bd = await abrir();
    const a = await sembrar(bd, "A");
    const orden = await sembrarOrden(bd, a.licenciaId, "pausar", "entregada");
    const antes = await estado(bd);
    const casos: [string, unknown, unknown][] = [
      ["hmac desconocido", hmacDe("desconocido"), RECURSO],
      ["hmac nulo", null, RECURSO],
      ["recurso nulo", a.acceso.hmac, null],
      ["recurso de otro servidor", a.acceso.hmac, "https://otro.ejemplo.test/api/mcp"],
      ["token en claro", a.acceso.valor, RECURSO],
      ["hmac en mayúsculas", a.acceso.hmac.toUpperCase(), RECURSO],
    ];
    for (const [nombre, hmac, recurso] of casos) {
      const r = await confirmar(bd, hmac, orden, recurso);
      expect(r, nombre).toEqual({ resultado: "no_autorizado" });
    }
    expect(await estado(bd)).toEqual(antes);
  });

  it("token caducado a los 300 s, o licencia o conexión revocada -> no_autorizado sin efecto", async () => {
    const bd = await abrir();
    const a = await sembrar(bd, "A");
    const orden = await sembrarOrden(bd, a.licenciaId, "pausar", "entregada");
    const antes = await estado(bd);
    await bd.reloj.avanzar(300_000);
    expect(await confirmar(bd, a.acceso.hmac, orden)).toEqual({ resultado: "no_autorizado" });
    expect(await estado(bd)).toEqual(antes);

    const bd2 = await abrir();
    const b = await sembrar(bd2, "A");
    const orden2 = await sembrarOrden(bd2, b.licenciaId, "pausar", "entregada");
    await bd2.db.query(
      `update ${ESQUEMA}.conexiones set revocada_en = now(), motivo_revocacion = 'operador'`,
    );
    expect(await confirmar(bd2, b.acceso.hmac, orden2)).toEqual({ resultado: "no_autorizado" });
    expect((await fila(bd2, orden2)).estado).toBe("entregada");
  });

  it("el identificador de la orden en mayúsculas se trata igual que en minúsculas", async () => {
    const bd = await abrir();
    const a = await sembrar(bd, "A");
    const orden = await sembrarOrden(bd, a.licenciaId, "pausar", "entregada");
    expect(await confirmar(bd, a.acceso.hmac, orden.toUpperCase())).toEqual({
      resultado: "confirmada",
    });
    expect(await confirmar(bd, a.acceso.hmac, orden)).toEqual({ resultado: "repetida" });
  });

  it("con la licencia suspendida se puede confirmar una orden ya entregada", async () => {
    const bd = await abrir();
    const a = await sembrar(bd, "A");
    const orden = await sembrarOrden(bd, a.licenciaId, "pausar", "entregada");
    await bd.db.query(`update ${ESQUEMA}.licencias set estado = 'suspendida' where tipo = 'A'`);
    expect(await confirmar(bd, a.acceso.hmac, orden)).toEqual({ resultado: "confirmada" });
  });
});

describe("T-103 (f): aislamiento entre clientes (PRUEBA-014, parte)", () => {
  it("A no confirma una orden de B (no_confirmada, igual que una inexistente) y B queda idéntico", async () => {
    const bd = await abrir();
    const a = await sembrar(bd, "A");
    const b = await sembrar(bd, "B", "chatgpt");
    const ordenB = await sembrarOrden(bd, b.licenciaId, "pausar", "entregada");
    const antesB = await huellaDeLicencia(bd, b.licenciaId);
    const antes = await estado(bd);
    const r = await confirmar(bd, a.acceso.hmac, ordenB);
    expect(r).toEqual({ resultado: "no_confirmada" });
    expect(await huellaDeLicencia(bd, b.licenciaId)).toBe(antesB);
    expect(await estado(bd)).toEqual(antes);
    // Tampoco distingue lo ya confirmado de B de lo inexistente.
    expect(await confirmar(bd, b.acceso.hmac, ordenB)).toEqual({ resultado: "confirmada" });
    expect(await confirmar(bd, a.acceso.hmac, ordenB)).toEqual({ resultado: "no_confirmada" });
  });

  it("cada cliente confirma solo lo suyo", async () => {
    const bd = await abrir();
    const a = await sembrar(bd, "A");
    const b = await sembrar(bd, "B");
    const ordenA = await sembrarOrden(bd, a.licenciaId, "pausar", "entregada");
    const ordenB = await sembrarOrden(bd, b.licenciaId, "reanudar", "entregada");
    expect(await confirmar(bd, a.acceso.hmac, ordenA)).toEqual({ resultado: "confirmada" });
    expect((await fila(bd, ordenB)).estado).toBe("entregada");
    expect(await confirmar(bd, b.acceso.hmac, ordenB)).toEqual({ resultado: "confirmada" });
  });
});

describe("T-103 (f): forma de la función", () => {
  it("security definer, search_path fijo, solo el rol mcp la ejecuta, sin cliente ni licencia de entrada", async () => {
    const bd = await abrir();
    await comprobarForma(
      bd,
      "mcp_confirmar_orden",
      "text,text,text",
      ["p_token_hmac", "p_recurso", "p_orden"],
      "$1, $2, $3",
      [hmacDe("x"), RECURSO, "x"],
      { permitido: ROL_MCP, prohibidos: [ROL_GESTION, ...ROLES_SUPABASE] },
    );
  });
});
