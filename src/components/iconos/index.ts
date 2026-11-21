// Un componente por icono. `ICONOS` los reúne por nombre para quien necesita elegir uno por clave
// (áreas del menú, catálogo de estados). Origen y fecha de cada uno en `LICENCIAS.md`.
import { IconoResumen } from "./IconoResumen";
import { IconoClientes } from "./IconoClientes";
import { IconoOrdenes } from "./IconoOrdenes";
import { IconoAuditoria } from "./IconoAuditoria";
import { IconoActividad } from "./IconoActividad";
import { IconoSuscripcion } from "./IconoSuscripcion";
import { IconoNeutro } from "./IconoNeutro";
import { IconoPausa } from "./IconoPausa";
import { IconoAlertas } from "./IconoAlertas";
import { IconoAjustes } from "./IconoAjustes";
import { IconoCerrar } from "./IconoCerrar";
import { IconoMenu } from "./IconoMenu";
import { IconoAbrirCajon } from "./IconoAbrirCajon";
import { IconoCerrarCajon } from "./IconoCerrarCajon";
import { IconoBuscar } from "./IconoBuscar";
import { IconoOrdenar } from "./IconoOrdenar";
import { IconoOrdenAscendente } from "./IconoOrdenAscendente";
import { IconoOrdenDescendente } from "./IconoOrdenDescendente";
import { IconoPaginaAnterior } from "./IconoPaginaAnterior";
import { IconoPaginaSiguiente } from "./IconoPaginaSiguiente";
import { IconoCopiar } from "./IconoCopiar";
import { IconoAdvertencia } from "./IconoAdvertencia";
import { IconoError } from "./IconoError";
import { IconoCorrecto } from "./IconoCorrecto";
import { IconoInformacion } from "./IconoInformacion";
import { IconoSinConexion } from "./IconoSinConexion";
import { IconoUsuario } from "./IconoUsuario";
import { IconoSalir } from "./IconoSalir";
import { IconoSol } from "./IconoSol";
import { IconoLuna } from "./IconoLuna";

export type { PropiedadesIcono } from "./BaseIcono";
export {
  IconoResumen,
  IconoClientes,
  IconoOrdenes,
  IconoAuditoria,
  IconoActividad,
  IconoSuscripcion,
  IconoNeutro,
  IconoPausa,
  IconoAlertas,
  IconoAjustes,
  IconoCerrar,
  IconoMenu,
  IconoAbrirCajon,
  IconoCerrarCajon,
  IconoBuscar,
  IconoOrdenar,
  IconoOrdenAscendente,
  IconoOrdenDescendente,
  IconoPaginaAnterior,
  IconoPaginaSiguiente,
  IconoCopiar,
  IconoAdvertencia,
  IconoError,
  IconoCorrecto,
  IconoInformacion,
  IconoSinConexion,
  IconoUsuario,
  IconoSalir,
  IconoSol,
  IconoLuna,
};

export const ICONOS = {
  IconoResumen,
  IconoClientes,
  IconoOrdenes,
  IconoAuditoria,
  IconoActividad,
  IconoSuscripcion,
  IconoNeutro,
  IconoPausa,
  IconoAlertas,
  IconoAjustes,
  IconoCerrar,
  IconoMenu,
  IconoAbrirCajon,
  IconoCerrarCajon,
  IconoBuscar,
  IconoOrdenar,
  IconoOrdenAscendente,
  IconoOrdenDescendente,
  IconoPaginaAnterior,
  IconoPaginaSiguiente,
  IconoCopiar,
  IconoAdvertencia,
  IconoError,
  IconoCorrecto,
  IconoInformacion,
  IconoSinConexion,
  IconoUsuario,
  IconoSalir,
  IconoSol,
  IconoLuna,
} as const;

export type NombreIcono = keyof typeof ICONOS;
