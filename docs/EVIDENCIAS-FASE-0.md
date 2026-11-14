# Evidencias de la fase 0

Fecha: 12/11/2026 · Entorno: local (Windows 11, Node 26.13.0) · Commit: ninguno todavía (repositorio inicializado, sin commits)

Lo que sigue se ejecutó de verdad al crear el arnés. Lo que no se pudo ejecutar está al final.

## 1. Modelo de datos y aislamiento

```
comando:   node probar-modelo.mjs docs/MODELO-DATOS.sql
           (el guion de scripts/probar-modelo.mjs, ejecutado desde una
           carpeta temporal donde está instalado PGlite; en el repositorio
           no se instaló nada)
entorno:   local, PGlite 0.5.16 (Postgres en WebAssembly) con un preámbulo
           que simula el esquema auth y los roles de Supabase
resultado: superada, 45 de 45 comprobaciones
```

Qué cubre:

- `docs/MODELO-DATOS.sql` se ejecuta entero sin errores.
- Conector: con licencia activa recibe estado `activa` y el prompt; un token desconocido no queda autorizado; el rol del conector no puede leer tablas; el token de un cliente no puede cerrar la ejecución ni confirmar la orden de otro.
- Informe: los campos de más se descartan y solo se cuentan; repetirlo no duplica; un tipo incorrecto o una cifra fuera de rango se rechazan sin devolver el valor; lo guardado no contiene el asunto ni el remitente enviados de más.
- Latido: la ejecución se cierra con el informe y queda abierta sin él.
- Órdenes: la pausa devuelve estado `pausada` sin prompt; se entrega y se confirma; confirmar dos veces no falla.
- Licencia suspendida: estado `suspendida` y ninguna instrucción.
- Dashboards: el usuario de un cliente solo ve lo suyo en tablas y en vistas; no ve versiones, conexiones, auditoría ni tokens; no puede crear órdenes ni cambiar otro cliente.
- Superadmin: sin doble factor no ve nada; con doble factor ve todo y sus acciones quedan auditadas.
- Anónimo: sin acceso.
- `versiones_prompt` y `auditoria` rechazan cambios y borrados, también al propietario.

Qué no cubre: es una simulación. No prueba el esquema contra un Supabase real, ni la API de datos, ni el rol del conector con una conexión real. Eso se hace con pgTAP en CI en la fase 2.

## 2. Comprobador del arnés

```
comando:   node scripts/comprobar-specs.mjs
entorno:   local
resultado: superada, 12 apartados sin errores
```

Además se comprobó que el comprobador falla cuando debe: sobre una copia del arnés con cuatro defectos introducidos a propósito, los señaló todos (ver apartado 4).

## 3. Gancho de secretos

```
comando:   node probar-gancho.mjs .claude/hooks/bloquear-secretos.mjs
           (guion temporal, fuera del repositorio, que pasa al gancho la
           entrada que recibiría de Claude Code, con claves ficticias)
entorno:   local
resultado: superada, 11 de 11 comprobaciones
```

Bloquea la escritura de claves con forma de secreto y de archivos `.env`; permite archivos normales, `.env.example` con solo nombres y la retirada de un secreto; el mensaje de bloqueo no repite el secreto.

Qué no cubre: que Claude Code invoque el gancho desde `.claude/settings.json`. Eso se comprobó después y falló con la forma inicial: ver el apartado 5.

## 4. El comprobador detecta defectos

```
comando:   node scripts/comprobar-specs.mjs, sobre una copia temporal con
           defectos introducidos a propósito
entorno:   local
resultado: ver el resultado anotado al final de este apartado
```

Defectos introducidos: modelo de un agente distinto del de `docs/EQUIPO.md`; un campo de texto libre añadido al contrato del informe; un requisito sin criterio de aceptación; una clave ficticia con forma de secreto en un archivo.

Resultado: superada. El comprobador terminó con error y señaló los cuatro defectos, con cinco mensajes:

- `informe.asunto: texto libre. Un texto solo se admite con pattern y maxLength`
- `El campo «asunto» está en el contrato y no en mcp_enviar_informe`
- `specs/001-conector-prueba-real: REQ-015 no aparece en ningún criterio de aceptación`
- `Enrutado: «revisor» es sonnet en su archivo y opus en docs/EQUIPO.md`
- `Posible secreto en docs/nota.md: clave secreta de Supabase`

La salida no repite la clave ficticia. La copia temporal se borró al terminar.

## 5. Carga del arnés en una sesión de la app (V-105)

```
fecha:     12/11/2026
entorno:   app de escritorio, sesión abierta en la carpeta del proyecto
resultado: superada tras corregir el gancho; dos puntos sin poder comprobar
```

| Qué | Cómo se comprobó | Resultado |
| --- | --- | --- |
| Agentes | Listado de la sesión; se lanzó `explorador` con una comprobación mecánica | Superada. Los 12 aparecen; `explorador` respondió y solo tenía Read, Grep y Glob |
| Skills | Listado de la sesión; se invocó `cerrar-fase` | Superada. Las 14 aparecen; la skill se cargó |
| Gancho de secretos, forma inicial | Escritura real de una clave ficticia, una fuera del proyecto y otra dentro | **Fallida.** Las dos escrituras pasaron sin bloqueo. El guion funcionaba lanzado a mano; fallaba la forma de declararlo en los ajustes: comando y argumentos por separado, con la ruta en una variable. La causa exacta (los argumentos o la variable) no se ha determinado |
| Gancho de secretos, forma corregida | El responsable aprobó cambiar `.claude/settings.json`. Se declaró como una sola cadena con ruta relativa y se repitió la escritura, dentro y fuera del proyecto | Superada. Las dos escrituras quedaron bloqueadas con el mensaje del gancho. El cambio se aplicó sin reiniciar la sesión |
| Regla de permisos sobre `.env` | Intento de escribir `.env.local` | Superada. Lo impidió la regla de permisos |
| Reglas por ruta (`.claude/rules/`) | — | No ejecutada. No existen todavía archivos en esas rutas. Pasa a V-116, fase 1 |
| Modelo con el que se ejecuta cada agente | — | No ejecutada. El listado de la sesión no lo muestra |

De las dos escrituras que pasaron con la forma inicial, el archivo de dentro del proyecto se eliminó enseguida y el otro quedó en una carpeta temporal de la sesión. Solo contenían la clave ficticia.

Lo que enseña: una barrera de seguridad no está comprobada hasta que se la ve bloquear en el entorno real. La prueba del apartado 3 solo demostraba que el guion funciona, no que la app lo ejecute.

## No ejecutado

| Qué | Por qué | Dónde se hará |
| --- | --- | --- |
| Pruebas pgTAP contra Supabase | No hay proyecto de Supabase ni Docker en esta máquina | CI, fase 2 |
| Reglas por ruta de `.claude/rules/` (V-116) | No existen todavía archivos en esas rutas | Fase 1, al crear el primer archivo de cada ruta |
| Modelo con el que se ejecuta cada agente | El listado de la sesión no lo muestra | Al revisar el uso de los primeros encargos de la fase 1 |
| Flujo de CI de `.github/workflows/arnes.yml` | No hay repositorio remoto | Fase 1 |
| Todo lo que depende de asistentes reales (V-101 a V-104) | Requiere el conector desplegado | Fase 1 |
