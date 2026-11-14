# ADR-0005: El prompt solo cambia por despliegue revisado

Estado: CONFIRMADO · Fecha: 12/11/2026 · Decisión: D-007 · Artículo 9 de la constitución

## Contexto

El superadmin debe poder gestionar versiones del prompt, con grupo de prueba y vuelta atrás. Si el texto se pudiera editar desde el panel o directamente en la base de datos, una sesión de administrador robada o una clave filtrada bastarían para dar instrucciones nuevas a todos los agentes.

## Decisión

1. El texto de cada versión vive en el repositorio (`prompts/agente-ia/`), y entra por una petición de cambio revisada por el `revisor` y el `auditor-seguridad`.
2. El despliegue **registra** la versión en `versiones_prompt` con su huella SHA-256 y el commit. La tabla es inmutable: no admite cambios ni borrados.
3. El panel **no edita texto**. Solo publica una versión ya registrada en un canal (`prueba` o `estable`) y hace la vuelta atrás.
4. `publicaciones` guarda el historial. La versión vigente de un canal es la última fila; la vuelta atrás es una fila nueva que apunta a la versión anterior.
5. Cada publicación genera un **aviso fuera del panel** y una fila de auditoría.
6. Una versión pasa una **permanencia mínima en `prueba`** antes de poder publicarse en `estable`.
7. Existe una **pausa global** que detiene todos los agentes en su siguiente revisión.
8. El conector entrega la huella junto al texto.

## Alternativas

| Alternativa | Por qué no |
| --- | --- |
| Editor de prompt en el panel | Punto único de compromiso sin revisión |
| Texto solo en el repositorio, sin tabla | El panel no podría elegir versión por canal ni volver atrás sin un despliegue |

## Consecuencias

- Corregir una errata del prompt exige un despliegue. La vuelta atrás, no.
- Hay que escribir el paso de registro en el despliegue y probar que la tabla rechaza cambios.
- Las métricas por versión se calculan a partir de la versión que cada informe declara.
