// Contenido de `/muestra/valores` (T-012): la escala de `valores.css` pintada. Cada muestra usa la
// clase de `propuesta.css` que lee el paso (`var(--escala-…)`), no un valor copiado, así que lo que
// se ve es lo que dice la hoja; el nombre y el valor del texto salen de `escala.ts`, que una prueba
// compara con `valores.css`. Las sombras salen en los dos temas a la vez. Sin campos ni datos reales.
import type { ReactNode } from "react";
import { ESCALA, SOMBRAS } from "./escala";
import { PaginaDeMuestra } from "./PaginaDeMuestra";
import { TEXTOS_PROPUESTA } from "./textos-propuesta";

const T = TEXTOS_PROPUESTA.valores;
const PREFIJO = "--escala-";

/** Los colores de `escala.ts` van sin `#`; aquí se les devuelve para mostrarlos. */
function paraMostrar(valor: string): string {
  return /^[0-9A-F]{6}$/.test(valor) ? `#${valor}` : valor;
}

/** Pasos de la escala cuyo nombre (sin prefijo) empieza por alguno de los prefijos dados. */
function pasos(...prefijos: string[]): Array<{ token: string; nombre: string; valor: string }> {
  return Object.entries(ESCALA)
    .filter(([k]) => prefijos.some((p) => k.startsWith(`${PREFIJO}${p}`)))
    .map(([token, valor]) => ({
      token,
      nombre: token.slice(PREFIJO.length),
      valor: paraMostrar(valor),
    }));
}

const FAMILIAS_DE_COLOR = [
  { clave: "neutro", titulo: "Neutro" },
  { clave: "noche", titulo: "Noche (menú)" },
  { clave: "acento", titulo: "Acento" },
  { clave: "estados", titulo: "Estados", prefijos: ["correcto-", "aviso-", "error-"] },
] as const;

function Seccion({
  clave,
  titulo,
  children,
}: {
  clave: string;
  titulo: string;
  children: ReactNode;
}) {
  return (
    <section
      data-escala-seccion={clave}
      aria-labelledby={`valores-${clave}`}
      className="flex flex-col gap-4"
    >
      <h2 id={`valores-${clave}`} className="text-subtitulo font-seminegrita text-texto">
        {titulo}
      </h2>
      {children}
    </section>
  );
}

function Fila({ muestra, token, valor }: { muestra: ReactNode; token: string; valor: string }) {
  return (
    <li className="flex flex-wrap items-center gap-x-3 gap-y-1" data-escala={token}>
      {muestra}
      <span className="min-w-0">
        <span className="block break-words text-cuerpo-menor font-medio text-texto">{token}</span>
        <span className="block break-words text-pequeno text-texto-secundario">{valor}</span>
      </span>
    </li>
  );
}

const REJILLA = "grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3";

/** Una sombra o el velo, sobre una superficie, en el tema del marco. */
function MarcoDeSombras({ tema }: { tema: "claro" | "oscuro" }) {
  const nombres = ["tarjeta", "elevada", "velo"] as const;
  return (
    <div
      data-tema-muestra={tema}
      className={`tema-${tema} min-w-0 rounded-grande border border-borde-decorativo bg-fondo-pagina p-4 text-texto`}
    >
      <p className="text-cuerpo font-seminegrita">
        {tema === "claro" ? TEXTOS_PROPUESTA.temaClaro : TEXTOS_PROPUESTA.temaOscuro}
      </p>
      <ul className="mt-4 flex flex-col gap-6">
        {nombres.map((n) => {
          const token = `${PREFIJO}sombra-${n}-${tema}`;
          return (
            <Fila
              key={n}
              token={token}
              valor={SOMBRAS[token] ?? ""}
              muestra={
                n === "velo" ? (
                  <span
                    aria-hidden="true"
                    className="flex h-12 w-24 shrink-0 items-stretch rounded-medio border border-borde-control bg-superficie"
                  >
                    <span className={`m-sombra-velo-${tema} w-12 rounded-l-medio`} />
                  </span>
                ) : (
                  <span
                    aria-hidden="true"
                    className={`m-sombra-${n}-${tema} h-12 w-24 shrink-0 rounded-medio bg-superficie`}
                  />
                )
              }
            />
          );
        })}
      </ul>
    </div>
  );
}

export function VistaValores() {
  return (
    <PaginaDeMuestra titulo={TEXTOS_PROPUESTA.tituloValores}>
      <div className="flex flex-col gap-10">
        <p className="text-cuerpo text-texto">{T.introduccion}</p>

        <Seccion clave="color" titulo={T.color}>
          {FAMILIAS_DE_COLOR.map((f) => {
            const prefijos = "prefijos" in f ? f.prefijos : [`${f.clave}-`];
            return (
              <div key={f.clave} className="flex flex-col gap-3">
                <h3 className="text-cuerpo font-seminegrita text-texto">{f.titulo}</h3>
                <ul className={REJILLA}>
                  {pasos(...prefijos).map((p) => (
                    <Fila
                      key={p.token}
                      token={p.token}
                      valor={p.valor}
                      muestra={
                        <span
                          aria-hidden="true"
                          className={`m-${p.nombre} h-10 w-16 shrink-0 rounded-medio border border-borde-control`}
                        />
                      }
                    />
                  ))}
                </ul>
              </div>
            );
          })}
        </Seccion>

        <Seccion clave="degradados" titulo={T.degradados}>
          <ul className={REJILLA}>
            {pasos("degradado-").map((p) => (
              <Fila
                key={p.token}
                token={p.token}
                valor={p.valor}
                muestra={
                  <span
                    aria-hidden="true"
                    className={`m-${p.nombre} h-10 w-16 shrink-0 rounded-medio border border-borde-control`}
                  />
                }
              />
            ))}
          </ul>
        </Seccion>

        <Seccion clave="espaciado" titulo={T.espaciado}>
          <ul className={REJILLA}>
            {pasos("espaciado-").map((p) => (
              <Fila
                key={p.token}
                token={p.token}
                valor={p.valor}
                muestra={
                  <span className="flex h-4 w-16 shrink-0 items-center" aria-hidden="true">
                    <span className={`m-${p.nombre} h-4 rounded-pequeno bg-acento`} />
                  </span>
                }
              />
            ))}
          </ul>
        </Seccion>

        <Seccion clave="radios" titulo={T.radios}>
          <ul className={REJILLA}>
            {pasos("radio-").map((p) => (
              <Fila
                key={p.token}
                token={p.token}
                valor={p.valor}
                muestra={
                  <span
                    aria-hidden="true"
                    className={`m-${p.nombre} h-12 w-16 shrink-0 border border-borde-control bg-superficie`}
                  />
                }
              />
            ))}
          </ul>
        </Seccion>

        <Seccion clave="sombras" titulo={T.sombras}>
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <MarcoDeSombras tema="claro" />
            <MarcoDeSombras tema="oscuro" />
          </div>
        </Seccion>

        <Seccion clave="texto" titulo={T.texto}>
          <ul className="flex flex-col gap-3">
            {pasos("texto-")
              .filter((p) => !p.nombre.endsWith("-altura"))
              .map((p) => (
                <Fila
                  key={p.token}
                  token={p.token}
                  valor={`${p.valor}; altura de línea ${p.token}-altura: ${ESCALA[`${p.token}-altura`] ?? ""}`}
                  muestra={
                    <span className={`m-${p.nombre} min-w-0 break-words text-texto`}>
                      {T.ejemploTexto}
                    </span>
                  }
                />
              ))}
          </ul>
          <h3 className="text-cuerpo font-seminegrita text-texto">{T.pesos}</h3>
          <ul className="flex flex-col gap-3">
            {pasos("peso-").map((p) => (
              <Fila
                key={p.token}
                token={p.token}
                valor={p.valor}
                muestra={
                  <span className={`m-${p.nombre} min-w-0 break-words text-texto`}>
                    {T.ejemploTexto}
                  </span>
                }
              />
            ))}
          </ul>
        </Seccion>

        <Seccion clave="tamanos" titulo={T.tamanos}>
          <ul className={REJILLA}>
            {pasos("tamano-", "duracion-").map((p) => (
              <Fila
                key={p.token}
                token={p.token}
                valor={p.valor}
                muestra={<span aria-hidden="true" className="w-0" />}
              />
            ))}
          </ul>
        </Seccion>
      </div>
    </PaginaDeMuestra>
  );
}
