---
paths:
  - "src/mcp/**"
  - "src/app/api/mcp/**"
  - "src/app/oauth/**"
  - "src/app/.well-known/**"
  - "src/lib/oauth/**"
  - "src/lib/licencias/**"
  - "contratos/**"
---

# Reglas al tocar el conector y la autorización

Ruta crítica: todo cambio pasa por el `revisor` y el `auditor-seguridad`. Sigue la skill `herramienta-mcp`.

- El contrato de `contratos/` manda. Se cambia ahí primero, y el cambio viene del diseño.
- Entradas de lista cerrada. Lo desconocido se descarta y solo se cuenta.
- Ningún identificador de cliente o de licencia como entrada.
- `src/mcp/` solo usa `src/lib/supabase/conector.ts`. Nunca la clave secreta.
- Cierre en fallo: un error nunca entrega prompt, reglas ni datos.
- Registros: ruta, herramienta, resultado y código. Nunca argumentos, cabeceras, tokens ni códigos.
- Callbacks: coincidencia exacta con la lista cerrada. PKCE S256 siempre.
- Tokens y códigos: generador criptográfico, guardados como HMAC, comparados en tiempo constante.
- Rotación del token de renovación atómica, con ventana de gracia.
- No se cambia una anotación de herramienta para evitar una confirmación del asistente.
- Añadir una herramienta o un campo de texto libre exige decisión del responsable.
