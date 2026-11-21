// Vista de la muestra para las entradas `armazon-*` del inventario (T-010 (a)). Monta `Armazon`
// con las áreas de superadmin o con el juego de cliente de la muestra. Los enlaces del menú van a
// los estados de la propia muestra (la 020 no crea rutas bajo `src/app/admin/` ni `panel/`). Datos
// ficticios, ninguno real ni de la petición.
//
// Las tres zonas del cuerpo llevan marcadores honestos: las tarjetas, tablas, gráficos y alertas
// los traen T-010 (e) a (i); aquí solo se enseña la estructura y su orden.
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AREAS_CLIENTE_MUESTRA, AREAS_SUPERADMIN, type Area } from "@/components/armazon/areas";
import { Armazon } from "@/components/armazon/Armazon";
import { RejillaCuerpo } from "@/components/armazon/RejillaCuerpo";
import { TextoDato } from "@/components/texto/TextoDato";
import { buscarEstado, rutaDeEstado } from "../inventario";

const JUEGOS: ReadonlyMap<string, readonly Area[]> = new Map([
  ["armazon-superadmin", AREAS_SUPERADMIN],
  ["armazon-cliente", AREAS_CLIENTE_MUESTRA],
]);

/** Nombre ficticio de 120 caracteres sin un solo espacio: el peor caso para partir líneas. */
const NOMBRE_LARGO_FICTICIO = "Ficticio".repeat(15);

/** Título de la vista y del documento: distinto en cada estado y sin datos. */
export function tituloDeArmazon(clave: string, estado: string): string {
  const encontrado = buscarEstado(clave, estado);
  // Lo que no está en el inventario no existe (el 1 a 1 con las páginas lo comprueba una prueba).
  if (encontrado === undefined) notFound();
  return `${encontrado.entrada.nombre}: ${encontrado.estado.nombre}`;
}

/** Metadatos fijos de la página de un estado (la plantilla del título la pone el layout raíz). */
export function metadatosDeArmazon(clave: string, estado: string): Metadata {
  return { title: tituloDeArmazon(clave, estado) };
}

export function VistaDeArmazon({ clave, estado }: { clave: string; estado: string }) {
  const encontrado = buscarEstado(clave, estado);
  const areas = JUEGOS.get(clave);
  if (encontrado === undefined || areas === undefined) notFound();
  const largo = estado === "nombre-largo-120";
  // Los enlaces del menú llevan a los estados de esta misma entrada.
  const areasDeMuestra = areas.map((a) => ({
    ...a,
    ruta: rutaDeEstado(encontrado.entrada, a.clave),
  }));
  return (
    <Armazon
      areas={areasDeMuestra}
      areaActual={largo ? "clientes" : estado}
      titulo={tituloDeArmazon(clave, estado)}
    >
      <RejillaCuerpo
        cifras={
          <section aria-labelledby="zona-cifras">
            <h2 id="zona-cifras">Cifras</h2>
            <p>Marcador: aquí irán las tarjetas de cifra (T-010 (e)).</p>
          </section>
        }
        contenido={
          <section aria-labelledby="zona-contenido">
            <h2 id="zona-contenido">Contenido</h2>
            <p>Marcador: aquí irán los gráficos y las tablas (T-010 (g) y (h)).</p>
            {largo ? (
              <p>
                Cliente: <TextoDato texto={NOMBRE_LARGO_FICTICIO} />
              </p>
            ) : null}
          </section>
        }
        alertas={
          <section aria-labelledby="zona-alertas">
            <h2 id="zona-alertas">Alertas</h2>
            <p>Marcador: aquí irá la lista de alertas (T-010 (i)).</p>
          </section>
        }
      />
    </Armazon>
  );
}
