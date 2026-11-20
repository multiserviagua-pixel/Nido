// T-103 (001), art. 4: el verificador SCRAM-SHA-256 de las contraseñas de los roles del conector se
// calcula en la máquina de la persona y solo el verificador viaja al editor SQL. Esta prueba comprueba el
// formato, la derivación estándar (RFC 5802 y 7677), que la contraseña no sale por la salida ni por los
// argumentos, que el script no escribe en disco ni usa la red, y que Postgres (PGlite) lo acepta tal cual.
import { createHash, createHmac, pbkdf2Sync, randomBytes } from "node:crypto";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { PGlite } from "@electric-sql/pglite";
import { describe, expect, it, vi } from "vitest";

vi.setConfig({ testTimeout: 60_000, hookTimeout: 60_000 });
const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const SCRIPT = join(RAIZ, "scripts", "conector", "verificador-scram.mjs");

interface Modulo {
  calcularVerificador(
    contrasena: string,
    opciones?: { sal?: Buffer; iteraciones?: number },
  ): string;
  validarContrasena(contrasena: string): string | null;
}
const cargar = async () => (await import(/* @vite-ignore */ pathToFileURL(SCRIPT).href)) as Modulo;

const FORMATO = /^SCRAM-SHA-256\$4096:[A-Za-z0-9+/]{22}==\$[A-Za-z0-9+/]{43}=:[A-Za-z0-9+/]{43}=$/;

const hmac = (clave: Buffer, mensaje: string | Buffer) =>
  createHmac("sha256", clave).update(mensaje).digest();
const sha256 = (b: Buffer) => createHash("sha256").update(b).digest();

interface Partes {
  iteraciones: number;
  sal: Buffer;
  storedKey: Buffer;
  serverKey: Buffer;
}
function partir(verificador: string): Partes {
  const m = /^SCRAM-SHA-256\$(\d+):([^$]+)\$([^:]+):(.+)$/.exec(verificador);
  if (!m) throw new Error("formato");
  return {
    iteraciones: Number(m[1]),
    sal: Buffer.from(m[2]!, "base64"),
    storedKey: Buffer.from(m[3]!, "base64"),
    serverKey: Buffer.from(m[4]!, "base64"),
  };
}

const pbkdf2 = (c: string, s: Buffer, it: number) => pbkdf2Sync(c, s, it, 32, "sha256");

/** Lo que hace el servidor (RFC 5802 §3): recupera ClientKey de la prueba y comprueba H(ClientKey) = StoredKey. */
function servidorAcepta(verificador: string, contrasena: string, mensajeAuth: string): boolean {
  const { iteraciones, sal, storedKey } = partir(verificador);
  // Lado cliente: ClientProof = ClientKey XOR HMAC(StoredKey, AuthMessage)
  const claveCliente = hmac(pbkdf2(contrasena, sal, iteraciones), "Client Key");
  const firma = hmac(storedKey, mensajeAuth);
  const prueba = Buffer.from(claveCliente.map((b, i) => b ^ firma[i]!));
  // Lado servidor: ClientKey = ClientProof XOR firma; vale si su hash es StoredKey.
  const recuperada = Buffer.from(prueba.map((b, i) => b ^ firma[i]!));
  return sha256(recuperada).equals(storedKey);
}

const LARGA = "Zq7-vT2pLw9xKd4Rm8Ns3YhB6cGe"; // 28 caracteres ASCII imprimibles, solo de prueba

describe("verificador SCRAM-SHA-256 (art. 4): cálculo", () => {
  it("tiene el formato de Postgres: SCRAM-SHA-256$4096:sal$StoredKey:ServerKey en base64", async () => {
    const { calcularVerificador } = await cargar();
    const v = calcularVerificador(LARGA);
    expect(v).toMatch(FORMATO);
    // Cada cálculo usa una sal distinta.
    expect(calcularVerificador(LARGA)).not.toBe(v);
  });

  it("vector de RFC 7677: la prueba del cliente y la firma del servidor salen de StoredKey y ServerKey", async () => {
    const { calcularVerificador } = await cargar();
    const v = calcularVerificador("pencil", {
      sal: Buffer.from("W22ZaJ0SNY7soEsUEjb6gQ==", "base64"),
      iteraciones: 4096,
    });
    const { storedKey, serverKey } = partir(v);
    const mensajeAuth =
      "n=user,r=rOprNGfwEbeRWgbNEkqO," +
      "r=rOprNGfwEbeRWgbNEkqO%hvYDpWUa2RaTCAfuxFIlj)hNlF$k0,s=W22ZaJ0SNY7soEsUEjb6gQ==,i=4096," +
      "c=biws,r=rOprNGfwEbeRWgbNEkqO%hvYDpWUa2RaTCAfuxFIlj)hNlF$k0";
    // ClientProof = ClientKey XOR HMAC(StoredKey, AuthMessage); ServerSignature = HMAC(ServerKey, AuthMessage).
    const firmaCliente = hmac(storedKey, mensajeAuth);
    const claveCliente = hmac(pbkdf2("pencil", partir(v).sal, 4096), "Client Key");
    const prueba = Buffer.from(claveCliente.map((b, i) => b ^ firmaCliente[i]!));
    expect(prueba.toString("base64")).toBe("dHzbZapWIk4jUhN+Ute9ytag9zjfMHgsqmmiz7AndVQ=");
    expect(hmac(serverKey, mensajeAuth).toString("base64")).toBe(
      "6rriTRBi23WpRR/wtup+mMhUZUn/dB5nLTJRsjl95G4=",
    );
  });

  it("un verificador dado se valida contra la contraseña (StoredKey = H(ClientKey)) y no contra otra", async () => {
    const { calcularVerificador } = await cargar();
    const v = calcularVerificador(LARGA);
    const m = "n=u,r=a,r=ab,s=x,i=4096,c=biws,r=ab";
    expect(servidorAcepta(v, LARGA, m)).toBe(true);
    expect(servidorAcepta(v, LARGA + "x", m)).toBe(false);
    expect(servidorAcepta(v, LARGA.toLowerCase(), m)).toBe(false);
    // ServerKey = HMAC(SaltedPassword, "Server Key").
    const { sal, serverKey } = partir(v);
    expect(hmac(pbkdf2(LARGA, sal, 4096), "Server Key").equals(serverKey)).toBe(true);
  });

  it("Postgres (PGlite) lo reconoce como verificador y no lo vuelve a derivar", async () => {
    const { calcularVerificador } = await cargar();
    const v = calcularVerificador(LARGA);
    const db = await PGlite.create();
    try {
      await db.exec(`create role r_prueba login; alter role r_prueba password '${v}'`);
      const f = (
        await db.query<{ p: string }>(
          `select rolpassword as p from pg_authid where rolname = 'r_prueba'`,
        )
      ).rows[0]!;
      expect(f.p).toBe(v);
      expect(f.p).not.toContain(LARGA);
    } finally {
      await db.close();
    }
  });

  it("acepta solo contraseñas largas y de ASCII imprimible (sin normalización dudosa)", async () => {
    const { validarContrasena } = await cargar();
    expect(validarContrasena(LARGA)).toBeNull();
    expect(validarContrasena("Zq7-vT2pLw9x")).not.toBeNull();
    expect(validarContrasena(LARGA + "ñ")).not.toBeNull();
    expect(validarContrasena(LARGA + " ")).not.toBeNull();
    expect(validarContrasena(LARGA + "\n")).not.toBeNull();
  });
});

describe("verificador SCRAM-SHA-256 (art. 4): la línea de órdenes", () => {
  const ejecutar = (opciones: { env?: Record<string, string>; input?: string; args?: string[] }) =>
    spawnSync(process.execPath, [SCRIPT, ...(opciones.args ?? [])], {
      input: opciones.input ?? "",
      encoding: "utf8",
      env: { PATH: process.env.PATH ?? "", ...opciones.env } as unknown as NodeJS.ProcessEnv,
    });

  it("lee la contraseña de la variable de entorno e imprime solo el verificador", () => {
    const pw = randomBytes(24).toString("base64url");
    const r = ejecutar({ env: { CONTRASENA_CONECTOR: pw } });
    expect(r.status).toBe(0);
    expect(r.stdout.trim()).toMatch(FORMATO);
    expect(r.stdout.trim().split("\n")).toHaveLength(1);
    expect(r.stdout).not.toContain(pw);
    expect(r.stderr).not.toContain(pw);
    expect(servidorAcepta(r.stdout.trim(), pw, "n=u,r=a,r=ab,s=x,i=4096,c=biws,r=ab")).toBe(true);
  });

  it("sin variable, la pide por entrada estándar (con o sin salto de línea final)", () => {
    const pw = randomBytes(24).toString("base64url");
    for (const final of ["\n", "\r\n", ""]) {
      const r = ejecutar({ input: pw + final });
      expect(r.status, JSON.stringify(final)).toBe(0);
      expect(r.stdout.trim()).toMatch(FORMATO);
      expect(r.stdout).not.toContain(pw);
      expect(r.stderr).not.toContain(pw);
      expect(servidorAcepta(r.stdout.trim(), pw, "n=u,r=a,r=ab,s=x,i=4096,c=biws,r=ab")).toBe(true);
    }
  });

  it("no acepta la contraseña como argumento: falla sin repetirla ni imprimir nada", () => {
    const pw = randomBytes(24).toString("base64url");
    const r = ejecutar({ args: [pw], env: { CONTRASENA_CONECTOR: LARGA } });
    expect(r.status).not.toBe(0);
    expect(r.stdout).toBe("");
    expect(r.stderr).not.toContain(pw);
    expect(r.stderr).not.toContain(LARGA);
  });

  it("una contraseña corta o no ASCII falla sin imprimir verificador ni repetirla", () => {
    for (const pw of ["Zq7-vT2pLw9x", LARGA + "ñandú"]) {
      const r = ejecutar({ env: { CONTRASENA_CONECTOR: pw } });
      expect(r.status, pw).not.toBe(0);
      expect(r.stdout, pw).toBe("");
      expect(r.stderr, pw).not.toContain(pw);
    }
    const vacia = ejecutar({ input: "" });
    expect(vacia.status).not.toBe(0);
    expect(vacia.stdout).toBe("");
  });

  it("el script no escribe en disco, no usa la red ni lanza procesos", () => {
    const fuente = readFileSync(SCRIPT, "utf8");
    const importes = [...fuente.matchAll(/(?:from|import\()\s*["']([^"']+)["']/g)].map((m) => m[1]);
    expect(importes.every((i) => /^node:(crypto|process|url|readline)$/.test(i!))).toBe(true);
    expect(fuente).not.toMatch(
      /writeFile|appendFile|createWriteStream|\bfetch\s*\(|node:(http|https|net|tls|dns|fs|child_process)|process\.argv\s*\[\s*[2-9]/,
    );
  });
});

describe("LEEME.md (art. 4): el procedimiento de contraseñas", () => {
  const leeme = readFileSync(join(RAIZ, "supabase", "conector-prueba", "LEEME.md"), "utf8");

  it("solo se pega un verificador SCRAM en el editor: ningún `password '…'` con otra cosa", () => {
    const usos = [...leeme.matchAll(/password\s+'([^']*)'/gi)].map((m) => m[1]!);
    expect(usos.length).toBeGreaterThan(0);
    for (const u of usos) expect(u.startsWith("SCRAM-SHA-256$"), u).toBe(true);
  });

  it("nombra el script y la consulta de comprobación sobre pg_stat_statements", () => {
    expect(leeme).toContain("scripts/conector/verificador-scram.mjs");
    expect(leeme).toMatch(/pg_stat_statements/);
    expect(leeme).toMatch(/conector_prueba%password%/);
  });
});
