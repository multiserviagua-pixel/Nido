# 023 · Dictamen de seguridad del diseño y del plan (vuelta 1)

Auditor: `auditor-seguridad` · 22/11/2026. Guardado por el orquestador a partir del informe del auditor (resumido en la forma, íntegro en los hallazgos). Revisado: `diseno.md`, `plan.md`, `tareas.md`, `propuestas.md` y partes de `especificacion.md`; contrastado con M02, M06, M07, M08 y M09 de la 010 en `main`, con la 022 (DD-30, DD-34, DD-35, D-4b, P-53) y con la 024 (D-3, D-4, D-6). Ejecutado: `node scripts/comprobar-specs.mjs`, SUPERADO. Nada más ejecutado.

**Veredicto: APTO CON CONDICIONES. 0 bloqueantes, 3 mayores y 6 menores.** Por D-036, la P1 no se abre mientras los tres mayores no estén corregidos.

DD-30 confirmada (con m-1 y m-2). DD-31 confirmada. DD-32 confirmada solo con la corrección de M-2. Artículo 1: cumple (veinte datos enteros acotados, booleanos y listas cerradas). Artículo 2 con la nota de D-040: cumple con DD-27. Carreras con la baja: DD-29 coherente con DD-34 de la 022.

## M-1 · MAYOR · La regla de pausa da «sin pausa» cuando quien llama no ve al cliente (art. 3; A-13, AM-11)

- **Dónde:** D-6, D-11 punto 2, T-010, PRUEBA-016 (que fija ese comportamiento).
- **Explotación:** `pausa_efectiva()` y `situacion_pausa()` son `security invoker`. Sin visibilidad de `ordenes` devuelven «sin pausa». Hoy M08 es `security definer` del dueño y ninguna tabla tiene `force row level security`; pero la 011 reescribirá el conector y bastaría pasar esas funciones a un rol sin `bypassrls` (p. ej. `conector`, `nobypassrls`) para servir `activa` con el prompt a un cliente en pausa: el interruptor falla abierto.
- **Corrección:** si el cliente no es visible, devuelven nulo o código fijo (`pausa_sin_visibilidad`), nunca «sin pausa»; D-11 punto 2: el conector trata nulo o error como pausada (`coalesce(…, true)`).
- **Prueba:** PRUEBA-016 y 023 cambiadas (usuario de otro cliente y rol `nobypassrls` de prueba: nunca «sin pausa»); PRUEBA-034: con la orden de pausa no visible, `pausada`, nunca el prompt.

## M-2 · MAYOR · El disparador diferido de D-4b puede ejecutarse como `authenticated` al confirmar (arts. 3 y 14; A-11, AM-32)

- **Dónde:** D-4b, DD-32, T-013, PRUEBA-037.
- **Hecho:** desde PostgreSQL 18 los disparadores `after` corren con el rol activo al encolar el evento; antes, con el activo al ejecutarse (en el `COMMIT`). Se desconoce la versión de `Nido` y de CI.
- **Riesgo:** en ≤17 el disparador corre como `authenticated`, no puede llamar a `principal_de_esta_transaccion()` ni leer la lista local; toda orden falla, y el «arreglo» probable (dar `execute` a `authenticated`) deshace N-4 de la 022.
- **Corrección:** función del disparador `security definer`, del dueño, `search_path = pg_catalog, pg_temp`, todo calificado, sin `execute` para nadie; D-4b no depende de `current_user`; T-P5 o T-001 anota la versión mayor de `Nido` y CI usa la misma.
- **Prueba:** PRUEBA-037 ampliada: el caso positivo (O-1, O-2, sustitución) con `set role authenticated` y `request.jwt.claims` de administrador de prueba; `authenticated` sin `execute` sobre `principal_de_esta_transaccion` ni privilegios sobre la lista local.

## M-3 · MAYOR · La escritura directa sobre `ordenes` se cierra la última (M23-5), con ventana sin auditoría (arts. 3 y 11; A-11, AM-05, AM-32)

- **Dónde:** «Migración y vuelta atrás»; orden T-009 → T-015 en `plan.md`, bloque 3; T-015 depende de P23-15 y P23-02.
- **Explotación:** la migración de la 024 retira `ordenes_auditar` y M23-1 quita `ordenes_valores`, mientras M07 sigue concediendo `insert (cliente_id, tipo)` y `update (estado)` a `authenticated` y sus políticas. Hasta M23-4/M23-5, un superadmin con `POST /rest/v1/ordenes` pausa o reanuda sin auditoría, sin estado esperado y sin coherencia del paso 5 de O-1. Revertir M23-4 sin M23-5 la reabre.
- **Corrección:** P23-01 (c) sale de M23-5 y va en M23-1 (o una M23-0 aplicada a la vez o antes que la migración de auditoría de la 024): retirar `insert` y `update` de `ordenes` a `authenticated` y sus dos políticas de escritura. M23-5 queda solo con columnas del usuario de cliente (DD-31) y `catalogo_problemas`. Regla en el plan: ninguna migración retira `ordenes_auditar` mientras `authenticated` pueda escribir en `ordenes`.
- **Prueba:** PRUEBA-017 al aplicar M23-1; PRUEBA-026 con cualquier subconjunto de vueltas atrás: en ningún estado intermedio `authenticated` inserta ni actualiza `ordenes`.

## Menores

- **m-1** (art. 3, AM-11). Desempate: M08 y M09 ordenan por `creada_en desc, o.id` (id ascendente); el diseño dice «mayor id». Corrección: índice único `(cliente_id, creada_en)` en M23-1, corregir el texto y fijar un único desempate en P23-04 y P23-05. PRUEBA-019: segunda orden con la misma `creada_en` rechazada.
- **m-2** (arts. 3 y 13, AM-32). D-4 no exige que una orden nazca pendiente (sin hechos, `anulacion` ni `sustituida_por`; `sustituida_por` ≠ su `id` y del mismo cliente: clave ajena compuesta `(sustituida_por, cliente_id)` → `(id, cliente_id)` con su único); D-4b debe exigir I-13 para `pausar`, I-14 para `reanudar`, y lo mismo con I-15 e I-16. PRUEBA-037: acción cambiada de tipo e insert con hechos puestos.
- **m-3** (art. 1, AM-36). El manejador de exportación no valida el `[cliente]` de la ruta antes de E-1 (un no-UUID da `22P02` con el valor en el error). Validar con `entradas.ts` y responder 404 sin llamar. PRUEBA-030 con `TEXTO-CANARIO-123` como segmento: 0 llamadas y 0 apariciones en registros.
- **m-4** (A-22, AM-19). E-1 mantiene el cerrojo consultivo global de la 024 mientras se serializan hasta 50.000 filas: latencia, no interbloqueo. Declararlo en AM-19 y F-1 y medirlo (PRUEBA-033 o 038: latencia de `mcp_obtener_instrucciones` durante 10 exportaciones de 20.000 filas); si supera el objetivo, vuelve al arquitecto.
- **m-5** (arts. 10 y 11). D-4 prohíbe borrar órdenes y D-11 punto 8 prevé una purga; M02 tiene `on delete cascade`. D-4 rechaza todo borrado; D-11 punto 8: las órdenes no se purgan (asunto de la 014 y la 052).
- **m-6** (art. 13). PRUEBA-017 y 037 se ejecutan sobre todo como `postgres`: PRUEBA-017 debe intentar la escritura directa con `set role authenticated` y claims de un superadmin con sesión completa.

## Amenazas: añadidos y correcciones

AM-11 (corregida: M-1), AM-32 (corregida: M-2), AM-39 (nueva: orden creada o anulada por la API sin auditoría entre migraciones; M-3; PRUEBA-017 en cada estado intermedio), AM-40 (nueva: empate de `creada_en`; m-1; PRUEBA-019), AM-19 (ampliada: m-4). El resto de AM-01 a AM-38, correcto.

## No comprobado

Lista local de la 024 desde un disparador diferido (su T-P3, P23-09 c); exposición de funciones de `privado` por la 010 (T-P1); si `describir_auditoria` lee columnas de `ordenes` que DD-31 retira (T-P5); comportamiento de PostgREST cuando la confirmación falla por el disparador diferido; la 011 y la 013 sin diseño; versión mayor de PostgreSQL de `Nido` (dato externo: notas de versión de PostgreSQL 18).
