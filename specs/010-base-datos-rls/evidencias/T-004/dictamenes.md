# T-004 · Dictámenes (20/11/2026)

| Quién | Veredicto | Hallazgos | Cierre |
| --- | --- | --- | --- |
| `revisor` | APTO | 0 bloqueantes. MENOR 1: sin caso `{{a,b}}` que dependa de `array_ndims = 1`. MENOR 2: el `check` no exigía `array_lower(problemas,1) = 1`. MENOR 3: tercer elemento de `CASOS` sin uso | Cerrados en `933d700`: casos `{{sin_contexto,error_borrador}}` y `[3:4]={...}` rechazados (rojo comprobado antes; en modo réplica solo queda el `check`); `array_lower = 1` en el `check`; `CASOS` a dos elementos |
| `auditor-seguridad` | APTO | 0 bloqueantes. MENOR 1 (arts. 2 y 3): `impedir_cambio_de_pertenencia` no protegía `informes` ni `alertas` (como dueño se aceptaban `update informes set ejecucion_id, cliente_id` y `update alertas set cliente_id`). MENOR 2: el `check` de `problemas` aceptaba `{""}` y `{"sin_contexto,abc"}` sin disparadores | MENOR 1 cerrado en `933d700`: disparadores `informes_pertenencia` y `alertas_pertenencia` (`cambio_de_pertenencia_no_permitido`), pruebas con esas sentencias, lista de disparadores, ciclo y reversión (se borran con sus tablas). MENOR 2 cerrado en `933d700`: el `check` rechaza elementos vacíos o con coma; pruebas con `{""}` y `{"sin_contexto,abc"}` con `session_replication_role = replica` |

No ejecutado: pgTAP (CI, T-013).
