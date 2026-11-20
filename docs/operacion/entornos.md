# Variables de entorno por entorno

Estado: función 002 (plataforma base). Aquí solo hay **nombres**: ningún valor, ni de ejemplo.
La lista cerrada vive en `src/lib/plataforma/configuracion.ts` (`NOMBRES_CONFIGURACION`), que es el
único lector de `process.env`; `.env.example` recoge solo las que escribe una persona. La prueba
`tests/unit/plataforma/entornos.test.ts` comprueba que las tres listas coinciden.

Entornos: `desarrollo` (el equipo, en local), `preproduccion` (proyecto `pre-nido`) y `produccion`
(proyecto `nido`). Los dos proyectos de Vercel están solo en `arn1` (UE) y tienen secretos
distintos. Los distingue la variable `ENTORNO`.

## Tabla

Celdas de entorno: `obligatoria` (sin ella la aplicación se niega a arrancar o `/api/salud` da 503),
`opcional` (si está, debe tener buen formato), `prohibida (invalida desarrollo)` (con valor, la
aplicación rechaza `ENTORNO=desarrollo`), `no se usa` o `la fija la plataforma` (no se valida: la
aplicación no la exige).

| Variable | Quién la pone | Secreta | Dónde vive | desarrollo | preproduccion | produccion |
| --- | --- | --- | --- | --- | --- | --- |
| `ENTORNO` | persona | no | Variables del proyecto en Vercel; `.env.local` en local | obligatoria | obligatoria | obligatoria |
| `SUPERVISION_DSN` | persona | sí | Variables del proyecto en Vercel (una distinta por proyecto, con Sentry en la UE); `.env.local` en local | opcional | obligatoria | obligatoria |
| `COMMIT_DESPLEGADO` | orden de despliegue | no | La pasa la orden `desplegar` al compilar; no se escribe a mano | opcional | obligatoria | obligatoria |
| `VERCEL` | plataforma | no | La inyecta Vercel; en local no debe existir | prohibida (invalida desarrollo) | obligatoria | obligatoria |
| `VERCEL_ENV` | plataforma | no | La inyecta Vercel; en local no debe existir | prohibida (invalida desarrollo) | obligatoria | obligatoria |
| `VERCEL_REGION` | plataforma | no | La inyecta Vercel en tiempo de ejecución; en local no debe existir; fuera de desarrollo `/api/salud` exige `arn1` | prohibida (invalida desarrollo) | obligatoria | obligatoria |
| `VERCEL_URL` | plataforma | no | La inyecta Vercel; en local no debe existir | prohibida (invalida desarrollo) | opcional | opcional |
| `NODE_ENV` | plataforma | no | La fijan Next.js y los guiones de `npm`; en `desarrollo` no puede ser `production` | opcional | la fija la plataforma | la fija la plataforma |

## Reglas

- En `desarrollo` no puede haber ninguna variable `VERCEL*` con valor y `NODE_ENV` no puede ser
  `production`; si no, `ENTORNO=desarrollo` se rechaza y se cierra en fallo (art. 3).
- Una persona debe activar en el proyecto de Vercel (preproducción y producción) la opción que
  expone las variables de sistema (diseño de la 002, §Configuración). Si no, faltan `VERCEL`,
  `VERCEL_ENV` y `VERCEL_REGION` y `/api/salud` da 503.
- Nadie pone a mano las que dicen «plataforma» u «orden de despliegue»; si falta una de las
  obligatorias, es un fallo de despliegue, no de configuración local.
- Una persona escribe los valores sin eco y nunca en un archivo del repositorio, en un registro ni
  en una evidencia (art. 4). Los errores de configuración citan nombres, jamás valores.
- Las variables de otras funciones (por ejemplo las del conector, función 001) no están aquí:
  cada función las añade a `configuracion.ts`, a `.env.example` y a esta tabla a la vez.
- Credenciales de despliegue (token de Vercel, secreto de paso, clave de aprobaciones) no son
  variables de la aplicación: viven fuera, según el diseño §Entornos y credenciales.

## Vuelta atrás

Cambiar una variable en Vercel se deshace restaurando el valor anterior desde el gestor de
variables (lo hace una persona) y volviendo a desplegar; el cambio de este documento, con `git revert`.
