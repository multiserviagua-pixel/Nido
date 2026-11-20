import type { Codigo } from "../registro/codigos";

// Único error que se lanza en la aplicación. Lleva solo un código de lista cerrada:
// ni valores recibidos ni causa (diseño §App base, punto 2).
export class ErrorDeAplicacion extends Error {
  readonly codigo: Codigo;

  constructor(codigo: Codigo) {
    super(codigo);
    this.name = "ErrorDeAplicacion";
    this.codigo = codigo;
  }
}
