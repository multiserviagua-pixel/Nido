// Lista cerrada de códigos de error y de registro (diseño §Supervisión). Nunca un valor recibido.
export const CODIGOS = [
  "error_no_controlado",
  "configuracion_invalida",
  "region_no_permitida",
  "diagnostico_provocado",
  "entrada_invalida",
  "despliegue_fallido",
  "comprobacion_posterior_fallida",
  "supervision_no_disponible",
  "salida_no_estructurada",
] as const;

export type Codigo = (typeof CODIGOS)[number];
