// Marco de las páginas de componentes sueltos de la muestra (T-010 (d)): el `Armazon` real con las
// áreas de superadmin y datos ficticios; el menú apunta al índice de la muestra. Ningún área
// queda marcada (no es un área del producto).
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { AREAS_SUPERADMIN } from "@/components/armazon/areas";
import { Armazon } from "@/components/armazon/Armazon";
import { TEXTOS } from "@/components/textos";
import { buscarEstado } from "../../inventario";

const AREAS_DE_LA_MUESTRA = AREAS_SUPERADMIN.map((a) => ({ ...a, ruta: "/muestra" }));

/** Título fijo de un estado de `boton-accion`: el del inventario, sin datos. */
export function tituloDeBoton(estado: string): string {
  const encontrado = buscarEstado("boton-accion", estado);
  if (encontrado === undefined) notFound();
  return `${encontrado.entrada.nombre}: ${encontrado.estado.nombre}`;
}

export function MarcoDeComponente({ titulo, children }: { titulo: string; children: ReactNode }) {
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
