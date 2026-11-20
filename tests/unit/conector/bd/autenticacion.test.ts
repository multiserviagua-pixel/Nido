// T-103 (001): matriz negativa de autenticación, la misma sobre las CUATRO funciones que validan el token
// (validar_acceso, mcp_obtener_instrucciones, mcp_enviar_informe, mcp_confirmar_orden). REQ-007, CA-006,
// art. 3. Cada rechazo da el resultado cerrado esperado y deja intacto el estado de todas las tablas.
// Cada caso de aceptación es el contrapunto: sin él, un rechazo por otro motivo pasaría por bueno.
// No sustituye a Postgres real de Supabase ni a pgTAP (CI).
import { beforeAll, describe, expect, it } from "vitest";
import type { BdApoyo } from "../../../conector/apoyo/index";
import { abrir, cerrarAlFinal, ESQUEMA, estado, fabrica, RECURSO, ROL_MCP, una } from "./comun";

cerrarAlFinal();

const OTRO_RECURSO = "https://otro.ejemplo.test/api/mcp";
const INFORME = JSON.stringify({
  estado: "ok",
  modo: "desatendido",
  asistente: "claude",
  almacenamiento: "drive",
  version_prompt: "0.1",
  frecuencia_horas: 24,
  tratados: 1,
  sin_tratar: 0,
  borradores: 0,
  documentos: 0,
  facturas_pendientes: 0,
  urgentes: 0,
  comprobaciones: { correo: true, almacenamiento: true, contexto: true, registro: true },
  problemas: [],
});

interface Caso {
  nombre: string;
  tipo?: "acceso" | "renovacion";
  /** Recurso con el que se emitió el token (se presenta siempre RECURSO). */
  recursoToken?: string;
  /** Desfase de `creado_en` y de `caduca_en` respecto a now(), como intervalos de Postgres. */
  creado?: string;
  caduca?: string;
  revocado?: boolean;
  conexionRevocada?: boolean;
  licenciaRevocada?: boolean;
  acepta: boolean;
}

const CASOS: Caso[] = [
  { nombre: "token vigente (control)", acepta: true },
  {
    nombre: "vida de 299 s (acepta)",
    creado: "-1 second",
    caduca: "298 seconds",
    acepta: true,
  },
  {
    nombre: "vida de 300 s recién emitido (acepta: la cota es inclusiva)",
    creado: "0 seconds",
    caduca: "300 seconds",
    acepta: true,
  },
  {
    nombre: "vida de 300 s presentado exactamente en su caducidad (rechaza)",
    creado: "-300 seconds",
    caduca: "0 seconds",
    acepta: false,
  },
  {
    nombre: "vida de 301 s, mayor de 300 s (rechaza)",
    creado: "0 seconds",
    caduca: "301 seconds",
    acepta: false,
  },
  {
    nombre: "vida de 1 hora (rechaza)",
    creado: "0 seconds",
    caduca: "3600 seconds",
    acepta: false,
  },
  {
    nombre: "token emitido en el futuro (rechaza)",
    creado: "10 seconds",
    caduca: "100 seconds",
    acepta: false,
  },
  { nombre: "token de renovación (rechaza)", tipo: "renovacion", acepta: false },
  {
    nombre: "recurso ajeno: token de otro recurso (rechaza)",
    recursoToken: OTRO_RECURSO,
    acepta: false,
  },
  { nombre: "token revocado (rechaza)", revocado: true, acepta: false },
  { nombre: "conexión revocada (rechaza)", conexionRevocada: true, acepta: false },
  { nombre: "licencia revocada (rechaza)", licenciaRevocada: true, acepta: false },
];

interface Preparado {
  hmac: string;
  ejecucion: string;
  orden: string;
}

async function preparar(bd: BdApoyo, c: Caso): Promise<Preparado> {
  const licencia = c.licenciaRevocada ? "B" : "A";
  const { id: licenciaId } = await una<{ id: string }>(
    bd,
    `select id::text from ${ESQUEMA}.licencias where tipo = $1`,
    [licencia],
  );
  const { id: conexionId } = await una<{ id: string }>(
    bd,
    `insert into ${ESQUEMA}.conexiones (licencia_id) values ($1) returning id::text`,
    [licenciaId],
  );
  const tipo = c.tipo ?? "acceso";
  const token = fabrica.token(tipo);
  await bd.db.query(
    `insert into ${ESQUEMA}.tokens (conexion_id, tipo, token_hmac, recurso, creado_en, caduca_en, revocado_en)
     values ($1, $2, $3, $4, now() + $5::interval, now() + $6::interval,
             case when $7::boolean then now() else null end)`,
    [
      conexionId,
      tipo,
      token.hmac,
      c.recursoToken ?? RECURSO,
      c.creado ?? "0 seconds",
      c.caduca ?? "300 seconds",
      c.revocado === true,
    ],
  );
  const { id: ejecucion } = await una<{ id: string }>(
    bd,
    `insert into ${ESQUEMA}.ejecuciones (conexion_id, licencia_id, estado_servido)
     values ($1, $2, 'activa') returning id::text`,
    [conexionId, licenciaId],
  );
  const { id: orden } = await una<{ id: string }>(
    bd,
    `insert into ${ESQUEMA}.ordenes (licencia_id, tipo, estado, entregada_en)
     values ($1, 'pausar', 'entregada', now() - interval '1 second') returning id::text`,
    [licenciaId],
  );
  if (c.conexionRevocada) {
    await bd.db.query(
      `update ${ESQUEMA}.conexiones set revocada_en = now(), motivo_revocacion = 'operador' where id = $1`,
      [conexionId],
    );
  }
  if (c.licenciaRevocada) {
    await bd.db.query(`update ${ESQUEMA}.licencias set estado = 'revocada' where id = $1`, [
      licenciaId,
    ]);
  }
  return { hmac: token.hmac, ejecucion, orden };
}

interface Funcion {
  nombre: string;
  llamar: (bd: BdApoyo, p: Preparado) => Promise<unknown>;
  cerrado: unknown;
  aceptado: (r: unknown) => boolean;
}

const como = (bd: BdApoyo, sql: string, parametros: unknown[]) =>
  bd.como(ROL_MCP, async () => (await bd.db.query<{ r: unknown }>(sql, parametros)).rows[0]!.r);

const FUNCIONES: Funcion[] = [
  {
    nombre: "validar_acceso",
    llamar: (bd, p) => como(bd, `select ${ESQUEMA}.validar_acceso($1, $2) as r`, [p.hmac, RECURSO]),
    cerrado: false,
    aceptado: (r) => r === true,
  },
  {
    nombre: "mcp_obtener_instrucciones",
    llamar: (bd, p) =>
      como(bd, `select ${ESQUEMA}.mcp_obtener_instrucciones($1, $2) as r`, [p.hmac, RECURSO]),
    cerrado: { resultado: "no_autorizado" },
    aceptado: (r) => (r as { resultado: string }).resultado === "servido",
  },
  {
    nombre: "mcp_enviar_informe",
    llamar: (bd, p) =>
      como(bd, `select ${ESQUEMA}.mcp_enviar_informe($1, $2, $3, $4, 0) as r`, [
        p.hmac,
        RECURSO,
        p.ejecucion,
        INFORME,
      ]),
    cerrado: { resultado: "no_autorizado" },
    aceptado: (r) => (r as { resultado: string }).resultado === "guardado",
  },
  {
    nombre: "mcp_confirmar_orden",
    llamar: (bd, p) =>
      como(bd, `select ${ESQUEMA}.mcp_confirmar_orden($1, $2, $3) as r`, [
        p.hmac,
        RECURSO,
        p.orden,
      ]),
    cerrado: { resultado: "no_autorizado" },
    aceptado: (r) => (r as { resultado: string }).resultado === "confirmada",
  },
];

describe.each(FUNCIONES)("autenticación del token: $nombre (REQ-007, CA-006)", (f) => {
  let bd: BdApoyo;
  beforeAll(async () => {
    bd = await abrir();
    // Reloj parado: «justo en su caducidad» es exacto, sin los milisegundos que pasan entre consultas.
    await bd.reloj.fijar(new Date());
  });
  it.each(CASOS)("$nombre", async (c) => {
    const p = await preparar(bd, c);
    const antes = await estado(bd);
    const r = await f.llamar(bd, p);
    if (c.acepta) {
      expect(f.aceptado(r), JSON.stringify(r)).toBe(true);
    } else {
      expect(r).toEqual(f.cerrado);
      expect(await estado(bd)).toEqual(antes);
    }
  });
});
