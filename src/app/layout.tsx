import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "../components/estilos/valores.css";
import "../components/estilos/base.css";
import { TEXTOS } from "../components/textos";

// Título del documento (REQ-005; diseño 020, «Armazón»): «<título de la vista> · <producto>».
// Cada vista declara su título, distinto de los demás y sin datos (A-10): el historial del
// navegador lo guarda junto a la dirección. El nombre sale de una sola constante.
export const metadata: Metadata = {
  title: {
    default: TEXTOS.marca.nombreProducto,
    template: `%s · ${TEXTOS.marca.nombreProducto}`,
  },
  robots: { index: false, follow: false },
};

// Sin escala máxima ni `user-scalable`: el zum no se bloquea (REQ-041). `colorScheme` declara los
// dos temas para que los controles nativos y las barras de desplazamiento sigan el del sistema
// (REQ-088).
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  colorScheme: "light dark",
};

// El `main` no está aquí: lo pone cada vista (el armazón, con el destino del enlace de salto, o la
// propia página). Así no hay dos `main` anidados.
export default function DisenoRaiz({ children }: { children: ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
