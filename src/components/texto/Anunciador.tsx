import { ATRIBUTO_DE_REGION } from "./anuncios";

/** Las dos regiones de anuncios, siempre presentes en el documento (REQ-042). Se montan una sola
 * vez, en el armazón. Solo las lee el lector de pantalla; nacen vacías y `anunciar()` les escribe
 * el texto (ver `anuncios.ts`). Son un componente de servidor: no llevan ningún código de cliente. */
export function Anunciador() {
  return (
    <>
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        {...{ [ATRIBUTO_DE_REGION]: "cortes" }}
        className="sr-only"
      />
      <div
        role="alert"
        aria-live="assertive"
        aria-atomic="true"
        {...{ [ATRIBUTO_DE_REGION]: "urgente" }}
        className="sr-only"
      />
    </>
  );
}
