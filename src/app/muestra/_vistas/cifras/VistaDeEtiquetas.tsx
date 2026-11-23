// Páginas de `EtiquetaEstado` en la muestra (T-010 (f); CA-009, CA-051). El catálogo, cada estado
// con su palabra; y los valores fuera del catálogo, entre ellos una respuesta simulada con tres
// campos de más de los que la página lee solo el del estado.
import type { ReactNode } from "react";
import { CLAVES_DE_ESTADO } from "@/components/estado/catalogo";
import { EtiquetaEstado } from "@/components/estado/EtiquetaEstado";
import { MarcoDeComponente } from "./marco";
import { TEXTOS_CIFRAS as T } from "./textos-cifras";

// Cadenas testigo: la prueba comprueba que no aparecen en ningún sitio (REQ-075, V-2).
const RESPUESTA_CON_CAMPOS_DE_MAS: Readonly<Record<string, unknown>> = {
  estado: "activo",
  campoDeMas1: "TESTIGO-CAMPO-DE-MAS-1",
  campoDeMas2: "TESTIGO-CAMPO-DE-MAS-2",
  campoDeMas3: "TESTIGO-CAMPO-DE-MAS-3",
};

type CasoFuera = { clave: string; pie: string; ambito: string; valor: unknown };
const FUERA_DEL_CATALOGO: readonly CasoFuera[] = [
  { clave: "inventado", pie: T.desconocidos.inventado, ambito: "agente", valor: "inventado" },
  { clave: "mayusculas", pie: T.desconocidos.mayusculas, ambito: "agente", valor: "ACTIVO" },
  { clave: "vacio", pie: T.desconocidos.vacio, ambito: "agente", valor: "" },
  { clave: "ausente", pie: T.desconocidos.ausente, ambito: "agente", valor: undefined },
  { clave: "objeto", pie: T.desconocidos.objeto, ambito: "agente", valor: { estado: "activo" } },
  { clave: "ambito", pie: T.desconocidos.ambito, ambito: "cliente", valor: "activo" },
];

function Fila({ clave, pie, children }: { clave: string; pie: string; children: ReactNode }) {
  return (
    <li data-caso={clave} className="flex flex-wrap items-center gap-3">
      {children}
      <span className="text-pequeno text-texto-secundario">{pie}</span>
    </li>
  );
}

export function VistaDeEtiquetas({
  titulo,
  estado,
}: {
  titulo: string;
  estado: string;
}): ReactNode {
  if (estado === "catalogo") {
    return (
      <MarcoDeComponente titulo={titulo}>
        <section aria-labelledby="etiquetas-titulo" className="flex flex-col gap-4">
          <h2 id="etiquetas-titulo">{T.catalogo}</h2>
          <ul className="flex flex-col gap-3">
            {CLAVES_DE_ESTADO.filter((c) => c !== "desconocido").map((clave) => {
              const [ambito = "", valor = ""] = clave.split(".");
              return (
                <Fila key={clave} clave={clave} pie={clave}>
                  <EtiquetaEstado ambito={ambito} valor={valor} />
                </Fila>
              );
            })}
          </ul>
        </section>
      </MarcoDeComponente>
    );
  }
  if (estado === "desconocido") {
    return (
      <MarcoDeComponente titulo={titulo}>
        <section aria-labelledby="etiquetas-titulo" className="flex flex-col gap-4">
          <h2 id="etiquetas-titulo">{T.desconocido}</h2>
          <ul className="flex flex-col gap-3">
            {FUERA_DEL_CATALOGO.map((caso) => (
              <Fila key={caso.clave} clave={caso.clave} pie={caso.pie}>
                <EtiquetaEstado ambito={caso.ambito} valor={caso.valor} />
              </Fila>
            ))}
            <Fila clave="campos-de-mas" pie={T.respuestaConCamposDeMas}>
              {/* Solo se lee el campo `estado`: el resto de la respuesta no se reparte. */}
              <EtiquetaEstado ambito="agente" valor={RESPUESTA_CON_CAMPOS_DE_MAS.estado} />
            </Fila>
          </ul>
          <p className="text-cuerpo-menor text-texto-secundario">{T.sinNombrar}</p>
        </section>
      </MarcoDeComponente>
    );
  }
  return null;
}
