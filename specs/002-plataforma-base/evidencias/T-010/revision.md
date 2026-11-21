# T-010 (002): revisión (2.ª pasada)

- Revisor, dictamen del 21/11/2026 sobre `informe-r2.md` y sus archivos `r2-*`.
- Hallazgo bloqueante: en PRUEBA-059, T-011 y T-012 (commit `9e629f1`) no tenían carpeta `evidencias/T-NNN/`. Resuelto creando `evidencias/T-011/` y `evidencias/T-012/` con `verificar.md`, `revision.md` y `aprobacion.md` (fuentes: mensaje de `9e629f1` y filas de `tareas.md`; «no consta» donde falta).
- Menores aplicados en `informe-r2.md` y archivos `r2-*`: línea del caso 8 sin respaldo («cygheap/Win32 299») corregida a «sin mensaje»; origen y salidas de `r2-10a` corregidos; `r2-entorno.txt` y orden exacta de `r2-02` añadidos; IP de red local sustituida por `<IP-local>` en los `r2-0[678]-*-servidor.txt`; nota del `.env.local` temporal; mención de que `56555dd` y `b25a1a1` son commits de coordinación o evidencia, que el revisor considera fuera del paso 5.
- Estado según el dictamen: PRUEBA-055 y PRUEBA-024 superadas (con las anotaciones del informe); PRUEBA-059 superada tras crear esas carpetas (repetición en `r2-13-prueba-059-repeticion.txt`).
- Ruta crítica: no consta que la tarea lo sea; sin `dictamen.md` de `auditor-seguridad`.
- El texto íntegro del dictamen del revisor no consta en el repositorio; lo anterior es el resumen recibido por QA a través del orquestador.
