# 052 · Aclaraciones

Cada cuestión abierta de la especificación, con la respuesta del responsable. Una respuesta supuesta no vale: si no hay respuesta, la cuestión sigue abierta.

**Estado: presentadas al responsable el 12/11/2026. Ninguna respondida todavía.** La especificación sigue en PROPUESTA.

La numeración es la del apartado «Cuestiones abiertas» de `especificacion.md`. Las recomendaciones son del orquestador y no son decisiones. Nada de lo que sigue es asesoramiento legal: lo marcado como «profesional» lo confirma un abogado o especialista en protección de datos antes de publicar.

## A. Las decide el responsable

### 2 · Quién valida los textos

| Opción | Consecuencia |
| --- | --- |
| A. Abogado o consultor externo de protección de datos, con un encargo puntual | Validación independiente y con firma. Tiene coste y plazo: conviene contratarlo pronto, porque varias cuestiones dependen de él |
| B. La gestoría, si ofrece ese servicio | Un solo interlocutor para lo fiscal (B-001) y lo legal, si de verdad lo cubre |
| C. Delegado de protección de datos | Solo si el profesional dice que hay que nombrarlo (cuestión 10) |

Recomendación: **A** (o B si la gestoría lo ofrece). Nueva validación solo en cambios de fondo: categoría de dato, finalidad, proveedor, región o plazo nuevos. Lo decide el responsable.

### 4 · Condiciones del servicio

¿Existe hoy un contrato firmado con los clientes? ¿Cubre el cobro recurrente, el periodo de gracia y la suspensión por impago?

Recomendación: **incluir en esta función unas condiciones del servicio** que lo respalden, salvo que el contrato actual ya lo cubra. Las redacta o valida el profesional. Sin ellas, la suspensión automática de la función 050 no tiene respaldo escrito.

### 5 · Aceptación expresa

Recomendación: **no pedir aceptación de la política de privacidad** (es información, no consentimiento; lo confirma el profesional) y **aceptar las condiciones del servicio al contratar**, fuera del programa (en la página de pago de Stripe o en el contrato). Así el sistema no guarda un dato personal más. Si el profesional exige constancia dentro del sistema, se añade como requisito.

### 7 · Datos tras la baja de un cliente

Recomendación de partida, a validar: al dar la baja se revocan conexiones y tokens en el momento; a los **90 días** se eliminan las cuentas de sus usuarios, sus informes, ejecuciones, alertas, órdenes y reglas; la auditoría conserva su plazo; los datos de cobro, lo que diga la gestoría. Los 90 días cubren una vuelta del cliente o una reclamación.

### 8 · Dónde se publican los textos

Recomendación: **en el mismo dominio de los dashboards y del conector**, para que estén siempre disponibles desde la pantalla de activación y coincidan con la versión desplegada. La web corporativa puede enlazarlos. Depende del dominio que se decida en la fase 1.

### 9 · Cookies y analítica

Recomendación: **solo cookies técnicas de sesión y ninguna analítica** en los dashboards. Así, en principio, no hace falta aviso de cookies con consentimiento (lo confirma el profesional). Activar analítica más adelante reabre esta cuestión.

### 14 y 15 · Canal de derechos y quién los atiende

Recomendación: una **dirección de correo dedicada** publicada en la política; las solicitudes y su correspondencia se guardan **fuera del programa**, en el archivo documental de HumanaIA; todo lo atiende un superadmin, sin autoservicio en el dashboard de cliente. El programa solo aporta las operaciones de exportar y suprimir, auditadas.

### 18 · Agentes de ingeniería y datos reales de producción

| Opción | Consecuencia |
| --- | --- |
| A. No. Los agentes solo ven entornos con datos ficticios; en producción revisa una persona, con consultas que devuelven recuentos | Coherente con «ningún dato real sale de producción». Las revisiones de producción cuestan tiempo de una persona |
| B. Sí | El proveedor de esas herramientas entra en la lista de encargados y en la política de privacidad |

Recomendación: **A**.

### 19 · Ejercicio de brechas

Recomendación: **dentro del simulacro de incidentes de la función 051**, como un solo ejercicio.

### 20 · Archivo de acuerdos y validaciones

Recomendación: **fuera del repositorio**, en el archivo documental de HumanaIA con acceso restringido. En el repositorio solo un índice: proveedor, versión, fecha y dónde está, sin datos de firmantes.

## B. Plazos de conservación (cuestiones 3, 12 y 13)

Propuesta de partida para que la valide el profesional. No es un criterio legal.

| Categoría | Plazo propuesto |
| --- | --- |
| Informes, ejecuciones, alertas y órdenes | 24 meses |
| Auditoría | 5 años, con una vía controlada de eliminación al vencer (cuestión 12) |
| Estado de cobro e identificadores de Stripe | Mientras el cliente esté activo y, tras la baja, lo que indique la gestoría |
| Eventos de cobro (identificador y tipo) | 12 meses |
| Conexiones, tokens y códigos caducados o revocados | 90 días |
| Cuentas de usuarios tras la baja del cliente | 90 días (cuestión 7) |
| Registros del servidor y supervisión de errores | 30 días, o el plazo fijo del proveedor si no se puede cambiar |
| Copias de seguridad | Lo que dé el plan contratado |
| Solicitudes de derechos y registro de brechas | El que indique el profesional |

- Margen entre vencimiento y eliminación: 7 días.
- Revisión del inventario, del registro de actividades y de la lista de encargados: anual, y cuando un proveedor cambie su acuerdo.
- Suspensión de plazos por incidente (13): la abre y la cierra el responsable; 12 meses como máximo, renovable de forma expresa.

## C. Datos que debe aportar el responsable

| N.º | Dato |
| --- | --- |
| 1 | Denominación, NIF, domicilio, datos registrales si es sociedad y correo de contacto, para el aviso legal. No hacen falta ahora: se piden al redactar los textos. Sí conviene saber ya si HumanaIA factura como sociedad o como autónomo, porque cambia la fecha de Verifactu (B-001) |

## D. Las contesta el profesional, no el responsable ni el equipo

Se le trasladan cuando el responsable lo designe (cuestión 2). Hasta entonces siguen abiertas y no bloquean diseñar.

| N.º | Cuestión |
| --- | --- |
| 6 | Papel de HumanaIA frente a sus clientes (responsable, encargado o ambos). Incluye si la instalación, en la que una persona de HumanaIA configura el asistente con acceso al correo del cliente, exige contrato de encargo |
| 10 | Si hace falta delegado de protección de datos y evaluación de impacto |
| 11 | Papel de Stripe (encargado o responsable independiente) y qué documento se archiva |
| 16 | Clientes autónomos: si su nombre comercial, sus identificadores y sus cifras son datos personales |
| 17 | Garantía de las transferencias internacionales y cómo redactarla |

## Respuestas

| N.º | Cuestión | Respuesta | Quién y cuándo | Efecto en la especificación |
| --- | --- | --- | --- | --- |
| 1 | Datos del titular | Pendiente | | |
| 2 | Quién valida | Pendiente | | |
| 3, 12, 13 | Plazos de conservación | Pendiente | | |
| 4 | Condiciones del servicio | Pendiente | | |
| 5 | Aceptación expresa | Pendiente | | |
| 7 | Datos tras la baja | Pendiente | | |
| 8 | Dónde se publican | Pendiente | | |
| 9 | Cookies y analítica | Pendiente | | |
| 14, 15 | Canal de derechos | Pendiente | | |
| 18 | Agentes y datos reales | Pendiente | | |
| 19 | Ejercicio de brechas | Pendiente | | |
| 20 | Archivo de acuerdos | Pendiente | | |
| 6, 10, 11, 16, 17 | Cuestiones para el profesional | Pendiente | | |

## Decisiones que salen de aquí

Las que deban quedar en `docs/TECNOLOGIAS.md`, con su identificador. Las anota el chat de coordinación a partir de `propuestas.md`.

- Quién valida los textos legales.
- Plazos de conservación por categoría.
- Regla sobre agentes de ingeniería y datos reales de producción.
