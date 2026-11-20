// Fábrica de licencias, conexiones y tokens sembrados (T-102, 001). Todo ficticio y compuesto en
// ejecución. El HMAC lo pone quien llama (función inyectada): la fábrica no conoce ni crea la
// clave del conector. Forma de guardado del diseño §Tokens: HMAC(clave, `${tipo}:${token}`).
import { randomBytes, randomUUID } from "node:crypto";

export type TipoToken = "acceso" | "renovacion";
export type Asistente = "claude" | "chatgpt" | "otro";
export type LicenciaTipo = "A" | "B";

export interface TokenSembrado {
  tipo: TipoToken;
  /** El valor que presentaría el cliente. Nunca se imprime ni se guarda. */
  valor: string;
  /** Lo que se guarda en la base de datos. */
  hmac: string;
}
export interface LicenciaSembrada {
  id: string;
  clienteId: string;
  tipo: LicenciaTipo;
}
export interface ConexionSembrada {
  id: string;
  licenciaId: string;
  clienteId: string;
  asistente: Asistente;
}

export interface OpcionesFabrica {
  hmac: (mensaje: string) => string;
  /** Bytes aleatorios; por defecto, criptográficos. Inyectable para pruebas deterministas. */
  aleatorio?: (n: number) => Uint8Array;
}

export interface Fabrica {
  token(tipo: TipoToken): TokenSembrado;
  licencia(tipo: LicenciaTipo): LicenciaSembrada;
  conexion(licencia: LicenciaSembrada, asistente: Asistente): ConexionSembrada;
}

const PREFIJO: Record<TipoToken, string> = { acceso: "hia_" + "a_", renovacion: "hia_" + "r_" };

export function crearFabrica(opciones: OpcionesFabrica): Fabrica {
  if (typeof opciones?.hmac !== "function") {
    throw new Error("fábrica: falta la función hmac inyectada");
  }
  const { hmac } = opciones;
  const aleatorio = opciones.aleatorio ?? ((n: number) => randomBytes(n));
  return {
    token(tipo) {
      const cuerpo = Buffer.from(aleatorio(32)).toString("base64url");
      // El diseño fija 43 caracteres tras el prefijo (32 bytes en base64url, sin relleno).
      if (cuerpo.length !== 43)
        throw new Error("fábrica: el token debe tener 43 caracteres tras el prefijo");
      const valor = PREFIJO[tipo] + cuerpo;
      return { tipo, valor, hmac: hmac(`${tipo}:${valor}`) };
    },
    licencia(tipo) {
      return {
        id: randomUUID(),
        clienteId: randomUUID(),
        tipo,
      };
    },
    conexion(licencia, asistente) {
      return {
        id: randomUUID(),
        licenciaId: licencia.id,
        clienteId: licencia.clienteId,
        asistente,
      };
    },
  };
}
