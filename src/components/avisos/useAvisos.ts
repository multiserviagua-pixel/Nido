"use client";

// Estado de los avisos de una vista (T-016 (b)). `avisar(clave)` añade un aviso y lo anuncia UNA
// vez por la región cortés de `Anunciador`, en el orden de las llamadas; la lista visible no es
// región viva, así que no se lee dos veces. Solo admite claves de `TEXTOS.avisos.mensajes`.
import { useCallback, useReducer } from "react";
import { anunciar } from "../texto/anuncios";
import {
  PILA_VACIA,
  leerClaveDeAviso,
  reducirPila,
  textoDeAviso,
  type AvisoTemporal,
  type ClaveDeAviso,
} from "./logica";

export function useAvisos(): {
  readonly avisos: readonly AvisoTemporal[];
  readonly avisar: (clave: ClaveDeAviso) => void;
  readonly cerrar: (id: number) => void;
} {
  const [pila, enviar] = useReducer(reducirPila, PILA_VACIA);
  const avisar = useCallback((clave: ClaveDeAviso): void => {
    const leida = leerClaveDeAviso(clave);
    if (leida === null) return;
    anunciar(textoDeAviso(leida));
    enviar({ tipo: "anadir", clave: leida });
  }, []);
  const cerrar = useCallback((id: number): void => enviar({ tipo: "cerrar", id }), []);
  return { avisos: pila.avisos, avisar, cerrar };
}
