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
  },
} as const;
