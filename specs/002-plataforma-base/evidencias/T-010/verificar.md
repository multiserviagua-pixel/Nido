# T-010 (002): verificación (2.ª pasada)

- Informe completo: `informe-r2.md` (esta misma carpeta). Archivos de la 2.ª pasada: `r2-*`. Los archivos `informe.md` y `01-` a `12-` son de la 1.ª pasada (20/11/2026, `d852217`, NO superada) y no se han tocado.
- Commit probado: `9e629f1`, en un clon limpio fuera del repositorio. Fecha: 21/11/2026. Entorno: ver `r2-entorno.txt`.
- Resultados reales (fuente: `informe-r2.md`, tabla de pruebas):
  - `npm ci --ignore-scripts`: superada (salida 0).
  - `npx vitest run --maxWorkers=3`: superada (83 archivos, 2291 de 2291, 340 s).
  - `tipos`, `estilo`, `aislamiento`, `arnes`, `build`, cada uno solo: superadas (salida 0).
  - `npm run verificar` sin defectos: superada (salida 0, 2291 de 2291, 567 s) con `VITEST_MAX_WORKERS=3`; con el número de trabajadores por defecto cayó (`r2-10b-...`).
  - PRUEBA-055: sin defectos 0; los 8 defectos dan salida distinta de 0. En la cadena completa 5 de 8 fallan en su paso (casos 1 a 5); los casos 6, 7 y 8 no llegaron a su paso por caídas del entorno y se demostraron con el paso solo. No es «8 de 8 con la cadena completa».
  - PRUEBA-024: `npm run start` con entorno ficticio 7 de 7; `npm run dev` 6 de 7 (`POST /` da 200, comportamiento de Next); `start` con `ENTORNO=desarrollo` da 503 previsto.
  - PRUEBA-059: ver `informe-r2.md`, apartado PRUEBA-059, y `r2-13-prueba-059-repeticion.txt` (repetición tras crear `evidencias/T-011/`, `T-012/` y los tres archivos de T-010).
  - T-008: no ejecutada (bloqueada, R-1).
- No ejecutado o limitado: ver «No se pudo comprobar o queda limitado» en `informe-r2.md`.
