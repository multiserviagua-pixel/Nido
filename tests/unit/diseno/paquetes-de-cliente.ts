// Lista declarada de los paquetes de npm que pueden llegar al navegador: los que alcanzan los
// módulos con `"use client"` siguiendo sus importaciones (sin las de solo tipo) y, de cada
// paquete, lo que el archivo de bloqueo dice que arrastra. PRUEBA-037 compara esta lista, sin
// más ni menos, con la sacada del grafo y del bloqueo: un paquete nuevo hace fallar la prueba.
//
// Es uno de los cinco archivos que deciden el resultado (diseño, «Protección de lo que decide
// el resultado»): un cambio entra solo con el «sí» expreso del responsable.
//
// Hoy es una lista vacía porque todavía no hay ningún módulo de cliente en `src/`. Cada tarea
// que añada uno (T-010 en adelante) vuelve a escribirla con lo que pida la prueba y la revisa
// el `auditor-seguridad`. `next`, `react` y `react-dom` cuentan como paquetes del marco: se
// listan, pero no se despliega lo que arrastran (los cubre la 002).

export const paquetesDeCliente: readonly string[] = [];
