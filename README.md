# Agentes de correo HumanaIA: suscripción y dashboards

Fecha: 12/11/2026. Estado: **arnés de ingeniería creado y fase 0 cerrada**. No hay código de aplicación, ni cuentas, ni proyectos en la nube, ni secretos creados.

## Qué se va a construir

1. **Conector MCP** que el cliente añade a su Claude o ChatGPT y activa con su licencia. Tres herramientas: `obtener_instrucciones`, `enviar_informe`, `confirmar_orden`.
2. **Base de datos en la UE** con aislamiento por cliente (RLS).
3. **Dashboard superadmin**: clientes, métricas del prompt, versiones con grupo de prueba y vuelta atrás, órdenes pausar/reanudar, alertas y facturación.
4. **Dashboard por cliente**, que solo ve su resumen.

Nunca entra contenido de correos: solo cifras y estados.

## Por dónde empezar

1. Lee `docs/CONSTITUCION.md` y ratifícala o pide cambios.
2. Revisa `docs/PLAN.md` (fases 0 a 6) y `docs/TECNOLOGIAS.md` (decisiones y lo que queda por verificar).
3. Abre la carpeta en Claude Code y escribe `/orquestar` para continuar con la función en curso (`specs/001-conector-prueba-real/`).

## Fuente

| Qué | Dónde |
| --- | --- |
| Principios innegociables | `docs/CONSTITUCION.md` |
| Decisiones y su estado | `docs/TECNOLOGIAS.md` y `docs/adr/` |
| Hoja de ruta | `docs/PLAN.md` |
| Diseño de alto nivel | `docs/ARQUITECTURA.md`, `docs/SEGURIDAD.md`, `docs/DISENO.md` |
| Modelo de datos de referencia | `docs/MODELO-DATOS.sql` |
| Contratos del conector | `contratos/` |
| Trabajo por función | `specs/` |
| Equipo, modelos y puertas | `docs/EQUIPO.md`, `docs/CALIDAD.md` |
| Instalación en un cliente | `docs/INSTALACION-CLIENTE.md` |

## Comprobación

```bash
node scripts/comprobar-specs.mjs
```

## Límites de este paquete

- Las decisiones técnicas se verificaron en documentación oficial el 12/11/2026. Lo que la documentación no resuelve está marcado VERIFICAR con su fase.
- Los estándares citados (OWASP ASVS, WCAG) son marcos de referencia, no una certificación.
- El flujo de CI incluido es una plantilla: no acredita nada hasta que se instale en un repositorio remoto y se vean sus resultados.
- Coste fijo mínimo previsto: Supabase Pro (25 $/mes) y Vercel Pro (20 $/mes por desarrollador), más las comisiones de Stripe. Es una referencia, no un gasto aprobado.
