import { TEXTOS } from "../textos";
import type { Area } from "./areas";
import { CajonMenu } from "./CajonMenu";
import { CuentaUsuario, type DatosDeCuenta } from "./CuentaUsuario";
import type { ConfiguracionDePeriodo } from "./periodo";
import { ReservaDeCabecera } from "./ReservaDeCabecera";
import { SelectorPeriodo } from "./SelectorPeriodo";

/**
 * Cabecera de la vista (diseño 020, «Armazón»; REQ-005, REQ-006, REQ-036): el botón del cajón (solo
 * por debajo de 1024 px), el título como único `h1`, la cuenta y, solo si la vista lo declara, el
 * selector de periodo. Queda fija arriba solo si la ventana tiene alto suficiente (38 rem o más; el
 * umbral lo valida `disenador-ui`): en una ventana baja (móvil apaisado, zoom del 400 %) una
 * cabecera de hasta ~240 px a 320 px se comería el contenido, y entonces se desplaza con la
 * página. Cuando es fija, reserva su alto (`ReservaDeCabecera`). El título es texto fijo de la
 * vista, sin datos (A-10): el nombre de un cliente va en el cuerpo. Las piezas se pintan en este
 * orden en el documento; el selector, en una línea propia debajo.
 */
export function Cabecera({
  areas,
  areaActual,
  titulo,
  cuenta,
  periodo,
}: {
  areas: readonly Area[];
  areaActual: string;
  titulo: string;
  cuenta: DatosDeCuenta;
  periodo?: ConfiguracionDePeriodo;
}) {
  return (
    <header
      aria-label={TEXTOS.armazon.cabecera}
      data-cabecera
      className="z-30 border-b border-borde-decorativo bg-superficie px-4 py-4 md:px-6 alto-suficiente:sticky alto-suficiente:top-0"
    >
      <div className="flex flex-wrap items-center gap-x-3 gap-y-3">
        <CajonMenu areas={areas} areaActual={areaActual} />
        <h1 className="min-w-0 flex-1 text-titulo font-seminegrita text-texto">{titulo}</h1>
        <CuentaUsuario cuenta={cuenta} />
        {periodo === undefined ? null : <SelectorPeriodo periodo={periodo} />}
      </div>
      <ReservaDeCabecera />
    </header>
  );
}
