import { useEffect, useState } from 'react';
import { appRoutes } from '@/lib/routes';

export type DeveloperSessionState =
  | { status: 'loading' }
  | { status: 'anonymous' }
  | { status: 'authenticated'; email: string };

/**
 * Reads the developer login session from the browser. Dashboard features that
 * hit credentialed API routes use this to decide between rendering the action
 * and pointing the visitor at the login.
 */
export function useDeveloperSession(): DeveloperSessionState {
  const [session, setSession] = useState<DeveloperSessionState>({ status: 'loading' });

  useEffect(() => {
    let cancelled = false;

    fetch(appRoutes.api.authSession())
      .then((response) => response.json())
      .then((data: { email: string | null }) => {
        if (cancelled) return;
        setSession(data.email ? { status: 'authenticated', email: data.email } : { status: 'anonymous' });
      })
      .catch(() => {
        if (!cancelled) setSession({ status: 'anonymous' });
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return session;
}

/** Login URL that returns the visitor to where they were. */
export function buildLoginHref(returnTo: string): string {
  return appRoutes.api.authLogin({ returnTo });
}
