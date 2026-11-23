// Páginas de `Formulario` en la muestra (T-016 (a); CA-014, CA-017, CA-041, CA-045). Un estado por
// página fija, con datos ficticios.
import type { ReactNode } from "react";
import type { DefinicionDeCampo } from "@/components/formulario/logica";
import { TEXTOS } from "@/components/textos";
import { MarcoDeComponente } from "../cifras/marco";
import { DemoDeFormulario } from "./DemoDeFormulario";
import { TEXTOS_FORMULARIO as T } from "./textos-formulario";

export type EstadoDeFormulario = keyof typeof T.explicaciones;
const E = TEXTOS.formulario.ejemplo;

const PLANES = [
  { valor: "basico", etiqueta: E.planBasico },
  { valor: "profesional", etiqueta: E.planProfesional },
  { valor: "equipo", etiqueta: E.planEquipo },
] as const;
const PERIODICIDADES = [
  { valor: "diaria", etiqueta: E.periodicidadDiaria },
  { valor: "semanal", etiqueta: E.periodicidadSemanal },
] as const;

const CAMPOS_DE_LA_FICHA: readonly DefinicionDeCampo[] = [
  {
    clave: "nombre",
    tipo: "texto",
    etiqueta: E.nombre,
    ayuda: E.nombreAyuda,
    obligatorio: true,
    longitudMaxima: 120,
  },
  { clave: "codigo", tipo: "texto", etiqueta: E.codigo, longitudMaxima: 20 },
  {
    clave: "descripcion",
    tipo: "texto_largo",
    etiqueta: E.descripcion,
    ayuda: E.descripcionAyuda,
    longitudMaxima: 500,
  },
  { clave: "plan", tipo: "seleccion", etiqueta: E.plan, obligatorio: true, opciones: PLANES },
  {
    clave: "periodicidad",
    tipo: "grupo",
    etiqueta: E.periodicidad,
    obligatorio: true,
    opciones: PERIODICIDADES,
  },
  { clave: "avisos", tipo: "casilla", etiqueta: E.avisos },
  { clave: "condiciones", tipo: "casilla", etiqueta: E.condiciones, obligatorio: true },
  {
    clave: "busqueda",
    tipo: "busqueda",
    etiqueta: E.busqueda,
    ayuda: E.busquedaAyuda,
    longitudMaxima: 60,
  },
];

const CAMPOS_DE_TIPOS: readonly DefinicionDeCampo[] = [
  {
    clave: "texto_o",
    tipo: "texto",
    etiqueta: E.textoObligatorio,
    obligatorio: true,
    longitudMaxima: 40,
  },
  { clave: "texto_p", tipo: "texto", etiqueta: E.textoOpcional, longitudMaxima: 40 },
  {
    clave: "largo_o",
    tipo: "texto_largo",
    etiqueta: E.largoObligatorio,
    obligatorio: true,
    longitudMaxima: 200,
  },
  { clave: "largo_p", tipo: "texto_largo", etiqueta: E.largoOpcional, longitudMaxima: 200 },
  {
    clave: "seleccion_o",
    tipo: "seleccion",
    etiqueta: E.seleccionObligatoria,
    obligatorio: true,
    opciones: PLANES,
  },
  { clave: "seleccion_p", tipo: "seleccion", etiqueta: E.seleccionOpcional, opciones: PLANES },
  {
    clave: "grupo_o",
    tipo: "grupo",
    etiqueta: E.grupoObligatorio,
    obligatorio: true,
    opciones: PERIODICIDADES,
  },
  { clave: "grupo_p", tipo: "grupo", etiqueta: E.grupoOpcional, opciones: PERIODICIDADES },
  { clave: "casilla_o", tipo: "casilla", etiqueta: E.casillaObligatoria, obligatorio: true },
  { clave: "casilla_p", tipo: "casilla", etiqueta: E.casillaOpcional },
  {
    clave: "busqueda_o",
    tipo: "busqueda",
    etiqueta: E.busquedaObligatoria,
    obligatorio: true,
    longitudMaxima: 40,
  },
  { clave: "busqueda_p", tipo: "busqueda", etiqueta: E.busquedaOpcional, longitudMaxima: 40 },
];

export function VistaDeFormulario({
  titulo,
  estado,
}: {
  titulo: string;
  estado: EstadoDeFormulario;
}): ReactNode {
  const tipos = estado === "tipos-de-campo";
  const respuesta =
    estado === "error-servidor"
      ? "campo_conocido"
      : estado === "enviando"
        ? "sin_respuesta"
        : estado === "conexion-perdida"
          ? "sin_conexion"
          : "hecha";
  return (
    <MarcoDeComponente titulo={titulo}>
      <section aria-labelledby="formulario-titulo" className="flex min-w-0 flex-col gap-4">
        <h2 id="formulario-titulo">{T.titulo}</h2>
        <p className="text-cuerpo-menor text-texto-secundario">{T.explicaciones[estado]}</p>
        <DemoDeFormulario
          nombre={E.nombreDelFormulario}
          campos={tipos ? CAMPOS_DE_TIPOS : CAMPOS_DE_LA_FICHA}
          textoEnviar={tipos ? E.guardarTipos : E.guardar}
          respuestaInicial={respuesta}
          intentadoAlCargar={estado === "enviado-vacio"}
        />
      </section>
    </MarcoDeComponente>
  );
}
