// Respuesta única «sin acceso» (020, diseño V-1, punto 1; REQ-027, REQ-077). La llaman los tres
// casos (recurso denegado, recurso inexistente y área de otra fase) y nadie responde de otra forma.
// No recibe el motivo, el nombre ni el identificador: no hay nada que pueda distinguir un caso de
// otro. Responde como recurso inexistente (404) y no anota nada. Solo de servidor: PRUEBA-008
// comprueba que ningún módulo de cliente llega aquí.
import { notFound } from "next/navigation";

export function sinAcceso(): never {
  notFound();
}
