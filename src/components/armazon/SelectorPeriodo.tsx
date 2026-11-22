"use client";

// Selector de periodo (diseño 020, «Armazón» y «Una vista en uso», «Cambio de periodo»; REQ-006,
// REQ-059): un `select` nativo con etiqueta visible sobre la lista cerrada de periodos que declara
// la vista, y junto a él el periodo con palabras y fechas. El valor va en la dirección (solo una
// clave de la lista) y el cambio se anuncia. Se maneja con teclado porque es el control nativo.
//
// El cambio llama, dentro de la transición del armazón, a `router.replace(ruta, { scroll: false })`:
// no añade entrada al historial, no recarga el documento y el foco se queda en el `select` (React
// conserva el elemento al fundir la respuesta del servidor). La vista de servidor se vuelve a
// pintar con el periodo nuevo; mientras tanto las zonas de datos están en `carga`
// (`ZonaDeDatos`). El `select` enseña el valor elegido con `useOptimistic` y, si la transición
// falla o se descarta, vuelve al de la vista (`periodo.valor`, leído de la dirección en el
// servidor). La ruta sale solo de `location.pathname` y pasa por `rutaParaCambiarPeriodo`, que la
// descarta si no es interna; la consulta se lee de `location.search` solo a través del esquema de
// la vista (`esquemaDeLaVista`). Con `navigator.onLine === false` al elegir no se navega (Next 16
// pasaría a una carga completa y el navegador enseñaría su página de error): el `select` se queda
// en el periodo de las cifras que se ven, con el foco, y junto a él un aviso anunciado una vez que
// se retira al siguiente cambio o con el evento `online` («Cambio de periodo», punto 7). No se guarda nada en el navegador (REQ-058). Este es el único
// componente de `src/components/` que importa `next/navigation` (PRUEBA-008).
import { useRouter } from "next/navigation";
import { useEffect, useId, useOptimistic, useState } from "react";
import { anunciar } from "../texto/anuncios";
import { TEXTOS } from "../textos";
import {
  periodoActivo,
  periodosValidos,
  rutaParaCambiarPeriodo,
  textoDePeriodo,
  type ConfiguracionDePeriodo,
} from "./periodo";
import { useTransicionDePeriodo } from "./TransicionDePeriodo";

export function SelectorPeriodo({ periodo }: { periodo: ConfiguracionDePeriodo }) {
  const id = useId();
  const router = useRouter();
  const { iniciar } = useTransicionDePeriodo();
  const [elegido, fijarElegido] = useOptimistic(periodo.valor);
  const [sinConexion, fijarSinConexion] = useState(false);
  // Solo mientras se ve el aviso: al volver la conexión se retira.
  useEffect(() => {
    if (!sinConexion) return undefined;
    const retirar = (): void => fijarSinConexion(false);
    window.addEventListener("online", retirar);
    return () => window.removeEventListener("online", retirar);
  }, [sinConexion]);
  const activo = periodoActivo({ ...periodo, valor: elegido });
  if (activo === null) return null;
  return (
    <div className="flex w-full flex-wrap items-center gap-x-3 gap-y-1">
      <label htmlFor={id} className="text-cuerpo-menor font-medio text-texto">
        {TEXTOS.periodo.etiqueta}
      </label>
      <select
        id={id}
        value={activo.clave}
        onChange={(evento) => {
          const nueva = periodosValidos(periodo.periodos).find(
            (p) => p.clave === evento.target.value,
          );
          if (nueva === undefined) return;
          // Falso es fiable (no hay red): no se navega ni se abre la transición. El valor del
          // `select` sigue siendo el de la vista, así que React lo devuelve a él y el foco no sale.
          if (navigator.onLine === false) {
            fijarSinConexion(true);
            anunciar(TEXTOS.periodo.sinConexion);
            return;
          }
          fijarSinConexion(false);
          const ruta = rutaParaCambiarPeriodo(
            window.location.pathname,
            window.location.search,
            periodo,
            nueva.clave,
          );
          // Sin ruta interna no se navega: el select se queda con el valor anterior.
          if (ruta === null) return;
          iniciar(() => {
            fijarElegido(nueva.clave);
            router.replace(ruta, { scroll: false });
          });
          anunciar(`${TEXTOS.periodo.anuncio} ${textoDePeriodo(nueva)}`);
        }}
        className="min-h-10 max-w-full rounded-medio border border-borde-control bg-superficie px-3 text-texto"
      >
        {periodosValidos(periodo.periodos).map((p) => (
          <option key={p.clave} value={p.clave}>
            {p.etiqueta}
          </option>
        ))}
      </select>
      <span className="text-cuerpo-menor text-texto-secundario">{textoDePeriodo(activo)}</span>
      {sinConexion ? (
        <span data-aviso="sin-conexion" className="w-full text-cuerpo-menor text-texto">
          {TEXTOS.periodo.sinConexion}
        </span>
      ) : null}
    </div>
  );
}
