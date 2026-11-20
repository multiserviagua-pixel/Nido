// Índice de la muestra (020 T-005), generado a partir del inventario. Se pinta en el servidor en
// cada petición: la comprobación lee `Host` con `headers()`. Sin datos reales ni de la petición.
import { comprobarAccesoMuestra } from "./_datos/acceso-muestra";
import { INVENTARIO, rutaDeEstado } from "./inventario";

export default async function IndiceDeLaMuestra() {
  await comprobarAccesoMuestra();
  return (
    <>
      <h1>Muestra de componentes</h1>
      <p>
        Cada componente y cada vista del sistema de diseño, en cada uno de sus estados y con datos
        ficticios. Elige un estado para verlo.
      </p>
      {INVENTARIO.map((entrada) => {
        const idTitulo = `muestra-${entrada.clave}`;
        return (
          <section key={entrada.clave} aria-labelledby={idTitulo}>
            <h2 id={idTitulo}>{entrada.nombre}</h2>
            <ul>
              {entrada.estados.map((estado) => {
                const ruta = rutaDeEstado(entrada, estado.clave);
                return (
                  <li key={estado.clave}>
                    <a href={ruta} aria-current={ruta === "/muestra" ? "page" : undefined}>
                      {estado.nombre}
                    </a>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
    </>
  );
}
