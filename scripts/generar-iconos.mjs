// Genera los iconos de la aplicación a partir del logotipo C «Nido en anillo» (020, T-015 (b)):
//   src/app/icon.svg        pestaña del navegador (forma simplificada, sin anillo interior)
//   src/app/favicon.ico     16, 32 y 48 px, PNG dentro de ICO
//   src/app/apple-icon.png  180 px, fondo a sangre (iOS redondea las esquinas)
// Sin dependencias nuevas: dibuja con el Chromium de Playwright, que ya es de desarrollo, y escribe
// el ICO a mano. Los colores son los de `valores.css` (acento 550 a 700 y blanco); este archivo no
// forma parte de la aplicación. Uso: node scripts/generar-iconos.mjs
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { chromium } from "@playwright/test";

const RAIZ = resolve(import.meta.dirname, "..");
const ACENTO_CLARO = "#7344F0";
const ACENTO_OSCURO = "#5B2BD6";
const BLANCO = "#FFFFFF";
const SUAVE = "#EFE9FF";

/** Marca en blanco sobre el degradado del acento. `completo`: con anillo interior (≥ 48 px). */
function svg({ completo, aSangre }) {
  const marca = completo
    ? `<path d="M32 8 A24 24 0 1 1 8 32" fill="none" stroke="${BLANCO}" stroke-width="7" stroke-linecap="round"/>
    <circle cx="32" cy="8" r="5" fill="${BLANCO}"/><circle cx="8" cy="32" r="5" fill="${BLANCO}"/>
    <circle cx="32" cy="32" r="13" fill="none" stroke="${SUAVE}" stroke-width="5.6"/>
    <ellipse cx="32" cy="32" rx="5" ry="6.5" fill="${BLANCO}"/>`
    : `<path d="M32 8 A24 24 0 1 1 8 32" fill="none" stroke="${BLANCO}" stroke-width="8" stroke-linecap="round"/>
    <circle cx="32" cy="8" r="6" fill="${BLANCO}"/><circle cx="8" cy="32" r="6" fill="${BLANCO}"/>
    <ellipse cx="32" cy="32" rx="8" ry="10" fill="${BLANCO}"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
  <title>Nido: Agentes de Correo</title>
  <defs><linearGradient id="fondo" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${ACENTO_CLARO}"/><stop offset="1" stop-color="${ACENTO_OSCURO}"/></linearGradient></defs>
  <rect width="64" height="64"${aSangre ? "" : ' rx="14"'} fill="url(#fondo)"/>
  <g transform="translate(7 7) scale(0.78)">
    ${marca}
  </g>
</svg>
`;
}

const navegador = await chromium.launch();
async function png(codigo, lado) {
  const pagina = await navegador.newPage({ viewport: { width: lado, height: lado } });
  await pagina.setContent(
    `<style>html,body{margin:0;background:transparent}svg{display:block;width:${lado}px;height:${lado}px}</style>${codigo}`,
  );
  const datos = await pagina.screenshot({ omitBackground: true, type: "png" });
  await pagina.close();
  return datos;
}

/** ICO con una imagen PNG por tamaño (válido desde Windows Vista y en todos los navegadores). */
function ico(imagenes) {
  const cabecera = Buffer.alloc(6 + 16 * imagenes.length);
  cabecera.writeUInt16LE(0, 0);
  cabecera.writeUInt16LE(1, 2);
  cabecera.writeUInt16LE(imagenes.length, 4);
  let desplazamiento = cabecera.length;
  imagenes.forEach(({ lado, datos }, i) => {
    const e = 6 + 16 * i;
    cabecera.writeUInt8(lado, e);
    cabecera.writeUInt8(lado, e + 1);
    cabecera.writeUInt16LE(1, e + 4);
    cabecera.writeUInt16LE(32, e + 6);
    cabecera.writeUInt32LE(datos.length, e + 8);
    cabecera.writeUInt32LE(desplazamiento, e + 12);
    desplazamiento += datos.length;
  });
  return Buffer.concat([cabecera, ...imagenes.map((i) => i.datos)]);
}

const pequeno = svg({ completo: false, aSangre: false });
writeFileSync(resolve(RAIZ, "src/app/icon.svg"), pequeno);
const imagenes = [];
for (const lado of [16, 32]) imagenes.push({ lado, datos: await png(pequeno, lado) });
imagenes.push({ lado: 48, datos: await png(svg({ completo: true, aSangre: false }), 48) });
writeFileSync(resolve(RAIZ, "src/app/favicon.ico"), ico(imagenes));
writeFileSync(
  resolve(RAIZ, "src/app/apple-icon.png"),
  await png(svg({ completo: true, aSangre: true }), 180),
);
await navegador.close();
console.log("Iconos generados: icon.svg, favicon.ico (16, 32, 48) y apple-icon.png (180).");
