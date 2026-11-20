# ADR-0002: Autorización del conector y activación de la licencia

Estado: CONFIRMADO en lo esencial; detalle en VERIFICAR (V-106) · Fecha: 12/11/2026 · Decisiones: D-006, T-009 a T-011

## Contexto

El cliente añade el conector en su Claude o ChatGPT y debe quedar ligado a su licencia. Los dos asistentes solo coinciden en un mecanismo: OAuth 2.1 con PKCE. El token en la URL está prohibido por la especificación MCP, ChatGPT no admite claves fijas y en Claude las cabeceras fijas están en beta limitada.

La especificación exige metadatos de recurso protegido. Para registrar clientes recomienda CIMD y mantiene DCR por compatibilidad; Claude recurre a DCR si falta algún valor de CIMD.

## Decisión

1. Servidor de autorización propio y mínimo dentro de la app: solo los flujos de código de autorización y de renovación, PKCE S256, clientes públicos, coincidencia exacta del callback.
2. Callbacks en lista cerrada: el de Claude y los dos de ChatGPT (T-010).
   Precisado para la 001 por ADR-0007: lista de dos callbacks exactos (Claude y el estable de ChatGPT); el de ChatGPT con parte variable no se admite.
3. Registro de clientes por CIMD solo desde hosts conocidos, y por DCR con límite y purga.
4. La pantalla de autorización pide un **código de activación de un solo uso**, generado en el panel y con caducidad de minutos. No existe una clave de licencia permanente que el cliente teclee.
5. Cada activación crea una **conexión** ligada a la licencia, visible en el panel y revocable por separado. Una conexión nueva genera alerta.
6. Tokens opacos, guardados como HMAC con un secreto que no está en la base de datos. Acceso de vida corta. Renovación con rotación atómica, ventana de gracia de unos 60 segundos que devuelve el mismo par, y caducidad deslizante. La reutilización fuera de la ventana revoca esa conexión y genera alerta.
   Precisado para la 001 por ADR-0007 (par derivado en la ventana de gracia; lista de dos callbacks).
7. El formulario de activación va por POST, con protección contra envíos cruzados, sin posibilidad de incrustarse en otra página y con límite de intentos.

## Alternativas

| Alternativa | Por qué no |
| --- | --- |
| Clave de licencia permanente tecleada en la pantalla | Una página falsa basta para robarla, y quien la tenga conecta desde su propia cuenta y recibe prompt y reglas |
| Servidor OAuth de Supabase | En beta pública, sin pruebas documentadas con Claude ni ChatGPT, y liga la conexión a un usuario, no a una licencia |
| Conector sin autenticación | Cualquiera recibiría el prompt |
| Librería de servidor OAuth | No se conoce ninguna que cubra CIMD y pantalla propia en funciones sin estado (V-106) |

## Consecuencias

- Hay que implementar y probar con cuidado un servidor de autorización: es ruta crítica.
- La prueba real de la fase 1 usa tokens de acceso de 5 minutos y ejecuciones simultáneas para ejercitar la renovación.
- Si un asistente cambia sus callbacks, hay que actualizar la lista cerrada.
- Instalar en un cliente exige que alguien de HumanaIA genere el código en el momento.
