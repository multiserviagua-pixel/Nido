#!/usr/bin/env node
// Gancho PreToolUse de Claude Code.
// Bloquea la escritura de secretos en archivos y la escritura de archivos .env.
//
// Recibe por la entrada estándar un JSON con tool_name y tool_input.
// Sale con 0 para permitir, con 2 para bloquear (el motivo va por la salida
// de errores) y con 1 si el propio gancho falla, que no bloquea.
//
// Es una barrera de ayuda. No sustituye al escáner de secretos del CI.

import { basename } from 'node:path';
import { buscarSecretos, esArchivoDeEntorno } from '../../scripts/patrones-secretos.mjs';

const HERRAMIENTAS = new Set(['Write', 'Edit', 'MultiEdit', 'NotebookEdit']);

async function leerEntrada() {
  let texto = '';
  process.stdin.setEncoding('utf8');
  for await (const trozo of process.stdin) texto += trozo;
  return JSON.parse(texto);
}

// Reúne todo el texto que se va a escribir. Se salta old_string: es lo que
// se quita, y quitar un secreto de un archivo debe estar permitido.
function textosNuevos(valor, salida = []) {
  if (typeof valor === 'string') {
    salida.push(valor);
  } else if (Array.isArray(valor)) {
    for (const elemento of valor) textosNuevos(elemento, salida);
  } else if (valor && typeof valor === 'object') {
    for (const [clave, elemento] of Object.entries(valor)) {
      if (clave === 'old_string') continue;
      textosNuevos(elemento, salida);
    }
  }
  return salida;
}

let entrada;
try {
  entrada = await leerEntrada();
} catch {
  console.error('bloquear-secretos: no se pudo leer la entrada del gancho.');
  process.exit(1);
}

if (!HERRAMIENTAS.has(entrada?.tool_name)) process.exit(0);

const datos = entrada.tool_input ?? {};
const ruta = String(datos.file_path ?? datos.notebook_path ?? '');
const nombre = basename(ruta.replace(/\\/g, '/'));

if (esArchivoDeEntorno(nombre)) {
  console.error(
    `Bloqueado: ${nombre} guarda secretos y solo lo escribe una persona. ` +
      'Añade el nombre de la variable a .env.example e indica al responsable qué valor debe poner.',
  );
  process.exit(2);
}

const encontrados = buscarSecretos(textosNuevos(datos).join('\n'));
if (encontrados.length > 0) {
  console.error(
    `Bloqueado: el contenido parece incluir un secreto (${encontrados.join(', ')}). ` +
      'Los secretos van en variables de entorno, nunca en archivos del repositorio. ' +
      'Si es un valor de ejemplo, usa uno que no tenga forma de clave real.',
  );
  process.exit(2);
}

process.exit(0);
