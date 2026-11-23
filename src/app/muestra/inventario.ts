// Inventario de la muestra (diseño 020, «Muestra de componentes»; REQ-061, REQ-084; CA-046).
// Lista cerrada de lo que la muestra enseña. De ella salen el índice, las rutas (lo que no está
// aquí da 404) y la lista que recorren las pruebas en navegador. Es uno de los cinco archivos que
// deciden el resultado de las pruebas (diseño, «Protección de lo que decide el resultado»); desde
// T-016 (i), que lo cierra con el inventario completo del diseño, es ruta reservada (A-12).
// Cada tarea que construye un componente añade aquí sus entradas en el mismo commit.
// Solo datos: no importa nada.

export type EstadoDeMuestra = { readonly clave: string; readonly nombre: string };

export type EntradaDeInventario =
  | {
      /** Página propia de la muestra, con ruta fija. */
      readonly tipo: "pagina";
      readonly clave: string;
      readonly nombre: string;
      readonly ruta: "/muestra" | `/muestra/${string}`;
      readonly estados: readonly EstadoDeMuestra[];
    }
  | {
      /** Un componente en cada uno de sus estados: `/muestra/componentes/<clave>/<estado>`. */
      readonly tipo: "componente";
      readonly clave: string;
      readonly nombre: string;
      readonly estados: readonly EstadoDeMuestra[];
    };

function congelar(entradas: readonly EntradaDeInventario[]): readonly EntradaDeInventario[] {
  for (const e of entradas) {
    for (const s of e.estados) Object.freeze(s);
    Object.freeze(e.estados);
    Object.freeze(e);
  }
  return Object.freeze([...entradas]);
}

export const INVENTARIO: readonly EntradaDeInventario[] = congelar([
  {
    tipo: "pagina",
    clave: "indice",
    nombre: "Índice de la muestra",
    ruta: "/muestra",
    estados: [{ clave: "unico", nombre: "Único" }],
  },
  // T-012: la propuesta visual para el responsable (T-013) y la escala de valores pintada. Páginas
  // propias, no componentes. La clave empieza por `vista-` para entrar en los casos del armazón
  // de anchos.spec.ts (ancho máximo del contenido); ruta y carpeta fijas (PRUEBA-008, R7).
  {
    tipo: "pagina",
    clave: "vista-propuesta-visual",
    nombre: "Propuesta visual",
    ruta: "/muestra/propuesta-visual",
    estados: [{ clave: "unico", nombre: "Único" }],
  },
  {
    tipo: "pagina",
    clave: "vista-valores",
    nombre: "Valores de diseño",
    ruta: "/muestra/valores",
    estados: [{ clave: "unico", nombre: "Único" }],
  },
  // T-010 (e2): la vista cuyas cifras pinta el servidor a partir de `?periodo=`. Es la que mide el
  // cambio de periodo con `router.replace` (PRUEBA-012, 016 y 034). Ruta y carpeta fijas (R7); la
  // clave empieza por `vista-` para entrar en los casos de ancho máximo de anchos.spec.ts.
  {
    tipo: "pagina",
    clave: "vista-servidor-periodo",
    nombre: "Periodo pintado en el servidor",
    ruta: "/muestra/servidor/periodo",
    estados: [{ clave: "unico", nombre: "Único" }],
  },
  // T-010 (d): `Boton` en sus variantes y estados, y `useAccion` con cada respuesta posible del
  // servidor (simulada en la propia página: la muestra no llama a la red). Una carpeta de página
  // fija por estado (PRUEBA-008, R7).
  {
    tipo: "componente",
    clave: "boton-accion",
    nombre: "Botón de acción",
    estados: [
      { clave: "variantes", nombre: "Variantes" },
      { clave: "acciones", nombre: "Acción con cada respuesta" },
    ],
  },
  // T-010 (a): el armazón con las áreas de superadmin (fase 3) y con el juego de cliente de la
  // muestra. Un estado por área actual; el de nombre largo prueba 120 caracteres sin espacios.
  // Los nombres siguen la convención de tests/e2e/muestra/anchos.spec.ts (armazon…, …120).
  {
    tipo: "componente",
    clave: "armazon-superadmin",
    nombre: "Armazón de superadmin",
    estados: [
      { clave: "resumen", nombre: "Resumen" },
      { clave: "clientes", nombre: "Clientes" },
      { clave: "ordenes", nombre: "Órdenes" },
      { clave: "auditoria", nombre: "Auditoría" },
      { clave: "ajustes", nombre: "Ajustes" },
      { clave: "nombre-largo-120", nombre: "Nombre largo de 120 caracteres" },
      // T-010 (c): cabecera con selector de periodo (la cuenta, cerrada o abierta, está en todos).
      { clave: "con-periodo", nombre: "Con selector de periodo" },
    ],
  },
  {
    tipo: "componente",
    clave: "armazon-cliente",
    nombre: "Armazón de cliente",
    estados: [
      { clave: "resumen", nombre: "Resumen" },
      { clave: "actividad", nombre: "Actividad" },
      { clave: "suscripcion", nombre: "Suscripción" },
      { clave: "cuenta", nombre: "Cuenta" },
      { clave: "con-periodo", nombre: "Con selector de periodo" },
      { clave: "cuenta-120-con-espacios", nombre: "Cuenta de 120 caracteres con espacios" },
    ],
  },
]);

/** Dirección estable de un estado. Para una página, su ruta fija. */
export function rutaDeEstado(entrada: EntradaDeInventario, estado: string): string {
  if (entrada.tipo === "pagina") return entrada.ruta;
  return `/muestra/componentes/${entrada.clave}/${estado}`;
}

/** Busca por comparación exacta; lo que no está en el inventario no existe (`undefined`). */
export function buscarEstado(
  clave: string,
  estado: string,
): { entrada: EntradaDeInventario; estado: EstadoDeMuestra } | undefined {
  const entrada = INVENTARIO.find((e) => e.clave === clave);
  const encontrado = entrada?.estados.find((s) => s.clave === estado);
  return entrada !== undefined && encontrado !== undefined
    ? { entrada, estado: encontrado }
    : undefined;
}
