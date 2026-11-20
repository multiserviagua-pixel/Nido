// Suceso tras responder (T-105 b, 001; diseño §Punto MCP paso 10 y §Registros). El suceso lo escribe
// `registrar_suceso` DESPUÉS de que la respuesta salga; si falla, se descarta: no cambia la respuesta,
// no se reintenta y no se registra nada salvo un código cerrado. Campos cerrados: lo que no cumple
// la forma se descarta aquí, antes de llegar al almacén, sin escribir ni el valor ni su nombre (art. 1).
import { after } from "next/server";
import type { Almacen, SucesoAlmacen } from "../supabase/almacen";
import { registrar } from "./registro";

/** Programa una tarea para después de la respuesta (en producción, `after` de Next). */
export type Despues = (tarea: () => Promise<void>) => void;

// Mismas formas que `registrar_suceso` en SQL (001_estado.sql): una sola regla en dos sitios.
const RE_RUTA = /^[a-z0-9_/-]{1,60}$/;
const RE_CODIGO = /^[a-z0-9_]{1,40}$/;
const RE_HMAC = /^[0-9a-f]{64}$/;
const HERRAMIENTAS: readonly string[] = [
  "obtener_instrucciones",
  "enviar_informe",
  "confirmar_orden",
];
const RESULTADOS: readonly string[] = ["correcto", "rechazado", "error"];
const PROTOCOLOS: readonly string[] = ["2025-11-25", "2026-07-28", "otra"];

function formaValida(s: SucesoAlmacen): boolean {
  return (
    typeof s.ruta === "string" &&
    RE_RUTA.test(s.ruta) &&
    typeof s.codigo === "string" &&
    RE_CODIGO.test(s.codigo) &&
    s.codigo !== "registro_saturado" &&
    (s.tokenHmac === null || (typeof s.tokenHmac === "string" && RE_HMAC.test(s.tokenHmac))) &&
    (s.herramienta === null ||
      (typeof s.herramienta === "string" && HERRAMIENTAS.includes(s.herramienta))) &&
    typeof s.resultado === "string" &&
    RESULTADOS.includes(s.resultado) &&
    Number.isInteger(s.duracionMs) &&
    s.duracionMs >= 0 &&
    s.duracionMs <= 600000 &&
    typeof s.protocolo === "string" &&
    PROTOCOLOS.includes(s.protocolo)
  );
}

export function registrarSucesoTrasResponder(
  almacen: Pick<Almacen, "registrarSuceso">,
  suceso: SucesoAlmacen,
  despues: Despues = after,
): void {
  try {
    if (!formaValida(suceso)) return;
    // Copia con solo los campos cerrados: nada más viaja.
    const limpio: SucesoAlmacen = {
      tokenHmac: suceso.tokenHmac,
      ruta: suceso.ruta,
      herramienta: suceso.herramienta,
      resultado: suceso.resultado,
      codigo: suceso.codigo,
      duracionMs: suceso.duracionMs,
      protocolo: suceso.protocolo,
    };
    despues(async () => {
      try {
        await almacen.registrarSuceso(limpio);
      } catch {
        // Descartado: ni mensaje ni causa. Solo un código cerrado y la ruta ya validada.
        try {
          registrar("aviso", "almacen_no_disponible", limpio.ruta);
        } catch {
          // El registro tampoco puede cambiar la respuesta.
        }
      }
    });
  } catch {
    // Sin petición en curso o programador roto: el suceso se descarta.
  }
}
