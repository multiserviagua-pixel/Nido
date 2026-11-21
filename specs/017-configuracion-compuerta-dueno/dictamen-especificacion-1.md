# 017 · Dictamen del auditor-seguridad sobre la especificación (vuelta 1)

Fecha: 21/11/2026 · Dictamen del `auditor-seguridad`, resumido por el orquestador.

**Veredicto: APTO CON CONDICIONES. Sin bloqueantes; 2 MAYOR a corregir antes de P0 y 4 MENOR.** Sus condiciones de `docs/propuesta-enmienda-articulo-8-v14.md` están cubiertas (activar, desactivar y excluir; filtro solo en la vía protegida; aviso accesible con confirmación; encender inmediato; historial; exclusiones fuera del alcance del agente).

| N.º | Gravedad | Hallazgo | Corrección mínima |
| --- | --- | --- | --- |
| H1 | MAYOR | La reautenticación no está ligada al cambio (definida «en los 5 minutos anteriores», contradice el orden de REQ-004): un agente con navegador, tras un inicio de sesión del dueño o con contraseña autocompletada, puede apagar el filtro | La pide la vía protegida después de mostrar el cambio; vale para ese cambio y valor, una vez; no cuentan sesión previa ni reautenticación de otra acción; presencia del dueño que el navegador del asistente no aporte; si la plataforma no lo garantiza, no se ofrecen relajantes; variantes en CA-004 y CA-017 |
| H2 | MAYOR | Instalar, actualizar o volver atrás no está clasificado ni tiene garantía de origen: un servidor comprometido o un falso soporte relaja más que apagar el filtro | Es acción relajante, con versión y huella a la vista; integridad contra el repositorio, sin fiarse de nada que entregue HumanaIA; versiones retiradas no se instalan; pruebas en CA-011 o CA-012 |
| H3 | MENOR | Las acciones se clasifican por su nombre | Todo cambio con algún resultado menos restrictivo es relajante; una acción mixta es relajante |
| H4 | MENOR | El historial puede inundarse con intentos falsificados y desplazar un cambio relajante real | Agrupar o limitar los rechazos; los cambios relajantes no se pierden por volumen antes del resumen |
| H5 | MENOR | CA-006 rechaza como exclusión una dirección no ASCII a la que la 016 sí podría responder | Todo lo respondible se puede excluir, con representación fija |
| H6 | MENOR | Aplicar la opción A de la cuestión 1 compromete a HumanaIA | El aviso dice que toda petición de relajar, aunque parezca de HumanaIA, es posible engaño; sin compromisos en la 052 ni en `marketing/` |

**Cuestiones.** La 1 es del responsable (compromiso comercial; valor por defecto seguro: H6). La 2 y la 3 las fija la coordinación por D-036 con la opción restrictiva (la instala siempre el dueño; solo cuenta el titular y los delegados, como mucho, hacen acciones restrictivas). «Bajar y no subir»: lectura de REQ-008 correcta (nunca por encima del máximo del código); la lectura de trinquete no ganaría seguridad y empujaría a reinstalar.

**T-1** bien planteada; el diseño necesita además tres criterios: origen del código en la opción A, que el conector de nube del agente no pueda leer ni editar el proyecto instalado, y suplantación de la página.

No comprobado: reautenticación ligada a una acción, protección contra peticiones falsificadas y estado fuera del conector de nube en Gmail y Outlook (VERIFICAR).
