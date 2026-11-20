"use client";

// Texto fijo: nunca se muestra el mensaje, la traza ni el digest del error (art. 1, REQ-019).
export default function ErrorPagina({
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <div role="alert">
      <h1>Error</h1>
      <p>Se ha producido un error. Inténtalo de nuevo más tarde.</p>
      <button type="button" onClick={() => retry()}>
        Reintentar
      </button>
    </div>
  );
}
