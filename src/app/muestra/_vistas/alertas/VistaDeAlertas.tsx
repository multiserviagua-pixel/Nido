// Páginas de `ListaAlertas` en la muestra (T-010 (i); CA-012, CA-041, CA-051, CA-006). Un estado por
// página fija. Los datos son ficticios; las entradas «desconocidas» llevan cadenas testigo que la
// prueba comprueba que no aparecen.
import type { ReactNode } from "react";
import { MarcoDeComponente } from "../cifras/marco";
import { HOSTILES, nombreDe120 } from "../tabla/datos-ficticios";
import { AlertasInteractivas } from "./AlertasInteractivas";
import { TEXTOS_ALERTAS as T } from "./textos-alertas";

export type EstadoDeAlertas = keyof typeof T.explicaciones;

const M1 = "2026-11-12T07:04:00Z";
const M2 = "2026-11-11T21:30:00+01:00";
const M3 = "2026-11-10T09:05:00Z";

const ALERTAS: Readonly<Record<EstadoDeAlertas, readonly unknown[]>> = {
  gravedades: [
    { gravedad: "critica", tipo: "agente_sin_senal", momento: M1, cliente: "Cliente de ejemplo 1" },
    {
      gravedad: "aviso",
      tipo: "licencia_por_caducar",
      momento: M2,
      cliente: "Cliente de ejemplo 2",
    },
    { gravedad: "informacion", tipo: "revision_completada", momento: M3 },
  ],
  "con-accion": [
    {
      gravedad: "critica",
      tipo: "agente_sin_senal",
      momento: M1,
      cliente: "Cliente de ejemplo 1",
      accion: "reanudar_agente",
    },
    {
      gravedad: "aviso",
      tipo: "licencia_por_caducar",
      momento: M2,
      cliente: "Cliente de ejemplo 2",
      accion: "revisar_licencia",
    },
    { gravedad: "informacion", tipo: "revision_completada", momento: M3 },
  ],
  "accion-en-curso": [
    {
      gravedad: "critica",
      tipo: "agente_sin_senal",
      momento: M1,
      cliente: "Cliente de ejemplo 1",
      accion: "reanudar_agente",
      enCurso: true,
    },
    { gravedad: "aviso", tipo: "licencia_por_caducar", momento: M2, accion: "revisar_licencia" },
  ],
  vacia: [],
  desconocidas: [
    {
      gravedad: "urgente",
      tipo: "TESTIGO-TIPO-INVENTADO",
      momento: "ayer",
      cliente: "Cliente de ejemplo 3",
      accion: "TESTIGO-ACCION-INVENTADA",
      mensaje: "TESTIGO-CAMPO-DE-MAS-1",
      detalle: "TESTIGO-CAMPO-DE-MAS-2",
      id: "TESTIGO-CAMPO-DE-MAS-3",
    },
    { gravedad: "critica", tipo: "agente_sin_senal", momento: M1, enCurso: "true" },
    null,
    "TESTIGO-CADENA-SUELTA",
  ],
  "nombres-largos-120": [
    {
      gravedad: "critica",
      tipo: "agente_sin_senal",
      momento: M1,
      cliente: nombreDe120(0),
      accion: "reanudar_agente",
    },
    { gravedad: "aviso", tipo: "licencia_por_caducar", momento: M2, cliente: nombreDe120(1) },
  ],
  // La primera lleva la cadena hostil también como tipo, gravedad, acción y momento: nada de eso
  // debe llegar al documento.
  "texto-hostil": HOSTILES.map((h, i) =>
    i === 0
      ? { gravedad: h, tipo: h, momento: h, cliente: h, accion: h }
      : { gravedad: "aviso", tipo: "licencia_por_caducar", momento: M1, cliente: h },
  ),
};

export function VistaDeAlertas({
  titulo,
  estado,
}: {
  titulo: string;
  estado: EstadoDeAlertas;
}): ReactNode {
  return (
    <MarcoDeComponente titulo={titulo}>
      <section aria-labelledby="alertas-titulo" className="flex min-w-0 flex-col gap-4">
        <h2 id="alertas-titulo">{T.titulo}</h2>
        <p className="text-cuerpo-menor text-texto-secundario">{T.explicaciones[estado]}</p>
        <AlertasInteractivas alertas={ALERTAS[estado]} />
      </section>
    </MarcoDeComponente>
  );
}
