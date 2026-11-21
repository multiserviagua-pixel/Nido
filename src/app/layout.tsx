import type { Metadata } from "next";
import type { ReactNode } from "react";
import "../components/estilos/valores.css";
import "../components/estilos/base.css";

export const metadata: Metadata = {
  title: "Nido",
  robots: { index: false, follow: false },
};

export default function DisenoRaiz({ children }: { children: ReactNode }) {
  return (
    <html lang="es">
      <body>
        <main>{children}</main>
      </body>
    </html>
  );
}
