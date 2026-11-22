// Cifras ficticias de la muestra que siguen al selector de periodo (T-010 (c) y (e); REQ-006). Las
// pinta el servidor a partir del periodo que lee la vista de la dirección (`?periodo=`): al
// cambiar el periodo, `SelectorPeriodo` pide la vista de nuevo con `router.replace` y llegan las
// cifras del periodo nuevo. Es un componente de servidor: no pide nada desde el navegador (regla 1
// de los componentes). Las tarjetas de cifra de verdad son de T-010 (e) a (g). Datos ficticios
// que llegan por propiedades; no lee nada de la petición.
import { periodoActivo, type ConfiguracionDePeriodo } from "@/components/armazon/periodo";

export function CifrasDeMuestra({
  periodo,
  etiquetas,
  cifrasPorPeriodo,
}: {
  periodo: ConfiguracionDePeriodo;
  etiquetas: readonly string[];
  cifrasPorPeriodo: Readonly<Record<string, readonly string[]>>;
}) {
  const activo = periodoActivo(periodo);
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
