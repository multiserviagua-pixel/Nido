import type { ReactNode } from "react";
import { textoPlano } from "../formato/texto-plano";
import { TEXTOS } from "../textos";

// `RegionDesplazable` (diseño 020, fila `Tabla`; REQ-044, REQ-045). Si la tabla no cabe, solo se
// desplaza esta región, no la página: región con nombre, enfocable (`tabindex="0"`, para que se
// pueda desplazar con las flechas) y con el foco de `base.css`. No lleva manejadores de teclado,
// de modo que no hay trampa: Tab entra y Tab sale. El nombre es un dato de la vista (limpio de
// invisibles y de dirección); sin nombre válido, el de reserva, para no dejar una región sin
// nombre. Sin `style`: el ancho lo da el contenedor.

export function RegionDesplazable({ nombre, children }: { nombre: string; children: ReactNode }) {
  const limpio = typeof nombre === "string" ? textoPlano(nombre).trim() : "";
  return (
    <div
      role="region"
      aria-label={limpio === "" ? TEXTOS.tabla.sinTitulo : limpio}
      tabIndex={0}
      className="max-w-full overflow-x-auto"
    >
      {children}
    </div>
  );
}
