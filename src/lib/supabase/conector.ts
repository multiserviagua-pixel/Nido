// Conexión del conector al almacén (T-105 a, 001; diseño §Datos «Conexión»). Rol `conector_prueba_mcp`
// por el agrupador en modo transacción (6543). Solo `src/mcp/` importa este archivo (prueba de
// frontera) y solo este archivo importa `postgres`. No usa la clave secreta ni el rol `postgres`.
//
// - TLS que verifica certificado y nombre con la raíz pública de Supabase (`raiz-supabase.crt`):
//   certificado no confiable o servidor sin TLS -> la conexión no se establece y no se envía consulta.
// - `prepare: false`, `fetch_types: false`, `max: 2`, 5 s de conexión; el plazo de cada llamada lo
//   pone `almacen.ts` y el de cada sentencia, el rol (`statement_timeout '5s'`).
// - SQL fijo: nombre de función de una lista cerrada, valores solo como parámetros.
// - Cierre en fallo (art. 3): todo error es `almacen_no_disponible`; nunca se conservan ni se
//   registran `message`, `detail`, `where` ni `hint` de Postgres (podrían llevar contenido, art. 1).
import { readFileSync } from "node:fs";
import { join } from "node:path";
import postgres from "postgres";
import { cargarConfiguracionConector } from "../plataforma/configuracion";
import { ErrorDeAplicacion } from "../plataforma/errores";
import { crearAlmacen, type AdaptadorAlmacen, type Almacen } from "./almacen";

export type FabricaPostgres = typeof postgres;

export interface AdaptadorPostgres extends AdaptadorAlmacen {
  cerrar(): Promise<void>;
}

export interface OpcionesAdaptadorPostgres {
  /** URL del agrupador con el rol mcp (la valida `configuracion.ts`). */
  readonly url: string;
  /** Raíz de confianza en PEM. Vacía: no se conecta. */
  readonly ca: string;
  /** Fábrica de `postgres`; solo se sustituye en pruebas. */
  readonly fabrica?: FabricaPostgres;
}

// Las únicas funciones que este rol puede llamar (T-103: `execute` solo al rol mcp).
const FUNCIONES = [
  "validar_acceso",
  "mcp_obtener_instrucciones",
  "mcp_enviar_informe",
  "mcp_confirmar_orden",
  "registrar_suceso",
] as const;

export function crearAdaptadorPostgres(opciones: OpcionesAdaptadorPostgres): AdaptadorPostgres {
  if (opciones.ca.trim() === "") throw new ErrorDeAplicacion("almacen_no_disponible");
  const fabrica = opciones.fabrica ?? postgres;
  const sql = fabrica(opciones.url, {
    ssl: { ca: opciones.ca, rejectUnauthorized: true },
    prepare: false,
    fetch_types: false,
    max: 2,
    connect_timeout: 5,
    idle_timeout: 20,
    max_lifetime: 1800,
    onnotice: () => undefined,
  });
  return {
    async llamar(funcion, argumentos) {
      if (!(FUNCIONES as readonly string[]).includes(funcion)) {
        throw new ErrorDeAplicacion("almacen_no_disponible");
      }
      const marcas = argumentos.map((_, i) => `$${i + 1}`).join(", ");
      try {
        const filas = (await sql.unsafe(
          `select conector_prueba.${funcion}(${marcas}) as r`,
          argumentos as never[],
          { prepare: false },
        )) as unknown as { r: unknown }[];
        return filas[0]?.r;
      } catch {
        throw new ErrorDeAplicacion("almacen_no_disponible");
      }
    },
    async cerrar() {
      try {
        await sql.end({ timeout: 1 });
      } catch {
        // Cerrar no puede fallar hacia fuera.
      }
    },
  };
}

// Raíz pública de Supabase, del repositorio (la traza de `next build` la incluye: T-106).
export function leerRaizConfiable(): string {
  try {
    return readFileSync(
      join(process.cwd(), "supabase", "conector-prueba", "raiz-supabase.crt"),
      "utf8",
    );
  } catch {
    throw new ErrorDeAplicacion("almacen_no_disponible");
  }
}

let almacen: Almacen | undefined;

/**
 * Almacén de producto con el rol mcp. Se crea la primera vez que se pide: sin configuración válida
 * lanza `configuracion_conector_invalida`; sin raíz legible, `almacen_no_disponible` (503 ambos).
 */
export function almacenDelConector(): Almacen {
  if (almacen === undefined) {
    const configuracion = cargarConfiguracionConector();
    almacen = crearAlmacen(
      crearAdaptadorPostgres({ url: configuracion.conectorBdUrl, ca: leerRaizConfiable() }),
    );
  }
  return almacen;
}
