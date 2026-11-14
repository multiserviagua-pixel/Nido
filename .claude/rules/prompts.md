---
paths:
  - "prompts/**"
---

# Reglas al tocar el prompt del agente

Ruta crítica: lo que se escribe aquí lo siguen los agentes de todos los clientes dentro de sus cuentas de correo. Sigue la skill `version-prompt`.

- Una versión registrada no se edita: se crea otra.
- Ninguna instrucción para enviar correo, borrar, compartir archivos o introducir credenciales.
- Nada que relaje los límites del arranque local.
- El informe que pide el prompt son cifras y códigos del catálogo, según `contratos/informe.schema.json`. Nunca asuntos, remitentes, nombres de documentos ni frases.
- Ningún dato de un cliente concreto: lo que varía va en sus reglas, que son valores cerrados.
- Cierre en fallo: sin instrucciones válidas del conector, el agente no toca el correo.
- Cambiar `arranque.md` obliga a reinstalarlo en cada cliente: solo con aprobación del responsable.
- Toda versión pasa por el `revisor`, el `auditor-seguridad` y una prueba en una cuenta de HumanaIA antes de registrarse.
- Se publica primero en el canal de prueba.
