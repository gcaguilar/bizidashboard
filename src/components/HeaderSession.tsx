'use client';

import { useLocation } from '@tanstack/react-router';
import { useState } from 'react';
import { TrackedLink } from '@/app/_components/TrackedLink';
import { Button } from '@/components/ui/button';
import { appRoutes } from '@/lib/routes';
import { useDeveloperSession } from '@/lib/use-developer-session';
import { useDismissOnOutsideClick } from '@/lib/use-dismiss-on-outside-click';

const KEYS_HREF = `${appRoutes.developers()}#register-api`;

/**
 * Zona de sesión de la cabecera: hasta ahora el login sólo se ofrecía dentro del
 * portal de desarrolladores, así que un visitante no descubría que podía
 * autenticarse. Aquí queda visible en todas las páginas.
 */
export function HeaderSession() {
  const session = useDeveloperSession();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  useDismissOnOutsideClick(menuOpen, '[data-account-menu]', () => setMenuOpen(false));

  // Ni durante la carga ni cuando el despliegue no tiene login configurado
  // pintamos nada: el botón llevaría a un 503 y el parpadeo molesta.
  if (session.status === 'loading' || session.status === 'unavailable') {
    return null;
  }

  if (session.status === 'anonymous') {
    // Navegación al servidor (arranca el flujo de Auth0), no una ruta del router.
    // `href` es pathname + search + hash, y siempre empieza por '/', que es lo
    // que exige `isSafeReturnTo` en /api/auth/login.
    return (
      <Button asChild size="sm">
        <a href={appRoutes.api.authLogin({ returnTo: location.href })}>Iniciar sesión</a>
      </Button>
    );
  }

  const [emailLocalPart] = session.email.split('@');

  return (
    <div className="relative" data-account-menu>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setMenuOpen((open) => !open)}
        aria-haspopup="menu"
        aria-expanded={menuOpen}
        className="max-w-[10rem] font-semibold text-[var(--muted)] hover:text-[var(--foreground)]"
      >
        <span className="truncate">
          <span className="sm:hidden">{emailLocalPart}</span>
          <span className="hidden sm:inline">{session.email}</span>
        </span>
        <span aria-hidden="true">▾</span>
      </Button>

      {menuOpen && (
        <div
          role="menu"
          className="absolute right-0 top-full mt-2 flex min-w-[13rem] flex-col gap-1 rounded-xl border border-[var(--border)] bg-[var(--card)] p-2 shadow-lg"
        >
          <p className="truncate px-3 py-1 text-xs text-[var(--muted)]" title={session.email}>
            {session.email}
          </p>
          <TrackedLink
            href={KEYS_HREF}
            role="menuitem"
            ctaEvent={{
              source: 'header_main',
              ctaId: 'api',
              destination: 'api',
              sourceRole: 'utility',
              destinationRole: 'hub',
              transitionKind: 'within_public',
            }}
            className="rounded-lg px-3 py-2 text-sm text-[var(--muted)] hover:bg-[var(--secondary)] hover:text-[var(--foreground)] transition"
          >
            Mis claves de API
          </TrackedLink>
          <a
            href={appRoutes.api.authLogout()}
            role="menuitem"
            className="rounded-lg px-3 py-2 text-sm text-[var(--muted)] hover:bg-[var(--secondary)] hover:text-[var(--foreground)] transition"
          >
            Cerrar sesión
          </a>
        </div>
      )}
    </div>
  );
}
