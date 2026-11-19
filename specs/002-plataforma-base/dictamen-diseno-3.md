# 002 · Dictamen de seguridad del diseño (tercera vuelta)

Autor: `auditor-seguridad` · 19/11/2026 · Sobre: `diseno.md`, cuarta versión; solo lo cambiado (D-023). Transcrito por el orquestador.

**Veredicto: APTO CON CONDICIONES.** Sin bloqueantes. MAYOR 3 y MAYOR 5 quedan parciales por dos mayores nuevos, N-1 y N-2, que hay que corregir en el diseño. Las aceptaciones A-1, A-3, A-4 y A-14 d son del responsable; mientras falten, P1 no debe abrirse por delegación.

Comprobado: `comprobar-specs` SUPERADO; `git config --get-all credential.helper` = `manager` (GCM, sistema); `gh auth status` (sin mostrar token): **sesión activa con `repo`, `workflow`, `gist` y `read:org`**; `.claude/settings.json`: `git push` en «ask» y `gh` sin restricción (cambiar ajustes es reservado a una persona, art. 14).

| Hallazgo | Estado | Dónde |
| --- | --- | --- |
| 1 | CERRADO | l. 54, 82, 101, 208; PRUEBA-051 |
| 2 | CERRADO | l. 91, 145; PRUEBA-052 |
| 3 | PARCIAL | l. 138, 139, 153; PRUEBA-018; falta ligar cada declaración a su posición (N-1) |
| 4 | CERRADO | l. 89, 151, 159, 198; PRUEBA-053; redacción ambigua (N-3) |
| 5 | PARCIAL | l. 127, 199, 201, 232; PRUEBA-054, 010; ver N-2 |
| 6 | CERRADO | l. 187, 331-332; aclaraciones l. 187; PRUEBA-047 |
| m-1 a m-6 | CERRADOS | m-2: el formato de `x-vercel-id` sigue sin verificar (l. 350) |

## Hallazgos nuevos
- **N-1 · MAYOR · Una declaración firmada se puede volver a presentar (l. 149, 153).** Arts. 14 y 13; A-16. Un alta firmada es cualquier archivo nuevo con `.sig` válido y la delegación rige desde el M que la integra. Un agente copia una `delegacion` antigua con otro nombre tras una `fin-delegacion` y vuelve a regir; si el máximo `integrado/NNNN` es opcional (l. 153 dice «o») no tiene límite. Igual con `calendario-revisado` y `condiciones-inicio`. **Corrección:** el campo `commit` de toda declaración debe ser el primer padre del M que la integra; la comprobación 10 rechaza una firma o un contenido ya presente en `main`; `delegacion` exige un máximo `integrado/NNNN`. **Prueba:** ampliar PRUEBA-018 y 019: reintegrar una `delegacion` válida tras `fin-delegacion` y un `calendario-revisado` antiguo; ambos rechazados.
- **N-2 · MAYOR · Credenciales de GitHub fuera de `subir-copia` (l. 199, 201, 332).** Arts. 4 y 14; A-20. Cerrar `gh` no borra lo que GCM guarde para github.com. Con cualquiera de las dos, `git push origin tarea/…` o un cambio en `.github/workflows` (alcance `workflow`) llegan al remoto sin pasar por `subir-copia`. El token de grano fino «en DPAPI de la cuenta del responsable» lo pueden leer los agentes mientras la cuenta sea compartida. **Corrección:** cerrar `gh` **y** borrar la credencial de GCM para github.com; crear el token de grano fino después de separar cuentas, como la clave (l. 89); `comprobar-inicio`, con `GIT_TERMINAL_PROMPT=0` y `GCM_INTERACTIVE=never`, comprueba que `git ls-remote origin` falla y que `gh` no tiene sesión; protección de ramas en GitHub, en la 003. **Prueba:** ampliar PRUEBA-054.
- **N-3 · MENOR · Redacción de la l. 159.** «Se niega sin `cuenta-separada` o sin `aceptacion-riesgo` A-3» puede leerse como que exige las dos; la l. 329 dice que basta una. Redactar «si no hay ni una ni otra». PRUEBA-053 con cada una por separado.
- **N-4 · MENOR · Coordinación con la 001.** La l. 226 (la 001 prepara el día D y usa D+1 a D+3) contradice C-5 de la 001 (periodo desde el día D). La l. 177 pone `no-referrer` en todas las rutas, sin la excepción C-4 para `/oauth/autorizar`. Incorporar C-1 a C-6 o citarlas como cambio firmado pendiente.

## En manos del responsable
1. A-1: `aceptacion-riesgo`, enmienda de REQ-019 y CA-021, gasto de Observability Plus. 2. A-3: cuenta aparte o aceptación firmada. 3. A-4 y A-14 d. 4. Crear clave y token de GitHub tras separar cuentas. 5. Cerrar `gh` y la credencial de GCM. 6. Firmar `ancla` y `delegacion`. 7. `decision-pago`. 8. Resto del punto 6 de «Asuntos y pendientes»: proyectos, CNAME, variables, tokens, monitores y WAF.

## No comprobado
Si GCM guarda hoy una credencial de github.com (no consultado a propósito); formato de `x-vercel-id`; alcance efectivo del token de grano fino; reglas de protección de GitHub. No hay código ni pruebas que ejecutar.

**Sin bloqueantes.**
