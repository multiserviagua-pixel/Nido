// Árboles de archivos temporales para sembrar fallos y comprobar que una comprobación los ve.
// Los datos son ficticios y viven en la carpeta temporal del sistema o en `node_modules/.cache`
// (ignorada por git), nunca en un sitio que el repositorio registre.
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";

const creados: string[] = [];

/** `base` permite crear el árbol en otra carpeta; si los archivos necesitan resolver `next` y demás
 * paquetes, hay que pasar una carpeta bajo `node_modules/` del repositorio (por ejemplo
 * `node_modules/.cache`): ahí se resuelven y no queda nada sin ignorar en la raíz. */
export function crearArbol(archivos: Record<string, string>, base: string = tmpdir()): string {
  mkdirSync(base, { recursive: true });
  const raiz = mkdtempSync(join(base, ".nido-td-"));
  creados.push(raiz);
  for (const [ruta, contenido] of Object.entries(archivos)) {
    const destino = join(raiz, ruta);
    mkdirSync(dirname(destino), { recursive: true });
    writeFileSync(destino, contenido, "utf8");
  }
  return raiz;
}

export function borrarArboles(): void {
  for (const r of creados.splice(0)) rmSync(r, { recursive: true, force: true });
}
