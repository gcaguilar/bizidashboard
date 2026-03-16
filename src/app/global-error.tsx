'use client';

import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[GlobalError]', error);
  }, [error]);

  return (
    <html lang="es">
      <body className="antialiased">
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[var(--background)] p-4 text-[var(--foreground)]">
          <h2 className="text-2xl font-bold">Algo salió mal</h2>
          <p className="text-[var(--muted)]">Error: {error.message}</p>
          <button
            onClick={() => reset()}
            className="rounded-lg bg-[var(--accent)] px-4 py-2 font-semibold text-white"
          >
            Reintentar
          </button>
        </div>
      </body>
    </html>
  );
}
