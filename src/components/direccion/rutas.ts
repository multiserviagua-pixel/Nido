// Direcciones internas (diseño, «Dirección de la página»; REQ-059, REQ-083). Se construyen a
// partir de una lista cerrada de plantillas. Un identificador solo se inserta si cumple el
// formato exacto; si no, la dirección es la del Resumen de su área. Con ese formato no puede
// entrar una barra, un punto, un espacio ni un carácter codificado: un dato no puede llevar a
// otra ruta. La ruta con identificador de cliente no se usa en ninguna vista hasta que
// coordinación aplique la nota aclaratoria del artículo 2.

import { escribirEstadoDireccion, type Esquema, type EstadoDe } from "./estado-direccion";

/** UUID en minúsculas, 36 caracteres. Es el tipo de las claves de `docs/MODELO-DATOS.sql`. */
export const FORMATO_DE_IDENTIFICADOR =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

export function esIdentificador(valor: unknown): valor is string {
  return typeof valor === "string" && FORMATO_DE_IDENTIFICADOR.test(valor);
}

/** Cierra en fallo: solo rutas internas (`/…`); ni `//host` (mismo esquema, otro sitio), ni
 * `https:`, ni `javascript:`, ni relativas. Ni `\` (los navegadores lo tratan como `/`) ni
 * caracteres de control (se eliminan al analizar la dirección y convertirían `/<tab>/host` en
 * `//host`). Lo usan `CuentaUsuario` (enlaces del panel) y el cambio de periodo (`router.replace`):
 * una ruta que no pasa por aquí no se navega (art. 3). */
export function esRutaInterna(ruta: unknown): ruta is string {
  if (typeof ruta !== "string" || !ruta.startsWith("/") || ruta.startsWith("//")) return false;
  return !/[\\\p{Cc}]/u.test(ruta);
}

const MARCA_DE_IDENTIFICADOR = "{id}";

export const PLANTILLAS = {
  admin_resumen: "/admin",
  admin_clientes: "/admin/clientes",
  admin_cliente: "/admin/clientes/{id}",
  admin_ordenes: "/admin/ordenes",
  admin_orden: "/admin/ordenes/{id}",
  admin_auditoria: "/admin/auditoria",
  admin_ajustes: "/admin/ajustes",
  panel_resumen: "/panel",
  panel_actividad: "/panel/actividad",
  panel_suscripcion: "/panel/suscripcion",
  panel_cuenta: "/panel/cuenta",
} as const;

export type PlantillaDeRuta = keyof typeof PLANTILLAS;

const RAIZ = "/";
const RESUMEN_DE_ADMIN = PLANTILLAS.admin_resumen;
const RESUMEN_DE_PANEL = PLANTILLAS.panel_resumen;

export type OpcionesDeRuta<E extends Esquema = Esquema> = {
  /** Identificador para las plantillas que lo llevan. Mal formado: se va al Resumen. */
  id?: unknown;
  /** Esquema de la vista. La consulta no se pasa nunca escrita: la escribe
   * `escribirEstadoDireccion` a partir de `esquema` y `estado`, que solo admiten enteros,
   * listas cerradas e identificadores. */
  esquema?: E;
  estado?: Partial<EstadoDe<E>>;
};

// Un campo identificador no viaja en las direcciones del panel (art. 2: el cliente sale de la
// sesión, nunca de la dirección). Se quitan del esquema antes de escribir.
export function esquemaSinIdentificadores(esquema: Esquema): Esquema {
  return Object.fromEntries(
    Object.entries(esquema).filter(([, campo]) => campo?.tipo !== "identificador"),
  );
}

/** Construye una dirección interna. Cierra en fallo: una plantilla que no existe da la raíz y un
 * identificador mal formado da el Resumen del área. */
export function construirRuta<E extends Esquema = Esquema>(
  plantilla: PlantillaDeRuta,
  opciones: OpcionesDeRuta<E> = {},
): string {
  if (typeof plantilla !== "string" || !Object.hasOwn(PLANTILLAS, plantilla)) return RAIZ;
  const molde: string = PLANTILLAS[plantilla];
  const esPanel = molde.startsWith(RESUMEN_DE_PANEL);
  const resumen = esPanel ? RESUMEN_DE_PANEL : RESUMEN_DE_ADMIN;
  let ruta = molde;
  if (molde.includes(MARCA_DE_IDENTIFICADOR)) {
    if (!esIdentificador(opciones.id)) return resumen;
    ruta = molde.split(MARCA_DE_IDENTIFICADOR).join(opciones.id);
  }
  const { esquema, estado } = opciones;
  if (typeof esquema !== "object" || esquema === null) return ruta;
  const permitido = esPanel ? esquemaSinIdentificadores(esquema) : esquema;
  return `${ruta}${escribirEstadoDireccion(permitido, (estado ?? {}) as Record<string, never>)}`;
}
