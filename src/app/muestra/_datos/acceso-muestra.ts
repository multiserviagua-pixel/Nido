// Control 2 de la muestra (diseño 020, «Cómo no existe en producción»; REQ-061, CA-046; T-005).
// Es la primera instrucción de cada página, de cada acción de servidor y del `layout` de la
// muestra. Responde como recurso inexistente (`notFound()`, el mismo 404 que una dirección que no
// existe; D-036) salvo que se cumplan las tres cosas:
//   1. la cabecera `Host` es exactamente un nombre de `NOMBRES_DE_SERVIDOR`, con o sin puerto
//      según diga la lista;
//   2. si ese nombre es local (`localhost`, `127.0.0.1`), el proceso no corre en la plataforma:
//      ninguna variable `VERCEL*` con valor (`fueraDeLaPlataforma()` de `configuracion.ts`);
//   3. `ENTORNO`, leído al servir a través de `configuracion.ts`, es `desarrollo` o `preproduccion`.
// Por qué el punto 2 (MAYOR del auditor-seguridad en T-005, art. 3, A-3): `Host` lo escribe el
// cliente, y el control 1 (compilación) y el punto 3 de este leen la misma variable `ENTORNO`.
// Sin el punto 2, en un proyecto de Vercel que no es de producción con `ENTORNO=preproduccion`
// bastaría enviar `Host: localhost` para abrir la muestra. Ahora la independencia entre controles
// no descansa solo en `Host`: un nombre local exige además una señal que el cliente no controla,
// las variables que pone la plataforma. En la plataforma la muestra solo podrá abrirse por un
// nombre propio de preproducción, que aún no existe (ver PENDIENTE).
// Se lee `Host` y solo `Host`: ninguna cabecera que el cliente o un intermediario puedan añadir.
// El nombre de servidor no se pinta, no se guarda y no se registra. Sin mensaje ni motivo: el
// rechazo no dice qué ha fallado. Ante cualquier duda, cierra (art. 3).
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { fueraDeLaPlataforma, leerEntorno } from "@/lib/plataforma/configuracion";

type NombreDeServidor = {
  readonly nombre: string;
  /** `cualquiera`: admite `:<puerto>` de 1 a 65535 sin ceros delante; `ninguno`: solo el nombre. */
  readonly puerto: "cualquiera" | "ninguno";
  /** `true`: nombre local, que solo vale fuera de la plataforma (sin ninguna variable `VERCEL*`). */
  readonly soloFueraDeLaPlataforma: boolean;
};

// Lista escrita en el código: cambiarla pasa por revisión. No lleva el dominio de producción.
// PENDIENTE: `pre-nido.<dominio>`, con `puerto: "ninguno"`, cuando la 002 entregue `<dominio>`
// (dato pendiente del responsable; `plan.md`: no bloquea), y solo con `ENTORNO=preproduccion`.
// Hasta entonces la muestra solo se ve en local, y en la plataforma da 404, que es el lado seguro.
export const NOMBRES_DE_SERVIDOR: readonly NombreDeServidor[] = Object.freeze([
  Object.freeze({ nombre: "localhost", puerto: "cualquiera", soloFueraDeLaPlataforma: true }),
  Object.freeze({ nombre: "127.0.0.1", puerto: "cualquiera", soloFueraDeLaPlataforma: true }),
] as const);

const ENTORNOS_CON_MUESTRA: readonly string[] = ["desarrollo", "preproduccion"];
const PUERTO = /^[1-9][0-9]{0,4}$/;

function entradaAdmitida(host: string): NombreDeServidor | undefined {
  const dosPuntos = host.indexOf(":");
  const nombre = dosPuntos === -1 ? host : host.slice(0, dosPuntos);
  const puerto = dosPuntos === -1 ? undefined : host.slice(dosPuntos + 1);
  const entrada = NOMBRES_DE_SERVIDOR.find((n) => n.nombre === nombre);
  if (entrada === undefined) return undefined;
  if (puerto === undefined) return entrada;
  if (entrada.puerto === "ninguno") return undefined;
  return PUERTO.test(puerto) && Number(puerto) <= 65535 ? entrada : undefined;
}

export async function comprobarAccesoMuestra(): Promise<void> {
  // Lo primero: `headers()` hace que la página se pinte en cada petición y nunca al compilar.
  // No se envuelve en try/catch: si falla, el error sigue su curso y no se pinta nada.
  const cabeceras = await headers();
  let admitida = false;
  try {
    const host = cabeceras.get("host");
    const entrada = typeof host === "string" ? entradaAdmitida(host) : undefined;
    // Solo `true` exacto abre: cualquier otro valor cierra.
    const lugarAdmitido =
      entrada !== undefined && (!entrada.soloFueraDeLaPlataforma || fueraDeLaPlataforma() === true);
    if (lugarAdmitido) {
      const entorno = leerEntorno();
      admitida = entorno !== undefined && ENTORNOS_CON_MUESTRA.includes(entorno);
    }
  } catch {
    admitida = false;
  }
  if (!admitida) notFound();
}
