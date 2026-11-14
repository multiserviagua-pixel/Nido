# ADR-0001: Pila tecnológica

Estado: CONFIRMADO · Fecha: 12/11/2026 · Decisiones: D-002, T-001 a T-006

## Contexto

Equipo pequeño, producto con cuatro piezas (conector, base de datos, dos dashboards), datos en la UE y aislamiento por cliente. La máquina de desarrollo es Windows 11 con Node 26 y sin Docker.

## Decisión

- Una sola app Next.js 16 (App Router) en TypeScript, desplegada en Vercel Pro con las funciones fijadas en `fra1`.
- Supabase Pro en `eu-central-1`: Postgres con RLS y Supabase Auth para los dashboards.
- Stripe Billing para el cobro (ADR-0006).
- Sin monorepo.

## Alternativas

| Alternativa | Por qué no |
| --- | --- |
| Supabase + Cloudflare Workers | Más montaje inicial sin ventaja a esta escala |
| Servidor propio en la UE | Máximo control, pero copias, parches y disponibilidad a cargo del equipo |
| Conector como servicio aparte | Dos despliegues y dos conjuntos de secretos para muy poco código |
| Planes gratuitos | Pausa por inactividad, sin copias, uso comercial prohibido, sin DPA |

## Consecuencias

- La región de Supabase no se puede cambiar: se elige bien el primer día.
- Vercel ejecuta por defecto en EE. UU.: la región se fija en `vercel.json` y se comprueba en CI.
- Sin Docker local, las pruebas pgTAP solo corren en CI (T-012).
- Coste fijo mínimo: 25 $/mes + 20 $/mes por desarrollador (B-002).
- Una app única concentra riesgo: la clave secreta se confina a un módulo y el conector usa un rol propio (ADR-0003).
