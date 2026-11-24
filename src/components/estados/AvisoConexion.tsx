"use client";

// `AvisoConexion` (diseño 020, `AvisoConexion`; REQ-060, REQ-075; CA-045). Escucha los eventos de
// conexión del navegador (`conexion.ts`, única fuente). Sin conexión pinta «Sin conexión» con su
// explicación y lo anuncia una sola vez por la región cortés de `Anunciador`; el texto visible no
// es región viva, para no anunciarlo dos veces. Los bloques de datos leen la misma fuente y marcan
// con su hora de carga lo que ya se veía (`BloqueDatos`): no se presenta como actual y nadie intenta
// recargar. Al volver la conexión lo retira, anuncia «Conexión recuperada» una vez y la deja a la
// vista 8 s, como un aviso temporal, sin tocar el foco. Solo textos fijos de `TEXTOS.conexion`: no
// admite texto libre. No guarda nada (REQ-058).
import { useEffect, useRef, useState } from "react";
import { IconoSinConexion } from "../iconos";
import { anunciar } from "../texto/anuncios";
import { TEXTOS } from "../textos";
import {
  PLAZO_DE_RECUPERADA_MS,
  leerEstadoDeConexion,
  siguienteEstadoDeConexion,
  useSinConexion,
  type EstadoDeConexion,
} from "./conexion";

const CAJA =
  "flex min-w-0 items-start gap-3 rounded-medio border border-borde-decorativo bg-superficie p-3 text-texto";

/** Solo el marcado, sin eventos: lo que se ve en cada estado. Lo que no es de la lista, sin conexión. */
export function PresentacionDeAviso({ estado }: { estado: EstadoDeConexion }) {
  const leido = leerEstadoDeConexion(estado);
  if (leido === "conectado") return null;
  return (
    <div className="px-4 pt-4 md:px-6">
      <div data-aviso-conexion={leido} className={CAJA}>
        <span className="mt-1 shrink-0">
          <IconoSinConexion />
        </span>
        <p className="min-w-0 break-words text-cuerpo">
          <span className="font-seminegrita">
            {leido === "sin_conexion" ? TEXTOS.conexion.sinConexion : TEXTOS.conexion.recuperada}
          </span>
          {leido === "sin_conexion" ? (
            <>
              {" "}
              <span className="text-cuerpo-menor text-texto-secundario">
                {TEXTOS.conexion.explicacion}
              </span>
            </>
          ) : null}
        </p>
      </div>
    </div>
  );
}

export function AvisoConexion() {
  const sinConexion = useSinConexion();
  // Lo último que dijeron los eventos del navegador: solo se escribe desde sus escuchas.
  const [reciente, fijarReciente] = useState<EstadoDeConexion>("conectado");
  const perdida = useRef(false);
  const dicho = useRef<EstadoDeConexion>("conectado");
  // La pérdida cuenta aunque el navegador ya estuviera sin conexión al cargar.
  const estado: EstadoDeConexion = sinConexion ? "sin_conexion" : reciente;

  useEffect(() => {
    if (sinConexion) perdida.current = true;
  }, [sinConexion]);

  useEffect(() => {
    let temporizador: ReturnType<typeof setTimeout> | undefined;
    const alPerder = (): void => {
      clearTimeout(temporizador);
      perdida.current = true;
      fijarReciente((anterior) => siguienteEstadoDeConexion(anterior, "offline"));
    };
    const alVolver = (): void => {
      // Sin una pérdida anterior no hay nada que confirmar.
      if (!perdida.current) return;
      perdida.current = false;
      fijarReciente(siguienteEstadoDeConexion("sin_conexion", "online"));
      clearTimeout(temporizador);
      // La confirmación se retira sola; la pérdida, no.
      temporizador = setTimeout(
        () => fijarReciente((anterior) => siguienteEstadoDeConexion(anterior, "plazo")),
        PLAZO_DE_RECUPERADA_MS,
      );
    };
    window.addEventListener("offline", alPerder);
    window.addEventListener("online", alVolver);
    return () => {
      clearTimeout(temporizador);
      window.removeEventListener("offline", alPerder);
      window.removeEventListener("online", alVolver);
    };
  }, []);

  // Cada estado se anuncia una sola vez, por la región cortés.
  useEffect(() => {
    if (dicho.current === estado) return;
    dicho.current = estado;
    if (estado === "sin_conexion") anunciar(TEXTOS.conexion.sinConexion);
    else if (estado === "recuperada") anunciar(TEXTOS.conexion.recuperada);
  }, [estado]);

  return <PresentacionDeAviso estado={estado} />;
}
