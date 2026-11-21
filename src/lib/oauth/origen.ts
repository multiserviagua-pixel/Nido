// Origen de una petición para los límites de intentos (T-108 c, 001; diseño §Pantalla de activación;
// V§9.1). Sale solo de `x-vercel-forwarded-for` (la plataforma lo fija; `x-forwarded-for` y demás son
// falsificables y no se miran). Fijo en local. Ausente fuera de local, o con una forma que no sea UNA
// dirección IP, es rechazo sin evaluar nada (activar, DCR y operación). Solo se conserva su HMAC: la
// dirección nunca se guarda ni se registra (art. 1).
import { isIP } from "node:net";
import { huellaOrigen, type Claves } from "./secretos";

export const ORIGEN_LOCAL = "local";

// Solo dígitos, hexadecimales, `:` y `.`: sin zona (`%eth0`), corchetes, puerto ni espacios.
const RE_DIRECCION = /^[0-9a-fA-F:.]{2,45}$/;

// Normalización (MENOR-1 del auditor): la IPv4 encapsulada en IPv6 es la IPv4; el resto de IPv6 se agrupa
// por /64 (primeros 64 bits, el resto a cero) en forma canónica (comprimida, minúsculas); la IPv4 queda tal
// cual. Así cambiar de grafía o de dirección dentro del /64 no reinicia los límites de intentos.
function gruposIPv6(direccion: string): number[] | null {
  let texto = direccion.toLowerCase();
  const ultimo = texto.lastIndexOf(":");
  const cola = texto.slice(ultimo + 1);
  if (cola.includes(".")) {
    const o = cola.split(".").map(Number);
    texto =
      texto.slice(0, ultimo + 1) +
      ((o[0]! << 8) | o[1]!).toString(16) +
      ":" +
      ((o[2]! << 8) | o[3]!).toString(16);
  }
  const [cabeza = "", resto, ...sobra] = texto.split("::");
  if (sobra.length > 0) return null;
  const separar = (t: string): string[] => (t === "" ? [] : t.split(":"));
  const antes = separar(cabeza);
  const despues = resto === undefined ? [] : separar(resto);
  const ceros = resto === undefined ? 0 : 8 - antes.length - despues.length;
  if (ceros < 0 || (resto === undefined && antes.length !== 8)) return null;
  const grupos = [...antes, ...Array<string>(ceros).fill("0"), ...despues].map((g) =>
    Number.parseInt(g, 16),
  );
  if (grupos.length !== 8 || grupos.some((g) => !Number.isInteger(g) || g < 0 || g > 0xffff))
    return null;
  return grupos;
}

function normalizarOrigen(direccion: string): string | null {
  if (isIP(direccion) === 4) return direccion;
  const g = gruposIPv6(direccion);
  if (g === null) return null;
  if (g.slice(0, 5).every((x) => x === 0) && g[5] === 0xffff) {
    return `${g[6]! >> 8}.${g[6]! & 255}.${g[7]! >> 8}.${g[7]! & 255}`;
  }
  const prefijo = [...g.slice(0, 4), 0, 0, 0, 0];
  // Mayor racha de ceros (la primera si empatan), como en la forma canónica RFC 5952.
  let mejor = { inicio: -1, largo: 0 };
  for (let i = 0; i < 8;) {
    if (prefijo[i] !== 0) {
      i++;
      continue;
    }
    let j = i;
    while (j < 8 && prefijo[j] === 0) j++;
    if (j - i > mejor.largo) mejor = { inicio: i, largo: j - i };
    i = j;
  }
  const hex = prefijo.map((x) => x.toString(16));
  if (mejor.largo < 2) return hex.join(":");
  const izq = hex.slice(0, mejor.inicio).join(":");
  const der = hex.slice(mejor.inicio + mejor.largo).join(":");
  return `${izq}::${der}`;
}

export type ResultadoOrigen =
  { readonly estado: "ok"; readonly hmac: string } | { readonly estado: "rechazado" };

export function origenDePeticion(
  cabeceras: Headers,
  claves: Claves,
  local: boolean,
): ResultadoOrigen {
  if (local) return { estado: "ok", hmac: huellaOrigen(claves, ORIGEN_LOCAL) };
  const valor = cabeceras.get("x-vercel-forwarded-for");
  if (valor === null || !RE_DIRECCION.test(valor) || isIP(valor) === 0)
    return { estado: "rechazado" };
  // Cierre en fallo: si no se puede normalizar, se rechaza.
  const normalizado = normalizarOrigen(valor);
  if (normalizado === null) return { estado: "rechazado" };
  return { estado: "ok", hmac: huellaOrigen(claves, normalizado) };
}
