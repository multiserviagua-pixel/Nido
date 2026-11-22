"use client";

// Cuenta del usuario (diseño 020, «Armazón»; REQ-005, REQ-065, REQ-083): un botón visible en todos
// los anchos que abre un panel con el nombre completo de la cuenta y las acciones que le pase la
// 021. Los datos llegan por propiedades desde la sesión: este componente no lee la dirección ni
// guarda nada (REQ-058, REQ-083). Panel modal de `dialogo/PanelModal` (primitiva de T-001, la
// misma del cajón): foco atrapado y devuelto al botón, Escape, fondo inerte. El nombre es un dato: pasa por
// `textoPlano`/`TextoDato`. En el botón puede acortarse con CSS (el texto sigue entero en el
// documento); el panel lo parte en líneas (`bdi`), nunca lo recorta.
import { PanelModal } from "../dialogo/PanelModal";
import { IconoUsuario } from "../iconos";
import { textoPlano } from "../formato/texto-plano";
import { TextoDato } from "../texto/TextoDato";
import { TEXTOS } from "../textos";

export type AccionDeCuenta = {
  readonly clave: string;
  /** Texto del enlace; sale de `textos.ts`. */
  readonly etiqueta: string;
  /** Dirección interna: empieza por `/` y no por `//`; cualquier otra se descarta. Solo enlaces
   * (GET): cerrar sesión por POST (021) necesitará otro tipo de acción. */
  readonly ruta: string;
};

export type DatosDeCuenta = {
  /** Nombre de la cuenta con sesión iniciada: viene de la sesión, nunca de la dirección. */
  readonly nombre: string;
  /** Acciones del panel. Enlaces con texto fijo: el tipo no admite nodos libres. */
  readonly acciones?: readonly AccionDeCuenta[];
};

/** Cierra en fallo: solo rutas internas (`/…`); ni `//host` (mismo esquema, otro sitio), ni
 * `https:`, ni `javascript:`, ni relativas. */
function esRutaInterna(ruta: unknown): boolean {
  if (typeof ruta !== "string" || !ruta.startsWith("/") || ruta.startsWith("//")) return false;
  // Ni `\` (los navegadores lo tratan como `/`) ni caracteres de control (se eliminan al analizar
  // la dirección y convertirían `/\t/host` en `//host`).
  return !/[\\\p{Cc}]/u.test(ruta);
}

export function CuentaUsuario({ cuenta }: { cuenta: DatosDeCuenta }) {
  const nombre = textoPlano(cuenta.nombre).trim() || TEXTOS.cuenta.sinNombre;
  const acciones = (cuenta.acciones ?? []).filter((a) => esRutaInterna(a.ruta));
  return (
    <PanelModal
      titulo={TEXTOS.cuenta.titulo}
      etiquetaCerrar={TEXTOS.cuenta.cerrar}
      disparador={
        <button
          type="button"
          aria-label={`${TEXTOS.cuenta.abrir}: ${nombre}`}
          className="inline-flex min-h-10 min-w-10 max-w-full items-center justify-center gap-2 rounded-medio border border-borde-control bg-superficie px-2 text-texto sm:max-w-1/3"
        >
          <IconoUsuario tamano={20} />
          <span data-nombre-acortable className="hidden min-w-0 truncate sm:inline">
            {nombre}
          </span>
        </button>
      }
    >
      <p className="text-cuerpo-menor text-texto-secundario">{TEXTOS.cuenta.sesionIniciadaComo}</p>
      <p className="pb-3 font-seminegrita">
        <TextoDato texto={nombre} />
      </p>
      {acciones.length > 0 ? (
        <ul className="flex flex-col gap-1 border-t border-borde-decorativo pt-3">
          {acciones.map((accion) => (
            <li key={accion.clave}>
              <a
                href={accion.ruta}
                className="inline-flex min-h-10 items-center text-enlace underline"
              >
                {accion.etiqueta}
              </a>
            </li>
          ))}
        </ul>
      ) : null}
    </PanelModal>
  );
}
