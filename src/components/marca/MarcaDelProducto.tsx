import { TEXTOS } from "../textos";
import { LogotipoNido } from "./LogotipoNido";

/**
 * Logotipo y nombre del producto, juntos, para la parte alta del menú (REQ-005, REQ-087). El
 * nombre es texto visible y es lo único que se anuncia: el logotipo es decorativo. Fuera de la
 * lista de áreas, para que no cuente como un área más. Si el nombre no cabe en una línea, pasa a
 * la siguiente.
 */
export function MarcaDelProducto() {
  return (
    <div className="flex items-center gap-3 px-4 pb-4">
      <LogotipoNido variante="menu-oscuro" lado={32} />
      <span className="min-w-0 text-cuerpo font-seminegrita text-menu-texto">
        {TEXTOS.marca.nombreProducto}
      </span>
    </div>
  );
}
