---
name: version-prompt
description: Procedimiento para crear, revisar, publicar y retirar una versión del prompt del agente de correo. Úsala al tocar prompts/agente-ia, al publicar una versión en el canal de prueba o en el estable, y al hacer una vuelta atrás.
argument-hint: "[versión, por ejemplo 1.3]"
---

# Versión del prompt

El prompt es lo que siguen los agentes de todos los clientes dentro de sus cuentas de correo. Cambiarlo es ruta crítica (ADR-0005, artículo 9).

## Crear una versión

1. El texto vive en `prompts/agente-ia/<versión>.md`. Nunca se edita una versión ya registrada: se crea otra.
2. Numeración: `mayor.menor`. Cambia el número menor si el agente hace lo mismo mejor; el mayor si cambia qué hace o qué informa.
3. Parte de la versión anterior y anota arriba qué cambia y por qué.
4. El arranque local (`prompts/agente-ia/arranque.md`) es otro archivo: cambiarlo obliga a reinstalarlo en cada cliente. Evítalo.

## Qué no puede contener una versión

- Instrucciones para enviar correo, borrar, compartir archivos o introducir credenciales.
- Nada que relaje los límites del arranque local.
- Peticiones de incluir en el informe asuntos, remitentes, nombres de documentos o frases. El informe son cifras y códigos del catálogo.
- Datos de un cliente concreto. Lo que varía por cliente va en sus reglas, que son valores cerrados.
- Direcciones o enlaces a servicios que no sean el conector.

## Revisar

- `revisor`: el texto hace lo que dice el cambio, es claro, y el informe que pide coincide con `contratos/informe.schema.json`.
- `auditor-seguridad`: ninguna instrucción prohibida; cierre en fallo intacto; ninguna vía de salida de contenido.
- Skill `revision-privacidad`, apartado «Prompt».
- Prueba en una cuenta de prueba de HumanaIA, en conversación y programada, antes de registrar.

## Registrar

La versión entra por una petición de cambio aprobada. El despliegue la registra en `versiones_prompt` con su huella y su commit. A partir de ahí es inmutable.

## Publicar

1. **Canal de prueba primero.** Lo publica un superadmin en el panel. Sale un aviso fuera del panel.
2. **Permanencia mínima en prueba** antes de pasar a estable: la que fije el responsable (propuesta: 3 días y al menos 10 revisiones).
3. **Criterios para promover**, comparando con la versión estable en las métricas por versión:
   - Proporción de revisiones en `error` y en `aviso` no peor.
   - Correos sin tratar no peor.
   - Ningún código de problema nuevo que se repita.
   - Ninguna incidencia comunicada por los clientes del grupo de prueba.
4. **Publicar en estable**: lo aprueba el responsable.

## Volver atrás

Es una publicación nueva que apunta a la versión anterior. Se aplica en la siguiente revisión de cada agente. Ante un problema grave: primero pausa global, después vuelta atrás.

## Anotar

Cada publicación y cada vuelta atrás quedan en auditoría. Anota en `docs/TECNOLOGIAS.md` cualquier decisión nueva sobre el contenido del prompt.
