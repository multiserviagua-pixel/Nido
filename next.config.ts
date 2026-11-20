import type { NextConfig } from "next";
import { leerEntorno } from "./src/lib/plataforma/configuracion";

// Cabeceras de seguridad de «App base» (diseño 002). HSTS lo pone la plataforma;
// la política de contenidos completa llega con la fase 3.
const cabecerasGenerales = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "no-referrer" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "X-Robots-Tag", value: "noindex" },
];

// Control 1 de la muestra (diseño 020, «Cómo no existe en producción»; T-004). Los archivos de
// ruta de la muestra son `page.muestra.tsx` y `layout.muestra.tsx`: solo son rutas si se añade la
// extensión `muestra.tsx`, y eso solo con `ENTORNO` exactamente `desarrollo` o `preproduccion`,
// leído a través de `configuracion.ts`. Cierre en fallo: cualquier otro valor, ninguno o un fallo
// al leerlo dejan las extensiones por defecto y la muestra fuera de la compilación.
const EXTENSIONES_POR_DEFECTO = ["tsx", "ts", "jsx", "js"];
const EXTENSION_DE_LA_MUESTRA = "muestra.tsx";
const ENTORNOS_CON_MUESTRA: readonly string[] = ["desarrollo", "preproduccion"];

function extensionesDePagina(): string[] {
  let entorno: string | undefined;
  try {
    entorno = leerEntorno();
  } catch {
    entorno = undefined;
  }
  return entorno !== undefined && ENTORNOS_CON_MUESTRA.includes(entorno)
    ? [...EXTENSIONES_POR_DEFECTO, EXTENSION_DE_LA_MUESTRA]
    : [...EXTENSIONES_POR_DEFECTO];
}

const configuracion: NextConfig = {
  poweredByHeader: false,
  pageExtensions: extensionesDePagina(),
  async headers() {
    return [
      { source: "/:path*", headers: cabecerasGenerales },
      // Excepción (001, C-4): la pantalla de autorización necesita el origen propio.
      {
        source: "/oauth/autorizar",
        headers: [{ key: "Referrer-Policy", value: "same-origin" }],
      },
    ];
  },
};

export default configuracion;
