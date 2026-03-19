'use client';

import { useEffect } from 'react';
import { captureExceptionWithContext } from '@/lib/sentry-reporting';

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return;
    }

    const registerServiceWorker = async () => {
      try {
        await navigator.serviceWorker.register('/service-worker.js', {
          scope: '/',
        });
      } catch (error) {
        captureExceptionWithContext(error, {
          area: 'pwa.service-worker',
          operation: 'register',
        });
        console.error('[PWA] No se pudo registrar el service worker.', error);
      }
    };

    void registerServiceWorker();
  }, []);

  return null;
}
