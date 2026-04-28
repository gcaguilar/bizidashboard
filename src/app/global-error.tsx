'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
          <Card className="w-full max-w-lg items-center text-center">
            <CardHeader className="items-center">
              <CardTitle className="text-2xl font-bold text-[var(--foreground)]">Algo salió mal</CardTitle>
              <CardDescription className="text-[var(--muted)]">
                Se ha producido un error inesperado. Inténtalo de nuevo.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center">
              <Button
                onClick={() => reset()}
                className="min-h-11 rounded-xl bg-red-600 px-4 py-2 font-semibold text-white hover:bg-red-700"
              >
                Reintentar
              </Button>
            </CardContent>
          </Card>
        </div>
      </body>
    </html>
  );
}
