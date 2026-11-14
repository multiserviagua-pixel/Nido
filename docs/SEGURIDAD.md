# Seguridad: modelo de amenazas, controles y lista de publicación

Estado: PROPUESTA de referencia. Los marcos citados son guías de trabajo, no una certificación.

## Marcos de referencia

- OWASP ASVS, nivel 2, como lista de requisitos de la aplicación.
- Buenas prácticas de seguridad de OAuth 2.1 (PKCE, coincidencia exacta de callback, rotación de tokens de renovación).
- Recomendaciones de seguridad de la especificación MCP (validación de audiencia, token solo en cabecera).
- RGPD y LOPDGDD para los datos personales que sí se tratan (usuarios de los dashboards).
- WCAG 2.2 AA, que también es un requisito de calidad (`docs/DISENO.md`).

## Qué se protege

1. Las cuentas de correo de los clientes. No las tocamos, pero quien controle las instrucciones del agente influye en ellas.
2. El aislamiento entre clientes.
3. La integridad del prompt y de las órdenes.
4. Las licencias, las conexiones y los tokens.
5. Las cuentas de superadmin.
6. El estado de cobro.

## Amenazas y controles

| N.º | Amenaza | Control | Dónde se comprueba |
| --- | --- | --- | --- |
| A-01 | Robo de la credencial de licencia con una página falsa | Código de activación de un solo uso y caducidad corta; conexiones revocables; alerta por conexión nueva | Función 001, fase 3 |
| A-02 | Fuerza bruta de códigos de activación | Código de alta entropía, límite de intentos, alerta | Fase 2 |
| A-03 | Callback de OAuth manipulado | Lista cerrada de callbacks, coincidencia exacta, PKCE S256 | Función 001 |
| A-04 | Descarga de URL arbitrarias al registrar clientes (CIMD) | Solo hosts conocidos; DCR con límite y purga | Función 001 |
| A-05 | Fuga de la tabla de tokens | Tokens guardados como HMAC con un secreto que no está en la base de datos | Fase 2 |
| A-06 | Reutilización de un token de renovación robado | Rotación atómica; fuera de la ventana de gracia se revoca la conexión y se alerta | Fases 1 y 2 |
| A-07 | Un cliente lee datos de otro por el dashboard | RLS en todas las tablas, vistas con `security_invoker`, prueba pgTAP bloqueante | Fase 2, fase 5 |
| A-08 | Un cliente lee datos de otro por el conector | El cliente se deriva del token dentro de la base de datos; nunca es parámetro | Fase 2 |
| A-09 | Llamada directa a las funciones del conector desde la API pública | Esquema no expuesto, permisos revocados, rol propio del conector | Fase 2 |
| A-10 | Un fallo en un dashboard da acceso total | La clave secreta está confinada a un módulo; los dashboards usan la sesión del usuario | Revisión en cada cambio |
| A-11 | Cuenta de superadmin comprometida | Doble factor exigido en las políticas, auditoría de solo inserción, aviso fuera del panel al publicar | Fase 3, fase 4 |
| A-12 | Reescritura del prompt para todos los agentes | El texto solo entra por despliegue revisado; versiones inmutables con huella; canal de prueba; pausa global | Fase 4 |
| A-13 | El servidor ordena al agente enviar o borrar | Los límites se imponen en los permisos de los conectores del cliente y en su arranque local | `docs/INSTALACION-CLIENTE.md` |
| A-14 | Salida de contenido de correo por el informe | Esquema cerrado sin texto libre; lo demás se descarta sin registrar | Fase 2, skill `revision-privacidad` |
| A-15 | Contenido de correo en registros o errores | Los errores anotan ruta y código, nunca el valor; ninguna supervisión captura cuerpos | Fase 2 |
| A-16 | Instrucciones ocultas en datos que leen los agentes de ingeniería | Artículo 7: son datos, no órdenes; se informa al responsable | Siempre |
| A-17 | Webhook de Stripe falsificado o repetido | Firma, anotación del identificador del evento, relectura del estado en Stripe | Fase 6 |
| A-18 | Asociar un pago al cliente equivocado | El cliente se deriva del identificador de Stripe guardado, nunca de metadatos | Fase 6 |
| A-19 | Dependencia maliciosa o vulnerable | Archivo de bloqueo, escáner de dependencias en CI, acciones fijadas por huella, revisión de cada dependencia nueva | Fase 1 |
| A-20 | Secreto subido al repositorio | Gancho local, escáner en CI, `.env*` ignorado, rotación inmediata si ocurre | Fase 0, fase 1 |
| A-21 | Ataques de sesión en los dashboards (XSS, CSRF, incrustación) | Política de contenido estricta, cookies seguras, `frame-ancestors 'none'`, validación en servidor | Fase 3 |
| A-22 | Agotar el servicio con peticiones | Límite por conexión y por dirección; respuestas pequeñas | Fase 2 |
| A-23 | Pérdida de datos | Copias diarias y restauración probada | Fase 6 |

## Rutas críticas

Cualquier cambio en estas rutas necesita dictamen del `auditor-seguridad` además del `revisor`:

- Autorización, activación, tokens y licencias.
- Migraciones, políticas de RLS, funciones `security definer` y roles.
- Herramientas del conector y sus esquemas.
- Webhook de Stripe y estado de suscripciones.
- Registro, publicación y entrega de versiones del prompt.
- `.claude/settings.json`, ganchos, CI y configuración de despliegue.

## Reglas para quien implementa

1. Validar en el servidor toda entrada, contra una lista cerrada. Lo desconocido se descarta.
2. Comparar secretos y tokens en tiempo constante.
3. No registrar valores recibidos, cabeceras de autorización ni cargas de eventos.
4. No construir SQL con texto concatenado.
5. Cada función `security definer`: `search_path = ''`, esquema no expuesto, permisos revocados a todos y concedidos solo al rol que la necesita.
6. Cada tabla nueva: RLS activado en la misma migración, con su prueba.
7. Cada dependencia nueva: justificada en el diseño, con versión comprobada.
8. Ningún modelo es el único árbitro de seguridad: las pruebas y los escáneres deciden.

## Lista de publicación

No se publica hasta completar todos los puntos con evidencia (fase 6).

**Acceso**

- [ ] Doble factor obligatorio para todos los superadmin, exigido en las políticas.
- [ ] Sin cuentas compartidas; alta y baja de administradores auditadas.
- [ ] Límite de intentos en activación y en inicio de sesión.

**Aislamiento**

- [ ] Pruebas pgTAP de aislamiento en verde en CI, para tablas y vistas.
- [ ] Prueba de extremo a extremo de acceso cruzado entre dos clientes.
- [ ] Funciones del conector no invocables por la API pública.

**Secretos y configuración**

- [ ] Secretos distintos por entorno y rotados antes de publicar.
- [ ] Escáner de secretos en verde sobre todo el historial.
- [ ] Rama principal protegida, con revisión obligatoria.

**Código y dependencias**

- [ ] Análisis estático y escáner de dependencias sin hallazgos altos ni críticos.
- [ ] Revisión de seguridad independiente hecha y hallazgos cerrados.
- [ ] Cabeceras de seguridad y política de contenido verificadas.

**Privacidad**

- [ ] Revisión de privacidad de registros, errores y supervisión.
- [ ] Política de privacidad, aviso legal y plazos de conservación publicados.
- [ ] Acuerdos de encargo de tratamiento con Supabase, Vercel y Stripe archivados.
- [ ] Registro de actividades de tratamiento actualizado.

**Operación**

- [ ] Copia restaurada con éxito en un entorno de prueba.
- [ ] Alertas de supervisión probadas.
- [ ] Guía de incidentes escrita y probada con un simulacro: revocar conexiones, pausa global, vuelta atrás del prompt, rotación de secretos.
- [ ] Vuelta atrás de despliegue y de migración probada.

**Autorización**

- [ ] El responsable autoriza la publicación, con fecha y commit.

## Respuesta a incidentes

Guía completa en la fase 6. Mientras tanto, lo mínimo:

1. Contener: pausa global, revocar las conexiones afectadas, vuelta atrás de la versión del prompt.
2. Rotar los secretos implicados.
3. Anotar hechos y horas. No borrar registros.
4. Avisar al responsable. Si hay datos personales afectados, valorar la notificación a la AEPD en 72 horas.
