"use client";

// Tabla de la muestra con un servidor simulado (T-010 (g)): la página y el orden viven en el
// estado de este componente, como los pondría una vista en su dirección, y cada cambio pide solo
// las filas de la página nueva (`pedirPagina`). La tabla es la real y nunca recibe más de una
// página. Sin red: la muestra no hace peticiones.
import { useState } from "react";
import { Tabla } from "@/components/tabla/Tabla";
import type { CambioDeTabla } from "@/components/tabla/logica";
import { columnasDe, pedirPagina, type ConfiguracionDeTabla } from "./datos-ficticios";

export function TablaInteractiva({
  titulo,
  configuracion,
}: {
  titulo: string;
  configuracion: ConfiguracionDeTabla;
}) {
  const [estado, fijarEstado] = useState<CambioDeTabla>({
    pagina: configuracion.paginaInicial,
    orden: configuracion.ordenInicial,
  });
  const filas = pedirPagina(configuracion, estado.pagina, estado.orden);
  return (
    <Tabla
      titulo={titulo}
      columnas={columnasDe(configuracion.conjunto)}
      filas={filas}
      total={configuracion.total}
      pagina={estado.pagina}
      orden={estado.orden}
      alCambiar={fijarEstado}
    />
  );
}
