import { useEffect, useState } from 'react';
import { appRoutes } from '@/lib/routes';

export type DeveloperSessionState =
  | { status: 'loading' }
  | { status: 'unavailable' }
  | { status: 'anonymous' }
  | { status: 'authenticated'; email: string };

type SessionPayload = { email: string | null; configured?: boolean };

/**
 * La cabecera monta el hook en todas las páginas y algunos clientes del
 * dashboard lo montan a la vez, así que la petición se comparte entre todos los
 * consumidores de la misma carga de página.
 */
let pending: Promise<DeveloperSessionState> | null = null;

function fetchSession(): Promise<DeveloperSessionState> {
  if (pending) return pending;

  pending = fetch(appRoutes.api.authSession())
    .then((response) => response.json())
    .then((data: SessionPayload): DeveloperSessionState => {
      if (data.email) return { status: 'authenticated', email: data.email };
      return data.configured === false ? { status: 'unavailable' } : { status: 'anonymous' };
    })
    .catch((): DeveloperSessionState => ({ status: 'anonymous' }));

  return pending;
}

/** Olvida la respuesta cacheada. Pensado para los tests. */
export function resetDeveloperSessionCache(): void {
  pending = null;
}

/**
 * Reads the developer login session from the browser. Dashboard features that
 * hit credentialed API routes use this to decide between rendering the action
 * and pointing the visitor at the login.
 */
export function useDeveloperSession(): DeveloperSessionState {
  const [session, setSession] = useState<DeveloperSessionState>({ status: 'loading' });

  useEffect(() => {
    let cancelled = false;

    void fetchSession().then((next) => {
      if (!cancelled) setSession(next);
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
