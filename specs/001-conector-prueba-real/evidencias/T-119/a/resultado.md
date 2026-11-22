# T-119 (a) · Antes del paso 3 · Resultado

Plantilla en blanco: nada de esto se ha ejecutado. Pasos y criterios en `../guion-operativo.md`, parte (a). Sin valores: ni la dirección de `pre-nido`, ni URL con parámetros, códigos, `state`, cookies, tokens, contraseñas ni identificadores (artículos 1 y 4). Cada casilla: superada, fallida o no ejecutada (con motivo y cuándo); ninguna vacía al cerrar (CA-025).

Cabecera de cada evidencia guardada aquí (`docs/CALIDAD.md`):

```
commit:    (SHA del commit desplegado, a fijar por la persona)
prueba:
fecha:
entorno:   previo
comando:
resultado: no ejecutada
revisor:
```

## a1 · Ráfaga del WAF

| Ruta | Operador en el panel | Acción en el panel | Límite en el panel (peticiones) | Ventana en el panel (s) | Veredicto del script | Enviadas | Códigos (recuento) | Primera limitada (n.º; SUPERADA solo de 2 a 104) | Aciertos en Firewall, Overview | Resultado |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| GET /api/salud | | | | | | | | | | no ejecutada |
| POST /oauth/token | | | | | | | | | | no ejecutada |

Código de salida del script: · Salida completa en `rafaga.txt` (no lleva la dirección):

## a2 · PRUEBA-009 (R): GET y POST con navegador real

Navegador y versión mayor:

| Comprobación | Observado | Resultado |
| --- | --- | --- |
| GET: estado HTTP | | no ejecutada |
| GET: `Referrer-Policy: same-origin` (sí/no) | | no ejecutada |
| GET: cookie `__Host-activacion` con HttpOnly, Secure, SameSite=Strict y Path=/ (sí/no) | | no ejecutada |
| GET: CSP presente y 0 errores de CSP en consola | | no ejecutada |
| POST con código inventado: estado HTTP y texto («El código no es válido o ha caducado. Pide uno nuevo a HumanaIA.» / «Esta solicitud ha caducado. Vuelve a empezar desde tu asistente.») | | no ejecutada |
| POST: `Origin` (igual / null / ausente / otro) | | no ejecutada |
| POST desde un HTML en disco: estado HTTP y texto | | no ejecutada |
| **PRUEBA-009 (R)** | | no ejecutada |

## a3 · PRUEBA-006 en real (V-6: `x-vercel-forwarded-for`)

| POST | Cabecera falsa (rango de documentación) | Código HTTP |
| --- | --- | --- |
| 1 | 198.51.100.1 | |
| 2 | 198.51.100.2 | |
| 3 | 198.51.100.3 | |
| 4 | 198.51.100.4 | |
| 5 | 198.51.100.5 | |
| 6 | 198.51.100.6 | |

Veredicto (no falsificable / falsificable / no concluyente): · **PRUEBA-006 (V-6)**: no ejecutada

## a4 · PRUEBA-010 (V) en navegador real

Navegador: · Lector de pantalla y versión:

| N.º | Comprobación | Formulario | Con error | Solicitud no válida | Bloqueado | Resultado |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | 360 y 320 px sin desplazamiento horizontal | | | | | no ejecutada |
| 2 | Zoom 400 % a 1280 px | | | | | no ejecutada |
| 3 | Texto al 200 % | | | | | no ejecutada |
| 4 | Espaciado del texto | | | | | no ejecutada |
| 5 | Teclado y foco visible | | | | | no ejecutada |
| 6 | Mensaje de `required` (idioma) | | | | | no ejecutada |
| 7 | Lector: lectura del formulario | | | | | no ejecutada |
| 8 | Lector: «Error:» anunciado; ¿repite el error? (M2, M5) | | | | | no ejecutada |
| 9 | Lector: mensaje entero | | | | | no ejecutada |
| 10 | Colores forzados | | | | | no ejecutada |
| 11 | Tema oscuro; ¿controles nativos en claro? (M3) | | | | | no ejecutada |
| 12 | Título de la pestaña (M1) | | | | | no ejecutada |

«Aceptado» y «no disponible», revisados sobre el HTML regenerado de T-113 (sí/no, fecha):

Hallazgos (gravedad, criterio, fila):

**PRUEBA-010 (V)**: no ejecutada

Propuesta a la coordinación sobre M1 a M5 (M1 a M3 llevan revisor y auditor-seguridad, en otra tarea):
