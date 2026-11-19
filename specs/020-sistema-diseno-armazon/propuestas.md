# 020 · Propuestas para coordinación

Cambios que esta función, o la fase 3 en conjunto, necesitaría fuera de su rango. El chat de la fase 3 no los edita: los anota aquí para el chat de coordinación y para los chats de las fases afectadas. Ninguno está aplicado.

Fecha: 12/11/2026 · Autor: orquestador de la fase 3, a partir del informe del `especificador`.

## De toda la fase 3

| Documento | Cambio | Motivo |
| --- | --- | --- |
| `docs/PLAN.md`, fase 3 | Añadir «Funciones previstas: `020-sistema-diseno-armazon`, `021-acceso-superadmin`, `022-clientes-licencias-conexiones`, `023-informes-ordenes`, `024-auditoria`» y, si el responsable lo aprueba, `025-reglas-por-cliente` | Las demás fases con funciones las listan |
| `docs/CONSTITUCION.md`, artículo 2 | **Aprobada por el responsable el 12/11/2026** (respuesta «Nota aclaratoria (Recomendado)» en el chat de la fase 3). Falta aplicarla, con fecha, motivo y número de versión, y anotarla en `docs/TECNOLOGIAS.md`. Texto que se propone: «En el dashboard de superadmin, el identificador de un cliente puede llegar como entrada solo para elegir sobre qué cliente se actúa. No concede permiso: el permiso se deriva siempre de la sesión de superadmin con doble factor. En el conector y en el dashboard de cliente no cambia nada.» El responsable debe ver el texto final antes de que se aplique | Cuestión 10 de la 020, 11 de la 022 y 12 de la 023. Solo el responsable enmienda la constitución |
| `docs/TECNOLOGIAS.md` | Anotar las respuestas del responsable cuando las dé. V-110 sigue en VERIFICAR: se comprueba en el diseño de la 020 con la skill `verificar-decision` | Skill `sdd-aclarar`, paso 6 |

Las propuestas de cada función están en su carpeta: `specs/021-acceso-superadmin/propuestas.md`, `specs/022-clientes-licencias-conexiones/propuestas.md`, `specs/023-informes-ordenes/propuestas.md` y `specs/024-auditoria/propuestas.md`.

## Respuestas del responsable del 12/11/2026 que tocan documentos compartidos

Detalle y texto literal en `aclaraciones.md` de esta carpeta.

| Documento | Cambio | Motivo |
| --- | --- | --- |
| `docs/TECNOLOGIAS.md` | Registrar tres decisiones en estado CONFIRMADO: logotipo propio (un nido de aves con estética tecnológica); dirección visual con aspecto actual y degradados suaves, con la paleta ajustable por el `disenador-ui` (precisa D-004); revisión manual de accesibilidad hecha por una persona, con aviso al responsable. Añadir a V-110 el criterio «proyectos abiertos actuales y mantenidos»; sigue en VERIFICAR | Respuestas a las cuestiones 2, 6 y 12 |
| `docs/TECNOLOGIAS.md` | Registrar en estado CONFIRMADO que los dashboards muestran el nombre «Nido: Agentes de Correo» | Segunda respuesta a la cuestión 2 |
| `docs/TECNOLOGIAS.md` | Registrar en estado CONFIRMADO: tema claro y tema oscuro según la preferencia del sistema; habrá 2 superadmin al empezar; se esperan menos de 100 clientes en tres años y los tiempos de respuesta se prueban con 1.000 | Respuestas del responsable en el diálogo de preguntas, 12/11/2026 |
| `docs/DISENO.md` | Añadir el tema oscuro (hoy solo describe el claro con el menú oscuro) y los navegadores y lectores de pantalla admitidos | Respuestas a las cuestiones 1 y 3. Afecta al dashboard de cliente de la fase 5 |
| Coordinación, con las fases 1, 2, 5 y 6 | Decidir el alcance del nombre «Nido»: solo los dashboards, o también el nombre del conector en los asistentes, la pantalla de activación, el arranque local, el dashboard de cliente y los textos legales. Antes de publicar, comprobar que el nombre se puede usar como marca: es una palabra común y hay marcas con ese nombre en otros sectores | La 020 solo lo fija para el menú y la pestaña de los dashboards. El nombre del conector forma parte de la protección contra páginas falsas (cuestión 7 de la 001) |
| `docs/DISENO.md`, «Principios» y «Valores iniciales» | Compatibilizar el principio 4 («Sobrio… poca decoración») con los degradados suaves; añadir el logotipo y sus variantes; anotar que la paleta inicial se ajusta | Respuestas a las cuestiones 2 y 12 |
| `.claude/agents/disenador-ui.md`, `.claude/agents/ingeniero-frontend.md` y `docs/EQUIPO.md` | Valorar darles la herramienta para cargar las skills de diseño de la sesión. Mientras tanto, el orquestador carga la skill y pasa la guía en el encargo. Es un cambio de permisos de un agente: lo aprueba el responsable (artículo 14) | Respuesta a la cuestión 12: «usa skills de diseño» |
| `docs/PLAN.md`, fase 6 | Anotar que la decisión sobre la auditoría externa de accesibilidad se lleva al responsable antes de publicar | Respuesta a la cuestión 6, según la lectura del orquestador |

## Fronteras con otras fases (a confirmar)

| N.º | Asunto | Qué supone hoy la 020 | Quién debería confirmarlo |
| --- | --- | --- | --- |
| 1 | Dashboard de cliente | El armazón y los componentes admiten las áreas del cliente sin cambios (REQ-010). La fase 5 no puede implementar hasta que este sistema esté hecho | Fase 5 (040 a 042) |
| 2 | Conexiones del navegador fuera del dominio propio | Solo las de los servicios de datos que declare el diseño (REQ-032). `docs/ESQUELETO.md` prevé que el navegador hable con el servicio de datos, que está en otro dominio; `.claude/rules/interfaz.md` prohíbe recursos de terceros sin definir «terceros» | Coordinación; afecta a la política de contenido de la 021 |
| 3 | Lista de alertas | El componente existe en la fase 3, pero el área «Alertas» es de la fase 4 | Fase 4 (032) |
| 4 | Aviso antes de caducar la sesión | Lo decide la 021 (su requisito 44) con los componentes de la 020 | Función 021 |

## Cambios propuestos en documentos compartidos

| Documento | Cambio | Motivo |
| --- | --- | --- |
| `docs/DISENO.md`, «Valores iniciales» | Paleta final y color de borde para los controles, cuando el `disenador-ui` la valide con un comprobador de contraste. Contraste calculado por el orquestador el 12/11/2026 con la fórmula de WCAG (coincide con el cálculo a mano del `especificador`): texto secundario `#64748B` sobre acento suave `#EFE9FF`, 4,03:1 (no llega a 4,5:1); sobre el fondo de página, 4,55:1 (muy justo); borde `#E5E7EB` sobre blanco, 1,24:1 (no sirve para un campo de formulario, que necesita 3:1); acento `#6C3CE9` sobre el menú `#0B1230`, 3,03:1 (muy justo). El resto de combinaciones comprobadas cumple: acento sobre blanco 6,07:1, correcto y aviso 5,02:1, error 6,47:1 | REQ-029. Depende de la cuestión 12 |
| `docs/DISENO.md`, «Estructura de pantalla» | Ancho a partir del cual el menú pasa a cajón (la 020 propone 1023 píxeles o menos) y ancho máximo de contenido | REQ-004, REQ-008 |
| `docs/DISENO.md`, «Textos y formatos» | Reglas que salgan de las cuestiones 7 a 9: cuatro cifras, abreviaturas de los meses, indicación de la hora de Madrid. Decir que el día va sin cero inicial y el mes sin punto | REQ-047 a REQ-049 |
| `docs/DISENO.md`, «Componentes base» | Catálogo cerrado de palabras de estado, común a los dos dashboards | REQ-012 |
| `docs/DISENO.md`, «Páginas» | Nota de fase en «Resumen» y en «Ajustes»: la pausa global, las alertas, la versión por canal y los impagos llegan en las fases 4 y 6 | REQ-003; la 023 no los muestra en la fase 3 |
| `docs/DISENO.md`, «Accesibilidad» | Decir si el 4,5:1 se exige también al texto grande (la 020 lo exige; WCAG admite 3:1) | REQ-029 |
| `.claude/rules/interfaz.md` | Definir «recursos de terceros» y aclarar la regla de la dirección cuando se responda la cuestión 10 | Frontera 2; cuestión 10 |

## Decisión en VERIFICAR: V-110

Verificada por el orquestador de la fase 3 con la skill `verificar-decision`: documentación oficial y registro de paquetes el 12/11/2026, prueba real en navegador el 13/11/2026. Evidencia completa en `evidencias/V-110-verificacion.md`.

| Qué se propone a coordinación | Detalle |
| --- | --- |
| Pasar V-110 de VERIFICAR a **PROPUESTO** en `docs/TECNOLOGIAS.md` | No puede ser CONFIRMADO: el responsable no ha elegido librería. La elige el diseño de la 020 entre las candidatas verificadas y la aprueba el responsable en la puerta P1 |
| Texto para la fila | «Candidatas verificadas el 12 y 13/11/2026: Tailwind CSS 4.3 (MIT) para estilos; primitivas accesibles Radix 1.8 (MIT) o React Aria Components 1.22 (Apache-2.0), con el código de los componentes en el repositorio; Recharts 3.10 (MIT, SVG) para gráficos; `axe-core` 4.14 (MPL-2.0) para la comprobación automática. Descartadas: Tremor (sin publicar desde 01/2025, no admite React 19), Chart.js y ECharts (canvas, accesibilidad a cargo de quien las usa). Pendiente: prueba con lector de pantalla, que hace una persona, y repetir la prueba del foco dentro de la app» |
| Lo que la prueba real encontró | Radix superó todas las comprobaciones del diálogo. React Aria no devolvió el foco al botón en una de las dos páginas de prueba, sin causa determinada. Base UI no retuvo el foco, quizá por un uso incorrecto en la prueba. Recharts se recorre con teclado, pero no anuncia los valores |
| Aviso para el responsable (artículo 7) | El registro de cambios de shadcn/ui contiene textos dirigidos a agentes de código. Se trataron como datos y no se siguieron |

## Decisiones del responsable del 13/11/2026 para coordinación y la fase 1

Texto literal en `aclaraciones.md`. La 020 está PLANIFICADA (puerta P1 abierta el 13/11/2026).

| Documento o función | Cambio | Motivo |
| --- | --- | --- |
| `docs/PLAN.md`, tabla «El código respeta las dependencias» | La función 020 puede implementarse con su puerta P1 y la app de la fase 1, sin esperar a las migraciones de la fase 2. Las funciones 021 a 024 no cambian | Respuesta del responsable: «Sí, sin esperar a la fase 2» |
| Función 002 (fase 1) | Aceptar: la comprobación «interfaz» en la batería y la comparación de cuentas con `main`; cinco archivos nuevos como rutas reservadas (el inventario de la muestra, al terminar los componentes); el campo `referencia` con formato exacto en `registro.ts`; y que el despliegue de producción exija que `/muestra` responda 404 | Diseño y dictamen de la 020. El responsable aprobó la ampliación de rutas reservadas |
| `docs/TECNOLOGIAS.md` | Registrar en CONFIRMADO: V-110 resuelta con Tailwind CSS 4.3, Radix (diálogo, cajón y avisos), Recharts 3.10, Playwright y `axe`, condicionada a la prueba del foco de la primera tarea; riesgo aceptado de la primera descarga de navegadores; muestra pública en preproducción; título de pestaña sin nombres de clientes | Puerta P1 de la 020 |
| `docs/ESQUELETO.md`, `docs/DISENO.md`, `.claude/rules/interfaz.md` | Los cambios que lista el diseño de la 020 en «Decisiones que requieren ADR» y en su informe | Diseño aprobado |

## Peticiones del orquestador de la fase 3 (14/11/2026)

1. **Para la fase 1 (002):** la 020 no puede implementarse todavía: no existe `package.json` ni `src/` en la raíz. Necesito de la 002, y no lo creo por mi cuenta: `package.json` con Next.js, React, TypeScript, y los scripts `lint`, `typecheck`, `test`; la carpeta `src/app` con el armazón mínimo y la ruta de la muestra; la comprobación «interfaz» de la batería local (accesibilidad con `axe` y Playwright); las rutas reservadas ampliadas. Cuando exista, la 020 empieza por T-001 de `tareas.md`.
2. **Región (D-020):** el diseño de la 002 sigue diciendo `fra1`; D-020 fijó `arn1` y la base de datos en `eu-north-1`. Los diseños 020 a 025 no dependen de la región, salvo la condición del ADR del `proxy.ts` de la 021 (dónde se ejecuta).
3. **Incidencia de modelo (14/11/2026):** el límite semanal de Fable está agotado hasta el 19/11. Mientras tanto, el `arquitecto` se llama con `model: "opus"`. Si EQUIPO.md debe reflejarlo, lo decide coordinación.
4. **Enmienda de la 020:** la página «Informes» de la 023 añade una sexta entrada al menú (la 020 aprobó cinco). Pendiente de aplicar en la especificación de la 020 y en su diseño.
