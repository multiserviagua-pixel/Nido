// Las tres vistas de la propuesta como MAQUETA ESTÁTICA (T-012). No son los componentes
// definitivos: la tarjeta de cifra, la etiqueta de estado, la tabla, los gráficos, la lista de
// alertas y el diálogo de confirmación son T-010 (e) a (j) y llegan tras la validación del
// responsable. Aquí hay marcado local, sin lógica ni controles, que solo usa los papeles y las
// utilidades de `valores.css`, con datos ficticios. El menú y los iconos sí son los reales. Cada
// maqueta va dentro de un marco `inert` y oculto al lector de pantalla (no se puede pulsar ni
// enfocar); su descripción textual va en el pie del marco. El gráfico es un dibujo de ejemplo.
import type { ReactNode } from "react";
import { AREAS_SUPERADMIN } from "@/components/armazon/areas";
import { ICONOS } from "@/components/iconos";
import { IconoAdvertencia } from "@/components/iconos/IconoAdvertencia";
import { IconoCorrecto } from "@/components/iconos/IconoCorrecto";
import { IconoError } from "@/components/iconos/IconoError";
import { IconoMenu } from "@/components/iconos/IconoMenu";
import { IconoPausa } from "@/components/iconos/IconoPausa";
import { IconoUsuario } from "@/components/iconos/IconoUsuario";
import { TEXTOS_PROPUESTA } from "./textos-propuesta";

export type TemaDeMuestra = "claro" | "oscuro";

/** Marco de una vista: la descripción va fuera del tema (en el tema de la página); la maqueta,
 * dentro, con los papeles del tema del marco. */
export function MarcoDeVista({
  vista,
  tema,
  titulo,
  descripcion,
  movil,
  children,
}: {
  vista: string;
  tema: TemaDeMuestra;
  titulo: string;
  descripcion: string;
  movil?: boolean;
  children: ReactNode;
}) {
  return (
    <figure data-vista={vista} data-tema-muestra={tema} className="min-w-0">
      <figcaption className="mb-2 text-cuerpo-menor text-texto-secundario">
        <span className="font-medio text-texto">
          {titulo} · {tema === "claro" ? TEXTOS_PROPUESTA.temaClaro : TEXTOS_PROPUESTA.temaOscuro}
        </span>
        <span className="block">{descripcion}</span>
      </figcaption>
      <div
        inert
        aria-hidden="true"
        className={`tema-${tema} ${movil ? "marco-movil" : "w-full"} min-w-0 rounded-grande border border-borde-decorativo bg-fondo-pagina text-texto`}
      >
        {children}
      </div>
    </figure>
  );
}

// ------------------------------------------------------------------ piezas de maqueta

function TarjetaCifra({
  etiqueta,
  cifra,
  cambio,
}: {
  etiqueta: string;
  cifra: string;
  cambio: string;
}) {
  return (
    <div className="rounded-grande border border-borde-decorativo bg-superficie p-4 shadow-tarjeta">
      <p className="text-cuerpo-menor text-texto-secundario">{etiqueta}</p>
      <p data-cifra className="mt-1 text-cifra font-seminegrita text-texto">
        {cifra}
      </p>
      <p className="mt-1 flex items-center gap-1 text-pequeno text-correcto">
        <IconoCorrecto tamano={16} />
        <span>{cambio}</span>
      </p>
    </div>
  );
}

/** Dibujo de ejemplo: dos series sobre la superficie. No es un gráfico real. */
function HuecoDeGrafico() {
  return (
    <div className="rounded-grande border border-borde-decorativo bg-superficie p-4 shadow-tarjeta">
      <p className="text-cuerpo font-seminegrita text-texto">Entregas por día</p>
      <div className="mt-3 rounded-medio border border-borde-decorativo">
        <svg viewBox="0 0 240 80" className="block w-full" aria-hidden="true" focusable="false">
          <line x1="0" y1="20" x2="240" y2="20" className="stroke-borde-decorativo" />
          <line x1="0" y1="40" x2="240" y2="40" className="stroke-borde-decorativo" />
          <line x1="0" y1="60" x2="240" y2="60" className="stroke-borde-decorativo" />
          <polyline
            fill="none"
            strokeWidth="3"
            strokeLinejoin="round"
            strokeLinecap="round"
            className="stroke-serie-1"
            points="8,62 40,48 72,54 104,30 136,38 168,18 200,26 232,12"
          />
          <polyline
            fill="none"
            strokeWidth="2"
            strokeDasharray="6 4"
            strokeLinecap="round"
            className="stroke-serie-2"
            points="8,70 40,64 72,66 104,52 136,56 168,44 200,48 232,40"
          />
        </svg>
      </div>
      <p className="mt-2 text-pequeno text-texto-secundario">
        {TEXTOS_PROPUESTA.graficoFicticio}. Línea continua: serie 1. Línea de trazos: serie 2.
      </p>
      <p className="mt-1 text-pequeno text-texto-secundario">
        {TEXTOS_PROPUESTA.graficoDescripcion}
      </p>
    </div>
  );
}

type Alerta = { icono: ReactNode; palabra: string; clase: string; texto: string };

function ListaDeAlertas() {
  const alertas: readonly Alerta[] = [
    {
      icono: <IconoError tamano={20} />,
      palabra: "Error",
      clase: "text-error",
      texto: "Cliente ficticio 3: la entrega falló dos veces.",
    },
    {
      icono: <IconoAdvertencia tamano={20} />,
      palabra: "Aviso",
      clase: "text-aviso",
      texto: "Cliente ficticio 7: sin informes desde hace 3 días.",
    },
    {
      icono: <IconoPausa tamano={20} />,
      palabra: "Pausa",
      clase: "text-texto-secundario",
      texto: "Cliente ficticio 9: licencia pausada.",
    },
  ];
  return (
    <div className="rounded-grande border border-borde-decorativo bg-superficie p-4 shadow-tarjeta">
      <p className="text-cuerpo font-seminegrita text-texto">Alertas</p>
      <ul className="mt-3 flex flex-col gap-3">
        {alertas.map((a) => (
          <li key={a.texto} className="flex items-start gap-2">
            <span className={a.clase}>{a.icono}</span>
            <span className="text-cuerpo-menor text-texto">
              <span className={`font-seminegrita ${a.clase}`}>{a.palabra}. </span>
              {a.texto}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function CabeceraDeMaqueta({ titulo, conMenu }: { titulo: string; conMenu: boolean }) {
  return (
    <div className="flex items-center gap-3 rounded-t-grande border-b border-borde-decorativo bg-superficie px-4 py-4">
      {conMenu ? (
        <span className="flex h-10 w-10 items-center justify-center rounded-medio border border-borde-control text-texto">
          <IconoMenu tamano={20} />
        </span>
      ) : null}
      <p className="min-w-0 flex-1 text-titulo font-seminegrita text-texto">{titulo}</p>
      <span className="flex items-center gap-2 text-cuerpo-menor text-texto">
        <IconoUsuario tamano={20} />
        <span>Usuario Ficticio</span>
      </span>
    </div>
  );
}

function MenuDeMaqueta() {
  return (
    <div className="hidden w-menu-ancho shrink-0 rounded-l-grande bg-menu-fondo bg-degradado-menu py-4 text-menu-texto xl:block">
      <p className="px-4 pb-4 text-subtitulo font-seminegrita">Nido</p>
      <ul className="flex flex-col gap-1">
        {AREAS_SUPERADMIN.map((area) => {
          const Icono = ICONOS[area.icono];
          return (
            <li
              key={area.clave}
              className={
                area.clave === "resumen"
                  ? "flex min-h-10 items-center gap-3 border-l-4 border-menu-indicador bg-menu-actual px-4 font-seminegrita text-menu-texto"
                  : "flex min-h-10 items-center gap-3 border-l-4 border-transparent px-4 font-normal text-menu-texto"
              }
            >
              <Icono tamano={20} />
              <span>{area.etiqueta}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

// ------------------------------------------------------------------ las tres vistas

export function MaquetaResumenSuperadmin() {
  return (
    <div className="flex">
      <MenuDeMaqueta />
      <div className="min-w-0 flex-1">
        <CabeceraDeMaqueta titulo="Resumen" conMenu={false} />
        <div className="grid grid-cols-1 gap-4 p-4 xl:p-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <TarjetaCifra
              etiqueta="Clientes activos"
              cifra="48"
              cambio="Sube un 8 % respecto al periodo anterior"
            />
            <TarjetaCifra
              etiqueta="Informes recibidos"
              cifra="1.234"
              cambio="Sube un 12 % respecto al periodo anterior"
            />
            <TarjetaCifra
              etiqueta="Entregas correctas"
              cifra="98 %"
              cambio="Estable respecto al periodo anterior"
            />
          </div>
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
            <div className="min-w-0 xl:col-span-2">
              <HuecoDeGrafico />
            </div>
            <div className="min-w-0">
              <ListaDeAlertas />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const CLIENTES = [
  {
    nombre: "Cliente ficticio 1",
    estado: "Activo",
    icono: <IconoCorrecto tamano={16} />,
    clase: "text-correcto",
    fecha: "12/11/2026",
  },
  {
    nombre: "Cliente ficticio 2",
    estado: "Pausado",
    icono: <IconoPausa tamano={16} />,
    clase: "text-texto-secundario",
    fecha: "10/11/2026",
  },
  {
    nombre: "Cliente ficticio 3",
    estado: "Con error",
    icono: <IconoError tamano={16} />,
    clase: "text-error",
    fecha: "09/11/2026",
  },
  {
    nombre: "Cliente ficticio 4",
    estado: "Activo",
    icono: <IconoCorrecto tamano={16} />,
    clase: "text-correcto",
    fecha: "07/11/2026",
  },
] as const;

/** Tabla con el diálogo abierto: representación estática; el velo es el papel `bg-velo`. */
export function MaquetaTablaConDialogo() {
  return (
    <div className="relative">
      <CabeceraDeMaqueta titulo="Clientes" conMenu={false} />
      <div className="p-4 xl:p-6">
        <div className="rounded-grande border border-borde-decorativo bg-superficie shadow-tarjeta">
          <div className="hidden grid-cols-3 gap-3 border-b border-borde-decorativo px-4 py-3 text-cuerpo-menor font-medio text-texto-secundario sm:grid">
            <span>Cliente</span>
            <span>Estado</span>
            <span>Último informe</span>
          </div>
          {CLIENTES.map((c) => (
            <div
              key={c.nombre}
              className="grid grid-cols-1 gap-1 border-b border-borde-decorativo px-4 py-3 text-cuerpo-menor text-texto sm:grid-cols-3 sm:gap-3"
            >
              <span>{c.nombre}</span>
              <span className={`flex items-center gap-1 ${c.clase}`}>
                {c.icono}
                <span>{c.estado}</span>
              </span>
              <span>{c.fecha}</span>
            </div>
          ))}
        </div>
      </div>
      {/* El velo cubre toda la maqueta; el diálogo va debajo de la tabla, en el flujo, para no
          pisar el texto de las filas (la medida de solapes de PRUEBA-013 lo detectaría). */}
      <div aria-hidden="true" className="absolute inset-0 rounded-grande bg-velo" />
      <div className="relative flex justify-center p-4 pb-6">
        <div className="w-full max-w-menu-ancho rounded-grande border border-borde-control bg-superficie p-6 shadow-elevada">
          <p className="text-subtitulo font-seminegrita text-texto">¿Pausar la entrega?</p>
          <p className="mt-2 text-cuerpo-menor text-texto">
            Cliente ficticio 1 dejará de recibir informes desde este momento. Podrás reanudarla
            cuando quieras.
          </p>
          <div className="mt-6 flex flex-wrap justify-end gap-3">
            <span className="flex min-h-10 items-center rounded-medio border border-borde-control bg-superficie px-4 text-cuerpo-menor font-medio text-texto">
              Cancelar
            </span>
            <span className="flex min-h-10 items-center rounded-medio bg-acento bg-degradado-acento px-4 text-cuerpo-menor font-medio text-texto-sobre-acento">
              Pausar entrega
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function MaquetaResumenCliente() {
  return (
    <div>
      <CabeceraDeMaqueta titulo="Resumen" conMenu />
      <div className="grid grid-cols-1 gap-4 p-4">
        <TarjetaCifra
          etiqueta="Correos revisados"
          cifra="312"
          cambio="Sube un 5 % respecto al periodo anterior"
        />
        <TarjetaCifra
          etiqueta="Borradores preparados"
          cifra="87"
          cambio="Sube un 14 % respecto al periodo anterior"
        />
        <HuecoDeGrafico />
        <ListaDeAlertas />
      </div>
    </div>
  );
}
