'use client';

import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { appRoutes } from '@/lib/routes';
import { useDeveloperSession } from '@/lib/use-developer-session';

type ApiKeySummary = {
  id: string;
  name: string;
  keyPrefix: string;
  createdAt: string;
  lastUsedAt: string | null;
  requestCount: number;
};

type CreatedKey = {
  apiKey: string;
  name: string;
  header: string;
  rateLimit: { limit: number; windowMs: number };
};

function formatDate(value: string | null): string {
  if (!value) return 'sin usar';
  return new Date(value).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function DeveloperApiRegistration() {
  const session = useDeveloperSession();
  const [name, setName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdKey, setCreatedKey] = useState<CreatedKey | null>(null);
  const [keys, setKeys] = useState<ApiKeySummary[]>([]);
  const [maxKeys, setMaxKeys] = useState<number | null>(null);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const loadKeys = useCallback(async () => {
    try {
      const response = await fetch(appRoutes.api.developerKeys());
      if (!response.ok) return;
      const data: { keys: ApiKeySummary[]; maxKeys: number } = await response.json();
      setKeys(data.keys);
      setMaxKeys(data.maxKeys);
    } catch {
      // Listing is best-effort: the create form still works without it.
    }
  }, []);

  useEffect(() => {
    if (session.status === 'authenticated') {
      void loadKeys();
    }
  }, [session.status, loadKeys]);

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
        setError(data.error ?? 'No se pudo crear la clave.');
        return;
      }

      setCreatedKey(data);
      setName('');
      await loadKeys();
    } catch {
      setError('No se pudo crear la clave. Inténtalo de nuevo.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRevoke(keyId: string) {
    setError(null);
    setRevokingId(keyId);

    try {
      const response = await fetch(appRoutes.api.developerRevoke(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyId }),
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? 'No se pudo revocar la clave.');
        return;
      }

      await loadKeys();
    } catch {
      setError('No se pudo revocar la clave. Inténtalo de nuevo.');
    } finally {
      setRevokingId(null);
    }
  }

  async function handleCopy(value: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  const atLimit = maxKeys !== null && keys.length >= maxKeys;

  return (
    <section className="ui-section-card" id="register-api">
      <div>
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--muted)]">
          Clave de API
        </p>
        <h2 className="text-xl font-black text-[var(--foreground)]">Consigue tu clave</h2>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Inicia sesión y crea una clave personal. La envías en la cabecera <code>x-api-key</code> y tiene su propio
          límite de peticiones, independiente del resto de usuarios.
        </p>
      </div>

      {session.status === 'loading' ? null : session.status === 'unavailable' ? (
        <p className="text-sm text-[var(--muted)]">
          El inicio de sesión no está disponible en este despliegue.
        </p>
      ) : session.status === 'anonymous' ? (
        <Button asChild>
          <a href={appRoutes.api.authLogin({ returnTo: '/developers#register-api' })}>
            Iniciar sesión para crear tu clave
          </a>
        </Button>
      ) : (
        <>
          {createdKey ? (
            <Card variant="stat" className="space-y-3 p-4">
              <p className="text-sm font-semibold text-[var(--foreground)]">
                Copia la clave ahora — no se volverá a mostrar.
              </p>
              <code className="block break-all rounded bg-[var(--muted-bg,rgba(0,0,0,0.06))] p-2 text-xs">
                {createdKey.apiKey}
              </code>
              <Button variant="outline" size="sm" onClick={() => handleCopy(createdKey.apiKey)}>
                {copied ? 'Copiado' : 'Copiar clave'}
              </Button>
              <div className="space-y-1 text-xs text-[var(--muted)]">
                <p>
                  Límite: {createdKey.rateLimit.limit} peticiones cada{' '}
                  {Math.round(createdKey.rateLimit.windowMs / 1000)} s.
                </p>
                <p className="font-semibold text-[var(--foreground)]">Ejemplo:</p>
                <code className="block break-all">
                  curl -H &quot;x-api-key: {createdKey.apiKey.slice(0, 16)}…&quot; …
                </code>
              </div>
            </Card>
          ) : null}

          <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3">
            <div className="flex-1 min-w-[200px]">
              <label htmlFor="developer-app-name" className="text-xs font-semibold text-[var(--muted)]">
                ¿Para qué la vas a usar?
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
            <Button type="submit" disabled={submitting || atLimit}>
              {submitting ? 'Creando…' : 'Crear clave'}
            </Button>
            <span className="text-xs text-[var(--muted)]">Sesión: {session.email}</span>
          </form>
          <form method="post" action={appRoutes.api.authLogout()} className="mt-2">
            <button type="submit" className="ui-inline-action text-xs">Cerrar sesión</button>
          </form>

          {atLimit ? (
            <p className="text-xs text-[var(--muted)]">
              Has alcanzado el máximo de {maxKeys} claves activas. Revoca una para crear otra.
            </p>
          ) : null}

          {keys.length > 0 ? (
            <div className="space-y-2 border-t border-[var(--border)] pt-4">
              <p className="text-xs font-semibold text-[var(--muted)]">Tus claves activas</p>
              {keys.map((key) => (
                <div key={key.id} className="flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div>
                    <p className="font-semibold text-[var(--foreground)]">{key.name}</p>
                    <p className="text-[var(--muted)]">
                      <code>{key.keyPrefix}…</code> · creada {formatDate(key.createdAt)} · último uso{' '}
                      {formatDate(key.lastUsedAt)} · {key.requestCount} peticiones
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={revokingId === key.id}
                    onClick={() => handleRevoke(key.id)}
                  >
                    {revokingId === key.id ? 'Revocando…' : 'Revocar'}
                  </Button>
                </div>
              ))}
            </div>
          ) : null}
        </>
      )}

      {error ? <p className="text-sm text-red-500">{error}</p> : null}
    </section>
  );
}
