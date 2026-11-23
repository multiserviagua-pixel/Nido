# T-117 (b): primer despliegue en `pre-nido` (despliegue A)

Fecha: 23/11/2026. Lo ejecutó el responsable desde su equipo (CLI de Vercel 65.16.0 con `-Q` a una carpeta temporal, `--prod --skip-domain`), con el commit `297fd4ad5a1ae70431f0a42c2ded1f92c1d3b3a4` exportado sin `.git` y enlazado al proyecto `prj_QpVn3kgANvg1iqdzsepM2cdvYRur`. La coordinación comprobó desde fuera. Sin valores secretos en esta evidencia (art. 4).

Excepción aceptada por la coordinación (D-036, revocable): se hizo con la sesión de agente abierta en la misma cuenta de Windows; la coordinación no leyó la carpeta temporal de configuración de Vercel.

## Despliegue A
`dpl_3ZM8qfUCfKG1T5JW1F4v97dngtXu` (`pre-nido-lzy4ce1mp`), servido en `pre-nido.humannaia.com` con `vercel promote` («Success», 2 s).

## Comprobaciones desde fuera (sin sesión de Vercel, `curl`)
| Comprobación | Resultado |
| --- | --- |
| `GET /api/salud` | 200 `{"estado":"ok"}` |
| `POST /api/salud` | 405 |
| Región de las funciones (`x-vercel-id`) | `arn1` |
| TLS del dominio | verificado (`ssl_verify_result` 0), HSTS presente |
| `GET /.well-known/oauth-authorization-server` | 200; `issuer` y puntos de acceso con `https://pre-nido.humannaia.com`; solo código con PKCE `S256`; CIMD en `false` |
| `GET /.well-known/oauth-protected-resource` | 200; recurso `https://pre-nido.humannaia.com/api/mcp` |
| `POST /api/mcp` sin token | 401 `sin_token` |
| `POST /api/operacion` sin credencial | 401 `credencial_no_valida` |
| Raíz `/` | 200, `lang="es"` |
| Ruta inexistente | 404 |

## Incidencia durante el despliegue (cinco intentos)
Los cuatro primeros despliegues del mismo commit dieron 503 `configuracion_conector_invalida` en las rutas del conector (cierre en fallo correcto; `/api/salud` seguía en 200). Causa: valores mal pegados en las variables de Vercel, no el código.
- `CONECTOR_SECRETO` se rellenó con lo que había en el portapapeles porque `$sec` no existía en esa ventana.
- `OPERACION_HUELLA` pudo contener la credencial en lugar de su huella por el mismo motivo.
- Editar las variables sensibles en el sitio dejó valores que no se podían comprobar; se borraron y crearon de nuevo.
Lección: comprobar `Length` de cada valor antes de copiarlo y crear de nuevo en lugar de editar. El registro de ejecución no dice qué variable falla (por diseño); se localizó por eliminación.

## Notas
- La compilación corre en Washington (`iad1`); solo se compila código, sin datos (riesgo anotado en `despliegue-preproduccion.md`).
- `ENTORNO`, `SUPERVISION_DSN` y `URL_PUBLICA` figuran también en Preview; la guía pide solo Production (menor pendiente).
- Falta de T-117 (b): el despliegue B del mismo commit y la prueba de vuelta atrás (`rollback` a A y vuelta) en menos de 10 minutos.
