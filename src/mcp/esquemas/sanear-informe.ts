// Descarte de campos ajenos del informe (T-105 d, 001; diseño §Herramientas; REQ-013; art. 1).
// Del informe y de `comprobaciones` pasan solo las claves propias del contrato (`informe.schema.json`,
// única fuente); las demás se CUENTAN sin leer su valor y sin guardar ni registrar su nombre
// (también `__proto__` y `constructor`, que JSON.parse crea como claves propias). La validación de
// lo limpio la hace después Ajv (`validarInforme`); aquí no se corrige ni se rellena nada.
import informe from "../../../contratos/informe.schema.json";

export interface InformeSaneado {
  /** Copia con solo claves del contrato, o null si lo recibido no es un objeto simple. */
  readonly informe: Record<string, unknown> | null;
  /** Cuántas claves ajenas traía (informe y comprobaciones). Solo el número. */
  readonly descartados: number;
}

const CLAVES = new Set<string>(Object.keys(informe.properties));
const CLAVES_COMPROBACIONES = new Set<string>(
  Object.keys(informe.properties.comprobaciones.properties),
);

function esObjetoSimple(valor: unknown): valor is Record<string, unknown> {
  if (valor === null || typeof valor !== "object" || Array.isArray(valor)) return false;
  const prototipo = Object.getPrototypeOf(valor);
  return prototipo === Object.prototype || prototipo === null;
}

// Copia las claves permitidas y cuenta las demás. Solo se lee el valor de las permitidas.
function filtrar(
  origen: Record<string, unknown>,
  permitidas: Set<string>,
): [Record<string, unknown>, number] {
  const limpio: Record<string, unknown> = {};
  let descartados = 0;
  for (const clave of Object.keys(origen)) {
    if (permitidas.has(clave)) limpio[clave] = origen[clave];
    else descartados++;
  }
  return [limpio, descartados];
}

export function sanearInforme(entrada: unknown): InformeSaneado {
  try {
    if (!esObjetoSimple(entrada)) return { informe: null, descartados: 0 };
    const [limpio, extras] = filtrar(entrada, CLAVES);
    let descartados = extras;
    if (esObjetoSimple(limpio.comprobaciones)) {
      const [comprobaciones, ajenas] = filtrar(limpio.comprobaciones, CLAVES_COMPROBACIONES);
      limpio.comprobaciones = comprobaciones;
      descartados += ajenas;
    }
    return { informe: limpio, descartados };
  } catch {
    // Objeto hostil (getters, proxies): cierre en fallo, sin propagar nada de él.
    return { informe: null, descartados: 0 };
  }
}
