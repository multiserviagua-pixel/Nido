// Todas las excepciones de las comprobaciones de la 020, en un solo sitio (diseño, «Muestra de
// componentes», punto 2 de «Cómo no tiene acceso a datos»). Es uno de los cinco archivos que
// deciden el resultado de las pruebas (diseño, «Protección de lo que decide el resultado»):
// un cambio aquí solo entra con el «sí» expreso del responsable. Una prueba (fronteras.test.ts)
// compara esta lista con la del diseño, así que añadir una excepción hace fallar esa prueba.

export type OrigenDeExcepcion =
  { tipo: "cualquiera" } | { tipo: "archivo"; ruta: string } | { tipo: "carpeta"; ruta: string };

export type ExcepcionDeImportacion = {
  desde: OrigenDeExcepcion;
  /** Archivo de `src/lib/` que se permite importar. */
  hacia: string;
  motivo: string;
};

/** Las únicas tres excepciones a «ningún archivo de la muestra ni de los componentes importa `src/lib/`». */
export const excepcionesDeImportacion: readonly ExcepcionDeImportacion[] = [
  {
    desde: { tipo: "cualquiera" },
    hacia: "src/lib/errores/referencia.ts",
    motivo: "Cualquier archivo puede crear y leer la referencia de un error.",
  },
  {
    desde: { tipo: "archivo", ruta: "src/app/muestra/_datos/acceso-muestra.ts" },
    hacia: "src/lib/plataforma/configuracion.ts",
    motivo: "Solo ese archivo lee el entorno (control 2 de la muestra).",
  },
  {
    desde: { tipo: "carpeta", ruta: "src/app/muestra/servidor/" },
    hacia: "src/lib/errores/sin-acceso.ts",
    motivo: "Las rutas de servidor de la muestra responden «sin acceso» con la función común.",
  },
];

/** Excepciones a la comprobación de `style` en línea (PRUEBA-005/018). Ninguna por ahora. */
export const excepcionesDeStyle: readonly string[] = [];

/** Excepciones a la comprobación de valores fuera de la escala (PRUEBA-005). Ninguna por ahora. */
export const excepcionesDeValores: readonly string[] = [];
