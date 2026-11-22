# 025 · Propuestas

Autor: `arquitecto` · 22/11/2026 · Fuente: `diseno.md` puesto al día el 22/11/2026. Lo que la 025 necesita de otras funciones, del `especificador` y de coordinación, sin editar sus archivos. Ninguna se da por aceptada sin respuesta (art. 13). Las decisiones técnicas tomadas por delegación están en `diseno.md`, «Decisiones por delegación (D-036)».

## Al `especificador` (enmienda E-1; P0 delegada, D-036)

| N.º | Petición | Motivo |
| --- | --- | --- |
| P25-01 | REQ-009: separar el caso del cliente dado de baja. Texto propuesto: «Si en el momento de confirmar el agente del cliente no recibiría instrucciones (sin licencia vigente o en pausa efectiva según la función 023), el diálogo lo dice: las reglas se guardan y el agente las recibirá cuando vuelva a recibir instrucciones. Si el cliente está dado de baja, el diálogo dice que su agente ya no recibe instrucciones y que las reglas se guardan igualmente.» CA-006: «el diálogo avisa de que el agente las recibirá cuando vuelva a recibir instrucciones en los 5 casos en que no las recibiría ahora salvo la baja, dice en el dado de baja que su agente ya no recibe instrucciones y no avisa en el primero (7 de 7)». Si el responsable elige F-1 (b), la enmienda cambia además REQ-009, REQ-047, CA-006 y CA-010 según esa opción | D-040 (A-10): la baja es definitiva; «cuando vuelva a recibir instrucciones» sería falso (arts. 10 y 13) |
| — | Ya aplicada como enmienda mecánica (especificación, «Registro de cambios»): CA-010 sin «reactivar el cliente», 2 de 2 casos | P-50 de la 022; no cambia requisitos |

## A la 010 y a la fase 2

| N.º | Petición | Motivo |
| --- | --- | --- |
| P25-02 | Aceptar que M25-1 altere objetos de M02 y M07 en `reglas_cliente` (quita `actualizado_en`, los `default`, `reglas_cliente_valores`, `cascade`, las concesiones y políticas de `insert` y `update`) y que la tarea de M25-1 actualice en el mismo commit `01_estructura` (columnas y concesiones), `02_matriz_acceso` (la escritura de reglas pasa a rechazada para todos), `supabase/datos/volumen.sql` (valores de `privado.reglas_por_defecto()` en lugar de los `default`) y cualquier prueba suya que confirme un cliente sin su fila de reglas en la misma transacción | D-1 a D-4, D-10; la suite debe seguir en verde |
| P25-03 | Conector (M08 hoy, la 011 después): (a) extraer la decisión del estado servido a `privado.estado_servido(cliente)` (`stable`, `search_path = pg_catalog, pg_temp`, con `coalesce(pausa_efectiva(cliente), true)` como dice la 023), que usen M08 y LR-1; para un cliente de baja, nunca `activa`; **`security invoker`**, como `pausa_efectiva`, con `execute` solo para el dueño y `authenticated`; si ha de ser `security definer`, su primera instrucción es `es_admin()` o el contexto del conector (m-3; pgTAP de acceso cruzado en 025·T-008); (b) D-9: quitar las líneas 223 a 230 de M08: sin fila o con error al leerla, nunca `activa` ni valores por defecto; reglas solo con `activa`. Hasta entonces la 025 no pasa a VERIFICADA ni a producción, y si la fase 2 rechaza D-9 decide el responsable (m-4; DD-33); (c) cerrar la cuestión 15 de la 011 en el sentido de REQ-045 (DD-29) | D-8, D-9; REQ-045 aprobado; art. 3. Ruta crítica «entrega del prompt» |
| P25-04 | Exponer `leer_reglas_cliente`, `leer_historial_reglas`, `guardar_reglas` y `restablecer_reglas` como fije REQ-010 de la 010 (la misma vía que la 022 y la 024) | D-5, D-6 |
| P25-05 | Añadir al paso de varias conexiones de `bd.yml` (`scripts/bd/concurrencia-clientes.mjs` de la 022) los casos de PRUEBA-010 de la 025, con su número en `declaradas.json` | D-040 (A-4); cambio de CI por D-036 con dictamen |

## A la 021

| N.º | Petición | Motivo |
| --- | --- | --- |
| P25-06 | (a) Añadir las cuatro funciones de P25-04 y `privado.reglas_por_defecto()` a la lista cerrada de funciones que ejecuta `authenticated` (su PRUEBA-048). (b) Confirmar que `administradores.correo` y `estado` siguen legibles con la política `administradores_select_admin` para una lectura `security invoker` (LR-2) | D-5; REQ-051 |

## A la 022

| N.º | Petición | Motivo |
| --- | --- | --- |
| P25-07 | (a) O-1 inserta la fila con `privado.reglas_por_defecto()` en su transacción y anota I-41 vinculada a su I-01 (confirma su P-25); 022·T-013 depende de M25-1. (b) M25-1 crea un disparador de restricción diferido en `clientes` (`cliente_sin_reglas`): toda prueba suya que confirme un alta lo hará con su fila de reglas. (c) Sección de reglas en el marco 5 de `secciones.ts`. (d) `acciones-reglas.ts` es el archivo de acciones de la 025 junto a su `acciones.ts`; su estática (022·T-007) no lo trata como ajeno. (e) Las columnas de baja de su D-1 quedan legibles para el administrador en la lista de columnas de su DD-29 (m-12), para `de_baja` de LR-1 | D-2, D-3, D-5; DD-23 |

## A la 023

| N.º | Petición | Motivo |
| --- | --- | --- |
| P25-08 | Ninguna operación nueva: la 025 usa `pausa_efectiva` solo a través de `estado_servido` (P25-03), con nulo como pausada | Una sola regla (DD-17) |

## A la 024

| N.º | Petición | Motivo |
| --- | --- | --- |
| P25-09 | Recibido P24-13. Confirmar: (a) `contextos` de I-39 e I-40 = `{api_autenticada}`; I-41, el que use O-1 de la 022 (`api_autenticada`). (b) T-014 (d) cubre OR-1 y OR-2 con las pruebas de la 025 (PRUEBA-009, 010). (c) `privado.sin_escritura_directa()` se puede llamar desde M25-1 como aserción, sin retirar ninguna barrera | D-4, D-6; DD-24 |

## A la fase 6 (052) y a la 053

| N.º | Petición | Motivo |
| --- | --- | --- |
| P25-10 | 052: el borrado de un cliente o de sus reglas choca con D-3 (también para el dueño) y con `on delete restrict`; la purga tendrá que diseñar su vía con su especificación | DD-31 |
| P25-11 | 053: al migrar clientes desde la carpeta `panel`, crear su fila de reglas en la misma transacción que el cliente | REQ-049; D-3 |

## A coordinación

| N.º | Petición | Motivo |
| --- | --- | --- |
| P25-12 | Anotar en `docs/TECNOLOGIAS.md` las decisiones de `aclaraciones.md` de la 025 y DD-01 a DD-33 tras la P1; en `docs/SEGURIDAD.md`, las rutas críticas de la 025; en `docs/ESQUELETO.md`, `src/lib/reglas/`, `src/components/reglas/` y `src/app/admin/clientes/acciones-reglas.ts` | Art. 14 |
| P25-13 | Quien aplique en `Nido`: M25-1 a M25-3 solo tras M24-1 aplicada (P24-16 de la 024) y con el procedimiento de la 010 | Arts. 11 y 14 |

## Fichas para el responsable (22/11/2026)

### F-1 · ¿Se siguen pudiendo cambiar las reglas de un cliente dado de baja?

**Qué pasa.** El 13/11 respondiste «Siempre» a la cuestión 1: las reglas se pueden cambiar en cualquier estado, también con el cliente dado de baja. Una de las razones era dejarlo listo antes de reactivarlo. El 21/11, D-040 hizo la baja **definitiva**: un cliente dado de baja ya no se reactiva y su agente no volverá a recibir instrucciones. Cambiarle las reglas ya no tiene ningún efecto. Solo deja una fila en la auditoría.

**Opciones.**

- **(a) Mantener «Siempre».** Se pueden cambiar, con un aviso que dice que su agente ya no recibe instrucciones (enmienda E-1). No cambia nada de lo aprobado salvo ese texto.
- **(b) Solo lectura para los clientes dados de baja (Recomendado).** La ficha sigue mostrando sus reglas y su historial, pero sin «Cambiar reglas» ni «Restablecer valores por defecto». La base de datos rechaza el cambio con un resultado propio y no deja ninguna fila. Es más claro para quien usa el panel: no ofrece una acción que no sirve para nada. Cambia REQ-009, REQ-047, CA-006 y CA-010 (enmienda del `especificador`) y añade un paso a OR-1 y OR-2.

**Recomendación:** (b). El motivo de «Siempre» para un cliente dado de baja ya no existe, y la otra razón (preparar a un cliente sin licencia antes de instalarlo) sigue cubierta.

**Si no respondes**, se aplica la especificación aprobada: la opción (a), con el texto de E-1. Esto no bloquea la P1. Sin E-1 aprobada, T-016 (diálogos) queda bloqueada: para la baja no se usa el aviso general. Si eliges (b) más tarde, cambian T-001, T-007, T-015 y T-016.
