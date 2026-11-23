# T-119: buzón de pruebas preparado (23/11/2026)

Preparado por el responsable con `preparar-buzon.gs` (Apps Script ejecutado en la cuenta de pruebas) y comprobado por la coordinación **solo con lecturas de recuentos y metadatos** por el conector de Gmail; no se leyó el contenido de ningún mensaje. Sin dirección de la cuenta (art. 1 y guion).

## Estado comprobado
| Comprobación | Esperado | Obtenido |
| --- | --- | --- |
| Conversaciones `HIA-PRUEBA` | 30 | 30 |
| Bandeja (INBOX) | 30 conversaciones, solo de prueba | 30 (tras archivar lo anterior y un aviso de seguridad de Google) |
| Etiqueta `prueba-urgente` | 5 | 5 |
| Etiqueta `prueba-factura` | 7 | 7 |
| Etiqueta `prueba-revisado` | vacía | 0 |

Cifras que debe dar el informe del paso 6 (guion): `tratados` 30, `urgentes` 5, `facturas_pendientes` 7, `borradores` 1 (lo crea la tarea), `sin_tratar` 0 y `documentos` 0.

## Desviaciones respecto del guion (decididas por la coordinación, D-036, revocables)
1. **Etiquetas puestas por un script de la persona**, no a mano: el guion las pide a mano para que no las ponga el agente que se prueba; las puso un script que ejecutó el responsable, igual de independiente del conector.
2. **La cuenta de Gmail es una cuenta de pruebas generales de HumanaIA** (declaración del responsable, 23/11/2026), no una creada solo para esta prueba. Tenía 38 mensajes anteriores en la bandeja (archivados, no borrados), 44 enviados tras crear los de prueba y otras etiquetas del sistema. **Riesgo:** otro desarrollo de HumanaIA que use la cuenta durante los tres bloques altera los recuentos. Acordar que nadie la use.
3. El conector de Gmail enlazado a la sesión de la coordinación ofrece todavía herramientas de envío, reenvío y borrado: **sigue pendiente limitarlo** a las siete del guion (paso 1) antes de la ejecución programada.

## Falta
Paso 1 (siete herramientas de Gmail, el resto «Blocked», declaración e inventario fechado), paso 2 (arranque local ficticio) y AR-16 (navegador real, GET y POST).
