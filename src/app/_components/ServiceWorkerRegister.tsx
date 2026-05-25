'use client';

import { useEffect } from 'react';

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return;
    }

    fetch('/sw.js', { method: 'HEAD' })
      .then((res) => {
        if (res.ok) {
          navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(() => {});
        }
      })
      .catch(() => {});
  }, []);

  return null;
}
