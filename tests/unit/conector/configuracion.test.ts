// T-104 (a): grupo «conector» de la configuración (diseño §Configuración, C-1, C-2, N-3).
// PRUEBA-018 (parte: variables) y PRUEBA-021 (parte: producción no lo lee).
// Los valores se componen en ejecución: ningún literal con forma de secreto en el repositorio.
import { randomBytes } from "node:crypto";
import { inspect } from "node:util";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import * as salud from "../../../src/app/api/salud/route";
import {
  NOMBRES_CONECTOR,
  NOMBRES_CONFIGURACION,
  cargarConfiguracionConector,
  validarConfiguracionConector,
} from "../../../src/lib/plataforma/configuracion";
import { ErrorDeAplicacion } from "../../../src/lib/plataforma/errores";
import { CODIGOS } from "../../../src/lib/registro/codigos";

type Env = Record<string, string | undefined>;

const CANARIO = "TEXTO-CANARIO-123";
const secreto = (): string => randomBytes(32).toString("base64url");
const contrasena = (): string => randomBytes(12).toString("hex");
const urlBd = (rol: string, sufijo = ""): string =>
  [
    "postgres",
    "://",
    rol,
    ".",
    "referencia1",
    ":",
    contrasena(),
    "@",
    "agrupador.ejemplo.invalid",
    ":6543",
    "/postgres",
    sufijo,
  ].join("");
const huella = (): string => randomBytes(32).toString("hex");

function conector(entorno: "desarrollo" | "preproduccion"): Env {
  return {
    URL_PUBLICA: entorno === "desarrollo" ? "http://localhost:3000" : "https://pre.ejemplo.invalid",
    CONECTOR_SECRETO: secreto(),
    CONECTOR_BD_URL: urlBd("conector_prueba_mcp"),
    AUTORIZACION_BD_URL: urlBd("conector_prueba_gestion"),
    OPERACION_HUELLA: huella(),
  };
}

function plataforma(entorno: "desarrollo" | "preproduccion" | "produccion"): Env {
  if (entorno === "desarrollo") return { ENTORNO: "desarrollo", NODE_ENV: "development" };
  return {
    ENTORNO: entorno,
    VERCEL: "1",
    VERCEL_ENV: entorno === "produccion" ? "production" : "preview",
    VERCEL_REGION: "arn1",
  };
}

const fuente = (entorno: "desarrollo" | "preproduccion", cambios: Env = {}): Env => ({
  ...plataforma(entorno),
  ...conector(entorno),
  ...cambios,
});

describe("configuración del conector: lista y códigos", () => {
  it("exporta los cinco nombres del grupo y no los mezcla con los ocho de la plataforma", () => {
    expect([...NOMBRES_CONECTOR].sort()).toEqual(
      [
        "AUTORIZACION_BD_URL",
        "CONECTOR_BD_URL",
        "CONECTOR_SECRETO",
        "OPERACION_HUELLA",
        "URL_PUBLICA",
      ].sort(),
    );
    for (const n of NOMBRES_CONECTOR) {
      expect(NOMBRES_CONFIGURACION as readonly string[]).not.toContain(n);
    }
  });

  it("C-2: los dos códigos nuevos están en la lista cerrada", () => {
    expect(CODIGOS).toContain("almacen_no_disponible");
    expect(CODIGOS).toContain("configuracion_conector_invalida");
  });
});

describe("configuración del conector: valores válidos", () => {
  it.each(["desarrollo", "preproduccion"] as const)("acepta una configuración de %s", (e) => {
    expect(validarConfiguracionConector(fuente(e)).ok).toBe(true);
  });

  it("devuelve los valores tal cual y solo los cinco campos", () => {
    const f = fuente("preproduccion");
    const r = validarConfiguracionConector(f);
    if (!r.ok) throw new Error("debía ser válida");
    // MENOR-8: secreto y las dos URL con credenciales no son enumerables.
    expect(Object.getOwnPropertyNames(r.valor).sort()).toEqual(
      [
        "autorizacionBdUrl",
        "conectorBdUrl",
        "operacionHuella",
        "secreto",
        "toJSON",
        "urlPublica",
      ].sort(),
    );
    expect(r.valor.conectorBdUrl).toBe(f.CONECTOR_BD_URL);
    expect(r.valor.autorizacionBdUrl).toBe(f.AUTORIZACION_BD_URL);
    expect(r.valor.urlPublica).toBe(f.URL_PUBLICA);
    expect(r.valor.secreto).toBe(f.CONECTOR_SECRETO);
  });

  it("el usuario puede ser el rol solo (local) o rol.referencia", () => {
    const solo = [
      "postgres",
      "://conector_prueba_mcp:",
      contrasena(),
      "@localhost:5432/postgres",
    ].join("");
    expect(validarConfiguracionConector(fuente("desarrollo", { CONECTOR_BD_URL: solo })).ok).toBe(
      true,
    );
  });
});

describe("configuración del conector: cada variable ausente o mal formada (PRUEBA-018, parte)", () => {
  const malas: Record<string, readonly string[]> = {
    URL_PUBLICA: [
      "http://ejemplo.invalid",
      "https://ejemplo.invalid/",
      "https://ejemplo.invalid/ruta",
      "https://ejemplo.invalid?a=1",
      "https://usuario:clave@ejemplo.invalid",
      "https://EJEMPLO invalid",
      "ejemplo.invalid",
      "http://localhost",
    ],
    CONECTOR_SECRETO: [
      "c".repeat(31),
      "a".repeat(32),
      "a".repeat(43),
      "ab".repeat(20),
      "una frase de cuarenta bytes con espacios",
      "una-frase-con-tildes-ñandú-de-cuarenta-b",
      secreto().slice(0, 42),
      `${secreto().slice(0, 42)}+`,
      `${secreto().slice(0, 42)}=`,
    ],
    CONECTOR_BD_URL: [
      "mysql://conector_prueba_mcp.r:p@h.invalid:6543/postgres",
      "postgres://conector_prueba_mcp.r@h.invalid:6543/postgres",
      "postgres://postgres:p@h.invalid:6543/postgres",
      "postgres://conector_prueba_gestion.r:p@h.invalid:6543/postgres",
      "postgres://conector_prueba_mcp.r:p@h.invalid:6543/postgres#fragmento",
      "postgres://conector_prueba_mcp.r:p@h.invalid/postgres",
    ],
    AUTORIZACION_BD_URL: [
      "postgres://conector_prueba_mcp.r:p@h.invalid:6543/postgres",
      "postgres://postgres:p@h.invalid:6543/postgres",
    ],
    OPERACION_HUELLA: ["abc", "A".repeat(64), "g".repeat(64), "a".repeat(63), "a".repeat(65)],
  };

  for (const nombre of NOMBRES_CONECTOR) {
    it(`${nombre} ausente o vacía → configuracion_conector_invalida con su nombre`, () => {
      const sin = fuente("preproduccion");
      delete sin[nombre];
      const vacia = fuente("preproduccion", { [nombre]: "" });
      for (const f of [sin, vacia]) {
        expect(validarConfiguracionConector(f)).toEqual({
          ok: false,
          codigo: "configuracion_conector_invalida",
          variables: [nombre],
        });
      }
    });

    it(`${nombre}: cada forma defectuosa da su código y nunca su valor`, () => {
      for (const mala of malas[nombre] ?? []) {
        const r = validarConfiguracionConector(fuente("preproduccion", { [nombre]: mala }));
        expect(r.ok, `${nombre}: ${mala}`).toBe(false);
        if (r.ok) continue;
        expect(r.codigo).toBe("configuracion_conector_invalida");
        expect(r.variables).toEqual([nombre]);
        expect(JSON.stringify(r)).not.toContain(mala);
      }
    });
  }

  it("en desarrollo, URL_PUBLICA https no vale y http://localhost sí", () => {
    const dev = (u: string): boolean =>
      validarConfiguracionConector(fuente("desarrollo", { URL_PUBLICA: u })).ok;
    expect(dev("http://localhost")).toBe(true);
    expect(dev("https://ejemplo.invalid")).toBe(false);
    expect(dev("http://localhost.otro.invalid")).toBe(false);
  });

  it("MAYOR-1: el secreto son 43 a 128 caracteres base64url con al menos 16 distintos", () => {
    const con = (s: string): boolean =>
      validarConfiguracionConector(fuente("preproduccion", { CONECTOR_SECRETO: s })).ok;
    for (let i = 0; i < 1000; i++) expect(con(secreto())).toBe(true);
    expect(con("a".repeat(32))).toBe(false);
    expect(con("a".repeat(43))).toBe(false);
    expect(con("ab".repeat(30))).toBe(false);
    expect(con("una frase de cuarenta bytes con espacios y mas")).toBe(false);
    expect(con("é".repeat(40))).toBe(false);
    expect(con(secreto().slice(0, 42))).toBe(false);
    expect(con(`${secreto().slice(0, 42)}+`)).toBe(false);
    expect(con(`${secreto().slice(0, 42)}=`)).toBe(false);
    expect(con(secreto() + secreto().slice(0, 40) + "xxxx")).toBe(true);
    expect(con(secreto().repeat(4).slice(0, 129))).toBe(false);
    // Exactamente 16 distintos vale; 15, no.
    const alfabeto = "ABCDEFGHIJKLMNOP";
    expect(con(alfabeto.repeat(3).slice(0, 43))).toBe(true);
    expect(con(alfabeto.slice(0, 15).repeat(3).slice(0, 43))).toBe(false);
  });

  it("MENOR-5: URL_PUBLICA sin '..' en el host y con puerto local entre 1 y 65535", () => {
    const pre = (u: string): boolean =>
      validarConfiguracionConector(fuente("preproduccion", { URL_PUBLICA: u })).ok;
    const dev = (u: string): boolean =>
      validarConfiguracionConector(fuente("desarrollo", { URL_PUBLICA: u })).ok;
    expect(pre("https://a..ejemplo.invalid")).toBe(false);
    expect(pre("https://pre.ejemplo.invalid:443")).toBe(false);
    expect(pre("https://pre.ejemplo.invalid")).toBe(true);
    for (const p of ["1", "3000", "65535"]) expect(dev(`http://localhost:${p}`), p).toBe(true);
    for (const p of ["0", "00080", "03000", "65536", "99999", ""]) {
      expect(dev(`http://localhost:${p}`), p).toBe(false);
    }
  });

  it("MAYOR-2: en preproducción exige VERCEL=1, VERCEL_ENV de la lista y puerto 6543", () => {
    const cerrado = {
      ok: false,
      codigo: "configuracion_conector_invalida",
      variables: [],
    };
    const sin = fuente("preproduccion");
    delete sin.VERCEL;
    expect(validarConfiguracionConector(sin)).toEqual(cerrado);
    expect(validarConfiguracionConector(fuente("preproduccion", { VERCEL: "0" }))).toEqual(cerrado);
    expect(
      validarConfiguracionConector(fuente("preproduccion", { VERCEL_ENV: undefined })),
    ).toEqual(cerrado);
    expect(validarConfiguracionConector(fuente("preproduccion", { VERCEL_ENV: "otro" }))).toEqual(
      cerrado,
    );
    expect(
      validarConfiguracionConector(fuente("preproduccion", { VERCEL_ENV: "development" })),
    ).toEqual(cerrado);
    expect(
      validarConfiguracionConector(
        fuente("preproduccion", { VERCEL: "1", VERCEL_ENV: "production" }),
      ).ok,
    ).toBe(true);
    for (const nombre of ["CONECTOR_BD_URL", "AUTORIZACION_BD_URL"] as const) {
      const rol = nombre === "CONECTOR_BD_URL" ? "conector_prueba_mcp" : "conector_prueba_gestion";
      const u = urlBd(rol).replace(":6543/", ":5432/");
      const r = validarConfiguracionConector(fuente("preproduccion", { [nombre]: u }));
      expect(r).toEqual({
        ok: false,
        codigo: "configuracion_conector_invalida",
        variables: [nombre],
      });
      // En desarrollo el puerto local 5432 sigue valiendo.
      expect(validarConfiguracionConector(fuente("desarrollo", { [nombre]: u })).ok).toBe(true);
    }
  });

  it("N-3: una URL de base de datos con consulta no vale (?sslmode=disable, ?options=…)", () => {
    for (const nombre of ["CONECTOR_BD_URL", "AUTORIZACION_BD_URL"] as const) {
      const rol = nombre === "CONECTOR_BD_URL" ? "conector_prueba_mcp" : "conector_prueba_gestion";
      for (const consulta of ["?sslmode=disable", `?options=-c%20search_path%3D${CANARIO}`, "?"]) {
        const r = validarConfiguracionConector(
          fuente("preproduccion", { [nombre]: urlBd(rol, consulta) }),
        );
        expect(r.ok, `${nombre}${consulta}`).toBe(false);
        if (r.ok) continue;
        expect(r.codigo).toBe("configuracion_conector_invalida");
        expect(r.variables).toEqual([nombre]);
        expect(JSON.stringify(r)).not.toContain(CANARIO);
        expect(JSON.stringify(r)).not.toContain("sslmode");
      }
    }
  });

  it("varias defectuosas: las lista todas, por nombre, sin valores", () => {
    const r = validarConfiguracionConector(
      fuente("preproduccion", { CONECTOR_SECRETO: "c".repeat(5), OPERACION_HUELLA: CANARIO }),
    );
    expect(r).toEqual({
      ok: false,
      codigo: "configuracion_conector_invalida",
      variables: ["CONECTOR_SECRETO", "OPERACION_HUELLA"],
    });
    expect(JSON.stringify(r)).not.toContain(CANARIO);
  });

  it("no hay valores por defecto: una fuente sin el grupo lista los cinco", () => {
    const r = validarConfiguracionConector({ ENTORNO: "desarrollo" });
    expect(r.ok).toBe(false);
    if (!r.ok) expect([...r.variables].sort()).toEqual([...NOMBRES_CONECTOR].sort());
  });
});

describe("configuración del conector: entorno (C-1, PRUEBA-021 parte)", () => {
  it("con ENTORNO=produccion no vale, aunque las cinco sean correctas", () => {
    const f: Env = { ...plataforma("produccion"), ...conector("preproduccion") };
    expect(validarConfiguracionConector(f)).toEqual({
      ok: false,
      codigo: "configuracion_conector_invalida",
      variables: [],
    });
  });

  it("ENTORNO ausente o desconocido: cerrado", () => {
    for (const e of [undefined, "", "otro", "PRODUCCION"]) {
      const r = validarConfiguracionConector({ ...conector("preproduccion"), ENTORNO: e });
      expect(r.ok, String(e)).toBe(false);
    }
  });

  it("ENTORNO=desarrollo con VERCEL* con valor o NODE_ENV=production: cerrado", () => {
    expect(validarConfiguracionConector(fuente("desarrollo", { VERCEL: "1" })).ok).toBe(false);
    expect(validarConfiguracionConector(fuente("desarrollo", { NODE_ENV: "production" })).ok).toBe(
      false,
    );
  });

  describe("cargarConfiguracionConector lee process.env", () => {
    beforeEach(() => {
      for (const n of [...NOMBRES_CONFIGURACION, ...NOMBRES_CONECTOR]) vi.stubEnv(n, undefined);
    });
    afterEach(() => vi.unstubAllEnvs());

    const poner = (f: Env): void => {
      for (const [k, v] of Object.entries(f)) vi.stubEnv(k, v);
    };
    const capturar = (): unknown => {
      try {
        cargarConfiguracionConector();
      } catch (e) {
        return e;
      }
      return undefined;
    };

    it("devuelve la configuración válida", () => {
      const f = fuente("desarrollo");
      poner(f);
      expect(cargarConfiguracionConector().urlPublica).toBe(f.URL_PUBLICA);
    });

    it("en producción lanza el código aunque el grupo esté puesto", () => {
      poner({ ...plataforma("produccion"), ...conector("preproduccion") });
      const e = capturar();
      expect(e).toBeInstanceOf(ErrorDeAplicacion);
      expect((e as ErrorDeAplicacion).codigo).toBe("configuracion_conector_invalida");
    });

    it("MAYOR-2: desarrollo con una VERCEL* fuera de la lista (compuesta) cierra", () => {
      poner(fuente("desarrollo"));
      vi.stubEnv(["VERCEL", "OIDC", "TOKEN"].join("_"), CANARIO);
      const e = capturar();
      expect(e).toBeInstanceOf(ErrorDeAplicacion);
      expect((e as ErrorDeAplicacion).codigo).toBe("configuracion_conector_invalida");
      expect(JSON.stringify(e, Object.getOwnPropertyNames(e))).not.toContain(CANARIO);
    });

    it("MAYOR-2: preproducción sin VERCEL en el entorno cierra", () => {
      const f = fuente("preproduccion");
      delete f.VERCEL;
      poner(f);
      expect((capturar() as ErrorDeAplicacion).codigo).toBe("configuracion_conector_invalida");
    });

    it("MENOR-8: la configuración cargada no deja ver secreto ni URLs al serializar ni al mostrar", () => {
      const f = fuente("desarrollo");
      poner(f);
      const c = cargarConfiguracionConector();
      const texto = [JSON.stringify(c), inspect(c, { showHidden: false, depth: 4 })].join("\n");
      for (const valor of [f.CONECTOR_SECRETO, f.CONECTOR_BD_URL, f.AUTORIZACION_BD_URL]) {
        expect(texto).not.toContain(valor as string);
      }
      expect(Object.keys(c).sort()).toEqual(["operacionHuella", "urlPublica"]);
      expect(c.secreto).toBe(f.CONECTOR_SECRETO);
    });

    it("con una variable mala lanza solo el código, sin el valor", () => {
      poner(fuente("desarrollo", { CONECTOR_SECRETO: CANARIO }));
      const e = capturar();
      expect(e).toBeInstanceOf(ErrorDeAplicacion);
      expect((e as ErrorDeAplicacion).codigo).toBe("configuracion_conector_invalida");
      expect(JSON.stringify(e, Object.getOwnPropertyNames(e))).not.toContain(CANARIO);
    });
  });
});

describe("/api/salud no valida el grupo del conector (C-1)", () => {
  const TODAS = [...NOMBRES_CONFIGURACION, ...NOMBRES_CONECTOR];
  const limpiar = (): void => {
    vi.unstubAllEnvs();
    for (const n of TODAS) vi.stubEnv(n, undefined);
  };
  beforeEach(limpiar);
  afterEach(() => vi.unstubAllEnvs());

  const base: Record<"desarrollo" | "preproduccion", Env> = {
    desarrollo: { ENTORNO: "desarrollo" },
    preproduccion: {
      ENTORNO: "preproduccion",
      VERCEL: "1",
      VERCEL_ENV: "preview",
      VERCEL_REGION: "arn1",
      SUPERVISION_DSN: `https://${"0123456789abcdef".repeat(2)}@o1.ingest.de.sentry.io/1`,
      COMMIT_DESPLEGADO: "abcdef1",
    },
  };

  it.each(["desarrollo", "preproduccion"] as const)(
    "%s: sin el grupo, con el grupo inválido y con el grupo válido responde igual",
    async (entorno) => {
      const cuerpos: string[] = [];
      const estados: number[] = [];
      const variantes: Env[] = [
        {},
        { URL_PUBLICA: CANARIO, CONECTOR_SECRETO: "x", OPERACION_HUELLA: CANARIO },
        conector(entorno),
      ];
      for (const v of variantes) {
        limpiar();
        for (const [k, val] of Object.entries({ ...base[entorno], ...v })) vi.stubEnv(k, val);
        const r = await salud.GET(new Request("http://localhost/api/salud"));
        estados.push(r.status);
        cuerpos.push(await r.text());
      }
      expect(estados).toEqual([200, 200, 200]);
      expect(cuerpos).toEqual(Array(3).fill('{"estado":"ok"}'));
    },
  );
});
