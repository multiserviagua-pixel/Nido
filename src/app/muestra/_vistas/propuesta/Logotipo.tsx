// Un logotipo de la propuesta visual a un lado dado (T-012). Se dibuja desde los datos de
// `logotipos.ts` (los SVG de la propuesta, con sus colores como pasos de la escala): sin
// identificadores, sin degradados dentro del SVG y sin colores literales. Decorativo: el nombre de la
// propuesta va en el encabezado de su tarjeta (REQ-087 pide el nombre una vez, no repetido).
import { createElement } from "react";
import { LOGOTIPOS, type Forma, type Variante } from "./logotipos";

export type FondoDeLogotipo = "claro" | "oscuro" | "propio";

/** `stroke-width` pasa a `strokeWidth`, etc. */
function aCamello(nombre: string): string {
  return nombre.replace(/-([a-z])/g, (_m, c: string) => c.toUpperCase());
}

function FormaSvg({ forma }: { forma: Forma }) {
  const propiedades: Record<string, string> = {};
  for (const [k, v] of Object.entries(forma.geometria)) propiedades[aCamello(k)] = v;
  const clases = [
    forma.relleno === null ? "" : `lg-relleno-${forma.relleno}`,
    forma.trazo === null ? "" : `lg-trazo-${forma.trazo}`,
  ]
    .filter((c) => c !== "")
    .join(" ");
  if (clases !== "") propiedades.className = clases;
  // Un trazo sin relleno necesita `fill="none"`; lo demás, el relleno de la clase.
  if (forma.relleno === null) propiedades.fill = "none";
  return createElement(forma.el, propiedades);
}

export function Logotipo({
  propuesta,
  variante,
  lado,
  fondo,
}: {
  propuesta: "a" | "b" | "c";
  variante: Variante;
  lado: number;
  fondo: FondoDeLogotipo;
}) {
  const datos = LOGOTIPOS[propuesta].variantes[variante];
  const dibujo = (
    <svg
      data-lado-svg={lado}
      viewBox="0 0 64 64"
      width={lado}
      height={lado}
      aria-hidden="true"
      focusable="false"
      className="block"
    >
      {datos.grupo === undefined ? (
        datos.formas.map((f, i) => <FormaSvg key={i} forma={f} />)
      ) : (
        <g transform={datos.grupo}>
          {datos.formas.map((f, i) => (
            <FormaSvg key={i} forma={f} />
          ))}
        </g>
      )}
    </svg>
  );
  return (
    <span
      data-logotipo={propuesta}
      data-variante={variante}
      data-fondo={fondo}
      data-lado={lado}
      className="inline-block"
    >
      {datos.fondo === undefined ? (
        dibujo
      ) : (
        <span className={`lg-icono lg-fondo-${datos.fondo.desde}-${datos.fondo.hasta} block`}>
          {dibujo}
        </span>
      )}
    </span>
  );
}
