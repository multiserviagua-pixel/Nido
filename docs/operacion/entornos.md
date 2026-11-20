# Variables de entorno por entorno

Estado: función 002 (plataforma base). Aquí solo hay **nombres**: ningún valor, ni de ejemplo.
La lista cerrada vive en `src/lib/plataforma/configuracion.ts` (`NOMBRES_CONFIGURACION`,
`NOMBRES_CONECTOR` y `NOMBRES_SOLO_MAQUINA`), que es el
único lector de `process.env`; `.env.example` recoge solo las que escribe una persona. La prueba
`tests/unit/plataforma/entornos.test.ts` comprueba que las tres listas coinciden.

Entornos: `desarrollo` (el equipo, en local), `preproduccion` (proyecto `pre-nido`) y `produccion`
(proyecto `nido`). Los dos proyectos de Vercel están solo en `arn1` (UE) y tienen secretos
distintos. Los distingue la variable `ENTORNO`.

## Tabla

Celdas de entorno: `obligatoria` (sin ella la aplicación se niega a arrancar o `/api/salud` da 503),
`opcional` (si está, debe tener buen formato), `prohibida (invalida desarrollo)` (con valor, la
aplicación rechaza `ENTORNO=desarrollo`), `no se usa` o `la fija la plataforma` (no se valida: la
aplicación no la exige). Las cinco del grupo «conector» (`URL_PUBLICA` a `OPERACION_HUELLA`) no las
valida `/api/salud`, solo las rutas del conector; en `produccion` no se leen y el conector queda
cerrado (`prohibida (cierra el conector)`).

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
| `URL_PUBLICA` | persona | no | Variables del proyecto `pre-nido` en Vercel; `.env.local` en local (`http://localhost`, con puerto si hace falta). Origen `https` sin puerto, sin ruta ni barra final | obligatoria | obligatoria | prohibida (cierra el conector) |
| `CONECTOR_SECRETO` | persona | sí | Variables del proyecto `pre-nido` en Vercel; `.env.local` en local. 43 caracteres base64url generados con `node -e "console.log(require('node:crypto').randomBytes(32).toString('base64url'))"`; nunca una frase (se aceptan 43 a 128 caracteres base64url con al menos 16 distintos) | obligatoria | obligatoria | prohibida (cierra el conector) |
| `CONECTOR_BD_URL` | persona | sí | Variables del proyecto `pre-nido` en Vercel; `.env.local` en local. Agrupador, rol `conector_prueba_mcp`, sin consulta | obligatoria | obligatoria | prohibida (cierra el conector) |
| `AUTORIZACION_BD_URL` | persona | sí | Variables del proyecto `pre-nido` en Vercel; `.env.local` en local. Agrupador, rol `conector_prueba_gestion`, sin consulta | obligatoria | obligatoria | prohibida (cierra el conector) |
| `OPERACION_HUELLA` | persona | sí | Variables del proyecto `pre-nido` en Vercel; `.env.local` en local. SHA-256 (64 hexadecimales en minúscula) de la credencial de operación | obligatoria | obligatoria | prohibida (cierra el conector) |
| `PRUEBAS_CONECTOR_BD_URL` | persona | sí | Solo `.env.local` de la máquina de pruebas (PRUEBA-008); la aplicación no la lee | opcional | no se usa | no se usa |
| `PRUEBAS_AUTORIZACION_BD_URL` | persona | sí | Solo `.env.local` de la máquina de pruebas (PRUEBA-008); la aplicación no la lee | opcional | no se usa | no se usa |

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
- Las variables de otras funciones las añade cada una a `configuracion.ts`, a `.env.example` y a
  esta tabla a la vez. Las del conector (función 001, `NOMBRES_CONECTOR` y `NOMBRES_SOLO_MAQUINA`)
  ya están: `CONECTOR_SECRETO` son 43 caracteres base64url del generador criptográfico (nunca una frase), en preproducción las dos URL usan el puerto 6543 y deben existir `VERCEL=1` y un `VERCEL_ENV` `production` o `preview` (nunca `development`; si no, el conector queda cerrado), las dos URL de base de datos no admiten
  consulta (`?…`) y con `ENTORNO=produccion` el conector no arranca (código
  `configuracion_conector_invalida`, solo con nombres).
- Credenciales de despliegue (token de Vercel, secreto de paso, clave de aprobaciones) no son
  variables de la aplicación: viven fuera, según el diseño §Entornos y credenciales.

## Vuelta atrás

Cambiar una variable en Vercel se deshace restaurando el valor anterior desde el gestor de
variables (lo hace una persona) y volviendo a desplegar; el cambio de este documento, con `git revert`.
