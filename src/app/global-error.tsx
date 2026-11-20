"use client";

// Sustituye al layout raíz, por eso lleva su propio html y body.
export default function ErrorGlobal({
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <html lang="es">
      <head>
        <title>Error</title>
      </head>
      <body>
        <main>
          <div role="alert">
            <h1>Error</h1>
            <p>Se ha producido un error. Inténtalo de nuevo más tarde.</p>
            <button type="button" onClick={() => retry()}>
              Reintentar
            </button>
          </div>
        </main>
      </body>
    </html>
  );
}
