// Áreas del armazón (diseño 020, «Armazón»; REQ-003, REQ-010). Listas cerradas: el tipo no tiene
// ningún campo para una entrada desactivada, «próximamente» o de una fase posterior; si un área no
// existe, no está aquí. Ocultar una entrada no es control de acceso: la autorización la decide el
// servidor (V-1). Las rutas son las de `docs/ESQUELETO.md`; la 020 no crea ninguna bajo
// `src/app/admin/` ni `src/app/panel/`: las monta la 021 y la fase 5.
import type { NombreIcono } from "../iconos";
import { TEXTOS } from "../textos";

export type Area = {
  /** Clave estable, en minúscula y sin tildes. */
  readonly clave: string;
  /** Texto del menú; sale de `textos.ts`. */
  readonly etiqueta: string;
  /** Dirección interna, sin consulta, fragmento ni identificador. */
  readonly ruta: string;
  readonly icono: NombreIcono;
};

function cerrar(lista: readonly Area[]): readonly Area[] {
  return Object.freeze(lista.map((a) => Object.freeze({ ...a })));
}

/** Fase 3, superadmin: exactamente estas cinco, en este orden. */
export const AREAS_SUPERADMIN: readonly Area[] = cerrar([
  { clave: "resumen", etiqueta: TEXTOS.areas.resumen, ruta: "/admin", icono: "IconoResumen" },
  {
    clave: "clientes",
    etiqueta: TEXTOS.areas.clientes,
    ruta: "/admin/clientes",
    icono: "IconoClientes",
  },
  {
    clave: "ordenes",
    etiqueta: TEXTOS.areas.ordenes,
    ruta: "/admin/ordenes",
    icono: "IconoOrdenes",
  },
  {
    clave: "auditoria",
    etiqueta: TEXTOS.areas.auditoria,
    ruta: "/admin/auditoria",
    icono: "IconoAuditoria",
  },
  {
    clave: "ajustes",
    etiqueta: TEXTOS.areas.ajustes,
    ruta: "/admin/ajustes",
    icono: "IconoAjustes",
  },
]);

/** Juego de la muestra para probar el armazón con otras áreas (REQ-010). El real lo fija la fase 5. */
export const AREAS_CLIENTE_MUESTRA: readonly Area[] = cerrar([
  { clave: "resumen", etiqueta: TEXTOS.areas.resumen, ruta: "/panel", icono: "IconoResumen" },
  {
    clave: "actividad",
    etiqueta: TEXTOS.areas.actividad,
    ruta: "/panel/actividad",
    icono: "IconoActividad",
  },
  {
    clave: "suscripcion",
    etiqueta: TEXTOS.areas.suscripcion,
    ruta: "/panel/suscripcion",
    icono: "IconoSuscripcion",
  },
  {
    clave: "cuenta",
    etiqueta: TEXTOS.areas.cuenta,
    ruta: "/panel/cuenta",
    icono: "IconoUsuario",
  },
]);
