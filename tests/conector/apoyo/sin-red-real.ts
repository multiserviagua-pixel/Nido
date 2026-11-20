// Guardián de red de las pruebas (T-102 y T-105, 001): ninguna prueba sale a internet por descuido.
// Las pruebas usan el doble de red (red.ts). Está registrado como `setupFiles` en vitest.config.ts,
// así que vale para todas las pruebas, y también se instala al importar el apoyo (index.ts).
//
// Bloquea: fetch, net (y con él tls, http y https, que conectan por net.Socket), dns (también las
// instancias de dns.Resolver y dns.promises.Resolver), dgram (send y connect), WebSocket y EventSource. Se permite el bucle local (127.0.0.0/8, ::1, localhost) y los sockets de dominio Unix,
// para servidores de prueba efímeros. Ante un destino que no se sabe interpretar, se bloquea.
// No se hace no reasignable ninguna propiedad: configurable:false rompe vi.stubGlobal (comprobado);
// por eso tampoco se reasigna `fetch` más que aquí, una vez.
import dgram from "node:dgram";
import dns from "node:dns";
import net from "node:net";

const MENSAJE = "red real bloqueada en las pruebas: usa el doble de red (crearDobleRed)";
const MARCA = Symbol.for("nido.pruebas.sin-red-real");

export function bloquearFetchGlobal(): void {
  globalThis.fetch = (() => Promise.reject(new Error(MENSAJE))) as typeof globalThis.fetch;
}

function esLocal(host: unknown): boolean {
  if (typeof host !== "string") return false;
  const h = host.toLowerCase().replace(/^\[|\]$/g, "");
  return h === "localhost" || h === "::1" || /^127(\.[0-9]{1,3}){3}$/.test(h);
}

// Destino de net.Socket.prototype.connect: (opciones) | (puerto[, host]) | (ruta). Una ruta es un
// socket de dominio Unix: local.
function destinoPermitido(args: unknown[]): boolean {
  // net.connect y tls.connect pasan los argumentos ya normalizados: [opciones, llamada].
  const [a, b] = Array.isArray(args[0]) ? (args[0] as unknown[]) : args;
  if (Array.isArray(args[0]) && a !== null && typeof a === "object") return destinoPermitido([a]);
  // Un texto numérico es un puerto (como en Node), no una ruta de socket Unix.
  if (typeof a === "string") {
    if (a.trim() !== "" && Number.isFinite(Number(a)))
      return typeof b === "string" ? esLocal(b) : true;
    return true;
  }
  if (typeof a === "number") return typeof b === "string" ? esLocal(b) : true;
  if (a !== null && typeof a === "object") {
    const o = a as { path?: unknown; host?: unknown };
    if (typeof o.path === "string") return true;
    return o.host === undefined ? true : esLocal(o.host);
  }
  return false;
}

function bloquearRedDeBajoNivel(): void {
  const original = net.Socket.prototype.connect as (
    this: net.Socket,
    ...a: unknown[]
  ) => net.Socket;
  net.Socket.prototype.connect = function (this: net.Socket, ...args: unknown[]) {
    if (destinoPermitido(args)) return original.apply(this, args);
    // Asíncrono: el consumidor recibe un evento `error`, como con un fallo de red real.
    process.nextTick(() => this.destroy(new Error(MENSAJE)));
    return this;
  } as typeof net.Socket.prototype.connect;

  const rechazar = (nombre: string, ...resto: unknown[]) => {
    const llamada = resto.find((r) => typeof r === "function") as ((e: Error) => void) | undefined;
    process.nextTick(() => llamada?.(new Error(`${MENSAJE} (${nombre})`)));
  };
  const lookupOriginal = dns.lookup as (...a: unknown[]) => unknown;
  (dns as { lookup: unknown }).lookup = (host: unknown, ...resto: unknown[]) => {
    if (esLocal(host)) return lookupOriginal(host, ...resto);
    return rechazar("dns.lookup", ...resto);
  };
  const esResolucion = (n: string) => n === "reverse" || n.startsWith("resolve");
  const nombresDe = (o: object) =>
    Object.getOwnPropertyNames(o).filter((n) => esResolucion(n) && n !== "constructor");
  for (const nombre of new Set([
    ...nombresDe(dns),
    ...nombresDe(dns.promises),
    ...nombresDe(dns.Resolver.prototype),
    ...nombresDe(dns.promises.Resolver.prototype),
  ])) {
    // Una función de resolución (de módulo o de instancia) no sale nunca: solo `lookup` admite el bucle local.
    if (
      nombre in dns &&
      typeof (dns as unknown as Record<string, unknown>)[nombre] === "function"
    ) {
      (dns as unknown as Record<string, unknown>)[nombre] = (...a: unknown[]) =>
        rechazar(nombre, ...a);
    }
    if (nombre in dns.promises) {
      (dns.promises as unknown as Record<string, unknown>)[nombre] = () =>
        Promise.reject(new Error(MENSAJE));
    }
    if (nombre in dns.Resolver.prototype) {
      (dns.Resolver.prototype as unknown as Record<string, unknown>)[nombre] = function (
        ...a: unknown[]
      ) {
        return rechazar(nombre, ...a);
      };
    }
    if (nombre in dns.promises.Resolver.prototype) {
      (dns.promises.Resolver.prototype as unknown as Record<string, unknown>)[nombre] = () =>
        Promise.reject(new Error(MENSAJE));
    }
  }
  const lookupPromesa = dns.promises.lookup as (...a: unknown[]) => Promise<unknown>;
  (dns.promises as unknown as { lookup: unknown }).lookup = (host: unknown, ...resto: unknown[]) =>
    esLocal(host) ? lookupPromesa(host, ...resto) : Promise.reject(new Error(MENSAJE));
}

// dgram: send(msg, [desplazamiento, longitud,] puerto, dirección[, llamada]) y connect(puerto[, dirección]).
// La dirección es el último argumento de texto no numérico; sin dirección, Node usa el bucle local.
function direccionDgram(args: unknown[]): string | undefined {
  const textos = args.filter((x) => typeof x === "string") as string[];
  for (let i = textos.length - 1; i >= 0; i -= 1) {
    const t = textos[i] as string;
    if (t.trim() === "" || !Number.isFinite(Number(t))) return t;
  }
  return undefined;
}

function bloquearDgram(): void {
  const sendOriginal = dgram.Socket.prototype.send as (this: dgram.Socket, ...a: unknown[]) => void;
  dgram.Socket.prototype.send = function (this: dgram.Socket, msg: unknown, ...args: unknown[]) {
    const direccion = direccionDgram(args);
    if (direccion === undefined || esLocal(direccion)) return sendOriginal.call(this, msg, ...args);
    const llamada = args.find((x) => typeof x === "function") as ((e: Error) => void) | undefined;
    if (llamada === undefined) throw new Error(MENSAJE);
    process.nextTick(() => llamada(new Error(MENSAJE)));
  } as typeof dgram.Socket.prototype.send;
  const connectOriginal = dgram.Socket.prototype.connect as (
    this: dgram.Socket,
    ...a: unknown[]
  ) => void;
  dgram.Socket.prototype.connect = function (this: dgram.Socket, ...args: unknown[]) {
    const direccion = direccionDgram(args.slice(1));
    if (direccion !== undefined && !esLocal(direccion)) throw new Error(MENSAJE);
    return connectOriginal.apply(this, args);
  } as typeof dgram.Socket.prototype.connect;
}

function bloquearCanalesDeNavegador(): void {
  for (const nombre of ["WebSocket", "EventSource"]) {
    Object.defineProperty(globalThis, nombre, {
      configurable: true,
      writable: true,
      value: function () {
        throw new Error(MENSAJE);
      },
    });
  }
}

const g = globalThis as unknown as Record<symbol, unknown>;
if (g[MARCA] !== true) {
  g[MARCA] = true;
  bloquearRedDeBajoNivel();
  bloquearDgram();
  bloquearCanalesDeNavegador();
}
bloquearFetchGlobal();
