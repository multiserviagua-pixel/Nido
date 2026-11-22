# T-013 · Qué debe ver el responsable (preparación)

Preparado el 22/11/2026 por el orquestador. **La validación es de una persona** (REQ-086, PRUEBA-031): respuesta escrita y fechada, que el orquestador anota en `propuesta-visual.md` (tabla de validación). Esto no es una firma ni una puerta aprobada por delegación.

## Cómo servirlo en local

Desde la carpeta de la copia de trabajo (o de `main` tras integrar):

```bash
ENTORNO=preproduccion npm run build
ENTORNO=preproduccion npx next start --hostname 127.0.0.1 --port 3110
```

(`npm run start` equivale a `next start`.) En PowerShell: `$env:ENTORNO="preproduccion"; npm run build; npm run start -- --hostname 127.0.0.1 --port 3110`. Puerto 3110 o superior (un `next start` viejo puede escuchar en el 3100). Sin `ENTORNO=preproduccion` la muestra responde 404. Abrir `http://127.0.0.1:3110/muestra`. Al terminar, parar el servidor (Ctrl+C).

## Direcciones y qué mirar

| Dirección | Qué mirar |
| --- | --- |
| `/muestra/propuesta-visual` | **La principal.** (1) Paleta y degradados en claro y oscuro: ¿le vale el morado de la referencia? (2) Los tres logotipos A (pájaro en el nido), B (nido de capas) y C (nido en anillo) a 16, 32 y 128 px sobre claro y oscuro: **elegir uno**. (3) Tres vistas en los dos temas: Resumen de superadmin, tabla con el diálogo abierto (con velo) y Resumen de cliente a 375 px. Son una **maqueta con datos ficticios**; los componentes definitivos llegan tras su validación |
| `/muestra/valores` | La escala completa: colores, espaciado, radios, sombras, tamaños de texto. Solo si quiere ajustar algo fino |
| `/muestra` | Índice de la muestra |
| `/muestra/componentes/armazon-superadmin/con-periodo` | Armazón real de superadmin: menú lateral, cabecera con cuenta y selector de periodo (las cifras son marcadores hasta T-010 (e) a (i)) |
| `/muestra/componentes/armazon-cliente/con-periodo` | Lo mismo con las áreas de cliente; en móvil, el menú pasa a un cajón con velo |
| `/muestra/componentes/armazon-cliente/cuenta-120-con-espacios` | Cuenta con nombre de 120 caracteres: no rompe la cabecera |

Para probar a mano: cambiar el tema del sistema (claro/oscuro), estrechar la ventana a 375 px (el menú pasa a cajón), abrir el menú de la cuenta, cambiar el periodo (cambia `?periodo=` y las cifras de muestra).

## Decisiones que se le piden

1. Paleta (morado `#6C3CE9`, neutros pizarra, menú azul noche): ¿se aprueba o se pide otra gama?
2. Logotipo: A, B o C (recomendación del diseñador: B por sobriedad y por leerse mejor a 16 px; A si se quiere que el nido de aves se reconozca a primera vista).
3. Las tres vistas: ¿la composición y la densidad son las esperadas?
4. Umbral de la cabecera fija (38 rem de alto): ¿basta?

Aviso: mirar la propuesta a 1280 px de ancho o más (entre 1024 y 1279 px la maqueta de superadmin no muestra menú) y, en la propuesta A, el ojo del icono es blanco sobre blanco y no se ve (menor del revisor).

Sin su respuesta no empieza el bloque 5 (T-014 y siguientes).

## Capturas

`capturas/` (1280 px y 375 px de ancho, claro y oscuro, página completa): `propuesta-visual-*`, `valores-*`, `indice-*`, `superadmin-con-periodo-*`, `cliente-cuenta-120-*`. Generadas con Chromium sobre la compilación local. Las vistas `armazon-*/resumen` no se capturan: son marcadores hasta T-010 (e) a (i).

## Qué no se pudo comprobar

Aspecto en Firefox y WebKit, en un móvil real (T-019) y con lector de pantalla; contraste solo por cálculo y por las pruebas de navegador de Chromium.
