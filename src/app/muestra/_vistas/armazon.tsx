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
import type { DatosDeCuenta } from "@/components/armazon/CuentaUsuario";
import {
  valorDePeriodo,
  type ConfiguracionDePeriodo,
  type PeriodoDeLista,
} from "@/components/armazon/periodo";
import { RejillaCuerpo } from "@/components/armazon/RejillaCuerpo";
import { TextoDato } from "@/components/texto/TextoDato";
import { TEXTOS } from "@/components/textos";
import { buscarEstado, rutaDeEstado } from "../inventario";
import { CifrasDeMuestra } from "./CifrasDeMuestra";

const JUEGOS: ReadonlyMap<string, readonly Area[]> = new Map([
  ["armazon-superadmin", AREAS_SUPERADMIN],
  ["armazon-cliente", AREAS_CLIENTE_MUESTRA],
]);

/** Nombre ficticio de 120 caracteres sin un solo espacio: el peor caso para partir líneas. */
const NOMBRE_LARGO_FICTICIO = "Ficticio".repeat(15);

/** Nombre ficticio de 120 caracteres con espacios (palabras de 9 caracteres y un espacio). */
const NOMBRE_LARGO_CON_ESPACIOS = Array.from({ length: 12 }, () => "Ficticios")
  .join(" ")
  .padEnd(120, "s");

/** Periodos de la muestra: lista cerrada, con fechas fijas para que la muestra no dependa del día. */
export const PERIODOS_MUESTRA: readonly PeriodoDeLista[] = [
  {
    clave: "ultimos-7-dias",
    etiqueta: TEXTOS.periodo.ultimos7Dias,
    desde: "2026-11-06T00:00:00+01:00",
    hasta: "2026-11-12T23:59:59+01:00",
  },
  {
    clave: "ultimos-30-dias",
    etiqueta: TEXTOS.periodo.ultimos30Dias,
    desde: "2026-10-14T00:00:00+02:00",
    hasta: "2026-11-12T23:59:59+01:00",
  },
  {
    clave: "ultimos-90-dias",
    etiqueta: TEXTOS.periodo.ultimos90Dias,
    desde: "2026-08-14T00:00:00+02:00",
    hasta: "2026-11-12T23:59:59+01:00",
  },
];
const PERIODO_POR_DEFECTO = "ultimos-30-dias";

/** Cifras ficticias por periodo: cambian todas al cambiar el periodo (REQ-006). */
const CIFRAS_POR_PERIODO: Readonly<Record<string, readonly string[]>> = {
  "ultimos-7-dias": ["12", "3", "5"],
  "ultimos-30-dias": ["48", "11", "19"],
  "ultimos-90-dias": ["130", "37", "52"],
};
const ETIQUETAS_DE_CIFRA = ["Cifra ficticia uno", "Cifra ficticia dos", "Cifra ficticia tres"];

/** Estados con selector de periodo. */
const CON_PERIODO = "con-periodo";
/** Estados con la cuenta de 120 caracteres: `nombre-largo-120` sin espacios, el otro con ellos. */
const CUENTA_LARGA_SIN_ESPACIOS = "nombre-largo-120";
const CUENTA_LARGA_CON_ESPACIOS = "cuenta-120-con-espacios";

/** Cuenta ficticia de la muestra. En la real sale de la sesión (la 021); nunca de la dirección. */
function cuentaDeMuestra(estado: string): DatosDeCuenta {
  const nombre =
    estado === CUENTA_LARGA_SIN_ESPACIOS
      ? NOMBRE_LARGO_FICTICIO
      : estado === CUENTA_LARGA_CON_ESPACIOS
        ? NOMBRE_LARGO_CON_ESPACIOS
        : "Usuario Ficticio";
  return {
    nombre,
    acciones: [{ clave: "cerrar-sesion", etiqueta: TEXTOS.cuenta.cerrarSesion, ruta: "/muestra" }],
  };
}

/** El área actual de un estado: la suya si es un área; el nombre largo es una ficha de Clientes y
 * los demás estados (con periodo, cuenta larga) cuelgan del Resumen. */
function areaDeEstado(areas: readonly Area[], estado: string): string {
  if (estado === CUENTA_LARGA_SIN_ESPACIOS) return "clientes";
  return areas.some((a) => a.clave === estado) ? estado : "resumen";
}

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

type Parametros = Readonly<Record<string, string | readonly string[] | undefined>>;

export function VistaDeArmazon({
  clave,
  estado,
  parametros,
}: {
  clave: string;
  estado: string;
  /** Parámetros de la dirección. Solo se lee `periodo`, y solo en los estados con selector. */
  parametros?: Parametros;
}) {
  const encontrado = buscarEstado(clave, estado);
  const areas = JUEGOS.get(clave);
  if (encontrado === undefined || areas === undefined) notFound();
  const largo = estado === CUENTA_LARGA_SIN_ESPACIOS;
  // Los enlaces del menú llevan a los estados de esta misma entrada.
  const areasDeMuestra = areas.map((a) => ({
    ...a,
    ruta: rutaDeEstado(encontrado.entrada, a.clave),
  }));
  const periodo: ConfiguracionDePeriodo | undefined =
    estado === CON_PERIODO
      ? {
          periodos: PERIODOS_MUESTRA,
          porDefecto: PERIODO_POR_DEFECTO,
          valor: valorDePeriodo(PERIODOS_MUESTRA, PERIODO_POR_DEFECTO, parametros ?? {}),
        }
      : undefined;
  return (
    <Armazon
      areas={areasDeMuestra}
      areaActual={areaDeEstado(areas, estado)}
      titulo={tituloDeArmazon(clave, estado)}
      cuenta={cuentaDeMuestra(estado)}
      periodo={periodo}
    >
      <RejillaCuerpo
        cifras={
          <section aria-labelledby="zona-cifras">
            <h2 id="zona-cifras">Cifras</h2>
            {periodo === undefined ? (
              <p>Marcador: aquí irán las tarjetas de cifra (T-010 (e)).</p>
            ) : (
              <CifrasDeMuestra
                periodo={periodo}
                etiquetas={ETIQUETAS_DE_CIFRA}
                cifrasPorPeriodo={CIFRAS_POR_PERIODO}
              />
            )}
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
