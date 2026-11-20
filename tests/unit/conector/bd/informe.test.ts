// T-103 (e) (001): `mcp_enviar_informe` en PGlite. PRUEBA-017 (parte BD: informe válido, inválido,
// ejecución desconocida, unicidad de `problemas`), PRUEBA-007 (parte: 10 llamadas iguales -> 1 informe;
// una sola conexión, NO demuestra carreras: queda para la 008) y PRUEBA-014 (parte: A no escribe en B).
// No sustituye a Postgres real de Supabase ni a pgTAP (CI).
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
  otraConexion,
  RECURSO,
  ROL_GESTION,
  ROL_MCP,
  sembrar,
  TABLAS,
  una,
  type Sembrado,
} from "./comun";

cerrarAlFinal();

type Informe = Record<string, unknown>;
const bueno = (): Informe => ({
  estado: "aviso",
  modo: "desatendido",
  asistente: "claude",
  almacenamiento: "drive",
  version_prompt: "0.1",
  frecuencia_horas: 24,
  tratados: 12,
  sin_tratar: 3,
  borradores: 4,
  documentos: 5,
  facturas_pendientes: 1,
  urgentes: 2,
  comprobaciones: { correo: true, almacenamiento: true, contexto: false, registro: true },
  problemas: ["sin_contexto", "error_borrador"],
});

async function abrirEjecucion(bd: BdApoyo, s: Sembrado): Promise<string> {
  const almacen = await crearAlmacenPglite(bd, ROL_MCP);
  const r = (await almacen.llamar("mcp_obtener_instrucciones", [s.acceso.hmac, RECURSO])) as {
    ejecucion_id: string;
  };
  return r.ejecucion_id;
}
async function enviar(
  bd: BdApoyo,
  hmac: unknown,
  ejecucion: unknown,
  informe: unknown,
  descartados: unknown = 0,
  recurso: unknown = RECURSO,
) {
  const almacen = await crearAlmacenPglite(bd, ROL_MCP);
  return (await almacen.llamar("mcp_enviar_informe", [
    hmac,
    recurso,
    ejecucion,
    informe === null || informe === undefined ? null : JSON.stringify(informe),
    descartados,
  ])) as { resultado: string };
}
const informes = async (bd: BdApoyo) =>
  (await una<{ n: number }>(bd, `select count(*)::int as n from ${ESQUEMA}.informes`)).n;

describe("T-103 (e): mcp_enviar_informe, informe válido (PRUEBA-017, parte BD)", () => {
  it("guarda el informe tal cual, con los campos descartados, y cierra la ejecución", async () => {
    const bd = await abrir();
    const a = await sembrar(bd, "A");
    const ej = await abrirEjecucion(bd, a);
    expect(await enviar(bd, a.acceso.hmac, ej, bueno(), 3)).toEqual({ resultado: "guardado" });
    const f = await una<Record<string, unknown>>(
      bd,
      `select i.licencia_id::text, i.ejecucion_id::text, i.estado::text, i.modo::text, i.asistente::text,
              i.almacenamiento::text, i.version_prompt, i.frecuencia_horas::int as frecuencia_horas,
              i.tratados, i.sin_tratar, i.borradores, i.documentos, i.facturas_pendientes, i.urgentes,
              i.comp_correo, i.comp_almacenamiento, i.comp_contexto, i.comp_registro,
              i.problemas, i.campos_descartados::int as campos_descartados,
              (e.cerrada_en is not null) as cerrada
         from ${ESQUEMA}.informes i join ${ESQUEMA}.ejecuciones e on e.id = i.ejecucion_id`,
    );
    expect(f).toEqual({
      licencia_id: a.licenciaId,
      ejecucion_id: ej,
      estado: "aviso",
      modo: "desatendido",
      asistente: "claude",
      almacenamiento: "drive",
      version_prompt: "0.1",
      frecuencia_horas: 24,
      tratados: 12,
      sin_tratar: 3,
      borradores: 4,
      documentos: 5,
      facturas_pendientes: 1,
      urgentes: 2,
      comp_correo: true,
      comp_almacenamiento: true,
      comp_contexto: false,
      comp_registro: true,
      problemas: ["sin_contexto", "error_borrador"],
      campos_descartados: 3,
      cerrada: true,
    });
  });

  it("acepta los extremos del contrato (mínimos, máximos, sin problemas, cinco problemas, versión 1.2.3)", async () => {
    const bd = await abrir();
    const a = await sembrar(bd, "A");
    const minimo: Informe = {
      ...bueno(),
      frecuencia_horas: 1,
      tratados: 0,
      sin_tratar: 0,
      borradores: 0,
      documentos: 0,
      facturas_pendientes: 0,
      urgentes: 0,
      problemas: [],
    };
    const maximo: Informe = {
      ...bueno(),
      estado: "pausado",
      modo: "conversacion",
      asistente: "otro",
      almacenamiento: "otro",
      version_prompt: "1.2.3",
      frecuencia_horas: 168,
      tratados: 1000,
      sin_tratar: 100000,
      borradores: 1000,
      documentos: 1000,
      facturas_pendientes: 1000,
      urgentes: 1000,
      problemas: [
        "sin_acceso_correo",
        "sin_acceso_almacenamiento",
        "registro_no_guardado",
        "error_etiquetado",
        "otro",
      ],
    };
    // Como el contrato (^[0-9]+\.[0-9]+(\.[0-9]+)?$, hasta 12 caracteres): «12345.0» vale.
    const versionLarga: Informe = { ...bueno(), version_prompt: "12345.0" };
    for (const [nombre, inf] of [
      ["mínimo", minimo],
      ["máximo", maximo],
      ["versión de cinco cifras", versionLarga],
    ] as const) {
      const ej = await abrirEjecucion(bd, a);
      expect(await enviar(bd, a.acceso.hmac, ej, inf, 0), nombre).toEqual({
        resultado: "guardado",
      });
    }
    expect(await informes(bd)).toBe(3);
    expect(
      (
        await una<{ v: string }>(
          bd,
          `select version_prompt as v from ${ESQUEMA}.informes where version_prompt = '12345.0'`,
        )
      ).v,
    ).toBe("12345.0");
  });

  it("un entero escrito como 24.0 vale (es entero para JSON Schema)", async () => {
    const bd = await abrir();
    const a = await sembrar(bd, "A");
    const ej = await abrirEjecucion(bd, a);
    const almacen = await crearAlmacenPglite(bd, ROL_MCP);
    const texto = JSON.stringify(bueno()).replace(
      '"frecuencia_horas":24',
      '"frecuencia_horas":24.0',
    );
    expect(texto).toContain("24.0");
    expect(
      await almacen.llamar("mcp_enviar_informe", [a.acceso.hmac, RECURSO, ej, texto, 0]),
    ).toEqual({ resultado: "guardado" });
  });
});

describe("T-103 (e): idempotencia (PRUEBA-007, parte; una sola conexión, sin carreras)", () => {
  it("10 llamadas iguales -> 1 informe: la primera guarda y las otras 9 dan repetido", async () => {
    const bd = await abrir();
    const a = await sembrar(bd, "A");
    const ej = await abrirEjecucion(bd, a);
    const resultados: string[] = [];
    for (let i = 0; i < 10; i++) {
      resultados.push((await enviar(bd, a.acceso.hmac, ej, bueno(), 2)).resultado);
    }
    expect(resultados).toEqual(["guardado", ...Array<string>(9).fill("repetido")]);
    expect(await informes(bd)).toBe(1);
  });

  it("el identificador de la ejecución en mayúsculas se trata igual que en minúsculas", async () => {
    const bd = await abrir();
    const a = await sembrar(bd, "A");
    const ej = await abrirEjecucion(bd, a);
    expect(await enviar(bd, a.acceso.hmac, ej.toUpperCase(), bueno(), 0)).toEqual({
      resultado: "guardado",
    });
    expect(await enviar(bd, a.acceso.hmac, ej, bueno(), 0)).toEqual({ resultado: "repetido" });
    expect(await informes(bd)).toBe(1);
  });

  it("repetir con otro contenido no pisa lo guardado ni reabre la ejecución", async () => {
    const bd = await abrir();
    const a = await sembrar(bd, "A");
    const ej = await abrirEjecucion(bd, a);
    await enviar(bd, a.acceso.hmac, ej, bueno(), 1);
    const antes = await estado(bd);
    const otro = { ...bueno(), tratados: 999, estado: "error", problemas: [] };
    expect(await enviar(bd, a.acceso.hmac, ej, otro, 7)).toEqual({ resultado: "repetido" });
    expect(await estado(bd)).toEqual(antes);
  });

  it("un informe distinto por cada ejecución: dos ejecuciones, dos informes", async () => {
    const bd = await abrir();
    const a = await sembrar(bd, "A");
    const e1 = await abrirEjecucion(bd, a);
    const e2 = await abrirEjecucion(bd, a);
    expect((await enviar(bd, a.acceso.hmac, e1, bueno())).resultado).toBe("guardado");
    expect((await enviar(bd, a.acceso.hmac, e2, bueno())).resultado).toBe("guardado");
    expect(await informes(bd)).toBe(2);
  });
});

describe("T-103 (e): informe_invalido (PRUEBA-017, parte BD) y unicidad de problemas", () => {
  const malos: [string, (i: Informe) => unknown][] = [
    ["informe nulo", () => null],
    ["un array", () => []],
    ["un número", () => 5],
    ["un texto", () => "hola"],
    ["campo ajeno", (i) => ({ ...i, asunto: "x" })],
    ["campo ajeno vacío", (i) => ({ ...i, extra: null })],
    ["falta un campo", (i) => (delete i.urgentes, i)],
    ["falta comprobaciones", (i) => (delete i.comprobaciones, i)],
    ["falta problemas", (i) => (delete i.problemas, i)],
    ["estado fuera de lista", (i) => ({ ...i, estado: "roto" })],
    ["modo fuera de lista", (i) => ({ ...i, modo: "otro" })],
    ["asistente fuera de lista", (i) => ({ ...i, asistente: "gemini" })],
    ["almacenamiento fuera de lista", (i) => ({ ...i, almacenamiento: "nas" })],
    ["enum como número", (i) => ({ ...i, estado: 1 })],
    ["versión mal formada", (i) => ({ ...i, version_prompt: "1.0-beta" })],
    ["versión demasiado larga", (i) => ({ ...i, version_prompt: "1234.1234.1234.1" })],
    ["versión de 13 caracteres", (i) => ({ ...i, version_prompt: "1234567890.12" })],
    ["versión como número", (i) => ({ ...i, version_prompt: 1.5 })],
    ["frecuencia 0", (i) => ({ ...i, frecuencia_horas: 0 })],
    ["frecuencia 169", (i) => ({ ...i, frecuencia_horas: 169 })],
    ["tratados 1001", (i) => ({ ...i, tratados: 1001 })],
    ["tratados negativo", (i) => ({ ...i, tratados: -1 })],
    ["sin_tratar 100001", (i) => ({ ...i, sin_tratar: 100001 })],
    ["borradores 1001", (i) => ({ ...i, borradores: 1001 })],
    ["documentos 1001", (i) => ({ ...i, documentos: 1001 })],
    ["facturas 1001", (i) => ({ ...i, facturas_pendientes: 1001 })],
    ["urgentes 1001", (i) => ({ ...i, urgentes: 1001 })],
    ["entero decimal", (i) => ({ ...i, tratados: 1.5 })],
    ["entero como texto", (i) => ({ ...i, tratados: "12" })],
    ["entero nulo", (i) => ({ ...i, tratados: null })],
    ["entero enorme", (i) => ({ ...i, tratados: 1e30 })],
    ["comprobaciones no objeto", (i) => ({ ...i, comprobaciones: true })],
    [
      "comprobaciones incompletas",
      (i) => ({ ...i, comprobaciones: { correo: true, almacenamiento: true, contexto: true } }),
    ],
    [
      "comprobaciones con campo ajeno",
      (i) => ({
        ...i,
        comprobaciones: {
          correo: true,
          almacenamiento: true,
          contexto: true,
          registro: true,
          x: 1,
        },
      }),
    ],
    [
      "comprobación no booleana",
      (i) => ({
        ...i,
        comprobaciones: { correo: "si", almacenamiento: true, contexto: true, registro: true },
      }),
    ],
    ["problemas no array", (i) => ({ ...i, problemas: "otro" })],
    ["problema repetido (uniqueItems)", (i) => ({ ...i, problemas: ["otro", "otro"] })],
    [
      "problema repetido entre cinco",
      (i) => ({ ...i, problemas: ["sin_contexto", "otro", "error_borrador", "otro"] }),
    ],
    [
      "seis problemas",
      (i) => ({
        ...i,
        problemas: [
          "sin_acceso_correo",
          "sin_acceso_almacenamiento",
          "sin_contexto",
          "registro_no_guardado",
          "error_borrador",
          "otro",
        ],
      }),
    ],
    ["problema fuera del catálogo", (i) => ({ ...i, problemas: ["me_ha_fallado_el_correo"] })],
    ["problema que no es texto", (i) => ({ ...i, problemas: [1] })],
    ["problema nulo", (i) => ({ ...i, problemas: [null] })],
  ];

  it("cada informe inválido -> informe_invalido, sin efecto y la ejecución sigue abierta", async () => {
    const bd = await abrir();
    const a = await sembrar(bd, "A");
    const ej = await abrirEjecucion(bd, a);
    const antes = await estado(bd);
    for (const [nombre, mutar] of malos) {
      const r = await enviar(bd, a.acceso.hmac, ej, mutar(bueno()), 0);
      expect(r, nombre).toEqual({ resultado: "informe_invalido" });
    }
    expect(await estado(bd)).toEqual(antes);
  });

  it("campos_descartados fuera de 0..1000 o nulo -> informe_invalido, sin efecto", async () => {
    const bd = await abrir();
    const a = await sembrar(bd, "A");
    const ej = await abrirEjecucion(bd, a);
    const antes = await estado(bd);
    for (const d of [-1, 1001, null]) {
      expect(await enviar(bd, a.acceso.hmac, ej, bueno(), d), String(d)).toEqual({
        resultado: "informe_invalido",
      });
    }
    expect(await estado(bd)).toEqual(antes);
  });

  it("un informe inválido no cierra la ejecución: se puede enviar uno bueno después", async () => {
    const bd = await abrir();
    const a = await sembrar(bd, "A");
    const ej = await abrirEjecucion(bd, a);
    await enviar(bd, a.acceso.hmac, ej, { ...bueno(), tratados: 5000 });
    expect(await enviar(bd, a.acceso.hmac, ej, bueno())).toEqual({ resultado: "guardado" });
  });

  it("el JSON que no es un JSON válido cierra en fallo: informe_invalido, sin error y sin efecto", async () => {
    const bd = await abrir();
    const a = await sembrar(bd, "A");
    const ej = await abrirEjecucion(bd, a);
    const almacen = await crearAlmacenPglite(bd, ROL_MCP);
    const antes = await estado(bd);
    // El parámetro es text: la conversión a jsonb ocurre dentro de la función, que la captura.
    for (const roto of ["{no es json", "", "   ", '{"a":']) {
      expect(
        await almacen.llamar("mcp_enviar_informe", [a.acceso.hmac, RECURSO, ej, roto, 0]),
        JSON.stringify(roto),
      ).toEqual({ resultado: "informe_invalido" });
    }
    expect(await estado(bd)).toEqual(antes);
  });

  it("un informe enorme se rechaza sin convertirlo", async () => {
    const bd = await abrir();
    const a = await sembrar(bd, "A");
    const ej = await abrirEjecucion(bd, a);
    const almacen = await crearAlmacenPglite(bd, ROL_MCP);
    const enorme = JSON.stringify({ ...bueno(), relleno: "x".repeat(100_000) });
    expect(
      await almacen.llamar("mcp_enviar_informe", [a.acceso.hmac, RECURSO, ej, enorme, 0]),
    ).toEqual({ resultado: "informe_invalido" });
    expect(await informes(bd)).toBe(0);
  });
});

describe("T-103 (e): conversión sin eco (hallazgo 3 del auditor; art. 1 y 7)", () => {
  // Un JSON con \u0000 o con un sustituto suelto no se puede convertir a jsonb. Si el parámetro fuera
  // jsonb, el error saltaría ANTES de la función y su CONTEXT llevaría el contenido. Con text, la
  // conversión es interna y el fallo se captura.
  const CANARIO = "TEXTO-CANARIO-123";
  const casos: [string, string][] = [
    ["\\u0000 en un valor", `${CANARIO}\\u0000`],
    ["sustituto alto suelto", `${CANARIO}\\ud800`],
    ["sustituto bajo suelto", `${CANARIO}\\udc00`],
  ];
  for (const [nombre, valor] of casos) {
    it(`${nombre} en estado -> informe_invalido, sin error, sin eco y sin rastro en las tablas`, async () => {
      const bd = await abrir();
      const a = await sembrar(bd, "A");
      const ej = await abrirEjecucion(bd, a);
      const almacen = await crearAlmacenPglite(bd, ROL_MCP);
      const antes = await estado(bd);
      // El texto lleva la secuencia de escape tal cual (barra, u, cuatro cifras), como la deja JSON.stringify.
      const texto = JSON.stringify(bueno()).replace('"estado":"aviso"', `"estado":"${valor}"`);
      expect(texto).toContain(valor);
      let respuesta: unknown;
      let fallo: unknown = null;
      try {
        respuesta = await almacen.llamar("mcp_enviar_informe", [
          a.acceso.hmac,
          RECURSO,
          ej,
          texto,
          0,
        ]);
      } catch (e) {
        fallo = e;
      }
      expect(fallo).toBeNull();
      expect(respuesta).toEqual({ resultado: "informe_invalido" });
      expect(JSON.stringify(respuesta)).not.toContain(CANARIO);
      expect(await estado(bd)).toEqual(antes);
      expect(await informes(bd)).toBe(0);
      // El canario no está en ninguna tabla del esquema.
      for (const t of TABLAS) {
        const n = await una<{ n: number }>(
          bd,
          `select count(*)::int as n from ${ESQUEMA}.${t} x where x::text like '%' || $1 || '%'`,
          [CANARIO],
        );
        expect(n.n, t).toBe(0);
      }
      // Y la ejecución sigue abierta: un informe bueno después se guarda.
      expect(await enviar(bd, a.acceso.hmac, ej, bueno())).toEqual({ resultado: "guardado" });
    });
  }

  it("con JSON.stringify de un valor real con NUL o sustituto suelto el resultado es el mismo", async () => {
    const bd = await abrir();
    const a = await sembrar(bd, "A");
    const ej = await abrirEjecucion(bd, a);
    for (const valor of [`${CANARIO}\u0000`, "\ud800"]) {
      const r = await enviar(bd, a.acceso.hmac, ej, { ...bueno(), estado: valor });
      expect(r).toEqual({ resultado: "informe_invalido" });
      expect(JSON.stringify(r)).not.toContain(CANARIO);
    }
    expect(await informes(bd)).toBe(0);
  });

  it("solo existe la función con el parámetro de texto: no queda una versión jsonb sin proteger", async () => {
    const bd = await abrir();
    const firmas = (
      await bd.db.query<{ firma: string }>(
        `select pg_get_function_identity_arguments(p.oid) as firma from pg_proc p
          where p.pronamespace = '${ESQUEMA}'::regnamespace and p.proname = 'mcp_enviar_informe'`,
      )
    ).rows.map((f) => f.firma);
    expect(firmas).toEqual([
      "p_token_hmac text, p_recurso text, p_ejecucion text, p_informe text, p_descartados integer",
    ]);
  });
});

describe("T-103 (e): ejecución desconocida y cierre en fallo", () => {
  it("ejecución inexistente, mal formada o nula -> ejecucion_desconocida, sin efecto y sin eco", async () => {
    const bd = await abrir();
    const a = await sembrar(bd, "A");
    await abrirEjecucion(bd, a);
    const antes = await estado(bd);
    const casos: unknown[] = [
      "00000000-0000-4000-8000-000000000999",
      "no-es-un-uuid",
      "",
      null,
      "0000000000004000800000000000099",
      "00000000-0000-4000-8000-000000000999 ; drop table x",
    ];
    for (const c of casos) {
      const r = await enviar(bd, a.acceso.hmac, c, bueno());
      expect(r, String(c)).toEqual({ resultado: "ejecucion_desconocida" });
      if (typeof c === "string" && c !== "") expect(JSON.stringify(r)).not.toContain(c);
    }
    expect(await estado(bd)).toEqual(antes);
  });

  it("una ejecución de otra conexión de la misma licencia es desconocida (solo la misma conexión)", async () => {
    const bd = await abrir();
    const a = await sembrar(bd, "A");
    const otra = await otraConexion(bd, a.licenciaId);
    const ejOtra = await abrirEjecucionConToken(bd, otra.acceso.hmac);
    const antes = await estado(bd);
    expect(await enviar(bd, a.acceso.hmac, ejOtra, bueno())).toEqual({
      resultado: "ejecucion_desconocida",
    });
    expect(await estado(bd)).toEqual(antes);
    // La suya sí.
    expect(await enviar(bd, otra.acceso.hmac, ejOtra, bueno())).toEqual({ resultado: "guardado" });
  });

  it("token o recurso no válido -> no_autorizado, sin efecto y sin eco", async () => {
    const bd = await abrir();
    const a = await sembrar(bd, "A");
    const ej = await abrirEjecucion(bd, a);
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
      const r = await enviar(bd, hmac, ej, bueno(), 0, recurso);
      expect(r, nombre).toEqual({ resultado: "no_autorizado" });
    }
    expect(await estado(bd)).toEqual(antes);
  });

  it("token caducado a los 300 s, o licencia o conexión revocada -> no_autorizado sin efecto", async () => {
    const bd = await abrir();
    const a = await sembrar(bd, "A");
    const ej = await abrirEjecucion(bd, a);
    const antes = await estado(bd);
    await bd.reloj.avanzar(300_000);
    expect(await enviar(bd, a.acceso.hmac, ej, bueno())).toEqual({ resultado: "no_autorizado" });
    expect(await estado(bd)).toEqual(antes);

    const bd2 = await abrir();
    const b = await sembrar(bd2, "A");
    const ej2 = await abrirEjecucion(bd2, b);
    await bd2.db.query(`update ${ESQUEMA}.licencias set estado = 'revocada' where tipo = 'A'`);
    expect(await enviar(bd2, b.acceso.hmac, ej2, bueno())).toEqual({ resultado: "no_autorizado" });
    expect(await informes(bd2)).toBe(0);
  });

  it("con la licencia suspendida el informe de una ejecución ya abierta se guarda", async () => {
    const bd = await abrir();
    const a = await sembrar(bd, "A");
    await bd.db.query(`update ${ESQUEMA}.licencias set estado = 'suspendida' where tipo = 'A'`);
    const ej = await abrirEjecucion(bd, a);
    expect(await enviar(bd, a.acceso.hmac, ej, { ...bueno(), estado: "pausado" })).toEqual({
      resultado: "guardado",
    });
  });
});

async function abrirEjecucionConToken(bd: BdApoyo, hmac: string): Promise<string> {
  const almacen = await crearAlmacenPglite(bd, ROL_MCP);
  return (
    (await almacen.llamar("mcp_obtener_instrucciones", [hmac, RECURSO])) as {
      ejecucion_id: string;
    }
  ).ejecucion_id;
}

describe("T-103 (e): aislamiento entre clientes (PRUEBA-014, parte)", () => {
  it("A no puede escribir un informe en la ejecución de B: desconocida, y B queda idéntico", async () => {
    const bd = await abrir();
    const a = await sembrar(bd, "A");
    const b = await sembrar(bd, "B", "chatgpt");
    const ejB = await abrirEjecucion(bd, b);
    const antesB = await huellaDeLicencia(bd, b.licenciaId);
    const antes = await estado(bd);
    expect(await enviar(bd, a.acceso.hmac, ejB, bueno())).toEqual({
      resultado: "ejecucion_desconocida",
    });
    expect(await huellaDeLicencia(bd, b.licenciaId)).toBe(antesB);
    expect(await estado(bd)).toEqual(antes);
    // Y tampoco ve lo repetido de B: si B ya informó, A recibe lo mismo que ante una inexistente.
    await enviar(bd, b.acceso.hmac, ejB, bueno());
    expect(await enviar(bd, a.acceso.hmac, ejB, bueno())).toEqual({
      resultado: "ejecucion_desconocida",
    });
  });

  it("cada informe queda con la licencia del token, nunca con otra", async () => {
    const bd = await abrir();
    const a = await sembrar(bd, "A");
    const b = await sembrar(bd, "B");
    await enviar(bd, a.acceso.hmac, await abrirEjecucion(bd, a), bueno());
    await enviar(bd, b.acceso.hmac, await abrirEjecucion(bd, b), bueno());
    const filas = (
      await bd.db.query<{ l: string; d: string }>(
        `select i.licencia_id::text as l, e.licencia_id::text as d
           from ${ESQUEMA}.informes i join ${ESQUEMA}.ejecuciones e on e.id = i.ejecucion_id`,
      )
    ).rows;
    expect(filas).toHaveLength(2);
    for (const f of filas) expect(f.l).toBe(f.d);
    expect(new Set(filas.map((f) => f.l))).toEqual(new Set([a.licenciaId, b.licenciaId]));
  });
});

describe("T-103 (e): forma de la función", () => {
  it("security definer, search_path fijo, solo el rol mcp la ejecuta, sin cliente ni licencia de entrada", async () => {
    const bd = await abrir();
    await comprobarForma(
      bd,
      "mcp_enviar_informe",
      "text,text,text,text,integer",
      ["p_token_hmac", "p_recurso", "p_ejecucion", "p_informe", "p_descartados"],
      "$1, $2, $3, $4, $5",
      [hmacDe("x"), RECURSO, "x", "{}", 0],
      { permitido: ROL_MCP, prohibidos: [ROL_GESTION, ...ROLES_SUPABASE] },
    );
  });
});
