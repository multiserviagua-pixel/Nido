# 041 · Aclaraciones

Cada cuestión abierta de la especificación, con la respuesta del responsable. Una respuesta supuesta no vale: si no hay respuesta, la cuestión sigue abierta.

Estado a 12/11/2026: **todas PENDIENTES**. La columna «Recomendación» es del orquestador y no es una decisión.

| N.º | Cuestión | Respuesta | Quién y cuándo | Efecto en la especificación |
| --- | --- | --- | --- | --- |
| 1 | ¿Qué datos de cada revisión ve el cliente? | PENDIENTE | — | — |
| 2 | ¿Ve su canal, su frecuencia esperada y si hay una revisión en curso? | PENDIENTE | — | — |
| 3 | ¿Periodo fijo o selector con lista cerrada? | PENDIENTE | — | — |
| 4 | ¿Qué estados del agente ve el cliente? | PENDIENTE | — | — |
| 5 | ¿Se le dice el motivo de una pausa o de una suspensión? | PENDIENTE | — | — |
| 6 | Umbral de «Sin señal» y qué frecuencia cuenta | PENDIENTE | — | — |
| 7 | ¿Cómo se agregan sin tratar, facturas pendientes y urgentes? | PENDIENTE | — | — |
| 8 | ¿Gráfico de evolución y variación respecto al periodo anterior? | PENDIENTE | — | — |
| 9 | Profundidad del histórico | PENDIENTE | — | — |
| 10 | ¿Qué hace el cliente cuando algo va mal y por qué vía contacta? | PENDIENTE | — | — |
| 11 | ¿Las vistas se actualizan solas o solo al recargar? | PENDIENTE | — | — |
| 12 | Umbrales propuestos | PENDIENTE | — | — |

## Opciones, consecuencia y recomendación

Las opciones completas están en `especificacion.md`, apartado «Cuestiones abiertas». Aquí va el resumen y la recomendación.

### 1. Datos de cada revisión

El informe trae estado, seis cifras, modo, asistente, almacenamiento, versión del prompt, frecuencia declarada, cuatro comprobaciones y hasta cinco códigos de problema.

**Recomendación:** el cliente ve el estado, las seis cifras y los **problemas dichos en lenguaje llano**, con un texto aprobado por cada uno de los doce códigos del catálogo, incluidos `conector_humanaia_inestable` y `otro`. No ve modo, asistente, almacenamiento, número de versión, frecuencia declarada, comprobaciones ni campos descartados.

Sin los problemas, el cliente ve «con avisos» y no sabe por qué: tendría que preguntaros cada vez. Varios problemas le piden algo a él (una factura que exige identificarse, el acceso al correo perdido). Ocultar los dos que hablan de HumanaIA iría contra «nada que no sea verdad». Las comprobaciones repiten lo que ya dicen los problemas. El número de versión es jerga para él.

### 2. Canal, frecuencia esperada y revisión en curso

**Recomendación:** ve la **frecuencia esperada** («tu agente revisa cada 24 horas»), porque sin ella «Sin señal» no se entiende. No ve el **canal**: es una decisión interna de despliegue. No ve la **revisión en curso**: obligaría a entregarle datos de ejecuciones.

### 3. Periodo

- a) Fijo, últimos 30 días.
- b) Selector con lista cerrada.

**Recomendación: b), con 7, 30 y 90 días, 30 por defecto, siempre «últimos N días hasta ahora».** Son tres valores cerrados, fáciles de validar. `docs/DISENO.md` ya prevé un selector de periodo en la cabecera.

### 4. Estados del agente

**Recomendación: confirmar la tabla propuesta**, con «Sin señal» incluido y distinguiendo «Pausa pendiente» y «Reanudado». Sin «Sin señal», un agente parado desde hace días aparecería como «Funcionando» con una fecha antigua. Decir «En pausa» antes de que el agente la haya aplicado sería decir algo que aún no ha ocurrido. Un cliente que lleva tiempo «Sin revisiones todavía» se queda así: detectarlo es cosa de vuestra alerta, no de su panel.

### 5. Motivo de una pausa o suspensión

- a) Solo el estado.
- b) Motivo genérico de una lista cerrada.
- c) Motivo solo en algunos casos.

**Recomendación: a).** El Resumen dice «En pausa» o «Suspendido» y remite a HumanaIA y a la página Suscripción. El impago ya lo cuenta el aviso de la función 042, que aparece en el propio Resumen. Decir «pausa general» revela una incidencia interna, y decir «suspendido por HumanaIA» dejaría ver un estado forzado, que la 042 prohíbe mostrar.

### 6. Umbral de «Sin señal»

**Recomendación: confirmar 2 veces la frecuencia esperada, la que anota HumanaIA al instalar.** Es la misma que usa vuestra alerta, así que los dos paneles no se contradicen. La que declara el agente puede cambiar sin que lo sepáis.

### 7. Agregación de las cifras de situación

El contrato no dice si `facturas_pendientes` y `urgentes` cuentan lo nuevo de cada revisión o lo que queda pendiente. Sin esa definición no hay una agregación verdadera.

**Recomendación:** `sin_tratar` y `facturas_pendientes` se muestran como el valor de la última revisión válida (lo que queda por hacer ahora). `urgentes` se suma en el periodo (correos urgentes detectados). Y se fija esa definición en el contrato del informe y en el prompt 1.3 (función 012), que es donde debe quedar escrita. Mientras la definición no esté fijada, esta respuesta es provisional.

### 8. Gráfico y variación

- a) Sin gráfico ni variación.
- b) Variación sin gráfico.
- c) Gráfico de evolución con tabla equivalente.

**Recomendación: c) sin variación.** Un solo gráfico en el Resumen: correos tratados por día en el periodo, con su tabla equivalente. El estilo aprobado (D-004) es un panel con gráficos, y el de cliente es un subconjunto del mismo sistema. La variación con flecha es lo que más fácil engaña con pocos datos; se deja fuera.

### 9. Profundidad del histórico

- a) Todo lo que se conserve.
- b) Un límite fijo.

**Recomendación: a).** El plazo de conservación lo fija la fase 6 y el panel no se publica antes. Un segundo límite solo para el panel sería una regla más que mantener.

### 10. Qué hace el cliente cuando algo va mal

- a) «Ponte en contacto con HumanaIA», sin vía.
- b) Una vía concreta.
- c) Indicaciones distintas por estado.

**Recomendación: b).** Necesito que me digas cuál es la vía (un correo de soporte, un teléfono o una página). No he puesto ninguna. Es la misma pregunta que la cuestión 7 de la función 042.

### 11. Actualización de las vistas

**Recomendación: solo al recargar**, mostrando siempre la hora de los datos. Los agentes informan cada varias horas; una actualización automática añade peticiones y casos de prueba sin que el cliente gane nada.

### 12. Umbrales

| Umbral | Valor propuesto |
| --- | --- |
| «Sin señal» | 2 veces la frecuencia esperada |
| Periodo por defecto | 30 días |
| Revisiones por página | 25 |
| Espera máxima antes del estado de error | 10 segundos |
| Contenido principal | Menos de 2,5 segundos, percentil 75, móvil con 4G simulada |
| Obtención de datos | Menos de 500 ms, percentil 95 |
| Volumen de prueba | Un cliente con 3 años de revisiones cada hora, junto a 50 clientes con un año de revisiones diarias |

**Recomendación: confirmarlos.** El umbral de 7 revisiones para mostrar variación deja de aplicar si se acepta la recomendación de la cuestión 8.

## Decisiones que salen de aquí

Ninguna todavía. Candidatas para `docs/TECNOLOGIAS.md` cuando el responsable conteste: lista cerrada de datos que ve el cliente (cuestiones 1 y 2) y definición de las cifras de situación del informe (cuestión 7).
