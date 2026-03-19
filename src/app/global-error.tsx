'use client';

import { useEffect } from 'react';
import { captureExceptionWithContext } from '@/lib/sentry-reporting';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    captureExceptionWithContext(error, {
      area: 'app.global-error',
      operation: 'GlobalError',
      extra: {
        digest: error.digest,
      },
    });
    console.error('[GlobalError]', error);
  }, [error]);

  return (
    <html lang="es">
      <body>
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-4">
          <h2 className="text-2xl font-bold">Algo salió mal</h2>
          <p className="text-[var(--muted)]">Se ha producido un error inesperado. Inténtalo de nuevo.</p>
          <button
            onClick={() => reset()}
            className="rounded-lg bg-red-600 px-4 py-2 font-semibold text-white"
          >
            Reintentar
          </button>
        </div>
      </body>
    </html>
  );
}
