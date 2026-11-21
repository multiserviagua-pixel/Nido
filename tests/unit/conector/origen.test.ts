// T-108 (c) (001): origen.ts. PRUEBA-006 (parte): el origen de los intentos sale de `x-vercel-forwarded-for`
// (V§9.1), fijo en local; ausente fuera de local, o con una forma que no es una dirección, es rechazo
// sin evaluar (también en DCR y operación). Solo se conserva su HMAC.
import { randomBytes } from "node:crypto";
import { describe, expect, it } from "vitest";
import { ORIGEN_LOCAL, origenDePeticion } from "../../../src/lib/oauth/origen";
import { derivarClaves, huellaOrigen } from "../../../src/lib/oauth/secretos";

const claves = derivarClaves(randomBytes(32).toString("base64url"));
const con = (valor: string | null, extra: Record<string, string> = {}) => {
  const h = new Headers(extra);
  if (valor !== null) h.set("x-vercel-forwarded-for", valor);
  return h;
};

describe("origen.ts: fuera de local", () => {
  it("sin la cabecera: rechazo sin evaluar", () => {
    expect(origenDePeticion(con(null), claves, false)).toEqual({ estado: "rechazado" });
  });
  it("otras cabeceras de reenvío no sirven (falsificables)", () => {
    const h = con(null, {
      "x-forwarded-for": "203.0.113.9",
      "x-real-ip": "203.0.113.9",
      forwarded: "for=203.0.113.9",
    });
    expect(origenDePeticion(h, claves, false)).toEqual({ estado: "rechazado" });
  });
  it.each([
    "",
    " ",
    "203.0.113.9, 198.51.100.1",
    "999.1.1.1",
    "1.2.3",
    "abc",
    "203.0.113.9:80",
    "[::1]",
    "a".repeat(300),
    "TEXTO-CANARIO-123",
    "::1%eth0",
  ])("forma que no es una dirección: rechazo (%#)", (v) => {
    expect(origenDePeticion(con(v), claves, false)).toEqual({ estado: "rechazado" });
  });
  it.each([
    ["203.0.113.9", "203.0.113.9"],
    ["198.51.100.1", "198.51.100.1"],
    ["2001:db8::1", "2001:db8::"],
    ["2001:DB8::1", "2001:db8::"],
  ])("dirección válida %s: solo su HMAC", (ip, normalizada) => {
    const r = origenDePeticion(con(ip), claves, false);
    expect(r).toEqual({ estado: "ok", hmac: huellaOrigen(claves, normalizada) });
    expect(JSON.stringify(r)).not.toContain(ip.toLowerCase());
    if (r.estado === "ok") expect(r.hmac).toMatch(/^[0-9a-f]{64}$/);
  });
  it("direcciones distintas dan HMAC distintos; la misma, el mismo", () => {
    const a = origenDePeticion(con("203.0.113.9"), claves, false);
    const b = origenDePeticion(con("203.0.113.10"), claves, false);
    const c = origenDePeticion(con("203.0.113.9"), claves, false);
    expect(a).not.toEqual(b);
    expect(a).toEqual(c);
  });
  it("mayúsculas y minúsculas de IPv6 son el mismo origen", () => {
    expect(origenDePeticion(con("2001:DB8::1"), claves, false)).toEqual(
      origenDePeticion(con("2001:db8::1"), claves, false),
    );
  });
});

describe("origen.ts: en local el origen es fijo", () => {
  it("con o sin cabecera, o con basura, el mismo HMAC fijo", () => {
    const esperado = { estado: "ok", hmac: huellaOrigen(claves, ORIGEN_LOCAL) };
    for (const v of [null, "203.0.113.9", "basura, otra"]) {
      expect(origenDePeticion(con(v), claves, true)).toEqual(esperado);
    }
  });
});

// MENOR-1 del auditor: el origen se normaliza antes del HMAC (IPv4 en IPv6 -> IPv4; IPv6 canónica y
// agrupada por /64), para que cambiar de grafía o de dirección dentro del /64 no reinicie los límites.
describe("origen.ts: normalización del origen", () => {
  const hmac = (v: string) => origenDePeticion(con(v), claves, false);
  const igual = (a: string, b: string) => expect(hmac(a)).toEqual(hmac(b));
  const distinto = (a: string, b: string) => expect(hmac(a)).not.toEqual(hmac(b));
  const de = (cadena: string) => ({ estado: "ok", hmac: huellaOrigen(claves, cadena) });

  it("IPv4 encapsulada en IPv6 es la IPv4 (ambas grafías)", () => {
    igual("::ffff:203.0.113.9", "203.0.113.9");
    igual("::ffff:cb00:7109", "203.0.113.9");
    igual("::FFFF:CB00:7109", "::ffff:203.0.113.9");
    igual("0:0:0:0:0:ffff:203.0.113.9", "203.0.113.9");
    expect(hmac("::ffff:203.0.113.9")).toEqual(de("203.0.113.9"));
  });
  it("las IPv4 no cambian", () => {
    expect(hmac("203.0.113.9")).toEqual(de("203.0.113.9"));
    expect(hmac("198.51.100.1")).toEqual(de("198.51.100.1"));
  });
  it("dos grafías de la misma IPv6 dan el mismo HMAC", () => {
    igual("2001:0db8:0000:0000:0000:0000:0000:0001", "2001:db8::1");
    igual("2001:DB8:0:0::1", "2001:db8::1");
  });
  it("dos direcciones del mismo /64 dan el mismo HMAC; /64 distintos, no", () => {
    igual("2001:db8:1:2::1", "2001:db8:1:2:abcd:ef01:2345:6789");
    igual("2001:db8:1:2:ffff:ffff:ffff:ffff", "2001:db8:1:2::");
    distinto("2001:db8:1:2::1", "2001:db8:1:3::1");
    distinto("2001:db8:1:2::1", "2001:db8:2:2::1");
    distinto("2001:db8:1:2::1", "2001:db9:1:2::1");
  });
  it("la IPv6 se agrupa en su forma canónica de /64", () => {
    expect(hmac("2001:DB8:1:2:aaaa:bbbb:cccc:dddd")).toEqual(de("2001:db8:1:2::"));
    expect(hmac("2001:db8::1")).toEqual(de("2001:db8::"));
  });
  it("una IPv6 y una IPv4 no se confunden", () => {
    distinto("::1", "0.0.0.1");
    distinto("::", "0.0.0.0");
  });
  it("la forma estricta de rechazo se mantiene", () => {
    for (const v of [
      "::ffff:203.0.113.9:80",
      "[::ffff:cb00:7109]",
      "::ffff:cb00:7109%eth0",
      "::ffff:203.0.113.9, 2001:db8::1",
      "2001:db8::1/64",
      "::ffff:999.0.0.1",
    ]) {
      expect(hmac(v)).toEqual({ estado: "rechazado" });
    }
  });
  it("el origen fijo de local no cambia", () => {
    expect(origenDePeticion(con("::ffff:203.0.113.9"), claves, true)).toEqual(de(ORIGEN_LOCAL));
  });
});
