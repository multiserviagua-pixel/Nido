// Almacén del conector (T-105 a, 001; diseño §Datos «Conexión»). SQL fijo: una llamada, una función
// del esquema `conector_prueba`. El adaptador es inyectable: en producción es `conector.ts` (rol mcp,
// `postgres`); en la batería, el de PGlite (tests/conector/apoyo/almacen.ts). La fase 2 conserva esta
// forma cambiando solo este archivo y `conector.ts`.
//
// Cierre en fallo (art. 3): cualquier error del adaptador, un plazo vencido (5 s) o una respuesta
// que no tiene la forma cerrada es `almacen_no_disponible`, sin mensaje, causa ni valores (art. 1:
// los errores de Postgres pueden llevar contenido en `message`, `detail` o `where`).
import { ErrorDeAplicacion } from "../plataforma/errores";

export const TIEMPO_LLAMADA_MS = 5000;

export interface AdaptadorAlmacen {
  /** `select conector_prueba.<funcion>($1, ...)`; devuelve la primera columna de la primera fila. */
  llamar(funcion: string, argumentos: unknown[]): Promise<unknown>;
}

export type EstadoServido = "activa" | "pausada" | "suspendida";
export type TipoOrden = "pausar" | "reanudar";

export type RespuestaObtener =
  | { resultado: "no_autorizado" }
  | {
      resultado: "servido";
      estado: EstadoServido;
      ejecucion_id: string;
      orden: { id: string; tipo: TipoOrden } | null;
    };

export type RespuestaEnviar = {
  resultado:
    "no_autorizado" | "ejecucion_desconocida" | "informe_invalido" | "guardado" | "repetido";
};

export type RespuestaConfirmar = {
  resultado: "no_autorizado" | "no_confirmada" | "confirmada" | "repetida";
};

export type ProtocoloSuceso = "2025-11-25" | "2026-07-28" | "otra";
export type ResultadoSuceso = "correcto" | "rechazado" | "error";

/** Suceso de registro (diseño §Registros): campos cerrados, nunca valores recibidos. */
export interface SucesoAlmacen {
  /** HMAC del token (64 hexadecimales) o null si no hubo token válido. */
  readonly tokenHmac: string | null;
  readonly ruta: string;
  readonly herramienta: "obtener_instrucciones" | "enviar_informe" | "confirmar_orden" | null;
  readonly resultado: ResultadoSuceso;
  readonly codigo: string;
  readonly duracionMs: number;
  readonly protocolo: ProtocoloSuceso;
}

export interface Almacen {
  validarAcceso(tokenHmac: string, recurso: string): Promise<boolean>;
  obtenerInstrucciones(tokenHmac: string, recurso: string): Promise<RespuestaObtener>;
  /**
   * `informe` ya saneado y validado, o null (el almacén decide). Viaja como TEXTO: la conversión a
   * jsonb la hace la función dentro de la base (un fallo allí es `informe_invalido`, sin eco).
   */
  enviarInforme(
    tokenHmac: string,
    recurso: string,
    ejecucionId: string,
    informe: Record<string, unknown> | null,
    descartados: number,
  ): Promise<RespuestaEnviar>;
  confirmarOrden(tokenHmac: string, recurso: string, ordenId: string): Promise<RespuestaConfirmar>;
  registrarSuceso(suceso: SucesoAlmacen): Promise<void>;
}

const RE_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const ESTADOS: readonly string[] = ["activa", "pausada", "suspendida"];
const TIPOS_ORDEN: readonly string[] = ["pausar", "reanudar"];
const RESULTADOS_ENVIAR: readonly string[] = [
  "no_autorizado",
  "ejecucion_desconocida",
  "informe_invalido",
  "guardado",
  "repetido",
];
const RESULTADOS_CONFIRMAR: readonly string[] = [
  "no_autorizado",
  "no_confirmada",
  "confirmada",
  "repetida",
];
const RESULTADOS_SUCESO: readonly string[] = ["registrado", "saturado", "descartado", "invalido"];

const caido = (): ErrorDeAplicacion => new ErrorDeAplicacion("almacen_no_disponible");

function esObjeto(v: unknown): v is Record<string, unknown> {
  return v !== null && typeof v === "object" && !Array.isArray(v);
}
const clavesExactas = (o: Record<string, unknown>, claves: string[]): boolean => {
  const propias = Object.keys(o).sort();
  return propias.length === claves.length && propias.every((c, i) => c === [...claves].sort()[i]);
};

function formaEnviar(r: unknown): RespuestaEnviar {
  if (
    esObjeto(r) &&
    clavesExactas(r, ["resultado"]) &&
    typeof r.resultado === "string" &&
    RESULTADOS_ENVIAR.includes(r.resultado)
  ) {
    return { resultado: r.resultado as RespuestaEnviar["resultado"] };
  }
  throw new ErrorDeAplicacion("almacen_no_disponible");
}

function formaConfirmar(r: unknown): RespuestaConfirmar {
  if (
    esObjeto(r) &&
    clavesExactas(r, ["resultado"]) &&
    typeof r.resultado === "string" &&
    RESULTADOS_CONFIRMAR.includes(r.resultado)
  ) {
    return { resultado: r.resultado as RespuestaConfirmar["resultado"] };
  }
  throw new ErrorDeAplicacion("almacen_no_disponible");
}

function formaObtener(r: unknown): RespuestaObtener {
  if (!esObjeto(r)) throw new ErrorDeAplicacion("almacen_no_disponible");
  if (r.resultado === "no_autorizado" && clavesExactas(r, ["resultado"])) {
    return { resultado: "no_autorizado" };
  }
  if (
    r.resultado === "servido" &&
    clavesExactas(r, ["resultado", "estado", "ejecucion_id", "orden"]) &&
    typeof r.estado === "string" &&
    ESTADOS.includes(r.estado) &&
    typeof r.ejecucion_id === "string" &&
    RE_UUID.test(r.ejecucion_id)
  ) {
    const orden = r.orden;
    if (orden === null) {
      return {
        resultado: "servido",
        estado: r.estado as EstadoServido,
        ejecucion_id: r.ejecucion_id,
        orden: null,
      };
    }
    if (
      esObjeto(orden) &&
      clavesExactas(orden, ["id", "tipo"]) &&
      typeof orden.id === "string" &&
      RE_UUID.test(orden.id) &&
      typeof orden.tipo === "string" &&
      TIPOS_ORDEN.includes(orden.tipo)
    ) {
      return {
        resultado: "servido",
        estado: r.estado as EstadoServido,
        ejecucion_id: r.ejecucion_id,
        orden: { id: orden.id, tipo: orden.tipo as TipoOrden },
      };
    }
  }
  throw new ErrorDeAplicacion("almacen_no_disponible");
}

export interface OpcionesAlmacen {
  /** Plazo por llamada; por defecto 5 s (diseño §Datos). Solo se cambia en pruebas. */
  readonly tiempoMs?: number;
}

export function crearAlmacen(adaptador: AdaptadorAlmacen, opciones: OpcionesAlmacen = {}): Almacen {
  const tiempoMs = opciones.tiempoMs ?? TIEMPO_LLAMADA_MS;

  // Una llamada, una función, con plazo. Todo error se sustituye por el mismo código fijo.
  // Limitación conocida (A-22): el plazo no cancela la consulta que ya está en cola o en marcha en el
  // agrupador; solo deja de esperarla. Quien la acota es el `statement_timeout` del rol.
  const llamar = async (funcion: string, argumentos: unknown[]): Promise<unknown> => {
    let temporizador: ReturnType<typeof setTimeout> | undefined;
    const plazo = new Promise<never>((_, rechazar) => {
      temporizador = setTimeout(() => rechazar(caido()), tiempoMs);
    });
    try {
      return await Promise.race([adaptador.llamar(funcion, argumentos), plazo]);
    } catch {
      throw new ErrorDeAplicacion("almacen_no_disponible");
    } finally {
      clearTimeout(temporizador);
    }
  };

  return {
    async validarAcceso(tokenHmac, recurso) {
      const r = await llamar("validar_acceso", [tokenHmac, recurso]);
      if (typeof r !== "boolean") throw new ErrorDeAplicacion("almacen_no_disponible");
      return r;
    },
    async obtenerInstrucciones(tokenHmac, recurso) {
      return formaObtener(await llamar("mcp_obtener_instrucciones", [tokenHmac, recurso]));
    },
    async enviarInforme(tokenHmac, recurso, ejecucionId, informe, descartados) {
      let texto: string | null = null;
      if (informe !== null) {
        try {
          texto = JSON.stringify(informe);
        } catch {
          texto = null;
        }
      }
      return formaEnviar(
        await llamar("mcp_enviar_informe", [tokenHmac, recurso, ejecucionId, texto, descartados]),
      );
    },
    async confirmarOrden(tokenHmac, recurso, ordenId) {
      return formaConfirmar(await llamar("mcp_confirmar_orden", [tokenHmac, recurso, ordenId]));
    },
    async registrarSuceso(s) {
      const r = await llamar("registrar_suceso", [
        s.tokenHmac,
        s.ruta,
        s.herramienta,
        s.resultado,
        s.codigo,
        s.duracionMs,
        s.protocolo,
      ]);
      if (
        !esObjeto(r) ||
        !clavesExactas(r, ["resultado"]) ||
        typeof r.resultado !== "string" ||
        !RESULTADOS_SUCESO.includes(r.resultado)
      ) {
        throw new ErrorDeAplicacion("almacen_no_disponible");
      }
    },
  };
}
