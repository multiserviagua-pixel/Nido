---
name: revision-privacidad
description: Revisión de privacidad de un cambio para comprobar que no puede entrar ni salir contenido de correos ni datos personales de terceros. Úsala antes de cerrar cualquier cambio que maneje entradas, registros, errores, informes, reglas, supervisión o datos de Stripe.
---

# Revisión de privacidad

La regla: al sistema solo llegan cifras, booleanos y valores de listas cerradas. Nunca asuntos, remitentes, direcciones, nombres de documentos ni textos de correos (artículo 1).

## Qué buscar en el cambio

**Entradas**

- [ ] ¿Hay algún campo nuevo de tipo texto en un informe, una regla o una herramienta? Si no es un enumerado o un identificador con formato fijo, es BLOQUEANTE.
- [ ] ¿Algún texto con patrón permite más de lo que aparenta? Un patrón como `.*` o sin longitud máxima es texto libre.
- [ ] ¿Los campos desconocidos se descartan antes de guardar o registrar?

**Registros y errores**

- [ ] ¿Algún registro escribe el cuerpo de una petición, sus argumentos o un objeto de error completo?
- [ ] ¿Algún mensaje de error devuelve el valor recibido («valor X no válido»)?
- [ ] ¿Se registran cabeceras de autorización, tokens, códigos de activación o cookies?
- [ ] ¿La herramienta de supervisión captura cuerpos, formularios o parámetros de consulta?

**Almacenamiento**

- [ ] ¿Se guarda la carga de un evento de Stripe? Solo identificador y tipo.
- [ ] ¿Alguna columna nueva puede contener datos personales de terceros?
- [ ] ¿Los datos personales que sí se tratan (usuarios de los dashboards) son los mínimos y tienen plazo de conservación?

**Salidas**

- [ ] ¿El dashboard de cliente muestra algo que no sea suyo o que sea interno?
- [ ] ¿Algún dato va en la URL o en parámetros de consulta?
- [ ] ¿Se envía algo a un servicio externo que no esté en la lista de encargados (Supabase, Vercel, Stripe)?

**Pruebas y evidencias**

- [ ] ¿Los datos de prueba son ficticios y se nota que lo son?
- [ ] ¿Alguna evidencia o captura contiene datos reales o secretos?

**Prompt**

- [ ] ¿La versión del prompt pide al agente incluir en el informe algo que no sea una cifra o un código?
- [ ] ¿Pide enviar, borrar, compartir o introducir credenciales?

## Cómo comprobarlo

1. Busca en el cambio llamadas de registro y construcción de mensajes de error, y lee qué reciben.
2. Compara los campos aceptados con `contratos/`.
3. Si hay pruebas, ejecuta una con un valor reconocible (por ejemplo, `TEXTO-CANARIO-123`) en un campo de más y en un campo inválido, y busca ese valor en la respuesta, en los registros y en la base de datos. No debe aparecer.

## Resultado

Hallazgos con gravedad, archivo y línea. Cualquier vía por la que pueda entrar contenido de correo o salir un valor recibido es BLOQUEANTE. Di también qué has comprobado ejecutando y qué solo leyendo.
