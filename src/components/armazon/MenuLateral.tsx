import { MarcaDelProducto } from "../marca";
import { TEXTOS } from "../textos";
import type { Area } from "./areas";
import { ListaDeAreas } from "./ListaDeAreas";

/**
 * Menú lateral (diseño 020, «Armazón»; REQ-002, REQ-003, REQ-010, REQ-038): `nav` con nombre
 * accesible, fondo oscuro con el degradado del menú y la lista cerrada de áreas. Solo se ve desde
 * 1024 px: por debajo está oculto (`display: none`: ni se pinta, ni sale en el árbol de
 * accesibilidad, ni recibe el foco) y lo sustituye `CajonMenu`. La marca `data-menu-lateral` la
 * usa el cajón para devolver el foco aquí si la ventana se ensancha con el cajón abierto.
 * Arriba, el logotipo y el nombre del producto (REQ-087, T-015); el logotipo es decorativo.
 */
export function MenuLateral({ areas, areaActual }: { areas: readonly Area[]; areaActual: string }) {
  return (
    <nav
      aria-label={TEXTOS.armazon.navegacionPrincipal}
      data-menu-lateral
      className="hidden bg-menu-fondo bg-degradado-menu py-4 text-menu-texto lg:block lg:w-menu-ancho lg:shrink-0"
    >
      <MarcaDelProducto />
      <ListaDeAreas areas={areas} areaActual={areaActual} />
    </nav>
  );
}
