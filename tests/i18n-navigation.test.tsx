import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { locationMock } = vi.hoisted(() => ({
  locationMock: vi.fn(),
}));

vi.mock('@tanstack/react-router', async () => {
  const actual = await vi.importActual<typeof import('@tanstack/react-router')>('@tanstack/react-router');
  return {
    ...actual,
    Link: ({ children, to, href, ...props }: { children: React.ReactNode; to?: string; href?: string }) => (
      <a href={to ?? href} {...props}>
        {children}
      </a>
    ),
    useLocation: () => locationMock(),
  };
});

import Footer from '@/components/Footer';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { translateNavLabel } from '@/lib/i18n/nav-labels';
import { PUBLIC_MAIN_NAV_ITEMS } from '@/lib/public-navigation';

beforeEach(() => {
  locationMock.mockReset();
});

describe('navigation i18n', () => {
  it('keeps Spanish labels when rendering in Spanish', () => {
    for (const item of PUBLIC_MAIN_NAV_ITEMS) {
      expect(translateNavLabel('es', item)).toBe(item.label);
    }
  });

  it('falls back to the Spanish label for unknown items', () => {
    expect(translateNavLabel('en', { id: 'nuevo', label: 'Nuevo' })).toBe('Nuevo');
  });

  it('renders the footer in Spanish by default and in English under /en', () => {
    locationMock.mockReturnValue({ pathname: '/', publicHref: '/' });
    const es = renderToStaticMarkup(<Footer footerData={undefined} />);
    expect(es).toContain('Preguntas frecuentes');
    expect(es).toContain('Datos abiertos vía');

    locationMock.mockReturnValue({ pathname: '/', publicHref: '/en' });
    const en = renderToStaticMarkup(<Footer footerData={undefined} />);
    expect(en).toContain('FAQ');
    expect(en).toContain('Open data via the');
    expect(en).not.toContain('Preguntas frecuentes');
  });
});

describe('language switcher', () => {
  it('links the English twin from a translated Spanish page', () => {
    locationMock.mockReturnValue({ pathname: '/metodologia', publicHref: '/metodologia' });
    const html = renderToStaticMarkup(<LanguageSwitcher />);
    expect(html).toContain('href="/en/metodologia"');
    expect(html.toLowerCase()).toContain('hreflang="en"');
  });

  it('links back to Spanish from the English page', () => {
    locationMock.mockReturnValue({ pathname: '/', publicHref: '/en' });
    expect(renderToStaticMarkup(<LanguageSwitcher />)).toContain('href="/"');

    locationMock.mockReturnValue({ pathname: '/metodologia', publicHref: '/en/metodologia' });
    expect(renderToStaticMarkup(<LanguageSwitcher />)).toContain('href="/metodologia"');
  });

  it('renders nothing on routes without an English version', () => {
    locationMock.mockReturnValue({ pathname: '/comparar', publicHref: '/comparar' });
    expect(renderToStaticMarkup(<LanguageSwitcher />)).toBe('');
  });
});
