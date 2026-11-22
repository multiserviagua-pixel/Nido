# T-112 · Hallazgos

Ninguna prueba reveló un defecto de producto: no hay nada que arreglar derivado de T-112. Observaciones para el revisor y para las tareas siguientes:

1. **`state` obligatorio en `GET /oauth/autorizar`.** Un cliente que no lo envía (el cliente oficial, si su proveedor no define `state()`) recibe 400. Es lo diseñado (HMAC de `state` en la solicitud; Claude y ChatGPT lo envían), pero conviene saberlo si se prueba con otros clientes. Las pruebas del ciclo definen `state()`.
2. **Concurrencia.** Las pruebas «diez a la vez» corren sobre PGlite con una sola conexión: comprueban la lógica (un `guardado`, nueve `repetido`; una `confirmada`, nueve `repetida`; una conexión por código), no el bloqueo de fila. Eso queda para PRUEBA-008 (T-114).
3. **Reloj congelado.** Con el reloj de la base congelado, una ventana de gracia de 0 s pasa igual que una de 60 s. Las pruebas que dependen de la gracia avanzan el reloj entre la rotación y la repetición (30 s) y después de ella (31 s más).
4. **Parte contra `next start` de PRUEBA-009: no ejecutada.** Escrita, omitida si no hay `INVENTARIO_BASE_URL`. No se ha lanzado build ni servidor (orden recibida por la poca memoria de la máquina).
5. **Pruebas sin ejecutar en T-112:** PRUEBA-004 (L, contra `Nido`) y PRUEBA-008 (T-114); PRUEBA-009 con navegador real (T-119, AR-16); PRUEBA-018 «certificado no confiable → 503 sin consultar» no se repite aquí (cubierta en `tests/unit/conector/conector.test.ts`, T-104).
