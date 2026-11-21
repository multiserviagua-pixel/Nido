// Pliegue del menú (diseño 020, «Armazón», `CajonMenu`; REQ-004): desde 1024 px (64 rem) el menú
// está siempre visible; con 1023 px o menos lo sustituye el cajón. La consulta de ancho es la del
// punto de ruptura `lg` de `valores.css` (los estilos usan `lg:`; una prueba comprueba que sean el
// mismo valor). Sin dependencias: lo usan el cajón y sus pruebas.

/** Verdadera cuando el menú está fijo en pantalla. */
export const CONSULTA_MENU_FIJO = "(min-width: 64rem)";

type ListaDeConsulta = {
  addEventListener(tipo: "change", oyente: (evento: { matches: boolean }) => void): void;
  removeEventListener(tipo: "change", oyente: (evento: { matches: boolean }) => void): void;
};

/**
 * Avisa cuando la ventana pasa a tener el menú fijo (con el cajón abierto, hay que cerrarlo).
 * Devuelve la función que deja de escuchar. Pasar a un ancho menor no avisa: el cajón solo se abre
 * con el botón.
 */
export function alEnsancharLaVentana(lista: ListaDeConsulta, alEnsanchar: () => void): () => void {
  const oyente = (evento: { matches: boolean }): void => {
    if (evento.matches) alEnsanchar();
  };
  lista.addEventListener("change", oyente);
  return () => lista.removeEventListener("change", oyente);
}
