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
  "almacen_no_disponible",
  "configuracion_conector_invalida",
  "metodo_no_permitido",
  "origen_no_permitido",
  "cuerpo_demasiado_grande",
  "sin_token",
  "token_no_valido",
] as const;

export type Codigo = (typeof CODIGOS)[number];
