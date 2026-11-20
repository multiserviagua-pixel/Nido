#!/usr/bin/env node
// Comprobador documental del arnés.
//
// Comprueba lo que se puede comprobar sin ejecutar la aplicación:
// archivos obligatorios, contratos, trazabilidad de las funciones,
// cabeceras de agentes y skills, registro de decisiones, plan y secretos.
//
// No prueba seguridad ni comportamiento.
//
// Uso: node scripts/comprobar-specs.mjs

import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, extname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buscarSecretos } from './patrones-secretos.mjs';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const errores = [];
const secciones = [];

const ruta = (...partes) => join(RAIZ, ...partes);
const existe = (r) => existsSync(ruta(r));
const leer = (r) => readFileSync(ruta(r), 'utf8').replace(/\r\n/g, '\n');
const entradas = (r) => (existe(r) ? readdirSync(ruta(r), { withFileTypes: true }) : []);
const carpetas = (r) => entradas(r).filter((e) => e.isDirectory()).map((e) => e.name).sort();
const archivos = (r) => entradas(r).filter((e) => e.isFile()).map((e) => e.name).sort();

function seccion(nombre, fn) {
  const antes = errores.length;
  let detalle = '';
  try {
    detalle = fn() ?? '';
  } catch (e) {
    errores.push(`${nombre}: el comprobador falló (${e.message})`);
  }
  secciones.push({ nombre, ok: errores.length === antes, detalle });
}

// ---------------------------------------------------------------------
// Utilidades
// ---------------------------------------------------------------------

// Cabecera YAML sencilla: claves de primer nivel y listas con guion.
function cabecera(texto) {
  if (!texto.startsWith('---\n')) return null;
  const fin = texto.indexOf('\n---', 4);
  if (fin === -1) return null;
  const campos = {};
  let actual = null;
  for (const linea of texto.slice(4, fin).split('\n')) {
    const clave = linea.match(/^([A-Za-z][A-Za-z0-9_-]*):\s*(.*)$/);
    if (clave) {
      actual = clave[1];
      campos[actual] = clave[2].trim();
      continue;
    }
    const elemento = linea.match(/^\s+-\s+(.*)$/);
    if (elemento && actual) {
      const valor = elemento[1].trim().replace(/^["']|["']$/g, '');
      campos[actual] = campos[actual] ? `${campos[actual]}, ${valor}` : valor;
    }
  }
  return campos;
}

// Identificadores de un tipo (REQ, CA), expandiendo rangos «REQ-001 a REQ-004».
function identificadores(texto, prefijo) {
  const encontrados = new Set();
  const rango = new RegExp(`${prefijo}-(\\d{3}) a ${prefijo}-(\\d{3})`, 'g');
  for (const m of texto.matchAll(rango)) {
    for (let n = Number(m[1]); n <= Number(m[2]); n += 1) {
      encontrados.add(`${prefijo}-${String(n).padStart(3, '0')}`);
    }
  }
  for (const m of texto.matchAll(new RegExp(`${prefijo}-\\d{3}`, 'g'))) encontrados.add(m[0]);
  return encontrados;
}

// Texto de un apartado «## Título» hasta el siguiente «## ».
function apartado(texto, titulo) {
  const inicio = texto.indexOf(`\n## ${titulo}`);
  if (inicio === -1) return null;
  const resto = texto.slice(inicio + 1);
  const siguiente = resto.indexOf('\n## ', 1);
  return siguiente === -1 ? resto : resto.slice(0, siguiente);
}

// ---------------------------------------------------------------------
// 1. Archivos obligatorios
// ---------------------------------------------------------------------

const OBLIGATORIOS = [
  'CLAUDE.md',
  'AGENTS.md',
  'README.md',
  '.gitignore',
  '.env.example',
  'docs/CONSTITUCION.md',
  'docs/PLAN.md',
  'docs/TECNOLOGIAS.md',
  'docs/MODELO-DATOS.sql',
  'docs/ARQUITECTURA.md',
  'docs/SEGURIDAD.md',
  'docs/DISENO.md',
  'docs/CALIDAD.md',
  'docs/EQUIPO.md',
  'docs/INSTALACION-CLIENTE.md',
  'docs/ESQUELETO.md',
  'specs/_plantillas/especificacion.md',
  'specs/_plantillas/aclaraciones.md',
  'specs/_plantillas/diseno.md',
  'specs/_plantillas/plan.md',
  'specs/_plantillas/tareas.md',
  'specs/_plantillas/verificacion.md',
  'contratos/informe.schema.json',
  'contratos/obtener-instrucciones.schema.json',
  'contratos/enviar-informe.schema.json',
  'contratos/confirmar-orden.schema.json',
  'scripts/patrones-secretos.mjs',
  '.claude/settings.json',
  '.claude/hooks/bloquear-secretos.mjs',
  '.github/PULL_REQUEST_TEMPLATE.md',
];

seccion('Archivos obligatorios', () => {
  for (const f of OBLIGATORIOS) {
    if (!existe(f)) errores.push(`Falta el archivo: ${f}`);
    else if (!leer(f).trim()) errores.push(`Archivo vacío: ${f}`);
  }
  if (existe('CLAUDE.md') && !leer('CLAUDE.md').includes('@docs/CONSTITUCION.md')) {
    errores.push('CLAUDE.md no importa la constitución (@docs/CONSTITUCION.md)');
  }
  return `${OBLIGATORIOS.length} archivos`;
});

// ---------------------------------------------------------------------
// 2. Contratos
// ---------------------------------------------------------------------

// El informe no admite texto libre (constitución, artículo 1).
function sinTextoLibre(nodo, donde) {
  if (!nodo || typeof nodo !== 'object') {
    errores.push(`${donde}: falta la definición`);
    return;
  }
  if (Array.isArray(nodo.enum)) return;
  if (nodo.type === 'integer' || nodo.type === 'boolean') return;
  if (nodo.type === 'object') {
    if (nodo.additionalProperties !== false) {
      errores.push(`${donde}: debe declarar additionalProperties: false`);
    }
    for (const [clave, hijo] of Object.entries(nodo.properties ?? {})) {
      sinTextoLibre(hijo, `${donde}.${clave}`);
    }
    return;
  }
  if (nodo.type === 'array') {
    if (typeof nodo.maxItems !== 'number') errores.push(`${donde}: lista sin maxItems`);
    sinTextoLibre(nodo.items, `${donde}[]`);
    return;
  }
  if (nodo.type === 'string') {
    if (typeof nodo.pattern !== 'string' || typeof nodo.maxLength !== 'number') {
      errores.push(`${donde}: texto libre. Un texto solo se admite con pattern y maxLength`);
    } else if (/\.\*|\.\+/.test(nodo.pattern)) {
      errores.push(`${donde}: el patrón admite cualquier texto`);
    }
    return;
  }
  errores.push(`${donde}: tipo no admitido en el informe`);
}

let informe = null;

seccion('Contratos', () => {
  const nombres = archivos('contratos').filter((n) => n.endsWith('.json'));
  for (const nombre of nombres) {
    try {
      const datos = JSON.parse(leer(`contratos/${nombre}`));
      if (nombre === 'informe.schema.json') informe = datos;
    } catch (e) {
      errores.push(`contratos/${nombre}: JSON no válido (${e.message})`);
    }
  }
  if (informe) sinTextoLibre(informe, 'informe');
  return `${nombres.length} esquemas; informe sin texto libre`;
});

seccion('Contrato del informe y modelo de datos coinciden', () => {
  if (!informe || !existe('docs/MODELO-DATOS.sql')) return 'sin datos para comparar';
  const sql = leer('docs/MODELO-DATOS.sql');

  // Códigos de problema: contrato frente a datos iniciales del catálogo.
  const delContrato = new Set(informe.properties?.problemas?.items?.enum ?? []);
  const bloque = sql.slice(sql.indexOf('insert into public.catalogo_problemas'));
  const delModelo = new Set([...bloque.matchAll(/\('([a-z_]+)',/g)].map((m) => m[1]));
  for (const c of delContrato) {
    if (!delModelo.has(c)) errores.push(`El código «${c}» está en el contrato y no en el catálogo del modelo`);
  }
  for (const c of delModelo) {
    if (!delContrato.has(c)) errores.push(`El código «${c}» está en el catálogo del modelo y no en el contrato`);
  }

  // Campos del informe: contrato frente a la lista de la función que lo guarda.
  const lista = sql.match(/v_claves constant text\[\] := array\[([\s\S]*?)\];/);
  if (!lista) {
    errores.push('No se encuentra la lista de campos (v_claves) en mcp_enviar_informe');
  } else {
    const delaFuncion = new Set([...lista[1].matchAll(/'([a-z_]+)'/g)].map((m) => m[1]));
    const delEsquema = new Set(Object.keys(informe.properties ?? {}));
    for (const c of delEsquema) {
      if (!delaFuncion.has(c)) errores.push(`El campo «${c}» está en el contrato y no en mcp_enviar_informe`);
    }
    for (const c of delaFuncion) {
      if (!delEsquema.has(c)) errores.push(`El campo «${c}» está en mcp_enviar_informe y no en el contrato`);
    }
  }
  return `${delContrato.size} códigos de problema`;
});

// ---------------------------------------------------------------------
// 3. Funciones (specs)
// ---------------------------------------------------------------------

const ESTADOS = ['PROPUESTA', 'APROBADA', 'DISEÑADA', 'PLANIFICADA', 'EN CURSO', 'VERIFICADA', 'CERRADA'];

seccion('Trazabilidad de las funciones', () => {
  const funciones = carpetas('specs').filter((n) => !n.startsWith('_'));
  for (const nombre of funciones) {
    const base = `specs/${nombre}`;
    if (!/^\d{3}-[a-z0-9-]+$/.test(nombre)) {
      errores.push(`${base}: el nombre debe ser NNN-nombre-en-minusculas`);
    }
    if (!existe(`${base}/especificacion.md`)) {
      errores.push(`${base}: falta especificacion.md`);
      continue;
    }
    const spec = leer(`${base}/especificacion.md`);
    const estado = (spec.match(/^Estado:\s*(.+?)\s*$/m)?.[1] ?? '').replace(/\*/g, '').toUpperCase();
    const nivel = ESTADOS.indexOf(estado);
    if (nivel === -1) {
      errores.push(`${base}: estado «${estado}» no válido. Válidos: ${ESTADOS.join(', ')}`);
    }

    const requisitos = [...identificadores(spec, 'REQ')].sort();
    const criterios = [...identificadores(spec, 'CA')].sort();
    if (requisitos.length === 0) errores.push(`${base}: no hay ningún REQ-`);
    if (criterios.length === 0) errores.push(`${base}: no hay ningún CA-`);
    if (!apartado(spec, 'Fuera de alcance')) errores.push(`${base}: falta el apartado «Fuera de alcance»`);

    const textoCriterios = apartado(spec, 'Criterios de aceptación');
    if (!textoCriterios) {
      errores.push(`${base}: falta el apartado «Criterios de aceptación»`);
    } else {
      const cubiertos = identificadores(textoCriterios, 'REQ');
      for (const r of requisitos) {
        if (!cubiertos.has(r)) errores.push(`${base}: ${r} no aparece en ningún criterio de aceptación`);
      }
    }

    const exige = (archivo, desde) => {
      if (nivel >= desde && !existe(`${base}/${archivo}`)) {
        errores.push(`${base}: en estado ${estado} hace falta ${archivo}`);
      }
    };
    exige('aclaraciones.md', 1);
    exige('diseno.md', 2);
    exige('plan.md', 3);
    exige('tareas.md', 3);
    exige('verificacion.md', 5);

    if (existe(`${base}/tareas.md`)) {
      const enTareas = identificadores(leer(`${base}/tareas.md`), 'REQ');
      for (const r of requisitos) {
        if (!enTareas.has(r)) errores.push(`${base}: ${r} no tiene ninguna tarea`);
      }
    }
    if (existe(`${base}/verificacion.md`)) {
      const verif = leer(`${base}/verificacion.md`);
      const reqVerif = identificadores(verif, 'REQ');
      const caVerif = identificadores(verif, 'CA');
      for (const r of requisitos) {
        if (!reqVerif.has(r)) errores.push(`${base}: ${r} no tiene ninguna prueba en verificacion.md`);
      }
      for (const c of criterios) {
        if (!caVerif.has(c)) errores.push(`${base}: ${c} no tiene ninguna prueba en verificacion.md`);
      }
    }
  }
  return `${funciones.length} funciones`;
});

// ---------------------------------------------------------------------
// 4. Agentes
// ---------------------------------------------------------------------

const CAMPOS_AGENTE = new Set([
  'name', 'description', 'tools', 'disallowedTools', 'model', 'effort', 'permissionMode',
  'maxTurns', 'autoCompactWindow', 'skills', 'mcpServers', 'hooks', 'memory', 'background',
  'omitClaudeMd', 'isolation', 'color', 'initialPrompt', 'experimental',
]);
const MODELOS = new Set(['fable', 'opus', 'sonnet', 'haiku', 'inherit']);
const ESFUERZOS = new Set(['low', 'medium', 'high', 'xhigh', 'max']);
const SOLO_LECTURA = new Set(['auditor-seguridad', 'revisor', 'explorador']);

const skillsDisponibles = new Set(carpetas('.claude/skills'));
const agentes = new Map();

seccion('Agentes', () => {
  const nombres = archivos('.claude/agents').filter((n) => n.endsWith('.md'));
  if (nombres.length === 0) errores.push('No hay agentes en .claude/agents');
  for (const archivo of nombres) {
    const donde = `.claude/agents/${archivo}`;
    const campos = cabecera(leer(donde));
    if (!campos) {
      errores.push(`${donde}: no tiene cabecera`);
      continue;
    }
    const esperado = archivo.replace(/\.md$/, '');
    if (campos.name !== esperado) errores.push(`${donde}: name debe ser «${esperado}»`);
    if (!campos.description) errores.push(`${donde}: falta description`);
    else if (campos.description.includes(': ')) {
      errores.push(`${donde}: description contiene «: », que rompe la cabecera; reescríbela sin dos puntos`);
    }
    for (const clave of Object.keys(campos)) {
      if (!CAMPOS_AGENTE.has(clave)) errores.push(`${donde}: campo desconocido «${clave}» (se ignoraría sin aviso)`);
    }
    if (!campos.model) errores.push(`${donde}: falta model`);
    else if (!MODELOS.has(campos.model) && !campos.model.startsWith('claude-')) {
      errores.push(`${donde}: model «${campos.model}» no válido`);
    }
    if (campos.effort && !ESFUERZOS.has(campos.effort)) {
      errores.push(`${donde}: effort «${campos.effort}» no válido`);
    }
    const herramientas = campos.tools ?? '';
    if (!herramientas) errores.push(`${donde}: falta tools (heredaría todas las herramientas)`);
    if (esperado !== 'orquestador' && /\bAgent\b/.test(herramientas)) {
      errores.push(`${donde}: solo el orquestador puede lanzar agentes`);
    }
    if (SOLO_LECTURA.has(esperado) && /\b(Write|Edit|NotebookEdit)\b/.test(herramientas)) {
      errores.push(`${donde}: es de solo lectura y no puede tener herramientas de edición`);
    }
    for (const skill of (campos.skills ?? '').split(',').map((s) => s.trim()).filter(Boolean)) {
      if (!skillsDisponibles.has(skill)) errores.push(`${donde}: la skill «${skill}» no existe`);
    }
    agentes.set(esperado, campos);
  }
  return `${nombres.length} agentes`;
});

seccion('Enrutado: docs/EQUIPO.md coincide con los agentes', () => {
  if (!existe('docs/EQUIPO.md')) return '';
  let filas = 0;
  for (const linea of leer('docs/EQUIPO.md').split('\n')) {
    const m = linea.match(
      /^\|\s*`([a-z-]+)`\s*\|.*\|\s*`(fable|opus|sonnet|haiku)`\s*\|\s*`(low|medium|high|xhigh|max)`\s*\|\s*$/,
    );
    if (!m) continue;
    filas += 1;
    const [, nombre, modelo, esfuerzo] = m;
    const campos = agentes.get(nombre);
    if (!campos) {
      errores.push(`docs/EQUIPO.md: el agente «${nombre}» no existe en .claude/agents`);
      continue;
    }
    if (campos.model !== modelo) {
      errores.push(`Enrutado: «${nombre}» es ${campos.model} en su archivo y ${modelo} en docs/EQUIPO.md`);
    }
    if ((campos.effort ?? '') !== esfuerzo) {
      errores.push(`Enrutado: «${nombre}» tiene esfuerzo ${campos.effort ?? '(ninguno)'} en su archivo y ${esfuerzo} en docs/EQUIPO.md`);
    }
  }
  for (const nombre of agentes.keys()) {
    if (nombre !== 'orquestador' && !leer('docs/EQUIPO.md').includes(`\`${nombre}\``)) {
      errores.push(`docs/EQUIPO.md no menciona al agente «${nombre}»`);
    }
  }
  if (filas === 0) errores.push('docs/EQUIPO.md: no se encuentra la tabla de roles con modelo y esfuerzo');
  return `${filas} roles comparados`;
});

// ---------------------------------------------------------------------
// 5. Skills
// ---------------------------------------------------------------------

const CAMPOS_SKILL = new Set([
  'name', 'description', 'when_to_use', 'argument-hint', 'arguments', 'disable-model-invocation',
  'user-invocable', 'allowed-tools', 'disallowed-tools', 'model', 'effort', 'context', 'agent',
  'background', 'hooks', 'paths', 'shell', 'metadata',
]);

seccion('Skills', () => {
  const nombres = [...skillsDisponibles];
  if (nombres.length === 0) errores.push('No hay skills en .claude/skills');
  for (const nombre of nombres) {
    const donde = `.claude/skills/${nombre}/SKILL.md`;
    if (!existe(donde)) {
      errores.push(`${donde}: falta`);
      continue;
    }
    const campos = cabecera(leer(donde));
    if (!campos) {
      errores.push(`${donde}: no tiene cabecera`);
      continue;
    }
    if (campos.name !== nombre) errores.push(`${donde}: name debe ser «${nombre}»`);
    if (!campos.description) errores.push(`${donde}: falta description`);
    else if (campos.description.includes(': ')) {
      errores.push(`${donde}: description contiene «: », que rompe la cabecera; reescríbela sin dos puntos`);
    }
    for (const clave of Object.keys(campos)) {
      if (!CAMPOS_SKILL.has(clave)) errores.push(`${donde}: campo desconocido «${clave}»`);
    }
  }
  return `${nombres.length} skills`;
});

// ---------------------------------------------------------------------
// 6. Ajustes de Claude Code: solo reglas restrictivas
// ---------------------------------------------------------------------

seccion('Ajustes de Claude Code', () => {
  if (!existe('.claude/settings.json')) return '';
  let ajustes;
  try {
    ajustes = JSON.parse(leer('.claude/settings.json'));
  } catch (e) {
    errores.push(`.claude/settings.json: JSON no válido (${e.message})`);
    return '';
  }
  const permisos = ajustes.permissions ?? {};
  if (Array.isArray(permisos.allow) && permisos.allow.length > 0) {
    errores.push('.claude/settings.json: no debe ampliar permisos (permissions.allow). Lo decide una persona');
  }
  if (permisos.defaultMode) {
    errores.push('.claude/settings.json: no debe fijar el modo de permisos (permissions.defaultMode)');
  }
  if (ajustes.agent) {
    errores.push('.claude/settings.json: no debe fijar la clave agent (convertiría cualquier sesión en orquestador)');
  }
  const ganchos = JSON.stringify(ajustes.hooks ?? {});
  if (!ganchos.includes('bloquear-secretos.mjs')) {
    errores.push('.claude/settings.json: falta el gancho bloquear-secretos');
  }
  // Comprobado el 12/11/2026: declarado con "args", el gancho no llegaba a
  // ejecutarse en la app de escritorio y no bloqueaba nada, sin dar aviso.
  if (ganchos.includes('"args"')) {
    errores.push('.claude/settings.json: el gancho debe declararse como una sola cadena en "command", sin "args"');
  }
  return 'sin permisos ampliados';
});

// ---------------------------------------------------------------------
// 7. Registro de decisiones
// ---------------------------------------------------------------------

const ESTADOS_DECISION = new Set(['CONFIRMADO', 'PROPUESTO', 'VERIFICAR', 'BLOQUEADO', 'SUPERADO']);

seccion('Registro de decisiones', () => {
  if (!existe('docs/TECNOLOGIAS.md')) return '';
  let filas = 0;
  for (const linea of leer('docs/TECNOLOGIAS.md').split('\n')) {
    const m = linea.match(/^\|\s*([DTB]-\d{3})\s*\|/);
    if (!m) continue;
    filas += 1;
    const celdas = linea.split('|').map((c) => c.trim());
    if (!celdas.some((c) => ESTADOS_DECISION.has(c))) {
      errores.push(`docs/TECNOLOGIAS.md: ${m[1]} no tiene un estado válido`);
    }
  }
  if (filas === 0) errores.push('docs/TECNOLOGIAS.md: no se encuentra ninguna decisión');
  return `${filas} decisiones con estado`;
});

// ---------------------------------------------------------------------
// 8. Plan de fases
// ---------------------------------------------------------------------

seccion('Plan de fases', () => {
  if (!existe('docs/PLAN.md')) return '';
  const plan = leer('docs/PLAN.md');
  for (let fase = 0; fase <= 6; fase += 1) {
    const inicio = plan.indexOf(`\n## Fase ${fase}.`);
    if (inicio === -1) {
      errores.push(`docs/PLAN.md: falta la fase ${fase}`);
      continue;
    }
    const resto = plan.slice(inicio + 1);
    const fin = resto.indexOf('\n## ', 1);
    const texto = fin === -1 ? resto : resto.slice(0, fin);
    if (!texto.includes('**Criterios de aceptación**') || !/- \[[ x]\] /.test(texto)) {
      errores.push(`docs/PLAN.md: la fase ${fase} no tiene criterios de aceptación`);
    }
  }
  return 'fases 0 a 6 con criterios';
});

// ---------------------------------------------------------------------
// 9. Variables de entorno de ejemplo y secretos
// ---------------------------------------------------------------------

seccion('.env.example sin valores', () => {
  if (!existe('.env.example')) return '';
  let variables = 0;
  for (const linea of leer('.env.example').split('\n')) {
    if (!linea.trim() || linea.trim().startsWith('#')) continue;
    const m = linea.match(/^([A-Z][A-Z0-9_]*)=(.*)$/);
    if (!m) {
      errores.push(`.env.example: línea no reconocida («${linea.slice(0, 20)}…»)`);
      continue;
    }
    variables += 1;
    if (m[2].trim() !== '') errores.push(`.env.example: ${m[1]} lleva un valor. Aquí solo van nombres`);
  }
  return `${variables} variables`;
});

const SALTAR_CARPETAS = new Set(['.git', 'node_modules', '.next', '.vercel', 'coverage', 'dist', 'out']);
const BINARIOS = new Set(['.jpg', '.jpeg', '.png', '.gif', '.webp', '.ico', '.pdf', '.woff', '.woff2', '.zip']);

function* recorrer(dir) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const completa = join(dir, e.name);
    if (e.isDirectory()) {
      if (!SALTAR_CARPETAS.has(e.name)) yield* recorrer(completa);
    } else if (e.isFile() && !BINARIOS.has(extname(e.name).toLowerCase())) {
      yield completa;
    }
  }
}

seccion('Sin secretos en el repositorio', () => {
  let revisados = 0;
  for (const archivo of recorrer(RAIZ)) {
    revisados += 1;
    const encontrados = buscarSecretos(readFileSync(archivo, 'utf8'));
    if (encontrados.length > 0) {
      const rel = relative(RAIZ, archivo).replace(/\\/g, '/');
      errores.push(`Posible secreto en ${rel}: ${encontrados.join(', ')}`);
    }
  }
  return `${revisados} archivos revisados`;
});

// ---------------------------------------------------------------------
// Resultado
// ---------------------------------------------------------------------

// Avisos de tamaño (D-023): no hacen fallar, pero se listan.
const avisos = [];
const LIMITES = { 'diseno.md': 40000, 'especificacion.md': 25000, 'plan.md': 25000, 'tareas.md': 25000 };
for (const carpeta of readdirSync(join(RAIZ, 'specs'))) {
  if (carpeta.startsWith('_')) continue;
  for (const [archivo, limite] of Object.entries(LIMITES)) {
    const ruta = join(RAIZ, 'specs', carpeta, archivo);
    if (!existsSync(ruta)) continue;
    const kb = statSync(ruta).size;
    if (kb > limite) avisos.push(`specs/${carpeta}/${archivo}: ${Math.round(kb / 1000)} KB (límite ${limite / 1000} KB)`);
  }
}

console.log('Comprobador del arnés\n');
for (const s of secciones) {
  console.log(`  ${s.ok ? 'OK   ' : 'ERROR'}  ${s.nombre}${s.detalle ? ` (${s.detalle})` : ''}`);
}

if (avisos.length > 0) {
  console.log(`\n${avisos.length} ${avisos.length === 1 ? 'aviso' : 'avisos'} de tamaño (D-023; se recortan solo al reescribirlos, D-031):`);
  for (const a of avisos) console.log(`  - ${a}`);
}

if (errores.length > 0) {
  console.log(`\n${errores.length} ${errores.length === 1 ? 'error' : 'errores'}:`);
  for (const e of errores) console.log(`  - ${e}`);
  console.log('\nRESULTADO: FALLIDO');
  process.exit(1);
}

console.log('\nRESULTADO: SUPERADO');
console.log('Es una comprobación documental. No prueba seguridad ni comportamiento.');
