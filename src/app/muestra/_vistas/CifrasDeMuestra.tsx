"use client";

// Cifras ficticias de la muestra que siguen al selector de periodo (T-010 (c); REQ-006): al
// cambiar el periodo cambian todas, sin recargar. Hace el papel de la vista real, que vuelve a
// pedir sus datos con `usePeriodo`. Las tarjetas de cifra de verdad son de T-010 (e). Datos
// ficticios que llegan por propiedades; no lee nada de la petición.
import { periodoActivo, type ConfiguracionDePeriodo } from "@/components/armazon/periodo";
import { usePeriodo } from "@/components/armazon/usePeriodo";

export function CifrasDeMuestra({
  periodo,
  etiquetas,
  cifrasPorPeriodo,
}: {
  periodo: ConfiguracionDePeriodo;
  etiquetas: readonly string[];
  cifrasPorPeriodo: Readonly<Record<string, readonly string[]>>;
}) {
  const clave = usePeriodo(periodo);
  const activo = periodoActivo({ ...periodo, valor: clave });
  const cifras = cifrasPorPeriodo[activo?.clave ?? ""] ?? [];
  return (
    <dl>
      {etiquetas.map((etiqueta, i) => (
        <div key={etiqueta}>
          <dt>{etiqueta}</dt>
          <dd data-cifra>{cifras[i]}</dd>
        </div>
      ))}
    </dl>
  );
}
