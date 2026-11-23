# T-119, paso 4: activación y `listar_conexiones` (23/11/2026)

Lo ejecutó el responsable desde un clon limpio de `main` (`node scripts/conector/operar.mjs preproduccion listar_conexiones`, con la credencial de operación pedida sin eco). Sin capturas de la terminal de operación ni del código tecleado (guion).

## Resultado (CA-021, CA-025)
`resultado`: `listado`. **1 conexión**, ligada a la licencia **A**:
- `asistente`: `claude`.
- `creada_en`: 23/11/2026 15:20:51 UTC; `ultimo_uso_en`: 15:20:58 UTC (la usó Claude a los 7 s de activarla).
- `revocada_en`: `null`; `motivo`: `null`.
(Se omite el identificador de la conexión de esta nota.)

Orden de los hechos: se añadió el conector en Claude, la pantalla de activación mostró «Vas a conectar: claude.ai», se tecleó el código generado con `generar_codigo A` y la conexión quedó creada.

## Notas
- Los pasos 1 y 2 del guion (Gmail limitado y arranque local) **no se hicieron antes del 4**; ver `buzon-preparado.md` (el conector de Gmail se deja sin limitar por decisión del responsable).
- Falta anotar si el alta usó CIMD o DCR, el callback observado y la versión de protocolo (paso 3): la lista de CIMD está vacía en el servicio (`client_id_metadata_document_supported: false`), así que lo esperable es DCR. Sin comprobar.
