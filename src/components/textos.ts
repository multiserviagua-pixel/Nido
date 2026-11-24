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

  /** Lista de alertas (T-010 (i); REQ-016, REQ-056). El texto de una alerta sale de su tipo, de
   * lista cerrada; la gravedad se dice con una palabra; el cliente, si lo hay, va aparte. Cada
   * función de la fase añade sus tipos y sus acciones en su propio diseño. */
  alertas: {
    lista: "Alertas",
    cliente: "Cliente",
    vacio: {
      titulo: "No hay alertas",
      explicacion: "Cuando algo necesite tu atención, aparecerá aquí.",
    },
    gravedad: {
      critica: "Crítica",
      aviso: "Aviso",
      informacion: "Información",
      desconocida: "Gravedad desconocida",
    },
    tipos: {
      agente_sin_senal: "Un agente no envía señal",
      agente_con_avisos: "Un agente ha registrado avisos",
      licencia_por_caducar: "Una licencia caduca pronto",
      revision_completada: "Se ha completado una revisión",
      desconocido: "Alerta de un tipo desconocido",
    },
    acciones: {
      reanudar_agente: { texto: "Reanudar agente", enCurso: "Reanudando…" },
      revisar_licencia: { texto: "Revisar licencia", enCurso: "Revisando…" },
    },
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

  /** Diálogo de confirmación (T-010 (j); REQ-017, REQ-018). Cada acción dice qué va a pasar (título),
   * a qué o a quién afecta (el objetivo, que es un dato y se pinta aparte), cuándo se aplica y el
   * verbo con su objeto en el botón («Pausar agente»), nunca «Aceptar» o «Sí». Cada función de la
   * fase añade sus acciones y sus datos distintivos en su propio diseño. */
  dialogo: {
    afecta: "Afecta a",
    sinNombre: "Sin nombre",
    cerrar: "Cerrar",
    /** Qué dato distingue un objetivo de otro con un nombre parecido (lo declara cada vista). */
    datosDistintivos: {
      identificador: "Identificador",
      alta: "Alta",
      plan: "Plan",
    },
    acciones: {
      pausar_agente: {
        titulo: "¿Pausar este agente?",
        cuando: "Se aplicará en la siguiente revisión de cada agente.",
        confirmar: "Pausar agente",
        enCurso: "Pausando…",
      },
      reanudar_agente: {
        titulo: "¿Reanudar este agente?",
        cuando: "Se aplicará en la siguiente revisión de cada agente.",
        confirmar: "Reanudar agente",
        enCurso: "Reanudando…",
      },
      revocar_licencia: {
        titulo: "¿Revocar esta licencia?",
        cuando: "Se aplicará de inmediato: el agente dejará de recibir instrucciones.",
        confirmar: "Revocar licencia",
        enCurso: "Revocando…",
      },
      publicar_version: {
        titulo: "¿Publicar esta versión?",
        cuando: "Se aplicará en la siguiente revisión de cada agente.",
        confirmar: "Publicar versión",
        enCurso: "Publicando…",
      },
      volver_atras_version: {
        titulo: "¿Volver a la versión anterior?",
        cuando: "Se aplicará en la siguiente revisión de cada agente.",
        confirmar: "Volver atrás",
        enCurso: "Volviendo atrás…",
      },
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

  /** Aviso de conexión del armazón (T-016 (e); REQ-060): «Sin conexión» se anuncia una vez; la
   * recuperación, también. Textos fijos: el aviso no admite texto libre. */
  conexion: {
    sinConexion: "Sin conexión",
    explicacion: "Los datos que ves se cargaron antes y no se están actualizando.",
    recuperada: "Conexión recuperada",
  },

  /** Estado vacío (T-016 (c); REQ-022): qué pasa y qué hacer. El genérico solo sale si quien lo
   * pinta no da un texto fijo válido. Los de `ejemplo` son de la muestra (como `cifras.ejemplo`):
   * cada vista da los suyos desde su propio grupo (`tabla.vacio`, `alertas.vacio`...). */
  estadoVacio: {
    generico: {
      titulo: "No hay nada que mostrar",
      explicacion: "Cuando haya datos, aparecerán aquí.",
    },
    ejemplo: {
      conAccion: {
        titulo: "Todavía no hay clientes",
        explicacion: "Añade el primero para empezar a ver su actividad en esta página.",
        accion: "Añadir cliente",
      },
      sinAccion: {
        titulo: "No hay actividad en este periodo",
        explicacion: "Prueba con otro periodo o espera a la siguiente revisión de los agentes.",
      },
    },
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

  /** Formulario y campos (T-016 (a); REQ-019, REQ-020, REQ-057, REQ-080). Las etiquetas, ayudas y
   * opciones de cada formulario son de su vista y salen de aquí como textos fijos; los errores son
   * de lista cerrada, también los que devuelve el servidor (par `{campo, codigo}`): nunca se pinta
   * un texto recibido. Cada función de la fase añade sus códigos y sus campos en su diseño. Los
   * textos de `ejemplo` son de la muestra (como `cifras.ejemplo`); se mueven a ella cuando la 021
   * aporte los suyos. */
  formulario: {
    obligatorio: "(obligatorio)",
    leyenda: "Los campos marcados con (obligatorio) hay que rellenarlos.",
    campoSinNombre: "Campo",
    opcionSinNombre: "Opción",
    elegirOpcion: "Elige una opción",
    /** «Hasta 120 caracteres.»: se compone con el número ya formateado. */
    limiteAntes: "Hasta",
    limiteDespues: "caracteres.",
    /** «Hay 2 errores en el formulario. Corrígelos para continuar.» */
    resumenUno: "Hay un error en el formulario. Corrígelo para continuar.",
    resumenAntes: "Hay",
    resumenDespues: "errores en el formulario. Corrígelos para continuar.",
    /** Error de un campo o un código que el formulario no declara: nunca se pinta lo recibido. */
    errorGeneral: "Hay un problema con el formulario. No se ha cambiado nada.",
    /** Códigos de error de campo, de lista cerrada: los de validación del propio formulario y los
     * que puede devolver el servidor. */
    errores: {
      obligatorio: "Este campo es obligatorio.",
      sin_marcar: "Marca esta casilla para continuar.",
      demasiado_largo: "Has escrito más caracteres de los permitidos.",
      opcion_no_valida: "Elige una de las opciones de la lista.",
      nombre_en_uso: "Ya existe un registro con este nombre.",
      valor_no_valido: "El valor no es válido.",
    },
    ejemplo: {
      nombreDelFormulario: "Ficha del cliente de ejemplo",
      guardar: "Guardar ficha",
      guardando: "Guardando…",
      nombre: "Nombre del cliente",
      nombreAyuda: "Como aparecerá en la lista de clientes.",
      descripcion: "Descripción",
      descripcionAyuda: "Un resumen para el equipo; puedes dejarlo en blanco.",
      plan: "Plan",
      planBasico: "Básico",
      planProfesional: "Profesional",
      planEquipo: "Equipo",
      periodicidad: "Periodicidad de las revisiones",
      periodicidadDiaria: "Cada día",
      periodicidadSemanal: "Cada semana",
      avisos: "Quiero recibir los avisos del cliente",
      condiciones: "He leído las condiciones de la ficha",
      busqueda: "Buscar en la ficha",
      busquedaAyuda: "Lo que escribas no se guarda ni viaja en la dirección.",
      codigo: "Código interno",
      guardarTipos: "Guardar campos",
      textoObligatorio: "Texto corto",
      textoOpcional: "Texto corto opcional",
      largoObligatorio: "Texto largo",
      largoOpcional: "Texto largo opcional",
      seleccionObligatoria: "Selección",
      seleccionOpcional: "Selección opcional",
      grupoObligatorio: "Grupo de opciones",
      grupoOpcional: "Grupo de opciones opcional",
      casillaObligatoria: "Casilla que hay que marcar",
      casillaOpcional: "Casilla opcional",
      busquedaObligatoria: "Búsqueda",
      busquedaOpcional: "Búsqueda opcional",
    },
  },

  /** Avisos temporales (T-016 (b); REQ-021, REQ-072). Solo informan de algo que ha salido bien o de
   * lo que va a pasar: no hay avisos de error (un error se queda en pantalla, junto a lo que
   * falló). Cada mensaje se pide por su clave: no hay forma de pasar un texto. Cada función de la
   * fase añade los suyos en su propio diseño. Los de esta lista también los enseña la muestra. */
  avisos: {
    region: "Avisos",
    cerrar: "Cerrar aviso",
    mensajes: {
      cambiosGuardados: "Los cambios se han guardado.",
      codigoCopiado: "El código se ha copiado al portapapeles.",
      listaActualizada: "La lista se ha actualizado con los datos más recientes.",
      pausaProgramada: "La pausa se aplicará en la siguiente revisión de cada agente.",
      reanudacionProgramada: "La reanudación se aplicará en la siguiente revisión de cada agente.",
      cambioProgramado:
        "Los cambios se aplicarán en la siguiente revisión de cada agente; hasta entonces los agentes seguirán trabajando con la configuración anterior y no tienes que hacer nada más por tu parte.",
    },
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
