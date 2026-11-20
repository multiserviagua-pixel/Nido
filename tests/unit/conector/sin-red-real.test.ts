// T-105 (001), menor de T-103: el guardián de red de las pruebas cubre también net, tls, http, https,
// dns, WebSocket y EventSource, no solo fetch. Se exige antes de la primera prueba que use `postgres`
// o un SDK sin fetch. Lo que sale a un destino que no es la propia máquina falla con un motivo fijo;
// el bucle local (127.0.0.0/8, ::1, localhost) sigue permitido para servidores de prueba efímeros.
// Direcciones de documentación (RFC 5737): aunque el guardián fallase, no llegan a ningún sitio.
import dgram from "node:dgram";
import dns from "node:dns";
import http from "node:http";
import https from "node:https";
import net from "node:net";
import tls from "node:tls";
import { describe, expect, it } from "vitest";

const MOTIVO = "red real bloqueada";
const DESTINO = "192.0.2.1";

const errorDe = (apertura: () => { once(e: "error", f: (x: Error) => void): unknown }) =>
  new Promise<Error>((resolver, rechazar) => {
    const t = setTimeout(() => rechazar(new Error("sin error en 2 s")), 2000);
    try {
      apertura().once("error", (e) => {
        clearTimeout(t);
        resolver(e);
      });
    } catch (e) {
      clearTimeout(t);
      resolver(e as Error);
    }
  });

describe("guardián de red de las pruebas (T-105)", () => {
  it("net.connect a una dirección externa falla con el motivo fijo", async () => {
    expect((await errorDe(() => net.connect(443, DESTINO))).message).toContain(MOTIVO);
  });

  it("net.Socket().connect con opciones y con host por nombre falla", async () => {
    expect(
      (await errorDe(() => new net.Socket().connect({ host: DESTINO, port: 5432 }))).message,
    ).toContain(MOTIVO);
    expect(
      (await errorDe(() => new net.Socket().connect({ host: "ejemplo.invalid", port: 5432 })))
        .message,
    ).toContain(MOTIVO);
  });

  it("tls.connect falla", async () => {
    expect((await errorDe(() => tls.connect(443, DESTINO))).message).toContain(MOTIVO);
  });

  it("http.request y https.request fallan", async () => {
    expect(
      (await errorDe(() => http.request({ host: DESTINO, port: 80 }).end())).message,
    ).toContain(MOTIVO);
    expect(
      (await errorDe(() => https.request({ host: DESTINO, port: 443 }).end())).message,
    ).toContain(MOTIVO);
  });

  it("dns.lookup y dns.promises.lookup de un nombre externo fallan", async () => {
    const e = await new Promise<Error | null>((r) =>
      dns.lookup("ejemplo.invalid", (err) => r(err as Error | null)),
    );
    expect(e?.message).toContain(MOTIVO);
    await expect(dns.promises.lookup("ejemplo.invalid")).rejects.toThrow(MOTIVO);
    await expect(dns.promises.resolve("ejemplo.invalid")).rejects.toThrow(MOTIVO);
  });

  it("dns.Resolver y dns.promises.Resolver (instancias) fallan", async () => {
    const e = await new Promise<Error | null>((r) =>
      new dns.Resolver().resolve4("ejemplo.invalid", (err) => r(err as Error | null)),
    );
    expect(e?.message).toContain(MOTIVO);
    await expect(new dns.promises.Resolver().resolve4("ejemplo.invalid")).rejects.toThrow(MOTIVO);
    await expect(new dns.promises.Resolver().resolveAny("ejemplo.invalid")).rejects.toThrow(MOTIVO);
  });

  it("dgram: send y connect a un destino externo fallan; al bucle local no", async () => {
    const s = dgram.createSocket("udp4");
    try {
      const e = await new Promise<Error | null>((r) => {
        try {
          s.send(Buffer.from("x"), 53, DESTINO, (err) => r(err));
        } catch (x) {
          r(x as Error);
        }
      });
      expect(e?.message).toContain(MOTIVO);
      expect(() => s.connect(53, DESTINO)).toThrow(MOTIVO);
    } finally {
      s.close();
    }
    const receptor = dgram.createSocket("udp4");
    await new Promise<void>((r) => receptor.bind(0, "127.0.0.1", r));
    const emisor = dgram.createSocket("udp4");
    try {
      const { port } = receptor.address();
      const llega = new Promise<string>((r) => receptor.once("message", (m) => r(String(m))));
      await new Promise<void>((resolver, rechazar) =>
        emisor.send(Buffer.from("ok"), port, "127.0.0.1", (err) =>
          err ? rechazar(err) : resolver(),
        ),
      );
      expect(await llega).toBe("ok");
    } finally {
      emisor.close();
      receptor.close();
    }
  });

  it('un texto numérico en socket.connect("443", host) es un puerto, no una ruta', async () => {
    expect(
      (await errorDe(() => new net.Socket().connect("443" as unknown as number, DESTINO))).message,
    ).toContain(MOTIVO);
  });

  it("WebSocket y EventSource no se pueden construir", () => {
    const g = globalThis as unknown as Record<string, new (u: string) => unknown>;
    expect(() => new g.WebSocket!("wss://ejemplo.invalid/")).toThrow(MOTIVO);
    expect(() => new g.EventSource!("https://ejemplo.invalid/")).toThrow(MOTIVO);
  });

  it("fetch sigue bloqueado y vi.stubGlobal sigue funcionando", async () => {
    await expect(fetch("https://ejemplo.invalid/")).rejects.toThrow("red real bloqueada");
  });

  it("el bucle local sigue permitido (servidor efímero en 127.0.0.1)", async () => {
    const servidor = net.createServer((s) => s.end("ok"));
    await new Promise<void>((r) => servidor.listen(0, "127.0.0.1", r));
    try {
      const { port } = servidor.address() as net.AddressInfo;
      const texto = await new Promise<string>((resolver, rechazar) => {
        const s = net.connect(port, "127.0.0.1");
        let datos = "";
        s.on("data", (d) => (datos += String(d)));
        s.on("end", () => resolver(datos));
        s.on("error", rechazar);
      });
      expect(texto).toBe("ok");
    } finally {
      await new Promise((r) => servidor.close(r));
    }
  });
});
