# 052 · Propuestas para el chat de coordinación

Cambios que esta función necesitaría fuera del rango 050 a 059. El chat de la fase 6 no los aplica: los anota aquí para que los valore el chat de coordinación (documentos compartidos) o el chat de la fase dueña del archivo.

Estado de todas: **PROPUESTA**, sin aplicar. Varias dependen de las respuestas del responsable y de lo que confirme el profesional de protección de datos.

Fecha: 12/11/2026 · Origen: especificación de la función 052 e informe del `especificador`.

## Documentos compartidos

| N.º | Archivo | Qué se propone | Motivo |
| --- | --- | --- | --- |
| P-01 | `docs/SEGURIDAD.md`, lista de publicación, grupo «Privacidad» | Cambiar «Acuerdos de encargo de tratamiento con Supabase, Vercel y Stripe archivados» por «Acuerdos de tratamiento archivados con todos los proveedores de la lista de encargados» | Faltan el proveedor de supervisión de errores (V-112), el de avisos por correo (V-111) y el de correos de autenticación si es otro. Stripe puede no ser encargado en todo su tratamiento |
| P-02 | `.claude/skills/revision-privacidad` | La misma corrección de la lista de proveedores | Nombra solo a Supabase, Vercel y Stripe |
| P-03 | `docs/ARQUITECTURA.md`, tabla «Datos», y `docs/SEGURIDAD.md`, «Marcos de referencia» | Reconocer como datos personales, además de los correos de acceso: direcciones IP en registros y en el límite de intentos, lo que guarda el servicio de autenticación (sesiones, factores de doble factor), los identificadores de usuario guardados como autor de una acción, los datos de clientes autónomos y las copias de seguridad | El inventario real es más amplio que lo que dice hoy la documentación |
| P-04 | `docs/ARQUITECTURA.md` y textos que digan «en la UE» | Precisar «almacenados y ejecutados en regiones de la UE» en lugar de «en la UE» sin más, hasta que un profesional confirme cómo tratar el acceso de proveedores estadounidenses | Evitar una promesa que el sistema no pueda sostener |
| P-05 | `docs/SEGURIDAD.md`, «Respuesta a incidentes», punto 3 | Añadir que «no borrar registros» suspende los plazos de conservación mientras dure el incidente, con inicio y fin anotados | Hoy choca con la obligación de eliminar lo vencido |
| P-06 | `docs/CALIDAD.md` o `docs/EQUIPO.md` | Regla expresa sobre si los agentes de ingeniería pueden ver datos reales de producción | Ningún documento lo trata. Depende de la cuestión 18 |

## Modelo de datos de referencia (`docs/MODELO-DATOS.sql`, fase 2)

| N.º | Qué falta o choca | Cuestión |
| --- | --- | --- |
| P-07 | La auditoría no admite borrados. Si se le pone plazo de conservación, hace falta una vía controlada para aplicarlo sin perder su carácter de solo inserción. El identificador del actor sigue ahí tras suprimir al usuario | 12 |
| P-08 | La baja de un cliente no borra nada: la licencia impide borrar al cliente y este queda marcado como «baja». Aplicar plazos tras la baja exige definir qué se elimina y qué se anonimiza | 7 |
| P-09 | Varias tablas guardan el identificador del usuario que hizo algo (quién creó, publicó o resolvió). Son identificadores indirectos y entran en el inventario y en la supresión | 12 |

## Otras fases

| N.º | Fase | Qué se necesita saber o coordinar |
| --- | --- | --- |
| P-10 | 1 (001 a 009) | Dominio del conector y de los dashboards (cuestión 7 de la función 001): los textos se publicarán en el mismo. Proveedor de supervisión de errores (V-112) para la lista de encargados |
| P-11 | 2 (010 a 019) | Si el límite de intentos guarda direcciones IP (V-113) y durante cuánto tiempo |
| P-12 | 3 y 5 | Enlaces a los textos desde las pantallas de acceso y el interior de los dos dashboards, y desde el mensaje de invitación |
| P-13 | 4 (030 a 039) | Proveedor de avisos por correo (V-111) para la lista de encargados y su plazo de conservación |
