// Genera tests/unit/plataforma/fechas-publicacion.json: fecha de publicación en
// registry.npmjs.org de cada paquete@versión del package-lock.json.
// Uso (necesita red): node scripts/generar-fechas-bloqueo.mjs [límite ISO]
// Por defecto el límite es 2026-11-12T23:59:59Z (siete días antes del 19/11/2026).
import { existsSync, readFileSync, writeFileSync } from "node:fs";

const limite = process.argv[2] ?? "2026-11-12T23:59:59Z";
const bloqueo = JSON.parse(readFileSync("package-lock.json", "utf8"));
const claves = new Set();
for (const [ruta, datos] of Object.entries(bloqueo.packages)) {
  if (ruta === "") continue;
  const nombre = ruta.slice(ruta.lastIndexOf("node_modules/") + "node_modules/".length);
  claves.add(`${nombre}@${datos.version}`);
}

const porNombre = new Map();
for (const clave of claves) {
  const i = clave.lastIndexOf("@");
  const nombre = clave.slice(0, i);
  porNombre.set(nombre, [...(porNombre.get(nombre) ?? []), clave.slice(i + 1)]);
}

const fechas = {};
const cola = [...porNombre.entries()];
async function trabajar() {
  for (let par = cola.pop(); par; par = cola.pop()) {
    const [nombre, versiones] = par;
    const url = `https://registry.npmjs.org/${nombre.replace("/", "%2F")}`;
    const respuesta = await fetch(url);
    if (!respuesta.ok) throw new Error(`${nombre}: HTTP ${respuesta.status}`);
    const { time } = await respuesta.json();
    for (const version of versiones) {
      if (!time?.[version]) throw new Error(`${nombre}@${version}: sin fecha`);
      fechas[`${nombre}@${version}`] = time[version];
    }
  }
}
await Promise.all(Array.from({ length: 8 }, trabajar));

const ordenadas = Object.fromEntries(Object.entries(fechas).sort(([a], [b]) => a.localeCompare(b)));
// Las excepciones (D-019) se escriben a mano y se conservan; la prueba exige que cada una
// siga en el bloqueo y siga siendo posterior al límite, y que no falte ninguna.
const archivo = "tests/unit/plataforma/fechas-publicacion.json";
const excepciones = existsSync(archivo)
  ? (JSON.parse(readFileSync(archivo, "utf8")).excepciones ?? [])
  : [];
writeFileSync(
  archivo,
  `${JSON.stringify({ limite, fechas: ordenadas, excepciones }, null, 2)}
`,
);
const nuevas = Object.entries(ordenadas).filter(([, f]) => Date.parse(f) > Date.parse(limite));
console.log(`${claves.size} paquetes, ${nuevas.length} publicados después de ${limite}`);
for (const [clave, fecha] of nuevas) console.log(`  ${clave} ${fecha}`);
