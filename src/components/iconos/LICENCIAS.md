# Licencias de los iconos

Todos los iconos de esta carpeta están **dibujados por el equipo** como SVG propios, en una
cuadrícula de 24 por 24, con trazo de 2 y esquinas redondeadas, y pintan con `currentColor`. No se
ha copiado ninguno de un conjunto de iconos, de un paquete ni de la captura de referencia visual
(`docs/referencia/`); las formas básicas (aspa, flecha, panel) son genéricas. Si algún día se copia
uno de un conjunto abierto, su fila dirá «copiado de», con el conjunto, la licencia y la versión.

Sin paquete de iconos y sin recursos de terceros en tiempo de ejecución (REQ-033, REQ-032).

## Por qué esta lista

Cada grupo sale de una fuente distinta; un icono nuevo se añade aquí en el mismo cambio que su
componente, y los de áreas de fases futuras se añaden con su función.

- **Áreas del menú.** Las de `diseno.md` (armazón, `areas.ts`): superadmin con Resumen, Clientes,
  Órdenes, Auditoría y Ajustes; cliente con Resumen, Actividad, Suscripción y Cuenta (esta usa
  `IconoUsuario`). `IconoAlertas` es el de la zona de alertas del armazón.
- **Acciones de los componentes base.** Cerrar, menú y cajón, buscar, ordenar con sus dos sentidos,
  paginación, copiar, salir y tema claro y oscuro.
- **Estados.** Un icono de forma distinta por cada valor de `ICONOS_DE_ESTADO`
  (`src/components/estado/catalogo.ts`): neutro, correcto, aviso, error, información y pausa, para
  que nada dependa solo del color. Los tonos son neutro, correcto, aviso, error e informativo;
  «sin conexión» no es un tono sino una situación, y tiene su propio icono (`IconoSinConexion`).

## Iconos

| Icono | Representa | Origen | Fecha |
| --- | --- | --- | --- |
| `IconoResumen` | el resumen de un área | Dibujado por el equipo | 21/11/2026 |
| `IconoClientes` | los clientes | Dibujado por el equipo | 21/11/2026 |
| `IconoOrdenes` | los informes y las órdenes | Dibujado por el equipo | 21/11/2026 |
| `IconoAuditoria` | la auditoría | Dibujado por el equipo | 21/11/2026 |
| `IconoActividad` | la actividad | Dibujado por el equipo | 21/11/2026 |
| `IconoSuscripcion` | la suscripción | Dibujado por el equipo | 21/11/2026 |
| `IconoAlertas` | las alertas | Dibujado por el equipo | 21/11/2026 |
| `IconoAjustes` | los ajustes | Dibujado por el equipo | 21/11/2026 |
| `IconoCerrar` | cerrar | Dibujado por el equipo | 21/11/2026 |
| `IconoMenu` | el menú | Dibujado por el equipo | 21/11/2026 |
| `IconoAbrirCajon` | abrir el cajón del menú | Dibujado por el equipo | 21/11/2026 |
| `IconoCerrarCajon` | cerrar el cajón del menú | Dibujado por el equipo | 21/11/2026 |
| `IconoBuscar` | buscar | Dibujado por el equipo | 21/11/2026 |
| `IconoOrdenar` | una columna ordenable sin orden aplicado | Dibujado por el equipo | 21/11/2026 |
| `IconoOrdenAscendente` | orden ascendente | Dibujado por el equipo | 21/11/2026 |
| `IconoOrdenDescendente` | orden descendente | Dibujado por el equipo | 21/11/2026 |
| `IconoPaginaAnterior` | la página anterior | Dibujado por el equipo | 21/11/2026 |
| `IconoPaginaSiguiente` | la página siguiente | Dibujado por el equipo | 21/11/2026 |
| `IconoCopiar` | copiar | Dibujado por el equipo | 21/11/2026 |
| `IconoNeutro` | un estado neutro (círculo con guion) | Dibujado por el equipo | 21/11/2026 |
| `IconoPausa` | un estado en pausa (círculo con dos barras) | Dibujado por el equipo | 21/11/2026 |
| `IconoAdvertencia` | un aviso (triángulo) | Dibujado por el equipo | 21/11/2026 |
| `IconoError` | un error (círculo con aspa) | Dibujado por el equipo | 21/11/2026 |
| `IconoCorrecto` | un resultado correcto (círculo con marca) | Dibujado por el equipo | 21/11/2026 |
| `IconoInformacion` | una información (círculo con i) | Dibujado por el equipo | 21/11/2026 |
| `IconoSinConexion` | la falta de conexión | Dibujado por el equipo | 21/11/2026 |
| `IconoUsuario` | la cuenta de usuario | Dibujado por el equipo | 21/11/2026 |
| `IconoSalir` | salir | Dibujado por el equipo | 21/11/2026 |
| `IconoSol` | el tema claro | Dibujado por el equipo | 21/11/2026 |
| `IconoLuna` | el tema oscuro | Dibujado por el equipo | 21/11/2026 |
