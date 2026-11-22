// Armazón de las páginas de propuesta y de valores (T-012): el `Armazon` real (menú, cabecera y
// cuenta) con las áreas de superadmin y datos ficticios, como el resto de la muestra. El menú
// apunta al índice de la muestra, no a rutas de `/admin` (la 020 no las crea). Ningún área queda
// marcada: la página es de la muestra, no un área del producto. Importa la hoja de la propuesta.
import type { ReactNode } from "react";
import { AREAS_SUPERADMIN } from "@/components/armazon/areas";
import { Armazon } from "@/components/armazon/Armazon";
import { TEXTOS } from "@/components/textos";
import "./propuesta.css";

const AREAS_DE_LA_MUESTRA = AREAS_SUPERADMIN.map((a) => ({ ...a, ruta: "/muestra" }));

export function PaginaDeMuestra({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <Armazon
      areas={AREAS_DE_LA_MUESTRA}
      areaActual="muestra"
      titulo={titulo}
      cuenta={{
        nombre: "Usuario Ficticio",
        acciones: [
          { clave: "cerrar-sesion", etiqueta: TEXTOS.cuenta.cerrarSesion, ruta: "/muestra" },
        ],
      }}
    >
      {children}
    </Armazon>
  );
}
