import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import type { DeveloperSessionState } from '@/lib/use-developer-session';

const sessionState = vi.hoisted(() => ({ current: { status: 'loading' } as DeveloperSessionState }));

vi.mock('@/lib/use-developer-session', () => ({
  useDeveloperSession: () => sessionState.current,
}));

vi.mock('@tanstack/react-router', () => ({
  useLocation: () => ({ href: '/estaciones?orden=nombre', pathname: '/estaciones' }),
}));

vi.mock('@/app/_components/TrackedLink', () => ({
  TrackedLink: ({
    children,
    href,
    ctaEvent: _ctaEvent,
    ...props
  }: {
    children: React.ReactNode;
    href: string;
    ctaEvent?: unknown;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

const { HeaderSession } = await import('@/components/HeaderSession');

function render(state: DeveloperSessionState): string {
  sessionState.current = state;
  return renderToStaticMarkup(<HeaderSession />);
}

describe('HeaderSession', () => {
  it('renders nothing while the session is loading', () => {
    expect(render({ status: 'loading' })).toBe('');
  });

  it('renders nothing when the developer login is not configured', () => {
    expect(render({ status: 'unavailable' })).toBe('');
  });

  it('offers a login that returns the visitor to the current page', () => {
    const markup = render({ status: 'anonymous' });

    expect(markup).toContain('Iniciar sesión');
    expect(markup).toContain(
      `href="/api/auth/login?returnTo=${encodeURIComponent('/estaciones?orden=nombre')}"`
    );
  });

  it('shows the account button for a signed-in visitor', () => {
    const markup = render({ status: 'authenticated', email: 'dev@example.com' });

    expect(markup).toContain('dev@example.com');
    expect(markup).toContain('aria-expanded="false"');
    // El menú sólo se monta al abrirlo.
    expect(markup).not.toContain('Cerrar sesión');
  });
});
