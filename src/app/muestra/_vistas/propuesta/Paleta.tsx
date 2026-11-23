// Paleta y degradados de la propuesta, leídos de los papeles de `valores.css` (T-012). Cada muestra
// usa la utilidad del propio papel (`bg-acento`...), no un valor copiado: lo que se ve es lo que el
// sistema pinta. Los dos marcos llevan su tema (`.tema-claro` y `.tema-oscuro`, de `propuesta.css`),
// así que se ven a la vez. Las clases van completas en el texto para que Tailwind las encuentre.
import { TEXTOS_PROPUESTA } from "./textos-propuesta";

type Papel = { readonly papel: string; readonly clase: string; readonly uso: string };

/** Los papeles de color con utilidad en `valores.css` (una prueba comprueba que están todos). */
const COLORES: readonly Papel[] = [
  { papel: "fondo-pagina", clase: "bg-fondo-pagina", uso: "Fondo de la página" },
  { papel: "superficie", clase: "bg-superficie", uso: "Tarjetas, tablas y diálogos" },
  { papel: "texto", clase: "bg-texto", uso: "Texto principal" },
  { papel: "texto-secundario", clase: "bg-texto-secundario", uso: "Etiquetas y ayudas" },
  { papel: "borde-decorativo", clase: "bg-borde-decorativo", uso: "Separa sin delimitar" },
  { papel: "borde-control", clase: "bg-borde-control", uso: "Borde de los controles" },
  { papel: "acento", clase: "bg-acento", uso: "Botón primario y selección" },
  { papel: "enlace", clase: "bg-enlace", uso: "Enlaces" },
  { papel: "texto-sobre-acento", clase: "bg-texto-sobre-acento", uso: "Texto sobre el acento" },
  { papel: "acento-suave", clase: "bg-acento-suave", uso: "Fondo suave de una selección" },
  { papel: "foco", clase: "bg-foco", uso: "Contorno del foco" },
  { papel: "menu-fondo", clase: "bg-menu-fondo", uso: "Menú lateral (igual en los dos temas)" },
  { papel: "menu-texto", clase: "bg-menu-texto", uso: "Texto del menú" },
  {
    papel: "menu-texto-secundario",
    clase: "bg-menu-texto-secundario",
    uso: "Texto menor del menú",
  },
  { papel: "menu-actual", clase: "bg-menu-actual", uso: "Fondo del área actual" },
  { papel: "menu-indicador", clase: "bg-menu-indicador", uso: "Barra del área actual" },
  { papel: "correcto", clase: "bg-correcto", uso: "Estado correcto (con palabra o icono)" },
  { papel: "aviso", clase: "bg-aviso", uso: "Estado de aviso (con palabra o icono)" },
  { papel: "error", clase: "bg-error", uso: "Estado de error (con palabra o icono)" },
  { papel: "serie-1", clase: "bg-serie-1", uso: "Serie 1 de un gráfico" },
  { papel: "serie-2", clase: "bg-serie-2", uso: "Serie 2 de un gráfico" },
  { papel: "serie-3", clase: "bg-serie-3", uso: "Serie 3 de un gráfico" },
  { papel: "serie-4", clase: "bg-serie-4", uso: "Serie 4 de un gráfico" },
];

const DEGRADADOS: readonly Papel[] = [
  { papel: "degradado-menu", clase: "bg-degradado-menu", uso: "Fondo del menú lateral" },
  { papel: "degradado-acento", clase: "bg-degradado-acento", uso: "Botón primario" },
];

function Fila({ papel }: { papel: Papel }) {
  return (
    <li data-papel={papel.papel} className="flex items-center gap-3">
      <span
        aria-hidden="true"
        className={`${papel.clase} h-10 w-16 shrink-0 rounded-medio border border-borde-control`}
      />
      <span className="min-w-0">
        <span className="block text-cuerpo-menor font-medio text-texto">{papel.papel}</span>
        <span className="block text-pequeno text-texto-secundario">{papel.uso}</span>
      </span>
    </li>
  );
}

/** Un marco de paleta en un tema. Los dos llevan los mismos papeles. */
export function MarcoDePaleta({ tema }: { tema: "claro" | "oscuro" }) {
  const textos = TEXTOS_PROPUESTA;
  return (
    <div
      data-seccion="paleta"
      data-tema-muestra={tema}
      className={`tema-${tema} min-w-0 rounded-grande border border-borde-decorativo bg-fondo-pagina p-4 text-texto`}
    >
      <p className="text-subtitulo font-seminegrita">
        {tema === "claro" ? textos.temaClaro : textos.temaOscuro}
      </p>
      <p className="mt-4 text-cuerpo-menor font-medio text-texto-secundario">
        {textos.paleta.colores}
      </p>
      <ul className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {COLORES.map((p) => (
          <Fila key={p.papel} papel={p} />
        ))}
      </ul>
      <p className="mt-6 text-cuerpo-menor font-medio text-texto-secundario">
        {textos.paleta.degradados}
      </p>
      <ul className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {DEGRADADOS.map((p) => (
          <Fila key={p.papel} papel={p} />
        ))}
      </ul>
    </div>
  );
}
