'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { appRoutes } from '@/lib/routes';

type SubscribeState = 'idle' | 'sending' | 'done' | 'already' | 'error';

/**
 * Alta en la suscripción al informe mensual (doble opt-in). El formulario pide
 * el correo, el servidor manda el enlace de confirmación y aquí solo se
 * refleja el resultado; la confirmación ocurre fuera de la página.
 */
export function ReportSubscribeCard() {
  const [email, setEmail] = useState('');
  const [state, setState] = useState<SubscribeState>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState('sending');
    setErrorMessage(null);

    try {
      const response = await fetch(appRoutes.api.reportSubscribe(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = (await response.json().catch(() => null)) as
        | { status?: string; error?: string }
        | null;

      if (!response.ok) {
        setErrorMessage(data?.error ?? 'No se pudo completar la suscripción. Inténtalo de nuevo.');
        setState('error');
        return;
      }

      setState(data?.status === 'already_confirmed' ? 'already' : 'done');
      setEmail('');
    } catch {
      setErrorMessage('No se pudo conectar. Inténtalo de nuevo en unos minutos.');
      setState('error');
    }
  }

  return (
    <section className="ui-section-card ui-print-hide">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 max-w-2xl">
          <h2 className="text-xl font-black text-[var(--foreground)]">
            Recibe el informe mensual en tu correo
          </h2>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Cuando se cierra cada mes publicamos el informe y te lo enviamos con el resumen
            ejecutivo, los titulares y el enlace al informe y a su PDF. Puedes darte de baja desde
            cualquier envío.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex w-full max-w-md flex-col gap-2 sm:w-auto">
          <label className="text-xs font-semibold text-[var(--muted)]" htmlFor="report-subscribe-email">
            Tu correo electrónico
          </label>
          <div className="flex flex-wrap gap-2">
            <Input
              id="report-subscribe-email"
              type="email"
              name="email"
              required
              autoComplete="email"
              placeholder="tu@correo.es"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="min-w-0 flex-1"
            />
            <button type="submit" className="ui-primary-button" disabled={state === 'sending'}>
              {state === 'sending' ? 'Enviando…' : 'Suscribirme'}
            </button>
          </div>
          <p className="text-[11px] text-[var(--muted)]">
            Te enviaremos un correo para confirmar la suscripción (doble opt-in).
          </p>
        </form>
      </div>

      {state === 'done' ? (
        <p className="mt-3 rounded-md border border-[var(--border)] px-3 py-2 text-sm font-semibold text-[var(--primary)]">
          Revisa tu correo: te hemos enviado un enlace para confirmar la suscripción.
        </p>
      ) : null}
      {state === 'already' ? (
        <p className="mt-3 rounded-md border border-[var(--border)] px-3 py-2 text-sm font-semibold text-[var(--foreground)]">
          Este correo ya está suscrito al informe mensual.
        </p>
      ) : null}
      {state === 'error' && errorMessage ? (
        <p role="alert" className="mt-3 rounded-md border border-[var(--border)] px-3 py-2 text-sm font-semibold text-[var(--warning)]">
          {errorMessage}
        </p>
      ) : null}
    </section>
  );
}
