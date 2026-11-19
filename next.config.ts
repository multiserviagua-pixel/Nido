import type { NextConfig } from "next";

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

const configuracion: NextConfig = {
  poweredByHeader: false,
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
