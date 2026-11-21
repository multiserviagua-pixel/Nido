// T-107 (a) (001): `leer_cliente`, `guardar_cliente_cimd` y `registrar_cliente_dcr` en PGlite.
// PRUEBA-005 (parte BD): callbacks y sus variantes, CIMD y DCR fuera de reglas, límites y purga. Una sola
// conexión: no demuestra carreras (008, L). No sustituye a Postgres real de Supabase ni a pgTAP (CI).
import { describe, expect, it } from "vitest";
import type { BdApoyo } from "../../../conector/apoyo/index";
import {
  abrir,
  autorizar,
  cerrarAlFinal,
  CB_CHATGPT,
  CB_CLAUDE,
  comprobarForma,
  ESQUEMA,
  estado,
  gestion,
  hmacDe,
  idDcr,
  origen,
  RECURSO,
  registrarCliente,
  ROL_GESTION,
  ROL_MCP,
  una,
} from "./comun";

cerrarAlFinal();

const H = 3_600_000;
const URL_CIMD = "https://claude.ai/oauth/metadata";
const CALLBACKS_NO_VALIDOS = [
  "http://claude.ai/api/mcp/auth_callback",
  "https://claude.ai/api/mcp/auth_callback/",
  "https://claude.ai/api/mcp/auth_callback/x",
  "https://claude.ai/api/mcp/auth_callback?a=1",
  "https://claude.ai/api/mcp/auth_callback#f",
  "https://claude.ai:443/api/mcp/auth_callback",
  "https://CLAUDE.ai/api/mcp/auth_callback",
  "https://evil.example/api/mcp/auth_callback",
  "http://localhost:3000/callback",
  "https://chatgpt.com/connector_platform_oauth_redirect/abc",
  "https://chatgpt.com/connector_platform_oauth_redirect?iss=x",
  "",
];

const dcr = (bd: BdApoyo, o: unknown, uris: unknown = [CB_CLAUDE], id: unknown = idDcr()) =>
  gestion(bd, "registrar_cliente_dcr", [o, id, uris]);
const cimd = (bd: BdApoyo, id: unknown, uris: unknown) =>
  gestion(bd, "guardar_cliente_cimd", [id, uris]);
const leer = (bd: BdApoyo, id: unknown) => gestion(bd, "leer_cliente", [id]);
const nClientes = async (bd: BdApoyo) =>
  (await una<{ n: number }>(bd, `select count(*)::int as n from ${ESQUEMA}.clientes_oauth`)).n;

describe("T-107 (a): forma y permisos de las tres funciones", () => {
  it("security definer, search_path, sin identificadores de cliente o licencia, solo el rol de gestión", async () => {
    const bd = await abrir();
    const prohibidos = ["anon", "authenticated", "service_role", ROL_MCP];
    await comprobarForma(bd, "leer_cliente", "text", ["p_client_id"], "$1", [URL_CIMD], {
      permitido: ROL_GESTION,
      prohibidos,
    });
    await comprobarForma(
      bd,
      "guardar_cliente_cimd",
      "text, text[]",
      ["p_client_id", "p_redirect_uris"],
      "$1, $2",
      [URL_CIMD, [CB_CLAUDE]],
      { permitido: ROL_GESTION, prohibidos },
    );
    await comprobarForma(
      bd,
      "registrar_cliente_dcr",
      "text, text, text[]",
      ["p_origen_hmac", "p_client_id", "p_redirect_uris"],
      "$1, $2, $3",
      [origen("forma"), idDcr(), [CB_CLAUDE]],
      { permitido: ROL_GESTION, prohibidos },
    );
  });
});

describe("T-107 (a): leer_cliente y guardar_cliente_cimd (CIMD por URL exacta)", () => {
  it("un cliente desconocido, mal formado o nulo es `desconocido`", async () => {
    const bd = await abrir();
    for (const id of ["https://x.test/a", "dcr_" + "a".repeat(22), "", "no es un id", null]) {
      expect(await leer(bd, id), String(id)).toEqual({ resultado: "desconocido" });
    }
  });

  it("guarda un cliente CIMD y lo lee con su origen, callbacks y vigencia (caché de 1 h, sin usar caducada)", async () => {
    const bd = await abrir();
    await bd.reloj.fijar(new Date());
    expect(await cimd(bd, URL_CIMD, [CB_CLAUDE])).toEqual({ resultado: "guardado" });
    expect(await leer(bd, URL_CIMD)).toEqual({
      resultado: "conocido",
      origen: "cimd",
      redirect_uris: [CB_CLAUDE],
      vigente: true,
    });
    await bd.reloj.avanzar(H - 1000);
    expect((await leer(bd, URL_CIMD)).vigente, "59 min 59 s").toBe(true);
    await bd.reloj.avanzar(1000);
    expect((await leer(bd, URL_CIMD)).vigente, "1 h").toBe(false);
    // Volver a guardarlo renueva la caché y puede cambiar los callbacks (siempre de la lista).
    expect(await cimd(bd, URL_CIMD, [CB_CLAUDE, CB_CHATGPT])).toEqual({ resultado: "guardado" });
    expect(await leer(bd, URL_CIMD)).toMatchObject({
      vigente: true,
      redirect_uris: [CB_CLAUDE, CB_CHATGPT],
    });
    expect(await nClientes(bd)).toBe(1);
  });

  it("callbacks fuera de la lista o variantes de los de la lista: rechazado entero, 0 filas", async () => {
    const bd = await abrir();
    const antes = await estado(bd);
    for (const malo of CALLBACKS_NO_VALIDOS) {
      expect(await cimd(bd, URL_CIMD, [malo]), malo).toEqual({ resultado: "no_valido" });
      // Uno bueno y uno malo: ni siquiera se guarda el bueno (rechazo entero).
      expect(await cimd(bd, URL_CIMD, [CB_CLAUDE, malo]), malo).toEqual({ resultado: "no_valido" });
    }
    expect(await cimd(bd, URL_CIMD, [])).toEqual({ resultado: "no_valido" });
    expect(await cimd(bd, URL_CIMD, null)).toEqual({ resultado: "no_valido" });
    expect(await cimd(bd, URL_CIMD, [CB_CLAUDE, CB_CHATGPT, CB_CLAUDE])).toEqual({
      resultado: "no_valido",
    });
    expect(await estado(bd)).toEqual(antes);
  });

  it("un client_id que no es una URL https sin puerto, usuario ni fragmento es no_valido", async () => {
    const bd = await abrir();
    const antes = await estado(bd);
    for (const id of [
      "http://claude.ai/oauth/metadata",
      "https://claude.ai:8443/oauth/metadata",
      "https://usuario@claude.ai/oauth/metadata",
      "https://claude.ai/oauth/metadata#f",
      "https://claude.ai/oauth/metadata?x=1",
      "https://CLAUDE.AI/oauth",
      "dcr_" + "a".repeat(22),
      "",
      null,
    ]) {
      expect(await cimd(bd, id, [CB_CLAUDE]), String(id)).toEqual({ resultado: "no_valido" });
    }
    expect(await estado(bd)).toEqual(antes);
  });

  it("el origen del cliente nunca viene de la entrada: un cliente DCR no se convierte en CIMD", async () => {
    const bd = await abrir();
    const id = idDcr();
    expect((await dcr(bd, origen("a"), [CB_CLAUDE], id)).resultado).toBe("registrado");
    expect((await leer(bd, id)).origen).toBe("dcr");
    expect(await cimd(bd, id, [CB_CLAUDE])).toEqual({ resultado: "no_valido" });
  });
});

describe("T-107 (a): registrar_cliente_dcr (límites y purga)", () => {
  it("registra un cliente DCR con su identificador y callbacks; lo lee como vigente", async () => {
    const bd = await abrir();
    const id = idDcr();
    expect(await dcr(bd, origen("a"), [CB_CLAUDE, CB_CHATGPT], id)).toEqual({
      resultado: "registrado",
    });
    expect(await leer(bd, id)).toEqual({
      resultado: "conocido",
      origen: "dcr",
      redirect_uris: [CB_CLAUDE, CB_CHATGPT],
      vigente: true,
    });
  });

  it("callbacks fuera de la lista, repetidos o vacíos, identificador o origen mal formados: no_valido sin efecto", async () => {
    const bd = await abrir();
    const antes = await estado(bd);
    for (const malo of CALLBACKS_NO_VALIDOS) {
      expect(await dcr(bd, origen("a"), [malo]), malo).toEqual({ resultado: "no_valido" });
      expect(await dcr(bd, origen("a"), [CB_CHATGPT, malo]), malo).toEqual({
        resultado: "no_valido",
      });
    }
    for (const uris of [[], null, [CB_CLAUDE, CB_CLAUDE], [CB_CLAUDE, CB_CHATGPT, CB_CLAUDE]]) {
      expect(await dcr(bd, origen("a"), uris)).toEqual({ resultado: "no_valido" });
    }
    for (const id of ["dcr_corto", "dcr_" + "a".repeat(23), "x".repeat(26), "", null]) {
      expect(await dcr(bd, origen("a"), [CB_CLAUDE], id), String(id)).toEqual({
        resultado: "no_valido",
      });
    }
    for (const o of ["no-es-hmac", "A".repeat(64), "", null]) {
      expect(await dcr(bd, o, [CB_CLAUDE]), String(o)).toEqual({ resultado: "no_valido" });
    }
    expect(await estado(bd)).toEqual(antes);
  });

  it("un identificador repetido es no_valido y no pisa al cliente existente", async () => {
    const bd = await abrir();
    const id = idDcr();
    await dcr(bd, origen("a"), [CB_CLAUDE], id);
    expect(await dcr(bd, origen("b"), [CB_CHATGPT], id)).toEqual({ resultado: "no_valido" });
    expect((await leer(bd, id)).redirect_uris).toEqual([CB_CLAUDE]);
  });

  it("5 por origen y hora: el sexto es origen_bloqueado, y vuelve a poder una hora después", async () => {
    const bd = await abrir();
    await bd.reloj.fijar(new Date());
    for (let i = 0; i < 5; i++) {
      expect((await dcr(bd, origen("a"))).resultado, `registro ${i + 1}`).toBe("registrado");
    }
    const antes = await nClientes(bd);
    expect(await dcr(bd, origen("a"))).toEqual({ resultado: "origen_bloqueado" });
    expect(await nClientes(bd)).toBe(antes);
    // Otro origen no se ve afectado.
    expect((await dcr(bd, origen("b"))).resultado).toBe("registrado");
    await bd.reloj.avanzar(H - 1000);
    expect((await dcr(bd, origen("a"))).resultado, "59 min 59 s").toBe("origen_bloqueado");
    await bd.reloj.avanzar(1000);
    expect((await dcr(bd, origen("a"))).resultado, "1 h").toBe("registrado");
  });

  it("50 sin uso en total: el 51 es `limite`, aunque venga de otro origen", async () => {
    const bd = await abrir();
    for (let o = 0; o < 10; o++) {
      for (let i = 0; i < 5; i++) {
        expect((await dcr(bd, origen(`o${o}`))).resultado).toBe("registrado");
      }
    }
    expect(await nClientes(bd)).toBe(50);
    expect(await dcr(bd, origen("nuevo"))).toEqual({ resultado: "limite" });
    expect(await nClientes(bd)).toBe(50);
    // Un cliente que ya se usó no cuenta para el cupo de «sin uso».
    await bd.db.query(
      `update ${ESQUEMA}.clientes_oauth set ultimo_uso_en = now()
        where id = (select id from ${ESQUEMA}.clientes_oauth limit 1)`,
    );
    expect((await dcr(bd, origen("nuevo"))).resultado).toBe("registrado");
  });

  it("purga a 24 h dentro de la propia función: sin uso desaparece, usado y reciente se conservan", async () => {
    const bd = await abrir();
    await bd.reloj.fijar(new Date());
    const sinUso = idDcr();
    const usado = idDcr();
    await dcr(bd, origen("a"), [CB_CLAUDE], sinUso);
    await dcr(bd, origen("a"), [CB_CLAUDE], usado);
    await bd.db.query(
      `update ${ESQUEMA}.clientes_oauth set ultimo_uso_en = now() where client_id = $1`,
      [usado],
    );
    await bd.reloj.avanzar(24 * H - 1000);
    // Aún no: a las 23 h 59 min 59 s sigue conocido.
    expect((await leer(bd, sinUso)).resultado).toBe("conocido");
    await bd.reloj.avanzar(1000);
    // A las 24 h ya no se reconoce, aunque nadie haya purgado todavía (cierre en fallo)...
    expect(await leer(bd, sinUso)).toEqual({ resultado: "desconocido" });
    expect((await leer(bd, usado)).resultado).toBe("conocido");
    // ... y la siguiente escritura lo borra de verdad, junto con los límites vencidos.
    const reciente = idDcr();
    expect((await dcr(bd, origen("b"), [CB_CLAUDE], reciente)).resultado).toBe("registrado");
    const filas = await una<{ n: number; vencidos: number }>(
      bd,
      `select (select count(*)::int from ${ESQUEMA}.clientes_oauth where client_id = $1) as n,
              (select count(*)::int from ${ESQUEMA}.limites_origen
                where ventana_desde < now() - interval '24 hours') as vencidos`,
      [sinUso],
    );
    expect(filas).toEqual({ n: 0, vencidos: 0 });
    expect(await nClientes(bd)).toBe(2);
  });

  it("purga de más de 24 h: límites vencidos, solicitudes y códigos caducados se borran; lo reciente y lo bloqueado, no", async () => {
    const bd = await abrir();
    await bd.reloj.fijar(new Date());
    const cliente = await registrarCliente(bd, "viejo"); // deja un límite dcr de este origen
    await autorizar(bd, cliente); // deja un código de autorización (300 s)
    const abierta = await gestion(bd, "abrir_solicitud", [
      cliente,
      CB_CLAUDE,
      "A".repeat(43),
      RECURSO,
      hmacDe("state:purga"),
      hmacDe("cookie:purga"),
    ]);
    expect(abierta.resultado).toBe("abierta"); // solicitud de 10 min
    // Un límite viejo pero con bloqueo vigente se conserva mientras dure el bloqueo.
    await bd.db.query(
      `insert into ${ESQUEMA}.limites_origen (ambito, origen_hmac, ventana_desde, fallos, bloqueado_hasta)
       values ('operacion', $1, now() - interval '30 hours', 5, now() + interval '30 hours')`,
      [origen("bloqueado")],
    );
    const cuentas = () =>
      una<{ sol: number; cod: number; lim: number; bloq: number; viejo: number }>(
        bd,
        `select (select count(*)::int from ${ESQUEMA}.solicitudes_autorizacion) as sol,
                (select count(*)::int from ${ESQUEMA}.codigos_autorizacion) as cod,
                (select count(*)::int from ${ESQUEMA}.limites_origen where origen_hmac <> $1) as lim,
                (select count(*)::int from ${ESQUEMA}.limites_origen where origen_hmac = $1) as bloq,
                (select count(*)::int from ${ESQUEMA}.limites_origen where origen_hmac = $2) as viejo`,
        [origen("bloqueado"), origen("viejo")],
      );
    // lim: 2 = el límite dcr de «viejo» y la fila de activación que activar crea con 0 fallos (hallazgo 2).
    expect(await cuentas()).toMatchObject({ sol: 1, cod: 1, lim: 2, bloq: 1, viejo: 1 });

    // Aún no han pasado 24 h desde que caducaron: se conservan.
    await bd.reloj.avanzar(24 * H - 60_000);
    expect((await dcr(bd, origen("otro1"))).resultado).toBe("registrado");
    expect(await cuentas()).toMatchObject({ sol: 1, cod: 1, viejo: 1, bloq: 1 });

    // Mucho más de 24 h (no justo en el límite): todo lo vencido desaparece en la siguiente escritura.
    await bd.reloj.avanzar(2 * H);
    expect((await dcr(bd, origen("otro2"))).resultado).toBe("registrado");
    const despues = await cuentas();
    expect(despues.sol, "solicitudes caducadas hace más de 24 h").toBe(0);
    expect(despues.cod, "códigos de autorización caducados hace más de 24 h").toBe(0);
    expect(despues.viejo, "límite de ventana vencida").toBe(0);
    expect(despues.bloq, "límite con bloqueo vigente").toBe(1);
    expect(despues.lim, "solo los dos orígenes nuevos").toBe(2);
  });

  it("tras el cierre de la prueba, guardar_cliente_cimd y registrar_cliente_dcr devuelven `cerrada` sin escribir; leer_cliente sigue (menor 10)", async () => {
    const bd = await abrir();
    await bd.reloj.fijar(new Date());
    const existente = idDcr();
    expect((await dcr(bd, origen("a"), [CB_CLAUDE], existente)).resultado).toBe("registrado");
    expect(await cimd(bd, URL_CIMD, [CB_CLAUDE])).toEqual({ resultado: "guardado" });
    // La fila de `cierre` basta: lo que rechaza es la comprobación dentro de cada función.
    await bd.db.query(`insert into ${ESQUEMA}.cierre (id, cerrado_en) values (true, now())`);
    const antes = await estado(bd);
    expect(await dcr(bd, origen("b"))).toEqual({ resultado: "cerrada" });
    expect(await cimd(bd, "https://claude.ai/otro", [CB_CLAUDE])).toEqual({ resultado: "cerrada" });
    // También con entradas no válidas: el cierre manda y no hay más resultados distintos.
    expect(await dcr(bd, origen("b"), ["https://evil.example/x"])).toEqual({
      resultado: "cerrada",
    });
    expect(await cimd(bd, URL_CIMD, [CB_CLAUDE, CB_CHATGPT])).toEqual({ resultado: "cerrada" });
    expect(await estado(bd), "ni una fila escrita, ni límites ni purga").toEqual(antes);
    // Leer no concede nada y sigue funcionando.
    expect((await leer(bd, existente)).resultado).toBe("conocido");
  });

  it("la respuesta no repite nunca el valor recibido", async () => {
    const bd = await abrir();
    const marca = "MARCA-" + "x".repeat(30);
    const r = JSON.stringify([
      await cimd(bd, "https://" + marca.toLowerCase() + ".test/x", [marca]),
      await dcr(bd, origen("a"), [marca], marca),
      await leer(bd, marca),
    ]);
    expect(r.toLowerCase()).not.toContain("marca-");
  });
});
