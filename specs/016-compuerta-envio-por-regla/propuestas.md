# 016 · Propuestas para coordinación y otras fases

Cambios que esta función necesitaría en documentos compartidos y en otras funciones. El chat de la fase 2 no los edita: los anota aquí. Ninguno está aplicado.

Fecha: 20/11/2026 · Autor: `especificador`, para el orquestador de la fase 2. Revisado el mismo día con el artículo 8 en la versión 1.3 y los dos dictámenes del `auditor-seguridad`.

## 1. Función nueva 017: reglas e interfaz del dueño (P-14)

La 016 se ha dividido para no pasar de unos 25 requisitos. La 016 se queda con la compuerta (decisión de envío, texto, estado y procedencia del código). Se propone una 017, sin escribir, con lo siguiente:

- **Crear y borrar reglas.** Solo el dueño, autenticado. La dirección se escribe o se confirma completa dentro de la interfaz de la compuerta. Se rechazan dominios, comodines, homógrafos, dominios internacionalizados y variantes con «+» (artículo 8; C1 y C2).
- **Sin ingeniería social** (punto 5 del segundo dictamen, MAYOR). No se acepta una regla con un enlace con parámetros ni con enlaces generados por el agente, por un correo o por HumanaIA. La interfaz se protege contra peticiones falsificadas.
- **Activar y desactivar.** El dueño activa y desactiva toda la compuerta con una sola acción y cada regla por separado. Ninguna otra vía activa nada.
- **Historial.** Vista del historial de la 016 para el dueño, con sus motivos en español.
- **Accesibilidad y estados de error** de esa interfaz (artículo 10).
- **Instalación y reinstalación.** Reinstalar cambia la versión del código y no activa nada sin el dueño.
- **Reglas propuestas.** Si algún día las hay, las calcula el código y el dueño las escribe o confirma completas (C1). Hoy quedan fuera.

La 016 no se puede activar para ningún cliente hasta que la 017 esté cerrada: su REQ-019 ignora cualquier regla que no venga de la vía de la 017. Si la coordinación prefiere no dividir, la 016 tendría unos 27 requisitos y pasaría de 25 KB.

## 2. Cifra de envíos: dos vías (punto 10 del segundo dictamen)

| Vía | Cómo llega la cifra | Coste y riesgo |
| --- | --- | --- |
| A. El agente la lee | El agente lee el número de envíos que deja la compuerta y lo pone en su informe, con un entero nuevo en `contratos/informe.schema.json` | Sin credencial ni canal nuevos. El agente tiene que poder leer esa parte del estado sin poder cambiarla (REQ-009). La cifra la declara el agente: un correo que lo engañe puede falsearla, pero solo es un número |
| B. La compuerta la manda | La compuerta llama a HumanaIA con una credencial propia | Credencial nueva en la cuenta del cliente (artículo 4), entrada nueva en el servidor y frontera de confianza nueva: ruta crítica con revisor y auditor (hallazgo 8 del primer dictamen). La cifra no depende del agente |

En las dos vías, los **registros de ejecución** de la compuerta se quedan en la cuenta del cliente. Ningún registro, error ni traza con direcciones o texto puede acabar en infraestructura de HumanaIA (REQ-011). El diseño debe comprobarlo con la plataforma elegida.

## 3. Documentos compartidos (chat de coordinación)

| N.º | Documento | Cambio propuesto | Motivo |
| --- | --- | --- | --- |
| P-01 | `docs/PLAN.md`, fase 2 | Añadir a «Entrega» las funciones 016 y 017, y como criterio de aceptación que la batería de instrucciones ocultas termina con cero envíos no autorizados. Si se prefiere otra fase, mover las carpetas a su rango | La fase 2 no las menciona |
| P-02 | `docs/TECNOLOGIAS.md` | Dar identificador y estado VERIFICAR a las comprobaciones de D-037 (vía para Gmail y vía para Outlook). Añadir lo que el auditor no pudo comprobar: reglas fuera del alcance de los conectores, lectura del resultado DMARC que añade el proveedor, envío sin permisos amplios y si los conectores del agente pueden editar borradores o proyectos instalados. Anotar las respuestas de `aclaraciones.md` | Sin esas comprobaciones no se puede diseñar |
| P-03 | `docs/SEGURIDAD.md`, amenazas | Añadir: regla creada o alterada por el agente o por HumanaIA; compuerta saltada, activada sin el dueño o actualizada desde fuera; respuesta con contenido inyectado o con datos del atacante; remitente con regla suplantado o comprometido; servidor comprometido que manda marcar todo; bucle con otros sistemas automáticos | Requisitos 4, 5, 10, 14 y 16 a 20 de la 016 |
| P-04 | `docs/SEGURIDAD.md`, «Rutas críticas» | Añadir «Compuerta de envío por regla, sus reglas y su instalación» | Único camino de envío sin revisión (artículo 8) |
| P-05 | `docs/ARQUITECTURA.md` | Añadir la compuerta como pieza en la cuenta del cliente, fuera de la sesión del asistente, con su «No hace»: no usa modelos, no envía a terceros y no manda nada a HumanaIA salvo la cifra. Si se elige la vía B, añadir la frontera nueva | Requisitos 1, 10 y 11 de la 016 |
| P-06 | `contratos/informe.schema.json` | Con la vía A, un entero nuevo y acotado de envíos de la compuerta. Lo fija el diseño de la 016 | Requisito 11 de la 016 |
| P-07 | `docs/INSTALACION-CLIENTE.md` | Paso opcional para instalar la compuerta fijada a una versión, activarla, desactivarla y desinstalarla. El paso 4 no cambia y se comprueba después de instalar la compuerta | Requisitos 10, 13 y 15 de la 016 |
| P-08 | `docs/propuesta-enmienda-articulo-8.md` | Aclarar el encabezado: dice «RATIFICADA» y la constitución está en la 1.3, pero los párrafos siguientes dicen que la propuesta «no cambia nada por sí sola» y que falta el dictamen | Contradicción interna |
| P-09 | `marketing/` | Mientras la 016 y la 017 no estén cerradas, no prometer el envío como disponible. No decir «sin instalación» a los clientes con compuerta | Propuesta de enmienda, «Efecto en la campaña» |

## 4. Otras funciones

| N.º | Función | Asunto | Motivo |
| --- | --- | --- | --- |
| P-10 | 012 (fase 2) | El agente deja el borrador y lo marca como candidato con una sola categoría. Para los candidatos escribe solo texto plano, sin enlaces, direcciones, teléfonos, IBAN, DNI o NIF, dentro de la longitud máxima; si no puede, no marca. No marca en categorías excluidas ni en correos con instrucciones ocultas. No toca el estado de la compuerta. Sus requisitos 17, 52 y 55 se mantienen. El arranque local dice que la compuerta no amplía sus límites | Si no, la 016 rechazaría casi todos los candidatos (REQ-004) |
| P-11 | 012 (fase 2) | Ampliar su batería de instrucciones ocultas (criterio 9) con las variantes del criterio 18 de la 016 y con un prompt hostil servido desde el servidor (C9) | Criterios 14 y 18 de la 016 |
| P-12 | 052 (fase 6) | Condiciones del servicio: quién responde de un envío hecho por regla | Propuesta de enmienda |
| P-13 | Fases 4 y 5 | Mostrar la cifra de envíos en los paneles o alertar sobre ella, si se quiere | Fuera de alcance de la 016 |

## 5. Contradicciones y riesgos detectados

1. **Interruptor de HumanaIA frente a «sin llamadas de red».** El artículo 8 deja que el servidor desactive la compuerta. El segundo dictamen pide que la compuerta no haga más llamadas de red que la de la cifra. Las dos cosas no caben a la vez sin una llamada más. Cuestión 3.
2. **Estado fuera del alcance del agente.** Si se elige la vía A, el agente tiene que leer la cifra sin poder cambiar nada. Que el agente no pueda tocar el estado depende de la plataforma, aún en VERIFICAR. Si el diseño no encuentra una vía, la 016 no se puede cumplir tal como está escrita.
3. **Filtro frente a respuestas útiles.** Prohibir teléfonos y números de cuenta en el texto deja fuera muchas respuestas de negocio legítimas. Es un efecto buscado por seguridad, pero reducirá los envíos. Los valores son supuestos y el responsable puede cambiarlos.
4. **Riesgo residual.** Lo que el filtro no detecta (compromisos o datos falsos escritos en texto plano) puede salir hasta el tope diario. Cuestión 4.
5. **Plan.** `docs/PLAN.md` no incluye la 016 ni la 017 (P-01).
6. **Región.** `docs/ARQUITECTURA.md` y la fase 2 de `docs/PLAN.md` siguen con `eu-central-1` y `fra1`, mientras D-020 fija `eu-north-1` y `arn1`. No afecta a la 016.
