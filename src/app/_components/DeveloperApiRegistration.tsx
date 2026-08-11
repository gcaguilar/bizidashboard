'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { appRoutes } from '@/lib/routes';

type SessionState = { status: 'loading' } | { status: 'anonymous' } | { status: 'authenticated'; email: string };

type Credentials = {
  clientId: string;
  clientSecret: string;
  tokenUrl: string;
  audience: string | null;
};

export function DeveloperApiRegistration() {
  const [session, setSession] = useState<SessionState>({ status: 'loading' });
  const [name, setName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [credentials, setCredentials] = useState<Credentials | null>(null);

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

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const response = await fetch(appRoutes.api.developerRegister(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? 'No se pudo registrar el cliente.');
        return;
      }

      setCredentials(data);
    } catch {
      setError('No se pudo registrar el cliente. Inténtalo de nuevo.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="ui-section-card" id="register-api">
      <div>
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--muted)]">
          Acceso OAuth
        </p>
        <h2 className="text-xl font-black text-[var(--foreground)]">Regístrate para obtener credenciales de API</h2>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Inicia sesión para generar una aplicación M2M en Auth0 y obtener un <code>client_id</code>/<code>client_secret</code> con
          rate limit propio, en vez de compartir <code>X-Public-Api-Key</code>.
        </p>
      </div>

      {session.status === 'loading' ? null : session.status === 'anonymous' ? (
        <Button asChild>
          <a href={appRoutes.api.authLogin({ returnTo: '/developers#register-api' })}>
            Iniciar sesión para registrarte
          </a>
        </Button>
      ) : credentials ? (
        <Card variant="stat" className="space-y-3 p-4">
          <p className="text-sm font-semibold text-[var(--foreground)]">
            Guarda estas credenciales ahora — el secreto no se volverá a mostrar.
          </p>
          <div className="space-y-2 text-xs">
            <p><span className="font-bold">client_id:</span> <code className="break-all">{credentials.clientId}</code></p>
            <p><span className="font-bold">client_secret:</span> <code className="break-all">{credentials.clientSecret}</code></p>
            <p><span className="font-bold">token_url:</span> <code className="break-all">{credentials.tokenUrl}</code></p>
            {credentials.audience ? (
              <p><span className="font-bold">audience:</span> <code className="break-all">{credentials.audience}</code></p>
            ) : null}
          </div>
        </Card>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-[200px]">
            <label htmlFor="developer-app-name" className="text-xs font-semibold text-[var(--muted)]">
              Nombre de la aplicación
            </label>
            <Input
              id="developer-app-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Mi integración"
              required
              minLength={2}
              maxLength={100}
            />
          </div>
          <Button type="submit" disabled={submitting}>
            {submitting ? 'Registrando…' : 'Crear credenciales'}
          </Button>
          <span className="text-xs text-[var(--muted)]">
            Sesión: {session.status === 'authenticated' ? session.email : ''} ·{' '}
            <a href={appRoutes.api.authLogout()} className="ui-inline-action">Cerrar sesión</a>
          </span>
        </form>
      )}

      {error ? <p className="text-sm text-red-500">{error}</p> : null}
    </section>
  );
}
