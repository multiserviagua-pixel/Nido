---
paths:
  - "src/app/admin/**"
  - "src/app/panel/**"
  - "src/app/acceso/**"
  - "src/components/**"
---

# Reglas al tocar los dashboards

Sigue `docs/DISENO.md`.

- Los datos se leen y se escriben con la sesión del usuario y RLS. Nunca con la clave secreta.
- La autorización se decide en el servidor y en la base de datos. Ocultar un botón no es un control.
- El dashboard de cliente no muestra el texto del prompt, datos de otros clientes ni datos internos.
- Cada vista tiene estados de carga, vacío, error, sin permiso y datos parciales.
- Las acciones que afectan a agentes de clientes piden confirmación y dicen qué pasará y cuándo.
- Accesibilidad WCAG 2.2 AA: teclado, foco visible, etiquetas, contraste, nada solo por color, tabla equivalente para cada gráfico.
- Textos en español de España, trato de tú. Fechas y números con formato español.
- Los errores no muestran datos internos ni valores recibidos.
- No se cargan fuentes ni recursos de terceros en tiempo de ejecución.
- Ningún dato en la URL que no sea un identificador propio del usuario.
- El panel no edita el texto del prompt y no genera facturas.
