import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { HomeExploreSection } from '@/app/_components/HomeExploreSection';

vi.mock('@/app/_components/TrackedLink', () => ({
  TrackedLink: ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a>,
}));

const CARD_TITLES = [
  'Informes y análisis',
  'Diagnóstico y rendimiento',
  'Datos abiertos y desarrolladores',
];

const CARD_DESCRIPTIONS = [
  'Consulta la evolución de la red mes a mes, resúmenes por barrios y comparativas de uso.',
  'Detecta qué zonas sufren más desequilibrio y cómo cambia la disponibilidad con el tiempo.',
  'Descarga datos en CSV, accede a la API pública o conecta tu asistente de IA.',
];

const LINK_LABELS = [
  'Informes mensuales',
  'Por barrios',
  'Comparar',
  'Estado de la red',
  'Redistribución',
  'Estado de los datos',
  'API y datos abiertos',
  'Conector MCP',
  'Metodología',
];

const SITE_DESTINATIONS = [
  '/informes',
  '/estadisticas/barrios',
  '/comparar',
  '/dashboard',
  '/estadisticas/redistribucion',
  '/estado',
  '/developers',
  '/mcp',
  '/metodologia',
];

describe('home explore section', () => {
  it('renders three exploration cards covering every site destination', () => {
    const html = renderToStaticMarkup(<HomeExploreSection />);

    expect(html).toContain('Explora la red a tu manera');

    for (const title of CARD_TITLES) {
      expect(html).toContain(title);
    }

    for (const description of CARD_DESCRIPTIONS) {
      expect(html).toContain(description);
    }

    for (const label of LINK_LABELS) {
      expect(html).toContain(label);
    }

    for (const destination of SITE_DESTINATIONS) {
      expect(html).toContain(`href="${destination}"`);
    }

    expect(html.match(/<a href="/g)).toHaveLength(SITE_DESTINATIONS.length);
  });
});
