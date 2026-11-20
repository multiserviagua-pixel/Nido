// Adaptador PGlite del almacén (T-102, 001).
// El diseño no define aún la interfaz del almacén de producto (la 001 §Datos solo fija que la fase 2
// cambia únicamente `almacen.ts` y que cada llamada es `select conector_prueba.f(...)`). Esta es una
// interfaz LOCAL mínima de la batería; T-104 la sustituirá o adaptará a la real.
import type { BdApoyo } from "./bd";

export interface AlmacenPrueba {
  /** Una llamada, una función: `select conector_prueba.<funcion>($1, ...)`. Devuelve la primera columna. */
  llamar(funcion: string, argumentos: unknown[]): Promise<unknown>;
  /** Simula el almacén caído (cierre en fallo): toda llamada falla hasta `caer(false)`. */
  caer(caido: boolean): void;
}

export class ErrorAlmacen extends Error {
  /** Solo un SQLSTATE de cinco caracteres o «simulado»; nunca texto de la base (puede llevar datos). */
  readonly causa: string;
  constructor(causa: string) {
    super("almacén caído");
    this.name = "ErrorAlmacen";
    this.causa = /^[0-9A-Z]{5}$/.test(causa) || causa === "simulado" ? causa : "desconocida";
  }
}

const NOMBRE = /^[a-z][a-z0-9_]{0,62}$/;

/** Fallo de la comprobación del rol: no es un almacén caído, y se explica. */
class ErrorRolAlmacen extends Error {}

/**
 * El rol de llamada no puede saltarse la seguridad por filas (art. 2): se rechazan los superusuarios,
 * los roles con bypassrls y los que son dueños (o miembros del dueño) de una tabla con RLS activada
 * pero sin force, que harían pasar pruebas de aislamiento que en producción fallarían. La comprobación
 * se repite en cada llamada: un `alter role` posterior no la esquiva.
 */
export async function crearAlmacenPglite(bd: BdApoyo, rol: string): Promise<AlmacenPrueba> {
  const comprobarRol = async () => {
    const fila = (
      await bd.db.query<{ rolsuper: boolean; rolbypassrls: boolean; dueno: string | null }>(
        `select r.rolsuper, r.rolbypassrls,
           (select c.relname from pg_class c join pg_namespace n on n.oid = c.relnamespace
             where c.relkind in ('r','p') and c.relrowsecurity and not c.relforcerowsecurity
               and n.nspname not in ('pg_catalog', 'information_schema')
               and pg_has_role(r.oid, c.relowner, 'member') limit 1) as dueno
         from pg_roles r where r.rolname = $1`,
        [rol],
      )
    ).rows[0];
    if (!fila) throw new ErrorRolAlmacen("almacén: el rol de llamada no existe");
    if (fila.rolsuper) throw new ErrorRolAlmacen("almacén: el rol de llamada es superusuario");
    if (fila.rolbypassrls) throw new ErrorRolAlmacen("almacén: el rol de llamada tiene bypassrls");
    if (fila.dueno !== null) {
      throw new ErrorRolAlmacen(
        "almacén: el rol de llamada es dueño (o miembro del dueño) de una tabla con RLS sin force",
      );
    }
  };
  await comprobarRol();
  let caido = false;
  return {
    caer(valor) {
      caido = valor;
    },
    async llamar(funcion, argumentos) {
      // El nombre se valida: nunca se compone SQL con texto no controlado; los valores van por parámetros.
      if (!NOMBRE.test(funcion)) throw new Error("almacén: nombre de función no válido");
      if (caido) throw new ErrorAlmacen("simulado");
      const marcas = argumentos.map((_, i) => `$${i + 1}`).join(", ");
      try {
        const resultado = await bd.como(rol, async () => {
          await comprobarRol();
          return bd.db.query<{ r: unknown }>(
            `select conector_prueba.${funcion}(${marcas}) as r`,
            argumentos,
          );
        });
        return resultado.rows[0]?.r;
      } catch (e) {
        if (e instanceof ErrorRolAlmacen) throw e;
        const codigo = (e as { code?: unknown } | null)?.code;
        throw new ErrorAlmacen(typeof codigo === "string" ? codigo : "desconocida");
      }
    },
  };
}
