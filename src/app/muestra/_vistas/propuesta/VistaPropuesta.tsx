// Contenido de `/muestra/propuesta-visual` (T-012; REQ-086): lo que el responsable valida en T-013.
// Paleta y degradados en los dos temas, tres propuestas de logotipo a 16, 32 y 128 px sobre claro y
// sobre oscuro, y tres vistas de ejemplo en los dos temas. Las vistas son una maqueta estática
// (ver `Maquetas.tsx`): la página lo dice. Datos ficticios; sin campos ni enlaces con consulta.
import { Logotipo } from "./Logotipo";
import { LOGOTIPOS } from "./logotipos";
import {
  MaquetaResumenCliente,
  MaquetaResumenSuperadmin,
  MaquetaTablaConDialogo,
  MarcoDeVista,
} from "./Maquetas";
import { PaginaDeMuestra } from "./PaginaDeMuestra";
import { MarcoDePaleta } from "./Paleta";
import { TEXTOS_PROPUESTA } from "./textos-propuesta";

const LADOS = [16, 32, 128] as const;
const T = TEXTOS_PROPUESTA;

/** Un bloque de la tarjeta de una propuesta: etiqueta, lienzo con los tres tamaños y su pie. */
function BloqueDeLogotipo({
  etiqueta,
  clasesDelLienzo,
  propuesta,
  variante,
  fondo,
}: {
  etiqueta: string;
  clasesDelLienzo: string;
  propuesta: "a" | "b" | "c";
  variante: "fondo-claro" | "menu-oscuro" | "icono";
  fondo: "claro" | "oscuro" | "propio";
}) {
  return (
    <div className="min-w-0">
      <p className="text-cuerpo-menor font-medio text-texto">{etiqueta}</p>
      <div className={`${clasesDelLienzo} mt-2 flex flex-wrap items-end gap-4 rounded-medio p-4`}>
        {LADOS.map((lado) => (
          <Logotipo
            key={lado}
            propuesta={propuesta}
            variante={variante}
            lado={lado}
            fondo={fondo}
          />
        ))}
      </div>
      <p className="mt-1 text-pequeno text-texto-secundario">
        {LADOS.join(", ")} {T.logotipos.pixeles}
      </p>
    </div>
  );
}

export function VistaPropuesta() {
  return (
    <PaginaDeMuestra titulo={T.titulo}>
      <div className="flex flex-col gap-10">
        <section aria-labelledby="propuesta-introduccion" className="flex flex-col gap-4">
          <h2 id="propuesta-introduccion" className="text-subtitulo font-seminegrita text-texto">
            Qué se ve aquí
          </h2>
          <p className="text-cuerpo text-texto">{T.introduccion}</p>
          <p className="rounded-medio border border-borde-decorativo bg-acento-suave p-4 text-cuerpo text-texto">
            {T.declaracion}
          </p>
        </section>

        <section aria-labelledby="propuesta-paleta" className="flex flex-col gap-4">
          <h2 id="propuesta-paleta" className="text-subtitulo font-seminegrita text-texto">
            {T.paleta.titulo}
          </h2>
          <p className="text-cuerpo text-texto">{T.paleta.texto}</p>
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <MarcoDePaleta tema="claro" />
            <MarcoDePaleta tema="oscuro" />
          </div>
        </section>

        <section aria-labelledby="propuesta-logotipos" className="flex flex-col gap-4">
          <h2 id="propuesta-logotipos" className="text-subtitulo font-seminegrita text-texto">
            {T.logotipos.titulo}
          </h2>
          <p className="text-cuerpo text-texto">{T.logotipos.texto}</p>
          {(["a", "b", "c"] as const).map((p) => (
            <article
              key={p}
              aria-labelledby={`propuesta-logotipo-${p}`}
              className="rounded-grande border border-borde-decorativo bg-superficie p-4 shadow-tarjeta"
            >
              <h3
                id={`propuesta-logotipo-${p}`}
                className="text-cuerpo font-seminegrita text-texto"
              >
                {T.logotipos.propuesta} {p.toUpperCase()} · {LOGOTIPOS[p].nombre}
              </h3>
              <div className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-3">
                <BloqueDeLogotipo
                  etiqueta={T.logotipos.sobreClaro}
                  clasesDelLienzo="lienzo-claro"
                  propuesta={p}
                  variante="fondo-claro"
                  fondo="claro"
                />
                <BloqueDeLogotipo
                  etiqueta={T.logotipos.sobreOscuro}
                  clasesDelLienzo="bg-menu-fondo bg-degradado-menu"
                  propuesta={p}
                  variante="menu-oscuro"
                  fondo="oscuro"
                />
                <BloqueDeLogotipo
                  etiqueta={T.logotipos.icono}
                  clasesDelLienzo="border border-borde-decorativo bg-fondo-pagina"
                  propuesta={p}
                  variante="icono"
                  fondo="propio"
                />
              </div>
            </article>
          ))}
        </section>

        <section aria-labelledby="propuesta-vistas" className="flex flex-col gap-8">
          <h2 id="propuesta-vistas" className="text-subtitulo font-seminegrita text-texto">
            {T.vistas.titulo}
          </h2>
          <div className="flex flex-col gap-6">
            <h3 className="text-cuerpo font-seminegrita text-texto">
              {T.vistas.resumenSuperadmin.titulo}
            </h3>
            {(["claro", "oscuro"] as const).map((tema) => (
              <MarcoDeVista
                key={tema}
                vista="resumen-superadmin"
                tema={tema}
                titulo={T.vistas.resumenSuperadmin.titulo}
                descripcion={T.vistas.resumenSuperadmin.descripcion}
              >
                <MaquetaResumenSuperadmin />
              </MarcoDeVista>
            ))}
          </div>
          <div className="flex flex-col gap-6">
            <h3 className="text-cuerpo font-seminegrita text-texto">
              {T.vistas.tablaDialogo.titulo}
            </h3>
            {(["claro", "oscuro"] as const).map((tema) => (
              <MarcoDeVista
                key={tema}
                vista="tabla-dialogo"
                tema={tema}
                titulo={T.vistas.tablaDialogo.titulo}
                descripcion={T.vistas.tablaDialogo.descripcion}
              >
                <MaquetaTablaConDialogo />
              </MarcoDeVista>
            ))}
          </div>
          <div className="flex flex-col gap-6">
            <h3 className="text-cuerpo font-seminegrita text-texto">
              {T.vistas.resumenCliente.titulo}
            </h3>
            <div className="flex flex-wrap items-start gap-6">
              {(["claro", "oscuro"] as const).map((tema) => (
                <MarcoDeVista
                  key={tema}
                  vista="resumen-cliente"
                  tema={tema}
                  titulo={T.vistas.resumenCliente.titulo}
                  descripcion={T.vistas.resumenCliente.descripcion}
                  movil
                >
                  <MaquetaResumenCliente />
                </MarcoDeVista>
              ))}
            </div>
          </div>
        </section>
      </div>
    </PaginaDeMuestra>
  );
}
