// Patrones de secretos compartidos por el gancho de Claude Code
// (.claude/hooks/bloquear-secretos.mjs) y por el comprobador
// (scripts/comprobar-specs.mjs).
//
// Es una barrera de ayuda, no una garantía: el escáner de secretos del CI
// y la revisión siguen siendo necesarios.

export const PATRONES = [
  { nombre: 'clave secreta de Supabase', patron: /sb_secret_[A-Za-z0-9_-]{16,}/ },
  { nombre: 'clave de Stripe', patron: /\b(?:sk|rk)_(?:live|test)_[A-Za-z0-9]{16,}/ },
  { nombre: 'secreto de webhook de Stripe', patron: /\bwhsec_[A-Za-z0-9]{16,}/ },
  { nombre: 'token con formato JWT', patron: /\beyJ[A-Za-z0-9_-]{15,}\.eyJ[A-Za-z0-9_-]{15,}\.[A-Za-z0-9_-]{10,}/ },
  { nombre: 'clave privada', patron: /-----BEGIN [A-Z ]*PRIVATE KEY-----/ },
  { nombre: 'cadena de conexión con contraseña', patron: /\bpostgres(?:ql)?:\/\/[^\s:@/]+:[^\s@/]{6,}@/ },
  { nombre: 'token de GitHub', patron: /\bgh[pousr]_[A-Za-z0-9]{30,}/ },
  { nombre: 'clave de un proveedor de IA', patron: /\bsk-(?:ant|proj)-[A-Za-z0-9_-]{20,}/ },
  // Formas propias del conector (001, T-101): prefijo + 256 bits en base64url (43 caracteres) o en base64 estándar; sin exclusión por la izquierda (se ve dentro de URL, JSON y registros).
  { nombre: 'token de acceso del conector', patron: /hia_a_[A-Za-z0-9_+/=-]{43,}/ },
  { nombre: 'token de renovación del conector', patron: /hia_r_[A-Za-z0-9_+/=-]{43,}/ },
  { nombre: 'credencial de operación del conector', patron: /hia_op_[A-Za-z0-9_+/=-]{43,}/ },
  // Código de activación: 12 caracteres Crockford base32 (sin I, L, O, U) en tres grupos de cuatro.
  {
    nombre: 'código de activación del conector',
    patron: /(?<![0-9A-Z-])[0-9A-HJKMNP-TV-Z]{4}-[0-9A-HJKMNP-TV-Z]{4}-[0-9A-HJKMNP-TV-Z]{4}(?![0-9A-Z-])/,
  },
  {
    nombre: 'variable con valor secreto',
    patron: /\b[A-Z][A-Z0-9_]*(?:SECRET|SECRETO|TOKEN|PASSWORD|CONTRASENA|API_KEY|PRIVATE_KEY)[A-Z0-9_]*\s*[=:]\s*["']?[A-Za-z0-9+/_-]{24,}/,
  },
];

// Devuelve los nombres de los patrones que aparecen en el texto.
// Nunca devuelve el valor encontrado.
export function buscarSecretos(texto) {
  if (typeof texto !== 'string' || texto.length === 0) return [];
  return PATRONES.filter((p) => p.patron.test(texto)).map((p) => p.nombre);
}

// Archivos de entorno que solo escribe una persona.
export function esArchivoDeEntorno(nombreDeArchivo) {
  return /^\.env(\..+)?$/.test(nombreDeArchivo) && nombreDeArchivo !== '.env.example';
}
