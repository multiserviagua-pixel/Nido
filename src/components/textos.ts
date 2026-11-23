// Todos los textos fijos de los componentes, en español de España y con trato de tú (diseño,
// «Reglas comunes de los componentes», regla 3). Ningún componente escribe un texto propio y
// ninguno tiene una propiedad para pintar un mensaje libre.
//
// Los grupos se amplían con cada pieza que se construye; lo que aquí falta (tabla, gráficos,
// formulario completo, avisos, armazón) lo añade la tarea que construye esa pieza. El
// `disenador-ui` puede afinar la redacción: PRUEBA-007 vigila que siga habiendo una palabra por
// estado, ningún texto genérico, ninguna forma de usted y un verbo en cada botón de confirmar.

export const TEXTOS = {
  formato: {
    /** Lo que se ve, y lo que lee el lector de pantalla, cuando no hay un valor utilizable. */
    sinDatos: "Sin datos",
    horaDeVerano: "hora de verano",
    horaDeInvierno: "hora de invierno",
    indicacionHorario: "Horas en horario de Madrid",
    sinCambios: "Sin cambios",
    sinDatosParaComparar: "Sin datos para comparar",
  },

  /** Catálogo de estados: una palabra o expresión por estado, clave `ámbito.estado`. Cada
   * función de la fase añade los suyos en su propio diseño. */
  estados: {
    "agente.activo": "Activo",
    "agente.en_pausa": "En pausa",
    "agente.con_avisos": "Con avisos",
    "agente.sin_senal": "Sin señal",
    desconocido: "Estado desconocido",
  },

  /** Tarjeta de cifra (T-010 (e)). La palabra de la valoración acompaña siempre al signo de la
   * variación (REQ-055); el periodo de comparación sigue a los de `periodo`. Las etiquetas de
   * `ejemplo` son de medidas ficticias de la muestra: cada vista añade las suyas en su diseño. */
  cifras: {
    valoracion: {
      favorable: "Favorable",
      desfavorable: "Desfavorable",
      neutra: "Neutra",
    },
    comparacion: {
      ultimos7Dias: "frente a los 7 días anteriores",
      ultimos30Dias: "frente a los 30 días anteriores",
      ultimos90Dias: "frente a los 90 días anteriores",
    },
    ejemplo: {
      correosRevisados: "Correos revisados",
      borradoresPreparados: "Borradores preparados",
      avisosAbiertos: "Avisos abiertos",
      revisionesCompletas: "Revisiones completas",
      respuestasPendientes: "Respuestas pendientes",
      etiquetaLarga:
        "Correos revisados por el agente de tu cuenta desde la última comprobación completa de la bandeja de entrada",
    },
  },

  /** Tabla, paginación y región desplazable (T-010 (g); REQ-013, REQ-042, REQ-045, REQ-066). Los
   * títulos y las etiquetas de columna son de cada vista; lo que va aquí es lo común. La posición
   * se compone «Del 26 al 50 de 1.234» con `del`, `al` y `de` y números con miles. */
  tabla: {
    sinTitulo: "Tabla de datos",
    columnaSinNombre: "Columna",
    regionDesplazable: "se puede desplazar",
    ordenadoPor: "Ordenado por",
    ascendente: "ascendente",
    descendente: "descendente",
    vacio: {
      titulo: "No hay filas que mostrar",
      explicacion: "Cuando haya datos, aparecerán aquí.",
    },
    paginacion: "Paginación",
    anterior: "Anterior",
    siguiente: "Siguiente",
    pagina: "Página",
    posicionDel: "Del",
    posicionAl: "al",
    posicionDe: "de",
  },

  /** Gráficos de líneas y de barras (T-010 (h); REQ-014, REQ-015, REQ-052, REQ-054). El título,
   * los nombres de los ejes, las unidades y los nombres de las series son de cada vista; lo que va
   * aquí es lo común. Los textos de reserva solo salen si la vista no da uno válido. */
  graficos: {
    sinTitulo: "Gráfico sin título",
    ejeHorizontalSinNombre: "Categorías",
    ejeVerticalSinNombre: "Valor",
    unidadSinNombre: "unidades",
    serie: "Serie",
    tipoLineas: "Gráfico de líneas",
    tipoBarras: "Gráfico de barras",
    ejeHorizontal: "Eje horizontal",
    ejeVertical: "Eje vertical",
    verTabla: "Ver los datos en tabla",
    tablaDeDatos: "tabla de datos",
    leyenda: "Series",
    sinDatos: {
      titulo: "Sin datos",
      explicacion: "No hay datos que mostrar para este periodo.",
    },
    sinDatosSuficientes: {
      titulo: "Sin datos suficientes",
      explicacion: "Hay menos datos de los necesarios para dibujar el gráfico.",
    },
    descripcion: {
      con: "con",
      y: "y",
      serie: "serie",
      series: "series",
      punto: "punto",
      puntos: "puntos",
      de: "de",
      a: "a",
      minimo: "Valor mínimo",
      maximo: "máximo",
      remite: "Los mismos valores están en la tabla de datos que hay debajo.",
    },
  },

  /** Motivos de error de lista cerrada (diseño, «Estados de cada vista»). */
  motivosDeError: {
    sin_conexion: "Sin conexión. Comprueba tu red e inténtalo de nuevo.",
    fallo_servidor: "No se ha podido cargar. Ha habido un problema en el servidor.",
    respuesta_no_valida: "No se ha podido cargar. La respuesta recibida no es válida.",
    tarda_demasiado: "No se ha podido cargar. Está tardando demasiado.",
    sesion_no_valida: "Tu sesión ya no es válida. Vuelve a iniciar sesión.",
    desconocido: "No se ha podido cargar. Inténtalo de nuevo.",
  },

  /** Estados de un bloque de datos. */
  bloque: {
    cargando: "Cargando",
    cargaLenta: "Está tardando más de lo normal",
    noSePudoCargar: "No se ha podido cargar",
    reintentar: "Reintentar",
    referencia: "Referencia",
    sinConexion: "Sin conexión",
    datosCargadosEl: "Datos cargados el",
  },

  /** Vista entera sin acceso: el mismo texto para denegado, inexistente y área de otra fase. */
  sinPermiso: {
    titulo: "No tienes acceso a esta página",
    explicacion: "Puede que no exista o que no tengas permiso para verla.",
    volverAlResumen: "Ir al Resumen",
  },

  /** Nombre del producto: una sola constante para el título del documento y, desde T-015, el menú
   * (REQ-005, REQ-087). El título de cada vista se pone delante: «<vista> · <producto>». */
  marca: {
    nombreProducto: "Nido: Agentes de Correo",
  },

  armazon: {
    saltarAlContenido: "Saltar al contenido",
    menu: "Menú",
    abrirMenu: "Abrir menú",
    cerrarMenu: "Cerrar menú",
    navegacionPrincipal: "Navegación principal",
    cabecera: "Cabecera de la página",
    contenidoPrincipal: "Contenido principal",
  },

  /** Cuenta del usuario en la cabecera (T-010 (c)). El nombre llega de la sesión y se pinta como
   * dato; los textos fijos salen de aquí. */
  cuenta: {
    abrir: "Cuenta",
    titulo: "Cuenta",
    sesionIniciadaComo: "Sesión iniciada como",
    cerrar: "Cerrar el panel de la cuenta",
    sinNombre: "Cuenta sin nombre",
    cerrarSesion: "Cerrar sesión",
  },

  /** Selector de periodo (REQ-006). */
  periodo: {
    etiqueta: "Periodo",
    anuncio: "Periodo cambiado a",
    /** Sin conexión al elegir: no se navega y el periodo se queda como estaba. */
    sinConexion: "Sin conexión. El periodo no ha cambiado.",
    ultimos7Dias: "Últimos 7 días",
    ultimos30Dias: "Últimos 30 días",
    ultimos90Dias: "Últimos 90 días",
  },

  /** Áreas del menú: las de superadmin (fase 3) y el juego de cliente de la muestra. */
  areas: {
    resumen: "Resumen",
    clientes: "Clientes",
    ordenes: "Órdenes",
    auditoria: "Auditoría",
    ajustes: "Ajustes",
    actividad: "Actividad",
    suscripcion: "Suscripción",
    cuenta: "Cuenta",
  },

  formulario: {
    obligatorio: "(obligatorio)",
  },

  /** Acciones que cambian algo: el botón de confirmar lleva un verbo, nunca «Aceptar». */
  acciones: {
    confirmar: {
      pausar: "Pausar",
      reanudar: "Reanudar",
      revocar: "Revocar",
      publicar: "Publicar",
      volverAtras: "Volver atrás",
    },
    enCurso: {
      pausar: "Pausando…",
      reanudar: "Reanudando…",
      revocar: "Revocando…",
      publicar: "Publicando…",
      volverAtras: "Volviendo atrás…",
    },
    cancelar: "Cancelar",
    noPermitida: "No tienes permiso para hacer esto",
    /** Resultado de una acción (`useAccion`): lo que se dice, de lista cerrada. */
    resultado: {
      hecha: "Hecho. El estado se ha actualizado.",
      rechazada: "No se ha podido hacer. No se ha cambiado nada.",
      incierta:
        "No se sabe si la acción se ha aplicado. Comprueba el estado actual antes de repetirla.",
      comprobarEstado: "Comprobar estado",
    },
    /** Motivos de rechazo de lista cerrada (cada función de la fase añade los suyos). */
    motivosDeRechazo: {
      estado_distinto: "El estado ha cambiado mientras tanto. No se ha cambiado nada.",
    },
  },
} as const;

/** Cualquier texto fijo de `TEXTOS`, como tipo: lo que un componente admite como texto propio. Un
 * texto que llega como dato no es de este tipo (se pinta con `TextoDato`). */
type Hojas<T> = T extends string ? T : { [K in keyof T]: Hojas<T[K]> }[keyof T];
export type TextoFijo = Hojas<typeof TEXTOS>;
